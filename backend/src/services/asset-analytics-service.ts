import { CsvService } from './csv-service';
import { Portfolio, Asset, AssetTypeMetrics } from '../types/models';
import { PortfolioService } from './portfolio-service';
import { CashService } from './cash-service';
import { calculateAverageXIRR } from './calculation-service';

export class AssetAnalyticsService {
    private csvService: CsvService;
    private portfolioService: PortfolioService;
    private cashService: CashService;

    constructor(csvService: CsvService) {
        this.csvService = csvService;
        this.portfolioService = new PortfolioService(csvService);
        this.cashService = new CashService(csvService);
    }

    async getAssetTypeMetrics(assetTypeFilter?: string): Promise<AssetTypeMetrics> {
        // Get all portfolios, assets, and cash accounts
        const portfolios = await this.csvService.readCsv<Portfolio>('portfolios.csv');
        const assets = await this.csvService.readCsv<Asset>('master/assets.csv');
        const cashAccounts = await this.cashService.getAllCashAccounts();

        // Create a map of asset_id to asset_name for quick lookup
        const assetNameMap = new Map<string, string>();
        assets.forEach(asset => {
            assetNameMap.set(asset.asset_id, asset.asset_name);
        });

        // Initialize metrics
        let totalNetWorth = 0;
        let totalInvested = 0;
        const xirrs: number[] = [];

        // Handle CASH filter
        if (assetTypeFilter === 'CASH') {
            // Only include cash accounts
            for (const cashAccount of cashAccounts) {
                try {
                    const balanceData = await this.cashService.getCashAccountBalance(cashAccount.cash_account_id);
                    if (balanceData) {
                        totalNetWorth += balanceData.balance;
                    }
                    // Cash accounts don't have invested amounts or XIRR
                } catch (error) {
                    console.error(`Error processing cash account ${cashAccount.cash_account_id}:`, error);
                }
            }
        } else {
            // Filter portfolios by asset name if specified
            let filteredPortfolios = portfolios;
            if (assetTypeFilter && assetTypeFilter !== 'ALL') {
                filteredPortfolios = portfolios.filter(p => {
                    const assetName = assetNameMap.get(p.asset_id);
                    return assetName === assetTypeFilter;
                });
            }

            // Calculate metrics for each portfolio
            for (const portfolio of filteredPortfolios) {
                try {
                    const performance = await this.portfolioService.getPortfolioPerformance(portfolio.portfolio_id);
                    if (performance) {
                        totalNetWorth += performance.current_nav;
                        totalInvested += performance.total_invested;
                        xirrs.push(performance.xirr);
                    }
                } catch (error) {
                    console.error(`Error getting performance for portfolio ${portfolio.portfolio_id}:`, error);
                }
            }

            // If ALL, also include cash accounts
            if (!assetTypeFilter || assetTypeFilter === 'ALL') {
                for (const cashAccount of cashAccounts) {
                    try {
                        const balanceData = await this.cashService.getCashAccountBalance(cashAccount.cash_account_id);
                        if (balanceData) {
                            totalNetWorth += balanceData.balance;
                        }
                    } catch (error) {
                        console.error(`Error processing cash account ${cashAccount.cash_account_id}:`, error);
                    }
                }
            }
        }

        const totalProfitLoss = totalNetWorth - totalInvested;
        const profitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
        const averageXirr = calculateAverageXIRR(xirrs);

        return {
            asset_type: assetTypeFilter || 'ALL',
            total_net_worth: totalNetWorth,
            total_profit_loss: totalProfitLoss,
            profit_loss_percentage: Math.round(profitLossPercentage * 100) / 100,
            average_xirr: Math.round(averageXirr * 100) / 100, // Already in percentage
        };
    }
}
