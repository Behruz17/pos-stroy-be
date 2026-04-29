# API для корректировок остатков и цен товаров

## Обзор
Добавлен модуль `stock-adjustments` для прямого изменения остатков и цен товаров через API. Позволяет выполнять инвентаризацию и корректировки остатков, а также устанавливать цены для партионных товаров без создания документов поступления/списания.

## Эндпоинты

### 1. Получить все корректировки
```
GET /api/stock-adjustments
```

**Ответ:**
```json
[
  {
    "id": 1,
    "product_id": 123,
    "product_name": "Товар 1",
    "previous_quantity": 100.00,
    "new_quantity": 95.00,
    "adjustment": -5.00,
    "previous_price": 120.00,
    "new_price": 130.00,
    "price_adjustment": 10.00,
    "reason": "Инвентаризация с обновлением цены",
    "created_by": 1,
    "user_name": "Admin",
    "created_at": "2026-04-28T12:00:00Z",
    "status": 1
  }
]
```

### 2. Получить корректировки по товару
```
GET /api/stock-adjustments/product/{productId}
```

**Ответ:**
```json
[
  {
    "id": 1,
    "product_id": 123,
    "product_name": "Товар 1",
    "previous_quantity": 100.00,
    "new_quantity": 95.00,
    "adjustment": -5.00,
    "previous_price": 120.00,
    "new_price": 130.00,
    "price_adjustment": 10.00,
    "reason": "Инвентаризация",
    "created_by": 1,
    "user_name": "Admin",
    "created_at": "2026-04-28T12:00:00Z",
    "status": 1
  }
]
```

### 3. Создать корректировку остатка и/или цены
```
POST /api/stock-adjustments
```

**Тело запроса:**
```json
{
  "product_id": 123,
  "new_quantity": 95,
  "new_price": 130.00,
  "reason": "Инвентаризация - недостача с обновлением цены"
}
```

**Ответ:**
```json
{
  "id": 1,
  "product_id": 123,
  "product_name": "Товар 1",
  "previous_quantity": 100.00,
  "new_quantity": 95.00,
  "adjustment": -5.00,
  "previous_price": 120.00,
  "new_price": 130.00,
  "price_adjustment": 10.00,
  "reason": "Инвентаризация - недостача с обновлением цены",
  "created_by": 1
}
```

### 4. Удалить корректировку
```
DELETE /api/stock-adjustments/{id}
```

**Ответ:**
```json
{
  "message": "Stock adjustment deleted successfully"
}
```

## Логика работы

### Для обычных товаров (type='simple'):
- Прямое изменение остатка в таблице `stock`
- **Изменение цены НЕДОСТУПНО** для simple товаров
- Создание записи о корректировке

### Для партионных товаров (type='batch'):

#### Изменение количества:
- **Увеличение:** Создается новая партия с кодом `ADJUST-{product_id}-{timestamp}`
- **Уменьшение:** Списание происходит из самых старых партий (FIFO)
- Партии деактивируются при достижении нулевого остатка

#### Изменение цены:
- **Обновление цены во всех активных партиях** в `stock_items`
- **Если партий нет:** Создается базовая партия с `quantity = 0` и кодом `PRICE-ADJ-{product_id}-{timestamp}`
- Цена используется при будущих продажах из соответствующих партий

## Валидация

1. **Обязательные поля:**
   - `product_id` - должен существовать и быть активным
   - Хотя бы одно из: `new_quantity` или `new_price`

2. **Ограничения:**
   - `new_quantity` не может быть отрицательным
   - `new_price` не может быть отрицательным
   - Если `new_quantity` равен текущему остатку и `new_price` не указан - возвращается ошибка
   - **Изменение цены доступно только для batch товаров**

## Примеры использования

### Только изменение количества:
```json
{
  "product_id": 123,
  "new_quantity": 95,
  "reason": "Инвентаризация - выявлена недостача"
}
```

### Только изменение цены (только для batch товаров):
```json
{
  "product_id": 456,
  "new_price": 150.00,
  "reason": "Установка новой цены продажи"
}
```

### Изменение количества и цены одновременно:
```json
{
  "product_id": 789,
  "new_quantity": 25,
  "new_price": 180.00,
  "reason": "Инвентаризация с обновлением цен"
}
```

### Установка начальной цены для batch товара без партий:
```json
{
  "product_id": 101,
  "new_price": 200.00,
  "reason": "Установка начальной цены для нового товара"
}
```

## База данных

### Таблица `stock_adjustments`:
```sql
CREATE TABLE `stock_adjustments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `previous_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `new_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `adjustment` decimal(10,2) NOT NULL DEFAULT '0.00',
  `previous_price` decimal(10,2) DEFAULT NULL,
  `new_price` decimal(10,2) DEFAULT NULL,
  `price_adjustment` decimal(10,2) DEFAULT NULL,
  `reason` text,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_stock_adjustments_product` (`product_id`),
  KEY `idx_stock_adjustments_created_by` (`created_by`),
  KEY `idx_stock_adjustments_status` (`status`)
)
```

## Установка

1. Выполните миграции:
```sql
-- migrations/011_create_stock_adjustments.sql
-- migrations/017_add_price_to_stock_adjustments.sql
```

2. Перезапустите сервер для регистрации новых роутов

## Безопасность

- Все эндпоинты требуют аутентификации (`authMiddleware`)
- Записывается кто создал корректировку (`created_by`)
- Поддерживается мягкое удаление (`status = 0`)

## Интеграция с существующим функционалом

- Корректировки учитываются в общем остатке товара
- Для партионных товаров создаются/изменяются партии в `stock_items`
- История корректировок доступна для аудита

## Важные моменты

1. **Обратная совместимость**: Существующие функции продаж/поступлений работают как раньше
2. **Аудит**: Все корректировки записываются с указанием причины и автора
3. **FIFO для партий**: При уменьшении остатка списание идет из самых старых партий
4. **Без документов**: Корректировки не создают связанных документов (поступлений/списаний)
5. **Цены только для batch**: Изменение цены доступно только для партионных товаров
6. **Прямое обновление партий**: Цена сразу применяется ко всем активным партиям товара
7. **Начальные цены**: Для товаров без партий создается базовая партия с quantity = 0
