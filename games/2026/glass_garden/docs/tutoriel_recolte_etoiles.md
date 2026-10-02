# Tutoriel : la récolte d'étoiles

**Objectif :** quand le joueur touche l'étoile d'un monde, elle disparaît et elle est **comptée**. Le jeu affiche « Étoiles : 2 / 5 », se souvient des étoiles déjà prises, et affiche « Victoire ! » quand on revient dans le jardin avec toutes les étoiles.

Ce tutoriel donne **les consignes**, pas tout le code : c'est à toi de l'écrire. Tu devras pouvoir **expliquer chaque ligne** en démo, donc prends le temps de comprendre le « pourquoi » de chaque étape.

## Avant de commencer

- Un seul changement à la fois, **un test après chaque étape**, et **un commit par étape**.
- **La console est ton meilleur ami.** Ouvre-la avec `Cmd+Option+J` dans le navigateur. Si le jeu ne bouge plus ou n'affiche plus rien, la cause est écrite en rouge dans la console, avec le fichier et le numéro de ligne.
- Les noms ci-dessous sont **exacts** : une majuscule ou une lettre en moins et l'import échoue (`isStarCollected` n'est pas `IsStarCollected`).
- Le code est en **anglais** (noms de fonctions et de variables), les commentaires en **français**, avec les étiquettes Better Comments (voir `docs/conventions.md`).
- Lance le jeu avec `python3 -m http.server 8000` puis ouvre `localhost:8000`.

## Vue d'ensemble : qui fait quoi

| Fichier | Rôle |
|---|---|
| `constants.js` | Le nombre d'étoiles pour gagner, le nom de l'image |
| `RecolteEtoiles.js` | **La mémoire** : quelles étoiles sont prises |
| `WorldScene.js` | Crée l'étoile dans le monde, détecte le contact |
| `UIScene.js` | Affiche le compteur |
| `HubScene.js` | Affiche la victoire |
| Tiled (`monde_1`) | La **position** de l'étoile |

---

## Étape 0 : remettre le jeu en état et préparer l'image

1. **Vérifie que le jeu marche** : le joueur doit bouger avec Z, Q, S, D, sans erreur dans la console. Si ce n'est pas le cas, ne continue pas : règle ça d'abord (Fetch puis Pull pour récupérer les corrections).
2. **Renomme l'image** `assets/images/sprites/Etoile.png` en `star.png` (minuscules, comme nos conventions le demandent pour les noms d'assets).

**Pourquoi :** une base qui marche permet de savoir quelle étape casse quoi. Et si on ne renomme pas l'image, le chemin utilisé plus tard sera faux.

**Test :** le jeu se lance comme avant.

---

## Étape 1 : `constants.js`

À faire dans `src/utils/constants.js` :

1. Dans l'objet **`ASSETS`**, ajouter une ligne : la clé `STAR` avec la valeur `'star'`.
2. **Sous** l'objet `ASSETS` (pas dedans), ajouter `export const STARS_TO_WIN = 5;`, avec un commentaire qui dit à quoi ça sert.

**Pourquoi :** nos conventions interdisent d'écrire les valeurs « en dur » dans le code. Le nombre `5` et le nom `'star'` sont définis ici une fois, et utilisés partout.

**Question à te poser :** pourquoi `STARS_TO_WIN` est-il écrit à l'extérieur de `ASSETS` ?

**Test :** le jeu se lance comme avant, sans erreur.

**Commit :** `feat: Ajoute les constantes des étoiles`

---

## Étape 2 : `RecolteEtoiles.js`, la mémoire

Ce fichier remplace **tout** le contenu actuel de `src/systems/RecolteEtoiles.js` (efface l'ancienne fonction `RecolteEtoiles`).

**Pourquoi un fichier à part :** une scène est **détruite et recréée à chaque téléportation**. Si le compteur était dans la scène, il repartirait à zéro. Les variables d'un fichier, elles, ne sont créées **qu'une seule fois** pour tout le jeu.

À écrire, dans cet ordre :

1. **Importer** `STARS_TO_WIN` depuis `constants.js`.
2. Une **liste vide** nommée `collectedWorlds`, déclarée avec `const`, **en dehors de toute fonction**, tout en haut du fichier. Elle contiendra les noms des mondes dont l'étoile est prise, par exemple `['world_1', 'world_3']`.
3. Quatre fonctions, chacune précédée de **`export`** (sinon les autres fichiers ne peuvent pas les utiliser) :

| Nom exact | Ce qu'elle doit faire |
|---|---|
| `isStarCollected(world)` | Renvoie **vrai** si ce monde est déjà dans la liste, **faux** sinon. |
| `collectStar(world)` | Ajoute le monde à la liste, **sauf s'il y est déjà** (pas de doublon : on ne compte jamais deux fois la même étoile). |
| `countStars()` | Renvoie le nombre d'étoiles prises. |
| `hasAllStars()` | Renvoie vrai si le nombre d'étoiles est supérieur ou égal à `STARS_TO_WIN`. |

**Indices :**
- Une liste (tableau) possède une méthode `includes` pour savoir si elle contient une valeur, une méthode `push` pour ajouter, et une propriété `length` pour compter.
- `collectStar` peut **réutiliser** `isStarCollected`.

**Questions à te poser :**
- Pourquoi retient-on **quel monde** et pas seulement un nombre ?
- Que se passerait-il si la liste était déclarée **dans** la fonction `collectStar` ?

**Test, dans la console du navigateur** (le jeu étant lancé) :

```js
const r = await import('/src/systems/RecolteEtoiles.js');
r.collectStar('world_1');
r.collectStar('world_1');   // une 2e fois, volontairement
r.countStars();             // doit afficher 1 (et pas 2)
r.isStarCollected('world_1'); // true
r.isStarCollected('world_2'); // false
```

**Commit :** `feat: Ajoute la mémoire des étoiles ramassées`

---

## Étape 3 : `WorldScene.js`, la préparation

Dans `src/scenes/WorldScene.js` :

1. **Importer** `isStarCollected` et `collectStar` depuis `'../systems/RecolteEtoiles.js'`. Comme il y a **plusieurs** fonctions exportées, l'import s'écrit avec des **accolades** (regarde comment `STARS_TO_WIN` est importé depuis `constants.js`).
2. Dans **`preload()`**, il y a une ligne fausse qui charge `srpites/Etoile.png` avec la clé du tileset. **Remplace-la** (ne la laisse pas) par un chargement d'image avec la clé `ASSETS.STAR` et le chemin `'assets/images/sprites/star.png'`.
3. Ajouter une méthode **`getWorldName()`** dans la classe, **avant** `getSpawnPosition`. Elle renvoie le nom de ce monde tel qu'il est dans la table `WORLDS` (par exemple `'world_1'`), en cherchant la clé dont la valeur est `this.scene.key` : regarde comment `update()` le fait déjà, et reprends cette idée.
4. Dans `update()`, **remplace** la ligne `const currentWorld = Object.keys(WORLDS)...` par `const currentWorld = this.getWorldName();`.

**Pourquoi :** c'est la même opération à deux endroits (téléportation et étoile) : on l'écrit **une fois** dans une méthode, on l'appelle deux fois.

**Test :** le jeu se lance, le déplacement marche, et la **téléportation fonctionne toujours** (E devant le miroir). Si elle ne marche plus, le problème est dans `getWorldName`.

**Commit :** `feat: Prépare WorldScene pour les étoiles`

---

## Étape 4 : placer l'étoile dans Tiled

Dans **Tiled**, ouvre `assets/maps/monde_1.tmx` :

1. Sélectionne le calque **`objects`**.
2. Choisis l'outil **Insérer un point** (raccourci `I`).
3. Clique **sur l'herbe**, loin des murs et du miroir.
4. Dans le panneau **Propriétés**, mets la **Classe** à **`star`** (le champ s'appelle « Type » dans les anciennes versions). Le nom de l'objet n'a pas d'importance.
5. `Cmd+S` pour enregistrer, puis **`Cmd+E` pour exporter le JSON** : le jeu lit le `.json`, pas le `.tmx`.

**Pourquoi :** on ne place pas l'étoile par des coordonnées écrites dans le code : on la pose visuellement dans la carte, comme les miroirs. Pour changer sa place, on déplace le point dans Tiled, sans toucher au code.

**Test :** ouvre `assets/maps/monde_1.json` et cherche le mot `star` : il doit apparaître dans la liste des objets.

**Commit :** `assets: Ajoute le point de l'étoile dans le monde 1`

---

## Étape 5 : `createStar(map)`, l'étoile dans le monde

Dans `WorldScene.js`, écrire une méthode **`createStar(map)`** (à placer à côté de `getWorldName`). Elle doit faire, dans cet ordre :

1. **Récupérer le nom du monde** avec `getWorldName()`.
2. **Chercher l'objet `star`** dans le calque `objects` de la carte. Tu as déjà un exemple dans le code : regarde comment le point de départ est trouvé avec `map.findObject(...)`. Pour la classe, regarde comment on teste `'mirror'`.
3. **Ne rien créer** dans **deux** cas (puis `return`) : il n'y a **pas d'objet** `star` dans cette carte (c'est le cas du jardin), **ou** l'étoile de ce monde est **déjà prise**. C'est un « ou » : une seule condition suffit.
4. **Créer le sprite** avec `this.physics.add.sprite(...)`. Les arguments sont **dans cet ordre** : la position `x` de l'objet, sa position `y`, puis la clé de l'image `ASSETS.STAR`.
5. **Déclarer le chevauchement** avec `this.physics.add.overlap(joueur, étoile, fonction)`. Dans la fonction appelée quand le joueur touche l'étoile, il faut **deux choses** : **compter l'étoile** avec `collectStar(...)`, puis la **faire disparaître** avec `star.disableBody(true, true)`. Si tu oublies la première, l'étoile disparaît mais **n'est jamais comptée**.

Ensuite, dans `create()`, **appelle** `this.createStar(map);` :
- **avec** l'argument `map` ;
- **après** la création du joueur (`this.player`) : le chevauchement a besoin que le joueur existe ;
- par exemple juste avant le commentaire « Texte d'aide ».

**Pourquoi `overlap` et pas `collider` :** un `collider` bloque le joueur contre l'objet, un `overlap` le laisse passer à travers mais prévient quand ils se touchent. Une étoile se ramasse, elle ne bloque pas.

**Questions à te poser :**
- Pourquoi le jardin n'affiche-t-il pas d'étoile alors que le code est dans `WorldScene`, qu'il utilise aussi ?
- Pourquoi vérifier `isStarCollected` **avant** de créer le sprite ?

**Test :**
1. Va dans le monde 1 (miroir du jardin) : l'étoile est **visible** à l'endroit du point.
2. Marche dessus : elle **disparaît**.
3. Dans la console : `(await import('/src/systems/RecolteEtoiles.js')).countStars()` doit afficher **1**.
4. Reviens au jardin puis retourne dans le monde 1 : l'étoile **n'est plus là**.

**Commit :** `feat: Crée l'étoile du monde depuis Tiled et la fait ramasser`

---

## Étape 6 : `UIScene.js`, le compteur

Dans `src/scenes/UIScene.js` :

1. **Importer** `countStars` depuis `RecolteEtoiles.js`, et **`STARS_TO_WIN`** en plus des constantes déjà importées de `constants.js`.
2. Dans **`create()`**, **créer** un texte `this.starText` en haut à gauche, sur le modèle de `this.timerText` (même police, même couleur, position `UI_MARGIN` sur les deux axes).
3. Dans **`update()`**, après la ligne du chrono, mettre à jour ce texte avec `setText(...)` : « Étoiles : », puis le nombre d'étoiles prises, « / », puis le total.

**Attention :** si tu écris la ligne de `update()` **sans avoir créé** `this.starText` dans `create()`, tu obtiens `TypeError` à **chaque image**, et le chronomètre s'arrête aussi de s'afficher.

**Pourquoi :** l'interface ne décide de rien, elle **montre** ce que la mémoire retient. Elle relit le compteur à chaque image.

**Test :** « Étoiles : 0 / 5 » apparaît en haut à gauche, et passe à 1 quand tu ramasses l'étoile.

**Commit :** `feat: Affiche le compteur d'étoiles dans l'interface`

---

## Étape 7 : `HubScene.js`, la victoire

Aujourd'hui, `HubScene` n'a **qu'un constructeur**. Il faut lui ajouter une méthode **`create()`**.

**Règle absolue :** la **première ligne** de ta méthode `create()` doit être **`super.create();`**. Elle exécute tout ce que fait `WorldScene` (la carte, le joueur, les miroirs). **Sans elle, le jardin s'affiche vide.**

Ensuite :
1. **Importer** `hasAllStars` depuis `RecolteEtoiles.js`.
2. Après `super.create()`, **si** `hasAllStars()` est vrai : afficher un texte « Victoire ! » au centre de l'écran, avec `this.add.text(...)`. Largeur et hauteur de l'écran : `this.scale.width` et `this.scale.height`. `.setOrigin(0.5)` centre le texte.

**Pourquoi la victoire est dans le jardin :** le GDD dit qu'il faut récupérer les étoiles **et revenir dans le monde normal**.

**Pour tester sans attendre les cinq mondes :** mets **temporairement** `STARS_TO_WIN` à `1` dans `constants.js`. Ramasse l'étoile du monde 1, reviens au jardin : « Victoire ! » apparaît. **Remets ensuite `5`** (note-le pour ne pas l'oublier).

**Pour aller plus loin (à faire plus tard) :** à la victoire, arrêter le chronomètre (`timer.stop()`) et enregistrer le temps (`saveBestTime(timer.elapsed())`). Regarde `TimerSystem.js` et `SaveSystem.js`.

**Commit :** `feat: Affiche la victoire au retour dans le jardin avec toutes les étoiles`

---

## Si ça ne marche pas

| Ce que tu vois | Cause probable |
|---|---|
| Le joueur ne bouge plus, ou le jardin est vide | Erreur dans la console. Lis le message : le nom du fichier et le numéro de ligne sont indiqués. |
| `ReferenceError: ... is not defined` | Une variable ou une fonction **n'existe pas** à cet endroit : oubli d'un `import`, faute de frappe, ou `this.` oublié. |
| `TypeError: Cannot read properties of undefined` | Tu utilises quelque chose **avant de l'avoir créé** (par exemple `this.starText` dans `update()` sans l'avoir créé dans `create()`). |
| `... does not provide an export named ...` | Le nom importé n'est pas **exactement** celui exporté (majuscule, lettre), ou il manque `export` devant la fonction. |
| Le jardin s'affiche vide | Il manque `super.create();` en première ligne de `create()` dans `HubScene`. |
| L'étoile n'apparaît pas | L'objet `star` est absent du `.json` (tu n'as pas fait `Cmd+E`), ou sa **classe** n'est pas exactement `star`, ou `createStar(map)` n'est pas appelée. |
| Un carré noir et vert à la place de l'étoile | La clé de l'image est fausse, ou l'image n'est pas chargée (chemin, nom `star.png`). |
| L'étoile disparaît mais le compteur reste à 0 | Tu as oublié `collectStar(...)` dans la fonction du chevauchement. |
| L'étoile réapparaît quand je reviens dans le monde | La condition `isStarCollected` manque au début de `createStar`. |

## Avant chaque commit

- [ ] Le jeu se lance **sans erreur dans la console**
- [ ] Le **déplacement** et la **téléportation** marchent toujours
- [ ] Les noms sont **exacts** et le code en anglais, les commentaires en français
- [ ] Pas de `console.log` de test oublié
- [ ] **Un commit par étape**, avec le message `type: Description`

## Pour t'expliquer en démo

Tu dois pouvoir répondre à ces questions sans regarder le code :
1. Pourquoi le compteur n'est-il pas dans une scène ?
2. Pourquoi retient-on les **mondes** et pas juste un nombre ?
3. Comment le jeu sait-il où poser l'étoile ?
4. Quelle différence entre `collider` et `overlap` ?
5. Pourquoi `super.create()` est-il obligatoire dans `HubScene` ?
6. Que se passe-t-il quand tu changes de monde : qu'est-ce qui est recréé, et qu'est-ce qui reste ?
