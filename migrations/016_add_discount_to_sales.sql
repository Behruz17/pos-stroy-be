-- Добавить поле discount в таблицу sales для учета скидок
-- Создание: Май 2026 г.

-- Добавляем поле discount для хранения суммы скидки
ALTER TABLE `sales`
ADD COLUMN `discount` decimal(10,2) NOT NULL DEFAULT '0.00'
AFTER `total_amount`;

-- Добавляем индекс для discount
ALTER TABLE `sales`
ADD KEY `idx_sales_discount` (`discount`);

-- Добавляем комментарий для документации
ALTER TABLE `sales`
MODIFY COLUMN `discount` decimal(10,2) NOT NULL DEFAULT '0.00'
COMMENT 'Сумма скидки. Рассчитывается как total_amount - paid_amount';
