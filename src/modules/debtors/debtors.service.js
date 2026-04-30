const db = require('../../config/db');

const debtorsService = {
  getAll: async (filters = {}) => {
    const { date, month, year } = filters;
    
    let query = `
      SELECT * FROM debtors
      WHERE status = 1
    `;
    
    const params = [];
    
    if (date) {
      query += ` AND DATE(created_at) = ?`;
      params.push(date);
    } else if (month && year) {
      query += ` AND MONTH(created_at) = ? AND YEAR(created_at) = ?`;
      params.push(month, year);
    } else if (year) {
      query += ` AND YEAR(created_at) = ?`;
      params.push(year);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const [rows] = await db.execute(query, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(
      'SELECT * FROM debtors WHERE id = ? AND status = 1',
      [id]
    );
    
    return rows[0] || null;
  },

  create: async (debtorData) => {
    const { full_name, phone, initial_debt, description } = debtorData;
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Create debtor with initial_debt as debt_amount
      const [result] = await connection.execute(
        'INSERT INTO debtors (full_name, phone, debt_amount, description) VALUES (?, ?, ?, ?)',
        [full_name, phone || null, initial_debt || 0, description || null]
      );
      
      const debtorId = result.insertId;
      
      // If initial_debt > 0, create BORROWED operation
      if (initial_debt && parseFloat(initial_debt) > 0) {
        await connection.execute(
          'INSERT INTO debtor_operations (debtor_id, amount, type, description) VALUES (?, ?, ?, ?)',
          [debtorId, initial_debt, 'BORROWED', 'Начальный долг при создании']
        );
      }
      
      await connection.commit();
      return debtorId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  update: async (id, debtorData) => {
    const { full_name, phone, description } = debtorData;
    
    const [result] = await db.execute(
      'UPDATE debtors SET full_name = ?, phone = ?, description = ? WHERE id = ? AND status = 1',
      [full_name, phone || null, description || null, id]
    );
    
    return result.affectedRows > 0;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      'UPDATE debtors SET status = 0 WHERE id = ?',
      [id]
    );
    
    return result.affectedRows > 0;
  }
};

module.exports = debtorsService;
