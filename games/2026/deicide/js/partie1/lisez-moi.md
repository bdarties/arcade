# Partie 1 : le code expliqué simplement

La partie 1 est le jeu complet jusqu'à la fin du premier boss (le Dieu de la Lumière) : menu, niveau 1, ennemis, lumière, boss, 1 contre 1, pause, panthéon, crédits. La partie 2 (`js/partie2`) ajoute la suite et se branche sur la partie 1 sans la modifier.

## L'idée du jeu en une phrase
Un robot monte une tour dans l'ombre. Seules les zones de lumière éclairent, mais la lumière **brûle** si on y reste. En haut, un boss. Le score est le **temps net** (chrono moins les points gagnés) : plus petit = meilleur.

## Le principe de Phaser à retenir (la base de tout)
- Un jeu Phaser est une suite de **scènes** (menu, niveau, pause...). Chaque scène a `preload()` (charger les fichiers), `create()` (construire l'écran, une fois) et `update()` (appelée à chaque image, 30 fois par seconde ici).
- `scene.start("x")` change d'écran ; `scene.launch("pause")` pose une scène PAR-DESSUS une autre ; `scene.pause()` fige celle du dessous.
- Les cartes sont dessinées dans **Tiled** (`assets/maps/*.json`) : des calques de tuiles (le décor, le sol) et des calques d'objets (les points de départ, les ennemis, les lanternes).

## Le trajet d'une partie
`index.js` (racine) → `menu` → `niveau1` → combat du boss → `pantheon` (le choix) → suite (partie 2) → `credits` → `classement` (le panthéon) → `menu`

## Les dossiers

### `scenes/` : les écrans
| Fichier | Rôle |
|---|---|
| `menu.js` | l'accueil, charge tout le jeu pendant la barre de chargement |
| `niveau.js` | **la classe de base de tous les niveaux** : carte, robot, ennemis, lumière, HUD, dégâts, mort. À lire en premier |
| `niveau1.js` | le niveau 1 : uniquement ce qui change par rapport à `niveau.js` (sa « config ») |
| `versus.js` | le 1 contre 1 (2 robots, 3 manches) |
| `pause.js` | le menu pause (réglages, crédits), posé par-dessus le niveau |
| `pantheon.js` | le choix après le premier boss |
| `credits.js` | les crédits défilants |
| `classement.js` | l'écran de victoire, la saisie du nom et le top 10 de la borne (API) ; contient aussi la police pixel |

### `personnage/` : le robot et son interface
| Fichier | Rôle |
|---|---|
| `personnage.js` | tout le robot : marche, saut, saut de mur, dash, tir en 8 directions, visée automatique |
| `boule.js` | le robot se met en boule (invulnérable) quand il reste immobile |
| `hud.js`, `barre_de_vie.js` | la barre de vie, la jauge de dash, le score et le chrono |

### `ennemis/`
| Fichier | Rôle |
|---|---|
| `ennemis.js` | l'archer, le mage et l'orc (ils ne voient le robot qu'à 120 px, ou 400 px dans la lumière) |
| `lanterne_vivante.js` | les lanternes ailées : toucher = -1 PV ; les abattre donne un boost |
| `boss.js` | **le moteur de boss** : une table de profils (PV, phases, attaques) et une table d'attaques. Le boss final de la partie 2 s'y branche |

### `mecanismes/` : les règles du monde
| Fichier | Rôle |
|---|---|
| `lumiere.js` | le cœur du thème : le voile d'ombre, les halos, les lanternes, la brûlure |
| `salles.js`, `arene.js` | les salles de combat fermées et l'arène du boss (la caméra se fige) |
| `bonus.js`, `boost.js` | les PV lâchés par les ennemis ; le boost (vitesse, rafale) |

### `systemes/` : les outils
| Fichier | Rôle |
|---|---|
| `chargement.js` | charge images, sons et cartes ; lit les points posés dans Tiled |
| `sons.js`, `reglages.js` | musiques et bruitages ; les réglages du joueur (gardés dans le navigateur) |
| `effets.js` | tremblements, flashs, éclats |
| `points.js` | les points, le temps net et la fin de partie |
| `optimisation.js` | ce qui garde le jeu fluide sur le Raspberry Pi |
| `raccourcis.js` | le reset de la borne (C + F) et les touches de test |
| `guide.js` | le texte d'explication au début de la partie |

## Par où commencer à lire (dans cet ordre)
1. `index.js` (racine) : la configuration de Phaser et la liste des scènes.
2. `scenes/niveau.js` : comment un niveau est construit (les commentaires du haut expliquent la « config »).
3. `personnage/personnage.js` : le robot (l'en-tête explique tout).
4. `mecanismes/lumiere.js` : la lumière.
5. `ennemis/boss.js` : le moteur de boss.
6. `devlog.md` : **le pourquoi des choix** et des bugs corrigés. C'est ce qu'on te demandera en soutenance.

## Questions probables en soutenance (avec où trouver la réponse)
- *Pourquoi un temps net ?* → `systemes/points.js` : la vitesse est le classement, les points retirent du temps.
- *Comment marche la lumière ?* → `mecanismes/lumiere.js` : un voile noir dans lequel on « perce » des halos.
- *Comment le jeu reste fluide sur le Pi ?* → `systemes/optimisation.js` et le haut de `index.js` (30 images/s, décor figé, ennemis lointains endormis).
- *Pourquoi deux dossiers partie1 / partie2 ?* → `boss.js` est un moteur à tables ; la partie 2 y ajoute ses boss et ses attaques sans le modifier.
- *Comment les cartes sont-elles faites ?* → Tiled, fichiers JSON dans `assets/maps/` (voir `lisez-moi.md` de ce dossier).
