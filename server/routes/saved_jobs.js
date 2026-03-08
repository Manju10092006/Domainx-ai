/**
 * Saved Jobs Routes
 * GET /api/saved-jobs - Get user's saved jobs (requires auth)
 * POST /api/saved-jobs - Save a job (requires auth)
 * DELETE /api/saved-jobs - Remove a saved job (requires auth)
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const savedJobsController = require('../controllers/savedJobsController');

/**
 * GET /api/saved-jobs
 * Get all saved jobs for authenticated user
 */
router.get('/', auth, savedJobsController.getSavedJobs);

/**
 * POST /api/saved-jobs
 * Save a job for authenticated user
 * Body: { job: { title, company, location, salary, url, ... } }
 */
router.post('/', auth, savedJobsController.saveJob);

/**
 * DELETE /api/saved-jobs
 * Remove a saved job for authenticated user
 * Body: { jobId: "..." }
 */
router.delete('/', auth, savedJobsController.unsaveJob);

module.exports = router;

