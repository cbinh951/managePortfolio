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

    return router;
}
