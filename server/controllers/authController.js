// controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const util = require('util');

// Promisify MySQL queries for async/await
const query = util.promisify(db.query).bind(db);

// ---- CONFIG ----
const ACCESS_TTL = '10m';       // short-lived access token
const REFRESH_TTL_DAYS = 30;    // long-lived refresh token (when rememberMe=true)
const isProd = process.env.NODE_ENV === 'production';

// ---- HELPERS ----
function signAccessToken(user) {
  // Keep payload minimal: subject (user id) + email for convenience
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefreshToken(user, remember) {
  // Encode a 'typ' claim and the 'remember' flag so we can preserve persistence on rotation
  return jwt.sign(
    { sub: user.id, typ: 'refresh', remember: !!remember },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TTL_DAYS}d` }
  );
}

function setRefreshCookie(res, token, remember) {
  // Scope broadly to '/' so path changes/proxies won't drop the cookie
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,            // only true under HTTPS in production
    sameSite: 'lax',           // safe default for typical SPA flows
    path: '/',                 // broader path so /api/auth and others can read if needed
    ...(remember ? { maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000 } : {}), // session cookie if not remembered
  });
}

function clearRefreshCookie(res) {
  // Must match the same path/options used to set
  res.clearCookie('refreshToken', { path: '/' });
}

// ---- CONTROLLERS ----
exports.register = async (req, res) => {
  try {
    const { name, password } = req.body || {};
    const email = (req.body?.email || '').trim().toLowerCase();

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPass.test(password)) {
      return res.status(400).json({
        message:
          'Weak password. Use at least 8 characters, with uppercase, lowercase, number, and symbol.',
      });
    }

    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [
      name,
      email,
      hashedPassword,
    ]);

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'DB error', err });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const emailNorm = email.trim().toLowerCase();
    const rows = await query('SELECT * FROM users WHERE email = ?', [emailNorm]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user, rememberMe);
    setRefreshCookie(res, refreshToken, !!rememberMe);

    return res.json({
      accessToken,
      user: { id: user.id, name: user.username, email: user.email },
    });
  } catch (err) {
    return res.status(500).json({ message: 'DB error', err });
  }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    // Verify refresh token
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Hard check: must be a refresh token
    if (payload.typ !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const rows = await query('SELECT id, username, email FROM users WHERE id = ?', [payload.sub]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = rows[0];

    // Rotate refresh token, preserving remember flag
    const newRefresh = signRefreshToken(user, payload.remember);
    setRefreshCookie(res, newRefresh, !!payload.remember);

    // Issue new access token
    const accessToken = signAccessToken(user);

    return res.json({
      accessToken,
      user: { id: user.id, name: user.username, email: user.email },
    });
  } catch (err) {
    // Token verification errors end up here too (expired/invalid)
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.logout = (req, res) => {
  clearRefreshCookie(res);
  return res.json({ message: 'Logged out' });
};

exports.me = async (req, res) => {
  // Requires verifyAccess middleware to populate req.user
  try {
    const rows = await query('SELECT id, username, email FROM users WHERE id = ?', [req.user.sub]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }
    const u = rows[0];
    return res.json({ id: u.id, name: u.username, email: u.email });
  } catch (err) {
    return res.status(500).json({ message: 'DB error', err });
  }
};
