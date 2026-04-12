const db = require('../../config/db');

const returnsService = {
  getAll: async ({ date, month, year } = {}) => {
    let query = `
      SELECT r.*, c.full_name as customer_name
      FROM returns r
      LEFT JOIN customers c ON r.customer_id = c.id AND c.status = 1
      WHERE r.status = 1
    `;
    const params = [];

    if (date) {
      // Filter by specific date (YYYY-MM-DD)
      query += ' AND DATE(r.created_at) = ?';
      params.push(date);
    } else if (month && year) {
      // Filter by month and year
      query += ' AND MONTH(r.created_at) = ? AND YEAR(r.created_at) = ?';
      params.push(month, year);
    } else if (year) {
      // Filter by year only
      query += ' AND YEAR(r.created_at) = ?';
      params.push(year);
    }

    query += ' ORDER BY r.created_at DESC';

    const [rows] = await db.execute(query, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT r.*, c.full_name as customer_name
      FROM returns r
      LEFT JOIN customers c ON r.customer_id = c.id AND c.status = 1
      WHERE r.id = ? AND r.status = 1
    `, [id]);

    if (rows.length === 0) {
      return { error: 'Return not found' };
    }

    const returnRecord = rows[0];

    const [items] = await db.execute(`
      SELECT ri.*, p.name as product_name, p.product_code
      FROM return_items ri
      JOIN products p ON ri.product_id = p.id AND p.status = 1
      WHERE ri.return_id = ? AND ri.status = 1
    `, [id]);

    returnRecord.items = items;
    return returnRecord;
  },

  create: async ({ created_by, customer_id, items }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!customer_id) {
        return { error: 'Customer ID is required' };
      }

      if (!items || items.length === 0) {
        return { error: 'Items are required' };
      }

      // Check customer exists
      const [customerRows] = await connection.execute(
        'SELECT id FROM customers WHERE id = ? AND status = 1',
        [customer_id]
      );
      if (customerRows.length === 0) {
        return { error: 'Customer not found' };
      }

      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.unit_price;
      }

      const [returnResult] = await connection.execute(
        'INSERT INTO returns (customer_id, total_amount, created_by, status) VALUES (?, ?, ?, ?)',
        [customer_id, totalAmount, created_by, 1]
      );
      const returnId = returnResult.insertId;

      for (const item of items) {
        const itemTotal = item.quantity * item.unit_price;
        await connection.execute(
          'INSERT INTO return_items (return_id, product_id, quantity, unit_price, total_price, status) VALUES (?, ?, ?, ?, ?, ?)',
          [returnId, item.product_id, item.quantity, item.unit_price, itemTotal, 1]
        );

        // Increase stock
        await connection.execute(
          'INSERT INTO stock (product_id, quantity) VALUES (?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)',
          [item.product_id, item.quantity]
        );
      }

      // Update customer balance (return reduces customer debt)
      await connection.execute(
        'UPDATE customers SET balance = balance - ? WHERE id = ? AND status = 1',
        [totalAmount, customer_id]
      );

      // Create customer operation record
      await connection.execute(
        'INSERT INTO customer_operations (customer_id, sum, type, status) VALUES (?, ?, ?, ?)',
        [customer_id, totalAmount, 'RETURN', 1]
      );

      await connection.commit();
      return { id: returnId, total_amount: totalAmount.toString() };
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

      const [returnRows] = await connection.execute(
        'SELECT customer_id, total_amount FROM returns WHERE id = ? AND status = 1',
        [id]
      );

      if (returnRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Return not found' };
      }

      const { customer_id, total_amount } = returnRows[0];

      const [itemRows] = await connection.execute(
        'SELECT product_id, quantity FROM return_items WHERE return_id = ? AND status = 1',
        [id]
      );

      // Decrease stock
      for (const item of itemRows) {
        await connection.execute(
          'UPDATE stock SET quantity = quantity - ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Restore customer balance
      await connection.execute(
        'UPDATE customers SET balance = balance + ? WHERE id = ? AND status = 1',
        [total_amount, customer_id]
      );

      await connection.execute('UPDATE return_items SET status = 0 WHERE return_id = ?', [id]);
      await connection.execute('UPDATE returns SET status = 0 WHERE id = ?', [id]);

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

module.exports = returnsService;
