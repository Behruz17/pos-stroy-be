const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Products Endpoints', () => {
  let adminToken;
  let userToken;
  let testProductId;
  const testTimestamp = Date.now();

  beforeAll(async () => {
    // Soft delete test data
    await db.execute('UPDATE products SET status = 0 WHERE name LIKE ?', ['Test Product%']);
    await db.execute('UPDATE tokens SET status = 0 WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_products_%']);
    await db.execute('UPDATE users SET status = 0 WHERE login LIKE ?', ['test_products_%']);

    // Create admin user with status
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const [adminResult] = await db.execute(
      'INSERT INTO users (login, name, role, password_hash, status) VALUES (?, ?, ?, ?, ?)',
      [`test_products_admin_${testTimestamp}`, 'Test Admin', 'ADMIN', hashedPassword, 1]
    );

    // Create regular user with status
    const [userResult] = await db.execute(
      'INSERT INTO users (login, name, role, password_hash, status) VALUES (?, ?, ?, ?, ?)',
      [`test_products_user_${testTimestamp}`, 'Test User', 'USER', hashedPassword, 1]
    );

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        login: `test_products_admin_${testTimestamp}`,
        password: 'password123'
      });
    adminToken = adminLogin.body.token;

    // Login as user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        login: `test_products_user_${testTimestamp}`,
        password: 'password123'
      });
    userToken = userLogin.body.token;
  });

  afterAll(async () => {
    await db.execute('UPDATE products SET status = 0 WHERE name LIKE ?', ['Test Product%']);
    await db.execute('UPDATE tokens SET status = 0 WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_products_%']);
    await db.execute('UPDATE users SET status = 0 WHERE login LIKE ?', ['test_products_%']);
  });

  describe('GET /api/products', () => {
    it('should get all products with token', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/products');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('GET /api/products/:id', () => {
    beforeAll(async () => {
      const [result] = await db.execute(
        'INSERT INTO products (name, manufacturer, product_code, notification_threshold) VALUES (?, ?, ?, ?)',
        [`Test Product ${testTimestamp}`, 'Test Manufacturer', `CODE-${testTimestamp}`, 50]
      );
      testProductId = result.insertId;
    });

    it('should get product by id with token', async () => {
      const res = await request(app)
        .get(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', testProductId);
      expect(res.body).toHaveProperty('name', `Test Product ${testTimestamp}`);
      expect(res.body).toHaveProperty('manufacturer', 'Test Manufacturer');
      expect(res.body).toHaveProperty('product_code', `CODE-${testTimestamp}`);
      expect(res.body).toHaveProperty('notification_threshold', 50);
      expect(res.body).toHaveProperty('created_at');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .get('/api/products/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Product not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get(`/api/products/${testProductId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('POST /api/products', () => {
    it('should create product with token', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test Product Create ${testTimestamp}`,
          manufacturer: 'Test Manufacturer',
          product_code: `CREATE-${testTimestamp}`,
          image: 'https://example.com/image.jpg',
          notification_threshold: 100
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', `Test Product Create ${testTimestamp}`);
      expect(res.body).toHaveProperty('manufacturer', 'Test Manufacturer');
      expect(res.body).toHaveProperty('product_code', `CREATE-${testTimestamp}`);
      expect(res.body).toHaveProperty('image', 'https://example.com/image.jpg');
      expect(res.body).toHaveProperty('notification_threshold', 100);
    });

    it('should create product with default notification_threshold', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test Product Default ${testTimestamp}`,
          manufacturer: 'Test Manufacturer'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('notification_threshold', 10);
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          manufacturer: 'Test Manufacturer'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Name is required');
    });

    it('should return 400 when product_code already exists', async () => {
      const uniqueCode = `DUPLICATE-${testTimestamp}`;
      
      // Create first product
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `First Product ${testTimestamp}`,
          product_code: uniqueCode
        });

      // Try to create second with same code
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Second Product ${testTimestamp}`,
          product_code: uniqueCode
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Product with this code already exists');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          name: 'Test Product'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('PUT /api/products/:id', () => {
    let updateProductId;

    beforeAll(async () => {
      const [result] = await db.execute(
        'INSERT INTO products (name, manufacturer, product_code, notification_threshold) VALUES (?, ?, ?, ?)',
        [`Test Product Update ${testTimestamp}`, 'Old Manufacturer', `UPDATE-${testTimestamp}`, 20]
      );
      updateProductId = result.insertId;
    });

    it('should update product with token', async () => {
      const res = await request(app)
        .put(`/api/products/${updateProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test Product Updated ${testTimestamp}`,
          manufacturer: 'New Manufacturer',
          product_code: `UPDATED-${testTimestamp}`,
          notification_threshold: 30
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', updateProductId);
      expect(res.body).toHaveProperty('name', `Test Product Updated ${testTimestamp}`);
      expect(res.body).toHaveProperty('manufacturer', 'New Manufacturer');
      expect(res.body).toHaveProperty('product_code', `UPDATED-${testTimestamp}`);
      expect(res.body).toHaveProperty('notification_threshold', 30);
    });

    it('should return 400 when product_code already exists on another product', async () => {
      const uniqueTs = Date.now();
      const otherCode = `OTHER-${uniqueTs}`;
      
      // Create another product directly in DB
      await db.execute(
        'INSERT INTO products (name, product_code) VALUES (?, ?)',
        [`Other Product ${uniqueTs}`, otherCode]
      );

      // Try to update with existing code
      const res = await request(app)
        .put(`/api/products/${updateProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test Product Updated ${testTimestamp}`,
          product_code: otherCode
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Product with this code already exists');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .put('/api/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Product not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .put(`/api/products/${updateProductId}`)
        .send({
          name: 'Updated Product'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('DELETE /api/products/:id', () => {
    let deleteProductId;

    beforeAll(async () => {
      const [result] = await db.execute(
        'INSERT INTO products (name, manufacturer) VALUES (?, ?)',
        [`Test Product Delete ${testTimestamp}`, 'Test Manufacturer']
      );
      deleteProductId = result.insertId;
    });

    it('should delete product with token', async () => {
      const res = await request(app)
        .delete(`/api/products/${deleteProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Product deleted successfully');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .delete('/api/products/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Product not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .delete(`/api/products/${deleteProductId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });
});
