const db = require('../../config/db');

const productService = {
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.manufacturer,
        p.created_at,
        p.image,
        p.notification_threshold,
        p.product_code,
        p.type as product_type,
        p.status,
        si.id as stock_item_id,
        si.batch_code,
        si.quantity as stock_quantity,
        si.purchase_cost,
        si.selling_price,
        si.receipt_id,
        sr.currency,
        sr.rate
      FROM products p
      LEFT JOIN stock_items si ON p.id = si.product_id AND si.status = 1
      LEFT JOIN stock_receipts sr ON si.receipt_id = sr.id
      WHERE p.status = 1
      ORDER BY p.name, si.created_at
    `);
    
    // Transform results to show each stock item as separate entry
    const result = [];
    for (const row of rows) {
      if (row.stock_item_id) {
        // Product has stock items - show each as separate entry
        result.push({
          id: row.stock_item_id,
          product_id: row.product_id,
          name: row.product_name,
          manufacturer: row.manufacturer,
          created_at: row.created_at,
          image: row.image,
          notification_threshold: row.notification_threshold,
          product_code: row.product_code,
          type: row.product_type,
          status: row.status,
          batch_code: row.batch_code,
          stock_quantity: row.stock_quantity,
          purchase_cost: row.purchase_cost,
          selling_price: row.selling_price,
          currency: row.currency,
          rate: row.rate,
          purchase_cost_converted: null,
          receipt_id: row.receipt_id,
          is_batch_item: true
        });
      } else {
        // Product without stock items - show with 0 quantity
        result.push({
          id: row.product_id,
          product_id: row.product_id,
          name: row.product_name,
          manufacturer: row.manufacturer,
          created_at: row.created_at,
          image: row.image,
          notification_threshold: row.notification_threshold,
          product_code: row.product_code,
          type: row.product_type,
          status: row.status,
          batch_code: null,
          stock_quantity: 0,
          purchase_cost: null,
          selling_price: null,
          currency: null,
          rate: null,
          purchase_cost_converted: null,
          receipt_id: null,
          is_batch_item: false
        });
      }
    }
    
    return result;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT p.id, p.name, p.manufacturer, p.created_at, p.image, p.notification_threshold, p.product_code, p.type, p.status,
             COALESCE(s.quantity, 0) as stock_quantity,
             latest_sri.purchase_cost,
             latest_sri.selling_price,
             latest_sri.purchase_cost_converted,
             sr.currency,
             sr.rate
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      LEFT JOIN (
        SELECT 
          sri1.product_id,
          sri1.receipt_id,
          sri1.purchase_cost,
          sri1.selling_price,
          sri1.purchase_cost_converted
        FROM stock_receipt_items sri1
        INNER JOIN (
          SELECT product_id, MAX(id) as max_id
          FROM stock_receipt_items 
          WHERE status = 1
          GROUP BY product_id
        ) sri2 ON sri1.product_id = sri2.product_id AND sri1.id = sri2.max_id
      ) latest_sri ON p.id = latest_sri.product_id
      LEFT JOIN stock_receipts sr ON latest_sri.receipt_id = sr.id
      WHERE p.id = ? AND p.status = 1`,
      [id]
    );

    if (rows.length === 0) {
      return { error: 'Product not found' };
    }

    return rows[0];
  },

  create: async ({ name, manufacturer, image, notification_threshold, product_code, type }) => {
    if (product_code) {
      const [existing] = await db.execute(
        'SELECT id FROM products WHERE product_code = ? AND status = 1',
        [product_code]
      );
      if (existing.length > 0) {
        return { error: 'Product with this code already exists' };
      }
    }

    const productType = type === 'batch' ? 'batch' : 'simple';

    const [result] = await db.execute(
      'INSERT INTO products (name, manufacturer, image, notification_threshold, product_code, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, manufacturer || null, image || null, notification_threshold || 10, product_code || null, productType, 1]
    );

    const [newProduct] = await db.execute(
      'SELECT id, name, manufacturer, created_at, image, notification_threshold, product_code, type, status FROM products WHERE id = ? AND status = 1',
      [result.insertId]
    );

    return newProduct[0];
  },

  update: async (id, { name, manufacturer, image, notification_threshold, product_code, type }) => {
    if (product_code) {
      const [existing] = await db.execute(
        'SELECT id FROM products WHERE product_code = ? AND id != ? AND status = 1',
        [product_code, id]
      );
      if (existing.length > 0) {
        return { error: 'Product with this code already exists' };
      }
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (manufacturer !== undefined) {
      updates.push('manufacturer = ?');
      values.push(manufacturer || null);
    }
    if (image !== undefined) {
      updates.push('image = ?');
      values.push(image || null);
    }
    if (notification_threshold !== undefined) {
      updates.push('notification_threshold = ?');
      values.push(notification_threshold);
    }
    if (product_code !== undefined) {
      updates.push('product_code = ?');
      values.push(product_code || null);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      values.push(type === 'batch' ? 'batch' : 'simple');
    }

    if (updates.length === 0) {
      return { error: 'No fields to update' };
    }

    values.push(id);
    const [result] = await db.execute(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ? AND status = 1`,
      values
    );

    if (result.affectedRows === 0) {
      return { error: 'Product not found' };
    }

    const [updatedProduct] = await db.execute(
      'SELECT id, name, manufacturer, created_at, image, notification_threshold, product_code, type, status FROM products WHERE id = ? AND status = 1',
      [id]
    );

    return updatedProduct[0];
  },

  remove: async (id) => {
    const [result] = await db.execute(
      'UPDATE products SET status = 0 WHERE id = ? AND status = 1',
      [id]
    );

    if (result.affectedRows === 0) {
      return { error: 'Product not found' };
    }

    return { success: true };
  },

  getStockItems: async (id) => {
    // Check if product exists and get its type
    const [productRows] = await db.execute(
      'SELECT id, name, type FROM products WHERE id = ? AND status = 1',
      [id]
    );

    if (productRows.length === 0) {
      return { error: 'Product not found' };
    }

    const product = productRows[0];

    // For simple products, return message
    if (product.type === 'simple') {
      return {
        product_id: product.id,
        product_type: 'simple',
        product_name: product.name,
        message: 'This is a simple product, no batches available'
      };
    }

    // For batch products, get all active stock items
    const [batchRows] = await db.execute(
      `SELECT id, batch_code, quantity, purchase_cost, selling_price, receipt_id, created_at, status
       FROM stock_items
       WHERE product_id = ? AND status = 1
       ORDER BY created_at ASC`,
      [id]
    );

    // Calculate total quantity
    const totalQuantity = batchRows.reduce((sum, batch) => sum + parseFloat(batch.quantity), 0);

    return {
      product_id: product.id,
      product_type: 'batch',
      product_name: product.name,
      total_quantity: totalQuantity,
      batches: batchRows
    };
  }
};

module.exports = productService;
