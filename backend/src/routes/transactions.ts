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
            const data: CreateTransactionRequest & {
                gold_type?: any;
                quantity_chi?: number;
                unit_price?: number;
            } = req.body;

            const transaction: Transaction = {
                transaction_id: csvService.generateId('T'),
                date: data.date,
                type: data.type as any,
                amount: data.amount,
                portfolio_id: data.portfolio_id,
                cash_account_id: data.cash_account_id,
                description: data.description,
                gold_type: data.gold_type,
                quantity_chi: data.quantity_chi,
                unit_price: data.unit_price,
            };

            await csvService.appendCsv('transactions.csv', transaction, [
                { id: 'transaction_id', title: 'transaction_id' },
                { id: 'date', title: 'date' },
                { id: 'type', title: 'type' },
                { id: 'amount', title: 'amount' },
                { id: 'portfolio_id', title: 'portfolio_id' },
                { id: 'cash_account_id', title: 'cash_account_id' },
                { id: 'description', title: 'description' },
                { id: 'gold_type', title: 'gold_type' },
                { id: 'quantity_chi', title: 'quantity_chi' },
                { id: 'unit_price', title: 'unit_price' },
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

    // Update transaction
    router.put('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const transactions = await csvService.readCsv<Transaction>('transactions.csv');
            const index = transactions.findIndex(t => t.transaction_id === id);

            if (index === -1) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Transaction not found',
                };
                return res.status(404).json(response);
            }

            // Update transaction with new data
            transactions[index] = {
                ...transactions[index],
                ...updateData,
                transaction_id: id, // Ensure ID doesn't change
            };

            await csvService.writeCsv('transactions.csv', transactions, [
                { id: 'transaction_id', title: 'transaction_id' },
                { id: 'date', title: 'date' },
                { id: 'type', title: 'type' },
                { id: 'amount', title: 'amount' },
                { id: 'portfolio_id', title: 'portfolio_id' },
                { id: 'cash_account_id', title: 'cash_account_id' },
                { id: 'description', title: 'description' },
                { id: 'gold_type', title: 'gold_type' },
                { id: 'quantity_chi', title: 'quantity_chi' },
                { id: 'unit_price', title: 'unit_price' },
            ]);

            const response: ApiResponse<typeof transactions[number]> = {
                success: true,
                data: transactions[index],
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
            const { id } = req.params;

            const transactions = await csvService.readCsv<Transaction>('transactions.csv');
            const index = transactions.findIndex(t => t.transaction_id === id);

            if (index === -1) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Transaction not found',
                };
                return res.status(404).json(response);
            }

            // Remove transaction
            transactions.splice(index, 1);

            await csvService.writeCsv('transactions.csv', transactions, [
                { id: 'transaction_id', title: 'transaction_id' },
                { id: 'date', title: 'date' },
                { id: 'type', title: 'type' },
                { id: 'amount', title: 'amount' },
                { id: 'portfolio_id', title: 'portfolio_id' },
                { id: 'cash_account_id', title: 'cash_account_id' },
                { id: 'description', title: 'description' },
                { id: 'gold_type', title: 'gold_type' },
                { id: 'quantity_chi', title: 'quantity_chi' },
                { id: 'unit_price', title: 'unit_price' },
            ]);

            const response: ApiResponse<{ message: string }> = {
                success: true,
                data: { message: 'Transaction deleted successfully' },
                message: 'Transaction deleted successfully',
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
