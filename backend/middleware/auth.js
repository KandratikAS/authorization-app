import jwt from 'jsonwebtoken';
import { db } from '../db.js';

export default async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) return next();

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const [[user]] = await db.query(
      'SELECT status FROM users WHERE id=?',
      [payload.id]
    );

    if (!user || user.status === 'blocked') {
      return res.sendStatus(403); 
    }

    req.userId = payload.id;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.sendStatus(403); 
  }
};

