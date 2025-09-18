#!/usr/bin/env python3
from gpiozero import Button
from evdev import UInput, ecodes as e
from signal import pause
import time
import sys
import io

# =============================
# MAPPING GPIO → Touches clavier
# =============================
MAP = {
    # --- Joueur 1 ---
    4:  e.KEY_UP,
    17: e.KEY_DOWN,
    27: e.KEY_LEFT,
    22: e.KEY_RIGHT,

    18: e.KEY_I,          # BTN1_J1
    15: e.KEY_O,          # BTN2_J1
    14: e.KEY_P,          # BTN3_J1
    25: e.KEY_K,          # BTN4_J1
    24: e.KEY_L,          # BTN5_J1
    23: e.KEY_M,          # BTN6_J1

    # --- Joueur 2 ---
    11: e.KEY_Z,
    5:  e.KEY_S,
    6: e.KEY_Q,
    13: e.KEY_D,
    12: e.KEY_R,          # BTN1_J2
    7:  e.KEY_T,          # BTN2_J2
    8:  e.KEY_Y,          # BTN3_J2
    21: e.KEY_F,          # BTN4_J2
    20: e.KEY_G,          # BTN5_J2
    16: e.KEY_H,          # BTN6_J2
}

# Anti-rebond (s)
DEBOUNCE = 0.01

# Création du périphérique virtuel "clavier"
ui = UInput(name="GPIO-Arcade", version=0x3, bustype=0x3)

buttons = {}
last_change = {pin: 0.0 for pin in MAP}

def on_press(pin, keycode):
    now = time.time()
    if now - last_change[pin] < DEBOUNCE:
        return
    last_change[pin] = now
    ui.write(e.EV_KEY, keycode, 1)  # touche enfoncée
    ui.syn()

def on_release(pin, keycode):
    now = time.time()
    if now - last_change[pin] < DEBOUNCE:
        return
    last_change[pin] = now
    ui.write(e.EV_KEY, keycode, 0)  # touche relâchée
    ui.syn()

# Associer chaque GPIO
for pin, keycode in MAP.items():
    b = Button(pin, pull_up=True, bounce_time=DEBOUNCE)
    b.when_pressed  = lambda p=pin, k=keycode: on_press(p, k)
    b.when_released = lambda p=pin, k=keycode: on_release(p, k)
    buttons[pin] = b

print("GPIO-Clavier actif. Peripherique virtuel: /dev/uinput (nom: GPIO-Arcade)")
pause()
