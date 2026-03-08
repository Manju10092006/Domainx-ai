const jwt = require('jsonwebtoken');

// Environment variables - loaded via dotenv in server.js
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validate JWT_SECRET on module load
if (!JWT_SECRET) {
    console.error('\n❌ ERROR: JWT_SECRET is not defined!');
    console.error('Please add JWT_SECRET to your .env file in auth-server/');
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    console.error('See .env.example for the required format.\n');
    process.exit(1);
}

/**
 * Generate JWT token for authenticated user
 * Standardized payload: { id, email, name, picture }
 */
const generateToken = (user) => {

    const payload = {
        id: user.id || user._id,  // Support both id and _id
        email: user.email,
        name: user.displayName || user.name || user.displayName || 'User',
        picture: user.photoURL || user.picture || null  // Include Google profile picture
    };

    return jwt.sign(
        payload,
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN
        }
    );
};

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Return user object with all fields including picture
        return {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            picture: decoded.picture,
            avatar: decoded.picture,  // Also include as avatar for compatibility
            photoURL: decoded.picture,  // Also include as photoURL for compatibility
            iat: decoded.iat,
            exp: decoded.exp
        };
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken
};
