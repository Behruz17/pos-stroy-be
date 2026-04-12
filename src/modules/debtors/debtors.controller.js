const debtorsService = require('./debtors.service');

const debtorsController = {
  getAll: async (req, res) => {
    try {
      const { date, month, year } = req.query;
      
      const filters = {};
      if (date) filters.date = date;
      if (month) filters.month = parseInt(month);
      if (year) filters.year = parseInt(year);
      
      const debtors = await debtorsService.getAll(filters);
      
      res.json(debtors);
    } catch (error) {
      console.error('Error getting debtors:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const debtor = await debtorsService.getById(parseInt(id));
      
      if (!debtor) {
        return res.status(404).json({ error: 'Debtor not found' });
      }
      
      res.json(debtor);
    } catch (error) {
      console.error('Error getting debtor:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { full_name, phone, debt_amount, description } = req.body;
      
      if (!full_name || !debt_amount) {
        return res.status(400).json({ error: 'Full name and debt amount are required' });
      }
      
      if (parseFloat(debt_amount) <= 0) {
        return res.status(400).json({ error: 'Debt amount must be positive' });
      }
      
      const debtorData = {
        full_name,
        phone,
        debt_amount: parseFloat(debt_amount),
        description
      };
      
      const id = await debtorsService.create(debtorData);
      
      const newDebtor = await debtorsService.getById(id);
      
      res.status(201).json(newDebtor);
    } catch (error) {
      console.error('Error creating debtor:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { full_name, phone, debt_amount, description } = req.body;
      
      if (!full_name || !debt_amount) {
        return res.status(400).json({ error: 'Full name and debt amount are required' });
      }
      
      if (parseFloat(debt_amount) <= 0) {
        return res.status(400).json({ error: 'Debt amount must be positive' });
      }
      
      const debtorData = {
        full_name,
        phone,
        debt_amount: parseFloat(debt_amount),
        description
      };
      
      const updated = await debtorsService.update(parseInt(id), debtorData);
      
      if (!updated) {
        return res.status(404).json({ error: 'Debtor not found' });
      }
      
      const updatedDebtor = await debtorsService.getById(parseInt(id));
      
      res.json(updatedDebtor);
    } catch (error) {
      console.error('Error updating debtor:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await debtorsService.delete(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ error: 'Debtor not found' });
      }
      
      res.json({ message: 'Debtor deleted successfully' });
    } catch (error) {
      console.error('Error deleting debtor:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = debtorsController;
