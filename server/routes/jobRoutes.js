const express = require('express');
const router = express.Router();
const { searchJobs, getTrendingJobs } = require('../controllers/jobsController');

// Accept both GET and POST
router.post('/search', searchJobs);

router.get('/search', (req, res) => {
  console.warn("⚠ GET /api/jobs/search called (frontend bug) — converting to POST");

  const { keywords, location } = req.query;
  req.body = { keywords: keywords || "", location: location || "" };

  return searchJobs(req, res);
});

// Trending jobs (GET)
router.get('/', getTrendingJobs);

module.exports = router;

