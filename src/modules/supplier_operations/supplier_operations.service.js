const db = require('../../config/db');

const supplierOperationsService = {
  getAll: async (filters = {}) => {
    const { date, month, year, type, supplier_id } = filters;
    
    let query = `
      SELECT so.*, s.name as supplier_name
      FROM supplier_operations so
      JOIN suppliers s ON so.supplier_id = s.id AND s.status = 1
      WHERE so.status = 1
    `;
    
    const params = [];
    
    if (date) {
      query += ` AND DATE(so.date) = ?`;
      params.push(date);
    } else if (month && year) {
      query += ` AND MONTH(so.date) = ? AND YEAR(so.date) = ?`;
      params.push(month, year);
    } else if (year) {
      query += ` AND YEAR(so.date) = ?`;
      params.push(year);
    }
    
    if (type) {
      query += ` AND so.type = ?`;
      params.push(type);
    }
    
    if (supplier_id) {
      query += ` AND so.supplier_id = ?`;
      params.push(supplier_id);
    }
    
    query += ` ORDER BY so.date DESC`;
    
    const [rows] = await db.execute(query, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT so.*, s.name as supplier_name
      FROM supplier_operations so
      JOIN suppliers s ON so.supplier_id = s.id AND s.status = 1
      WHERE so.id = ? AND so.status = 1
    `, [id]);
    
    return rows[0] || null;
  },

};

module.exports = supplierOperationsService;
