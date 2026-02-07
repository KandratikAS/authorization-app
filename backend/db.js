import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
};

const delay = ms => new Promise(r => setTimeout(r, ms));

async function connectWithRetry(retries = 10) {
  const connectionString = process.env.DATABASE_URL;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      let pool;
      if (connectionString) {
        pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
      } else {
        if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
          throw new Error('DB env vars missing: DB_HOST/DB_USER/DB_NAME');
        }
        pool = new Pool(dbConfig);
      }
      await pool.query('SELECT 1');
      return pool;
    } catch (err) {
      console.error(`DB connect attempt ${attempt} failed:`, err.message);
      if (attempt === retries) throw err;
      await delay(3000);
    }
  }
}

export const db = await connectWithRetry();

try {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      status TEXT DEFAULT 'active',
      verification_token VARCHAR(255),
      reset_token VARCHAR(255),
      reset_expires TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      last_login TIMESTAMP NULL
    )
  `);
  console.log('✅ Users table is ready (PostgreSQL)');
} catch (err) {
  console.error('DB init error:', err.message);
}
