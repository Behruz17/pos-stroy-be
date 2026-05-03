-- Добавление полей для фактической себестоимости в таблицу stock_receipt_items
ALTER TABLE stock_receipt_items
ADD COLUMN actual_cost DECIMAL(10,2) DEFAULT NULL COMMENT 'Фактическая себестоимость с доставкой',
ADD COLUMN actual_cost_converted DECIMAL(10,2) DEFAULT NULL COMMENT 'Себестоимость в TJS';
