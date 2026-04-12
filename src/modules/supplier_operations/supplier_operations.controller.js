const supplierOperationsService = require('./supplier_operations.service');

const supplierOperationsController = {
  getAll: async (req, res) => {
    try {
      const { date, month, year, type, supplier_id } = req.query;
      
      const filters = {};
      if (date) filters.date = date;
      if (month) filters.month = parseInt(month);
      if (year) filters.year = parseInt(year);
      if (type) filters.type = type;
      if (supplier_id) filters.supplier_id = parseInt(supplier_id);
      
      const operations = await supplierOperationsService.getAll(filters);
      
      res.json(operations);
    } catch (error) {
      console.error('Error getting supplier operations:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const operation = await supplierOperationsService.getById(parseInt(id));
      
      if (!operation) {
        return res.status(404).json({ error: 'Operation not found' });
      }
      
      res.json(operation);
    } catch (error) {
      console.error('Error getting supplier operation:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

};

module.exports = supplierOperationsController;
