const stockAdjustmentService = require('./stock_adjustment.service');

const stockAdjustmentController = {
  getAll: async (req, res) => {
    try {
      const adjustments = await stockAdjustmentService.getAll();
      res.json(adjustments);
    } catch (error) {
      console.error('Get stock adjustments error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getByProductId: async (req, res) => {
    try {
      const { productId } = req.params;
      const adjustments = await stockAdjustmentService.getByProductId(productId);
      res.json(adjustments);
    } catch (error) {
      console.error('Get stock adjustments by product error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { product_id, new_quantity, reason } = req.body;

      if (!product_id || new_quantity === undefined) {
        return res.status(400).json({ error: 'product_id and new_quantity are required' });
      }

      if (typeof new_quantity !== 'number' || new_quantity < 0) {
        return res.status(400).json({ error: 'new_quantity must be a non-negative number' });
      }

      const adjustment = await stockAdjustmentService.create({
        product_id,
        new_quantity,
        reason,
        created_by: req.user.id
      });

      if (adjustment.error) {
        return res.status(400).json({ error: adjustment.error });
      }

      res.status(201).json(adjustment);
    } catch (error) {
      console.error('Create stock adjustment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await stockAdjustmentService.remove(id);

      if (result.error) {
        return res.status(404).json({ error: result.error });
      }

      res.json({ message: 'Stock adjustment deleted successfully' });
    } catch (error) {
      console.error('Delete stock adjustment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = stockAdjustmentController;
