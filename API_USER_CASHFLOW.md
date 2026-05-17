# User Cashflow API Documentation

## GET `/api/user-cashflow`

Получение денежных потоков пользователя (доходы и расходы).

### Доступ:
- **Все пользователи** могут просматривать свои денежные потоки
- **Админ** может просматривать денежные потоки всех пользователей

### Headers:
```
Authorization: Bearer <token>
```

### Query Parameters:
- `start_date` (опционально) - Дата начала в формате YYYY-MM-DD
- `end_date` (опционально) - Дата окончания в формате YYYY-MM-DD  
- `created_by` (опционально) - ID пользователя. Только для админа

### Примеры запросов:

**1. Получение своих операций (обычный пользователь):**
```
GET /api/user-cashflow?start_date=2026-05-01&end_date=2026-05-05
```

**2. Получение всех операций (админ):**
```
GET /api/user-cashflow?start_date=2026-05-01&end_date=2026-05-05
```

**3. Получение операций конкретного пользователя (админ):**
```
GET /api/user-cashflow?created_by=176&start_date=2026-05-01
```

### Response (200):

```json
{
  "operations": [
    {
      "type": "sale",
      "id": 158,
      "amount": 165.00,
      "counterpart_id": 1,
      "counterpart_name": "Розница",
      "description": "Продажа",
      "created_at": "2026-05-05T03:48:28.000Z",
      "flow_type": "income"
    },
    {
      "type": "customer_payment",
      "id": 89,
      "amount": 500.00,
      "counterpart_id": 2,
      "counterpart_name": "Иванов Иван",
      "description": "Оплата клиента",
      "created_at": "2026-05-05T02:30:00.000Z",
      "flow_type": "income"
    },
    {
      "type": "debtor_returned",
      "id": 10,
      "amount": 300.00,
      "counterpart_id": 5,
      "counterpart_name": "Иванов Иван",
      "description": "Возврат должника",
      "created_at": "2026-05-05T02:00:00.000Z",
      "flow_type": "income"
    },
    {
      "type": "return",
      "id": 45,
      "amount": 50.00,
      "counterpart_id": 1,
      "counterpart_name": "Розница",
      "description": "Возврат товара",
      "created_at": "2026-05-05T01:15:00.000Z",
      "flow_type": "expense"
    },
    {
      "type": "expense",
      "id": 23,
      "amount": 25.00,
      "counterpart_id": null,
      "description": "Канцелярия",
      "created_at": "2026-05-05T12:00:00.000Z",
      "flow_type": "expense"
    },
    {
      "type": "supplier_payment",
      "id": 67,
      "amount": 1000.00,
      "counterpart_id": 5,
      "counterpart_name": "Поставщик ООО",
      "description": "Оплата поставщику",
      "created_at": "2026-05-05T10:30:00.000Z",
      "flow_type": "expense"
    },
    {
      "type": "debtor_borrowed",
      "id": 5,
      "amount": 500.00,
      "counterpart_id": 5,
      "counterpart_name": "Иванов Иван",
      "description": "Выдача должнику",
      "created_at": "2026-05-05T09:30:00.000Z",
      "flow_type": "expense"
    },
    {
      "type": "salary_payment",
      "id": 15,
      "amount": 2000.00,
      "counterpart_id": null,
      "counterpart_name": null,
      "description": "Выплата зарплаты",
      "created_at": "2026-05-05T09:00:00.000Z",
      "flow_type": "expense"
    }
  ],
  "summary": {
    "total_income": 6965.00,
    "total_expenses": 3575.00,
    "net_cashflow": 3390.00,
    "operations_count": 8
  },
  "users_summary": [
    {
      "id": 173,
      "name": "Админ",
      "total_income": 5000.00,
      "total_expenses": 800.00,
      "net_cashflow": 4200.00
    },
    {
      "id": 176,
      "name": "Кассир",
      "total_income": 1665.00,
      "total_expenses": 275.00,
      "net_cashflow": 1390.00
    }
  ],
  "filters": {
    "start_date": "2026-05-01",
    "end_date": "2026-05-05",
    "created_by": null
  }
}
```

### Поля операций:

#### Типы операций (type):
- `sale` - Продажа товаров
- `customer_payment` - Оплата клиента
- `debtor_returned` - Возврат денег должником
- `return` - Возврат товара
- `expense` - Расход
- `supplier_payment` - Оплата поставщику
- `debtor_borrowed` - Выдача денег должнику
- `salary_payment` - Выплата зарплаты

#### Типы денежного потока (flow_type):
- `income` - Доход (поступление денег)
- `expense` - Расход (выплата денег)

#### Поля операции:
- `id` - ID операции
- `amount` - Сумма операции
- `counterpart_id` - ID контрагента (клиент/поставщик)
- `counterpart_name` - Наименование контрагента
- `description` - Описание операции
- `created_at` - Дата создания

### Поля summary:
- `total_income` - Общая сумма доходов
- `total_expenses` - Общая сумма расходов
- `net_cashflow` - Чистый денежный поток (доходы - расходы)
- `operations_count` - Количество операций

### Поля users_summary:
**Только для админа при запросе без created_by**

- `id` - ID пользователя
- `name` - Имя пользователя
- `total_income` - Сумма доходов пользователя
- `total_expenses` - Сумма расходов пользователя
- `net_cashflow` - Чистый денежный поток пользователя

### Особенности:

1. **Права доступа:**
   - Обычные пользователи видят только свои операции
   - Админ видит операции всех пользователей

2. **Фильтрация:**
   - `created_by` работает только для админа
   - Обычные пользователи всегда видят только свои данные

3. **Сортировка:**
   - Операции сортируются по дате (новые сверху)

4. **users_summary:**
   - Показывается только админу при запросе всех пользователей
   - При фильтрации по конкретному пользователю не показывается

### Errors:
- `403` - Доступ запрещен (только для некорректных запросов)
- `500` - Ошибка сервера

### Использование во фронтенде:

```javascript
// Запрос денежных потоков
const response = await fetch('/api/user-cashflow?start_date=2026-05-01', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();

// Отображение операций
data.operations.forEach(op => {
  const isIncome = op.flow_type === 'income';
  const color = isIncome ? 'green' : 'red';
  const prefix = isIncome ? '+' : '-';
  
  console.log(`${prefix}${op.amount} - ${op.description}`);
});

// Отображение сводки (только для админа)
if (data.users_summary) {
  data.users_summary.forEach(user => {
    console.log(`${user.name}: ${user.net_cashflow}`);
  });
}

// Проверка прав доступа
if (response.status === 403) {
  console.error('Доступ запрещен');
}
```
