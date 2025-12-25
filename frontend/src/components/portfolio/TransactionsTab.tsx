import { Transaction } from '@/types/models';

interface TransactionsTabProps {
    transactions: Transaction[];
    loading?: boolean;
}

const transactionTypeColors: Record<string, string> = {
    DEPOSIT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    WITHDRAW: 'bg-red-500/10 text-red-400 border-red-500/30',
    BUY: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    SELL: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    TRANSFER: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    FEE: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

export default function TransactionsTab({ transactions, loading = false }: TransactionsTabProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-20">
                <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-slate-400 mb-2">No Transactions Yet</h3>
                <p className="text-sm text-slate-500">Start by adding your first transaction</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Transaction History</h3>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Transaction
                </button>
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Description
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {transactions.map((transaction) => (
                                <tr key={transaction.transaction_id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="py-4 px-6 text-sm text-slate-300">
                                        {new Date(transaction.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${transactionTypeColors[transaction.type] || transactionTypeColors.FEE
                                            }`}>
                                            {transaction.type}
                                        </span>
                                    </td>
                                    <td className={`py-4 px-6 text-sm font-semibold text-right ${transaction.type === 'DEPOSIT' || transaction.type === 'SELL'
                                            ? 'text-emerald-400'
                                            : transaction.type === 'WITHDRAW' || transaction.type === 'BUY' || transaction.type === 'FEE'
                                                ? 'text-red-400'
                                                : 'text-slate-300'
                                        }`}>
                                        {transaction.type === 'DEPOSIT' || transaction.type === 'SELL' ? '+' : '-'}
                                        ${Math.abs(transaction.amount).toLocaleString()}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-slate-400">
                                        {transaction.description || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
