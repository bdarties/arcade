#!/usr/bin/env python3
"""Fabrique le bruit de préparation d'attaque du boss (assets/sons/charge_boss.mp3), par synthèse : aucun fichier son externe.

Idée : la musique du boss est du metal en ré. Le bruit qui annonce une attaque doit donc être GRAVE et SATURÉ, pas un tintement aigu :
  - un accord de puissance en ré (ré, la, ré, ré aigu), chaque note jouée par trois oscillateurs en dents de scie légèrement désaccordés (épaisseur) ;
  - un bruit grave qui gonfle pendant la montée ;
  - une distorsion (tanh) pour le grain du metal ;
  - un coup de grave (55 Hz) quand l'attaque part.
Utilisation :  python3 outils/fabriquer_charge_boss.py   (il faut numpy et ffmpeg)
"""
import os
import subprocess
import wave

import numpy as np

SR = 44100
DUREE = 0.85  # s : un peu plus long que la plus courte préparation d'attaque du boss
SORTIE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "sons", "charge_boss.mp3")

t = np.arange(int(SR * DUREE)) / SR
rng = np.random.default_rng(7)


def dent_de_scie(f, phase=0.0):
    return 2 * ((f * t + phase) % 1.0) - 1


x = np.zeros_like(t)
for f, gain in [(36.71, 0.9), (73.42, 1.0), (110.0, 0.8), (146.83, 0.5)]:  # ré1, ré2, la2, ré3
    for desaccord in (-0.35, 0.0, 0.35):  # en pourcentage de la fréquence
        x += gain * dent_de_scie(f * (1 + desaccord / 100.0), rng.random()) / 3

bruit = np.convolve(rng.standard_normal(len(t)), np.ones(40) / 40, "same")  # un bruit grave
x += bruit * np.linspace(0, 1, len(t)) ** 2 * 0.8  # qui gonfle

enveloppe = np.minimum(1, t / 0.05) * np.where(t < 0.62, (t / 0.62) ** 1.5 * 0.85 + 0.15, np.exp(-(t - 0.62) / 0.07))  # monte jusqu'à 0,62 s puis coupe net
x = np.tanh(3.2 * x * enveloppe)  # la distorsion
coup = np.sin(2 * np.pi * 55 * t) * np.exp(-np.maximum(0, t - 0.60) / 0.09) * (t >= 0.60) * 1.2  # le coup de grave
x = (x * 0.8 + coup)
x = x / np.max(np.abs(x)) * 0.9
x[-200:] *= np.linspace(1, 0, 200)  # petit fondu final : pas de clic

wav = SORTIE.replace(".mp3", ".tmp.wav")
with wave.open(wav, "w") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes((x * 32767).astype("<i2").tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-af", "lowpass=f=1800,alimiter=limit=0.9", "-c:a", "libmp3lame", "-b:a", "128k", SORTIE], check=True)
os.remove(wav)
print("écrit :", os.path.abspath(SORTIE))
