/**
 * Resume History Routes
 * GET /api/resume/history - Get user's resume history (requires auth)
 * GET /api/resume/history/:id - Get a specific history item (requires auth)
 * DELETE /api/resume/history/:id - Delete a history item (requires auth)
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getResumeHistory,
    getResumeHistoryItem,
    deleteResumeHistory
} = require('../controllers/resumeHistoryController');

/**
 * GET /api/resume/history
 * Get all resume history for authenticated user
 */
router.get('/history', auth, getResumeHistory);

/**
 * GET /api/resume/history/:id
 * Get a specific resume history item with full details
 */
router.get('/history/:id', auth, getResumeHistoryItem);

/**
 * DELETE /api/resume/history/:id
 * Delete a resume history entry
 */
router.delete('/history/:id', auth, deleteResumeHistory);

module.exports = router;



