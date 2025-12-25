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

// Sample data for demonstration (in VND)
const defaultData = [
    { month: 'Jan', value: 23750000 },
    { month: 'Feb', value: 24500000 },
    { month: 'Mar', value: 25500000 },
    { month: 'Apr', value: 26250000 },
    { month: 'May', value: 27500000 },
    { month: 'Jun', value: 28000000 },
    { month: 'Jul', value: 28750000 },
    { month: 'Aug', value: 29500000 },
    { month: 'Sep', value: 30000000 },
    { month: 'Oct', value: 31250000 },
];

export default function NetWorthChart({ data = defaultData }: NetWorthChartProps) {
    const { settings } = useSettings();

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
                    <p className="text-slate-400 text-xs mb-1">{payload[0].payload.month}</p>
                    <p className="text-white font-semibold">
                        {formatCurrency(payload[0].value, 'VND', settings.displayCurrency, settings.exchangeRate)}
                    </p>
                </div>
            );
        }
        return null;
    };

    const formatYAxis = (value: number) => {
        const symbol = getCurrencySymbol(settings.displayCurrency);
        if (settings.displayCurrency === 'VND') {
            return `${symbol}${(value / 1000000).toFixed(0)}M`;
        } else {
            // USD
            const convertedValue = value / settings.exchangeRate;
            return `${symbol}${(convertedValue / 1000).toFixed(0)}k`;
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Net Worth Evolution</h3>
                <button className="text-slate-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>

            <ResponsiveContainer width="100%" height={300}>
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
        </div>
    );
}
