-- Добавить INITIAL_DEBT в enum для supplier_operations
ALTER TABLE supplier_operations 
MODIFY COLUMN type enum('RECEIPT','PAYMENT','INITIAL_DEBT') NOT NULL;
