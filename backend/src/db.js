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
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'provider', 'admin')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

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
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

  CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT,
    question TEXT NOT NULL,
    ai_response TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Seed default queues if they do not exist
db.exec(`
  INSERT OR IGNORE INTO queues (id, service_name, description, token_prefix, avg_service_time) VALUES
  ('queue-clinic-001', 'City Medical Center', 'OPD Consultations and checkups', 'C', 15),
  ('queue-train-001', 'Indian Railways Booking', 'Train reservations and Tatkal', 'T', 12),
  ('queue-flight-001', 'Airport Check-in', 'Flight check-in and baggage drop', 'F', 10),
  ('queue-stadium-eden', 'Eden Gardens Ticket Counter', 'Cricket match entry and VIP Box', 'E', 3),
  ('queue-stadium-modi', 'Narendra Modi Stadium Counter', 'Cricket match entry and General Gallery', 'M', 5),
  ('queue-stadium-wankhede', 'Wankhede Stadium Counter', 'Cricket match entry and VIP Box', 'W', 4),
  ('queue-stadium-saltlake', 'Salt Lake Stadium Counter', 'Football match entry and VIP Box', 'S', 4),
  ('queue-stadium-oldtrafford', 'Old Trafford Ticket Counter', 'Football match entry and Sir Alex Stand', 'O', 6),
  ('queue-match-manu-city', 'Man United vs Man City', 'Premier League Derby Match Entry', 'M', 3),
  ('queue-match-che-liv', 'Chelsea vs Liverpool', 'Premier League Match Entry', 'C', 3),
  ('queue-match-barca-real', 'Barcelona vs Real Madrid', 'El Clasico Match Entry', 'B', 3),
  ('queue-match-ind-aus', 'India vs Australia', 'International T20 Match Entry', 'I', 3),
  ('queue-match-ind-sa', 'India vs South Africa', 'International ODI Match Entry', 'I', 3),
  ('queue-match-csk-mi', 'CSK vs MI', 'IPL Match Entry', 'C', 3);
`);

// Automatically make the creator an admin
db.exec(`UPDATE users SET role = 'admin' WHERE email = 'dip06karmakar@gmail.com';`);

// Fix missing is_active column if database was restored from an old WAL file
try {
  db.exec('ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1');
} catch (e) {
  // Column already exists, ignore
}

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
