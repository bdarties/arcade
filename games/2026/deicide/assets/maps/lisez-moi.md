# Dessiner le niveau 2 dans Tiled

Le jeu lit `assets/maps/niveau2.json`. Pour voir comment une map est faite, ouvre `niveau2.json` (ou `niveau1.tmx`) dans Tiled.

## Étapes
1. Dans Tiled : **Fichier → Nouveau → Nouvelle carte** (orthogonale, tuiles de **32 × 32**), ou plus simple : copie `niveau1.tmx` et vide ses calques (il a déjà les bons tilesets).
2. Les deux tilesets sont `dawn_of_the_gods_ombre` (image `dawn_of_the_gods_ombre.png`) et `white` (`blanc.png`). Les tuiles solides sont celles qui ont la propriété `colision` = true dans le tileset (déjà réglé sur le tileset du niveau 1).
3. **Taille** : hauteur de 23 lignes ou plus (24 conseillé : 768 px, l'écran en fait 720). Largeur libre : environ 280 colonnes pour une course d'environ 2 min 30.
4. Exporte en **JSON** : *Fichier → Exporter sous…* → `assets/maps/niveau2.json` (garde aussi ton `.tmx`).

## Calques de tuiles (noms exacts, dans cet ordre)
- `Background and background` : le mur de fond (tuile de briques sombre, 1332 dans la map d'exemple)
- `Background` : le décor devant le mur de fond
- `Gameplay` : tout ce sur quoi on marche ou qui bloque

## Calques d'objets : des POINTS (outil « Insérer un point »)
| Calque | Combien | Ce que c'est |
|---|---|---|
| `depart` | 1 | où le robot apparaît (le point = ses pieds, pose-le sur le sol) |
| `fin` | 1 | à droite de ce point, le niveau se termine et l'arène du dernier combat commence |
| `faisceau` | 0 à N | un faisceau de lumière par point (seule la position x compte) |
| `orc`, `archer`, `mage` | 0 à N | un ennemi par point (le point = ses pieds, comme au niveau 1) |
| `lanterne` | 0 à N | une lanterne (elle éclaire, brûle si on reste dedans, et s'éteint d'un tir) |
| `lumière` | 0 à N | une zone de lumière qui brûle, sans lanterne |

Un calque peut être vide, mais garde son nom. Les ennemis fonctionnent comme au niveau 1 : ils ne voient le robot qu'à 120 px (400 px s'il est dans la lumière).

## Ce que tu dois respecter pour que le niveau se finisse
- **Le vide** : ne pose rien sous un trou. Tomber en bas de la map coûte 1 PV et remet le robot sur le dernier sol sûr.
- **Trous** : un saut sans dash franchit environ **8 tuiles**. Avec saut + dash, jusqu'à **12 tuiles** (au-delà : infranchissable). Le dash se lance vers le sommet du saut, 350 à 450 ms après le décollage.
- **Montée** : une plateforme peut être jusqu'à **3 tuiles** plus haute que celle d'où l'on saute (un saut monte d'environ 5,6 tuiles).
- **La poursuite** : le mur de lumière part 700 px derrière le départ et avance à 232 px/s ; le robot marche à 260 px/s. Plus ta map est longue, plus la fuite dure.
- **Pas de salle fermée** dans ce niveau : on ne peut pas s'arrêter pendant la fuite.

## Tester
- Lance le jeu et appuie sur **F9** : le niveau 2 démarre tout de suite (touche de test, à retirer avant la borne).
- **F8** téléporte le robot loin dans la map.
