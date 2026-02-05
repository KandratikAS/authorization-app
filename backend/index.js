import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';

dotenv.config();
console.log(process.env.DB_HOST, process.cwd()) 
const app = express();
app.use(cors());
app.use(express.json());

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({ message: 'Бэкенд запущен!' });
});

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Обработка всех остальных маршрутов (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Запуск сервера
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Бэкенд запущен на http://localhost:${PORT}`);
});
