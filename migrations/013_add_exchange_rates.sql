-- Таблица для хранения валютных курсов
-- Создание: Апр 22 2026 г.

CREATE TABLE IF NOT EXISTS `exchange_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `currency` enum('USD','RUB','TJS') NOT NULL,
  `rate_to_tjs` decimal(10,4) NOT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_currency_date` (`currency`, `date`),
  KEY `idx_exchange_rates_date` (`date`),
  KEY `idx_exchange_rates_currency` (`currency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Добавляем комментарий для документации
ALTER TABLE `exchange_rates` 
COMMENT = 'Валютные курсы к TJS. Каждый день добавляется новая запись, старые не обновляются.';

-- Добавляем начальные данные для TJS (курс 1.0000)
INSERT INTO `exchange_rates` (`currency`, `rate_to_tjs`, `date`, `status`) 
VALUES ('TJS', 1.0000, CURDATE(), 1)
ON DUPLICATE KEY UPDATE rate_to_tjs = 1.0000;
