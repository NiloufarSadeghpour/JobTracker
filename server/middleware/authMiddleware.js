// middleware/auth.js
const jwt = require('jsonwebtoken');

function verifyAccess(req, res, next) {
  // Expect "Authorization: Bearer <accessToken>"
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No access token' });
  }

  try {
    // IMPORTANT: use the ACCESS secret (not your old JWT_SECRET)
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    // normalize: use "sub" as user id everywhere
    // if you signed { sub: user.id, email }, payload.sub is the id
    req.user = payload;
    return next();
  } catch (e) {
    // expired/invalid -> unauthorized
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
}

module.exports = { verifyAccess };
