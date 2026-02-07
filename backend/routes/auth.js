import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const router = express.Router();

const getTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  const account = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: account.user, pass: account.pass },
  });
};

async function sendVerificationEmail(to, link) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Auth App" <no-reply@example.com>',
    to,
    subject: 'Verify your email',
    html: `<p>Verify your email: <a href="${link}">Click here</a></p>`,
  });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log('Email preview URL:', preview);
}

async function sendResetEmail(to, link) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Auth App" <no-reply@example.com>',
    to,
    subject: 'Reset your password',
    html: `<p>Reset password: <a href="${link}">Click here</a></p>`,
  });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log('Reset email preview URL:', preview);
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    const hash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await db.query(
      'INSERT INTO users (name, email, password, status, verification_token) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, 'unverified', verificationToken]
    );

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify?token=${verificationToken}`;
    try { await sendVerificationEmail(email, verificationLink); } catch(e){ console.error('EMAIL ERROR', e); }

    res.status(201).json({ ok: true, message: 'Registration successful. Check your email.' });
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const [[user]] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status === 'blocked') return res.status(403).json({ error: 'User blocked' });
    if (user.status === 'unverified') return res.status(403).json({ error: 'Please verify your email first' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    await db.query('UPDATE users SET last_login=NOW() WHERE id=?', [user.id]);
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token });
  } catch (e) {
    console.error('LOGIN ERROR:', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const [[user]] = await db.query('SELECT * FROM users WHERE verification_token=?', [token]);
    if (!user) return res.status(400).json({ error: 'Invalid token' });

    await db.query('UPDATE users SET status=?, verification_token=NULL WHERE id=?', ['active', user.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('VERIFY ERROR:', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const [[user]] = await db.query('SELECT id FROM users WHERE email=?', [email]);
    if (!user) return res.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60*60*1000);

    await db.query('UPDATE users SET reset_token=?, reset_expires=? WHERE id=?', [token, expires, user.id]);
    const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset?token=${token}`;
    await sendResetEmail(email, link);

    res.json({ ok: true });
  } catch (e) {
    console.error('FORGOT ERROR:', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password required' });

    const [[user]] = await db.query('SELECT * FROM users WHERE reset_token=?', [token]);
    if (!user) return res.status(400).json({ error: 'Invalid token' });
    if (user.reset_expires && new Date(user.reset_expires).getTime() < Date.now()) return res.status(400).json({ error: 'Token expired' });

    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password=?, reset_token=NULL, reset_expires=NULL WHERE id=?', [hash, user.id]);

    res.json({ ok: true });
  } catch (e) {
    console.error('RESET ERROR:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
