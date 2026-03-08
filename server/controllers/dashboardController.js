/**
 * Dashboard Controller
 * Provides overview data for the dashboard page
 */

const SavedJob = require('../models/SavedJob');
const UserResume = require('../models/UserResume');

/**
 * Get dashboard overview for authenticated user
 * GET /api/dashboard/overview
 */
const getDashboardOverview = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }

        // Fetch saved jobs count
        const savedJobsCount = await SavedJob.countDocuments({ userId });

        // Fetch latest 3 saved jobs
        const latestSavedJobs = await SavedJob.find({ userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('title company location url createdAt');

        // Fetch last resume
        const lastResume = await UserResume.findOne({ userId })
            .sort({ uploadedAt: -1 })
            .select('fileName uploadedAt atsScore');

        res.json({
            success: true,
            savedJobsCount,
            latestSavedJobs: latestSavedJobs.map(job => ({
                title: job.title,
                company: job.company,
                location: job.location,
                url: job.url
            })),
            lastResume: lastResume ? {
                fileName: lastResume.fileName,
                uploadedAt: lastResume.uploadedAt,
                atsScore: lastResume.atsScore
            } : null
        });

    } catch (error) {
        console.error('Error fetching dashboard overview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard overview',
            message: error.message
        });
    }
};

module.exports = {
    getDashboardOverview
};



