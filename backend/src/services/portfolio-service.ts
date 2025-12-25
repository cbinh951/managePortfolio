import { CsvService } from './csv-service';
import { Portfolio, Transaction, Snapshot, PortfolioPerformance } from '../types/models';
import {
    calculateTotalInvested,
    calculateXIRR,
    prepareXIRRCashFlows,
} from './calculation-service';

export class PortfolioService {
    private csvService: CsvService;

    constructor(csvService: CsvService) {
        this.csvService = csvService;
    }

    async getAllPortfolios(): Promise<Portfolio[]> {
        return this.csvService.readCsv<Portfolio>('portfolios.csv');
    }

    async getPortfolioById(id: string): Promise<Portfolio | null> {
        const portfolios = await this.getAllPortfolios();
        return portfolios.find(p => p.portfolio_id === id) || null;
    }

    async createPortfolio(data: Omit<Portfolio, 'portfolio_id'>): Promise<Portfolio> {
        const portfolio: Portfolio = {
            portfolio_id: this.csvService.generateId('PF'),
            ...data,
        };

        await this.csvService.appendCsv('portfolios.csv', portfolio, [
            { id: 'portfolio_id', title: 'portfolio_id' },
            { id: 'name', title: 'name' },
            { id: 'asset_id', title: 'asset_id' },
            { id: 'platform_id', title: 'platform_id' },
            { id: 'strategy_id', title: 'strategy_id' },
            { id: 'start_date', title: 'start_date' },
        ]);

        return portfolio;
    }

    async getPortfolioPerformance(portfolioId: string): Promise<PortfolioPerformance | null> {
        const portfolio = await this.getPortfolioById(portfolioId);
        if (!portfolio) return null;

        // Get transactions for this portfolio
        const allTransactions = await this.csvService.readCsv<Transaction>('transactions.csv');
        const transactions = allTransactions.filter(t => t.portfolio_id === portfolioId);

        // Get latest snapshot
        const allSnapshots = await this.csvService.readCsv<Snapshot>('snapshots.csv');
        const snapshots = allSnapshots
            .filter(s => s.portfolio_id === portfolioId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const currentNAV = snapshots.length > 0 ? parseFloat(snapshots[0].nav.toString()) : 0;
        const totalInvested = calculateTotalInvested(transactions);
        const profit = currentNAV - totalInvested;
        const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

        // Calculate XIRR
        let xirr = 0;
        if (transactions.length > 0 && currentNAV > 0) {
            const cashFlows = prepareXIRRCashFlows(transactions, currentNAV);
            if (cashFlows.length >= 2) {
                xirr = calculateXIRR(cashFlows);
            }
        }

        return {
            portfolio_id: portfolioId,
            total_invested: totalInvested,
            current_nav: currentNAV,
            profit,
            profit_percentage: profitPercentage,
            xirr: xirr * 100, // Convert to percentage
        };
    }

    async getAllPortfolioPerformances(): Promise<PortfolioPerformance[]> {
        const portfolios = await this.getAllPortfolios();
        const performances: PortfolioPerformance[] = [];

        for (const portfolio of portfolios) {
            const performance = await this.getPortfolioPerformance(portfolio.portfolio_id);
            if (performance) {
                performances.push(performance);
            }
        }

        return performances;
    }
}
