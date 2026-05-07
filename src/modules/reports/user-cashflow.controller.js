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
      // - Admin can see all users (null = no filter)
      // - Regular users see only their own data
      if (!targetUserId) {
        if (req.user.role === 'ADMIN') {
          targetUserId = null; // Admin sees all users
        } else {
          targetUserId = req.user.id; // Regular user sees only self
        }
      } else {
        // If created_by is specified, only admin can access other users' data
        if (req.user.role !== 'ADMIN' && targetUserId !== req.user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }
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
