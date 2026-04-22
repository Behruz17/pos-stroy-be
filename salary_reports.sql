-- SQL query to show salary information with payments
SELECT 
    s.id as salary_id,
    s.user_id,
    u.name as user_name,
    s.month,
    s.year,
    s.total_amount as salary_amount,
    COALESCE(SUM(sp.amount), 0) as paid_amount,
    (s.total_amount - COALESCE(SUM(sp.amount), 0)) as remaining_amount,
    CASE 
        WHEN s.total_amount - COALESCE(SUM(sp.amount), 0) <= 0 THEN 'PAID'
        WHEN COALESCE(SUM(sp.amount), 0) > 0 THEN 'PARTIALLY_PAID'
        ELSE 'UNPAID'
    END as payment_status,
    s.created_at,
    COUNT(sp.id) as payment_count
FROM salaries s
LEFT JOIN users u ON s.user_id = u.id AND u.status = 1
LEFT JOIN salary_payments sp ON s.id = sp.salary_id AND sp.status = 1
WHERE s.status = 1
GROUP BY s.id, s.user_id, u.name, s.month, s.year, s.total_amount, s.created_at
ORDER BY s.year DESC, s.month DESC, u.name ASC;

-- Alternative query for specific user and period
SELECT 
    s.id as salary_id,
    s.user_id,
    u.name as user_name,
    s.month,
    s.year,
    s.total_amount as salary_amount,
    COALESCE(SUM(sp.amount), 0) as paid_amount,
    (s.total_amount - COALESCE(SUM(sp.amount), 0)) as remaining_amount,
    CASE 
        WHEN s.total_amount - COALESCE(SUM(sp.amount), 0) <= 0 THEN 'PAID'
        WHEN COALESCE(SUM(sp.amount), 0) > 0 THEN 'PARTIALLY_PAID'
        ELSE 'UNPAID'
    END as payment_status,
    s.created_at,
    COUNT(sp.id) as payment_count
FROM salaries s
LEFT JOIN users u ON s.user_id = u.id AND u.status = 1
LEFT JOIN salary_payments sp ON s.id = sp.salary_id AND sp.status = 1
WHERE s.status = 1 
    AND s.user_id = ? 
    AND s.month = ? 
    AND s.year = ?
GROUP BY s.id, s.user_id, u.name, s.month, s.year, s.total_amount, s.created_at;

-- Query for unpaid salaries
SELECT 
    s.id as salary_id,
    s.user_id,
    u.name as user_name,
    s.month,
    s.year,
    s.total_amount as salary_amount,
    COALESCE(SUM(sp.amount), 0) as paid_amount,
    (s.total_amount - COALESCE(SUM(sp.amount), 0)) as remaining_amount,
    DATEDIFF(NOW(), s.created_at) as days_since_creation
FROM salaries s
LEFT JOIN users u ON s.user_id = u.id AND u.status = 1
LEFT JOIN salary_payments sp ON s.id = sp.salary_id AND sp.status = 1
WHERE s.status = 1 
GROUP BY s.id, s.user_id, u.name, s.month, s.year, s.total_amount, s.created_at
HAVING (s.total_amount - COALESCE(SUM(sp.amount), 0)) > 0
ORDER BY s.year ASC, s.month ASC;
