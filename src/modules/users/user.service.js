const db = require('../../config/db');

const userService = {
  getAll: async () => {
    const [rows] = await db.execute(
      'SELECT id, login, name, role, created_at, status FROM users WHERE status = 1 ORDER BY created_at DESC'
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(
      'SELECT id, login, name, role, created_at, status FROM users WHERE id = ? AND status = 1',
      [id]
    );

    if (rows.length === 0) {
      return { error: 'User not found' };
    }

    return rows[0];
  },

  update: async (id, { login, name, role }) => {
    const [result] = await db.execute(
      'UPDATE users SET login = ?, name = ?, role = ? WHERE id = ? AND status = 1',
      [login, name || null, role, id]
    );

    if (result.affectedRows === 0) {
      return { error: 'User not found' };
    }

    const [updatedUser] = await db.execute(
      'SELECT id, login, name, role, created_at, status FROM users WHERE id = ? AND status = 1',
      [id]
    );

    return updatedUser[0];
  },

  remove: async (id) => {
    const [result] = await db.execute(
      'UPDATE users SET status = 0 WHERE id = ? AND status = 1',
      [id]
    );

    if (result.affectedRows === 0) {
      return { error: 'User not found' };
    }

    return { success: true };
  }
};

module.exports = userService;
