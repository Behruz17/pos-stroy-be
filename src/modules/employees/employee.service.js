const db = require('../../config/db');

const employeeService = {
  // Получить всех сотрудников
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT id, full_name, status
      FROM employees 
      WHERE status = 1 
      ORDER BY full_name ASC
    `);
    return rows;
  },

  // Получить сотрудника по ID
  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT id, full_name, status
      FROM employees 
      WHERE id = ? AND status = 1
    `, [id]);

    if (rows.length === 0) {
      return { error: 'Employee not found' };
    }

    return rows[0];
  },

  // Создать сотрудника
  create: async ({ full_name }) => {
    if (!full_name) {
      return { error: 'Full name is required' };
    }

    const [result] = await db.execute(
      'INSERT INTO employees (full_name, status) VALUES (?, ?)',
      [full_name, 1]
    );

    const [newEmployee] = await db.execute(
      'SELECT id, full_name, status FROM employees WHERE id = ? AND status = 1',
      [result.insertId]
    );

    return newEmployee[0];
  },

  // Обновить сотрудника
  update: async (id, { full_name }) => {
    if (full_name !== undefined) {
      if (!full_name) {
        return { error: 'Full name is required' };
      }

      const [result] = await db.execute(
        'UPDATE employees SET full_name = ? WHERE id = ? AND status = 1',
        [full_name, id]
      );

      if (result.affectedRows === 0) {
        return { error: 'Employee not found' };
      }

      const [updatedEmployee] = await db.execute(
        'SELECT id, full_name, status FROM employees WHERE id = ? AND status = 1',
        [id]
      );

      return updatedEmployee[0];
    }

    return { error: 'No fields to update' };
  },

  // Удалить сотрудника (мягкое удаление)
  remove: async (id) => {
    const [result] = await db.execute(
      'UPDATE employees SET status = 0 WHERE id = ? AND status = 1',
      [id]
    );

    if (result.affectedRows === 0) {
      return { error: 'Employee not found' };
    }

    return { success: true };
  },

  // Получить сотрудников с историей зарплат
  getEmployeesWithSalaryHistory: async () => {
    const [employees] = await db.execute(`
      SELECT id, full_name, status
      FROM employees 
      WHERE status = 1 
      ORDER BY full_name ASC
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
      `, [employee.id]);

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
  }
};

module.exports = employeeService;
