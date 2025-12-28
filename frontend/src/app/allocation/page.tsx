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

            // Map for aggregation: AssetType -> Value
            const typeAggregation = new Map<string, number>();

            // Process Portfolios
            // Since Portfolio model doesn't strictly have 'Asset Type' on the root object in all API responses (it might be in 'asset' relation),
            // and types/models.ts shows Portfolio has asset_id. 
            // For now, we'll try to guess/mock or use what is available. 
            // Ideally, the API should return 'type' or 'asset_class'.
            // Based on models, Portfolio has no direct 'type'. 
            // We will make a safe assumption: 
            // - If name contains "Stock", "Equity" -> Stocks
            // - If name contains "Bond" -> Bonds
            // - Else -> "Other"
            // *Real implementation would need relation expansion*

            // For this demo, let's fetch full details or assume logic
            for (const p of portfolios) {
                // Get performance for current value
                try {
                    const perf = await apiClient.getPortfolioPerformance(p.portfolio_id);
                    const val = perf.current_nav;
                    totalWorth += val;

                    // Rudimentary categorization for demo purposes
                    let type = 'Other';
                    const nameLower = p.name.toLowerCase();
                    if (nameLower.includes('stock') || nameLower.includes('equity') || nameLower.includes('tech')) type = 'Stocks';
                    else if (nameLower.includes('bond') || nameLower.includes('fixed')) type = 'Bonds';
                    else if (nameLower.includes('gold') || nameLower.includes('crypto')) type = 'Alternatives';
                    else if (nameLower.includes('etf')) type = 'ETFs';

                    typeAggregation.set(type, (typeAggregation.get(type) || 0) + val);
                } catch (e) {
                    console.error("Failed to load perf for", p.name);
                }
            }

            // Process Cash Accounts
            for (const c of cashAccounts) {
                try {
                    const bal = await apiClient.getCashAccountBalance(c.cash_account_id);
                    const val = bal.balance;
                    totalWorth += val;
                    cashTotal += val;

                    typeAggregation.set('Cash & Equiv.', (typeAggregation.get('Cash & Equiv.') || 0) + val);
                } catch (e) {
                    console.error("Failed to load balance for", c.name);
                }
            }

            setTotalNetWorth(totalWorth);
            setTotalCash(cashTotal);

            // Convert map to AllocationItem[]
            const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b'];
            let colorIdx = 0;

            const items: AllocationItem[] = [];
            typeAggregation.forEach((value, key) => {
                items.push({
                    name: key,
                    value: value,
                    percentage: totalWorth > 0 ? (value / totalWorth) * 100 : 0,
                    color: colors[colorIdx % colors.length]
                });
                colorIdx++;
            });

            // Sort by value desc
            items.sort((a, b) => b.value - a.value);

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
                    <div className="lg:col-span-1 h-[450px]">
                        <AllocationDonutChart data={allocationData} />
                    </div>
                    {/* Target vs Actual (Placeholder for now, simplified as a card or future component) */}
                    <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6 relative">
                        <h3 className="text-lg font-semibold text-white mb-6">Target vs. Actual</h3>

                        {/* Mock Stacked Bar for visual match */}
                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Your Target Strategy</span>
                                    <span className="text-slate-300">Conservative Growth</span>
                                </div>
                                <div className="h-4 w-full rounded-full flex overflow-hidden">
                                    <div className="w-[50%] bg-blue-500"></div>
                                    <div className="w-[25%] bg-purple-500"></div>
                                    <div className="w-[15%] bg-teal-500"></div>
                                    <div className="w-[10%] bg-slate-500"></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Current Reality</span>
                                    <span className="text-orange-400">Needs Rebalancing</span>
                                </div>
                                <div className="h-4 w-full rounded-full flex overflow-hidden">
                                    {allocationData.map((item) => (
                                        <div
                                            key={item.name}
                                            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex gap-4">
                                <div className="shrink-0 text-blue-400 mt-1">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                </div>
                                <div>
                                    <h4 className="text-blue-200 font-medium mb-1">Cash Drag Detected</h4>
                                    <p className="text-sm text-blue-300/80">
                                        Your cash position is {((totalCash / totalNetWorth) * 100).toFixed(0)}% of your portfolio.
                                        Consider deploying excess capital into Stocks or Bonds to align with your strategy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Holdings Table */}
                <AllocationTable data={allocationData} />
            </div>
        </main>
    );
}
