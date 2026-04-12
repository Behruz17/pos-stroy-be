const db = require('../../config/db');

const salesService = {
  getAll: async ({ date, month, year } = {}) => {
    let query = `
      SELECT s.*, c.full_name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id AND c.status = 1
      WHERE s.status = 1
    `;
    const params = [];

    if (date) {
      // Filter by specific date (YYYY-MM-DD)
      query += ' AND DATE(s.created_at) = ?';
      params.push(date);
    } else if (month && year) {
      // Filter by month and year
      query += ' AND MONTH(s.created_at) = ? AND YEAR(s.created_at) = ?';
      params.push(month, year);
    } else if (year) {
      // Filter by year only
      query += ' AND YEAR(s.created_at) = ?';
      params.push(year);
    }

    query += ' ORDER BY s.created_at DESC';

    const [rows] = await db.execute(query, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT s.*, c.full_name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id AND c.status = 1
      WHERE s.id = ? AND s.status = 1
    `, [id]);

    if (rows.length === 0) {
      return { error: 'Sale not found' };
    }

    const sale = rows[0];

    const [items] = await db.execute(`
      SELECT si.*, p.name as product_name, p.product_code
      FROM sale_items si
      JOIN products p ON si.product_id = p.id AND p.status = 1
      WHERE si.sale_id = ? AND si.status = 1
    `, [id]);

    sale.items = items;
    return sale;
  },

  create: async ({ created_by, customer_id, payment_status, items }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!items || items.length === 0) {
        return { error: 'Items are required' };
      }

      for (const item of items) {
        const [stockRows] = await connection.execute(
          'SELECT quantity FROM stock WHERE product_id = ?',
          [item.product_id]
        );
        const available = stockRows.length > 0 ? parseFloat(stockRows[0].quantity) : 0;
        if (available < item.quantity) {
          return { error: `Insufficient stock for product ${item.product_id}` };
        }
      }

      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.unit_price;
      }

      const [saleResult] = await connection.execute(
        'INSERT INTO sales (customer_id, total_amount, created_by, payment_status, status) VALUES (?, ?, ?, ?, ?)',
        [customer_id || null, totalAmount, created_by, payment_status || 'DEBT', 1]
      );
      const saleId = saleResult.insertId;

      for (const item of items) {
        const itemTotal = item.quantity * item.unit_price;
        await connection.execute(
          'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price, status) VALUES (?, ?, ?, ?, ?, ?)',
          [saleId, item.product_id, item.quantity, item.unit_price, itemTotal, 1]
        );

        await connection.execute(
          'UPDATE stock SET quantity = quantity - ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }

      if (customer_id) {
        if (payment_status === 'DEBT') {
          await connection.execute(
            'UPDATE customers SET balance = balance + ? WHERE id = ? AND status = 1',
            [totalAmount, customer_id]
          );

          await connection.execute(
            'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status) VALUES (?, ?, ?, ?, ?)',
            [customer_id, saleId, totalAmount, 'DEBT', 1]
          );
        } else {
          await connection.execute(
            'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status) VALUES (?, ?, ?, ?, ?)',
            [customer_id, saleId, totalAmount, 'PAID', 1]
          );
        }
      }

      await connection.commit();
      return { id: saleId, total_amount: totalAmount.toString() };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  update: async (id, { customer_id, payment_status, items }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Get existing sale
      const [existingSale] = await connection.execute(
        'SELECT * FROM sales WHERE id = ? AND status = 1',
        [id]
      );

      if (existingSale.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Sale not found' };
      }

      const sale = existingSale[0];

      // Get existing items
      const [existingItems] = await connection.execute(
        'SELECT * FROM sale_items WHERE sale_id = ? AND status = 1',
        [id]
      );

      // Calculate new total amount if items provided
      let newTotalAmount = sale.total_amount;
      if (items && items.length > 0) {
        newTotalAmount = 0;
        for (const item of items) {
          const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
          newTotalAmount += itemTotal;
        }
      }

      // Update sale
      const updates = [];
      const values = [];

      if (customer_id !== undefined) {
        updates.push('customer_id = ?');
        values.push(customer_id || null);
      }
      if (payment_status !== undefined) {
        updates.push('payment_status = ?');
        values.push(payment_status);
      }
      if (items && items.length > 0) {
        updates.push('total_amount = ?');
        values.push(newTotalAmount);
      }

      if (updates.length > 0) {
        values.push(id);
        await connection.execute(
          `UPDATE sales SET ${updates.join(', ')} WHERE id = ? AND status = 1`,
          values
        );
      }

      // Handle customer balance changes
      let oldCustomerBalanceChange = 0;
      let newCustomerBalanceChange = 0;

      if (sale.customer_id && sale.payment_status === 'DEBT') {
        oldCustomerBalanceChange = sale.total_amount;
      }

      if (customer_id !== undefined ? customer_id : sale.customer_id) {
        const finalPaymentStatus = payment_status !== undefined ? payment_status : sale.payment_status;
        if (finalPaymentStatus === 'DEBT') {
          newCustomerBalanceChange = newTotalAmount;
        }
      }

      // Update customer balances
      if (sale.customer_id && oldCustomerBalanceChange > 0) {
        await connection.execute(
          'UPDATE customers SET balance = balance - ? WHERE id = ? AND status = 1',
          [oldCustomerBalanceChange, sale.customer_id]
        );
      }

      if ((customer_id !== undefined ? customer_id : sale.customer_id) && newCustomerBalanceChange > 0) {
        const finalCustomerId = customer_id !== undefined ? customer_id : sale.customer_id;
        await connection.execute(
          'UPDATE customers SET balance = balance + ? WHERE id = ? AND status = 1',
          [newCustomerBalanceChange, finalCustomerId]
        );
      }

      // Update customer operations
      if (customer_id !== undefined || payment_status !== undefined || (items && items.length > 0)) {
        // Update old operations for this sale
        await connection.execute(
          'UPDATE customer_operations SET status = 0 WHERE sale_id = ?',
          [id]
        );

        const finalCustomerId = customer_id !== undefined ? customer_id : sale.customer_id;
        const finalPaymentStatus = payment_status !== undefined ? payment_status : sale.payment_status;

        if (finalCustomerId) {
          if (finalPaymentStatus === 'DEBT') {
            await connection.execute(
              'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status) VALUES (?, ?, ?, ?, ?)',
              [finalCustomerId, id, newTotalAmount, 'DEBT', 1]
            );
          } else {
            await connection.execute(
              'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status) VALUES (?, ?, ?, ?, ?)',
              [finalCustomerId, id, newTotalAmount, 'PAID', 1]
            );
          }
        }
      }

      // Update items if provided
      if (items && items.length > 0) {
        // Restore stock for old items
        for (const item of existingItems) {
          await connection.execute(
            'UPDATE stock SET quantity = quantity + ? WHERE product_id = ?',
            [item.quantity, item.product_id]
          );
        }

        // Mark old items as deleted
        await connection.execute('UPDATE sale_items SET status = 0 WHERE sale_id = ?', [id]);

        // Add new items and update stock
        for (const item of items) {
          const itemTotal = item.quantity * item.unit_price;
          await connection.execute(
            'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price, status) VALUES (?, ?, ?, ?, ?, ?)',
            [id, item.product_id, item.quantity, item.unit_price, itemTotal, 1]
          );

          await connection.execute(
            'UPDATE stock SET quantity = quantity - ? WHERE product_id = ?',
            [item.quantity, item.product_id]
          );
        }
      }

      await connection.commit();
      return { id, total_amount: newTotalAmount.toString() };
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

      const [saleRows] = await connection.execute(
        'SELECT customer_id, total_amount, payment_status FROM sales WHERE id = ? AND status = 1',
        [id]
      );

      if (saleRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Sale not found' };
      }

      const { customer_id, total_amount, payment_status } = saleRows[0];

      const [itemRows] = await connection.execute(
        'SELECT product_id, quantity FROM sale_items WHERE sale_id = ? AND status = 1',
        [id]
      );

      for (const item of itemRows) {
        await connection.execute(
          'UPDATE stock SET quantity = quantity + ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }

      if (customer_id && payment_status === 'DEBT') {
        await connection.execute(
          'UPDATE customers SET balance = balance - ? WHERE id = ? AND status = 1',
          [total_amount, customer_id]
        );
      }

      await connection.execute('UPDATE customer_operations SET status = 0 WHERE sale_id = ?', [id]);
      await connection.execute('UPDATE sale_items SET status = 0 WHERE sale_id = ?', [id]);
      await connection.execute('UPDATE sales SET status = 0 WHERE id = ?', [id]);

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

module.exports = salesService;
