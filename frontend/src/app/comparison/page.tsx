'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/services/api';
import { Portfolio, Snapshot } from '@/types/models';
import ComparisonChart from '@/components/comparison/ComparisonChart';
import ComparisonMatrix from '@/components/comparison/ComparisonMatrix';
import { calculateRiskMetrics } from '@/utils/performanceUtils';

interface PortfolioData {
    portfolio: Portfolio;
    snapshots: Snapshot[];
    color: string;
}

// Fixed color palette for selections
const CHART_COLORS = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#8b5cf6', // violet
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
    '#06b6d4', // cyan
];

type TimeRange = '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL';

export default function ComparisonPage() {
    const [loading, setLoading] = useState(true);
    const [availablePortfolios, setAvailablePortfolios] = useState<Portfolio[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Store fetched data to avoid re-fetching
    const [portfolioCache, setPortfolioCache] = useState<Map<string, Snapshot[]>>(new Map());

    const [timeRange, setTimeRange] = useState<TimeRange>('YTD');

    // Load list of portfolios on mount
    useEffect(() => {
        const fetchPortfolios = async () => {
            try {
                const list = await apiClient.getPortfolios();
                setAvailablePortfolios(list);
                // Select first 2 by default if available
                if (list.length > 0) {
                    setSelectedIds(list.slice(0, 2).map(p => p.portfolio_id));
                }
            } catch (err) {
                console.error("Failed to fetch portfolios", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPortfolios();
    }, []);

    // Fetch snapshot history when selection changes
    useEffect(() => {
        const fetchMissingSnapshots = async () => {
            const missingIds = selectedIds.filter(id => !portfolioCache.has(id));
            if (missingIds.length === 0) return;

            setLoading(true);
            const newCache = new Map(portfolioCache);

            await Promise.all(missingIds.map(async (id) => {
                try {
                    const snapshots = await apiClient.getPortfolioSnapshots(id);
                    newCache.set(id, snapshots);
                } catch (e) {
                    console.error(`Failed to fetch snapshots for ${id}`, e);
                    newCache.set(id, []);
                }
            }));

            setPortfolioCache(newCache);
            setLoading(false);
        };

        if (selectedIds.length > 0) {
            fetchMissingSnapshots();
        }
    }, [selectedIds, portfolioCache]);

    // Handle Selection Toggle
    const togglePortfolio = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(pid => pid !== id));
        } else {
            if (selectedIds.length >= 5) {
                alert("You can compare up to 5 portfolios at a time.");
                return;
            }
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Prepare Data for Chart and Matrix based on Time Range
    const processedData = useMemo(() => {
        const activePortfolios = availablePortfolios.filter(p => selectedIds.includes(p.portfolio_id));

        // 1. Determine Start Date based on range
        const now = new Date();
        let startDate = new Date(0); // Epoch

        switch (timeRange) {
            case '1M':
                startDate = new Date(); startDate.setMonth(now.getMonth() - 1); break;
            case '3M':
                startDate = new Date(); startDate.setMonth(now.getMonth() - 3); break;
            case '6M':
                startDate = new Date(); startDate.setMonth(now.getMonth() - 6); break;
            case 'YTD':
                startDate = new Date(now.getFullYear(), 0, 1); break;
            case '1Y':
                startDate = new Date(); startDate.setFullYear(now.getFullYear() - 1); break;
            case 'ALL':
            default:
                startDate = new Date(0); break;
        }

        // 2. Filter and Normalize Snapshots for each active portfolio
        const seriesData: any[] = [];
        const matrixItems: any[] = [];
        const allDates = new Set<string>();

        activePortfolios.forEach((p, index) => {
            const rawSnapshots = portfolioCache.get(p.portfolio_id) || [];
            // Sort by date strings properly converted to time
            const sorted = [...rawSnapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // Filter by date
            const filtered = sorted.filter(s => new Date(s.date) >= startDate);

            if (filtered.length > 0) {
                // Collect dates for x-axis
                filtered.forEach(s => {
                    const d = new Date(s.date).toISOString().split('T')[0]; // YYYY-MM-DD
                    allDates.add(d);
                });

                // Calculate Metrics
                const metrics = calculateRiskMetrics(filtered);

                // Calculate Total Return (Relative to start of period)
                const startNav = filtered[0].nav;
                const endNav = filtered[filtered.length - 1].nav;
                const totalReturn = startNav > 0 ? ((endNav - startNav) / startNav) * 100 : 0;

                matrixItems.push({
                    id: p.portfolio_id,
                    name: p.name,
                    color: CHART_COLORS[index % CHART_COLORS.length],
                    metrics,
                    totalReturn
                });
            }
        });

        // 3. Create Merged Chart Data
        const chartData: any[] = [];
        const sortedDates = Array.from(allDates).sort();

        sortedDates.forEach(dateStr => {
            const dataPoint: any = {
                date: dateStr,
                displayDate: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            };

            activePortfolios.forEach((p) => {
                const snapshots = portfolioCache.get(p.portfolio_id) || [];
                // Find snapshot on this date (or closest previous? For now exact match on date string or very close)
                // Simplification: exact day match
                const snap = snapshots.find(s => s.date.startsWith(dateStr));

                if (snap) {
                    // Need to generate normalized value relative to THIS PORTFOLIO'S start value in the range
                    // We need to find the base value for this portfolio in this range AGAIN (inefficient but safe)

                    // Optimization: Pre-calculate base values map
                    // Let's do it inside this loop but simpler:
                    // Find the first snapshot for this portfolio that is >= startDate
                    const sorted = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    const firstInPeriod = sorted.find(s => new Date(s.date) >= startDate);

                    if (firstInPeriod && firstInPeriod.nav > 0) {
                        const normalized = ((snap.nav - firstInPeriod.nav) / firstInPeriod.nav) * 100;
                        dataPoint[p.portfolio_id] = normalized;
                    }
                }
            });

            // Only add point if at least one series has data? Or just add it (holes are fine with connectNulls)
            chartData.push(dataPoint);
        });

        const series = activePortfolios.map((p, index) => ({
            id: p.portfolio_id,
            name: p.name,
            color: CHART_COLORS[index % CHART_COLORS.length]
        }));

        return { chartData, matrixItems, series };

    }, [availablePortfolios, selectedIds, portfolioCache, timeRange]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Performance Comparison</h1>
                        <p className="text-slate-400">Analyze divergence across your portfolios.</p>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Entity Selector (Simple Dropdown/List for now) */}
                    <div className="flex-1 w-full relative group z-20">
                        <div className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Select Portfolios</div>
                        <div className="flex flex-wrap gap-2">
                            {availablePortfolios.map(p => {
                                const isSelected = selectedIds.includes(p.portfolio_id);
                                const index = selectedIds.indexOf(p.portfolio_id);
                                const color = isSelected ? CHART_COLORS[index % CHART_COLORS.length] : 'transparent';

                                return (
                                    <button
                                        key={p.portfolio_id}
                                        onClick={() => togglePortfolio(p.portfolio_id)}
                                        className={`
                                            px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-2
                                            ${isSelected
                                                ? 'bg-slate-700 text-white border-slate-600'
                                                : 'text-slate-400 border-slate-700 hover:border-slate-500/50 hover:bg-slate-800'
                                            }
                                        `}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${isSelected ? '' : 'bg-slate-600'}`} style={{ backgroundColor: isSelected ? color : undefined }}></div>
                                        {p.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Time Range */}
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                        {(['1M', '3M', '6M', 'YTD', '1Y', 'ALL'] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === range
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {!loading && (
                    <>
                        {/* Chart */}
                        <ComparisonChart
                            data={processedData.chartData}
                            series={processedData.series}
                        />

                        {/* Metrics Table */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Summary Cards (Average Performance?) or just Matrix */}
                            <div className="lg:col-span-2">
                                <ComparisonMatrix items={processedData.matrixItems} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
