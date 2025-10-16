import BaseLevel from "./baseLevel.js";
import * as fct from "./fonctions.js";

/**
 * ============================================
 * SELECTION - NIVEAU HUB PRINCIPAL
 * ============================================
 * C'est la scène principale où tout commence.
 * Elle contient :
 * - Le préchargement de TOUS les assets du jeu
 * - La création des animations globales
 * - L'initialisation des statistiques du joueur
 * - Un portail de début (vers niveau2)
 * - Un portail de fin (vers bd1, nécessite 10 œufs)
 */
export class Selection extends BaseLevel {
  constructor() {
    super({
      key: "selection",
      mapKey: "map1",
      tilesetName: "Tileset SAE301",
      tilesetImage: "tileset-image",
      backgroundImage: "img_ciel",
      spawnX: 100,
      spawnY: 480,
      hasEggs: true,
      requiredEggs: 10,
      hasPortalDebut: true,
      portalDebutConfig: {
        x: 100,
        y: 450,
        nextScene: "niveau2"
      },
      portals: [
        { 
          x: 1100, 
          y: 1910, 
          nextScene: "bd1", 
          requiresEggs: true 
        }
      ]
    });
  }

  /**
   * ============================================
   * PRÉCHARGEMENT GLOBAL
   * ============================================
   * IMPORTANT : Tous les assets sont chargés ICI
   * pour éviter de les recharger dans chaque niveau
   */
    preload() {
  const baseURL = this.sys.game.config.baseURL;
  this.load.setBaseURL(baseURL);

  // Fonction helper pour charger uniquement si pas déjà en cache
  const loadIfNotExists = (type, key, path, options = null) => {
    if (!this.textures.exists(key) && !this.cache.json.exists(key)) {
      if (type === 'image') this.load.image(key, path);
      else if (type === 'spritesheet') this.load.spritesheet(key, path, options);
      else if (type === 'tilemapTiledJSON') this.load.tilemapTiledJSON(key, path);
    }
  };

  // Charger uniquement ce qui n'est pas en cache
  loadIfNotExists('image', "img_ciel", "assets/fond1.png");
  loadIfNotExists('image', "img_f", "assets/background_map3.jpg");
  loadIfNotExists('spritesheet', "img_perso", "assets/dude.png", { frameWidth: 64, frameHeight: 74 });
  loadIfNotExists('spritesheet', "img_perso_attaque", "assets/attack.png", { frameWidth: 64, frameHeight: 74 });
  loadIfNotExists('image', "coeur", "assets/coeur.png");
  loadIfNotExists('image', "potion", "assets/potion.png");
  loadIfNotExists('image', "portail2", "assets/portail2.png");
  loadIfNotExists('image', "img_porte2", "assets/portail2.png");
  loadIfNotExists('image', "oeuf", "assets/oeuf.png");
  loadIfNotExists('image', "tileset-image", "assets/tileset_map.png");
  loadIfNotExists('image', "tileset-foret", "assets/tileset_map-foret.png");
  loadIfNotExists('tilemapTiledJSON', "map1", "assets/MAP1.json");
  loadIfNotExists('tilemapTiledJSON', "map2", "assets/MAP2.json");
  loadIfNotExists('tilemapTiledJSON', "map3", "assets/MAP3.json");

  // Ennemis
  fct.preloadGoblin(this);
  fct.preloadChampignon(this);
  fct.preloadSlimes(this);
  fct.preloadDragon(this);
  fct.preloadBossDragon(this);
}

  
  /**
   * ============================================
   * CRÉATION DE LA SCÈNE
   * ============================================
   */
  create() {
    // Appeler le create de BaseLevel
    super.create();

    // ========== CRÉATION DES ANIMATIONS GLOBALES ==========
    // Ces animations sont créées UNE SEULE FOIS et utilisables partout
    
    // Animation marche gauche
    if (!this.anims.exists("anim_tourne_gauche")) {
      this.anims.create({ 
        key: "anim_tourne_gauche", 
        frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 6 }), 
        frameRate: 10, 
        repeat: -1 
      });
    }
    
    // Animation face (immobile)
    if (!this.anims.exists("anim_face")) {
      this.anims.create({ 
        key: "anim_face", 
        frames: [{ key: "img_perso", frame: 7 }], 
        frameRate: 20 
      });
    }
    
    // Animation marche droite
    if (!this.anims.exists("anim_tourne_droite")) {
      this.anims.create({ 
        key: "anim_tourne_droite", 
        frames: this.anims.generateFrameNumbers("img_perso", { start: 8, end: 14 }), 
        frameRate: 10, 
        repeat: -1 
      });
    }
    
    // Animation attaque
    if (!this.anims.exists("anim_attaque")) {
      this.anims.create({ 
        key: "anim_attaque", 
        frames: this.anims.generateFrameNumbers("img_perso_attaque", { start: 0, end: 4 }), 
        frameRate: 24, 
        repeat: 0 
      });
    }

    // ========== INITIALISATION DES STATISTIQUES GLOBALES ==========
    // Ces valeurs sont partagées entre toutes les scènes via le registry
    
    if (!this.registry.has("playerLives")) {
      this.registry.set("playerLives", 3);
    }
    if (!this.registry.has("playerPotions")) {
      this.registry.set("playerPotions", 4);
    }
    if (!this.registry.has("eggsCollected")) {
      this.registry.set("eggsCollected", 0);
    }
    // Flag pour savoir si on a déjà montré l'aide des potions
    if (!this.registry.has("potionHelpShown")) {
      this.registry.set("potionHelpShown", false);
    }

    // ========== INDICATEUR DE PROGRESSION SUR LE PORTAIL DE FIN ==========
    // Affiche combien d'œufs on a collecté (X/10)
    if (this.portalsArray && this.portalsArray[0]) {
      this.portalIndicator = this.add.text(
        this.portalsArray[0].x, 
        this.portalsArray[0].y - 50, 
        this.eggsCollected + "/10 œufs", 
        { 
          fontSize: "16px", 
          fill: this.eggsCollected >= 10 ? "#00ff00" : "#ff0000",
          backgroundColor: "#000000",
          padding: { x: 5, y: 2 }
        }
      );
      this.portalIndicator.setOrigin(0.5, 0.5);
    }
  }

  /**
   * ============================================
   * UPDATE SPÉCIFIQUE À SELECTION
   * ============================================
   * Cette méthode est appelée après l'update de BaseLevel
   */
  onLevelUpdate() {
    // Mettre à jour l'indicateur de portail en temps réel
    if (this.portalIndicator && this.portalsArray[0]) {
      this.portalIndicator.setText(this.eggsCollected + "/10 œufs");
      this.portalIndicator.setFill(this.eggsCollected >= 10 ? "#00ff00" : "#ff0000");
      
      // Suivre la caméra
      this.portalIndicator.setPosition(
        this.portalsArray[0].x,
        this.portalsArray[0].y - 50
      );
    }
  }
}

/**
 * ============================================
 * NIVEAU 1 - TUTORIEL
 * ============================================
 * Premier niveau du jeu, axé sur l'apprentissage.
 * Le joueur doit collecter 10 œufs pour débloquer le portail.
 * Contient peu d'ennemis et une musique d'ambiance.
 */
export class Niveau1 extends BaseLevel {
  constructor() {
    super({
      key: "niveau1",
      mapKey: "map1",
      tilesetName: "Tileset SAE301",
      tilesetImage: "tileset-image",
      backgroundImage: "img_ciel",
      spawnX: 100,
      spawnY: 550,
      musicKey: "musiqueMap1",
      hasEggs: true,
      requiredEggs: 10,
      portals: [
        { 
          x: 1100, 
          y: 1850, 
          nextScene: "bd1", 
          requiresEggs: true 
        }
      ]
    });
  }

  /**
   * PRÉCHARGEMENT SPÉCIFIQUE
   * Charger uniquement la musique de ce niveau
   */
  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);
    this.load.audio('musiqueMap1', 'assets/MusiqueMAP1-2.mp3');
  }

  /**
   * CRÉATION DU NIVEAU
   */
  create() {
    super.create();

    // Créer les animations si elles n'existent pas encore
    // (au cas où on arrive directement sur ce niveau sans passer par Selection)
    if (!this.anims.exists("anim_tourne_gauche")) {
      this.anims.create({ 
        key: "anim_tourne_gauche", 
        frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 6 }), 
        frameRate: 10, 
        repeat: -1 
      });
      this.anims.create({ 
        key: "anim_face", 
        frames: [{ key: "img_perso", frame: 7 }], 
        frameRate: 20 
      });
      this.anims.create({ 
        key: "anim_tourne_droite", 
        frames: this.anims.generateFrameNumbers("img_perso", { start: 8, end: 14 }), 
        frameRate: 10, 
        repeat: -1 
      });
    }

    // Créer des positions d'œufs si aucun n'est défini dans Tiled
    // (permet de tester le niveau même si la map Tiled n'est pas complète)
    if (this.eggs.getChildren().length === 0) {
      const eggPositions = [
        { x: 200, y: 300 }, { x: 350, y: 200 }, { x: 500, y: 400 }, 
        { x: 650, y: 250 }, { x: 800, y: 350 }, { x: 300, y: 500 },
        { x: 450, y: 600 }, { x: 600, y: 450 }, { x: 750, y: 550 },
        { x: 900, y: 300 }
      ];

      eggPositions.forEach(pos => {
        const egg = this.eggs.create(pos.x, pos.y, "oeuf");
        egg.setOrigin(0.5, 1);
        egg.setDisplaySize(20, 20);
        egg.setBounce(0.5);
        egg.setCollideWorldBounds(true);
      });

      // Ajouter les collisions pour les nouveaux œufs
      if (this.layers.platform_layer) {
        this.physics.add.collider(this.eggs, this.layers.platform_layer);
      }
    }
  }
}

/**
 * ============================================
 * NIVEAU 2 - ZONE INTERMÉDIAIRE
 * ============================================
 * Deuxième niveau, plus difficile que le tutoriel.
 * Contient plus d'ennemis (dragons, slimes).
 * Le portail mène vers le niveau 3.
 */
export class Niveau2 extends BaseLevel {
  constructor() {
    super({
      key: "niveau2",
      mapKey: "map2",
      tilesetName: "tileset SAE301",
      tilesetImage: "tileset-image",
      backgroundImage: "img_ciel",
      spawnX: 700,
      spawnY: 1700,
      hasEggs: false,  // Pas de collecte d'œufs dans ce niveau
      portals: []      // Le portail sera créé depuis Tiled
    });
  }

  /**
   * PRÉCHARGEMENT SPÉCIFIQUE
   */
  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);
    // Tous les assets sont déjà chargés dans Selection
  }

  /**
   * LOGIQUE SPÉCIFIQUE APRÈS LA CRÉATION
   */
  onLevelCreate() {
    // Le portail est créé automatiquement depuis Tiled
    // On lui assigne la scène lettre au lieu de niveau3
    if (this.portal) {
      this.portal.nextScene = "lettre";  // ✅ Changé de "niveau3" à "lettre"
      
      // L'ajouter au tableau des portails pour la détection
      if (!this.portalsArray) {
        this.portalsArray = [];
      }
      this.portalsArray.push(this.portal);
    }
  }
  }

/**
 * ============================================
 * NIVEAU 3 - ZONE FORÊT
 * ============================================
 * Troisième niveau, dans une forêt sombre.
 * Utilise un tileset différent (forêt).
 * Niveau le plus difficile avec de nombreux ennemis.
 * ✅ La victoire est obtenue en tuant le dragon2 (pas de portail)
 */
export class Niveau3 extends BaseLevel {
  constructor() {
    super({
      key: "niveau3",
      mapKey: "map3",
      tilesetName: "tiilesetForet",
      tilesetImage: "tileset-foret",
      backgroundImage: "img_f",
      spawnX: 100,
      spawnY: 1700,
      hasEggs: false,
      portals: []  // ✅ Plus de portail !
    });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);
  }


  hitEnemy(enemy) {
    if (!enemy.active) return;

    enemy.health -= 1;
    
    enemy.setTintFill(0xff0000);
    this.time.delayedCall(200, () => enemy.clearTint());

    const knockback = (enemy.x < this.player.x) ? -200 : 200;
    enemy.setVelocityX(knockback);

    if (enemy.health <= 0) {
      const isDragon2 = this.dragons2.contains(enemy);
      
      enemy.destroy();

      if (isDragon2 && !this.dragon2Defeated) {
        this.triggerVictory();
      }
    }
  }

  triggerVictory() {
    this.dragon2Defeated = true;

    this.player.setVelocity(0, 0);
    this.player.body.setEnable(false);

    if (this.objectiveText) {
      this.objectiveText.setVisible(false);
    }

    const victoryText = this.add.text(
      this.player.x,
      this.player.y - 100,
      "Dragon Vaincu !\nVictoire !",
      {
        fontSize: "32px",
        fill: "#0bba6eff",
        backgroundColor: "#000000",
        padding: { x: 15, y: 10 },
        align: "center"
      }
    );
    victoryText.setOrigin(0.5);

    this.tweens.add({
      targets: victoryText,
      scaleX: { from: 0.5, to: 1.2 },
      scaleY: { from: 0.5, to: 1.2 },
      duration: 500,
      yoyo: true,
      repeat: 2
    });

    if (this.sound.get('victory')) {
      this.sound.play('victory', { volume: 0.8 });
    }

    this.time.delayedCall(3000, () => {
      this.scene.start("win");
    });
  }

  onLevelUpdate() {
    if (!this.dragon2Defeated && this.dragons2.getChildren().length > 0) {
      const dragon = this.dragons2.getChildren()[0];
      if (dragon && dragon.active && this.objectiveText) {
        this.objectiveText.setText(
          `Objectif : Vaincre le Dragon Noir ! (PV: ${dragon.health})`
        );
      }
    }
  }
}
/**
 * ============================================
 * EXPORT PAR DÉFAUT
 * ============================================
 * Pour la compatibilité avec l'ancien système
 */
export default Selection;