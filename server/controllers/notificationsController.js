const db = require('../config/db');
const util = require('util');
const query = util.promisify(db.query).bind(db);

exports.list = async (req, res) => {
  try {
    const userId = req.user.sub;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const [rows, [{ total }]] = await Promise.all([
      query(
        `SELECT id, type, title, body, link, is_read, created_at
           FROM notifications
          WHERE user_id = ?
          ORDER BY is_read ASC, created_at DESC
          LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      ),
      query(`SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?`, [userId]),
    ]);

    res.json({ items: rows, page, limit, total });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load notifications' });
  }
};

exports.unreadCount = async (req, res) => {
  try {
    const userId = req.user.sub;
    const [{ c }] = await query(
      `SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    res.json({ unread: c });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const userId = req.user.sub;
    const id = parseInt(req.params.id, 10);
    const result = await query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark read' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.sub;
    await query(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`, [userId]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark all read' });
  }
};
