import express, { Router, Request, Response } from 'express';
import { supabaseService } from '../../services/supabase-service';
import { AssetTypeMetrics } from '../../types/models';
import { ApiResponse } from '../../types/api';

export function createSupabaseAssetAnalyticsRoutes(): Router {
    const router = express.Router();

    // Get asset type metrics
    // Query params: asset_type (optional) - STOCK, FOREX, GOLD, CASH, or ALL
    router.get('/', async (req: Request, res: Response) => {
        try {
            const assetType = req.query.asset_type as string | undefined;

            const metrics = await supabaseService.getAssetTypeMetrics(assetType);

            const response: ApiResponse<AssetTypeMetrics> = {
                success: true,
                data: metrics,
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
