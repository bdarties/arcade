# Conventions du projet

Règles communes pour que le code reste **lisible, cohérent et sans conflits**.
Elles sont courtes exprès : si une règle n'est pas respectée, on la corrige, on ne s'en excuse pas.

> **Objectif n°1 :** chacun de nous doit pouvoir **expliquer n'importe quelle partie du code** lors de la démo.
> Donc : simple, commenté, pas de « magie ».

---

## 1. Outils obligatoires

| Outil | Statut | Pourquoi |
|---|---|---|
| **GitHub Desktop** | Conseillé pour tout le monde | Interface visuelle, évite les erreurs de commandes, même routine pour les trois |
| **VS Code** | Éditeur commun | Configuration partagée dans `.vscode/` |
| **Better Comments** (`aaron-bond.better-comments`) | **Obligatoire** | Nos commentaires suivent un format commun (voir section 6) |

### Installer Better Comments

Le dépôt contient un fichier `.vscode/extensions.json` : à la première ouverture du dossier dans VS Code, une fenêtre propose d'installer les extensions recommandées. **Il faut accepter.**

Sinon, manuellement : `Cmd+Shift+X`, chercher **Better Comments**, installer.

Les couleurs de nos étiquettes sont déjà définies dans `.vscode/settings.json` : rien à configurer.

> Un dépôt ne peut pas forcer l'installation d'une extension. La règle est donc **une règle d'équipe** : une PR dont les commentaires ne suivent pas le format sera refusée.

---

## 2. Git

### Règle d'or : une branche ne vit **jamais plus d'une journée**

- On crée sa branche le matin (ou au début de la session).
- On la **fusionne dans `main` avant la fin de la journée**.
- Une branche encore ouverte le lendemain est un signal d'alerte : la tâche était trop grosse.

**Pourquoi c'est une bonne règle :** avec trois personnes qui codent dans les mêmes dossiers, les conflits viennent presque toujours de branches qui divergent longtemps. Des branches courtes gardent `main` à jour pour tout le monde.

**Ses limites, et comment les gérer :**

| Problème | Solution |
|---|---|
| Ma tâche ne tient pas en une journée | On la **découpe** en morceaux qui se fusionnent chacun séparément (voir « Fonctionnalités partagées » ci-dessous) |
| Ce que j'ai fait est à moitié fini | On fusionne quand même **si le jeu reste jouable**. Le code non branché (pas encore appelé) est acceptable |
| `main` ne doit jamais être cassé | La règle « main toujours jouable » **prime** sur la règle d'une journée. Si c'est cassé, on découpe autrement, on ne fusionne pas |
| Personne ne relit avant ce soir | On fixe **un créneau de revue fin de journée** (par exemple 30 minutes avant d'arrêter) |

### Branches

| Branche | Rôle |
|---|---|
| `main` | Toujours **jouable**. On n'y code jamais directement. |
| `feature/<nom>` | Une fonctionnalité (`feature/deplacement-joueur`) |
| `fix/<nom>` | Correction d'un bug (`fix/collision-miroir`) |
| `assets/<nom>` | Ajout de sprites, sons, maps (`assets/sprites-monde-3`) |
| `refactor/<nom>` | Réorganiser le code sans changer son comportement (`refactor/constantes`) |
| `docs/<nom>` | Documentation, GDD, journal, conventions (`docs/audit-conventions`) |

Noms de branche : minuscules, tirets, pas d'accents.

### Routine de travail (GitHub Desktop)

1. **Fetch origin** puis **Pull** sur `main` : on part toujours à jour.
2. **Current Branch, New Branch** : on crée sa branche depuis `main`.
3. On code. On fait des commits réguliers (voir plus bas).
4. Avant de finir : on ré-intègre `main` dans sa branche (**Branch, Update from main**) et on vérifie que le jeu se lance.
5. **Push**, puis **Create Pull Request**.
6. Une autre personne relit et fusionne. On supprime la branche.

En ligne de commande, l'équivalent :

```bash
git checkout main
git pull
git checkout -b feature/xxx
# ... on code ...
git add <fichiers>
git commit -m "feat: Ajoute le déplacement du joueur"
git push -u origin feature/xxx
```

### Fonctionnalités partagées entre deux mondes

Cas typique : le **tir** existe dans le monde 2 (sur des squelettes) et dans le monde 4 (sur des boîtes), mais ne se comporte pas pareil. Deux personnes vont vouloir le modifier en même temps, chacune pour son monde.

**Ce qu'on fait :**

1. **Une seule personne possède le système partagé** (par exemple `ShootingSystem`). Elle le crée dans une branche courte, `feature/systeme-tir`, avec une version **simple et configurable** : vitesse, cadence, portée, dégâts, ce qui se passe à l'impact.
2. Cette branche est **fusionnée dans `main` le jour même**, avant que les mondes ne s'en servent.
3. Ensuite, **chaque monde part de `main`** et utilise le système **avec ses propres réglages** ou en le **prolongeant**, sans le modifier :

```js
// Monde 2 : tir rapide, détruit les squelettes
new ShootingSystem(scene, { speed: 500, cooldown: 200, onHit: (cible) => cible.mourir() });

// Monde 4 : tir lent, ouvre les boîtes
new ShootingSystem(scene, { speed: 300, cooldown: 500, onHit: (boite) => boite.ouvrir() });
```

4. **Besoin d'un changement dans le système partagé ?** On ne le fait **jamais** dans la branche de son monde. On ouvre une petite branche à part (`fix/systeme-tir-portee`), on la fusionne **en premier**, puis chacun met à jour sa branche depuis `main`.
5. Si les deux mondes divergent trop, on **sépare** : un système commun minimal, et une classe par monde qui l'étend.

**À retenir :**

- On **ne copie jamais** du code d'un monde à l'autre.
- Un comportement propre à un monde va **dans le monde**, pas dans le système partagé.
- Un système partagé a **un responsable**, indiqué dans la section « Planning et organisation » de `docs/game-design.md`. Les autres proposent, il intègre.

### Messages de commit

On suit le format **Conventional Commits** :

```
type: Description courte
```

La description est **en français**, à l'indicatif (« Ajoute… », « Corrige… »), sans point final.

| Type | Quand l'utiliser | Exemple |
|---|---|---|
| `feat` | Nouvelle fonctionnalité | `feat: Ajoute la téléportation par les miroirs` |
| `fix` | Correction d'un **bug** (quelque chose était cassé) | `fix: Corrige le joueur bloqué dans les murs` |
| `assets` | Ajout ou modification de sprites, sons, maps | `assets: Ajoute les sprites du joueur 1` |
| `docs` | Documentation, GDD, journal | `docs: Met à jour le journal du jour` |
| `refactor` | Réorganiser le code sans changer son comportement | `refactor: Déplace les touches dans InputManager` |
| `style` | Mise en forme uniquement (indentation, espaces) | `style: Corrige l'indentation de HubScene` |
| `chore` | Configuration, outillage, fichiers annexes | `chore: Ajoute la config VS Code` |

**Attention à `feat` et `fix` :** `fix` sert uniquement à corriger un bug. Ajouter quelque chose de nouveau, c'est `feat`.

Le type correspond au préfixe de la branche : `feature/...` donne des `feat:`, `fix/...` des `fix:`, `assets/...` des `assets:`, `refactor/...` des `refactor:`, `docs/...` des `docs:`.

**Écriture exacte :** le type est collé au deux-points, **sans espace avant** et avec **un espace après**.

| Bien | À éviter |
|---|---|
| `feat: Ajoute le miroir` | `feat : Ajoute le miroir` |
| `docs: Met à jour le journal` | `docs:Met à jour le journal` |

| Bien | À éviter |
|---|---|
| `feat: Ajoute l'écran de base Phaser en 1280x720` | `modifs` |
| `fix: Corrige le joueur bloqué dans les murs` | `fix` |
| `refactor: Déplace la logique de tir dans un système` | `truc du monde 2 + autre chose` |

Un commit = **une idée**. Ça compte aussi pour la note individuelle : des commits clairs, ça se voit.

---

## 3. Journal de bord

Un journal permet de retrouver **qui a fait quoi, quand**. Il alimente directement le **compte rendu du vendredi** et le **rapport final**.

### Format

**Un fichier par jour**, dans `docs/journal/`, nommé `AAAA-MM-JJ.md` (par exemple `2026-09-29.md`).

Pourquoi un fichier par jour plutôt qu'un fichier unique :

- un fichier unique devient long et provoque des **conflits** dès que deux personnes écrivent en même temps ;
- un fichier par jour se relit vite, se range tout seul par date, et se copie facilement dans un compte rendu.

### Règle

- **Chacun écrit sa propre section** dans le fichier du jour (un titre à son nom), pour éviter les conflits.
- On note **au fil de l'eau**, pas à 23 h : chaque fois qu'une chose est terminée, une ligne.
- Le journal fait partie de la **PR de fin de journée**.
- On y note aussi les **décisions** et les **blocages**, pas seulement le code.

Un modèle est disponible dans `docs/journal/_modele.md`.

---

## 4. Organisation du travail

- **Chacun a ses fichiers.** Deux personnes ne modifient pas le même fichier en même temps.
- Un fichier commun (`constants.js`, `config.js`) ? On **prévient les autres** avant, et on fait une petite PR rapide.
- Qui fait quoi est écrit dans la section « Planning et organisation » de `docs/game-design.md`, à jour.
- Une PR est **relue par au moins une autre personne** avant fusion. On garde les PR **petites**.

---

## 5. Nommage et style de code

### Fichiers et dossiers

| Type | Convention | Exemple |
|---|---|---|
| Classes (scènes, entités…) | `PascalCase.js` | `GameScene.js`, `Player.js` |
| Autres fichiers JS | `camelCase.js` | `constants.js`, `helpers.js` |
| Dossiers | `minuscules` | `scenes/`, `entities/` |
| Assets (images, sons, maps) | `snake_case` | `player_1_idle.png`, `music_monde_2.ogg` |

**Pas d'espaces, pas d'accents, pas de majuscules dans les noms d'assets.**

### Code

| Élément | Convention | Exemple |
|---|---|---|
| Classes | `PascalCase` | `class Player` |
| Variables, fonctions | `camelCase` | `playerSpeed`, `loadWorld()` |
| Constantes | `MAJUSCULES_SNAKE` | `PLAYER_SPEED`, `SCENES.HUB` |
| Fichiers de scène | suffixe `Scene` | `MenuScene.js` |

Le code est en **anglais** (noms de variables, fonctions, classes), les commentaires et commits en **français**.

### Assets : préfixer par monde

```
player_1_walk.png        # commun
tile_floor.png           # commun
mirror.png               # commun
m1_lamp.png              # monde 1
m2_skeleton.png          # monde 2
m4_box.png               # monde 4
music_hub.ogg
sfx_star.ogg
```

### Assets : où ranger quoi

| Type | Dossier | Nom | Exemple |
|---|---|---|---|
| Sprites (personnages, objets) | `assets/images/sprites/` | `<sujet>_<numéro>_<usage>.png` | `player_1_spritesheet.png` |
| Tilesets (planches de tuiles) | `assets/images/tilesets/` | `tileset_<thème>.png` | `tileset_garden.png` |
| Cartes Tiled | `assets/maps/` | `<lieu>.tmx` + `<lieu>.json` (même nom) | `hub_test.tmx`, `hub_test.json` |
| Musiques | `assets/audio/music/` | `music_<lieu>.ogg` | `music_hub.ogg` |
| Effets sonores | `assets/audio/sfx/` | `sfx_<action>.ogg` | `sfx_star.ogg` |
| Polices | `assets/fonts/` | `snake_case` | |

- Le `.tmx` est le fichier de travail de Tiled, le `.json` est celui que lit le jeu. **Les deux portent le même nom** et restent côte à côte.
- **Toute modification de la carte se termine par un export** du `.json` (`Ctrl+E` dans Tiled).
- **Les chemins dans le code sont relatifs à `index.html`** : `assets/images/sprites/player_1_spritesheet.png`, sans `/` au début ni `../`.
- Renommer un fichier utilisé par une carte casse les chemins **dans le `.tmx` et le `.json`** : on renomme toujours depuis Tiled, ou on corrige les deux fichiers.

### Style

- **JavaScript moderne** : `const` / `let` (jamais `var`), classes, `import` / `export`.
- **Un fichier = une responsabilité.** Une scène par fichier, une entité par fichier.
- **Indentation : 2 espaces.** Points-virgules partout. Guillemets simples `'...'`.
- **Fonctions courtes** : au-delà de 30 lignes environ, on découpe.
- **Pas de valeurs magiques** :

```js
// Mal
this.player.setVelocityX(160);

// Bien
this.player.setVelocityX(PLAYER_SPEED);
```

- **Pas de code mort** : pas de gros blocs commentés « au cas où ». Git s'en souvient pour nous.
- Un `console.log` de debug se retire avant la PR.

### Exemple de classe

```js
import { PLAYER_SPEED } from '../utils/constants.js';

/**
 * * Le personnage contrôlé par un joueur.
 * Il ne lit jamais les touches directement : il demande à l'InputManager.
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, playerId) {
    super(scene, x, y, `player_${playerId}`);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.playerId = playerId;
  }

  update(input) {
    // * On déplace le joueur selon la direction donnée par l'InputManager
    this.setVelocity(input.x * PLAYER_SPEED, input.y * PLAYER_SPEED);
  }
}
```

---

## 6. Commentaires : le format Better Comments

Le principe : **on commente le pourquoi, pas le quoi**, avec une **étiquette** qui indique tout de suite la nature du commentaire. Better Comments les colore.

### Les étiquettes

| Étiquette | Couleur | Utilisation |
|---|---|---|
| `// * ...` | Vert | **Explication importante** : le pourquoi, un choix technique |
| `// ! ...` | Rouge | **Attention** : piège, danger, ne pas toucher sans comprendre |
| `// ? ...` | Bleu | **Question** : à valider ou à discuter avec l'équipe |
| `// TODO(nom): ...` | Orange | **Reste à faire**, avec le nom de la personne qui s'en charge. Tant que personne n'est désigné : `TODO(équipe)` |
| `// FIXME(nom): ...` | Rose | **Bug connu** à corriger |
| `// // ...` | Gris barré | Code volontairement désactivé, **temporaire** |

Un commentaire sans étiquette est un commentaire **neutre** : il décrit ce que fait un bloc.

### Exemples

```js
// * On attend la fin du fondu avant de changer de monde, sinon l'écran clignote
this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(worldKey));

// ! Ne pas réordonner : le joueur doit être créé avant les ennemis, ils le ciblent
this.player = new Player(this, 100, 100, 1);
this.spawnEnemies();

// ? Faut-il que le tir traverse les boîtes ? À valider avec Nom
// TODO(Nom): ajouter le son de tir
// FIXME(Nom): le projectile reste bloqué dans les coins des murs
```

### Règles

- **Chaque classe et chaque système** commence par un commentaire `// *` ou `/** * ... */` qui explique son rôle.
- Les passages un peu subtils (maths, astuces Phaser) sont expliqués : on doit pouvoir les défendre à l'oral.
- On ne commente pas l'évident (`i++; // on ajoute 1`).
- Les `TODO` et `FIXME` ont **un nom** (ou `équipe` tant que personne n'est désigné, à remplacer dès qu'on prend la tâche) et sont **traités avant le rendu** : on les retrouve avec une recherche globale (`TODO(`).
- Les commentaires sont en **français**.

---

## 7. Règles propres à Glass Garden

### Les touches ne se lisent qu'à un seul endroit

Le code du jeu ne parle **jamais** de « la touche Z ». Il parle d'**actions** : `move`, `interact`, `shoot`, `lamp`, `pause`.
Seul `InputManager` sait quelle touche (ou quel bouton de borne) correspond à quelle action.
Brancher la borne d'arcade plus tard = modifier **un seul fichier**.

### Les clés et noms sont dans `constants.js`

Noms de scènes, clés d'assets, vitesses, tailles : tout est dans `src/utils/constants.js`.
Fini les fautes de frappe dans `this.load.image('plyer', ...)`.

### Les mondes partagent une base

Tout monde **étend `WorldScene`** (déplacement, collisions, étoile, sortie par le miroir) et n'ajoute que **sa mécanique**.
Si tu copies-colles du code d'un monde à l'autre, c'est qu'il doit aller dans un système commun (voir section 2).

### Le chronomètre est global

Il vit dans un **système** (`TimerSystem`), pas dans une scène. Une mort ou un redémarrage de monde **ne le remet jamais à zéro**.

### Les données ne sont pas du code

Textes de dialogues, positions, valeurs d'équilibrage : dans `src/data/` (JSON), pas écrits en dur dans les scènes.

---

## 8. Assets

Respecter les **budgets imposés** :

| Type | Limite |
|---|---|
| Image plein écran | ≤ **200 Ko** |
| Son | ≈ **16 Ko / seconde** |
| Sprite (texture ou frame) | ≈ **10 à 20 Ko** |

- **Pixel art** : export en **PNG**, sans lissage, à la taille réelle (on agrandit dans le jeu, pas dans le fichier).
- **Audio** : `.ogg` de préférence, musiques courtes et bouclables.
- **Résolution du jeu : 1280 × 720.** Tout est pensé pour cette taille.
- Un asset ajouté = **un fichier bien nommé dans le bon dossier**, référencé dans `constants.js`.
- Les sources (`.aseprite`, `.psd`, etc.) vont dans `assets/_sources/`, hors du jeu final.

---

## 9. Avant de fusionner une PR : checklist

- [ ] Le jeu **se lance** sans erreur dans la console
- [ ] La fonctionnalité **marche** comme prévu
- [ ] La branche a été **mise à jour depuis `main`**
- [ ] Pas de `console.log` de debug oublié
- [ ] Pas de valeur magique, pas de code dupliqué
- [ ] Fichiers et assets **bien nommés**
- [ ] Commentaires au **format Better Comments**, `TODO` avec un nom
- [ ] Le **journal du jour** est à jour
- [ ] **Quelqu'un d'autre a relu**
- [ ] Je saurais **expliquer ce code à l'oral**

---

## 10. Rendus et documents

- **Compte rendu de fin de semaine** : rédigé le vendredi à partir du journal (fait / bloqué / prévu).
- **Dossier de game design** (`docs/game-design.md` + PDF) : mis à jour à chaque nouvelle décision.
- **Rapport final** : on note au fil de l'eau les choix techniques importants, pour ne pas tout reconstituer à la fin.

---

*Ce document est vivant : si une règle gêne, on en discute et on la change.*
