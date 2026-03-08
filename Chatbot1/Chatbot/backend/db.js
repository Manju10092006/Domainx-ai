const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'chatbot.db');

let db;

function persistDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      user_message TEXT,
      bot_response TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_user_created ON conversations(user_id, created_at);`);

  persistDb();
  process.stdout.write(`SQLite DB ready at ${DB_PATH}\n`);
  return db;
}

function getDb() {
  if (!db) throw new Error('DB not initialized. Call initDb() first.');
  return db;
}

module.exports = { initDb, getDb, persistDb };
