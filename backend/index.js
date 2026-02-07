import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import authMiddleware from './middleware/auth.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  'https://users-admin-frontend.onrender.com', 
  'http://localhost:5173'                     
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: '✅ The backend is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth/admin', authMiddleware);
app.use('/api/users', authMiddleware, userRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend is running on port ${PORT}`);
});
