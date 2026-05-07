-- Add created_by column to customer_operations table
ALTER TABLE customer_operations 
ADD COLUMN created_by int NOT NULL DEFAULT 1 AFTER account_id;

-- Add created_by column to supplier_operations table  
ALTER TABLE supplier_operations 
ADD COLUMN created_by int NOT NULL DEFAULT 1 AFTER account_id;

-- Add indexes for better performance
ALTER TABLE customer_operations 
ADD INDEX idx_created_by (created_by);

ALTER TABLE supplier_operations 
ADD INDEX idx_created_by (created_by);

-- Add foreign key constraints (optional - if you want to enforce referential integrity)
-- ALTER TABLE customer_operations 
-- ADD CONSTRAINT fk_customer_operations_created_by 
-- FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ALTER TABLE supplier_operations 
-- ADD CONSTRAINT fk_supplier_operations_created_by 
-- FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
