# API для корректировок остатков товаров

## Обзор
Добавлен модуль `stock-adjustments` для прямого изменения остатков товаров через API. Позволяет выполнять инвентаризацию и корректировки остатков без создания документов поступления/списания.

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
    "reason": "Инвентаризация",
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
    "previous_quantity": 100.00,
    "new_quantity": 95.00,
    "adjustment": -5.00,
    "reason": "Инвентаризация",
    "created_by": 1,
    "user_name": "Admin",
    "created_at": "2026-04-28T12:00:00Z",
    "status": 1
  }
]
```

### 3. Создать корректировку остатка
```
POST /api/stock-adjustments
```

**Тело запроса:**
```json
{
  "product_id": 123,
  "new_quantity": 95,
  "reason": "Инвентаризация - недостача"
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
  "reason": "Инвентаризация - недостача",
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
- Создание записи о корректировке

### Для партионных товаров (type='batch'):

#### Увеличение остатка:
- Создается новая партия с кодом `ADJUST-{product_id}-{timestamp}`
- Количество в новой партии равно размеру корректировки

#### Уменьшение остатка:
- Списание происходит из самых старых партий (FIFO)
- Партии деактивируются при достижении нулевого остатка

## Валидация

1. **Обязательные поля:**
   - `product_id` - должен существовать и быть активным
   - `new_quantity` - неотрицательное число

2. **Ограничения:**
   - `new_quantity` не может быть отрицательным
   - Если `new_quantity` равен текущему остатку - возвращается ошибка

## Примеры использования

### Инвентаризация - списание недостачи:
```json
{
  "product_id": 123,
  "new_quantity": 95,
  "reason": "Инвентаризация - выявлена недостача"
}
```

### Инвентаризация - добавление излишка:
```json
{
  "product_id": 456,
  "new_quantity": 150,
  "reason": "Инвентаризация - выявлен излишек"
}
```

### Корректировка после пересчета:
```json
{
  "product_id": 789,
  "new_quantity": 25,
  "reason": "Пересчет после пересортицы"
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

1. Выполните миграцию:
```sql
-- migrations/011_create_stock_adjustments.sql
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
