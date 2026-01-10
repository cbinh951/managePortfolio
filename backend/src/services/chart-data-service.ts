import {
    Transaction,
    Snapshot,
    ChartDataPoint,
    TimelinePoint,
    PerformanceChartData,
    TimeRange,
    TransactionType,
} from '../types/models';
import { calculateTotalInvested, calculateTotalWithdrawn } from './calculation-service';

export class ChartDataService {
    /**
     * Normalize timeline by merging transactions and snapshots by date
     * @param transactions - Array of transactions
     * @param snapshots - Array of snapshots
     * @returns Sorted array of timeline points
     */
    private normalizeTimeline(transactions: Transaction[], snapshots: Snapshot[]): TimelinePoint[] {
        // Extract all unique dates
        const dateSet = new Set<string>();
        transactions.forEach(t => dateSet.add(t.date));
        snapshots.forEach(s => dateSet.add(s.date));

        // Convert to array and sort chronologically (ascending)
        const sortedDates = Array.from(dateSet).sort((a, b) =>
            new Date(a).getTime() - new Date(b).getTime()
        );

        // Create timeline points
        const timeline: TimelinePoint[] = sortedDates.map(date => ({
            date,
            transactions: transactions.filter(t => t.date === date),
            snapshot: snapshots.find(s => s.date === date) || null,
        }));

        return timeline;
    }

    /**
     * Calculate metrics at a specific point in the timeline
     * @param allPointsUpToNow - All timeline points up to and including current
     * @param latestSnapshot - Most recent snapshot NAV
     * @returns Chart data point with all metrics
     */
    private calculateMetricsAtPoint(
        date: string,
        allPointsUpToNow: TimelinePoint[],
        latestSnapshot: Snapshot | null
    ): ChartDataPoint {
        // Collect all transactions up to this point
        const allTransactions = allPointsUpToNow.flatMap(p => p.transactions);

        // Calculate Total Invested (cumulative deposits)
        const totalInvested = calculateTotalInvested(allTransactions);

        // Calculate Total Withdrawn (cumulative withdrawals)
        const totalWithdrawn = calculateTotalWithdrawn(allTransactions);

        // Get current snapshot for this date (from timeline point)
        const currentPoint = allPointsUpToNow.find(p => p.date === date);
        const currentSnapshot = currentPoint?.snapshot;

        // Use current snapshot if exists, otherwise forward-fill from latest
        const currentNav = currentSnapshot?.nav ?? latestSnapshot?.nav ?? 0;

        // Calculate Total Equity (CORE METRIC)
        // Total Equity = Current NAV + Total Withdrawn
        // This ensures withdrawals don't decrease the performance line
        const totalEquity = currentNav + totalWithdrawn;

        return {
            date,
            total_invested: totalInvested,
            total_withdrawn: totalWithdrawn,
            current_nav: currentNav,
            total_equity: totalEquity,
        };
    }

    /**
     * Filter chart data by time range
     * @param chartData - Full chart data
     * @param timeRange - Time range filter
     * @returns Filtered chart data
     */
    private filterByTimeRange(chartData: ChartDataPoint[], timeRange: TimeRange): ChartDataPoint[] {
        if (timeRange === TimeRange.ALL) {
            return chartData;
        }

        const today = new Date();
        let cutoffDate: Date;

        switch (timeRange) {
            case TimeRange.ONE_MONTH:
                cutoffDate = new Date(today);
                cutoffDate.setDate(today.getDate() - 30);
                break;
            case TimeRange.YEAR_TO_DATE:
                cutoffDate = new Date(today.getFullYear(), 0, 1); // Jan 1
                break;
            case TimeRange.ONE_YEAR:
                cutoffDate = new Date(today);
                cutoffDate.setDate(today.getDate() - 365);
                break;
            default:
                return chartData;
        }

        return chartData.filter(point => new Date(point.date) >= cutoffDate);
    }

    /**
     * Generate portfolio performance chart data
     * @param portfolioName - Name of the portfolio
     * @param transactions - Portfolio transactions
     * @param snapshots - Portfolio snapshots
     * @param currentPerformance - Current portfolio performance metrics
     * @param timeRange - Time range filter
     * @returns Performance chart data
     */
    public generateChartData(
        portfolioId: string,
        portfolioName: string,
        transactions: Transaction[],
        snapshots: Snapshot[],
        currentPerformance: {
            total_invested: number;
            total_withdrawn: number;
            current_nav: number;
            total_equity: number;
            profit: number;
            profit_percentage: number;
            xirr: number | null;
        },
        timeRange: TimeRange = TimeRange.ALL
    ): PerformanceChartData {
        // Edge case: No snapshots
        if (snapshots.length === 0) {
            return {
                portfolio_id: portfolioId,
                portfolio_name: portfolioName,
                data: [],
                summary: currentPerformance,
                hasData: false,
                message: 'No snapshots available. Please add at least one snapshot to view performance.',
            };
        }

        // Normalize timeline
        const timeline = this.normalizeTimeline(transactions, snapshots);

        // Calculate metrics for each point
        const chartData: ChartDataPoint[] = [];
        let latestSnapshot: Snapshot | null = null;

        timeline.forEach((point, index) => {
            // Update latest snapshot if this point has one
            if (point.snapshot) {
                latestSnapshot = point.snapshot;
            }

            // Get all points up to and including this one
            const allPointsUpToNow = timeline.slice(0, index + 1);

            // Calculate metrics
            const dataPoint = this.calculateMetricsAtPoint(
                point.date,
                allPointsUpToNow,
                latestSnapshot
            );

            chartData.push(dataPoint);
        });

        // Filter by time range
        const filteredData = this.filterByTimeRange(chartData, timeRange);

        return {
            portfolio_id: portfolioId,
            portfolio_name: portfolioName,
            data: filteredData,
            summary: currentPerformance,
            hasData: filteredData.length > 0,
            message: filteredData.length === 0 ? `No data available for the selected time range (${timeRange})` : undefined,
        };
    }
}

export const chartDataService = new ChartDataService();
