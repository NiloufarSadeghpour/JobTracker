const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadResume');
const { verifyAccess } = require('../middleware/authMiddleware');  // ✅ use the correct middleware
const db = require('../config/db');
const path = require('path');

// Upload resume (PDF)
router.post('/', verifyAccess, upload.single('resume'), (req, res) => {
  const filePath = `/uploads/resumes/${req.file.filename}`;
  const sql = 'UPDATE users SET resume_path = ? WHERE id = ?';
  db.query(sql, [filePath, req.user.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'DB update failed', err });
    res.json({ message: 'Resume uploaded successfully', path: filePath });
  });
});

// Get resume path
router.get('/', verifyAccess, (req, res) => {
  db.query('SELECT resume_path FROM users WHERE id = ?', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', err });
    if (!results[0]?.resume_path) return res.status(404).json({ message: 'No resume uploaded' });
    res.json({ path: results[0].resume_path });
  });
});

module.exports = router;
