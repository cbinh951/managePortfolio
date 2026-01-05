'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';

export interface AllocationItem {
    name: string;
    value: number;
    color: string;
    percentage: number;
    [key: string]: any;
}

interface AllocationDonutChartProps {
    data: AllocationItem[];
}

export default function AllocationDonutChart({ data }: AllocationDonutChartProps) {
    const { settings } = useSettings();

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-slate-800/50 rounded-xl border border-slate-700">
                <span className="text-slate-500">No allocation data available</span>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">Current Allocation</h3>
            </div>

            <div className="h-[220px] relative shrink-0">
                {/* Center Stats */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-slate-400 text-sm">Total Assets</span>
                    <span className="text-3xl font-bold text-white">{data.length}</span>
                    <span className="text-slate-500 text-xs">Categories</span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload as AllocationItem;
                                    return (
                                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <p className="text-white font-medium">{item.name}</p>
                                            </div>
                                            <p className="text-xl font-bold text-white mb-0.5">
                                                {item.percentage.toFixed(1)}%
                                            </p>
                                            <p className="text-slate-400 text-xs">
                                                {formatCurrency(item.value, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Custom Legend - Scrollable List */}
            <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar min-h-0">
                <div className="space-y-3">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-slate-300 truncate pr-2" title={item.name}>
                                            {item.name}
                                        </p>
                                        <span className="text-sm font-bold text-white shrink-0">
                                            {item.percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <p className="text-xs text-slate-500 truncate">
                                            {formatCurrency(item.value, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
