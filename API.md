# API Documentation

Базовый URL: `http://localhost:3000/api` (или ваш продакшн URL)

## Аутентификация

Все эндпоинты (кроме `/auth/login`) требуют **Bearer Token** в заголовке:
```
Authorization: Bearer <token>
```

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
    "image": "https://example.com/cement.jpg",
    "notification_threshold": 50,
    "stock_quantity": 150,
    "created_at": "2026-04-04T18:00:00.000Z"
  }
]
```

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
  "image": "https://example.com/cement.jpg",
  "notification_threshold": 50,
  "stock_quantity": 150,
  "created_at": "2026-04-04T18:00:00.000Z"
}
```

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
image: [файл изображения]
notification_threshold: 50
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Цемент М500",
  "manufacturer": "Таджикцемент",
  "product_code": "CEM-500-001",
  "image": "/uploads/products/product-1712841234567-123456789.jpg",
  "notification_threshold": 50,
  "created_at": "2026-04-04T18:00:00.000Z"
}
```

**Notes:**
- Поле `image` — файл изображения (JPEG, PNG, GIF, WEBP), максимум 5MB
- Изображение доступно по URL: `http://localhost:3000/uploads/products/{filename}`

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
  "image": "/uploads/products/product-1712841234567-987654321.jpg",
  "notification_threshold": 30,
  "created_at": "2026-04-04T18:00:00.000Z"
}
```

**Notes:**
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
    "supplier_name": "Supplier Name"
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
  "items": [
    {
      "id": 1,
      "receipt_id": 1,
      "product_id": 5,
      "product_name": "Цемент М500",
      "product_code": "CEM-500",
      "quantity": 100,
      "purchase_cost": 50.00,
      "selling_price": 75.00
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
      "selling_price": 45.00
    }
  ]
}
```

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
- Увеличивает остатки в `stock` (INSERT ... ON DUPLICATE KEY UPDATE)
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

## Sales Endpoints

### GET `/sales`

Получение списка всех продаж. Поддерживает фильтрацию по дате, месяцу и году.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` — Фильтр по конкретной дате (формат: `YYYY-MM-DD`), например `2026-04-05`
- `month` — Фильтр по месяцу (1-12), требует указания `year`
- `year` — Фильтр по году (например, `2026`)

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

**Response (200):**
```json
[
  {
    "id": 1,
    "customer_id": 2,
    "customer_name": "Иванов Иван",
    "total_amount": 500.00,
    "payment_status": "DEBT",
    "created_by": 1,
    "created_at": "2026-04-05T10:00:00.000Z"
  }
]
```

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
  "payment_status": "DEBT",
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
      "total_price": 500.00
    }
  ]
}
```

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
    }
  ]
}
```

**Response (200):**
```json
{
  "id": 1,
  "total_amount": "300.00"
}
```

**Логика:**
- Обновляет поля `customer_id`, `payment_status`, `total_amount` если переданы
- При изменении `payment_status` обновляет баланс клиента
- При изменении `items`:
  - Восстанавливает остатки старых позиций на складе
  - Списывает остатки для новых позиций
  - Пересчитывает `total_amount`
- Обновляет запись в `customer_operations` при изменении клиента или статуса

**Notes:**
- Все поля опциональны — обновляются только переданные
- Если `items` не переданы, позиции продажи остаются без изменений

**Errors:**
- `404` — Продажа не найдена
- `400` — Items должен быть непустым массивом
- `400` — Каждый item должен иметь product_id, quantity > 0 и unit_price

---

### POST `/sales`

Создание новой продажи. Уменьшает остатки на складе и обновляет баланс клиента (если DEBT).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "customer_id": 2,
  "payment_status": "DEBT",
  "items": [
    {
      "product_id": 5,
      "quantity": 10,
      "unit_price": 50.00
    }
  ]
}
```

**Response (201):**
```json
{
  "id": 1,
  "total_amount": "500.00"
}
```

**Логика:**
- Проверяет достаточность остатков на складе
- Создает запись в `sales`
- Создает записи в `sale_items`
- Уменьшает остатки в `stock`
- Обновляет баланс клиента и создает запись в `customer_operations` (если DEBT)

**Errors:**
- `400` — Поле items обязательно
- `400` — Каждый item должен иметь product_id, quantity > 0 и unit_price
- `400` — Недостаточно остатков на складе

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
- Удаляет записи из `sale_items`
- Обновляет баланс клиента (если DEBT)
- Удаляет запись из `customer_operations`
- Удаляет запись из `sales`

**Errors:**
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
  "customer_name": "Иванов Иван",
  "total_amount": 150.00,
  "created_by": 1,
  "created_at": "2026-04-05T12:00:00.000Z",
  "items": [
    {
      "id": 1,
      "product_id": 5,
      "product_name": "Цемент М500",
      "product_code": "CEM-500",
      "quantity": 3,
      "unit_price": 50.00,
      "total_price": 150.00
    }
  ]
}
```

**Errors:**
- `404` — Возврат не найден

---

### POST `/returns`

Создание нового возврата. Увеличивает остатки на складе и обновляет баланс клиента (если продажа была в DEBT).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "customer_id": 2,
  "items": [
    {
      "product_id": 5,
      "quantity": 3,
      "unit_price": 50.00
    }
  ]
}
```

**Response (201):**
```json
{
  "id": 1,
  "total_amount": "150.00"
}
```

**Логика:**
- Создает запись в `returns`
- Создает записи в `return_items`
- Увеличивает остатки в `stock`
- Обновляет баланс клиента (уменьшает долг)
- Создает запись в `customer_operations` с типом 'RETURN'

**Errors:**
- `400` — Клиент и позиции обязательны
- `400` — Каждый item должен иметь product_id, quantity > 0 и unit_price
- `400` — Клиент не найден
Удаление возврата. Уменьшает остатки на складе и отменяет изменение баланса клиента.

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
- Уменьшает остатки в `stock`
- Удаляет записи из `return_items`
- Восстанавливает баланс клиента
- Удаляет запись из `returns`

**Errors:**
- `404` — Возврат не найден

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
  "sum": 30.00
}
```

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
- **PAYMENT** - Payment from customer (decreases customer balance)
- **RETURN** - Product return (decreases customer balance)

### Balance Impact
- **DEBT**: `balance = balance + amount` (customer owes more)
- **PAID**: `balance = balance` (no change)
- **PAYMENT**: `balance = balance - amount` (customer owes less)
- **RETURN**: `balance = balance - amount` (customer owes less)

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

**Response (200):**
```json
[
  {
    "id": 1,
    "description": "Закупка канцелярии",
    "amount": 150.00,
    "expense_date": "2026-04-05",
    "created_by": 1,
    "created_by_name": "Admin User",
    "created_at": "2026-04-05T10:00:00.000Z"
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
  "amount": 150.00,
  "expense_date": "2026-04-05"
}
```

**Response (201):**
```json
{
  "id": 1,
  "description": "Закупка канцелярии",
  "amount": "150.00",
  "expense_date": "2026-04-05",
  "created_by": 1
}
```

**Errors:**
- `400` — Описание, положительная сумма и дата обязательны
- `400` — Неверный формат даты (используйте YYYY-MM-DD)

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
  "expense_date": "2026-04-06"
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
  "sum": 500.00
}
```

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
