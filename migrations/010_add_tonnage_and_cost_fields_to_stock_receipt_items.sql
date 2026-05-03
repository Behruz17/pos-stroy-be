-- Добавление полей для расчета себестоимости в таблицу stock_receipt_items
ALTER TABLE stock_receipt_items
ADD COLUMN tonnage DECIMAL(10,3) DEFAULT NULL COMMENT 'Тонна для позиции',
ADD COLUMN price_per_ton DECIMAL(10,2) DEFAULT NULL COMMENT 'Цена за тонну для позиции';

-- Добавление общей доставки в таблицу stock_receipts
ALTER TABLE stock_receipts
ADD COLUMN delivery_cost DECIMAL(10,2) DEFAULT NULL COMMENT 'Общая доставка на весь приход';
