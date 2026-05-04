-- Добавить stock_item_id в return_items для поддержки партий при возврате
-- Создание: Май 2026 г.

-- Добавляем поле stock_item_id для связи с партией товара
ALTER TABLE `return_items`
ADD COLUMN `stock_item_id` int DEFAULT NULL
AFTER `product_id`;

-- Добавляем индекс для быстрого поиска
ALTER TABLE `return_items`
ADD KEY `idx_return_items_stock_item_id` (`stock_item_id`);

-- Добавляем комментарий для документации
ALTER TABLE `return_items`
MODIFY COLUMN `stock_item_id` int DEFAULT NULL
COMMENT 'ID партии товара (stock_items). Используется только для batch товаров при возврате';
