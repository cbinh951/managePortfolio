import express, { Router, Request, Response } from 'express';
import { PortfolioService } from '../services/portfolio-service';
import { CashService } from '../services/cash-service';
import { CsvService } from '../services/csv-service';
import { DashboardData } from '../types/models';
import { ApiResponse } from '../types/api';

export function createDashboardRoutes(csvService: CsvService): Router {
    const router = express.Router();
    const portfolioService = new PortfolioService(csvService);
    const cashService = new CashService(csvService);

    // Get dashboard data
    router.get('/', async (req: Request, res: Response) => {
        console.log("🚀 ~ router.get ~ req:")
        try {
            // Get all portfolio performances
            const portfolios = await portfolioService.getAllPortfolioPerformances();

            // Get all cash balances
            const cashAccounts = await cashService.getAllCashBalances();

            // Calculate totals
            const totalCash = cashAccounts.reduce((sum, acc) => sum + acc.balance, 0);
            const totalInvestmentNav = portfolios.reduce((sum, p) => sum + p.current_nav, 0);
            const totalNetWorth = totalCash + totalInvestmentNav;

            // Calculate percentages
            const cashPercentage = totalNetWorth > 0 ? (totalCash / totalNetWorth) * 100 : 0;
            const investmentPercentage = totalNetWorth > 0 ? (totalInvestmentNav / totalNetWorth) * 100 : 0;

            const dashboardData: DashboardData = {
                total_net_worth: totalNetWorth,
                total_cash: totalCash,
                total_investment_nav: totalInvestmentNav,
                cash_percentage: cashPercentage,
                investment_percentage: investmentPercentage,
                portfolios,
                cash_accounts: cashAccounts,
            };

            const response: ApiResponse<DashboardData> = {
                success: true,
                data: dashboardData,
            };

            res.json(response);
        } catch (error) {
            const response: ApiResponse<null> = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            res.status(500).json(response);
        }
    });

    return router;
}
