// routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// GET all jobs for logged-in user
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;
  const sql = 'SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC';
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.json(results);
  });
});

// GET single job by ID
router.get('/:id', verifyToken, (req, res) => {
  const jobId = req.params.id;
  const userId = req.user.id;
  const sql = 'SELECT * FROM jobs WHERE id = ? AND user_id = ?';
  db.query(sql, [jobId, userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    if (results.length === 0) return res.status(404).json({ message: 'Job not found' });
    res.json(results[0]);
  });
});

// CREATE new job
router.post('/', verifyToken, (req, res) => {
  const {
    title, company, location, job_link, status, deadline,
    tags, notes
  } = req.body;

  const sql = `
    INSERT INTO jobs 
    (user_id, title, company, location, job_link, status, deadline, tags, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    req.user.id, title, company, location, job_link, status, deadline, tags, notes
  ], (err, result) => {
    if (err) return res.status(500).json({ message: 'Insert error', err });

    res.status(201).json({
      id: result.insertId,
      title, company, location, job_link, status, deadline, tags, notes
    });
  });
});

// UPDATE job
router.put('/:id', verifyToken, (req, res) => {
  const jobId = req.params.id;
  const userId = req.user.id;
  const {
    title, company, location, job_link, status, deadline,
    tags, notes
  } = req.body;

  const sql = `
    UPDATE jobs 
    SET title = ?, company = ?, location = ?, job_link = ?, status = ?, deadline = ?, tags = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [
    title, company, location, job_link, status, deadline, tags, notes,
    jobId, userId
  ], (err, result) => {
    if (err) return res.status(500).json({ message: 'Update error', err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Job not found or unauthorized' });

    res.json({ message: 'Job updated successfully' });
  });
});

// DELETE job
router.delete('/:id', verifyToken, (req, res) => {
  const jobId = req.params.id;
  const userId = req.user.id;

  const sql = 'DELETE FROM jobs WHERE id = ? AND user_id = ?';
  db.query(sql, [jobId, userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Delete error', err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Job not found or unauthorized' });

    res.json({ message: 'Job deleted successfully' });
  });
});

module.exports = router;
