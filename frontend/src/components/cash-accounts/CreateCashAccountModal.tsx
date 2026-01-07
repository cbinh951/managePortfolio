'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Platform } from '@/types/models';

interface CreateCashAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateCashAccountModal({ isOpen, onClose, onSuccess }: CreateCashAccountModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        platform_id: '',
        currency: 'VND',
    });

    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadPlatforms();
        }
    }, [isOpen]);

    const loadPlatforms = async () => {
        try {
            setLoadingData(true);
            const data = await apiClient.getPlatforms();
            // Filter to only show BANK and WALLET platforms based on platform name
            const cashPlatforms = data.filter(p => {
                const nameLower = p.platform_name.toLowerCase();
                return nameLower.includes('bank') || nameLower.includes('wallet');
            });
            setPlatforms(cashPlatforms);
        } catch (err) {
            setError('Failed to load platforms');
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

        if (!formData.name.trim()) {
            setError('Account name is required');
            return;
        }

        if (!formData.platform_id) {
            setError('Platform is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await apiClient.createCashAccount({
                name: formData.name,
                platform_id: formData.platform_id,
                currency: formData.currency,
            });

            // Reset form
            setFormData({
                name: '',
                platform_id: '',
                currency: 'VND',
            });

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create cash account');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            platform_id: '',
            currency: 'VND',
        });
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
                            <h2 className="text-2xl font-bold text-white">Add Cash Account</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Create a new bank or wallet account
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

                    {loadingData ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Account Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                                    Account Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Main Checking Account"
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={loading}
                                />
                            </div>

                            {/* Platform & Currency */}
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
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={loading}
                                    >
                                        <option value="">Select platform</option>
                                        {platforms.map((platform) => (
                                            <option key={platform.platform_id} value={platform.platform_id}>
                                                {platform.platform_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="currency" className="block text-sm font-medium text-slate-300 mb-2">
                                        Currency <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        id="currency"
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={loading}
                                    >
                                        <option value="VND">VND - Vietnamese Dong</option>
                                        <option value="USD">USD - US Dollar</option>
                                    </select>
                                </div>
                            </div>

                            {/* Info Note */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <div className="flex gap-2">
                                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xs text-blue-300">
                                        Only bank and wallet platforms are shown. You can set an initial balance by adding a deposit transaction after creation.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
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
                        disabled={loading || loadingData}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Cash Account
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
