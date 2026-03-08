const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobsController');

/**
 * @route GET /api/jobs
 * @desc Fetch trending jobs from local dataset
 * @query {string} role - Job role/title (e.g., "Software Engineer", "Data Scientist")
 * @query {string} location - Job location (e.g., "New York", "Remote", "San Francisco")
 * @query {string} experience - Experience level (e.g., "entry", "mid", "senior")
 * @access Public
 * @returns {Array} Array of job objects with title, company, location, salary, mode, and jobUrl
 * 
 * @example
 * GET /api/jobs?role=Software Engineer&location=Remote&experience=mid
 */
router.get('/', jobsController.getTrendingJobs);

/**
 * @route POST /api/jobs/search
 * @desc Search jobs from local dataset
 * @body {string} query - Search query (required)
 * @body {string} location - Location filter (optional)
 * @body {number} page - Page number (optional, default: 1)
 * @access Public
 * @returns {Array} Array of job objects with title, company, location, salary, snippet, type, url
 */
router.post('/search', jobsController.searchJobs);

module.exports = router;

