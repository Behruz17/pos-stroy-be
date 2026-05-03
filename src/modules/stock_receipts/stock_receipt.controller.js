const stockReceiptService = require('./stock_receipt.service');

const stockReceiptController = {
  getAll: async (req, res) => {
    try {
      const { date, month, year } = req.query;
      const receipts = await stockReceiptService.getAll({ date, month, year });
      res.json(receipts);
    } catch (error) {
      console.error('Get all receipts error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const receipt = await stockReceiptService.getById(id);

      if (receipt.error) {
        if (receipt.error === 'Stock receipt not found') {
          return res.status(404).json({ error: receipt.error });
        }
        return res.status(400).json({ error: receipt.error });
      }

      res.json(receipt);
    } catch (error) {
      console.error('Get receipt by id error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { supplier_id, items, currency = 'TJS', rate = 1.0000, delivery_cost } = req.body;

      if (!supplier_id) {
        return res.status(400).json({ error: 'Supplier is required' });
      }


      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items are required' });
      }

      for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
          return res.status(400).json({ error: 'Each item must have product_id and quantity > 0' });
        }
        
        // Валидация полей для расчета себестоимости на уровне позиции
        if (item.tonnage && (typeof item.tonnage !== 'number' || item.tonnage <= 0)) {
          return res.status(400).json({ error: 'Item tonnage must be a positive number' });
        }
        
        if (item.price_per_ton !== null && (typeof item.price_per_ton !== 'number' || item.price_per_ton <= 0)) {
          return res.status(400).json({ error: 'Item price per ton must be a positive number' });
        }
      }

      // Валидация delivery_cost на уровне прихода
      if (delivery_cost && (typeof delivery_cost !== 'number' || delivery_cost < 0)) {
        return res.status(400).json({ error: 'Delivery cost must be a non-negative number' });
      }

      // Validate currency
      const validCurrencies = ['TJS', 'USD', 'RUB'];
      if (!validCurrencies.includes(currency)) {
        return res.status(400).json({ error: 'Invalid currency. Must be TJS, USD, or RUB' });
      }

      // Validate rate
      if (typeof rate !== 'number' || rate <= 0) {
        return res.status(400).json({ error: 'Rate must be a positive number' });
      }

      const result = await stockReceiptService.create({
        created_by: req.user.id,
        supplier_id,
        items,
        currency,
        rate,
        delivery_cost
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create receipt error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await stockReceiptService.remove(id);

      if (result.error) {
        if (result.error === 'Stock receipt not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Stock receipt deleted successfully' });
    } catch (error) {
      console.error('Delete receipt error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = stockReceiptController;
