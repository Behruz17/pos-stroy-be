const db = require('../../config/db');

const customerService = {
  getAll: async () => {
    const [rows] = await db.execute(
      'SELECT id, full_name, phone, balance, created_at, updated_at, status FROM customers WHERE status = 1 ORDER BY full_name'
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(
      'SELECT id, full_name, phone, balance, created_at, updated_at, status FROM customers WHERE id = ? AND status = 1',
      [id]
    );

    if (rows.length === 0) {
      return { error: 'Customer not found' };
    }

    return rows[0];
  },

  create: async ({ full_name, phone }) => {
    const [result] = await db.execute(
      'INSERT INTO customers (full_name, phone, status) VALUES (?, ?, ?)',
      [full_name, phone || null, 1]
    );

    const [newCustomer] = await db.execute(
      'SELECT id, full_name, phone, balance, created_at, updated_at, status FROM customers WHERE id = ? AND status = 1',
      [result.insertId]
    );

    return newCustomer[0];
  },

  update: async (id, { full_name, phone }) => {
    const [result] = await db.execute(
      'UPDATE customers SET full_name = ?, phone = ? WHERE id = ? AND status = 1',
      [full_name, phone || null, id]
    );

    if (result.affectedRows === 0) {
      return { error: 'Customer not found' };
    }

    const [updatedCustomer] = await db.execute(
      'SELECT id, full_name, phone, balance, created_at, updated_at, status FROM customers WHERE id = ? AND status = 1',
      [id]
    );

    return updatedCustomer[0];
  },

  remove: async (id) => {
    const [result] = await db.execute(
      'UPDATE customers SET status = 0 WHERE id = ? AND status = 1',
      [id]
    );

    if (result.affectedRows === 0) {
      return { error: 'Customer not found' };
    }

    return { success: true };
  },

  getDefaultCustomer: async () => {
    const [rows] = await db.execute(
      'SELECT id, full_name, phone, balance, created_at, updated_at, status FROM customers WHERE is_default = 1 AND status = 1 LIMIT 1'
    );

    if (rows.length === 0) {
      return { error: 'Default customer not found' };
    }

    return rows[0];
  },

  setDefaultCustomer: async (id) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Сначала сбросить все флаги is_default
      await connection.execute(
        'UPDATE customers SET is_default = 0 WHERE status = 1'
      );

      // Установить новый клиент по умолчанию
      const [result] = await connection.execute(
        'UPDATE customers SET is_default = 1 WHERE id = ? AND status = 1',
        [id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Customer not found' };
      }

      await connection.commit();
      connection.release();

      const [defaultCustomer] = await db.execute(
        'SELECT id, full_name, phone, balance, created_at, updated_at, status FROM customers WHERE id = ? AND status = 1',
        [id]
      );

      return defaultCustomer[0];
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }
};

module.exports = customerService;
