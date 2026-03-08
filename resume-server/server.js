/**
 * DomainX AI Backend Server
 * 
 * LOCAL ATS Resume Analyzer - 100% Offline
 * No external AI APIs (Gemini, HuggingFace, OpenAI, Puter.js)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables FIRST, before anything else
require('dotenv').config({ path: __dirname + '/.env' });

// Validate required environment variables (does not log actual values)
const { validateEnv, logEnvStatus } = require('./utils/envValidator');
validateEnv([
    'MONGODB_URI'
], 'DomainX AI Resume Server');

// Log status (shows if set, never shows actual values)
if (process.env.NODE_ENV !== 'production') {
    logEnvStatus([
        'PORT',
        'NODE_ENV',
        'MONGODB_URI',
        'REDIS_URL',
        'RABBITMQ_URL',
        'JWT_SECRET'
    ]);
}

// Routes
const atsRoutes = require('./routes/atsRoutes');
const jobsRoutes = require('./routes/jobsRoutes');
const savedJobsRoutes = require('./routes/savedJobsRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/resume', atsRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/saved-jobs', savedJobsRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'DomainX AI Server is running',
        mode: 'LOCAL ATS - No External AI',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'DomainX AI LOCAL ATS API',
        version: '4.0.0',
        mode: '100% LOCAL - No External AI APIs',
        endpoints: {
            health: 'GET /health',
            analyzeResume: 'POST /api/resume/ats',
            atsHealth: 'GET /api/resume/ats/health',
            jobs: '/api/jobs'
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
    });
});

// RESUME server uses port 5001 to avoid conflict with JOBS server (5000)
// Force port 5001 - do not use PORT from env to avoid conflicts
const PORT = 5001;
console.log(`🚀 RESUME server starting on port ${PORT}`);

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                LOCAL ATS RESUME ANALYZER                         ║
╠══════════════════════════════════════════════════════════════════╣
║  Mode: 100% LOCAL - No External AI APIs                          ║
║  Server: http://localhost:${PORT}                                    ║
║  Analyze: POST /api/resume/ats                                    ║
║  Health: GET /health                                              ║
║                                                                   ║
║  Supports: PDF, DOC, DOCX, TXT, JPG, PNG                         ║
║  Max Size: 5MB                                                    ║
╚══════════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
