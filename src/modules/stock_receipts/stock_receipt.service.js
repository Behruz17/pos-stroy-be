const db = require('../../config/db');
const accountsService = require('../accounts/accounts.service');

const stockReceiptService = {
  getAll: async ({ date, month, year } = {}) => {
    let query = `
      SELECT sr.*, s.name as supplier_name
      FROM stock_receipts sr
      LEFT JOIN suppliers s ON sr.supplier_id = s.id AND s.status = 1
      WHERE sr.status = 1
    `;
    const params = [];

    if (date) {
      // Filter by specific date (YYYY-MM-DD)
      query += ' AND DATE(sr.created_at) = ?';
      params.push(date);
    } else if (month && year) {
      // Filter by month and year
      query += ' AND MONTH(sr.created_at) = ? AND YEAR(sr.created_at) = ?';
      params.push(month, year);
    } else if (year) {
      // Filter by year only
      query += ' AND YEAR(sr.created_at) = ?';
      params.push(year);
    }

    query += ' ORDER BY sr.created_at DESC';

    const [rows] = await db.execute(query, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT sr.*, s.name as supplier_name
      FROM stock_receipts sr
      LEFT JOIN suppliers s ON sr.supplier_id = s.id AND s.status = 1
      WHERE sr.id = ? AND sr.status = 1
    `, [id]);

    if (rows.length === 0) {
      return { error: 'Stock receipt not found' };
    }

    const receipt = rows[0];

    const [items] = await db.execute(`
      SELECT sri.*, p.name as product_name, p.product_code
      FROM stock_receipt_items sri
      JOIN products p ON sri.product_id = p.id AND p.status = 1
      WHERE sri.receipt_id = ? AND sri.status = 1
    `, [id]);

    receipt.items = items;
    return receipt;
  },

  create: async ({ created_by, supplier_id, items, currency = 'TJS', rate = 1.0000, delivery_cost = null }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!items || items.length === 0) {
        return { error: 'Items are required' };
      }

      // Фронтенд сам рассчитывает и отправляет готовые данные
      let totalAmount = 0;
      let totalAmountConverted = null;
      
      // Считаем сумму: если есть тонна и цена/тонна - по тоннам, иначе по метрам
      for (const item of items) {
        if (item.tonnage && item.price_per_ton) {
          // Считаем по тоннам
          totalAmount += item.tonnage * item.price_per_ton;
        } else {
          // Считаем по метрам
          totalAmount += (item.quantity || 0) * (item.purchase_cost || 0);
        }
      }
      
      // Calculate converted amount if not TJS
      if (currency !== 'TJS' && rate !== 1.0000) {
        totalAmountConverted = totalAmount * rate;
      }

      const [receiptResult] = await connection.execute(
        'INSERT INTO stock_receipts (created_by, supplier_id, total_amount, status, currency, rate, total_amount_converted, delivery_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [created_by, supplier_id || null, totalAmount, 1, currency, rate, totalAmountConverted, delivery_cost]
      );
      const receiptId = receiptResult.insertId;

      for (const item of items) {
        let purchaseCostConverted = null;
        let actualCost = item.actual_cost || item.purchase_cost || 0;
        let actualCostConverted = null;

        // Конвертируем цены в TJS
        if (currency !== 'TJS' && rate !== 1.0000) {
          if (item.purchase_cost) {
            purchaseCostConverted = item.purchase_cost * rate;
          }
          if (actualCost) {
            actualCostConverted = actualCost * rate;
          }
        }

        await connection.execute(
          'INSERT INTO stock_receipt_items (receipt_id, product_id, quantity, purchase_cost, selling_price, status, purchase_cost_converted, tonnage, price_per_ton, actual_cost, actual_cost_converted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            receiptId,
            item.product_id,
            item.quantity,
            item.purchase_cost,
            item.selling_price || null,
            1,
            purchaseCostConverted,
            item.tonnage || null,
            item.price_per_ton || null,
            actualCost,
            actualCostConverted
          ]
        );

        // Check product type
        const [productRows] = await connection.execute(
          'SELECT type FROM products WHERE id = ? AND status = 1',
          [item.product_id]
        );
        const productType = productRows[0]?.type || 'simple';

        if (productType === 'batch') {
          // For batch products: create a new stock_items entry (separate batch)
          const batchCode = item.batch_code || `BATCH-${receiptId}-${Date.now()}`;
          await connection.execute(
            'INSERT INTO stock_items (product_id, quantity, batch_code, purchase_cost, selling_price, receipt_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [item.product_id, item.quantity, batchCode, actualCost, item.selling_price || null, receiptId, 1]
          );
          // Update stock total (sum of all batches)
          await connection.execute(`
            INSERT INTO stock (product_id, quantity) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
          `, [item.product_id, item.quantity]);
        } else {
          // For simple products: just sum the quantity
          await connection.execute(`
            INSERT INTO stock (product_id, quantity) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
          `, [item.product_id, item.quantity]);
        }
      }

      if (supplier_id) {
        await connection.execute(
          'UPDATE suppliers SET balance = balance + ? WHERE id = ? AND status = 1',
          [totalAmount, supplier_id]
        );

        await connection.execute(
          'INSERT INTO supplier_operations (supplier_id, receipt_id, sum, type, status) VALUES (?, ?, ?, ?, ?)',
          [supplier_id, receiptId, totalAmount, 'RECEIPT', 1]
        );
      }

      await connection.commit();
      return { id: receiptId, total_amount: totalAmount.toString() };
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

      const [receiptRows] = await connection.execute(
        'SELECT supplier_id, total_amount FROM stock_receipts WHERE id = ? AND status = 1',
        [id]
      );

      if (receiptRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Stock receipt not found' };
      }

      const { supplier_id, total_amount } = receiptRows[0];

      const [itemRows] = await connection.execute(
        'SELECT product_id, quantity FROM stock_receipt_items WHERE receipt_id = ? AND status = 1',
        [id]
      );

      for (const item of itemRows) {
        // Check product type
        const [productRows] = await connection.execute(
          'SELECT type FROM products WHERE id = ? AND status = 1',
          [item.product_id]
        );
        const productType = productRows[0]?.type || 'simple';

        // Update stock quantity
        await connection.execute(
          'UPDATE stock SET quantity = quantity - ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );

        // For batch products: deactivate the corresponding stock_items
        if (productType === 'batch') {
          await connection.execute(
            'UPDATE stock_items SET status = 0 WHERE receipt_id = ? AND product_id = ? AND status = 1',
            [id, item.product_id]
          );
        }
      }

      await connection.execute(
        'UPDATE stock_receipt_items SET status = 0 WHERE receipt_id = ?',
        [id]
      );

      if (supplier_id) {
        await connection.execute(
          'UPDATE suppliers SET balance = balance - ? WHERE id = ? AND status = 1',
          [total_amount, supplier_id]
        );

        await connection.execute(
          'UPDATE supplier_operations SET status = 0 WHERE receipt_id = ? AND type = ?',
          [id, 'RECEIPT']
        );
      }

      await connection.execute(
        'UPDATE stock_receipts SET status = 0 WHERE id = ?',
        [id]
      );

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

module.exports = stockReceiptService;
