const overdueSalesService = require('./overdue-sales.service');

const overdueSalesController = {
  getAll: async (req, res) => {
    try {
      const overdueSales = await overdueSalesService.getAll();
      res.json(overdueSales);
    } catch (error) {
      console.error('Get overdue sales error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const sale = await overdueSalesService.getById(id);

      if (sale.error) {
        if (sale.error === 'Overdue sale not found') {
          return res.status(404).json({ error: sale.error });
        }
        return res.status(400).json({ error: sale.error });
      }

      res.json(sale);
    } catch (error) {
      console.error('Get overdue sale by id error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getSummary: async (req, res) => {
    try {
      const summary = await overdueSalesService.getOverdueSummary();
      res.json(summary);
    } catch (error) {
      console.error('Get overdue summary error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getByCustomer: async (req, res) => {
    try {
      const overdueByCustomer = await overdueSalesService.getOverdueByCustomer();
      res.json(overdueByCustomer);
    } catch (error) {
      console.error('Get overdue by customer error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = overdueSalesController;
