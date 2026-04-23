-- Создание таблицы stock_items для хранения партий batch товаров
-- Создание: Апр 23 2026 г.

-- Таблица для хранения партий (batch) товаров
CREATE TABLE IF NOT EXISTS `stock_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `batch_code` varchar(100) DEFAULT NULL,
  `purchase_cost` decimal(10,2) DEFAULT NULL,
  `selling_price` decimal(10,2) DEFAULT NULL,
  `receipt_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_stock_items_product_id` (`product_id`),
  KEY `idx_stock_items_receipt_id` (`receipt_id`),
  KEY `idx_stock_items_status` (`status`),
  CONSTRAINT `fk_stock_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_stock_items_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `stock_receipts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Добавляем комментарий для документации
ALTER TABLE `stock_items`
COMMENT = 'Партии товаров (batch). Используется для товаров типа batch (рулоны и т.д.)';
