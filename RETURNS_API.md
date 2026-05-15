# Returns API Documentation

## Overview
Returns module handles product returns from customers. When a customer returns products, the system:
- Returns products to stock
- Updates customer balance (we owe customer money)
- Creates expense transaction (money leaves account)
- Creates customer operation record

## Balance Logic

### Customer Balance Rule
**КЛИЕНТЫ: + = клиент должен нам, - = мы должны клиенту**

- **DEBT**: `balance + amount` → customer owes us more
- **PAYMENT**: `balance - amount` → customer owes us less
- **RETURN**: `balance - amount` → we owe customer (balance decreases)

### Account Balance Rule
- **INCOME**: `balance + amount` → money comes in
- **EXPENSE**: `balance - amount` → money goes out

## Return Flow

### Creating a Return
1. **Stock**: Products returned to stock (quantity increases)
2. **Customer Balance**: Decreases (we owe customer money)
3. **Account Balance**: Decreases (EXPENSE transaction)
4. **Customer Operation**: Created with type 'RETURN'

### Deleting a Return
1. **Stock**: Products removed from stock (quantity decreases)
2. **Customer Balance**: Increases (we no longer owe customer)
3. **Account Balance**: Restored (money returns to account)
4. **Transaction**: Deactivated

## API Endpoints

### POST `/returns`

Create a new return.

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
    }
  ]
}
```

**Required Fields:**
- `customer_id` - Customer ID
- `account_id` - Account ID for refund
- `items` - Array of returned items

**Item Fields:**
- `product_id` - Product ID (required)
- `stock_item_id` - Batch ID for batch products (required for batch)
- `quantity` - Quantity (required, > 0)
- `unit_value` - Weight/volume per unit (optional, default 1.0)
- `unit_price` - Price per unit (required)

**Response (201):**
```json
{
  "id": 1,
  "total_amount": "2750.00"
}
```

**Logic:**
- Creates record in `returns` table
- Creates records in `return_items` table
- For simple products: increases `stock` quantity
- For batch products: increases `stock_items` quantity
- Customer balance: `balance - totalAmount` (we owe customer)
- Account balance: `balance - totalAmount` (EXPENSE transaction)
- Creates customer operation with type 'RETURN'
- Creates transaction with type 'EXPENSE' and reference_type 'RETURN'

**Calculations:**
- Total: `quantity * unit_price * unit_value`
- Real quantity: `quantity * unit_value`

**Errors:**
- `400` - Customer, account, and items are required
- `400` - Each item must have product_id, quantity > 0, unit_price
- `400` - stock_item_id required for batch products
- `400` - unit_value must be positive number
- `400` - Customer not found
- `400` - Account not found
- `400` - Batch not found (for batch products)

### GET `/returns`

Get all returns with optional date filtering.

**Query Parameters:**
- `date` - Specific date (YYYY-MM-DD)
- `month` - Month (1-12), requires year
- `year` - Year (e.g., 2026)

**Examples:**
```
GET /api/returns
GET /api/returns?date=2026-04-05
GET /api/returns?month=4&year=2026
GET /api/returns?year=2026
```

**Response (200):**
```json
[
  {
    "id": 1,
    "customer_id": 2,
    "customer_name": "John Doe",
    "total_amount": 150.00,
    "created_by": 1,
    "created_at": "2026-04-05T12:00:00.000Z"
  }
]
```

### GET `/returns/:id`

Get a single return by ID with items.

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
    }
  ]
}
```

### DELETE `/returns/:id`

Delete a return.

**Response (200):**
```json
{
  "message": "Return deleted successfully"
}
```

**Logic:**
- For simple products: decreases `stock` quantity
- For batch products: decreases `stock_items` quantity
- Customer balance: `balance + totalAmount` (we no longer owe customer)
- Account balance: restored (money returns to account)
- Deactivates transaction in `transactions` table
- Deletes records from `return_items` and `returns`

**Errors:**
- `404` - Return not found

## Database Schema

### returns table
```sql
CREATE TABLE `returns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `created_by` int NOT NULL,
  `account_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
);
```

### return_items table
```sql
CREATE TABLE `return_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `return_id` int NOT NULL,
  `product_id` int NOT NULL,
  `stock_item_id` int DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_value` decimal(10,2) NOT NULL DEFAULT '1.00',
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
);
```

## Migration

To add `account_id` to returns table:
```sql
ALTER TABLE returns ADD COLUMN account_id int DEFAULT NULL AFTER created_by;
```

## Important Notes

1. **account_id is required** - Every return must specify which account to refund from
2. **Balance logic follows customer balance rule** - RETURN decreases balance (we owe customer)
3. **Transactions are created automatically** - EXPENSE transaction with reference_type 'RETURN'
4. **Stock is updated for both simple and batch products**
5. **Transaction is deactivated on return deletion** - Account balance is restored before deactivation
