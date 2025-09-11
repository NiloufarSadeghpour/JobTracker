const util = require('util');
const db = require('../config/db');
const query = util.promisify(db.query).bind(db);

// ---------- Helpers ----------
function toInt(v, d) { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 0 ? n : d; }
function isAdmin(user) { return user?.role === 'admin'; }

// ========== ANNOUNCEMENTS ==========
/**
 * GET /api/admin/announcements?include_expired=0|1&limit=50&offset=0
 * Returns: { items: [...], unread: number }
 */
async function listAnnouncements(req, res) {
  try {
    const includeExpired = String(req.query.include_expired || '0') === '1';
    const limit = Math.min(toInt(req.query.limit, 50), 200);
    const offset = toInt(req.query.offset, 0);
    const me = req.user?.sub;

    const where = [];
    const params = [];
    if (!includeExpired) {
      where.push('(a.expires_at IS NULL OR a.expires_at > NOW())');
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const items = await query(
      `
      SELECT a.id, a.title, a.body, a.created_by, u.username AS created_by_username,
             a.created_at, a.expires_at,
             (r.admin_id IS NOT NULL) AS is_read
      FROM admin_announcements a
      LEFT JOIN admin_announcement_reads r
        ON r.announcement_id = a.id AND r.admin_id = ?
      LEFT JOIN users u ON u.id = a.created_by
      ${whereSql}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [me, limit, offset, ...params] // params is empty but keeps pattern consistent
    );

    const unreadRow = await query(
      `
      SELECT COUNT(*) AS unread
      FROM admin_announcements a
      LEFT JOIN admin_announcement_reads r
        ON r.announcement_id = a.id AND r.admin_id = ?
      WHERE (r.admin_id IS NULL)
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
      `,
      [me]
    );

    res.json({ items, unread: unreadRow[0]?.unread || 0 });
  } catch (err) {
    console.error('listAnnouncements error', err);
    res.status(500).json({ message: 'Failed to load announcements' });
  }
}

/**
 * POST /api/admin/announcements
 * Body: { title, body, expires_at? (ISO or 'YYYY-MM-DD HH:MM:SS') }
 */
async function createAnnouncement(req, res) {
  try {
    const { title, body, expires_at } = req.body || {};
    if (!title || !body) return res.status(400).json({ message: 'title and body are required' });

    const result = await query(
      `INSERT INTO admin_announcements (title, body, created_by, expires_at)
       VALUES (?, ?, ?, ?)`,
      [String(title).trim(), String(body).trim(), req.user?.sub || null, expires_at || null]
    );

    const row = await query(
      `SELECT a.id, a.title, a.body, a.created_by, u.username AS created_by_username,
              a.created_at, a.expires_at
       FROM admin_announcements a
       LEFT JOIN users u ON u.id=a.created_by
       WHERE a.id=?`,
      [result.insertId]
    );
    res.status(201).json(row[0]);
  } catch (err) {
    console.error('createAnnouncement error', err);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
}

/**
 * POST /api/admin/announcements/:id/read
 */
async function markAnnouncementRead(req, res) {
  try {
    const id = toInt(req.params.id, 0);
    const adminId = req.user?.sub;
    if (!id) return res.status(400).json({ message: 'invalid id' });

    // Upsert-like: ignore duplicate PK
    await query(
      `INSERT IGNORE INTO admin_announcement_reads (announcement_id, admin_id)
       VALUES (?, ?)`,
      [id, adminId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('markAnnouncementRead error', err);
    res.status(500).json({ message: 'Failed to mark read' });
  }
}

/**
 * DELETE /api/admin/announcements/:id
 */
async function deleteAnnouncement(req, res) {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) return res.status(400).json({ message: 'invalid id' });

    const exist = await query(`SELECT id FROM admin_announcements WHERE id=?`, [id]);
    if (!exist.length) return res.status(404).json({ message: 'Not found' });

    await query(`DELETE FROM admin_announcements WHERE id=?`, [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteAnnouncement error', err);
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
}

// ========== NOTES ==========
/**
 * GET /api/admin/notes?entity_type=user|job|portfolio&entity_id=123
 */
async function listNotes(req, res) {
  try {
    const { entity_type, entity_id } = req.query || {};
    if (!['user','job','portfolio'].includes(entity_type)) {
      return res.status(400).json({ message: 'invalid entity_type' });
    }
    const eid = toInt(entity_id, 0);
    if (!eid) return res.status(400).json({ message: 'invalid entity_id' });

    const rows = await query(
      `
      SELECT n.id, n.entity_type, n.entity_id, n.admin_id, n.body, n.created_at,
             u.username AS admin_username, u.email AS admin_email
      FROM admin_notes n
      JOIN users u ON u.id=n.admin_id
      WHERE n.entity_type=? AND n.entity_id=?
      ORDER BY n.created_at DESC
      `,
      [entity_type, eid]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error('listNotes error', err);
    res.status(500).json({ message: 'Failed to load notes' });
  }
}

/**
 * POST /api/admin/notes
 * Body: { entity_type, entity_id, body }
 */
async function createNote(req, res) {
  try {
    const { entity_type, entity_id, body } = req.body || {};
    if (!['user','job','portfolio'].includes(entity_type)) {
      return res.status(400).json({ message: 'invalid entity_type' });
    }
    const eid = toInt(entity_id, 0);
    if (!eid) return res.status(400).json({ message: 'invalid entity_id' });
    if (!body || !String(body).trim()) return res.status(400).json({ message: 'body required' });

    const result = await query(
      `INSERT INTO admin_notes (entity_type, entity_id, admin_id, body)
       VALUES (?, ?, ?, ?)`,
      [entity_type, eid, req.user?.sub, String(body).trim()]
    );

    const row = await query(
      `
      SELECT n.id, n.entity_type, n.entity_id, n.admin_id, n.body, n.created_at,
             u.username AS admin_username, u.email AS admin_email
      FROM admin_notes n
      JOIN users u ON u.id=n.admin_id
      WHERE n.id=?
      `,
      [result.insertId]
    );
    res.status(201).json(row[0]);
  } catch (err) {
    console.error('createNote error', err);
    res.status(500).json({ message: 'Failed to create note' });
  }
}

/**
 * DELETE /api/admin/notes/:id
 */
async function deleteNote(req, res) {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) return res.status(400).json({ message: 'invalid id' });

    const exist = await query(`SELECT id FROM admin_notes WHERE id=?`, [id]);
    if (!exist.length) return res.status(404).json({ message: 'Not found' });

    await query(`DELETE FROM admin_notes WHERE id=?`, [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteNote error', err);
    res.status(500).json({ message: 'Failed to delete note' });
  }
}

module.exports = {
  // announcements
  listAnnouncements,
  createAnnouncement,
  markAnnouncementRead,
  deleteAnnouncement,
  // notes
  listNotes,
  createNote,
  deleteNote,
};
