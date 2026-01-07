import express, { Router, Request, Response } from 'express';
import { supabaseService } from '../../services/supabase-service';
import { ApiResponse } from '../../types/api';
import { Asset, Platform, Strategy } from '../../types/models';

export function createSupabaseMasterRoutes(): Router {
    const router = express.Router();

    // ============================================
    // ASSETS
    // ============================================

    // Get all assets
    router.get('/assets', async (req: Request, res: Response) => {
        try {
            const assets = await supabaseService.getAllAssets();
            const response: ApiResponse<Asset[]> = {
                success: true,
                data: assets,
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

    // Create new asset
    router.post('/assets', async (req: Request, res: Response) => {
        try {
            const { asset_name } = req.body;

            if (!asset_name) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'asset_name is required',
                };
                return res.status(400).json(response);
            }

            const asset = await supabaseService.createAsset({
                asset_name: asset_name.trim(),
            });

            const response: ApiResponse<Asset> = {
                success: true,
                data: asset,
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

    // Update asset
    router.put('/assets/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { asset_name } = req.body;



            const updates: Partial<Asset> = {};
            if (asset_name) updates.asset_name = asset_name.trim();

            const asset = await supabaseService.updateAsset(id, updates);
            if (!asset) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Asset not found',
                };
                return res.status(404).json(response);
            }

            const response: ApiResponse<Asset> = {
                success: true,
                data: asset,
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

    // Delete asset
    router.delete('/assets/:id', async (req: Request, res: Response) => {
        try {
            const success = await supabaseService.deleteAsset(req.params.id);
            if (!success) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Failed to delete asset',
                };
                return res.status(500).json(response);
            }
            const response: ApiResponse<{ message: string }> = {
                success: true,
                data: { message: 'Asset deleted successfully' },
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

    // ============================================
    // PLATFORMS
    // ============================================

    // Get all platforms
    router.get('/platforms', async (req: Request, res: Response) => {
        try {
            const platforms = await supabaseService.getAllPlatforms();
            const response: ApiResponse<Platform[]> = {
                success: true,
                data: platforms,
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

    // Create new platform
    router.post('/platforms', async (req: Request, res: Response) => {
        try {
            const { platform_name, asset_id } = req.body;

            if (!platform_name) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'platform_name is required',
                };
                return res.status(400).json(response);
            }

            const platform = await supabaseService.createPlatform({
                platform_name: platform_name.trim(),
                asset_id: asset_id || null,
            });

            const response: ApiResponse<Platform> = {
                success: true,
                data: platform,
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

    // Update platform
    router.put('/platforms/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { platform_name, asset_id } = req.body;

            const updates: Partial<Platform> = {};
            if (platform_name) updates.platform_name = platform_name.trim();
            if (asset_id !== undefined) updates.asset_id = asset_id;

            const platform = await supabaseService.updatePlatform(id, updates);
            if (!platform) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Platform not found',
                };
                return res.status(404).json(response);
            }

            const response: ApiResponse<Platform> = {
                success: true,
                data: platform,
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

    // Delete platform
    router.delete('/platforms/:id', async (req: Request, res: Response) => {
        try {
            const success = await supabaseService.deletePlatform(req.params.id);
            if (!success) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Failed to delete platform',
                };
                return res.status(500).json(response);
            }
            const response: ApiResponse<{ message: string }> = {
                success: true,
                data: { message: 'Platform deleted successfully' },
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

    // ============================================
    // STRATEGIES
    // ============================================

    // Get all strategies
    router.get('/strategies', async (req: Request, res: Response) => {
        try {
            const strategies = await supabaseService.getAllStrategies();
            const response: ApiResponse<Strategy[]> = {
                success: true,
                data: strategies,
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

    // Create new strategy
    router.post('/strategies', async (req: Request, res: Response) => {
        try {
            const { strategy_name, description } = req.body;

            if (!strategy_name) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'strategy_name is required',
                };
                return res.status(400).json(response);
            }

            const strategy = await supabaseService.createStrategy({
                strategy_name: strategy_name.trim(),
                description: description?.trim() || '',
            });

            const response: ApiResponse<Strategy> = {
                success: true,
                data: strategy,
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

    // Update strategy
    router.put('/strategies/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { strategy_name, description } = req.body;

            const updates: Partial<Strategy> = {};
            if (strategy_name) updates.strategy_name = strategy_name.trim();
            if (description !== undefined) updates.description = description.trim();

            const strategy = await supabaseService.updateStrategy(id, updates);
            if (!strategy) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Strategy not found',
                };
                return res.status(404).json(response);
            }

            const response: ApiResponse<Strategy> = {
                success: true,
                data: strategy,
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

    // Delete strategy
    router.delete('/strategies/:id', async (req: Request, res: Response) => {
        try {
            const success = await supabaseService.deleteStrategy(req.params.id);
            if (!success) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Failed to delete strategy',
                };
                return res.status(500).json(response);
            }
            const response: ApiResponse<{ message: string }> = {
                success: true,
                data: { message: 'Strategy deleted successfully' },
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
