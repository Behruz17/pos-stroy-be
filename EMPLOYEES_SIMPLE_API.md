# API для управления сотрудниками (простая версия)

## Обзор
Создан модуль `employees` с простой таблицей из 3 полей: `id`, `full_name`, `status`.

## Таблица `employees`
```sql
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_employees_status` (`status`),
  KEY `idx_employees_full_name` (`full_name`)
)
```

## Эндпоинты

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
    "status": 1
  },
  {
    "id": 2,
    "full_name": "Петров Петр Петрович",
    "status": 1
  }
]
```

### 2. Получить сотрудника по ID
```
GET /api/employees/{id}
```

**Ответ:**
```json
{
  "id": 1,
  "full_name": "Иванов Иван Иванович",
  "status": 1
}
```

### 3. Создать сотрудника
```
POST /api/employees
```

**Тело запроса:**
```json
{
  "full_name": "Сидоров Сидор Сидорович"
}
```

**Ответ:**
```json
{
  "id": 3,
  "full_name": "Сидоров Сидор Сидорович",
  "status": 1
}
```

### 4. Обновить сотрудника
```
PUT /api/employees/{id}
```

**Тело запроса:**
```json
{
  "full_name": "Сидоров Сидор Петрович"
}
```

**Ответ:**
```json
{
  "id": 3,
  "full_name": "Сидоров Сидор Петрович",
  "status": 1
}
```

### 5. Удалить сотрудника
```
DELETE /api/employees/{id}
```

**Ответ:**
```json
{
  "message": "Employee deleted successfully"
}
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
    "status": 1,
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

### Создание зарплаты (теперь требует employee_id)
```
POST /api/salaries
```

**Тело запроса:**
```json
{
  "employee_id": 1,
  "month": 1,
  "year": 2026,
  "total_amount": 1500000
}
```

## Валидация

### Сотрудники:
- `full_name` - обязателен, строка до 255 символов
- `status` - автоматический, 1 (активен) или 0 (удален)

### Зарплаты:
- `employee_id` - обязателен (вместо `user_id`)
- `month` - 1-12
- `year` - 2000-2100
- `total_amount` - положительное число

## Установка

1. Выполните миграции:
```sql
-- migrations/012_create_employees.sql
-- migrations/013_update_salaries_to_employee_id.sql
```

2. Перезапустите сервер

3. Опциональная миграция данных:
```sql
-- Создать записи сотрудников на основе пользователей
INSERT INTO employees (full_name, status)
SELECT name, 1 
FROM users WHERE status = 1;

-- Скопировать данные из user_id в employee_id в зарплатах
UPDATE salaries SET employee_id = user_id WHERE user_id IS NOT NULL;
```

## Преимущества простой версии

1. **Минимализм**: Только необходимые поля
2. **Быстродействие**: Меньше данных, быстрее запросы
3. **Простота**: Легко понять и использовать
4. **Гибкость**: При необходимости можно добавить поля позже

## Обратная совместимость

- Старые эндпоинты зарплат продолжают работать
- Метод `getAllUsersWithHistory` оставлен для совместимости
- Поля `user_id` можно удалить после полной миграции
