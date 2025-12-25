import { Snapshot } from '@/types/models';
import Link from 'next/link';

interface SnapshotsTabProps {
    snapshots: Snapshot[];
    portfolioId: string;
    loading?: boolean;
}

export default function SnapshotsTab({ snapshots, portfolioId, loading = false }: SnapshotsTabProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (snapshots.length === 0) {
        return (
            <div className="text-center py-20">
                <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium text-slate-400 mb-2">No Snapshots Yet</h3>
                <p className="text-sm text-slate-500">Record portfolio NAV snapshots to track value over time</p>
            </div>
        );
    }

    // Sort snapshots by date descending
    const sortedSnapshots = [...snapshots].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">NAV Snapshots</h3>
                <Link
                    href={`/portfolios/${portfolioId}/snapshots`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Manage Snapshots
                </Link>
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    NAV
                                </th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Change
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {sortedSnapshots.map((snapshot, index) => {
                                const prevSnapshot = sortedSnapshots[index + 1];
                                const change = prevSnapshot
                                    ? ((snapshot.nav - prevSnapshot.nav) / prevSnapshot.nav) * 100
                                    : null;

                                return (
                                    <tr key={snapshot.snapshot_id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="py-4 px-6 text-sm text-slate-300">
                                            {new Date(snapshot.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-white text-right">
                                            ${snapshot.nav.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-right">
                                            {change !== null ? (
                                                <span className={`font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                    }`}>
                                                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                                </span>
                                            ) : (
                                                <span className="text-slate-500">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
