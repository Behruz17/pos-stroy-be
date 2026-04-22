-- Добавление этапов продажи в POS системе
-- Создание: Апр 22 2026 г.

-- 1. Добавляем поле stage в таблицу sales
ALTER TABLE `sales` 
ADD COLUMN `stage` enum('ordered','ready','delivered') NOT NULL DEFAULT 'ordered' AFTER `payment_status`;

-- 2. Добавляем индекс для поля stage
ALTER TABLE `sales` 
ADD KEY `idx_sales_stage` (`stage`);

-- 3. Создаем таблицу для истории изменений этапов
CREATE TABLE IF NOT EXISTS `sale_stage_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `from_stage` enum('ordered','ready','delivered') NOT NULL,
  `to_stage` enum('ordered','ready','delivered') NOT NULL,
  `changed_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_sale_stage_history_sale_id` (`sale_id`),
  KEY `idx_sale_stage_history_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- 4. Обновляем комментарий для таблицы sales
ALTER TABLE `sales` 
COMMENT = 'Продажи с этапами: ordered - заказан, ready - готов, delivered - доставлен. Этапы не зависят от оплаты.';
