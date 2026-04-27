const expenseService = require('./expense.service');

const expenseController = {
  getAll: async (req, res) => {
    try {
      const { date, month, year, type, created_by } = req.query;
      
      const filters = {};
      if (date) filters.date = date;
      if (month) filters.month = parseInt(month);
      if (year) filters.year = parseInt(year);
      if (type) filters.type = type;
      
      // USER can only see their own expenses, ADMIN can see all
      if (req.user.role !== 'ADMIN') {
        filters.created_by = req.user.id;
      } else if (created_by) {
        filters.created_by = parseInt(created_by);
      }

      const expenses = await expenseService.getAll(filters);
      res.json(expenses);
    } catch (error) {
      console.error('Get all expenses error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const expense = await expenseService.getById(id);

      if (expense.error) {
        if (expense.error === 'Expense not found') {
          return res.status(404).json({ error: expense.error });
        }
        return res.status(400).json({ error: expense.error });
      }

      // USER can only see their own expenses, ADMIN can see all
      if (req.user.role !== 'ADMIN' && expense.created_by !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(expense);
    } catch (error) {
      console.error('Get expense by id error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { description, account_id, amount, expense_date, type } = req.body;

      if (!description || !amount || amount <= 0 || !expense_date || !type) {
        return res.status(400).json({ 
          error: 'Description, positive amount, expense date and type are required' 
        });
      }

      if (!['shop', 'personal'].includes(type)) {
        return res.status(400).json({ 
          error: 'Type must be either "shop" or "personal"' 
        });
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(expense_date)) {
        return res.status(400).json({ 
          error: 'Invalid date format. Use YYYY-MM-DD' 
        });
      }

      const result = await expenseService.create({
        description,
        account_id,
        amount: parseFloat(amount),
        expense_date,
        type,
        created_by: req.user.id
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { description, amount, expense_date, type } = req.body;

      // First get the expense to check ownership
      const expense = await expenseService.getById(id);
      if (expense.error) {
        if (expense.error === 'Expense not found') {
          return res.status(404).json({ error: expense.error });
        }
        return res.status(400).json({ error: expense.error });
      }

      // USER can only update their own expenses, ADMIN can update all
      if (req.user.role !== 'ADMIN' && expense.created_by !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Validate amount if provided
      if (amount !== undefined && amount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }

      // Validate date format if provided
      if (expense_date !== undefined) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(expense_date)) {
          return res.status(400).json({ 
            error: 'Invalid date format. Use YYYY-MM-DD' 
          });
        }
      }

      // Validate type if provided
      if (type !== undefined && !['shop', 'personal'].includes(type)) {
        return res.status(400).json({ 
          error: 'Type must be either "shop" or "personal"' 
        });
      }

      const result = await expenseService.update(id, {
        description,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        expense_date,
        type
      });

      if (result.error) {
        if (result.error === 'Expense not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Expense updated successfully' });
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      // First get the expense to check ownership
      const expense = await expenseService.getById(id);
      if (expense.error) {
        if (expense.error === 'Expense not found') {
          return res.status(404).json({ error: expense.error });
        }
        return res.status(400).json({ error: expense.error });
      }

      // USER can only delete their own expenses, ADMIN can delete all
      if (req.user.role !== 'ADMIN' && expense.created_by !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await expenseService.remove(id);

      if (result.error) {
        if (result.error === 'Expense not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = expenseController;
