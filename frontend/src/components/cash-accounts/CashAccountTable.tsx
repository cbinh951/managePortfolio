'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CashAccount } from '@/types/models';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';

interface CashAccountWithBalance extends CashAccount {
    balance: number;
    platform_name: string;
    platform_type: string;
}

interface CashAccountTableProps {
    accounts: CashAccountWithBalance[];
}

export default function CashAccountTable({ accounts }: CashAccountTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const { settings } = useSettings();

    // Filter accounts based on search query
    const filteredAccounts = useMemo(() => {
        if (!searchQuery.trim()) return accounts;

        const query = searchQuery.toLowerCase();
        return accounts.filter(
            (account) =>
                account.name.toLowerCase().includes(query) ||
                account.platform_name?.toLowerCase().includes(query) ||
                account.currency.toLowerCase().includes(query)
        );
    }, [accounts, searchQuery]);

    // Calculate total balance in display currency
    const totalBalance = useMemo(() => {
        const total = filteredAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
        return formatCurrency(total, 'VND', settings.displayCurrency, settings.exchangeRate);
    }, [filteredAccounts, settings.displayCurrency, settings.exchangeRate]);

    // Get platform icon
    const getPlatformIcon = (platformType: string) => {
        switch (platformType) {
            case 'BANK':
                return (
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                    </div>
                );
            case 'WALLET':
                return (
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                );
        }
    };

    // Get platform type badge color
    const getPlatformBadge = (type: string) => {
        if (type === 'BANK') {
            return 'bg-green-500/10 text-green-400 border-green-500/20';
        } else if (type === 'WALLET') {
            return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        }
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    };

    return (
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden">
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 relative">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search cash accounts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                        />
                    </div>
                    <div className="text-sm text-slate-400">
                        Total: <span className="text-white font-semibold">{totalBalance}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50">
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Account Name
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Platform
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Current Balance
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Currency
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {filteredAccounts.map((account) => (
                            <tr
                                key={account.cash_account_id}
                                className="hover:bg-slate-700/20 transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        {getPlatformIcon(account.platform_type)}
                                        <div>
                                            <div className="text-sm font-medium text-white">
                                                {account.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {account.cash_account_id}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-slate-300">{account.platform_name}</span>
                                        <span className={`px-2 py-0.5 rounded-md border text-xs font-medium w-fit ${getPlatformBadge(account.platform_type)}`}>
                                            {account.platform_type}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-lg font-semibold text-white">
                                        {formatCurrency(account.balance, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2.5 py-1 rounded-md bg-slate-700/50 text-xs font-medium text-slate-300">
                                        VND
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <Link
                                        href={`/portfolios/${account.cash_account_id}`}
                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all inline-block"
                                        title="View details"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {filteredAccounts.length === 0 && (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <h3 className="text-lg font-medium text-white mb-2">No cash accounts found</h3>
                    <p className="text-slate-400">
                        {searchQuery ? 'Try adjusting your search' : 'Create your first cash account to get started'}
                    </p>
                </div>
            )}

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                    Showing <span className="font-medium text-white">{filteredAccounts.length}</span> of{' '}
                    <span className="font-medium text-white">{accounts.length}</span> accounts
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="ml-2 text-blue-400 hover:text-blue-300 text-xs underline"
                        >
                            Clear search
                        </button>
                    )}
                </p>
            </div>
        </div>
    );
}
