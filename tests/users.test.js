const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Users Endpoints', () => {
  let adminToken;
  let userToken;
  let adminId;
  let userId;
  const testTimestamp = Date.now();

  beforeAll(async () => {
    // Soft delete test data
    await db.execute('UPDATE tokens SET status = 0 WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_users_%']);
    await db.execute('UPDATE users SET status = 0 WHERE login LIKE ?', ['test_users_%']);

    // Create admin user with status
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const [adminResult] = await db.execute(
      'INSERT INTO users (login, name, role, password_hash, status) VALUES (?, ?, ?, ?, ?)',
      [`test_users_admin_${testTimestamp}`, 'Test Admin', 'ADMIN', hashedPassword, 1]
    );
    adminId = adminResult.insertId;

    // Create regular user with status
    const [userResult] = await db.execute(
      'INSERT INTO users (login, name, role, password_hash, status) VALUES (?, ?, ?, ?, ?)',
      [`test_users_user_${testTimestamp}`, 'Test User', 'USER', hashedPassword, 1]
    );
    userId = userResult.insertId;

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        login: `test_users_admin_${testTimestamp}`,
        password: 'password123'
      });
    adminToken = adminLogin.body.token;

    // Login as user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        login: `test_users_user_${testTimestamp}`,
        password: 'password123'
      });
    userToken = userLogin.body.token;
  });

  afterAll(async () => {
    await db.execute('UPDATE tokens SET status = 0 WHERE user_id IN (SELECT id FROM users WHERE login LIKE ?)', ['test_users_%']);
    await db.execute('UPDATE users SET status = 0 WHERE login LIKE ?', ['test_users_%']);
  });

  describe('GET /api/users', () => {
    it('should get all users with admin token', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('login');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('role');
      expect(res.body[0]).toHaveProperty('created_at');
    });

    it('should return 403 with user token', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Only administrators can view user list');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/users');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id with admin token', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('login', `test_users_user_${testTimestamp}`);
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('role', 'USER');
    });

    it('should return 403 with user token', async () => {
      const res = await request(app)
        .get(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Only administrators can view user details');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user with admin token', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          login: `test_users_user_${testTimestamp}`,
          name: 'Updated User Name',
          role: 'USER'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('name', 'Updated User Name');
      expect(res.body.message).toBe('User updated successfully');
    });

    it('should return 403 with user token', async () => {
      const res = await request(app)
        .put(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          login: `test_users_user_${testTimestamp}`,
          name: 'Updated',
          role: 'USER'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Only administrators can update users');
    });

    it('should return 400 when admin tries to change own role', async () => {
      const res = await request(app)
        .put(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          login: `test_users_admin_${testTimestamp}`,
          name: 'Test Admin',
          role: 'USER'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Administrators cannot change their own role');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          login: 'nonexistent',
          name: 'Nonexistent',
          role: 'USER'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({
          login: `test_users_user_${testTimestamp}`,
          name: 'Updated',
          role: 'USER'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });

  describe('DELETE /api/users/:id', () => {
    let deleteTestUserId;

    beforeAll(async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const [result] = await db.execute(
        'INSERT INTO users (login, name, role, password_hash, status) VALUES (?, ?, ?, ?, ?)',
        [`test_users_delete_${testTimestamp}`, 'Delete Test User', 'USER', hashedPassword, 1]
      );
      deleteTestUserId = result.insertId;
    });

    it('should delete user with admin token', async () => {
      const res = await request(app)
        .delete(`/api/users/${deleteTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('User deleted successfully');
    });

    it('should return 403 with user token', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Only administrators can delete users');
    });

    it('should return 400 when admin tries to delete themselves', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Administrators cannot delete themselves');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .delete('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .delete(`/api/users/${userId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Authorization token required');
    });
  });
});
