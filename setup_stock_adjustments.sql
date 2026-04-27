-- Установка модуля корректировок остатков
-- Выполните этот SQL скрипт в вашей базе данных

-- 1. Создать таблицу для корректировок остатков
CREATE TABLE IF NOT EXISTS `stock_adjustments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `previous_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `new_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `adjustment` decimal(10,2) NOT NULL DEFAULT '0.00',
  `reason` text,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_stock_adjustments_product` (`product_id`),
  KEY `idx_stock_adjustments_created_by` (`created_by`),
  KEY `idx_stock_adjustments_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Примечание: После выполнения миграции перезапустите сервер для регистрации новых API эндпоинтов

-- Пример использования API:
-- POST /api/stock-adjustments
-- {
--   "product_id": 123,
--   "new_quantity": 95,
--   "reason": "Инвентаризация - недостача"
-- }
