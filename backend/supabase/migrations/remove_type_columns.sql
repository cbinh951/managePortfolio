-- Migration Script: Remove asset_type and platform_type columns
-- Description: This script removes the asset_type column from the assets table
--              and the platform_type column from the platforms table.
-- WARNING: This will permanently delete these columns. Make sure to backup your data first!
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Remove asset_type column from assets table
-- ============================================================================

-- Drop the asset_type column
ALTER TABLE assets 
DROP COLUMN IF EXISTS asset_type;

-- ============================================================================
-- STEP 2: Remove platform_type column from platforms table
-- ============================================================================

-- Drop the platform_type column
ALTER TABLE platforms 
DROP COLUMN IF EXISTS platform_type;

-- ============================================================================
-- Verification Queries (Optional - Run these to verify the changes)
-- ============================================================================

-- Check the assets table structure (should not have asset_type column)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'assets';

-- Check the platforms table structure (should not have platform_type column)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'platforms';

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. These changes are IRREVERSIBLE without a backup
-- 2. Make sure your application code is updated to not reference these columns
-- 3. All existing data in other columns will be preserved
-- 4. The DROP COLUMN IF EXISTS ensures the script won't fail if columns don't exist
-- ============================================================================
