-- Store the current cost price for simple products.
-- Batch products keep their cost per batch in stock_items.purchase_cost.
ALTER TABLE `products`
ADD COLUMN `purchase_cost` decimal(10,2) DEFAULT NULL AFTER `currency`;
