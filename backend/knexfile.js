import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL ||
    `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

const shared = {
    client: 'pg',
    connection: connectionString,
    pool: { min: 2, max: 10 },
    migrations: {
        directory: path.resolve(__dirname, './migrations'),
        tableName: 'knex_migrations'
    },
    seeds: {
        directory: path.resolve(__dirname, './seeds')
    }
};

export default {
    development: shared,
    production: shared,
    test: shared
};