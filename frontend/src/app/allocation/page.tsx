'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import AllocationDonutChart, { AllocationItem } from '@/components/allocation/AllocationDonutChart';
import AllocationTable from '@/components/allocation/AllocationTable';

export default function AssetAllocationPage() {
    const [loading, setLoading] = useState(true);
    const [allocationData, setAllocationData] = useState<AllocationItem[]>([]);
    const [totalNetWorth, setTotalNetWorth] = useState(0);
    const [totalCash, setTotalCash] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Portfolios and Cash Accounts
            const portfolios = await apiClient.getPortfolios();
            const cashAccounts = await apiClient.getCashAccounts();

            let totalWorth = 0;
            let cashTotal = 0;

            // Map for aggregation: Name -> Value
            const items: AllocationItem[] = [];
            const processedPortfolios = new Set<string>();

            // Process Portfolios
            for (const p of portfolios) {
                // Get performance for current value
                try {
                    const perf = await apiClient.getPortfolioPerformance(p.portfolio_id);
                    const val = perf.current_nav;
                    totalWorth += val;

                    // Use actual portfolio name
                    items.push({
                        name: p.name,
                        value: val,
                        percentage: 0, // Will calc later
                        color: '' // Will assign later
                    });

                } catch (e) {
                    console.error("Failed to load perf for", p.name);
                }
            }

            // Process Cash Accounts
            let cashTotalAll = 0;
            for (const c of cashAccounts) {
                try {
                    const bal = await apiClient.getCashAccountBalance(c.cash_account_id);
                    const val = bal.balance;
                    totalWorth += val;
                    cashTotal += val;
                    cashTotalAll += val;
                } catch (e) {
                    console.error("Failed to load balance for", c.name);
                }
            }

            // Add aggregate Cash entry if there is any cash
            if (cashTotalAll > 0) {
                items.push({
                    name: 'Cash & Equivalents',
                    value: cashTotalAll,
                    percentage: 0,
                    color: '#64748b' // Slate for cash
                });
            }

            setTotalNetWorth(totalWorth);
            setTotalCash(cashTotal);

            // Assign percentages and colors from palette
            const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

            // Sort by value desc
            items.sort((a, b) => b.value - a.value);

            // Assign colors
            items.forEach((item, index) => {
                item.percentage = totalWorth > 0 ? (item.value / totalWorth) * 100 : 0;
                if (item.name !== 'Cash & Equivalents') {
                    item.color = colors[index % colors.length];
                }
            });

            setAllocationData(items);

        } catch (error) {
            console.error('Failed to load allocation data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Asset Allocation</h1>
                        <p className="text-slate-400">Overview of your current portfolio distribution and net worth.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Export
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                            Rebalance
                        </button>
                    </div>
                </div>

                {/* Top Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-24 h-24 text-teal-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" /></svg>
                        </div>
                        <div className="relative z-10">
                            <p className="text-slate-400 text-sm font-medium mb-1">Total Net Worth</p>
                            <h2 className="text-3xl font-bold text-white mb-2">
                                {totalNetWorth.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </h2>
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                +5.2% vs last month
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-24 h-24 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4V6h16v12zm-4-6h-2v2h2v-2zM8 4h8v2H8z" /></svg>
                        </div>
                        <div className="relative z-10">
                            <p className="text-slate-400 text-sm font-medium mb-1">Cash Balance</p>
                            <h2 className="text-3xl font-bold text-white mb-2">
                                {totalCash.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </h2>
                            <p className="text-xs text-orange-400">
                                {((totalCash / totalNetWorth) * 100).toFixed(1)}% of Net Worth
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" /><path d="M7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" /></svg>
                        </div>
                        <div className="relative z-10">
                            <p className="text-slate-400 text-sm font-medium mb-1">YTD Return</p>
                            <h2 className="text-3xl font-bold text-white mb-2">+12.4%</h2>
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                +1.5% vs S&P 500
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3 h-[450px]">
                        <AllocationDonutChart data={allocationData} />
                    </div>
                </div>

                {/* Holdings Table */}
                <AllocationTable data={allocationData} />
            </div>
        </main>
    );
}
