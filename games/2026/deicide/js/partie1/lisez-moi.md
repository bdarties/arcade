# Partie 1 : le code expliqué simplement

> **À LIRE EN PREMIER : ce que nous présentons**
> **Nous ne présentons que la partie 1** (`js/partie1/`) : le jeu jusqu'à la fin du premier boss. C'est sur elle que nous avons concentré notre travail et notre compréhension du code : nous savons expliquer chacun de ses fichiers.
> **Nous ne souhaitons pas soumettre la partie 2 du code à l'évaluation** (`js/partie2/` : fuite du niveau 2, dernier combat, attaques supplémentaires). Elle est uniquement présente pour améliorer la rejouabilité du jeu sur la borne : un jeu plus difficile et plus de contenu, suite à la demande de Nicolas Maurin. Elle se branche sur la partie 1 sans la modifier, et le jeu fonctionne sans elle.
>
> **La partie 2 est indépendante : on peut la retirer complètement.** Pour cela : (1) supprimer le dossier `js/partie2/` ; (2) dans `index.js`, supprimer la ligne `import { installerPartie2, ... }`, l'appel `installerPartie2();`, l'appel `activerTestsPartie2(game);` et `...scenesPartie2` dans la liste des scènes. Rien d'autre à changer : la partie 1 n'importe jamais la partie 2. Le jeu s'arrête alors à la défaite du premier boss (le choix du panthéon ramène alors directement au menu, quelle que soit la réponse). Nous l'avons testé : jeu lancé sans le dossier `partie2`, boss battu, crédits atteints, aucune erreur.

La partie 1 est le jeu complet jusqu'à la fin du premier boss (le Dieu de la Lumière) : menu, niveau 1, ennemis, lumière, boss, 1 contre 1, pause, panthéon, crédits. La partie 2 (`js/partie2`) ajoute la suite et se branche sur la partie 1 sans la modifier.

## L'idée du jeu en une phrase
Un robot monte une tour dans l'ombre. Seules les zones de lumière éclairent, mais la lumière **brûle** si on y reste. En haut, un boss. Le score est le **temps net** (chrono moins les points gagnés) : plus petit = meilleur.

## Le principe de Phaser à retenir (la base de tout)
- Un jeu Phaser est une suite de **scènes** (menu, niveau, pause...). Chaque scène a `preload()` (charger les fichiers), `create()` (construire l'écran, une fois) et `update()` (appelée à chaque image, 30 fois par seconde ici).
- `scene.start("x")` change d'écran ; `scene.launch("pause")` pose une scène PAR-DESSUS une autre ; `scene.pause()` fige celle du dessous.
- Les cartes sont dessinées dans **Tiled** (`assets/maps/*.json`) : des calques de tuiles (le décor, le sol) et des calques d'objets (les points de départ, les ennemis, les lanternes).

## Le trajet d'une partie
`index.js` (racine) → `menu` → `niveau1` → combat du boss → `pantheon` (le choix) → NON : `menu` ; OUI : suite (partie 2) → `credits` → `classement` (le panthéon) → `menu`

## Modifier le jeu : `parametres.js`
Tous les chiffres de réglage sont dans **un seul fichier**, `js/partie1/parametres.js` : gravité, vitesse et saut du robot, dash, tir, PV et points des ennemis, lanternes vivantes, PV et attaques du boss, score. On change un chiffre, on recharge la page, c'est tout. Chaque ligne a un commentaire qui dit ce qu'elle fait et son unité.
Exemples : le robot saute plus haut → `ROBOT.saut` ; le jeu tombe plus vite → `MONDE.gravite` ; l'orc est plus dur → `ENNEMIS.orc.pv`.

## Où trouver quoi (arborescence)
```
index.js                    démarre Phaser, liste les scènes
js/partie1/
  parametres.js             TOUS les chiffres de réglage
  scenes/                   les écrans (menu, niveaux, pause, fin)
  personnage/               le robot et son interface (vie, jauges)
  ennemis/                  archer, mage, orc, lanternes vivantes, boss
  mecanismes/               lumière, salles, arène, bonus, boost
  systemes/                 outils : sons, effets, points, chargement, touches
js/partie2/                 la suite du jeu (fuite, dernier combat)
assets/                     images, sons, cartes Tiled
```

## Les dossiers

### `scenes/` : les écrans
| Fichier | Rôle |
|---|---|
| `menu.js` | l'accueil, charge tout le jeu pendant la barre de chargement |
| `niveau_de_base.js` | **la classe de base de tous les niveaux** : carte, robot, ennemis, lumière, HUD, dégâts, mort. À lire en premier |
| `niveau1.js` | le niveau 1 : uniquement ce qui change par rapport à `niveau_de_base.js` (sa « config ») |
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
| `ennemis_normaux.js` | l'archer, le mage et l'orc (ils ne voient le robot qu'à 120 px, ou 400 px dans la lumière) |
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
| `sons.js`, `preferences_joueur.js` | musiques et bruitages ; les réglages du joueur (gardés dans le navigateur) |
| `effets.js` | tremblements, flashs, éclats |
| `points.js` | les points, le temps net et la fin de partie |
| `optimisation.js` | ce qui garde le jeu fluide sur le Raspberry Pi |
| `raccourcis.js` | le reset de la borne (C + F) et les touches de test |
| `guide.js` | le texte d'explication au début de la partie |

## Par où commencer à lire (dans cet ordre)
1. `index.js` (racine) : la configuration de Phaser et la liste des scènes.
2. `scenes/niveau_de_base.js` : comment un niveau est construit (les commentaires du haut expliquent la « config »).
3. `personnage/personnage.js` : le robot (l'en-tête explique tout).
4. `mecanismes/lumiere.js` : la lumière.
5. `ennemis/boss.js` : le moteur de boss.
