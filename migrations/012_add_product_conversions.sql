-- Добавление таблицы для переработки товаров
-- Создание: Апр 22 2026 г.

-- Таблица для хранения операций переработки товаров
CREATE TABLE IF NOT EXISTS `product_conversions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `from_product_id` int NOT NULL,
  `to_product_id` int NOT NULL,
  `from_quantity` decimal(10,2) NOT NULL,
  `to_quantity` decimal(10,2) NOT NULL,
  `purchase_cost` decimal(10,2) NOT NULL,
  `selling_price` decimal(10,2) DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_conversions_from_product` (`from_product_id`),
  KEY `idx_conversions_to_product` (`to_product_id`),
  KEY `idx_conversions_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Добавляем комментарий для документации
ALTER TABLE `product_conversions` 
COMMENT = 'Операции переработки товаров: преобразование товара A в товар B с переносом себестоимости';
