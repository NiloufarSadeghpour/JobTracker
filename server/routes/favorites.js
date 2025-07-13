const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// Get all favorites for logged-in user
router.get('/', verifyToken, (req, res) => {
  const sql = 'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC';
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', err });
    res.json(results);
  });
});

// Add new favorite
router.post('/', verifyToken, (req, res) => {
  const { type, value } = req.body;
  if (!type || !value) return res.status(400).json({ message: 'Missing fields' });

  const sql = 'INSERT INTO favorites (user_id, type, value) VALUES (?, ?, ?)';
  db.query(sql, [req.user.id, type, value], (err, result) => {
    if (err) return res.status(500).json({ message: 'Insert error', err });
    res.status(201).json({ message: 'Favorite saved', id: result.insertId });
  });
});

// Remove favorite (optional)
router.delete('/:id', verifyToken, (req, res) => {
  const sql = 'DELETE FROM favorites WHERE id = ? AND user_id = ?';
  db.query(sql, [req.params.id, req.user.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Delete error', err });
    res.json({ message: 'Favorite removed' });
  });
});

module.exports = router;
