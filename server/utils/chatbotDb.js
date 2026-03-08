/**
 * Chatbot SQLite Database Module
 * Extracted from friend's chatbot project — stores chat history locally.
 * Uses sql.js (pure JS SQLite) — no native bindings needed.
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'chatbot.db');

let db;

function persistDb() {
  if (!db) return;
  const data = db.export();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initChatDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS chat_users (
      id TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      user_message TEXT,
      bot_response TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES chat_users(id) ON DELETE CASCADE
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_chat_user_created ON chat_conversations(user_id, created_at);`);

  persistDb();
  console.log(`✅ Chatbot SQLite DB ready at ${DB_PATH}`);
  return db;
}

function getChatDb() {
  if (!db) throw new Error('Chatbot DB not initialized. Call initChatDb() first.');
  return db;
}

function chatDbQuery(sql, params) {
  const result = getChatDb().exec(sql, params);
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

module.exports = { initChatDb, getChatDb, persistDb, chatDbQuery };
