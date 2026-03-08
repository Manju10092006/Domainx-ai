/**
 * Chat Routes — Save conversations and retrieve history
 * AI runs on frontend via Puter.js; backend only persists data.
 */

const express = require('express');
const router = express.Router();
const { getChatDb, persistDb, chatDbQuery } = require('../utils/chatbotDb');

// POST /api/chat — Save a conversation turn
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

    const db = getChatDb();
    db.run('INSERT OR IGNORE INTO chat_users (id) VALUES (?)', [userId]);
    db.run('INSERT INTO chat_conversations (user_id, user_message, bot_response) VALUES (?, ?, ?)', [userId, message, reply]);
    persistDb();

    return res.json({ reply });
  } catch (err) {
    console.error('[/api/chat error]', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

// GET /api/chat/history/:userId — Retrieve last 20 conversations
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    const rows = chatDbQuery(
      'SELECT user_message, bot_response, created_at FROM chat_conversations WHERE user_id = $uid ORDER BY created_at DESC, id DESC LIMIT 20',
      { $uid: userId }
    );

    const chronological = rows.slice().reverse();
    return res.json({ messages: chronological });
  } catch (err) {
    console.error('[/api/chat/history error]', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

module.exports = router;
