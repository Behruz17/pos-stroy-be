const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Sales Endpoints', () => {
  let adminToken;
  let testProductId;
  let testCustomerId;
  let testSaleId;
  const testTimestamp = Date.now();

  beforeAll(async () => {
    // Simple cleanup
    await db.execute('DELETE FROM customer_operations');
    await db.execute('DELETE FROM sale_items');
    await db.execute('DELETE FROM sales');
    await db.execute('DELETE FROM tokens WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_sales_%']);
    await db.execute('DELETE FROM users WHERE login LIKE ?', ['test_sales_%']);
    await db.execute('DELETE FROM stock WHERE product_id IN (SELECT id FROM products WHERE name LIKE ?)', ['Test Sales%']);
    await db.execute('DELETE FROM products WHERE name LIKE ?', ['Test Sales%']);
    await db.execute('DELETE FROM customers WHERE full_name LIKE ?', ['Test Sales%']);

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [adminResult] = await db.execute(
      'INSERT INTO users (login, name, role, password_hash) VALUES (?, ?, ?, ?)',
      [`test_sales_admin_${testTimestamp}`, 'Test Admin', 'ADMIN', hashedPassword]
    );

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        login: `test_sales_admin_${testTimestamp}`,
        password: 'password123'
      });
    adminToken = adminLogin.body.token;

    const [productResult] = await db.execute(
      'INSERT INTO products (name, manufacturer, product_code) VALUES (?, ?, ?)',
      [`Test Sales Product ${testTimestamp}`, 'Test Manufacturer', `SALE-${testTimestamp}`]
    );
    testProductId = productResult.insertId;

    // Add stock for the product
    await db.execute(
      'INSERT INTO stock (product_id, quantity) VALUES (?, ?)',
      [testProductId, 100]
    );

    const [customerResult] = await db.execute(
      'INSERT INTO customers (full_name, phone) VALUES (?, ?)',
      [`Test Sales Customer ${testTimestamp}`, '+992123456789']
    );
    testCustomerId = customerResult.insertId;
  });

  afterAll(async () => {
    await db.execute('DELETE FROM customer_operations');
    await db.execute('DELETE FROM sale_items');
    await db.execute('DELETE FROM sales');
    await db.execute('DELETE FROM stock WHERE product_id = ?', [testProductId]);
    await db.execute('DELETE FROM products WHERE id = ?', [testProductId]);
    await db.execute('DELETE FROM customers WHERE id = ?', [testCustomerId]);
    await db.execute('DELETE FROM tokens WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_sales_%']);
    await db.execute('DELETE FROM users WHERE login LIKE ?', ['test_sales_%']);
  });

  describe('GET /api/sales', () => {
    it('should get all sales with token', async () => {
      const res = await request(app)
        .get('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/sales');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('POST /api/sales', () => {
    it('should create sale with customer and items (DEBT)', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_id: testCustomerId,
          payment_status: 'DEBT',
          items: [
            {
              product_id: testProductId,
              quantity: 5,
              unit_price: 100.00
            }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('total_amount', expect.any(String));
      testSaleId = res.body.id;
    });

    it('should create sale with PAID status', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_id: testCustomerId,
          payment_status: 'PAID',
          items: [
            {
              product_id: testProductId,
              quantity: 3,
              unit_price: 50.00
            }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('total_amount', expect.any(String));
    });

    it('should create sale without customer', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product_id: testProductId,
              quantity: 2,
              unit_price: 75.00
            }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    it('should return 400 when items are missing', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_id: testCustomerId
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Items are required');
    });

    it('should return 400 when product_id is missing', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_id: testCustomerId,
          items: [
            {
              quantity: 10,
              unit_price: 50.00
            }
          ]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Each item must have product_id, quantity > 0 and unit_price');
    });

    it('should return 400 when quantity is invalid', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_id: testCustomerId,
          items: [
            {
              product_id: testProductId,
              quantity: -5,
              unit_price: 50.00
            }
          ]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Each item must have product_id, quantity > 0 and unit_price');
    });

    it('should return 400 when stock is insufficient', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_id: testCustomerId,
          items: [
            {
              product_id: testProductId,
              quantity: 10000,
              unit_price: 50.00
            }
          ]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Insufficient stock/);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/sales')
        .send({
          customer_id: testCustomerId,
          items: [{ product_id: testProductId, quantity: 5, unit_price: 100 }]
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('GET /api/sales/:id', () => {
    it('should get sale by id with items', async () => {
      const res = await request(app)
        .get(`/api/sales/${testSaleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', testSaleId);
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('should return 404 for non-existent sale', async () => {
      const res = await request(app)
        .get('/api/sales/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Sale not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get(`/api/sales/${testSaleId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('DELETE /api/sales/:id', () => {
    let deleteSaleId;

    beforeAll(async () => {
      const [result] = await db.execute(
        'INSERT INTO sales (customer_id, total_amount, created_by, payment_status) VALUES (?, ?, ?, ?)',
        [testCustomerId, 200.00, 1, 'PAID']
      );
      deleteSaleId = result.insertId;

      await db.execute(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
        [deleteSaleId, testProductId, 4, 50.00, 200.00]
      );
    });

    it('should delete sale with token', async () => {
      const res = await request(app)
        .delete(`/api/sales/${deleteSaleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Sale deleted successfully');
    });

    it('should return 404 for non-existent sale', async () => {
      const res = await request(app)
        .delete('/api/sales/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Sale not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .delete(`/api/sales/${deleteSaleId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });
});
