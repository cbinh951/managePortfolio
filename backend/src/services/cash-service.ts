import { CsvService } from './csv-service';
import { CashAccount, Transaction, CashBalance } from '../types/models';
import { calculateCashBalance } from './calculation-service';

export class CashService {
    private csvService: CsvService;

    constructor(csvService: CsvService) {
        this.csvService = csvService;
    }

    async getAllCashAccounts(): Promise<CashAccount[]> {
        return this.csvService.readCsv<CashAccount>('cash_accounts.csv');
    }

    async getCashAccountById(id: string): Promise<CashAccount | null> {
        const accounts = await this.getAllCashAccounts();
        return accounts.find(a => a.cash_account_id === id) || null;
    }

    async createCashAccount(data: Omit<CashAccount, 'cash_account_id'>): Promise<CashAccount> {
        const account: CashAccount = {
            cash_account_id: this.csvService.generateId('CA'),
            ...data,
        };

        await this.csvService.appendCsv('cash_accounts.csv', account, [
            { id: 'cash_account_id', title: 'cash_account_id' },
            { id: 'name', title: 'name' },
            { id: 'platform_id', title: 'platform_id' },
            { id: 'currency', title: 'currency' },
        ]);

        return account;
    }

    async getCashAccountBalance(accountId: string): Promise<CashBalance | null> {
        const account = await this.getCashAccountById(accountId);
        if (!account) return null;

        const allTransactions = await this.csvService.readCsv<Transaction>('transactions.csv');
        const transactions = allTransactions
            .filter(t => {
                // Include DEPOSIT and WITHDRAW for this cash account
                if ((t.type === 'DEPOSIT' || t.type === 'WITHDRAW') && t.cash_account_id === accountId) {
                    return true;
                }
                // For TRANSFER: only include if this cash account is the source (negative amount)
                // This avoids double-counting paired transfers
                if (t.type === 'TRANSFER' && t.cash_account_id === accountId && t.amount < 0) {
                    return true;
                }
                return false;
            })
            .map(t => ({
                ...t,
                amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount
            }));

        const balance = calculateCashBalance(transactions);

        return {
            cash_account_id: accountId,
            balance,
        };
    }

    async getAllCashBalances(): Promise<CashBalance[]> {
        const accounts = await this.getAllCashAccounts();
        const balances: CashBalance[] = [];

        for (const account of accounts) {
            const balance = await this.getCashAccountBalance(account.cash_account_id);
            if (balance) {
                balances.push(balance);
            }
        }

        return balances;
    }

    async getTotalCash(): Promise<number> {
        const balances = await this.getAllCashBalances();
        return balances.reduce((sum, b) => sum + b.balance, 0);
    }
}
