// routes/auth.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// add registerAdminFromInvite to the import list
const { register, login, refresh, logout, me, registerAdminFromInvite } =
  require('../controllers/authController');

const { verifyAccess } = require('../middleware/authMiddleware');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,           // 10 minutes window
  max: 20,                            // allow 20 attempts per IP
  standardHeaders: true,              // include RateLimit-* headers
  legacyHeaders: false,
  message: { error: 'Too many login attempts, try again later.' }
});

// Public endpoints
router.post('/register', register);
router.post('/login',loginLimiter, login);
router.post('/refresh', refresh);                 // use cookie to issue new access token
router.post('/register-admin', registerAdminFromInvite);  // redeem invite to create admin

// Protected endpoints
router.post('/logout', logout);                   // clears refresh cookie
router.get('/me', verifyAccess, me);              // return user profile if access token valid

module.exports = router;
