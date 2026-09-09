#!/bin/bash
# Lance Chromium en mode kiosque sur l'interface de la borne d'arcade.
# Appele par le service systemd chromium_kiosk.service.

export DISPLAY=:0
export XDG_RUNTIME_DIR=/run/user/$(id -u)

URL="http://127.0.0.1:5000"

# Attend que le serveur Flask reponde avant d'ouvrir le navigateur :
# sans cette boucle, le kiosque peut afficher une page d'erreur au demarrage.
for _ in $(seq 1 30); do
	if curl -s -o /dev/null "$URL"; then
		break
	fi
	sleep 1
done

exec chromium-browser \
	--start-fullscreen \
	--kiosk "$URL" \
	--noerrdialogs \
	--disable-infobars \
	--disable-session-crashed-bubble
