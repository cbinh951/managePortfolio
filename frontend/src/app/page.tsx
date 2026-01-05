'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';
import KPICard from '@/components/common/KPICard';
import NetWorthChart from '@/components/charts/NetWorthChart';
import AllocationChart from '@/components/charts/AllocationChart';
import { formatXIRR } from '@/utils/performanceUtils';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await apiClient.getDashboard();
        setDashboardData(data);
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

  const overallXIRR = dashboardData ? calculateOverallXIRR() : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, Alex
              </h1>
              <p className="text-slate-400">
                Here&apos;s your financial performance as of today.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors text-sm font-medium">
                YTD
              </button>
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors text-sm font-medium">
                1Y
              </button>
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors text-sm font-medium">
                Max
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Asset
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
              <KPICard
                title="Total Net Worth"
                value={formatCurrency(dashboardData.total_net_worth, 'VND', settings.displayCurrency, settings.exchangeRate)}
                change={5.2}
                icon={<WalletIcon />}
                iconBg="bg-blue-500/10"
              />
              <KPICard
                title="Total Cash"
                value={formatCurrency(dashboardData.total_cash, 'VND', settings.displayCurrency, settings.exchangeRate)}
                change={1.2}
                icon={<CashIcon />}
                iconBg="bg-emerald-500/10"
                valueColor="text-emerald-400"
              />
              <KPICard
                title="Investments NAV"
                value={formatCurrency(dashboardData.total_investment_nav, 'VND', settings.displayCurrency, settings.exchangeRate)}
                change={6.1}
                icon={<ChartIcon />}
                iconBg="bg-purple-500/10"
                valueColor="text-purple-400"
              />
              <KPICard
                title="Overall XIRR"
                value={`${formatXIRR(overallXIRR)}%`}
                change={10.5}
                changeLabel="Annualized"
                icon={<PercentIcon />}
                iconBg="bg-amber-500/10"
                valueColor="text-amber-400"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <NetWorthChart />
              </div>
              <div className="lg:col-span-1">
                <AllocationChart
                  totalCash={dashboardData.total_cash}
                  totalInvestment={dashboardData.total_investment_nav}
                />
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
