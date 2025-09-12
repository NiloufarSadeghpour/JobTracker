const jwt = require('jsonwebtoken');

function verifyAccess(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No access token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }
  next();
}

module.exports = { verifyAccess, requireAdmin };
