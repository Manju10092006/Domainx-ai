const UserProfile = require('../models/UserProfile');

/**
 * Get user profile
 * GET /api/profile
 */
const getProfile = async (req, res) => {
    try {
        // userId comes from middleware (optionalAuth)
        const userId = req.user?.id || req.user?.userId || req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized: No user ID found'
            });
        }

        let profile = await UserProfile.findOne({ userId });

        if (!profile) {
            // Return empty profile structure if not found (frontend expects JSON)
            return res.json({
                success: true,
                profile: {}
            });
        }

        res.json({
            success: true,
            profile
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile',
            message: error.message
        });
    }
};

/**
 * Update or create user profile
 * POST /api/profile
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized: No user ID found'
            });
        }

        const updateData = {
            ...req.body,
            userId, // Force userId to be from token
            updatedAt: Date.now()
        };

        // Find and update, or create if doesn't exist (upsert: true)
        const profile = await UserProfile.findOneAndUpdate(
            { userId },
            updateData,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json({
            success: true,
            profile,
            message: 'Profile saved successfully'
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile',
            message: error.message
        });
    }
};

module.exports = {
    getProfile,
    updateProfile
};
