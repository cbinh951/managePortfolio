import { useState } from 'react';
import { Snapshot } from '@/types/models';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';

interface NAVChartProps {
    snapshots: Snapshot[];
    selectedPeriod: string;
    onPeriodChange: (period: string) => void;
}

const TIME_PERIODS = [
    { value: '1M', label: '1M' },
    { value: '1Y', label: '1Y' },
    { value: 'ALL', label: 'ALL' },
];

export default function NAVChart({ snapshots, selectedPeriod, onPeriodChange }: NAVChartProps) {
    const { settings } = useSettings();
    const [hoveredPoint, setHoveredPoint] = useState<{ snapshot: Snapshot; x: number; y: number } | null>(null);

    // Filter snapshots based on selected period
    const getFilteredSnapshots = () => {
        const now = new Date();

        if (selectedPeriod === '1M') {
            const oneMonthAgo = new Date(now);
            oneMonthAgo.setMonth(now.getMonth() - 1);
            return snapshots.filter(s => new Date(s.date) >= oneMonthAgo);
        }

        if (selectedPeriod === '1Y') {
            const oneYearAgo = new Date(now);
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            return snapshots.filter(s => new Date(s.date) >= oneYearAgo);
        }

        return snapshots; // ALL
    };

    const filteredSnapshots = getFilteredSnapshots();
    const currentNAV = snapshots.length > 0 ? snapshots[0].nav : 0;

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white">NAV Progression</h3>
                    <p className="text-sm text-slate-400">Track performance over last 12 months</p>
                </div>

                {/* Time Period Selector */}
                <div className="flex gap-2">
                    {TIME_PERIODS.map((period) => (
                        <button
                            key={period.value}
                            onClick={() => onPeriodChange(period.value)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${selectedPeriod === period.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Current NAV Indicator */}
            <div className="mb-4 text-right">
                <span className="text-xs text-slate-400">Current: </span>
                <span className="text-sm font-semibold text-white">
                    {formatCurrency(currentNAV, 'VND', settings.displayCurrency, settings.exchangeRate)}
                </span>
            </div>

            {/* Chart Placeholder */}
            <div className="h-80 bg-slate-900/50 rounded-lg border border-slate-700/50 flex items-center justify-center relative overflow-hidden">
                {filteredSnapshots.length === 0 ? (
                    <div className="text-center">
                        <svg className="w-16 h-16 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm text-slate-500">No snapshots available</p>
                        <p className="text-xs text-slate-600 mt-1">Add your first NAV snapshot to see the chart</p>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col">
                        {/* Chart SVG */}
                        <div className="flex-1 px-6 pt-6 pb-2 relative">
                            <svg
                                className="w-full h-full"
                                viewBox="0 0 800 280"
                                preserveAspectRatio="none"
                                onMouseLeave={() => setHoveredPoint(null)}
                            >
                                {/* Grid lines */}
                                <line x1="0" y1="70" x2="800" y2="70" stroke="rgb(51 65 85)" strokeWidth="1" strokeDasharray="5,5" />
                                <line x1="0" y1="140" x2="800" y2="140" stroke="rgb(51 65 85)" strokeWidth="1" strokeDasharray="5,5" />
                                <line x1="0" y1="210" x2="800" y2="210" stroke="rgb(51 65 85)" strokeWidth="1" strokeDasharray="5,5" />

                                {/* Line path */}
                                {filteredSnapshots.length > 1 && (() => {
                                    const sortedSnapshots = [...filteredSnapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                                    const maxNAV = Math.max(...sortedSnapshots.map(s => s.nav));
                                    const minNAV = Math.min(...sortedSnapshots.map(s => s.nav));
                                    const range = maxNAV - minNAV || 1;
                                    const padding = range * 0.1;

                                    const points = sortedSnapshots
                                        .map((snapshot, index) => {
                                            const x = (index / (sortedSnapshots.length - 1)) * 800;
                                            const normalizedValue = (snapshot.nav - minNAV + padding) / (range + 2 * padding);
                                            const y = 280 - (normalizedValue * 280);
                                            return `${x},${y}`;
                                        })
                                        .join(' ');

                                    return (
                                        <>
                                            {/* Line */}
                                            <polyline
                                                points={points}
                                                fill="none"
                                                stroke="#3b82f6"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            {/* Data point circles with hover zones */}
                                            {sortedSnapshots.map((snapshot, index) => {
                                                const x = (index / (sortedSnapshots.length - 1)) * 800;
                                                const normalizedValue = (snapshot.nav - minNAV + padding) / (range + 2 * padding);
                                                const y = 280 - (normalizedValue * 280);
                                                const isHovered = hoveredPoint?.snapshot.snapshot_id === snapshot.snapshot_id;

                                                return (
                                                    <g key={snapshot.snapshot_id}>
                                                        {/* Invisible larger hit area for easier hovering */}
                                                        <circle
                                                            cx={x}
                                                            cy={y}
                                                            r="12"
                                                            fill="transparent"
                                                            style={{ cursor: 'pointer' }}
                                                            onMouseEnter={() => setHoveredPoint({ snapshot, x, y })}
                                                        />
                                                        {/* Visible circle */}
                                                        <circle
                                                            cx={x}
                                                            cy={y}
                                                            r={isHovered ? "6" : "4"}
                                                            fill="#3b82f6"
                                                            stroke="#1e40af"
                                                            strokeWidth={isHovered ? "2" : "1"}
                                                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                        />
                                                    </g>
                                                );
                                            })}
                                        </>
                                    );
                                })()}
                            </svg>

                            {/* Tooltip */}
                            {hoveredPoint && (
                                <div
                                    className="absolute bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl z-10 pointer-events-none"
                                    style={{
                                        left: `${(hoveredPoint.x / 800) * 100}%`,
                                        top: `${(hoveredPoint.y / 280) * 100}%`,
                                        transform: 'translate(-50%, -120%)'
                                    }}
                                >
                                    <div className="text-xs text-slate-400 mb-1">
                                        {new Date(hoveredPoint.snapshot.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div className="text-sm font-semibold text-white">
                                        {formatCurrency(hoveredPoint.snapshot.nav, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* X-axis labels with month names */}
                        <div className="px-6 pb-4 relative bg-slate-900/30" style={{ height: '40px' }}>
                            <div className="flex justify-between items-start">
                                {(() => {
                                    const sortedSnapshots = [...filteredSnapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                    // Limit labels if too many data points
                                    let labelsToShow = sortedSnapshots;
                                    if (sortedSnapshots.length > 12) {
                                        // Show every nth label to avoid crowding
                                        const step = Math.ceil(sortedSnapshots.length / 12);
                                        labelsToShow = sortedSnapshots.filter((_, i) => i % step === 0 || i === sortedSnapshots.length - 1);
                                    }

                                    return labelsToShow.map((snapshot, index) => {
                                        const originalIndex = sortedSnapshots.findIndex(s => s.snapshot_id === snapshot.snapshot_id);
                                        const xPosition = (originalIndex / (sortedSnapshots.length - 1)) * 100;

                                        return (
                                            <div
                                                key={snapshot.snapshot_id}
                                                className="absolute transform -translate-x-1/2 text-xs font-medium"
                                                style={{ left: `${xPosition}%` }}
                                            >
                                                <div className="text-center bg-slate-900/80 px-2 py-1 rounded text-slate-300">
                                                    {new Date(snapshot.date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        year: sortedSnapshots.length > 6 ? undefined : '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
