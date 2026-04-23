const { sql } = require('../config/db');

const createNotificationsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type        TEXT NOT NULL,
      title       TEXT NOT NULL,
      sub         TEXT,
      icon        TEXT,
      color       TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
};

module.exports = { createNotificationsTable };
