const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1]; // Expecting: Bearer <token>

  if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // user object will now be available in protected routes
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid Token' });
  }
};

module.exports = verifyToken;
