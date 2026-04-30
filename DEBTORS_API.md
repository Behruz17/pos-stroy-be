# Debtors API Documentation

## Overview
API для управления должниками и их операциями. Поддерживает создание должников с начальными долгами и отслеживание истории операций.

## Endpoints

### 1. Получить всех должников
```
GET /debtors
```

**Query Parameters:**
- `date` (string, optional) - Фильтр по дате создания (YYYY-MM-DD)
- `month` (number, optional) - Фильтр по месяцу (1-12)
- `year` (number, optional) - Фильтр по году

**Response:**
```json
[
  {
    "id": 1,
    "full_name": "Иван Иванов",
    "phone": "123456789",
    "debt_amount": "1000.00",
    "description": "Описание должника",
    "created_at": "2026-01-01T10:00:00.000Z",
    "updated_at": "2026-01-01T10:00:00.000Z",
    "status": 1
  }
]
```

### 2. Получить должника по ID
```
GET /debtors/:id
```

**Response:**
```json
{
  "id": 1,
  "full_name": "Иван Иванов",
  "phone": "123456789",
  "debt_amount": "1000.00",
  "description": "Описание должника",
  "created_at": "2026-01-01T10:00:00.000Z",
  "updated_at": "2026-01-01T10:00:00.000Z",
  "status": 1
}
```

### 3. Создать должника ⭐
```
POST /debtors
```

**Request Body:**
```json
{
  "full_name": "Иван Иванов",
  "phone": "123456789",
  "initial_debt": 1000.00,
  "description": "Описание должника"
}
```

**Required Fields:**
- `full_name` (string) - Полное имя должника

**Optional Fields:**
- `phone` (string) - Телефон
- `initial_debt` (number) - Начальная сумма долга (по умолчанию 0)
- `description` (string) - Описание

**Особенности:**
- Если `initial_debt > 0`, автоматически создается операция BORROWED
- Все операции выполняются в одной транзакции
- Если `initial_debt` не передан или равен 0, создается должник без операций
- Идеально для массового создания должников с долгами

**Response:**
```json
{
  "id": 1,
  "full_name": "Иван Иванов",
  "phone": "123456789",
  "debt_amount": "1000.00",
  "description": "Описание должника",
  "created_at": "2026-01-01T10:00:00.000Z",
  "updated_at": "2026-01-01T10:00:00.000Z",
  "status": 1
}
```

### 4. Обновить должника
```
PUT /debtors/:id
```

**Request Body:**
```json
{
  "full_name": "Иван Петров",
  "phone": "987654321",
  "debt_amount": 500.00,
  "description": "Обновленное описание"
}
```

**Важно:** При обновлении `debt_amount` операция в `debtor_operations` НЕ создается. Для отслеживания изменений баланса используйте операции.

### 5. Удалить должника (soft delete)
```
DELETE /debtors/:id
```

**Response:**
```json
{
  "message": "Debtor deleted successfully"
}
```

## Операции должников

### Создать операцию займа
```
POST /debtor-operations/borrowed
```

**Request Body:**
```json
{
  "debtor_id": 1,
  "amount": 500.00,
  "description": "Новый займ"
}
```

### Создать операцию возврата
```
POST /debtor-operations/returned
```

**Request Body:**
```json
{
  "debtor_id": 1,
  "amount": 200.00,
  "description": "Частичный возврат"
}
```

## Рекомендации по использованию

### Для массового создания должников с долгами:
Используйте `POST /debtors` с параметром `initial_debt` - это создаст и должника, и начальную операцию автоматически.

### Для отслеживания изменений баланса:
Всегда используйте операции (`/debtor-operations`) вместо прямого обновления `debt_amount`.

### Для создания должников без начального долга:
Используйте `POST /debtors` без параметра `initial_debt` или с `initial_debt: 0`.

## Структура данных

### Debtors
```sql
CREATE TABLE debtors (
  id int NOT NULL AUTO_INCREMENT,
  full_name varchar(255) NOT NULL,
  phone varchar(50) DEFAULT NULL,
  debt_amount decimal(10,2) NOT NULL DEFAULT '0.00',
  description text,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status tinyint(1) NOT NULL DEFAULT '1'
);
```

### Debtor Operations
```sql
CREATE TABLE debtor_operations (
  id int NOT NULL AUTO_INCREMENT,
  debtor_id int NOT NULL,
  amount decimal(10,2) NOT NULL,
  type enum('BORROWED','RETURNED') NOT NULL,
  description text,
  date timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  status tinyint(1) NOT NULL DEFAULT '1'
);
```

## Примеры использования

### Создание 100+ должников с долгами:
```javascript
const debtors = [
  { full_name: "Должник 1", initial_debt: 1000 },
  { full_name: "Должник 2", initial_debt: 500 },
  // ... еще 98 должников
];

for (const debtor of debtors) {
  await fetch('/debtors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(debtor)
  });
}
```

Это создаст каждого должника с соответствующей начальной операцией BORROWED.
