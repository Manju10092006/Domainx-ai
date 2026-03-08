const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user to request
 */
const auth = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const token = authHeader.split(' ')[1]; // Extract token after "Bearer "

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        // Get JWT_SECRET from environment (must match auth-server)
        // Use same fallback as auth-server for consistency
        const jwtSecret = process.env.JWT_SECRET || 'domainxai_super_secret_key_123';

        // Verify token
        const decoded = jwt.verify(token, jwtSecret);

        // Attach user data to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
        };
        req.userId = decoded.id; // For backward compatibility

        next();
    } catch (error) {
        // Handle JWT verification errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        // Other errors
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
    }
};

module.exports = auth;

