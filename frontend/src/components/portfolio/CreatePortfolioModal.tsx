'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/services/api';
import { Asset, Platform, Strategy } from '@/types/models';

interface CreatePortfolioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreatePortfolioModal({
    isOpen,
    onClose,
    onSuccess,
}: CreatePortfolioModalProps) {
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        asset_id: '',
        platform_id: '',
        strategy_id: '',
        currency: 'VND',

        start_date: '',
        description: '',
    });

    // Master data
    const [assets, setAssets] = useState<Asset[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [strategies, setStrategies] = useState<Strategy[]>([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMasterData, setLoadingMasterData] = useState(true);

    // Load master data on mount
    useEffect(() => {
        if (isOpen) {
            loadMasterData();
        }
    }, [isOpen]);

    const loadMasterData = async () => {
        try {
            setLoadingMasterData(true);
            const [assetsData, platformsData, strategiesData] = await Promise.all([
                apiClient.getAssets(),
                apiClient.getPlatforms(),
                apiClient.getStrategies(),
            ]);
            setAssets(assetsData);
            setPlatforms(platformsData);
            setStrategies(strategiesData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load form data');
        } finally {
            setLoadingMasterData(false);
        }
    };

    // Filter platforms based on selected asset
    const filteredPlatforms = useMemo(() => {
        if (!formData.asset_id) return platforms;
        return platforms.filter(platform => platform.asset_id === formData.asset_id);
    }, [formData.asset_id, platforms]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        // If asset type changes, reset platform selection
        if (name === 'asset_id') {
            setFormData((prev) => ({ ...prev, [name]: value, platform_id: '' }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const validateForm = (): string | null => {
        if (!formData.name.trim()) return 'Portfolio name is required';
        if (!formData.asset_id) return 'Asset type is required';
        if (!formData.platform_id) return 'Platform is required';
        if (!formData.strategy_id) return 'Strategy is required';
        if (!formData.start_date) return 'Inception date is required';
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

            await apiClient.createPortfolio({
                name: formData.name,
                asset_id: formData.asset_id,
                platform_id: formData.platform_id,
                strategy_id: formData.strategy_id,
                start_date: formData.start_date,
            });

            // Reset form
            setFormData({
                name: '',
                asset_id: '',
                platform_id: '',
                strategy_id: '',
                currency: 'VND',

                start_date: '',
                description: '',
            });

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create portfolio');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: '',
            asset_id: '',
            platform_id: '',
            strategy_id: '',
            currency: 'VND',

            start_date: '',
            description: '',
        });
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
                            <h2 className="text-2xl font-bold text-white">Create Portfolio</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Setup a new investment or cash portfolio to start tracking your assets.
                            </p>
                        </div>
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

                    {loadingMasterData ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* General Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="font-semibold">General Information</h3>
                                </div>

                                {/* Portfolio Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                                        Portfolio Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Retirement Fund 2050"
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        disabled={loading}
                                    />
                                </div>

                                {/* Asset Type & Strategy */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="asset_id" className="block text-sm font-medium text-slate-300 mb-2">
                                            Asset Type <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            id="asset_id"
                                            name="asset_id"
                                            value={formData.asset_id}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            disabled={loading}
                                        >
                                            <option value="">Select type</option>
                                            {assets.map((asset) => (
                                                <option key={asset.asset_id} value={asset.asset_id}>
                                                    {asset.asset_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="strategy_id" className="block text-sm font-medium text-slate-300 mb-2">
                                            Strategy <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            id="strategy_id"
                                            name="strategy_id"
                                            value={formData.strategy_id}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            disabled={loading}
                                        >
                                            <option value="">Select strategy</option>
                                            {strategies.map((strategy) => (
                                                <option key={strategy.strategy_id} value={strategy.strategy_id}>
                                                    {strategy.strategy_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Platform & Financials */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <h3 className="font-semibold">Platform & Financials</h3>
                                </div>

                                {/* Platform/Institution */}
                                <div>
                                    <label htmlFor="platform_id" className="block text-sm font-medium text-slate-300 mb-2">
                                        Platform / Institution <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        id="platform_id"
                                        name="platform_id"
                                        value={formData.platform_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        disabled={loading || !formData.asset_id}
                                    >
                                        <option value="">
                                            {!formData.asset_id
                                                ? 'Select asset type first'
                                                : filteredPlatforms.length === 0
                                                    ? 'No platforms available for this asset'
                                                    : 'Select platform'
                                            }
                                        </option>
                                        {filteredPlatforms.map((platform) => (
                                            <option key={platform.platform_id} value={platform.platform_id}>
                                                {platform.platform_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Currency & Initial Balance */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="currency" className="block text-sm font-medium text-slate-300 mb-2">
                                            Currency
                                        </label>
                                        <select
                                            id="currency"
                                            name="currency"
                                            value={formData.currency}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            disabled={loading}
                                        >
                                            <option value="VND">VND - Vietnamese Dong</option>
                                            <option value="USD">USD - US Dollar</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="start_date" className="block text-sm font-medium text-slate-300 mb-2">
                                            Inception Date <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            id="start_date"
                                            name="start_date"
                                            value={formData.start_date}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                        placeholder="Brief notes about this portfolio's purpose or allocation rules..."
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                        disabled={loading}
                                    />
                                </div>
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
                        disabled={loading || loadingMasterData}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Create Portfolio
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
