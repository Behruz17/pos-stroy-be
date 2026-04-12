const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Returns Endpoints', () => {
  let adminToken;
  let testProductId;
  let testCustomerId;
  let testSaleId;
  let testReturnId;
  const testTimestamp = Date.now();

  beforeAll(async () => {
    // Cleanup
    await db.execute('DELETE FROM return_items');
    await db.execute('DELETE FROM returns');
    await db.execute('DELETE FROM customer_operations');
    await db.execute('DELETE FROM sale_items');
    await db.execute('DELETE FROM sales');
    await db.execute('DELETE FROM tokens WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_returns_%']);
    await db.execute('DELETE FROM users WHERE login LIKE ?', ['test_returns_%']);
    await db.execute('DELETE FROM stock WHERE product_id IN (SELECT id FROM products WHERE name LIKE ?)', ['Test Returns%']);
    await db.execute('DELETE FROM products WHERE name LIKE ?', ['Test Returns%']);
    await db.execute('DELETE FROM customers WHERE full_name LIKE ?', ['Test Returns%']);

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [adminResult] = await db.execute(
      'INSERT INTO users (login, name, role, password_hash) VALUES (?, ?, ?, ?)',
      [`test_returns_admin_${testTimestamp}`, 'Test Admin', 'ADMIN', hashedPassword]
    );

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        login: `test_returns_admin_${testTimestamp}`,
        password: 'password123'
      });
    adminToken = adminLogin.body.token;

    const [productResult] = await db.execute(
      'INSERT INTO products (name, manufacturer, product_code) VALUES (?, ?, ?)',
      [`Test Returns Product ${testTimestamp}`, 'Test Manufacturer', `RET-${testTimestamp}`]
    );
    testProductId = productResult.insertId;

    await db.execute('INSERT INTO stock (product_id, quantity) VALUES (?, ?)', [testProductId, 50]);

    const [customerResult] = await db.execute(
      'INSERT INTO customers (full_name, phone) VALUES (?, ?)',
      [`Test Returns Customer ${testTimestamp}`, '+992123456789']
    );
    testCustomerId = customerResult.insertId;

    // Create a sale for return testing
    const [saleResult] = await db.execute(
      'INSERT INTO sales (customer_id, total_amount, created_by, payment_status) VALUES (?, ?, ?, ?)',
      [testCustomerId, 500.00, 1, 'DEBT']
    );
    testSaleId = saleResult.insertId;

    await db.execute(
      'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
      [testSaleId, testProductId, 10, 50.00, 500.00]
    );

    // Update customer balance
    await db.execute('UPDATE customers SET balance = balance + ? WHERE id = ?', [500.00, testCustomerId]);
  });

  afterAll(async () => {
    await db.execute('DELETE FROM return_items');
    await db.execute('DELETE FROM returns');
    await db.execute('DELETE FROM customer_operations');
    await db.execute('DELETE FROM sale_items');
    await db.execute('DELETE FROM sales');
    await db.execute('DELETE FROM stock WHERE product_id = ?', [testProductId]);
    await db.execute('DELETE FROM products WHERE id = ?', [testProductId]);
    await db.execute('DELETE FROM customers WHERE id = ?', [testCustomerId]);
    await db.execute('DELETE FROM tokens WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_returns_%']);
    await db.execute('DELETE FROM users WHERE login LIKE ?', ['test_returns_%']);
  });

  describe('GET /api/returns', () => {
    it('should get all returns with token', async () => {
      const res = await request(app)
        .get('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/returns');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/returns', () => {
    it('should create return with sale_id and items', async () => {
      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sale_id: testSaleId,
          items: [{ product_id: testProductId, quantity: 3, unit_price: 50.00 }]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      testReturnId = res.body.id;
    });

    it('should return 400 when sale_id is invalid', async () => {
      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sale_id: 99999,
          items: [{ product_id: testProductId, quantity: 2, unit_price: 50.00 }]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Sale not found');
    });

    it('should return 400 when items are missing', async () => {
      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sale_id: testSaleId });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Items are required');
    });
  });

  describe('GET /api/returns/:id', () => {
    it('should get return by id with items', async () => {
      const res = await request(app)
        .get(`/api/returns/${testReturnId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', testReturnId);
      expect(res.body).toHaveProperty('items');
    });

    it('should return 404 for non-existent return', async () => {
      const res = await request(app)
        .get('/api/returns/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/returns/:id', () => {
    it('should delete return with token', async () => {
      const res = await request(app)
        .delete(`/api/returns/${testReturnId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Return deleted successfully');
    });
  });
});
