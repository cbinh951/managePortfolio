import { TrackingStock, TrackingStockWithStatus, TrackingStockStatus, StockPrice } from '../types/models';
import { CsvService } from './csv-service';

export class TrackingCalculationService {
    private csvService: CsvService;

    constructor() {
        this.csvService = new CsvService();
    }

    /**
     * Calculate stock status based on current price and buy/sell targets
     */
    calculateStockStatus(
        trackingStock: TrackingStock,
        currentPrice: number | null
    ): TrackingStockStatus {
        if (currentPrice === null) {
            return TrackingStockStatus.BUY_ZONE; // Default when no price available
        }

        const { stop_buy_price, sell_target_price } = trackingStock;

        // BUY ZONE: Current price at or below stop buy price
        if (currentPrice <= stop_buy_price) {
            return TrackingStockStatus.BUY_ZONE;
        }

        // OVER LIMIT: Current price more than 10% above stop buy
        if (currentPrice > stop_buy_price * 1.1) {
            return TrackingStockStatus.OVER_LIMIT;
        }

        // IN RANGE: Between buy and sell target
        if (currentPrice < sell_target_price) {
            return TrackingStockStatus.IN_RANGE;
        }

        // NEAR LIMIT: Just above stop buy (within 10%)
        return TrackingStockStatus.NEAR_LIMIT;
    }

    /**
     * Calculate potential profit percentage
     */
    calculatePotentialProfit(currentPrice: number | null, sellTarget: number): number {
        if (currentPrice === null || currentPrice === 0) {
            return 0;
        }

        return ((sellTarget - currentPrice) / currentPrice) * 100;
    }

    /**
     * Enrich tracking stocks with current market data and calculated metrics
     */
    async enrichTrackingStocksWithMarketData(
        trackingStocks: TrackingStock[]
    ): Promise<TrackingStockWithStatus[]> {
        // Get all stock prices from cache
        const allPrices = await this.csvService.getAllStockPrices();
        const priceMap = new Map<string, StockPrice>();

        allPrices.forEach(p => {
            priceMap.set(p.ticker.toUpperCase(), p);
        });

        // Enrich each tracking stock
        const enrichedStocks: TrackingStockWithStatus[] = trackingStocks.map(stock => {
            const ticker = stock.ticker.toUpperCase();
            const priceData = priceMap.get(ticker);
            const currentPrice = priceData?.price || null;
            const priceUpdatedAt = priceData?.updated_at;

            const status = this.calculateStockStatus(stock, currentPrice);
            const potentialProfit = this.calculatePotentialProfit(currentPrice, stock.sell_target_price);
            const isAttractive = potentialProfit > 20; // More than 20% potential profit

            return {
                ...stock,
                current_price: currentPrice,
                price_updated_at: priceUpdatedAt,
                status,
                potential_profit: potentialProfit,
                is_attractive: isAttractive,
            };
        });

        return enrichedStocks;
    }

    /**
     * Get enriched stock by ID
     */
    async getEnrichedTrackingStock(stock_id: string): Promise<TrackingStockWithStatus | null> {
        const stock = await this.csvService.getTrackingStockById(stock_id);
        if (!stock) return null;

        const enriched = await this.enrichTrackingStocksWithMarketData([stock]);
        return enriched[0] || null;
    }

    /**
     * Get enriched stocks by list ID
     */
    async getEnrichedTrackingStocksByList(list_id: string): Promise<TrackingStockWithStatus[]> {
        const stocks = await this.csvService.getTrackingStocksByList(list_id);
        return await this.enrichTrackingStocksWithMarketData(stocks);
    }

    /**
     * Calculate summary statistics for a tracking list
     */
    async calculateListSummary(list_id: string): Promise<{
        total_stocks: number;
        buy_zone_count: number;
        over_limit_count: number;
        in_range_count: number;
        near_limit_count: number;
        attractive_count: number;
        average_potential_profit: number;
        missing_prices_count: number;
    }> {
        const enrichedStocks = await this.getEnrichedTrackingStocksByList(list_id);

        const summary = {
            total_stocks: enrichedStocks.length,
            buy_zone_count: 0,
            over_limit_count: 0,
            in_range_count: 0,
            near_limit_count: 0,
            attractive_count: 0,
            average_potential_profit: 0,
            missing_prices_count: 0,
        };

        let totalProfit = 0;

        enrichedStocks.forEach(stock => {
            if (stock.current_price === null) {
                summary.missing_prices_count++;
            }

            switch (stock.status) {
                case TrackingStockStatus.BUY_ZONE:
                    summary.buy_zone_count++;
                    break;
                case TrackingStockStatus.OVER_LIMIT:
                    summary.over_limit_count++;
                    break;
                case TrackingStockStatus.IN_RANGE:
                    summary.in_range_count++;
                    break;
                case TrackingStockStatus.NEAR_LIMIT:
                    summary.near_limit_count++;
                    break;
            }

            if (stock.is_attractive) {
                summary.attractive_count++;
            }

            totalProfit += stock.potential_profit;
        });

        summary.average_potential_profit = enrichedStocks.length > 0
            ? totalProfit / enrichedStocks.length
            : 0;

        return summary;
    }
}
