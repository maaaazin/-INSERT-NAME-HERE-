-- Migration: Add input_format, comparison_mode, and tolerance fields to test_cases table
-- Run this migration if you have an existing database

-- Add new columns to test_cases table
ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS input_format VARCHAR(50) DEFAULT 'single',
ADD COLUMN IF NOT EXISTS comparison_mode VARCHAR(50) DEFAULT 'exact',
ADD COLUMN IF NOT EXISTS tolerance FLOAT DEFAULT 0;

-- Update existing rows to have default values (if columns were just added)
UPDATE test_cases 
SET 
    input_format = COALESCE(input_format, 'single'),
    comparison_mode = COALESCE(comparison_mode, 'exact'),
    tolerance = COALESCE(tolerance, 0)
WHERE input_format IS NULL OR comparison_mode IS NULL OR tolerance IS NULL;

