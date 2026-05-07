const db = require('../../config/db');
const accountsService = require('../accounts/accounts.service');

const expenseService = {
  getAll: async (filters = {}) => {
    let query = `
      SELECT e.*, u.name as created_by_name, er.name as recipient_name, er.display_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN (
        SELECT 
          er.id,
          er.name,
          CASE 
            WHEN er.type = 'employee' THEN emp.full_name
            ELSE er.name
          END as display_name
        FROM expense_recipients er
        LEFT JOIN employees emp ON er.type = 'employee' AND er.reference_id = emp.id AND emp.status = 1
        WHERE er.status = 1
      ) er ON e.recipient_id = er.id
      WHERE e.status = 1
    `;
    const params = [];

    // Add recipient_id filter
    if (filters.recipient_id) {
      query += ' AND e.recipient_id = ?';
      params.push(filters.recipient_id);
    }

    // Add created_by filter
    if (filters.created_by) {
      query += ' AND e.created_by = ?';
      params.push(filters.created_by);
    }

    // Add date filter
    if (filters.date) {
      query += ' AND e.expense_date = ?';
      params.push(filters.date);
    }

    // Add month filter
    if (filters.month) {
      query += ' AND MONTH(e.expense_date) = ?';
      params.push(filters.month);
    }

    // Add year filter
    if (filters.year) {
      query += ' AND YEAR(e.expense_date) = ?';
      params.push(filters.year);
    }

    query += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    const [rows] = await db.execute(query, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT e.*, u.name as created_by_name, er.name as recipient_name, er.display_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN (
        SELECT 
          er.id,
          er.name,
          CASE 
            WHEN er.type = 'employee' THEN emp.full_name
            ELSE er.name
          END as display_name
        FROM expense_recipients er
        LEFT JOIN employees emp ON er.type = 'employee' AND er.reference_id = emp.id AND emp.status = 1
        WHERE er.status = 1
      ) er ON e.recipient_id = er.id
      WHERE e.id = ? AND e.status = 1
    `, [id]);

    if (rows.length === 0) {
      return { error: 'Expense not found' };
    }

    return rows[0];
  },

  create: async ({ description, account_id, amount, expense_date, recipient_id, created_by }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!description || !amount || amount <= 0 || !expense_date) {
        return { error: 'Description, positive amount and expense date are required' };
      }

      const [result] = await connection.execute(
        'INSERT INTO expenses (description, account_id, amount, expense_date, recipient_id, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [description, account_id, amount, expense_date, recipient_id || null, created_by, 1]
      );

      await connection.commit();
      
      // Create transaction for expense
      await accountsService.createExpenseTransaction({
        id: result.insertId,
        amount,
        account_id
      });
      
      return { 
        id: result.insertId, 
        description, 
        amount: amount.toString(), 
        expense_date,
        recipient_id,
        created_by 
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  update: async (id, { description, amount, expense_date, recipient_id }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Check if expense exists
      const [expenseRows] = await connection.execute(
        'SELECT id FROM expenses WHERE id = ? AND status = 1',
        [id]
      );

      if (expenseRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Expense not found' };
      }

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (amount !== undefined && amount > 0) {
        updates.push('amount = ?');
        values.push(amount);
      }
      if (expense_date !== undefined) {
        updates.push('expense_date = ?');
        values.push(expense_date);
      }
      if (recipient_id !== undefined) {
        updates.push('recipient_id = ?');
        values.push(recipient_id);
      }

      if (updates.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'No fields to update' };
      }

      values.push(id);

      const [result] = await connection.execute(
        `UPDATE expenses SET ${updates.join(', ')} WHERE id = ? AND status = 1`,
        values
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Expense not found' };
      }

      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  remove: async (id) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [rows] = await connection.execute(
        'SELECT id FROM expenses WHERE id = ? AND status = 1',
        [id]
      );

      if (rows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Expense not found' };
      }

      await connection.execute('UPDATE expenses SET status = 0 WHERE id = ?', [id]);

      // Deactivate related transactions
      await accountsService.deactivateTransactions(connection, 'EXPENSE', id);

      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = expenseService;
