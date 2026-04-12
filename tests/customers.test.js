const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Customers Endpoints', () => {
  let adminToken;
  let userToken;
  let testCustomerId;
  const testTimestamp = Date.now();

  beforeAll(async () => {
    // Soft delete test data
    await db.execute('UPDATE customers SET status = 0 WHERE full_name LIKE ?', ['Test Customer%']);
    await db.execute('UPDATE tokens SET status = 0 WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_customers_%']);
    await db.execute('UPDATE users SET status = 0 WHERE login LIKE ?', ['test_customers_%']);

    // Create admin user with status
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const [adminResult] = await db.execute(
      'INSERT INTO users (login, name, role, password_hash, status) VALUES (?, ?, ?, ?, ?)',
      [`test_customers_admin_${testTimestamp}`, 'Test Admin', 'ADMIN', hashedPassword, 1]
    );

    // Create regular user with status
    const [userResult] = await db.execute(
      'INSERT INTO users (login, name, role, password_hash, status) VALUES (?, ?, ?, ?, ?)',
      [`test_customers_user_${testTimestamp}`, 'Test User', 'USER', hashedPassword, 1]
    );

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        login: `test_customers_admin_${testTimestamp}`,
        password: 'password123'
      });
    adminToken = adminLogin.body.token;

    // Login as user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        login: `test_customers_user_${testTimestamp}`,
        password: 'password123'
      });
    userToken = userLogin.body.token;
  });

  afterAll(async () => {
    await db.execute('UPDATE customers SET status = 0 WHERE full_name LIKE ?', ['Test Customer%']);
    await db.execute('UPDATE tokens SET status = 0 WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_customers_%']);
    await db.execute('UPDATE users SET status = 0 WHERE login LIKE ?', ['test_customers_%']);
  });

  describe('GET /api/customers', () => {
    it('should get all customers with token', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/customers');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('GET /api/customers/:id', () => {
    beforeAll(async () => {
      const [result] = await db.execute(
        'INSERT INTO customers (full_name, phone, balance) VALUES (?, ?, ?)',
        [`Test Customer ${testTimestamp}`, '+992123456789', 1000.50]
      );
      testCustomerId = result.insertId;
    });

    it('should get customer by id with token', async () => {
      const res = await request(app)
        .get(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', testCustomerId);
      expect(res.body).toHaveProperty('full_name', `Test Customer ${testTimestamp}`);
      expect(res.body).toHaveProperty('phone', '+992123456789');
      expect(res.body).toHaveProperty('balance', '1000.50');
      expect(res.body).toHaveProperty('created_at');
      expect(res.body).toHaveProperty('updated_at');
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await request(app)
        .get('/api/customers/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Customer not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get(`/api/customers/${testCustomerId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('POST /api/customers', () => {
    it('should create customer with token', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: `Test Customer Create ${testTimestamp}`,
          phone: '+992987654321'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('full_name', `Test Customer Create ${testTimestamp}`);
      expect(res.body).toHaveProperty('phone', '+992987654321');
      expect(res.body).toHaveProperty('balance', '0.00');
      expect(res.body).toHaveProperty('created_at');
      expect(res.body).toHaveProperty('updated_at');
    });

    it('should create customer without phone', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: `Test Customer No Phone ${testTimestamp}`
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('full_name', `Test Customer No Phone ${testTimestamp}`);
      expect(res.body.phone).toBeNull();
    });

    it('should return 400 when full_name is missing', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phone: '+992123456789'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Full name is required');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/customers')
        .send({
          full_name: 'Test Customer'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('PUT /api/customers/:id', () => {
    let updateCustomerId;

    beforeAll(async () => {
      const [result] = await db.execute(
        'INSERT INTO customers (full_name, phone, balance) VALUES (?, ?, ?)',
        [`Test Customer Update ${testTimestamp}`, '+992000000000', 500.00]
      );
      updateCustomerId = result.insertId;
    });

    it('should update customer with token', async () => {
      const res = await request(app)
        .put(`/api/customers/${updateCustomerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: `Test Customer Updated ${testTimestamp}`,
          phone: '+992111111111'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', updateCustomerId);
      expect(res.body).toHaveProperty('full_name', `Test Customer Updated ${testTimestamp}`);
      expect(res.body).toHaveProperty('phone', '+992111111111');
      expect(res.body).toHaveProperty('balance', '500.00');
    });

    it('should update customer and clear phone', async () => {
      const res = await request(app)
        .put(`/api/customers/${updateCustomerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: `Test Customer Updated ${testTimestamp}`,
          phone: null
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.phone).toBeNull();
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await request(app)
        .put('/api/customers/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: 'Updated Customer'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Customer not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .put(`/api/customers/${updateCustomerId}`)
        .send({
          full_name: 'Updated Customer'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('DELETE /api/customers/:id', () => {
    let deleteCustomerId;

    beforeAll(async () => {
      const [result] = await db.execute(
        'INSERT INTO customers (full_name, phone) VALUES (?, ?)',
        [`Test Customer Delete ${testTimestamp}`, '+992222222222']
      );
      deleteCustomerId = result.insertId;
    });

    it('should delete customer with token', async () => {
      const res = await request(app)
        .delete(`/api/customers/${deleteCustomerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Customer deleted successfully');
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await request(app)
        .delete('/api/customers/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Customer not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .delete(`/api/customers/${deleteCustomerId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });
});
