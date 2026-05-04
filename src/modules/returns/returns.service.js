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
      SELECT ri.*, p.name as product_name, p.product_code, p.type as product_type,
             si.batch_code
      FROM return_items ri
      JOIN products p ON ri.product_id = p.id AND p.status = 1
      LEFT JOIN stock_items si ON ri.stock_item_id = si.id AND si.status = 1
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
        const unitValue = item.unit_value || 1.0;
        totalAmount += item.quantity * item.unit_price * unitValue;
      }

      const [returnResult] = await connection.execute(
        'INSERT INTO returns (customer_id, total_amount, created_by, status) VALUES (?, ?, ?, ?)',
        [customer_id, totalAmount, created_by, 1]
      );
      const returnId = returnResult.insertId;

      for (const item of items) {
        const unitValue = item.unit_value || 1.0;
        const itemTotal = item.quantity * item.unit_price * unitValue;
        
        // Определяем тип продукта и обрабатываем соответственно
        const [productRows] = await connection.execute(
          'SELECT type FROM products WHERE id = ? AND status = 1',
          [item.product_id]
        );
        
        if (productRows.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        
        const productType = productRows[0].type;
        let stockItemId = null;
        
        if (productType === 'batch' && item.stock_item_id) {
          // Для партийных товаров - проверяем существование партии
          const [batchRows] = await connection.execute(
            'SELECT id FROM stock_items WHERE id = ? AND product_id = ? AND status = 1',
            [item.stock_item_id, item.product_id]
          );
          
          if (batchRows.length === 0) {
            throw new Error(`Batch ${item.stock_item_id} not found for product ${item.product_id}`);
          }
          
          stockItemId = item.stock_item_id;
          
          // Увеличиваем количество в конкретной партии
          const unitValue = item.unit_value || 1.0;
          const realQuantity = item.quantity * unitValue;
          
          await connection.execute(
            'UPDATE stock_items SET quantity = quantity + ? WHERE id = ?',
            [realQuantity, stockItemId]
          );
          
          // Также обновляем общий склад для партионных товаров
          await connection.execute(
            'INSERT INTO stock (product_id, quantity) VALUES (?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)',
            [item.product_id, realQuantity]
          );
          
        } else if (productType === 'simple') {
          // Для простых товаров - работаем с общим складом
          const unitValue = item.unit_value || 1.0;
          const realQuantity = item.quantity * unitValue;
          
          await connection.execute(
            'INSERT INTO stock (product_id, quantity) VALUES (?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)',
            [item.product_id, realQuantity]
          );
        } else if (productType === 'batch' && !item.stock_item_id) {
          throw new Error(`stock_item_id is required for batch product ${item.product_id}`);
        }
        
        await connection.execute(
          'INSERT INTO return_items (return_id, product_id, stock_item_id, quantity, unit_value, unit_price, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [returnId, item.product_id, stockItemId, item.quantity, item.unit_value || 1.0, item.unit_price, itemTotal, 1]
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
        'SELECT product_id, quantity, stock_item_id, unit_value FROM return_items WHERE return_id = ? AND status = 1',
        [id]
      );

      // Decrease stock - обрабатываем в зависимости от типа
      for (const item of itemRows) {
        const unitValue = item.unit_value || 1.0;
        const realQuantity = item.quantity * unitValue;
        
        if (item.stock_item_id) {
          // Для партийных товаров - уменьшаем количество в партии
          await connection.execute(
            'UPDATE stock_items SET quantity = quantity - ? WHERE id = ?',
            [realQuantity, item.stock_item_id]
          );
          
          // Также уменьшаем общий склад для партионных товаров
          await connection.execute(
            'UPDATE stock SET quantity = quantity - ? WHERE product_id = ?',
            [realQuantity, item.product_id]
          );
        } else {
          // Для простых товаров - уменьшаем общий склад
          await connection.execute(
            'UPDATE stock SET quantity = quantity - ? WHERE product_id = ?',
            [realQuantity, item.product_id]
          );
        }
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
