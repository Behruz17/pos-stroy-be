-- Update existing sales to migrate from paid_amount to cash_amount/electronic_amount
UPDATE `sales` SET 
  `cash_amount` = CASE 
    WHEN `payment_status` = 'PAID' THEN `total_amount`
    WHEN `payment_status` = 'PARTIAL' THEN COALESCE(`paid_amount`, 0)
    ELSE 0
  END,
  `electronic_amount` = 0
WHERE `cash_amount` = 0 AND `electronic_amount` = 0;
