import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Локальная или облачная конфигурация
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const delay = ms => new Promise(r => setTimeout(r, ms));

async function connectWithRetry(retries = 10) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const pool = new Pool(dbConfig);
      await pool.query('SELECT 1'); // проверка соединения
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

// Создание таблицы users
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
