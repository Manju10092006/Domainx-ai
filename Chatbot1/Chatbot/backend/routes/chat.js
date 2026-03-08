const express = require('express');
const { getDb, persistDb } = require('../db');

const router = express.Router();

// AI runs on the frontend via Puter.js.
// This endpoint receives { userId, message, reply } and saves to DB.
router.post('/', async (req, res) => {
  try {
    const { userId, message, reply } = req.body || {};

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }
    if (!reply || typeof reply !== 'string') {
      return res.status(400).json({ error: 'reply is required' });
    }

    const db = getDb();

    db.run('INSERT OR IGNORE INTO users (id) VALUES (?)', [userId]);
    db.run('INSERT INTO conversations (user_id, user_message, bot_response) VALUES (?, ?, ?)', [userId, message, reply]);
    persistDb();

    return res.json({ reply });
  } catch (err) {
    console.error('[/api/chat error]', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

module.exports = router;
