-- Add ticker and quantity columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS ticker TEXT,
ADD COLUMN IF NOT EXISTS quantity DECIMAL(20, 10);

-- Create index for ticker for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_ticker ON transactions(ticker);
