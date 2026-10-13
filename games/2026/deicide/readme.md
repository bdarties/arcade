# DEICIDE

Plateformer « ombre et lumière » (Phaser 3.60) — SAÉ borne d'arcade. Le robot monte une tour dans l'ombre, la lumière le brûle ; il affronte le Dieu de la Lumière, fuit en dashant à travers un deuxième niveau, puis livre un dernier combat. Un mode 1 contre 1 se joue à deux sur la borne.

## Où est quoi

```
index.html, index.js    le point de départ : la configuration du jeu et la liste des scènes
game.json               la fiche du jeu pour le portail de la borne
assets/                 images, sons et cartes Tiled (maps/ : voir LISEZ-MOI.md pour dessiner un niveau)
outils/                 scripts Python qui fabriquent des cartes (niveau 2 d'exemple, arènes)
js/
  scenes/               les écrans : menu, niveau1, niveau2, niveau3, versus, classement, pause
                        (niveau.js est la classe de base de tous les niveaux)
  personnage/           le robot (déplacements, saut, dash, tir, visée automatique) et son interface (vie, dash, chrono)
  ennemis/              ce qui attaque : archers, mages, orcs, le boss, les lanternes vivantes, la poursuite du niveau 2
  mecanismes/           les règles propres aux niveaux : lumière, salles de combat, arène du boss, vide, faisceaux, bonus, boost
  systemes/             les outils partagés : chargement, sons, réglages, effets, points, optimisations, raccourcis
```

Chaque fichier commence par un commentaire qui dit à quoi il sert. Pour comprendre le jeu, lis dans cet ordre : `index.js`, `scenes/niveau.js` (comment un niveau se construit), `personnage/personnage.js`, puis les scènes une par une.

## Comment…

- **ajouter un niveau** : copier `scenes/niveau2.js`, changer la clé de scène et la config (carte, musique, départ), charger la carte dans `systemes/chargement.js`, ajouter la scène dans `index.js`.
- **poser un ennemi** : dans Tiled, ajouter un point sur le calque `archer`, `mage` ou `orc` de la carte (pas de code à écrire).
- **ajouter une salle de combat** : ajouter un bloc dans `SALLES_NIVEAU1` de `mecanismes/salles.js` (les numéros de ligne sont ceux de la carte dans Tiled).
- **changer la difficulté d'un boss** : les PV, les pauses et les attaques de chaque boss sont dans `PROFILS`, en haut de `ennemis/boss.js`.
- **régler la poursuite du niveau 2** : les vitesses et les délais sont les constantes en haut de `ennemis/poursuite.js`.

## Commandes

| | Joueur 1 | Joueur 2 (1 contre 1) |
|---|---|---|
| déplacer / viser | flèches | Q Z D S (ou A W D S) |
| saut (bouton A) | I | R |
| tir (bouton D, visée automatique) | K | F |
| dash (bouton E) | L | G |

Menu pause : Échap ou X (start). Recommencer la partie : maintenir Z + X (SELECT + START sur la borne) pendant 1,5 s.
Touches de test, à retirer avant la borne : F8 (téléporter), F9 (niveau 2 direct), maintenir Z + B (aller au boss).

## Les explications des choix

Le fichier `DEVLOG.md` explique pourquoi chaque chose est faite ainsi.
