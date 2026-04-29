const expenseRecipientService = require('./expense_recipient.service');

const expenseRecipientController = {
  getAll: async (req, res) => {
    try {
      const recipients = await expenseRecipientService.getAll();
      res.json(recipients);
    } catch (error) {
      console.error('Get expense recipients error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const recipient = await expenseRecipientService.getById(id);

      if (recipient.error) {
        return res.status(404).json({ error: recipient.error });
      }

      res.json(recipient);
    } catch (error) {
      console.error('Get expense recipient error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { name, type, reference_id } = req.body;

      const recipient = await expenseRecipientService.create({
        name,
        type,
        reference_id
      });

      if (recipient.error) {
        return res.status(400).json({ error: recipient.error });
      }

      res.status(201).json(recipient);
    } catch (error) {
      console.error('Create expense recipient error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, type, reference_id } = req.body;

      const recipient = await expenseRecipientService.update(id, {
        name,
        type,
        reference_id
      });

      if (recipient.error) {
        if (recipient.error === 'Expense recipient not found') {
          return res.status(404).json({ error: recipient.error });
        }
        return res.status(400).json({ error: recipient.error });
      }

      res.json(recipient);
    } catch (error) {
      console.error('Update expense recipient error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await expenseRecipientService.remove(id);

      if (result.error) {
        return res.status(404).json({ error: result.error });
      }

      res.json({ message: 'Expense recipient deleted successfully' });
    } catch (error) {
      console.error('Delete expense recipient error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Синхронизация сотрудников с получателями расходов
  syncEmployees: async (req, res) => {
    try {
      const result = await expenseRecipientService.syncEmployees();
      res.json(result);
    } catch (error) {
      console.error('Sync employees error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = expenseRecipientController;
