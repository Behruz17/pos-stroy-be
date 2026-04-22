const db = require('./src/config/db');

async function runMigration() {
  try {
    await db.execute(`
      ALTER TABLE \`sales\`
      ADD COLUMN \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER \`created_at\`
    `);
    console.log('Migration completed: added updated_at column to sales table');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

runMigration();