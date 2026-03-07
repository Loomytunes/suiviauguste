import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import { sendObservationEmail } from './mailer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const clientDist = path.join(__dirname, '..', 'client', 'dist');
const fs = await import('fs');
const serveClient = process.env.NODE_ENV === 'production' || fs.existsSync(clientDist);

const app = express();
app.use(cors());
app.use(express.json());
if (serveClient) {
  app.use(express.static(clientDist));
}

// API: Health
app.get('/api/health', (_, res) => res.json({ ok: true }));

// API: Verify parent password
app.post('/api/auth/parent', (req, res) => {
  const { password } = req.body || {};
  const row = db.prepare('SELECT hash FROM parent_password WHERE id = 1').get();
  const valid = row && row.hash === password;
  res.json({ valid: !!valid });
});

// API: List observations (for parent view; optionally protect with auth header or session in real app)
app.get('/api/observations', (req, res) => {
  const rows = db.prepare(
    'SELECT id, date, time, location, staff_email, concentration, respect_consigne, emotion_management, respect_peers, notes, created_at FROM observations ORDER BY created_at DESC'
  ).all();
  res.json(rows);
});

// API: Stats for charts
app.get('/api/stats', (req, res) => {
  const byLocation = db.prepare(
    'SELECT location, COUNT(*) as count FROM observations GROUP BY location'
  ).all();
  const all = db.prepare('SELECT concentration, respect_consigne, emotion_management, respect_peers FROM observations').all();
  const axes = ['concentration', 'respect_consigne', 'emotion_management', 'respect_peers'];
  const perAxis = axes.map(axis => {
    let pos = 0, neg = 0;
    all.forEach(row => (row[axis] === 1 ? pos++ : neg++));
    return { axis, positive: pos, negative: neg };
  });
  const byDate = db.prepare(
    `SELECT date, 
      SUM(CASE WHEN concentration=1 THEN 1 ELSE 0 END) as c_pos,
      SUM(CASE WHEN concentration=0 THEN 1 ELSE 0 END) as c_neg,
      SUM(CASE WHEN respect_consigne=1 THEN 1 ELSE 0 END) as r_pos,
      SUM(CASE WHEN respect_consigne=0 THEN 1 ELSE 0 END) as r_neg,
      SUM(CASE WHEN emotion_management=1 THEN 1 ELSE 0 END) as e_pos,
      SUM(CASE WHEN emotion_management=0 THEN 1 ELSE 0 END) as e_neg,
      SUM(CASE WHEN respect_peers=1 THEN 1 ELSE 0 END) as p_pos,
      SUM(CASE WHEN respect_peers=0 THEN 1 ELSE 0 END) as p_neg
    FROM observations GROUP BY date ORDER BY date`
  ).all();
  res.json({ byLocation, perAxis, byDate });
});

// API: Create observation
app.post('/api/observations', (req, res) => {
  const body = req.body || {};
  const {
    date,
    time,
    location,
    staff_email,
    concentration,
    respect_consigne,
    emotion_management,
    respect_peers,
    notes
  } = body;
  if (!date || !time || !location ||
      concentration === undefined || respect_consigne === undefined ||
      emotion_management === undefined || respect_peers === undefined) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  const stmt = db.prepare(`
    INSERT INTO observations (date, time, location, staff_email, concentration, respect_consigne, emotion_management, respect_peers, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    String(date),
    String(time),
    String(location),
    String(staff_email || ''),
    concentration === 1 ? 1 : 0,
    respect_consigne === 1 ? 1 : 0,
    emotion_management === 1 ? 1 : 0,
    respect_peers === 1 ? 1 : 0,
    notes ? String(notes) : null
  );
  const id = result.lastInsertRowid;
  const row = db.prepare('SELECT * FROM observations WHERE id = ?').get(id);
  sendObservationEmail(row).catch(() => {});
  res.status(201).json({ id, ...row });
});

// API: Sync observations submitted offline (batch)
app.post('/api/sync', (req, res) => {
  const { observations } = req.body || {};
  if (!Array.isArray(observations) || observations.length === 0) {
    return res.status(400).json({ error: 'observations array required' });
  }
  const ids = [];
  for (const obs of observations) {
    const { date, time, location, staff_email, concentration, respect_consigne, emotion_management, respect_peers, notes } = obs;
    const stmt = db.prepare(`
      INSERT INTO observations (date, time, location, staff_email, concentration, respect_consigne, emotion_management, respect_peers, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      String(date), String(time), String(location), String(staff_email || ''),
      concentration === 1 ? 1 : 0, respect_consigne === 1 ? 1 : 0,
      emotion_management === 1 ? 1 : 0, respect_peers === 1 ? 1 : 0,
      notes ? String(notes) : null
    );
    const id = result.lastInsertRowid;
    const row = db.prepare('SELECT * FROM observations WHERE id = ?').get(id);
    sendObservationEmail(row).catch(() => {});
    ids.push(id);
  }
  res.json({ synced: ids.length, ids });
});

// SPA fallback
if (serveClient) {
  app.get('*', (_, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
