# HUNTING RUN

## Contrôles (borne)
| | Joueur 1 | Joueur 2 |
|---|---|---|
| Déplacer | flèches | Z Q S D |
| Bouton A (portes, notes, parler, valider) | I | R |
| Saut | K | F |
| **Bouton B : frapper / tirer / laser** | **O** | **G** |

Bouton B :
- sans pouvoir : coup de poing
- après une potion violette : appui court = boule de pouvoir, **appui maintenu = laser** (il consomme de l'énergie, la barre verte sous les cœurs)

Touches de test (DEBUG = true dans maps.js) : 1-6 changer de map, 7 / 8 perdre / gagner de la vie, 9 aller à la fin, 0 donner le pouvoir.

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
