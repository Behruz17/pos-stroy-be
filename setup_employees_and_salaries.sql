-- Установка модуля сотрудников и обновление зарплат
-- Выполните этот SQL скрипт в вашей базе данных

-- 1. Создать таблицу сотрудников
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `position` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `salary_rate` decimal(10,2) DEFAULT '0.00',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employees_status` (`status`),
  KEY `idx_employees_full_name` (`full_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- 2. Добавить employee_id в таблицу зарплат
ALTER TABLE salaries ADD COLUMN employee_id int DEFAULT NULL AFTER id;
ALTER TABLE salaries ADD INDEX idx_salaries_employee_id (employee_id);

-- 3. (Опционально) Скопировать данные из user_id в employee_id
-- Раскомментируйте если хотите перенести существующие данные:
-- UPDATE salaries SET employee_id = user_id WHERE user_id IS NOT NULL;

-- 4. (Опционально) Создать записи сотрудников на основе пользователей
-- Раскомментируйте если хотите создать сотрудников из пользователей:
-- INSERT INTO employees (full_name, position, phone, email, hire_date, salary_rate, status)
-- SELECT name, 'Employee', phone, email, created_at, 0, 1 
-- FROM users WHERE status = 1;

-- 5. (Опционально) Удалить user_id после миграции
-- Раскомментируйте после проверки что все данные перенесены:
-- ALTER TABLE salaries DROP COLUMN user_id;

-- Примечание: После выполнения миграций перезапустите сервер для регистрации новых API эндпоинтов

-- Новые эндпоинты:
-- GET /api/employees - все сотрудники
-- POST /api/employees - создать сотрудника
-- PUT /api/employees/{id} - обновить сотрудника
-- DELETE /api/employees/{id} - удалить сотрудника
-- GET /api/employees/salary-history - сотрудники с историей зарплат

-- Обновленные эндпоинты зарплат:
-- POST /api/salaries - теперь требует employee_id вместо user_id
-- GET /api/salaries/employees-history - новый метод для сотрудников
