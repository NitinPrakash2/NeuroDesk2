const { sql } = require('../config/db');

const createNotesTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title      TEXT NOT NULL,
      content    TEXT,
      color      TEXT DEFAULT 'orange',
      source     TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
};

module.exports = { createNotesTable };
