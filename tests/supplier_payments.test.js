const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Supplier Payments Endpoints', () => {
  let adminToken;
  let testSupplierId;
  let testPaymentId;
  const testTimestamp = Date.now();

  beforeAll(async () => {
    await db.execute('DELETE FROM supplier_operations WHERE type = ?', ['PAYMENT']);
    await db.execute('DELETE FROM tokens WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_supplier_pay_%']);
    await db.execute('DELETE FROM users WHERE login LIKE ?', ['test_supplier_pay_%']);
    await db.execute('DELETE FROM suppliers WHERE name LIKE ?', ['Test Payment Supplier%']);

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [adminResult] = await db.execute(
      'INSERT INTO users (login, name, role, password_hash) VALUES (?, ?, ?, ?)',
      [`test_supplier_pay_admin_${testTimestamp}`, 'Test Admin', 'ADMIN', hashedPassword]
    );

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        login: `test_supplier_pay_admin_${testTimestamp}`,
        password: 'password123'
      });
    adminToken = adminLogin.body.token;

    const [supplierResult] = await db.execute(
      'INSERT INTO suppliers (name, phone, currency, balance) VALUES (?, ?, ?, ?)',
      [`Test Payment Supplier ${testTimestamp}`, '+992123456789', 'somoni', 1000.00]
    );
    testSupplierId = supplierResult.insertId;
  });

  afterAll(async () => {
    await db.execute('DELETE FROM supplier_operations WHERE type = ?', ['PAYMENT']);
    await db.execute('DELETE FROM tokens WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_supplier_pay_%']);
    await db.execute('DELETE FROM users WHERE login LIKE ?', ['test_supplier_pay_%']);
    await db.execute('DELETE FROM suppliers WHERE id = ?', [testSupplierId]);
  });

  describe('GET /api/supplier-payments', () => {
    it('should get all supplier payments with token', async () => {
      const res = await request(app)
        .get('/api/supplier-payments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/supplier-payments');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/supplier-payments', () => {
    it('should create payment and reduce supplier balance', async () => {
      const res = await request(app)
        .post('/api/supplier-payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplier_id: testSupplierId,
          sum: 300.00
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('supplier_id', testSupplierId);
      expect(res.body).toHaveProperty('sum', expect.any(String));
      expect(res.body).toHaveProperty('type', 'PAYMENT');
      testPaymentId = res.body.id;

      // Verify balance reduced
      const [supplier] = await db.execute('SELECT balance FROM suppliers WHERE id = ?', [testSupplierId]);
      expect(parseFloat(supplier[0].balance)).toBe(700.00);
    });

    it('should return 400 when supplier_id is missing', async () => {
      const res = await request(app)
        .post('/api/supplier-payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sum: 100.00 });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Supplier and positive sum are required');
    });

    it('should return 400 when sum is invalid', async () => {
      const res = await request(app)
        .post('/api/supplier-payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplier_id: testSupplierId,
          sum: -100
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Supplier and positive sum are required');
    });

    it('should return 400 for non-existent supplier', async () => {
      const res = await request(app)
        .post('/api/supplier-payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplier_id: 99999,
          sum: 100.00
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Supplier not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/supplier-payments')
        .send({
          supplier_id: testSupplierId,
          sum: 100.00
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/supplier-payments/:id', () => {
    it('should delete payment and restore supplier balance', async () => {
      const res = await request(app)
        .delete(`/api/supplier-payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Payment deleted successfully');

      // Verify balance restored
      const [supplier] = await db.execute('SELECT balance FROM suppliers WHERE id = ?', [testSupplierId]);
      expect(parseFloat(supplier[0].balance)).toBe(1000.00);
    });

    it('should return 404 for non-existent payment', async () => {
      const res = await request(app)
        .delete('/api/supplier-payments/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .delete(`/api/supplier-payments/${testPaymentId}`);

      expect(res.statusCode).toBe(401);
    });
  });
});
