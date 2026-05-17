-- Добавление поля created_by в debtor_operations
-- Создание: Май 2026

ALTER TABLE `debtor_operations`
ADD COLUMN `created_by` int DEFAULT NULL AFTER `date`;

-- Добавляем индекс для быстрого поиска
ALTER TABLE `debtor_operations`
ADD KEY `idx_debtor_operations_created_by` (`created_by`);

-- Добавляем комментарий для документации
ALTER TABLE `debtor_operations`
MODIFY COLUMN `created_by` int DEFAULT NULL
COMMENT 'ID пользователя, создавшего операцию';
