#!/bin/bash
# Configure Chromium kiosk mode for Suivi Auguste dashboard on Pi
set -e
USER_HOME="${HOME}"
AUTOSTART_DIR="${USER_HOME}/.config/autostart"
mkdir -p "$AUTOSTART_DIR"

# Disable screen blanking where possible
mkdir -p "${USER_HOME}/.config/labwc" 2>/dev/null || true

cat > "${AUTOSTART_DIR}/suivi-ecran.desktop" << EOF
[Desktop Entry]
Type=Application
Name=Suivi Auguste Ecran
Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --check-for-update-interval=31536000 --autoplay-policy=no-user-gesture-required http://127.0.0.1:3000/ecran
X-GNOME-Autostart-enabled=true
EOF

# Also try chromium package name variant
if ! command -v chromium-browser >/dev/null 2>&1 && command -v chromium >/dev/null 2>&1; then
  sed -i 's/chromium-browser/chromium/g' "${AUTOSTART_DIR}/suivi-ecran.desktop"
fi

echo "Kiosk autostart written to ${AUTOSTART_DIR}/suivi-ecran.desktop"
echo "Open now: chromium in kiosk (if available)"
BROWSER=$(command -v chromium-browser || command -v chromium || true)
if [ -n "$BROWSER" ]; then
  # Kill existing chromium then start kiosk
  pkill -f 'chromium.*ecran' 2>/dev/null || true
  nohup $BROWSER --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --check-for-update-interval=31536000 http://127.0.0.1:3000/ecran >/tmp/suivi-kiosk.log 2>&1 &
  echo "Started kiosk PID $!"
else
  echo "Chromium not installed yet"
fi
