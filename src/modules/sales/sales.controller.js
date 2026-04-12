const salesService = require('./sales.service');

const salesController = {
  getAll: async (req, res) => {
    try {
      const { date, month, year } = req.query;
      const sales = await salesService.getAll({ date, month, year });
      res.json(sales);
    } catch (error) {
      console.error('Get all sales error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const sale = await salesService.getById(id);

      if (sale.error) {
        if (sale.error === 'Sale not found') {
          return res.status(404).json({ error: sale.error });
        }
        return res.status(400).json({ error: sale.error });
      }

      res.json(sale);
    } catch (error) {
      console.error('Get sale by id error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { customer_id, payment_status, items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items are required' });
      }

      for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0 || !item.unit_price) {
          return res.status(400).json({ error: 'Each item must have product_id, quantity > 0 and unit_price' });
        }
      }

      const result = await salesService.create({
        created_by: req.user.id,
        customer_id,
        payment_status,
        items
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create sale error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { customer_id, payment_status, items } = req.body;

      if (items && (!Array.isArray(items) || items.length === 0)) {
        return res.status(400).json({ error: 'Items must be a non-empty array' });
      }

      if (items) {
        for (const item of items) {
          if (!item.product_id || !item.quantity || item.quantity <= 0 || !item.unit_price) {
            return res.status(400).json({ error: 'Each item must have product_id, quantity > 0 and unit_price' });
          }
        }
      }

      const result = await salesService.update(id, {
        customer_id,
        payment_status,
        items
      });

      if (result.error) {
        if (result.error === 'Sale not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error('Update sale error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await salesService.remove(id);

      if (result.error) {
        if (result.error === 'Sale not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Sale deleted successfully' });
    } catch (error) {
      console.error('Delete sale error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = salesController;
