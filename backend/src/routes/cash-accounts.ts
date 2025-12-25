import express, { Router, Request, Response } from 'express';
import { CashService } from '../services/cash-service';
import { CsvService } from '../services/csv-service';
import { ApiResponse, CreateCashAccountRequest } from '../types/api';

export function createCashAccountRoutes(csvService: CsvService): Router {
    const router = express.Router();
    const cashService = new CashService(csvService);

    // Get all cash accounts
    router.get('/', async (req: Request, res: Response) => {
        try {
            const accounts = await cashService.getAllCashAccounts();
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
            const account = await cashService.getCashAccountById(req.params.id);
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
            const balance = await cashService.getCashAccountBalance(req.params.id);
            if (!balance) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Cash account not found',
                };
                return res.status(404).json(response);
            }
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
            const data: CreateCashAccountRequest = req.body;
            const account = await cashService.createCashAccount(data);
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
            const { id } = req.params;
            const updates = req.body;

            // Read all cash accounts
            const accounts = await csvService.readCsv<any>('cash_accounts.csv');
            const accountIndex = accounts.findIndex((acc: any) => acc.cash_account_id === id);

            if (accountIndex === -1) {
                const response: ApiResponse<null> = {
                    success: false,
                    error: 'Cash account not found',
                };
                return res.status(404).json(response);
            }

            // Update account
            const updatedAccount = { ...accounts[accountIndex], ...updates };
            accounts[accountIndex] = updatedAccount;

            // Write back to CSV
            await csvService.writeCsv('cash_accounts.csv', accounts, [
                { id: 'cash_account_id', title: 'cash_account_id' },
                { id: 'name', title: 'name' },
                { id: 'platform_id', title: 'platform_id' },
                { id: 'currency', title: 'currency' },
            ]);

            const response: ApiResponse<typeof updatedAccount> = {
                success: true,
                data: updatedAccount,
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

    return router;
}
