const db = require('../../config/db');

const accountsService = {
  // Get all accounts with currency support (use table balance)
  getAll: async () => {
    const [accounts] = await db.execute(`
      SELECT 
        a.id,
        a.name,
        a.type,
        a.currency,
        a.balance as current_balance,
        COALESCE(a.balance_usd, 0) as balance_usd,
        COALESCE(a.usd_rate, 1.0) as usd_rate,
        a.status,
        a.created_at,
        a.updated_at
      FROM accounts a
        WHERE a.status = 1
        ORDER BY a.type ASC, a.name ASC
    `);

    // Get recent transactions for each account
    for (const account of accounts) {
      const [transactions] = await db.execute(`
        SELECT 
          t.id,
          t.type,
          t.amount,
          t.reference_type,
          t.reference_id,
          t.description,
          t.created_at
        FROM transactions t
        WHERE t.account_id = ? AND t.status = 1
        ORDER BY t.created_at DESC
        LIMIT 10
      `, [account.id]);

      account.recent_transactions = transactions;
    }

    return accounts;
  },

  getById: async (id) => {
    const [accounts] = await db.execute(`
      SELECT 
        a.id,
        a.name,
        a.type,
        a.currency,
        a.balance as current_balance,
        COALESCE(a.balance_usd, 0) as balance_usd,
        COALESCE(a.usd_rate, 1.0) as usd_rate,
        a.status,
        a.created_at,
        a.updated_at
      FROM accounts a
        WHERE a.id = ? AND a.status = 1
    `, [id]);

    if (accounts.length === 0) {
      return { error: 'Account not found' };
    }

    const account = accounts[0];

    // Get all transactions for this account
    const [transactions] = await db.execute(`
      SELECT 
        t.id,
        t.type,
        t.amount,
        t.reference_type,
        t.reference_id,
        t.description,
        t.created_at
      FROM transactions t
      WHERE t.account_id = ? AND t.status = 1
      ORDER BY t.created_at DESC
    `, [id]);

    account.transactions = transactions;
    return account;
  },

  createTransaction: async ({ account_id, type, amount, reference_type, reference_id, description }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Check if account exists
      const [accountRows] = await connection.execute(
        'SELECT id FROM accounts WHERE id = ? AND status = 1',
        [account_id]
      );

      if (accountRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Account not found' };
      }

      // Create transaction
      const [result] = await connection.execute(
        'INSERT INTO transactions (account_id, type, amount, reference_type, reference_id, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [account_id, type, amount, reference_type, reference_id, description, 1]
      );

      // Update account balance based on transaction type
      const balanceChange = type === 'INCOME' ? amount : -amount;
      await connection.execute(
        'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [balanceChange, account_id]
      );

      await connection.commit();
      return { id: result.insertId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Create transactions for sales
  createSaleTransaction: async (saleData) => {
    const { id, total_amount, cash_amount, electronic_amount, payment_status, account_id } = saleData;
    
    if (payment_status === 'PAID' || payment_status === 'PARTIAL') {
      const connection = await db.getConnection();
      
      try {
        await connection.beginTransaction();
        
        // Create transaction for cash amount if > 0
        if (cash_amount && cash_amount > 0) {
          await connection.execute(
            'INSERT INTO transactions (account_id, type, amount, reference_type, reference_id, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [1, 'INCOME', cash_amount, 'SALE', id, `Продажа #${id} (наличные)`, 1]
          );
        }
        
        // Create transaction for electronic amount if > 0
        if (electronic_amount && electronic_amount > 0) {
          await connection.execute(
            'INSERT INTO transactions (account_id, type, amount, reference_type, reference_id, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [2, 'INCOME', electronic_amount, 'SALE', id, `Продажа #${id} (электронно)`, 1]
          );
        }
        
        // Update account balances
        if (cash_amount && cash_amount > 0) {
          await connection.execute(
            'UPDATE accounts SET balance = balance + ? WHERE id = ? AND status = 1',
            [cash_amount, 1]
          );
        }
        
        if (electronic_amount && electronic_amount > 0) {
          await connection.execute(
            'UPDATE accounts SET balance = balance + ? WHERE id = ? AND status = 1',
            [electronic_amount, 2]
          );
        }
        
        await connection.commit();
        return { success: true };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }
    
    return { success: true };
  },

  // Create transactions for purchases
  createPurchaseTransaction: async (purchaseData) => {
    const { id, total_amount, account_id } = purchaseData;
    
    return await accountsService.createTransaction({
      account_id: account_id || 1, // Use provided account_id or default to cash
      type: 'EXPENSE',
      amount: total_amount,
      reference_type: 'PURCHASE',
      reference_id: id,
      description: `Закупка #${id}`
    });
  },

  // Create transactions for salary payments
  createSalaryTransaction: async (paymentData) => {
    const { id, salary_id, amount, account_id } = paymentData;
    
    return await accountsService.createTransaction({
      account_id: account_id || 1, // Use provided account_id or default to cash
      type: 'EXPENSE',
      amount: amount,
      reference_type: 'SALARY',
      reference_id: salary_id,
      description: `Выплата зарплаты #${salary_id}`
    });
  },

  // Create transactions for expenses
  createExpenseTransaction: async (expenseData) => {
    const { id, amount, account_id } = expenseData;
    
    return await accountsService.createTransaction({
      account_id: account_id || 1, // Use provided account_id or default to cash
      type: 'EXPENSE',
      amount: amount,
      reference_type: 'EXPENSE',
      reference_id: id,
      description: `Расход #${id}`
    });
  },

  // Create transactions for customer payments
  createCustomerPaymentTransaction: async (paymentData) => {
    const { id, amount, account_id } = paymentData;
    
    return await accountsService.createTransaction({
      account_id: account_id || 1, // Use provided account_id or default to cash
      type: 'INCOME',
      amount: amount,
      reference_type: 'CUSTOMER_PAYMENT',
      reference_id: id,
      description: `Оплата клиента #${id}`
    });
  },

  // Create transactions for supplier payments
  createSupplierPaymentTransaction: async (paymentData) => {
    const { id, amount, account_id } = paymentData;
    
    return await accountsService.createTransaction({
      account_id: account_id || 1, // Use provided account_id or default to cash
      type: 'EXPENSE',
      amount: amount,
      reference_type: 'SUPPLIER_PAYMENT',
      reference_id: id,
      description: `Оплата поставщику #${id}`
    });
  },

  // Deactivate transactions by reference type and ID
  deactivateTransactions: async (connection, referenceType, referenceId) => {
    const [result] = await connection.execute(
      'UPDATE transactions SET status = 0 WHERE reference_type = ? AND reference_id = ?',
      [referenceType, referenceId]
    );
    
    return result.affectedRows;
  }
};

module.exports = accountsService;
