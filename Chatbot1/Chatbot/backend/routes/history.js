const express = require('express');
const { getDb } = require('../db');

function sqlQuery(db, sql, params) {
  const result = db.exec(sql, params);
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = getDb();

    const rows = sqlQuery(
      db,
      'SELECT user_message, bot_response, created_at FROM conversations WHERE user_id = $uid ORDER BY created_at DESC, id DESC LIMIT 20',
      { $uid: userId }
    );

    const chronological = rows.slice().reverse();
    return res.json({ messages: chronological });
  } catch (err) {
    console.error('[/api/history error]', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

module.exports = router;
