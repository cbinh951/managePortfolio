'use client';

import { useState, useEffect } from 'react';
import { Snapshot } from '@/types/models';

interface EditSnapshotModalProps {
    isOpen: boolean;
    snapshot: Snapshot | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditSnapshotModal({
    isOpen,
    snapshot,
    onClose,
    onSuccess,
}: EditSnapshotModalProps) {
    const [formData, setFormData] = useState({
        date: '',
        nav: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (snapshot) {
            setFormData({
                date: snapshot.date,
                nav: snapshot.nav.toString(),
            });
        }
    }, [snapshot]);

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

        if (!snapshot) return;

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/snapshots/${snapshot.snapshot_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: formData.date,
                    nav: parseFloat(formData.nav),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update snapshot');
            }

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
                        <input
                            type="date"
                            id="edit-date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-nav" className="block text-sm font-medium text-slate-300 mb-2">
                            Net Asset Value <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input
                                type="number"
                                id="edit-nav"
                                name="nav"
                                value={formData.nav}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="w-full pl-8 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                            />
                        </div>
                    </div>
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
