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

        // Result tracking
        const syncedPortfolios: Array<{
            portfolio_id: string;
            portfolio_name: string;
            snapshot_id: string;
            nav: number;
        }> = [];

        const failedPortfolios: Array<{
            portfolio_id: string;
            portfolio_name: string;
            error: string;
        }> = [];

        const skippedPortfolios: Array<{
            portfolio_id: string;
            portfolio_name: string;
            reason: string;
        }> = [];

        const priceCache: Record<string, number> = {};
        let totalTickers = 0;
        let successfulFetches = 0;
        let failedFetches = 0;

        // Process each portfolio individually with error isolation
        for (const portfolio of portfolios) {
            try {
                const transactions = await supabaseService.getTransactionsByPortfolio(portfolio.portfolio_id);

                if (transactions.length === 0) {
                    skippedPortfolios.push({
                        portfolio_id: portfolio.portfolio_id,
                        portfolio_name: portfolio.name,
                        reason: 'No transactions found'
                    });
                    continue;
                }

                // Calculate Holdings
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

                // Filter active holdings
                const activeTickers = Object.entries(holdings)
                    .filter(([_, qty]) => qty > 0.000001)
                    .map(([t]) => t);

                if (!hasTickers) {
                    skippedPortfolios.push({
                        portfolio_id: portfolio.portfolio_id,
                        portfolio_name: portfolio.name,
                        reason: 'No stock tickers in portfolio'
                    });
                    continue;
                }

                console.log(`📊 Processing Portfolio: ${portfolio.name} (${portfolio.portfolio_id})`);
                console.log(`   Active tickers: ${activeTickers.join(', ')}`);

                // Calculate portfolio value
                let portfolioValue = 0;

                // Calculate cash balance
                let cashBalance = 0;
                transactions.forEach(t => {
                    // Transaction amounts are already signed correctly:
                    // - DEPOSIT: positive (money in)
                    // - WITHDRAW: negative (money out)
                    // - BUY: negative (money out to buy stocks)
                    // - SELL: positive (money in from selling stocks)
                    // - DIVIDEND/INTEREST: positive (money in)
                    cashBalance += t.amount;
                });

                // Fetch prices and calculate NAV
                for (const ticker of activeTickers) {
                    totalTickers++;
                    let price = priceCache[ticker];

                    if (price === undefined) {
                        console.log(`   Fetching price for ${ticker}...`);
                        const latest = await fetchStockPrice(ticker);

                        // Small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 100));

                        if (latest !== null) {
                            priceCache[ticker] = latest;
                            price = latest;
                            successfulFetches++;
                            console.log(`   ✅ ${ticker}: ${price.toLocaleString()} VND`);
                        } else {
                            failedFetches++;
                            console.warn(`   ⚠️  Could not fetch price for ${ticker}, using 0`);
                            price = 0;
                        }
                    } else {
                        console.log(`   💾 Using cached price for ${ticker}: ${price.toLocaleString()} VND`);
                    }

                    const qty = holdings[ticker];
                    portfolioValue += (qty * price);
                }

                const totalNav = Math.max(0, portfolioValue + cashBalance);

                // Debug logging
                console.log(`📈 Portfolio Value Calculation for ${portfolio.name}:`);
                console.log(`   Stock Value: ${portfolioValue.toLocaleString()} VND`);
                console.log(`   Cash Balance: ${cashBalance.toLocaleString()} VND`);
                console.log(`   Total NAV: ${totalNav.toLocaleString()} VND`);

                // Create Snapshot
                const snapshot = await supabaseService.createSnapshot({
                    portfolio_id: portfolio.portfolio_id,
                    date: new Date().toISOString(),
                    nav: totalNav
                });

                console.log(`✅ Created Snapshot for ${portfolio.name}: ${totalNav.toLocaleString()} VND`);

                syncedPortfolios.push({
                    portfolio_id: portfolio.portfolio_id,
                    portfolio_name: portfolio.name,
                    snapshot_id: snapshot.snapshot_id,
                    nav: totalNav
                });

            } catch (error) {
                // Individual portfolio error - log and continue
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`❌ Failed to sync portfolio ${portfolio.name}:`, errorMessage);

                failedPortfolios.push({
                    portfolio_id: portfolio.portfolio_id,
                    portfolio_name: portfolio.name,
                    error: errorMessage
                });
            }
        }

        // Prepare response
        const response = {
            success: true,
            data: {
                total_portfolios: portfolios.length,
                synced: syncedPortfolios,
                failed: failedPortfolios,
                skipped: skippedPortfolios,
                price_stats: {
                    total_tickers: totalTickers,
                    successful_fetches: successfulFetches,
                    failed_fetches: failedFetches,
                    cached: totalTickers - successfulFetches - failedFetches
                }
            }
        };

        console.log(`\n📊 Sync Summary:`);
        console.log(`   Total Portfolios: ${portfolios.length}`);
        console.log(`   ✅ Synced: ${syncedPortfolios.length}`);
        console.log(`   ❌ Failed: ${failedPortfolios.length}`);
        console.log(`   ⏭️  Skipped: ${skippedPortfolios.length}`);
        console.log(`   💹 Price Fetches: ${successfulFetches}/${totalTickers} successful\n`);

        return res.json(response);

    } catch (error) {
        console.error('❌ Backend Sync Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
});

export default router;
