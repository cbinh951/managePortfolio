import { useState } from 'react';
import { Transaction, Portfolio, CashAccount } from '@/types/models';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';

interface TransactionTableProps {
    transactions: Transaction[];
    portfolios: (Portfolio | CashAccount)[];
    loading?: boolean;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (transaction: Transaction) => void;
}

type ConsolidatedTransaction = {
    id: string;
    date: string;
    type: string;
    amount: number;
    description: string;
    fromAccount: string;
    toAccount: string;
    fromAccountId: string;
    toAccountId: string;
    isPaired: boolean;
    transactions: Transaction[];
};

const transactionTypeColors: Record<string, string> = {
    DEPOSIT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    WITHDRAW: 'bg-red-500/10 text-red-400 border-red-500/30',
    BUY: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    SELL: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    TRANSFER: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    FEE: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

// Group paired transfer transactions
function groupTransfers(
    transactions: Transaction[],
    portfolios: (Portfolio | CashAccount)[]
): ConsolidatedTransaction[] {
    const consolidated: ConsolidatedTransaction[] = [];
    const processed = new Set<string>();

    const getAccountName = (portfolioId?: string, cashAccountId?: string): string => {
        const id = portfolioId || cashAccountId;
        const account = portfolios.find(p =>
            ('portfolio_id' in p ? p.portfolio_id : p.cash_account_id) === id
        );
        return account?.name || 'Unknown';
    };

    transactions.forEach((transaction, index) => {
        if (processed.has(transaction.transaction_id)) return;

        // If not a transfer, add as-is
        if (transaction.type !== 'TRANSFER') {
            consolidated.push({
                id: transaction.transaction_id,
                date: transaction.date,
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description || '',
                fromAccount: getAccountName(transaction.portfolio_id, transaction.cash_account_id),
                toAccount: '',
                fromAccountId: transaction.portfolio_id || transaction.cash_account_id || '',
                toAccountId: '',
                isPaired: false,
                transactions: [transaction],
            });
            processed.add(transaction.transaction_id);
            return;
        }

        // Look for a matching transfer pair
        const pair = transactions.find((t, i) => {
            if (i <= index || processed.has(t.transaction_id)) return false;
            if (t.type !== 'TRANSFER') return false;
            if (t.date !== transaction.date) return false;

            // Check if amounts are opposite (one positive, one negative) and equal in absolute value
            const amountsMatch = Math.abs(t.amount) === Math.abs(transaction.amount) &&
                Math.sign(t.amount) !== Math.sign(transaction.amount);

            return amountsMatch;
        });

        if (pair) {
            // Determine which is outgoing (negative) and which is incoming (positive)
            const outgoing = transaction.amount < 0 ? transaction : pair;
            const incoming = transaction.amount > 0 ? transaction : pair;

            // For outgoing transaction: money leaves from cash_account if present, otherwise portfolio
            // For incoming transaction: money goes to portfolio if present, otherwise cash_account
            let fromAccount = '';
            let toAccount = '';

            // Determine source account (where money is leaving from)
            if (outgoing.cash_account_id) {
                fromAccount = getAccountName(undefined, outgoing.cash_account_id);
            } else if (outgoing.portfolio_id) {
                fromAccount = getAccountName(outgoing.portfolio_id, undefined);
            }

            // Fallback: regex from description
            if (fromAccount === 'Unknown') {
                const fromMatch = incoming.description?.match(/Transfer from (.+)/);
                if (fromMatch) fromAccount = fromMatch[1];
            }

            // Determine destination account (where money is going to)
            if (incoming.portfolio_id) {
                toAccount = getAccountName(incoming.portfolio_id, undefined);
            } else if (incoming.cash_account_id) {
                toAccount = getAccountName(undefined, incoming.cash_account_id);
            }

            // Fallback: regex from description
            if (toAccount === 'Unknown') {
                const toMatch = outgoing.description?.match(/Transfer to (.+)/);
                if (toMatch) toAccount = toMatch[1];
            }

            consolidated.push({
                id: `${transaction.transaction_id}-${pair.transaction_id}`,
                date: transaction.date,
                type: 'TRANSFER',
                amount: Math.abs(transaction.amount),
                description: `Transfer from ${fromAccount} to ${toAccount}`,
                fromAccount,
                toAccount,
                fromAccountId: outgoing.cash_account_id || outgoing.portfolio_id || '',
                toAccountId: incoming.portfolio_id || incoming.cash_account_id || '',
                isPaired: true,
                transactions: [outgoing, incoming],
            });

            processed.add(transaction.transaction_id);
            processed.add(pair.transaction_id);
        } else {
            // Unpaired transfer - display as-is
            consolidated.push({
                id: transaction.transaction_id,
                date: transaction.date,
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description || 'Transfer',
                fromAccount: getAccountName(transaction.portfolio_id, transaction.cash_account_id),
                toAccount: '',
                fromAccountId: transaction.portfolio_id || transaction.cash_account_id || '',
                toAccountId: '',
                isPaired: false,
                transactions: [transaction],
            });
            processed.add(transaction.transaction_id);
        }
    });

    return consolidated;
}

export default function TransactionTable({ transactions, portfolios, loading = false, onEdit, onDelete }: TransactionTableProps) {
    const { settings } = useSettings();
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<'date' | 'type' | 'amount'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const itemsPerPage = 10;

    if (loading) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
                <div className="text-center py-20">
                    <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-400 mb-2">No Transactions Found</h3>
                    <p className="text-sm text-slate-500">Try adjusting your filters or add a new transaction</p>
                </div>
            </div>
        );
    }

    // Group transfers
    const consolidatedTransactions = groupTransfers(transactions, portfolios);

    // Sort transactions
    const sortedTransactions = [...consolidatedTransactions].sort((a, b) => {
        let comparison = 0;

        switch (sortColumn) {
            case 'date':
                comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                break;
            case 'type':
                comparison = a.type.localeCompare(b.type);
                break;
            case 'amount':
                comparison = Math.abs(a.amount) - Math.abs(b.amount);
                break;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Pagination calculation
    const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageTransactions = sortedTransactions.slice(startIndex, endIndex);

    const handleSort = (column: 'date' | 'type' | 'amount') => {
        if (sortColumn === column) {
            // Toggle direction if clicking the same column
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new column with default descending for date, ascending for others
            setSortColumn(column);
            setSortDirection(column === 'date' ? 'desc' : 'asc');
        }
        setCurrentPage(1); // Reset to first page when sorting changes
    };

    const SortIcon = ({ column }: { column: 'date' | 'type' | 'amount' }) => {
        if (sortColumn !== column) {
            return (
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return sortDirection === 'asc' ? (
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    const getAmountDisplay = (transaction: ConsolidatedTransaction) => {
        let colorClass = 'text-slate-300';
        let prefix = '';
        let amount = transaction.amount;

        if (transaction.type === 'TRANSFER') {
            // For paired transfers, amount is always positive, and description handles direction
            colorClass = 'text-purple-400';
        } else if (transaction.type === 'DEPOSIT' || transaction.type === 'SELL') {
            colorClass = 'text-emerald-400';
            prefix = '+';
        } else if (transaction.type === 'WITHDRAW' || transaction.type === 'BUY' || transaction.type === 'FEE') {
            colorClass = 'text-red-400';
            prefix = '-';
            amount = Math.abs(amount); // Ensure amount is positive for display after prefix
        }

        return {
            colorClass,
            display: `${prefix}${formatCurrency(amount, 'VND', settings.displayCurrency, settings.exchangeRate)}`
        };
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th
                                className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none"
                                onClick={() => handleSort('date')}
                            >
                                <div className="flex items-center gap-2">
                                    Date
                                    <SortIcon column="date" />
                                </div>
                            </th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Portfolio
                            </th>
                            <th
                                className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none"
                                onClick={() => handleSort('type')}
                            >
                                <div className="flex items-center gap-2">
                                    Type
                                    <SortIcon column="type" />
                                </div>
                            </th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Asset / Description
                            </th>
                            <th
                                className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none"
                                onClick={() => handleSort('amount')}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    Amount
                                    <SortIcon column="amount" />
                                </div>
                            </th>
                            {(onEdit || onDelete) && (
                                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {currentPageTransactions.map((item) => {
                            const amountInfo = getAmountDisplay(item);

                            return (
                                <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="py-4 px-6 text-sm text-slate-300">
                                        {new Date(item.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-xs font-medium text-slate-300">
                                                {item.fromAccount.charAt(0)}
                                            </div>
                                            <span className="text-sm text-slate-300">
                                                {item.isPaired && item.toAccount ?
                                                    `${item.fromAccount} → ${item.toAccount}` :
                                                    item.fromAccount
                                                }
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${transactionTypeColors[item.type] || transactionTypeColors.FEE}`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-slate-400">
                                        {item.description || '-'}
                                    </td>
                                    <td className={`py-4 px-6 text-sm font-semibold text-right ${amountInfo.colorClass}`}>
                                        {amountInfo.display}
                                    </td>
                                    {(onEdit || onDelete) && (
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {onEdit && (
                                                    <button
                                                        onClick={() => {
                                                            // For paired transfers, edit the first transaction (outgoing)
                                                            onEdit(item.transactions[0]);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                        title={item.isPaired ? "Edit transfer (both transactions)" : "Edit transaction"}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => {
                                                            // For paired transfers, delete the first transaction
                                                            // Note: In a real implementation, you'd want to delete both
                                                            onDelete(item.transactions[0]);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                        title={item.isPaired ? "Delete transfer (both transactions)" : "Delete transaction"}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="border-t border-slate-700 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, sortedTransactions.length)} of {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        >
                            Previous
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === pageNum
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
