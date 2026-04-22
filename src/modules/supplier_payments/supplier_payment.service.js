const db = require('../../config/db');
const accountsService = require('../accounts/accounts.service');

const supplierPaymentService = {
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT so.*, s.name as supplier_name
      FROM supplier_operations so
      JOIN suppliers s ON so.supplier_id = s.id AND s.status = 1
      WHERE so.type = 'PAYMENT' AND so.status = 1
      ORDER BY so.date DESC
    `);
    return rows;
  },

  create: async ({ supplier_id, account_id, sum, created_by }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!supplier_id || !sum || sum <= 0) {
        return { error: 'Supplier and positive sum are required' };
      }

      // Check supplier exists
      const [supplierRows] = await connection.execute(
        'SELECT id FROM suppliers WHERE id = ? AND status = 1',
        [supplier_id]
      );
      if (supplierRows.length === 0) {
        return { error: 'Supplier not found' };
      }

      // Create payment record
      const [result] = await connection.execute(
        'INSERT INTO supplier_operations (supplier_id, account_id, sum, type, status) VALUES (?, ?, ?, ?, ?)',
        [supplier_id, account_id, sum, 'PAYMENT', 1]
      );

      // Decrease supplier balance (payment reduces debt)
      await connection.execute(
        'UPDATE suppliers SET balance = balance - ? WHERE id = ? AND status = 1',
        [sum, supplier_id]
      );

      await connection.commit();
      
      // Create transaction for supplier payment
      await accountsService.createSupplierPaymentTransaction({
        id: result.insertId,
        amount: sum,
        account_id
      });
      
      return { id: result.insertId, supplier_id, sum: sum.toString(), type: 'PAYMENT' };
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
        'SELECT supplier_id, sum, type FROM supplier_operations WHERE id = ? AND status = 1',
        [id]
      );

      if (rows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Payment not found' };
      }

      const { supplier_id, sum, type } = rows[0];

      if (type !== 'PAYMENT') {
        await connection.rollback();
        connection.release();
        return { error: 'Can only delete payment operations' };
      }

      // Restore supplier balance
      await connection.execute(
        'UPDATE suppliers SET balance = balance + ? WHERE id = ? AND status = 1',
        [sum, supplier_id]
      );

      await connection.execute('UPDATE supplier_operations SET status = 0 WHERE id = ?', [id]);

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

module.exports = supplierPaymentService;
