const express = require('express');
const router = express.Router();
const { verifyAccess } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/notificationsController');

// All endpoints require an authenticated user
router.get('/', verifyAccess, ctrl.list);            
router.get('/unread-count', verifyAccess, ctrl.unreadCount);
router.post('/:id/read', verifyAccess, ctrl.markRead);
router.post('/read-all', verifyAccess, ctrl.markAllRead);

module.exports = router;
