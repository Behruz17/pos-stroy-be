const db = require('../../config/db');

const reportsService = {
  // General report with summary statistics
  getGeneralReport: async (filters = {}) => {
    const { start_date, end_date } = filters;
    
    let dateFilter = '';
    if (start_date && end_date) {
      dateFilter = `AND DATE(created_at) BETWEEN '${start_date}' AND '${end_date}'`;
    } else if (start_date) {
      dateFilter = `AND DATE(created_at) >= '${start_date}'`;
    } else if (end_date) {
      dateFilter = `AND DATE(created_at) <= '${end_date}'`;
    }

    const queries = {
      totalSales: `SELECT COALESCE(SUM(total_amount - COALESCE(discount, 0)), 0) as total FROM sales WHERE status = 1 ${dateFilter}`,
      paidSales: `SELECT COALESCE(SUM(total_amount - COALESCE(discount, 0)), 0) as total FROM sales WHERE status = 1 AND payment_status = 'PAID' ${dateFilter}`,
      debtSales: `SELECT COALESCE(SUM(total_amount - COALESCE(discount, 0)), 0) as total FROM sales WHERE status = 1 AND payment_status = 'DEBT' ${dateFilter}`,
      totalExpenses: `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = 1 ${dateFilter}`,
      totalStockReceipts: `SELECT COALESCE(SUM(total_amount), 0) as total FROM stock_receipts WHERE status = 1 ${dateFilter}`,
      totalReturns: `SELECT COALESCE(SUM(total_amount), 0) as total FROM returns WHERE status = 1 ${dateFilter}`,
      salesCount: `SELECT COUNT(*) as count FROM sales WHERE status = 1 ${dateFilter}`,
      customersCount: `SELECT COUNT(*) as count FROM customers WHERE status = 1`,
      suppliersCount: `SELECT COUNT(*) as count FROM suppliers WHERE status = 1`,
      productsCount: `SELECT COUNT(*) as count FROM products WHERE status = 1`
    };

    try {
      const results = {};
      
      for (const [key, query] of Object.entries(queries)) {
        const [rows] = await db.execute(query);
        results[key] = rows[0];
      }

      // Calculate profit
      const profit = parseFloat(results.paidSales.total) - parseFloat(results.totalExpenses.total);

      return {
        summary: {
          totalSales: parseFloat(results.totalSales.total),
          paidSales: parseFloat(results.paidSales.total),
          debtSales: parseFloat(results.debtSales.total),
          totalExpenses: parseFloat(results.totalExpenses.total),
          totalStockReceipts: parseFloat(results.totalStockReceipts.total),
          totalReturns: parseFloat(results.totalReturns.total),
          profit: profit,
          salesCount: results.salesCount.count,
          customersCount: results.customersCount.count,
          suppliersCount: results.suppliersCount.count,
          productsCount: results.productsCount.count
        },
        period: {
          start_date: start_date || null,
          end_date: end_date || null
        }
      };
    } catch (error) {
      console.error('General report error:', error);
      throw error;
    }
  },

  // Daily summary report (итог дня)
  getDailySummary: async (date, usd_rate = null) => {
    try {
      // Default USD rate if not provided
      const rate = usd_rate || 1.0000;
      
      // Calculate income and expense from transactions for the specified date
      const incomeQuery = `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE type = 'INCOME' 
        AND DATE(created_at) = ? 
        AND status = 1
      `;
      
      const expenseQuery = `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE type = 'EXPENSE' 
        AND DATE(created_at) = ? 
        AND status = 1
      `;
      
      const [incomeResult] = await db.execute(incomeQuery, [date]);
      const [expenseResult] = await db.execute(expenseQuery, [date]);
      
      const income = parseFloat(incomeResult[0].total);
      const expense = parseFloat(expenseResult[0].total);
      const balance = income - expense;
      const balanceUsd = balance / rate;
      
      return {
        date,
        income,
        expense,
        balance,
        balance_usd: balanceUsd,
        usd_rate: rate
      };
    } catch (error) {
      console.error('Daily summary report error:', error);
      throw error;
    }
  },

  // Save daily balance to daily_balances table
  saveDailyBalance: async (date, usd_rate = null, updateAccounts = true) => {
    try {
      // First get the daily summary
      const summary = await reportsService.getDailySummary(date, usd_rate);
      
      // Check if record already exists for this date
      const [existing] = await db.execute(
        'SELECT id FROM daily_balances WHERE date = ?',
        [date]
      );
      
      if (existing.length > 0) {
        // Update existing record
        await db.execute(`
          UPDATE daily_balances 
          SET income = ?, expense = ?, balance = ?, balance_usd = ?, usd_rate = ?, updated_at = CURRENT_TIMESTAMP
          WHERE date = ?
        `, [summary.income, summary.expense, summary.balance, summary.balance_usd, summary.usd_rate, date]);
      } else {
        // Insert new record
        await db.execute(`
          INSERT INTO daily_balances (date, income, expense, balance, balance_usd, usd_rate)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [date, summary.income, summary.expense, summary.balance, summary.balance_usd, summary.usd_rate]);
      }
      
      // Also update account balances with currency conversion
      if (updateAccounts) {
        await reportsService.updateAccountBalancesWithCurrency(date, usd_rate);
      }
      
      return {
        ...summary,
        accounts_updated: updateAccounts
      };
    } catch (error) {
      console.error('Save daily balance error:', error);
      throw error;
    }
  },

  // Get daily balance from cache or calculate if not exists
  getDailyBalance: async (date, usd_rate = null, forceRecalculate = false) => {
    try {
      if (!forceRecalculate) {
        // Try to get from cache first
        const [cached] = await db.execute(
          'SELECT * FROM daily_balances WHERE date = ?',
          [date]
        );
        
        if (cached.length > 0) {
          const cachedData = cached[0];
          return {
            date: cachedData.date,
            income: parseFloat(cachedData.income),
            expense: parseFloat(cachedData.expense),
            balance: parseFloat(cachedData.balance),
            balance_usd: parseFloat(cachedData.balance_usd),
            usd_rate: parseFloat(cachedData.usd_rate),
            from_cache: true
          };
        }
      }
      
      // Calculate from transactions if not in cache or force recalculate
      return await reportsService.getDailySummary(date, usd_rate);
    } catch (error) {
      console.error('Get daily balance error:', error);
      throw error;
    }
  },

  // Update account balances with currency conversion
  updateAccountBalancesWithCurrency: async (date, usd_rate = null) => {
    try {
      const rate = usd_rate || 1.0000;
      
      // Get all accounts
      const [accounts] = await db.execute('SELECT * FROM accounts WHERE status = 1');
      
      for (const account of accounts) {
        // Calculate balance from transactions for this account on the specified date
        const [balanceResult] = await db.execute(`
          SELECT 
            COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0) as balance
          FROM transactions 
          WHERE account_id = ? 
          AND DATE(created_at) <= ? 
          AND status = 1
        `, [account.id, date]);
        
        const balance = parseFloat(balanceResult[0].balance);
        const balanceUsd = balance / rate;
        
        // Update account with currency info
        await db.execute(`
          UPDATE accounts 
          SET balance = ?, 
              balance_usd = ?, 
              usd_rate = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [balance, balanceUsd, rate, account.id]);
      }
      
      return {
        success: true,
        message: `Updated ${accounts.length} accounts with currency conversion`,
        accounts_updated: accounts.length,
        usd_rate: rate,
        date: date
      };
    } catch (error) {
      console.error('Update account balances with currency error:', error);
      throw error;
    }
  },

  // Get account with currency info
  getAccountWithCurrency: async (accountId) => {
    try {
      const [accounts] = await db.execute(
        'SELECT * FROM accounts WHERE id = ? AND status = 1',
        [accountId]
      );
      
      if (accounts.length === 0) {
        throw new Error('Account not found');
      }
      
      const account = accounts[0];
      
      return {
        id: account.id,
        name: account.name,
        type: account.type,
        currency: account.currency,
        balance: parseFloat(account.balance),
        balance_usd: parseFloat(account.balance_usd),
        usd_rate: parseFloat(account.usd_rate),
        status: account.status,
        created_at: account.created_at,
        updated_at: account.updated_at
      };
    } catch (error) {
      console.error('Get account with currency error:', error);
      throw error;
    }
  },

  // Get all accounts with currency info
  getAllAccountsWithCurrency: async () => {
    try {
      const [accounts] = await db.execute(
        'SELECT * FROM accounts WHERE status = 1 ORDER BY type, name'
      );
      
      return accounts.map(account => ({
        id: account.id,
        name: account.name,
        type: account.type,
        currency: account.currency,
        balance: parseFloat(account.balance),
        balance_usd: parseFloat(account.balance_usd),
        usd_rate: parseFloat(account.usd_rate),
        status: account.status,
        created_at: account.created_at,
        updated_at: account.updated_at
      }));
    } catch (error) {
      console.error('Get all accounts with currency error:', error);
      throw error;
    }
  },

  // Convert account currency
  convertAccountCurrency: async (accountId, targetCurrency, usdRate, amount = null) => {
    try {
      // Get account info
      const [accounts] = await db.execute(
        'SELECT * FROM accounts WHERE id = ? AND status = 1',
        [accountId]
      );
      
      if (accounts.length === 0) {
        throw new Error('Account not found');
      }
      
      const account = accounts[0];
      
      // Get calculated balance from transactions
      const [balanceResult] = await db.execute(`
        SELECT 
          (a.balance + COALESCE(
            SUM(CASE 
              WHEN t.type = 'INCOME' THEN t.amount 
              WHEN t.type = 'EXPENSE' THEN -t.amount 
              ELSE 0 
            END), 0
          )) as current_balance
        FROM accounts a
        LEFT JOIN transactions t ON a.id = t.account_id AND t.status = 1
        WHERE a.id = ? AND a.status = 1
        GROUP BY a.id, a.balance
      `, [accountId]);
      
      const currentBalance = parseFloat(balanceResult[0].current_balance);
      const convertAmount = amount !== null ? parseFloat(amount) : currentBalance;
      
      if (convertAmount > currentBalance) {
        throw new Error('Insufficient balance for conversion');
      }
      
      let newBalance, newBalanceUsd, newUsdRate;
      
      if (targetCurrency === 'USD') {
        // Converting from TJS to USD
        newBalance = convertAmount / usdRate;
        newBalanceUsd = newBalance; // In USD, balance_usd equals balance
        newUsdRate = 1.0;
      } else if (targetCurrency === 'TJS') {
        // Converting from USD to TJS
        newBalance = convertAmount * usdRate;
        newBalanceUsd = convertAmount; // Keep USD equivalent
        newUsdRate = usdRate;
      } else {
        throw new Error('Unsupported target currency');
      }
      
      // Create transaction record first (for actual conversions)
      let transactionId = null;
      if (operationType === 'currency_conversion') {
        const [result] = await db.execute(`
          INSERT INTO transactions (account_id, type, amount, reference_type, description, created_at)
          VALUES (?, 'TRANSFER', ?, 'TRANSFER', ?, CURRENT_TIMESTAMP)
        `, [accountId, convertAmount, `Currency conversion: ${account.currency} to ${targetCurrency}`]);
        transactionId = result.insertId;
      }
      
      // Update account balance
      await db.execute(`
        UPDATE accounts 
        SET currency = ?, balance = ?, balance_usd = ?, usd_rate = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [targetCurrency, newBalance, newBalanceUsd, newUsdRate, accountId]);
      
      // For currency conversions, we need to offset the transaction effect on balance
      // Since the transaction will be counted in future balance calculations,
      // we adjust the account balance to compensate
      if (operationType === 'currency_conversion' && transactionId) {
        if (targetCurrency === 'USD') {
          // Converting from TJS to USD - transaction reduces TJS balance
          // We need to add the converted amount back to prevent double counting
          await db.execute(`
            UPDATE accounts 
            SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [newBalance, accountId]);
        } else if (targetCurrency === 'TJS') {
          // Converting from USD to TJS - transaction reduces USD balance
          // We need to add the converted amount back to prevent double counting
          await db.execute(`
            UPDATE accounts 
            SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [convertAmount, accountId]);
        }
      }
      return {
        success: true,
        account_id: accountId,
        from_currency: account.currency,
        to_currency: targetCurrency,
        converted_amount: convertAmount,
        new_balance: newBalance,
        new_balance_usd: newBalanceUsd,
        usd_rate: usdRate,
        message: `Successfully converted ${convertAmount} ${account.currency} to ${targetCurrency}`
      };
    } catch (error) {
      console.error('Convert account currency error:', error);
      throw error;
    }
  },

  // Get total balance across all accounts
  getTotalBalance: async (usdRate = null) => {
    try {
      const rate = usdRate || 1.0;
      
      // Get all accounts - use balance from table (already calculated)
      const [accounts] = await db.execute(`
        SELECT 
          a.id,
          a.name,
          a.type,
          a.currency,
          a.balance,
          COALESCE(a.balance_usd, 0) as balance_usd,
          COALESCE(a.usd_rate, 1.0) as usd_rate
        FROM accounts a
        WHERE a.status = 1
        ORDER BY a.type ASC, a.name ASC
      `);
      
      let totalTJS = 0;
      let totalUSD = 0;
      const byCurrency = { TJS: 0, USD: 0, RUB: 0 };
      const accountsBreakdown = [];
      
      for (const account of accounts) {
        const balance = parseFloat(account.balance); // Use table balance (already calculated)
        const currency = account.currency;
        
        // Add to currency breakdown
        if (byCurrency[currency] !== undefined) {
          byCurrency[currency] += balance;
        }
        
        // No conversion - just use balance as is
        if (currency === 'TJS') {
          totalTJS += balance;
        } else if (currency === 'USD') {
          totalUSD += balance;
        } else if (currency === 'RUB') {
          // Add RUB balance if needed
        }
        
        accountsBreakdown.push({
          id: account.id,
          name: account.name,
          type: account.type,
          currency: currency,
          balance: balance,
          balance_usd: currency === 'USD' ? balance : 0, // Only USD accounts have USD balance
          usd_rate: currency === 'USD' ? 1 : rate
        });
      }
      
      return {
        total_tjs: totalTJS,
        total_usd: totalUSD,
        by_currency: byCurrency,
        accounts_breakdown: accountsBreakdown,
        usd_rate: rate,
        accounts_count: accounts.length
      };
    } catch (error) {
      console.error('Get total balance error:', error);
      throw error;
    }
  },

  // Sales report with detailed information
  getSalesReport: async (filters = {}) => {
    const { start_date, end_date, customer_id, payment_status } = filters;
    
    let whereConditions = ['s.status = 1'];
    
    if (start_date) {
      whereConditions.push(`DATE(s.created_at) >= '${start_date}'`);
    }
    if (end_date) {
      whereConditions.push(`DATE(s.created_at) <= '${end_date}'`);
    }
    if (customer_id) {
      whereConditions.push(`s.customer_id = ${customer_id}`);
    }
    if (payment_status) {
      whereConditions.push(`s.payment_status = '${payment_status}'`);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        s.id,
        s.total_amount,
        s.discount,
        s.payment_status,
        s.created_at,
        c.full_name as customer_name,
        c.phone as customer_phone,
        u.name as created_by_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE ${whereClause}
      ORDER BY s.created_at DESC
    `;

    try {
      const [sales] = await db.execute(query);
      
      // Get sales items for each sale
      for (const sale of sales) {
        const [items] = await db.execute(`
          SELECT 
            si.quantity,
            si.unit_price,
            si.total_price,
            p.name as product_name,
            p.product_code
          FROM sale_items si
          LEFT JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = ? AND si.status = 1
        `, [sale.id]);
        
        sale.items = items;
      }

      // Calculate totals
      const totals = sales.reduce((acc, sale) => {
        const actualAmount = parseFloat(sale.total_amount) - parseFloat(sale.discount || 0);
        acc.totalAmount += actualAmount;
        acc.paidAmount += sale.payment_status === 'PAID' ? actualAmount : 0;
        acc.debtAmount += sale.payment_status === 'DEBT' ? actualAmount : 0;
        return acc;
      }, { totalAmount: 0, paidAmount: 0, debtAmount: 0 });

      return {
        sales,
        summary: totals,
        filters: filters
      };
    } catch (error) {
      console.error('Sales report error:', error);
      throw error;
    }
  },

  // Stock receipts (arrivals) report
  getArrivalsReport: async (filters = {}) => {
    const { start_date, end_date, supplier_id } = filters;
    
    let whereConditions = ['sr.status = 1'];
    
    if (start_date) {
      whereConditions.push(`DATE(sr.created_at) >= '${start_date}'`);
    }
    if (end_date) {
      whereConditions.push(`DATE(sr.created_at) <= '${end_date}'`);
    }
    if (supplier_id) {
      whereConditions.push(`sr.supplier_id = ${supplier_id}`);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        sr.id,
        sr.total_amount,
        sr.currency,
        sr.rate,
        sr.total_amount_converted,
        sr.created_at,
        s.name as supplier_name,
        s.phone as supplier_phone,
        u.name as created_by_name
      FROM stock_receipts sr
      LEFT JOIN suppliers s ON sr.supplier_id = s.id
      LEFT JOIN users u ON sr.created_by = u.id
      WHERE ${whereClause}
      ORDER BY sr.created_at DESC
    `;

    try {
      const [receipts] = await db.execute(query);
      
      // Get receipt items for each receipt
      for (const receipt of receipts) {
        const [items] = await db.execute(`
          SELECT 
            sri.quantity,
            sri.purchase_cost,
            sri.selling_price,
            sri.purchase_cost_converted,
            p.name as product_name,
            p.product_code
          FROM stock_receipt_items sri
          LEFT JOIN products p ON sri.product_id = p.id
          WHERE sri.receipt_id = ? AND sri.status = 1
        `, [receipt.id]);
        
        receipt.items = items;
      }

      // Calculate totals
      const totals = receipts.reduce((acc, receipt) => {
        const amount = parseFloat(receipt.total_amount);
        acc.totalAmount += amount;
        
        if (receipt.currency === 'USD') acc.usdAmount += amount;
        else if (receipt.currency === 'RUB') acc.rubAmount += amount;
        else acc.tjsAmount += amount;
        
        return acc;
      }, { totalAmount: 0, tjsAmount: 0, usdAmount: 0, rubAmount: 0 });

      return {
        receipts,
        summary: totals,
        filters: filters
      };
    } catch (error) {
      console.error('Arrivals report error:', error);
      throw error;
    }
  },

  // Expenses report
  getExpensesReport: async (filters = {}) => {
    const { start_date, end_date, created_by } = filters;
    
    let whereConditions = ['e.status = 1'];
    
    if (start_date) {
      whereConditions.push(`DATE(e.expense_date) >= '${start_date}'`);
    }
    if (end_date) {
      whereConditions.push(`DATE(e.expense_date) <= '${end_date}'`);
    }
    if (created_by) {
      whereConditions.push(`e.created_by = ${created_by}`);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        e.id,
        e.description,
        e.amount,
        e.expense_date,
        e.created_at,
        u.name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE ${whereClause}
      ORDER BY e.expense_date DESC
    `;

    try {
      const [expenses] = await db.execute(query);
      
      // Calculate totals
      const totalAmount = expenses.reduce((sum, expense) => 
        sum + parseFloat(expense.amount), 0);

      // Group by month for trend analysis
      const monthlyTotals = expenses.reduce((acc, expense) => {
        const year = expense.expense_date.getFullYear();
        const monthNum = expense.expense_date.getMonth() + 1;
        const month = `${year}-${String(monthNum).padStart(2, '0')}`;
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += parseFloat(expense.amount);
        return acc;
      }, {});

      return {
        expenses,
        summary: {
          totalAmount,
          count: expenses.length,
          monthlyTotals
        },
        filters: filters
      };
    } catch (error) {
      console.error('Expenses report error:', error);
      throw error;
    }
  }
};

module.exports = reportsService;
