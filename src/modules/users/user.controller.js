const userService = require('./user.service');

const userController = {
  getAll: async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only administrators can view user list' });
      }

      const users = await userService.getAll();
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only administrators can view user details' });
      }

      const { id } = req.params;
      const user = await userService.getById(id);

      if (user.error) {
        return res.status(404).json({ error: user.error });
      }

      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only administrators can update users' });
      }

      const { id } = req.params;
      const { login, name, role } = req.body;

      if (parseInt(id) === req.user.id && role && role !== req.user.role) {
        return res.status(400).json({ error: 'Administrators cannot change their own role' });
      }

      const result = await userService.update(id, { login, name, role });

      if (result.error) {
        return res.status(404).json({ error: result.error });
      }

      res.json({
        ...result,
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only administrators can delete users' });
      }

      const { id } = req.params;

      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Administrators cannot delete themselves' });
      }

      const result = await userService.remove(id);

      if (result.error) {
        return res.status(404).json({ error: result.error });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = userController;
