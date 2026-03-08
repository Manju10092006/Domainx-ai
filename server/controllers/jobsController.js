/**
 * Jobs Controller — LOCAL DATA ONLY
 * Replaces all Jooble API calls with a local 50-job dataset.
 * No external API keys required.
 */

const jobsData = require('../data/jobsData');

/**
 * Format a local job object for API response
 */
function formatJob(job) {
  const salaryStr = `₹${job.salary_min}-${job.salary_max} LPA`;
  const isRemote = job.location.toLowerCase() === 'remote';
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    salary: salaryStr,
    jobType: isRemote ? 'Remote' : 'Full-time',
    type: isRemote ? 'Remote' : 'Full-time',
    applyLink: '#',
    url: '#',
    snippet: `${job.title} at ${job.company}. Required skills: ${job.required_skills.join(', ')}. Experience: ${job.required_experience}+ years.`,
    skills: job.required_skills,
    experience: job.required_experience,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    badges: isRemote ? ['Remote'] : (job.required_experience === 0 ? ['Fresher'] : []),
  };
}

/**
 * GET /api/jobs
 * Returns all 50 local jobs (optionally filtered by ?role=&location=)
 */
const getTrendingJobs = (req, res) => {
  try {
    const { role, location } = req.query;

    let results = jobsData;

    if (role && role.trim()) {
      const q = role.trim().toLowerCase();
      results = results.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.required_skills.some(s => s.toLowerCase().includes(q))
      );
    }

    if (location && location.trim() && location.trim().toLowerCase() !== 'india') {
      const loc = location.trim().toLowerCase();
      results = results.filter(j => j.location.toLowerCase().includes(loc));
    }

    const jobs = results.map(formatJob);

    return res.json({
      success: true,
      fromCache: false,
      count: jobs.length,
      jobs,
    });
  } catch (err) {
    console.error('getTrendingJobs error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error', jobs: [] });
  }
};

/**
 * POST /api/jobs/search
 * Body: { keywords, query, location, page }
 * Filters the local dataset and returns matches.
 */
const searchJobs = (req, res) => {
  try {
    const { keywords, query, location } = req.body;
    const searchQuery = (keywords || query || '').trim().toLowerCase();

    let results = jobsData;

    // Keyword filter (title, company, skills)
    if (searchQuery) {
      results = results.filter(j =>
        j.title.toLowerCase().includes(searchQuery) ||
        j.company.toLowerCase().includes(searchQuery) ||
        j.required_skills.some(s => s.toLowerCase().includes(searchQuery))
      );
    }

    // Location filter (skip if "india" or empty — show all)
    const loc = (location || '').trim().toLowerCase();
    if (loc && loc !== 'india') {
      results = results.filter(j => j.location.toLowerCase().includes(loc));
    }

    const jobs = results.map(formatJob);

    return res.json({
      success: true,
      fromCache: false,
      jobs,
    });
  } catch (err) {
    console.error('searchJobs error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error', jobs: [] });
  }
};

module.exports = { getTrendingJobs, searchJobs };
