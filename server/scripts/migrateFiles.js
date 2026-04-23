const { sql } = require('../config/db');

const migrateFilesTable = async () => {
  try {
    console.log('Migrating files table...');
    
    // Add summary column if not exists
    await sql`
      ALTER TABLE files 
      ADD COLUMN IF NOT EXISTS summary TEXT,
      ADD COLUMN IF NOT EXISTS important_points TEXT
    `;
    
    console.log('Files table migrated successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
  }
};

migrateFilesTable();
