/**
 * Redis Client with Automatic Reconnection
 * Handles connection, reconnection, and graceful fallback
 */

const redis = require('redis');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Get Redis URL from environment or use default
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let client = null;
let isConnected = false;

/**
 * Create and configure Redis client
 */
function createRedisClient() {
  try {
    client = redis.createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.log('⚠️  Redis: Max reconnection attempts reached. Falling back to DB.');
            return false; // Stop reconnecting
          }
          // Exponential backoff: 100ms, 200ms, 400ms, etc.
          return Math.min(retries * 100, 3000);
        },
        connectTimeout: 5000,
      },
    });

    // Connection event handlers
    client.on('connect', () => {
      console.log('🔄 Redis: Connecting...');
    });

    client.on('ready', () => {
      isConnected = true;
      console.log('⚡ Redis Connected');
    });

    client.on('error', (err) => {
      isConnected = false;
      console.error('❌ Redis Error:', err.message);
    });

    client.on('end', () => {
      isConnected = false;
      console.log('⚠️  Redis: Connection ended');
    });

    client.on('reconnecting', () => {
      isConnected = false;
      console.log('🔄 Redis: Reconnecting...');
    });

    // Connect to Redis
    client.connect().catch((err) => {
      console.error('❌ Redis: Initial connection failed:', err.message);
      console.log('⚠️  Redis: Falling back to DB operations');
      isConnected = false;
    });

    return client;
  } catch (error) {
    console.error('❌ Redis: Failed to create client:', error.message);
    isConnected = false;
    return null;
  }
}

/**
 * Get Redis client instance
 * @returns {redis.RedisClient|null}
 */
function getClient() {
  if (!client) {
    client = createRedisClient();
  }
  return client;
}

/**
 * Check if Redis is connected
 * @returns {boolean}
 */
function isRedisConnected() {
  return isConnected && client && client.isReady;
}

/**
 * Gracefully close Redis connection
 */
async function closeConnection() {
  if (client && isConnected) {
    try {
      await client.quit();
      console.log('✅ Redis: Connection closed gracefully');
    } catch (error) {
      console.error('❌ Redis: Error closing connection:', error.message);
    }
  }
}

// Initialize client on module load
getClient();

module.exports = {
  getClient,
  isRedisConnected,
  closeConnection,
};

