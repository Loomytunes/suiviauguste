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

// API: Stats (seuls les axes renseignés sont comptés, pas les NULL)
app.get('/api/stats', (req, res) => {
  const byLocation = db.prepare(
    'SELECT location, COUNT(*) as count FROM observations GROUP BY location'
  ).all();
  const axes = ['concentration', 'respect_consigne', 'emotion_management', 'respect_peers'];
  const perAxis = axes.map(axis => {
    const pos = db.prepare(`SELECT COUNT(*) as n FROM observations WHERE ${axis} = 1`).get().n;
    const neg = db.prepare(`SELECT COUNT(*) as n FROM observations WHERE ${axis} = 0`).get().n;
    return { axis, positive: pos, negative: neg };
  });
  const byDateRows = db.prepare(
    `SELECT date,
      SUM(CASE WHEN concentration = 1 THEN 1 ELSE 0 END) as c_pos,
      SUM(CASE WHEN concentration = 0 THEN 1 ELSE 0 END) as c_neg,
      SUM(CASE WHEN concentration IS NOT NULL THEN 1 ELSE 0 END) as c_cnt,
      SUM(CASE WHEN respect_consigne = 1 THEN 1 ELSE 0 END) as r_pos,
      SUM(CASE WHEN respect_consigne = 0 THEN 1 ELSE 0 END) as r_neg,
      SUM(CASE WHEN respect_consigne IS NOT NULL THEN 1 ELSE 0 END) as r_cnt,
      SUM(CASE WHEN emotion_management = 1 THEN 1 ELSE 0 END) as e_pos,
      SUM(CASE WHEN emotion_management = 0 THEN 1 ELSE 0 END) as e_neg,
      SUM(CASE WHEN emotion_management IS NOT NULL THEN 1 ELSE 0 END) as e_cnt,
      SUM(CASE WHEN respect_peers = 1 THEN 1 ELSE 0 END) as p_pos,
      SUM(CASE WHEN respect_peers = 0 THEN 1 ELSE 0 END) as p_neg,
      SUM(CASE WHEN respect_peers IS NOT NULL THEN 1 ELSE 0 END) as p_cnt
    FROM observations GROUP BY date ORDER BY date`
  ).all();
  const byDate = byDateRows.map((d) => {
    const totalPos = (d.c_pos || 0) + (d.r_pos || 0) + (d.e_pos || 0) + (d.p_pos || 0);
    const totalCnt = (d.c_cnt || 0) + (d.r_cnt || 0) + (d.e_cnt || 0) + (d.p_cnt || 0);
    return {
      date: d.date,
      score: totalCnt ? Math.round((totalPos / totalCnt) * 100) : null,
      evaluations: totalCnt
    };
  });
  const allRows = db.prepare('SELECT concentration, respect_consigne, emotion_management, respect_peers FROM observations').all();
  let totalPos = 0, totalEval = 0;
  allRows.forEach((row) => {
    axes.forEach((axis) => {
      if (row[axis] !== null && row[axis] !== undefined) {
        totalEval += 1;
        if (row[axis] === 1) totalPos += 1;
      }
    });
  });
  const globalScore = totalEval ? Math.round((totalPos / totalEval) * 100) : null;
  res.json({ byLocation, perAxis, byDate, totalObservations: allRows.length, globalScore, totalEvaluations: totalEval });
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
  if (!date || !time || !location) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  const hasAtLeastOneAxis = [concentration, respect_consigne, emotion_management, respect_peers].some(
    (v) => v === 0 || v === 1
  );
  if (!hasAtLeastOneAxis) {
    return res.status(400).json({ error: 'Au moins un axe doit être renseigné' });
  }
  const stmt = db.prepare(`
    INSERT INTO observations (date, time, location, staff_email, concentration, respect_consigne, emotion_management, respect_peers, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const toVal = (v) => (v === 1 ? 1 : v === 0 ? 0 : null);
  const result = stmt.run(
    String(date),
    String(time),
    String(location),
    String(staff_email || ''),
    toVal(concentration),
    toVal(respect_consigne),
    toVal(emotion_management),
    toVal(respect_peers),
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
    const toVal = (v) => (v === 1 ? 1 : v === 0 ? 0 : null);
    const result = stmt.run(
      String(date), String(time), String(location), String(staff_email || ''),
      toVal(concentration), toVal(respect_consigne), toVal(emotion_management), toVal(respect_peers),
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
