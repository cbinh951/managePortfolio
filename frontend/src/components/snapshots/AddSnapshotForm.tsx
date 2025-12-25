'use client';

import { useState } from 'react';

interface AddSnapshotFormProps {
    portfolioId: string;
    onSuccess: () => void;
}

export default function AddSnapshotForm({ portfolioId, onSuccess }: AddSnapshotFormProps) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        nav: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

        if (!formData.nav || parseFloat(formData.nav) <= 0) {
            return 'NAV must be a positive number';
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

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/snapshots`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    portfolio_id: portfolioId,
                    date: formData.date,
                    nav: parseFloat(formData.nav),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create snapshot');
            }

            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                nav: '',
            });

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create snapshot');
        } finally {
            setLoading(false);
        }
    };

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
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="nav" className="block text-sm font-medium text-slate-300 mb-2">
                        Total Net Asset Value <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                            type="number"
                            id="nav"
                            name="nav"
                            value={formData.nav}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Enter total value of all positions in this portfolio
                    </p>
                </div>

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
