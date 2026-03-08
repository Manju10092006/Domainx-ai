/**
 * Optional Auth Middleware
 * Adds user info to request if token is present, but doesn't require it
 */

const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            try {
                // Verify token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Add user data to request
                req.user = decoded;
                req.userId = decoded.userId || decoded.id;
            } catch (error) {
                // Token invalid, but continue without auth
                req.user = null;
                req.userId = null;
            }
        } else {
            req.user = null;
            req.userId = null;
        }

        next();
    } catch (error) {
        // Continue without auth on any error
        req.user = null;
        req.userId = null;
        next();
    }
};

module.exports = optionalAuth;



