-- Добавление поля currency в таблицу products
-- Все партии (stock_items) будут наследовать валюту от товара
-- Создание: Май 2026

ALTER TABLE `products`
ADD COLUMN `currency` enum('TJS','USD','RUB') NOT NULL DEFAULT 'TJS' AFTER `type`;
