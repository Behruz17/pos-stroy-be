const customerPaymentService = require('./customer_payment.service');

const customerPaymentController = {
  getAll: async (req, res) => {
    try {
      const payments = await customerPaymentService.getAll();
      res.json(payments);
    } catch (error) {
      console.error('Get customer payments error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { customer_id, account_id, sum } = req.body;

      if (!customer_id || !sum || sum <= 0) {
        return res.status(400).json({ error: 'Customer ID and positive sum are required' });
      }

      const result = await customerPaymentService.create({
        customer_id,
        account_id,
        sum,
        created_by: req.user.id
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create customer payment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await customerPaymentService.remove(id);

      if (result.error) {
        if (result.error === 'Payment not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Customer payment deleted successfully' });
    } catch (error) {
      console.error('Delete customer payment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = customerPaymentController;
