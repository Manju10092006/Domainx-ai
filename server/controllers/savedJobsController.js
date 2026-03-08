/**
 * Saved Jobs Controller
 * Handles saving, unsaving, and fetching saved jobs for authenticated users
 */

const SavedJob = require('../models/SavedJob');
const { redisGet, redisSet, redisDel } = require('../middleware/redisSafe');

/**
 * Save a job for the authenticated user
 * POST /api/saved-jobs
 */
const saveJob = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId || req.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }

        const { job } = req.body;
        
        if (!job) {
            return res.status(400).json({
                success: false,
                error: 'Job object is required'
            });
        }

        // Derive jobId from job.url or create from title+company+location
        // If url is '#' or invalid, use fallback
        const url = job.url || job.applyLink || job.link;
        const validUrl = url && url !== '#' && (url.startsWith('http') || url.startsWith('https'));
        const jobId = validUrl ? url : (job.jobId || `${job.title}|${job.company}|${job.location}`);
        
        // Required fields
        if (!job.title || !job.company) {
            return res.status(400).json({
                success: false,
                error: 'Job title and company are required'
            });
        }

        // Check if job is already saved
        const existing = await SavedJob.findOne({ userId, jobId });
        if (existing) {
            return res.json({
                success: true,
                saved: true,
                jobId: existing.jobId,
                message: 'Job is already saved'
            });
        }

        // Create new saved job
        const savedJob = new SavedJob({
            userId,
            jobId,
            title: job.title,
            company: job.company,
            location: job.location || '',
            salary: job.salary || '',
            jobType: job.jobType || job.type || '',
            applyLink: job.url || job.applyLink || job.link || '#',
            url: job.url || job.applyLink || job.link || '#',
            source: job.source || 'local',
            createdAt: new Date()
        });

        await savedJob.save();

        // Invalidate cache for this user
        const cacheKey = `saved_jobs:${userId}`;
        await redisDel(cacheKey);
        console.log(`🗑️  Cache cleared for key: ${cacheKey}`);

        res.json({
            success: true,
            saved: true,
            jobId: savedJob.jobId
        });

    } catch (error) {
        console.error('Error saving job:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.json({
                success: true,
                saved: true,
                message: 'Job is already saved'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to save job',
            message: error.message
        });
    }
};

/**
 * Unsave a job for the authenticated user
 * DELETE /api/saved-jobs
 */
const unsaveJob = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId || req.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }

        const { jobId } = req.body;
        
        if (!jobId) {
            return res.status(400).json({
                success: false,
                error: 'jobId is required'
            });
        }

        // Delete from database
        const deleted = await SavedJob.findOneAndDelete({ userId, jobId });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Saved job not found'
            });
        }

        // Invalidate cache for this user
        const cacheKey = `saved_jobs:${userId}`;
        await redisDel(cacheKey);
        console.log(`🗑️  Cache cleared for key: ${cacheKey}`);

        res.json({
            success: true,
            saved: false,
            message: 'Job removed from saved jobs'
        });

    } catch (error) {
        console.error('Error removing saved job:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove saved job',
            message: error.message
        });
    }
};

/**
 * Get all saved jobs for the authenticated user
 * GET /api/saved-jobs
 */
const getSavedJobs = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId || req.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }

        // Build cache key
        const cacheKey = `saved_jobs:${userId}`;

        // Try to get from cache first
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                console.log(`✅ Cache HIT for key: ${cacheKey}`);
                return res.json({
                    success: true,
                    jobs: parsed
                });
            } catch (parseError) {
                console.error('⚠️  Error parsing cached data:', parseError.message);
                // Continue to fetch from DB if cache parse fails
            }
        } else {
            console.log(`❌ Cache MISS for key: ${cacheKey}`);
        }

        // Fetch from database
        const savedJobs = await SavedJob.find({ userId })
            .sort({ createdAt: -1 })
            .select('jobId title company location salary jobType url source createdAt');

        // Cache the results for 24 hours (86400 seconds)
        await redisSet(cacheKey, JSON.stringify(savedJobs), 86400);

        res.json({
            success: true,
            jobs: savedJobs
        });

    } catch (error) {
        console.error('Error fetching saved jobs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch saved jobs',
            message: error.message
        });
    }
};

module.exports = {
    saveJob,
    unsaveJob,
    getSavedJobs
};



