# DUSK AND DAWN · démo semaine 1

Version minimale du jeu pour le premier dépôt. Ce dossier est autonome : il contient son propre `index.html`, `index.js`, `game.json`, `js/` et `assets/`.

## Ce qu'il y a dans la démo

- Le menu (1 joueur) et l'écran de fin avec le score.
- La carte Tiled en vue isométrique (2048 × 1152, réduite pour la borne), les ténèbres et la lumière.
- Un seul personnage : le chevalier. Il attaque tout seul, en boucle, l'ombre la plus proche.
- Quatre ennemis, qui arrivent par vagues de plus en plus grosses : l'ombre rampante dès le début, le démon au niveau 3, le spectre au niveau 4 et le colosse au niveau 6.
- Le temple : les ombres l'attaquent. S'il est détruit, il se reconstruit au bout de 2 vagues. Il n'y a pas de réapparition : la partie est perdue quand plus aucun joueur n'est debout.
- L'XP et les bonus : chaque ombre battue laisse un éclat de lumière à ramasser. À chaque niveau, chaque joueur choisit un bonus parmi trois, tirés au hasard avec une rareté (les 8 bonus du chevalier de la version finale).
- Les sons de l'épée, des éclats et du niveau, et les 3 musiques.

## Ce qui est réservé aux semaines suivantes

- Le mage et l'écran de choix du personnage.
- La réapparition des joueurs au temple.
- Le boss.
- L'intro qui raconte l'histoire.
