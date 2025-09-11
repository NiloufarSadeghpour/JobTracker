// routes/uploads.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { verifyAccess } = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// POST /uploads (multipart/form-data, field: file)
router.post('/', verifyAccess, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'file required' });
  const publicUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({ url: publicUrl });
});

module.exports = router;
