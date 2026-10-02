-- ============================================================================
-- Migration: Create Tax Brackets Table
-- Description: Create tax_brackets table for automated PAYE calculation
--              with Ghana 2024 progressive tax bracket data
-- Requirements: 9.2, 10.1, 10.2, 10.6, 10.7
-- Date: 2026-06-03
-- ============================================================================

-- Create tax_brackets table
CREATE TABLE IF NOT EXISTS tax_brackets (
  bracket_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  country VARCHAR(50) DEFAULT 'Ghana' COMMENT 'Country for which tax brackets apply',
  bracket_name VARCHAR(100) NOT NULL COMMENT 'Descriptive name for the tax bracket',
  min_income DECIMAL(15,2) NOT NULL COMMENT 'Minimum income for this bracket (inclusive)',
  max_income DECIMAL(15,2) NULL COMMENT 'Maximum income for this bracket (inclusive, NULL for highest bracket)',
  tax_rate DECIMAL(5,2) NOT NULL COMMENT 'Tax rate as percentage (e.g., 5.00 for 5%)',
  fixed_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Fixed tax amount to add (for cumulative calculation)',
  is_active TINYINT(1) DEFAULT 1 COMMENT 'Whether this bracket is currently active (1=active, 0=inactive)',
  effective_from DATE NOT NULL COMMENT 'Date from which this bracket becomes effective',
  effective_to DATE NULL COMMENT 'Date until which this bracket is effective (NULL if currently active)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when record was created',
  
  -- Indexes for performance
  INDEX idx_effective_dates (effective_from, effective_to) COMMENT 'Index for querying by date range',
  INDEX idx_active (is_active) COMMENT 'Index for filtering active brackets'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tax brackets for PAYE calculation';

-- ============================================================================
-- Insert Ghana 2024 Progressive Tax Brackets
-- ============================================================================
-- Based on Ghana Revenue Authority (GRA) tax structure
-- Tax brackets are applied progressively (each portion taxed at its rate)
-- Annual taxable income = Annual gross - SSNIT Tier 1 (13.5%) - SSNIT Tier 2 (5%)
-- ============================================================================

INSERT INTO tax_brackets (bracket_name, min_income, max_income, tax_rate, fixed_amount, effective_from) VALUES
('First Bracket', 0.00, 5880.00, 0.00, 0.00, '2024-01-01'),
('Second Bracket', 5880.01, 8040.00, 5.00, 0.00, '2024-01-01'),
('Third Bracket', 8040.01, 11160.00, 10.00, 108.00, '2024-01-01'),
('Fourth Bracket', 11160.01, 49560.00, 17.50, 420.00, '2024-01-01'),
('Fifth Bracket', 49560.01, 240000.00, 25.00, 7140.00, '2024-01-01'),
('Sixth Bracket', 240000.01, 600000.00, 30.00, 54750.00, '2024-01-01'),
('Seventh Bracket', 600000.01, NULL, 35.00, 162750.00, '2024-01-01');

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Uncomment to verify the data was inserted correctly:
-- SELECT * FROM tax_brackets ORDER BY min_income;

-- ============================================================================
-- Example PAYE Calculation
-- ============================================================================
-- For monthly gross salary of GHS 6,000:
--   Annual Gross: GHS 72,000
--   SSNIT Deduction (5.5% employee): GHS 3,960/year
--   Annual Taxable: GHS 68,040
--
-- Tax Calculation:
--   First GHS 5,880:       0% = GHS 0
--   Next GHS 2,160:        5% = GHS 108
--   Next GHS 3,120:       10% = GHS 312
--   Next GHS 38,400:    17.5% = GHS 6,720
--   Remaining GHS 18,480:  25% = GHS 4,620
--   Total Annual Tax: GHS 11,760
--   Monthly PAYE: GHS 980
-- ============================================================================
