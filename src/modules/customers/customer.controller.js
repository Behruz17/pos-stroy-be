const customerService = require('./customer.service');

const customerController = {
  getAll: async (req, res) => {
    try {
      const customers = await customerService.getAll();
      res.json(customers);
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await customerService.getById(id);

      if (customer.error) {
        return res.status(404).json({ error: customer.error });
      }

      res.json(customer);
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { full_name, phone } = req.body;

      if (!full_name) {
        return res.status(400).json({ error: 'Full name is required' });
      }

      const customer = await customerService.create({ full_name, phone });
      res.status(201).json(customer);
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { full_name, phone } = req.body;

      const customer = await customerService.update(id, { full_name, phone });

      if (customer.error) {
        return res.status(404).json({ error: customer.error });
      }

      res.json(customer);
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await customerService.remove(id);

      if (result.error) {
        return res.status(404).json({ error: result.error });
      }

      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = customerController;
