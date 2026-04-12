const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Auth Endpoints', () => {
  let adminToken;
  let userToken;
  let testUserId;
  const testTimestamp = Date.now();

  // Clean up test data before all tests
  beforeAll(async () => {
    // Soft delete any existing test users and their tokens
    await db.execute('UPDATE tokens SET status = 0 WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_%']);
    await db.execute('UPDATE users SET status = 0 WHERE login LIKE ?', ['test_%']);
  });

  // Clean up after all tests
  afterAll(async () => {
    await db.execute('UPDATE tokens SET status = 0 WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_%']);
    await db.execute('UPDATE users SET status = 0 WHERE login LIKE ?', ['test_%']);
  });

  describe('POST /api/auth/register', () => {
    it('should create first admin user without token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          login: `test_admin_${testTimestamp}`,
          password: 'password123',
          name: 'Test Admin',
          role: 'ADMIN'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.login).toBe(`test_admin_${testTimestamp}`);
      expect(res.body.role).toBe('ADMIN');
      expect(res.body.message).toBe('User created successfully');
    });

    it('should require admin token when users exist', async () => {
      // First login to get admin token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          login: `test_admin_${testTimestamp}`,
          password: 'password123'
        });

      adminToken = loginRes.body.token;

      // Now try to register without token - should fail
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          login: `test_user_${testTimestamp}`,
          password: 'password123',
          name: 'Test User',
          role: 'USER'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });

    it('should create user with admin token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          login: `test_user_${testTimestamp}`,
          password: 'password123',
          name: 'Test User',
          role: 'USER'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.login).toBe(`test_user_${testTimestamp}`);
      expect(res.body.role).toBe('USER');
      testUserId = res.body.id;
    });

    it('should return 403 when USER tries to create new user', async () => {
      // Login as user
      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({
          login: `test_user_${testTimestamp}`,
          password: 'password123'
        });

      userToken = userLogin.body.token;

      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          login: `test_user2_${testTimestamp}`,
          password: 'password123',
          name: 'Test User 2',
          role: 'USER'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Only administrators can create new users');
    });

    it('should return 400 when login is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          password: 'password123',
          name: 'Test User',
          role: 'USER'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Login and password are required');
    });

    it('should return 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          login: `test_nopass_${testTimestamp}`,
          name: 'Test User',
          role: 'USER'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Login and password are required');
    });

    it('should return 400 when user already exists', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          login: `test_user_${testTimestamp}`,
          password: 'password123',
          name: 'Test User Duplicate',
          role: 'USER'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('User with this login already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          login: `test_admin_${testTimestamp}`,
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('login');
      expect(res.body.user).toHaveProperty('name');
      expect(res.body.user).toHaveProperty('role');
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('should return 400 when login is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Login and password are required');
    });

    it('should return 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          login: `test_admin_${testTimestamp}`
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Login and password are required');
    });

    it('should return 401 for invalid login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'nonexistent_user',
          password: 'password123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid login or password');
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          login: `test_admin_${testTimestamp}`,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid login or password');
    });

    it('should return same token on subsequent logins', async () => {
      const res1 = await request(app)
        .post('/api/auth/login')
        .send({
          login: `test_admin_${testTimestamp}`,
          password: 'password123'
        });

      const token1 = res1.body.token;

      const res2 = await request(app)
        .post('/api/auth/login')
        .send({
          login: `test_admin_${testTimestamp}`,
          password: 'password123'
        });

      const token2 = res2.body.token;

      expect(token1).toBe(token2);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('ok');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user info', async () => {
      // Re-login to get new token after logout
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          login: `test_admin_${testTimestamp}`,
          password: 'password123'
        });

      const token = loginRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('login');
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('role');
      expect(res.body.login).toBe(`test_admin_${testTimestamp}`);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });
  });
});
