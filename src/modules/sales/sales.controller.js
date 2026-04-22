const salesService = require('./sales.service');

const salesController = {
  getAll: async (req, res) => {
    try {
      const { date, month, year } = req.query;
      const sales = await salesService.getAll({ date, month, year });
      res.json(sales);
    } catch (error) {
      console.error('Get all sales error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const sale = await salesService.getById(id);

      if (sale.error) {
        if (sale.error === 'Sale not found') {
          return res.status(404).json({ error: sale.error });
        }
        return res.status(400).json({ error: sale.error });
      }

      res.json(sale);
    } catch (error) {
      console.error('Get sale by id error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { customer_id, payment_status, paid_amount, stage, account_id, debt_deadline, items } = req.body;

      // Validate payment_status
      const validPaymentStatuses = ['DEBT', 'PARTIAL', 'PAID'];
      if (payment_status && !validPaymentStatuses.includes(payment_status)) {
        return res.status(400).json({ error: `payment_status must be one of: ${validPaymentStatuses.join(', ')}` });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items are required' });
      }

      for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0 || !item.unit_price) {
          return res.status(400).json({ error: 'Each item must have product_id, quantity > 0 and unit_price' });
        }
        if (item.unit_value !== undefined && (typeof item.unit_value !== 'number' || item.unit_value <= 0)) {
          return res.status(400).json({ error: 'unit_value must be a positive number' });
        }
      }

      // Validate debt_deadline if provided
      if (debt_deadline && isNaN(Date.parse(debt_deadline))) {
        return res.status(400).json({ error: 'debt_deadline must be a valid date' });
      }

      // Validate stage if provided
      const validStages = ['ordered', 'ready', 'delivered'];
      if (stage && !validStages.includes(stage)) {
        return res.status(400).json({ error: `stage must be one of: ${validStages.join(', ')}` });
      }

      const result = await salesService.create({
        created_by: req.user.id,
        customer_id,
        payment_status,
        paid_amount,
        stage,
        account_id,
        debt_deadline,
        items
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create sale error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { customer_id, payment_status, paid_amount, debt_deadline, items } = req.body;

      if (items && (!Array.isArray(items) || items.length === 0)) {
        return res.status(400).json({ error: 'Items must be a non-empty array' });
      }

      // Validate debt_deadline if provided
      if (debt_deadline !== undefined && debt_deadline !== null && isNaN(Date.parse(debt_deadline))) {
        return res.status(400).json({ error: 'debt_deadline must be a valid date' });
      }

      if (items) {
        for (const item of items) {
          if (!item.product_id || !item.quantity || item.quantity <= 0 || !item.unit_price) {
            return res.status(400).json({ error: 'Each item must have product_id, quantity > 0 and unit_price' });
          }
          if (item.unit_value !== undefined && (typeof item.unit_value !== 'number' || item.unit_value <= 0)) {
            return res.status(400).json({ error: 'unit_value must be a positive number' });
          }
        }
      }

      const result = await salesService.update(id, {
        customer_id,
        payment_status,
        paid_amount,
        debt_deadline,
        items
      });

      if (result.error) {
        if (result.error === 'Sale not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error('Update sale error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await salesService.remove(id);

      if (result.error) {
        if (result.error === 'Sale not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Sale deleted successfully' });
    } catch (error) {
      console.error('Delete sale error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  addPartialPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, account_id } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }

      const result = await salesService.addPartialPayment(id, { amount, account_id });

      if (result.error) {
        if (result.error === 'Sale not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error('Add partial payment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  updateStage: async (req, res) => {
    try {
      const { id } = req.params;
      const { stage } = req.body;

      if (!stage) {
        return res.status(400).json({ error: 'stage is required' });
      }

      const validStages = ['ordered', 'ready', 'delivered'];
      if (!validStages.includes(stage)) {
        return res.status(400).json({ error: `stage must be one of: ${validStages.join(', ')}` });
      }

      const result = await salesService.updateStage(id, {
        stage,
        changed_by: req.user.id
      });

      if (result.error) {
        if (result.error === 'Sale not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error('Update stage error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getStageHistory: async (req, res) => {
    try {
      const { id } = req.params;

      const history = await salesService.getStageHistory(id);
      res.json(history);
    } catch (error) {
      console.error('Get stage history error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = salesController;
