import { Snapshot } from '@/types/models';

export interface MonthlyReturn {
    year: number;
    month: number; // 0-11
    value: number; // percentage
}

export interface RiskMetrics {
    sharpeRatio: number;
    standardDeviation: number; // Annualized volatility
    maxDrawdown: number;
    winRate: number;
    bestMonth: number;
    worstMonth: number;
}

/**
 * process snapshots to calculate month-over-month returns
 */
export const calculateMonthlyReturns = (snapshots: Snapshot[]): MonthlyReturn[] => {
    if (!snapshots || snapshots.length < 2) return [];

    // Sort snapshots by date ascending
    const sorted = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group snapshots by month to find the starting and ending nav for each month
    // Strategy: For each month, find the last snapshot of that month. 
    // Return = (End of Month NAV - End of Previous Month NAV) / End of Previous Month NAV

    // 1. Map each snapshot to a YYYY-MM key
    const snapshotsByMonth = new Map<string, Snapshot>();

    sorted.forEach(s => {
        const date = new Date(s.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        // We want the LATEST snapshot for each month
        if (!snapshotsByMonth.has(key) || new Date(s.date) > new Date(snapshotsByMonth.get(key)!.date)) {
            snapshotsByMonth.set(key, s);
        }
    });

    const monthlyReturns: MonthlyReturn[] = [];
    const keys = Array.from(snapshotsByMonth.keys()).sort(); // Chronological order of months

    for (let i = 1; i < keys.length; i++) {
        const currentKey = keys[i];
        const prevKey = keys[i - 1];

        const currentSnapshot = snapshotsByMonth.get(currentKey)!;
        const prevSnapshot = snapshotsByMonth.get(prevKey)!;

        // Calculate return if we have a valid chain
        // Note: This assumes months are consecutive. If there's a gap, this logic might treat the gap as a single period.
        // For a personal portfolio, this is usually acceptable approximation.

        const returnVal = prevSnapshot.nav > 0
            ? ((currentSnapshot.nav - prevSnapshot.nav) / prevSnapshot.nav) * 100
            : 0;

        const date = new Date(currentSnapshot.date);
        monthlyReturns.push({
            year: date.getFullYear(),
            month: date.getMonth(),
            value: returnVal
        });
    }

    return monthlyReturns;
};

/**
 * Calculate risk statistics based on monthly returns or snapshot history
 */
export const calculateRiskMetrics = (snapshots: Snapshot[]): RiskMetrics => {
    if (!snapshots || snapshots.length < 2) {
        return {
            sharpeRatio: 0,
            standardDeviation: 0,
            maxDrawdown: 0,
            winRate: 0,
            bestMonth: 0,
            worstMonth: 0
        };
    }

    const monthlyReturns = calculateMonthlyReturns(snapshots);
    const returns = monthlyReturns.map(m => m.value);

    // 1. Standard Deviation (Volatility) - annualized
    // StdDev of monthly returns * sqrt(12)
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDevMonthly = Math.sqrt(variance);
    const annualizedVol = stdDevMonthly * Math.sqrt(12);

    // 2. Sharpe Ratio (assuming 0% risk free rate for simplicity or user can config later)
    // (Mean Monthly Return * 12) / Annualized Volatility
    const annualizedReturn = mean * 12;
    const sharpeRatio = annualizedVol !== 0 ? annualizedReturn / annualizedVol : 0;

    // 3. Max Drawdown
    let maxDrawdown = 0;
    let peak = -Infinity;

    // Using raw snapshots for more granular drawdown visibility
    const sortedSnapshots = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const s of sortedSnapshots) {
        if (s.nav > peak) peak = s.nav;
        const dd = peak > 0 ? ((peak - s.nav) / peak) * 100 : 0;
        if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // 4. Win Rate, Best/Worst
    const winRate = returns.length > 0
        ? (returns.filter(r => r > 0).length / returns.length) * 100
        : 0;

    const bestMonth = returns.length > 0 ? Math.max(...returns) : 0;
    const worstMonth = returns.length > 0 ? Math.min(...returns) : 0;

    return {
        sharpeRatio,
        standardDeviation: annualizedVol,
        maxDrawdown,
        winRate,
        bestMonth,
        worstMonth
    };
};
