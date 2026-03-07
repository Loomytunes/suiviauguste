import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, 'observations.db');

const db = new Database(dbPath);

// Table avec axes nullable (NULL = non renseigné, 0 = difficulté, 1 = positif)
db.exec(`
  CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    staff_email TEXT NOT NULL,
    concentration INTEGER,
    respect_consigne INTEGER,
    emotion_management INTEGER,
    respect_peers INTEGER,
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

// Migration : si l'ancienne table a des colonnes NOT NULL sur les axes, recréer avec nullable
const tableInfo = db.prepare("PRAGMA table_info(observations)").all();
const concentrationCol = tableInfo.find((c) => c.name === 'concentration');
if (concentrationCol && concentrationCol.notnull === 1) {
  db.exec(`
    CREATE TABLE observations_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT NOT NULL,
      staff_email TEXT NOT NULL,
      concentration INTEGER,
      respect_consigne INTEGER,
      emotion_management INTEGER,
      respect_peers INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    INSERT INTO observations_new SELECT * FROM observations;
    DROP TABLE observations;
    ALTER TABLE observations_new RENAME TO observations;
  `);
}

// Default parent password
const defaultPassword = process.env.PARENT_PASSWORD || 'auguste';
const existing = db.prepare('SELECT 1 FROM parent_password WHERE id = 1').get();
if (!existing) {
  db.prepare('INSERT INTO parent_password (id, hash) VALUES (1, ?)').run(defaultPassword);
}

export default db;
