/**
 * Redis Client Singleton
 * Connects to Redis using REDIS_URL environment variable
 */

const { createClient } = require('redis');
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({
    url: REDIS_URL
});

client.on('error', (err) => {
    console.error('Redis error:', err);
});

// Connect on first import
client.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err);
});

module.exports = client;

