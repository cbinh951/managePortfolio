'use client';

import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { apiClient } from '@/services/api';
import { AssetType } from '@/types/models';
import DatePicker from '@/components/common/DatePicker';

interface AddSnapshotFormProps {
    portfolioId: string;
    assetType?: AssetType;
    onSuccess: () => void;
    liveNAV?: number;
}

export default function AddSnapshotForm({ portfolioId, assetType, onSuccess, liveNAV }: AddSnapshotFormProps) {
    const { settings } = useSettings();
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        nav: '',
        branded_gold_price: '',
        private_gold_price: '',
    });
    const [displayNav, setDisplayNav] = useState('');
    const [displayBrandedPrice, setDisplayBrandedPrice] = useState('');
    const [displayPrivatePrice, setDisplayPrivatePrice] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleNumberChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: 'nav' | 'branded_gold_price' | 'private_gold_price',
        setDisplay: (val: string) => void
    ) => {
        const value = e.target.value;
        const cleanValue = value.replace(/[^\d]/g, '');

        setFormData(prev => ({ ...prev, [field]: cleanValue }));

        if (cleanValue) {
            const formatted = parseInt(cleanValue).toLocaleString();
            setDisplay(formatted);
        } else {
            setDisplay('');
        }

        setError(null);
    };

    const validateForm = (): string | null => {
        if (!formData.date) {
            return 'Snapshot date is required';
        }

        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (selectedDate > today) {
            return 'Snapshot date cannot be in the future';
        }

        // For gold portfolios, NAV is optional (will be auto-calculated)
        // For other portfolios, NAV is required
        if (!isGold && (!formData.nav || parseFloat(formData.nav) < 0)) {
            return 'Total NAV is required';
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

            await apiClient.createSnapshot({
                portfolio_id: portfolioId,
                date: formData.date,
                nav: parseFloat(formData.nav || '0'),
                branded_gold_price: formData.branded_gold_price ? parseFloat(formData.branded_gold_price) : undefined,
                private_gold_price: formData.private_gold_price ? parseFloat(formData.private_gold_price) : undefined,
            });

            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                nav: '',
                branded_gold_price: '',
                private_gold_price: '',
            });
            setDisplayNav('');
            setDisplayBrandedPrice('');
            setDisplayPrivatePrice('');

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create snapshot');
        } finally {
            setLoading(false);
        }
    };

    const currencySymbol = settings.displayCurrency === 'USD' ? '$' : '₫';
    const isGold = assetType === AssetType.GOLD;

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Add Snapshot</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-2">
                        Snapshot Date <span className="text-red-400">*</span>
                    </label>
                    <DatePicker
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                        disabled={loading}
                    />
                </div>

                {isGold && (
                    <div className="p-3 bg-yellow-900/10 border border-yellow-700/30 rounded-lg space-y-3">
                        <h4 className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">Physical Gold Prices (Per Chỉ)</h4>

                        <div>
                            <label htmlFor="branded_price" className="block text-sm font-medium text-slate-300 mb-2">
                                Branded Gold Price
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
                                <input
                                    type="text"
                                    id="branded_price"
                                    value={displayBrandedPrice}
                                    onChange={(e) => handleNumberChange(e, 'branded_gold_price', setDisplayBrandedPrice)}
                                    placeholder="0"
                                    className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="private_price" className="block text-sm font-medium text-slate-300 mb-2">
                                Private Gold Price
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
                                <input
                                    type="text"
                                    id="private_price"
                                    value={displayPrivatePrice}
                                    onChange={(e) => handleNumberChange(e, 'private_gold_price', setDisplayPrivatePrice)}
                                    placeholder="0"
                                    className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {!isGold && (
                    <div>
                        <label htmlFor="nav" className="block text-sm font-medium text-slate-300 mb-2">
                            Total Net Asset Value <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
                            <input
                                type="text"
                                id="nav"
                                name="nav"
                                value={displayNav}
                                onChange={(e) => handleNumberChange(e, 'nav', setDisplayNav)}
                                placeholder="0"
                                className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                            />
                        </div>
                        {liveNAV !== undefined && (
                            <div className="mt-2 flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                    Calculated from holdings: <span className="text-emerald-400 font-medium">{currencySymbol}{liveNAV.toLocaleString()}</span>
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const val = Math.round(liveNAV).toString();
                                        setFormData(prev => ({ ...prev, nav: val }));
                                        setDisplayNav(parseInt(val).toLocaleString());
                                    }}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Use Live Value
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                            Enter total value of all positions in this portfolio
                        </p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            Save Snapshot
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
