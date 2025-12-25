import express, { Router, Request, Response } from 'express';
import { CsvService } from '../services/csv-service';
import { Snapshot } from '../types/models';
import { ApiResponse, CreateSnapshotRequest } from '../types/api';

export function createSnapshotRoutes(csvService: CsvService): Router {
    const router = express.Router();

    // Get all snapshots
    router.get('/', async (req: Request, res: Response) => {
        try {
            const snapshots = await csvService.readCsv<Snapshot>('snapshots.csv');
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
            const allSnapshots = await csvService.readCsv<Snapshot>('snapshots.csv');
            const snapshots = allSnapshots.filter(
                s => s.portfolio_id === req.params.portfolioId
            );
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
            const data: CreateSnapshotRequest = req.body;
            const snapshot: Snapshot = {
                snapshot_id: csvService.generateId('SNP'),
                ...data,
            };

            await csvService.appendCsv('snapshots.csv', snapshot, [
                { id: 'snapshot_id', title: 'snapshot_id' },
                { id: 'portfolio_id', title: 'portfolio_id' },
                { id: 'date', title: 'date' },
                { id: 'nav', title: 'nav' },
            ]);

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
            const { id } = req.params;
            const updateData: { date?: string; nav?: number } = req.body;

            const snapshots = await csvService.readCsv<Snapshot>('snapshots.csv');
            const index = snapshots.findIndex(s => s.snapshot_id === id);

            if (index === -1) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Snapshot not found',
                };
                return res.status(404).json(response);
            }

            // Update snapshot fields
            if (updateData.date !== undefined) {
                snapshots[index].date = updateData.date;
            }
            if (updateData.nav !== undefined) {
                snapshots[index].nav = updateData.nav;
            }

            await csvService.writeCsv('snapshots.csv', snapshots, [
                { id: 'snapshot_id', title: 'snapshot_id' },
                { id: 'portfolio_id', title: 'portfolio_id' },
                { id: 'date', title: 'date' },
                { id: 'nav', title: 'nav' },
            ]);

            const response: ApiResponse<Snapshot> = {
                success: true,
                data: snapshots[index],
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
            const { id } = req.params;

            const snapshots = await csvService.readCsv<Snapshot>('snapshots.csv');
            const index = snapshots.findIndex(s => s.snapshot_id === id);

            if (index === -1) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Snapshot not found',
                };
                return res.status(404).json(response);
            }

            // Remove snapshot from array
            snapshots.splice(index, 1);

            await csvService.writeCsv('snapshots.csv', snapshots, [
                { id: 'snapshot_id', title: 'snapshot_id' },
                { id: 'portfolio_id', title: 'portfolio_id' },
                { id: 'date', title: 'date' },
                { id: 'nav', title: 'nav' },
            ]);

            const response: ApiResponse<null> = {
                success: true,
                data: null,
                message: 'Snapshot deleted successfully',
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
