# Этапы продажи в POS системе

## Обзор

Реализована система этапов продажи для POS системы. Продажа проходит последовательные этапы независимо от статуса оплаты.

## Этапы продажи

| Этап | Описание | Переходы |
|------|----------|----------|
| `ordered` | Заказан | → `ready` |
| `ready` | Готов | → `delivered` |
| `delivered` | Доставлен/Выдан | Конец |

## Важные правила

1. **Последовательность**: Этапы идут строго по порядку `ordered → ready → delivered`
2. **Без пропусков**: Нельзя перепрыгнуть этап (например, `ordered → delivered`)
3. **Без возврата**: Нельзя вернуться на предыдущий этап
4. **Независимость**: Этапы не связаны с оплатой (`payment_status`)

## Структура базы данных

### 1. Поле `stage` в таблице `sales`

```sql
ALTER TABLE `sales` 
ADD COLUMN `stage` enum('ordered','ready','delivered') NOT NULL DEFAULT 'ordered';
```

### 2. Таблица истории изменений `sale_stage_history`

```sql
CREATE TABLE `sale_stage_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `from_stage` enum('ordered','ready','delivered') NOT NULL,
  `to_stage` enum('ordered','ready','delivered') NOT NULL,
  `changed_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
);
```

## API Эндпоинты

### 1. Создание продажи с этапом

```http
POST /api/sales
Content-Type: application/json
Authorization: Bearer {token}

{
  "customer_id": 72,
  "payment_status": "PARTIAL",
  "paid_amount": 500,
  "stage": "ordered",           // ← Новое поле (по умолчанию 'ordered')
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 250
    }
  ]
}
```

### 2. Изменение этапа продажи

```http
PUT /api/sales/:id/stage
Content-Type: application/json
Authorization: Bearer {token}

{
  "stage": "ready"              // ← Новый этап
}
```

**Успешный ответ:**
```json
{
  "success": true,
  "sale_id": 5,
  "from_stage": "ordered",
  "to_stage": "ready",
  "message": "Stage updated successfully from 'ordered' to 'ready'"
}
```

**Ошибка (неверный переход):**
```json
{
  "error": "Invalid stage transition from 'ordered' to 'delivered'. Allowed transitions: ready"
}
```

### 3. Получение истории изменений этапов

```http
GET /api/sales/:id/stage-history
Authorization: Bearer {token}
```

**Ответ:**
```json
[
  {
    "id": 1,
    "sale_id": 5,
    "from_stage": "ordered",
    "to_stage": "ready",
    "changed_by": 173,
    "changed_by_username": "admin",
    "created_at": "2026-04-22T14:30:00.000Z"
  },
  {
    "id": 2,
    "sale_id": 5,
    "from_stage": "ready",
    "to_stage": "delivered",
    "changed_by": 173,
    "changed_by_username": "admin",
    "created_at": "2026-04-22T15:00:00.000Z"
  }
]
```

### 4. Получение списка продаж с этапами

```http
GET /api/sales
Authorization: Bearer {token}
```

**Ответ (включает поле stage):**
```json
[
  {
    "id": 5,
    "customer_id": 72,
    "total_amount": "500.00",
    "paid_amount": "250.00",
    "payment_status": "PARTIAL",
    "stage": "ready",              // ← Текущий этап
    "customer_name": "Иванов Иван",
    ...
  }
]
```

## Примеры использования

### Сценарий 1: Полный цикл продажи

```javascript
// 1. Клиент заказал товар
POST /api/sales
{
  "customer_id": 72,
  "stage": "ordered",           // Заказан
  "payment_status": "DEBT",
  "items": [...]
}

// 2. Товар готов к выдаче
PUT /api/sales/5/stage
{
  "stage": "ready"              // Готов
}

// 3. Клиент оплатил часть суммы
POST /api/sales/5/payment
{
  "amount": 250,
  "account_id": 1
}

// 4. Товар выдан клиенту
PUT /api/sales/5/stage
{
  "stage": "delivered"          // Доставлен/Выдан
}
```

### Сценарий 2: Оплата не зависит от этапов

```javascript
// Продажа может быть оплачена на любом этапе:

// Этап: ordered, Оплата: полная
{
  "stage": "ordered",
  "payment_status": "PAID"
}

// Этап: ready, Оплата: частичная
{
  "stage": "ready",
  "payment_status": "PARTIAL",
  "paid_amount": 300
}

// Этап: delivered, Оплата: долг
{
  "stage": "delivered",
  "payment_status": "DEBT"
}
```

## Миграция

Файл: `migrations/010_add_sales_stages.sql`

```bash
# Применить миграцию
mysql -u root -p database_name < migrations/010_add_sales_stages.sql
```

## Интеграция с фронтендом

### Визуализация этапов

```javascript
const stages = {
  ordered: { label: 'Заказан', color: 'blue', icon: 'shopping-cart' },
  ready: { label: 'Готов', color: 'orange', icon: 'check-circle' },
  delivered: { label: 'Выдан', color: 'green', icon: 'package' }
};
```

### Кнопки перехода

```javascript
// Показывать кнопку перехода только для разрешённых этапов
const allowedTransitions = {
  ordered: ['ready'],
  ready: ['delivered'],
  delivered: []
};

function showNextStageButton(currentStage) {
  const nextStages = allowedTransitions[currentStage];
  return nextStages.length > 0 ? nextStages[0] : null;
}
```

## Проверка здоровья

```bash
# Проверить что все продажи имеют корректный этап
SELECT stage, COUNT(*) as count 
FROM sales 
WHERE status = 1 
GROUP BY stage;

# Проверить историю изменений
SELECT * FROM sale_stage_history 
ORDER BY created_at DESC 
LIMIT 10;
```

## Ограничения

- Нельзя пропустить этап: `ordered` → `delivered` ❌
- Нельзя вернуться назад: `ready` → `ordered` ❌
- Нельзя повторно установить текущий этап: `ready` → `ready` ❌
- Этапы не влияют на оплату и наоборот

## Преимущества

1. **Чёткий процесс** - понятно на каком этапе каждая продажа
2. **Аудит** - полная история изменений этапов
3. **Гибкость** - этапы независимы от оплаты
4. **Отчётность** - можно фильтровать и анализировать по этапам
