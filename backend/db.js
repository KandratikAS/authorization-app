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

const { rows: hasPassword } = await db.query(`
  SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = $1 AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password'
`, [dbConfig.database]);
if (hasPassword.length === 0) {
  await db.query(`ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT ''`);
  console.log('✅ Column password added');
}

const { rows: hasVerifyToken } = await db.query(`
  SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = $1 AND TABLE_NAME = 'users' AND COLUMN_NAME = 'verification_token'
`, [dbConfig.database]);
if (hasVerifyToken.length === 0) {
  await db.query(`ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) NULL`);
  console.log('✅ Column verification_token added');
}

const { rows: hasResetToken } = await db.query(`
  SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = $1 AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_token'
`, [dbConfig.database]);
if (hasResetToken.length === 0) {
  await db.query(`ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL`);
  console.log('✅ Column reset_token added');
}

const { rows: hasResetExpires } = await db.query(`
  SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = $1 AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_expires'
`, [dbConfig.database]);
if (hasResetExpires.length === 0) {
  await db.query(`ALTER TABLE users ADD COLUMN reset_expires DATETIME NULL`);
  console.log('✅ Column reset_expires added');
}

const { rows: hasCreatedAt } = await db.query(`
  SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = $1 AND TABLE_NAME = 'users' AND COLUMN_NAME = 'created_at'
`, [dbConfig.database]);
if (hasCreatedAt.length === 0) {
  await db.query(`ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  console.log('✅ Column created_at added'); 
}
