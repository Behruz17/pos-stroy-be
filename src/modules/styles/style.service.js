const db = require('../../config/db');

const styleService = {
  // Get all active styles
  getAll: async () => {
    const [rows] = await db.execute(
      'SELECT * FROM styles WHERE status = 1 ORDER BY name ASC'
    );
    return rows;
  },

  // Get style by id
  getById: async (id) => {
    const [rows] = await db.execute(
      'SELECT * FROM styles WHERE id = ? AND status = 1',
      [id]
    );
    return rows[0] || null;
  },

  // Create new style
  create: async ({ name, description }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Check if style name already exists
      const [existingRows] = await connection.execute(
        'SELECT id FROM styles WHERE name = ? AND status = 1',
        [name]
      );

      if (existingRows.length > 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Style with this name already exists' };
      }

      const [result] = await connection.execute(
        'INSERT INTO styles (name, description, status) VALUES (?, ?, ?)',
        [name, description || null, 1]
      );

      await connection.commit();
      
      return { 
        id: result.insertId, 
        name, 
        description: description || null 
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update style
  update: async (id, { name, description }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Check if style exists
      const [styleRows] = await connection.execute(
        'SELECT id FROM styles WHERE id = ? AND status = 1',
        [id]
      );

      if (styleRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Style not found' };
      }

      // Check if new name already exists (excluding current style)
      if (name) {
        const [existingRows] = await connection.execute(
          'SELECT id FROM styles WHERE name = ? AND id != ? AND status = 1',
          [name, id]
        );

        if (existingRows.length > 0) {
          await connection.rollback();
          connection.release();
          return { error: 'Style with this name already exists' };
        }
      }

      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }

      if (updates.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'No fields to update' };
      }

      values.push(id);

      const [result] = await connection.execute(
        `UPDATE styles SET ${updates.join(', ')} WHERE id = ? AND status = 1`,
        values
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Style not found' };
      }

      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Delete style (soft delete)
  remove: async (id) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Check if style exists
      const [styleRows] = await connection.execute(
        'SELECT id FROM styles WHERE id = ? AND status = 1',
        [id]
      );

      if (styleRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Style not found' };
      }

      // Soft delete
      const [result] = await connection.execute(
        'UPDATE styles SET status = 0 WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Style not found' };
      }

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

module.exports = styleService;
