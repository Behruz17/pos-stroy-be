-- Изменение таблицы salaries для использования employee_id вместо user_id
-- ВНИМАНИЕ: Эта миграция изменит существующую структуру

-- 1. Добавить колонку employee_id
ALTER TABLE salaries ADD COLUMN employee_id int DEFAULT NULL AFTER id;

-- 2. Добавить индекс для employee_id
ALTER TABLE salaries ADD INDEX idx_salaries_employee_id (employee_id);

-- 3. (Опционально) Если есть данные, можно скопировать из user_id в employee_id
-- Раскомментируйте следующую строку, если хотите перенести данные:
-- UPDATE salaries SET employee_id = user_id WHERE user_id IS NOT NULL;

-- 4. (Опционально) Удалить колонку user_id после миграции данных
-- Раскомментируйте следующую строку после проверки данных:
-- ALTER TABLE salaries DROP COLUMN user_id;
