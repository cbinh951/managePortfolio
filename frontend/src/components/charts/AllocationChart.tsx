'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';

interface AllocationChartProps {
    totalCash: number;
    totalInvestment: number;
}

export default function AllocationChart({ totalCash, totalInvestment }: AllocationChartProps) {
    const { settings } = useSettings();
    const total = totalCash + totalInvestment;
    const cashPercentage = total > 0 ? (totalCash / total) * 100 : 0;
    const investmentPercentage = total > 0 ? (totalInvestment / total) * 100 : 0;

    const data = [
        { name: 'Investments', value: totalInvestment, color: '#3b82f6' },
        { name: 'Cash', value: totalCash, color: '#60a5fa' },
    ];

    const COLORS = ['#3b82f6', '#60a5fa'];

    const renderCustomLabel = () => {
        const formattedTotal = formatCurrency(total, 'VND', settings.displayCurrency, settings.exchangeRate);
        return (
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                <tspan x="50%" dy="-0.5em" className="text-xs fill-slate-400" fontSize="14">
                    Total
                </tspan>
                <tspan x="50%" dy="1.5em" className="text-lg fill-white font-bold" fontSize="20">
                    {formattedTotal}
                </tspan>
            </text>
        );
    };

    const CustomLegend = () => {
        return (
            <div className="flex flex-col gap-3 mt-6">
                {data.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm text-slate-400">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-white">
                                {entry.name === 'Investments'
                                    ? `${investmentPercentage.toFixed(0)}%`
                                    : `${cashPercentage.toFixed(0)}%`}
                            </span>
                            <span className="text-sm text-slate-500">
                                {formatCurrency(entry.value, 'VND', settings.displayCurrency, settings.exchangeRate)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Asset Allocation</h3>

            <div className="relative">
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
                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                        </Pie>
                        {renderCustomLabel()}
                    </PieChart>
                </ResponsiveContainer>

                <CustomLegend />
            </div>
        </div>
    );
}
