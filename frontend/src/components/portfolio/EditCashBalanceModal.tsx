import { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/currencyUtils';
import { Currency } from '@/contexts/SettingsContext';

interface EditCashBalanceModalProps {
    isOpen: boolean;
    currentBalance: number;
    currency: Currency;
    exchangeRate: number;
    onClose: () => void;
    onSubmit: (newBalance: number) => Promise<void>;
}

export default function EditCashBalanceModal({
    isOpen,
    currentBalance,
    currency,
    exchangeRate,
    onClose,
    onSubmit
}: EditCashBalanceModalProps) {
    const [newBalance, setNewBalance] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setNewBalance(currentBalance.toString());
            setError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, currentBalance]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const amount = parseFloat(newBalance);
        if (isNaN(amount) || amount < 0) {
            setError('Please enter a valid positive number');
            return;
        }

        if (amount === currentBalance) {
            onClose();
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            await onSubmit(amount);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save balance');
        } finally {
            setIsSubmitting(false);
        }
    };

    const difference = parseFloat(newBalance || '0') - currentBalance;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white">Edit Cash Balance</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" disabled={isSubmitting}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                            Current Balance
                        </label>
                        <div className="text-lg font-medium text-slate-300">
                            {formatCurrency(currentBalance, 'VND', currency, exchangeRate)}
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-400 mb-1" htmlFor="newBalance">
                            New Balance (VND)
                        </label>
                        <input
                            id="newBalance"
                            type="number"
                            step="any"
                            value={newBalance}
                            onChange={(e) => setNewBalance(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Enter new balance"
                            required
                        />
                        {newBalance && !isNaN(parseFloat(newBalance)) && difference !== 0 && (
                            <p className={`text-xs mt-2 ${difference > 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                This will create a {difference > 0 ? 'DIVIDEND' : 'FEE'} transaction of {formatCurrency(Math.abs(difference), 'VND', currency, exchangeRate)}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || parseFloat(newBalance) === currentBalance || isNaN(parseFloat(newBalance))}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center min-w-[100px]"
                        >
                            {isSubmitting ? (
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Save'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
