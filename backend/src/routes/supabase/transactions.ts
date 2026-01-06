import express, { Router, Request, Response } from 'express';
import { supabaseService } from '../../services/supabase-service';
import { ApiResponse } from '../../types/api';

export function createSupabaseTransactionRoutes(): Router {
    const router = express.Router();

    // Get all transactions
    router.get('/', async (req: Request, res: Response) => {
        try {
            const transactions = await supabaseService.getAllTransactions();
            const response: ApiResponse<typeof transactions> = {
                success: true,
                data: transactions,
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

    // Get transactions by portfolio ID
    router.get('/portfolio/:portfolioId', async (req: Request, res: Response) => {
        try {
            const transactions = await supabaseService.getTransactionsByPortfolio(req.params.portfolioId);
            const response: ApiResponse<typeof transactions> = {
                success: true,
                data: transactions,
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

    // Get transactions by cash account ID
    router.get('/cash/:cashAccountId', async (req: Request, res: Response) => {
        try {
            const transactions = await supabaseService.getTransactionsByCashAccount(req.params.cashAccountId);
            const response: ApiResponse<typeof transactions> = {
                success: true,
                data: transactions,
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

    // Create new transaction
    router.post('/', async (req: Request, res: Response) => {
        try {
            console.log('Creating transaction with body:', JSON.stringify(req.body, null, 2));
            const transaction = await supabaseService.createTransaction(req.body);
            const response: ApiResponse<typeof transaction> = {
                success: true,
                data: transaction,
                message: 'Transaction created successfully',
            };
            res.status(201).json(response);
        } catch (error) {
            console.error('Error creating transaction:', error);
            const response: ApiResponse<null> = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            res.status(500).json(response);
        }
    });

    // Update transaction
    router.put('/:id', async (req: Request, res: Response) => {
        try {
            const transaction = await supabaseService.updateTransaction(req.params.id, req.body);
            if (!transaction) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Transaction not found',
                };
                return res.status(404).json(response);
            }
            const response: ApiResponse<typeof transaction> = {
                success: true,
                data: transaction,
                message: 'Transaction updated successfully',
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

    // Delete transaction
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            const success = await supabaseService.deleteTransaction(req.params.id);
            if (!success) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Failed to delete transaction',
                };
                return res.status(500).json(response);
            }
            const response: ApiResponse<{ message: string }> = {
                success: true,
                data: { message: 'Transaction deleted successfully' },
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
