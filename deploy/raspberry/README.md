# Déployer Suivi Auguste sur Raspberry Pi

Guide pour héberger l’app chez vous, gratuitement, avec une URL HTTPS via Cloudflare Tunnel.

## Prérequis

- Raspberry Pi (3, 4, 5 ou Zero 2 W) avec Raspberry Pi OS
- Connexion Internet
- Compte gratuit [Cloudflare](https://dash.cloudflare.com) (recommandé pour HTTPS)
- Accès SSH ou clavier/écran sur le Pi

---

## Étape 1 — Préparer le Pi

Connectez-vous au Pi (SSH depuis un PC) :

```bash
ssh pi@IP_DU_PI
```

(Remplacez `pi` par votre utilisateur si besoin, et `IP_DU_PI` par l’IP locale, ex. `192.168.1.42`.)

---

## Étape 2 — Installer l’application

```bash
# Télécharger le script d’installation
curl -fsSL https://raw.githubusercontent.com/Loomytunes/suiviauguste/main/deploy/raspberry/install.sh -o install.sh
chmod +x install.sh
./install.sh
```

Ou manuellement :

```bash
git clone https://github.com/Loomytunes/suiviauguste.git ~/suiviauguste
cd ~/suiviauguste
# Puis lancer le script local :
bash deploy/raspberry/install.sh
```

À la fin, l’app tourne en local :

```text
http://IP_DU_PI:3000
```

Vérifier :

```bash
sudo systemctl status suivi-auguste
```

Changer le mot de passe Vue Parent :

```bash
nano ~/suiviauguste/server/.env
# PARENT_PASSWORD=votre_mot_de_passe
sudo systemctl restart suivi-auguste
```

---

## Étape 3 — Cloudflare Tunnel (HTTPS + accès Internet)

Sans ouvrir de ports sur la box.

### 3.1 Installer `cloudflared`

Sur le Pi (architecture ARM) :

```bash
# Exemple pour Raspberry Pi OS 64-bit (arm64)
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb
```

Si le Pi est en **32-bit (armhf)** :

```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm.deb
sudo dpkg -i cloudflared.deb
```

### 3.2 Se connecter à Cloudflare

```bash
cloudflared tunnel login
```

Une URL s’affiche : ouvrez-la sur un PC/téléphone, choisissez un domaine Cloudflare (ou créez un compte gratuit).

### 3.3 Créer le tunnel

```bash
cloudflared tunnel create suivi-auguste
cloudflared tunnel route dns suivi-auguste suivi.VOTRE_DOMAINE.fr
```

(Remplacez `suivi.VOTRE_DOMAINE.fr` par un sous-domaine que vous contrôlez chez Cloudflare.)

### 3.4 Configurer le tunnel

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Contenu (adaptez le `credentials-file` avec l’UUID affiché à la création du tunnel) :

```yaml
tunnel: suivi-auguste
credentials-file: /home/pi/.cloudflared/UUID.json

ingress:
  - hostname: suivi.VOTRE_DOMAINE.fr
    service: http://localhost:3000
  - service: http_status:404
```

### 3.5 Lancer le tunnel au démarrage

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

Ouvrez ensuite : **https://suivi.VOTRE_DOMAINE.fr**

---

## Variante sans domaine : tunnel rapide (test)

Pour un essai temporaire (URL aléatoire Cloudflare) :

```bash
cloudflared tunnel --url http://localhost:3000
```

L’URL affichée (ex. `https://xxxx.trycloudflare.com`) fonctionne tant que la commande tourne.  
Pour un usage quotidien, préférez le tunnel nommé + domaine (étape 3).

---

## Commandes utiles

```bash
# Statut de l’app
sudo systemctl status suivi-auguste
sudo systemctl restart suivi-auguste
sudo journalctl -u suivi-auguste -f

# Mettre à jour l’app
cd ~/suiviauguste
git pull
npm install
cd client && npm install && cd ../server && npm install && cd ..
npm run build
sudo systemctl restart suivi-auguste

# Sauvegarder la base
cp ~/suiviauguste/server/observations.db ~/backup-observations-$(date +%F).db
```

---

## Accès uniquement sur le Wi‑Fi de la maison

Si vous n’avez pas besoin d’Internet extérieur :

1. Installez seulement l’app (étapes 1–2)
2. Connectez les téléphones au même Wi‑Fi
3. Ouvrez `http://IP_DU_PI:3000`

Pas de Cloudflare nécessaire. (La PWA « installer » fonctionne mieux en HTTPS, mais l’usage navigateur marche en HTTP en local.)
