# Notice technique — Glass Garden

> Document de synthèse technique. Il décrit **ce qui est effectivement implémenté** dans le dépôt,
> les choix d'architecture qui le sous-tendent, et les difficultés rencontrées.
> Pour le concept et l'univers, voir `game-design.md`. Pour les règles d'équipe, voir `conventions.md`.

---

## 1 · Fiche d'identité

| | |
|---|---|
| **Titre** | Glass Garden |
| **Équipe** | Lilian · Léa · Hina (MMI) |
| **Genre** | Aventure / exploration 2D à mécaniques variées |
| **Vue** | Vue du dessus (*top-down*), pixel art |
| **Joueurs** | 1 ou 2 en simultané |
| **Plateforme cible** | Borne d'arcade — 1280 × 720 (16:9) |
| **Moteur** | Phaser 3.90, chargé depuis un CDN |
| **Langage** | JavaScript natif, modules ES, **sans étape de build** |
| **Éditeur de niveaux** | Tiled (export JSON) |
| **Thème imposé** | Monde onirique |

---

## 2 · Présentation et objectifs

### Le concept

Un jardin paisible en vue du dessus. En son centre, **cinq miroirs**. Chacun ouvre sur une
**version alternée du même jardin** : la nuit, un rêve, un automne, un monde en ruines, un jardin
magique. Chaque monde dissimule **une étoile**, protégée par une mécanique qui lui est propre.

Le principe narratif est *un même lieu, plusieurs réalités* — inspiré d'*Alice au pays des merveilles*.

### L'objectif du joueur

1. Entrer dans un miroir, dans l'ordre que l'on veut.
2. Comprendre la mécanique du monde et relever son défi.
3. Récupérer l'étoile, puis revenir au jardin par le miroir.
4. Recommencer jusqu'à avoir toutes les étoiles.

**Victoire :** toutes les étoiles ramassées **et** le joueur de retour dans le jardin. La condition est
vérifiée à chaque image, mais uniquement dans le monde normal :

```js
// WorldScene.update()
if (this.isNormalWorld() && areAllStarsCollected()) {
  this.winGame();
}
```

**Échec :** il n'y a pas de mort définitive. Un contact avec un ennemi renvoie le joueur au point de
départ du monde ; une explosion de bombe fait recommencer le monde entier. Dans les deux cas, **le
chronomètre ne s'arrête jamais** : l'échec coûte du temps, pas une vie.

### Le score

Un **chronomètre global** tourne en continu du début à la fin de la partie. Le temps final est le score :
plus il est court, mieux c'est. Il survit aux changements de monde, aux échecs et aux redémarrages de niveau.

---

## 3 · Architecture technique

### 3.1 · La chaîne de démarrage

```
index.html   charge Phaser (CDN) puis index.js
    ↓
index.js     new Phaser.Game(config)
    ↓
config.js    résolution, moteur physique, liste des scènes
    ↓
PreloadScene charge les 6 cartes, calcule le total d'étoiles, démarre le jardin
```

Le jeu compte **9 scènes enregistrées** (`PreloadScene`, `MenuScene`, `HubScene`, `World1` à `World5`,
`UIScene`) et **une classe mère non enregistrée**, `WorldScene`.

### 3.2 · Premier pilier : l'héritage des mondes

Les six mondes **ne contiennent aucune logique**. Toute la mécanique commune — carte, joueur,
collisions, miroirs, étoiles, ennemis, dialogues, transitions — vit dans `WorldScene` (807 lignes).
Un monde se résume à déclarer sa carte :

```js
export default class HubScene extends WorldScene {
  constructor() {
    super(SCENES.HUB, WORLD_MAPS.hub.key, WORLD_MAPS.hub.path);
  }
}
```

Chaque monde fait ainsi **13 à 14 lignes**. Une correction de collision écrite une fois profite
immédiatement aux six mondes. C'est ce choix qui rend cinq mondes réalisables dans le temps imparti.

### 3.3 · Second pilier : les systèmes, une mémoire qui survit aux scènes

**La contrainte :** Phaser **détruit et reconstruit entièrement une scène** à chaque téléportation.
Tout ce qui était stocké dans la scène disparaît. Or le jeu doit se souvenir du chronomètre, des
étoiles ramassées, des miroirs déjà consommés et des énigmes résolues.

**La solution :** un module ES n'est évalué **qu'une seule fois** pour toute la durée du jeu. Une
variable déclarée au niveau du module est donc une mémoire persistante.

```js
// MirrorSystem.js — hors de toute classe : une seule instance pour tout le jeu
const usedMirrors = [];

export function markMirrorUsed(world) {
  if (!isMirrorUsed(world)) usedMirrors.push(world);
}
```

Le même motif est appliqué cinq fois :

| Système | Mémoire conservée | Forme |
|---|---|---|
| `TimerSystem` | temps écoulé | instance unique exportée |
| `MirrorSystem` | miroirs disparus | tableau de modules |
| `StarSystem` | étoiles ramassées | objet de `Set` |
| `DialogueSystem` | énigmes résolues | `Set` |
| `ControlMode` | mode arcade ou PC | variable de module |
| `BubbleSystem` | cartes terminées | `Set` |

Le chronomètre ne compte d'ailleurs pas les secondes : il mémorise l'heure de départ et soustrait,
ce qui le rend exact indépendamment de la fluidité d'affichage.

```js
elapsed() {
  if (!this.running) return this.accumulated;
  return this.accumulated + (performance.now() - this.startTime);
}
```

### 3.4 · L'interface en scène parallèle

`UIScene` est lancée avec `launch()` et non `start()` : elle s'**ajoute** par-dessus le monde au lieu
de le remplacer, et n'est **jamais détruite**.

```js
if (!this.scene.isActive(SCENES.UI)) this.scene.launch(SCENES.UI);
this.scene.bringToTop(SCENES.UI);
```

Conséquence : le chronomètre et les compteurs restent parfaitement stables pendant les téléportations.
L'interface ne reçoit aucune notification du jeu — elle **relit les systèmes à chaque image**, ce qui
supprime tout couplage entre la logique et l'affichage.

### 3.5 · Arborescence

```
glass_garden/
├── index.html / index.js / game.json       point d'entrée et fiche borne
├── assets/
│   ├── images/sprites/ · tilesets/          ce que le jeu charge
│   ├── maps/                                .tmx (source Tiled) + .json (lu par le jeu)
│   └── tilesets/sources/                    matière première des outils (non chargée)
├── src/
│   ├── config.js                            configuration Phaser
│   ├── scenes/                              9 scènes + WorldScene (classe mère)
│   ├── systems/                             20 modules de logique réutilisable
│   ├── data/dialogues.js                    les textes, séparés du code
│   └── utils/constants.js                   toutes les valeurs du jeu (522 lignes)
├── outils/                                  6 scripts Python de génération d'assets
└── docs/                                    GDD, conventions, journal, cette notice
```

**Distinction essentielle :** une *scène* a un écran et un cycle de vie Phaser, et elle est détruite
à chaque changement de monde. Un *système* est un module sans écran, chargé une seule fois.

---

## 4 · Modèles de mobilité

Le jeu comporte **six modèles de déplacement distincts**, chacun répondant à un besoin différent.

### 4.1 · Marche du joueur — vitesse constante, normalisée

Le déplacement n'est pas appliqué directement : on fixe une **vitesse** et c'est le moteur physique
qui déplace et arrête contre les obstacles.

```js
this.player.setVelocity(x * PLAYER.SPEED, y * PLAYER.SPEED);   // 300 px/s
```

La normalisation diagonale est centralisée dans l'`InputManager` :

```js
if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
```

Sans cette division par √2, un déplacement diagonal serait environ **1,41 fois plus rapide** qu'un
déplacement en ligne droite (théorème de Pythagore appliqué aux deux composantes).

### 4.2 · Le dash — distance constante malgré un freinage

Le dash est le passage le plus technique du projet. L'intention : partir très vite, freiner
progressivement, et parcourir **toujours exactement 135 pixels**, quelle que soit la courbe de freinage choisie.

```js
const progress   = (now - this.startedAt + this.scene.game.loop.delta / 2) / DASH.DURATION_MS;
const startSpeed = (DASH.DISTANCE * (DASH.EASE_POWER + 1)) / (DASH.DURATION_MS / 1000);
const speed      = startSpeed * Math.max(1 - progress, 0) ** DASH.EASE_POWER;
```

Le raisonnement :

- la vitesse suit la courbe `v(t) = v₀ × (1 − t)^p` ;
- la distance parcourue est **l'aire sous cette courbe**, soit `v₀ × durée / (p + 1)` ;
- on veut que cette distance vaille `DISTANCE`, donc on **inverse la formule** pour en déduire `v₀`.

Régler `EASE_POWER` change ainsi le *ressenti* du dash (sec ou souple) sans jamais changer sa portée.

Le `+ delta / 2` évalue la courbe au **milieu** de l'image à venir plutôt qu'à son début : comme la
vitesse décroît, prendre sa valeur initiale surestimerait systématiquement le déplacement et le dash
dépasserait sa distance.

Le dash accorde aussi une **invincibilité** pendant toute sa durée, ce qui en fait un outil défensif
autant qu'un outil de déplacement.

### 4.3 · Poursuite des ennemis — machine à états et ligne de vue

Deux types d'ennemis, réglés par leurs seules valeurs :

| Ennemi | Points de vie | Vitesse | Portée de vue |
|---|---|---|---|
| **Faucheur** | 3 | 220 px/s | 280 px |
| **Capuche** (fantôme à tentacules) | 2 | 160 px/s | 200 px |

Les deux sont **plus lents que le joueur** (300 px/s) : fuir est toujours possible, ce qui est un
choix de game design autant que technique.

Le comportement est une **machine à quatre états** :

```
idle    → il flâne autour de son point de départ
chase   → il voit le joueur (distance < sight ET aucun mur entre eux) : il fonce
search  → il l'a perdu : il va au dernier endroit vu et y attend
return  → il rentre à son point de départ, puis repasse en idle
```

La détection n'est pas une simple distance : elle teste aussi la **ligne de vue**, en échantillonnant
le segment entre l'ennemi et le joueur tous les 12 pixels. Un mur sur le trajet coupe la vision — le
joueur peut donc réellement se cacher.

Deux raffinements notables :

- **Hystérésis** (`LOSE_SIGHT_FACTOR: 1.3`) : un ennemi lancé ne lâche sa cible qu'au-delà de 1,3 × sa
  portée de vue. Sans cette marge, un joueur pile à la limite ferait clignoter l'ennemi entre
  poursuite et abandon à chaque image.
- **Abandon de sécurité** (`SEARCH.MAX_MS: 3500`) : si l'ennemi reste bloqué, il renonce au bout de
  3,5 secondes au lieu de s'acharner indéfiniment contre un obstacle.

Les ennemis **contournent** également les obstacles au lieu de s'y coller, et sont bloqués par les
murs, l'eau, les caisses, les PNJ, les miroirs et entre eux.

### 4.4 · Rebond balistique — étoiles et bombes

Lorsqu'une étoile est libérée (énigme résolue, caisse brisée), elle **jaillit et rebondit** comme un
objet réel. Deux grandeurs sont suivies séparément : la **position au sol**, qui avance en ligne
droite, et la **hauteur**, qui suit une parabole. L'objet est dessiné à `sol − hauteur`, avec une ombre
portée qui rétrécit à mesure qu'il monte.

Les rebonds sont **calculés à l'avance** : chaque impact repart à 55 % de la vitesse d'arrivée
(`RESTITUTION`), jusqu'à tomber sous un seuil minimal.

```js
const impact   = Math.sqrt(speed * speed + 2 * GRAVITY * height);  // vitesse à l'impact
const duration = (speed + impact) / GRAVITY;
speed = impact * RESTITUTION;
```

La **direction** est choisie parmi 24 directions réparties sur le cercle, testées dans un ordre
aléatoire ; on retient la première dont **tout le trajet est libre** (ni mur, ni eau, ni miroir, ni
caisse, ni PNJ, ni bord de carte). Si aucune ne convient, le trajet est raccourci à 60 %, puis 30 %,
puis l'objet retombe sur place. C'est ce qui garantit qu'une étoile ne peut jamais atterrir dans un
mur et devenir inaccessible.

Le même moteur sert aux **bombes**, avec une portée divisée par deux.

### 4.5 · Flottement des bulles — somme de sinusoïdes

Les bulles ne sont pas physiques : leur dérive est purement calculée.

```js
bubble.setPosition(
  originX + Math.sin(seconds * SPEED_X + phase) * AMPLITUDE_X,
  originY + Math.sin(seconds * SPEED_Y + phase * 1.7) * AMPLITUDE_Y,
);
```

Deux oscillations de **vitesses différentes et non proportionnelles** (1,3 et 2,1) composent une petite
boucle irrégulière : l'œil ne perçoit aucune répétition. La `phase` tirée au hasard par bulle évite
qu'elles ne se balancent toutes à l'unisson.

### 4.6 · Projectiles — vecteurs directionnels tabulés

Les quatre directions sont décrites une fois pour toutes dans `constants.js`, vecteur **et** angle de
rotation du sprite :

```js
export const DIRECTION_VECTORS = {
  right: { x:  1, y:  0, angle: 0 },
  down:  { x:  0, y:  1, angle: Math.PI / 2 },
  left:  { x: -1, y:  0, angle: Math.PI },
  up:    { x:  0, y: -1, angle: -Math.PI / 2 },
};
```

Tirer revient alors à lire la table, sans aucun `if` par direction :

```js
bullet.setRotation(vector.angle);
bullet.setVelocity(vector.x * BULLET.SPEED, vector.y * BULLET.SPEED);
```

Chaque balle s'auto-détruit après 1,2 seconde : même sortie de l'écran, elle ne vole jamais indéfiniment.

---

## 5 · Mécaniques de jeu

### 5.1 · Les miroirs : téléportation et disparition conditionnelle

Un miroir est un objet Tiled de classe `mirror` dont le **nom est le monde de destination**. La table
`WORLDS` traduit ce nom en scène :

```js
const targetScene = WORLDS[nearMirror.world];
```

**Conséquence de conception : ajouter un monde au jeu = créer sa scène + ajouter une ligne dans
`WORLDS`.** Rien d'autre.

Un miroir **disparaît définitivement** une fois son monde terminé — mais seulement à cette condition :

```js
export function shouldMirrorDisappear(world) {
  return isWorldStarCollected(world);
}
```

C'est un garde-fou essentiel : si le joueur ressort d'un monde **sans** son étoile, le miroir reste en
place et il peut y retourner. Sans cette condition, une sortie prématurée rendrait la partie
impossible à finir.

Au retour dans le jardin, le miroir consommé est créé **malgré tout**, uniquement pour jouer son
animation de disparition sous les yeux du joueur, et il n'est pas ajouté à la liste des miroirs
utilisables. Aux visites suivantes, il n'est simplement plus créé.

### 5.2 · Les mondes et leurs défis

| Monde | Ambiance | Défi implémenté | Contenu posé dans Tiled |
|---|---|---|---|
| **Jardin** | Calme, lumineux | Plaque tournante | 5 miroirs, 1 étoile, 1 cheminée fumante |
| **1** | Nuit | *mécanique à définir* | 1 caisse de test |
| **2** | Rêve | **Survivre aux ennemis** | 4 ennemis |
| **3** | Automne | **Énigme d'un personnage** | 1 PNJ |
| **4** | Apocalypse | **Détruire les caisses au tir** | 48 caisses (étoile + bombes cachées) |
| **5** | Magie | **Éclater les bulles** | 3 grosses bulles qui se divisent |

Le jeu compte **six étoiles** au total — une par carte, le jardin inclus.

### 5.3 · Révélation de l'étoile : un contrat commun, trois variantes

Toutes les mécaniques reposent sur le **même principe** : l'étoile du monde existe dès le chargement
mais elle est **désactivée**, et c'est la réussite du défi qui la révèle.

```js
// L'étoile est cachée tant qu'un défi la garde
if (this.crates.getChildren().some((crate) => crate.hasStar)) {
  this.stars.forEach((star) => star.disableBody(true, true));
}
```

Les trois voies de révélation :

| Déclencheur | Méthode appelée | Effet visuel |
|---|---|---|
| Énigme résolue | `revealWorldStar(npc)` | l'étoile saute de la tête du personnage et rebondit |
| Caisse marquée `hasStar` brisée | `onStarCrateBroken(crate)` | l'étoile jaillit de la caisse et rebondit |
| Dernière bulle éclatée | `revealStarAtCenter(true)` | l'étoile apparaît au centre en grossissant |

### 5.4 · Le tir et le système de cibles

Le système de tir **ne connaît ni les caisses ni les ennemis**. Il ne connaît que des « cibles », c'est-à-dire
n'importe quel objet physique disposant éventuellement de `hitPoints` et d'une fonction `onHit` :

```js
target.hitPoints = (target.hitPoints ?? 1) - 1;
target.onHit?.(target);
if (target.hitPoints <= 0) target.destroy();
```

Cette abstraction est exactement le « système partagé configurable » exigé par `conventions.md` : une
caisse et un ennemi passent par le même code, avec des réglages différents. Le nombre de tirs
nécessaires se définit **dans Tiled**, via une propriété `hitPoints`.

Détail technique : la détection utilise `overlap` et non `collider`. `collider` ferait **rebondir** les
corps — une balle pousserait physiquement la caisse. `overlap` ne fait que signaler le chevauchement.

### 5.5 · Caisses, bombes et réactions en chaîne

Une caisse est un objet Tiled de classe `crate`, avec deux propriétés facultatives :

- `hitPoints` — le nombre de tirs nécessaires ;
- `hasStar` — elle cache l'étoile du monde ;
- `hasBomb` — elle cache une bombe.

Une bombe brisée **jaillit, rebondit, se pose, clignote 300 ms, puis explose** dans un rayon de 80 pixels :

- un joueur dans le rayon → **le monde recommence** (l'invincibilité et le dash protègent) ;
- un ennemi dans le rayon → il meurt ;
- une caisse dans le rayon → elle casse — **et si elle cachait une bombe, la chaîne se propage**.

C'est la mécanique la plus riche du jeu : une seule balle bien placée peut déclencher une cascade
d'explosions, avec un vrai risque pour le joueur.

### 5.6 · Les bulles qui se divisent

Les bulles existent en trois tailles (`large`, `medium`, `small`, réglées par une propriété Tiled
`size`), et **éclater une grosse bulle en engendre de plus petites** :

```js
SPLIT: {
  large:  { INTO: 'medium', COUNT: 4 },
  medium: { INTO: 'small',  COUNT: 2, DISTANCE: 48 },
},
```

Les filles s'écartent du point d'éclatement avec une animation `Back.easeOut`. Les 3 grosses bulles
posées dans la carte engendrent donc une arborescence de plusieurs dizaines de bulles à éliminer, à
partir de trois objets seulement dans l'éditeur.

### 5.7 · L'énigme à choix multiples

Le PNJ du monde 3 prononce d'abord ses répliques (effet machine à écrire, 28 ms par lettre), puis pose
une question à quatre réponses affichées en deux colonnes, que le joueur parcourt au joystick. Une
mauvaise réponse autorise un nouvel essai.

Point d'architecture intéressant : `DialogueSystem` **ignore totalement ce qu'est une étoile**. Il reçoit
une fonction de récompense et se contente de l'appeler :

```js
this.dialogue.open(nearNpc.npcName, DIALOGUES[nearNpc.npcName], () => this.revealWorldStar(nearNpc));
```

Les textes vivent dans `src/data/dialogues.js` — jamais dans le code, conformément aux conventions.

### 5.8 · Échec, respawn et redémarrage

Deux niveaux de sanction, tous deux sans perte de progression :

| Événement | Conséquence |
|---|---|
| Contact avec un ennemi | retour au point de départ du monde, les ennemis vivants reprennent leur place, **1,5 s d'invincibilité** avec clignotement et éclair rouge |
| Explosion de bombe sur un joueur | **le monde entier recommence** (caisses, ennemis, bombes réinitialisés) |

Un ennemi déjà tué ne revient pas. Le chronomètre, lui, continue de tourner dans tous les cas.

### 5.9 · Le mode deux joueurs

Le second joueur dispose de **ses propres touches** sur la borne (second joystick + boutons R/T/Y) et
réutilise exactement les mêmes systèmes que le joueur 1 : `InputManager`, `Dash`, tir, interaction.

```js
p2.input2 = new InputManager(scene, 2);
p2.dash   = new Dash(scene, p2);
```

Il apparaît **à côté du joueur 1**, à la première position libre testée dans les quatre directions —
et non à un point fixe qui pourrait se trouver dans un mur. Les ennemis le poursuivent et le touchent
comme le joueur 1, et il peut éclater les bulles.

En mode PC (un seul clavier), le joueur 2 est volontairement immobilisé.

---

## 6 · Fonctionnalités originales et pertinentes

### 6.1 · La carte pilote le code

C'est le choix d'architecture le plus structurant du projet. Le contenu d'un monde n'est **jamais écrit
dans le code** : il est posé dans Tiled et lu au chargement d'après la **classe** de l'objet.

| Classe Tiled | Lu par | Devient |
|---|---|---|
| `spawn` | `getSpawnPosition()` | point d'apparition |
| `mirror` | `WorldScene.create()` | portail (son **nom** = la destination) |
| `star` | `createStars()` | une étoile |
| `npc` | `NpcSystem` | un personnage (son **nom** = lequel) |
| `crate` | `CrateSystem` | une caisse cassable |
| `bubble` | `BubbleSystem` | une bulle |
| `enemy` | `EnemySystem` | un ennemi (son **nom** = le type) |
| `smoke` | `createSmokes()` | une fumée de cheminée |

Le motif de lecture est identique partout :

```js
map.getObjectLayer('objects')
   .objects.filter((object) => (object.class || object.type) === 'star')
```

Le `object.class || object.type` n'est pas une maladresse : **selon la version de Tiled installée, la
classe d'un objet s'appelle `class` ou `type`**. Lire les deux rend le projet indépendant de la version
de l'éditeur sur chaque poste — un vrai problème en travail d'équipe.

**Bénéfice concret :** déplacer un miroir, ajouter 48 caisses ou changer le type d'un ennemi ne demande
**aucune ligne de code**. Les deux membres chargés des niveaux travaillent sans jamais toucher au `src/`,
ce qui supprime une grande part des conflits Git.

### 6.2 · Les entrées centralisées : la portabilité vers la borne

Le code du jeu ne mentionne **jamais une touche**. Il parle d'**actions** : `move`, `interact`, `shoot`,
`dash`. Une seule table fait le lien :

```js
const BINDINGS = {
  arcade: {
    1: { up:'UP', down:'DOWN', left:'LEFT', right:'RIGHT', interact:'I', shoot:'O', dash:'P' },
    2: { up:'Z',  down:'S',    left:'Q',    right:'D',     interact:'R', shoot:'T', dash:'Y' },
  },
  pc: {
    1: { up:'Z', down:'S', left:'Q', right:'D', interact:'E', shoot:'A', dash:'SHIFT' },
    …
  },
};
```

Les deux jeux de touches sont **branchés en permanence** ; seule la table *consultée* change, via un
accesseur relu à chaque appel :

```js
get keys() { return this.keysByMode[getControlMode()]; }
```

Basculer entre arcade et PC est donc **instantané**, sans rien reconstruire. Un raccourci de test
(`Ctrl/Cmd + C`) permet de passer de l'un à l'autre en pleine partie, et l'aide affichée à l'écran
**suit le mode** au lieu de citer une touche en dur :

```js
const key = this.input1.getKeyLabel('interact');
this.hint.setText(nearMirror ? `${key} : entrer dans le miroir` : …);
```

**Branchement sur la borne d'arcade = modification d'un seul fichier.**

### 6.3 · Le tri de profondeur dynamique

En vue du dessus, un personnage situé **plus bas** à l'écran doit passer **devant** celui qui est plus
haut. Plutôt que des profondeurs fixes, la scène recalcule l'ordre à chaque image d'après la position
verticale des pieds de chaque sprite :

```js
sortByDepth() {
  const height = this.map.heightInPixels;
  [this.player, this.player2, ...this.enemies.getChildren(), ...this.crates.getChildren(),
   ...this.npcs, ...this.mirrors].forEach((sprite) => {
    if (!sprite?.active || !sprite.body) return;
    sprite.setDepth(SORTED_MIN + (SORTED_MAX - SORTED_MIN)
                    * Phaser.Math.Clamp(sprite.body.bottom / height, 0, 1));
  });
}
```

La position des pieds (`body.bottom`) est ramenée dans l'intervalle `[0, 1]`, puis projetée sur une
plage de profondeurs réservée. Joueurs, ennemis, caisses, PNJ et miroirs s'intercalent ainsi
correctement **sans aucun cas particulier**.

### 6.4 · La transition « iris » par masque inversé

Le passage entre deux mondes est un cercle noir qui se referme **sur le miroir emprunté**, puis
s'ouvre **sur le miroir d'arrivée**. Technique : un rectangle noir plein écran, percé par un cercle
utilisé comme **masque géométrique inversé**.

```js
const mask = hole.createGeometryMask();
mask.setInvertAlpha(true);        // le noir n'est visible QU'EN DEHORS du cercle
cover.setMask(mask);
```

Le changement de scène attend la **fin** de l'animation, ce qui évite tout clignotement :

```js
this.transitioning = true;
irisClose(this, nearMirror.x, nearMirror.y, () => {
  this.scene.start(targetScene, { from: currentWorld });
});
```

L'objet `{ from: currentWorld }` transmis à la scène suivante sert à deux choses : **placer le joueur**
à côté du bon miroir de retour, et **désigner le miroir qui doit disparaître**.

### 6.5 · Le total d'étoiles n'est écrit nulle part

Le nombre d'étoiles du jeu n'est pas une constante : il est **compté** dans les fichiers de carte au
démarrage, par une fonction pure qui ne connaît ni Phaser ni l'état du jeu (et se teste donc isolément) :

```js
export function countStarsInMap(mapData) {
  const layer = mapData?.layers?.find((l) => l.type === 'objectgroup' && l.name === OBJECT_LAYER);
  if (!layer) return 0;
  return layer.objects.filter((object) => (object.class || object.type) === STAR_CLASS).length;
}
```

Ajouter une étoile dans Tiled met donc à jour le compteur affiché **et** la condition de victoire, sans
aucune intervention dans le code. Un total de zéro déclenche un avertissement en console, car il ferait
gagner la partie instantanément.

### 6.6 · Les tuiles animées par tuiles-repères

L'eau est posée dans Tiled comme une tuile normale, dans un calque `animated_tiles`, sous forme de
**tuile-repère**. Au chargement, le code remplace chaque repère par un sprite qui joue son animation en
boucle, **en reprenant son orientation** (rotation et retournement appliqués dans l'éditeur), puis
efface la tuile d'origine.

```js
sprite.setFlipX(tile.flipX);
sprite.setRotation(tile.rotation);
layer.removeTileAt(tile.x, tile.y);
```

Quand une tuile admet plusieurs animations possibles, le choix se fait par **hachage de la position**
plutôt qu'au hasard : la carte garde ainsi exactement le même aspect d'un lancement à l'autre, tout en
paraissant irrégulière.

```js
export function pickVariant(x, y, count) {
  let hash = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177) >>> 0;
  return ((hash ^ (hash >>> 16)) >>> 0) % count;
}
```

### 6.7 · Une chaîne d'outils Python pour les assets

Six scripts hors-jeu fabriquent les ressources graphiques de façon reproductible :

| Outil | Rôle |
|---|---|
| `recolorer.py` | fabrique les tilesets et l'eau recolorés de chaque monde |
| `arbres.py` | découpe et recompose les variantes d'arbre (cime, base, pièces collées) |
| `foret.py` | plante une forêt dense à partir d'une zone dessinée dans Tiled |
| `foret_logique.py` | la logique de quinconce commune aux deux précédents |
| `chemins.py` | génère les 16 tuiles de chemin (masque de bits N/E/S/O) |
| `tileset.py` | organise la planche de décors par monde |

Le plus pertinent est `recolorer.py` : plutôt que de redessiner six jeux de tuiles, il **transpose** les
couleurs famille par famille (herbe, pierre, eau), en imposant une teinte et une saturation tout en
**remettant la luminosité d'origine à l'échelle**. Le relief — ombres et reflets — est donc préservé.
L'échelle est calculée une seule fois par famille sur l'ensemble de ses tuiles, sinon deux tuiles
voisines n'auraient pas le même fond et une couture apparaîtrait.

`chemins.py` mérite également une mention : chaque tuile de chemin est identifiée par un **masque de
bits** (N=1, E=2, S=4, O=8), et son bord irrégulier est calculé par une fonction **périodique de période
32** — ce qui garantit que deux tuiles voisines se raccordent sans décalage visible. Le script vérifie
automatiquement cette continuité pour toutes les paires de tuiles adjacentes.

---

## 7 · Difficultés techniques rencontrées

### 7.1 · Le dash traversait les murs

**Symptôme.** Au début du dash, le joueur franchissait parfois un mur au lieu d'être arrêté.

**Cause.** Le moteur Arcade de Phaser ne repousse un corps enfoncé dans une tuile que jusqu'à une
profondeur maximale, `tileBias`, qui vaut 16 pixels par défaut. Or le dash fait avancer le joueur
d'environ **26 pixels par image** à son déclenchement : il se retrouvait enfoncé plus profondément que
la correction ne pouvait le rattraper.

**Résolution.** Doubler cette tolérance dans la configuration physique :

```js
physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, tileBias: 32 } }
```

### 7.2 · Se souvenir de quelque chose alors que la scène est détruite

**Symptôme.** Le chronomètre repartait à zéro à chaque miroir, et les miroirs déjà consommés
réapparaissaient.

**Cause.** Une scène Phaser est intégralement détruite et reconstruite par `scene.start()`. Tout l'état
stocké dans `this.` est perdu.

**Résolution.** Déporter la mémoire du jeu **hors des scènes**, au niveau des modules (voir §3.3). C'est
cette difficulté qui a dicté la séparation `scenes/` ÷ `systems/` du projet entier.

### 7.3 · Une animation est liée à une seule texture

**Symptôme.** Afficher l'eau recolorée d'un monde cassait l'animation de l'eau du jardin.

**Cause.** Dans Phaser, une animation est définie **pour une texture donnée**. L'eau recolorée étant une
texture différente, elle ne peut pas réutiliser l'animation de l'original.

**Résolution.** Suffixer les clés de texture **et** d'animation par monde (`water@nuit`,
`water_1@nuit`), et ne créer chaque animation qu'une fois :

```js
const animationKey = key + suffix;
if (this.anims.exists(animationKey)) return;
```

### 7.4 · Les couleurs de monde : trois approches successives

C'est la difficulté la plus instructive du projet, parce qu'elle s'est soldée par deux abandons assumés.

| Approche | Principe | Verdict |
|---|---|---|
| **Palettes** (`palette.js`) | recolorer les pixels à l'exécution, par familles de couleurs | fonctionnelle mais coûteuse au chargement ; **mise en réserve** |
| **Teintes** (`TintSystem`) | `tint` de Phaser, qui *multiplie* les couleurs | très réussie pour la nuit, **terne** pour l'automne et la magie |
| **Images recolorées** (`recolorer.py`) | générer les tilesets hors-jeu, en amont | **retenue** |

La limite décisive des teintes est mathématique : une teinte **multiplie** les composantes de couleur.
Multiplier un vert par un violet ne donne pas du violet mais un brun sombre — on peut assombrir et
nuancer, jamais changer réellement de teinte. D'où le passage à une recoloration calculée hors-jeu,
qui transpose les couleurs tout en conservant le relief.

Les deux approches abandonnées sont **conservées et documentées** dans le dépôt : elles coûtent zéro à
l'exécution et restent réactivables.

### 7.5 · La boîte de collision ne doit pas être l'image

**Symptôme.** Le joueur se bloquait contre des murs qu'il était censé longer, et paraissait flotter
devant les décors.

**Résolution.** Dissocier l'image de la zone de collision, en réduisant celle-ci **aux pieds** :

```js
HITBOX: { WIDTH: 20, HEIGHT: 16, OFFSET_X: 6, OFFSET_Y: 16 },   // pour une image de 32 × 32
```

Le buste du personnage peut ainsi chevaucher un mur, ce qui produit l'illusion de profondeur attendue
en vue du dessus. Le même principe est appliqué aux PNJ, aux ennemis et au joueur 2.

Conséquence pour le dash : étirer le sprite aurait aussi étiré sa boîte de collision. La solution
retenue est de **masquer le vrai sprite** (`setAlpha(0)`) et d'afficher à sa place une copie non
physique, elle seule déformée.

### 7.6 · Un raccourci clavier déclenché plusieurs fois

**Symptôme.** Après quelques téléportations, le raccourci de changement de mode basculait deux, puis
trois fois par appui.

**Cause.** L'écouteur était enregistré dans une scène de monde — donc **ré-enregistré à chaque
reconstruction** de la scène, sans que les précédents soient retirés.

**Résolution.** Le déplacer dans `UIScene`, la seule scène qui n'est jamais détruite. Deux précautions
s'y ajoutent :

```js
if (withModifier && event.code === CONTROL_MODE_SHORTCUT.CODE && !event.repeat) toggleControlMode();
```

- `event.code` désigne la **position physique** de la touche (`'KeyC'`), donc le raccourci fonctionne
  à l'identique en AZERTY et en QWERTY — `event.key` aurait renvoyé la lettre, variable selon la disposition ;
- `!event.repeat` écarte les événements en rafale d'une touche maintenue.

### 7.7 · Garantir qu'une récompense reste atteignable

**Symptôme.** Une étoile libérée pouvait atterrir dans un mur, dans l'eau ou derrière un décor, et
devenir définitivement inaccessible — bloquant la partie.

**Résolution.** Un prédicat de validité du sol, consulté avant de choisir la trajectoire :

```js
isFreeGround(x, y) {
  if (hors de la carte)                       return false;
  if (this.walls.hasTileAtWorldXY(x, y))      return false;
  if (une zone d'eau est proche)              return false;
  if (un miroir est à moins de 40 px)         return false;
  if (une caisse intacte est proche)          return false;
  return !(un PNJ occupe ce point);
}
```

Combiné au tirage de 24 directions avec repli progressif (§4.4), il rend le cas de blocage impossible.

### 7.8 · Les ennemis restaient coincés contre les obstacles

**Symptôme.** Un ennemi lancé à la poursuite du joueur se collait à un mur et vibrait sur place.

**Résolution.** Deux mesures complémentaires : un **contournement** d'obstacle (la liste des obstacles
est transmise à `EnemySystem`, qui s'en sert pour dévier la trajectoire) et un **abandon de sécurité**
après 3,5 secondes de recherche infructueuse, qui ramène l'ennemi à son point de départ plutôt que de
le laisser bloqué indéfiniment.

### 7.9 · Pas d'étape de build

Le jeu est écrit en modules ES chargés directement par le navigateur, sans bundler. Deux conséquences
assumées :

- ouvrir `index.html` par double-clic **ne fonctionne pas** (les modules sont bloqués en `file://`) : un
  serveur local est nécessaire en développement ;
- les chemins d'assets doivent rester **relatifs à la page**, car le lanceur de la borne sert le jeu
  depuis un sous-dossier :

```js
baseURL: window.location.pathname.replace(/\/[^/]*$/, ''),
```

En contrepartie, le projet n'a **aucune dépendance à installer** et se déploie en copiant un dossier —
ce qui est exactement ce qu'attend une borne d'arcade.

---

## 8 · Conformité aux contraintes de la borne

| Contrainte | État |
|---|---|
| Résolution 1280 × 720 | respectée, mise à l'échelle en `Phaser.Scale.FIT` avec conservation du ratio |
| Pas de clavier | mode `arcade` par défaut, aucune action essentielle sur une touche de clavier |
| Deux joueurs | second joystick et boutons R/T/Y câblés dans `BINDINGS` |
| Point d'entrée | `index.js` expose `game` et `window.game`, comme attendu par le lanceur |
| Fiche du jeu | `game.json` (titre, description, genre, auteurs) |
| Image de présentation | `presentation.png`, 800 × 450, sous 200 Ko |
| Pixel art non lissé | `pixelArt: true` |

**Deux points restent à vérifier sur la borne elle-même :**

1. **WebGL est requis** par deux effets : le masque inversé de la transition iris et la teinte des
   tuiles. `Phaser.AUTO` sélectionne WebGL quand il est disponible, mais un repli en Canvas dégraderait
   ces effets.
2. **Le tileset de décors** (`tileset_deco.png`) mesure 1920 × 2016 pixels pour 928 Ko, soit environ
   15 Mo en mémoire graphique une fois décompressé. Il dépasse le budget de 200 Ko par image fixé dans
   `conventions.md` et représente à lui seul l'essentiel du poids chargé. C'est le principal point
   d'optimisation identifié.

---

## 9 · État d'avancement

**Implémenté et jouable :** déplacement, dash avec invincibilité, tir, caisses destructibles, bombes à
réaction en chaîne, ennemis avec IA de poursuite, PNJ et énigme à choix multiples, bulles qui se
divisent, étoiles et compteur global, miroirs à disparition conditionnelle, transitions iris,
chronomètre persistant, deux joueurs simultanés, tri de profondeur, recoloration des cinq mondes.

**Reste à faire :**

| Élément | État |
|---|---|
| Audio (musiques, effets) | les dossiers existent, aucun fichier |
| Écran d'accueil | `MenuScene` affiche un titre et n'est pas encore lancée |
| Écran de fin | un simple message ; `SaveSystem` est écrit mais **jamais appelé** |
| Classement et pseudos | prévu dans `SaveSystem`, à implémenter (saisie au joystick) |
| Mécaniques des mondes 1 et 2 | le monde 2 a ses ennemis ; le monde 1 reste à définir |
| Cartes définitives | les cartes actuelles sont des cartes de test |

---

## 10 · Chiffres clés

| | |
|---|---|
| Code source | ~4 200 lignes de JavaScript, 35 fichiers dans `src/` |
| Scènes | 9 enregistrées + 1 classe mère |
| Systèmes | 20 modules (`src/systems/`) |
| Constantes centralisées | 522 lignes (`constants.js`) |
| Outils de génération | 6 scripts Python (~1 160 lignes) |
| Cartes Tiled | 6 jouables (`.tmx` source + `.json` exporté) |
| Assets chargés | 22 fichiers, ~1 Mo |
| Historique Git | 312 commits, dont 127 `feat:` |
| Modèles de mobilité distincts | 6 |

---

*Document rédigé à partir de l'état du dépôt. Comme le reste de la documentation du projet, il est
vivant : toute évolution du code doit s'y répercuter.*
