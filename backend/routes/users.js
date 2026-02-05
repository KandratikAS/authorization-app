import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/users/admin — вывод таблицы пользователей
router.get('', async (req, res) => {
  try {
    // Получаем всех пользователей
    const [users] = await db.query(`
      SELECT id, name, email, status, last_login
      FROM users
      ORDER BY id DESC
    `);

    // Функция для отображения времени "last login" в человекочитаемом виде
    const timeAgo = date => {
      if (!date) return 'never';
      const diff = Math.floor((Date.now() - new Date(date)) / 1000);
      if (diff < 60) return 'less than a minute ago';
      if (diff < 3600) return Math.floor(diff/60) + ' minutes ago';
      if (diff < 86400) return Math.floor(diff/3600) + ' hours ago';
      return Math.floor(diff/86400) + ' days ago';
    };

    // Format users for JSON response
    const formattedUsers = users.map(u => ({
      ...u,
      last_login: timeAgo(u.last_login)
    }));

    res.json(formattedUsers);

  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера');
  }
});

// PUT /api/users/block — заблокировать пользователей по списку email
router.put('/block', async (req, res) => {
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: 'Не передан список email-адресов' });
  }

  try {
    const placeholders = emails.map(() => '?').join(',');
    await db.query(
      `UPDATE users SET status = 'blocked' WHERE email IN (${placeholders})`,
      emails
    );
    res.json({ message: 'Пользователи заблокированы' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера при блокировке' });
  }
});

export default router;
