-- Добавление поля stock_item_id в sale_items для поддержки batch товаров
-- Создание: Апр 23 2026 г.

-- Добавляем поле stock_item_id для связи с партией товара
ALTER TABLE `sale_items`
ADD COLUMN `stock_item_id` int DEFAULT NULL
AFTER `product_id`;

-- Добавляем индекс для быстрого поиска
ALTER TABLE `sale_items`
ADD KEY `idx_sale_items_stock_item_id` (`stock_item_id`);

-- Добавляем внешний ключ (опционально, если нужна целостность данных)
-- ALTER TABLE `sale_items`
-- ADD CONSTRAINT `fk_sale_items_stock_item` FOREIGN KEY (`stock_item_id`) REFERENCES `stock_items` (`id`);

-- Добавляем комментарий для документации
ALTER TABLE `sale_items`
MODIFY COLUMN `stock_item_id` int DEFAULT NULL
COMMENT 'ID партии товара (stock_items). Используется только для batch товаров';
