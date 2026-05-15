# API Documentation

Базовый URL: `http://localhost:3000/api` (или ваш продакшн URL)

## Аутентификация

Все эндпоинты (кроме `/auth/login`) требуют **Bearer Token** в заголовке:
```
Authorization: Bearer <token>
```

---

## Типы товаров (Simple vs Batch)

Система поддерживает два типа товаров:

- **simple** — Обычные товары, количество суммируется в общий остаток
- **batch** — Товары с партиями (рулоны, паллеты), каждый приход создаёт отдельную партию

### Особенности batch товаров:
- Приход товара создаёт запись в `stock_items` с уникальным `batch_code`
- При продаже обязательно указание `stock_item_id` (ID партии)
- Партия автоматически деактивируется при остатке = 0
- При удалении продажи партия восстанавливается и реактивируется

### Поле `type` в товарах:
- `type: "simple"` — обычный товар (по умолчанию)
- `type: "batch"` — партионный товар

---

## Auth Endpoints

### POST `/auth/login`

Авторизация пользователя. **Не требует токена.**

**Request Body:**
```json
{
  "login": "admin",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "a1b2c3d4e5f6...",
  "user": {
    "id": 1,
    "login": "admin",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

**Errors:**
- `400` — Login и password обязательны
- `401` — Неверный login или password

---

### POST `/auth/logout`

Выход из системы (удаляет токен).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "ok"
}
```

---

### GET `/auth/me`

Получение текущего пользователя.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "login": "admin",
  "name": "Admin User",
  "role": "ADMIN"
}
```

---

### POST `/auth/register`

Создание нового пользователя. **Только для ADMIN.**

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "login": "newuser",
  "password": "password123",
  "name": "New User",
  "role": "USER"
}
```

**Response (201):**
```json
{
  "id": 5,
  "login": "newuser",
  "name": "New User",
  "role": "USER",
  "created_at": "2026-04-04T18:00:00.000Z",
  "message": "User created successfully"
}
```

**Errors:**
- `403` — Только ADMIN может создавать пользователей
- `400` — Login и password обязательны / Пользователь уже существует

---

## Users Endpoints

### GET `/users`

Получение списка всех пользователей. **Только для ADMIN.**

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "login": "admin",
    "name": "Admin User",
    "role": "ADMIN",
    "created_at": "2026-04-04T18:00:00.000Z"
  },
  {
    "id": 2,
    "login": "user1",
    "name": "User One",
    "role": "USER",
    "created_at": "2026-04-04T18:00:00.000Z"
  }
]
```

---

### GET `/users/:id`

Получение одного пользователя по ID. **Только для ADMIN.**

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "id": 1,
  "login": "admin",
  "name": "Admin User",
  "role": "ADMIN",
  "created_at": "2026-04-04T18:00:00.000Z"
}
```

**Errors:**
- `404` — Пользователь не найден

---

### PUT `/users/:id`

Обновление пользователя. **Только для ADMIN.**

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "login": "updated",
  "name": "Updated Name",
  "role": "USER"
}
```

**Response (200):**
```json
{
  "id": 1,
  "login": "updated",
  "name": "Updated Name",
  "role": "USER",
  "created_at": "2026-04-04T18:00:00.000Z",
  "message": "User updated successfully"
}
```

**Ограничения:**
- ADMIN не может изменить свою роль (защита от блокировки)
- Чтобы изменить пароль — нужен отдельный эндпоинт (пока не реализован)

**Errors:**
- `400` — Нельзя изменить свою роль
- `404` — Пользователь не найден

---

### DELETE `/users/:id`

Удаление пользователя. **Только для ADMIN.**

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Ограничения:**
- ADMIN не может удалить сам себя

**Errors:**
- `400` — Нельзя удалить самого себя
- `404` — Пользователь не найден

---

## Suppliers Endpoints

### GET `/suppliers`

Получение списка всех поставщиков.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Supplier One",
    "phone": "+992123456789",
    "balance": 1500.50,
    "status": 1,
    "currency": "somoni",
    "created_at": "2026-04-04T18:00:00.000Z",
    "updated_at": "2026-04-04T18:00:00.000Z"
  }
]
```

---

### GET `/suppliers/:id`

Получение одного поставщика по ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Supplier One",
  "phone": "+992123456789",
  "balance": 1500.50,
  "status": 1,
  "currency": "somoni",
  "created_at": "2026-04-04T18:00:00.000Z",
  "updated_at": "2026-04-04T18:00:00.000Z"
}
```

**Errors:**
- `404` — Поставщик не найден

---

### POST `/suppliers`

Создание нового поставщика.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "New Supplier",
  "phone": "+992987654321",
  "currency": "dollar"
}
```

**Response (201):**
```json
{
  "id": 5,
  "name": "New Supplier",
  "phone": "+992987654321",
  "balance": 0.00,
  "status": 1,
  "currency": "dollar",
  "created_at": "2026-04-04T18:00:00.000Z",
  "updated_at": "2026-04-04T18:00:00.000Z"
}
```

**Errors:**
- `400` — Поле name обязательно

---

### PUT `/suppliers/:id`

Обновление поставщика.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Supplier",
  "phone": "+992111111111",
  "status": 0,
  "currency": "yuan"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Updated Supplier",
  "phone": "+992111111111",
  "balance": 1500.50,
  "status": 0,
  "currency": "yuan",
  "created_at": "2026-04-04T18:00:00.000Z",
  "updated_at": "2026-04-04T19:00:00.000Z"
}
```

**Errors:**
- `404` — Поставщик не найден

---

### DELETE `/suppliers/:id`

Удаление поставщика.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Supplier deleted successfully"
}
```

**Errors:**
- `404` — Поставщик не найден

---

## Products Endpoints

### GET `/products`

Получение списка всех товаров.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Цемент М500",
    "manufacturer": "Таджикцемент",
    "product_code": "CEM-500-001",
    "type": "simple",
    "image": "https://example.com/cement.jpg",
    "notification_threshold": 50,
    "stock_quantity": 150,
    "purchase_cost": 45.00,
    "selling_price": 65.00,
    "purchase_cost_converted": null,
    "currency": "TJS",
    "rate": "1.0000",
    "created_at": "2026-04-04T18:00:00.000Z"
  }
]
```

**Notes:**
- `type` - Тип товара: `simple` (обычный) или `batch` (партионный)
- `purchase_cost` - Последняя цена покупки из последнего прихода
- `selling_price` - Последняя цена продажи из последнего прихода
- `purchase_cost_converted` - Сконвертированная цена покупки в TJS (null для TJS)
- `currency` - Валюта последнего прихода (TJS, USD, RUB)
- `rate` - Курс валюты по отношению к TJS
- Если у товара нет приходов, поля цен, валюты и курса будут null

---

### GET `/products/:id`

Получение одного товара по ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Цемент М500",
  "manufacturer": "Таджикцемент",
  "product_code": "CEM-500-001",
  "type": "simple",
  "image": "https://example.com/cement.jpg",
  "notification_threshold": 50,
  "stock_quantity": 150,
  "purchase_cost": 45.00,
  "selling_price": 65.00,
  "purchase_cost_converted": null,
  "currency": "TJS",
  "rate": "1.0000",
  "created_at": "2026-04-04T18:00:00.000Z"
}
```

**Notes:**
- `type` - Тип товара: `simple` (обычный) или `batch` (партионный)
- `purchase_cost` - Последняя цена покупки из последнего прихода
- `selling_price` - Последняя цена продажи из последнего прихода
- `purchase_cost_converted` - Сконвертированная цена покупки в TJS (null для TJS)
- `currency` - Валюта последнего прихода (TJS, USD, RUB)
- `rate` - Курс валюты по отношению к TJS
- Если у товара нет приходов, поля цен, валюты и курса будут null

**Errors:**
- `404` — Товар не найден

---

### POST `/products`

Создание нового товара с загрузкой изображения.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
name: Цемент М500
manufacturer: Таджикцемент
product_code: CEM-500-001
type: simple
image: [файл изображения]
notification_threshold: 50
```

**Или для batch товара:**
```
name: Рулон оцинковки 0.5мм
product_code: STEEL-05
type: batch
notification_threshold: 5
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Цемент М500",
  "manufacturer": "Таджикцемент",
  "product_code": "CEM-500-001",
  "type": "simple",
  "image": "/uploads/products/product-1712841234567-123456789.jpg",
  "notification_threshold": 50,
  "created_at": "2026-04-04T18:00:00.000Z"
}
```

**Notes:**
- Поле `type` — тип товара: `simple` (по умолчанию) или `batch`
- Поле `image` — файл изображения (JPEG, PNG, GIF, WEBP), максимум 5MB
- Изображение доступно по URL: `http://localhost:3000/uploads/products/{filename}`
- Для batch товаров рекомендуется указывать `notification_threshold` для контроля остатков

**Errors:**
- `400` — Поле name обязательно
- `400` — Товар с таким product_code уже существует
- `400` — Неподдерживаемый формат файла (разрешены только JPEG, PNG, GIF, WEBP)

---

### PUT `/products/:id`

Обновление товара с возможностью загрузки нового изображения.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
name: Цемент М400
manufacturer: Таджикцемент
product_code: CEM-400-001
type: batch
image: [файл изображения]
notification_threshold: 30
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Цемент М400",
  "manufacturer": "Таджикцемент",
  "product_code": "CEM-400-001",
  "type": "batch",
  "image": "/uploads/products/product-1712841234567-987654321.jpg",
  "notification_threshold": 30,
  "created_at": "2026-04-04T18:00:00.000Z"
}
```

**Notes:**
- Поле `type` — можно изменить тип товара: `simple` или `batch`
- **Важно:** Смена типа не удаляет существующие партии, но изменит логику будущих операций
- Поле `image` — файл изображения (JPEG, PNG, GIF, WEBP), максимум 5MB
- Если изображение не передано, текущее изображение останется без изменений
- Изображение доступно по URL: `http://localhost:3000/uploads/products/{filename}`

**Errors:**
- `404` — Товар не найден
- `400` — Товар с таким product_code уже существует
- `400` — Неподдерживаемый формат файла (разрешены только JPEG, PNG, GIF, WEBP)

---

### DELETE `/products/:id`

Удаление товара.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Product deleted successfully"
}
```

**Errors:**
- `404` — Товар не найден

---

## Stock Items Endpoints (Batch Inventory)

Эндпоинты для работы с партиями товаров (только для товаров типа `batch`).

### GET `/products/:id/stock-items`

Получение списка активных партий для товара.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200) для batch товара:**
```json
{
  "product_id": 100,
  "product_type": "batch",
  "product_name": "Рулон оцинковки 0.5мм",
  "total_quantity": 950.00,
  "batches": [
    {
      "id": 1,
      "batch_code": "BATCH-18-1713851234567",
      "quantity": 500.00,
      "purchase_cost": 50.00,
      "selling_price": 65.00,
      "receipt_id": 18,
      "created_at": "2026-04-15T10:00:00.000Z",
      "status": 1
    },
    {
      "id": 2,
      "batch_code": "BATCH-19-1713851234568",
      "quantity": 300.00,
      "purchase_cost": 52.00,
      "selling_price": 67.00,
      "receipt_id": 19,
      "created_at": "2026-04-16T11:00:00.000Z",
      "status": 1
    },
    {
      "id": 3,
      "batch_code": "BATCH-20-1713851234569",
      "quantity": 150.00,
      "purchase_cost": 48.00,
      "selling_price": 63.00,
      "receipt_id": 20,
      "created_at": "2026-04-17T12:00:00.000Z",
      "status": 1
    }
  ]
}
```

**Response (200) для simple товара:**
```json
{
  "product_id": 1,
  "product_type": "simple",
  "product_name": "Цемент М500",
  "message": "This is a simple product, no batches available"
}
```

**Notes:**
- Возвращает только активные партии (`status = 1`)
- `total_quantity` — сумма всех активных партий
- `batch_code` генерируется автоматически: `BATCH-{receipt_id}-{timestamp}`
- `receipt_id` — ID прихода, при котором была создана партия

**Errors:**
- `404` — Товар не найден

---

### GET `/stock-items/:id`

Получение информации о конкретной партии.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "product_id": 100,
  "product_name": "Рулон оцинковки 0.5мм",
  "quantity": 500.00,
  "batch_code": "BATCH-18-1713851234567",
  "purchase_cost": 50.00,
  "selling_price": 65.00,
  "receipt_id": 18,
  "created_at": "2026-04-15T10:00:00.000Z",
  "status": 1
}
```

**Errors:**
- `404` — Партия не найдена

---

## Customers Endpoints

### GET `/customers`

Получение списка всех клиентов.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "full_name": "Иванов Иван Иванович",
    "phone": "+992987654321",
    "balance": 1500.50,
    "created_at": "2026-04-04T18:00:00.000Z",
    "updated_at": "2026-04-04T18:00:00.000Z"
  }
]
```

---

### GET `/customers/:id`

Получение одного клиента по ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "full_name": "Иванов Иван Иванович",
  "phone": "+992987654321",
  "balance": 1500.50,
  "created_at": "2026-04-04T18:00:00.000Z",
  "updated_at": "2026-04-04T18:00:00.000Z"
}
```

**Errors:**
- `404` — Клиент не найден

---

### POST `/customers`

Создание нового клиента.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "full_name": "Петров Петр Петрович",
  "phone": "+992123456789"
}
```

**Response (201):**
```json
{
  "id": 2,
  "full_name": "Петров Петр Петрович",
  "phone": "+992123456789",
  "balance": 0.00,
  "created_at": "2026-04-04T18:00:00.000Z",
  "updated_at": "2026-04-04T18:00:00.000Z"
}
```

**Errors:**
- `400` — Поле full_name обязательно

---

### PUT `/customers/:id`

Обновление клиента.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "full_name": "Петров Петр Петрович",
  "phone": "+992999999999"
}
```

**Response (200):**
```json
{
  "id": 2,
  "full_name": "Петров Петр Петрович",
  "phone": "+992999999999",
  "balance": 0.00,
  "created_at": "2026-04-04T18:00:00.000Z",
  "updated_at": "2026-04-04T19:00:00.000Z"
}

**Errors:**
- `404` — Клиент не найден

---

### DELETE `/customers/:id`

Удаление клиента.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Customer deleted successfully"
}
```

**Errors:**
- `404` — Клиент не найден

---

## Stock Receipts Endpoints

### GET `/stock-receipts`

Получение списка всех приходов товара. Поддерживает фильтрацию по дате, месяцу и году.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` — Фильтр по конкретной дате (формат: `YYYY-MM-DD`), например `2026-04-05`
- `month` — Фильтр по месяцу (1-12), требует указания `year`
- `year` — Фильтр по году (например, `2026`)

**Examples:**

Все приходы:
```
GET /api/stock-receipts
```

Приходы за конкретную дату:
```
GET /api/stock-receipts?date=2026-04-05
```

Приходы за месяц (апрель 2026):
```
GET /api/stock-receipts?month=4&year=2026
```

Приходы за год (2026):
```
GET /api/stock-receipts?year=2026
```

**Response (200):**
```json
[
  {
    "id": 1,
    "created_by": 1,
    "created_at": "2026-04-05T08:00:00.000Z",
    "total_amount": 5000.00,
    "supplier_id": 2,
    "supplier_name": "Supplier Name",
    "currency": "TJS",
    "rate": "1.0000",
    "total_amount_converted": null
  }
]
```

---

### GET `/stock-receipts/:id`

Получение одного прихода по ID с позициями.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "created_by": 1,
  "created_at": "2026-04-05T08:00:00.000Z",
  "total_amount": 5000.00,
  "supplier_id": 2,
  "supplier_name": "Supplier Name",
  "currency": "TJS",
  "rate": "1.0000",
  "total_amount_converted": null,
  "items": [
    {
      "id": 1,
      "receipt_id": 1,
      "product_id": 5,
      "product_name": "Цемент М500",
      "product_code": "CEM-500",
      "quantity": 100,
      "purchase_cost": 50.00,
      "selling_price": 75.00,
      "purchase_cost_converted": null
    }
  ]
}
```

**Errors:**
- `404` — Приход не найден

---

### POST `/stock-receipts`

Создание нового прихода товара. Увеличивает остатки на складе и обновляет баланс поставщика (если указан).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "supplier_id": 2,
  "currency": "USD",
  "rate": 10.5000,
  "items": [
    {
      "product_id": 5,
      "quantity": 100,
      "purchase_cost": 50.00,
      "selling_price": 75.00
    },
    {
      "product_id": 6,
      "quantity": 50,
      "purchase_cost": 30.00,
      "selling_price": 45.00,
      "batch_code": "PARTY-A"  // опционально, только для batch товаров
    }
  ]
}
```

**Notes:**
- `currency` - Валюта прихода (TJS, USD, RUB). По умолчанию TJS
- `rate` - Курс конвертации к TJS. По умолчанию 1.0000
- `total_amount_converted` - Сконвертированная сумма в TJS (null для TJS)
- `purchase_cost_converted` - Сконвертированная закупочная цена в TJS (null для TJS)
- `batch_code` - Опционально для batch товаров. Если не указан — генерируется автоматически: `BATCH-{receipt_id}-{timestamp}`

**Response (201):**
```json
{
  "id": 1,
  "total_amount": "5000.00"
}
```

**Логика:**
- Создает запись в `stock_receipts`
- Создает записи в `stock_receipt_items`
- **Для simple товаров:** Увеличивает остатки в `stock` (суммирование)
- **Для batch товаров:** 
  - Создает новую запись в `stock_items` с `batch_code`
  - Увеличивает общий остаток в `stock`
- Обновляет баланс поставщика в `suppliers`
- Создает запись в `supplier_operations` (type: 'RECEIPT')

**Errors:**
- `400` — Поле items обязательно
- `400` — Каждый item должен иметь product_id и quantity > 0

---

### DELETE `/stock-receipts/:id`

Удаление прихода. Уменьшает остатки на складе и отменяет обновление баланса поставщика.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Stock receipt deleted successfully"
}
```

**Логика:**
- Уменьшает остатки в `stock`
- **Для batch товаров:** Деактивирует соответствующие партии в `stock_items`
- Удаляет записи из `stock_receipt_items`
- Обновляет баланс поставщика (вычитает сумму)
- Удаляет запись из `supplier_operations`
- Удаляет запись из `stock_receipts`

**Errors:**
- `404` — Приход не найден

---

## Debtors Endpoints

### GET `/debtors`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` - Filter by specific date (format: `YYYY-MM-DD`), e.g. `2026-04-05`
- `month` - Filter by month (1-12), requires `year`
- `year` - Filter by year (e.g. `2026`)

**Examples:**

All debtors:
```
GET /api/debtors
```

Debtors for specific date:
```
GET /api/debtors?date=2026-04-05
```

Debtors for month (April 2026):
```
GET /api/debtors?month=4&year=2026
```

Debtors for year (2026):
```
GET /api/debtors?year=2026
```

**Response (200):**
```json
[
  {
    "id": 1,
    "full_name": "John Doe",
    "phone": "+992987654321",
    "debt_amount": 1500.00,
    "description": "Debt for construction materials",
    "created_at": "2026-04-05T10:00:00.000Z",
    "updated_at": "2026-04-05T10:00:00.000Z",
    "status": 1
  }
]
```

---

### GET `/debtors/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "full_name": "John Doe",
  "phone": "+992987654321",
  "debt_amount": 1500.00,
  "description": "Debt for construction materials",
  "created_at": "2026-04-05T10:00:00.000Z",
  "updated_at": "2026-04-05T10:00:00.000Z",
  "status": 1
}
```

**Errors:**
- `404` - Debtor not found

---

### POST `/debtors`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "full_name": "Jane Smith",
  "phone": "+992123456789",
  "debt_amount": 2500.00,
  "description": "Debt for equipment rental"
}
```

**Response (201):**
```json
{
  "id": 2,
  "full_name": "Jane Smith",
  "phone": "+992123456789",
  "debt_amount": 2500.00,
  "description": "Debt for equipment rental",
  "created_at": "2026-04-05T11:00:00.000Z",
  "updated_at": "2026-04-05T11:00:00.000Z",
  "status": 1
}
```

**Errors:**
- `400` - Full name and debt amount are required
- `400` - Debt amount must be positive

---

### PUT `/debtors/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "full_name": "Jane Smith Updated",
  "phone": "+992999999999",
  "debt_amount": 3000.00,
  "description": "Updated debt description"
}
```

**Response (200):**
```json
{
  "id": 2,
  "full_name": "Jane Smith Updated",
  "phone": "+992999999999",
  "debt_amount": 3000.00,
  "description": "Updated debt description",
  "created_at": "2026-04-05T11:00:00.000Z",
  "updated_at": "2026-04-05T12:00:00.000Z",
  "status": 1
}
```

**Errors:**
- `400` - Full name and debt amount are required
- `400` - Debt amount must be positive
- `404` - Debtor not found

---

### DELETE `/debtors/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Debtor deleted successfully"
}
```

**Errors:**
- `404` - Debtor not found

---

## Debtor Operations Endpoints

### GET `/debtor-operations`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` - Filter by specific date (format: `YYYY-MM-DD`), e.g. `2026-04-05`
- `month` - Filter by month (1-12), requires `year`
- `year` - Filter by year (e.g. `2026`)
- `type` - Filter by operation type (`BORROWED`, `RETURNED`)
- `debtor_id` - Filter by debtor ID

**Examples:**

All operations:
```
GET /api/debtor-operations
```

Operations for specific date:
```
GET /api/debtor-operations?date=2026-04-05
```

Only borrowed operations:
```
GET /api/debtor-operations?type=BORROWED
```

Operations for specific debtor:
```
GET /api/debtor-operations?debtor_id=1
```

**Response (200):**
```json
[
  {
    "id": 1,
    "debtor_id": 1,
    "debtor_name": "John Doe",
    "amount": 1500.00,
    "type": "BORROWED",
    "description": "Initial loan",
    "date": "2026-04-05T10:00:00.000Z",
    "status": 1
  },
  {
    "id": 2,
    "debtor_id": 1,
    "debtor_name": "John Doe",
    "amount": 500.00,
    "type": "RETURNED",
    "description": "Partial repayment",
    "date": "2026-04-06T14:00:00.000Z",
    "status": 1
  }
]
```

---

### GET `/debtor-operations/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "debtor_id": 1,
  "debtor_name": "John Doe",
  "amount": 1500.00,
  "type": "BORROWED",
  "description": "Initial loan",
  "date": "2026-04-05T10:00:00.000Z",
  "status": 1
}
```

**Errors:**
- `404` - Operation not found

---

### POST `/debtor-operations/borrowed`

Create a "borrowed" operation - debtor took money (increases debt).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "debtor_id": 1,
  "amount": 1000.00,
  "description": "Additional loan for materials"
}
```

**Response (201):**
```json
{
  "id": 3,
  "debtor_id": 1,
  "debtor_name": "John Doe",
  "amount": 1000.00,
  "type": "BORROWED",
  "description": "Additional loan for materials",
  "date": "2026-04-07T09:00:00.000Z",
  "status": 1
}
```

**Logic:**
- Creates record in `debtor_operations` with type `BORROWED`
- Increases debtor's `debt_amount` in `debtors` table

**Errors:**
- `400` - Debtor ID and amount are required
- `400` - Amount must be positive
- `404` - Debtor not found

---

### POST `/debtor-operations/returned`

Create a "returned" operation - debtor returned money (decreases debt).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "debtor_id": 1,
  "amount": 300.00,
  "description": "Partial repayment"
}
```

**Response (201):**
```json
{
  "id": 4,
  "debtor_id": 1,
  "debtor_name": "John Doe",
  "amount": 300.00,
  "type": "RETURNED",
  "description": "Partial repayment",
  "date": "2026-04-08T11:00:00.000Z",
  "status": 1
}
```

**Logic:**
- Creates record in `debtor_operations` with type `RETURNED`
- Decreases debtor's `debt_amount` in `debtors` table
- Validates that return amount doesn't exceed current debt

**Errors:**
- `400` - Debtor ID and amount are required
- `400` - Amount must be positive
- `400` - Return amount cannot exceed current debt
- `404` - Debtor not found

---

### DELETE `/debtor-operations/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Operation deleted successfully"
}
```

**Logic:**
- Soft deletes the operation (sets status = 0)
- Reverses the debt amount change:
  - For `BORROWED`: decreases debt amount
  - For `RETURNED`: increases debt amount

**Errors:**
- `404` - Operation not found

---

## Overdue Sales Endpoints

### GET `/overdue-sales`

Получение списка всех продаж в долг с истекшим дедлайном.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "customer_id": 2,
    "total_amount": 500.00,
    "payment_status": "DEBT",
    "debt_deadline": "2026-04-10T23:59:59.000Z",
    "customer_name": "Иванов Иван Иванович",
    "created_at": "2026-04-05T10:00:00.000Z"
  }
]
```

**Notes:**
- Возвращает только продажи со статусом DEBT
- Только продажи с установленным и истекшим debt_deadline
- Сортировка по возрастанию дедлайна (самые просроченные первые)

---

### GET `/overdue-sales/summary`

Получение сводной информации по просроченным долгам.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "total_overdue_sales": 15,
  "total_overdue_amount": 12500.00,
  "customers_with_debt": 8,
  "avg_days_overdue": 12.5
}
```

**Notes:**
- `total_overdue_sales` - общее количество просроченных продаж
- `total_overdue_amount` - общая сумма просроченных долгов
- `customers_with_debt` - количество клиентов с просроченными долгами
- `avg_days_overdue` - среднее количество дней просрочки

---

### GET `/overdue-sales/by-customer`

Получение списка просроченных долгов с группировкой по клиентам.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "customer_id": 2,
    "customer_name": "Иванов Иван Иванович",
    "phone": "+992987654321",
    "overdue_sales_count": 3,
    "total_overdue_amount": 1500.00,
    "earliest_deadline": "2026-04-08T23:59:59.000Z",
    "latest_deadline": "2026-04-15T23:59:59.000Z",
    "avg_days_overdue": 8.5
  }
]
```

**Notes:**
- Сортировка по убыванию общей суммы долга
- Показывает детальную информацию по каждому клиенту

---

### GET `/overdue-sales/:id`

Получение просроченной продажи по ID с товарами.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "customer_id": 2,
  "total_amount": 500.00,
  "payment_status": "DEBT",
  "debt_deadline": "2026-04-10T23:59:59.000Z",
  "customer_name": "Иванов Иван Иванович",
  "created_at": "2026-04-05T10:00:00.000Z",
  "items": [
    {
      "id": 1,
      "product_id": 5,
      "product_name": "Цемент М500",
      "quantity": 10,
      "unit_price": 50.00,
      "unit_value": 1.0,
      "total_price": 500.00
    }
  ]
}
```

**Errors:**
- `404` — Просроченная продажа не найдена

---

## Salaries Endpoints

### POST `/salaries`

Creating salary for user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "user_id": 5,
  "month": 4,
  "year": 2026,
  "total_amount": 5000.00
}
```

**Response (201):**
```json
{
  "id": 1
}
```

**Errors:**
- `400` - user_id, month, year, total_amount are required
- `400` - Salary already exists for this user, month, and year
- `400` - Month must be between 1 and 12
- `400` - Year must be between 2000 and 2100
- `400` - Amount must be positive

---

### POST `/salaries/payments`

Creating payment for salary.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "salary_id": 1,
  "account_id": 1,
  "amount": 1500.00,
  "payment_date": "2026-04-15T10:00:00.000Z"
}
```

**Notes:**
- `account_id` - ID счета (1=Наличные, 2=Банковская карта, опционально)
- По умолчанию используется счет 1 (Наличные)

**Response (201):**
```json
{
  "id": 3
}
```

**Errors:**
- `400` - salary_id, amount, payment_date are required
- `400` - Salary not found
- `400` - Payment amount must be positive

---

### GET `/salaries/users-history`

Getting list of users with payment history and remaining amounts.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "user_id": 5,
    "user_name": "Behruz",
    "login": "admin",
    "total_remaining": 3000.00,
    "salaries": [
      {
        "salary_id": 8,
        "month": 4,
        "year": 2026,
        "total_amount": 5000.00,
        "paid_amount": 2000.00,
        "remaining_amount": 3000.00,
        "created_at": "2026-04-01T09:00:00.000Z",
        "payments": [
          {
            "id": 15,
            "amount": 2000.00,
            "payment_date": "2026-04-10T10:00:00.000Z",
            "created_by_name": "Behruz",
            "created_at": "2026-04-10T10:00:00.000Z"
          }
        ]
      },
      {
        "salary_id": 7,
        "month": 3,
        "year": 2026,
        "total_amount": 3000.00,
        "paid_amount": 3000.00,
        "remaining_amount": 0.00,
        "created_at": "2026-03-01T09:00:00.000Z",
        "payments": [
          {
            "id": 14,
            "amount": 3000.00,
            "payment_date": "2026-03-15T10:00:00.000Z",
            "created_by_name": "Behruz",
            "created_at": "2026-03-15T10:00:00.000Z"
          }
        ]
      }
    ]
  }
]
```

**Notes:**
- Shows all users with salaries
- `total_remaining` - total debt amount for user
- `salaries` - array of salaries with payment history
- `remaining_amount` - remaining amount for specific salary
- Users sorted by name

---

## Accounts Endpoints

### GET `/accounts`

Получение списка всех счетов с текущими балансами и последними транзакциями.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Наличные",
    "type": "CASH",
    "initial_balance": 10000.00,
    "transaction_balance": 2500.00,
    "current_balance": 12500.00,
    "status": 1,
    "created_at": "2026-04-01T09:00:00.000Z",
    "updated_at": "2026-04-15T14:30:00.000Z",
    "recent_transactions": [
      {
        "id": 15,
        "type": "INCOME",
        "amount": 500.00,
        "reference_type": "SALE",
        "reference_id": 25,
        "description": "Продажа #25",
        "created_at": "2026-04-15T10:00:00.000Z"
      }
    ]
  },
  {
    "id": 2,
    "name": "Банковская карта",
    "type": "ELECTRONIC",
    "initial_balance": 5000.00,
    "transaction_balance": -1500.00,
    "current_balance": 3500.00,
    "status": 1,
    "created_at": "2026-04-01T09:00:00.000Z",
    "updated_at": "2026-04-15T14:30:00.000Z",
    "recent_transactions": []
  }
]
```

**Notes:**
- `initial_balance` - начальный баланс счета
- `transaction_balance` - баланс от транзакций (income - expense)
- `current_balance` - текущий баланс (initial + transaction_balance)
- `recent_transactions` - последние 10 транзакций
- Сортировка по типу и имени счета

---

### GET `/accounts/:id`

Получение детальной информации о счете со всеми транзакциями.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Наличные",
  "type": "CASH",
  "initial_balance": 10000.00,
  "transaction_balance": 2500.00,
  "current_balance": 12500.00,
  "status": 1,
  "created_at": "2026-04-01T09:00:00.000Z",
  "updated_at": "2026-04-15T14:30:00.000Z",
  "transactions": [
    {
      "id": 15,
      "type": "INCOME",
      "amount": 500.00,
      "reference_type": "SALE",
      "reference_id": 25,
      "description": "Продажа #25",
      "created_at": "2026-04-15T10:00:00.000Z"
    },
    {
      "id": 14,
      "type": "EXPENSE",
      "amount": 1000.00,
      "reference_type": "SALARY",
      "reference_id": 8,
      "description": "Выплата зарплаты #8",
      "created_at": "2026-04-10T10:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `404` — Счет не найден

---

### POST `/accounts/transactions`

Создание новой транзакции.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "account_id": 1,
  "type": "INCOME",
  "amount": 500.00,
  "reference_type": "SALE",
  "reference_id": 25,
  "description": "Продажа #25"
}
```

**Response (201):**
```json
{
  "id": 16
}
```

**Errors:**
- `400` — account_id, type, и amount обязательны
- `400` — Сумма должна быть положительной
- `400` — Недопустимый тип транзакции
- `400` — Недопустимый тип ссылки
- `400` — Счет не найден

**Notes:**
- `type`: INCOME, EXPENSE, TRANSFER
- `reference_type`: SALE, PURCHASE, SALARY, EXPENSE, CUSTOMER_PAYMENT, SUPPLIER_PAYMENT, TRANSFER
- `reference_id` - ID связанной записи (может быть null)
- `description` - описание транзакции (опционально)

---

## Sales Endpoints

### GET `/sales`

Получение списка всех продаж. Поддерживает фильтрацию по дате, месяцу, году и продавцу.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` — Фильтр по конкретной дате (формат: `YYYY-MM-DD`), например `2026-04-05`
- `month` — Фильтр по месяцу (1-12), требует указания `year`
- `year` — Фильтр по году (например, `2026`)
- `seller_id` — Фильтр по продавцу (ID пользователя), например `173`

**Examples:**

Все продажи:
```
GET /api/sales
```

Продажи за конкретную дату:
```
GET /api/sales?date=2026-04-05
```

Продажи за месяц (апрель 2026):
```
GET /api/sales?month=4&year=2026
```

Продажи за год (2026):
```
GET /api/sales?year=2026
```

Продажи конкретного продавца:
```
GET /api/sales?seller_id=173
```

Продажи за дату и конкретного продавца:
```
GET /api/sales?date=2026-04-05&seller_id=173
```

**Примеры смешанной оплаты:**

Полностью оплачено наличными:
```json
{
  "customer_id": 2,
  "cash_amount": 500.00,
  "electronic_amount": 0,
  "items": [...]
}
```

Полностью оплачено электронно:
```json
{
  "customer_id": 2,
  "cash_amount": 0,
  "electronic_amount": 500.00,
  "items": [...]
}
```

Смешанная оплата (частично наличными, частично электронно):
```json
{
  "customer_id": 2,
  "cash_amount": 300.00,
  "electronic_amount": 200.00,
  "items": [...]
}
```

Частичная оплата (долг остается):
```json
{
  "customer_id": 2,
  "cash_amount": 200.00,
  "electronic_amount": 100.00,
  "items": [...]
}
```

Продажа со скидкой:
```json
{
  "customer_id": 2,
  "payment_status": "PAID",
  "cash_amount": 160.00,
  "items": [
    {
      "product_id": 5,
      "quantity": 1,
  {
    "id": 1,
    "customer_id": 2,
    "customer_name": "Иванов Иван",
    "total_amount": 500.00,
    "cash_amount": 300.00,
    "electronic_amount": 200.00,
    "discount": 0.00,
    "payment_status": "PAID",
    "stage": "ordered",
    "created_by": 1,
    "seller_name": "Behruz",
    "created_at": "2026-04-05T10:00:00.000Z"
  }
]
```

**Notes:**
- `stage` — Этап продажи: `ordered` (заказан), `ready` (готов), `delivered` (доставлен/выдан)
- Этапы независимы от оплаты (`payment_status`)
- `seller_name` — Имя продавца (пользователя), который создал продажу

---

### GET `/sales/:id`

Получение одной продажи по ID с позициями.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "customer_id": 2,
  "customer_name": "Иванов Иван",
  "total_amount": 500.00,
  "cash_amount": 300.00,
  "electronic_amount": 200.00,
  "discount": 0.00,
  "payment_status": "PAID",
  "stage": "ordered",
  "debt_deadline": "2026-05-15T23:59:59.000Z",
  "created_by": 1,
  "created_at": "2026-04-05T10:00:00.000Z",
  "items": [
    {
      "id": 1,
      "product_id": 5,
      "product_name": "Цемент М500",
      "product_code": "CEM-500",
      "quantity": 10,
      "unit_price": 50.00,
      "total_price": 500.00,
      "style_id": 2,
      "style_name": "волна"
    },
    {
      "id": 2,
      "product_id": 100,
      "stock_item_id": 5,
      "product_name": "Рулон оцинковки",
      "product_code": "STEEL-05",
      "quantity": 50,
      "unit_price": 65.00,
      "total_price": 3250.00,
      "style_id": 3,
      "style_name": "2 таксим"
    }
  ]
}
```

**Notes:**
- `stage` — Текущий этап продажи: `ordered`, `ready`, `delivered`
- `stock_item_id` — ID партии (только для batch товаров). NULL для simple товаров.

**Errors:**
- `404` — Продажа не найдена

---

### PUT `/sales/:id`

Обновление продажи. Поддерживает изменение клиента, статуса оплаты и позиций.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "customer_id": 3,
  "payment_status": "PAID",
  "items": [
    {
      "product_id": 6,
      "quantity": 5,
      "unit_price": 60.00
    },
    {
      "product_id": 100,
      "stock_item_id": 5,
      "quantity": 20,
      "unit_price": 65.00
    }
  ]
}
```

**Response (200):**
```json
{
  "id": 1,
  "total_amount": "1600.00"
}
```

**Логика:**
- Обновляет поля `customer_id`, `payment_status`, `total_amount` если переданы
- При изменении `payment_status` обновляет баланс клиента
- При изменении `items`:
  - Восстанавливает остатки старых позиций на складе
  - **Для batch товаров:** Восстанавливает остатки партий и реактивирует их при необходимости
  - Списывает остатки для новых позиций
  - **Для batch товаров:** Проверяет и списывает из конкретной партии
  - Пересчитывает `total_amount`
- Обновляет запись в `customer_operations` при изменении клиента или статуса

**Notes:**
- Все поля опциональны — обновляются только переданные
- Если `items` не переданы, позиции продажи остаются без изменений
- Для batch товаров `stock_item_id` обязателен

**Errors:**
- `404` — Продажа не найдена
- `400` — Items должен быть непустым массивом
- `400` — Каждый item должен иметь product_id, quantity > 0 и unit_price
- `400` — Для batch товара обязательно указание stock_item_id
- `400` — Недостаточно остатков в партии для batch товара

---

### POST `/sales`

Создание новой продажи. Уменьшает остатки на складе и обновляет баланс клиента (если DEBT).

**Headers:**
```
Authorization: Bearer <token>
```
      "product_id": 5,
      "quantity": 3,
      "unit_price": 50.00,
      "unit_value": 2.5,
      "style_id": 2
    },
    {
      "product_id": 6,
      "quantity": 10,
      "unit_price": 30.00,
      "style_id": 1
    },
    {
      "product_id": 100,
      "stock_item_id": 5,
      "quantity": 50,
      "unit_price": 65.00,
      "style_id": 3
    }
  ]
}
```

**Notes:**
- `stage` - Этап продажи: `ordered` (по умолчанию), `ready`, `delivered`
- `cash_amount` - Сумма оплаты наличными (опционально). Поступает на счет 1 (Наличные)
- `electronic_amount` - Сумма оплаты электронно (опционально). Поступает на счет 2 (Банковская карта)
- `account_id` - Основной счет для отчетности (опционально). Если не указан, определяется автоматически:
  - Если `cash_amount >= electronic_amount` → `account_id = 1` (наличные)
  - Если `electronic_amount > cash_amount` → `account_id = 2` (электронно)
  - При `payment_status = DEBT` → `account_id = NULL`
- **Важно:** При смешанной оплате деньги поступают на ОБА счета независимо от `account_id`. `account_id` используется только для отчетности.
- `payment_status` рассчитывается автоматически на основе `cash_amount + electronic_amount`:
  - `PAID` если сумма оплат >= total_amount
  - `PARTIAL` если 0 < сумма оплат < total_amount  
  - `DEBT` если сумма оплат = 0
- `discount` - **Рассчитывается только для PAID** как `total_amount - (cash_amount + electronic_amount)`. Для PARTIAL и DEBT всегда 0
- `style_id` - ID стиля товара (опционально). Получить из `/api/styles`. Например: 1 (гладкий), 2 (волна), 3 (2 таксим)
- `stock_item_id` - **Обязательно для batch товаров**. ID партии из `/products/:id/stock-items`
- Для simple товаров `stock_item_id` не указывается

**Notes:**
- `debt_deadline` - Срок погашения долга (ISO 8601 формат). Только для payment_status = "DEBT"
- `unit_value` - Размер единицы товара (метры, вес и т.д.). По умолчанию 1.0
- `total_price` рассчитывается как: `quantity * unit_price * unit_value`
- Пример: 3 штуки по 50.00 каждая, размером 2.5м = 3 * 50.00 * 2.5 = 375.00
- Если `unit_value` не указан, используется 1.0 (обратная совместимость)

**Response (201):**
```json
{
  "id": 1,
  "total_amount": "500.00",
  "discount": "0.00"
}
```

**Логика:**
- Проверяет достаточность остатков на складе
- **Для batch товаров:** Проверяет наличие и достаточность остатков в конкретной партии
- Создает запись в `sales`
- Создает записи в `sale_items`
- Уменьшает остатки в `stock`
- **Для batch товаров:** Уменьшает остатки в конкретной партии `stock_items`
- **Для batch товаров:** Автоматически деактивирует партию при остатке = 0
- Обновляет баланс клиента и создает запись в `customer_operations` (если DEBT)

**Errors:**
- `400` — Поле items обязательно
- `400` — Каждый item должен иметь product_id, quantity > 0 и unit_price
- `400` — unit_value должен быть положительным числом
- `400` — style_id должен быть положительным целым числом
- `400` — debt_deadline должен быть валидной датой
- `400` — Недостаточно остатков на складе
- `400` — Для batch товара обязательно указание stock_item_id
- `400` — Партия не найдена для batch товара
- `400` — Недостаточно остатков в партии для batch товара
- `400` — Суммы оплаты не могут быть отрицательными
- `400` — Для PARTIAL статуса сумма оплаты должна быть меньше суммы продажи

---

### DELETE `/sales/:id`

Удаление продажи. Возвращает товар на склад и отменяет изменение баланса клиента.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Sale deleted successfully"
}
```

**Логика:**
- Возвращает остатки в `stock`
- **Для batch товаров:** Возвращает остатки в конкретную партию `stock_items`
- **Для batch товаров:** Реактивирует партию если она была деактивирована
- Удаляет записи из `sale_items`
- Обновляет баланс клиента (если DEBT)
- Удаляет запись из `customer_operations`
- Удаляет запись из `sales`

**Errors:**
- `404` — Продажа не найдена

---

### PUT `/sales/:id/stage`

Изменение этапа продажи. Поддерживает только последовательные переходы: `ordered` → `ready` → `delivered`.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "stage": "ready"
}
```

**Notes:**
- Допустимые этапы: `ordered`, `ready`, `delivered`
- Разрешённые переходы:
  - `ordered` → `ready`
  - `ready` → `delivered`
- ❌ Нельзя пропускать этапы (например, `ordered` → `delivered`)
- ❌ Нельзя возвращаться назад (например, `ready` → `ordered`)
- Этапы независимы от оплаты (`payment_status`)

**Response (200):**
```json
{
  "success": true,
  "sale_id": 1,
  "from_stage": "ordered",
  "to_stage": "ready",
  "message": "Stage updated successfully from 'ordered' to 'ready'"
}
```

**Errors:**
- `400` — Поле stage обязательно
- `400` — Недопустимый этап
- `400` — Недопустимый переход между этапами
- `404` — Продажа не найдена

---

### GET `/sales/:id/stage-history`

Получение истории изменений этапов продажи.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 2,
    "sale_id": 1,
    "from_stage": "ready",
    "to_stage": "delivered",
    "changed_by": 1,
    "changed_by_username": "admin",
    "created_at": "2026-04-22T15:00:00.000Z"
  },
  {
    "id": 1,
    "sale_id": 1,
    "from_stage": "ordered",
    "to_stage": "ready",
    "changed_by": 1,
    "changed_by_username": "admin",
    "created_at": "2026-04-22T14:30:00.000Z"
  }
]
```

**Notes:**
- Возвращает записи в порядке убывания даты (новые сначала)
- `changed_by_username` — имя пользователя, который изменил этап

---

### POST `/sales/:id/payment`

Добавление частичной оплаты к существующей продаже.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 250,
  "account_id": 1
}
```

**Notes:**
- `amount` — Сумма платежа (обязательно, положительное число)
- `account_id` — ID счета для зачисления (опционально, по умолчанию 1)
- Автоматически обновляет `paid_amount` и `payment_status`
- Если сумма платежей достигает `total_amount`, статус меняется на `PAID`

**Response (200):**
```json
{
  "success": true,
  "sale_id": 1,
  "previous_paid": 250,
  "new_paid": 500,
  "total_amount": 1000,
  "remaining": 500,
  "payment_status": "PARTIAL",
  "message": "Successfully added payment of 250. Total paid: 500, Remaining: 500"
}
```

**Errors:**
- `400` — Сумма платежа должна быть положительным числом
- `400` — Сумма платежа превышает общую сумму продажи
- `404` — Продажа не найдена

---

## Returns Endpoints

### GET `/returns`

Получение списка всех возвратов. Поддерживает фильтрацию по дате, месяцу и году.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` — Фильтр по конкретной дате (формат: `YYYY-MM-DD`), например `2026-04-05`
- `month` — Фильтр по месяцу (1-12), требует указания `year`
- `year` — Фильтр по году (например, `2026`)

**Examples:**

Все возвраты:
```
GET /api/returns
```

Возвраты за конкретную дату:
```
GET /api/returns?date=2026-04-05
```

Возвраты за месяц (апрель 2026):
```
GET /api/returns?month=4&year=2026
```

Возвраты за год (2026):
```
GET /api/returns?year=2026
```

**Response (200):**
```json
[
  {
    "id": 1,
    "customer_id": 2,
    "customer_name": "Иванов Иван",
    "total_amount": 150.00,
    "created_by": 1,
    "created_at": "2026-04-05T12:00:00.000Z"
  }
]
```

---

### GET `/returns/:id`

Получение одного возврата по ID с позициями.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "customer_id": 2,
  "customer_name": "John Doe",
  "total_amount": "2750.00",
  "created_at": "2026-04-11T22:45:53.000Z",
  "items": [
    {
      "id": 1,
      "product_id": 5,
      "quantity": 2,
      "unit_value": 25.0,
      "unit_price": 50.00,
      "total_price": 2500.00,
      "product_name": "Sample Product",
      "product_code": "PROD-001",
      "product_type": "simple",
      "batch_code": null
    },
    {
      "id": 2,
      "product_id": 14,
      "stock_item_id": 123,
      "quantity": 1,
      "unit_value": 50.0,
      "unit_price": 15.00,
      "total_price": 750.00,
      "product_name": "Batch Product",
      "product_code": "BATCH-001",
      "product_type": "batch",
      "batch_code": "BATCH-A123"
    }
  ]
}
```

**Errors:**
- `404` — Возврат не найден

---

### POST `/returns`

Создание нового возврата. Увеличивает остатки на складе, обновляет баланс клиента и создает транзакцию возврата денег. Поддерживает как простые, так и партионные товары.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "customer_id": 2,
  "account_id": 1,
  "items": [
    {
      "product_id": 5,
      "quantity": 2,
      "unit_value": 25.0,
      "unit_price": 50.00
    },
    {
      "product_id": 14,
      "stock_item_id": 123,
      "quantity": 1,
      "unit_value": 50.0,
      "unit_price": 15.00
    }
  ]
}
```

**Параметры:**
- `customer_id` (обязательно) — ID клиента
- `account_id` (обязательно) — ID счета для возврата денег
- `items` (обязательно) — массив возвращаемых товаров
- `product_id` (обязательно) — ID товара
- `stock_item_id` (для batch товаров) — ID партии
- `quantity` (обязательно) — количество единиц
- `unit_value` (опционально) — вес/объем единицы (по умолчанию 1.0)
- `unit_price` (обязательно) — цена за единицу веса/объема

**Response (201):**
```json
{
  "id": 1,
  "total_amount": "2750.00"
}
```

**Логика:**
- Создает запись в `returns`
- Создает записи в `return_items` с учетом `unit_value`
- **Для простых товаров**: увеличивает остатки в `stock`
- **Для партионных товаров**: увеличивает количество в конкретной партии (`stock_items`)
- **Баланс клиента**: уменьшается (мы должны клиенту деньги при возврате)
- **Баланс счета**: уменьшается (EXPENSE транзакция - деньги уходят со счета)
- Создает запись в `customer_operations` с типом 'RETURN'
- Создает транзакцию в `transactions` с типом 'EXPENSE' и reference_type 'RETURN'

**Расчеты:**
- **Сумма**: `quantity * unit_price * unit_value`
- **Реальное количество**: `quantity * unit_value`

**Errors:**
- `400` — Клиент, счет и позиции обязательны
- `400` — Каждый item должен иметь product_id, quantity > 0 и unit_price
- `400` — Для batch товаров обязателен stock_item_id
- `400` — unit_value должен быть положительным числом
- `400` — Клиент не найден
- `400` — Счет не найден
- `400` — Партия не найдена (для batch товаров)

---

### DELETE `/returns/:id`

Удаление возврата. Уменьшает остатки на складе, отменяет изменение баланса клиента и восстанавливает баланс счета.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Return deleted successfully"
}
```

**Логика:**
- **Для простых товаров**: уменьшает остатки в `stock`
- **Для партионных товаров**: уменьшает количество в конкретной партии (`stock_items`)
- Удаляет записи из `return_items`
- **Баланс клиента**: увеличивается (отмена возврата - мы больше не должны клиенту)
- **Баланс счета**: восстанавливается (деньги возвращаются на счет)
- Деактивирует транзакцию возврата в `transactions`
- Удаляет запись из `returns`

**Errors:**
- `404` — Возврат не найден

---

## Conversions Endpoints (Переработка товаров)

Переработка товара — преобразование товара A в товар B с переносом себестоимости.

### GET `/conversions`

Получение списка всех операций переработки. Поддерживает фильтрацию по дате, месяцу и году.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` — Фильтр по конкретной дате (формат: `YYYY-MM-DD`)
- `month` — Фильтр по месяцу (1-12), требует `year`
- `year` — Фильтр по году

**Response (200):**
```json
[
  {
    "id": 1,
    "from_product_id": 5,
    "from_product_name": "Цемент",
    "from_product_code": "CEM-001",
    "to_product_id": 6,
    "to_product_name": "Цемент М500",
    "to_product_code": "CEM-500",
    "from_quantity": 10,
    "to_quantity": 5,
    "purchase_cost": 100.00,
    "selling_price": 150.00,
    "created_by": 1,
    "created_by_name": "admin",
    "created_at": "2026-04-22T15:00:00.000Z"
  }
]
```

**Notes:**
- `purchase_cost` — Новая себестоимость товара B (перенесена с товара A)
- `selling_price` — Цена продажи товара B

---

### GET `/conversions/:id`

Получение одной операции переработки по ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "from_product_id": 5,
  "from_product_name": "Цемент",
  "from_product_code": "CEM-001",
  "to_product_id": 6,
  "to_product_name": "Цемент М500",
  "to_product_code": "CEM-500",
  "from_quantity": 10,
  "to_quantity": 5,
  "purchase_cost": 100.00,
  "selling_price": 150.00,
  "created_by": 1,
  "created_by_name": "admin",
  "created_at": "2026-04-22T15:00:00.000Z"
}
```

**Errors:**
- `404` — Переработка не найдена

---

### POST `/conversions`

Создание операции переработки. Уменьшает остаток товара A, увеличивает остаток товара B, переносит себестоимость.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "from_product_id": 5,
  "from_stock_item_id": 10,
  "to_product_id": 6,
  "from_quantity": 10,
  "to_quantity": 5,
  "selling_price": 150
}
```

**Notes:**
- `from_product_id` — ID исходного товара A (обязательно)
- `from_stock_item_id` — ID партии исходного товара (обязательно если from_product — batch)
- `to_product_id` — ID целевого товара B (обязательно)
- `from_quantity` — Количество списываемого товара A (обязательно)
- `to_quantity` — Количество приходуемого товара B (обязательно)
- `selling_price` — Цена продажи товара B (опционально)

**Логика работы с типами товаров:**
- **Из simple товара:** Списывает из общего остатка `stock`
- **Из batch товара:** Требуется `from_stock_item_id`, списывает из конкретной партии
- **В simple товар:** Приходует в общий остаток `stock`
- **В batch товар:** Создаёт новую партию в `stock_items` с кодом `CONV-{timestamp}`

**Логика расчёта себестоимости:**
```
Общая себестоимость = purchase_cost_A × from_quantity
Новая себестоимость B = Общая себестоимость / to_quantity
```

**Пример:**
- Цемент: себестоимость 50, количество 10
- Цемент М500: количество 5
- Общая себестоимость = 50 × 10 = 500
- Новая себестоимость М500 = 500 / 5 = 100

**Response (201):**
```json
{
  "id": 1,
  "message": "Product conversion created successfully"
}
```

**Errors:**
- `400` — Исходный и целевой товары должны быть разными
- `400` — Количества должны быть положительными числами
- `400` — Недостаточно остатков исходного товара
- `400` — Для batch товара обязательно указание from_stock_item_id
- `400` — Партия не найдена для batch товара
- `400` — Недостаточно остатков в партии для batch товара
- `404` — Товар не найден

---

### DELETE `/conversions/:id`

Удаление операции переработки (откат). Возвращает остатки на склад.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Conversion deleted successfully"
}
```

**Логика:**
- Возвращает остатки исходного товара в `stock`
- **Для batch исходного товара:** Возвращает остатки в партию и реактивирует её
- Уменьшает остатки целевого товара в `stock`
- **Для batch целевого товара:** Деактивирует созданную партию
- Soft delete записи — `status = 0`

**⚠️ Важно:**
- Себестоимость товара B **не восстанавливается**
- Запись сохраняется в БД со статусом 0

**Errors:**
- `404` — Переработка не найдена

---

## Exchange Rates Endpoints (Валютные курсы)

Управление текущими валютными курсами (USD, RUB, TJS). Просто обновляем существующий курс.

### GET `/exchange-rates`

Получение списка всех текущих курсов.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "currency": "USD",
    "rate_to_tjs": 10.5000,
    "created_at": "2026-04-22T09:00:00.000Z",
    "updated_at": "2026-04-22T09:00:00.000Z"
  },
  {
    "id": 2,
    "currency": "RUB",
    "rate_to_tjs": 0.1300,
    "created_at": "2026-04-22T09:00:00.000Z",
    "updated_at": "2026-04-22T09:00:00.000Z"
  },
  {
    "id": 3,
    "currency": "TJS",
    "rate_to_tjs": 1.0000,
    "created_at": "2026-04-22T09:00:00.000Z",
    "updated_at": "2026-04-22T09:00:00.000Z"
  }
]
```

**Notes:**
- `rate_to_tjs` — Курс валюты по отношению к TJS (сколько TJS за 1 единицу валюты)
- TJS всегда имеет курс 1.0000
- `updated_at` — Время последнего обновления курса

---

### GET `/exchange-rates/:currency`

Получение курса конкретной валюты.

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
GET /api/exchange-rates/USD
```

**Response (200):**
```json
{
  "id": 1,
  "currency": "USD",
  "rate_to_tjs": 10.5000,
  "created_at": "2026-04-22T09:00:00.000Z",
  "updated_at": "2026-04-22T09:00:00.000Z"
}
```

**Errors:**
- `404` — Курс для указанной валюты не найден

---

### PUT `/exchange-rates`

Обновление курса валюты (создаёт запись если не существует).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currency": "USD",
  "rate_to_tjs": 10.5000
}
```

**Notes:**
- `currency` — Валюта: USD, RUB или TJS (обязательно)
- `rate_to_tjs` — Курс к TJS (обязательно, положительное число)
- Если валюта не существует — создаётся новая запись
- Если валюта существует — обновляется курс
- TJS всегда устанавливается в 1.0000

**Примеры курсов:**
- USD → TJS: 10.5000 (1 USD = 10.50 TJS)
- RUB → TJS: 0.1300 (1 RUB = 0.13 TJS)
- TJS → TJS: 1.0000 (всегда 1)

**Response (200):**
```json
{
  "currency": "USD",
  "rate_to_tjs": 10.5000,
  "message": "Exchange rate updated successfully"
}
```

**Errors:**
- `400` — Валюта должна быть одной из: USD, RUB, TJS
- `400` — Курс должен быть положительным числом

---

## Customer Payments Endpoints

### GET `/customer-payments`

Получение списка всех оплат от клиентов (только type='PAYMENT').

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "customer_id": 72,
    "customer_name": "Иван Иванович",
    "sum": 30.00,
    "type": "PAYMENT",
    "date": "2026-04-12T12:00:00.000Z",
    "status": 1
  }
]
```

---

### POST `/customer-payments`

Создание новой оплаты от клиента. Уменьшает баланс клиента.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "customer_id": 72,
  "account_id": 1,
  "sum": 30.00
}
```

**Notes:**
- `account_id` - ID счета (1=Наличные, 2=Банковская карта, опционально)
- По умолчанию используется счет 1 (Наличные)

**Response (201):**
```json
{
  "id": 1,
  "customer_id": 72,
  "sum": "30.00",
  "type": "PAYMENT"
}
```

**Логика:**
- Creates record in `customer_operations` (type: 'PAYMENT')
- Decreases customer balance in `customers`

**Errors:**
- `400` — Клиент и положительная сумма обязательны
- `400` — Клиент не найден

---

### DELETE `/customer-payments/:id`

Удаление оплаты клиента. Восстанавливает баланс клиента.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Customer payment deleted successfully"
}
```

**Логика:**
- Увеличивает баланс клиента
- Удаляет запись из `customer_operations`

**Errors:**
- `404` — Оплата не найдена
- `400` — Можно удалять только операции типа PAYMENT

---

## Customer Operations Types

### Overview
All customer operations are tracked in `customer_operations` table with different types:

### Operation Types
- **DEBT** - Sale in debt (increases customer balance)
- **PAID** - Paid sale (doesn't change balance)
- **PARTIAL** - Partial payment (increases customer balance)
- **PAYMENT** - Payment from customer (decreases customer balance)
- **RETURN** - Product return (decreases customer balance - we owe customer)

### Balance Impact
- **DEBT**: `balance = balance + amount` (customer owes more)
- **PAID**: `balance = balance` (no change)
- **PARTIAL**: `balance = balance + amount` (customer owes more)
- **PAYMENT**: `balance = balance - amount` (customer owes less)
- **RETURN**: `balance = balance - amount` (we owe customer - balance decreases)

### Usage in Different Modules
- **Sales Module**: Creates `DEBT` or `PAID` operations
- **Customer Payments Module**: Creates `PAYMENT` operations
- **Returns Module**: Creates `RETURN` operations

---

## Customer Operations Endpoints

### GET `/customer-operations`

Получение списка всех операций клиентов. Поддерживает фильтрацию по дате, месяцу, году, типу операции и ID клиента.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` — Фильтр по конкретной дате (формат: `YYYY-MM-DD`), например `2026-04-05`
- `month` — Фильтр по месяцу (1-12), требует указания `year`
- `year` — Фильтр по году (например, `2026`)
- `type` — Фильтр по типу операции (`DEBT`, `PAID`, `PAYMENT`, `RETURN`)
- `customer_id` — Фильтр по ID клиента

**Examples:**

Все операции клиентов:
```
GET /api/customer-operations
```

Операции за конкретную дату:
```
GET /api/customer-operations?date=2026-04-05
```

Операции за месяц (апрель 2026):
```
GET /api/customer-operations?month=4&year=2026
```

Операции только с долгами:
```
GET /api/customer-operations?type=DEBT
```

Операции конкретного клиента:
```
GET /api/customer-operations?customer_id=72
```

**Response (200):**
```json
[
  {
    "id": 13,
    "customer_id": 72,
    "sale_id": 8,
    "customer_name": "Иван Иванович",
    "sum": 45.00,
    "type": "DEBT",
    "date": "2026-04-11T22:20:39.000Z",
    "status": 1
  },
  {
    "id": 14,
    "customer_id": 72,
    "sale_id": null,
    "customer_name": "Иван Иванович",
    "sum": 12.00,
    "type": "PAYMENT",
    "date": "2026-04-11T22:45:54.000Z",
    "status": 1
  }
]
```

---

### GET `/customer-operations/:id`

Получение одной операции клиента по ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 13,
  "customer_id": 72,
  "sale_id": 8,
  "customer_name": "Иван Иванович",
  "sum": 45.00,
  "type": "DEBT",
  "date": "2026-04-11T22:20:39.000Z",
  "status": 1
}
```

**Errors:**
- `404` — Операция не найдена


## Supplier Operations Endpoints

### GET `/supplier-operations`

Получение списка всех операций поставщиков. Поддерживает фильтрацию по дате, месяцу, году, типу операции и ID поставщика.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` — Фильтр по конкретной дате (формат: `YYYY-MM-DD`), например `2026-04-05`
- `month` — Фильтр по месяцу (1-12), требует указания `year`
- `year` — Фильтр по году (например, `2026`)
- `type` — Фильтр по типу операции (`RECEIPT`, `PAYMENT`)
- `supplier_id` — Фильтр по ID поставщика

**Examples:**

Все операции поставщиков:
```
GET /api/supplier-operations
```

Операции за конкретную дату:
```
GET /api/supplier-operations?date=2026-04-05
```

Операции за месяц (апрель 2026):
```
GET /api/supplier-operations?month=4&year=2026
```

Операции только с приходами:
```
GET /api/supplier-operations?type=RECEIPT
```

Операции конкретного поставщика:
```
GET /api/supplier-operations?supplier_id=83
```

**Response (200):**
```json
[
  {
    "id": 8,
    "supplier_id": 83,
    "receipt_id": 18,
    "supplier_name": "Supplier One",
    "sum": 45.00,
    "type": "RECEIPT",
    "date": "2026-04-11T17:09:03.000Z",
    "status": 1
  },
  {
    "id": 13,
    "supplier_id": 83,
    "receipt_id": null,
    "supplier_name": "Supplier One",
    "sum": 40.00,
    "type": "PAYMENT",
    "date": "2026-04-11T23:16:46.000Z",
    "status": 1
  }
]
```

---

### GET `/supplier-operations/:id`

Получение одной операции поставщика по ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 8,
  "supplier_id": 83,
  "receipt_id": 18,
  "supplier_name": "Supplier One",
  "sum": 45.00,
  "type": "RECEIPT",
  "date": "2026-04-11T17:09:03.000Z",
  "status": 1
}
```

**Errors:**
- `404` — Операция не найдена


## Expenses Endpoints

### GET `/expenses`

Получение списка всех расходов с поддержкой фильтров.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` - Фильтр по конкретной дате (формат: `YYYY-MM-DD`), например `2026-04-05`
- `month` - Фильтр по месяцу (1-12), требует указания `year`
- `year` - Фильтр по году (например, `2026`)
- `type` - Фильтр по типу расхода (`shop` или `personal`)
- `created_by` - Фильтр по ID пользователя, создавшего расход
**Examples:**

Все расходы:
```
GET /api/expenses
```

Расходы за конкретную дату:
```
GET /api/expenses?date=2026-04-05
```

Расходы за месяц (апрель 2026):
```
GET /api/expenses?month=4&year=2026
```

Расходы за год (2026):
```
GET /api/expenses?year=2026
```

Только расходы для магазина:
```
GET /api/expenses?type=shop
```

Только личные расходы:
```
GET /api/expenses?type=personal
```

Расходы конкретного пользователя:
```
GET /api/expenses?created_by=1
```

Комбинированная фильтрация (личные расходы пользователя за апрель 2026):
```
GET /api/expenses?type=personal&created_by=1&month=4&year=2026
```

**Response (200):**
```json
[
  {
    "id": 1,
    "description": "Закупка канцелярии",
    "amount": 150.00,
    "expense_date": "2026-04-05",
    "type": "shop",
    "created_by": 1,
    "created_by_name": "Admin User",
    "created_at": "2026-04-05T10:00:00.000Z"
  },
  {
    "id": 2,
    "description": "Обед",
    "amount": 30.00,
    "expense_date": "2026-04-06",
    "type": "personal",
    "created_by": 1,
    "created_by_name": "Admin User",
    "created_at": "2026-04-06T12:00:00.000Z"
  }
]
```

---

### GET `/expenses/:id`

Получение одного расхода по ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "description": "Закупка канцелярии",
  "amount": 150.00,
  "expense_date": "2026-04-05",
  "type": "shop",
  "created_by": 1,
  "created_by_name": "Admin User",
  "created_at": "2026-04-05T10:00:00.000Z"
}
```

**Errors:**
- `404` — Расход не найден

---

### POST `/expenses`

Создание нового расхода.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "description": "Закупка канцелярии",
  "account_id": 1,
  "amount": 150.00,
  "expense_date": "2026-04-05",
  "type": "shop"
}
```

**Notes:**
- `account_id` - ID счета (1=Наличные, 2=Банковская карта, опционально)
- `type` - Тип расхода: `shop` (для магазина) или `personal` (личный), обязательно
- По умолчанию используется счет 1 (Наличные)

**Response (201):**
```json
{
  "id": 1,
  "description": "Закупка канцелярии",
  "amount": "150.00",
  "expense_date": "2026-04-05",
  "type": "shop",
  "created_by": 1
}
```

**Errors:**
- `400` — Описание, положительная сумма, дата и тип обязательны
- `400` — Неверный формат даты (используйте YYYY-MM-DD)
- `400` — Тип должен быть либо "shop", либо "personal"

---

### PUT `/expenses/:id`

Обновление расхода.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "description": "Обновленное описание",
  "amount": 200.00,
  "expense_date": "2026-04-06",
  "type": "personal"
}
```

**Response (200):**
```json
{
  "message": "Expense updated successfully"
}
```

**Errors:**
- `400` — Сумма должна быть положительной
- `400` — Неверный формат даты
- `400` — Тип должен быть либо "shop", либо "personal"
- `404` — Расход не найден

---

### DELETE `/expenses/:id`

Удаление расхода.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Expense deleted successfully"
}
```

**Errors:**
- `404` — Расход не найден

---

## Supplier Payments Endpoints

### GET `/supplier-payments`

Получение списка всех оплат поставщикам (только type='PAYMENT').

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "supplier_id": 2,
    "supplier_name": "Supplier One",
    "sum": 500.00,
    "type": "PAYMENT",
    "date": "2026-04-05T14:00:00.000Z"
  }
]
```

---

### POST `/supplier-payments`

Создание новой оплаты поставщику. Уменьшает баланс поставщика.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "supplier_id": 2,
  "account_id": 1,
  "sum": 500.00
}
```

**Notes:**
- `account_id` - ID счета (1=Наличные, 2=Банковская карта, опционально)
- По умолчанию используется счет 1 (Наличные)

**Response (201):**
```json
{
  "id": 1,
  "supplier_id": 2,
  "sum": "500.00",
  "type": "PAYMENT"
}
```

**Логика:**
- Создает запись в `supplier_operations` (type: 'PAYMENT')
- Уменьшает баланс поставщика в `suppliers`

**Errors:**
- `400` — Поставщик и положительная сумма обязательны
- `400` — Поставщик не найден

---

### DELETE `/supplier-payments/:id`

Удаление оплаты поставщику. Восстанавливает баланс поставщика.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Payment deleted successfully"
}
```

**Логика:**
- Увеличивает баланс поставщика
- Удаляет запись из `supplier_operations`

**Errors:**
- `404` — Оплата не найдена
- `400` — Можно удалять только операции типа PAYMENT

---

## Styles Endpoints

### GET `/styles`

Получение списка всех активных стилей.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "гладкий",
    "description": "Гладкая поверхность",
    "status": 1,
    "created_at": "2026-04-26T10:00:00.000Z",
    "updated_at": "2026-04-26T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "волна",
    "description": "Волновая текстура",
    "status": 1,
    "created_at": "2026-04-26T10:00:00.000Z",
    "updated_at": "2026-04-26T10:00:00.000Z"
  },
  {
    "id": 3,
    "name": "2 таксим",
    "description": "Двусторонняя текстура",
    "status": 1,
    "created_at": "2026-04-26T10:00:00.000Z",
    "updated_at": "2026-04-26T10:00:00.000Z"
  }
]
```

---

### GET `/styles/:id`

Получение стиля по ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "name": "гладкий",
  "description": "Гладкая поверхность",
  "status": 1,
  "created_at": "2026-04-26T10:00:00.000Z",
  "updated_at": "2026-04-26T10:00:00.000Z"
}
```

**Errors:**
- `404` — Стиль не найден

---

### POST `/styles`

Создание нового стиля.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "3 таксим",
  "description": "Трехсторонняя текстура"
}
```

**Response (201):**
```json
{
  "id": 4,
  "name": "3 таксим",
  "description": "Трехсторонняя текстура"
}
```

**Errors:**
- `400` — Name обязателен
- `400` — Name не может быть пустым
- `400` — Name должен быть менее 100 символов
- `400` — Description должен быть менее 500 символов
- `400` — Стиль с таким именем уже существует

---

### PUT `/styles/:id`

Обновление стиля.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "3 таксим обновленный",
  "description": "Обновленное описание"
}
```

**Response (200):**
```json
{
  "message": "Style updated successfully"
}
```

**Errors:**
- `404` — Стиль не найден
- `400` — Name не может быть пустым
- `400` — Name должен быть менее 100 символов
- `400` — Description должен быть менее 500 символов
- `400` — Стиль с таким именем уже существует

---

### DELETE `/styles/:id`

Удаление стиля (soft delete).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Style deleted successfully"
}
```

**Логика:**
- Стиль помечается как неактивный (status = 0)
- Существующие записи в sale_items с этим style_id остаются (foreign key ON DELETE SET NULL)

**Errors:**
- `404` — Стиль не найден

---

## Общие ошибки

### 401 Unauthorized
```json
{
  "error": "Authorization token required"
}
```
Или:
```json
{
  "error": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Only administrators can view user list"
}
```

### 500 Server Error
```json
{
  "error": "Server error"
}
```

---

## Роли пользователей

- `ADMIN` — полный доступ ко всем эндпоинтам
- `USER` — ограниченный доступ (может использовать только `/auth/me`)
