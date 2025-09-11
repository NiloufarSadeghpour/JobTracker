const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});


const limiter = rateLimit({ windowMs: 15*60*1000, max: 30, standardHeaders: true, legacyHeaders: false });

const validators = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 chars'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('message').trim().isLength({ min: 10, max: 5000 }).withMessage('Message must be at least 10 chars'),
  body('subject').optional().trim().isLength({ max: 150 }).withMessage('Subject too long'),
  body('company').optional().custom(v => v === '').withMessage('Bot detected'), // honeypot
];

router.post('/', limiter, validators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

  const { name, email, subject = 'New Contact Message', message } = req.body;

  try {
    const sql = `
      INSERT INTO contact_messages (name, email, subject, message, ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [name, email, subject, message, req.ip, req.get('user-agent')];
    const [result] = await pool.execute(sql, params);

    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 465),
        secure: !!Number(process.env.EMAIL_SECURE || 1),
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      const safeSubject = `[Contact] ${subject || 'New Contact Message'}`.slice(0, 150);
      await transporter.sendMail({
        from: `"JobTracker Contact" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER,
        replyTo: `${name} <${email}>`,
        subject: safeSubject,
        text: message,
        html: `
          <h2>Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject || 'New Contact Message'}</p>
          <pre style="white-space:pre-wrap;font-family:system-ui, -apple-system, Segoe UI, Roboto">${message}</pre>
        `,
      });
    }

    res.status(200).json({ success: true, message: 'Message sent successfully!', deliveredTo: process.env.EMAIL_TO || process.env.EMAIL_USER });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;
