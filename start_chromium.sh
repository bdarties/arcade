#!/bin/bash
# Lance Chromium en mode kiosque sur l'interface de la borne d'arcade.
# Appele par le service systemd chromium_kiosk.service.

export XDG_RUNTIME_DIR=/run/user/$(id -u)
export WAYLAND_DISPLAY=wayland-0
# La session de la borne est un compositeur Wayland (labwc). Passer par
# Xwayland (DISPLAY=:0) faisait scintiller l'ecran, la fenetre X11 et le
# bureau Wayland se disputant le premier plan.
unset DISPLAY

URL="http://127.0.0.1:5000"

# Attend que le compositeur Wayland ait cree sa socket : le service peut
# demarrer avant que la session graphique soit prete.
for _ in $(seq 1 30); do
	if [ -S "$XDG_RUNTIME_DIR/$WAYLAND_DISPLAY" ]; then
		break
	fi
	sleep 1
done

# Attend que le serveur Flask reponde avant d'ouvrir le navigateur :
# sans cette boucle, le kiosque peut afficher une page d'erreur au demarrage.
for _ in $(seq 1 30); do
	if curl -s -o /dev/null "$URL"; then
		break
	fi
	sleep 1
done

# --password-store=basic : sans ce flag, Chromium reclame la creation d'un
# trousseau GNOME et la boite de dialogue vole le focus au kiosque.
exec chromium-browser \
	--ozone-platform=wayland \
	--kiosk "$URL" \
	--password-store=basic \
	--noerrdialogs \
	--disable-infobars \
	--disable-session-crashed-bubble \
	--no-first-run \
	--disable-features=Translate,MediaRouter \
	--check-for-update-interval=31536000
