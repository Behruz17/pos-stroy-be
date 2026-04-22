const db = require('../../config/db');
const accountsService = require('../accounts/accounts.service');

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

  create: async ({ created_by, customer_id, payment_status, paid_amount, stage, account_id, debt_deadline, items }) => {
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
        const unitValue = item.unit_value || 1.0;
        totalAmount += item.quantity * item.unit_price * unitValue;
      }

      // Calculate paid_amount based on payment_status
      const finalPaidAmount = payment_status === 'PARTIAL' ? (paid_amount || 0) : 
                              payment_status === 'PAID' ? totalAmount : 0;
      
      // Validate stage
      const validStages = ['ordered', 'ready', 'delivered'];
      const finalStage = stage && validStages.includes(stage) ? stage : 'ordered';
      
      const [saleResult] = await connection.execute(
        'INSERT INTO sales (customer_id, created_by, total_amount, paid_amount, payment_status, stage, debt_deadline, account_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [customer_id || null, created_by, totalAmount, finalPaidAmount, payment_status ? payment_status : 'DEBT', finalStage, debt_deadline || null, account_id || null, 1]
      );
      const saleId = saleResult.insertId;

      for (const item of items) {
        const unitValue = item.unit_value || 1.0;
        const itemTotal = item.quantity * item.unit_price * unitValue;
        await connection.execute(
          'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, unit_value, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [saleId, item.product_id, item.quantity, item.unit_price, unitValue, itemTotal, 1]
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
        } else if (payment_status === 'PARTIAL') {
          await connection.execute(
            'UPDATE customers SET balance = balance + ? WHERE id = ? AND status = 1',
            [totalAmount, customer_id]
          );

          await connection.execute(
            'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status) VALUES (?, ?, ?, ?, ?)',
            [customer_id, saleId, totalAmount, 'PARTIAL', 1]
          );
        } else {
          await connection.execute(
            'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status) VALUES (?, ?, ?, ?, ?)',
            [customer_id, saleId, totalAmount, 'PAID', 1]
          );
        }
      }

      await connection.commit();
      
      // Create transaction for paid and partially paid sales
      if (payment_status === 'PAID' || payment_status === 'PARTIAL') {
        await accountsService.createSaleTransaction({
          id: saleId,
          total_amount: totalAmount,
          payment_status,
          account_id
        });
      }
      
      return { id: saleId, total_amount: totalAmount.toString() };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  update: async (id, { customer_id, payment_status, paid_amount, debt_deadline, items }) => {
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
          const unitValue = item.unit_value || 1.0;
          const itemTotal = (item.quantity || 0) * (item.unit_price || 0) * unitValue;
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
      if (paid_amount !== undefined) {
        updates.push('paid_amount = ?');
        values.push(paid_amount);
      }
      if (debt_deadline !== undefined) {
        updates.push('debt_deadline = ?');
        values.push(debt_deadline || null);
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

      if (sale.customer_id && (sale.payment_status === 'DEBT' || sale.payment_status === 'PARTIAL')) {
        oldCustomerBalanceChange = sale.total_amount;
      }

      if (customer_id !== undefined ? customer_id : sale.customer_id) {
        const finalPaymentStatus = payment_status !== undefined ? payment_status : sale.payment_status;
        if (finalPaymentStatus === 'DEBT' || finalPaymentStatus === 'PARTIAL') {
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
          } else if (finalPaymentStatus === 'PARTIAL') {
            await connection.execute(
              'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status) VALUES (?, ?, ?, ?, ?)',
              [finalCustomerId, id, newTotalAmount, 'PARTIAL', 1]
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
          const unitValue = item.unit_value || 1.0;
          const itemTotal = item.quantity * item.unit_price * unitValue;
          await connection.execute(
            'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, unit_value, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, item.product_id, item.quantity, item.unit_price, unitValue, itemTotal, 1]
          );

          await connection.execute(
            'UPDATE stock SET quantity = quantity - ? WHERE product_id = ?',
            [item.quantity, item.product_id]
          );
        }
      }

      await connection.commit();
      
      // Handle transactions after database commit
      const oldPaymentStatus = sale.payment_status;
      const newPaymentStatus = payment_status !== undefined ? payment_status : sale.payment_status;
      
      // Remove transaction if changing from PAID to DEBT
      if (oldPaymentStatus === 'PAID' && newPaymentStatus === 'DEBT') {
        await connection.execute(
          'DELETE FROM transactions WHERE reference_type = ? AND reference_id = ?',
          ['SALE', id]
        );
      }
      
      // Create transaction if changing from DEBT to PAID
      if (oldPaymentStatus === 'DEBT' && newPaymentStatus === 'PAID') {
        await accountsService.createSaleTransaction({
          id: id,
          total_amount: newTotalAmount,
          payment_status: newPaymentStatus,
          account_id: sale.account_id
        });
      }
      
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
  },

  // Add partial payment to existing sale
  addPartialPayment: async (saleId, { amount, account_id }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Get existing sale
      const [existingSale] = await connection.execute(
        'SELECT * FROM sales WHERE id = ? AND status = 1',
        [saleId]
      );

      if (existingSale.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Sale not found' };
      }

      const sale = existingSale[0];
      const currentPaid = parseFloat(sale.paid_amount || 0);
      const totalAmount = parseFloat(sale.total_amount);
      const newPaidAmount = currentPaid + parseFloat(amount);

      // Validate payment amount
      if (newPaidAmount > totalAmount) {
        await connection.rollback();
        connection.release();
        return { error: 'Payment amount exceeds total sale amount' };
      }

      // Determine new payment status
      let newStatus = 'PARTIAL';
      if (newPaidAmount >= totalAmount) {
        newStatus = 'PAID';
      }

      // Update sale with new paid_amount and status
      await connection.execute(
        'UPDATE sales SET paid_amount = ?, payment_status = ? WHERE id = ?',
        [newPaidAmount, newStatus, saleId]
      );

      // Update customer balance if there is a customer
      if (sale.customer_id) {
        // Reduce customer debt by the payment amount
        await connection.execute(
          'UPDATE customers SET balance = balance - ? WHERE id = ? AND status = 1',
          [amount, sale.customer_id]
        );

        // Create customer operation record
        await connection.execute(
          'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status) VALUES (?, ?, ?, ?, ?)',
          [sale.customer_id, saleId, amount, 'PAYMENT', 1]
        );
      }

      // Create transaction for the payment
      await accountsService.createSaleTransaction({
        id: saleId,
        total_amount: amount,
        payment_status: newStatus,
        account_id
      });

      await connection.commit();
      connection.release();

      return {
        success: true,
        sale_id: saleId,
        previous_paid: currentPaid,
        new_paid: newPaidAmount,
        total_amount: totalAmount,
        remaining: totalAmount - newPaidAmount,
        payment_status: newStatus,
        message: `Successfully added payment of ${amount}. Total paid: ${newPaidAmount}, Remaining: ${totalAmount - newPaidAmount}`
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  },

  // Update sale stage with validation
  updateStage: async (saleId, { stage, changed_by }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Get current sale
      const [existingSale] = await connection.execute(
        'SELECT * FROM sales WHERE id = ? AND status = 1',
        [saleId]
      );

      if (existingSale.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Sale not found' };
      }

      const sale = existingSale[0];
      const currentStage = sale.stage;

      // Validate stage transition
      const validStages = ['ordered', 'ready', 'delivered'];
      if (!validStages.includes(stage)) {
        await connection.rollback();
        connection.release();
        return { error: `Invalid stage. Must be one of: ${validStages.join(', ')}` };
      }

      // Define allowed transitions (sequential only)
      const allowedTransitions = {
        'ordered': ['ready'],
        'ready': ['delivered'],
        'delivered': []
      };

      // Check if transition is allowed
      if (!allowedTransitions[currentStage].includes(stage)) {
        await connection.rollback();
        connection.release();
        return { 
          error: `Invalid stage transition from '${currentStage}' to '${stage}'. Allowed transitions: ${allowedTransitions[currentStage].join(', ') || 'none'}` 
        };
      }

      // Update sale stage
      await connection.execute(
        'UPDATE sales SET stage = ? WHERE id = ?',
        [stage, saleId]
      );

      // Record stage change history
      await connection.execute(
        'INSERT INTO sale_stage_history (sale_id, from_stage, to_stage, changed_by, status) VALUES (?, ?, ?, ?, ?)',
        [saleId, currentStage, stage, changed_by, 1]
      );

      await connection.commit();
      connection.release();

      return {
        success: true,
        sale_id: saleId,
        from_stage: currentStage,
        to_stage: stage,
        message: `Stage updated successfully from '${currentStage}' to '${stage}'`
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  },

  // Get stage history for a sale
  getStageHistory: async (saleId) => {
    const [rows] = await db.execute(`
      SELECT 
        ssh.*,
        u.name as changed_by_username
      FROM sale_stage_history ssh
      LEFT JOIN users u ON ssh.changed_by = u.id AND u.status = 1
      WHERE ssh.sale_id = ? AND ssh.status = 1
      ORDER BY ssh.created_at DESC
    `, [saleId]);

    return rows;
  }
};

module.exports = salesService;
