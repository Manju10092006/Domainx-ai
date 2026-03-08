/**
 * Redis Safe Operations Helper
 * Wraps Redis GET/SET operations to prevent crashes if Redis fails
 */

const { getClient, isRedisConnected } = require('../utils/redisClient');

/**
 * Safely get value from Redis
 * @param {string} key - Redis key
 * @returns {Promise<string|null>} - Returns null if Redis fails or key doesn't exist
 */
async function redisGet(key) {
  if (!isRedisConnected()) {
    return null;
  }

  try {
    const client = getClient();
    if (!client) return null;

    const value = await client.get(key);
    return value;
  } catch (error) {
    console.error(`⚠️  Redis GET failed for key "${key}":`, error.message);
    return null; // Fallback gracefully
  }
}

/**
 * Safely set value in Redis with TTL
 * @param {string} key - Redis key
 * @param {string} value - Value to store (will be JSON stringified if object)
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
async function redisSet(key, value, ttlSeconds = 3600) {
  if (!isRedisConnected()) {
    return false;
  }

  try {
    const client = getClient();
    if (!client) return false;

    // If value is an object, stringify it
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    await client.setEx(key, ttlSeconds, stringValue);
    return true;
  } catch (error) {
    console.error(`⚠️  Redis SET failed for key "${key}":`, error.message);
    return false; // Fallback gracefully
  }
}

/**
 * Safely delete key from Redis
 * @param {string} key - Redis key to delete
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
async function redisDel(key) {
  if (!isRedisConnected()) {
    return false;
  }

  try {
    const client = getClient();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    console.error(`⚠️  Redis DEL failed for key "${key}":`, error.message);
    return false; // Fallback gracefully
  }
}

/**
 * Safely check if key exists in Redis
 * @param {string} key - Redis key
 * @returns {Promise<boolean>} - Returns true if key exists, false otherwise
 */
async function redisExists(key) {
  if (!isRedisConnected()) {
    return false;
  }

  try {
    const client = getClient();
    if (!client) return false;

    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error(`⚠️  Redis EXISTS failed for key "${key}":`, error.message);
    return false; // Fallback gracefully
  }
}

module.exports = {
  redisGet,
  redisSet,
  redisDel,
  redisExists,
};

