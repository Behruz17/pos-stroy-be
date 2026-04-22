const exchangeRatesService = require('./exchange_rates.service');

const exchangeRatesController = {
  // Get all rates
  getAll: async (req, res) => {
    try {
      const rates = await exchangeRatesService.getAll();
      res.json(rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get rate by currency
  getByCurrency: async (req, res) => {
    try {
      const { currency } = req.params;
      const rate = await exchangeRatesService.getByCurrency(currency);
      
      if (!rate) {
        return res.status(404).json({ error: 'Exchange rate not found' });
      }
      
      res.json(rate);
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get rate by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const rate = await exchangeRatesService.getById(id);
      
      if (!rate) {
        return res.status(404).json({ error: 'Exchange rate not found' });
      }
      
      res.json(rate);
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update rate (or create if not exists)
  update: async (req, res) => {
    try {
      const { currency, rate_to_tjs } = req.body;

      if (!currency || !rate_to_tjs) {
        return res.status(400).json({ error: 'currency and rate_to_tjs are required' });
      }

      const result = await exchangeRatesService.update({ currency, rate_to_tjs });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        currency: result.currency,
        rate_to_tjs: result.rate_to_tjs,
        message: result.message
      });
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = exchangeRatesController;
