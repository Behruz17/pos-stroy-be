const db = require('../../config/db');

const debtorOperationsService = {
  getAll: async (filters = {}) => {
    const { date, month, year, type, debtor_id } = filters;
    
    let query = `
      SELECT do.*, d.full_name as debtor_name
      FROM debtor_operations do
      JOIN debtors d ON do.debtor_id = d.id AND d.status = 1
      WHERE do.status = 1
    `;
    
    const params = [];
    
    if (date) {
      query += ` AND DATE(do.date) = ?`;
      params.push(date);
    } else if (month && year) {
      query += ` AND MONTH(do.date) = ? AND YEAR(do.date) = ?`;
      params.push(month, year);
    } else if (year) {
      query += ` AND YEAR(do.date) = ?`;
      params.push(year);
    }
    
    if (type) {
      query += ` AND do.type = ?`;
      params.push(type);
    }
    
    if (debtor_id) {
      query += ` AND do.debtor_id = ?`;
      params.push(debtor_id);
    }
    
    query += ` ORDER BY do.date DESC`;
    
    const [rows] = await db.execute(query, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT do.*, d.full_name as debtor_name
      FROM debtor_operations do
      JOIN debtors d ON do.debtor_id = d.id AND d.status = 1
      WHERE do.id = ? AND do.status = 1
    `, [id]);
    
    return rows[0] || null;
  },

  createBorrowed: async (operationData) => {
    const { debtor_id, amount, description } = operationData;
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Create operation record
      const [result] = await connection.execute(
        'INSERT INTO debtor_operations (debtor_id, amount, type, description) VALUES (?, ?, ?, ?)',
        [debtor_id, amount, 'BORROWED', description || null]
      );
      
      // Update debtor debt amount
      await connection.execute(
        'UPDATE debtors SET debt_amount = debt_amount + ? WHERE id = ? AND status = 1',
        [amount, debtor_id]
      );
      
      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  createReturned: async (operationData) => {
    const { debtor_id, amount, description } = operationData;
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Check current debt amount
      const [debtorRows] = await connection.execute(
        'SELECT debt_amount FROM debtors WHERE id = ? AND status = 1',
        [debtor_id]
      );
      
      if (debtorRows.length === 0) {
        throw new Error('Debtor not found');
      }
      
      const currentDebt = parseFloat(debtorRows[0].debt_amount);
      
      if (amount > currentDebt) {
        throw new Error('Return amount cannot exceed current debt');
      }
      
      // Create operation record
      const [result] = await connection.execute(
        'INSERT INTO debtor_operations (debtor_id, amount, type, description) VALUES (?, ?, ?, ?)',
        [debtor_id, amount, 'RETURNED', description || null]
      );
      
      // Update debtor debt amount
      await connection.execute(
        'UPDATE debtors SET debt_amount = debt_amount - ? WHERE id = ? AND status = 1',
        [amount, debtor_id]
      );
      
      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  delete: async (id) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get operation details
      const [rows] = await connection.execute(
        'SELECT debtor_id, amount, type FROM debtor_operations WHERE id = ? AND status = 1',
        [id]
      );
      
      if (rows.length === 0) {
        await connection.rollback();
        connection.release();
        return false;
      }
      
      const { debtor_id, amount, type } = rows[0];
      
      // Reverse the debt amount change
      if (type === 'BORROWED') {
        await connection.execute(
          'UPDATE debtors SET debt_amount = debt_amount - ? WHERE id = ?',
          [amount, debtor_id]
        );
      } else if (type === 'RETURNED') {
        await connection.execute(
          'UPDATE debtors SET debt_amount = debt_amount + ? WHERE id = ?',
          [amount, debtor_id]
        );
      }
      
      // Soft delete operation
      await connection.execute(
        'UPDATE debtor_operations SET status = 0 WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = debtorOperationsService;
