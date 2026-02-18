-- =========================================
-- KOT Enhancement Migration
-- Adds spicy level, notes, and quantity tracking
-- Date: 2026-02-18
-- =========================================

-- Add columns to kitchen_order_tickets table
ALTER TABLE kitchen_order_tickets
ADD COLUMN spicy_level VARCHAR(20) COMMENT 'Spicy level for the KOT (NONE, MILD, MEDIUM, HOT, EXTRA_HOT)',
ADD COLUMN total_quantity DECIMAL(10,3) COMMENT 'Total quantity of all items in KOT',
ADD COLUMN kitchen_notes TEXT COMMENT 'Special instructions for kitchen staff',
ADD COLUMN order_notes TEXT COMMENT 'General order-level notes';

-- Add index for spicy level queries
CREATE INDEX idx_kot_spicy_level ON kitchen_order_tickets(spicy_level);

-- Add columns to kot_items table
ALTER TABLE kot_items
ADD COLUMN spicy_level VARCHAR(20) COMMENT 'Item-specific spicy level',
ADD COLUMN kitchen_notes TEXT COMMENT 'Kitchen notes for specific item',
ADD COLUMN order_notes TEXT COMMENT 'Order notes for specific item';

-- Add index for spicy level queries
CREATE INDEX idx_kot_item_spicy_level ON kot_items(spicy_level);

-- Add columns to order_items table
ALTER TABLE order_items
ADD COLUMN spicy_level VARCHAR(20) COMMENT 'Customer spicy preference for item',
ADD COLUMN kitchen_notes TEXT COMMENT 'Kitchen preparation notes',
ADD COLUMN order_notes TEXT COMMENT 'General item notes';

-- Add index for spicy level queries
CREATE INDEX idx_order_item_spicy_level ON order_items(spicy_level);

-- =========================================
-- Verification queries
-- =========================================

-- Verify kitchen_order_tickets columns
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'kitchen_order_tickets'
AND COLUMN_NAME IN ('spicy_level', 'total_quantity', 'kitchen_notes', 'order_notes')
ORDER BY ORDINAL_POSITION;

-- Verify kot_items columns
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'kot_items'
AND COLUMN_NAME IN ('spicy_level', 'kitchen_notes', 'order_notes')
ORDER BY ORDINAL_POSITION;

-- Verify order_items columns
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'order_items'
AND COLUMN_NAME IN ('spicy_level', 'kitchen_notes', 'order_notes')
ORDER BY ORDINAL_POSITION;

