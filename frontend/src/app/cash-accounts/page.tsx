'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api';
import { CashAccount, Platform } from '@/types/models';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';
import CashAccountTable from '@/components/cash-accounts/CashAccountTable';
import CreateCashAccountModal from '@/components/cash-accounts/CreateCashAccountModal';
import KPICard from '@/components/common/KPICard';

interface CashAccountWithBalance extends CashAccount {
    balance: number;
    platform_name: string;
    platform_type: string;
}

// Icon components
const WalletIcon = () => (
    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

const BankIcon = () => (
    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const ChartIcon = () => (
    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
);

export default function CashAccountsPage() {
    const router = useRouter();
    const { settings } = useSettings();
    const [accounts, setAccounts] = useState<CashAccountWithBalance[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [cashAccounts, platformsData, dashboardData] = await Promise.all([
                apiClient.getCashAccounts(),
                apiClient.getPlatforms(),
                apiClient.getDashboard(),
            ]);

            setPlatforms(platformsData);

            // Combine cash accounts with their balances and platform info
            const accountsWithBalances: CashAccountWithBalance[] = cashAccounts.map(account => {
                const balance = dashboardData.cash_accounts.find(
                    ca => ca.cash_account_id === account.cash_account_id
                )?.balance || 0;

                const platform = platformsData.find(p => p.platform_id === account.platform_id);

                return {
                    ...account,
                    balance,
                    platform_name: platform?.platform_name || 'Unknown',
                    platform_type: platform?.platform_type || 'OTHER',
                };
            });

            setAccounts(accountsWithBalances);
        } catch (error) {
            console.error('Failed to load cash accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        loadData();
    };

    const handleViewAccount = (account: CashAccount) => {
        router.push(`/portfolios/${account.cash_account_id}`);
    };

    // Calculate totals
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const bankAccounts = accounts.filter(a => a.platform_type === 'BANK').length;
    const walletAccounts = accounts.filter(a => a.platform_type === 'WALLET').length;

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Cash Accounts</h1>
                        <p className="text-slate-400">
                            Manage your bank accounts and digital wallets
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/transfer')}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Transfer to Portfolio
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Cash Account
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <KPICard
                        title="Total Balance"
                        value={formatCurrency(totalBalance, 'VND', settings.displayCurrency, settings.exchangeRate)}
                        change={5.2}
                        icon={<ChartIcon />}
                        iconBg="bg-amber-500/10"
                        valueColor="text-white"
                    />
                    <KPICard
                        title="Bank Accounts"
                        value={bankAccounts}
                        subtitle={`${bankAccounts} linked`}
                        icon={<BankIcon />}
                        iconBg="bg-blue-500/10"
                        valueColor="text-blue-400"
                    />
                    <KPICard
                        title="Digital Wallets"
                        value={walletAccounts}
                        subtitle={`${walletAccounts} connected`}
                        icon={<WalletIcon />}
                        iconBg="bg-emerald-500/10"
                        valueColor="text-emerald-400"
                    />
                </div>

                {/* Cash Accounts Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <CashAccountTable
                        accounts={accounts}
                        onView={handleViewAccount}
                    />
                )}
            </div>

            {/* Create Modal */}
            <CreateCashAccountModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />
        </main>
    );
}
