import { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/types/models';
import { apiClient } from '@/services/api';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';

interface AddStockTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    portfolioId: string;
    initialTicker?: string;
}

export default function AddStockTransactionModal({ isOpen, onClose, onSuccess, portfolioId, initialTicker }: AddStockTransactionModalProps) {
    const { settings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [type, setType] = useState<TransactionType>(TransactionType.BUY);
    const [ticker, setTicker] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [feePercentage, setFeePercentage] = useState('0');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset form
            setType(TransactionType.BUY);
            setTicker(initialTicker || '');
            setDate(new Date().toISOString().split('T')[0]);
            setFeePercentage('0');
            setPrice('');
            setQuantity('');
            setNote('');
            setError(null);
        }
    }, [isOpen, initialTicker]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const qty = parseFloat(quantity);
            const pri = parseFloat(price); // Price in "thousand VND" or actual? Assuming Actual for now based on normal input, but UI says "nghìn VNĐ" -> means x1000?
            // User image: "Giá khớp" ... "nghìn VNĐ". So if input is 10, it means 10,000 VND.
            // Let's assume the user inputs absolute value if there is no suffix logic handled yet, 
            // OR if suffix is there, I multiply.
            // Let's stick to raw number for now, or x1000 if 'nghìn VNĐ' is explicit.
            // The image shows "0.0 nghìn VNĐ".
            // I will implement "x1000" logic for the Price.

            const priceInVND = pri * 1000;
            const feePercent = parseFloat(feePercentage);

            const rawAmount = qty * priceInVND;
            const feeAmount = rawAmount * (feePercent / 100);

            // For BUY: Total cost = (Price * Qty) + Fee
            // For SELL: Total received = (Price * Qty) - Fee

            // Transaction Amount (Cash Flow)
            // BUY -> outflow -> negative
            // SELL -> inflow -> positive
            let finalAmount = 0;
            if (type === TransactionType.BUY) {
                finalAmount = -(rawAmount + feeAmount);
            } else {
                finalAmount = rawAmount - feeAmount;
            }

            const newTransaction: Omit<Transaction, 'transaction_id'> = {
                date: new Date(date).toISOString(),
                type: type,
                amount: finalAmount,
                portfolio_id: portfolioId,
                description: note,
                ticker: ticker.toUpperCase(),
                quantity: qty,
                fee: feeAmount,
                // We might want to store unit_price or price per share for reference?
                // Currently 'unit_price' is for Gold. Let's rely on Amount/Quantity for Avg Cost.
                // Or better, store unit_price if we want to preserve the "Match Price" entered.
                // Let's store unit_price as priceInVND.
                unit_price: priceInVND,
            };

            await apiClient.createTransaction(newTransaction);
            onSuccess();
        } catch (err) {
            console.error('Failed to create transaction:', err);
            setError(err instanceof Error ? err.message : 'Failed to create transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl border border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Add Transaction</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Buy/Sell Tabs */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.BUY)}
                            className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${type === TransactionType.BUY
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            Buy Stock
                        </button>
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.SELL)}
                            className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${type === TransactionType.SELL
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            Sell Stock
                        </button>
                    </div>

                    {/* Stock Ticker */}
                    <div>
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value)}
                            placeholder="Enter stock ticker..."
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Date and Fee */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Transaction Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Transaction Fee <span className="text-xs text-slate-500">(%)</span></label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={feePercentage}
                                    onChange={(e) => setFeePercentage(e.target.value)}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors pr-8"
                                />
                                <span className="absolute right-3 top-2.5 text-slate-500">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Price and Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Price <span className="text-xs text-slate-500">(k VND)</span></label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    step="0.01"
                                    min="0"
                                    placeholder="0.0"
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors pr-16"
                                    required
                                />
                                <span className="absolute right-3 top-2.5 text-slate-500 text-xs">k VND</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Quantity</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                step="1"
                                min="1"
                                placeholder="0"
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Note</label>
                        <div className="flex items-center gap-2 border-b border-slate-700 py-2">
                            <span className="text-slate-500">+</span>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add note"
                                className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Adding...' : 'Add Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
