# API для управления расходами

## Обзор
Система управления расходами с поддержкой получателей (сотрудники и категории расходов).

## Эндпоинты расходов

### 1. Получить все расходы
```
GET /api/expenses
```

**Параметры запроса:**
- `date` (YYYY-MM-DD) - фильтр по дате
- `month` (1-12) - фильтр по месяцу
- `year` (YYYY) - фильтр по году
- `recipient_id` - фильтр по получателю
- `created_by` - фильтр по создателю (только для ADMIN)

**Ответ:**
```json
[
  {
    "id": 1,
    "description": "Оплата аренды офиса",
    "amount": "1500000.00",
    "account_id": 1,
    "expense_date": "2026-04-29",
    "recipient_id": 1,
    "recipient_name": "Аренда",
    "display_name": "Аренда",
    "created_by": 1,
    "created_by_name": "Admin",
    "created_at": "2026-04-29T10:00:00Z",
    "status": 1
  },
  {
    "id": 2,
    "description": "Выплата премии Иванову",
    "amount": "500000.00",
    "account_id": 2,
    "expense_date": "2026-04-29",
    "recipient_id": 7,
    "recipient_name": "Иванов Иван Иванович",
    "display_name": "Иванов Иван Иванович",
    "created_by": 1,
    "created_by_name": "Admin",
    "created_at": "2026-04-29T11:00:00Z",
    "status": 1
  }
]
```

### 2. Получить расход по ID
```
GET /api/expenses/{id}
```

**Ответ:**
```json
{
  "id": 1,
  "description": "Оплата аренды офиса",
  "amount": "1500000.00",
  "account_id": 1,
  "expense_date": "2026-04-29",
  "recipient_id": 1,
  "recipient_name": "Аренда",
  "display_name": "Аренда",
  "created_by": 1,
  "created_by_name": "Admin",
  "created_at": "2026-04-29T10:00:00Z",
  "status": 1
}
```

### 3. Создать расход
```
POST /api/expenses
```

**Тело запроса:**
```json
{
  "description": "Оплата аренды офиса",
  "account_id": 1,
  "amount": 1500000,
  "expense_date": "2026-04-29",
  "recipient_id": 1
}
```

**Поля:**
- `description` (обяз) - описание расхода
- `amount` (обяз) - положительная сумма
- `expense_date` (обяз) - дата в формате YYYY-MM-DD
- `account_id` (опционально) - счет для списания
- `recipient_id` (опционально) - получатель расхода

**Ответ:**
```json
{
  "id": 1,
  "description": "Оплата аренды офиса",
  "amount": "1500000.00",
  "expense_date": "2026-04-29",
  "recipient_id": 1,
  "created_by": 1
}
```

### 4. Обновить расход
```
PUT /api/expenses/{id}
```

**Тело запроса:**
```json
{
  "description": "Оплата аренды офиса за апрель",
  "amount": 1600000,
  "recipient_id": 1
}
```

### 5. Удалить расход
```
DELETE /api/expenses/{id}
```

**Ответ:**
```json
{
  "message": "Expense deleted successfully"
}
```

## Эндпоинты получателей расходов

### 1. Получить всех получателей
```
GET /api/expenses/recipients
```

**Ответ:**
```json
[
  {
    "id": 1,
    "name": "Аренда",
    "type": "other",
    "reference_id": null,
    "display_name": "Аренда",
    "status": 1,
    "created_at": "2026-04-29T12:00:00Z"
  },
  {
    "id": 2,
    "name": "Коммунальные услуги",
    "type": "other",
    "reference_id": null,
    "display_name": "Коммунальные услуги",
    "status": 1,
    "created_at": "2026-04-29T12:00:00Z"
  },
  {
    "id": 7,
    "name": "Иванов Иван Иванович",
    "type": "employee",
    "reference_id": 1,
    "display_name": "Иванов Иван Иванович",
    "status": 1,
    "created_at": "2026-04-29T12:00:00Z"
  }
]
```

### 2. Синхронизировать сотрудников
```
GET /api/expenses/recipients/sync
```

**Ответ:**
```json
{
  "success": true,
  "synced_count": 5
}
```

### 3. Создать получателя
```
POST /api/expenses/recipients
```

**Тело запроса:**
```json
{
  "name": "Новый поставщик",
  "type": "other"
}
```

### 4. Обновить получателя
```
PUT /api/expenses/recipients/{id}
```

### 5. Удалить получателя
```
DELETE /api/expenses/recipients/{id}
```

## Типы получателей

### `employee`
- Ссылается на сотрудника из таблицы `employees`
- `reference_id` содержит ID сотрудника
- Автоматически синхронизируется при изменении данных сотрудника

### `other`
- Прочие категории расходов
- `reference_id` всегда `null`
- Можно создавать новые категории через API

## Валидация

### Расходы:
- `description` - обязателен, строка до 255 символов
- `amount` - обязателен, положительное число
- `expense_date` - обязателен, формат YYYY-MM-DD
- `account_id` - опционально, должен существовать
- `recipient_id` - опционально, должен существовать

### Получатели:
- `name` - обязателен, строка до 255 символов
- `type` - обязателен, 'employee' или 'other'
- `reference_id` - обязателен для type='employee'

## Права доступа

- **USER**: может видеть/создавать/редактировать/удалять только свои расходы
- **ADMIN**: может видеть/управлять всеми расходами

## Примеры использования

### Расход на сотрудника:
```bash
POST /api/expenses
{
  "description": "Премия за хорошие показатели",
  "amount": 500000,
  "expense_date": "2026-04-29",
  "recipient_id": 7
}
```

### Расход на категорию:
```bash
POST /api/expenses
{
  "description": "Оплата интернета за апрель",
  "amount": 200000,
  "expense_date": "2026-04-29",
  "recipient_id": 2
}
```

### Фильтрация расходов:
```bash
GET /api/expenses?recipient_id=1
GET /api/expenses?date=2026-04-29
GET /api/expenses?month=4&year=2026
```

## Интеграция с счетами

Если указан `account_id`, система автоматически создает транзакцию списания со счета при создании расхода.

## База данных

### Таблица `expenses`:
```sql
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `account_id` int DEFAULT NULL,
  `expense_date` date NOT NULL,
  `recipient_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
)
```

### Таблица `expense_recipients`:
```sql
CREATE TABLE `expense_recipients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('employee', 'other') NOT NULL DEFAULT 'other',
  `reference_id` int DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
)
```

## Установка

1. Выполните миграции:
```sql
-- migrations/014_create_expense_recipients.sql
```

2. Перезапустите сервер

3. Синхронизируйте сотрудников:
```bash
GET /api/expenses/recipients/sync
```

## Особенности

1. **Гибкая система получателей**: сотрудники + категории
2. **Автоматическая синхронизация**: сотрудники всегда актуальны
3. **Интеграция с финансами**: автоматическое списание со счетов
4. **История и аудит**: все изменения отслеживаются
5. **Фильтрация**: удобная фильтрация по всем параметрам
