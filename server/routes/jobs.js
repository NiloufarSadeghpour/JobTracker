const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// GET all jobs for logged-in user
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;
  const sql = 'SELECT * FROM jobs WHERE user_id = ? ORDER BY date_applied DESC';

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.json(results);
  });
});

// POST new job
router.post('/', verifyToken, (req, res) => {
  const { company, position, status, dateApplied } = req.body;
  const sql = 'INSERT INTO jobs (user_id, company, position, status, date_applied) VALUES (?, ?, ?, ?, ?)';

  db.query(sql, [req.user.id, company, position, status, dateApplied], (err, result) => {
    if (err) return res.status(500).json({ message: 'Insert error', err });
    res.status(201).json({ id: result.insertId, company, position, status, date_applied: dateApplied });
  });
});

module.exports = router;
