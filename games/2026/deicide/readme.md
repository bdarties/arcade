# DEICIDE

Plateformer « ombre et lumière » (Phaser 3.60) — SAÉ borne d'arcade. Le robot monte une tour dans l'ombre, la lumière le brûle ; il affronte le Dieu de la Lumière, fuit en dashant à travers un deuxième niveau, puis livre un dernier combat. Un mode 1 contre 1 se joue à deux sur la borne.

## Où est quoi

```
index.html, index.js    le point de départ : la configuration du jeu et la liste des scènes
game.json               la fiche du jeu pour le portail de la borne
assets/                 images, sons et cartes Tiled (maps/ : voir LISEZ-MOI.md pour dessiner un niveau)
outils/                 scripts Python qui fabriquent des cartes (niveau 2 d'exemple, arènes)
js/
  partie1/              le jeu JUSQU'À LA FIN DU 1er BOSS : un jeu complet, qui s'arrête à la défaite du Dieu de la Lumière
    scenes/             les écrans : menu, niveau1, versus, classement (le panthéon), pantheon (le choix), pause
                        (niveau.js est la classe de base de tous les niveaux)
    personnage/         le robot (déplacements, saut, dash, tir, visée automatique, « en boule ») et son interface (vie, dash, chrono)
    ennemis/            ce qui attaque : archers, mages, orcs, le boss du niveau 1 (le moteur des boss), les lanternes vivantes
    mecanismes/         les règles du niveau 1 : lumière, salles de combat, arène du boss, bonus, boost
    systemes/           les outils partagés : chargement, sons, réglages, effets, points, optimisations, raccourcis
  partie2/              la SUITE, après la réponse OUI au choix du panthéon (facultative, voir « La partie 2 » plus bas)
    niveau2.js, niveau3.js, vide.js, faisceaux.js, poursuite.js   la fuite (niveau 2) et l'arène du dernier combat (niveau 3)
    fuite.js            le Dieu s'enrage, brise le mur de l'arène, le robot fuit vers le niveau 2
    bossFinal.js, attaques.js   le boss du dernier combat et ses attaques en plus (lasers, geysers, spirale, piqué)
    formeFinale.js, finDeCombat.js, fauxPantheon.js   la fausse fin (faux écran de victoire qui se fissure) et la forme finale du boss (phase 4)
    musique.js, astuce.js, testsBorne.js   la musique du dernier combat, un conseil, les touches de test F9 et F10
```

Chaque fichier commence par un commentaire qui dit à quoi il sert. Pour comprendre le jeu, lis dans cet ordre : `index.js`, `js/partie1/scenes/niveau.js` (comment un niveau se construit), `personnage/personnage.js`, puis les scènes une par une.

## Comment…

- **ajouter un niveau** : copier `js/partie2/niveau2.js`, changer la clé de scène et la config (carte, musique, départ), charger la carte dans `js/partie2/index.js` (chargerPartie2), ajouter la scène dans `scenesPartie2`.
- **poser un ennemi** : dans Tiled, ajouter un point sur le calque `archer`, `mage` ou `orc` de la carte (pas de code à écrire).
- **ajouter une salle de combat** : ajouter un bloc dans `SALLES_NIVEAU1` de `js/partie1/mecanismes/salles.js` (les numéros de ligne sont ceux de la carte dans Tiled).
- **changer la difficulté d'un boss** : les PV, les pauses et les attaques du boss du niveau 1 sont dans `PROFILS`, en haut de `js/partie1/ennemis/boss.js` ; celles du boss final sont dans `js/partie2/bossFinal.js`.
- **régler la poursuite du niveau 2** : les vitesses et les délais sont les constantes en haut de `js/partie2/poursuite.js`.

## Commandes

| | Joueur 1 | Joueur 2 (1 contre 1) |
|---|---|---|
| déplacer / viser | flèches | Q Z D S (ou A W D S) |
| saut (bouton A) | I | R |
| tir (bouton D, visée automatique) | K | F |
| dash (bouton E) | L | G |

Menu pause : Échap ou X (start). Recommencer la partie : maintenir C + F (les boutons C et F de la borne, P et ; au clavier, la touche M en AZERTY) pendant 0,5 s.
Touches de test, à retirer avant la borne : F8 (téléporter), F9 (niveau 2 direct), F10 (phase 3 du boss final, boss à pleine vie), F5 (la fausse fin : la fissure de l'écran, puis la phase 4, la forme finale du boss ; F5 ne recharge donc plus la page).

## Les explications des choix

Le fichier `DEVLOG.md` explique pourquoi chaque chose est faite ainsi.

## La partie 2 (facultative)

Le jeu est coupé en deux dossiers. `js/partie1` est un jeu complet qui se termine quand le Dieu de la Lumière est vaincu : le joueur choisit alors d'enregistrer
son temps dans le panthéon (le tableau des scores). `js/partie2` est la suite (la fuite, le dernier combat) : elle se branche sur la partie 1 sans la modifier,
par quelques tables que la partie 1 expose : `PROFILS` et `ATTAQUES` (les boss et leurs attaques, `partie1/ennemis/boss.js`), `MUSIQUES_BOSS` (`partie1/systemes/sons.js`),
`CHARGEMENTS_SUPPLEMENTAIRES` (`partie1/systemes/chargement.js`) et `EXTENSIONS_NIVEAU1` (`partie1/scenes/niveau1.js`).

Pour que le jeu s'arrête à la fin du 1er boss, il suffit de retirer de `index.js` les lignes qui parlent de la partie 2 (`installerPartie2`, `scenesPartie2`, `activerTestsPartie2`) :
la réponse OUI mène alors directement à l'écran de fin. Les fichiers de la partie 2 peuvent rester dans le dossier, ils ne sont plus chargés.
