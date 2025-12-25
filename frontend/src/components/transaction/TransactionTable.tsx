import { Transaction, Portfolio, CashAccount } from '@/types/models';

interface TransactionTableProps {
    transactions: Transaction[];
    portfolios: (Portfolio | CashAccount)[];
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

export default function TransactionTable({ transactions, portfolios, loading = false }: TransactionTableProps) {
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

    const getPortfolioName = (transaction: Transaction) => {
        const portfolioId = transaction.portfolio_id || transaction.cash_account_id;
        const portfolio = portfolios.find(p =>
            ('portfolio_id' in p ? p.portfolio_id : p.cash_account_id) === portfolioId
        );
        return portfolio?.name || 'Unknown';
    };

    const getAmountColor = (transaction: Transaction) => {
        if (transaction.type === 'DEPOSIT' || transaction.type === 'SELL') {
            return 'text-emerald-400';
        }
        if (transaction.type === 'WITHDRAW' || transaction.type === 'BUY' || transaction.type === 'FEE') {
            return 'text-red-400';
        }
        return 'text-slate-300';
    };

    const getAmountPrefix = (transaction: Transaction) => {
        if (transaction.type === 'DEPOSIT' || transaction.type === 'SELL') {
            return '+';
        }
        if (transaction.type === 'WITHDRAW' || transaction.type === 'BUY' || transaction.type === 'FEE') {
            return '-';
        }
        return '';
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Portfolio
                            </th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Asset / Description
                            </th>
                            <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Amount
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
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-xs font-medium text-slate-300">
                                            {getPortfolioName(transaction).charAt(0)}
                                        </div>
                                        <span className="text-sm text-slate-300">{getPortfolioName(transaction)}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${transactionTypeColors[transaction.type] || transactionTypeColors.FEE
                                        }`}>
                                        {transaction.type}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-sm text-slate-400">
                                    {transaction.description || '-'}
                                </td>
                                <td className={`py-4 px-6 text-sm font-semibold text-right ${getAmountColor(transaction)}`}>
                                    {getAmountPrefix(transaction)}${Math.abs(transaction.amount).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Table Footer */}
            <div className="border-t border-slate-700 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                    Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                </div>
            </div>
        </div>
    );
}
