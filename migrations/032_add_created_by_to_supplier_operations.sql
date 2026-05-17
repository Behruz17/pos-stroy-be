-- Добавление поля created_by в supplier_operations
-- Создание: Май 2026

ALTER TABLE `supplier_operations`
ADD COLUMN `created_by` int DEFAULT NULL AFTER `date`;

-- Добавляем индекс для быстрого поиска
ALTER TABLE `supplier_operations`
ADD KEY `idx_supplier_operations_created_by` (`created_by`);

-- Добавляем комментарий для документации
ALTER TABLE `supplier_operations`
MODIFY COLUMN `created_by` int DEFAULT NULL
COMMENT 'ID пользователя, создавшего операцию';
