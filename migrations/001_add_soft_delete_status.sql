-- Migration: Add soft delete (status 0/1) to all tables
-- status: 1 = active, 0 = deleted
-- Note: IF NOT EXISTS is not supported for ALTER TABLE in MySQL
-- Run this migration only once

-- Add status to users
ALTER TABLE users ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_users_status ON users(status);

-- Add status to suppliers
ALTER TABLE suppliers ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_suppliers_status ON suppliers(status);

-- Add status to products
ALTER TABLE products ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_products_status ON products(status);

-- Add status to customers
ALTER TABLE customers ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_customers_status ON customers(status);

-- Add status to stock_receipts
ALTER TABLE stock_receipts ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_stock_receipts_status ON stock_receipts(status);

-- Add status to stock_receipt_items
ALTER TABLE stock_receipt_items ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_stock_receipt_items_status ON stock_receipt_items(status);

-- Add status to sales
ALTER TABLE sales ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_sales_status ON sales(status);

-- Add status to sale_items
ALTER TABLE sale_items ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_sale_items_status ON sale_items(status);

-- Add status to returns
ALTER TABLE returns ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_returns_status ON returns(status);

-- Add status to return_items
ALTER TABLE return_items ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_return_items_status ON return_items(status);

-- Add status to supplier_operations
ALTER TABLE supplier_operations ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_supplier_operations_status ON supplier_operations(status);

-- Add status to customer_operations
ALTER TABLE customer_operations ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_customer_operations_status ON customer_operations(status);

-- Add status to stock
ALTER TABLE stock ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_stock_status ON stock(status);

-- Add status to tokens
ALTER TABLE tokens ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;
CREATE INDEX idx_tokens_status ON tokens(status);
