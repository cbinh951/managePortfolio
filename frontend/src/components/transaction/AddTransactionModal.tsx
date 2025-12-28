'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Portfolio, CashAccount } from '@/types/models';
import { useSettings } from '@/contexts/SettingsContext';
import { getCurrencySymbol } from '@/utils/currencyUtils';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddTransactionModal({
    isOpen,
    onClose,
    onSuccess,
}: AddTransactionModalProps) {
    const { settings } = useSettings();
    // Form state
    const [formData, setFormData] = useState({
        transactionDirection: 'inflow', // 'inflow' or 'outflow'
        type: 'DEPOSIT',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        portfolio_id: '',
        cash_account_id: '',
        description: '',
    });

    // Master data
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [selectedAccountType, setSelectedAccountType] = useState<'portfolio' | 'cash'>('portfolio');

    // Load portfolios and cash accounts
    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            setLoadingData(true);
            const [portfoliosData, cashAccountsData] = await Promise.all([
                apiClient.getPortfolios(),
                apiClient.getCashAccounts(),
            ]);
            setPortfolios(portfoliosData);
            setCashAccounts(cashAccountsData);

            // Set default selection
            if (portfoliosData.length > 0) {
                setFormData(prev => ({ ...prev, portfolio_id: portfoliosData[0].portfolio_id }));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoadingData(false);
        }
    };

    const handleDirectionChange = (direction: 'inflow' | 'outflow') => {
        setFormData(prev => ({
            ...prev,
            transactionDirection: direction,
            type: direction === 'inflow' ? 'DEPOSIT' : 'WITHDRAW',
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Remove all non-digit characters except decimal point
        const numericValue = value.replace(/[^\d.]/g, '');

        // Prevent multiple decimal points
        const parts = numericValue.split('.');
        const formattedValue = parts.length > 2
            ? parts[0] + '.' + parts.slice(1).join('')
            : numericValue;

        setFormData(prev => ({ ...prev, amount: formattedValue }));
    };

    const formatAmountDisplay = (value: string): string => {
        if (!value) return '';

        const parts = value.split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1];

        // Add thousand separators to integer part
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        return decimalPart !== undefined
            ? `${formattedInteger}.${decimalPart}`
            : formattedInteger;
    };

    const handleAccountTypeChange = (type: 'portfolio' | 'cash') => {
        setSelectedAccountType(type);
        if (type === 'portfolio' && portfolios.length > 0) {
            setFormData(prev => ({
                ...prev,
                portfolio_id: portfolios[0].portfolio_id,
                cash_account_id: '',
            }));
        } else if (type === 'cash' && cashAccounts.length > 0) {
            setFormData(prev => ({
                ...prev,
                cash_account_id: cashAccounts[0].cash_account_id,
                portfolio_id: '',
            }));
        }
    };

    const validateForm = (): string | null => {
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            return 'Please enter a valid amount';
        }
        if (!formData.date) {
            return 'Please select a date';
        }
        if (!formData.portfolio_id && !formData.cash_account_id) {
            return 'Please select a portfolio or cash account';
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
            setLoading(true);
            setError(null);

            await apiClient.createTransaction({
                date: formData.date,
                type: formData.type,
                amount: parseFloat(formData.amount),
                portfolio_id: formData.portfolio_id || undefined,
                cash_account_id: formData.cash_account_id || undefined,
                description: formData.description || undefined,
            });

            // Reset form
            setFormData({
                transactionDirection: 'inflow',
                type: 'DEPOSIT',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                portfolio_id: portfolios.length > 0 ? portfolios[0].portfolio_id : '',
                cash_account_id: '',
                description: '',
            });
            setSelectedAccountType('portfolio');

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create transaction');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            transactionDirection: 'inflow',
            type: 'DEPOSIT',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            portfolio_id: portfolios.length > 0 ? portfolios[0].portfolio_id : '',
            cash_account_id: '',
            description: '',
        });
        setSelectedAccountType('portfolio');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    const inflowTypes = [
        { value: 'DEPOSIT', label: 'Deposit' },
        { value: 'SELL', label: 'Sell' },
    ];

    const outflowTypes = [
        { value: 'WITHDRAW', label: 'Withdraw' },
        { value: 'BUY', label: 'Buy' },
        { value: 'FEE', label: 'Fee' },
        { value: 'TRANSFER', label: 'Transfer' },
    ];

    const availableTypes = formData.transactionDirection === 'inflow' ? inflowTypes : outflowTypes;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">New Transaction</h2>
                        <button
                            onClick={handleCancel}
                            className="text-slate-400 hover:text-white transition-colors"
                            disabled={loading}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {loadingData ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Transaction Direction Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Transaction Direction
                                </label>
                                <div className="inline-flex rounded-lg bg-slate-800 p-1">
                                    <button
                                        type="button"
                                        onClick={() => handleDirectionChange('inflow')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.transactionDirection === 'inflow'
                                            ? 'bg-emerald-600 text-white'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Inflow (Deposit)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDirectionChange('outflow')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.transactionDirection === 'outflow'
                                            ? 'bg-red-600 text-white'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Outflow (Expense)
                                    </button>
                                </div>
                            </div>

                            {/* Amount and Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
                                        Amount <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{getCurrencySymbol(settings.displayCurrency)}</span>
                                        <input
                                            type="text"
                                            id="amount"
                                            name="amount"
                                            value={formatAmountDisplay(formData.amount)}
                                            onChange={handleAmountChange}
                                            placeholder="0"
                                            className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-2">
                                        Date <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        id="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Account Type Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Account Type
                                </label>
                                <div className="inline-flex rounded-lg bg-slate-800 p-1">
                                    <button
                                        type="button"
                                        onClick={() => handleAccountTypeChange('portfolio')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedAccountType === 'portfolio'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Portfolio
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAccountTypeChange('cash')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedAccountType === 'cash'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Cash Account
                                    </button>
                                </div>
                            </div>

                            {/* Portfolio/Cash Account and Transaction Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="account" className="block text-sm font-medium text-slate-300 mb-2">
                                        {selectedAccountType === 'portfolio' ? 'Portfolio' : 'Cash Account'} <span className="text-red-400">*</span>
                                    </label>
                                    {selectedAccountType === 'portfolio' ? (
                                        <select
                                            id="account"
                                            name="portfolio_id"
                                            value={formData.portfolio_id}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            disabled={loading}
                                        >
                                            {portfolios.map((portfolio) => (
                                                <option key={portfolio.portfolio_id} value={portfolio.portfolio_id}>
                                                    {portfolio.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <select
                                            id="account"
                                            name="cash_account_id"
                                            value={formData.cash_account_id}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            disabled={loading}
                                        >
                                            {cashAccounts.map((account) => (
                                                <option key={account.cash_account_id} value={account.cash_account_id}>
                                                    {account.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-2">
                                        Transaction Type
                                    </label>
                                    <select
                                        id="type"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        disabled={loading}
                                    >
                                        {availableTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Asset/Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                                    Asset / Description <span className="text-slate-500 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="e.g. Apple Stock, Grocery..."
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                />
                            </div>
                        </>
                    )}
                </form>

                {/* Footer */}
                <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 px-6 py-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || loadingData}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save Transaction
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
