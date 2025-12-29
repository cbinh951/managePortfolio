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
}

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <p>No historical data available</p>
        <p className="text-xs mt-1">Add transactions to see your net worth growth</p>
    </div>
);

export default function NetWorthChart({ data = [] }: NetWorthChartProps) {
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
                    <h3 className="text-lg font-semibold text-white">Net Worth Evolution</h3>
                    <p className="text-sm text-slate-400">Historical value over time</p>
                </div>
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
        </div>
    );
}
