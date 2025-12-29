// ... imports
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';

interface AllocationChartProps {
    totalCash: number;
    portfolios: Array<{
        id: string;
        name: string;
        value: number;
    }>;
}

export default function AllocationChart({ totalCash, portfolios }: AllocationChartProps) {
    const { settings } = useSettings();

    // Calculate total investment from portfolios
    const totalInvestment = portfolios.reduce((sum, p) => sum + p.value, 0);
    const total = totalCash + totalInvestment;

    const COLORS = [
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#84cc16', // Lime
    ];

    const data = [
        ...portfolios.map((p, index) => ({
            name: p.name,
            value: p.value,
            color: COLORS[index % COLORS.length]
        })),
        { name: 'Cash', value: totalCash, color: '#64748b' } // Slate-500 for Cash
    ].filter(item => item.value > 0); // Only show non-zero items



    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = total > 0 ? (data.value / total) * 100 : 0;
            return (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
                    <p className="text-slate-300 text-sm font-medium mb-1">{data.name}</p>
                    <div className="flex items-center gap-4">
                        <span className="text-white font-bold">
                            {formatCurrency(data.value, 'VND', settings.displayCurrency, settings.exchangeRate)}
                        </span>
                        <span className="text-slate-400 text-xs">
                            {percentage.toFixed(1)}%
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const CustomLegend = () => {
        return (
            <div className="flex flex-col gap-3 mt-6 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {data.map((entry, index) => {
                    const percentage = total > 0 ? (entry.value / total) * 100 : 0;
                    return (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm text-slate-300 truncate max-w-[120px]" title={entry.name}>
                                    {entry.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-white">
                                    {percentage.toFixed(1)}%
                                </span>
                                <span className="text-sm text-slate-500">
                                    {formatCurrency(entry.value, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 flex flex-col h-full">
            <h3 className="text-lg font-semibold text-white mb-6">Asset Allocation</h3>

            <div className="relative flex-1 min-h-[250px] flex flex-col">
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            paddingAngle={2}
                            dataKey="value"
                            animationDuration={1000}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />

                    </PieChart>
                </ResponsiveContainer>

                {/* Manual center text overlay to ensure it works reliably */}
                <div className="absolute top-[125px] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="text-xs text-slate-400">Total</div>
                    <div className="text-lg font-bold text-white">
                        {formatCurrency(total, 'VND', settings.displayCurrency, settings.exchangeRate)}
                    </div>
                </div>

                <CustomLegend />
            </div>
        </div>
    );
}
