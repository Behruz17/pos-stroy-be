const db = require('../../config/db');

const overdueSalesService = {
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT s.*, c.full_name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id AND c.status = 1
      WHERE s.status = 1 
        AND s.payment_status = 'DEBT'
        AND s.debt_deadline IS NOT NULL
        AND s.debt_deadline < NOW()
      ORDER BY s.debt_deadline ASC
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`
      SELECT s.*, c.full_name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id AND c.status = 1
      WHERE s.id = ? 
        AND s.status = 1 
        AND s.payment_status = 'DEBT'
        AND s.debt_deadline IS NOT NULL
        AND s.debt_deadline < NOW()
    `, [id]);

    if (rows.length === 0) {
      return { error: 'Overdue sale not found' };
    }

    const sale = rows[0];

    const [items] = await db.execute(`
      SELECT si.*, p.name as product_name, p.product_code
      FROM sale_items si
      JOIN products p ON si.product_id = p.id AND p.status = 1
      WHERE si.sale_id = ? AND si.status = 1
    `, [id]);

    sale.items = items;
    return sale;
  },

  getOverdueSummary: async () => {
    const [rows] = await db.execute(`
      SELECT 
        COUNT(*) as total_overdue_sales,
        SUM(total_amount) as total_overdue_amount,
        COUNT(DISTINCT customer_id) as customers_with_debt,
        AVG(DATEDIFF(NOW(), debt_deadline)) as avg_days_overdue
      FROM sales 
      WHERE status = 1 
        AND payment_status = 'DEBT'
        AND debt_deadline IS NOT NULL
        AND debt_deadline < NOW()
    `);
    return rows[0];
  },

  getOverdueByCustomer: async () => {
    const [rows] = await db.execute(`
      SELECT 
        c.id as customer_id,
        c.full_name as customer_name,
        c.phone,
        COUNT(s.id) as overdue_sales_count,
        SUM(s.total_amount) as total_overdue_amount,
        MIN(s.debt_deadline) as earliest_deadline,
        MAX(s.debt_deadline) as latest_deadline,
        AVG(DATEDIFF(NOW(), s.debt_deadline)) as avg_days_overdue
      FROM customers c
      JOIN sales s ON c.id = s.customer_id
      WHERE c.status = 1 
        AND s.status = 1 
        AND s.payment_status = 'DEBT'
        AND s.debt_deadline IS NOT NULL
        AND s.debt_deadline < NOW()
      GROUP BY c.id, c.full_name, c.phone
      ORDER BY total_overdue_amount DESC
    `);
    return rows;
  }
};

module.exports = overdueSalesService;
