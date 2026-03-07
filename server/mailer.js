import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

const parentEmail = process.env.PARENT_EMAIL || 'parent@example.com';

const locationLabels = {
  bus: 'Bus',
  cantine: 'Cantine',
  garderie: 'Garderie',
  recreation: 'Récréation',
  classe: 'Classe'
};

const axisLabels = {
  concentration: 'Concentration / Agitation',
  respect_consigne: 'Respect des consignes et de l\'adulte',
  emotion_management: 'Gestion des émotions',
  respect_peers: 'Respect de mes camarades'
};

function formatObservation(obs) {
  const loc = locationLabels[obs.location] || obs.location;
  const lines = [
    `Nouvelle observation pour Auguste`,
    ``,
    `Lieu : ${loc}`,
    `Date : ${obs.date} à ${obs.time}`,
    ``,
    `Axe 1 - Concentration / Agitation : ${obs.concentration === 1 ? 'Positif' : 'Difficulté'}`,
    `Axe 2 - Respect des consignes : ${obs.respect_consigne === 1 ? 'Positif' : 'Difficulté'}`,
    `Axe 3 - Gestion des émotions : ${obs.emotion_management === 1 ? 'Positif' : 'Difficulté'}`,
    `Axe 4 - Respect des camarades : ${obs.respect_peers === 1 ? 'Positif' : 'Difficulté'}`,
    ``,
    obs.notes ? `Note : ${obs.notes}` : ''
  ];
  return lines.filter(Boolean).join('\n');
}

export async function sendObservationEmail(observation) {
  const to = parentEmail;
  if (!to || to === 'parent@example.com') {
    console.warn('PARENT_EMAIL not set; email not sent.');
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'suivi-auguste@localhost',
      to,
      subject: `[Suivi Auguste] Nouvelle observation - ${observation.location} - ${observation.date}`,
      text: formatObservation(observation)
    });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}
