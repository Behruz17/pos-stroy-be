const db = require('../../config/db');

const productService = {
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT p.id, p.name, p.manufacturer, p.created_at, p.image, p.notification_threshold, p.product_code, p.status,
             COALESCE(s.quantity, 0) as stock_quantity
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE p.status = 1
      ORDER BY p.id
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT p.id, p.name, p.manufacturer, p.created_at, p.image, p.notification_threshold, p.product_code, p.status,
             COALESCE(s.quantity, 0) as stock_quantity
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE p.id = ? AND p.status = 1`,
      [id]
    );

    if (rows.length === 0) {
      return { error: 'Product not found' };
    }

    return rows[0];
  },

  create: async ({ name, manufacturer, image, notification_threshold, product_code }) => {
    if (product_code) {
      const [existing] = await db.execute(
        'SELECT id FROM products WHERE product_code = ? AND status = 1',
        [product_code]
      );
      if (existing.length > 0) {
        return { error: 'Product with this code already exists' };
      }
    }

    const [result] = await db.execute(
      'INSERT INTO products (name, manufacturer, image, notification_threshold, product_code, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, manufacturer || null, image || null, notification_threshold || 10, product_code || null, 1]
    );

    const [newProduct] = await db.execute(
      'SELECT id, name, manufacturer, created_at, image, notification_threshold, product_code, status FROM products WHERE id = ? AND status = 1',
      [result.insertId]
    );

    return newProduct[0];
  },

  update: async (id, { name, manufacturer, image, notification_threshold, product_code }) => {
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
      'SELECT id, name, manufacturer, created_at, image, notification_threshold, product_code, status FROM products WHERE id = ? AND status = 1',
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
  }
};

module.exports = productService;
