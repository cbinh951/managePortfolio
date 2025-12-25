'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api';
import { CashAccount, Portfolio } from '@/types/models';

interface AccountWithBalance extends CashAccount {
    balance: number;
}

interface TransferFormData {
    fromAccountId: string;
    toPortfolioId: string;
    amount: string;
    date: string;
    description: string;
}

export default function TransferPage() {
    const router = useRouter();
    const [cashAccounts, setCashAccounts] = useState<AccountWithBalance[]>([]);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<TransferFormData>({
        fromAccountId: '',
        toPortfolioId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [accounts, portfolioList, dashboardData] = await Promise.all([
                apiClient.getCashAccounts(),
                apiClient.getPortfolios(),
                apiClient.getDashboard(),
            ]);

            // Combine cash accounts with balances
            const accountsWithBalances: AccountWithBalance[] = accounts.map(account => {
                const balance = dashboardData.cash_accounts.find(
                    ca => ca.cash_account_id === account.cash_account_id
                )?.balance || 0;
                return { ...account, balance };
            });

            setCashAccounts(accountsWithBalances);
            setPortfolios(portfolioList);
        } catch (err) {
            setError('Failed to load accounts and portfolios');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const selectedAccount = cashAccounts.find(acc => acc.cash_account_id === formData.fromAccountId);
    const selectedPortfolio = portfolios.find(p => p.portfolio_id === formData.toPortfolioId);
    const availableBalance = selectedAccount?.balance || 0;
    const transferAmount = parseFloat(formData.amount) || 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleQuickSelect = (percentage: number) => {
        if (selectedAccount) {
            const amount = (availableBalance * percentage).toFixed(2);
            setFormData(prev => ({ ...prev, amount }));
        }
    };

    const validateForm = (): string | null => {
        if (!formData.fromAccountId) {
            return 'Please select a source account';
        }
        if (!formData.toPortfolioId) {
            return 'Please select a destination portfolio';
        }
        if (!formData.amount || transferAmount <= 0) {
            return 'Amount must be greater than $0';
        }
        if (transferAmount > availableBalance) {
            return `Insufficient balance. Available: $${availableBalance.toLocaleString()}`;
        }
        if (!formData.date) {
            return 'Please select a transfer date';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // Create withdrawal transaction from cash account
            await apiClient.createTransaction({
                date: formData.date,
                type: 'TRANSFER',
                amount: -transferAmount, // Negative for withdrawal
                cash_account_id: formData.fromAccountId,
                portfolio_id: formData.toPortfolioId,
                description: formData.description || `Transfer to ${selectedPortfolio?.name}`,
            });

            // Create deposit transaction to portfolio
            await apiClient.createTransaction({
                date: formData.date,
                type: 'TRANSFER',
                amount: transferAmount, // Positive for deposit
                portfolio_id: formData.toPortfolioId,
                cash_account_id: formData.fromAccountId,
                description: formData.description || `Transfer from ${selectedAccount?.name}`,
            });

            // Success - redirect to transactions page
            router.push('/transactions?success=transfer');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process transfer');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-4xl font-bold text-white mb-2">Transfer Funds</h1>
                    <p className="text-slate-400">Move cash securely to your investment portfolios</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Transfer Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* From Account */}
                            <div>
                                <label htmlFor="fromAccountId" className="block text-sm font-medium text-slate-300 mb-2">
                                    From Account <span className="text-red-400">*</span>
                                </label>
                                <select
                                    id="fromAccountId"
                                    name="fromAccountId"
                                    value={formData.fromAccountId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={submitting}
                                >
                                    <option value="">Select cash account</option>
                                    {cashAccounts.map(account => (
                                        <option key={account.cash_account_id} value={account.cash_account_id}>
                                            {account.name} - Available: ${account.balance.toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                                {selectedAccount && (
                                    <p className="text-xs text-emerald-400 mt-1">
                                        Available: ${availableBalance.toLocaleString()}
                                    </p>
                                )}
                            </div>

                            {/* To Portfolio */}
                            <div>
                                <label htmlFor="toPortfolioId" className="block text-sm font-medium text-slate-300 mb-2">
                                    To Portfolio <span className="text-red-400">*</span>
                                </label>
                                <select
                                    id="toPortfolioId"
                                    name="toPortfolioId"
                                    value={formData.toPortfolioId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={submitting}
                                >
                                    <option value="">Select investment portfolio</option>
                                    {portfolios.map(portfolio => (
                                        <option key={portfolio.portfolio_id} value={portfolio.portfolio_id}>
                                            {portfolio.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
                                    Amount <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input
                                        type="number"
                                        id="amount"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-lg font-semibold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={submitting}
                                    />
                                </div>

                                {/* Quick Select Buttons */}
                                {selectedAccount && (
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => handleQuickSelect(0.25)}
                                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded transition-colors"
                                            disabled={submitting}
                                        >
                                            25%
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickSelect(0.50)}
                                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded transition-colors"
                                            disabled={submitting}
                                        >
                                            50%
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickSelect(1.0)}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors font-medium"
                                            disabled={submitting}
                                        >
                                            MAX
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Transfer Date */}
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-2">
                                    Transfer Date <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={submitting}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                                    Description <span className="text-slate-500 text-xs">(Optional)</span>
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Add notes about this transfer..."
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    disabled={submitting}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        Processing Transfer...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                        Confirm Transfer
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Summary Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 sticky top-8">
                            <h2 className="text-lg font-bold text-white mb-4">Summary</h2>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Transfer Amount</span>
                                    <span className="text-white font-medium">
                                        ${transferAmount.toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Processing Fee</span>
                                    <span className="text-emerald-400 font-medium">Free</span>
                                </div>

                                <div className="border-t border-slate-700 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-300 font-medium">Total Debit</span>
                                        <span className="text-white font-bold text-lg">
                                            ${transferAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedAccount && selectedPortfolio && transferAmount > 0 && (
                                <div className="mt-6 pt-6 border-t border-slate-700 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">From:</span>
                                        <span className="text-slate-300">{selectedAccount.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">To:</span>
                                        <span className="text-slate-300">{selectedPortfolio.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Date:</span>
                                        <span className="text-slate-300">{formData.date}</span>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <div className="flex gap-2">
                                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xs text-blue-300">
                                        Transfers are instant. Your investment portfolio balance will be updated immediately.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
