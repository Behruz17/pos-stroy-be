const userCashflowService = require('./user-cashflow.service');

const userCashflowController = {
  // Get all cash flow operations for user
  getUserCashflow: async (req, res) => {
    try {
      // All users can access their own cashflow
      // Parse created_by parameter
      const { start_date, end_date, created_by } = req.query;
      let targetUserId = null;
      if (created_by) {
        targetUserId = parseInt(created_by);
      }
      
      // If no created_by specified:
      // - All users see all users (null = no filter)
      // This provides complete overview for reporting
      if (!targetUserId) {
        targetUserId = null; // All users see all data
      } else {
        // If created_by is specified, allow all users to filter by any user
        // This is read-only access for reporting purposes
        // No access restriction needed for viewing cashflow data
      }
      
      const cashflow = await userCashflowService.getUserCashflow({ 
        start_date, 
        end_date, 
        created_by: targetUserId
      });
      res.json(cashflow);
    } catch (error) {
      console.error('Get user cashflow error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = userCashflowController;
