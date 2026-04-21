const { sql } = require('../config/db');

const createGoalsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS goals (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      description TEXT,
      progress    INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
      ai_plan     TEXT,
      duration    TEXT,
      start_date  TIMESTAMPTZ DEFAULT NOW(),
      end_date    TIMESTAMPTZ,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // Add columns if they don't exist (for existing tables)
  await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS duration TEXT`;
  await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NOW()`;
  await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ`;
};

module.exports = { createGoalsTable };
