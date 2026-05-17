-- Добавление поля created_by в customer_operations
-- Создание: Май 2026

ALTER TABLE `customer_operations`
ADD COLUMN `created_by` int DEFAULT NULL AFTER `date`;

-- Добавляем индекс для быстрого поиска
ALTER TABLE `customer_operations`
ADD KEY `idx_customer_operations_created_by` (`created_by`);

-- Добавляем внешний ключ (опционально)
-- ALTER TABLE `customer_operations`
-- ADD CONSTRAINT `fk_customer_operations_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

-- Добавляем комментарий для документации
ALTER TABLE `customer_operations`
MODIFY COLUMN `created_by` int DEFAULT NULL
COMMENT 'ID пользователя, создавшего операцию';
