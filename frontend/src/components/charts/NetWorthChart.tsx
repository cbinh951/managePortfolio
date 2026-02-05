'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '@/utils/currencyUtils';

interface NetWorthChartProps {
    data?: Array<{
        month: string;
        value: number;
    }>;
    onViewDetails?: () => void;
}

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <p>No historical data available</p>
        <p className="text-xs mt-1">Add transactions to see your net worth growth</p>
    </div>
);

export default function NetWorthChart({ data = [], onViewDetails }: NetWorthChartProps) {
    const { settings } = useSettings();

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
                    <p className="text-slate-400 text-xs mb-1">
                        <span className="font-medium">Date:</span> {payload[0].payload.month}
                    </p>
                    <div>
                        <span className="text-slate-400 text-xs mr-2">Net Worth:</span>
                        <span className="text-white font-semibold">
                            {formatCurrency(payload[0].value, 'VND', settings.displayCurrency, settings.exchangeRate)}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const formatYAxis = (value: number) => {
        const symbol = getCurrencySymbol(settings.displayCurrency);
        if (settings.displayCurrency === 'VND') {
            return `${(value / 1000000).toFixed(0)}M ${symbol}`;
        } else {
            // USD
            const convertedValue = value / settings.exchangeRate;
            return `${symbol}${(convertedValue / 1000).toFixed(0)}k`;
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">Net Worth Evolution</h3>
                        <div className="relative group z-50">
                            <svg className="w-5 h-5 text-slate-500 hover:text-blue-400 cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {/* Improved Tooltip */}
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 backdrop-blur-md text-slate-200 text-xs p-4 rounded-xl border border-slate-700/50 bottom-full left-0 mb-3 w-72 pointer-events-none shadow-2xl z-50">
                                <div className="font-semibold text-white mb-1">Calculation Method</div>
                                <p>Sum of the latest available NAV for each portfolio at the end of each month.</p>
                                <div className="absolute bottom-0 left-4 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900 border-r border-b border-slate-700/50"></div>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-slate-400">Historical value over time</p>
                </div>
                {onViewDetails && (
                    <button
                        onClick={onViewDetails}
                        className="text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors border border-blue-500/20"
                    >
                        View Details
                    </button>
                )}
            </div>

            <div className="h-[300px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="month"
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                axisLine={{ stroke: '#334155' }}
                            />
                            <YAxis
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                axisLine={{ stroke: '#334155' }}
                                tickFormatter={formatYAxis}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                            <Bar
                                dataKey="value"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                animationDuration={1000}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyState />
                )}
            </div>
        </div >
    );
}
