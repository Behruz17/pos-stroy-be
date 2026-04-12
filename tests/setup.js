// Test setup file
// Global test configuration and utilities

const db = require('../src/config/db');

// Global afterAll to close database connections
afterAll(async () => {
  await db.end();
});
