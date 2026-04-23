const db = require('../../config/db');

const conversionsService = {
  // Get all conversions with optional filtering
  getAll: async ({ date, month, year } = {}) => {
    let query = `
      SELECT 
        pc.id,
        pc.from_product_id,
        p1.name as from_product_name,
        p1.product_code as from_product_code,
        pc.to_product_id,
        p2.name as to_product_name,
        p2.product_code as to_product_code,
        pc.from_quantity,
        pc.to_quantity,
        pc.purchase_cost,
        pc.selling_price,
        pc.created_by,
        u.name as created_by_name,
        pc.created_at
      FROM product_conversions pc
      LEFT JOIN products p1 ON pc.from_product_id = p1.id
      LEFT JOIN products p2 ON pc.to_product_id = p2.id
      LEFT JOIN users u ON pc.created_by = u.id
      WHERE pc.status = 1
    `;
    const params = [];

    if (date) {
      query += ' AND DATE(pc.created_at) = ?';
      params.push(date);
    }

    if (month && year) {
      query += ' AND MONTH(pc.created_at) = ? AND YEAR(pc.created_at) = ?';
      params.push(month, year);
    } else if (year) {
      query += ' AND YEAR(pc.created_at) = ?';
      params.push(year);
    }

    query += ' ORDER BY pc.created_at DESC';

    const [rows] = await db.execute(query, params);
    return rows;
  },

  // Get conversion by ID
  getById: async (id) => {
    const [rows] = await db.execute(
      `SELECT 
        pc.id,
        pc.from_product_id,
        p1.name as from_product_name,
        p1.product_code as from_product_code,
        pc.to_product_id,
        p2.name as to_product_name,
        p2.product_code as to_product_code,
        pc.from_quantity,
        pc.to_quantity,
        pc.purchase_cost,
        pc.selling_price,
        pc.created_by,
        u.name as created_by_name,
        pc.created_at
      FROM product_conversions pc
      LEFT JOIN products p1 ON pc.from_product_id = p1.id
      LEFT JOIN products p2 ON pc.to_product_id = p2.id
      LEFT JOIN users u ON pc.created_by = u.id
      WHERE pc.id = ? AND pc.status = 1`,
      [id]
    );
    return rows[0] || null;
  },

  // Create new conversion
  create: async ({ created_by, from_product_id, to_product_id, from_quantity, to_quantity, selling_price, from_stock_item_id }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Check from_product type
      const [fromProductRows] = await connection.execute(
        'SELECT type FROM products WHERE id = ? AND status = 1',
        [from_product_id]
      );
      const fromProductType = fromProductRows[0]?.type || 'simple';

      // Check to_product type
      const [toProductRows] = await connection.execute(
        'SELECT type FROM products WHERE id = ? AND status = 1',
        [to_product_id]
      );
      const toProductType = toProductRows[0]?.type || 'simple';

      // 1. Check if from_product has enough stock
      if (fromProductType === 'batch') {
        // For batch products, stock_item_id is required
        if (!from_stock_item_id) {
          await connection.rollback();
          connection.release();
          return { error: 'Stock item (batch) is required for batch source product' };
        }

        // Check specific batch quantity
        const [stockItemRows] = await connection.execute(
          'SELECT quantity FROM stock_items WHERE id = ? AND product_id = ? AND status = 1',
          [from_stock_item_id, from_product_id]
        );

        if (stockItemRows.length === 0) {
          await connection.rollback();
          connection.release();
          return { error: `Stock item ${from_stock_item_id} not found for source product` };
        }

        const batchAvailable = parseFloat(stockItemRows[0].quantity);
        if (batchAvailable < from_quantity) {
          await connection.rollback();
          connection.release();
          return { error: `Insufficient batch stock for source product. Available: ${batchAvailable}, Required: ${from_quantity}` };
        }
      } else {
        // For simple products, check total stock
        const [fromStockRows] = await connection.execute(
          'SELECT quantity FROM stock WHERE product_id = ? AND status = 1',
          [from_product_id]
        );

        const fromStock = fromStockRows[0]?.quantity || 0;
        if (fromStock < from_quantity) {
          await connection.rollback();
          connection.release();
          return { error: `Insufficient stock for source product. Available: ${fromStock}, Required: ${from_quantity}` };
        }
      }

      // 2. Get from_product purchase_cost from most recent stock receipt or stock_item
      let purchaseCost = 0;
      if (fromProductType === 'batch' && from_stock_item_id) {
        // Get purchase cost from specific batch
        const [stockItemCostRows] = await connection.execute(
          'SELECT purchase_cost FROM stock_items WHERE id = ? AND product_id = ? AND status = 1',
          [from_stock_item_id, from_product_id]
        );
        purchaseCost = stockItemCostRows[0]?.purchase_cost || 0;
      } else {
        // Get from most recent stock receipt
        const [purchaseCostRows] = await connection.execute(
          `SELECT sri.purchase_cost FROM stock_receipt_items sri
           INNER JOIN stock_receipts sr ON sri.receipt_id = sr.id
           WHERE sri.product_id = ? AND sri.status = 1
           ORDER BY sr.created_at DESC
           LIMIT 1`,
          [from_product_id]
        );
        purchaseCost = purchaseCostRows[0]?.purchase_cost || 0;
      }

      const totalCost = purchaseCost * from_quantity;
      const newPurchaseCostPerUnit = totalCost / to_quantity;

      // 3. Check if to_product exists
      const [toProductExistsRows] = await connection.execute(
        'SELECT id FROM products WHERE id = ?',
        [to_product_id]
      );

      if (toProductExistsRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Target product not found' };
      }

      // 4. Decrease from_product stock
      await connection.execute(
        'UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND status = 1',
        [from_quantity, from_product_id]
      );

      // For batch from_product: decrease specific batch quantity
      if (fromProductType === 'batch' && from_stock_item_id) {
        await connection.execute(
          'UPDATE stock_items SET quantity = quantity - ? WHERE id = ? AND product_id = ?',
          [from_quantity, from_stock_item_id, from_product_id]
        );

        // Check if batch quantity is now 0 and deactivate if so
        const [updatedBatchRows] = await connection.execute(
          'SELECT quantity FROM stock_items WHERE id = ? AND product_id = ?',
          [from_stock_item_id, from_product_id]
        );

        if (updatedBatchRows.length > 0 && parseFloat(updatedBatchRows[0].quantity) <= 0) {
          await connection.execute(
            'UPDATE stock_items SET status = 0 WHERE id = ? AND product_id = ?',
            [from_stock_item_id, from_product_id]
          );
        }
      }

      // 5. Increase to_product stock (or create if not exists)
      const [toStockRows] = await connection.execute(
        'SELECT id FROM stock WHERE product_id = ? AND status = 1',
        [to_product_id]
      );

      if (toStockRows.length > 0) {
        // Update existing stock
        await connection.execute(
          'UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND status = 1',
          [to_quantity, to_product_id]
        );
      } else {
        // Create new stock record
        await connection.execute(
          'INSERT INTO stock (product_id, quantity, status) VALUES (?, ?, 1)',
          [to_product_id, to_quantity]
        );
      }

      // For batch to_product: create a new batch entry
      if (toProductType === 'batch') {
        const batchCode = `CONV-${Date.now()}`;
        await connection.execute(
          'INSERT INTO stock_items (product_id, quantity, batch_code, purchase_cost, selling_price, status) VALUES (?, ?, ?, ?, ?, ?)',
          [to_product_id, to_quantity, batchCode, newPurchaseCostPerUnit, selling_price || null, 1]
        );
      }

      // For batch to_product: store the created stock_item_id
      let toStockItemId = null;
      if (toProductType === 'batch') {
        const [newBatchRows] = await connection.execute(
          'SELECT id FROM stock_items WHERE product_id = ? AND batch_code LIKE ? ORDER BY id DESC LIMIT 1',
          [to_product_id, 'CONV-%']
        );
        toStockItemId = newBatchRows[0]?.id || null;
      }

      // 6. Create conversion record with stock_item_ids
      const [conversionResult] = await connection.execute(
        'INSERT INTO product_conversions (from_product_id, from_stock_item_id, to_product_id, to_stock_item_id, from_quantity, to_quantity, purchase_cost, selling_price, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [from_product_id, fromProductType === 'batch' ? from_stock_item_id : null, to_product_id, toStockItemId, from_quantity, to_quantity, newPurchaseCostPerUnit, selling_price || null, created_by, 1]
      );

      await connection.commit();
      connection.release();

      return { id: conversionResult.insertId };

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  },

  // Delete conversion (soft delete)
  delete: async (id) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Get conversion details
      const [conversionRows] = await connection.execute(
        'SELECT * FROM product_conversions WHERE id = ? AND status = 1',
        [id]
      );

      if (conversionRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Conversion not found' };
      }

      const conversion = conversionRows[0];

      // Check product types
      const [fromProductRows] = await connection.execute(
        'SELECT type FROM products WHERE id = ? AND status = 1',
        [conversion.from_product_id]
      );
      const fromProductType = fromProductRows[0]?.type || 'simple';

      const [toProductRows] = await connection.execute(
        'SELECT type FROM products WHERE id = ? AND status = 1',
        [conversion.to_product_id]
      );
      const toProductType = toProductRows[0]?.type || 'simple';

      // 1. Restore from_product stock
      await connection.execute(
        'UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND status = 1',
        [conversion.from_quantity, conversion.from_product_id]
      );

      // For batch from_product: restore specific batch quantity
      if (fromProductType === 'batch' && conversion.from_stock_item_id) {
        await connection.execute(
          'UPDATE stock_items SET quantity = quantity + ? WHERE id = ? AND product_id = ?',
          [conversion.from_quantity, conversion.from_stock_item_id, conversion.from_product_id]
        );
        // Reactivate batch if it was deactivated
        await connection.execute(
          'UPDATE stock_items SET status = 1 WHERE id = ? AND product_id = ? AND status = 0',
          [conversion.from_stock_item_id, conversion.from_product_id]
        );
      }

      // 2. Decrease to_product stock
      await connection.execute(
        'UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND status = 1',
        [conversion.to_quantity, conversion.to_product_id]
      );

      // For batch to_product: remove/deactivate the created batch
      if (toProductType === 'batch' && conversion.to_stock_item_id) {
        // Deactivate or delete the batch created during conversion
        await connection.execute(
          'UPDATE stock_items SET status = 0 WHERE id = ? AND product_id = ?',
          [conversion.to_stock_item_id, conversion.to_product_id]
        );
      }

      // 3. Soft delete conversion record
      await connection.execute(
        'UPDATE product_conversions SET status = 0 WHERE id = ?',
        [id]
      );

      await connection.commit();
      connection.release();

      return { message: 'Conversion deleted successfully' };

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }
};

module.exports = conversionsService;
