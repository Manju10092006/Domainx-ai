/**
 * Redis utility wrapper
 * Provides rpush and lrange methods for Redis lists
 */

const { getClient } = require('./redisClient');

// Get the Redis client
const client = getClient();

// Wrapper object with list operations
const redis = {
    /**
     * Push to right of list
     * @param {string} key - Redis key
     * @param {string} value - Value to push
     * @returns {Promise<number>} - New length of list
     */
    async rpush(key, value) {
        try {
            if (!client || !client.isReady) {
                throw new Error('Redis client not ready');
            }
            return await client.rPush(key, value);
        } catch (error) {
            console.error('Redis rpush error:', error);
            throw error;
        }
    },

    /**
     * Get range of list elements
     * @param {string} key - Redis key
     * @param {number} start - Start index
     * @param {number} stop - Stop index (-1 for all)
     * @returns {Promise<string[]>} - Array of values
     */
    async lrange(key, start, stop) {
        try {
            if (!client || !client.isReady) {
                throw new Error('Redis client not ready');
            }
            return await client.lRange(key, start, stop);
        } catch (error) {
            console.error('Redis lrange error:', error);
            throw error;
        }
    },

    /**
     * Remove element from list
     * @param {string} key - Redis key
     * @param {number} count - Number of elements to remove
     * @param {string} value - Value to remove
     * @returns {Promise<number>} - Number of elements removed
     */
    async lrem(key, count, value) {
        try {
            if (!client || !client.isReady) {
                throw new Error('Redis client not ready');
            }
            return await client.lRem(key, count, value);
        } catch (error) {
            console.error('Redis lrem error:', error);
            throw error;
        }
    }
};

module.exports = redis;

