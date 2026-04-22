const reportsService = require('./reports.service');

const reportsController = {
  // General report with summary statistics
  getGeneralReport: async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      const report = await reportsService.getGeneralReport({ start_date, end_date });
      res.json(report);
    } catch (error) {
      console.error('Get general report error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Sales report with detailed information
  getSalesReport: async (req, res) => {
    try {
      const { start_date, end_date, customer_id, payment_status } = req.query;
      const report = await reportsService.getSalesReport({ 
        start_date, 
        end_date, 
        customer_id, 
        payment_status 
      });
      res.json(report);
    } catch (error) {
      console.error('Get sales report error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Stock receipts (arrivals) report
  getArrivalsReport: async (req, res) => {
    try {
      const { start_date, end_date, supplier_id } = req.query;
      const report = await reportsService.getArrivalsReport({ 
        start_date, 
        end_date, 
        supplier_id 
      });
      res.json(report);
    } catch (error) {
      console.error('Get arrivals report error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Expenses report
  getExpensesReport: async (req, res) => {
    try {
      const { start_date, end_date, created_by } = req.query;
      const report = await reportsService.getExpensesReport({ 
        start_date, 
        end_date, 
        created_by 
      });
      res.json(report);
    } catch (error) {
      console.error('Get expenses report error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Daily summary report (итог дня)
  getDailySummary: async (req, res) => {
    try {
      const { date, usd_rate } = req.query;
      
      if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
      }
      
      const report = await reportsService.getDailySummary(date, usd_rate);
      res.json(report);
    } catch (error) {
      console.error('Get daily summary error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Save daily balance to cache
  saveDailyBalance: async (req, res) => {
    try {
      const { date, usd_rate, update_accounts } = req.body;
      
      if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
      }
      
      const updateAccounts = update_accounts !== false; // Default to true
      const result = await reportsService.saveDailyBalance(date, usd_rate, updateAccounts);
      res.json({
        success: true,
        message: 'Daily balance saved successfully',
        data: result
      });
    } catch (error) {
      console.error('Save daily balance error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get daily balance (from cache or calculate)
  getDailyBalance: async (req, res) => {
    try {
      const { date, usd_rate, force_recalculate } = req.query;
      
      if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
      }
      
      const forceRecalc = force_recalculate === 'true';
      const balance = await reportsService.getDailyBalance(date, usd_rate, forceRecalc);
      res.json(balance);
    } catch (error) {
      console.error('Get daily balance error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Update account balances with currency conversion
  updateAccountBalancesWithCurrency: async (req, res) => {
    try {
      const { date, usd_rate } = req.body;
      
      if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
      }
      
      const result = await reportsService.updateAccountBalancesWithCurrency(date, usd_rate);
      res.json(result);
    } catch (error) {
      console.error('Update account balances with currency error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get account with currency info
  getAccountWithCurrency: async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Account ID is required' });
      }
      
      const account = await reportsService.getAccountWithCurrency(id);
      res.json(account);
    } catch (error) {
      console.error('Get account with currency error:', error);
      if (error.message === 'Account not found') {
        return res.status(404).json({ error: 'Account not found' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get all accounts with currency info
  getAllAccountsWithCurrency: async (req, res) => {
    try {
      const accounts = await reportsService.getAllAccountsWithCurrency();
      res.json(accounts);
    } catch (error) {
      console.error('Get all accounts with currency error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Convert account currency
  convertAccountCurrency: async (req, res) => {
    try {
      const { id } = req.params;
      const { target_currency, usd_rate, amount } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Account ID is required' });
      }
      
      if (!target_currency) {
        return res.status(400).json({ error: 'Target currency is required' });
      }
      
      if (!usd_rate) {
        return res.status(400).json({ error: 'USD rate is required' });
      }
      
      const result = await reportsService.convertAccountCurrency(
        parseInt(id), 
        target_currency, 
        parseFloat(usd_rate), 
        amount ? parseFloat(amount) : null
      );
      
      res.json(result);
    } catch (error) {
      console.error('Convert account currency error:', error);
      if (error.message === 'Account not found') {
        return res.status(404).json({ error: 'Account not found' });
      }
      if (error.message === 'Insufficient balance for conversion') {
        return res.status(400).json({ error: 'Insufficient balance for conversion' });
      }
      if (error.message === 'Unsupported target currency') {
        return res.status(400).json({ error: 'Unsupported target currency' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get total balance across all accounts
  getTotalBalance: async (req, res) => {
    try {
      const { usd_rate } = req.query;
      const rate = usd_rate ? parseFloat(usd_rate) : null;
      
      const totalBalance = await reportsService.getTotalBalance(rate);
      res.json(totalBalance);
    } catch (error) {
      console.error('Get total balance error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = reportsController;
