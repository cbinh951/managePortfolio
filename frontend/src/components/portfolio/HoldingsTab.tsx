import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';
import { Transaction } from '@/types/models';

import { useMemo, useState } from 'react';
import AddStockTransactionModal from './AddStockTransactionModal';
import { useParams } from 'next/navigation';

interface HoldingsTabProps {
    transactions: Transaction[];
    currentPrices?: Record<string, number>; // Placeholder for future real-time prices
    onEditTransaction?: (transaction: Transaction) => void;
}

interface Holding {
    ticker: string;
    quantity: number;
    totalCost: number;
    avgCost: number;
    currentPrice: number;
    marketValue: number;
    profit: number;
    profitPercent: number;
}

export default function HoldingsTab({ transactions, currentPrices = {}, onEditTransaction }: HoldingsTabProps) {
    const { settings } = useSettings();
    const params = useParams();
    const portfolioId = params?.id as string;
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleSuccess = () => {
        setIsAddModalOpen(false);
        window.location.reload();
    };

    const { holdings, totalMarketValue, totalCost, totalProfit, totalProfitPercent } = useMemo(() => {
        const map = new Map<string, Holding>();

        // 1. Process Transactions
        const sortedTrans = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sortedTrans.forEach(t => {
            if (!t.ticker) return;
            const ticker = t.ticker.toUpperCase();

            if (!map.has(ticker)) {
                map.set(ticker, {
                    ticker,
                    quantity: 0,
                    totalCost: 0,
                    avgCost: 0,
                    currentPrice: 0,
                    marketValue: 0,
                    profit: 0,
                    profitPercent: 0
                });
            }

            const holding = map.get(ticker)!;
            const amount = Number(t.amount);
            const qty = t.quantity ? Number(t.quantity) : 0;
            // Fee is already included in 'amount' (which is cash flow).
            // For cost basis:
            // BUY: amount is negative (cash outflow). Cost = abs(amount).
            // However, typical "Avg Cost" often excludes fees or includes them depending on tax rules.
            // Here, amount = -(price * qty + fee). So abs(amount) = price*qty + fee. This is "Gross Cost".
            // Let's stick to Gross Cost for calculations as it reflects true cash spent.

            if (t.type === 'BUY') {
                holding.quantity += qty;
                holding.totalCost += Math.abs(amount); // Add to cost basis
            } else if (t.type === 'SELL') {
                // Reduce cost basis proportionally (Average Cost method)
                if (holding.quantity > 0) {
                    const costPerShare = holding.totalCost / holding.quantity;
                    holding.totalCost -= (qty * costPerShare);
                }
                holding.quantity -= qty;
            }

            // Cleanup precision
            if (Math.abs(holding.quantity) < 0.000001) {
                holding.quantity = 0;
                holding.totalCost = 0;
            }

            holding.avgCost = holding.quantity > 0 ? holding.totalCost / holding.quantity : 0;
        });

        // 2. Filter Active Holdings & Calculate Values
        const activeHoldings = Array.from(map.values()).filter(h => h.quantity > 0);

        // 3. Calculate Totals (First pass for Market Value required for Allocation)
        let sumMarketValue = 0;
        let sumCost = 0;

        activeHoldings.forEach(h => {
            const price = currentPrices[h.ticker] || h.avgCost; // Fallback to Avg Cost
            h.currentPrice = price;
            h.marketValue = h.quantity * price;
            h.profit = h.marketValue - h.totalCost;
            h.profitPercent = h.totalCost > 0 ? (h.profit / h.totalCost) * 100 : 0;

            sumMarketValue += h.marketValue;
            sumCost += h.totalCost;
        });

        const totalProfitVal = sumMarketValue - sumCost;
        const totalProfitPct = sumCost > 0 ? (totalProfitVal / sumCost) * 100 : 0;

        return {
            holdings: activeHoldings,
            totalMarketValue: sumMarketValue,
            totalCost: sumCost,
            totalProfit: totalProfitVal,
            totalProfitPercent: totalProfitPct
        };
    }, [transactions, currentPrices]);

    return (
        <>
            <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Portfolio Structure</h3>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Stock
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Stock</th>
                                <th className="px-6 py-4 font-semibold text-right">Change</th>
                                <th className="px-6 py-4 font-semibold text-right">Allocation</th>
                                <th className="px-6 py-4 font-semibold text-right">Volume</th>
                                <th className="px-6 py-4 font-semibold text-right">
                                    <div className="flex flex-col">
                                        <span>Current Price</span>
                                        <span className="text-[10px] text-slate-600">Avg Cost</span>
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-right">
                                    <div className="flex flex-col">
                                        <span>Market Value</span>
                                        <span className="text-[10px] text-slate-600">Total Cost</span>
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-right">
                                    <div className="flex flex-col">
                                        <span>Profit/Loss</span>
                                        <span className="text-[10px] text-slate-600">% Return</span>
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {holdings.length > 0 ? (
                                <>
                                    {holdings.map((stock) => {
                                        const allocation = totalMarketValue > 0 ? (stock.marketValue / totalMarketValue) * 100 : 0;
                                        const isProfit = stock.profit >= 0;

                                        return (
                                            <tr key={stock.ticker} className="hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white text-base">{stock.ticker}</div>
                                                    <div className="text-xs text-slate-500">Stock</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-slate-500 text-sm">-</span>
                                                    {/* Placeholder for Change % */}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-white">
                                                    {allocation.toFixed(2)}%
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-white">
                                                    {stock.quantity.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-white font-medium">
                                                        {formatCurrency(stock.currentPrice, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {formatCurrency(stock.avgCost, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-white font-bold">
                                                        {formatCurrency(stock.marketValue, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {formatCurrency(stock.totalCost, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {stock.profit > 0 ? '+' : ''}
                                                        {formatCurrency(stock.profit, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                                    </div>
                                                    <div className={`text-xs ${isProfit ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                                                        {stock.profitPercent > 0 ? '+' : ''}
                                                        {stock.profitPercent.toFixed(2)}%
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => {
                                                            const stockTrans = transactions.filter(t => t.ticker === stock.ticker);
                                                            if (stockTrans.length === 1 && onEditTransaction) {
                                                                onEditTransaction(stockTrans[0]);
                                                            } else if (stockTrans.length > 1) {
                                                                alert('Multiple transactions found. Please go to Transactions tab to edit specific records.');
                                                            }
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {/* Summary Row */}
                                    <tr className="bg-amber-900/10 border-t border-slate-700">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-amber-500 text-sm uppercase">Total Portfolio</div>
                                        </td>
                                        <td className="px-6 py-4 text-right"></td>
                                        <td className="px-6 py-4 text-right font-bold text-amber-500">
                                            100%
                                        </td>
                                        <td className="px-6 py-4 text-right"></td>
                                        <td className="px-6 py-4 text-right"></td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-bold text-white">
                                                {formatCurrency(totalMarketValue, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {formatCurrency(totalCost, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {totalProfit > 0 ? '+' : ''}
                                                {formatCurrency(totalProfit, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                            </div>
                                            <div className={`text-xs ${totalProfit >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                                                {totalProfitPercent > 0 ? '+' : ''}
                                                {totalProfitPercent.toFixed(2)}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right"></td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-3 bg-slate-800 rounded-full">
                                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium">No stock holdings yet</p>
                                            <p className="text-xs max-w-xs mx-auto text-slate-600">Start building your portfolio by adding stock transactions using the button above.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddStockTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleSuccess}
                portfolioId={portfolioId}
            />
        </>
    );
}
