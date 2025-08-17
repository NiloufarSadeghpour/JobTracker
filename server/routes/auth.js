// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, me } = require('../controllers/authController');
const { verifyAccess } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);  // use cookie to issue new access token

// Protected endpoints
router.post('/logout', logout);   // clears refresh cookie
router.get('/me', verifyAccess, me); // return user profile if access token valid

module.exports = router;
