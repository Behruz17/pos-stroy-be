const supplierPaymentService = require('./supplier_payment.service');

const supplierPaymentController = {
  getAll: async (req, res) => {
    try {
      const payments = await supplierPaymentService.getAll();
      res.json(payments);
    } catch (error) {
      console.error('Get all supplier payments error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { supplier_id, account_id, sum } = req.body;

      if (!supplier_id || !sum || sum <= 0) {
        return res.status(400).json({ error: 'Supplier and positive sum are required' });
      }

      const result = await supplierPaymentService.create({
        supplier_id,
        account_id,
        sum,
        created_by: req.user.id
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create supplier payment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await supplierPaymentService.remove(id);

      if (result.error) {
        if (result.error === 'Payment not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
      console.error('Delete supplier payment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = supplierPaymentController;
