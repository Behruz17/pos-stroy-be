const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Suppliers Endpoints', () => {
  let adminToken;
  let userToken;
  let testSupplierId;
  const testTimestamp = Date.now();

  beforeAll(async () => {
    // Soft delete test data
    await db.execute('UPDATE suppliers SET status = 0 WHERE name LIKE ?', ['Test Supplier%']);
    await db.execute('UPDATE tokens SET status = 0 WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_suppliers_%']);
    await db.execute('UPDATE users SET status = 0 WHERE login LIKE ?', ['test_suppliers_%']);

    // Create admin user with status
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const [adminResult] = await db.execute(
      'INSERT INTO users (login, name, role, password_hash, status) VALUES (?, ?, ?, ?, ?)',
      [`test_suppliers_admin_${testTimestamp}`, 'Test Admin', 'ADMIN', hashedPassword, 1]
    );

    // Create regular user with status
    const [userResult] = await db.execute(
      'INSERT INTO users (login, name, role, password_hash, status) VALUES (?, ?, ?, ?, ?)',
      [`test_suppliers_user_${testTimestamp}`, 'Test User', 'USER', hashedPassword, 1]
    );

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        login: `test_suppliers_admin_${testTimestamp}`,
        password: 'password123'
      });
    adminToken = adminLogin.body.token;

    // Login as user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        login: `test_suppliers_user_${testTimestamp}`,
        password: 'password123'
      });
    userToken = userLogin.body.token;
  });

  afterAll(async () => {
    await db.execute('UPDATE suppliers SET status = 0 WHERE name LIKE ?', ['Test Supplier%']);
    await db.execute('UPDATE tokens SET status = 0 WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_suppliers_%']);
    await db.execute('UPDATE users SET status = 0 WHERE login LIKE ?', ['test_suppliers_%']);
  });

  describe('GET /api/suppliers', () => {
    it('should get all suppliers with token', async () => {
      const res = await request(app)
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/suppliers');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('GET /api/suppliers/:id', () => {
    beforeAll(async () => {
      const [result] = await db.execute(
        'INSERT INTO suppliers (name, phone, currency, status) VALUES (?, ?, ?, ?)',
        [`Test Supplier ${testTimestamp}`, '+992123456789', 'somoni', 1]
      );
      testSupplierId = result.insertId;
    });

    it('should get supplier by id with token', async () => {
      const res = await request(app)
        .get(`/api/suppliers/${testSupplierId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', testSupplierId);
      expect(res.body).toHaveProperty('name', `Test Supplier ${testTimestamp}`);
      expect(res.body).toHaveProperty('phone', '+992123456789');
      expect(res.body).toHaveProperty('currency', 'somoni');
      expect(res.body).toHaveProperty('balance', expect.any(String));
      expect(res.body).toHaveProperty('status', expect.any(Number));
    });

    it('should return 404 for non-existent supplier', async () => {
      const res = await request(app)
        .get('/api/suppliers/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Supplier not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get(`/api/suppliers/${testSupplierId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('POST /api/suppliers', () => {
    it('should create supplier with token', async () => {
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test Supplier Create ${testTimestamp}`,
          phone: '+992987654321',
          currency: 'dollar'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', `Test Supplier Create ${testTimestamp}`);
      expect(res.body).toHaveProperty('phone', '+992987654321');
      expect(res.body).toHaveProperty('currency', 'dollar');
      expect(res.body).toHaveProperty('balance', '0.00');
      expect(res.body).toHaveProperty('status', 1);
    });

    it('should create supplier with default currency', async () => {
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test Supplier Default ${testTimestamp}`
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('currency', 'somoni');
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phone: '+992123456789'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Name is required');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/suppliers')
        .send({
          name: 'Test Supplier'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('PUT /api/suppliers/:id', () => {
    let updateSupplierId;

    beforeAll(async () => {
      const [result] = await db.execute(
        'INSERT INTO suppliers (name, phone, currency, status) VALUES (?, ?, ?, ?)',
        [`Test Supplier Update ${testTimestamp}`, '+992000000000', 'somoni', 1]
      );
      updateSupplierId = result.insertId;
    });

    it('should update supplier with token', async () => {
      const res = await request(app)
        .put(`/api/suppliers/${updateSupplierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test Supplier Updated ${testTimestamp}`,
          phone: '+992111111111',
          status: 0,
          currency: 'yuan'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', updateSupplierId);
      expect(res.body).toHaveProperty('name', `Test Supplier Updated ${testTimestamp}`);
      expect(res.body).toHaveProperty('phone', '+992111111111');
      expect(res.body).toHaveProperty('status', 0);
      expect(res.body).toHaveProperty('currency', 'yuan');
    });

    it('should return 404 for non-existent supplier', async () => {
      const res = await request(app)
        .put('/api/suppliers/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Supplier'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Supplier not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .put(`/api/suppliers/${updateSupplierId}`)
        .send({
          name: 'Updated Supplier'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('DELETE /api/suppliers/:id', () => {
    let deleteSupplierId;

    beforeAll(async () => {
      const [result] = await db.execute(
        'INSERT INTO suppliers (name, phone, currency, status) VALUES (?, ?, ?, ?)',
        [`Test Supplier Delete ${testTimestamp}`, '+992222222222', 'somoni', 1]
      );
      deleteSupplierId = result.insertId;
    });

    it('should delete supplier with token', async () => {
      const res = await request(app)
        .delete(`/api/suppliers/${deleteSupplierId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Supplier deleted successfully');
    });

    it('should return 404 for non-existent supplier', async () => {
      const res = await request(app)
        .delete('/api/suppliers/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Supplier not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .delete(`/api/suppliers/${deleteSupplierId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });
});
