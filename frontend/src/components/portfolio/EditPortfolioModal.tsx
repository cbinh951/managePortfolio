'use client';

import { useState, useEffect } from 'react';
import { Portfolio, Platform, Strategy, CashAccount } from '@/types/models';
import { apiClient } from '@/services/api';

interface EditPortfolioModalProps {
    isOpen: boolean;
    portfolio: Portfolio | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditPortfolioModal({ isOpen, portfolio, onClose, onSuccess }: EditPortfolioModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        platform_id: '',
        strategy_id: '',
        currency: 'VND', // For cash accounts
    });

    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Detect if this is a cash account by ID prefix
    const isCashAccount = portfolio?.portfolio_id.startsWith('CA') || false;

    useEffect(() => {
        if (isOpen && portfolio) {
            loadData();
        }
    }, [isOpen, portfolio]);

    const loadData = async () => {
        if (!portfolio) return;

        try {
            setLoadingData(true);

            if (isCashAccount) {
                // Load cash account data
                const [cashAccountData, platformsData] = await Promise.all([
                    apiClient.getCashAccount(portfolio.portfolio_id),
                    apiClient.getPlatforms(),
                ]);

                setFormData({
                    name: cashAccountData.name,
                    platform_id: cashAccountData.platform_id,
                    strategy_id: '',
                    currency: cashAccountData.currency,
                });

                // Filter platforms to only show BANK and WALLET
                const cashPlatforms = platformsData.filter(
                    p => p.platform_type === 'BANK' || p.platform_type === 'WALLET'
                );
                setPlatforms(cashPlatforms);
            } else {
                // Load portfolio data
                setFormData({
                    name: portfolio.name,
                    platform_id: portfolio.platform_id,
                    strategy_id: portfolio.strategy_id,
                    currency: 'VND',
                });

                const [platformsData, strategiesData] = await Promise.all([
                    apiClient.getPlatforms(),
                    apiClient.getStrategies(),
                ]);
                setPlatforms(platformsData);
                setStrategies(strategiesData);
            }
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoadingData(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!portfolio) return;

        if (!formData.name.trim()) {
            setError(`${isCashAccount ? 'Account' : 'Portfolio'} name is required`);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            if (isCashAccount) {
                // Update cash account
                await apiClient.updateCashAccount(portfolio.portfolio_id, {
                    name: formData.name,
                    platform_id: formData.platform_id,
                    currency: formData.currency,
                });
            } else {
                // Update portfolio
                await apiClient.updatePortfolio(portfolio.portfolio_id, {
                    name: formData.name,
                    platform_id: formData.platform_id,
                    strategy_id: formData.strategy_id,
                });
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update portfolio');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: '', platform_id: '', strategy_id: '' });
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {isCashAccount ? 'Edit Cash Account' : 'Edit Portfolio'}
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {isCashAccount
                                    ? 'Update cash account details'
                                    : 'Update portfolio details and settings'
                                }
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
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                            {/* Account/Portfolio Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                                    {isCashAccount ? 'Account Name' : 'Portfolio Name'} <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder={isCashAccount ? "e.g. Main Checking Account" : "e.g. Retirement Fund 2050"}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={loading}
                                />
                            </div>

                            {/* Platform & Strategy/Currency */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="platform_id" className="block text-sm font-medium text-slate-300 mb-2">
                                        Platform <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        id="platform_id"
                                        name="platform_id"
                                        value={formData.platform_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={loading}
                                    >
                                        {platforms.map(platform => (
                                            <option key={platform.platform_id} value={platform.platform_id}>
                                                {platform.platform_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {isCashAccount ? (
                                    <div>
                                        <label htmlFor="currency" className="block text-sm font-medium text-slate-300 mb-2">
                                            Currency <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            id="currency"
                                            name="currency"
                                            value={formData.currency}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={loading}
                                        >
                                            <option value="VND">VND - Vietnamese Dong</option>
                                            <option value="USD">USD - US Dollar</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label htmlFor="strategy_id" className="block text-sm font-medium text-slate-300 mb-2">
                                            Strategy <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            id="strategy_id"
                                            name="strategy_id"
                                            value={formData.strategy_id}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={loading}
                                        >
                                            {strategies.map(strategy => (
                                                <option key={strategy.strategy_id} value={strategy.strategy_id}>
                                                    {strategy.strategy_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </form>

                {/* Footer */}
                <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 px-6 py-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
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
                                Updating...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
