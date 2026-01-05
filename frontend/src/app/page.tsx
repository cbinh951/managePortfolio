'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';
import KPICard from '@/components/common/KPICard';
import NetWorthChart from '@/components/charts/NetWorthChart';
import AllocationChart from '@/components/charts/AllocationChart';
import { formatXIRR } from '@/utils/performanceUtils';
import Link from 'next/link';

// Icons as SVG components
const WalletIcon = () => (
  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const CashIcon = () => (
  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

const PercentIcon = () => (
  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

export default function Home() {
  const { settings } = useSettings();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [netWorthHistory, setNetWorthHistory] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [portfolioNames, setPortfolioNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'nav' | 'return'; direction: 'asc' | 'desc' }>({ key: 'nav', direction: 'desc' });

  const handleDeletePortfolio = async (id: string) => {
    try {
      await apiClient.deletePortfolio(id);
      // Refresh local data by removing the deleted portfolio
      setDashboardData((prev: any) => ({
        ...prev,
        portfolios: prev.portfolios.filter((p: any) => p.portfolio_id !== id)
      }));
    } catch (error) {
      console.error("Failed to delete portfolio:", error);
      alert("Failed to delete portfolio. Please try again.");
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [data, snapshots, transactions, portfoliosList] = await Promise.all([
          apiClient.getDashboard(),
          apiClient.getSnapshots(),
          apiClient.getTransactions(),
          apiClient.getPortfolios()
        ]);

        setDashboardData(data);
        setRecentTransactions(transactions.slice(0, 5)); // Top 5 recent

        // Create a map of portfolio ID to name
        const names: Record<string, string> = {};
        portfoliosList.forEach((p: any) => {
          names[p.portfolio_id] = p.name;
        });
        setPortfolioNames(names);

        // Process snapshots for Net Worth Chart
        // 1. Get all unique portfolios and sort snapshots
        const sortedSnapshots = snapshots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const portfolioIds = Array.from(new Set(snapshots.map(s => s.portfolio_id)));

        if (sortedSnapshots.length === 0) {
          setNetWorthHistory([]);
          return;
        }

        // 2. Determine timeline range (from first snapshot to today)
        const firstDate = new Date(sortedSnapshots[0].date);
        const lastDate = new Date(); // Up to today

        const timelineMonths: string[] = [];
        const currentDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
        const endDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);

        while (currentDate <= endDate) {
          timelineMonths.push(`${currentDate.getFullYear()}-${currentDate.getMonth()}`);
          currentDate.setMonth(currentDate.getMonth() + 1);
        }

        // 3. For each month, calculate total net worth by summing latest NAV of each portfolio
        const history = timelineMonths.map(monthKey => {
          const [year, month] = monthKey.split('-').map(Number);
          const monthEndDate = new Date(year, month + 1, 0); // End of the month

          let totalNav = 0;

          portfolioIds.forEach(pid => {
            // Find the latest snapshot for this portfolio on or before this month
            const relevantSnapshots = sortedSnapshots.filter(s =>
              s.portfolio_id === pid &&
              new Date(s.date) <= monthEndDate
            );

            if (relevantSnapshots.length > 0) {
              // The last one is the latest because sortedSnapshots is chronological
              // Ensure nav is treated as a number to avoid string concatenation
              totalNav += Number(relevantSnapshots[relevantSnapshots.length - 1].nav);
            }
          });

          return {
            month: new Date(year, month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            value: totalNav
          };
        });

        setNetWorthHistory(history);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate overall XIRR (weighted average)
  const calculateOverallXIRR = () => {
    if (!dashboardData || dashboardData.portfolios.length === 0) return 0;

    const totalInvested = dashboardData.portfolios.reduce((sum: number, p: any) => sum + p.total_invested, 0);
    if (totalInvested === 0) return 0;

    const weightedXIRR = dashboardData.portfolios.reduce((sum: number, p: any) => {
      const weight = p.total_invested / totalInvested;
      return sum + (p.xirr * weight);
    }, 0);

    return weightedXIRR;
  };

  const calculateTotalProfit = () => {
    if (!dashboardData) return 0;
    const totalProfit = dashboardData.portfolios.reduce((sum: number, p: any) => sum + p.profit, 0);
    return totalProfit;
  }

  const calculateTotalProfitPercent = () => {
    if (!dashboardData) return 0;
    const totalInvested = dashboardData.portfolios.reduce((sum: number, p: any) => sum + p.total_invested, 0);
    const totalProfit = calculateTotalProfit();
    return totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  }

  const overallXIRR = dashboardData ? calculateOverallXIRR() : 0;
  const totalProfit = calculateTotalProfit();
  const totalProfitPercent = calculateTotalProfitPercent();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Dashboard test
              </h1>
              <p className="text-slate-400">
                Overview of your total wealth and performance
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Transaction
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Loading dashboard...</p>
          </div>
        ) : dashboardData ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="relative group">
                <KPICard
                  title="Total Net Worth"
                  value={formatCurrency(dashboardData.total_net_worth, 'VND', settings.displayCurrency, settings.exchangeRate)}
                  icon={<WalletIcon />}
                  iconBg="bg-blue-500/10"
                />
                {/* Tooltip */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-slate-300 text-xs p-2 rounded border border-slate-700 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 text-center pointer-events-none z-10">
                  Sum of all cash and investment values
                </div>
              </div>

              <div className="relative group">
                <KPICard
                  title="Total Profit"
                  value={formatCurrency(totalProfit, 'VND', settings.displayCurrency, settings.exchangeRate)}
                  change={totalProfitPercent}
                  changeLabel="Return"
                  icon={<CashIcon />}
                  iconBg="bg-emerald-500/10"
                  valueColor={totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}
                />
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-slate-300 text-xs p-2 rounded border border-slate-700 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 text-center pointer-events-none z-10">
                  Total Gain/Loss on invested capital
                </div>
              </div>

              <div className="relative group">
                <KPICard
                  title="Invested Capital"
                  value={formatCurrency(dashboardData.total_investment_nav - totalProfit, 'VND', settings.displayCurrency, settings.exchangeRate)}
                  icon={<ChartIcon />}
                  iconBg="bg-purple-500/10"
                  valueColor="text-purple-400"
                />
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-slate-300 text-xs p-2 rounded border border-slate-700 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 text-center pointer-events-none z-10">
                  Total amount deposited into investments
                </div>
              </div>

              <div className="relative group">
                <KPICard
                  title="Overall XIRR"
                  value={`${formatXIRR(overallXIRR)}%`}
                  changeLabel="Annualized"
                  icon={<PercentIcon />}
                  iconBg="bg-amber-500/10"
                  valueColor="text-amber-400"
                />
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-slate-300 text-xs p-2 rounded border border-slate-700 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 text-center pointer-events-none z-10">
                  Weighted average annualized return
                </div>
              </div>
            </div>

            {/* Charts & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <NetWorthChart data={netWorthHistory} />
              </div>
              <div className="lg:col-span-1">
                <AllocationChart
                  totalCash={dashboardData.total_cash}
                  portfolios={dashboardData.portfolios.map((p: any) => ({
                    id: p.portfolio_id,
                    name: portfolioNames[p.portfolio_id] || `Portfolio ${p.portfolio_id.substring(0, 4)}`,
                    value: p.current_nav
                  }))}
                />
              </div>
            </div>

            {/* New Section: Your Portfolios */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolios List */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Your Portfolios</h3>
                </div>

                {/* Sort Headers */}
                <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700/50 mb-2">
                  <div
                    className="cursor-pointer hover:text-slate-300 flex items-center gap-1"
                    onClick={() => {
                      const direction = sortConfig.key === 'name' && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                      setSortConfig({ key: 'name', direction });
                    }}
                  >
                    Name
                    {sortConfig.key === 'name' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className="cursor-pointer hover:text-slate-300 flex items-center gap-1 justify-end w-24"
                      onClick={() => {
                        const direction = sortConfig.key === 'nav' && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                        setSortConfig({ key: 'nav', direction });
                      }}
                    >
                      NAV
                      {sortConfig.key === 'nav' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                    <div
                      className="cursor-pointer hover:text-slate-300 flex items-center gap-1 justify-end w-24"
                      onClick={() => {
                        const direction = sortConfig.key === 'return' && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                        setSortConfig({ key: 'return', direction });
                      }}
                    >
                      Return
                      {sortConfig.key === 'return' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                    <div className="w-8"></div>{/* Spacer for delete button */}
                  </div>
                </div>

                <div className="space-y-4">
                  {(() => {
                    const sortedPortfolios = [...dashboardData.portfolios].sort((a: any, b: any) => {
                      const key = sortConfig.key;
                      const direction = sortConfig.direction === 'asc' ? 1 : -1;

                      if (key === 'name') {
                        const nameA = portfolioNames[a.portfolio_id] || '';
                        const nameB = portfolioNames[b.portfolio_id] || '';
                        return nameA.localeCompare(nameB) * direction;
                      }
                      if (key === 'nav') {
                        return (a.current_nav - b.current_nav) * direction;
                      }
                      if (key === 'return') {
                        return (a.profit_percentage - b.profit_percentage) * direction;
                      }
                      return 0;
                    });

                    if (sortedPortfolios.length === 0) {
                      return <div className="text-center text-slate-500 py-4">No portfolios found</div>;
                    }

                    return sortedPortfolios.map((portfolio: any) => (
                      <div key={portfolio.portfolio_id} className="relative group bg-slate-800 rounded-lg border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-700/50 transition-all flex items-center pr-2">
                        <Link href={`/portfolios/${portfolio.portfolio_id}`} className="flex-1">
                          <div className="flex items-center justify-between p-4 cursor-pointer">
                            <div>
                              <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                {portfolioNames[portfolio.portfolio_id] || `Portfolio ${portfolio.portfolio_id.substring(0, 8)}...`}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right w-24">
                                <div className="text-sm font-medium text-slate-200">
                                  {formatCurrency(portfolio.current_nav, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                </div>
                              </div>
                              <div className="text-right w-24">
                                <div className={`font-bold ${portfolio.profit_percentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {portfolio.profit_percentage >= 0 ? '+' : ''}{portfolio.profit_percentage.toFixed(2)}%
                                </div>
                              </div>
                              <div className="w-8 flex justify-end">
                                {/* Spacer to match header */}
                              </div>
                            </div>
                          </div>
                        </Link>
                        {/* Delete Button */}
                        <div className="w-8 shrink-0 flex justify-center z-10">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
                                handleDeletePortfolio(portfolio.portfolio_id);
                              }
                            }}
                            className="p-2 text-red-500 hover:text-red-400 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors"
                            title="Delete Portfolio"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-0">
                  {recentTransactions.length > 0 ? (
                    <div className="divide-y divide-slate-700/50">
                      {recentTransactions.map((t: any) => (
                        <div key={t.transaction_id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${t.type === 'DEPOSIT' ? 'bg-emerald-400' : t.type === 'WITHDRAW' ? 'bg-red-400' : 'bg-blue-400'}`}></div>
                            <div>
                              <div className="text-sm font-medium text-slate-200">{t.type}</div>
                              <div className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="text-sm font-mono text-slate-300">
                            {formatCurrency(t.amount, 'VND', settings.displayCurrency, settings.exchangeRate)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-4">No recent transactions</div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Error State */
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
            <p className="text-slate-400 mb-6">
              Make sure your backend server is running on port 3001
            </p>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-left max-w-md mx-auto">
              <p className="text-sm text-slate-300 mb-2 font-mono">cd backend</p>
              <p className="text-sm text-slate-300 font-mono">npm run dev</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
