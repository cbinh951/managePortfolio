import { config } from 'dotenv';
config();

export interface GoogleDriveConfig {
  enabled: boolean;
  folderId: string;
  serviceAccountKeyPath: string;
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

export const googleDriveConfig: GoogleDriveConfig = {
  enabled: process.env.GOOGLE_DRIVE_ENABLED === 'true',
  folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
  serviceAccountKeyPath: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './credentials/google-service-account.json',
  cacheEnabled: process.env.GOOGLE_DRIVE_CACHE_ENABLED !== 'false', // default true
  cacheTTL: parseInt(process.env.GOOGLE_DRIVE_CACHE_TTL || '300000'), // 5 minutes default
  retryAttempts: parseInt(process.env.GOOGLE_DRIVE_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.GOOGLE_DRIVE_RETRY_DELAY || '1000'),
};

export function validateGoogleDriveConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (googleDriveConfig.enabled) {
    if (!googleDriveConfig.folderId) {
      errors.push('GOOGLE_DRIVE_FOLDER_ID is required when Google Drive is enabled');
    }
    if (!googleDriveConfig.serviceAccountKeyPath) {
      errors.push('GOOGLE_SERVICE_ACCOUNT_KEY_PATH is required when Google Drive is enabled');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function isGoogleDriveEnabled(): boolean {
  return googleDriveConfig.enabled;
}
