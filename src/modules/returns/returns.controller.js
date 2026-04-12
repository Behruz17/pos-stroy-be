const returnsService = require('./returns.service');

const returnsController = {
  getAll: async (req, res) => {
    try {
      const { date, month, year } = req.query;
      const returns = await returnsService.getAll({ date, month, year });
      res.json(returns);
    } catch (error) {
      console.error('Get all returns error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const returnRecord = await returnsService.getById(id);

      if (returnRecord.error) {
        if (returnRecord.error === 'Return not found') {
          return res.status(404).json({ error: returnRecord.error });
        }
        return res.status(400).json({ error: returnRecord.error });
      }

      res.json(returnRecord);
    } catch (error) {
      console.error('Get return by id error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { customer_id, items } = req.body;

      if (!customer_id) {
        return res.status(400).json({ error: 'Customer ID is required' });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items are required' });
      }

      for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0 || !item.unit_price) {
          return res.status(400).json({ error: 'Each item must have product_id, quantity > 0 and unit_price' });
        }
      }

      const result = await returnsService.create({
        created_by: req.user.id,
        customer_id,
        items
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create return error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await returnsService.remove(id);

      if (result.error) {
        if (result.error === 'Return not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Return deleted successfully' });
    } catch (error) {
      console.error('Delete return error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = returnsController;
