import express, { Router, Request, Response } from 'express';
import { supabaseService } from '../../services/supabase-service';
import { chartDataService } from '../../services/chart-data-service';
import { ApiResponse } from '../../types/api';
import { TimeRange } from '../../types/models';

export function createSupabasePortfolioRoutes(): Router {
    const router = express.Router();

    // Get all portfolios
    router.get('/', async (req: Request, res: Response) => {
        try {
            const portfolios = await supabaseService.getAllPortfolios();
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
            const portfolio = await supabaseService.getPortfolioById(req.params.id);
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
            const performance = await supabaseService.getPortfolioPerformance(req.params.id);
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

    // Get portfolio performance chart data
    router.get('/:id/performance-chart', async (req: Request, res: Response) => {
        try {
            const portfolioId = req.params.id;
            const timeRangeParam = (req.query.timeRange as string) || 'ALL';

            // Validate time range
            const validTimeRanges = Object.values(TimeRange);
            if (!validTimeRanges.includes(timeRangeParam as TimeRange)) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: `Invalid time range. Valid values: ${validTimeRanges.join(', ')}`,
                };
                return res.status(400).json(response);
            }

            const timeRange = timeRangeParam as TimeRange;

            // Get portfolio info
            const portfolio = await supabaseService.getPortfolioById(portfolioId);
            if (!portfolio) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Portfolio not found',
                };
                return res.status(404).json(response);
            }

            // Get transactions and snapshots
            const [transactions, snapshots, performance] = await Promise.all([
                supabaseService.getTransactionsByPortfolio(portfolioId),
                supabaseService.getSnapshotsByPortfolio(portfolioId),
                supabaseService.getPortfolioPerformance(portfolioId),
            ]);

            if (!performance) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Failed to calculate portfolio performance',
                };
                return res.status(500).json(response);
            }

            // Generate chart data
            const chartData = chartDataService.generateChartData(
                portfolioId,
                portfolio.name,
                transactions,
                snapshots,
                performance,
                timeRange
            );

            const response: ApiResponse<typeof chartData> = {
                success: true,
                data: chartData,
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
            const portfolio = await supabaseService.createPortfolio(req.body);
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
            const portfolio = await supabaseService.updatePortfolio(req.params.id, req.body);
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

    // Delete portfolio
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            const success = await supabaseService.deletePortfolio(req.params.id);
            if (!success) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Failed to delete portfolio',
                };
                return res.status(500).json(response);
            }
            const response: ApiResponse<{ message: string }> = {
                success: true,
                data: { message: 'Portfolio deleted successfully' },
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
