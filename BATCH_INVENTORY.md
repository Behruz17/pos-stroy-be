# Документация: Учёт товаров с партиями (Batch Inventory)

## Обзор

Система поддерживает два типа товаров:
- **simple** — обычные товары, количество суммируется
- **batch** — товары с партиями (рулоны, паллеты и т.д.), каждый приход создаёт отдельную партию

## Структура базы данных

### Поле `products.type`
```sql
`type` enum('simple','batch') NOT NULL DEFAULT 'simple'
```

### Таблица `stock_items`
Хранит партии для batch товаров:

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | int | ID партии |
| `product_id` | int | ID товара |
| `quantity` | decimal(10,2) | Количество в партии |
| `batch_code` | varchar(100) | Код партии (BATCH-{receipt_id}-{timestamp}) |
| `purchase_cost` | decimal(10,2) | Себестоимость партии |
| `selling_price` | decimal(10,2) | Цена продажи |
| `receipt_id` | int | ID прихода |
| `created_at` | timestamp | Дата создания |
| `status` | tinyint(1) | 1 — активна, 0 — неактивна |

### Поле `sale_items.stock_item_id`
```sql
`stock_item_id` int DEFAULT NULL
```
Связь с партией для batch товаров. Для simple товаров — NULL.

## Логика работы

### Приход товара (Stock Receipts)

**Simple товар:**
- Количество суммируется в `stock.quantity`
- Не создаётся запись в `stock_items`

**Batch товар:**
- Создаётся новая запись в `stock_items` с уникальным `batch_code`
- Обновляется общий остаток в `stock.quantity` (сумма всех партий)

**Пример запроса прихода batch товара:**
```json
{
  "created_by": 1,
  "supplier_id": 1,
  "currency": "TJS",
  "items": [
    {
      "product_id": 100,
      "quantity": 50,
      "purchase_cost": 100.00,
      "selling_price": 120.00,
      "batch_code": "BATCH-001" // опционально, будет сгенерирован автоматически
    }
  ]
}
```

### Продажа товара (Sales)

**Simple товар:**
- Списывается из `stock.quantity`
- `stock_item_id` = NULL

**Batch товар:**
- Обязательно указание `stock_item_id` в запросе
- Списывается из конкретной партии в `stock_items`
- Обновляется общий остаток `stock.quantity`
- Партия автоматически деактивируется при quantity = 0

**Пример запроса продажи batch товара:**
```json
{
  "created_by": 1,
  "customer_id": 1,
  "payment_status": "PAID",
  "items": [
    {
      "product_id": 100,
      "stock_item_id": 5,  // обязательно для batch
      "quantity": 10,
      "unit_price": 120.00
    }
  ]
}
```

**Ошибки при продаже batch товара:**
- `Stock item (batch) is required for batch product {id}` — не указан stock_item_id
- `Stock item {id} not found for product {product_id}` — партия не найдена
- `Insufficient batch stock for product {id}. Available: X, Required: Y` — недостаточно в партии

### Конвертация товаров (Conversions)

**Из batch товара:**
- Обязательно указание `from_stock_item_id`
- Списывается из конкретной партии

**В batch товар:**
- Автоматически создаётся новая партия в `stock_items`

**Пример запроса конвертации:**
```json
{
  "created_by": 1,
  "from_product_id": 100,
  "to_product_id": 101,
  "from_stock_item_id": 5,  // обязательно если from_product — batch
  "from_quantity": 10,
  "to_quantity": 10,
  "selling_price": 120.00
}
```

### Удаление/отмена операций

При удалении прихода, продажи или конвертации:
- Simple товары: стандартное восстановление в `stock`
- Batch товары: восстановление конкретной партии + реактивация если была деактивирована

## API Endpoints

### Получение списка партий товара

```
GET /api/products/:id/stock-items
```

**Response:**
```json
{
  "product_id": 100,
  "product_type": "batch",
  "total_quantity": 150,
  "batches": [
    {
      "id": 5,
      "batch_code": "BATCH-18-1234567890",
      "quantity": 50,
      "purchase_cost": 100.00,
      "selling_price": 120.00,
      "created_at": "2026-04-23T12:00:00Z"
    }
  ]
}
```

### Создание товара с типом batch

```
POST /api/products
```

**Request:**
```json
{
  "name": "Рулон стали 0.5мм",
  "product_code": "STEEL-05",
  "type": "batch",
  "notification_threshold": 5
}
```

### Обновление типа товара

```
PUT /api/products/:id
```

**Request:**
```json
{
  "type": "batch"  // или "simple"
}
```

> **Важно:** Смена типа с batch на simple не удаляет существующие партии, но новые приходы будут суммироваться.

## Миграции

Миграции находятся в папке `migrations/`:

| Файл | Описание |
|------|----------|
| `015_add_product_type.sql` | Добавляет поле `type` в таблицу `products` |
| `016_create_stock_items_table.sql` | Создаёт таблицу `stock_items` |
| `017_add_stock_item_id_to_sale_items.sql` | Добавляет поле `stock_item_id` в `sale_items` |
| `012_add_product_conversions.sql` | Обновлена: добавлены `from_stock_item_id`, `to_stock_item_id` |

## Примеры использования

### Сценарий 1: Учёт рулонов металла

1. Создать товар типа batch:
```json
POST /api/products
{
  "name": "Рулон оцинковки 0.5мм",
  "type": "batch"
}
```

2. Приход 3 рулонов разных партий:
```json
POST /api/stock-receipts
{
  "items": [
    {"product_id": 1, "quantity": 500, "batch_code": "PARTY-A", "purchase_cost": 50},
    {"product_id": 1, "quantity": 300, "batch_code": "PARTY-B", "purchase_cost": 52},
    {"product_id": 1, "quantity": 200, "batch_code": "PARTY-C", "purchase_cost": 48}
  ]
}
```

3. Продажа из конкретной партии:
```json
POST /api/sales
{
  "items": [
    {"product_id": 1, "stock_item_id": 2, "quantity": 100, "unit_price": 70}
  ]
}
```

### Сценарий 2: FIFO для batch товаров (будущая реализация)

При продаже без указания `stock_item_id` система может автоматически выбирать:
- Самую старую партию (по `created_at`)
- Партию с наименьшей себестоимостью
- Партию с наибольшим/наименьшим количеством

На данный момент `stock_item_id` обязателен для batch товаров.

## Ограничения

1. При смене типа товара с `simple` на `batch`:
   - Существующий остаток остаётся как есть
   - Новые приходы создают партии

2. При смене типа с `batch` на `simple`:
   - Существующие партии остаются в `stock_items`
   - Новые приходы суммируются в `stock.quantity`

3. Нельзя продать batch товар без указания партии (`stock_item_id`)

## Технические детали

### Триггеры автоматической деактивации

При продаже batch товара:
1. Списывается количество из `stock_items`
2. Проверяется остаток партии
3. Если остаток ≤ 0 → `status = 0`

При отмене продажи:
1. Восстанавливается количество в партии
2. Если партия была деактивирована → `status = 1`

### Валидация

```javascript
// Псевдокод валидации при продаже batch товара
if (productType === 'batch') {
  if (!item.stock_item_id) {
    throw new Error('Stock item required');
  }
  
  const batch = await getStockItem(item.stock_item_id);
  if (!batch || batch.status !== 1) {
    throw new Error('Stock item not found');
  }
  
  if (batch.quantity < item.quantity) {
    throw new Error('Insufficient batch stock');
  }
}
```
