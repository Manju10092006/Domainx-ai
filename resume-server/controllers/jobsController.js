const jobsData = require('../data/jobsData');

/**
 * Fetch trending jobs from local dataset
 * @route GET /api/jobs
 * @query {string} role - Job role/title (optional)
 * @query {string} location - Job location (optional)
 * @query {string} experience - Experience level (optional)
 * @returns {Array} Array of job objects
 */
const getTrendingJobs = async (req, res) => {
  try {
    const { role, location } = req.query;

    let filtered = [...jobsData];

    if (role) {
      const q = role.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(q) ||
        job.required_skills.some(s => s.toLowerCase().includes(q))
      );
    }

    if (location) {
      const loc = location.toLowerCase();
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(loc)
      );
    }

    const formattedJobs = filtered.map(job => ({
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary || 'Not specified',
      jobType: job.jobType || 'Full-time',
      applyLink: job.url || '#'
    }));

    res.json({
      success: true,
      count: formattedJobs.length,
      jobs: formattedJobs
    });

  } catch (error) {
    console.error('Error fetching jobs:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

module.exports = {
  getTrendingJobs
};

