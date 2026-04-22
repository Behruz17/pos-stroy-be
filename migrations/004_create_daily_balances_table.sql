-- Создание таблицы daily_balances для хранения снимков дневных балансов
-- Создание: Апр 21 2026 г.

DROP TABLE IF EXISTS `daily_balances`;
CREATE TABLE `daily_balances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `income` decimal(15,2) NOT NULL DEFAULT '0.00',
  `expense` decimal(15,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `balance_usd` decimal(15,2) NOT NULL DEFAULT '0.00',
  `usd_rate` decimal(10,4) NOT NULL DEFAULT '1.0000',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_date` (`date`),
  KEY `idx_date` (`date`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
