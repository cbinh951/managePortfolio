import React from 'react';

interface KPICardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    iconBg?: string;
    valueColor?: string;
}

export default function KPICard({
    title,
    value,
    change,
    changeLabel = 'vs last month',
    icon,
    iconBg = 'bg-blue-500/10',
    valueColor = 'text-white',
}: KPICardProps) {
    const isPositive = change !== undefined && change >= 0;

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">{title}</h3>
                {icon && (
                    <div className={`p-2 rounded-lg ${iconBg}`}>
                        {icon}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <p className={`text-3xl font-bold ${valueColor}`}>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </p>

                {change !== undefined && (
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                        </span>
                        <span className="text-xs text-slate-500">{changeLabel}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
