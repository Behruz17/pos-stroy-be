-- Добавить поле is_default для клиента по умолчанию
ALTER TABLE customers ADD COLUMN is_default TINYINT(1) DEFAULT 0;

-- Добавить индекс для быстрого поиска клиента по умолчанию
CREATE INDEX idx_customers_default ON customers(is_default, status);
