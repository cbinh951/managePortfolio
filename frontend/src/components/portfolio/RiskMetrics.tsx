import { RiskMetrics as RiskMetricsType } from '@/utils/performanceUtils';

interface RiskMetricsProps {
    metrics: RiskMetricsType;
}

export default function RiskMetrics({ metrics }: RiskMetricsProps) {
    const items = [
        {
            label: 'Sharpe Ratio',
            subLabel: 'Risk-adjusted return',
            value: metrics.sharpeRatio.toFixed(2),
            valueClass: metrics.sharpeRatio >= 1 ? 'text-emerald-400' : 'text-slate-200'
        },
        {
            label: 'Standard Deviation',
            subLabel: 'Annualized volatility',
            value: `${metrics.standardDeviation.toFixed(1)}%`,
            valueClass: 'text-orange-400'
        },
        {
            label: 'Max Drawdown',
            subLabel: 'Largest peak-to-trough decline',
            value: `${metrics.maxDrawdown.toFixed(1)}%`,
            valueClass: 'text-red-400'
        },
        {
            label: 'Win Rate',
            subLabel: '% of positive months',
            value: `${metrics.winRate.toFixed(0)}%`,
            valueClass: metrics.winRate > 50 ? 'text-emerald-400' : 'text-slate-400'
        },
        {
            label: 'Best Month',
            subLabel: 'Highest monthly return',
            value: `${metrics.bestMonth > 0 ? '+' : ''}${metrics.bestMonth.toFixed(1)}%`,
            valueClass: 'text-emerald-400'
        },
        {
            label: 'Worst Month',
            subLabel: 'Lowest monthly return',
            value: `${metrics.worstMonth.toFixed(1)}%`,
            valueClass: 'text-red-400'
        }
    ];

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-full">
            <h3 className="text-lg font-semibold text-white mb-6">Risk Analysis</h3>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/20 transition-colors">
                        <div>
                            <div className="text-sm font-medium text-slate-300">{item.label}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{item.subLabel}</div>
                        </div>
                        <div className={`text-lg font-bold font-mono ${item.valueClass}`}>
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
