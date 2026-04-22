const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const sql = neon(process.env.DATABASE_URL);
const KEEP_TABLES = ['users', 'tasks', 'notes', 'goals', 'memories', 'files'];

const cleanup = async () => {
  try {
    const rows = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
    const allTables = rows.map(r => r.tablename);
    const toDrop = allTables.filter(t => !KEEP_TABLES.includes(t));

    console.log('📋 All tables found:', allTables.join(', ') || 'none');

    if (toDrop.length === 0) {
      console.log('✅ No unwanted tables found. DB is already clean.');
      return;
    }

    console.log('🗑️  Dropping unwanted tables:', toDrop.join(', '));

    // Build a single DROP TABLE statement as a plain string and run via neon's query method
    const dropStatement = `DROP TABLE IF EXISTS ${toDrop.map(t => `"${t}"`).join(', ')} CASCADE`;
    await sql([dropStatement]);

    console.log('\n✅ Cleanup complete!');
    console.log('🗑️  Dropped:', toDrop.join(', '));
    console.log('✅ Kept:', KEEP_TABLES.join(', '));
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
  }
};

cleanup();
