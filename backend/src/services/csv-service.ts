import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import lockfile from 'proper-lockfile';

export class CsvService {
    private dataPath: string;

    constructor(dataPath: string = './data') {
        this.dataPath = dataPath;
    }

    /**
     * Read CSV file and return array of objects
     */
    async readCsv<T>(filename: string): Promise<T[]> {
        const filePath = path.join(this.dataPath, filename);

        if (!fs.existsSync(filePath)) {
            return [];
        }

        return new Promise((resolve, reject) => {
            const results: T[] = [];

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data as T))
                .on('end', () => resolve(results))
                .on('error', reject);
        });
    }

    /**
     * Write array of objects to CSV file with file locking
     */
    async writeCsv<T extends Record<string, any>>(
        filename: string,
        data: T[],
        headers: { id: string; title: string }[]
    ): Promise<void> {
        const filePath = path.join(this.dataPath, filename);
        const dirPath = path.dirname(filePath);

        // Ensure directory exists
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Create backup before writing
        await this.createBackup(filename);

        let release: (() => Promise<void>) | null = null;

        try {
            // Acquire file lock
            if (fs.existsSync(filePath)) {
                release = await lockfile.lock(filePath, { retries: 5 });
            }

            const csvWriter = createObjectCsvWriter({
                path: filePath,
                header: headers,
            });

            await csvWriter.writeRecords(data);
        } finally {
            // Release lock
            if (release) {
                await release();
            }
        }
    }

    /**
     * Append single record to CSV file
     */
    async appendCsv<T extends Record<string, any>>(
        filename: string,
        record: T,
        headers: { id: string; title: string }[]
    ): Promise<void> {
        const existing = await this.readCsv<T>(filename);
        existing.push(record);
        await this.writeCsv(filename, existing, headers);
    }

    /**
     * Create backup of a CSV file
     */
    private async createBackup(filename: string): Promise<void> {
        const filePath = path.join(this.dataPath, filename);

        if (!fs.existsSync(filePath)) {
            return;
        }

        const backupDir = path.join(this.dataPath, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Handle nested directories (e.g., master/assets.csv)
        const fileDir = path.dirname(filename);
        const backupSubDir = path.join(backupDir, fileDir);
        if (!fs.existsSync(backupSubDir)) {
            fs.mkdirSync(backupSubDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const baseFilename = path.basename(filename, '.csv');
        const backupPath = path.join(
            backupSubDir,
            `${baseFilename}_${timestamp}.csv`
        );

        fs.copyFileSync(filePath, backupPath);

        // Keep only last 10 backups
        this.cleanupOldBackups(backupSubDir, baseFilename, 10);
    }

    /**
     * Clean up old backup files
     */
    private cleanupOldBackups(backupDir: string, filePrefix: string, keepCount: number): void {
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith(filePrefix))
            .map(f => ({
                name: f,
                time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        // Delete older backups
        files.slice(keepCount).forEach(file => {
            fs.unlinkSync(path.join(backupDir, file.name));
        });
    }

    /**
     * Generate unique ID
     */
    generateId(prefix: string): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `${prefix}${timestamp}${random}`;
    }
}
