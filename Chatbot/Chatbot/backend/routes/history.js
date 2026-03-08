const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    const pool = getPool();

    const [rows] = await pool.query(
      'SELECT user_message, bot_response, created_at FROM conversations WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 20',
      [userId]
    );

    const chronological = Array.isArray(rows) ? rows.slice().reverse() : [];
    return res.json({ messages: chronological });
  } catch (err) {
    console.error('[/api/history error]', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

module.exports = router;
