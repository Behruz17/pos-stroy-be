-- Упрощение таблицы exchange_rates - убираем date, добавляем updated_at
-- Теперь просто обновляем текущий курс, без истории

-- Удаляем старую таблицу и создаем новую упрощенную
DROP TABLE IF EXISTS `exchange_rates`;

CREATE TABLE `exchange_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `currency` enum('USD','RUB','TJS') NOT NULL,
  `rate_to_tjs` decimal(10,4) NOT NULL DEFAULT 1.0000,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_currency_unique` (`currency`),
  KEY `idx_exchange_rates_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Добавляем комментарий
ALTER TABLE `exchange_rates` 
COMMENT = 'Текущие валютные курсы к TJS. Просто обновляем существующие записи.';

-- Добавляем начальные данные
INSERT INTO `exchange_rates` (`currency`, `rate_to_tjs`, `status`) VALUES 
  ('TJS', 1.0000, 1),
  ('USD', 10.5000, 1),
  ('RUB', 0.1300, 1)
ON DUPLICATE KEY UPDATE rate_to_tjs = VALUES(rate_to_tjs);
