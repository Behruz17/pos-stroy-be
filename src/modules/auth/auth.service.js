const bcrypt = require('bcrypt');
const db = require('../../config/db');
const generateToken = require('../../utils/generateToken');

const authService = {
  hasUsers: async () => {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM users WHERE status = 1');
    return rows[0].count > 0;
  },

  login: async (login, password) => {
    const [users] = await db.execute(
      'SELECT id, login, name, role, password_hash FROM users WHERE login = ? AND status = 1',
      [login]
    );

    if (users.length === 0) {
      return { error: 'Invalid login or password' };
    }

    const user = users[0];

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return { error: 'Invalid login or password' };
    }

    let token;
    const [existingTokens] = await db.execute('SELECT token FROM tokens WHERE user_id = ? AND status = 1', [user.id]);

    if (existingTokens.length > 0) {
      token = existingTokens[0].token;
    } else {
      token = generateToken();
      await db.execute(
        'INSERT INTO tokens (user_id, token, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token), status = 1',
        [user.id, token, 1]
      );
    }

    return {
      token,
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        role: user.role
      }
    };
  },

  logout: async (userId) => {
    await db.execute('UPDATE tokens SET status = 0 WHERE user_id = ?', [userId]);
  },

  register: async ({ login, password, name, role }) => {
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE login = ? AND status = 1', [login]);

    if (existingUsers.length > 0) {
      return { error: 'User with this login already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO users (login, name, role, password_hash, status) VALUES (?, ?, ?, ?, ?)',
      [login, name || null, role, hashedPassword, 1]
    );

    const [newUser] = await db.execute(
      'SELECT id, login, name, role, created_at, status FROM users WHERE id = ? AND status = 1',
      [result.insertId]
    );

    return newUser[0];
  }
};

module.exports = authService;
