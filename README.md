# Suivi Auguste — PWA de suivi comportemental

Application mobile-first pour le suivi comportemental d’Auguste : saisie d’observations par le personnel (bus, cantine, garderie, récréation, classe) et vue parent avec timeline et statistiques.

## Stack

- **Frontend** : React 18, Vite, TailwindCSS, Chart.js, React Router
- **Backend** : Node.js, Express
- **Base de données** : SQLite (fichier local)
- **E-mails** : Nodemailer
- **PWA** : manifest + service worker (vite-plugin-pwa), installation sur écran d’accueil et envoi hors-ligne avec synchronisation

## Prérequis

- Node.js 18+

## Installation et lancement en local

```bash
npm install
npm run build
npm start
```

- L’API et le frontend buildé sont servis sur **http://localhost:3000** (ou le port défini par `PORT`).
- Par défaut, le mot de passe « Vue Parent » est : **auguste** (modifiable via `PARENT_PASSWORD`).
- En local, les e-mails ne partent pas sauf si vous configurez SMTP (voir ci-dessous).

### Développement (frontend + API séparés)

- Terminal 1 (API) : `cd server && node index.js`
- Terminal 2 (client) : `cd client && npm run dev`  
  → Frontend en hot-reload sur le port Vite (ex. 5173), avec proxy vers `/api` sur le serveur.

## Variables d’environnement

Créer un fichier `server/.env` (optionnel en local) :

```env
# Port (Railway définit PORT automatiquement)
PORT=3000

# Mot de passe Vue Parent
PARENT_PASSWORD=auguste

# E-mail des parents (pour les notifications)
PARENT_EMAIL=parent@example.com

# SMTP (ex. Mailtrap, SendGrid, Gmail…)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=suivi-auguste@example.com
```

Sans `PARENT_EMAIL` ou avec une valeur factice, l’envoi d’e-mail est désactivé (un warning est loggé).

## Déploiement sur Railway

1. Créer un nouveau projet sur [Railway](https://railway.app).
2. Connecter le dépôt Git du projet.
3. Configurer le **Build** :
   - **Build Command** : `npm run build`
   - **Output Directory** : laisser vide (le build produit `client/dist` ; le serveur sert depuis ce dossier).
4. Configurer le **Start** :
   - **Start Command** : `cd server && node index.js`
   - Railway définit automatiquement `PORT` et souvent `NODE_ENV=production`.
5. Ajouter les variables d’environnement dans Railway (Settings → Variables) :
   - `PARENT_PASSWORD` : mot de passe Vue Parent
   - `PARENT_EMAIL` : adresse de réception des alertes
   - `SMTP_*` : selon votre fournisseur SMTP (ex. SendGrid, Mailgun, Gmail).

Le serveur écoute sur `process.env.PORT` et sert le frontend buildé + l’API.

## Structure du projet

```
SuiviAuguste/
├── client/                 # React + Vite + Tailwind + PWA
│   ├── public/
│   ├── src/
│   │   ├── api.js          # Appels API + file d’attente hors-ligne
│   │   ├── pages/          # Home, Observation, ParentGate, ParentView
│   │   └── ...
│   └── vite.config.js     # Plugin PWA
├── server/
│   ├── db.js               # SQLite + schéma + mot de passe parent
│   ├── mailer.js           # Nodemailer
│   └── index.js            # Express, API, envoi e-mail, service du build client
├── package.json            # Scripts racine (install, build, start)
└── README.md
```

## Base de données (SQLite)

- Fichier : `server/observations.db` (ou chemin défini par `SQLITE_PATH`).
- Table **observations** : id, date, time, location, staff_email, concentration, respect_consigne, emotion_management, respect_peers, notes, created_at.
- Table **parent_password** : mot de passe hashé (par défaut en clair pour simplicité).

## PWA

- **manifest** et **service worker** générés par `vite-plugin-pwa`.
- L’app est installable sur l’écran d’accueil (mobile ou bureau).
- En **hors-ligne** : les observations sont stockées en local et synchronisées au prochain chargement quand la connexion revient.

## Sécurité

- La Vue Parent est protégée par un mot de passe (configurable via `PARENT_PASSWORD`).
- En production, prévoir HTTPS (Railway le fournit) et un mot de passe fort.
