import { Router, Request, Response } from 'express';
import { CsvService } from '../services/csv-service';
import { ExcelService } from '../services/excel-service';
import { TrackingCalculationService } from '../services/tracking-calculation-service';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';

// Extend Express Request type to include multer file
declare module 'express-serve-static-core' {
    interface Request {
        file?: Express.Multer.File;
    }
}

const router = Router();
const csvService = new CsvService();
const excelService = new ExcelService();
const calculationService = new TrackingCalculationService();

// Configure multer for Excel uploads
const uploadExcel = multer({
    storage: multer.memoryStorage(), // Store in memory for processing
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.oasis.opendocument.spreadsheet'
        ];
        if (allowedTypes.includes(file.mimetype) || 
            file.originalname.endsWith('.xlsx') || 
            file.originalname.endsWith('.xls')) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
        }
    }
});

/**
 * GET /api/tracking
 * Get all tracking lists
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const lists = csvService.getAllTrackingLists();
        
        // Add stock count to each list
        const listsWithCount = await Promise.all(
            lists.map(async (list) => {
                const stocks = csvService.getTrackingStocksByList(list.list_id);
                const summary = await calculationService.calculateListSummary(list.list_id);
                
                return {
                    ...list,
                    stock_count: stocks.length,
                    buy_zone_count: summary.buy_zone_count,
                    attractive_count: summary.attractive_count,
                };
            })
        );

        return res.json({ success: true, data: listsWithCount });
    } catch (error) {
        console.error('Error fetching tracking lists:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
});

/**
 * POST /api/tracking
 * Create new tracking list
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Name is required' });
        }

        const newList = csvService.createTrackingList({ name });
        return res.json({ success: true, data: newList });
    } catch (error) {
        console.error('Error creating tracking list:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
});

/**
 * GET /api/tracking/:id
 * Get single tracking list with stocks
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const list = csvService.getTrackingListById(id);

        if (!list) {
            return res.status(404).json({ success: false, error: 'Tracking list not found' });
        }

        const enrichedStocks = await calculationService.getEnrichedTrackingStocksByList(id);
        const summary = await calculationService.calculateListSummary(id);

        return res.json({
            success: true,
            data: {
                ...list,
                stocks: enrichedStocks,
                summary
            }
        });
    } catch (error) {
        console.error('Error fetching tracking list:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
});

/**
 * PUT /api/tracking/:id
 * Update tracking list
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const updated = csvService.updateTrackingList(id, { name });

        if (!updated) {
            return res.status(404).json({ success: false, error: 'Tracking list not found' });
        }

        return res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error updating tracking list:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
});

/**
 * DELETE /api/tracking/:id
 * Delete tracking list
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = csvService.deleteTrackingList(id);

        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Tracking list not found' });
        }

        // Delete associated image files (DISABLED - image upload feature removed)
        /*
        try {
            const files = fs.readdirSync(TRACKING_IMAGES_DIR);
            const listImages = files.filter(f => f.startsWith(`${id}_`));
            listImages.forEach(file => {
                fs.unlinkSync(path.join(TRACKING_IMAGES_DIR, file));
            });
        } catch (err) {
            console.warn('Could not delete tracking images:', err);
        }
        */

        return res.json({ success: true, message: 'Tracking list deleted' });
    } catch (error) {
        console.error('Error deleting tracking list:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
});

/**
 * POST /api/tracking/:id/upload-image
 * Upload image and extract stock data via OCR
 * DISABLED: Upload Excel is preferred for better accuracy
 */
/*
router.post('/:id/upload-image', upload.single('image'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const list = csvService.getTrackingListById(id);

        if (!list) {
            return res.status(404).json({ success: false, error: 'Tracking list not found' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image file uploaded' });
        }

        const imageUrl = `/tracking_images/${req.file.filename}`;

        // Update list with image URL
        csvService.updateTrackingList(id, { image_url: imageUrl });

        // Read image as base64
        const imageBuffer = fs.readFileSync(req.file.path);
        const imageBase64 = imageBuffer.toString('base64');

        console.log('Starting OCR extraction...');

        // Extract text via OCR
        const ocrResult = await ocrService.extractTableFromImage(imageBase64);
        const { text: ocrText, confidence } = ocrResult;
        
        console.log('OCR Text extracted:', ocrText.substring(0, 200) + '...');
        console.log('Confidence:', confidence);

        // Check if confidence is too low
        if (confidence < 40) {
            return res.status(400).json({
                success: false,
                error: 'OCR confidence too low. Please upload a clearer image.',
                confidence: confidence,
                ocr_text_preview: ocrText.substring(0, 500)
            });
        }

        // Parse Vietnamese table
        const parsedStocks = ocrService.parseVietnameseStockTable(ocrText, id);

        console.log(`Parsed ${parsedStocks.length} stocks from OCR`);

        // If no stocks parsed but confidence is acceptable, return helpful message
        if (parsedStocks.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Could not extract stock data from image. Please check the image format or enter stocks manually.',
                confidence: confidence,
                ocr_text_preview: ocrText.substring(0, 500),
                suggestions: [
                    'Ensure the image shows a clear table with ticker symbols',
                    'Crop the image to only show the stock table',
                    'Use higher resolution or better lighting',
                    'Try entering stocks manually instead'
                ]
            });
        }

        // Save stocks to database
        const createdStocks = csvService.createTrackingStocksBatch(parsedStocks);

        return res.json({
            success: true,
            data: {
                image_url: imageUrl,
                stocks_created: createdStocks.length,
                stocks: createdStocks,
                confidence: confidence,
                ocr_text_preview: ocrText.substring(0, 500)
            }
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
});
*/

/**
 * POST /api/tracking/:id/upload-excel
 * Upload Excel file and extract stock data
 */
router.post('/:id/upload-excel', uploadExcel.single('file'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const list = csvService.getTrackingListById(id);

        if (!list) {
            return res.status(404).json({ success: false, error: 'Tracking list not found' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No Excel file uploaded' });
        }

        console.log('Starting Excel parsing...');
        console.log('File:', req.file.originalname);
        console.log('Size:', req.file.size, 'bytes');

        // Validate Excel structure first
        const validation = excelService.validateExcelStructure(req.file.buffer);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.message,
                suggestions: [
                    'Ensure Excel file has at least 7 columns',
                    'First row should be headers',
                    'Columns should be: STT, Mã CK, Tên công ty, Ngày chốt lời, Tích sản tiếp, Giá ngừng TS, Giá bảo vệ'
                ]
            });
        }

        // Parse Excel file
        const parsedStocks = excelService.parseTrackingStocksFromExcel(req.file.buffer, id);

        console.log(`Parsed ${parsedStocks.length} stocks from Excel`);

        if (parsedStocks.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Could not extract stock data from Excel file. Please check the file format.',
                suggestions: [
                    'Ensure data starts from row 2 (after headers)',
                    'Ticker symbols should be in column B',
                    'Prices should be in columns F and G',
                    'Check that cells are not merged'
                ]
            });
        }

        // Save stocks to database
        const createdStocks = csvService.createTrackingStocksBatch(parsedStocks);

        return res.json({
            success: true,
            data: {
                stocks_created: createdStocks.length,
                stocks: createdStocks
            }
        });

    } catch (error) {
        console.error('Error uploading Excel:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process Excel file'
        });
    }
});

/**
 * POST /api/tracking/:id/stocks
 * Manually add stocks to tracking list
 */
router.post('/:id/stocks', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { stocks } = req.body;

        if (!Array.isArray(stocks) || stocks.length === 0) {
            return res.status(400).json({ success: false, error: 'Stocks array is required' });
        }

        const list = csvService.getTrackingListById(id);
        if (!list) {
            return res.status(404).json({ success: false, error: 'Tracking list not found' });
        }

        const stocksToCreate = stocks.map((stock, index) => ({
            list_id: id,
            ticker: stock.ticker.toUpperCase(),
            company_name: stock.company_name,
            meeting_date: stock.meeting_date,
            stop_buy_price: Number(stock.stop_buy_price),
            sell_target_price: Number(stock.sell_target_price),
            target_profit_percent: stock.target_profit_percent ? Number(stock.target_profit_percent) : undefined,
            notes: stock.notes,
            row_order: index,
        }));

        const createdStocks = csvService.createTrackingStocksBatch(stocksToCreate);

        return res.json({ success: true, data: createdStocks });
    } catch (error) {
        console.error('Error creating stocks:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
});

/**
 * PUT /api/tracking/stocks/:stock_id
 * Update tracking stock
 */
router.put('/stocks/:stock_id', async (req: Request, res: Response) => {
    try {
        const { stock_id } = req.params;
        const updates = req.body;

        const updated = csvService.updateTrackingStock(stock_id, updates);

        if (!updated) {
            return res.status(404).json({ success: false, error: 'Stock not found' });
        }

        // Return enriched stock with current price
        const enriched = await calculationService.getEnrichedTrackingStock(stock_id);

        return res.json({ success: true, data: enriched });
    } catch (error) {
        console.error('Error updating stock:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
});

/**
 * DELETE /api/tracking/stocks/:stock_id
 * Delete tracking stock
 */
router.delete('/stocks/:stock_id', async (req: Request, res: Response) => {
    try {
        const { stock_id } = req.params;
        const deleted = csvService.deleteTrackingStock(stock_id);

        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Stock not found' });
        }

        return res.json({ success: true, message: 'Stock deleted' });
    } catch (error) {
        console.error('Error deleting stock:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
});

/**
 * POST /api/tracking/:id/sync-prices
 * Sync current prices for all stocks in tracking list
 */
router.post('/:id/sync-prices', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Get tracking list
        const list = csvService.getTrackingListById(id);
        if (!list) {
            return res.status(404).json({ success: false, error: 'Tracking list not found' });
        }

        // Get all stocks in the list
        const stocks = csvService.getTrackingStocksByList(id);
        if (stocks.length === 0) {
            return res.status(400).json({ success: false, error: 'No stocks in tracking list' });
        }

        console.log(`🔄 Syncing prices for ${stocks.length} stocks in list: ${list.name}`);

        // Fetch prices for all unique tickers
        const tickers = [...new Set(stocks.map(s => s.ticker))];
        const priceResults: Array<{ ticker: string; price: number | null; success: boolean }> = [];
        const priceCache: Record<string, number> = {};

        for (const ticker of tickers) {
            try {
                const price = await fetchStockPriceWithRetry(ticker);
                if (price !== null) {
                    priceCache[ticker] = price;
                    priceResults.push({ ticker, price, success: true });
                    console.log(`✅ ${ticker}: ${price.toLocaleString()} ₫`);
                } else {
                    priceResults.push({ ticker, price: null, success: false });
                    console.log(`⚠️  ${ticker}: Could not fetch price (stock may be suspended or delisted)`);
                }
                
                // Rate limiting: 100ms delay between requests
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                priceResults.push({ ticker, price: null, success: false });
                console.log(`⚠️  ${ticker}: Price fetch failed`);
            }
        }

        // Save prices to cache CSV
        const stockPrices = Object.entries(priceCache).map(([ticker, price]) => ({
            ticker,
            price,
            last_updated: new Date().toISOString()
        }));

        if (stockPrices.length > 0) {
            csvService.updateStockPrices(stockPrices);
            console.log(`💾 Saved ${stockPrices.length} prices to cache`);
        }

        const successCount = priceResults.filter(r => r.success).length;
        const failCount = priceResults.filter(r => !r.success).length;

        console.log(`✨ Sync complete: ${successCount} succeeded, ${failCount} failed`);

        return res.json({
            success: true,
            data: {
                total_stocks: tickers.length,
                successful: successCount,
                failed: failCount,
                prices: priceResults
            },
            message: failCount > 0 
                ? `Synced ${successCount}/${tickers.length} prices (${failCount} unavailable)`
                : `Successfully synced all ${successCount} prices`
        });

    } catch (error) {
        console.error('Error syncing prices:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
});

// Helper function to fetch stock price with retry logic
async function fetchStockPriceWithRetry(symbol: string, retries = 3): Promise<number | null> {
    const TIMEOUT_MS = 5000; // 5 seconds
    const RETRY_DELAY_MS = 1000; // 1 second

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const url = `https://www.cophieu68.vn/quote/summary.php?id=${symbol.toUpperCase()}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    if (attempt < retries) {
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                        continue;
                    }
                    return null;
                }

                const html = await response.text();
                const regex = /<div id="stockname_close"[^>]*>([\d.,]+)<\/div>/;
                const match = html.match(regex);

                if (match && match[1]) {
                    let rawVal = parseFloat(match[1].replace(/,/g, ""));
                    // Convert to absolute VND if needed (assuming < 1000 means k)
                    if (rawVal < 1000) {
                        rawVal = rawVal * 1000;
                    }
                    return rawVal;
                }
                
                return null;
            } catch (fetchError: any) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    console.warn(`Timeout fetching ${symbol}, attempt ${attempt}/${retries}`);
                } else {
                    console.warn(`Error fetching ${symbol}, attempt ${attempt}/${retries}:`, fetchError.message);
                }
                
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    continue;
                }
                return null;
            }
        } catch (error) {
            console.error(`Error in attempt ${attempt} for ${symbol}:`, error);
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                continue;
            }
            return null;
        }
    }
    
    return null;
}

export default router;
