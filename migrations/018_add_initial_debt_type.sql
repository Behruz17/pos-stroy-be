-- Добавить INITIAL_DEBT в enum для customer_operations
ALTER TABLE customer_operations 
MODIFY COLUMN type enum('PAID','DEBT','PARTIAL','PAYMENT','RETURN','INITIAL_DEBT') NOT NULL;
