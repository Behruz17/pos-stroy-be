# API для управления сотрудниками

## Обзор
Создан модуль `employees` для CRUD операций с сотрудниками и обновлена система зарплат для работы с `employee_id` вместо `user_id`.

## Эндпоинты сотрудников

### 1. Получить всех сотрудников
```
GET /api/employees
```

**Ответ:**
```json
[
  {
    "id": 1,
    "full_name": "Иванов Иван Иванович",
    "position": "Менеджер",
    "phone": "+998901234567",
    "email": "ivanov@example.com",
    "hire_date": "2023-01-15",
    "salary_rate": 1500000.00,
    "status": 1,
    "created_at": "2023-01-15T09:00:00Z",
    "updated_at": "2023-01-15T09:00:00Z"
  }
]
```

### 2. Получить сотрудника по ID
```
GET /api/employees/{id}
```

### 3. Создать сотрудника
```
POST /api/employees
```

**Тело запроса:**
```json
{
  "full_name": "Петров Петр Петрович",
  "position": "Продавец",
  "phone": "+998907654321",
  "email": "petrov@example.com",
  "hire_date": "2023-02-01",
  "salary_rate": 1200000
}
```

**Ответ:**
```json
{
  "id": 2,
  "full_name": "Петров Петр Петрович",
  "position": "Продавец",
  "phone": "+998907654321",
  "email": "petrov@example.com",
  "hire_date": "2023-02-01",
  "salary_rate": 1200000.00,
  "status": 1,
  "created_at": "2023-02-01T10:00:00Z",
  "updated_at": "2023-02-01T10:00:00Z"
}
```

### 4. Обновить сотрудника
```
PUT /api/employees/{id}
```

**Тело запроса:**
```json
{
  "position": "Старший продавец",
  "salary_rate": 1300000
}
```

### 5. Удалить сотрудника
```
DELETE /api/employees/{id}
```

### 6. Получить сотрудников с историей зарплат
```
GET /api/employees/salary-history
```

**Ответ:**
```json
[
  {
    "id": 1,
    "full_name": "Иванов Иван Иванович",
    "position": "Менеджер",
    "salaries": [
      {
        "salary_id": 1,
        "month": 1,
        "year": 2026,
        "total_amount": 1500000,
        "paid_amount": 1500000,
        "remaining_amount": 0,
        "payments": [
          {
            "id": 1,
            "amount": 1500000,
            "payment_date": "2026-01-25",
            "created_by_name": "Admin"
          }
        ]
      }
    ],
    "total_remaining": 0
  }
]
```

## Изменения в системе зарплат

### Обновленные эндпоинты зарплат:

#### Создание зарплаты (теперь требует employee_id)
```
POST /api/salaries
```

**Старый формат:**
```json
{
  "user_id": 1,
  "month": 1,
  "year": 2026,
  "total_amount": 1500000
}
```

**Новый формат:**
```json
{
  "employee_id": 1,
  "month": 1,
  "year": 2026,
  "total_amount": 1500000
}
```

#### Получение истории зарплат
```
GET /api/salaries/employees-history  // Новый метод
GET /api/salaries/users-history     // Оставлен для обратной совместимости
```

## База данных

### Новая таблица `employees`:
```sql
CREATE TABLE `employees` (
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
)
```

### Изменения в таблице `salaries`:
```sql
-- Добавлено поле employee_id
ALTER TABLE salaries ADD COLUMN employee_id int DEFAULT NULL AFTER id;

-- В будущем можно удалить user_id после миграции данных
-- ALTER TABLE salaries DROP COLUMN user_id;
```

## Установка

1. Выполните миграции:
```sql
-- migrations/012_create_employees.sql
-- migrations/013_update_salaries_to_employee_id.sql
```

2. Перезапустите сервер

3. (Опционально) Миграция данных из users в employees:
```sql
-- Копировать данные из user_id в employee_id
UPDATE salaries SET employee_id = user_id WHERE user_id IS NOT NULL;

-- Или создать записи сотрудников на основе пользователей
INSERT INTO employees (full_name, position, phone, email, hire_date, salary_rate, status)
SELECT name, 'Employee', phone, email, created_at, 0, 1 
FROM users WHERE status = 1;
```

## Валидация

### Сотрудники:
- `full_name` - обязателен
- `salary_rate` - число, по умолчанию 0
- `phone`, `email`, `position`, `hire_date` - опциональны

### Зарплаты:
- `employee_id` - обязателен (вместо `user_id`)
- `month` - 1-12
- `year` - 2000-2100
- `total_amount` - положительное число

## Обратная совместимость

- Старый эндпоинт `GET /api/salaries/users-history` продолжает работать
- Метод `getAllUsersWithHistory` в сервисе зарплат остается для совместимости
- Поля `user_id` в таблице `salaries` можно удалить после полной миграции

## Преимущества новой системы

1. **Разделение ответственности**: Сотрудники отделены от пользователей системы
2. **Больше данных**: Должность, телефон, email, дата найма, ставка зарплаты
3. **Гибкость**: Можно управлять сотрудниками независимо от пользователей
4. **Аудит**: История изменений с полями `created_at`/`updated_at`
