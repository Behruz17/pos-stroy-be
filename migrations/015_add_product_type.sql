-- Добавление поля type для поддержки batch товаров
-- Создание: Апр 23 2026 г.

-- Добавляем поле type в таблицу products (simple/batch)
ALTER TABLE `products`
ADD COLUMN `type` enum('simple','batch') NOT NULL DEFAULT 'simple'
AFTER `product_code`;

-- Добавляем комментарий для документации
ALTER TABLE `products`
MODIFY COLUMN `type` enum('simple','batch') NOT NULL DEFAULT 'simple'
COMMENT 'Тип товара: simple - обычный, batch - партионный (рулоны и т.д.)';
