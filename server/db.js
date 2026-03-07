import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, 'observations.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    staff_email TEXT NOT NULL,
    concentration INTEGER NOT NULL,
    respect_consigne INTEGER NOT NULL,
    emotion_management INTEGER NOT NULL,
    respect_peers INTEGER NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS parent_password (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pending_sync (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payload TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Default parent password: "auguste" (bcrypt would be better in production; for simplicity we use plain comparison with env)
const defaultPassword = process.env.PARENT_PASSWORD || 'auguste';
const existing = db.prepare('SELECT 1 FROM parent_password WHERE id = 1').get();
if (!existing) {
  db.prepare('INSERT INTO parent_password (id, hash) VALUES (1, ?)').run(defaultPassword);
}

export default db;
