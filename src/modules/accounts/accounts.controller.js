const accountsService = require('./accounts.service');

const accountsController = {
  getAll: async (req, res) => {
    try {
      const accounts = await accountsService.getAll();
      res.json(accounts);
    } catch (error) {
      console.error('Get accounts error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const account = await accountsService.getById(id);

      if (account.error) {
        if (account.error === 'Account not found') {
          return res.status(404).json({ error: account.error });
        }
        return res.status(400).json({ error: account.error });
      }

      res.json(account);
    } catch (error) {
      console.error('Get account error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  createTransaction: async (req, res) => {
    try {
      const { account_id, type, amount, reference_type, reference_id, description } = req.body;

      if (!account_id || !type || !amount) {
        return res.status(400).json({ error: 'account_id, type, and amount are required' });
      }

      if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }

      const validTypes = ['INCOME', 'EXPENSE', 'TRANSFER'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
      }

      const validReferenceTypes = ['SALE', 'PURCHASE', 'SALARY', 'EXPENSE', 'CUSTOMER_PAYMENT', 'SUPPLIER_PAYMENT', 'TRANSFER', 'RETURN'];
      if (reference_type && !validReferenceTypes.includes(reference_type)) {
        return res.status(400).json({ error: 'Invalid reference type' });
      }

      const result = await accountsService.createTransaction({
        account_id: parseInt(account_id),
        type,
        amount: parseFloat(amount),
        reference_type,
        reference_id: reference_id ? parseInt(reference_id) : null,
        description
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = accountsController;
