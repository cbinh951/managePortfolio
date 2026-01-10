'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { useSettings } from '@/contexts/SettingsContext';
import DatePicker from '@/components/common/DatePicker';

interface AddTransactionModalProps {
    isOpen: boolean;
    portfolioId: string;
    cashAccountId?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddTransactionModal({
    isOpen,
    portfolioId,
    cashAccountId,
    onClose,
    onSuccess
}: AddTransactionModalProps) {
    const { settings } = useSettings();
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'DEPOSIT',
        amount: '',
        description: '',
        gold_type: 'BRANDED',
        quantity_chi: '',
        unit_price: '',
    });
    const [displayAmount, setDisplayAmount] = useState('');
    const [isGoldPortfolio, setIsGoldPortfolio] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Remove all non-digit characters
        const cleanValue = value.replace(/[^\d]/g, '');

        // Update the actual value (numeric)
        setFormData(prev => ({ ...prev, amount: cleanValue }));

        // Update display value with formatting
        if (cleanValue) {
            const formatted = parseInt(cleanValue).toLocaleString();
            setDisplayAmount(formatted);
        } else {
            setDisplayAmount('');
        }
    };



    // Calculate unit price when quantity changes
    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, quantity_chi: value };

            // Recalculate unit price if amount exists
            if (value && parseFloat(value) > 0 && prev.amount) {
                const unitPrice = parseFloat(prev.amount) / parseFloat(value);
                newState.unit_price = unitPrice.toFixed(0);
            }
            return newState;
        });
    };

    // Detect if portfolio is Gold type
    useEffect(() => {
        const checkPortfolioType = async () => {
            if (!portfolioId) return;
            try {
                const [portfolio, assets] = await Promise.all([
                    apiClient.getPortfolio(portfolioId),
                    apiClient.getAssets()
                ]);
                const asset = assets.find(a => a.asset_id === portfolio.asset_id);
                if (asset && asset.asset_type === 'GOLD') {
                    setIsGoldPortfolio(true);
                } else {
                    setIsGoldPortfolio(false);
                }
            } catch (err) {
                console.error('Failed to fetch portfolio details:', err);
            }
        };

        if (isOpen) {
            checkPortfolioType();
        }
    }, [isOpen, portfolioId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.date) {
            setError('Transaction date is required');
            return;
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError('Amount must be greater than 0');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await apiClient.createTransaction({
                date: formData.date,
                type: formData.type,
                amount: parseFloat(formData.amount),
                portfolio_id: portfolioId || undefined,
                cash_account_id: cashAccountId || undefined,
                description: formData.description,
                ...(isGoldPortfolio ? {
                    gold_type: formData.gold_type,
                    quantity_chi: formData.quantity_chi ? parseFloat(formData.quantity_chi) : undefined,
                    unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined
                } : {})
            });

            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                type: 'DEPOSIT',
                amount: '',
                description: '',
                gold_type: 'BRANDED',
                quantity_chi: '',
                unit_price: '',
            });
            setDisplayAmount('');

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create transaction');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            type: 'DEPOSIT',
            amount: '',
            description: '',
            gold_type: 'BRANDED',
            quantity_chi: '',
            unit_price: '',
        });
        setDisplayAmount('');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700">
                {/* Header */}
                <div className="border-b border-slate-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Add Transaction</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Record a new financial transaction
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
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
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Gold Type Warning/Badge */}
                    {isGoldPortfolio && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Gold Transaction
                        </div>
                    )}

                    {/* Date & Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-2">
                                Date <span className="text-red-400">*</span>
                            </label>
                            <DatePicker
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-2">
                                Type <span className="text-red-400">*</span>
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                            >
                                <option value="DEPOSIT">Deposit</option>
                                <option value="WITHDRAW">Withdrawal</option>
                                {!isGoldPortfolio && <option value="TRANSFER">Transfer</option>}
                                <option value="BUY">Buy</option>
                                <option value="SELL">Sell</option>
                                {!isGoldPortfolio && <option value="DIVIDEND">Dividend</option>}
                            </select>
                        </div>
                    </div>

                    {/* Gold Specific Fields */}
                    {isGoldPortfolio && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="gold_type" className="block text-sm font-medium text-slate-300 mb-2">
                                    Gold Type <span className="text-red-400">*</span>
                                </label>
                                <select
                                    id="gold_type"
                                    name="gold_type"
                                    value={formData.gold_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={loading}
                                >
                                    <option value="BRANDED">Branded (SJC/PNJ)</option>
                                    <option value="PRIVATE">Private Gold</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="quantity_chi" className="block text-sm font-medium text-slate-300 mb-2">
                                    Quantity (Chỉ) <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="quantity_chi"
                                    name="quantity_chi"
                                    value={formData.quantity_chi}
                                    onChange={handleQuantityChange}
                                    placeholder="0.0"
                                    step="0.1"
                                    min="0"
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
                            Amount <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{settings.displayCurrency === 'USD' ? '$' : '₫'}</span>
                            <input
                                type="text"
                                id="amount"
                                name="amount"
                                value={displayAmount}
                                onChange={handleAmountChange}
                                placeholder="0"
                                className="w-full pl-8 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                            />
                        </div>
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
                            rows={3}
                            placeholder="Add notes about this transaction..."
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            disabled={loading}
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="border-t border-slate-700 px-6 py-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Adding...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Transaction
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
