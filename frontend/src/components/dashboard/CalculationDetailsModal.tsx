import React from 'react';
import { formatCurrency } from '@/utils/currencyUtils';

interface Breakdown {
    portfolioName: string;
    snapshotDate: string;
    nav: number;
    isGold?: boolean;
    note?: string;
}

interface DetailRow {
    month: string;
    total: number;
    breakdown: Breakdown[];
}

interface CalculationDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    details: DetailRow[];
    settings: any;
}

export default function CalculationDetailsModal({ isOpen, onClose, details, settings }: CalculationDetailsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">Net Worth Calculation Details</h2>
                        <p className="text-slate-400 text-sm mt-1">Breakdown of how the monthly values are derived</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="space-y-8">
                        {details.slice().reverse().map((row, idx) => ( // Show newest first
                            <div key={idx} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700/50">
                                    <span className="font-bold text-blue-400 text-lg">{row.month}</span>
                                    <span className="font-bold text-white text-lg">
                                        {formatCurrency(row.total, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                    </span>
                                </div>

                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-800/50">
                                        <tr>
                                            <th className="px-3 py-2 rounded-l-md">Portfolio</th>
                                            <th className="px-3 py-2">Snapshot Date</th>
                                            <th className="px-3 py-2 text-right rounded-r-md">NAV Used</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/30">
                                        {row.breakdown.map((item, itemIdx) => (
                                            <tr key={itemIdx} className="hover:bg-slate-700/20">
                                                <td className="px-3 py-2 font-medium text-slate-300">{item.portfolioName}</td>
                                                <td className="px-3 py-2 text-slate-400">
                                                    <div>{new Date(item.snapshotDate).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <div className="text-slate-300 font-mono">
                                                        {formatCurrency(item.nav, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                                    </div>
                                                    {item.note && (
                                                        <div className="text-[10px] text-slate-500 mt-0.5">{item.note}</div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
