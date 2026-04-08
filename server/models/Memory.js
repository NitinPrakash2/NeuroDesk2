const { sql } = require('../config/db');

// Memory stores AI-extracted important info: passwords, dates, facts, reminders, etc.
const createMemoryTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS memories (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type       TEXT NOT NULL,   -- e.g. 'password', 'reminder', 'fact', 'contact', 'date'
      label      TEXT NOT NULL,   -- e.g. 'WiFi', 'Birthday', 'Doctor'
      value      TEXT NOT NULL,   -- the actual stored value
      raw_input  TEXT,            -- original sentence the user typed
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
};

module.exports = { createMemoryTable };
