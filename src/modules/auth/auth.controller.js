const authService = require('./auth.service');

const authController = {
  login: async (req, res) => {
    try {
      const { login, password } = req.body;

      if (!login || !password) {
        return res.status(400).json({ error: 'Login and password are required' });
      }

      const result = await authService.login(login, password);

      if (result.error) {
        return res.status(401).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  logout: async (req, res) => {
    try {
      await authService.logout(req.user.id);
      res.json({ message: 'ok' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  me: async (req, res) => {
    try {
      res.json({
        id: req.user.id,
        login: req.user.login,
        name: req.user.name,
        role: req.user.role
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  register: async (req, res) => {
    try {
      const hasUsers = await authService.hasUsers();

      if (hasUsers && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only administrators can create new users' });
      }

      const { login, password, name, role = 'USER' } = req.body;

      if (!login || !password) {
        return res.status(400).json({ error: 'Login and password are required' });
      }

      const result = await authService.register({ login, password, name, role });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({
        ...result,
        message: 'User created successfully'
      });
    } catch (error) {
      console.error('User registration error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = authController;
