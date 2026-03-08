/**
 * Environment Variable Validation Utility
 * 
 * This utility provides safe, centralized validation for all required
 * environment variables. It ensures that:
 * 1. Required variables are present
 * 2. No secrets are logged or exposed
 * 3. Clear error messages guide developers to fix issues
 * 
 * Usage:
 *   const { validateEnv, getEnvVar } = require('./utils/envValidator');
 *   validateEnv(['MONGODB_URI', 'JWT_SECRET']); // Throws if missing
 *   const dbUri = getEnvVar('MONGODB_URI'); // Returns value or throws
 */

/**
 * Validates that all required environment variables are present.
 * Exits the process with helpful error messages if any are missing.
 * 
 * @param {string[]} requiredVars - Array of required environment variable names
 * @param {string} [serviceName='Service'] - Name of the service for error messages
 */
function validateEnv(requiredVars, serviceName = 'Service') {
    const missing = [];

    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        console.error(`\n❌ ERROR: ${serviceName} is missing required environment variables:`);
        console.error('');
        missing.forEach(varName => {
            console.error(`   • ${varName}`);
        });
        console.error('');
        console.error('Please ensure your .env file contains all required variables.');
        console.error('See .env.example for the required format.');
        console.error('');
        console.error('To generate secure secrets, run:');
        console.error('  node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
        console.error('');
        process.exit(1);
    }

    console.log(`✅ Environment variables validated for ${serviceName}`);
}

/**
 * Safely retrieves an environment variable.
 * Returns the value if present, or a default value.
 * NEVER logs the actual value to prevent secret exposure.
 * 
 * @param {string} varName - Name of the environment variable
 * @param {string} [defaultValue=null] - Default value if not set
 * @returns {string|null} The environment variable value or default
 */
function getEnvVar(varName, defaultValue = null) {
    return process.env[varName] || defaultValue;
}

/**
 * Safely retrieves a required environment variable.
 * Throws an error if the variable is not set.
 * NEVER logs the actual value to prevent secret exposure.
 * 
 * @param {string} varName - Name of the environment variable
 * @returns {string} The environment variable value
 * @throws {Error} If the variable is not set
 */
function getRequiredEnvVar(varName) {
    const value = process.env[varName];
    if (!value) {
        throw new Error(`Missing required environment variable: ${varName}`);
    }
    return value;
}

/**
 * Logs environment configuration status without exposing actual values.
 * Only logs whether variables are set or not.
 * 
 * @param {string[]} varNames - Array of variable names to check
 */
function logEnvStatus(varNames) {
    console.log('\n📋 Environment Configuration Status:');
    console.log('─'.repeat(40));

    for (const varName of varNames) {
        const isSet = !!process.env[varName];
        const status = isSet ? '✅ SET' : '❌ NOT SET';
        console.log(`   ${varName}: ${status}`);
    }

    console.log('─'.repeat(40));
    console.log('');
}

module.exports = {
    validateEnv,
    getEnvVar,
    getRequiredEnvVar,
    logEnvStatus
};
