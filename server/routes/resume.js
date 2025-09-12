// routes/resume.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadResume');
const { verifyAccess } = require('../middleware/authMiddleware');
const db = require('../config/db');

// normalize user id from either id or sub
function getUid(req) {
  return req?.user?.id ?? req?.user?.sub ?? null;
}

// build absolute URL (works behind proxies/CDN)
function toAbsolute(req, webPath) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host  = req.headers['x-forwarded-host']  || req.get('host');
  return `${proto}://${host}${webPath}`;
}

// Upload resume (PDF)
router.post('/', verifyAccess, (req, res) => {
  upload.single('resume')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Upload failed' });

    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const filePath = `/uploads/resumes/${req.file.filename}`;

    db.query('UPDATE users SET resume_path = ? WHERE id = ?', [filePath, uid], (qErr, result) => {
      if (qErr) {
        console.error('RESUME UPDATE ERROR:', qErr);
        return res.status(500).json({ message: 'DB update failed' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const fileUrl = toAbsolute(req, filePath);
      return res.json({
        message: 'Resume uploaded successfully',
        fileUrl,      
      });
    });
  });
});

// Get current user's resume (viewer-friendly)
router.get('/', verifyAccess, (req, res) => {
  const uid = getUid(req);
  if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

  db.query('SELECT resume_path FROM users WHERE id = ?', [uid], (err, results) => {
    if (err) {
      console.error('RESUME FETCH ERROR:', err);
      return res.status(500).json({ message: 'DB error' });
    }
    const row = results?.[0];
    if (!row?.resume_path) return res.status(404).json({ message: 'No resume uploaded' });

    const fileUrl = toAbsolute(req, row.resume_path); 
    res.json({ fileUrl, path: row.resume_path });
  });
});

router.get('/:id', verifyAccess, (req, res) => {
  const uid = getUid(req);
  if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

  db.query('SELECT resume_path FROM users WHERE id = ?', [uid], (err, results) => {
    if (err) {
      console.error('RESUME FETCH ERROR:', err);
      return res.status(500).json({ message: 'DB error' });
    }
    const row = results?.[0];
    if (!row?.resume_path) return res.status(404).json({ message: 'No resume uploaded' });

    const fileUrl = toAbsolute(req, row.resume_path);
    return res.json({ fileUrl, path: row.resume_path });
  });
});

module.exports = router;
