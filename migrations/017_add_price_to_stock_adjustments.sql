-- Добавить поля для отслеживания изменений цен в корректировках остатков
ALTER TABLE stock_adjustments 
ADD COLUMN previous_price decimal(10,2) DEFAULT NULL AFTER adjustment,
ADD COLUMN new_price decimal(10,2) DEFAULT NULL AFTER previous_price,
ADD COLUMN price_adjustment decimal(10,2) DEFAULT NULL AFTER new_price;

-- Разрешить NULL в adjustment когда меняется только цена
ALTER TABLE stock_adjustments MODIFY COLUMN adjustment decimal(10,2) DEFAULT NULL;
