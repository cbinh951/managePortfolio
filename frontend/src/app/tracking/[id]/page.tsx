'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api';
import { TrackingListWithDetails, TrackingStockWithStatus, TrackingStockStatus } from '@/types/models';
import { formatCurrency } from '@/utils/currencyUtils';

export default function TrackingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [data, setData] = useState<TrackingListWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [uploadingExcel, setUploadingExcel] = useState(false);
    const [syncingPrices, setSyncingPrices] = useState(false);
    const [filter, setFilter] = useState<'all' | 'buy_zone' | 'high_potential' | 'over_limit'>('all');

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const trackingData = await apiClient.getTrackingList(id);
            setData(trackingData);
        } catch (error) {
            console.error('Failed to load tracking list:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExcelUpload = async (file: File) => {
        try {
            setUploadingExcel(true);
            await apiClient.uploadTrackingExcel(id, file);
            await loadData();
        } catch (error) {
            console.error('Failed to upload Excel:', error);
            alert('Failed to upload Excel file');
        } finally {
            setUploadingExcel(false);
        }
    };

    const handleSyncPrices = async () => {
        try {
            setSyncingPrices(true);
            const result = await apiClient.syncTrackingPrices(id);
            await loadData();
            alert(result.message || `Synced ${result.successful}/${result.total_stocks} prices`);
        } catch (error) {
            console.error('Failed to sync prices:', error);
            alert('Failed to sync prices');
        } finally {
            setSyncingPrices(false);
        }
    };

    const handleAddStocks = async (stocks: any[]) => {
        try {
            await apiClient.addTrackingStocks(id, stocks);
            setIsAddModalOpen(false);
            await loadData();
        } catch (error) {
            console.error('Failed to add stocks:', error);
            alert('Failed to add stocks');
        }
    };

    const handleDeleteStock = async (stockId: string) => {
        if (!confirm('Delete this stock?')) return;
        
        try {
            await apiClient.deleteTrackingStock(stockId);
            await loadData();
        } catch (error) {
            console.error('Failed to delete stock:', error);
            alert('Failed to delete stock');
        }
    };

    const getStatusBadge = (status: TrackingStockStatus) => {
        const configs = {
            [TrackingStockStatus.BUY_ZONE]: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'BUY ZONE' },
            [TrackingStockStatus.IN_RANGE]: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'IN RANGE' },
            [TrackingStockStatus.NEAR_LIMIT]: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'NEAR LIMIT' },
            [TrackingStockStatus.OVER_LIMIT]: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'OVER LIMIT' },
        };
        const config = configs[status];
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getRowClassName = (stock: TrackingStockWithStatus) => {
        if (stock.status === TrackingStockStatus.BUY_ZONE) return 'bg-green-500/5 border-green-500/30';
        if (stock.status === TrackingStockStatus.OVER_LIMIT) return 'bg-red-500/5 border-red-500/30';
        if (stock.is_attractive) return 'bg-yellow-500/5 border-yellow-500/30';
        return 'bg-slate-800/30 border-slate-700';
    };

    const getFilteredStocks = () => {
        if (!data) return [];
        
        switch (filter) {
            case 'buy_zone':
                return data.stocks.filter(s => s.status === TrackingStockStatus.BUY_ZONE);
            case 'high_potential':
                return data.stocks.filter(s => s.is_attractive);
            case 'over_limit':
                return data.stocks.filter(s => s.status === TrackingStockStatus.OVER_LIMIT);
            default:
                return data.stocks;
        }
    };

    const filteredStocks = getFilteredStocks();

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </main>
        );
    }

    if (!data) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-white mb-2">Tracking List Not Found</h2>
                    <button
                        onClick={() => router.push('/tracking')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Back to Lists
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <button
                            onClick={() => router.push('/tracking')}
                            className="text-slate-400 hover:text-white mb-2 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Lists
                        </button>
                        <h1 className="text-4xl font-bold text-white mb-2">{data.name}</h1>
                        <p className="text-slate-400">
                            Last updated: {new Date(data.updated_at).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSyncPrices}
                            disabled={syncingPrices || !data?.stocks.length}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {syncingPrices ? 'Syncing...' : 'Sync Prices'}
                        </button>
                        <label className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {uploadingExcel ? 'Uploading...' : 'Upload Excel'}
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={(e) => e.target.files && handleExcelUpload(e.target.files[0])}
                                disabled={uploadingExcel}
                            />
                        </label>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Stocks
                        </button>
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`bg-slate-800/50 border rounded-lg p-4 text-left transition-all hover:bg-slate-700/50 ${
                            filter === 'all' ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-700'
                        }`}
                    >
                        <div className="text-slate-400 text-sm mb-1">Total Stocks</div>
                        <div className="text-2xl font-bold text-white">{data.summary.total_stocks}</div>
                    </button>
                    <button
                        onClick={() => setFilter('buy_zone')}
                        className={`bg-green-500/10 border rounded-lg p-4 text-left transition-all hover:bg-green-500/20 ${
                            filter === 'buy_zone' ? 'border-green-500 ring-2 ring-green-500/50' : 'border-green-500/30'
                        }`}
                    >
                        <div className="text-green-300 text-sm mb-1">Buy Zone</div>
                        <div className="text-2xl font-bold text-green-400">{data.summary.buy_zone_count}</div>
                    </button>
                    <button
                        onClick={() => setFilter('high_potential')}
                        className={`bg-yellow-500/10 border rounded-lg p-4 text-left transition-all hover:bg-yellow-500/20 ${
                            filter === 'high_potential' ? 'border-yellow-500 ring-2 ring-yellow-500/50' : 'border-yellow-500/30'
                        }`}
                    >
                        <div className="text-yellow-300 text-sm mb-1">High Potential</div>
                        <div className="text-2xl font-bold text-yellow-400">{data.summary.attractive_count}</div>
                    </button>
                    <button
                        onClick={() => setFilter('over_limit')}
                        className={`bg-red-500/10 border rounded-lg p-4 text-left transition-all hover:bg-red-500/20 ${
                            filter === 'over_limit' ? 'border-red-500 ring-2 ring-red-500/50' : 'border-red-500/30'
                        }`}
                    >
                        <div className="text-red-300 text-sm mb-1">Over Limit</div>
                        <div className="text-2xl font-bold text-red-400">{data.summary.over_limit_count}</div>
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        All ({data.summary.total_stocks})
                    </button>
                    <button
                        onClick={() => setFilter('buy_zone')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filter === 'buy_zone'
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        Buy Zone ({data.summary.buy_zone_count})
                    </button>
                    <button
                        onClick={() => setFilter('high_potential')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filter === 'high_potential'
                                ? 'bg-yellow-600 text-white'
                                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        High Potential ({data.summary.attractive_count})
                    </button>
                    <button
                        onClick={() => setFilter('over_limit')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filter === 'over_limit'
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        Over Limit ({data.summary.over_limit_count})
                    </button>
                </div>

                {/* Stocks Table */}
                {filteredStocks.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/30 border border-slate-700 rounded-lg">
                        <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="text-xl font-bold text-white mb-2">{data.stocks.length === 0 ? 'No Stocks Yet' : 'No Matching Stocks'}</h3>
                        <p className="text-slate-400 mb-6">
                            {data.stocks.length === 0 
                                ? 'Upload Excel file or add stocks manually'
                                : `No stocks match the current filter. Try selecting a different filter.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-800 border-b border-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Ticker</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Company</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase">Current</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase">Stop Buy</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase">Sell Target</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase">Potential</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStocks.map((stock) => (
                                        <tr key={stock.stock_id} className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${getRowClassName(stock)}`}>
                                            <td className="px-4 py-4">
                                                <span className="font-mono font-bold text-white">{stock.ticker}</span>
                                            </td>
                                            <td className="px-4 py-4 text-slate-300">{stock.company_name}</td>
                                            <td className="px-4 py-4 text-right">
                                                {stock.current_price ? (
                                                    <span className="font-semibold text-white">{formatCurrency(stock.current_price)}</span>
                                                ) : (
                                                    <span className="text-slate-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right text-slate-300">{formatCurrency(stock.stop_buy_price)}</td>
                                            <td className="px-4 py-4 text-right text-slate-300">{formatCurrency(stock.sell_target_price)}</td>
                                            <td className="px-4 py-4 text-right">
                                                <span className={`font-bold ${stock.potential_profit > 20 ? 'text-yellow-400' : stock.potential_profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {stock.potential_profit > 0 ? '+' : ''}{stock.potential_profit.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {getStatusBadge(stock.status)}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteStock(stock.stock_id)}
                                                    className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded hover:bg-red-500/10"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Simple Add Stock Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsAddModalOpen(false)}>
                        <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <h2 className="text-2xl font-bold text-white mb-4">Add Stock Manually</h2>
                            <p className="text-slate-400 text-sm mb-4">
                                For automatic extraction, use the Upload Image button. This form is for manual entry.
                            </p>
                            <div className="text-center py-8 text-slate-500">
                                <p>Manual entry form coming soon</p>
                                <p className="text-sm mt-2">Use Upload Image for now</p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
