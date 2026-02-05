import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const router = express.Router();
console.log(process.env.SMTP_HOST, process.env.SMTP_USER, process.env.SMTP_PASS)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER || 'ethereal_user',
    pass: process.env.SMTP_PASS || 'ethereal_pass',
  },
});

/* ================= REGISTER ================= */

router.post('/register', async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);

    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await db.query(
      'INSERT INTO users (name, email, password, status, verification_token) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, 'unverified', verificationToken]
    );

    const verificationLink = `http://localhost:5173/verify?token=${verificationToken}`;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Auth App" <no-reply@example.com>',
        to: email,
        subject: "Verify your email",
        html: `<p>Please verify your email by clicking on the following link: <a href="${verificationLink}">Verify Email</a></p>`,
      });
    } catch (emailError) {
      console.error("EMAIL SEND ERROR:", emailError);
      // We might want to warn the user but still allow registration, 
      // or fail the registration. For now, let's log it.
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

    const [[user]] = await db.query(
      'SELECT * FROM users WHERE verification_token=?',
      [token]
    );

    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    await db.query(
      'UPDATE users SET status=?, verification_token=NULL WHERE id=?',
      ['active', user.id]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("VERIFY ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ================= LOGIN ================= */

router.post('/login', async (req, res) => {
  const [[user]] = await db.query(
    'SELECT * FROM users WHERE email=?',
    [req.body.email]
  );

  // if (!user || user.status === 'blocked') return res.sendStatus(403);

  const ok = await bcrypt.compare(req.body.password, user.password);
  if (!ok) return res.sendStatus(401);

  await db.query('UPDATE users SET last_login=NOW() WHERE id=?', [user.id]);

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ token });
});


export default router;
