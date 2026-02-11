
export const stockPriceService = {
    // Fetch cached prices from CSV (fast, no external API calls)
    async fetchCachedPrices(tickers: string[]): Promise<{
        prices: Record<string, number>;
        missing: string[];
    }> {
        if (tickers.length === 0) return { prices: {}, missing: [] };

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_BASE_URL}/api/stock-price/cached/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tickers }),
            });

            if (!response.ok) {
                console.error('Failed to fetch cached prices:', response.statusText);
                return { prices: {}, missing: tickers };
            }

            const data = await response.json();
            
            // Convert response format to simple price map
            const priceMap: Record<string, number> = {};
            for (const [ticker, info] of Object.entries(data.prices)) {
                priceMap[ticker] = (info as any).price;
            }

            console.log(`✅ Loaded ${data.cached_count} cached prices, ${data.missing_count} missing`);
            
            return {
                prices: priceMap,
                missing: data.missing || []
            };
        } catch (error) {
            console.error('Error fetching cached prices:', error);
            return { prices: {}, missing: tickers };
        }
    },

    // Fetch live prices from Cophieu68 (slow, for fallback or manual refresh)
    async fetchLiveMarketPrices(tickers: string[]): Promise<Record<string, number>> {
        if (tickers.length === 0) return {};

        const priceMap: Record<string, number> = {};

        const promises = tickers.map(async (ticker) => {
            try {
                // Call backend API instead of Next.js route
                const symbol = ticker.toUpperCase();
                console.log(`Fetching ${symbol} from Backend API...`);

                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const response = await fetch(`${API_BASE_URL}/api/stock-price/${symbol}`);

                if (!response.ok) {
                    console.error(`Failed to fetch ${ticker}:`, response.statusText);
                    return;
                }

                const data = await response.json();

                if (data.price) {
                    priceMap[data.symbol] = data.price;
                    console.log(`✅ Fetched ${data.symbol}: ${data.price}`);
                } else {
                    console.warn(`No price found for ${ticker}`);
                }
            } catch (error) {
                console.error(`Error fetching ${ticker}:`, error);
            }
        });

        await Promise.all(promises);
        return priceMap;
    }
};
