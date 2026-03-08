const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Resume upload endpoint with JWT auth and file upload
router.post('/upload', auth, upload.single('resume'), resumeController.uploadResume);

// Get resume result by ID
router.get('/result/:id', auth, resumeController.getResumeResult);

module.exports = router;
