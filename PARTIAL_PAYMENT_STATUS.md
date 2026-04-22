# Статус оплаты "ЧАСТИЧНО" для продаж

## Обзор

Добавлен новый статус оплаты `PARTIAL` для продаж, который позволяет отмечать частично оплаченные продажи.

## Статусы оплаты

- **PAID** - полностью оплачено
- **DEBT** - долг (не оплачено)  
- **PARTIAL** - оплачено частично

## Поле paid_amount

Таблица `sales` теперь содержит поле `paid_amount` которое хранит сумму частичной оплаты:

- Для `PAID`: paid_amount = total_amount
- Для `DEBT`: paid_amount = 0 или NULL
- Для `PARTIAL`: paid_amount = фактически оплаченная сумма

## Изменения в системе

### 1. Миграция базы данных

Файл: `migrations/008_add_partial_payment_status.sql`

```sql
-- Изменяем ENUM для поля payment_status, добавляя PARTIAL
ALTER TABLE `sales` 
MODIFY COLUMN `payment_status` enum('PAID','DEBT','PARTIAL') NOT NULL DEFAULT 'DEBT';
```

### 2. Обновление сервиса продаж

**sales.service.js** - добавлена поддержка `PARTIAL` статуса:

#### Создание продажи:
- `PARTIAL` продажи создают транзакции в accounts
- Создаются записи в customer_operations с типом `PARTIAL`

#### Обновление продажи:
- Корректно обрабатывается изменение баланса клиента
- Обновляются записи в customer_operations

#### Логика баланса клиента:
- `DEBT` и `PARTIAL` увеличивают баланс клиента (долг)
- `PAID` не влияет на баланс (оплачено)

### 3. API эндпоинты

Все существующие эндпоинты поддерживают новый статус:

- `POST /api/sales` - создание продажи
- `PUT /api/sales/:id` - обновление продажи
- `GET /api/sales` - получение списка продаж

## Примеры использования

### Создание продажи с частичной оплатой:
```javascript
const sale = await salesService.create({
  customer_id: 72,
  total_amount: 1000,
  payment_status: 'PARTIAL',  // Новый статус
  debt_deadline: '2026-05-01',
  items: [
    {
      product_id: 1,
      quantity: 5,
      unit_price: 200
    }
  ]
});
```

### Обновление статуса оплаты:
```javascript
const updated = await salesService.update(5, {
  payment_status: 'PAID'  // Изменить с PARTIAL на PAID
});
```

## Преимущества

1. **Гибкость** - можно отслеживать частичные оплаты
2. **Аудит** - все изменения статусов записываются в customer_operations  
3. **Совместимость** - старые данные (PAID, DEBT) не изменяются
4. **Корректные балансы** - правильно учитывается долг клиента

## Обратная совместимость

Существующие продажи со статусами `PAID` и `DEBT` продолжают работать как раньше.
Новый статус `PARTIAL` добавляется как дополнительный вариант.
