const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const db = require('../config/db');

router.get('/', verifyToken, (req, res) => {
  const sql = 'SELECT id, username AS name, email, resume_path FROM users WHERE id = ?';
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', err });
    if (!results.length) return res.status(404).json({ message: 'User not found' });
    res.json(results[0]);
  });
});

module.exports = router;
