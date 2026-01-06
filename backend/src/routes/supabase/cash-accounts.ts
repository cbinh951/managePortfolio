import express, { Router, Request, Response } from 'express';
import { supabaseService } from '../../services/supabase-service';
import { ApiResponse } from '../../types/api';

export function createSupabaseCashAccountRoutes(): Router {
    const router = express.Router();

    // Get all cash accounts
    router.get('/', async (req: Request, res: Response) => {
        try {
            const accounts = await supabaseService.getAllCashAccounts();
            const response: ApiResponse<typeof accounts> = {
                success: true,
                data: accounts,
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

    // Get cash account by ID
    router.get('/:id', async (req: Request, res: Response) => {
        try {
            const account = await supabaseService.getCashAccountById(req.params.id);
            if (!account) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Cash account not found',
                };
                return res.status(404).json(response);
            }
            const response: ApiResponse<typeof account> = {
                success: true,
                data: account,
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

    // Get cash account balance
    router.get('/:id/balance', async (req: Request, res: Response) => {
        try {
            const balance = await supabaseService.getCashBalance(req.params.id);
            const response: ApiResponse<typeof balance> = {
                success: true,
                data: balance,
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

    // Create new cash account
    router.post('/', async (req: Request, res: Response) => {
        try {
            const account = await supabaseService.createCashAccount(req.body);
            const response: ApiResponse<typeof account> = {
                success: true,
                data: account,
                message: 'Cash account created successfully',
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

    // Update cash account
    router.put('/:id', async (req: Request, res: Response) => {
        try {
            const account = await supabaseService.updateCashAccount(req.params.id, req.body);
            if (!account) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Cash account not found',
                };
                return res.status(404).json(response);
            }
            const response: ApiResponse<typeof account> = {
                success: true,
                data: account,
                message: 'Cash account updated successfully',
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

    // Delete cash account
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            const success = await supabaseService.deleteCashAccount(req.params.id);
            if (!success) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Failed to delete cash account',
                };
                return res.status(500).json(response);
            }
            const response: ApiResponse<{ message: string }> = {
                success: true,
                data: { message: 'Cash account deleted successfully' },
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
