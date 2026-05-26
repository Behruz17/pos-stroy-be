const debtorOperationsService = require('./debtor_operations.service');

const debtorOperationsController = {
  getAll: async (req, res) => {
    try {
      const { date, month, year, type, debtor_id } = req.query;
      
      const filters = {};
      if (date) filters.date = date;
      if (month) filters.month = parseInt(month);
      if (year) filters.year = parseInt(year);
      if (type) filters.type = type;
      if (debtor_id) filters.debtor_id = parseInt(debtor_id);
      
      const operations = await debtorOperationsService.getAll(filters);
      
      res.json(operations);
    } catch (error) {
      console.error('Error getting debtor operations:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const operation = await debtorOperationsService.getById(parseInt(id));
      
      if (!operation) {
        return res.status(404).json({ error: 'Operation not found' });
      }
      
      res.json(operation);
    } catch (error) {
      console.error('Error getting debtor operation:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  createBorrowed: async (req, res) => {
    try {
      const { debtor_id, amount, description, account_id } = req.body;
      const created_by = req.user?.id || null;

      if (!debtor_id || !amount) {
        return res.status(400).json({ error: 'Debtor ID and amount are required' });
      }

      if (!account_id) {
        return res.status(400).json({ error: 'Account ID is required' });
      }

      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }

      const operationData = {
        debtor_id: parseInt(debtor_id),
        amount: parseFloat(amount),
        description,
        account_id: parseInt(account_id),
        created_by
      };

      const id = await debtorOperationsService.createBorrowed(operationData);

      const newOperation = await debtorOperationsService.getById(id);

      res.status(201).json(newOperation);
    } catch (error) {
      console.error('Error creating borrowed operation:', error);
      if (error.message === 'Debtor not found') {
        return res.status(404).json({ error: 'Debtor not found' });
      }
      if (error.message === 'Account not found') {
        return res.status(404).json({ error: 'Account not found' });
      }
      if (error.message === 'Account ID is required') {
        return res.status(400).json({ error: 'Account ID is required' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  },

  createReturned: async (req, res) => {
    try {
      const { debtor_id, amount, description, account_id } = req.body;
      const created_by = req.user?.id || null;

      if (!debtor_id || !amount) {
        return res.status(400).json({ error: 'Debtor ID and amount are required' });
      }

      if (!account_id) {
        return res.status(400).json({ error: 'Account ID is required' });
      }

      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }

      const operationData = {
        debtor_id: parseInt(debtor_id),
        amount: parseFloat(amount),
        description,
        account_id: parseInt(account_id),
        created_by
      };

      const id = await debtorOperationsService.createReturned(operationData);

      const newOperation = await debtorOperationsService.getById(id);

      res.status(201).json(newOperation);
    } catch (error) {
      console.error('Error creating returned operation:', error);
      if (error.message === 'Debtor not found') {
        return res.status(404).json({ error: 'Debtor not found' });
      }
      if (error.message === 'Account not found') {
        return res.status(404).json({ error: 'Account not found' });
      }
      if (error.message === 'Account ID is required') {
        return res.status(400).json({ error: 'Account ID is required' });
      }
      if (error.message === 'Return amount cannot exceed current debt') {
        return res.status(400).json({ error: 'Return amount cannot exceed current debt' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await debtorOperationsService.delete(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ error: 'Operation not found' });
      }
      
      res.json({ message: 'Operation deleted successfully' });
    } catch (error) {
      console.error('Error deleting debtor operation:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = debtorOperationsController;
