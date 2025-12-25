import { Portfolio, CashAccount } from '@/types/models';

interface TransactionFiltersProps {
    portfolios: (Portfolio | CashAccount)[];
    selectedPortfolio: string;
    selectedDateRange: string;
    selectedType: string;
    onPortfolioChange: (portfolioId: string) => void;
    onDateRangeChange: (range: string) => void;
    onTypeChange: (type: string) => void;
    onClearFilters: () => void;
}

const DATE_RANGES = [
    { value: 'last30', label: 'Last 30 Days' },
    { value: 'last90', label: 'Last 90 Days' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'all', label: 'All Time' },
];

const TRANSACTION_TYPES = [
    { value: 'all', label: 'All Types' },
    { value: 'DEPOSIT', label: 'Deposit' },
    { value: 'WITHDRAW', label: 'Withdraw' },
    { value: 'BUY', label: 'Buy' },
    { value: 'SELL', label: 'Sell' },
    { value: 'TRANSFER', label: 'Transfer' },
    { value: 'FEE', label: 'Fee' },
];

export default function TransactionFilters({
    portfolios,
    selectedPortfolio,
    selectedDateRange,
    selectedType,
    onPortfolioChange,
    onDateRangeChange,
    onTypeChange,
    onClearFilters,
}: TransactionFiltersProps) {
    const hasActiveFilters = selectedPortfolio !== 'all' || selectedDateRange !== 'all' || selectedType !== 'all';

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-4">
                {/* Portfolio Filter */}
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <select
                        value={selectedPortfolio}
                        onChange={(e) => onPortfolioChange(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Portfolios</option>
                        {portfolios.map((portfolio) => (
                            <option
                                key={'portfolio_id' in portfolio ? portfolio.portfolio_id : portfolio.cash_account_id}
                                value={'portfolio_id' in portfolio ? portfolio.portfolio_id : portfolio.cash_account_id}
                            >
                                {portfolio.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date Range Filter */}
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <select
                        value={selectedDateRange}
                        onChange={(e) => onDateRangeChange(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {DATE_RANGES.map((range) => (
                            <option key={range.value} value={range.value}>
                                {range.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Transaction Type Filter */}
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <select
                        value={selectedType}
                        onChange={(e) => onTypeChange(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {TRANSACTION_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="ml-auto px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Active Filter Badges */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700">
                    {selectedPortfolio !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            Portfolio: {portfolios.find(p => ('portfolio_id' in p ? p.portfolio_id : p.cash_account_id) === selectedPortfolio)?.name}
                            <button onClick={() => onPortfolioChange('all')} className="hover:text-blue-300">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    )}
                    {selectedDateRange !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            {DATE_RANGES.find(r => r.value === selectedDateRange)?.label}
                            <button onClick={() => onDateRangeChange('all')} className="hover:text-blue-300">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    )}
                    {selectedType !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            Type: {TRANSACTION_TYPES.find(t => t.value === selectedType)?.label}
                            <button onClick={() => onTypeChange('all')} className="hover:text-blue-300">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
