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
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },   // ← include role
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
    const rows = await query('SELECT id, username, email, password, role, is_active FROM users WHERE email = ?', [emailNorm]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user, rememberMe);
    setRefreshCookie(res, refreshToken, !!rememberMe);

    return res.json({
      accessToken,
      user: { id: user.id, name: user.username, email: user.email, role: user.role },
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

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    if (payload.typ !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const rows = await query('SELECT id, username, email, role, is_active FROM users WHERE id = ?', [payload.sub]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = rows[0];
    if (!user.is_active) {
      clearRefreshCookie(res);
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const newRefresh = signRefreshToken(user, payload.remember);
    setRefreshCookie(res, newRefresh, !!payload.remember);

    const accessToken = signAccessToken(user);

    return res.json({
      accessToken,
      user: { id: user.id, name: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};


exports.logout = (req, res) => {
  clearRefreshCookie(res);
  return res.json({ message: 'Logged out' });
};

exports.me = async (req, res) => {
  try {
    const rows = await query('SELECT id, username, email, role FROM users WHERE id = ?', [req.user.sub]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }
    const u = rows[0];
    return res.json({ id: u.id, name: u.username, email: u.email, role: u.role });
  } catch (err) {
    return res.status(500).json({ message: 'DB error', err });
  }
};

// POST /api/auth/register-admin
// body: { token, username, password }
exports.registerAdminFromInvite = async (req, res) => {
  try {
    const { token, username, password } = req.body || {};
    if (!token || !username || !password) {
      return res.status(400).json({ message: 'token, username, and password are required' });
    }

    // Strong password check (reuse the one from register)
    const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPass.test(password)) {
      return res.status(400).json({
        message: 'Weak password. Use at least 8 characters, with uppercase, lowercase, number, and symbol.',
      });
    }

    // 1) Validate invite
    const invites = await query(
      `SELECT * FROM admin_invites
       WHERE token = ? AND used_at IS NULL AND expires_at > NOW()`,
      [token]
    );
    const invite = invites[0];
    if (!invite) {
      return res.status(400).json({ message: 'Invalid or expired invite token' });
    }

    // 2) Ensure email not taken
    const existing = await query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [invite.email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);

    // 3) Transaction: create admin user + mark invite used
    await query('START TRANSACTION');

    const result = await query(
      `INSERT INTO users (username, email, password, role, is_active)
       VALUES (?, ?, ?, 'admin', 1)`,
      [username, invite.email, hash]
    );

    await query(`UPDATE admin_invites SET used_at = NOW() WHERE id = ?`, [invite.id]);

    await query('COMMIT');

    const user = { id: result.insertId, email: invite.email, role: 'admin' };
    const accessToken = signAccessToken(user);

    return res.status(201).json({
      ok: true,
      user: { id: user.id, name: username, email: user.email, role: user.role },
      accessToken
    });
  } catch (err) {
    try { await query('ROLLBACK'); } catch (_) {}
    return res.status(500).json({ message: 'Failed to register admin' });
  }
};

