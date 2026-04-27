-- Миграция для добавления поля is_default в таблицу customers
-- Выполните этот SQL скрипт в вашей базе данных

-- 1. Добавить поле is_default для клиента по умолчанию
ALTER TABLE customers ADD COLUMN is_default TINYINT(1) DEFAULT 0;

-- 2. Добавить индекс для быстрого поиска клиента по умолчанию
CREATE INDEX idx_customers_default ON customers(is_default, status);

-- 3. (Опционально) Установить первого клиента как клиент по умолчанию
-- Раскомментируйте следующую строку, если хотите установить клиента с ID=72 как клиент по умолчанию
-- UPDATE customers SET is_default = 1 WHERE id = 72 AND status = 1;

-- Примечание: Вы можете назначить любого клиента как клиент по умолчанию через API:
-- PUT /api/customers/{id}/default
