const styleService = require('./style.service');

const styleController = {
  getAll: async (req, res) => {
    try {
      const styles = await styleService.getAll();
      res.json(styles);
    } catch (error) {
      console.error('Get all styles error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const style = await styleService.getById(id);

      if (!style) {
        return res.status(404).json({ error: 'Style not found' });
      }

      res.json(style);
    } catch (error) {
      console.error('Get style by id error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }

      if (name.length > 100) {
        return res.status(400).json({ error: 'Name must be less than 100 characters' });
      }

      if (description !== undefined && description.length > 500) {
        return res.status(400).json({ error: 'Description must be less than 500 characters' });
      }

      const result = await styleService.create({
        name: name.trim(),
        description: description?.trim() || null
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create style error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Validate name if provided
      if (name !== undefined) {
        if (!name || name.trim() === '') {
          return res.status(400).json({ error: 'Name cannot be empty' });
        }
        if (name.length > 100) {
          return res.status(400).json({ error: 'Name must be less than 100 characters' });
        }
      }

      // Validate description if provided
      if (description !== undefined && description.length > 500) {
        return res.status(400).json({ error: 'Description must be less than 500 characters' });
      }

      const result = await styleService.update(id, {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description.trim() : undefined
      });

      if (result.error) {
        if (result.error === 'Style not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Style updated successfully' });
    } catch (error) {
      console.error('Update style error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await styleService.remove(id);

      if (result.error) {
        if (result.error === 'Style not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Style deleted successfully' });
    } catch (error) {
      console.error('Delete style error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = styleController;
