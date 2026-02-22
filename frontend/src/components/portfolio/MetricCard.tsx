interface MetricCardProps {
    label: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    valueColor?: string;
    trend?: 'up' | 'down' | 'neutral';
    loading?: boolean;
    subtitle?: string;
    onEdit?: () => void;
}

export default function MetricCard({
    label,
    value,
    change,
    changeLabel,
    icon,
    valueColor = 'text-white',
    trend = 'neutral',
    loading = false,
    subtitle,
    onEdit,
}: MetricCardProps) {
    const getTrendColor = () => {
        if (trend === 'up') return 'text-emerald-400';
        if (trend === 'down') return 'text-red-400';
        return 'text-slate-400';
    };

    const getTrendIcon = () => {
        if (trend === 'up') {
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            );
        }
        if (trend === 'down') {
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            );
        }
        return null;
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        {label}
                    </span>
                    {subtitle && (
                        <div className="text-xs text-slate-500 mt-0.5">
                            {subtitle}
                        </div>
                    )}
                </div>
                {icon && <div className="opacity-70">{icon}</div>}
            </div>

            {loading ? (
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                </div>
            ) : (
                <>
                    <div className={`text-3xl font-bold ${valueColor} mb-2 flex items-center gap-2`}>
                        <span>{value}</span>
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                                title="Edit value"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {change !== undefined && (
                        <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
                            {getTrendIcon()}
                            <span className="font-medium">
                                {change > 0 ? '+' : ''}{change.toFixed(2)}%
                            </span>
                            {changeLabel && (
                                <span className="text-slate-500 ml-1">{changeLabel}</span>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
