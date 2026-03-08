const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const optionalAuth = require('../middleware/optionalAuth');

// All routes require authentication (or at least user context)
router.get('/', optionalAuth, getProfile);
router.post('/', optionalAuth, updateProfile);

module.exports = router;
