import { Router, Request, Response } from 'express';
import { SupabaseService } from '../services/supabase-service';

const router = Router();
const supabaseService = new SupabaseService();

// Helper to fetch price for a single symbol
async function fetchStockPrice(symbol: string): Promise<number | null> {
    try {
        const url = `https://www.cophieu68.vn/quote/summary.php?id=${symbol.toUpperCase()}`;
        console.log(`Backend fetching: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) return null;

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
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
        return null;
    }
}

/**
 * GET /api/stock-price/:symbol
 * Fetch current stock price from Cophieu68
 */
router.get('/:symbol', async (req: Request, res: Response) => {
    const { symbol } = req.params;

    if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
    }

    try {
        const price = await fetchStockPrice(symbol);
        return res.json({
            symbol: symbol.toUpperCase(),
            price,
            found: !!price
        });

    } catch (error) {
        console.error('Backend Stock Price Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * POST /api/stock-price/sync
 * Sync all stock prices and create snapshots
 */
router.post('/sync', async (req: Request, res: Response) => {
    try {
        console.log('🔄 Starting stock price sync...');
        const portfolios = await supabaseService.getAllPortfolios();
        const updatedPortfolios: string[] = [];
        const priceCache: Record<string, number> = {};

        // 1. Iterate all portfolios to find those with stock stickers
        for (const portfolio of portfolios) {
            const transactions = await supabaseService.getTransactionsByPortfolio(portfolio.portfolio_id);
            if (transactions.length === 0) continue;

            // Calculate Holdings
            // (Simulate simplified holdings calculation to identify Active Tickers)
            const holdings: Record<string, number> = {};
            let hasTickers = false;

            transactions.forEach(t => {
                if (t.ticker) {
                    hasTickers = true;
                    const ticker = t.ticker.toUpperCase();
                    const qty = Number(t.quantity || 0);
                    if (t.type === 'BUY' || t.type === 'DEPOSIT') {
                        holdings[ticker] = (holdings[ticker] || 0) + qty;
                    } else if (t.type === 'SELL' || t.type === 'WITHDRAW') {
                        holdings[ticker] = (holdings[ticker] || 0) - qty;
                    }
                }
            });

            // If no active holdings or no tickers history, skip
            const activeTickers = Object.entries(holdings).filter(([_, qty]) => qty > 0.000001).map(([t]) => t);

            // Also check if we should fetch prices even if qty is 0? No, checking active holds mostly.
            // But user might want to see history. Snapshot focuses on CURRENT value. 
            // So if holdings are 0, NAV from stocks is 0.

            if (Object.keys(holdings).length === 0 && !hasTickers) continue;

            console.log(`Processing Portfolio ${portfolio.name} (${portfolio.portfolio_id}) - Found tickers: ${activeTickers.join(', ')}`);

            // 2. Fetch prices for needed tickers
            let portfolioValue = 0;

            // Add Cash Balance if any? 
            // Transactions usually have 'amount'. For STOCK portfolios, typically we track Cash via Buying Power logic or just Net Value.
            // Simplified: Value = Sum(Qty * Price). 
            // Note: If the user tracks Cash in the same portfolio, we should add it.
            // Let's assume standard logic: Value of Stocks + Cash available.
            // Calculating Cash Available:
            let cashBalance = 0;
            transactions.forEach(t => {
                if (t.type === 'DEPOSIT') cashBalance += t.amount; // amount is positive
                if (t.type === 'WITHDRAW') cashBalance -= Math.abs(t.amount); // amount is negative usually, but ensure math
                if (t.type === 'BUY') cashBalance -= Math.abs(t.amount); // outflow
                if (t.type === 'SELL') cashBalance += Math.abs(t.amount); // inflow
                // DIVIDEND?
                if ((t.type as any) === 'DIVIDEND' || (t.type as any) === 'INTEREST') cashBalance += t.amount;
            });

            // 3. Calculate NAV
            for (const ticker of activeTickers) {
                let price = priceCache[ticker];
                if (price === undefined) {
                    const latest = await fetchStockPrice(ticker);
                    if (latest !== null) {
                        priceCache[ticker] = latest;
                        price = latest;
                    } else {
                        // fallback to last known? or 0? 
                        // logic: if we can't find price, we can't update safely? 
                        // For now, assume 0 or keep old? Let's use 0 and warn.
                        console.warn(`Could not fetch price for ${ticker}, using 0`);
                        price = 0;
                    }
                }

                const qty = holdings[ticker];
                portfolioValue += (qty * price);
            }

            const totalNav = Math.max(0, portfolioValue + cashBalance); // Should not be negative usually

            // 4. Create Snapshot
            const snapshot = await supabaseService.createSnapshot({
                portfolio_id: portfolio.portfolio_id,
                date: new Date().toISOString(),
                nav: totalNav
            });

            console.log(`📸 Created Snapshot for ${portfolio.name}: ${totalNav.toLocaleString()} VND`);
            updatedPortfolios.push(portfolio.name);
        }

        return res.json({
            success: true,
            data: {
                message: `Synced ${updatedPortfolios.length} portfolios`,
                updated: updatedPortfolios
            }
        });

    } catch (error) {
        console.error('Backend Sync Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
