import * as XLSX from 'xlsx';
import { TrackingStock } from '../types/models';

export class ExcelService {
    /**
     * Parse Excel file buffer and extract tracking stocks
     * Expected columns:
     * - STT (Row number)
     * - Mã CK (Ticker)
     * - Tên công ty (Company name)
     * - Ngày chốt lời gần nhất (Meeting date - optional)
     * - th sản. tiếp (Continue accumulation date - optional)
     * - Giá tham khảo ngừng TS (Stop buy price)
     * - Giá tham khảo bảo vệ thành quả (Sell target price)
     */
    parseTrackingStocksFromExcel(
        fileBuffer: Buffer,
        listId: string
    ): Omit<TrackingStock, 'stock_id'>[] {
        const stocks: Omit<TrackingStock, 'stock_id'>[] = [];

        try {
            // Parse Excel file
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            
            // Get first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const data = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: null,
                blankrows: false
            }) as any[][];

            if (data.length < 2) {
                console.warn('Excel file has no data rows');
                return stocks;
            }

            console.log(`\n=== Parsing Excel File ===`);
            console.log(`Found ${data.length - 1} data rows`);

            // Skip header row (index 0), process data rows
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                
                // Skip empty rows
                if (!row || row.length === 0 || !row[1]) {
                    continue;
                }

                try {
                    // Extract data from columns (0-indexed)
                    // Column 0: STT (row number) - skip
                    // Column 1: Mã CK (ticker)
                    // Column 2: Tên công ty (company name)
                    // Column 3: Ngày chốt lời (meeting date)
                    // Column 4: Tích sản tiếp (continue accumulation date)
                    // Column 5: Giá tham khảo ngừng TS (stop buy price)
                    // Column 6: Giá tham khảo bảo vệ (sell target price)
                    
                    const ticker = this.cleanString(row[1]);
                    const companyName = this.cleanString(row[2]);
                    const meetingDate = this.parseDate(row[3]);
                    const continueDate = this.parseDate(row[4]);
                    const stopBuyPrice = this.parsePrice(row[5]);
                    const sellTargetPrice = this.parsePrice(row[6]);

                    if (!ticker) {
                        console.warn(`Row ${i + 1}: No ticker found, skipping`);
                        continue;
                    }

                    if (!stopBuyPrice || !sellTargetPrice) {
                        console.warn(`Row ${i + 1}: Missing prices for ${ticker}, skipping`);
                        continue;
                    }

                    console.log(`Row ${i + 1}: ${ticker} - Buy: ${stopBuyPrice}, Sell: ${sellTargetPrice}`);

                    stocks.push({
                        list_id: listId,
                        ticker: ticker.toUpperCase(),
                        company_name: companyName || `Company ${ticker}`,
                        meeting_date: meetingDate,
                        continue_accumulation_date: continueDate,
                        stop_buy_price: stopBuyPrice,
                        sell_target_price: sellTargetPrice,
                        row_order: stocks.length,
                    });
                } catch (error) {
                    console.error(`Error parsing row ${i + 1}:`, error);
                }
            }

            console.log(`Successfully parsed ${stocks.length} stocks from Excel`);
            return stocks;

        } catch (error) {
            console.error('Error parsing Excel file:', error);
            throw new Error('Failed to parse Excel file. Please check the file format.');
        }
    }

    /**
     * Clean string values from Excel
     */
    private cleanString(value: any): string | undefined {
        if (value === null || value === undefined) {
            return undefined;
        }
        
        const str = String(value).trim();
        return str.length > 0 ? str : undefined;
    }

    /**
     * Parse date from Excel cell
     * Handles both Excel date numbers and string dates
     */
    private parseDate(value: any): string | undefined {
        if (!value) {
            return undefined;
        }

        // If it's a number, it might be Excel date serial number
        if (typeof value === 'number') {
            const date = XLSX.SSF.parse_date_code(value);
            if (date) {
                return `${date.d}/${date.m}/${date.y}`;
            }
        }

        // If it's already a string, return it
        if (typeof value === 'string') {
            const cleaned = value.trim();
            return cleaned.length > 0 ? cleaned : undefined;
        }

        return undefined;
    }

    /**
     * Parse price from Excel cell
     * Handles both numbers and strings with Vietnamese formatting (comma as decimal)
     * Vietnamese stock prices are often shown in thousands (e.g., 34,0 = 34,000 VND)
     */
    private parsePrice(value: any): number | undefined {
        if (value === null || value === undefined || value === '') {
            return undefined;
        }

        let parsed: number;

        // If it's already a number
        if (typeof value === 'number') {
            parsed = value;
        }
        // If it's a string, parse it
        else if (typeof value === 'string') {
            // Remove thousands separators and convert comma to period
            const cleaned = value
                .replace(/\./g, '') // Remove thousands separator (period in Vietnamese)
                .replace(/,/g, '.') // Convert decimal separator (comma to period)
                .trim();

            parsed = parseFloat(cleaned);
        } else {
            return undefined;
        }

        // Validate parsed value
        if (isNaN(parsed) || parsed <= 0) {
            return undefined;
        }

        // Vietnamese stock prices are often displayed in thousands
        // If the value is less than 1000, it's likely in thousands (k VND)
        // Examples: 34,0 = 34,000 VND, 71,5 = 71,500 VND
        if (parsed < 1000) {
            return parsed * 1000;
        }

        return parsed;
    }

    /**
     * Validate Excel file structure
     * Returns true if the file appears to have the correct structure
     */
    validateExcelStructure(fileBuffer: Buffer): { valid: boolean; message: string } {
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            
            if (workbook.SheetNames.length === 0) {
                return { valid: false, message: 'Excel file has no sheets' };
            }

            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            if (data.length < 2) {
                return { valid: false, message: 'Excel file has no data rows' };
            }

            // Check if first row has at least 7 columns (header)
            if (!data[0] || data[0].length < 7) {
                return { valid: false, message: 'Excel file missing required columns. Expected at least 7 columns.' };
            }

            return { valid: true, message: 'Excel file structure is valid' };

        } catch (error) {
            return { valid: false, message: 'Failed to read Excel file' };
        }
    }
}

export const excelService = new ExcelService();
