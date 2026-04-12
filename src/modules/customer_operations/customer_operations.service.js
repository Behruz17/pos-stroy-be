const db = require('../../config/db');

const customerOperationsService = {
  getAll: async (filters = {}) => {
    const { date, month, year, type, customer_id } = filters;
    
    let query = `
      SELECT co.*, c.full_name as customer_name
      FROM customer_operations co
      JOIN customers c ON co.customer_id = c.id AND c.status = 1
      WHERE co.status = 1
    `;
    
    const params = [];
    
    if (date) {
      query += ` AND DATE(co.date) = ?`;
      params.push(date);
    } else if (month && year) {
      query += ` AND MONTH(co.date) = ? AND YEAR(co.date) = ?`;
      params.push(month, year);
    } else if (year) {
      query += ` AND YEAR(co.date) = ?`;
      params.push(year);
    }
    
    if (type) {
      query += ` AND co.type = ?`;
      params.push(type);
    }
    
    if (customer_id) {
      query += ` AND co.customer_id = ?`;
      params.push(customer_id);
    }
    
    query += ` ORDER BY co.date DESC`;
    
    const [rows] = await db.execute(query, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT co.*, c.full_name as customer_name
      FROM customer_operations co
      JOIN customers c ON co.customer_id = c.id AND c.status = 1
      WHERE co.id = ? AND co.status = 1
    `, [id]);
    
    return rows[0] || null;
  },

};

module.exports = customerOperationsService;
