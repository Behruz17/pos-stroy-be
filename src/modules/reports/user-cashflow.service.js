const db = require('../../config/db');

const userCashflowService = {
  // Get all cash flow operations for user
  getUserCashflow: async (filters = {}) => {
    const { start_date, end_date, created_by } = filters;
    
    let dateFilter = '';
    let dateFilterSales = '';
    let dateFilterCustomerOps = '';
    let dateFilterReturns = '';
    let dateFilterExpenses = '';
    let dateFilterSupplierOps = '';
    let dateFilterCustomerOpsSimple = '';
    let dateFilterSupplierOpsSimple = '';
    let dateFilterDebtorOps = '';
    let dateFilterDebtorOpsSimple = '';
    let dateFilterSalaryPayments = '';
    let dateFilterSalaryPaymentsSimple = '';
    
    if (start_date && end_date) {
      dateFilter = `AND DATE(created_at) BETWEEN '${start_date}' AND '${end_date}'`;
      dateFilterSales = `AND DATE(s.created_at) BETWEEN '${start_date}' AND '${end_date}'`;
      dateFilterCustomerOps = `AND DATE(cp.date) BETWEEN '${start_date}' AND '${end_date}'`;
      dateFilterCustomerOpsSimple = `AND DATE(date) BETWEEN '${start_date}' AND '${end_date}'`;
      dateFilterReturns = `AND DATE(r.created_at) BETWEEN '${start_date}' AND '${end_date}'`;
      dateFilterExpenses = `AND DATE(e.created_at) BETWEEN '${start_date}' AND '${end_date}'`;
      dateFilterSupplierOps = `AND DATE(sp.date) BETWEEN '${start_date}' AND '${end_date}'`;
      dateFilterSupplierOpsSimple = `AND DATE(date) BETWEEN '${start_date}' AND '${end_date}'`;
      dateFilterDebtorOps = `AND DATE(dop.date) BETWEEN '${start_date}' AND '${end_date}'`;
      dateFilterDebtorOpsSimple = `AND DATE(date) BETWEEN '${start_date}' AND '${end_date}'`;
      dateFilterSalaryPayments = `AND DATE(sp.payment_date) BETWEEN '${start_date}' AND '${end_date}'`;
      dateFilterSalaryPaymentsSimple = `AND DATE(payment_date) BETWEEN '${start_date}' AND '${end_date}'`;
    } else if (start_date) {
      dateFilter = `AND DATE(created_at) >= '${start_date}'`;
      dateFilterSales = `AND DATE(s.created_at) >= '${start_date}'`;
      dateFilterCustomerOps = `AND DATE(cp.date) >= '${start_date}'`;
      dateFilterCustomerOpsSimple = `AND DATE(date) >= '${start_date}'`;
      dateFilterReturns = `AND DATE(r.created_at) >= '${start_date}'`;
      dateFilterExpenses = `AND DATE(e.created_at) >= '${start_date}'`;
      dateFilterSupplierOps = `AND DATE(sp.date) >= '${start_date}'`;
      dateFilterSupplierOpsSimple = `AND DATE(date) >= '${start_date}'`;
      dateFilterDebtorOps = `AND DATE(dop.date) >= '${start_date}'`;
      dateFilterDebtorOpsSimple = `AND DATE(date) >= '${start_date}'`;
      dateFilterSalaryPayments = `AND DATE(sp.payment_date) >= '${start_date}'`;
      dateFilterSalaryPaymentsSimple = `AND DATE(payment_date) >= '${start_date}'`;
    } else if (end_date) {
      dateFilter = `AND DATE(created_at) <= '${end_date}'`;
      dateFilterSales = `AND DATE(s.created_at) <= '${end_date}'`;
      dateFilterCustomerOps = `AND DATE(cp.date) <= '${end_date}'`;
      dateFilterCustomerOpsSimple = `AND DATE(date) <= '${end_date}'`;
      dateFilterReturns = `AND DATE(r.created_at) <= '${end_date}'`;
      dateFilterExpenses = `AND DATE(e.created_at) <= '${end_date}'`;
      dateFilterSupplierOps = `AND DATE(sp.date) <= '${end_date}'`;
      dateFilterSupplierOpsSimple = `AND DATE(date) <= '${end_date}'`;
      dateFilterDebtorOps = `AND DATE(dop.date) <= '${end_date}'`;
      dateFilterDebtorOpsSimple = `AND DATE(date) <= '${end_date}'`;
      dateFilterSalaryPayments = `AND DATE(sp.payment_date) <= '${end_date}'`;
      dateFilterSalaryPaymentsSimple = `AND DATE(payment_date) <= '${end_date}'`;
    }

    let userFilter = '';
    if (created_by) {
      userFilter = `AND created_by = ${created_by}`;
    }

    try {
      // Get all income operations (only real payments)
      const [income] = await db.execute(`
        SELECT
          'sale' as type,
          s.id,
          (COALESCE(s.cash_amount, 0) + COALESCE(s.electronic_amount, 0)) as amount,
          s.customer_id as counterpart_id,
          c.full_name as counterpart_name,
          CASE
            WHEN s.payment_status = 'PAID' THEN 'Продажа (полная оплата)'
            WHEN s.payment_status = 'PARTIAL' THEN 'Продажа (частичная оплата)'
          END as description,
          s.created_at,
          'income' as flow_type
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.status = 1 AND s.payment_status IN ('PAID', 'PARTIAL') ${dateFilterSales} ${userFilter}

        UNION ALL

        SELECT
          'customer_payment' as type,
          cp.id,
          cp.sum as amount,
          cp.customer_id as counterpart_id,
          c.full_name as counterpart_name,
          'Оплата клиента' as description,
          cp.date as created_at,
          'income' as flow_type
        FROM customer_operations cp
        LEFT JOIN customers c ON cp.customer_id = c.id
        WHERE cp.status = 1 AND cp.type = 'PAYMENT' ${dateFilterCustomerOps} ${userFilter}

        UNION ALL

        SELECT
          'debtor_returned' as type,
          dop.id,
          dop.amount as amount,
          dop.debtor_id as counterpart_id,
          d.full_name as counterpart_name,
          'Возврат должника' as description,
          dop.date as created_at,
          'income' as flow_type
        FROM debtor_operations dop
        LEFT JOIN debtors d ON dop.debtor_id = d.id
        WHERE dop.status = 1 AND dop.type = 'RETURNED' ${dateFilterDebtorOps} ${userFilter}

        ORDER BY created_at DESC
      `);

      // Get all expense operations
      const [expenses] = await db.execute(`
        SELECT
          'return' as type,
          r.id,
          r.total_amount as amount,
          r.customer_id as counterpart_id,
          c.full_name as counterpart_name,
          'Возврат товара' as description,
          r.created_at,
          'expense' as flow_type
        FROM returns r
        LEFT JOIN customers c ON r.customer_id = c.id
        WHERE r.status = 1 ${dateFilterReturns} ${userFilter}

        UNION ALL

        SELECT
          'expense' as type,
          e.id,
          e.amount,
          NULL as counterpart_id,
          NULL as counterpart_name,
          e.description,
          e.created_at,
          'expense' as flow_type
        FROM expenses e
        WHERE e.status = 1 ${dateFilterExpenses} ${userFilter}

        UNION ALL

        SELECT
          'supplier_payment' as type,
          sp.id,
          sp.sum as amount,
          sp.supplier_id as counterpart_id,
          s.name as counterpart_name,
          'Оплата поставщику' as description,
          sp.date as created_at,
          'expense' as flow_type
        FROM supplier_operations sp
        LEFT JOIN suppliers s ON sp.supplier_id = s.id
        WHERE sp.status = 1 AND sp.type = 'PAYMENT' ${dateFilterSupplierOps} ${userFilter}

        UNION ALL

        SELECT
          'debtor_borrowed' as type,
          dop.id,
          dop.amount as amount,
          dop.debtor_id as counterpart_id,
          d.full_name as counterpart_name,
          'Выдача должнику' as description,
          dop.date as created_at,
          'expense' as flow_type
        FROM debtor_operations dop
        LEFT JOIN debtors d ON dop.debtor_id = d.id
        WHERE dop.status = 1 AND dop.type = 'BORROWED' ${dateFilterDebtorOps} ${userFilter}

        UNION ALL

        SELECT
          'salary_payment' as type,
          sp.id,
          sp.amount as amount,
          NULL as counterpart_id,
          NULL as counterpart_name,
          'Выплата зарплаты' as description,
          sp.payment_date as created_at,
          'expense' as flow_type
        FROM salary_payments sp
        WHERE sp.status = 1 ${dateFilterSalaryPayments} ${userFilter}

        ORDER BY created_at DESC
      `);

      // Combine all operations
      const allOperations = [...income, ...expenses].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      // Calculate totals
      const totalIncome = income.reduce((sum, op) => sum + parseFloat(op.amount), 0);
      const totalExpenses = expenses.reduce((sum, op) => sum + parseFloat(op.amount), 0);
      const netCashflow = totalIncome - totalExpenses;

      // If no specific user requested, get summary by all users
      let usersSummary = null;
      if (!created_by) {
        const [users] = await db.execute(`
          SELECT
            u.id,
            u.name,
            COALESCE(income.total_income, 0) as total_income,
            COALESCE(expenses.total_expenses, 0) as total_expenses,
            COALESCE(income.total_income, 0) - COALESCE(expenses.total_expenses, 0) as net_cashflow
          FROM users u
          LEFT JOIN (
            SELECT created_by, SUM(total_income) as total_income
            FROM (
              SELECT created_by, SUM(COALESCE(cash_amount, 0) + COALESCE(electronic_amount, 0)) as total_income
              FROM sales WHERE status = 1 AND payment_status IN ('PAID', 'PARTIAL') ${dateFilter}
              GROUP BY created_by
              UNION ALL
              SELECT created_by, SUM(sum) as total_income
              FROM customer_operations WHERE status = 1 AND type = 'PAYMENT' ${dateFilterCustomerOpsSimple}
              GROUP BY created_by
              UNION ALL
              SELECT created_by, SUM(amount) as total_income
              FROM debtor_operations WHERE status = 1 AND type = 'RETURNED' ${dateFilterDebtorOpsSimple}
              GROUP BY created_by
            ) income_operations
            GROUP BY created_by
          ) income ON u.id = income.created_by
          LEFT JOIN (
            SELECT created_by, SUM(total_expenses) as total_expenses
            FROM (
              SELECT created_by, SUM(total_amount) as total_expenses
              FROM returns WHERE status = 1 ${dateFilter}
              GROUP BY created_by
              UNION ALL
              SELECT created_by, SUM(amount) as total_expenses
              FROM expenses WHERE status = 1 ${dateFilter}
              GROUP BY created_by
              UNION ALL
              SELECT created_by, SUM(sum) as total_expenses
              FROM supplier_operations WHERE status = 1 AND type = 'PAYMENT' ${dateFilterSupplierOpsSimple}
              GROUP BY created_by
              UNION ALL
              SELECT created_by, SUM(amount) as total_expenses
              FROM debtor_operations WHERE status = 1 AND type = 'BORROWED' ${dateFilterDebtorOpsSimple}
              GROUP BY created_by
              UNION ALL
              SELECT created_by, SUM(amount) as total_expenses
              FROM salary_payments WHERE status = 1 ${dateFilterSalaryPaymentsSimple}
              GROUP BY created_by
            ) expense_operations
            GROUP BY created_by
          ) expenses ON u.id = expenses.created_by
          WHERE u.status = 1
          ORDER BY net_cashflow DESC
        `);

        usersSummary = users;
      }

      return {
        operations: allOperations,
        summary: {
          total_income: totalIncome,
          total_expenses: totalExpenses,
          net_cashflow: netCashflow,
          operations_count: allOperations.length
        },
        users_summary: usersSummary,
        filters: { start_date, end_date, created_by }
      };
    } catch (error) {
      console.error('Get user cashflow error:', error);
      throw error;
    }
  }
};

module.exports = userCashflowService;
