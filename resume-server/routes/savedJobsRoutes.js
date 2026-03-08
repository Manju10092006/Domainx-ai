/**
 * Saved Jobs Routes
 * Uses Redis for storage
 * Key pattern: savedJobs:<userId>
 * Value: JSON array of job objects
 */

const express = require('express');
const router = express.Router();
const redisClient = require('../utils/redisClient');
const auth = require('../middleware/auth');

// Helper to get user's saved jobs from Redis
async function getSavedJobs(userId) {
    try {
        const key = `savedJobs:${userId}`;
        const data = await redisClient.get(key);
        if (!data) {
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('Error getting saved jobs from Redis:', error);
        return [];
    }
}

// Helper to save jobs array to Redis
async function saveJobsToRedis(userId, jobs) {
    try {
        const key = `savedJobs:${userId}`;
        await redisClient.set(key, JSON.stringify(jobs));
        return true;
    } catch (error) {
        console.error('Error saving jobs to Redis:', error);
        return false;
    }
}

/**
 * POST /api/saved-jobs
 * Save a job for the authenticated user
 */
router.post('/', auth, async (req, res) => {
    try {
        const userId = req.userId || req.user.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token'
            });
        }

        const { id, title, company, location, salary, jobType, logo } = req.body;

        // Validate required fields
        if (!id || !title || !company) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: id, title, company'
            });
        }

        // Get current saved jobs
        const savedJobs = await getSavedJobs(userId);

        // Check if job already exists
        const existingIndex = savedJobs.findIndex(job => job.id === id);
        if (existingIndex !== -1) {
            return res.status(200).json({
                saved: true,
                alreadySaved: true
            });
        }

        // Add new job
        const newJob = {
            id,
            title,
            company,
            location: location || '',
            salary: salary || '',
            jobType: jobType || '',
            logo: logo || '',
            createdAt: Date.now()
        };

        savedJobs.push(newJob);

        // Save back to Redis
        const saved = await saveJobsToRedis(userId, savedJobs);
        if (!saved) {
            return res.status(500).json({
                success: false,
                message: 'Failed to save job to Redis'
            });
        }

        res.status(200).json({
            saved: true
        });
    } catch (error) {
        console.error('Error saving job:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * GET /api/saved-jobs
 * Get all saved jobs for the authenticated user
 */
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.userId || req.user.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token'
            });
        }

        const jobs = await getSavedJobs(userId);

        res.json({
            jobs
        });
    } catch (error) {
        console.error('Error fetching saved jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * DELETE /api/saved-jobs/:jobId
 * Remove a saved job for the authenticated user
 */
router.delete('/:jobId', auth, async (req, res) => {
    try {
        const userId = req.userId || req.user.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token'
            });
        }

        const { jobId } = req.params;

        // Get current saved jobs
        const savedJobs = await getSavedJobs(userId);

        // Filter out the job
        const filteredJobs = savedJobs.filter(job => job.id !== jobId);

        // Save back to Redis
        await saveJobsToRedis(userId, filteredJobs);

        res.json({
            removed: true
        });
    } catch (error) {
        console.error('Error removing saved job:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;

