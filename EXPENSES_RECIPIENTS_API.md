# API для управления получателями расходов

## Обзор
Создана система для управления получателями расходов с поддержкой сотрудников и других категорий расходов.

## Структура

### Таблица `expense_recipients`
```sql
CREATE TABLE `expense_recipients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('employee', 'other') NOT NULL DEFAULT 'other',
  `reference_id` int DEFAULT NULL, -- ID сотрудника если type='employee'
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
)
```

### Таблица `expenses` (обновлена)
```sql
ALTER TABLE expenses ADD COLUMN recipient_id int DEFAULT NULL AFTER account_id;
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

**Или для сотрудника:**
```json
{
  "name": "Петров Петр Петрович",
  "type": "employee",
  "reference_id": 2
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

## Обновленные эндпоинты расходов

### Создание расхода (теперь требует recipient_id)
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

**Ответ:**
```json
{
  "id": 123,
  "description": "Оплата аренды офиса",
  "amount": "1500000.00",
  "expense_date": "2026-04-29",
  "recipient_id": 1,
  "recipient_name": "Аренда",
  "display_name": "Аренда",
  "created_by": 1
}
```

### Получение расходов с информацией о получателях
```
GET /api/expenses
```

**Ответ:**
```json
[
  {
    "id": 123,
    "description": "Оплата аренды офиса",
    "amount": "1500000.00",
    "expense_date": "2026-04-29",
    "recipient_id": 1,
    "recipient_name": "Аренда",
    "display_name": "Аренда",
    "created_by": 1,
    "created_by_name": "Admin"
  },
  {
    "id": 124,
    "description": "Выплата зарплаты",
    "amount": "2000000.00",
    "expense_date": "2026-04-29",
    "recipient_id": 7,
    "recipient_name": "Иванов Иван Иванович",
    "display_name": "Иванов Иван Иванович",
    "created_by": 1,
    "created_by_name": "Admin"
  }
]
```

## Базовые получатели расходов

При установке создаются следующие базовые получатели:
- Аренда
- Коммунальные услуги
- Маркетинг и реклама
- Транспорт
- Канцелярия
- Прочие расходы

## Синхронизация сотрудников

Метод `GET /api/expenses/recipients/sync` выполняет:
1. **Добавление**: Создает записи для всех активных сотрудников, которых еще нет в получателях
2. **Удаление**: Деактивирует записи для уволенных сотрудников
3. **Обновление**: Обновляет имена сотрудников при их изменении

## Типы получателей

### `employee`
- `reference_id` содержит ID сотрудника из таблицы `employees`
- `display_name` показывает полное имя сотрудника
- Автоматически синхронизируется с таблицей сотрудников

### `other`
- `reference_id` всегда `null`
- `display_name` совпадает с `name`
- Используется для прочих категорий расходов

## Преимущества системы

1. **Гибкость**: Можно добавлять новые категории расходов
2. **Интеграция**: Автоматическая синхронизация с сотрудниками
3. **История**: Сохраняется история всех получателей
4. **Фильтрация**: Расходы можно фильтровать по получателям
5. **Масштабируемость**: Легко расширить систему

## Установка

1. Выполните миграцию:
```sql
-- migrations/014_create_expense_recipients.sql
```

2. Перезапустите сервер

3. Опционально: синхронизируйте сотрудников:
```bash
GET /api/expenses/recipients/sync
```

## Примеры использования

### Расход на сотрудника:
```json
{
  "description": "Премия Иванову",
  "amount": 500000,
  "expense_date": "2026-04-29",
  "recipient_id": 7  // Иванов Иван Иванович
}
```

### Расход на категорию:
```json
{
  "description": "Оплата интернета",
  "amount": 200000,
  "expense_date": "2026-04-29",
  "recipient_id": 2  // Коммунальные услуги
}
```

### Фильтрация расходов по получателю:
```bash
GET /api/expenses?recipient_id=7
```
