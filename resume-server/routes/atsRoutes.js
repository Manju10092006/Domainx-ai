/**
 * ATS Routes - Local Resume Analysis
 * POST /api/resume/ats
 *
 * 100% LOCAL - No external AI APIs
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const { analyzeResume } = require('../controllers/atsController');

// ============================================================
// USE OS SYSTEM TEMP DIR — outside VS Code workspace
// This prevents Live Server from detecting file changes
// and reloading the browser during resume upload/analysis
// ============================================================
const uploadsDir = os.tmpdir(); // e.g. C:\Users\...\AppData\Local\Temp
console.log('📁 Resume temp dir (OS system):', uploadsDir);

// ============================================================
// MULTER STORAGE CONFIGURATION
// ============================================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir); // Write to OS temp — outside workspace
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'resume-' + uniqueSuffix + ext);
    }
});

// ============================================================
// FILE FILTER - Allowed Types
// ============================================================
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
const ALLOWED_MIMETYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png'
];

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = ALLOWED_MIMETYPES.includes(file.mimetype);
    const extOk = ALLOWED_EXTENSIONS.includes(ext);

    if (mimeOk || extOk) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${ext}. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG`), false);
    }
};

// ============================================================
// MULTER UPLOAD INSTANCE
// ============================================================
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// ============================================================
// ERROR HANDLING MIDDLEWARE FOR MULTER
// ============================================================
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size must be less than 5MB'
            });
        }
        return res.status(400).json({
            success: false,
            error: `Upload error: ${err.message}`
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Invalid file upload'
        });
    }
    next();
};

// ============================================================
// ROUTES
// ============================================================

/**
 * POST /api/resume/ats
 * Upload and analyze resume locally (no AI APIs)
 */
router.post('/ats', upload.single('resume'), handleMulterError, analyzeResume);

/**
 * GET /api/resume/ats/health
 * Health check for ATS endpoint
 */
router.get('/ats/health', (req, res) => {
    res.json({
        success: true,
        message: 'Local ATS Analyzer is ready',
        mode: '100% LOCAL - No external AI',
        supportedFormats: ALLOWED_EXTENSIONS
    });
});

module.exports = router;

