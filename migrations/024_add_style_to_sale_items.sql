-- Add style column to sale_items table
ALTER TABLE `sale_items` ADD COLUMN `style` varchar(100) DEFAULT NULL AFTER `total_price`;

-- Add index for style column for better filtering performance
ALTER TABLE `sale_items` ADD KEY `idx_sale_items_style` (`style`);
