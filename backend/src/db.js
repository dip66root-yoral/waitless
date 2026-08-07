const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'queueiq.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create schema
db.exec(`
  CREATE TABLE IF NOT EXISTS queues (
    id TEXT PRIMARY KEY,
    service_name TEXT NOT NULL,
    provider_id TEXT NOT NULL DEFAULT 'default',
    description TEXT,
    token_prefix TEXT NOT NULL DEFAULT 'A',
    avg_service_time INTEGER NOT NULL DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'closed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tokens (
    id TEXT PRIMARY KEY,
    queue_id TEXT NOT NULL,
    token_number TEXT NOT NULL,
    user_name TEXT NOT NULL,
    phone TEXT,
    request_text TEXT,
    service_type TEXT,
    urgency TEXT NOT NULL DEFAULT 'medium' CHECK(urgency IN ('low', 'medium', 'high')),
    request_category TEXT DEFAULT 'walk-in',
    estimated_service_duration INTEGER DEFAULT 10,
    notes TEXT,
    priority INTEGER NOT NULL DEFAULT 2,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting', 'in-progress', 'done', 'skipped')),
    estimated_wait_time INTEGER,
    position INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (queue_id) REFERENCES queues(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tokens_queue_id ON tokens(queue_id);
  CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
`);

// Helper: recalculate positions and wait times for a queue
function recalculateQueue(queueId) {
  const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(queueId);
  if (!queue) return;

  const waitingTokens = db.prepare(`
    SELECT * FROM tokens 
    WHERE queue_id = ? AND status = 'waiting'
    ORDER BY priority DESC, created_at ASC
  `).all(queueId);

  const updateStmt = db.prepare(`
    UPDATE tokens SET position = ?, estimated_wait_time = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  const updateMany = db.transaction((tokens) => {
    tokens.forEach((token, index) => {
      const position = index + 1;
      const estimatedWait = position * queue.avg_service_time;
      updateStmt.run(position, estimatedWait, token.id);
    });
  });

  updateMany(waitingTokens);
}

module.exports = { db, recalculateQueue };
