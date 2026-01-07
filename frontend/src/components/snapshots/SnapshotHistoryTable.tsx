'use client';

import { useState } from 'react';
import { Snapshot, AssetType } from '@/types/models';
import EditSnapshotModal from './EditSnapshotModal';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';
import { apiClient } from '@/services/api';

interface SnapshotHistoryTableProps {
    snapshots: Snapshot[];
    loading?: boolean;
    onUpdate?: () => void;
    assetType?: AssetType;
}

export default function SnapshotHistoryTable({ snapshots, loading = false, onUpdate, assetType }: SnapshotHistoryTableProps) {
    const { settings } = useSettings();
    const [editingSnapshot, setEditingSnapshot] = useState<Snapshot | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deletingSnapshot, setDeletingSnapshot] = useState<Snapshot | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [sortColumn, setSortColumn] = useState<'date' | 'nav' | 'change'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleEditClick = (snapshot: Snapshot) => {
        setEditingSnapshot(snapshot);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        setEditingSnapshot(null);
        if (onUpdate) {
            onUpdate();
        }
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setEditingSnapshot(null);
    };

    const handleDeleteClick = (snapshot: Snapshot) => {
        setDeletingSnapshot(snapshot);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingSnapshot) return;

        try {
            setDeleting(true);

            await apiClient.deleteSnapshot(deletingSnapshot.snapshot_id);

            setIsDeleteDialogOpen(false);
            setDeletingSnapshot(null);

            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete snapshot. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setIsDeleteDialogOpen(false);
        setDeletingSnapshot(null);
    };

    const handleSort = (column: 'date' | 'nav' | 'change') => {
        if (sortColumn === column) {
            // Toggle direction if clicking same column
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new column and default to descending
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (snapshots.length === 0) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
                <div className="text-center py-20">
                    <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-400 mb-2">No Snapshots Yet</h3>
                    <p className="text-sm text-slate-500">Start tracking your portfolio by adding your first NAV snapshot</p>
                </div>
            </div>
        );
    }

    // Sort snapshots based on selected column and direction
    const sortedSnapshots = [...snapshots].sort((a, b) => {
        let comparison = 0;

        if (sortColumn === 'date') {
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (sortColumn === 'nav') {
            comparison = a.nav - b.nav;
        } else if (sortColumn === 'change') {
            // First sort by date to get correct previous snapshot
            const dateSorted = [...snapshots].sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
            const indexA = dateSorted.findIndex(s => s.snapshot_id === a.snapshot_id);
            const indexB = dateSorted.findIndex(s => s.snapshot_id === b.snapshot_id);
            const prevA = dateSorted[indexA + 1];
            const prevB = dateSorted[indexB + 1];
            const changeA = prevA ? ((a.nav - prevA.nav) / prevA.nav) * 100 : 0;
            const changeB = prevB ? ((b.nav - prevB.nav) / prevB.nav) * 100 : 0;
            comparison = changeA - changeB;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    return (
        <>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">History</h3>
                    <div className="text-sm text-slate-400">
                        {sortedSnapshots.length} snapshot{sortedSnapshots.length !== 1 ? 's' : ''}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th
                                    onClick={() => handleSort('date')}
                                    className="text-left py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>Date</span>
                                        {sortColumn === 'date' && (
                                            <svg className={`w-3 h-3 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </div>
                                </th>
                                {assetType === AssetType.GOLD && (
                                    <>
                                        <th className="text-right py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            Branded (Chỉ)
                                        </th>
                                        <th className="text-right py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            Private (Chỉ)
                                        </th>
                                    </>
                                )}
                                {assetType !== AssetType.GOLD && (
                                    <th
                                        onClick={() => handleSort('nav')}
                                        className="text-right py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors select-none"
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            <span>NAV</span>
                                            {sortColumn === 'nav' && (
                                                <svg className={`w-3 h-3 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            )}
                                        </div>
                                    </th>
                                )}
                                <th
                                    onClick={() => handleSort('change')}
                                    className="text-right py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors select-none"
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        <span>Change</span>
                                        {sortColumn === 'change' && (
                                            <svg className={`w-3 h-3 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </div>
                                </th>
                                <th className="text-right py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {sortedSnapshots.map((snapshot) => {
                                // Calculate change from previous snapshot in date-sorted order
                                const dateSorted = [...snapshots].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                const dateIndex = dateSorted.findIndex(s => s.snapshot_id === snapshot.snapshot_id);
                                const prevSnapshot = dateSorted[dateIndex + 1];
                                const change = prevSnapshot
                                    ? ((snapshot.nav - prevSnapshot.nav) / prevSnapshot.nav) * 100
                                    : null;

                                return (
                                    <tr key={snapshot.snapshot_id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="py-3 px-6 text-sm text-slate-300">
                                            {new Date(snapshot.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        {assetType === AssetType.GOLD && (
                                            <>
                                                <td className="py-3 px-6 text-sm text-yellow-500 text-right">
                                                    {snapshot.branded_gold_price
                                                        ? formatCurrency(snapshot.branded_gold_price, 'VND', settings.displayCurrency, settings.exchangeRate)
                                                        : '-'}
                                                </td>
                                                <td className="py-3 px-6 text-sm text-yellow-500 text-right">
                                                    {snapshot.private_gold_price
                                                        ? formatCurrency(snapshot.private_gold_price, 'VND', settings.displayCurrency, settings.exchangeRate)
                                                        : '-'}
                                                </td>
                                            </>
                                        )}
                                        {assetType !== AssetType.GOLD && (
                                            <td className="py-3 px-6 text-sm font-semibold text-white text-right">
                                                {formatCurrency(snapshot.nav, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                            </td>
                                        )}
                                        <td className="py-3 px-6 text-sm text-right">
                                            {change !== null ? (
                                                <span className={`font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                    }`}>
                                                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                                </span>
                                            ) : (
                                                <span className="text-slate-500">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(snapshot)}
                                                    className="p-1.5 hover:bg-slate-600 rounded transition-colors cursor-pointer"
                                                    title="Edit snapshot"
                                                >
                                                    <svg className="w-4 h-4 text-slate-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(snapshot)}
                                                    className="p-1.5 hover:bg-red-600/20 rounded transition-colors cursor-pointer"
                                                    title="Delete snapshot"
                                                    disabled={deleting}
                                                >
                                                    <svg className="w-4 h-4 text-slate-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            <EditSnapshotModal
                isOpen={isEditModalOpen}
                snapshot={editingSnapshot}
                onClose={handleCloseModal}
                onSuccess={handleEditSuccess}
                assetType={assetType}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                snapshot={deletingSnapshot}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />
        </>
    );
}
