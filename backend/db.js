import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('❌ DATABASE_URL не найден в .env');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const delay = ms => new Promise(r => setTimeout(r, ms));

async function connectWithRetry(retries = 10) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query('SELECT 1'); 
      console.log('✅ Database connected successfully');
      return pool;
    } catch (err) {
      console.error(`DB connect attempt ${attempt} failed:`, err.message);
      if (attempt === retries) throw err;
      await delay(3000);
    }
  }
}

export const db = await connectWithRetry();

async function initDB() {
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
}

await initDB();
