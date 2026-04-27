-- Create styles table
CREATE TABLE `styles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_styles_name` (`name`),
  KEY `idx_styles_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Insert default styles
INSERT INTO `styles` (`name`, `description`) VALUES
('гладкий', 'Гладкая поверхность'),
('волна', 'Волновая текстура'),
('2 таксим', 'Двусторонняя текстура'),
('3 таксим', 'Трехсторонняя текстура'),
('стандарт', 'Стандартный стиль');

-- Add style_id column to sale_items table
ALTER TABLE `sale_items` ADD COLUMN `style_id` int DEFAULT NULL AFTER `total_price`;

-- Add foreign key constraint
ALTER TABLE `sale_items` ADD CONSTRAINT `fk_sale_items_style` FOREIGN KEY (`style_id`) REFERENCES `styles` (`id`) ON DELETE SET NULL;

-- Add index for better performance
ALTER TABLE `sale_items` ADD KEY `idx_sale_items_style_id` (`style_id`);

-- Drop the old style column if it exists
-- (This will be safe if the column doesn't exist)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE table_name = 'sale_items' 
   AND column_name = 'style' 
   AND table_schema = DATABASE()) > 0,
  'ALTER TABLE `sale_items` DROP COLUMN `style`',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
