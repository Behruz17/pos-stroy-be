-- Добавить unit_value в return_items для корректного расчета количества
-- Создание: Май 2026 г.

-- Добавляем поле unit_value для хранения веса/объема единицы товара
ALTER TABLE `return_items`
ADD COLUMN `unit_value` decimal(10,2) NOT NULL DEFAULT '1.00'
AFTER `quantity`;

-- Добавляем индекс для unit_value
ALTER TABLE `return_items`
ADD KEY `idx_return_items_unit_value` (`unit_value`);

-- Добавляем комментарий для документации
ALTER TABLE `return_items`
MODIFY COLUMN `unit_value` decimal(10,2) NOT NULL DEFAULT '1.00'
COMMENT 'Вес или объем единицы товара (например, 25.0 для 25кг мешка). Используется для расчета реального количества: quantity * unit_value';
