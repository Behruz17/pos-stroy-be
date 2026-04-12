const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await db.execute('SELECT 1');
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
