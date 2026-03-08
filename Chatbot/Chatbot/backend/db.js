const mysql = require('mysql2/promise');

let pool;

async function ensureDatabaseExists({ host, user, password, database }) {
  const connection = await mysql.createConnection({
    host,
    user,
    password,
    multipleStatements: true
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await connection.end();
}

async function ensureTablesExist(databasePool) {
  await databasePool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await databasePool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36),
      user_message TEXT,
      bot_response TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_created (user_id, created_at),
      CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function initDb() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (!host || !user || !database) {
    throw new Error('Missing required DB env vars: DB_HOST, DB_USER, DB_NAME');
  }

  await ensureDatabaseExists({ host, user, password, database });

  pool = mysql.createPool({
    host,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  await ensureTablesExist(pool);

  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('DB not initialized. Call initDb() before using getPool().');
  }
  return pool;
}

module.exports = {
  initDb,
  getPool
};
