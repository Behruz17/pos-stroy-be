-- Добавление типа "ЧАСТИЧНО" в операции клиентов
-- Создание: Апр 22 2026 г.

-- Изменяем ENUM для поля type, добавляя PARTIAL
ALTER TABLE `customer_operations` 
MODIFY COLUMN `type` enum('PAID','DEBT','PARTIAL','PAYMENT','RETURN') CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL;

-- Добавляем комментарий для документации
ALTER TABLE `customer_operations` 
COMMENT = 'Операции клиентов: PAID - оплачено, DEBT - долг, PARTIAL - частично оплачено, PAYMENT - платеж, RETURN - возврат';
