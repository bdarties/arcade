# HUNTING RUN

## Contrôles (borne)
Joueur 1 | Joueur 2 

Déplacer | flèches | Z Q S D |
Bouton B (portes, notes, parler, valider) | O | G |
Saut | K | F |
**Bouton A : frapper / tirer / laser** | **I** | **R** |

Bouton A :
- sans pouvoir : coup de poing
- après une potion violette : appui court = boule de pouvoir, **appui maintenu = laser** (il consomme de l'énergie, la barre verte sous les cœurs)

Touches de test (DEBUG = true dans maps.js) : 1-6 changer de map, V = map7, B = map8, 7 / 8 perdre / gagner de la vie, 9 aller à la fin, 0 donner le pouvoir.

## Ennemis et potions : ils viennent de Tiled
Les calques d'objets (points) de chaque carte .json placent tout seuls :
- `ennemis 1` : un garde (corps à corps)
- `ennemis 2` : un tireur (il tire des boules)
- `potion pouvoir` : potion violette (pouvoir)
- `potion coeur` : potion rouge (soin)

Pour déplacer / ajouter un ennemi ou une potion, il suffit de le faire dans Tiled. Aucune position à écrire dans le code. La map6 n'a pas de calque : son garde (devant la grande porte) est écrit dans `ENNEMIS` (maps.js).

## Où tout régler (js/maps.js)
- `SPRITES` / `IMAGES_COMBAT` : tes sprite sheets
- `COMBAT` : dégâts, portée, laser, durée du pouvoir, soin des potions
- `TYPES_ENNEMIS` : stats du garde et du tireur ; `PATROUILLE_GARDE` : distance de patrouille du garde
- `PNJS` : les personnages qui parlent et leurs dialogues
- `POINTS` : notes et indices (ceux avec `si: "cle"` n'apparaissent qu'après la clé)
- `ENIGMES` : questions / réponses

## Fichiers
- js/jeu.js : scène principale (déplacements, portes, énigmes, clé)
- js/combat.js : ennemis, tirs, laser, potions, PNJ, dialogues
- js/sons.js : bruitages (générés par code)

## Nouveautés
- **Boutons A et B inversés** : A = O / G, B = I / R.
- **Temps** : 3 min 30 (`DUREE_PARTIE` dans maps.js).
- **Score** : chaque ennemi tué rapporte des points (`points` dans `TYPES_ENNEMIS` : garde 100, tireur 150). Les énigmes bonus (bibliothèque, puits) rapportent 300 points + 1 cœur.
- **Revivre** : quand on est K.O. (ennemis, trous, mauvaise réponse), l'écran Game Over propose *Revivre* (joystick gauche/droite + A) : on reste dans la même salle, avec **un seul cœur**, le **score retombe à 0**, la progression (clé, énigmes) et le chrono sont conservés. Si le temps est écoulé : seulement *Rejouer*. Réglage : `REVIE.pv` dans maps.js.
- **Sauvegarde des scores** : écran « Meilleurs scores » (top 10, sauvegardé avec `lireDonneesJSON` / `ecrireDonneesJSON` (js/donnees.js, import en haut de index.js)) avec saisie de 3 initiales, après la victoire ou en cliquant sur *Rejouer*. Le meilleur score s'affiche sur l'accueil.
- **map7** (grand hall, 2 étages) et **map8** (cimetière) : portes aléatoires comme les autres. La map7 n'ayant pas de sol dans `calque_platformes`, un sol invisible est ajouté à partir de la ligne 20 (`sol: 20` dans maps.js). Seule la porte derrière la bibliothèque de la map4 mène à la map6.
- **Nouvelles énigmes** : la bibliothèque (map7) et le puits (map8), voir `ENIGMES` et `POINTS`.
