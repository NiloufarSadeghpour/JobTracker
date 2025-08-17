const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyAccess } = require('../middleware/authMiddleware');  // ✅ use the correct middleware

// Get all favorites for logged-in user
router.get('/', verifyAccess, (req, res) => {
  const sql = 'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC';
  db.query(sql, [req.user.sub], (err, results) => {   // ✅ use req.user.sub (from access token)
    if (err) return res.status(500).json({ message: 'DB error', err });
    res.json(results);
  });
});

// Add new favorite
router.post('/', verifyAccess, (req, res) => {
  const { type, value } = req.body;
  if (!type || !value) return res.status(400).json({ message: 'Missing fields' });

  const sql = 'INSERT INTO favorites (user_id, type, value) VALUES (?, ?, ?)';
  db.query(sql, [req.user.sub, type, value], (err, result) => {  // ✅ req.user.sub
    if (err) return res.status(500).json({ message: 'Insert error', err });
    res.status(201).json({ message: 'Favorite saved', id: result.insertId });
  });
});

// Remove favorite
router.delete('/:id', verifyAccess, (req, res) => {
  const sql = 'DELETE FROM favorites WHERE id = ? AND user_id = ?';
  db.query(sql, [req.params.id, req.user.sub], (err, result) => { // ✅ req.user.sub
    if (err) return res.status(500).json({ message: 'Delete error', err });
    res.json({ message: 'Favorite removed' });
  });
});

module.exports = router;
