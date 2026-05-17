-- Скрипт для заполнения products.purchase_cost на основе последних приходов
-- Для simple товаров берем последнюю закупочную цену из stock_receipt_items

-- Обновляем purchase_cost для simple товаров на основе последнего прихода
UPDATE products p
LEFT JOIN (
    SELECT 
        sri.product_id,
        sri.purchase_cost,
        ROW_NUMBER() OVER (PARTITION BY sri.product_id ORDER BY sr.created_at DESC) as rn
    FROM stock_receipt_items sri
    LEFT JOIN stock_receipts sr ON sri.receipt_id = sr.id
    WHERE sri.purchase_cost IS NOT NULL 
    AND sr.status = 1
    AND sri.status = 1
) latest_costs ON p.id = latest_costs.product_id AND latest_costs.rn = 1
SET p.purchase_cost = latest_costs.purchase_cost
WHERE p.type = 'simple' 
AND p.purchase_cost IS NULL
AND p.status = 1;

-- Проверка результатов
SELECT 
    p.id,
    p.name,
    p.type,
    p.purchase_cost,
    p.currency
FROM products p
WHERE p.type = 'simple' 
AND p.status = 1
ORDER BY p.id;
