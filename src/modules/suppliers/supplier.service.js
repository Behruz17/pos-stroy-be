const db = require('../../config/db');

const supplierService = {
  getAll: async () => {
    const [rows] = await db.execute(
      'SELECT id, name, phone, balance, status, currency, created_at, updated_at FROM suppliers WHERE status = 1 ORDER BY name'
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(
      'SELECT id, name, phone, balance, status, currency, created_at, updated_at FROM suppliers WHERE id = ? AND status = 1',
      [id]
    );

    if (rows.length === 0) {
      return { error: 'Supplier not found' };
    }

    return rows[0];
  },

  create: async ({ name, phone, currency }) => {
    const [result] = await db.execute(
      'INSERT INTO suppliers (name, phone, currency, status) VALUES (?, ?, ?, ?)',
      [name, phone || null, currency, 1]
    );

    const [newSupplier] = await db.execute(
      'SELECT id, name, phone, balance, status, currency, created_at, updated_at FROM suppliers WHERE id = ? AND status = 1',
      [result.insertId]
    );

    return newSupplier[0];
  },

  update: async (id, { name, phone, currency }) => {
    const [result] = await db.execute(
      'UPDATE suppliers SET name = ?, phone = ?, currency = ? WHERE id = ? AND status = 1',
      [name, phone || null, currency || 'somoni', id]
    );

    if (result.affectedRows === 0) {
      return { error: 'Supplier not found' };
    }

    const [updatedSupplier] = await db.execute(
      'SELECT id, name, phone, balance, status, currency, created_at, updated_at FROM suppliers WHERE id = ? AND status = 1',
      [id]
    );

    return updatedSupplier[0];
  },

  remove: async (id) => {
    const [result] = await db.execute(
      'UPDATE suppliers SET status = 0 WHERE id = ? AND status = 1',
      [id]
    );

    if (result.affectedRows === 0) {
      return { error: 'Supplier not found' };
    }

    return { success: true };
  }
};

module.exports = supplierService;
