import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import authMiddleware from './middleware/auth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'The backend is launched!' });
});

app.use('/api/auth/admin', authMiddleware);
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`The backend is running on http://localhost:${PORT}`);
});
