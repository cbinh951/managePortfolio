import express, { Router, Request, Response } from 'express';
import { supabaseService } from '../../services/supabase-service';
import { ApiResponse } from '../../types/api';

export function createSupabaseSnapshotRoutes(): Router {
    const router = express.Router();

    // Get all snapshots
    router.get('/', async (req: Request, res: Response) => {
        try {
            const snapshots = await supabaseService.getAllSnapshots();
            const response: ApiResponse<typeof snapshots> = {
                success: true,
                data: snapshots,
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

    // Get snapshots by portfolio ID
    router.get('/portfolio/:portfolioId', async (req: Request, res: Response) => {
        try {
            const snapshots = await supabaseService.getSnapshotsByPortfolio(req.params.portfolioId);
            const response: ApiResponse<typeof snapshots> = {
                success: true,
                data: snapshots,
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

    // Create new snapshot
    router.post('/', async (req: Request, res: Response) => {
        try {
            const snapshot = await supabaseService.createSnapshot(req.body);
            const response: ApiResponse<typeof snapshot> = {
                success: true,
                data: snapshot,
                message: 'Snapshot created successfully',
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

    // Update snapshot
    router.put('/:id', async (req: Request, res: Response) => {
        try {
            const snapshot = await supabaseService.updateSnapshot(req.params.id, req.body);
            if (!snapshot) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Snapshot not found',
                };
                return res.status(404).json(response);
            }
            const response: ApiResponse<typeof snapshot> = {
                success: true,
                data: snapshot,
                message: 'Snapshot updated successfully',
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

    // Delete snapshot
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            const success = await supabaseService.deleteSnapshot(req.params.id);
            if (!success) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Failed to delete snapshot',
                };
                return res.status(500).json(response);
            }
            const response: ApiResponse<{ message: string }> = {
                success: true,
                data: { message: 'Snapshot deleted successfully' },
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
