import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials not found. Using CSV fallback mode.');
}

// Create Supabase client (will be null if credentials not provided)
export const supabase: SupabaseClient | null = 
    supabaseUrl && supabaseKey 
        ? createClient(supabaseUrl, supabaseKey)
        : null;

// Check if Supabase is configured
export const isSupabaseEnabled = (): boolean => {
    return supabase !== null;
};

// Database table names
export const TABLES = {
    PORTFOLIOS: 'portfolios',
    TRANSACTIONS: 'transactions',
    SNAPSHOTS: 'snapshots',
    CASH_ACCOUNTS: 'cash_accounts',
    ASSETS: 'assets',
    PLATFORMS: 'platforms',
    STRATEGIES: 'strategies',
} as const;
