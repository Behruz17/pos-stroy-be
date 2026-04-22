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
  create: async ({ created_by, from_product_id, to_product_id, from_quantity, to_quantity, selling_price }) => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Check if from_product has enough stock
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

      // 2. Get from_product purchase_cost from most recent stock receipt
      const [purchaseCostRows] = await connection.execute(
        `SELECT sri.purchase_cost FROM stock_receipt_items sri
         INNER JOIN stock_receipts sr ON sri.receipt_id = sr.id
         WHERE sri.product_id = ? AND sri.status = 1
         ORDER BY sr.created_at DESC
         LIMIT 1`,
        [from_product_id]
      );

      const purchaseCost = purchaseCostRows[0]?.purchase_cost || 0;
      const totalCost = purchaseCost * from_quantity;
      const newPurchaseCostPerUnit = totalCost / to_quantity;

      // 3. Check if to_product exists
      const [toProductRows] = await connection.execute(
        'SELECT id FROM products WHERE id = ?',
        [to_product_id]
      );

      if (toProductRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Target product not found' };
      }

      // 4. Decrease from_product stock
      await connection.execute(
        'UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND status = 1',
        [from_quantity, from_product_id]
      );

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

      // 6. Create conversion record
      const [conversionResult] = await connection.execute(
        'INSERT INTO product_conversions (from_product_id, to_product_id, from_quantity, to_quantity, purchase_cost, selling_price, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [from_product_id, to_product_id, from_quantity, to_quantity, newPurchaseCostPerUnit, selling_price || null, created_by, 1]
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

      // 1. Restore from_product stock
      await connection.execute(
        'UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND status = 1',
        [conversion.from_quantity, conversion.from_product_id]
      );

      // 2. Decrease to_product stock
      await connection.execute(
        'UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND status = 1',
        [conversion.to_quantity, conversion.to_product_id]
      );

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
