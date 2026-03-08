/**
 * DomainX AI Jobs API Server
 * 
 * Local Job Dataset with Redis Caching
 * Handles job search, trending jobs, and saved jobs
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables FIRST, before anything else
require('dotenv').config({ path: __dirname + '/.env' });

// Validate required environment variables (does not log actual values)
const { validateEnv, logEnvStatus } = require('./utils/envValidator');
validateEnv([
    'MONGODB_URI',
    'JWT_SECRET'
], 'DomainX AI Main Server');

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

const app = express();

// Connect to MongoDB (will be called after app setup)
const connectDB = require('./utils/db');

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

// Request logging middleware (for debugging)
app.use((req, res, next) => {
    if (req.path.startsWith('/api/jobs')) {
        console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    }
    next();
});

// Routes
const atsRoutes = require('./routes/atsRoutes');
const savedJobsRoutes = require('./routes/saved_jobs');
const dashboardRoutes = require('./routes/dashboardRoutes');
const resumeHistoryRoutes = require('./routes/resumeHistoryRoutes');
const profileRoutes = require('./routes/profileRoutes');
const chatRoutes = require('./routes/chatRoutes');
const matchJobsRoutes = require('./routes/matchJobsRoutes');

app.use('/api/resume', atsRoutes);
app.use('/api/resume', resumeHistoryRoutes); // Resume history routes under /api/resume
app.use('/api/saved-jobs', savedJobsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/match-jobs', matchJobsRoutes);

// JOB ROUTES — Local dataset
try {
    const jobRoutes = require('./routes/jobRoutes');
    app.use('/api/jobs', jobRoutes);
    console.log('✅ Job routes registered at /api/jobs (local dataset)');
} catch (error) {
    console.error('❌ Error loading jobRoutes:', error.message);
}

// NOTE: Skill Test is now fully frontend-powered via Puter.js — no backend routes needed

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'DomainX AI Jobs API Server is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'DomainX AI Jobs API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            searchJobs: 'POST /api/jobs/search',
            trendingJobs: 'GET /api/jobs',
            savedJobs: 'GET /api/saved-jobs'
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

// 404 handler — MUST be last
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});

const PORT = process.env.PORT || 5000;

// Start server after MongoDB connection
async function startServer() {
    try {
        // Connect to MongoDB first
        await connectDB();

        // Initialize chatbot SQLite DB
        const { initChatDb } = require('./utils/chatbotDb');
        await initChatDb();

        // Then start the server
        app.listen(PORT, () => {
            console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                 DOMAINX AI JOBS API SERVER                       ║
╠══════════════════════════════════════════════════════════════════╣
║  Server: http://localhost:${PORT}                                    ║
║  Search: POST /api/jobs/search                                   ║
║  Trending: GET /api/jobs                                         ║
║  Saved Jobs: GET /api/saved-jobs                                 ║
║  Health: GET /health                                             ║
║  Chat: POST /api/chat · GET /api/chat/history/:userId            ║
║                                                                   ║
║  Features: Local Dataset (50 jobs) + Puter.js AI Chat            ║
║  Mode: Fully Offline / Hackathon-Ready                           ║
╚══════════════════════════════════════════════════════════════════╝
            `);
            console.log(`✅ Server is running and ready to accept requests!`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;
