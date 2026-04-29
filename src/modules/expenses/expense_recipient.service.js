const db = require('../../config/db');

const expenseRecipientService = {
  // Получить всех получателей расходов
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT er.id, er.name, er.type, er.reference_id, er.status, er.created_at,
             CASE 
               WHEN er.type = 'employee' THEN emp.full_name
               ELSE er.name
             END as display_name
      FROM expense_recipients er
      LEFT JOIN employees emp ON er.type = 'employee' AND er.reference_id = emp.id AND emp.status = 1
      WHERE er.status = 1
      ORDER BY er.type ASC, er.name ASC
    `);
    return rows;
  },

  // Получить получателя по ID
  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT er.id, er.name, er.type, er.reference_id, er.status, er.created_at,
             CASE 
               WHEN er.type = 'employee' THEN emp.full_name
               ELSE er.name
             END as display_name
      FROM expense_recipients er
      LEFT JOIN employees emp ON er.type = 'employee' AND er.reference_id = emp.id AND emp.status = 1
      WHERE er.id = ? AND er.status = 1
    `, [id]);

    if (rows.length === 0) {
      return { error: 'Expense recipient not found' };
    }

    return rows[0];
  },

  // Создать получателя расходов
  create: async ({ name, type, reference_id }) => {
    if (!name) {
      return { error: 'Name is required' };
    }

    if (!['employee', 'other'].includes(type)) {
      return { error: 'Type must be either "employee" or "other"' };
    }

    if (type === 'employee' && !reference_id) {
      return { error: 'Reference ID is required for employee type' };
    }

    const [result] = await db.execute(
      'INSERT INTO expense_recipients (name, type, reference_id, status) VALUES (?, ?, ?, ?)',
      [name, type, reference_id || null, 1]
    );

    const [newRecipient] = await db.execute(
      'SELECT id, name, type, reference_id, status, created_at FROM expense_recipients WHERE id = ? AND status = 1',
      [result.insertId]
    );

    return newRecipient[0];
  },

  // Обновить получателя расходов
  update: async (id, { name, type, reference_id }) => {
    const updates = [];
    const values = [];

    if (name !== undefined) {
      if (!name) {
        return { error: 'Name is required' };
      }
      updates.push('name = ?');
      values.push(name);
    }

    if (type !== undefined) {
      if (!['employee', 'other'].includes(type)) {
        return { error: 'Type must be either "employee" or "other"' };
      }
      updates.push('type = ?');
      values.push(type);
    }

    if (reference_id !== undefined) {
      updates.push('reference_id = ?');
      values.push(reference_id);
    }

    if (updates.length === 0) {
      return { error: 'No fields to update' };
    }

    values.push(id);
    const [result] = await db.execute(
      `UPDATE expense_recipients SET ${updates.join(', ')} WHERE id = ? AND status = 1`,
      values
    );

    if (result.affectedRows === 0) {
      return { error: 'Expense recipient not found' };
    }

    const [updatedRecipient] = await db.execute(
      'SELECT id, name, type, reference_id, status, created_at FROM expense_recipients WHERE id = ? AND status = 1',
      [id]
    );

    return updatedRecipient[0];
  },

  // Удалить получателя расходов (мягкое удаление)
  remove: async (id) => {
    const [result] = await db.execute(
      'UPDATE expense_recipients SET status = 0 WHERE id = ? AND status = 1',
      [id]
    );

    if (result.affectedRows === 0) {
      return { error: 'Expense recipient not found' };
    }

    return { success: true };
  },

  // Синхронизировать сотрудников с получателями расходов
  syncEmployees: async () => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Получить всех активных сотрудников
      const [employees] = await connection.execute(
        'SELECT id, full_name FROM employees WHERE status = 1'
      );

      // Получить существующих получателей-сотрудников
      const [existingRecipients] = await connection.execute(
        'SELECT reference_id FROM expense_recipients WHERE type = "employee" AND status = 1'
      );

      const existingIds = existingRecipients.map(r => r.reference_id);

      // Добавить новых сотрудников
      for (const employee of employees) {
        if (!existingIds.includes(employee.id)) {
          await connection.execute(
            'INSERT INTO expense_recipients (name, type, reference_id, status) VALUES (?, "employee", ?, 1)',
            [employee.full_name, employee.id]
          );
        }
      }

      // Удалить получателей для уволенных сотрудников
      const employeeIds = employees.map(e => e.id);
      for (const recipient of existingRecipients) {
        if (!employeeIds.includes(recipient.reference_id)) {
          await connection.execute(
            'UPDATE expense_recipients SET status = 0 WHERE type = "employee" AND reference_id = ?',
            [recipient.reference_id]
          );
        }
      }

      await connection.commit();
      return { success: true, synced_count: employees.length };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = expenseRecipientService;
