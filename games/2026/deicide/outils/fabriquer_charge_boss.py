#!/usr/bin/env python3
"""Fabrique le bruit de préparation d'attaque du boss (assets/sons/charge_boss.mp3) : un laser qui monte puis « zappe », par synthèse.

Choix pour qu'il soit grave sans être désagréable :
  - des ondes douces (sinus + triangle), pas de dents de scie ni de grosse distorsion : pas de grain agressif ;
  - la hauteur monte de ré3 (147 Hz) à ré4 (294 Hz) en 0,6 s (la charge), puis redescend vite jusqu'à la2 (110 Hz) en 0,2 s (le « zap ») : tout reste dans la gamme de ré ;
  - un très léger vibrato, une attaque douce (pas de clic) et deux petits échos qui arrondissent le son ;
  - un filtre qui coupe tout au-dessus de 2 200 Hz : rien d'aigu ni de strident.
Utilisation :  python3 outils/fabriquer_charge_boss.py   (il faut numpy et ffmpeg)
"""
import os
import subprocess
import wave

import numpy as np

SR = 44100
DUREE = 1.0  # s, échos compris
SORTIE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "sons", "charge_boss.mp3")

t = np.arange(int(SR * DUREE)) / SR
CHARGE, ZAP = 0.60, 0.20  # s : la montée, puis la descente rapide

# la fréquence à chaque instant : montée en courbe douce, puis chute
f = np.where(t < CHARGE,
             146.83 * 2 ** (t / CHARGE),                                  # ré3 -> ré4 (une octave)
             np.where(t < CHARGE + ZAP, 293.66 * (110.0 / 293.66) ** ((t - CHARGE) / ZAP), 110.0))  # ré4 -> la2
f = f * (1 + 0.006 * np.sin(2 * np.pi * 6.5 * t))                        # un léger vibrato
phase = 2 * np.pi * np.cumsum(f) / SR                                    # on intègre la fréquence pour avoir la phase (sinon le glissando « craque »)
x = np.sin(phase) + 0.35 * np.sin(2 * phase) + 0.25 * (2 / np.pi) * np.arcsin(np.sin(phase * 1.003))  # sinus + un peu d'harmonique + triangle

enveloppe = np.minimum(1, t / 0.06) * np.where(t < CHARGE, 0.45 + 0.55 * (t / CHARGE), np.where(t < CHARGE + ZAP, 1.0, 0.0))  # attaque douce, plus fort en montant
enveloppe *= np.where(t >= CHARGE, np.exp(-(t - CHARGE) / 0.22), 1.0)    # le zap s'éteint doucement
x = np.tanh(1.3 * x * enveloppe)                                         # un soupçon de saturation seulement

# deux petits échos : ils arrondissent le son sans le brouiller
sortie = x.copy()
for retard, gain in ((0.09, 0.28), (0.18, 0.14)):
    n = int(SR * retard)
    sortie[n:] += gain * x[:-n]
sortie /= np.max(np.abs(sortie))
sortie *= 0.85
sortie[-400:] *= np.linspace(1, 0, 400)

wav = SORTIE.replace(".mp3", ".tmp.wav")
with wave.open(wav, "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((sortie * 32767).astype("<i2").tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-af", "lowpass=f=2200,alimiter=limit=0.9", "-c:a", "libmp3lame", "-b:a", "128k", SORTIE], check=True)
os.remove(wav)
print("écrit :", os.path.abspath(SORTIE))
