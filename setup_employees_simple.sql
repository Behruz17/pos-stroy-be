-- Установка простого модуля сотрудников и обновление зарплат
-- Выполните этот SQL скрипт в вашей базе данных

-- 1. Создать простую таблицу сотрудников (только 3 поля)
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_employees_status` (`status`),
  KEY `idx_employees_full_name` (`full_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- 2. Добавить employee_id в таблицу зарплат
ALTER TABLE salaries ADD COLUMN employee_id int DEFAULT NULL AFTER id;
ALTER TABLE salaries ADD INDEX idx_salaries_employee_id (employee_id);

-- 3. (Опционально) Создать записи сотрудников на основе пользователей
-- Раскомментируйте если хотите создать сотрудников из пользователей:
-- INSERT INTO employees (full_name, status)
-- SELECT name, 1 
-- FROM users WHERE status = 1;

-- 4. (Опционально) Скопировать данные из user_id в employee_id
-- Раскомментируйте если хотите перенести существующие данные:
-- UPDATE salaries SET employee_id = user_id WHERE user_id IS NOT NULL;

-- 5. (Опционально) Удалить user_id после миграции
-- Раскомментируйте после проверки что все данные перенесены:
-- ALTER TABLE salaries DROP COLUMN user_id;

-- Примечание: После выполнения миграций перезапустите сервер для регистрации новых API эндпоинтов

-- Новые эндпоинты сотрудников:
-- GET /api/employees - все сотрудники (только id, full_name, status)
-- POST /api/employees - создать сотрудника (только full_name)
-- PUT /api/employees/{id} - обновить сотрудника (только full_name)
-- DELETE /api/employees/{id} - удалить сотрудника
-- GET /api/employees/salary-history - сотрудники с историей зарплат

-- Обновленные эндпоинты зарплат:
-- POST /api/salaries - теперь требует employee_id вместо user_id
-- GET /api/salaries/employees-history - новый метод для сотрудников

-- Пример использования:
-- POST /api/employees
-- { "full_name": "Иванов Иван Иванович" }

-- POST /api/salaries
-- { "employee_id": 1, "month": 1, "year": 2026, "total_amount": 1500000 }
