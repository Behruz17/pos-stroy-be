# Reports API Documentation

## Reports Endpoints

### GET `/reports/general`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `start_date` - Filter by start date (format: `YYYY-MM-DD`), e.g. `2026-04-01`
- `end_date` - Filter by end date (format: `YYYY-MM-DD`), e.g. `2026-04-30`

**Examples:**

General report for all time:
```
GET /api/reports/general
```

General report for specific period:
```
GET /api/reports/general?start_date=2026-04-01&end_date=2026-04-30
```

**Response (200):**
```json
{
  "summary": {
    "totalSales": 10815.00,
    "paidSales": 10815.00,
    "debtSales": 0.00,
    "totalExpenses": 255.00,
    "totalStockReceipts": 8998880.00,
    "totalReturns": 13.00,
    "totalDebtorBorrowed": 500.00,
    "totalDebtorReturned": 300.00,
    "totalSalaryPayments": 2000.00,
    "profit": 10560.00,
    "salesCount": 4,
    "customersCount": 2,
    "suppliersCount": 5,
    "productsCount": 108
  },
  "period": {
    "start_date": "2026-04-01",
    "end_date": "2026-04-30"
  }
}
```

**Notes:**
- `totalSales` - Total amount of all sales
- `paidSales` - Total amount of paid sales
- `debtSales` - Total amount of debt sales
- `totalExpenses` - Total amount of expenses
- `totalStockReceipts` - Total amount of stock receipts (arrivals)
- `totalReturns` - Total amount of returns
- `totalDebtorBorrowed` - Total amount borrowed to debtors
- `totalDebtorReturned` - Total amount returned by debtors
- `totalSalaryPayments` - Total amount of salary payments
- `profit` - Calculated as paidSales - totalExpenses

---

### GET `/reports/sales`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `start_date` - Filter by start date (format: `YYYY-MM-DD`)
- `end_date` - Filter by end date (format: `YYYY-MM-DD`)
- `customer_id` - Filter by customer ID
- `payment_status` - Filter by payment status (`PAID`, `DEBT`)

**Examples:**

All sales:
```
GET /api/reports/sales
```

Sales for specific customer:
```
GET /api/reports/sales?customer_id=72
```

Paid sales for specific period:
```
GET /api/reports/sales?start_date=2026-04-01&end_date=2026-04-30&payment_status=PAID
```

**Response (200):**
```json
{
  "sales": [
    {
      "id": 5,
      "total_amount": "25.00",
      "payment_status": "PAID",
      "created_at": "2026-04-11T19:20:10.000Z",
      "customer_name": "John",
      "customer_phone": "987654321",
      "created_by_name": "Behruz",
      "items": [
        {
          "quantity": 5,
          "unit_price": "5.00",
          "total_price": "25.00",
          "product_name": "River",
          "product_code": "1234"
        }
      ]
    }
  ],
  "summary": {
    "totalAmount": 10815.00,
    "paidAmount": 10815.00,
    "debtAmount": 0.00
  },
  "filters": {
    "start_date": "2026-04-01",
    "end_date": "2026-04-30"
  }
}
```

**Notes:**
- Returns detailed sales information with items
- Includes customer and creator information
- Summary shows totals by payment status

---

### GET `/reports/arrivals`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `start_date` - Filter by start date (format: `YYYY-MM-DD`)
- `end_date` - Filter by end date (format: `YYYY-MM-DD`)
- `supplier_id` - Filter by supplier ID

**Examples:**

All arrivals:
```
GET /api/reports/arrivals
```

Arrivals for specific supplier:
```
GET /api/reports/arrivals?supplier_id=83
```

Arrivals for specific period:
```
GET /api/reports/arrivals?start_date=2026-04-01&end_date=2026-04-30
```

**Response (200):**
```json
{
  "receipts": [
    {
      "id": 18,
      "total_amount": "45.00",
      "currency": "TJS",
      "rate": "1.0000",
      "total_amount_converted": null,
      "created_at": "2026-04-11T17:08:58.000Z",
      "supplier_name": "Supplier1",
      "supplier_phone": "987654321",
      "created_by_name": "Behruz",
      "items": [
        {
          "quantity": "10",
          "purchase_cost": "2.00",
          "selling_price": "3.00",
          "purchase_cost_converted": null,
          "product_name": "First Product 1775332130837",
          "product_code": "DUPLICATE-1775332130837"
        }
      ]
    }
  ],
  "summary": {
    "totalAmount": 8998880.00,
    "tjsAmount": 8998880.00,
    "usdAmount": 0.00,
    "rubAmount": 0.00
  },
  "filters": {
    "start_date": "2026-04-01",
    "end_date": "2026-04-30"
  }
}
```

**Notes:**
- Returns stock receipts (arrivals) with detailed items
- Includes currency breakdown in summary
- Shows supplier and creator information

---

### GET `/reports/expenses`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `start_date` - Filter by start date (format: `YYYY-MM-DD`)
- `end_date` - Filter by end date (format: `YYYY-MM-DD`)
- `created_by` - Filter by creator user ID

**Examples:**

All expenses:
```
GET /api/reports/expenses
```

Expenses for specific period:
```
GET /api/reports/expenses?start_date=2026-04-01&end_date=2026-04-30
```

Expenses created by specific user:
```
GET /api/reports/expenses?created_by=173
```

**Response (200):**
```json
{
  "expenses": [
    {
      "id": 1,
      "description": "Lunch and expenses",
      "amount": "55.00",
      "expense_date": "2026-04-12",
      "created_at": "2026-04-11T23:41:50.000Z",
      "created_by_name": "Behruz"
    },
    {
      "id": 2,
      "description": "Expenses",
      "amount": "200.00",
      "expense_date": "2026-04-17",
      "created_at": "2026-04-17T17:51:22.000Z",
      "created_by_name": "Behruz"
    }
  ],
  "summary": {
    "totalAmount": 255.00,
    "count": 2,
    "monthlyTotals": {
      "2026-04": 255.00
    }
  },
  "filters": {
    "start_date": "2026-04-01",
    "end_date": "2026-04-30"
  }
}
```

**Notes:**
- Returns detailed expense information
- Includes monthly totals for trend analysis
- Shows creator information

---

## Integration Instructions

To add this documentation to the main API.md file:

1. Open `API.md`
2. Find the line `## Common Errors` (around line 2699)
3. Insert the entire Reports Endpoints section before that line
4. The Reports section should start with `---` and end with `---` before the Common Errors section

The reports endpoints are now fully implemented and documented!
