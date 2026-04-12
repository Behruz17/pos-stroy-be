const db = require('../../config/db');

const customerPaymentService = {
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT co.*, c.full_name as customer_name
      FROM customer_operations co
      JOIN customers c ON co.customer_id = c.id AND c.status = 1
      WHERE co.type = 'PAYMENT' AND co.status = 1
      ORDER BY co.date DESC
    `);
    return rows;
  },

  create: async ({ customer_id, sum, created_by }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!customer_id || !sum || sum <= 0) {
        return { error: 'Customer and positive sum are required' };
      }

      // Check customer exists
      const [customerRows] = await connection.execute(
        'SELECT id FROM customers WHERE id = ? AND status = 1',
        [customer_id]
      );
      if (customerRows.length === 0) {
        return { error: 'Customer not found' };
      }

      // Create payment record
      const [result] = await connection.execute(
        'INSERT INTO customer_operations (customer_id, sum, type, status) VALUES (?, ?, ?, ?)',
        [customer_id, sum, 'PAYMENT', 1]
      );

      // Decrease customer balance (payment reduces debt)
      await connection.execute(
        'UPDATE customers SET balance = balance - ? WHERE id = ? AND status = 1',
        [sum, customer_id]
      );

      await connection.commit();
      return { id: result.insertId, customer_id, sum: sum.toString(), type: 'PAYMENT' };
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
        'SELECT customer_id, sum, type FROM customer_operations WHERE id = ? AND status = 1',
        [id]
      );

      if (rows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Payment not found' };
      }

      const { customer_id, sum, type } = rows[0];

      if (type !== 'PAYMENT') {
        await connection.rollback();
        connection.release();
        return { error: 'Can only delete payment operations' };
      }

      // Restore customer balance
      await connection.execute(
        'UPDATE customers SET balance = balance + ? WHERE id = ? AND status = 1',
        [sum, customer_id]
      );

      await connection.execute('UPDATE customer_operations SET status = 0 WHERE id = ?', [id]);

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

module.exports = customerPaymentService;
