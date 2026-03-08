/**
 * Dashboard Routes
 * GET /api/dashboard/overview - Get dashboard overview for authenticated user
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

/**
 * GET /api/dashboard/overview
 * Get dashboard overview (saved jobs count, latest jobs, last resume)
 */
router.get('/overview', auth, dashboardController.getDashboardOverview);

module.exports = router;



