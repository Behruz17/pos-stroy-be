const supplierService = require('./supplier.service');

const supplierController = {
  getAll: async (req, res) => {
    try {
      const suppliers = await supplierService.getAll();
      res.json(suppliers);
    } catch (error) {
      console.error('Get suppliers error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const supplier = await supplierService.getById(id);

      if (supplier.error) {
        return res.status(404).json({ error: supplier.error });
      }

      res.json(supplier);
    } catch (error) {
      console.error('Get supplier error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { name, phone, currency = 'somoni' } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const supplier = await supplierService.create({ name, phone, currency });
      res.status(201).json(supplier);
    } catch (error) {
      console.error('Create supplier error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, phone, status, currency } = req.body;

      const supplier = await supplierService.update(id, { name, phone, status, currency });

      if (supplier.error) {
        return res.status(404).json({ error: supplier.error });
      }

      res.json(supplier);
    } catch (error) {
      console.error('Update supplier error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await supplierService.remove(id);

      if (result.error) {
        return res.status(404).json({ error: result.error });
      }

      res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      console.error('Delete supplier error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = supplierController;
