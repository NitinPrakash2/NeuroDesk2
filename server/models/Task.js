const { sql } = require('../config/db');

const createTasksTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      description TEXT,
      priority    TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
      due_date    TIMESTAMPTZ,
      source      TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai')),
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
};

module.exports = { createTasksTable };
