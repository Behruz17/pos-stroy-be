# New Currency Endpoints Documentation

## 1. Convert Account Currency

### Endpoint
```
PUT /api/reports/accounts/:id/convert-currency
```

### Description
Converts account balance from one currency to another (TJS <-> USD). Creates a transaction record for the conversion.

### Request Body
```json
{
  "target_currency": "USD",     // "TJS" or "USD"
  "usd_rate": 10.5,             // USD exchange rate
  "amount": 100.00              // Optional: amount to convert (default: full balance)
}
```

### Response
```json
{
  "success": true,
  "account_id": 1,
  "from_currency": "TJS",
  "to_currency": "USD",
  "converted_amount": 100.00,
  "new_balance": 9.52,         // 100 / 10.5
  "new_balance_usd": 9.52,
  "usd_rate": 10.5,
  "message": "Successfully converted 100 TJS to USD"
}
```

### Examples

**Convert full balance from TJS to USD:**
```javascript
fetch('/api/reports/accounts/1/convert-currency', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    target_currency: 'USD',
    usd_rate: 10.5
  })
});
```

**Convert partial amount from USD to TJS:**
```javascript
fetch('/api/reports/accounts/2/convert-currency', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    target_currency: 'TJS',
    usd_rate: 10.5,
    amount: 50.00
  })
});
```

### Error Cases
- `404` - Account not found
- `400` - Account already has target currency
- `400` - Insufficient balance for conversion
- `400` - Unsupported target currency

---

## 2. Get Total Balance

### Endpoint
```
GET /api/reports/total-balance
```

### Description
Returns total balance across all accounts with currency breakdown and USD conversion.

### Query Parameters
- `usd_rate` (optional) - USD exchange rate for conversion (default: 1.0)

### Response
```json
{
  "total_tjs": 1150.00,
  "total_usd": 109.52,
  "by_currency": {
    "TJS": 800.00,
    "USD": 200.00,
    "RUB": 150.00
  },
  "accounts_breakdown": [
    {
      "id": 1,
      "name": "Naqt",
      "type": "CASH",
      "currency": "TJS",
      "balance": 600.00,
      "balance_usd": 57.14,
      "usd_rate": 10.5
    },
    {
      "id": 2,
      "name": "DC",
      "type": "ELECTRONIC",
      "currency": "USD",
      "balance": 200.00,
      "balance_usd": 200.00,
      "usd_rate": 10.5
    }
  ],
  "usd_rate": 10.5,
  "accounts_count": 2
}
```

### Examples

**Get total balance with custom USD rate:**
```javascript
fetch('/api/reports/total-balance?usd_rate=10.5')
  .then(res => res.json())
  .then(data => {
    console.log(`Total: ${data.total_tjs} TJS = ${data.total_usd} USD`);
    console.log(`By currency:`, data.by_currency);
  });
```

**Get total balance with default rate:**
```javascript
fetch('/api/reports/total-balance')
  .then(res => res.json())
  .then(data => {
    data.accounts_breakdown.forEach(account => {
      console.log(`${account.name}: ${account.balance} ${account.currency} = ${account.balance_usd} USD`);
    });
  });
```

---

## Complete API Usage Examples

### Scenario: Convert cash account to USD and check total balance

```javascript
// 1. Convert cash account from TJS to USD
fetch('/api/reports/accounts/1/convert-currency', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    target_currency: 'USD',
    usd_rate: 10.5
  })
})
.then(res => res.json())
.then(conversion => {
  console.log('Conversion result:', conversion);
  
  // 2. Get updated total balance
  return fetch('/api/reports/total-balance?usd_rate=10.5');
})
.then(res => res.json())
.then(total => {
  console.log('Updated total balance:', total);
  console.log(`Overall: ${total.total_tjs} TJS = ${total.total_usd} USD`);
});
```

### Scenario: Daily financial summary

```javascript
const usdRate = 10.5;

// Get daily summary
fetch(`/api/reports/daily-summary?date=2026-04-20&usd_rate=${usdRate}`)
  .then(res => res.json())
  .then(daily => {
    console.log('Daily Summary:', daily);
    
    // Get total accounts balance
    return fetch(`/api/reports/total-balance?usd_rate=${usdRate}`);
  })
  .then(res => res.json())
  .then(total => {
    console.log('Total Balance:', total);
    
    // Display comprehensive report
    console.log(`
      Financial Report for 2026-04-20:
      - Daily Income: ${daily.income} TJS
      - Daily Expense: ${daily.expense} TJS
      - Daily Balance: ${daily.balance} TJS = ${daily.balance_usd} USD
      - Total Accounts Balance: ${total.total_tjs} TJS = ${total.total_usd} USD
      - Currency Breakdown: TJS: ${total.by_currency.TJS}, USD: ${total.by_currency.USD}
    `);
  });
```

## Important Notes

1. **Transaction Records**: Currency conversions create TRANSFER transactions for audit trail
2. **Rate Consistency**: Use the same USD rate across all operations for consistency
3. **Partial Conversions**: You can convert specific amounts or the entire balance
4. **Currency Support**: Currently supports TJS and USD conversions
5. **Error Handling**: Comprehensive error messages for validation failures

## Integration with Existing Features

These endpoints work seamlessly with existing daily summary and account management features:

- Daily summary shows converted amounts
- Account balances are updated in real-time
- Transaction history maintains audit trail
- Currency breakdown provides detailed insights
