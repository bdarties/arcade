# generer_sons_robot.py : fabrique les deux bruitages du robot (touché, mort) à partir de rien, avec des formules de synthèse sonore.
# Les sons sont créés ici, donc sans aucun droit d'auteur à respecter. Lancer : python3 outils/generer_sons_robot.py
# Il faut numpy et ffmpeg ; les fichiers sont écrits dans assets/sons/ (joueur_touche.mp3 et joueur_mort.mp3).
import subprocess
import wave
from pathlib import Path

import numpy as np

TAUX = 44100  # échantillons par seconde (qualité CD)
DOSSIER = Path(__file__).resolve().parent.parent / "assets" / "sons"  # le dossier des sons du jeu
hasard = np.random.default_rng(7)  # même bruit à chaque lancement (le résultat est reproductible)


def temps(duree):  # la liste des instants (en secondes) d'un son de cette durée
    return np.arange(int(TAUX * duree)) / TAUX


def bruit(duree):  # du souffle (valeurs au hasard entre -1 et 1)
    return hasard.uniform(-1, 1, int(TAUX * duree))


def passe_bas(son, coef):  # adoucit un son : chaque valeur se rapproche de la précédente (coef proche de 1 = très doux)
    sortie = np.zeros_like(son)
    for i in range(1, len(son)):
        sortie[i] = coef * sortie[i - 1] + (1 - coef) * son[i]
    return sortie


def saturer(son, force):  # écrase les pointes : donne un son dur, électronique, un peu métallique
    return np.tanh(son * force)


def normaliser(son, pic):  # règle le volume maximal (pic entre 0 et 1)
    return son / np.max(np.abs(son)) * pic


def clang(duree, base, vitesse):  # un coup sur du métal : plusieurs notes qui ne sonnent pas ensemble, chacune s'éteint vite
    t = temps(duree)
    son = np.zeros_like(t)
    for rapport, poids in [(1.0, 1.0), (2.76, 0.8), (5.4, 0.6), (8.93, 0.4), (13.3, 0.25)]:  # des rapports « faux » : c'est ce qui sonne métallique
        son += poids * np.sin(2 * np.pi * base * rapport * t) * np.exp(-t * vitesse * (0.6 + rapport / 4))
    return son


def touche():  # une plaque de métal qui prend une balle : « clac » sec, claquement de la tôle, puis la plaque vibre et sonne
    duree = 0.6
    t = temps(duree)
    impact = passe_bas(bruit(duree), 0.15) * np.exp(-t * 120)  # le choc de la balle : un claquement très bref
    sourd = np.sin(2 * np.pi * np.cumsum(170 * np.exp(-t * 30) + 70) / TAUX) * np.exp(-t * 22)  # le « pof » grave de la plaque qui encaisse
    plaque = clang(duree, 780, 9) * 0.8  # la plaque qui sonne après le choc (notes métalliques qui ne s'accordent pas)
    tole = clang(duree, 1900, 16) * 0.35  # la vibration aiguë de la tôle, plus courte
    ricochet = np.sin(2 * np.pi * np.cumsum(3800 * np.exp(-t * 14) + 1100) / TAUX) * np.exp(-t * 15) * 0.25  # le petit sifflement de la balle qui ricoche
    son = saturer(impact * 1.6 + sourd * 1.1 + plaque + tole + ricochet, 1.8)
    son *= np.minimum(1, (duree - t) / 0.08)  # fondu de fin pour éviter le clic
    return normaliser(son, 0.7)  # volume maximal : le son doit s'entendre dans le jeu


def mort():  # le robot se désactive : grosse décharge, puis il s'éteint en descendant dans le grave, saute, crépite, puis plus rien
    duree = 2.0
    t = temps(duree)
    # la hauteur du moteur chute de plus en plus vite (comme une machine qui perd son courant)
    frequence = 25 + 600 * np.exp(-t * 2.2)
    frequence *= 1 + 0.07 * np.sin(2 * np.pi * 13 * t) * (t / duree)  # le son tremble de plus en plus
    phase = 2 * np.pi * np.cumsum(frequence) / TAUX
    moteur = np.sign(np.sin(phase)) * 0.55 + np.sin(phase * 2) * 0.3 + np.sin(phase * 0.5) * 0.4  # onde carrée + octaves : gros buzzer grave
    moteur = passe_bas(moteur, 0.5)
    # le courant coupe par à-coups : le volume s'interrompt de plus en plus souvent
    rythme = t / duree
    coupure = (np.sin(2 * np.pi * (5 + 20 * rythme ** 2) * t) > -0.2 + 1.1 * rythme ** 1.5).astype(float)
    coupure = passe_bas(coupure, 0.9)
    enveloppe = np.exp(-t * 1.3) * coupure
    # la grosse décharge du début : un coup de court-circuit
    decharge = passe_bas(bruit(duree), 0.2) * np.exp(-t * 11) * 1.4
    decharge += np.sin(2 * np.pi * np.cumsum(1500 * np.exp(-t * 9) + 80) / TAUX) * np.exp(-t * 6) * 0.9  # le « zzzap » qui plonge
    coup = np.sin(2 * np.pi * np.cumsum(110 * np.exp(-t * 14) + 38) / TAUX) * np.exp(-t * 7) * 1.4  # le « boum » grave de l'arrêt brutal
    # des étincelles qui crépitent, de plus en plus rares
    etincelles = np.zeros_like(t)
    for instant in np.cumsum(hasard.exponential(0.06 + 0.25 * np.linspace(0, 1, 60))):
        if instant < duree - 0.25:
            debut = int(instant * TAUX)
            claque = bruit(0.05) * np.exp(-temps(0.05) * 140)
            etincelles[debut:debut + len(claque)] += claque * 0.7 * np.exp(-instant * 0.9)
    # quelques morceaux de ferraille qui tombent
    for instant, base in [(0.3, 360), (0.7, 270), (1.2, 200)]:
        debut = int(instant * TAUX)
        morceau = clang(0.4, base, 20) * 0.55
        etincelles[debut:debut + len(morceau)] += morceau
    # un dernier « clac » sec : le relais qui s'éteint
    debut = int(1.7 * TAUX)
    clac = bruit(0.04) * np.exp(-temps(0.04) * 160)
    etincelles[debut:debut + len(clac)] += clac * 0.9
    son = saturer((moteur * enveloppe + decharge + coup) * 0.9 + etincelles, 1.7)
    son *= np.minimum(1, (duree - t) / 0.1)  # fondu de fin
    return normaliser(son, 0.7)  # volume maximal : le son doit s'entendre dans le jeu


def ecrire(nom, son):  # écrit le son en wav puis le convertit en mp3 avec ffmpeg, au même format que les autres sons du jeu
    wav = DOSSIER / (nom + ".wav")
    with wave.open(str(wav), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(TAUX)
        f.writeframes((son * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-qscale:a", "4", str(DOSSIER / (nom + ".mp3"))], check=True)
    wav.unlink()  # on garde seulement le mp3


if __name__ == "__main__":
    ecrire("joueur_touche", touche())
    ecrire("joueur_mort", mort())
    print("joueur_touche.mp3 et joueur_mort.mp3 écrits dans", DOSSIER)
