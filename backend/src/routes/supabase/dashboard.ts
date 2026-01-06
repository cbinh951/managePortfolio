import express, { Router, Request, Response } from 'express';
import { supabaseService } from '../../services/supabase-service';
import { DashboardData } from '../../types/models';
import { ApiResponse } from '../../types/api';

export function createSupabaseDashboardRoutes(): Router {
    const router = express.Router();

    // Get dashboard data
    router.get('/', async (req: Request, res: Response) => {
        try {
            const dashboardData = await supabaseService.getDashboardData();
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
