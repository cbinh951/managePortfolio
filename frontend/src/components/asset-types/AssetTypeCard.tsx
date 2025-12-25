import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    iconBg?: string;
}

export default function AssetTypeCard({
    title,
    value,
    subtitle,
    icon,
    iconBg = 'bg-slate-700/50',
}: StatCardProps) {
    return (
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg p-5 hover:border-slate-600/50 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className={`p-2.5 rounded-lg ${iconBg}`}>
                            {icon}
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            {title}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-2">
                <p className="text-2xl font-bold text-white">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {subtitle && (
                    <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
                )}
            </div>
        </div>
    );
}
