'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Transaction, Portfolio, CashAccount } from '@/types/models';
import MetricCard from '@/components/portfolio/MetricCard';
import TransactionFilters from '@/components/transaction/TransactionFilters';
import TransactionTable from '@/components/transaction/TransactionTable';
import AddTransactionModal from '@/components/transaction/AddTransactionModal';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filters
    const [selectedPortfolio, setSelectedPortfolio] = useState('all');
    const [selectedDateRange, setSelectedDateRange] = useState('all');
    const [selectedType, setSelectedType] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [transactionsData, portfoliosData, cashAccountsData] = await Promise.all([
                apiClient.getTransactions(),
                apiClient.getPortfolios(),
                apiClient.getCashAccounts(),
            ]);
            setTransactions(transactionsData);
            setPortfolios(portfoliosData);
            setCashAccounts(cashAccountsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        loadData();
    };

    const handleClearFilters = () => {
        setSelectedPortfolio('all');
        setSelectedDateRange('all');
        setSelectedType('all');
    };

    // Filter transactions
    const filteredTransactions = transactions.filter(transaction => {
        // Portfolio filter
        if (selectedPortfolio !== 'all') {
            const matchesPortfolio = transaction.portfolio_id === selectedPortfolio || transaction.cash_account_id === selectedPortfolio;
            if (!matchesPortfolio) return false;
        }

        // Date range filter
        if (selectedDateRange !== 'all') {
            const transactionDate = new Date(transaction.date);
            const today = new Date();

            switch (selectedDateRange) {
                case 'last30':
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(today.getDate() - 30);
                    if (transactionDate < thirtyDaysAgo) return false;
                    break;
                case 'last90':
                    const ninetyDaysAgo = new Date(today);
                    ninetyDaysAgo.setDate(today.getDate() - 90);
                    if (transactionDate < ninetyDaysAgo) return false;
                    break;
                case 'thisYear':
                    if (transactionDate.getFullYear() !== today.getFullYear()) return false;
                    break;
            }
        }

        // Type filter
        if (selectedType !== 'all') {
            if (transaction.type !== selectedType) return false;
        }

        return true;
    });

    // Calculate totals
    const totalInflow = filteredTransactions
        .filter(t => t.type === 'DEPOSIT' || t.type === 'SELL')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalOutflow = filteredTransactions
        .filter(t => t.type === 'WITHDRAW' || t.type === 'BUY' || t.type === 'FEE')
        .reduce((sum, t) => sum + t.amount, 0);

    const allPortfoliosAndAccounts: (Portfolio | CashAccount)[] = [
        ...portfolios,
        ...cashAccounts,
    ];

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Transactions</h1>
                        <p className="text-slate-400">
                            Manage your financial records and history.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Transaction
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <MetricCard
                        label="TOTAL INFLOW"
                        value={`$${totalInflow.toLocaleString()}`}
                        change={12}
                        trend="up"
                        valueColor="text-emerald-400"
                        icon={
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                        }
                    />
                    <MetricCard
                        label="TOTAL OUTFLOW"
                        value={`$${totalOutflow.toLocaleString()}`}
                        change={-8}
                        trend="down"
                        valueColor="text-red-400"
                        icon={
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                            </svg>
                        }
                    />
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <TransactionFilters
                        portfolios={allPortfoliosAndAccounts}
                        selectedPortfolio={selectedPortfolio}
                        selectedDateRange={selectedDateRange}
                        selectedType={selectedType}
                        onPortfolioChange={setSelectedPortfolio}
                        onDateRangeChange={setSelectedDateRange}
                        onTypeChange={setSelectedType}
                        onClearFilters={handleClearFilters}
                    />
                </div>

                {/* Transaction Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <TransactionTable
                        transactions={filteredTransactions}
                        portfolios={allPortfoliosAndAccounts}
                    />
                )}
            </div>

            {/* Add Transaction Modal */}
            <AddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />
        </main>
    );
}
