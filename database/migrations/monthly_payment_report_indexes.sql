-- Database indexes for Monthly Payment Report by Invoice Item
-- These indexes optimize the query performance for the report

-- Index for payment date and year filtering
-- This speeds up the WHERE clause filtering by day_timestamp and year
CREATE INDEX idx_payment_date_year 
ON payment(day_timestamp, year);

-- Index for invoice lookup in payment table
-- This speeds up the JOIN between payment and invoice tables
CREATE INDEX idx_invoice_lookup 
ON payment(invoice_id, invoice_code);

-- Index for invoice title matching
-- This speeds up the JOIN between invoice and bill_item tables
CREATE INDEX idx_invoice_title 
ON invoice(title);

-- Index for bill_item title
-- This speeds up the lookup of invoice items by title
CREATE INDEX idx_bill_item_title 
ON bill_item(title);

-- Index for filtering out trashed payments
-- This speeds up the WHERE clause filtering by can_delete status
CREATE INDEX idx_payment_can_delete 
ON payment(can_delete);

-- Composite index for the most common query pattern
-- This covers the main WHERE clause conditions in a single index
CREATE INDEX idx_payment_report_composite 
ON payment(year, day_timestamp, can_delete, invoice_id);
