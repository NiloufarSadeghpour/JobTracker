// routes/jobs.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyAccess } = require('../middleware/authMiddleware');  // ✅ use the correct middleware

const toNull = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    return t === '' ? null : t;
  }
  return v;
};

// GET all jobs (search + status + tags + highlight + pagination)
router.get('/', verifyAccess, (req, res) => {
  const userId = req.user.sub;   // ✅ use sub
  const {
    search = '',
    status = 'All',
    tags,
    page = 1,
    limit = 20,
    highlightStart = 3,
    highlightEnd = 5
  } = req.query;

  const lim = Math.max(1, parseInt(limit, 10) || 20);
  const pg = Math.max(1, parseInt(page, 10) || 1);
  const offset = (pg - 1) * lim;

  let sql = `
    SELECT
      id, user_id, title, company, status, deadline, tags, notes, location, job_link, created_at,
      DATEDIFF(deadline, CURDATE()) AS due_in_days,
      CASE
        WHEN DATEDIFF(deadline, CURDATE()) BETWEEN ? AND ? THEN 1 ELSE 0
      END AS highlight
    FROM jobs
    WHERE user_id = ?
  `;
  const params = [Number(highlightStart), Number(highlightEnd), userId];

  if (search) {
    sql += ` AND (title LIKE ? OR company LIKE ? OR tags LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (status && status !== 'All') {
    sql += ` AND status = ?`;
    params.push(status);
  }

  if (tags) {
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    tagList.forEach(tag => {
      sql += ` AND tags LIKE ?`;
      params.push(`%${tag}%`);
    });
  }

  sql += ` ORDER BY highlight DESC, deadline ASC, created_at DESC LIMIT ? OFFSET ?`;
  params.push(lim, offset);

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.json({ data: results, page: pg, limit: lim });
  });
});

// GET single job
router.get('/:id', verifyAccess, (req, res) => {
  const jobId = req.params.id;
  const userId = req.user.sub;  // ✅ use sub
  const sql = 'SELECT * FROM jobs WHERE id = ? AND user_id = ?';
  db.query(sql, [jobId, userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    if (results.length === 0) return res.status(404).json({ message: 'Job not found' });
    res.json(results[0]);
  });
});

// CREATE job
router.post('/', verifyAccess, (req, res) => {
  const {
    title, company, location, job_link, status, deadline, tags, notes
  } = req.body;

  if (!title?.trim() || !company?.trim()) {
    return res.status(400).json({ message: 'Title and company are required.' });
  }

  const sql = `
    INSERT INTO jobs
    (user_id, title, company, location, job_link, status, deadline, tags, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const payload = [
    req.user.sub,   // ✅ use sub
    toNull(title),
    toNull(company),
    toNull(location),
    toNull(job_link),
    status || 'Wishlist',
    toNull(deadline),
    toNull(tags),
    toNull(notes)
  ];

  db.query(sql, payload, (err, result) => {
    if (err) return res.status(500).json({ message: 'Insert error', err });
    res.status(201).json({
      id: result.insertId,
      user_id: req.user.sub,   // ✅ use sub
      title: payload[1],
      company: payload[2],
      location: payload[3],
      job_link: payload[4],
      status: payload[5],
      deadline: payload[6],
      tags: payload[7],
      notes: payload[8]
    });
  });
});

// UPDATE job
router.put('/:id', verifyAccess, (req, res) => {
  const jobId = req.params.id;
  const userId = req.user.sub;
  const {
    title, company, location, job_link, status, deadline, tags, notes
  } = req.body;

  // ✅ same validation as create
  if (!title?.trim() || !company?.trim()) {
    return res.status(400).json({ message: 'Title and company are required.' });
  }

  // ✅ normalize like CREATE does
  const payload = [
    title.trim(),
    company.trim(),
    toNull(location),
    toNull(job_link),
    status || 'Wishlist',   // default if omitted
    toNull(deadline),       // convert '' -> null
    toNull(tags),
    toNull(notes),
    jobId,
    userId
  ];

  const sql = `
    UPDATE jobs
    SET title = ?, company = ?, location = ?, job_link = ?, status = ?, deadline = ?, tags = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, payload, (err, result) => {
    if (err) return res.status(500).json({ message: 'Update error', err });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Job not found or unauthorized' });
    }
    // (optional) return the updated row to make client UX nicer
    res.json({ message: 'Job updated successfully' });
  });
});


// DELETE job
router.delete('/:id', verifyAccess, (req, res) => {
  const jobId = req.params.id;
  const userId = req.user.sub;  // ✅ use sub
  const sql = 'DELETE FROM jobs WHERE id = ? AND user_id = ?';
  db.query(sql, [jobId, userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Delete error', err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Job not found or unauthorized' });
    res.json({ message: 'Job deleted successfully' });
  });
});

module.exports = router;
