const { sql } = require('../config/db');

const createFilesTable = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        size VARCHAR(50),
        type VARCHAR(50),
        content TEXT,
        summary TEXT,
        important_points TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('Files table ready');
  } catch (err) {
    console.error('Error creating files table:', err.message);
  }
};

module.exports = { createFilesTable };
