const customerOperationsService = require('./customer_operations.service');

const customerOperationsController = {
  getAll: async (req, res) => {
    try {
      const { date, month, year, type, customer_id } = req.query;
      
      const filters = {};
      if (date) filters.date = date;
      if (month) filters.month = parseInt(month);
      if (year) filters.year = parseInt(year);
      if (type) filters.type = type;
      if (customer_id) filters.customer_id = parseInt(customer_id);
      
      const operations = await customerOperationsService.getAll(filters);
      
      res.json(operations);
    } catch (error) {
      console.error('Error getting customer operations:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const operation = await customerOperationsService.getById(parseInt(id));
      
      if (!operation) {
        return res.status(404).json({ error: 'Operation not found' });
      }
      
      res.json(operation);
    } catch (error) {
      console.error('Error getting customer operation:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

};

module.exports = customerOperationsController;
