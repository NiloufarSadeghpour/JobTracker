// middleware/uploadResume.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'resumes');

// Ensure the directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function getUid(req) {
  return req?.user?.id ?? req?.user?.sub ?? null;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uid = getUid(req);
    if (!uid) return cb(new Error('Invalid token payload (no user id)'));
    // Force .pdf extension; prevent weird mixed-case/mime mismatches
    const ext = path.extname(file.originalname || '').toLowerCase() === '.pdf' ? '.pdf' : '.pdf';
    const ts = Date.now(); // avoid caching / overwrites
    cb(null, `resume_${uid}_${ts}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only PDFs (mimetype can vary on some browsers; extension helps)
  const isPdf = file.mimetype === 'application/pdf' ||
                (file.originalname && /\.pdf$/i.test(file.originalname));
  if (!isPdf) return cb(new Error('Only PDF files are allowed'), false);
  cb(null, true);
};

const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

module.exports = multer({ storage, fileFilter, limits });
