const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');
const path = require('path');

// Load environment variables FIRST, before any modules that depend on them
require('dotenv').config({ path: __dirname + '/.env' });

// Now require modules that depend on environment variables
const { generateToken } = require('./utils/tokens');

const app = express();
const PORT = process.env.PORT;

// Default CLIENT_URL for local development (won't crash if not set)
if (!process.env.CLIENT_URL) {
    process.env.CLIENT_URL = 'http://localhost:5506';
    console.warn('⚠️  CLIENT_URL not set — defaulting to http://localhost:5506 (local dev)');
}

// CORS configuration - Strict origin check (strip trailing slashes and whitespace)
const corsOptions = {
    origin: (origin, callback) => {
        // Normalize: strip trailing slash, trim whitespace, lowercase
        const allowed = (process.env.CLIENT_URL || '').trim().replace(/\/$/, '').toLowerCase();
        const requestOrigin = (origin || '').trim().replace(/\/$/, '').toLowerCase();

        // Log for debugging
        console.log('🔍 CORS check - Origin:', origin, '| Allowed:', allowed, '| Match:', requestOrigin === allowed);

        // Allow if no origin (same-origin requests) or if origins match
        if (!origin || requestOrigin === allowed) {
            callback(null, true);
        } else {
            console.error('❌ CORS blocked origin:', origin, '| Expected:', process.env.CLIENT_URL);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
// Serve static files from the project root (one level up)
app.use(express.static(path.join(__dirname, '..')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
// Validate SESSION_SECRET before use
if (!process.env.SESSION_SECRET) {
    console.error('\n❌ ERROR: SESSION_SECRET is not defined!');
    console.error('Please add SESSION_SECRET to your .env file in auth-server/');
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    console.error('See .env.example for the required format.\n');
    process.exit(1);
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Check for required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth credentials not set — OAuth login disabled (local dev mode)');
}

// Google OAuth Strategy — only configure if credentials exist
if (process.env.GOOGLE_CALLBACK_URL && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    }, (accessToken, refreshToken, profile, done) => {
        const user = {
            id: profile.id,
            email: profile.emails[0].value,
            displayName: profile.displayName,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            photoURL: profile.photos[0].value,
            provider: 'google'
        };
        return done(null, user);
    }));

    // Google OAuth routes (only registered when credentials exist)
    app.get('/auth/google', (req, res, next) => {
        if (req.query.returnTo) req.session.returnTo = req.query.returnTo;
        passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })(req, res, next);
    });

    app.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/auth/google/failure' }),
        async (req, res) => {
            try {
                if (!req.user) return res.status(500).json({ success: false, error: 'No user data' });
                const token = generateToken(req.user);
                const redirectUrl = `${process.env.CLIENT_URL.replace(/\/$/, '')}/src/pages/dashboard/index.html?token=${token}`;
                res.redirect(redirectUrl);
            } catch (err) {
                console.error('❌ OAuth callback error:', err);
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        }
    );

    app.get('/auth/google/failure', (req, res) => {
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5506'}?auth=error`);
    });

    console.log('✅ Google OAuth routes registered');
} else {
    console.warn('⚠️  OAuth routes skipped — no credentials (local dev mode)');
    app.get('/auth/google', (req, res) => res.json({ error: 'Google OAuth not configured for local dev' }));
}

// Auth/me — always available
app.get('/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { verifyToken } = require('./utils/tokens');
    const user = verifyToken(token);
    if (user) return res.json(user);
    res.status(401).json({ success: false, message: 'Unauthorized' });
});

// Logout — always available
app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ success: false, error: 'Logout failed' });
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', port: PORT }));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Always start the server
app.listen(PORT, () => {
    console.log('\n✅ Auth server running on port ' + PORT);
    if (process.env.GOOGLE_CALLBACK_URL) console.log('✅ Google OAuth: enabled');
    else console.log('⚠️  Google OAuth: disabled (no credentials)');
    if (process.env.CLIENT_URL) console.log('✅ Client URL: ' + process.env.CLIENT_URL);
    console.log('✅ Ready to accept requests\n');
});
