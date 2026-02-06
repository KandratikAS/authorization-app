import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
};

const connection = await mysql.createConnection({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
});

await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
console.log(`✅ База ${dbConfig.database} готова`);

export const db = await mysql.createConnection(dbConfig);

await db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'blocked', 'unverified') DEFAULT 'active',
    verification_token VARCHAR(255) NULL,
    reset_token VARCHAR(255) NULL,
    reset_expires DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL
  )
`);
console.log('✅ Users table is ready');

const [hasPassword] = await db.query(`
  SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password'
`, [dbConfig.database]);
if (hasPassword.length === 0) {
  await db.query(`ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT ''`);
  console.log('✅ Column password added');
}

const [hasVerifyToken] = await db.query(`
  SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'verification_token'
`, [dbConfig.database]);
if (hasVerifyToken.length === 0) {
  await db.query(`ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) NULL`);
  console.log('✅ Column verification_token added');
}

const [hasResetToken] = await db.query(`
  SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_token'
`, [dbConfig.database]);
if (hasResetToken.length === 0) {
  await db.query(`ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL`);
  console.log('✅ Column reset_token added');
}

const [hasResetExpires] = await db.query(`
  SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_expires'
`, [dbConfig.database]);
if (hasResetExpires.length === 0) {
  await db.query(`ALTER TABLE users ADD COLUMN reset_expires DATETIME NULL`);
  console.log('✅ Column reset_expires added');
}

const [hasCreatedAt] = await db.query(`
  SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'created_at'
`, [dbConfig.database]);
if (hasCreatedAt.length === 0) {
  await db.query(`ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  console.log('✅ Column created_at added'); 
}
