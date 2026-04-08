const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

const connectDB = async () => {
  try {
    await sql`SELECT 1`;
    console.log('Neon PostgreSQL connected');
  } catch (err) {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { sql, connectDB };
