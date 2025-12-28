import express, { Router, Request, Response } from 'express';
import { CsvService } from '../services/csv-service';
import { ApiResponse } from '../types/api';
import { Asset, Platform, Strategy } from '../types/models';

export function createMasterRoutes(csvService: CsvService): Router {
    const router = express.Router();

    // Get all assets
    router.get('/assets', async (req: Request, res: Response) => {
        try {
            const assets = await csvService.readCsv<Asset>('master/assets.csv');
            const response: ApiResponse<typeof assets> = {
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
            const { asset_name, asset_type } = req.body;

            // Validation
            if (!asset_name || !asset_type) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'asset_name and asset_type are required',
                };
                return res.status(400).json(response);
            }

            // Validate asset_type
            const validTypes = ['STOCK', 'FOREX', 'GOLD', 'CASH', 'OTHER'];
            if (!validTypes.includes(asset_type.toUpperCase())) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: `asset_type must be one of: ${validTypes.join(', ')}`,
                };
                return res.status(400).json(response);
            }

            const assets = await csvService.readCsv<Asset>('master/assets.csv');

            // Generate new asset ID
            const existingIds = assets.map(a => parseInt(a.asset_id.replace('A', ''))).filter(n => !isNaN(n));
            const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
            const newAssetId = `A${String(maxId + 1).padStart(3, '0')}`;

            const newAsset: Asset = {
                asset_id: newAssetId,
                asset_name: asset_name.trim(),
                asset_type: asset_type.toUpperCase(),
            };

            assets.push(newAsset);

            await csvService.writeCsv('master/assets.csv', assets, [
                { id: 'asset_id', title: 'asset_id' },
                { id: 'asset_name', title: 'asset_name' },
                { id: 'asset_type', title: 'asset_type' },
            ]);

            const response: ApiResponse<Asset> = {
                success: true,
                data: newAsset,
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

    // Update existing asset
    router.put('/assets/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { asset_name, asset_type } = req.body;

            const assets = await csvService.readCsv<Asset>('master/assets.csv');
            const assetIndex = assets.findIndex(a => a.asset_id === id);

            if (assetIndex === -1) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Asset not found',
                };
                return res.status(404).json(response);
            }

            // Validate asset_type if provided
            if (asset_type) {
                const validTypes = ['STOCK', 'FOREX', 'GOLD', 'CASH', 'OTHER'];
                if (!validTypes.includes(asset_type.toUpperCase())) {
                    const response: ApiResponse<null> = {
                        success: false,
                        error: `asset_type must be one of: ${validTypes.join(', ')}`,
                    };
                    return res.status(400).json(response);
                }
            }

            // Update fields
            if (asset_name) assets[assetIndex].asset_name = asset_name.trim();
            if (asset_type) assets[assetIndex].asset_type = asset_type.toUpperCase();

            await csvService.writeCsv('master/assets.csv', assets, [
                { id: 'asset_id', title: 'asset_id' },
                { id: 'asset_name', title: 'asset_name' },
                { id: 'asset_type', title: 'asset_type' },
            ]);

            const response: ApiResponse<Asset> = {
                success: true,
                data: assets[assetIndex],
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
            const { id } = req.params;

            const assets = await csvService.readCsv<Asset>('master/assets.csv');
            const assetIndex = assets.findIndex(a => a.asset_id === id);

            if (assetIndex === -1) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Asset not found',
                };
                return res.status(404).json(response);
            }

            // Check if asset is in use by portfolios
            const portfolios = await csvService.readCsv<any>('portfolios.csv');
            const isInUse = portfolios.some(p => p.asset_id === id);

            if (isInUse) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Cannot delete asset type that is in use by portfolios',
                };
                return res.status(400).json(response);
            }

            // Remove asset
            assets.splice(assetIndex, 1);

            await csvService.writeCsv('master/assets.csv', assets, [
                { id: 'asset_id', title: 'asset_id' },
                { id: 'asset_name', title: 'asset_name' },
                { id: 'asset_type', title: 'asset_type' },
            ]);

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

    // Get all platforms
    router.get('/platforms', async (req: Request, res: Response) => {
        try {
            const platforms = await csvService.readCsv<Platform>('master/platforms.csv');
            const response: ApiResponse<typeof platforms> = {
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
            const { platform_name, platform_type, asset_id } = req.body;

            // Validation
            if (!platform_name || !platform_type || !asset_id) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'platform_name, platform_type, and asset_id are required',
                };
                return res.status(400).json(response);
            }

            // Validate platform_type
            const validTypes = ['BROKER', 'BANK', 'WALLET', 'OTHER'];
            if (!validTypes.includes(platform_type.toUpperCase())) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: `platform_type must be one of: ${validTypes.join(', ')}`,
                };
                return res.status(400).json(response);
            }

            // Validate asset_id exists
            const assets = await csvService.readCsv<Asset>('master/assets.csv');
            const assetExists = assets.some(a => a.asset_id === asset_id);
            if (!assetExists) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Invalid asset_id. Asset does not exist',
                };
                return res.status(400).json(response);
            }

            const platforms = await csvService.readCsv<Platform>('master/platforms.csv');

            // Generate new platform ID
            const existingIds = platforms.map(p => parseInt(p.platform_id.replace('P', ''))).filter(n => !isNaN(n));
            const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
            const newPlatformId = `P${String(maxId + 1).padStart(3, '0')}`;

            const newPlatform: Platform = {
                platform_id: newPlatformId,
                platform_name: platform_name.trim(),
                platform_type: platform_type.toUpperCase(),
                asset_id: asset_id,
            };

            platforms.push(newPlatform);

            await csvService.writeCsv('master/platforms.csv', platforms, [
                { id: 'platform_id', title: 'platform_id' },
                { id: 'platform_name', title: 'platform_name' },
                { id: 'platform_type', title: 'platform_type' },
                { id: 'asset_id', title: 'asset_id' },
            ]);

            const response: ApiResponse<Platform> = {
                success: true,
                data: newPlatform,
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

    // Update existing platform
    router.put('/platforms/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { platform_name, platform_type, asset_id } = req.body;

            const platforms = await csvService.readCsv<Platform>('master/platforms.csv');
            const platformIndex = platforms.findIndex(p => p.platform_id === id);

            if (platformIndex === -1) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Platform not found',
                };
                return res.status(404).json(response);
            }

            // Validate platform_type if provided
            if (platform_type) {
                const validTypes = ['BROKER', 'BANK', 'WALLET', 'OTHER'];
                if (!validTypes.includes(platform_type.toUpperCase())) {
                    const response: ApiResponse<null> = {
                        success: false,
                        error: `platform_type must be one of: ${validTypes.join(', ')}`,
                    };
                    return res.status(400).json(response);
                }
            }

            // Validate asset_id if provided
            if (asset_id) {
                const assets = await csvService.readCsv<Asset>('master/assets.csv');
                const assetExists = assets.some(a => a.asset_id === asset_id);
                if (!assetExists) {
                    const response: ApiResponse<null> = {
                        success: false,
                        error: 'Invalid asset_id. Asset does not exist',
                    };
                    return res.status(400).json(response);
                }
            }

            // Update fields
            if (platform_name) platforms[platformIndex].platform_name = platform_name.trim();
            if (platform_type) platforms[platformIndex].platform_type = platform_type.toUpperCase();
            if (asset_id) platforms[platformIndex].asset_id = asset_id;

            await csvService.writeCsv('master/platforms.csv', platforms, [
                { id: 'platform_id', title: 'platform_id' },
                { id: 'platform_name', title: 'platform_name' },
                { id: 'platform_type', title: 'platform_type' },
                { id: 'asset_id', title: 'asset_id' },
            ]);

            const response: ApiResponse<Platform> = {
                success: true,
                data: platforms[platformIndex],
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
            const { id } = req.params;

            const platforms = await csvService.readCsv<Platform>('master/platforms.csv');
            const platformIndex = platforms.findIndex(p => p.platform_id === id);

            if (platformIndex === -1) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Platform not found',
                };
                return res.status(404).json(response);
            }

            // Check if platform is in use
            const portfolios = await csvService.readCsv<any>('portfolios.csv');
            const cashAccounts = await csvService.readCsv<any>('cash_accounts.csv');
            const isInUse = portfolios.some(p => p.platform_id === id) || cashAccounts.some(c => c.platform_id === id);

            if (isInUse) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Cannot delete platform that is in use by portfolios or cash accounts',
                };
                return res.status(400).json(response);
            }

            // Remove platform
            platforms.splice(platformIndex, 1);

            await csvService.writeCsv('master/platforms.csv', platforms, [
                { id: 'platform_id', title: 'platform_id' },
                { id: 'platform_name', title: 'platform_name' },
                { id: 'platform_type', title: 'platform_type' },
                { id: 'asset_id', title: 'asset_id' },
            ]);

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

    // Get all strategies
    router.get('/strategies', async (req: Request, res: Response) => {
        try {
            const strategies = await csvService.readCsv<Strategy>('master/strategies.csv');
            const response: ApiResponse<typeof strategies> = {
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

    return router;
}
