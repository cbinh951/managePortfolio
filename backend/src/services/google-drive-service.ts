import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import { googleDriveConfig } from '../config/google-drive';

interface FileCache {
  content: Buffer;
  timestamp: number;
  fileId: string;
}

class GoogleDriveService {
  private drive: any;
  private auth: GoogleAuth | null = null;
  private fileCache: Map<string, FileCache> = new Map();
  private fileIdMap: Map<string, string> = new Map(); // fileName -> fileId mapping
  private initialized: boolean = false;

  constructor() {
    if (googleDriveConfig.enabled) {
      this.initializeAuth();
    }
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Check if credentials are provided via environment variable (for Render/cloud deployments)
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        console.log('📝 Using Google service account from environment variable');
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        
        this.auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
      } else {
        // Use key file (for local development)
        const keyFilePath = path.resolve(googleDriveConfig.serviceAccountKeyPath);
        
        if (!fs.existsSync(keyFilePath)) {
          throw new Error(`Service account key file not found at: ${keyFilePath}. Set GOOGLE_SERVICE_ACCOUNT_JSON environment variable for cloud deployments.`);
        }

        console.log('📝 Using Google service account from file');
        this.auth = new google.auth.GoogleAuth({
          keyFile: keyFilePath,
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
      }

      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
      // Build file ID mapping at startup
      await this.buildFileIdMap();
      
      this.initialized = true;
      console.log('✅ Google Drive service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive service:', error);
      throw error;
    }
  }

  private async buildFileIdMap(): Promise<void> {
    try {
      const response = await this.drive.files.list({
        q: `'${googleDriveConfig.folderId}' in parents and trashed=false`,
        fields: 'files(id, name)',
        pageSize: 100,
      });

      const files = response.data.files || [];
      files.forEach((file: any) => {
        this.fileIdMap.set(file.name, file.id);
      });

      console.log(`📁 Found ${files.length} files in Google Drive folder`);
    } catch (error) {
      console.error('Failed to build file ID map:', error);
      throw error;
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this.initialized && googleDriveConfig.enabled) {
      await this.initializeAuth();
    }
  }

  private getCachedFile(fileName: string): Buffer | null {
    if (!googleDriveConfig.cacheEnabled) {
      return null;
    }

    const cached = this.fileCache.get(fileName);
    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;
    if (age > googleDriveConfig.cacheTTL) {
      this.fileCache.delete(fileName);
      return null;
    }

    return cached.content;
  }

  private setCachedFile(fileName: string, content: Buffer, fileId: string): void {
    if (googleDriveConfig.cacheEnabled) {
      this.fileCache.set(fileName, {
        content,
        timestamp: Date.now(),
        fileId,
      });
    }
  }

  private invalidateCache(fileName: string): void {
    this.fileCache.delete(fileName);
  }

  async downloadFile(fileName: string): Promise<Buffer> {
    await this.ensureInitialized();

    // Check cache first
    const cached = this.getCachedFile(fileName);
    if (cached) {
      return cached;
    }

    return this.retryOperation(async () => {
      const fileId = this.fileIdMap.get(fileName);
      
      if (!fileId) {
        throw new Error(`File not found in Google Drive: ${fileName}`);
      }

      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );

      const buffer = Buffer.from(response.data);
      this.setCachedFile(fileName, buffer, fileId);
      
      return buffer;
    });
  }

  async uploadFile(fileName: string, content: Buffer | string): Promise<string> {
    await this.ensureInitialized();

    return this.retryOperation(async () => {
      const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
      
      const fileMetadata = {
        name: fileName,
        parents: [googleDriveConfig.folderId],
      };

      const media = {
        mimeType: 'text/csv',
        body: buffer,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name',
      });

      const fileId = response.data.id;
      this.fileIdMap.set(fileName, fileId);
      this.setCachedFile(fileName, buffer, fileId);

      console.log(`✅ Uploaded ${fileName} to Google Drive (ID: ${fileId})`);
      return fileId;
    });
  }

  async updateFile(fileName: string, content: Buffer | string): Promise<string> {
    await this.ensureInitialized();

    return this.retryOperation(async () => {
      const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
      const fileId = this.fileIdMap.get(fileName);

      if (!fileId) {
        // File doesn't exist, create it instead
        console.log(`File ${fileName} not found, creating new file`);
        return await this.uploadFile(fileName, content);
      }

      const media = {
        mimeType: 'text/csv',
        body: buffer,
      };

      const response = await this.drive.files.update({
        fileId: fileId,
        media: media,
        fields: 'id, name, modifiedTime',
      });

      this.invalidateCache(fileName);
      this.setCachedFile(fileName, buffer, fileId);

      console.log(`✅ Updated ${fileName} on Google Drive`);
      return response.data.id;
    });
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.ensureInitialized();

    return this.retryOperation(async () => {
      const fileId = this.fileIdMap.get(fileName);

      if (!fileId) {
        console.warn(`File not found for deletion: ${fileName}`);
        return;
      }

      await this.drive.files.delete({ fileId });
      
      this.fileIdMap.delete(fileName);
      this.invalidateCache(fileName);

      console.log(`✅ Deleted ${fileName} from Google Drive`);
    });
  }

  async listFiles(): Promise<Array<{ id: string; name: string; size?: number; modifiedTime?: string }>> {
    await this.ensureInitialized();

    return this.retryOperation(async () => {
      const response = await this.drive.files.list({
        q: `'${googleDriveConfig.folderId}' in parents and trashed=false`,
        fields: 'files(id, name, size, modifiedTime)',
        orderBy: 'name',
        pageSize: 100,
      });

      return response.data.files || [];
    });
  }

  async fileExists(fileName: string): Promise<boolean> {
    await this.ensureInitialized();
    
    // Check local map first
    if (this.fileIdMap.has(fileName)) {
      return true;
    }

    // Refresh map and check again
    await this.buildFileIdMap();
    return this.fileIdMap.has(fileName);
  }

  async getFileMetadata(fileName: string): Promise<any> {
    await this.ensureInitialized();

    const fileId = this.fileIdMap.get(fileName);
    if (!fileId) {
      throw new Error(`File not found: ${fileName}`);
    }

    return this.retryOperation(async () => {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, size, createdTime, modifiedTime, mimeType',
      });

      return response.data;
    });
  }

  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      await this.ensureInitialized();
      
      // Try to list files as a connection test
      await this.drive.files.list({
        q: `'${googleDriveConfig.folderId}' in parents and trashed=false`,
        fields: 'files(id)',
        pageSize: 1,
      });

      return { connected: true };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= googleDriveConfig.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.code === 404 || error.code === 403) {
          throw error;
        }

        if (attempt < googleDriveConfig.retryAttempts) {
          const delay = googleDriveConfig.retryDelay * attempt; // exponential backoff
          console.warn(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  clearCache(): void {
    this.fileCache.clear();
    console.log('🗑️ Google Drive cache cleared');
  }

  getStats(): { cacheSize: number; filesTracked: number } {
    return {
      cacheSize: this.fileCache.size,
      filesTracked: this.fileIdMap.size,
    };
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
