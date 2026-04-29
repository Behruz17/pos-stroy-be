const salariesSimpleService = require('./salaries-simple.service');

const salariesSimpleController = {
  create: async (req, res) => {
    try {
      const { employee_id, month, year, total_amount } = req.body;

      if (!employee_id || !month || !year || !total_amount) {
        return res.status(400).json({ error: 'employee_id, month, year, and total_amount are required' });
      }

      if (month < 1 || month > 12) {
        return res.status(400).json({ error: 'Month must be between 1 and 12' });
      }

      if (year < 2000 || year > 2100) {
        return res.status(400).json({ error: 'Year must be between 2000 and 2100' });
      }

      const result = await salariesSimpleService.create({
        employee_id: parseInt(employee_id),
        month: parseInt(month),
        year: parseInt(year),
        total_amount: parseFloat(total_amount)
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create salary error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  createPayment: async (req, res) => {
    try {
      const { salary_id, account_id, amount, payment_date } = req.body;

      if (!salary_id || !amount || !payment_date) {
        return res.status(400).json({ error: 'salary_id, amount, and payment_date are required' });
      }

      if (amount <= 0) {
        return res.status(400).json({ error: 'Payment amount must be positive' });
      }

      const result = await salariesSimpleService.createPayment({
        salary_id: parseInt(salary_id),
        account_id,
        amount: parseFloat(amount),
        payment_date,
        created_by: req.user.id
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getAllEmployeesWithHistory: async (req, res) => {
    try {
      const employees = await salariesSimpleService.getAllEmployeesWithHistory();
      res.json(employees);
    } catch (error) {
      console.error('Get employees with history error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Оставляем для обратной совместимости
  getAllUsersWithHistory: async (req, res) => {
    try {
      const users = await salariesSimpleService.getAllUsersWithHistory();
      res.json(users);
    } catch (error) {
      console.error('Get users with history error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = salariesSimpleController;
