const express = require('express');
const router = express.Router();

router.get('/ping', (req, res) => res.json({ ok: true, where: 'admin router' })); // <-- add this

const {
  // existing
  createAdminInvite,
  getAdminStats,
  // users
  listUsers, getUser, createUser, updateUser, deleteUser,
  // jobs
  listJobs, getJob, updateJob, deleteJob,
  // portfolios
  listPortfolios, updatePortfolio, deletePortfolio,
  // invites mgmt
  listInvites, revokeInvite,
  // impersonation
  impersonateUser,
} = require('../controllers/adminController');


const { verifyAccess, requireAdmin } = require('../middleware/authMiddleware'); // or '../middleware/auth'

const {
  listAnnouncements,
  createAnnouncement,
  markAnnouncementRead,
  deleteAnnouncement,
  listNotes,
  createNote,
  deleteNote,
} = require('../controllers/adminCommsController');

// invites
router.post('/invites', verifyAccess, requireAdmin, createAdminInvite);
router.get('/invites', verifyAccess, requireAdmin, listInvites);
router.delete('/invites/:id', verifyAccess, requireAdmin, revokeInvite);

// stats
router.get('/stats', verifyAccess, requireAdmin, getAdminStats);

// users CRUD
router.get('/users', verifyAccess, requireAdmin, listUsers);
router.get('/users/:id', verifyAccess, requireAdmin, getUser);
router.post('/users', verifyAccess, requireAdmin, createUser);
router.patch('/users/:id', verifyAccess, requireAdmin, updateUser);
router.delete('/users/:id', verifyAccess, requireAdmin, deleteUser);

// jobs management
router.get('/jobs', verifyAccess, requireAdmin, listJobs);
router.get('/jobs/:id', verifyAccess, requireAdmin, getJob);
router.patch('/jobs/:id', verifyAccess, requireAdmin, updateJob);
router.delete('/jobs/:id', verifyAccess, requireAdmin, deleteJob);

// portfolios management
router.get('/portfolios', verifyAccess, requireAdmin, listPortfolios);
router.patch('/portfolios/:id', verifyAccess, requireAdmin, updatePortfolio);
router.delete('/portfolios/:id', verifyAccess, requireAdmin, deletePortfolio);

// impersonation
router.post('/impersonate', verifyAccess, requireAdmin, impersonateUser);

// --- Announcements ---
router.get('/announcements', verifyAccess, requireAdmin, listAnnouncements);
router.post('/announcements', verifyAccess, requireAdmin, createAnnouncement);
router.post('/announcements/:id/read', verifyAccess, requireAdmin, markAnnouncementRead);
router.delete('/announcements/:id', verifyAccess, requireAdmin, deleteAnnouncement);

// --- Notes ---
router.get('/notes', verifyAccess, requireAdmin, listNotes);
router.post('/notes', verifyAccess, requireAdmin, createNote);
router.delete('/notes/:id', verifyAccess, requireAdmin, deleteNote);

module.exports = router;
