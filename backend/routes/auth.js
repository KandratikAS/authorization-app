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
    html: `<p>Please verify your email by clicking on the following link: <a href="${link}">Verify Email</a></p>`,
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
    html: `<p>To reset your password, click the link: <a href="${link}">Reset Password</a></p>`,
  });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log('Reset email preview URL:', preview);
}

router.post('/register', async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await db.query(
      'INSERT INTO users (name, email, password, status, verification_token) VALUES ($1, $2, $3, $4, $5)',
      [name, email, hash, 'unverified', verificationToken]
    );

    const verificationLink = `http://localhost:5173/verify?token=${verificationToken}`;

    try {
      await sendVerificationEmail(email, verificationLink);
    } catch (emailError) {
      console.error("EMAIL SEND ERROR:", emailError);
    }

    res.json({ ok: true, message: 'Registration successful. Please check your email to verify your account.' });
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    res.status(400).json({ error: e.message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const { rows } = await db.query('SELECT * FROM users WHERE verification_token=$1', [token]);
    const user = rows[0];

    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    await db.query('UPDATE users SET status=$1, verification_token=NULL WHERE id=$2', ['active', user.id]);

    res.json({ ok: true });
  } catch (e) {
    console.error("VERIFY ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { rows } = await db.query('SELECT id, email FROM users WHERE email=$1', [email]);
    const user = rows[0];
    if (!user) return res.json({ ok: true }); // Don't reveal email existence

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query('UPDATE users SET reset_token=$1, reset_expires=$2 WHERE id=$3', [token, expires, user.id]);

    const link = `http://localhost:5173/reset?token=${token}`;
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
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });

    const { rows } = await db.query('SELECT * FROM users WHERE reset_token=$1', [token]);
    const user = rows[0];

    if (!user) return res.status(400).json({ error: 'Invalid token' });
    if (user.reset_expires && new Date(user.reset_expires).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Token expired' });
    }

    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'UPDATE users SET password=$1, reset_token=NULL, reset_expires=NULL WHERE id=$2',
      [hash, user.id]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error('RESET ERROR:', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const demoEmail = process.env.DEMO_EMAIL;
    const demoPassword = process.env.DEMO_PASSWORD;
    if (demoEmail && demoPassword && email === demoEmail && password === demoPassword) {
      const { rows: existingRows } = await db.query('SELECT * FROM users WHERE email=$1', [demoEmail]);
      const existing = existingRows[0];
      const hash = await bcrypt.hash(demoPassword, 10);

      if (!existing) {
        await db.query(
          "INSERT INTO users (name, email, password, status) VALUES ($1, $2, $3, 'active')",
          ['Demo', demoEmail, hash]
        );
      } else {
        await db.query(
          'UPDATE users SET password=$1, status=$2, verification_token=NULL WHERE id=$3',
          [hash, 'active', existing.id]
        );
      }
    }

    const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = rows[0];

    if (!user || user.status === 'blocked') return res.sendStatus(403);
    if (user.status === 'unverified') return res.status(403).json({ error: 'Please verify your email first' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.sendStatus(401);

    await db.query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (e) {
    console.error('LOGIN ERROR:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
