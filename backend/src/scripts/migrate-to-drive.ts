import * as fs from 'fs';
import * as path from 'path';
import { googleDriveService } from '../services/google-drive-service';
import { googleDriveConfig } from '../config/google-drive';
import { config } from 'dotenv';

// Load environment variables
config();

const DATA_DIR = path.resolve(__dirname, '../../data');

const CSV_FILES = [
    'asset.csv',
    'platforms.csv',
    'strategies.csv',
    'portfolios.csv',
    'cash_accounts.csv',
    'transactions.csv',
    'snapshots.csv',
    'stock_prices.csv',
    'tracking_lists.csv',
    'tracking_stocks.csv',
];

interface MigrationResult {
    fileName: string;
    success: boolean;
    fileId?: string;
    error?: string;
    size?: number;
}

async function migrateToGoogleDrive(): Promise<void> {
    console.log('🚀 Starting migration to Google Drive...\n');

    // Validate configuration
    if (!googleDriveConfig.enabled) {
        console.error('❌ Google Drive is not enabled. Set GOOGLE_DRIVE_ENABLED=true in .env');
        process.exit(1);
    }

    if (!googleDriveConfig.folderId) {
        console.error('❌ Google Drive folder ID is not set. Set GOOGLE_DRIVE_FOLDER_ID in .env');
        process.exit(1);
    }

    console.log('📋 Configuration:');
    console.log(`   - Folder ID: ${googleDriveConfig.folderId}`);
    console.log(`   - Service Account Key: ${googleDriveConfig.serviceAccountKeyPath}`);
    console.log(`   - Data Directory: ${DATA_DIR}\n`);

    // Check if service account key exists
    if (!fs.existsSync(googleDriveConfig.serviceAccountKeyPath)) {
        console.error(`❌ Service account key file not found: ${googleDriveConfig.serviceAccountKeyPath}`);
        process.exit(1);
    }

    // Test connection
    console.log('🔌 Testing Google Drive connection...');
    const connectionStatus = await googleDriveService.checkConnection();
    if (!connectionStatus.connected) {
        console.error(`❌ Failed to connect to Google Drive: ${connectionStatus.error}`);
        process.exit(1);
    }
    console.log('✅ Connected to Google Drive successfully\n');

    // Check which files exist locally
    console.log('📁 Checking local CSV files...');
    const existingFiles: string[] = [];
    const missingFiles: string[] = [];

    for (const fileName of CSV_FILES) {
        const filePath = path.join(DATA_DIR, fileName);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            existingFiles.push(fileName);
            console.log(`   ✓ ${fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
        } else {
            missingFiles.push(fileName);
            console.log(`   ⚠ ${fileName} - NOT FOUND`);
        }
    }

    console.log(`\n📊 Found ${existingFiles.length} of ${CSV_FILES.length} files locally\n`);

    if (existingFiles.length === 0) {
        console.error('❌ No CSV files found to migrate');
        process.exit(1);
    }

    // Ask for confirmation
    console.log('⚠️  This will upload the following files to Google Drive:');
    existingFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');

    // Check if files already exist on Drive
    console.log('🔍 Checking existing files on Google Drive...');
    const driveFiles = await googleDriveService.listFiles();
    const existingOnDrive = driveFiles.map(f => f.name);
    
    if (existingOnDrive.length > 0) {
        console.log('⚠️  The following files already exist on Google Drive and will be UPDATED:');
        existingFiles.forEach(file => {
            if (existingOnDrive.includes(file)) {
                console.log(`   - ${file}`);
            }
        });
        console.log('');
    }

    // Proceed with migration
    console.log('📤 Starting file upload...\n');
    const results: MigrationResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const fileName of existingFiles) {
        try {
            const filePath = path.join(DATA_DIR, fileName);
            const fileContent = fs.readFileSync(filePath);
            const fileSize = fileContent.length;

            console.log(`   ⬆️  Uploading ${fileName}...`);

            let fileId: string;
            if (await googleDriveService.fileExists(fileName)) {
                // Update existing file
                fileId = await googleDriveService.updateFile(fileName, fileContent);
                console.log(`   ✅ Updated ${fileName} (${(fileSize / 1024).toFixed(2)} KB)`);
            } else {
                // Upload new file
                fileId = await googleDriveService.uploadFile(fileName, fileContent);
                console.log(`   ✅ Uploaded ${fileName} (${(fileSize / 1024).toFixed(2)} KB)`);
            }

            results.push({
                fileName,
                success: true,
                fileId,
                size: fileSize,
            });
            successCount++;
        } catch (error: any) {
            console.error(`   ❌ Failed to upload ${fileName}: ${error.message}`);
            results.push({
                fileName,
                success: false,
                error: error.message,
            });
            errorCount++;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount} files`);
    console.log(`❌ Failed: ${errorCount} files`);
    console.log(`⚠️  Skipped: ${missingFiles.length} files (not found locally)`);
    console.log('='.repeat(60));

    if (successCount > 0) {
        console.log('\n✅ Successfully migrated files:');
        results
            .filter(r => r.success)
            .forEach(r => {
                console.log(`   - ${r.fileName} (ID: ${r.fileId})`);
            });
    }

    if (errorCount > 0) {
        console.log('\n❌ Failed to migrate files:');
        results
            .filter(r => !r.success)
            .forEach(r => {
                console.log(`   - ${r.fileName}: ${r.error}`);
            });
    }

    if (missingFiles.length > 0) {
        console.log('\n⚠️  Skipped files (not found locally):');
        missingFiles.forEach(file => console.log(`   - ${file}`));
    }

    // Verification
    if (successCount > 0) {
        console.log('\n🔍 Verifying uploaded files...');
        const verifyCount = await verifyMigration(results.filter(r => r.success).map(r => r.fileName));
        console.log(`✅ Verified ${verifyCount} of ${successCount} files on Google Drive`);
    }

    console.log('\n✨ Migration completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Set GOOGLE_DRIVE_ENABLED=true in your .env file');
    console.log('   2. Restart your backend server');
    console.log('   3. Test your application to ensure data is read from Google Drive');
    console.log('   4. (Optional) Backup local CSV files and remove them\n');

    process.exit(errorCount > 0 ? 1 : 0);
}

async function verifyMigration(uploadedFiles: string[]): Promise<number> {
    let verifiedCount = 0;

    for (const fileName of uploadedFiles) {
        try {
            const exists = await googleDriveService.fileExists(fileName);
            if (exists) {
                verifiedCount++;
            } else {
                console.warn(`   ⚠️  File not found on Drive: ${fileName}`);
            }
        } catch (error) {
            console.warn(`   ⚠️  Failed to verify ${fileName}`);
        }
    }

    return verifiedCount;
}

// Run migration
migrateToGoogleDrive().catch(error => {
    console.error('\n💥 Migration failed with error:');
    console.error(error);
    process.exit(1);
});
