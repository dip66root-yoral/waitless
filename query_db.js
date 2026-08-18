const db = require('better-sqlite3')('c:/waitless/backend/data/queueiq.db');
const users = db.prepare('SELECT email, created_at FROM users').all();
console.log(users);
