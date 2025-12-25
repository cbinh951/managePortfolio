import express, { Router, Request, Response } from 'express';
import { CsvService } from '../services/csv-service';
import { Transaction } from '../types/models';
import { ApiResponse, CreateTransactionRequest } from '../types/api';

export function createTransactionRoutes(csvService: CsvService): Router {
    const router = express.Router();

    // Get all transactions
    router.get('/', async (req: Request, res: Response) => {
        try {
            const transactions = await csvService.readCsv<Transaction>('transactions.csv');
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
            const allTransactions = await csvService.readCsv<Transaction>('transactions.csv');
            const transactions = allTransactions.filter(
                t => t.portfolio_id === req.params.portfolioId
            );
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
            const allTransactions = await csvService.readCsv<Transaction>('transactions.csv');
            const transactions = allTransactions.filter(
                t => t.cash_account_id === req.params.cashAccountId
            );
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
            const data: CreateTransactionRequest = req.body;
            const transaction: Transaction = {
                transaction_id: csvService.generateId('T'),
                date: data.date,
                type: data.type as any,
                amount: data.amount,
                portfolio_id: data.portfolio_id,
                cash_account_id: data.cash_account_id,
                description: data.description,
            };

            await csvService.appendCsv('transactions.csv', transaction, [
                { id: 'transaction_id', title: 'transaction_id' },
                { id: 'date', title: 'date' },
                { id: 'type', title: 'type' },
                { id: 'amount', title: 'amount' },
                { id: 'portfolio_id', title: 'portfolio_id' },
                { id: 'cash_account_id', title: 'cash_account_id' },
                { id: 'description', title: 'description' },
            ]);

            const response: ApiResponse<typeof transaction> = {
                success: true,
                data: transaction,
                message: 'Transaction created successfully',
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
