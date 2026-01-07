import { CsvService } from './csv-service';
import { Transaction, Snapshot, GoldType } from '../types/models';

export class GoldService {
    constructor(private csvService: CsvService) { }

    // Calculate total holdings by gold type
    getGoldHoldings(transactions: Transaction[]): {
        branded: number;  // Total branded gold (chỉ)
        private: number;  // Total private gold (chỉ)
    } {
        // Sum deposits/buys and subtract withdrawals/sells using quantity_chi
        let branded = 0;
        let private_gold = 0;

        for (const t of transactions) {
            if (!t.quantity_chi) continue;

            const quantity = Number(t.quantity_chi);
            if (isNaN(quantity)) continue;

            const isAddition = t.type === 'BUY' || t.type === 'DEPOSIT';
            const isSubtraction = t.type === 'SELL' || t.type === 'WITHDRAW';

            if (t.gold_type === GoldType.BRANDED) {
                if (isAddition) branded += quantity;
                if (isSubtraction) branded -= quantity;
            } else if (t.gold_type === GoldType.PRIVATE) {
                if (isAddition) private_gold += quantity;
                if (isSubtraction) private_gold -= quantity;
            }
        }

        return { branded, private: private_gold };
    }

    // Calculate NAV for gold portfolio based on current unit prices
    calculateGoldNAV(
        transactions: Transaction[],
        brandedPrice: number,
        privatePrice: number
    ): number {
        const holdings = this.getGoldHoldings(transactions);

        const brandedValue = holdings.branded * brandedPrice;
        const privateValue = holdings.private * privatePrice;

        return brandedValue + privateValue;
    }

    // Calculate P&L for a gold portfolio
    // This is a helper that returns the data needed for PortfolioPerformance
    async calculateGoldPerformance(
        transactions: Transaction[],
        snapshot: Snapshot
    ): Promise<{
        currentNAV: number;
        holdings: { branded: number; private: number };
    } | null> {
        // If snapshot lacks gold prices, we can't calculate specialized NAV
        if (!snapshot.branded_gold_price && !snapshot.private_gold_price) {
            return null;
        }

        const brandedPrice = snapshot.branded_gold_price || 0;
        const privatePrice = snapshot.private_gold_price || 0;

        const holdings = this.getGoldHoldings(transactions);
        const currentNAV = (holdings.branded * brandedPrice) + (holdings.private * privatePrice);

        return {
            currentNAV,
            holdings
        };
    }
}
