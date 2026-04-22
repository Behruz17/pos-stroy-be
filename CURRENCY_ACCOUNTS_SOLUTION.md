# Решение проблемы с мультивалютными счетами

## Проблема
После конвертации из TJS в USD и сохранения баланса, балансы пользователей в таблице `accounts` продолжали отображаться только в сомони, хотя система поддерживает конвертацию.

## Решение

### 1. Обновление структуры таблицы accounts
Добавлена поддержка мультивалютности в таблицу счетов:

```sql
ALTER TABLE `accounts` 
ADD COLUMN `currency` enum('TJS','USD','RUB') NOT NULL DEFAULT 'TJS' AFTER `type`,
ADD COLUMN `balance_usd` decimal(15,2) NOT NULL DEFAULT '0.00' AFTER `balance`,
ADD COLUMN `usd_rate` decimal(10,4) NOT NULL DEFAULT '1.0000' AFTER `balance_usd`;
```

### 2. Новые API эндпоинты

#### Обновление балансов счетов с конвертацией
```
POST /api/reports/accounts/update-balances
```

**Тело запроса:**
```json
{
  "date": "2026-04-20",
  "usd_rate": 10.5000
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Updated 2 accounts with currency conversion",
  "accounts_updated": 2,
  "usd_rate": 10.5000,
  "date": "2026-04-20"
}
```

#### Получение всех счетов с валютной информацией
```
GET /api/reports/accounts
```

**Ответ:**
```json
[
  {
    "id": 1,
    "name": "Нахт",
    "type": "CASH",
    "currency": "TJS",
    "balance": 150.00,
    "balance_usd": 14.29,
    "usd_rate": 10.5000,
    "status": 1,
    "created_at": "2026-04-20T18:19:14.000Z",
    "updated_at": "2026-04-21T12:00:00.000Z"
  },
  {
    "id": 2,
    "name": "DC",
    "type": "ELECTRONIC",
    "currency": "TJS",
    "balance": 75.50,
    "balance_usd": 7.19,
    "usd_rate": 10.5000,
    "status": 1,
    "created_at": "2026-04-20T18:19:14.000Z",
    "updated_at": "2026-04-21T12:00:00.000Z"
  }
]
```

#### Получение конкретного счёта с валютной информацией
```
GET /api/reports/accounts/:id
```

### 3. Обновлённый эндпоинт сохранения дневного баланса

Теперь автоматически обновляет балансы счетов:

```
POST /api/reports/daily-balance
```

**Тело запроса:**
```json
{
  "date": "2026-04-20",
  "usd_rate": 10.5000,
  "update_accounts": true
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Daily balance saved successfully",
  "data": {
    "date": "2026-04-20",
    "income": 299.00,
    "expense": 280.00,
    "balance": 19.00,
    "balance_usd": 1.8095,
    "usd_rate": 10.5000,
    "accounts_updated": true
  }
}
```

## Как это работает

### 1. Расчёт балансов счетов
Для каждого счёта система:
- Суммирует все транзакции (INCOME - EXPENSE) за указанную дату
- Конвертирует баланс в USD по указанному курсу
- Обновляет поля `balance`, `balance_usd`, `usd_rate` в таблице `accounts`

### 2. Автоматическое обновление
При сохранении дневного баланса (`saveDailyBalance`) система автоматически:
- Рассчитывает итог дня из `transactions`
- Сохраняет в `daily_balances`
- Обновляет балансы всех счетов с конвертацией в USD

### 3. Варианты использования

#### Полное обновление в конце дня:
```javascript
fetch('/api/reports/daily-balance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2026-04-20',
    usd_rate: 10.5000,
    update_accounts: true // по умолчанию
  })
});
```

#### Только обновление счетов:
```javascript
fetch('/api/reports/accounts/update-balances', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2026-04-20',
    usd_rate: 10.5000
  })
});
```

#### Получение актуальных балансов:
```javascript
fetch('/api/reports/accounts')
  .then(res => res.json())
  .then(accounts => {
    accounts.forEach(account => {
      console.log(`${account.name}: ${account.balance} TJS = ${account.balance_usd} USD`);
    });
  });
```

## Преимущества решения

1. **Полная мультивалютность** - счета хранят баланс в TJS и USD
2. **Автоматическое обновление** - при сохранении дневного баланса обновляются все счета
3. **Гибкость** - можно обновлять только счета или только дневной баланс
4. **История курсов** - хранится курс USD для каждого обновления
5. **Источники истины** - `transactions` остаются источником, `accounts` и `daily_balances` - кэшированные данные

## Миграция данных

Для обновления существующей системы:

1. Выполнить миграцию `005_add_currency_to_accounts.sql`
2. Запустить обновление балансов для текущей даты:
```javascript
fetch('/api/reports/accounts/update-balances', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: new Date().toISOString().split('T')[0],
    usd_rate: 10.5000
  })
});
```

После этого все счета будут отображать баланс в обеих валютах.
