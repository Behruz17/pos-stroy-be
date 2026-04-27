-- Add mixed payment fields to sales table
ALTER TABLE `sales` 
ADD COLUMN `cash_amount` decimal(10,2) NOT NULL DEFAULT '0.00' AFTER `total_amount`,
ADD COLUMN `electronic_amount` decimal(10,2) NOT NULL DEFAULT '0.00' AFTER `cash_amount`;

-- Add indexes for better performance
ALTER TABLE `sales` 
ADD KEY `idx_sales_cash_amount` (`cash_amount`),
ADD KEY `idx_sales_electronic_amount` (`electronic_amount`);
