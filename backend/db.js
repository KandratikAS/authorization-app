import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
};

// Подключаемся к MySQL без базы
const connection = await mysql.createConnection({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
});

// Создаём базу, если её нет
await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
console.log(`✅ База ${dbConfig.database} готова`);

// Подключаемся к базе
export const db = await mysql.createConnection(dbConfig);

// Создаём таблицу users, если её нет
await db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    verification_token VARCHAR(255) NULL,
    status ENUM('active', 'blocked', 'unverified') DEFAULT 'active',
    last_login DATETIME NULL
  )
`);
console.log('✅ Таблица users готова');
