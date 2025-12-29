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

        console.log('\n=== XIRR Calculation Debug ===');
        console.log('Portfolio ID:', portfolioId);

        // Get transactions for this portfolio
        const allTransactions = await this.csvService.readCsv<Transaction>('transactions.csv');
        const transactions = allTransactions.filter(t => t.portfolio_id === portfolioId);
        console.log('Transactions count:', transactions.length);

        // Get latest snapshot
        const allSnapshots = await this.csvService.readCsv<Snapshot>('snapshots.csv');
        const snapshots = allSnapshots
            .filter(s => s.portfolio_id === portfolioId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        console.log('Snapshots count:', snapshots.length);

        const currentNAV = snapshots.length > 0 ? parseFloat(snapshots[0].nav.toString()) : 0;
        console.log('Current NAV:', currentNAV);

        const totalInvested = calculateTotalInvested(transactions);
        console.log('Total Invested:', totalInvested);

        const profit = currentNAV - totalInvested;
        const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

        // Calculate XIRR
        let xirr = 0;
        if (transactions.length > 0 && currentNAV > 0) {
            console.log('Preparing cash flows...');
            const cashFlows = prepareXIRRCashFlows(transactions, currentNAV);
            console.log('Cash flows prepared:', cashFlows.length);
            if (cashFlows.length >= 2) {
                console.log('Calculating XIRR...');
                xirr = calculateXIRR(cashFlows);
                console.log('XIRR result:', xirr);
            } else {
                console.log('Not enough cash flows for XIRR');
            }
        } else {
            console.log('Skipping XIRR: transactions=', transactions.length, 'currentNAV=', currentNAV);
        }

        const result = {
            portfolio_id: portfolioId,
            total_invested: totalInvested,
            current_nav: currentNAV,
            profit,
            profit_percentage: Math.round(profitPercentage * 100) / 100,
            xirr: Math.round(xirr * 100 * 100) / 100, // Convert to percentage and round to 2 decimal places
        };
        console.log('Final result:', result);
        console.log('=== End Debug ===\n');
        return result;
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
    async deletePortfolio(id: string): Promise<void> {
        const portfolios = await this.csvService.readCsv<Portfolio>('portfolios.csv');
        const filteredPortfolios = portfolios.filter(p => p.portfolio_id !== id);

        if (portfolios.length === filteredPortfolios.length) {
            // Optional: throw error if not found, or just return check if controller handles 404
            // For now, we'll assume if length matches, nothing was deleted.
            throw new Error('Portfolio not found');
        }

        await this.csvService.writeCsv('portfolios.csv', filteredPortfolios, [
            { id: 'portfolio_id', title: 'portfolio_id' },
            { id: 'name', title: 'name' },
            { id: 'asset_id', title: 'asset_id' },
            { id: 'platform_id', title: 'platform_id' },
            { id: 'strategy_id', title: 'strategy_id' },
            { id: 'start_date', title: 'start_date' },
        ]);
    }
}
