
export const stockPriceService = {
    async fetchMarketPrices(tickers: string[]): Promise<Record<string, number>> {
        if (tickers.length === 0) return {};

        const priceMap: Record<string, number> = {};

        const promises = tickers.map(async (ticker) => {
            try {
                // Call backend API instead of Next.js route
                const symbol = ticker.toUpperCase();
                console.log(`Fetching ${symbol} from Backend API...`);

                const response = await fetch(`http://localhost:3001/api/stock-price/${symbol}`);

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
