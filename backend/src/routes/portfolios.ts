import express, { Router, Request, Response } from 'express';
import { PortfolioService } from '../services/portfolio-service';
import { CsvService } from '../services/csv-service';
import { ApiResponse, CreatePortfolioRequest } from '../types/api';

export function createPortfolioRoutes(csvService: CsvService): Router {
    const router = express.Router();
    const portfolioService = new PortfolioService(csvService);

    // Get all portfolios
    router.get('/', async (req: Request, res: Response) => {
        try {
            const portfolios = await portfolioService.getAllPortfolios();
            const response: ApiResponse<typeof portfolios> = {
                success: true,
                data: portfolios,
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

    // Get portfolio by ID
    router.get('/:id', async (req: Request, res: Response) => {
        try {
            const portfolio = await portfolioService.getPortfolioById(req.params.id);
            if (!portfolio) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Portfolio not found',
                };
                return res.status(404).json(response);
            }
            const response: ApiResponse<typeof portfolio> = {
                success: true,
                data: portfolio,
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

    // Get portfolio performance
    router.get('/:id/performance', async (req: Request, res: Response) => {
        try {
            const performance = await portfolioService.getPortfolioPerformance(req.params.id);
            if (!performance) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Portfolio not found',
                };
                return res.status(404).json(response);
            }
            const response: ApiResponse<typeof performance> = {
                success: true,
                data: performance,
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

    // Create new portfolio
    router.post('/', async (req: Request, res: Response) => {
        try {
            const data: CreatePortfolioRequest = req.body;
            const portfolio = await portfolioService.createPortfolio(data);
            const response: ApiResponse<typeof portfolio> = {
                success: true,
                data: portfolio,
                message: 'Portfolio created successfully',
            };
            res.status(201).json(response);
        } catch (error) {
            const response: ApiResponse<null> = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            res.status(500).json(response);
        }
    });

    // Update portfolio
    router.put('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, platform_id, strategy_id } = req.body;

            const portfolios = await csvService.readCsv<any>('portfolios.csv');
            const portfolioIndex = portfolios.findIndex((p: any) => p.portfolio_id === id);

            if (portfolioIndex === -1) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Portfolio not found',
                };
                return res.status(404).json(response);
            }

            // Update fields if provided
            if (name) portfolios[portfolioIndex].name = name;
            if (platform_id) portfolios[portfolioIndex].platform_id = platform_id;
            if (strategy_id) portfolios[portfolioIndex].strategy_id = strategy_id;

            await csvService.writeCsv('portfolios.csv', portfolios, [
                { id: 'portfolio_id', title: 'portfolio_id' },
                { id: 'name', title: 'name' },
                { id: 'asset_id', title: 'asset_id' },
                { id: 'platform_id', title: 'platform_id' },
                { id: 'strategy_id', title: 'strategy_id' },
                { id: 'start_date', title: 'start_date' },
            ]);

            const response: ApiResponse<any> = {
                success: true,
                data: portfolios[portfolioIndex],
                message: 'Portfolio updated successfully',
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
