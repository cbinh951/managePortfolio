'use client';

import { useState, useEffect } from 'react';
import { Snapshot, AssetType } from '@/types/models';
import { useSettings } from '@/contexts/SettingsContext';
import { apiClient } from '@/services/api';
import DatePicker from '@/components/common/DatePicker';

interface EditSnapshotModalProps {
    isOpen: boolean;
    snapshot: Snapshot | null;
    onClose: () => void;
    onSuccess: () => void;
    assetType?: AssetType;
}

export default function EditSnapshotModal({
    isOpen,
    snapshot,
    onClose,
    onSuccess,
    assetType,
}: EditSnapshotModalProps) {
    const { settings } = useSettings();
    const [formData, setFormData] = useState({
        date: '',
        nav: '',
        branded_gold_price: '',
        private_gold_price: '',
    });
    const [displayNav, setDisplayNav] = useState('');
    const [displayBrandedPrice, setDisplayBrandedPrice] = useState('');
    const [displayPrivatePrice, setDisplayPrivatePrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (snapshot) {
            // Convert date to YYYY-MM-DD format
            let dateStr = '';
            if (snapshot.date) {
                try {
                    const date = new Date(snapshot.date);
                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        dateStr = `${year}-${month}-${day}`;
                    }
                } catch {
                    dateStr = '';
                }
            }

            setFormData({
                date: dateStr,
                nav: snapshot.nav.toString(),
                branded_gold_price: snapshot.branded_gold_price?.toString() || '',
                private_gold_price: snapshot.private_gold_price?.toString() || '',
            });
            // Set display value with formatting
            setDisplayNav(snapshot.nav.toLocaleString());
            setDisplayBrandedPrice(snapshot.branded_gold_price ? snapshot.branded_gold_price.toLocaleString() : '');
            setDisplayPrivatePrice(snapshot.private_gold_price ? snapshot.private_gold_price.toLocaleString() : '');
        }
    }, [snapshot]);

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

        if (!formData.nav || parseFloat(formData.nav) < 0) {
            if (!formData.nav) return 'Total NAV is required';
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!snapshot) return;

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            setError(null);


            await apiClient.updateSnapshot(snapshot.snapshot_id, {
                date: formData.date,
                nav: parseFloat(formData.nav),
                branded_gold_price: formData.branded_gold_price ? parseFloat(formData.branded_gold_price) : undefined,
                private_gold_price: formData.private_gold_price ? parseFloat(formData.private_gold_price) : undefined,
            });

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update snapshot');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setError(null);
        onClose();
    };

    if (!isOpen || !snapshot) return null;

    const currencySymbol = settings.displayCurrency === 'USD' ? '$' : '₫';
    const isGold = assetType === AssetType.GOLD;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
                {/* Header */}
                <div className="border-b border-slate-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Edit Snapshot</h2>
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
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="edit-date" className="block text-sm font-medium text-slate-300 mb-2">
                            Snapshot Date <span className="text-red-400">*</span>
                        </label>
                        <DatePicker
                            id="edit-date"
                            name="date"
                            value={formData.date}
                            onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                            disabled={loading}
                        />
                    </div>

                    {isGold && (
                        <div className="p-3 bg-yellow-900/10 border border-yellow-700/30 rounded-lg space-y-3">
                            <h4 className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">Physical Gold Prices</h4>

                            <div>
                                <label htmlFor="edit-branded" className="block text-sm font-medium text-slate-300 mb-2">
                                    Branded Gold (per chỉ)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
                                    <input
                                        type="text"
                                        id="edit-branded"
                                        value={displayBrandedPrice}
                                        onChange={(e) => handleNumberChange(e, 'branded_gold_price', setDisplayBrandedPrice)}
                                        placeholder="0"
                                        className="w-full pl-8 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="edit-private" className="block text-sm font-medium text-slate-300 mb-2">
                                    Private Gold (per chỉ)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
                                    <input
                                        type="text"
                                        id="edit-private"
                                        value={displayPrivatePrice}
                                        onChange={(e) => handleNumberChange(e, 'private_gold_price', setDisplayPrivatePrice)}
                                        placeholder="0"
                                        className="w-full pl-8 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {!isGold && (
                        <div>
                            <label htmlFor="edit-nav" className="block text-sm font-medium text-slate-300 mb-2">
                                Net Asset Value <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
                                <input
                                    type="text"
                                    id="edit-nav"
                                    name="nav"
                                    value={displayNav}
                                    onChange={(e) => handleNumberChange(e, 'nav', setDisplayNav)}
                                    placeholder="0"
                                    className="w-full pl-8 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="border-t border-slate-700 px-6 py-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Updating...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Update Snapshot
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
