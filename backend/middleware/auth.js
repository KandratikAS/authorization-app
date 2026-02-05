import jwt from 'jsonwebtoken';
import { db } from '../db.js';

export default async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const [[user]] = await db.query(
      'SELECT status FROM users WHERE id=?',
      [payload.id]
    );

    if (!user || user.status === 'blocked') {
      return res.sendStatus(401);
    }

    req.userId = payload.id;
    next();
  } catch {
    res.sendStatus(401);
  }
};
