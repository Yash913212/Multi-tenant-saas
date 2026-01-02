const fs = require('fs');
const path = require('path');
const db = require('../config/db');

/**
 * Wait until Postgres is actually ready
 * (Docker may say "ready" before it really is)
 */
async function waitForDb(retries = 15) {
  while (retries > 0) {
    try {
      await db.query('SELECT 1');
      console.log('Database is ready');
      return;
    } catch (err) {
      console.log('Waiting for database...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      retries--;
    }
  }
  throw new Error('Database not ready after waiting');
}

async function runMigrations() {
  // 🔥 Wait for Postgres first
  await waitForDb();

  // Create migrations table
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const alreadyRun = await db.query(
      'SELECT 1 FROM migrations WHERE name = $1',
      [file]
    );

    if (alreadyRun.rowCount > 0) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const upSql = sql.split('-- DOWN')[0];

    console.log(`Running migration: ${file}`);
    await db.query(upSql);
    await db.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [file]
    );
  }

  console.log('All migrations completed');
}

module.exports = runMigrations;
