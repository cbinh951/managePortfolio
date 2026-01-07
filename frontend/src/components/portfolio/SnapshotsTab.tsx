import { Snapshot, AssetType } from '@/types/models';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';
import SnapshotHistoryTable from '../snapshots/SnapshotHistoryTable';

interface SnapshotsTabProps {
    snapshots: Snapshot[];
    portfolioId: string;
    loading?: boolean;
    onUpdate?: () => void;
    assetType?: AssetType;
}

export default function SnapshotsTab({ snapshots, portfolioId, loading = false, onUpdate, assetType }: SnapshotsTabProps) {
    const { settings } = useSettings();
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
                <p className="text-sm text-slate-500 mb-4">Record portfolio NAV snapshots to track value over time</p>
                <Link
                    href={`/portfolios/${portfolioId}/snapshots`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add First Snapshot
                </Link>
            </div>
        );
    }



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

            <SnapshotHistoryTable
                snapshots={snapshots}
                loading={loading}
                onUpdate={onUpdate}
                assetType={assetType}
            />
        </div>
    );
}
