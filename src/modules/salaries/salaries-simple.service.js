const db = require('../../config/db');
const accountsService = require('../accounts/accounts.service');

const salariesSimpleService = {
  // Create salary for employee
  create: async ({ employee_id, month, year, total_amount }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Check if salary already exists for this employee, month, and year
      const [existing] = await connection.execute(
        'SELECT id FROM salaries WHERE employee_id = ? AND month = ? AND year = ? AND status = 1',
        [employee_id, month, year]
      );

      if (existing.length > 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Salary already exists for this employee, month, and year' };
      }

      const [result] = await connection.execute(
        'INSERT INTO salaries (employee_id, month, year, total_amount, status) VALUES (?, ?, ?, ?, ?)',
        [employee_id, month, year, total_amount, 1]
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

  // Create payment with custom date
  createPayment: async ({ salary_id, account_id, amount, payment_date, created_by }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Check if salary exists
      const [salaryRows] = await connection.execute(
        'SELECT total_amount FROM salaries WHERE id = ? AND status = 1',
        [salary_id]
      );

      if (salaryRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Salary not found' };
      }

      const [result] = await connection.execute(
        'INSERT INTO salary_payments (salary_id, account_id, amount, payment_date, created_by, status) VALUES (?, ?, ?, ?, ?, ?)',
        [salary_id, account_id, amount, payment_date, created_by, 1]
      );

      await connection.commit();
      
      // Create transaction for salary payment
      await accountsService.createSalaryTransaction({
        id: result.insertId,
        salary_id,
        amount,
        account_id
      });
      
      return { id: result.insertId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get all employees with their salary history and remaining amounts
  getAllEmployeesWithHistory: async () => {
    const [employees] = await db.execute(`
      SELECT 
        e.id as employee_id,
        e.full_name as employee_name
      FROM employees e
      WHERE e.status = 1
      ORDER BY e.full_name ASC
    `);

    // Get salary history for each employee
    for (const employee of employees) {
      const [salaries] = await db.execute(`
        SELECT 
          s.id as salary_id,
          s.month,
          s.year,
          s.total_amount,
          COALESCE(SUM(sp.amount), 0) as paid_amount,
          (s.total_amount - COALESCE(SUM(sp.amount), 0)) as remaining_amount,
          s.created_at
        FROM salaries s
        LEFT JOIN salary_payments sp ON s.id = sp.salary_id AND sp.status = 1
        WHERE s.employee_id = ? AND s.status = 1
        GROUP BY s.id, s.month, s.year, s.total_amount, s.created_at
        ORDER BY s.year DESC, s.month DESC
      `, [employee.employee_id]);

      // Get payment details for each salary
      for (const salary of salaries) {
        const [payments] = await db.execute(`
          SELECT sp.id, sp.amount, sp.payment_date, sp.created_at, u.name as created_by_name
          FROM salary_payments sp
          LEFT JOIN users u ON sp.created_by = u.id
          WHERE sp.salary_id = ? AND sp.status = 1
          ORDER BY sp.payment_date DESC
        `, [salary.salary_id]);

        salary.payments = payments;
      }

      employee.salaries = salaries;
      
      // Calculate total remaining amount
      employee.total_remaining = salaries.reduce((sum, salary) => sum + parseFloat(salary.remaining_amount), 0);
    }

    return employees;
  },

  // Оставляем для обратной совместимости
  getAllUsersWithHistory: async () => {
    return await salariesSimpleService.getAllEmployeesWithHistory();
  }
};

module.exports = salariesSimpleService;
