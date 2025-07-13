const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// GET all projects for a user
router.get('/', verifyToken, (req, res) => {
  const sql = 'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC';
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', err });
    res.json(results);
  });
});

// POST a new project
router.post('/', verifyToken, (req, res) => {
  const { title, description, link, tech_stack } = req.body;
  const sql = 'INSERT INTO projects (user_id, title, description, link, tech_stack) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [req.user.id, title, description, link, tech_stack], (err, result) => {
    if (err) return res.status(500).json({ message: 'Insert error', err });
    res.status(201).json({ id: result.insertId, title, description, link, tech_stack });
  });
});

module.exports = router;
