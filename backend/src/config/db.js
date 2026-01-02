// const { Pool } = require('pg');

// const pool = new Pool({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   database: process.env.DB_NAME,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
// });

// pool.on('connect', () => {
//   console.log('PostgreSQL connected');
// });

// pool.on('error', (err) => {
//   console.error('Unexpected PG error', err);
//   process.exit(1);
// });

// module.exports = pool;




const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'saas_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

pool.on('connect', () => {
    console.log('PostgreSQL connected');
});

pool.on('error', (err) => {
    console.error('Unexpected PG error', err);
    process.exit(1);
});

// Export the pool directly (Fixes api/health)
module.exports = pool;