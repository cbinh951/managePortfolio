'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api';
import { TrackingList } from '@/types/models';

export default function TrackingPage() {
    const router = useRouter();
    const [lists, setLists] = useState<TrackingList[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadLists();
    }, []);

    const loadLists = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getTrackingLists();
            setLists(data);
        } catch (error) {
            console.error('Failed to load tracking lists:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newListName.trim()) return;

        try {
            setCreating(true);
            const newList = await apiClient.createTrackingList({ name: newListName });
            setIsCreateModalOpen(false);
            setNewListName('');
            router.push(`/tracking/${newList.list_id}`);
        } catch (error) {
            console.error('Failed to create list:', error);
            alert('Failed to create tracking list');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? This will remove all stocks in the list.`)) return;

        try {
            await apiClient.deleteTrackingList(id);
            await loadLists();
        } catch (error) {
            console.error('Failed to delete list:', error);
            alert('Failed to delete tracking list');
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Stock Accumulation</h1>
                        <p className="text-slate-400">
                            Track accumulation zones, stop-buy limits, and profit targets.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Tracking List
                    </button>
                </div>

                {/* Lists Grid */}
                {lists.length === 0 ? (
                    <div className="text-center py-20">
                        <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h2 className="text-2xl font-bold text-white mb-2">No Tracking Lists Yet</h2>
                        <p className="text-slate-400 mb-6">Create your first tracking list to start monitoring stock prices.</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                        >
                            Create Your First List
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lists.map((list) => (
                            <div
                                key={list.list_id}
                                className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-blue-500/50 transition-all cursor-pointer group"
                                onClick={() => router.push(`/tracking/${list.list_id}`)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                                        {list.name}
                                    </h3>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(list.list_id, list.name);
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                                        title="Delete list"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between text-slate-400">
                                        <span>Total Stocks:</span>
                                        <span className="font-semibold text-white">{list.stock_count || 0}</span>
                                    </div>
                                    {list.buy_zone_count !== undefined && (
                                        <div className="flex items-center justify-between text-slate-400">
                                            <span>Buy Zone:</span>
                                            <span className="font-semibold text-green-400">{list.buy_zone_count}</span>
                                        </div>
                                    )}
                                    {list.attractive_count !== undefined && (
                                        <div className="flex items-center justify-between text-slate-400">
                                            <span>High Potential:</span>
                                            <span className="font-semibold text-yellow-400">{list.attractive_count}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-700">
                                        <span>Last Updated:</span>
                                        <span className="text-slate-300">
                                            {new Date(list.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                            <h2 className="text-2xl font-bold text-white mb-4">Create Tracking List</h2>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    List Name
                                </label>
                                <input
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                                    placeholder="e.g., Tech Stocks Feb 2026"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setNewListName('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                    disabled={creating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newListName.trim() || creating}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
