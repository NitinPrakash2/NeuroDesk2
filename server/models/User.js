const { sql } = require('../config/db');

const createUsersTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id        SERIAL PRIMARY KEY,
      name      TEXT NOT NULL,
      email     TEXT NOT NULL UNIQUE,
      password  TEXT,
      google_id TEXT UNIQUE,
      avatar    TEXT,
      notifications_cleared BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`;
  await sql`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expiry TIMESTAMPTZ`;

};

module.exports = { createUsersTable };
