/**
 * Resume History Controller
 * Handles fetching and deleting resume history entries
 */

const ResumeHistory = require('../models/ResumeHistory');
const fs = require('fs');
const path = require('path');

/**
 * Get all resume history for the authenticated user
 * GET /api/resume/history
 */
const getResumeHistory = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }

        // Find all history entries for this user, sorted by date descending
        const history = await ResumeHistory.find({ userId })
            .sort({ createdAt: -1 })
            .select('-fullJson') // Exclude full JSON to reduce payload
            .lean();

        res.json({
            success: true,
            history: history
        });

    } catch (error) {
        console.error('Error fetching resume history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch resume history',
            message: error.message
        });
    }
};

/**
 * Get a single resume history item with full details
 * GET /api/resume/history/:id
 */
const getResumeHistoryItem = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.userId;
        const historyId = req.params.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }

        // Find the specific history entry
        const historyItem = await ResumeHistory.findOne({
            _id: historyId,
            userId: userId
        }).lean();

        if (!historyItem) {
            return res.status(404).json({
                success: false,
                error: 'Resume history entry not found'
            });
        }

        res.json({
            success: true,
            item: historyItem
        });

    } catch (error) {
        console.error('Error fetching resume history item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch resume history item',
            message: error.message
        });
    }
};

/**
 * Delete a resume history entry
 * DELETE /api/resume/history/:id
 */
const deleteResumeHistory = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.userId;
        const historyId = req.params.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }

        // Find the history entry first to get file path
        const historyItem = await ResumeHistory.findOne({
            _id: historyId,
            userId: userId
        });

        if (!historyItem) {
            return res.status(404).json({
                success: false,
                error: 'Resume history entry not found or does not belong to you'
            });
        }

        // Try to delete the stored file if it exists
        if (historyItem.storedFilepath) {
            const fullPath = path.join(__dirname, '../uploads', historyItem.storedFilepath);
            if (fs.existsSync(fullPath)) {
                try {
                    fs.unlinkSync(fullPath);
                    console.log(`🗑️ Deleted resume file: ${historyItem.storedFilepath}`);
                } catch (fileError) {
                    console.error('Error deleting file:', fileError.message);
                    // Continue with DB deletion even if file deletion fails
                }
            }
        }

        // Delete the database entry
        await ResumeHistory.deleteOne({ _id: historyId, userId: userId });

        res.json({
            success: true,
            message: 'Resume history entry deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting resume history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete resume history entry',
            message: error.message
        });
    }
};

module.exports = {
    getResumeHistory,
    getResumeHistoryItem,
    deleteResumeHistory
};



