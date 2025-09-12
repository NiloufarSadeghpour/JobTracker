// routes/auth.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// add registerAdminFromInvite to the import list
const { register, login, refresh, logout, me, registerAdminFromInvite } =
  require('../controllers/authController');

const { verifyAccess } = require('../middleware/authMiddleware');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,           
  max: 20,                            
  standardHeaders: true,              
  legacyHeaders: false,
  message: { error: 'Too many login attempts, try again later.' }
});

// Public endpoints
router.post('/register', register);
router.post('/login',loginLimiter, login);
router.post('/refresh', refresh);                 
router.post('/register-admin', registerAdminFromInvite);  

// Protected endpoints
router.post('/logout', logout);                  
router.get('/me', verifyAccess, me);             

module.exports = router;
