-- Добавление статуса оплаты "ЧАСТИЧНО" для продаж
-- Создание: Апр 22 2026 г.

-- Изменяем ENUM для поля payment_status, добавляя PARTIAL
ALTER TABLE `sales` 
MODIFY COLUMN `payment_status` enum('PAID','DEBT','PARTIAL') NOT NULL DEFAULT 'DEBT';

-- Добавляем поле для суммы частичной оплаты
ALTER TABLE `sales` 
ADD COLUMN `paid_amount` decimal(10,2) DEFAULT NULL AFTER `total_amount`;

-- Добавляем индексы
ALTER TABLE `sales` 
ADD KEY `idx_sales_payment_status` (`payment_status`),
ADD KEY `idx_sales_paid_amount` (`paid_amount`);

-- Добавляем комментарий для документации
ALTER TABLE `sales` 
COMMENT = 'Продажи с поддержкой статусов оплаты: PAID - оплачено полностью, DEBT - долг, PARTIAL - оплачено частично. Поле paid_amount хранит сумму частичной оплаты';
