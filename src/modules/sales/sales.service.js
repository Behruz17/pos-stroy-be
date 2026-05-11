const db = require('../../config/db');
const accountsService = require('../accounts/accounts.service');

const salesService = {
  getAll: async ({ date, month, year, seller_id } = {}) => {
    let query = `
      SELECT s.*, c.full_name as customer_name, u.name as seller_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id AND c.status = 1
      LEFT JOIN users u ON s.created_by = u.id AND u.status = 1
      WHERE s.status = 1
    `;
    const params = [];

    if (seller_id) {
      // Filter by seller
      query += ' AND s.created_by = ?';
      params.push(seller_id);
    }

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

    const [sales] = await db.execute(query, params);

    // Get items for all sales in one query
    if (sales.length > 0) {
      const saleIds = sales.map(sale => sale.id);
      const [items] = await db.execute(`
        SELECT si.*, p.name as product_name, p.product_code, s.name as style_name
        FROM sale_items si
        JOIN products p ON si.product_id = p.id AND p.status = 1
        LEFT JOIN styles s ON si.style_id = s.id AND s.status = 1
        WHERE si.sale_id IN (${saleIds.map(() => '?').join(',')}) AND si.status = 1
        ORDER BY si.sale_id, si.id
      `, saleIds);

      // Group items by sale_id
      const itemsBySale = {};
      items.forEach(item => {
        if (!itemsBySale[item.sale_id]) {
          itemsBySale[item.sale_id] = [];
        }
        itemsBySale[item.sale_id].push(item);
      });

      // Add items to sales
      sales.forEach(sale => {
        sale.items = itemsBySale[sale.id] || [];
      });
    }

    return sales;
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
      SELECT si.*, p.name as product_name, p.product_code, s.name as style_name
      FROM sale_items si
      JOIN products p ON si.product_id = p.id AND p.status = 1
      LEFT JOIN styles s ON si.style_id = s.id AND s.status = 1
      WHERE si.sale_id = ? AND si.status = 1
    `, [id]);

    sale.items = items;
    return sale;
  },

  create: async ({ created_by, customer_id, payment_status, cash_amount, electronic_amount, stage, account_id, debt_deadline, items }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!items || items.length === 0) {
        return { error: 'Items are required' };
      }

      // Если customer_id не указан, найти клиента по умолчанию
      let finalCustomerId = customer_id;
      if (!finalCustomerId) {
        const [defaultCustomer] = await connection.execute(
          'SELECT id FROM customers WHERE is_default = 1 AND status = 1 LIMIT 1'
        );
        
        if (defaultCustomer.length > 0) {
          finalCustomerId = defaultCustomer[0].id;
        }
      }

      // Validate mixed payment amounts
      if (cash_amount !== undefined && electronic_amount !== undefined) {
        const totalPaid = parseFloat(cash_amount) + parseFloat(electronic_amount);
        if (totalPaid < 0) {
          await connection.rollback();
          connection.release();
          return { error: 'Payment amounts cannot be negative' };
        }
      }

      // Validate stock availability and batch requirements
      for (const item of items) {
        // Check product type
        const [productRows] = await connection.execute(
          'SELECT type FROM products WHERE id = ? AND status = 1',
          [item.product_id]
        );
        const productType = productRows[0]?.type || 'simple';

        if (productType === 'batch') {
          // For batch products, check if stock_items exist for this product
          const [existingBatches] = await connection.execute(
            'SELECT id, quantity FROM stock_items WHERE product_id = ? AND status = 1',
            [item.product_id]
          );

          let stockItemId = item.stock_item_id;

          // If no batches exist, create one with current stock quantity
          if (existingBatches.length === 0) {
            // Get current stock from main stock table
            const [stockRows] = await connection.execute(
              'SELECT quantity FROM stock WHERE product_id = ?',
              [item.product_id]
            );
            const currentStock = stockRows.length > 0 ? parseFloat(stockRows[0].quantity) : 0;

            // Create new batch
            const batchCode = `AUTO-BATCH-${item.product_id}-${Date.now()}`;
            const [batchResult] = await connection.execute(
              'INSERT INTO stock_items (product_id, quantity, batch_code, purchase_cost, selling_price, status) VALUES (?, ?, ?, ?, ?, ?)',
              [item.product_id, currentStock, batchCode, null, null, 1]
            );
            stockItemId = batchResult.insertId;
          } else {
            // If batches exist, stock_item_id is required
            if (!stockItemId) {
              await connection.rollback();
              connection.release();
              return { error: `Stock item (batch) is required for batch product ${item.product_id}. Available batches: ${existingBatches.length}` };
            }

            // Check specific batch quantity
            const [stockItemRows] = await connection.execute(
              'SELECT quantity FROM stock_items WHERE id = ? AND product_id = ? AND status = 1',
              [stockItemId, item.product_id]
            );

            if (stockItemRows.length === 0) {
              await connection.rollback();
              connection.release();
              return { error: `Stock item ${stockItemId} not found for product ${item.product_id}` };
            }

            const batchAvailable = parseFloat(stockItemRows[0].quantity);
            if (batchAvailable < item.quantity) {
              await connection.rollback();
              connection.release();
              return { error: `Insufficient batch stock for product ${item.product_id}. Available: ${batchAvailable}, Required: ${item.quantity}` };
            }
          }

          // Store the stock_item_id for later use
          item.stock_item_id = stockItemId;
        } else {
          // For simple products, check total stock
          const [stockRows] = await connection.execute(
            'SELECT quantity FROM stock WHERE product_id = ?',
            [item.product_id]
          );
          const available = stockRows.length > 0 ? parseFloat(stockRows[0].quantity) : 0;
          if (available < item.quantity) {
            await connection.rollback();
            connection.release();
            return { error: `Insufficient stock for product ${item.product_id}` };
          }
        }
      }

      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        const unitValue = item.unit_value || 1.0;
        totalAmount += item.quantity * item.unit_price * unitValue;
      }

      // Handle mixed payment and calculate payment status
      const finalCashAmount = cash_amount !== undefined ? parseFloat(cash_amount) : 0;
      const finalElectronicAmount = electronic_amount !== undefined ? parseFloat(electronic_amount) : 0;
      const totalPaid = finalCashAmount + finalElectronicAmount;
      
      // Calculate payment_status based on total paid amount
      let calculatedPaymentStatus = 'DEBT';
      if (totalPaid >= totalAmount) {
        calculatedPaymentStatus = 'PAID';
      } else if (totalPaid > 0 && totalPaid < totalAmount) {
        calculatedPaymentStatus = 'PARTIAL';
      }
      
      // Use provided payment_status or calculated one
      const finalPaymentStatus = payment_status || calculatedPaymentStatus;
      
      // Calculate discount - only for PAID status
      const discount = finalPaymentStatus === 'PAID' ? Math.max(0, totalAmount - totalPaid) : 0;
      
      // Note: totalPaid can exceed totalAmount for PAID status (discount scenario)
      // For PARTIAL status, totalPaid must be less than totalAmount
      
      // Validate stage
      const validStages = ['ordered', 'ready', 'delivered'];
      const finalStage = stage && validStages.includes(stage) ? stage : 'ordered';
      
      // Use provided account_id or determine primary based on payment amounts
      let primaryAccountId = null;
      if (finalPaymentStatus === 'PAID' || finalPaymentStatus === 'PARTIAL') {
        if (account_id) {
          primaryAccountId = account_id; // Use provided account_id
        } else if (finalCashAmount >= finalElectronicAmount) {
          primaryAccountId = 1; // Cash is primary or equal
        } else {
          primaryAccountId = 2; // Electronic is primary
        }
      }
      
      const [saleResult] = await connection.execute(
        'INSERT INTO sales (customer_id, created_by, total_amount, discount, cash_amount, electronic_amount, payment_status, account_id, stage, debt_deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [finalCustomerId || null, created_by, totalAmount, discount, finalCashAmount, finalElectronicAmount, finalPaymentStatus, primaryAccountId, finalStage, debt_deadline || null, 1]
      );
      const saleId = saleResult.insertId;

      for (const item of items) {
        const unitValue = item.unit_value || 1.0;
        const itemTotal = item.quantity * item.unit_price * unitValue;

        // Check product type
        const [productRows] = await connection.execute(
          'SELECT type FROM products WHERE id = ? AND status = 1',
          [item.product_id]
        );
        const productType = productRows[0]?.type || 'simple';

        // Insert sale item with stock_item_id for batch products
        await connection.execute(
          'INSERT INTO sale_items (sale_id, product_id, stock_item_id, quantity, unit_price, unit_value, total_price, style_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [saleId, item.product_id, productType === 'batch' ? item.stock_item_id : null, item.quantity, item.unit_price, unitValue, itemTotal, item.style_id || null, 1]
        );

        // Update stock quantity (real quantity = quantity * unit_value)
        const realQuantity = item.quantity * (item.unit_value || 1);
        await connection.execute(
          'UPDATE stock SET quantity = quantity - ? WHERE product_id = ?',
          [realQuantity, item.product_id]
        );

        // For batch products: update specific batch quantity
        if (productType === 'batch' && item.stock_item_id) {
          await connection.execute(
            'UPDATE stock_items SET quantity = quantity - ? WHERE id = ? AND product_id = ?',
            [realQuantity, item.stock_item_id, item.product_id]
          );

          // Check if batch quantity is now 0 and deactivate if so
          const [updatedBatchRows] = await connection.execute(
            'SELECT quantity FROM stock_items WHERE id = ? AND product_id = ?',
            [item.stock_item_id, item.product_id]
          );

          if (updatedBatchRows.length > 0 && parseFloat(updatedBatchRows[0].quantity) <= 0) {
            await connection.execute(
              'UPDATE stock_items SET status = 0 WHERE id = ? AND product_id = ?',
              [item.stock_item_id, item.product_id]
            );
          }
        }
      }

      if (finalCustomerId) {
        if (finalPaymentStatus === 'DEBT') {
          await connection.execute(
            'UPDATE customers SET balance = balance + ? WHERE id = ? AND status = 1',
            [totalAmount, finalCustomerId]
          );

          await connection.execute(
            'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [finalCustomerId, saleId, totalAmount, 'DEBT', 1, created_by]
          );
        } else if (finalPaymentStatus === 'PARTIAL') {
          await connection.execute(
            'UPDATE customers SET balance = balance + ? WHERE id = ? AND status = 1',
            [totalAmount, finalCustomerId]
          );

          await connection.execute(
            'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [finalCustomerId, saleId, totalAmount, 'PARTIAL', 1, created_by]
          );
        } else {
          await connection.execute(
            'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [finalCustomerId, saleId, totalAmount, 'PAID', 1, created_by]
          );
        }
      }

      await connection.commit();
      
      // Create transaction for paid and partially paid sales
      if (finalPaymentStatus === 'PAID' || finalPaymentStatus === 'PARTIAL') {
        await accountsService.createSaleTransaction({
          id: saleId,
          total_amount: totalAmount,
          cash_amount: finalCashAmount,
          electronic_amount: finalElectronicAmount,
          payment_status: finalPaymentStatus,
          account_id: primaryAccountId
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
              'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
              [finalCustomerId, id, newTotalAmount, 'DEBT', 1, created_by]
            );
          } else if (finalPaymentStatus === 'PARTIAL') {
            await connection.execute(
              'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
              [finalCustomerId, id, newTotalAmount, 'PARTIAL', 1, created_by]
            );
          } else {
            await connection.execute(
              'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
              [finalCustomerId, id, newTotalAmount, 'PAID', 1, created_by]
            );
          }
        }
      }

      // Update items if provided
      if (items && items.length > 0) {
        // Restore stock for old items (handle batch products)
        for (const item of existingItems) {
          // Restore main stock (real quantity = quantity * unit_value)
          const realQuantity = item.quantity * (item.unit_value || 1);
          await connection.execute(
            'UPDATE stock SET quantity = quantity + ? WHERE product_id = ?',
            [realQuantity, item.product_id]
          );

          // If batch product, restore specific batch quantity
          if (item.stock_item_id) {
            await connection.execute(
              'UPDATE stock_items SET quantity = quantity + ? WHERE id = ? AND product_id = ?',
              [realQuantity, item.stock_item_id, item.product_id]
            );
            // Reactivate batch if it was deactivated
            await connection.execute(
              'UPDATE stock_items SET status = 1 WHERE id = ? AND product_id = ? AND status = 0',
              [item.stock_item_id, item.product_id]
            );
          }
        }

        // Mark old items as deleted
        await connection.execute('UPDATE sale_items SET status = 0 WHERE sale_id = ?', [id]);

        // Validate and add new items
        for (const item of items) {
          // Check product type
          const [productRows] = await connection.execute(
            'SELECT type FROM products WHERE id = ? AND status = 1',
            [item.product_id]
          );
          const productType = productRows[0]?.type || 'simple';

          if (productType === 'batch') {
            // For batch products, check if stock_items exist for this product
            const [existingBatches] = await connection.execute(
              'SELECT id, quantity FROM stock_items WHERE product_id = ? AND status = 1',
              [item.product_id]
            );

          let stockItemId = item.stock_item_id;

          // If no batches exist, create one with current stock quantity
          if (existingBatches.length === 0) {
            // Get current stock from main stock table
            const [stockRows] = await connection.execute(
              'SELECT quantity FROM stock WHERE product_id = ?',
              [item.product_id]
            );
            const currentStock = stockRows.length > 0 ? parseFloat(stockRows[0].quantity) : 0;

            // Create new batch
            const batchCode = `AUTO-BATCH-${item.product_id}-${Date.now()}`;
            const [batchResult] = await connection.execute(
              'INSERT INTO stock_items (product_id, quantity, batch_code, purchase_cost, selling_price, status) VALUES (?, ?, ?, ?, ?, ?)',
              [item.product_id, currentStock, batchCode, null, null, 1]
            );
            stockItemId = batchResult.insertId;
          } else {
            // If batches exist, stock_item_id is required
            if (!stockItemId) {
              await connection.rollback();
              connection.release();
              return { error: `Stock item (batch) is required for batch product ${item.product_id}. Available batches: ${existingBatches.length}` };
            }

            // Check specific batch quantity
            const [stockItemRows] = await connection.execute(
              'SELECT quantity FROM stock_items WHERE id = ? AND product_id = ? AND status = 1',
              [stockItemId, item.product_id]
            );

            if (stockItemRows.length === 0) {
              await connection.rollback();
              connection.release();
              return { error: `Stock item ${stockItemId} not found for product ${item.product_id}` };
            }

            const batchAvailable = parseFloat(stockItemRows[0].quantity);
            if (batchAvailable < item.quantity) {
              await connection.rollback();
              connection.release();
              return { error: `Insufficient batch stock for product ${item.product_id}. Available: ${batchAvailable}, Required: ${item.quantity}` };
            }
          }

          // Store the stock_item_id for later use
          item.stock_item_id = stockItemId;
        } else {
          // For simple products, check total stock
          const [stockRows] = await connection.execute(
            'SELECT quantity FROM stock WHERE product_id = ?',
            [item.product_id]
          );
          const available = stockRows.length > 0 ? parseFloat(stockRows[0].quantity) : 0;
          if (available < item.quantity) {
            await connection.rollback();
            connection.release();
            return { error: `Insufficient stock for product ${item.product_id}` };
          }
        }
        }

        // Add new items and update stock
        for (const item of items) {
          const unitValue = item.unit_value || 1.0;
          const itemTotal = item.quantity * item.unit_price * unitValue;

          // Check product type
          const [productRows] = await connection.execute(
            'SELECT type FROM products WHERE id = ? AND status = 1',
            [item.product_id]
          );
          const productType = productRows[0]?.type || 'simple';

          // Insert sale item with stock_item_id for batch products
          await connection.execute(
            'INSERT INTO sale_items (sale_id, product_id, stock_item_id, quantity, unit_price, unit_value, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, item.product_id, productType === 'batch' ? item.stock_item_id : null, item.quantity, item.unit_price, unitValue, itemTotal, 1]
          );

          // Update stock quantity (real quantity = quantity * unit_value)
          const realQuantity = item.quantity * (item.unit_value || 1);
          await connection.execute(
            'UPDATE stock SET quantity = quantity - ? WHERE product_id = ?',
            [realQuantity, item.product_id]
          );

          // For batch products: update specific batch quantity
          if (productType === 'batch' && item.stock_item_id) {
            await connection.execute(
              'UPDATE stock_items SET quantity = quantity - ? WHERE id = ? AND product_id = ?',
              [realQuantity, item.stock_item_id, item.product_id]
            );

            // Check if batch quantity is now 0 and deactivate if so
            const [updatedBatchRows] = await connection.execute(
              'SELECT quantity FROM stock_items WHERE id = ? AND product_id = ?',
              [item.stock_item_id, item.product_id]
            );

            if (updatedBatchRows.length > 0 && parseFloat(updatedBatchRows[0].quantity) <= 0) {
              await connection.execute(
                'UPDATE stock_items SET status = 0 WHERE id = ? AND product_id = ?',
                [item.stock_item_id, item.product_id]
              );
            }
          }
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
        'SELECT product_id, quantity, unit_value, stock_item_id FROM sale_items WHERE sale_id = ? AND status = 1',
        [id]
      );

      for (const item of itemRows) {
        // Restore main stock (real quantity = quantity * unit_value)
        const realQuantity = item.quantity * (item.unit_value || 1);
        await connection.execute(
          'UPDATE stock SET quantity = quantity + ? WHERE product_id = ?',
          [realQuantity, item.product_id]
        );

        // If batch product, restore specific batch quantity
        if (item.stock_item_id) {
          await connection.execute(
            'UPDATE stock_items SET quantity = quantity + ? WHERE id = ? AND product_id = ?',
            [realQuantity, item.stock_item_id, item.product_id]
          );
          // Reactivate batch if it was deactivated
          await connection.execute(
            'UPDATE stock_items SET status = 1 WHERE id = ? AND product_id = ? AND status = 0',
            [item.stock_item_id, item.product_id]
          );
        }
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

      // Deactivate related transactions
      await accountsService.deactivateTransactions(connection, 'SALE', id);

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
          'INSERT INTO customer_operations (customer_id, sale_id, sum, type, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
          [sale.customer_id, saleId, amount, 'PAYMENT', 1, created_by]
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
