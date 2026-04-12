const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Stock Receipts Endpoints', () => {
  let adminToken;
  let testProductId;
  let testSupplierId;
  let testReceiptId;
  const testTimestamp = Date.now();

  beforeAll(async () => {
    // Simple cleanup - delete all related data directly
    await db.execute('DELETE FROM stock_receipt_items');
    await db.execute('DELETE FROM stock_receipts');
    await db.execute('DELETE FROM supplier_operations');
    await db.execute('DELETE FROM stock');
    await db.execute('DELETE FROM products WHERE name LIKE ?', ['Test Receipt%']);
    await db.execute('DELETE FROM suppliers WHERE name LIKE ?', ['Test Receipt%']);
    await db.execute('DELETE FROM tokens WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_receipts_%']);
    await db.execute('DELETE FROM users WHERE login LIKE ?', ['test_receipts_%']);

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [adminResult] = await db.execute(
      'INSERT INTO users (login, name, role, password_hash) VALUES (?, ?, ?, ?)',
      [`test_receipts_admin_${testTimestamp}`, 'Test Admin', 'ADMIN', hashedPassword]
    );

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        login: `test_receipts_admin_${testTimestamp}`,
        password: 'password123'
      });
    adminToken = adminLogin.body.token;

    const [productResult] = await db.execute(
      'INSERT INTO products (name, manufacturer, product_code) VALUES (?, ?, ?)',
      [`Test Receipt Product ${testTimestamp}`, 'Test Manufacturer', `RCP-${testTimestamp}`]
    );
    testProductId = productResult.insertId;

    const [supplierResult] = await db.execute(
      'INSERT INTO suppliers (name, phone, currency) VALUES (?, ?, ?)',
      [`Test Receipt Supplier ${testTimestamp}`, '+992123456789', 'somoni']
    );
    testSupplierId = supplierResult.insertId;
  });

  afterAll(async () => {
    // Cleanup in correct order
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE login LIKE ?', ['test_receipts_%']);
    for (const user of existingUsers) {
      const [receipts] = await db.execute('SELECT id FROM stock_receipts WHERE created_by = ?', [user.id]);
      for (const receipt of receipts) {
        await db.execute('DELETE FROM stock_receipt_items WHERE receipt_id = ?', [receipt.id]);
      }
      await db.execute('DELETE FROM stock_receipts WHERE created_by = ?', [user.id]);
      await db.execute('DELETE FROM tokens WHERE user_id = ?', [user.id]);
      await db.execute('DELETE FROM users WHERE id = ?', [user.id]);
    }
    
    await db.execute('DELETE FROM supplier_operations WHERE supplier_id = ?', [testSupplierId]);
    await db.execute('DELETE FROM stock WHERE product_id = ?', [testProductId]);
    await db.execute('DELETE FROM products WHERE id = ?', [testProductId]);
    await db.execute('DELETE FROM suppliers WHERE id = ?', [testSupplierId]);
  });

  describe('GET /api/stock-receipts', () => {
    it('should get all stock receipts with token', async () => {
      const res = await request(app)
        .get('/api/stock-receipts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/stock-receipts');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('POST /api/stock-receipts', () => {
    it('should create stock receipt with supplier and items', async () => {
      const res = await request(app)
        .post('/api/stock-receipts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplier_id: testSupplierId,
          items: [
            {
              product_id: testProductId,
              quantity: 10,
              purchase_cost: 50.00,
              selling_price: 75.00
            }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('total_amount', expect.any(String));
      testReceiptId = res.body.id;
    });

    it('should return 400 when supplier_id is missing', async () => {
      const res = await request(app)
        .post('/api/stock-receipts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product_id: testProductId,
              quantity: 5,
              purchase_cost: 30.00,
              selling_price: 50.00
            }
          ]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Supplier is required');
    });

    it('should return 400 when items are missing', async () => {
      const res = await request(app)
        .post('/api/stock-receipts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplier_id: testSupplierId
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Items are required');
    });

    it('should return 400 when product_id is missing', async () => {
      const res = await request(app)
        .post('/api/stock-receipts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplier_id: testSupplierId,
          items: [
            {
              quantity: 10,
              purchase_cost: 50.00
            }
          ]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Each item must have product_id and quantity > 0');
    });

    it('should return 400 when quantity is invalid', async () => {
      const res = await request(app)
        .post('/api/stock-receipts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplier_id: testSupplierId,
          items: [
            {
              product_id: testProductId,
              quantity: -5,
              purchase_cost: 50.00
            }
          ]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Each item must have product_id and quantity > 0');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/stock-receipts')
        .send({
          supplier_id: testSupplierId,
          items: [{ product_id: testProductId, quantity: 5 }]
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('GET /api/stock-receipts/:id', () => {
    it('should get stock receipt by id with items', async () => {
      const res = await request(app)
        .get(`/api/stock-receipts/${testReceiptId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', testReceiptId);
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent receipt', async () => {
      const res = await request(app)
        .get('/api/stock-receipts/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Stock receipt not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get(`/api/stock-receipts/${testReceiptId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('DELETE /api/stock-receipts/:id', () => {
    let deleteReceiptId;

    beforeAll(async () => {
      const [result] = await db.execute(
        'INSERT INTO stock_receipts (created_by, total_amount, supplier_id) VALUES (?, ?, ?)',
        [1, 100.00, testSupplierId]
      );
      deleteReceiptId = result.insertId;

      await db.execute(
        'INSERT INTO stock_receipt_items (receipt_id, product_id, quantity, purchase_cost, selling_price) VALUES (?, ?, ?, ?, ?)',
        [deleteReceiptId, testProductId, 5, 20.00, 30.00]
      );
    });

    it('should delete stock receipt with token', async () => {
      const res = await request(app)
        .delete(`/api/stock-receipts/${deleteReceiptId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Stock receipt deleted successfully');
    });

    it('should return 404 for non-existent receipt', async () => {
      const res = await request(app)
        .delete('/api/stock-receipts/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Stock receipt not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .delete(`/api/stock-receipts/${deleteReceiptId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });
});
