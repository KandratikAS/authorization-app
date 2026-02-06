import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.get('', async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT id, name, email, status, last_login, created_at
      FROM users
      ORDER BY id DESC
    `);

    const timeAgo = date => {
      if (!date) return 'never';
      const diff = Math.floor((Date.now() - new Date(date)) / 1000);
      if (diff < 60) return 'less than a minute ago';
      if (diff < 3600) return Math.floor(diff/60) + ' minutes ago';
      if (diff < 86400) return Math.floor(diff/3600) + ' hours ago';
      return Math.floor(diff/86400) + ' days ago';
    };

    const formattedUsers = users.map(u => ({
      ...u,
      last_login: timeAgo(u.last_login)
    }));

    res.json(formattedUsers);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.put('/block', async (req, res) => {
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: 'The list of email addresses was not provided.' });
  }

  try {
    const placeholders = emails.map(() => '?').join(',');
    await db.query(
      `UPDATE users SET status = 'blocked' WHERE email IN (${placeholders})`,
      emails
    );
    res.json({ message: 'Users are blocked (including current if selected)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while blocking' });
  }
});

router.post('/unblock', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No ID list passed' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    await db.query(`UPDATE users SET status='active' WHERE id IN (${placeholders})`, ids);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while unblocking' });
  }
});

router.post('/delete', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No ID list passed' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    await db.query(`DELETE FROM users WHERE id IN (${placeholders})`, ids);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while deleting' });
  }
});

router.post('/delete-unverified', async (req, res) => {
  const { ids } = req.body || {};
  try {
    if (Array.isArray(ids) && ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      await db.query(`DELETE FROM users WHERE status='unverified' AND id IN (${placeholders})`, ids);
    } else {
      await db.query(`DELETE FROM users WHERE status='unverified'`);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting unconfirmed' });
  }
});

export default router;
