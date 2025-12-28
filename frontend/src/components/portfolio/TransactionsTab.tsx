import { Transaction, Portfolio, CashAccount } from '@/types/models';
import TransactionTable from '@/components/transaction/TransactionTable';

interface TransactionsTabProps {
    transactions: Transaction[];
    entity: Portfolio | CashAccount;
    loading?: boolean;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (transaction: Transaction) => void;
    onAddTransaction?: () => void;
}

export default function TransactionsTab({ transactions, entity, loading = false, onEdit, onDelete, onAddTransaction }: TransactionsTabProps) {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Transaction History</h3>
                {onAddTransaction && (
                    <button
                        onClick={onAddTransaction}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Transaction
                    </button>
                )}
            </div>

            {/* Table */}
            <TransactionTable
                transactions={transactions}
                portfolios={[entity]}
                loading={loading}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </div>
    );
}
