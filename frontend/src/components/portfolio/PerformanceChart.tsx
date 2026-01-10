'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    TooltipProps,
} from 'recharts';
import { TimeRange, PerformanceChartData, ChartDataPoint } from '@/types/models';
import { apiClient } from '@/services/api';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';

interface PerformanceChartProps {
    portfolioId: string;
    defaultTimeRange?: TimeRange;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
    const { settings } = useSettings();

    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload as ChartDataPoint & { date: string };

    return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl">
            <p className="text-slate-300 font-medium mb-2">
                {new Date(data.date).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                })}
            </p>
            <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Total Equity:</span>
                    <span className="text-blue-400 font-semibold">
                        {formatCurrency(data.total_equity, 'VND', settings.displayCurrency, settings.exchangeRate)}
                    </span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Total Invested:</span>
                    <span className="text-yellow-400 font-semibold">
                        {formatCurrency(data.total_invested, 'VND', settings.displayCurrency, settings.exchangeRate)}
                    </span>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-700 pt-1">
                    <span className="text-slate-400">Current NAV:</span>
                    <span className="text-slate-300">
                        {formatCurrency(data.current_nav, 'VND', settings.displayCurrency, settings.exchangeRate)}
                    </span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Total Withdrawn:</span>
                    <span className="text-purple-400">
                        {formatCurrency(data.total_withdrawn, 'VND', settings.displayCurrency, settings.exchangeRate)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default function PerformanceChart({ portfolioId, defaultTimeRange = TimeRange.ALL }: PerformanceChartProps) {
    const { settings } = useSettings();
    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(defaultTimeRange);
    const [chartData, setChartData] = useState<PerformanceChartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadChartData();
    }, [portfolioId, selectedTimeRange]);

    const loadChartData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiClient.getPortfolioChartData(portfolioId, selectedTimeRange);
            setChartData(data);
        } catch (err) {
            console.error('Error loading chart data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load chart data');
        } finally {
            setLoading(false);
        }
    };

    // Format chart data for display
    const formattedChartData = useMemo(() => {
        if (!chartData?.data) return [];

        return chartData.data.map(point => ({
            ...point,
            // Convert to display currency
            total_equity_display: point.total_equity,
            total_invested_display: point.total_invested,
            current_nav_display: point.current_nav,
            total_withdrawn_display: point.total_withdrawn,
            // Format date for X-axis
            dateLabel: new Date(point.date).toLocaleDateString('vi-VN', {
                month: 'short',
                day: 'numeric'
            }),
        }));
    }, [chartData, settings.displayCurrency, settings.exchangeRate]);

    const timeRangeButtons: { label: string; value: TimeRange }[] = [
        { label: '1M', value: TimeRange.ONE_MONTH },
        { label: 'YTD', value: TimeRange.YEAR_TO_DATE },
        { label: '1Y', value: TimeRange.ONE_YEAR },
        { label: 'ALL', value: TimeRange.ALL },
    ];

    // Loading state
    if (loading) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        Portfolio Equity Over Time
                        <span
                            className="text-slate-400 cursor-help"
                            title="Total Equity includes current portfolio value and withdrawn capital. This ensures withdrawals are not shown as losses."
                        >
                            ℹ️
                        </span>
                    </h3>
                </div>
                <div className="h-[400px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Portfolio Equity Over Time</h3>
                </div>
                <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-400 text-lg mb-2">❌</div>
                        <p className="text-slate-400">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    // No data state
    if (!chartData || !chartData.hasData) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Portfolio Equity Over Time</h3>
                </div>
                <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="text-6xl mb-4">📊</div>
                        <h4 className="text-lg font-medium text-slate-300 mb-2">No Performance Data</h4>
                        <p className="text-slate-400 mb-4">
                            {chartData?.message || 'Please add at least one snapshot to view the performance chart.'}
                        </p>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                            + Add Snapshot
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    Portfolio Equity Over Time
                    <span
                        className="text-slate-400 cursor-help text-sm"
                        title="Total Equity includes current portfolio value and withdrawn capital. This ensures withdrawals are not shown as losses."
                    >
                        ℹ️
                    </span>
                </h3>

                {/* Time Range Selector */}
                <div className="flex gap-2">
                    {timeRangeButtons.map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => setSelectedTimeRange(value)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedTimeRange === value
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={formattedChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
                    <XAxis
                        dataKey="dateLabel"
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => {
                            // Format large numbers (e.g., 1000000 -> 1M)
                            if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                            return value.toString();
                        }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: '14px' }}
                        iconType="line"
                    />
                    <Line
                        type="monotone"
                        dataKey="total_equity_display"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        name="Total Equity"
                        dot={false}
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="total_invested_display"
                        stroke="#FBBF24"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Total Invested"
                        dot={false}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
