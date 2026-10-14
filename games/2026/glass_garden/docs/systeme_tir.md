# Le système de tir

Ce document décrit le système de tir : ce qui marche, comment l'utiliser, ce qui reste à faire. Le résumé est aussi dans le GDD (section 9, « Le tir »).

## Ce qui est fait

Le code est dans `src/systems/fonctionTir.js`. Il ne contient que la **vie d'une balle** : il ne lit aucune touche (c'est le rôle de `InputManager`) et ne crée aucun groupe (la scène lui en donne un).

| Fonction | Rôle |
|---|---|
| `createBulletAnimations(scene)` | Crée les animations de la balle (vol, explosion). Sans effet si elles existent déjà |
| `shoot(scene, bullets, player, direction)` | Crée une balle devant le joueur et l'envoie dans une direction : `'up'`, `'down'`, `'left'` ou `'right'` |
| `explodeBullet(bullet)` | Arrête la balle, joue son explosion, puis la détruit. Sans effet si elle a déjà explosé |
| `hitTarget(bullet, target)` | Une balle touche une cible : la balle explose, la cible perd une vie, détruite à 0. Si la cible a une fonction `onHit(cible)`, elle est appelée à chaque coup, **avant** la destruction (pour jouer un effet) |
| `addTargetCollision(scene, bullets, targets)` | Branche la collision entre le groupe de balles et un groupe de cibles |

**La vie d'une balle :** elle apparaît à `BULLET.START_OFFSET` pixels devant le joueur (pas sur lui), vole à `BULLET.SPEED` pixels par seconde en jouant son animation en boucle, puis explose quand elle touche un mur ou une cible. Si elle ne touche rien, elle explose toute seule après `BULLET.LIFETIME_MS` : une balle ne reste jamais en mémoire indéfiniment.

**Dans `WorldScene`** (la base de tous les mondes, donc tous les mondes tirent) :
- `balle.png` est chargée comme un spritesheet dans `preload`, puis `createBulletAnimations` et le groupe `this.bullets` sont créés **une seule fois par visite** dans `create`.
- La scène retient la direction regardée (`this.facing`) : à l'arrêt, le joueur tire donc dans la dernière direction où il a marché.
- Une collision entre les balles et le calque `walls` appelle `explodeBullet`.
- L'action `shoot` de l'`InputManager` appelle `shoot` : `O` en mode arcade et `A` en mode pc pour le joueur 1, `Espace` pour le joueur 2 (**provisoires**).

## Les valeurs réglables

Toutes dans `src/utils/constants.js`, dans `BULLET` et `DIRECTION_VECTORS` :

| Valeur | Rôle |
|---|---|
| `BULLET.SPEED` | Vitesse de la balle, en pixels par seconde (600) |
| `BULLET.START_OFFSET` | Distance entre le joueur et l'apparition de la balle (24 px) |
| `BULLET.LIFETIME_MS` | Durée de vie maximale (1200 ms, soit environ 720 px de portée) |
| `BULLET.FLY_ANIM`, `BULLET.HIT_ANIM` | Images et vitesse des animations de vol et d'explosion |

## L'image de la balle

`assets/images/sprites/balle.png` n'est **pas une image seule** : c'est une bande de 33 images de 16 x 16 pixels (528 x 16).

| Images | Contenu | Utilisé |
|---|---|---|
| 0 à 5 | Le projectile en vol, dessiné vers la droite, avec une traînée | Oui (vol) |
| 6 à 15 | Une explosion en losange | Oui (impact) |
| 16 à 32 | Un rayon qui grandit puis s'efface | Non |

Pour tirer dans les autres directions, la balle est tournée par un quart de tour (`setRotation`), à partir de l'image dessinée vers la droite. Les images 16 à 32 pourraient servir pour une arme à rayon.

## Les cibles

Une cible est n'importe quel objet Phaser avec un corps physique. Elle peut avoir une propriété **`hitPoints`** (son nombre de vies ; 1 si elle n'en a pas). Chaque balle qui la touche lui retire une vie, et elle est détruite à zéro.

La **création** des cibles (image, place, nombre de vies) n'est pas dans ce fichier : elle revient au monde qui en a besoin (le monde 4, les boîtes), par exemple avec des objets posés dans Tiled comme les étoiles. La collision, elle, se branche en une ligne :

```js
// Dans le monde qui a des cibles, une seule fois, après avoir créé le groupe de cibles
addTargetCollision(this, this.bullets, this.targets);
```

### Les caisses (`src/systems/CrateSystem.js`)

Les cibles du jeu sont des **caisses**, posées dans Tiled. Elles bloquent le joueur comme un mur, et chaque balle qui les touche leur retire une vie.

**Dans Tiled**, dans le calque d'objets `objects` :
1. Insérer un objet **Point** (posé au centre de la caisse, comme les étoiles ; un rectangle marche aussi).
2. Lui donner la classe **`crate`**.
3. Facultatif : une propriété personnalisée **`hitPoints`** (entier) = nombre de tirs pour la casser. Sans elle, 1 tir.

**Dans le code** : `preloadCrate(scene)` dans `preload()` et `createCrates(scene, map, player, bullets)` dans `create()` (déjà fait dans `WorldScene`, donc tous les mondes en héritent : une carte sans objet `crate` n'a pas de caisse). Les réglages sont dans `CRATE` (`constants.js`) : clé de la texture, chemin de l'image (`boite1.png`, nom provisoire : il n'y a que `PATH` à changer), classe Tiled, vies par défaut.

La collision balle-caisse est celle des cibles (`addTargetCollision`).

**Les effets (VFX)** passent par `onHit`, que chaque caisse reçoit à sa création :
- un coup qui **ne casse pas** fait clignoter la caisse en blanc (`HIT_FLASH_MS`, 70 ms) ;
- le coup **fatal** projette une gerbe d'éclats de bois (des petits carrés générés par le code, colorés avec les bruns de `DEBRIS_COLORS`, qui rétrécissent puis s'éteignent) et fait légèrement trembler l'écran.

Tout se règle dans `CRATE.VFX` (`constants.js`) : couleurs, taille et nombre d'éclats, vitesse, durée, force du tremblement. L'émetteur d'éclats est détruit après usage. Une cible sans `onHit` (futurs ennemis, par exemple) marche comme avant, sans effet.

**Le premier fichier de la branche** (`fonctionCibles.js`) venait d'un jeu de plateforme (code hors de toute fonction, variables inexistantes, fonction `hit` écrite deux fois, position des cibles au hasard avec un rebond). `CrateSystem.js` le remplace.

## Ce qui reste à faire

- **Où peut-on tirer ?** Pour l'instant dans tous les mondes, pour tester. Le GDD ne prévoit le tir que pour les mondes 2 et 4 : à décider, et à limiter si besoin (par exemple avec une propriété du monde).
- **Le monde 4** : placer les caisses dans la carte, et choisir laquelle cache l'étoile (par exemple une propriété `contains` sur l'objet Tiled).
- **Des effets sonores** de coup et de casse (les effets visuels sont faits).
- **Les ennemis du monde 2** : les balles devront aussi pouvoir les toucher. `hitTarget` devrait s'y appliquer tel quel.
- Une balle qui sort de l'écran n'explose qu'à la fin de sa durée de vie : si besoin, ajouter un test de position.

## L'incident de la fusion

La fusion de `main` dans `feature/logique_tir` avait été résolue avec « accepter les deux changements » sur deux fichiers très modifiés des deux côtés : `HubScene.js` (l'ancienne scène de 170 lignes collée sous la nouvelle de 13 lignes, avec deux imports de `constants.js`, d'où l'erreur « Identifier 'SCENES' has already been declared ») et `InputManager.js` (deux tables `BINDINGS` entremêlées, erreur de syntaxe). Le jeu ne démarrait plus sur `main`. Réparé dans la branche `fix/fusion-tir` : retour aux versions de `main`, puis le tir est rebranché dans `WorldScene` au lieu de `HubScene`. Pour un fichier modifié des deux côtés, choisir **une** version, jamais les deux.

## Ce qui a été corrigé par rapport au premier fichier

Le premier `fonctionTir.js` venait d'un jeu de plateforme et plantait dès qu'on l'importait. Corrigé :
- du code écrit hors de toute fonction (`this.load.image(...)`, `if (cursors.left.isDown)`), avec des variables qui n'existent pas ;
- un mauvais chemin d'image, et `balle.png` chargée comme une image seule alors que c'est une bande de 33 images ;
- seulement deux directions (gauche et droite) au lieu de quatre, avec des animations et vitesses d'un jeu de plateforme ;
- une touche (`A`) écrite en dur, au lieu d'une action de l'`InputManager` ;
- un groupe de balles et une touche recréés à chaque tir ;
- aucune destruction des balles : elles restaient en mémoire.

## Comment tester

1. Lancer le jeu, marcher dans une direction (flèches en arcade, `Z` `Q` `S` `D` en mode pc après `Ctrl + C`), puis appuyer sur `O` (arcade) ou `A` (pc) : une balle part dans cette direction.
2. Tirer contre un mur : la balle explose en un losange bleu puis disparaît.
3. Pour essayer une cible, créer temporairement un objet avec un corps physique et une propriété `hitPoints` dans un groupe, puis appeler `addTargetCollision`.
