-- Add fee column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS fee DECIMAL(20, 2);
