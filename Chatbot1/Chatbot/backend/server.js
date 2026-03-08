const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

const { initDb } = require('./db');
const chatRoute = require('./routes/chat');
const historyRoute = require('./routes/history');

dotenv.config();

async function start() {
  await initDb();

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  });

  app.use('/api', limiter);

  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/chat', chatRoute);
  app.use('/api/history', historyRoute);

  const path = require('path');
  app.use(express.static(path.join(__dirname, '../frontend')));

  const port = Number(process.env.PORT || 5000);
  app.listen(port, () => {
    process.stdout.write(`Server running on http://localhost:${port}\n`);
  });
}

start().catch((err) => {
  process.stderr.write(`Failed to start server: ${err?.message || err}\n`);
  process.exit(1);
});
