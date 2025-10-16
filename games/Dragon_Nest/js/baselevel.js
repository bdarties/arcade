import * as fct from "./fonctions.js";

/**
 * ============================================
 * CLASSE DE BASE POUR TOUS LES NIVEAUX
 * ============================================
 * Cette classe contient TOUTE la logique commune à tous les niveaux.
 * Les niveaux enfants (Selection, Niveau1, etc.) héritent de cette classe
 * et n'ont besoin que de définir leur configuration spécifique.
 */
export default class BaseLevel extends Phaser.Scene {
  /**
   * CONSTRUCTEUR
   * @param {Object} config - Configuration du niveau
   */
  constructor(config) {
    super({ key: config.key });
    
    // Stocker la configuration du niveau
    this.levelConfig = {
      mapKey: config.mapKey,                           // Ex: "map1"
      tilesetName: config.tilesetName || "Tileset SAE301",
      tilesetImage: config.tilesetImage || "tileset-image",
      backgroundImage: config.backgroundImage || "img_ciel",
      spawnX: config.spawnX || 100,                    // Position de départ X
      spawnY: config.spawnY || 480,                    // Position de départ Y
      musicKey: config.musicKey,                       // Musique du niveau (optionnel)
      hasEggs: config.hasEggs || false,                // Ce niveau a-t-il des œufs ?
      requiredEggs: config.requiredEggs || 0,          // Nombre d'œufs requis
      portals: config.portals || [],                   // Portails manuels
      hasPortalDebut: config.hasPortalDebut || false,  // Portail de début de niveau
      portalDebutConfig: config.portalDebutConfig || null
    };
  }

  /**
   * ============================================
   * PRELOAD
   * ============================================
   * Tous les assets sont déjà chargés dans Selection
   * On initialise juste le baseURL ici
   */
  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);
  }

  /**
   * ============================================
   * CREATE
   * ============================================
   * Méthode principale appelée au démarrage de la scène
   */
  create() {
    // 1. Initialiser l'état du jeu
    this.initializeGameState();

    this.registry.set("currentLevel", this.scene.key);

    // 2. Créer le monde (map, layers, caméra)
    this.setupWorld();
    
    // 3. Créer le joueur
    this.createPlayer();
    
    // 4. Créer tous les groupes (ennemis, objets, etc.)
    this.createGroups();
    
    // 5. Créer la hitbox d'attaque
    this.createAttackHitbox();
    
    // 6. Charger les objets depuis la map Tiled
    this.loadMapObjects();
    
    // 7. Configurer tous les colliders et overlaps
    this.setupColliders();
    
    // 8. Configurer les contrôles clavier
    this.setupInput();
    
    // 9. Créer l'interface utilisateur
    this.createUI();
    
    // 10. Gérer la musique
    this.setupMusic();
    
    // Hook pour logique spécifique aux scènes enfants
    if (this.onLevelCreate) {
      this.onLevelCreate();
    }
  }

  /**
 * ============================================
 * INITIALISATION DE L'ÉTAT DU JEU
 * ============================================
 */
initializeGameState() {
  this.playerLives = this.registry.get("playerLives") ?? 3;
  this.playerPotions = this.registry.get("playerPotions") ?? 4;
  
  if (this.levelConfig.hasEggs) {
    this.eggsCollected = this.registry.get("eggsCollected") ?? 0;
  } else {
    this.eggsCollected = 0;
  }

  this.lastDamageTime = 0;
  this.damageCount = 0;
  this.lastDirection = "right";

  // Mettre à jour le registre
  this.registry.set("playerPotions", this.playerPotions);
  this.registry.set("playerLives", this.playerLives);
  this.registry.set("eggsCollected", this.eggsCollected);

  // NE PAS mettre à jour les textes ici car ils n'existent pas encore
  // Ils seront créés et initialisés dans createUI()
}



  /**
   * ============================================
   * CONFIGURATION DU MONDE (MAP, LAYERS, CAMÉRA)
   * ============================================
   */
  setupWorld() {
    // Ajouter le fond d'écran
    this.add.image(0, 0, this.levelConfig.backgroundImage)
      .setOrigin(0, 0)
      .setScrollFactor(0);

    // Charger la map depuis Tiled
    const map = this.make.tilemap({ key: this.levelConfig.mapKey });
    const tileset = map.addTilesetImage(
      this.levelConfig.tilesetName,
      this.levelConfig.tilesetImage
    );

    // Créer tous les layers (dans l'ordre d'affichage)
    this.layers = {};
    
    // Layer de décoration arrière
    const decorBackLayer = map.createLayer("decoration_back_layer", tileset, 0, 0);
    if (decorBackLayer) {
      this.layers.decoration_back_layer = decorBackLayer;
    }
    
    // Layer des plateformes (avec collisions)
    const platformLayer = map.createLayer("platform_layer", tileset, 0, 0);
    if (platformLayer) {
      this.layers.platform_layer = platformLayer;
      platformLayer.setCollisionByExclusion([-1], true);
    }
    
    // Layer de décoration avant
    const decorFrontLayer = map.createLayer("decoration_front_layer", tileset, 0, 0);
    if (decorFrontLayer) {
      this.layers.decoration_front_layer = decorFrontLayer;
    }
    
    // Layer de mort (lave, piques, etc.)
    const deathLayer = map.createLayer("death_layer", tileset, 0, 0);
    if (deathLayer) {
      this.layers.death_layer = deathLayer;
      deathLayer.setCollisionByExclusion([-1], true);
    }
    
    // Layer des échelles
    const ladderLayer = map.createLayer("ladder_layer", tileset, 0, 0);
    if (ladderLayer) {
      this.layers.ladder_layer = ladderLayer;
      this.ladderLayer = ladderLayer;
    }

    // Configurer les limites du monde physique
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    
    // Configurer les limites de la caméra
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    
    // Sauvegarder la référence à la map
    this.map = map;
  }

  /**
   * ============================================
   * CRÉATION DU JOUEUR
   * ============================================
   */
  createPlayer() {
    // Créer le sprite du joueur
    this.player = this.physics.add.sprite(
      this.levelConfig.spawnX,
      this.levelConfig.spawnY,
      "img_perso"
    );
    
    // Configurer les propriétés physiques
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.setDisplaySize(48, 55);
    this.player.body.setSize(48, 55);

    // Sauvegarder la position de spawn (pour respawn après mort)
    this.spawnX = this.player.x;
    this.spawnY = this.player.y;

    // Faire suivre le joueur par la caméra
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  /**
   * ============================================
   * CRÉATION DE TOUS LES GROUPES
   * ============================================
   */
  createGroups() {
    // Groupe général des ennemis
    this.enemies = this.physics.add.group();
    
    // Groupe des objets collectables
    this.eggs = this.physics.add.group();
    this.potions = this.physics.add.group();
    
    // Groupes spécifiques par type d'ennemi
    this.goblins = this.physics.add.group();
    this.champignons = this.physics.add.group();
    this.slimes = this.physics.add.group();
    this.dragons = this.physics.add.group();
    this.bossDragons = this.physics.add.group();
    this.dragons2 = this.physics.add.group(); // 👈 AJOUTER CETTE LIGNE

  }

  /**
   * ============================================
   * CRÉATION DE LA HITBOX D'ATTAQUE
   * ============================================
   */
  createAttackHitbox() {
    // Créer un rectangle invisible pour détecter les coups
    this.attackHitbox = this.add.rectangle(0, 0, 40, 60, 0xff0000, 0);
    this.physics.add.existing(this.attackHitbox);
    
    // Configurer la physique
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.setImmovable(true);
    
    // Désactiver par défaut
    this.attackHitbox.active = false;
    this.attackHitbox.body.enable = false;
  }

  /**
   * ============================================
   * CHARGEMENT DES OBJETS DEPUIS TILED
   * ============================================
   */
  loadMapObjects() {
    // Récupérer le layer d'objets depuis Tiled
    const objectLayer = this.map.getObjectLayer("object_layer");
    
    if (!objectLayer || !objectLayer.objects) {
      console.warn("⚠️ Aucun object_layer trouvé dans la map");
      return;
    }

    console.log(`✅ Chargement de ${objectLayer.objects.length} objets`);

    // Parcourir tous les objets de la map
    objectLayer.objects.forEach(obj => {
      switch (obj.name) {
        // === SLIMES ===
        case "slime_rouge":
        case "slime_bleu":
          const slime = fct.createSlime(this, obj.x, obj.y, obj.name);
          this.enemies.add(slime);
          this.slimes.add(slime);
          break;

        // === PETIT DRAGON ===
        case "petit_dragon":
          const dragon = fct.createDragon(this, obj.x, obj.y);
          this.enemies.add(dragon);
          this.dragons.add(dragon);
          break;

        // === BOSS DRAGON ===
        case "dragon":
        case "boss_dragon":
          const boss = fct.createBossDragon(this, obj.x, obj.y);
          this.enemies.add(boss);
          this.bossDragons.add(boss);
          break;

        // === GOBLIN ===
        case "goblin":
          const goblin = fct.createGoblin(this, obj.x, obj.y - obj.height);
          this.enemies.add(goblin);
          this.goblins.add(goblin);
          break;

        // === DRAGON2 ===
      case "dragon2":
        const dragon2 = fct.createDragon2(this, obj.x, obj.y);
        this.enemies.add(dragon2);
        this.dragons2.add(dragon2);
        break;

        // === CHAMPIGNON ===
        case "champignon":
          const champignon = fct.createChampignon(this, obj.x, obj.y - obj.height);
          this.enemies.add(champignon);
          this.champignons.add(champignon);
          break;

        // === ŒUFS (uniquement si ce niveau les utilise) ===
        case "oeuf":
          if (this.levelConfig.hasEggs) {
            this.createEgg(obj);
          }
          break;

        // === POTIONS ===
        case "potion":
          this.createPotion(obj);
          break;

        // === PORTAIL (depuis Tiled) ===
        case "portal":
        case "target":
          this.portal = this.createPortalFromTiled(obj);
          break;
      }
    });

    // Créer les portails configurés manuellement
    if (this.levelConfig.portals && this.levelConfig.portals.length > 0) {
      this.portalsArray = [];
      this.levelConfig.portals.forEach(portalConfig => {
        const portal = this.createConfiguredPortal(portalConfig);
        this.portalsArray.push(portal);
      });
    }

    // Créer le portail de début si nécessaire
    if (this.levelConfig.hasPortalDebut && this.levelConfig.portalDebutConfig) {
      this.createPortalDebut();
    }

    // Initialiser le tableau des checkpoints
  this.checkpoints = [];

  objectLayer.objects.forEach(obj => {
  if (obj.name && obj.name.startsWith("checkpoint_")) {
    // Créer une zone invisible correspondant à l'objet de Tiled
    const zone = this.add.zone(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height);
    this.physics.add.existing(zone);       // rendre physique
    zone.body.setAllowGravity(false);      // pas affecté par la gravité
    zone.body.setImmovable(true);          // ne bouge pas
    zone.activated = false;

    this.checkpoints.push(zone);

    // Overlap avec le joueur
    this.physics.add.overlap(this.player, zone, () => this.activateCheckpoint(zone), null, this);
  }
});

  }

  /**
   * ============================================
   * CRÉATION D'UN ŒUF
   * ============================================
   */
  createEgg(obj) {
    const egg = this.eggs.create(obj.x, obj.y, "oeuf");
    egg.setOrigin(0.5, 1);
    egg.setDisplaySize(20, 20);
    egg.setBounce(0.5);
    egg.setCollideWorldBounds(true);
  }

  /**
   * ============================================
   * CRÉATION D'UNE POTION
   * ============================================
   */
  createPotion(obj) {
    const potion = this.potions.create(obj.x, obj.y, "potion");
    potion.setOrigin(0.5, 1);
    potion.setDisplaySize(20, 20);
    potion.setCollideWorldBounds(true);
  }

  /**
   * ============================================
   * CRÉATION D'UN PORTAIL DEPUIS TILED
   * ============================================
   */
  createPortalFromTiled(obj) {
    const portal = this.physics.add.staticSprite(obj.x, obj.y, "portail2");
    portal.setOrigin(0.5, 1);
    portal.setScale(1.2);
    
    // Animation pulsante
    this.tweens.add({
      targets: portal,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    
    return portal;
  }

  /**
   * ============================================
   * CRÉATION D'UN PORTAIL CONFIGURÉ MANUELLEMENT
   * ============================================
   */
  createConfiguredPortal(config) {
    const portal = this.physics.add.staticSprite(config.x, config.y, "portail2");
    portal.setOrigin(0.5, 1);
    portal.setScale(config.scale || 1.2);
    
    // Propriétés du portail
    portal.nextScene = config.nextScene;
    portal.requiresEggs = config.requiresEggs || false;
    
    // Animation pulsante
    this.tweens.add({
      targets: portal,
      scaleX: (config.scale || 1.2) + 0.2,
      scaleY: (config.scale || 1.2) + 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    return portal;
  }

  /**
   * ============================================
   * CRÉATION DU PORTAIL DE DÉBUT
   * ============================================
   */
  createPortalDebut() {
    const config = this.levelConfig.portalDebutConfig;
    this.portailDebut = this.physics.add.staticSprite(config.x, config.y, "portail2");
    this.portailDebut.setOrigin(0.5, 1);
    this.portailDebut.setScale(1.2);
    this.portailDebut.nextScene = config.nextScene;
    
    // Animation
    this.tweens.add({
      targets: this.portailDebut,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * ============================================
   * CONFIGURATION DE TOUS LES COLLIDERS
   * ============================================
   */
  setupColliders() {
    const platform = this.layers.platform_layer;
    const death = this.layers.death_layer;

    // === COLLISIONS AVEC LES PLATEFORMES ===
    if (platform) {
      this.physics.add.collider(this.player, platform);
      this.physics.add.collider(this.enemies, platform);
      this.physics.add.collider(this.eggs, platform);
      this.physics.add.collider(this.potions, platform);
      
      // Collisions spécifiques par type d'ennemi
      this.physics.add.collider(this.goblins, platform);
      this.physics.add.collider(this.champignons, platform);
      this.physics.add.collider(this.slimes, platform);
      this.physics.add.collider(this.dragons, platform);
    }

          // Collisions avec plateformes (si nécessaire)
    this.physics.add.collider(this.dragons2, platform);

    // Overlap pour l'attaque du joueur
    this.physics.add.overlap(this.attackHitbox, this.dragons2, (hitbox, d) => {
        if (this.attackHitbox.active) {
            this.hitEnemy(d);
        }
    });

    // Overlap pour les dégâts au joueur
    this.physics.add.overlap(this.player, this.dragons2, (p, dragon) => {
        this.takeDamage(dragon.damage || 4);
        const knockback = (p.x < dragon.x) ? -200 : 200;
        p.setVelocityX(knockback);
    });

    // === COLLISIONS AVEC LA DEATH LAYER ===
    if (death) {
      // Le joueur prend des dégâts
    this.physics.add.collider(this.player, death, () => this.instantDeath()); 

      // Les ennemis ne tombent pas dans le vide
      this.physics.add.collider(this.enemies, death);
      this.physics.add.collider(this.goblins, death);
      this.physics.add.collider(this.champignons, death);
      this.physics.add.collider(this.slimes, death);
      this.physics.add.collider(this.dragons, death);
      this.physics.add.collider(this.bossDragons, death);
    }

    // === OVERLAPS POUR L'ATTAQUE DU JOUEUR ===
    this.physics.add.overlap(this.attackHitbox, this.enemies, (hitbox, enemy) => {
      if (this.attackHitbox.active) {
        this.hitEnemy(enemy);
      }
    });
    this.physics.add.overlap(this.attackHitbox, this.goblins, (hitbox, gob) => {
      if (this.attackHitbox.active) {
        this.hitEnemy(gob);
      }
    });
    this.physics.add.overlap(this.attackHitbox, this.champignons, (hitbox, c) => {
      if (this.attackHitbox.active) {
        this.hitEnemy(c);
      }
    });
    this.physics.add.overlap(this.attackHitbox, this.slimes, (hitbox, s) => {
      if (this.attackHitbox.active) {
        this.hitEnemy(s);
      }
    });
    this.physics.add.overlap(this.attackHitbox, this.dragons, (hitbox, d) => {
      if (this.attackHitbox.active) {
        this.hitEnemy(d);
      }
    });
    this.physics.add.overlap(this.attackHitbox, this.bossDragons, (hitbox, b) => {
      if (this.attackHitbox.active) {
        this.hitEnemy(b);
      }
    });

    // === OVERLAPS POUR LES DÉGÂTS DES ENNEMIS ===
    this.physics.add.overlap(this.player, this.enemies, (p, enemy) => {
      this.takeDamage(enemy.damage || 1);
      const knockback = (p.x < enemy.x) ? -200 : 200;
      p.setVelocityX(knockback);
    });
    this.physics.add.overlap(this.player, this.goblins, (p, gob) => {
      this.takeDamage(gob.damage || 1);
      const knockback = (p.x < gob.x) ? -200 : 200;
      p.setVelocityX(knockback);
    });
    this.physics.add.overlap(this.player, this.champignons, (p, champi) => {
      this.takeDamage(champi.damage || 1);
      const knockback = (p.x < champi.x) ? -200 : 200;
      p.setVelocityX(knockback);
    });
    this.physics.add.overlap(this.player, this.slimes, (p, slime) => {
      this.takeDamage(slime.damage || 1);
      const knockback = (p.x < slime.x) ? -200 : 200;
      p.setVelocityX(knockback);
    });

    this.physics.add.overlap(this.player, this.dragons, (p, dragon) => {
      this.takeDamage(dragon.damage || 1);
      const knockback = (p.x < dragon.x) ? -200 : 200;
      p.setVelocityX(knockback);
    });
    this.physics.add.overlap(this.player, this.bossDragons, (p, boss) => {
      this.takeDamage(boss.damage || 1);
      const knockback = (p.x < boss.x) ? -200 : 200;
      p.setVelocityX(knockback);
    });

    // === OVERLAPS POUR LA COLLECTE D'OBJETS ===
    this.physics.add.overlap(
      this.player, 
      this.eggs, 
      (player, egg) => this.collectEgg(player, egg), 
      null, 
      this
    );
    this.physics.add.overlap(
      this.player, 
      this.potions, 
      (player, potion) => this.collectPotion(player, potion), 
      null, 
      this
    );
  }

  /**
   * ============================================
   * CONFIGURATION DES CONTRÔLES CLAVIER
   * ============================================
   */
  setupInput() {
    // Touches de déplacement (flèches)
    this.clavier = this.input.keyboard.createCursorKeys();
    
    // Touche d'attaque (O)
    this.toucheAttaque = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    
    // Touche pour activer les portails (I)
    this.touchePortail = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
  }

  /**
   * ============================================
   * CRÉATION DE L'INTERFACE UTILISATEUR
   * ============================================
   */
  createUI() {
    // === CONTENEUR DES VIES ===
    this.lifeText = this.add.text(35, 0, "Vies: " + this.playerLives, { 
      fontSize: "28px", 
      fill: "#ff4d4d" 
    });
    this.lifeIcon = this.add.image(0, 15, "coeur")
      .setOrigin(0, 0.5)
      .setDisplaySize(30, 30);
    this.lifeContainer = this.add.container(20, 20, [this.lifeIcon, this.lifeText])
      .setScrollFactor(0);

    // === CONTENEUR DES POTIONS ===
    this.potionText = this.add.text(35, 0, "Potions: " + this.playerPotions, { 
      fontSize: "24px", 
      fill: "#4da6ff" 
    });
    this.potionIcon = this.add.image(0, 15, "potion")
      .setOrigin(0, 0.5)
      .setDisplaySize(20, 20);
    this.potionContainer = this.add.container(20, 60, [this.potionIcon, this.potionText])
      .setScrollFactor(0);

    // === CONTENEUR DES ŒUFS (si nécessaire) ===
    if (this.levelConfig.hasEggs) {
      this.eggsText = this.add.text(
        35, 
        0, 
        `Oeufs: ${this.eggsCollected}/${this.levelConfig.requiredEggs}`, 
        { 
          fontSize: "24px", 
          fill: "#ffeb3b" 
        }
      );
      this.eggsIcon = this.add.image(0, 15, "oeuf")
        .setOrigin(0, 0.5)
        .setDisplaySize(20, 20);
      this.eggsContainer = this.add.container(20, 100, [this.eggsIcon, this.eggsText])
        .setScrollFactor(0);

      // === MESSAGE D'ERREUR (pas assez d'œufs) ===
      this.errorText = this.add.text(
        400, 
        300, 
        `Vous n'avez pas récolté tous les oeufs (${this.levelConfig.requiredEggs} requis)`, 
        {
          fontSize: "24px",
          fill: "#ff0000",
          backgroundColor: "#000000",
          padding: { x: 10, y: 5 }
        }
      );
      this.errorText.setVisible(false);
      this.errorText.setScrollFactor(0);
      this.errorText.setOrigin(0.5, 0.5);
    }

    // === MESSAGE D'AIDE POUR LES POTIONS ===
    // Affiché uniquement la première fois qu'on collecte une potion
    if (!this.registry.get("potionHelpShown")) {
    const { width, height } = this.sys.game.config; // récupère la taille du canvas

    this.potionHelpText = this.add.text(
        width / 2,             // centre horizontal
        height - 50,           // 50px depuis le bas
        "Les potions sont vos sous-vies : elles vous protègent des coups, mais si vous les perdez toutes, vous perdez une vie.",
        {
            fontSize: "20px",
            fill: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 15, y: 10 },
            align: "center",
            wordWrap: { width: 600 }
        }
    );

    this.potionHelpText.setVisible(false);
    this.potionHelpText.setScrollFactor(0);
    this.potionHelpText.setOrigin(0.5, 1); // origine en bas-centre
}

  }

  /**
   * ============================================
   * GESTION DE LA MUSIQUE
   * ============================================
   */
  setupMusic() {
    if (!this.levelConfig.musicKey) return;
    
    // Créer l'objet globals si nécessaire
    if (!this.sys.game.globals) {
      this.sys.game.globals = {};
    }
    
    // Arrêter toutes les autres musiques
    Object.keys(this.sys.game.globals).forEach(key => {
      if (key.startsWith("musique") && key !== this.levelConfig.musicKey) {
        const music = this.sys.game.globals[key];
        if (music && music.stop) {
          music.stop();
        }
      }
    });

    // Démarrer la musique du niveau si pas déjà en cours
    if (!this.sys.game.globals[this.levelConfig.musicKey]) {
      this.sys.game.globals[this.levelConfig.musicKey] = this.sound.add(
        this.levelConfig.musicKey, 
        { loop: true, volume: 0.5 }
      );
      this.sys.game.globals[this.levelConfig.musicKey].play();
    }
  }

  /**
   * ============================================
   * COLLECTE D'UN ŒUF
   * ============================================
   */
  collectEgg(player, egg) {
    // Désactiver l'œuf
    egg.disableBody(true, true);
    
    // Incrémenter le compteur
    this.eggsCollected++;
    this.registry.set("eggsCollected", this.eggsCollected);
    
    // Mettre à jour l'affichage
    if (this.eggsText) {
      this.eggsText.setText(`Oeufs: ${this.eggsCollected}/${this.levelConfig.requiredEggs}`);
    }
    
    // Mettre à jour l'indicateur de portail si présent
    if (this.portalIndicator) {
      this.portalIndicator.setText(`${this.eggsCollected}/${this.levelConfig.requiredEggs} œufs`);
      this.portalIndicator.setFill(
        this.eggsCollected >= this.levelConfig.requiredEggs ? "#00ff00" : "#ff0000"
      );
    }

    // Animation de collecte
    this.tweens.add({
      targets: egg,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => egg.destroy()
    });
  }

  /**
   * ============================================
   * COLLECTE D'UNE POTION
   * ============================================
   */
  collectPotion(player, potion) {
    console.log("Potion collectée !"); // Debug
    
    // Désactiver la potion
    potion.disableBody(true, true);
    
    // Incrémenter le compteur
    this.playerPotions += 1;
    this.registry.set("playerPotions", this.playerPotions);
    this.potionText.setText("Potions: " + this.playerPotions);

    // Afficher le message d'aide si c'est la première potion
    if (!this.registry.get("potionHelpShown") && this.potionHelpText) {
      console.log("Affichage du message d'aide potion"); // Debug
      this.registry.set("potionHelpShown", true);
      this.potionHelpText.setVisible(true);
      
      // Masquer après 8 secondes
      this.time.delayedCall(8000, () => {
        this.potionHelpText.setVisible(false);
      });
    }
  }

  /**
   * ============================================
   * PRENDRE DES DÉGÂTS
   * ============================================
   */
 takeDamage(damageAmount = 1) {
  const now = this.time.now;
  if (!this.lastDamageTime) this.lastDamageTime = 0;
  if (now - this.lastDamageTime < 1000) return;
  this.lastDamageTime = now;

  // Joue le son de dégâts
  this.sound.play("degat", { volume: 1 });

  
  // Effet visuel
  this.player.setTintFill(0xffffff);
  this.time.delayedCall(200, () => this.player.clearTint());

  // Si le joueur a encore des potions, elles absorbent les dégâts
  if (this.playerPotions > 1) {
    this.playerPotions -= 1;
    this.registry.set("playerPotions", this.playerPotions);
    if (this.potionText) this.potionText.setText("Potions: " + this.playerPotions);
    return;
  }

  // Sinon, perte d'une vie
  this.playerLives -= 1;
  this.registry.set("playerLives", this.playerLives);
  if (this.lifeText) this.lifeText.setText("Vies: " + this.playerLives);

  // Si plus de vies → Game Over
  if (this.playerLives <= 0) {
    this.registry.set("eggsCollected", 0);
    this.scene.start("gameover");
    return;
  }

  // ✅ Cas spécial : Niveau 2 → pas de respawn, juste recharge de potions
  if (this.scene.key === "niveau2") {
    this.playerPotions = 4;
    this.registry.set("playerPotions", this.playerPotions);
    if (this.potionText) this.potionText.setText("Potions: " + this.playerPotions);

    // petit feedback visuel
    const msg = this.add.text(this.player.x, this.player.y - 40, "-1 vie, fuyez !", {
      fontSize: "16px",
      fill: "#ff0000ff",
      backgroundColor: "#000000",
      padding: { x: 5, y: 5 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      alpha: { from: 1, to: 0 },
      duration: 2000,
      onComplete: () => msg.destroy()
    });
    return;
  }

  // 🔄 Autres niveaux : respawn normal
  this.playerPotions = 4;
  this.registry.set("playerPotions", this.playerPotions);
  if (this.potionText) this.potionText.setText("Potions: " + this.playerPotions);
  this.player.setPosition(this.spawnX, this.spawnY);
  this.player.setVelocity(0, 0);
}




  /**
   * ============================================
   * FRAPPER UN ENNEMI
   * ============================================
   */
  hitEnemy(enemy) {
    // Vérifier que l'ennemi est actif
    if (!enemy.active) return;

    // Réduire la vie de l'ennemi
    enemy.health -= 1;
    
    // Effet visuel de dégâts
    enemy.setTintFill(0xff0000);
    this.time.delayedCall(200, () => enemy.clearTint());

    // Knockback (repousser l'ennemi)
    const knockback = (enemy.x < this.player.x) ? -200 : 200;
    enemy.setVelocityX(knockback);

    // Si l'ennemi n'a plus de vie, le détruire
    if (enemy.health <= 0) {
      enemy.destroy();
    }
  }

  /**
   * ============================================
   * UPDATE (appelée à chaque frame)
   * ============================================
   */
  update() {
    // Vérifier si le joueur est en train d'attaquer
    const isAttacking = this.player.anims.currentAnim && 
      this.player.anims.currentAnim.key === "anim_attaque" && 
      this.player.anims.isPlaying;

    // Gérer l'attaque
    if (Phaser.Input.Keyboard.JustDown(this.toucheAttaque) && !isAttacking) {
      this.performAttack();
      return; // Ne pas gérer le mouvement pendant l'attaque
    }

    // Gérer le mouvement
    this.handleMovement(isAttacking);

    // Mettre à jour l'IA de tous les ennemis
    this.updateEnemies();

    // Vérifier les portails
    this.checkPortals();

    // Hook pour update spécifique aux niveaux enfants
    if (this.onLevelUpdate) {
      this.onLevelUpdate();
    }
    
  }

  

  /**
 * ============================================
 * MORT INSTANTANÉE (piques, lave, vide, etc.)
 * ============================================
 */
instantDeath() {
  // Retirer une vie
  this.playerLives -= 1;
  this.registry.set("playerLives", this.playerLives);
  if (this.lifeText) this.lifeText.setText("Vies: " + this.playerLives);

  // Joue le son de dégâts
  this.sound.play("degat", { volume: 1 });

  // Si le joueur n’a plus de vie → Game Over
  if (this.playerLives <= 0) {
    this.registry.set("eggsCollected", 0);
    this.scene.start("gameover");
    return;
  }

  // ✅ Cas spécial : Niveau 2 → pas de respawn, juste continuation
  if (this.scene.key === "niveau2") {
    this.playerPotions = 4;
    this.registry.set("playerPotions", this.playerPotions);
    if (this.potionText) this.potionText.setText("Potions: " + this.playerPotions);

    const msg = this.add.text(this.player.x, this.player.y - 40, "-1 vie, attention !", {
      fontSize: "16px",
      fill: "#ff2600ff",
      backgroundColor: "#000000",
      padding: { x: 5, y: 5 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      alpha: { from: 1, to: 0 },
      duration: 2000,
      onComplete: () => msg.destroy()
    });
    return;
  }

  // 🔁 Autres niveaux : respawn normal
  this.playerPotions = 4;
  this.registry.set("playerPotions", this.playerPotions);
  if (this.potionText) this.potionText.setText("Potions: " + this.playerPotions);
  this.player.setPosition(this.spawnX, this.spawnY);
  this.player.setVelocity(0, 0);
}


  /**
   * ============================================
   * EFFECTUER UNE ATTAQUE
   * ============================================
   */
  performAttack() {
    // Arrêter le mouvement
    this.player.setVelocityX(0);
    
    // Orienter le joueur
    this.player.setFlipX(this.lastDirection === "right");
    
    // Jouer l'animation d'attaque
    this.player.anims.play("anim_attaque", true);

    // Positionner la hitbox devant le joueur
    const offsetX = (this.lastDirection === "right") ? 40 : -40;
    this.attackHitbox.setPosition(this.player.x + offsetX, this.player.y);
    
    // Jouer le son d'épée
    this.sound.play('sword', { volume: 0.3 });

    // Activer la hitbox
    this.attackHitbox.active = true;
    this.attackHitbox.body.enable = true;

    // Désactiver la hitbox après 200ms
    this.time.delayedCall(200, () => {
      this.attackHitbox.active = false;
      this.attackHitbox.body.enable = false;
    });
  }

 /* 
============================================
JOUER LE SON DE SAUT
============================================*/
playJumpSound() {
  this.sound.play('jump', { volume: 0.8 });
}

  /**
   * ============================================
   * GÉRER LE MOUVEMENT DU JOUEUR
   * ============================================
   */
  handleMovement(isAttacking) {
    // Vérifier si le joueur est sur une échelle
    let isOnLadder = false;
    if (this.ladderLayer) {
      const tile = this.ladderLayer.getTileAtWorldXY(
        this.player.x, 
        this.player.y, 
        true
      );
      if (tile && tile.index !== -1) {
        isOnLadder = true;
      }
    }

    // Mouvement sur échelle
    if (isOnLadder) {
      this.handleLadderMovement();
    } 
    // Mouvement normal (si pas en train d'attaquer)
    else if (!isAttacking) {
      this.handleNormalMovement();
    }
  }

  /**
   * ============================================
   * MOUVEMENT SUR ÉCHELLE
   * ============================================
   */
  handleLadderMovement() {
    // Désactiver la gravité sur les échelles
    this.player.body.setAllowGravity(false);

    // Mouvement vertical
    if (this.clavier.up.isDown) {
      this.player.setVelocityY(-200);
    } else if (this.clavier.down.isDown) {
      this.player.setVelocityY(100);
    } else {
      this.player.setVelocityY(0);
    }

    // Mouvement horizontal sur l'échelle
    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-100);
      this.player.anims.play("anim_tourne_gauche", true);
      this.lastDirection = "left";
      this.player.setFlipX(false);
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(100);
      this.player.anims.play("anim_tourne_droite", true);
      this.lastDirection = "right";
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("anim_face", true);
      this.player.setFlipX(this.lastDirection === "left");
    }
  }

  /**
   * ============================================
   * MOUVEMENT NORMAL (AU SOL)
   * ============================================
   */
  handleNormalMovement() {
    // Saut (uniquement si au sol)
  if (this.clavier.up.isDown && this.player.body.blocked.down) {
    this.player.setVelocityY(-480);
    this.playJumpSound();
  }
    // Réactiver la gravité
    this.player.body.setAllowGravity(true);

    // Mouvement gauche
    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-200);
      this.player.anims.play("anim_tourne_gauche", true);
      this.lastDirection = "left";
      this.player.setFlipX(false);
    } 
    // Mouvement droite
    else if (this.clavier.right.isDown) {
      this.player.setVelocityX(200);
      this.player.anims.play("anim_tourne_droite", true);
      this.lastDirection = "right";
      this.player.setFlipX(false);
    } 
    // Arrêt
    else {
      this.player.setVelocityX(0);
      this.player.anims.play("anim_face", true);
      this.player.setFlipX(this.lastDirection === "left");
    }

    // Saut (uniquement si au sol)
    if (this.clavier.up.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-480);
    }
  }

  /**
   * ============================================
   * METTRE À JOUR L'IA DE TOUS LES ENNEMIS
   * ============================================
   */
  updateEnemies() {
    // Mettre à jour les goblins
    this.goblins.getChildren().forEach(g => {
      fct.updateGoblin(g, this.player, this);
    });
    
    // Mettre à jour les champignons
    this.champignons.getChildren().forEach(c => {
      fct.updateChampignon(c, this.player, this);
    });
    
    // Mettre à jour les slimes
    this.slimes.getChildren().forEach(s => {
      fct.updateSlime(s, this.player, this);
    });
    
    // Mettre à jour les dragons
    this.dragons.getChildren().forEach(d => {
      fct.updateDragon(d, this.player, this);
    });
      
      // Mettre à jour les dragons2
this.dragons2.getChildren().forEach(d => {
    fct.updateDragon2(d, this.player, this);
});

    // Mettre à jour les boss dragons
    this.bossDragons.getChildren().forEach(b => {
    fct.updateBossDragon(b, this.player, this);
  });
  }

  /**
   * ============================================
   * VÉRIFIER LES PORTAILS
   * ============================================
   */
  checkPortals() {
    // La touche I doit être pressée
    if (!Phaser.Input.Keyboard.JustDown(this.touchePortail)) return;

    // Vérifier le portail de début (si présent)
    if (this.portailDebut && this.physics.overlap(this.player, this.portailDebut)) {
      console.log("Portail début activé - passage au niveau suivant");
      this.scene.start(this.portailDebut.nextScene);
      return;
    }

    // Vérifier les portails configurés manuellement
    if (this.portalsArray) {
      for (let portal of this.portalsArray) {
        if (this.physics.overlap(this.player, portal)) {
          // Vérifier si ce portail nécessite des œufs
          if (portal.requiresEggs && this.eggsCollected < this.levelConfig.requiredEggs) {
            // Afficher le message d'erreur
            if (this.errorText) {
              this.errorText.setVisible(true);
              this.time.delayedCall(2000, () => {
                this.errorText.setVisible(false);
              });
            }
          } else {
            // Passer au niveau suivant
            this.scene.start(portal.nextScene);
          }
          return;
        }
      }
    }

    // Vérifier le portail depuis Tiled (si présent)
    if (this.portal && this.physics.overlap(this.player, this.portal)) {
      if (this.portal.nextScene) {
        this.scene.start(this.portal.nextScene);
      }
    }
  }

// ==========================
// CRÉER LES CHECKPOINTS (ZONE)
// ==========================
createCheckpoints(objectLayer) {
    this.checkpoints = [];

    objectLayer.objects.forEach(obj => {
        if (obj.name && obj.name.startsWith("checkpoint_")) {
            // Zone invisible pour le checkpoint
            const zone = this.add.zone(obj.x + obj.width/2, obj.y + obj.height/2, obj.width, obj.height);
            this.physics.add.existing(zone);
            zone.body.setAllowGravity(false);
            zone.body.setImmovable(true);
            zone.activated = false;

            this.checkpoints.push(zone);

            // Collision joueur ↔ zone
            this.physics.add.overlap(this.player, zone, () => this.activateCheckpoint(zone), null, this);
        }
    });
}

// ==========================
// ACTIVATION D’UN CHECKPOINT
// ==========================
activateCheckpoint(zone) {
    if (zone.activated) return;

    // Désactiver tous les autres checkpoints
    this.checkpoints.forEach(cp => cp.activated = false);
    zone.activated = true;

    // Sauvegarder le respawn au centre de la zone
    this.spawnX = zone.body.x + zone.body.width / 2;
    this.spawnY = zone.body.y + zone.body.height / 2;
    this.registry.set("lastCheckpoint", { x: this.spawnX, y: this.spawnY });

    // Afficher le texte au-dessus du joueur
    const text = this.add.text(this.player.x, this.player.y - 40, "Checkpoint !", {
        fontSize: "18px",
        fill: "#00ff00",
        backgroundColor: "#000000",
        padding: { x: 5, y: 5 }
    }).setOrigin(0.5);

    // Le texte suit le joueur et disparaît en fondu
    this.tweens.add({
        targets: text,
        y: text.y - 40,
        alpha: { from: 1, to: 0 },
        duration: 1500,
        onUpdate: () => { text.x = this.player.x; },
        onComplete: () => text.destroy()
    });
}


}