const { sql } = require('../config/db');

async function addNotificationColumn() {
  try {
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS notifications_cleared BOOLEAN DEFAULT FALSE
    `;
    console.log('✅ notifications_cleared column added successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

addNotificationColumn();
