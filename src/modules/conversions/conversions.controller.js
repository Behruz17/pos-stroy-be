const conversionsService = require('./conversions.service');

const conversionsController = {
  // Get all conversions
  getAll: async (req, res) => {
    try {
      const { date, month, year } = req.query;
      const conversions = await conversionsService.getAll({ date, month, year });
      res.json(conversions);
    } catch (error) {
      console.error('Error fetching conversions:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get conversion by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const conversion = await conversionsService.getById(id);
      
      if (!conversion) {
        return res.status(404).json({ error: 'Conversion not found' });
      }
      
      res.json(conversion);
    } catch (error) {
      console.error('Error fetching conversion:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Create new conversion
  create: async (req, res) => {
    try {
      const { from_product_id, to_product_id, from_quantity, to_quantity, selling_price } = req.body;
      const created_by = req.user.id;

      // Validation
      if (!from_product_id || !to_product_id) {
        return res.status(400).json({ error: 'Both from_product_id and to_product_id are required' });
      }

      if (!from_quantity || from_quantity <= 0) {
        return res.status(400).json({ error: 'from_quantity must be a positive number' });
      }

      if (!to_quantity || to_quantity <= 0) {
        return res.status(400).json({ error: 'to_quantity must be a positive number' });
      }

      if (from_product_id === to_product_id) {
        return res.status(400).json({ error: 'Source and target products must be different' });
      }

      const result = await conversionsService.create({
        created_by,
        from_product_id,
        to_product_id,
        from_quantity,
        to_quantity,
        selling_price
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({
        id: result.id,
        message: 'Product conversion created successfully'
      });
    } catch (error) {
      console.error('Error creating conversion:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete conversion
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await conversionsService.delete(id);

      if (result.error) {
        return res.status(404).json({ error: result.error });
      }

      res.json({ message: result.message });
    } catch (error) {
      console.error('Error deleting conversion:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = conversionsController;
