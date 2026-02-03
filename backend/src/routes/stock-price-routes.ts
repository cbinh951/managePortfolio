import { Router, Request, Response } from 'express';

const router = Router();

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
        const url = `https://www.cophieu68.vn/quote/summary.php?id=${symbol.toUpperCase()}`;
        console.log(`Backend fetching: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: `Failed to fetch from source: ${response.statusText}`
            });
        }

        const html = await response.text();

        // Parse HTML for stock price
        const regex = /<div id="stockname_close"[^>]*>([\d.,]+)<\/div>/;
        const match = html.match(regex);

        let price = null;
        if (match && match[1]) {
            let rawVal = parseFloat(match[1].replace(/,/g, ""));

            // Convert to absolute VND (k VND -> VND)
            if (rawVal < 1000) {
                rawVal = rawVal * 1000;
            }
            price = rawVal;
        }

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

export default router;
