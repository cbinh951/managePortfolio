-- ============================================
-- Supabase Schema for Portfolio Management
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS snapshots CASCADE;
DROP TABLE IF EXISTS cash_accounts CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS platforms CASCADE;
DROP TABLE IF EXISTS strategies CASCADE;
DROP TABLE IF EXISTS assets CASCADE;

-- ============================================
-- Master Tables
-- ============================================

-- Assets (Stock, Forex, Cash, etc.)
CREATE TABLE assets (
    asset_id TEXT PRIMARY KEY,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('STOCK', 'FOREX', 'GOLD', 'CASH')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategies (Trading strategies)
CREATE TABLE strategies (
    strategy_id TEXT PRIMARY KEY,
    strategy_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platforms (Brokers, Banks, Wallets)
CREATE TABLE platforms (
    platform_id TEXT PRIMARY KEY,
    platform_name TEXT NOT NULL,
    platform_type TEXT NOT NULL CHECK (platform_type IN ('BROKER', 'BANK', 'WALLET')),
    asset_id TEXT REFERENCES assets(asset_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Main Tables
-- ============================================

-- Portfolios
CREATE TABLE portfolios (
    portfolio_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    asset_id TEXT NOT NULL REFERENCES assets(asset_id),
    platform_id TEXT NOT NULL REFERENCES platforms(platform_id),
    strategy_id TEXT REFERENCES strategies(strategy_id),
    start_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cash Accounts
CREATE TABLE cash_accounts (
    cash_account_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    platform_id TEXT NOT NULL REFERENCES platforms(platform_id),
    currency TEXT NOT NULL DEFAULT 'VND',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    transaction_id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAW', 'TRANSFER', 'BUY', 'SELL', 'FEE')),
    amount DECIMAL(20, 2) NOT NULL,
    portfolio_id TEXT REFERENCES portfolios(portfolio_id),
    cash_account_id TEXT REFERENCES cash_accounts(cash_account_id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Snapshots (Portfolio NAV history)
CREATE TABLE snapshots (
    snapshot_id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL REFERENCES portfolios(portfolio_id),
    date DATE NOT NULL,
    nav DECIMAL(20, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_portfolios_asset ON portfolios(asset_id);
CREATE INDEX idx_portfolios_platform ON portfolios(platform_id);
CREATE INDEX idx_portfolios_strategy ON portfolios(strategy_id);

CREATE INDEX idx_transactions_portfolio ON transactions(portfolio_id);
CREATE INDEX idx_transactions_cash_account ON transactions(cash_account_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);

CREATE INDEX idx_snapshots_portfolio ON snapshots(portfolio_id);
CREATE INDEX idx_snapshots_date ON snapshots(date);

CREATE INDEX idx_cash_accounts_platform ON cash_accounts(platform_id);

-- ============================================
-- Row Level Security (Optional - enable for multi-user)
-- ============================================

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth required for now)
CREATE POLICY "Allow all on assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on strategies" ON strategies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on platforms" ON platforms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on portfolios" ON portfolios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cash_accounts" ON cash_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on snapshots" ON snapshots FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Initial Data (from your CSVs)
-- ============================================

-- Insert Assets
INSERT INTO assets (asset_id, asset_name, asset_type) VALUES
    ('A001', 'CHUNG', 'STOCK'),
    ('A002', 'FOREX', 'FOREX'),
    ('A003', 'BANK', 'CASH');

-- Insert Strategies
INSERT INTO strategies (strategy_id, strategy_name, description) VALUES
    ('1', 'TRUNG HAN', 'TH'),
    ('2', 'DAI HAN', 'DH');

-- Insert Platforms
INSERT INTO platforms (platform_id, platform_name, platform_type, asset_id) VALUES
    ('P003', 'SSI', 'BROKER', 'A001'),
    ('P004', 'BANK', 'BANK', 'A003'),
    ('P005', 'TCBS', 'BROKER', 'A001');

-- Insert Portfolios
INSERT INTO portfolios (portfolio_id, name, asset_id, platform_id, strategy_id, start_date) VALUES
    ('PF1766848828051280', 'AZFIN', 'A001', 'P003', '1', '2025-12-01'),
    ('PF1767001131261907', 'TCBS TH', 'A001', 'P005', '1', '2025-05-01');

-- Insert Cash Accounts
INSERT INTO cash_accounts (cash_account_id, name, platform_id, currency) VALUES
    ('CA1766851970792391', 'MBB', 'P004', 'VND');

-- Insert Transactions
INSERT INTO transactions (transaction_id, date, type, amount, portfolio_id, cash_account_id, description) VALUES
    ('T1766849631924354', '2025-12-27', 'DEPOSIT', 2000000, 'PF1766848828051280', NULL, NULL),
    ('T176684999574715', '2025-11-27', 'DEPOSIT', 5000000, 'PF1766848828051280', NULL, NULL),
    ('T1766850320775694', '2025-10-27', 'DEPOSIT', 1000000, 'PF1766848828051280', NULL, NULL),
    ('T1766852471528760', '2025-12-27', 'DEPOSIT', 3000000, NULL, 'CA1766851970792391', NULL),
    ('T1766887635890359', '2025-12-28', 'WITHDRAW', 500000, NULL, 'CA1766851970792391', NULL),
    ('T1766887841736541', '2025-12-28', 'TRANSFER', -500000, 'PF1766848828051280', 'CA1766851970792391', 'Transfer to AZFIN'),
    ('T176688784174841', '2025-12-28', 'TRANSFER', 500000, 'PF1766848828051280', 'CA1766851970792391', 'Transfer from MBB'),
    ('T1766889760749337', '2025-12-28', 'DEPOSIT', 100000, 'PF1766848828051280', NULL, NULL),
    ('T1766892614606686', '2025-12-28', 'TRANSFER', -100000, 'PF1766848828051280', 'CA1766851970792391', 'Transfer to AZFIN'),
    ('T176689261461580', '2025-12-28', 'TRANSFER', 100000, 'PF1766848828051280', 'CA1766851970792391', 'Transfer from MBB'),
    ('T1766896972532586', '2025-12-28', 'DEPOSIT', 2000000, NULL, 'CA1766851970792391', NULL),
    ('T1766897223566825', '2025-12-28', 'DEPOSIT', 100000, NULL, 'CA1766851970792391', NULL),
    ('T1766897241731688', '2025-12-28', 'DEPOSIT', 200000, NULL, 'CA1766851970792391', NULL),
    ('T176700119614316', '2025-05-01', 'DEPOSIT', 500000000, 'PF1767001131261907', NULL, NULL);

-- Insert Snapshots
INSERT INTO snapshots (snapshot_id, portfolio_id, date, nav) VALUES
    ('SNP1766849941279970', 'PF1766848828051280', '2025-12-27', 3000000),
    ('SNP1766850277878580', 'PF1766848828051280', '2025-11-27', 2000000),
    ('SNP176685034422761', 'PF1766848828051280', '2025-10-27', 1000000),
    ('SNP1766895095412508', 'PF1766848828051280', '2025-09-01', 500000),
    ('SNP176689517814486', 'PF1766848828051280', '2025-12-28', 12000000),
    ('SNP1767001451636940', 'PF1767001131261907', '2025-12-29', 450000000),
    ('SNP1767001472874758', 'PF1767001131261907', '2025-11-29', 480000000),
    ('SNP1767001490847321', 'PF1767001131261907', '2025-10-01', 400000000);

-- ============================================
-- Verify Data
-- ============================================

SELECT 'Assets' as table_name, COUNT(*) as count FROM assets
UNION ALL
SELECT 'Strategies', COUNT(*) FROM strategies
UNION ALL
SELECT 'Platforms', COUNT(*) FROM platforms
UNION ALL
SELECT 'Portfolios', COUNT(*) FROM portfolios
UNION ALL
SELECT 'Cash Accounts', COUNT(*) FROM cash_accounts
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Snapshots', COUNT(*) FROM snapshots;
