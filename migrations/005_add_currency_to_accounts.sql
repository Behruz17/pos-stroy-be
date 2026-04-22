-- Добавление поддержки валют в таблицу accounts
-- Создание: Апр 21 2026 г.

-- Добавляем колонки для поддержки валют
ALTER TABLE `accounts` 
ADD COLUMN `currency` enum('TJS','USD','RUB') NOT NULL DEFAULT 'TJS' AFTER `type`,
ADD COLUMN `balance_usd` decimal(15,2) NOT NULL DEFAULT '0.00' AFTER `balance`,
ADD COLUMN `usd_rate` decimal(10,4) NOT NULL DEFAULT '1.0000' AFTER `balance_usd`;

-- Добавляем индексы для новых полей
ALTER TABLE `accounts` 
ADD KEY `idx_accounts_currency` (`currency`),
ADD KEY `idx_accounts_usd_rate` (`usd_rate`);

-- Обновляем существующие счета (устанавливаем валюту TJS по умолчанию)
UPDATE `accounts` SET `currency` = 'TJS' WHERE `currency` = 'TJS';
