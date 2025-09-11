const crypto = require('crypto');
const util = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

// ---------- existing: createAdminInvite ----------
async function createAdminInvite(req, res) {
  try {
    const { email, ttlMinutes = 1440 } = req.body || {};
    if (!email) return res.status(400).json({ message: 'email is required' });

    const token = crypto.randomBytes(32).toString('hex');
    await query(
      `INSERT INTO admin_invites (email, token, expires_at, created_by)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), ?)`,
      [email.trim().toLowerCase(), token, Number(ttlMinutes), req.user?.sub || null]
    );

    res.json({ ok: true, email, token, expires_in_minutes: Number(ttlMinutes) });
  } catch (err) {
    console.error('createAdminInvite error', err);
    res.status(500).json({ message: 'Failed to create invite' });
  }
}

// ---------- existing: getAdminStats ----------
async function getAdminStats(req, res) {
  try {
    const userAgg = await query(`
      SELECT 
        COUNT(*)                           AS users_total,
        SUM(role='admin')                  AS admins,
        SUM(is_active=1)                   AS active_users
      FROM users
    `);

    const jobAgg = await query(`
      SELECT 
        SUM(status='Wishlist')  AS wishlist,
        SUM(status='Applied')   AS applied,
        SUM(status='Interview') AS interview,
        SUM(status='Offer')     AS offer,
        SUM(status='Rejected')  AS rejected
      FROM jobs
    `);

    const portAgg = await query(`
      SELECT 
        COUNT(*)              AS portfolios_total,
        SUM(is_public=1)      AS public_portfolios
      FROM portfolios
    `);

    const recentUsers = await query(`
      SELECT id, username, email, created_at 
      FROM users ORDER BY created_at DESC LIMIT 5
    `);
    const recentJobs = await query(`
      SELECT id, title, company, status, created_at 
      FROM jobs ORDER BY created_at DESC LIMIT 5
    `);

    res.json({
      users: userAgg[0],
      jobs: jobAgg[0],
      portfolios: portAgg[0],
      recent: { users: recentUsers, jobs: recentJobs }
    });
  } catch (err) {
    console.error('getAdminStats error', err);
    res.status(500).json({ message: 'Failed to load stats' });
  }
}

/* ===========================
   ADMIN: USERS CRUD
   =========================== */
async function countActiveAdmins() {
  const rows = await query(`SELECT COUNT(*) AS c FROM users WHERE role='admin' AND is_active=1`);
  return rows[0].c || 0;
}
function toInt(v, d) { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : d; }
function cleanRole(r) { return r === 'admin' ? 'admin' : 'user'; }
function bool01(v) { return v ? 1 : 0; }

async function listUsers(req, res) {
  try {
    const { q = '', role, is_active, page = 1, limit = 10, sort = 'created_at', order = 'desc' } = req.query;

    const pageN = toInt(page, 1);
    const limitN = Math.min(toInt(limit, 10), 100);
    const offset = (pageN - 1) * limitN;

    const allowedSort = new Set(['created_at', 'username', 'email', 'role', 'is_active', 'id']);
    const sortCol = allowedSort.has(sort) ? sort : 'created_at';
    const orderDir = (String(order).toLowerCase() === 'asc') ? 'ASC' : 'DESC';

    const where = [];
    const params = [];
    if (q) { where.push(`(username LIKE ? OR email LIKE ?)`); params.push(`%${q}%`, `%${q}%`); }
    if (role === 'admin' || role === 'user') { where.push(`role = ?`); params.push(role); }
    if (is_active === '0' || is_active === '1') { where.push(`is_active = ?`); params.push(Number(is_active)); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const totalRows = await query(`SELECT COUNT(*) AS total FROM users ${whereSql}`, params);
    const rows = await query(
      `
      SELECT id, username, email, role, is_active, created_at
      FROM users
      ${whereSql}
      ORDER BY ${sortCol} ${orderDir}
      LIMIT ? OFFSET ?
      `,
      [...params, limitN, offset]
    );

    res.json({ total: totalRows[0].total, page: pageN, limit: limitN, items: rows });
  } catch (err) {
    console.error('listUsers error', err);
    res.status(500).json({ message: 'Failed to list users' });
  }
}

async function getUser(req, res) {
  try {
    const { id } = req.params;
    const rows = await query(
      `SELECT id, username, email, role, is_active, created_at FROM users WHERE id=? LIMIT 1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getUser error', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
}

async function createUser(req, res) {
  try {
    let { username, email, password, role = 'user', is_active = 1 } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, password required' });
    }
    email = String(email).trim().toLowerCase();
    role = cleanRole(role);

    const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPass.test(password)) return res.status(400).json({ message: 'Weak password' });

    const exists = await query(`SELECT id FROM users WHERE email=? LIMIT 1`, [email]);
    if (exists.length) return res.status(409).json({ message: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (username, email, password, role, is_active) VALUES (?,?,?,?,?)`,
      [username, email, hash, role, bool01(is_active)]
    );

    const row = await query(
      `SELECT id, username, email, role, is_active, created_at FROM users WHERE id=?`,
      [result.insertId]
    );
    res.status(201).json(row[0]);
  } catch (err) {
    console.error('createUser error', err);
    res.status(500).json({ message: 'Failed to create user' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const patch = req.body || {};
    const fields = [];
    const params = [];

    const currentRows = await query(`SELECT * FROM users WHERE id=?`, [id]);
    if (!currentRows.length) return res.status(404).json({ message: 'User not found' });
    const current = currentRows[0];

    if (patch.email) {
      const email = String(patch.email).trim().toLowerCase();
      if (email !== current.email) {
        const dupe = await query(`SELECT id FROM users WHERE email=? AND id<>? LIMIT 1`, [email, id]);
        if (dupe.length) return res.status(409).json({ message: 'Email already in use' });
        fields.push('email=?'); params.push(email);
      }
    }
    if (patch.username && patch.username !== current.username) { fields.push('username=?'); params.push(patch.username); }

    if (typeof patch.role === 'string') {
      const newRole = cleanRole(patch.role);
      if (newRole !== current.role) {
        if (current.role === 'admin' && newRole !== 'admin') {
          const admins = await countActiveAdmins();
          if (admins <= 1) return res.status(400).json({ message: 'Cannot demote the last active admin' });
          if (Number(req.user.sub) === Number(id)) return res.status(400).json({ message: 'Cannot change your own role' });
        }
        fields.push('role=?'); params.push(newRole);
      }
    }

    if (patch.hasOwnProperty('is_active')) {
      const newActive = bool01(patch.is_active);
      if (newActive !== current.is_active) {
        if (current.role === 'admin' && newActive === 0) {
          const admins = await countActiveAdmins();
          if (admins <= 1) return res.status(400).json({ message: 'Cannot deactivate the last active admin' });
          if (Number(req.user.sub) === Number(id)) return res.status(400).json({ message: 'Cannot deactivate your own account' });
        }
        fields.push('is_active=?'); params.push(newActive);
      }
    }

    if (patch.password) {
      const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!strongPass.test(patch.password)) return res.status(400).json({ message: 'Weak password' });
      const hash = await bcrypt.hash(patch.password, 10);
      fields.push('password=?'); params.push(hash);
    }

    if (!fields.length) {
      const row = await query(`SELECT id, username, email, role, is_active, created_at FROM users WHERE id=?`, [id]);
      return res.json(row[0]);
    }

    await query(`UPDATE users SET ${fields.join(', ')} WHERE id=?`, [...params, id]);
    const row = await query(`SELECT id, username, email, role, is_active, created_at FROM users WHERE id=?`, [id]);
    res.json(row[0]);
  } catch (err) {
    console.error('updateUser error', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const rows = await query(`SELECT id, role FROM users WHERE id=?`, [id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    const target = rows[0];

    if (Number(req.user.sub) === Number(id)) return res.status(400).json({ message: 'Cannot delete your own account' });

    if (target.role === 'admin') {
      const admins = await countActiveAdmins();
      if (admins <= 1) return res.status(400).json({ message: 'Cannot delete the last active admin' });
    }

    await query(`DELETE FROM users WHERE id=?`, [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteUser error', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
}

/* ===========================
   ADMIN: JOBS MANAGEMENT
   =========================== */
async function listJobs(req, res) {
  try {
    const {
      q = '',
      status,
      user_id,
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'desc',
      date_from,
      date_to
    } = req.query;

    const pageN = toInt(page, 1);
    const limitN = Math.min(toInt(limit, 20), 200);
    const offset = (pageN - 1) * limitN;

    const allowedSort = new Set(['created_at','updated_at','date_applied','deadline','company','title','status','id']);
    const sortCol = allowedSort.has(sort) ? sort : 'created_at';
    const orderDir = (String(order).toLowerCase() === 'asc') ? 'ASC' : 'DESC';

    const where = [];
    const params = [];

    if (q) {
      where.push(`(j.title LIKE ? OR j.company LIKE ? OR u.email LIKE ? OR u.username LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (status) {
      where.push(`j.status = ?`); params.push(status);
    }
    if (user_id) {
      where.push(`j.user_id = ?`); params.push(Number(user_id));
    }
    if (date_from) {
      where.push(`j.created_at >= ?`); params.push(date_from);
    }
    if (date_to) {
      where.push(`j.created_at < DATE_ADD(?, INTERVAL 1 DAY)`); params.push(date_to);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRows = await query(
      `SELECT COUNT(*) AS total
       FROM jobs j
       JOIN users u ON u.id=j.user_id
       ${whereSql}`,
      params
    );

    const rows = await query(
      `
      SELECT j.id, j.user_id, u.username, u.email,
             j.title, j.company, j.location, j.job_link,
             j.status, j.deadline, j.tags, j.date_applied,
             j.created_at, j.updated_at
      FROM jobs j
      JOIN users u ON u.id=j.user_id
      ${whereSql}
      ORDER BY j.${sortCol} ${orderDir}
      LIMIT ? OFFSET ?
      `,
      [...params, limitN, offset]
    );

    res.json({ total: totalRows[0].total, page: pageN, limit: limitN, items: rows });
  } catch (err) {
    console.error('listJobs error', err);
    res.status(500).json({ message: 'Failed to list jobs' });
  }
}

async function getJob(req, res) {
  try {
    const { id } = req.params;
    const rows = await query(
      `
      SELECT j.*, u.username, u.email
      FROM jobs j
      JOIN users u ON u.id=j.user_id
      WHERE j.id=? LIMIT 1
      `,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Job not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getJob error', err);
    res.status(500).json({ message: 'Failed to fetch job' });
  }
}

// Allowed admin edits: status, deadline, tags, notes, title, company, location, job_link, date_applied
async function updateJob(req, res) {
  try {
    const { id } = req.params;
    const patch = req.body || {};

    const fields = [];
    const params = [];

    const allowed = ['status','deadline','tags','notes','title','company','location','job_link','date_applied'];
    for (const k of allowed) {
      if (patch.hasOwnProperty(k)) {
        fields.push(`${k} = ?`);
        params.push(patch[k]);
      }
    }
    if (!fields.length) {
      const row = await query(`SELECT * FROM jobs WHERE id=?`, [id]);
      if (!row.length) return res.status(404).json({ message: 'Job not found' });
      return res.json(row[0]);
    }

    await query(`UPDATE jobs SET ${fields.join(', ')} WHERE id=?`, [...params, id]);
    const row = await query(
      `SELECT j.*, u.username, u.email
       FROM jobs j JOIN users u ON u.id=j.user_id
       WHERE j.id=?`,
      [id]
    );
    res.json(row[0]);
  } catch (err) {
    console.error('updateJob error', err);
    res.status(500).json({ message: 'Failed to update job' });
  }
}

async function deleteJob(req, res) {
  try {
    const { id } = req.params;
    const row = await query(`SELECT id FROM jobs WHERE id=?`, [id]);
    if (!row.length) return res.status(404).json({ message: 'Job not found' });
    await query(`DELETE FROM jobs WHERE id=?`, [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteJob error', err);
    res.status(500).json({ message: 'Failed to delete job' });
  }
}

/* ===========================
   ADMIN: PORTFOLIOS MANAGEMENT
   =========================== */
async function listPortfolios(req, res) {
  try {
    const { q = '', is_public, user_id, page = 1, limit = 20, sort = 'created_at', order = 'desc' } = req.query;

    const pageN = toInt(page, 1);
    const limitN = Math.min(toInt(limit, 20), 200);
    const offset = (pageN - 1) * limitN;

    const allowedSort = new Set(['created_at','updated_at','title','is_public','id']);
    const sortCol = allowedSort.has(sort) ? sort : 'created_at';
    const orderDir = (String(order).toLowerCase() === 'asc') ? 'ASC' : 'DESC';

    const where = [];
    const params = [];

    if (q) {
      where.push(`(p.title LIKE ? OR p.subtitle LIKE ? OR u.email LIKE ? OR u.username LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (is_public === '0' || is_public === '1') {
      where.push(`p.is_public = ?`); params.push(Number(is_public));
    }
    if (user_id) {
      where.push(`p.user_id = ?`); params.push(Number(user_id));
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRows = await query(
      `SELECT COUNT(*) AS total
       FROM portfolios p JOIN users u ON u.id=p.user_id
       ${whereSql}`,
      params
    );

    const rows = await query(
      `
      SELECT p.id, p.user_id, u.username, u.email,
             p.title, p.subtitle, p.slug, p.is_public,
             p.created_at, p.updated_at,
             (SELECT COUNT(*) FROM portfolio_items pi WHERE pi.portfolio_id=p.id) AS items_count
      FROM portfolios p
      JOIN users u ON u.id=p.user_id
      ${whereSql}
      ORDER BY p.${sortCol} ${orderDir}
      LIMIT ? OFFSET ?
      `,
      [...params, limitN, offset]
    );

    res.json({ total: totalRows[0].total, page: pageN, limit: limitN, items: rows });
  } catch (err) {
    console.error('listPortfolios error', err);
    res.status(500).json({ message: 'Failed to list portfolios' });
  }
}

async function updatePortfolio(req, res) {
  try {
    const { id } = req.params;
    const patch = req.body || {};
    const fields = [];
    const params = [];

    const allowed = ['title','subtitle','bio','is_public'];
    for (const k of allowed) {
      if (patch.hasOwnProperty(k)) {
        fields.push(`${k} = ?`);
        params.push(patch[k]);
      }
    }

    if (!fields.length) {
      const r = await query(`SELECT * FROM portfolios WHERE id=?`, [id]);
      if (!r.length) return res.status(404).json({ message: 'Portfolio not found' });
      return res.json(r[0]);
    }

    await query(`UPDATE portfolios SET ${fields.join(', ')} WHERE id=?`, [...params, id]);
    const row = await query(
      `SELECT p.*, u.username, u.email FROM portfolios p JOIN users u ON u.id=p.user_id WHERE p.id=?`,
      [id]
    );
    res.json(row[0]);
  } catch (err) {
    console.error('updatePortfolio error', err);
    res.status(500).json({ message: 'Failed to update portfolio' });
  }
}

async function deletePortfolio(req, res) {
  try {
    const { id } = req.params;
    const r = await query(`SELECT id FROM portfolios WHERE id=?`, [id]);
    if (!r.length) return res.status(404).json({ message: 'Portfolio not found' });
    await query(`DELETE FROM portfolios WHERE id=?`, [id]); // cascades to items/images/links via FKs
    res.json({ ok: true });
  } catch (err) {
    console.error('deletePortfolio error', err);
    res.status(500).json({ message: 'Failed to delete portfolio' });
  }
}

/* ===========================
   ADMIN: INVITES MANAGEMENT
   =========================== */
async function listInvites(req, res) {
  try {
    const rows = await query(
      `SELECT ai.id, ai.email, ai.token, ai.expires_at, ai.used_at, ai.created_at,
              ai.created_by, u.username AS created_by_username
       FROM admin_invites ai
       LEFT JOIN users u ON u.id = ai.created_by
       ORDER BY ai.created_at DESC
       LIMIT 200`
    );
    res.json({ items: rows });
  } catch (err) {
    console.error('listInvites error', err);
    res.status(500).json({ message: 'Failed to list invites' });
  }
}

async function revokeInvite(req, res) {
  try {
    const { id } = req.params;
    const rows = await query(`SELECT * FROM admin_invites WHERE id=?`, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Invite not found' });
    if (rows[0].used_at) return res.status(400).json({ message: 'Invite already used' });
    await query(`DELETE FROM admin_invites WHERE id=?`, [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('revokeInvite error', err);
    res.status(500).json({ message: 'Failed to revoke invite' });
  }
}

/* ===========================
   ADMIN: IMPERSONATE USER
   =========================== */
// POST body: { user_id }
async function impersonateUser(req, res) {
  try {
    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ message: 'user_id required' });

    const rows = await query(`SELECT id, email, role, is_active, username FROM users WHERE id=?`, [user_id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    const target = rows[0];

    if (!target.is_active) return res.status(400).json({ message: 'Target user is inactive' });
    // Block impersonating admins (change if you want to allow)
    if (target.role === 'admin') return res.status(400).json({ message: 'Cannot impersonate an admin' });

    const token = jwt.sign(
      { sub: target.id, email: target.email, role: target.role, act: req.user.sub, act_as_admin: true },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '10m' } // short TTL
    );

    res.json({
      accessToken: token,
      user: { id: target.id, name: target.username, email: target.email, role: target.role },
      meta: { impersonated_by: req.user.sub }
    });
  } catch (err) {
    console.error('impersonateUser error', err);
    res.status(500).json({ message: 'Failed to impersonate user' });
  }
}

module.exports = {
  // existing
  createAdminInvite,
  getAdminStats,
  // users
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  // jobs
  listJobs,
  getJob,
  updateJob,
  deleteJob,
  // portfolios
  listPortfolios,
  updatePortfolio,
  deletePortfolio,
  // invites management
  listInvites,
  revokeInvite,
  // impersonation
  impersonateUser,
};
