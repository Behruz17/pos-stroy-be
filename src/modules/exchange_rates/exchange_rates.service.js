const db = require('../../config/db');

const exchangeRatesService = {
  // Get all rates
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT id, currency, rate_to_tjs, created_at, updated_at
      FROM exchange_rates
      WHERE status = 1
      ORDER BY currency
    `);
    return rows;
  },

  // Get rate by currency
  getByCurrency: async (currency) => {
    const [rows] = await db.execute(
      'SELECT id, currency, rate_to_tjs, created_at, updated_at FROM exchange_rates WHERE currency = ? AND status = 1',
      [currency]
    );
    return rows[0] || null;
  },

  // Get rate by ID
  getById: async (id) => {
    const [rows] = await db.execute(
      'SELECT id, currency, rate_to_tjs, created_at, updated_at FROM exchange_rates WHERE id = ? AND status = 1',
      [id]
    );
    return rows[0] || null;
  },

  // Update rate (insert if not exists, update if exists)
  update: async ({ currency, rate_to_tjs }) => {
    // Validation
    if (!currency || !['USD', 'RUB', 'TJS'].includes(currency)) {
      return { error: 'Currency must be one of: USD, RUB, TJS' };
    }

    if (rate_to_tjs === undefined || rate_to_tjs === null || isNaN(rate_to_tjs) || rate_to_tjs <= 0) {
      return { error: 'rate_to_tjs must be a positive number' };
    }

    // TJS always 1.0000
    if (currency === 'TJS') {
      rate_to_tjs = 1.0000;
    }

    try {
      // Use INSERT ... ON DUPLICATE KEY UPDATE
      const [result] = await db.execute(
        `INSERT INTO exchange_rates (currency, rate_to_tjs, status) 
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE 
         rate_to_tjs = VALUES(rate_to_tjs),
         updated_at = CURRENT_TIMESTAMP`,
        [currency, rate_to_tjs]
      );

      return { 
        currency,
        rate_to_tjs,
        message: 'Exchange rate updated successfully'
      };
    } catch (error) {
      throw error;
    }
  },

  // Get rate for currency (for calculations)
  getRate: async (currency) => {
    // TJS is always 1.0000
    if (currency === 'TJS') {
      return { currency: 'TJS', rate_to_tjs: 1.0000 };
    }

    const [rows] = await db.execute(
      'SELECT currency, rate_to_tjs FROM exchange_rates WHERE currency = ? AND status = 1',
      [currency]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  }
};

module.exports = exchangeRatesService;
