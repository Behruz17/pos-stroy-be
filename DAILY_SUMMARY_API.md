# API документация: Отчёт "Итог дня"

## Обзор
Реализован отчёт "итог дня" для POS системы с расчётами на основе таблицы `transactions` и кэшированием в таблице `daily_balances`.

## API эндпоинты

### 1. Получить отчёт "итог дня" (расчёт из transactions)
```
GET /api/reports/daily-summary
```

**Параметры запроса:**
- `date` (обязательный) - Дата в формате YYYY-MM-DD
- `usd_rate` (опциональный) - Курс USD для конвертации (по умолчанию 1.0000)

**Пример запроса:**
```
GET /api/reports/daily-summary?date=2026-04-20&usd_rate=10.5000
```

**Ответ:**
```json
{
  "date": "2026-04-20",
  "income": 299.00,
  "expense": 280.00,
  "balance": 19.00,
  "balance_usd": 1.8095,
  "usd_rate": 10.5000
}
```

### 2. Сохранить дневной баланс в кэш
```
POST /api/reports/daily-balance
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
  "message": "Daily balance saved successfully",
  "data": {
    "date": "2026-04-20",
    "income": 299.00,
    "expense": 280.00,
    "balance": 19.00,
    "balance_usd": 1.8095,
    "usd_rate": 10.5000
  }
}
```

### 3. Получить дневной баланс (из кэша или расчёт)
```
GET /api/reports/daily-balance
```

**Параметры запроса:**
- `date` (обязательный) - Дата в формате YYYY-MM-DD
- `usd_rate` (опциональный) - Курс USD для конвертации
- `force_recalculate` (опциональный) - Принудительно пересчитать из transactions (true/false)

**Пример запроса:**
```
GET /api/reports/daily-balance?date=2026-04-20&force_recalculate=false
```

**Ответ из кэша:**
```json
{
  "date": "2026-04-20",
  "income": 299.00,
  "expense": 280.00,
  "balance": 19.00,
  "balance_usd": 1.8095,
  "usd_rate": 10.5000,
  "from_cache": true
}
```

## Структура таблиц

### transactions (источник истины)
```sql
CREATE TABLE `transactions` (
  `id` int NOT NULL,
  `account_id` int NOT NULL,
  `type` enum('INCOME','EXPENSE','TRANSFER') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reference_type` enum('SALE','PURCHASE','SALARY','EXPENSE','CUSTOMER_PAYMENT','SUPPLIER_PAYMENT','TRANSFER') DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
);
```

### daily_balances (кэш/история)
```sql
CREATE TABLE `daily_balances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `income` decimal(15,2) NOT NULL DEFAULT '0.00',
  `expense` decimal(15,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `balance_usd` decimal(15,2) NOT NULL DEFAULT '0.00',
  `usd_rate` decimal(10,4) NOT NULL DEFAULT '1.0000',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_date` (`date`)
);
```

## Логика работы

1. **Расчёт итога дня:**
   - Суммируются все `INCOME` транзакции за указанную дату
   - Суммируются все `EXPENSE` транзакции за указанную дату
   - Баланс = income - expense
   - Конвертация в USD: balance / usd_rate

2. **Кэширование:**
   - При вызове `saveDailyBalance` рассчитанные значения сохраняются в `daily_balances`
   - При вызове `getDailyBalance` сначала проверяется наличие записи в кэше
   - Если записи нет или `force_recalculate=true`, производится расчёт из `transactions`

3. **Важные моменты:**
   - `transactions` - источник истины
   - `daily_balances` - только кэш/история для быстрого доступа
   - Все расчёты всегда производятся на основе `transactions`
   - Поддерживается конвертация в USD по переданному курсу

## Примеры использования

### Получить итог за сегодня:
```javascript
const today = new Date().toISOString().split('T')[0];
fetch(`/api/reports/daily-summary?date=${today}`)
  .then(res => res.json())
  .then(data => console.log(data));
```

### Сохранить итог дня (например, в конце рабочего дня):
```javascript
fetch('/api/reports/daily-balance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2026-04-20',
    usd_rate: 10.5000
  })
});
```

### Получить исторические данные (быстро из кэша):
```javascript
fetch('/api/reports/daily-balance?date=2026-04-20')
  .then(res => res.json())
  .then(data => {
    if (data.from_cache) {
      console.log('Данные из кэша:', data);
    }
  });
```
