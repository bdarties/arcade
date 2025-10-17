import * as fct from "./fonctions.js";
import Item from "./item.js";
// Ajout des imports pour les ennemis
import Enemy from "./enemy.js";
import Enemy2 from "./enemy2.js";

/***********************************************************************/
/** VARIABLES LOCALES AU NIVEAU
/***********************************************************************/
let bullets;
let shootKey;
let player2;

/***********************************************************************/
/** FONCTIONS PERSONNAGE LOCALES
/***********************************************************************/
function preloadPersonnage(scene, spriteKey = "img_perso", spriteFile = "./assets/dude.png") {
  scene.load.spritesheet(spriteKey, spriteFile, { frameWidth: 32, frameHeight: 40 });
  scene.load.image("dude_face_stop", "./assets/dude_face_stop.png");
}

function creerplayer2(scene, x, y, spriteKey = "img_perso") {
  scene.player2 = scene.physics.add.sprite(x, y, spriteKey);
  scene.player2.setCollideWorldBounds(true);
  scene.player2.setDepth(1);
  return scene.player2;
}

function creerAnimations(scene, spriteKey = "img_perso") {
  scene.anims.create({
    key: "anim_marche",
    frames: scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 4 }),
    frameRate: 10,
    repeat: -1
  });
  scene.anims.create({
    key: "anim_idle",
    frames: [{ key: spriteKey, frame: 0 }],
    frameRate: 20
  });
}

function updateplayer2(scene, background, gameOverActif = false) {
  if (gameOverActif) return;
  const player2 = scene.player2;
  const vitesseX = player2.body.velocity.x;
  const onGround = player2.body.blocked.down;

  if (background && vitesseX !== 0) background.tilePositionX += vitesseX * 0.005;

  if (fct.clavier.left.isDown) {
    player2.setVelocityX(-160);
    player2.setFlipX(false);
    player2.anims.play("anim_marche", true);
  } else if (fct.clavier.right.isDown) {
    player2.setVelocityX(160);
    player2.setFlipX(true);
    player2.anims.play("anim_marche", true);
  } else {
    player2.setVelocityX(0);
    player2.anims.stop();
    player2.setTexture("dude_face_stop");
  }

  if (scene.toucheI.isDown && onGround) {
    scene.player2.setVelocityY(-280);
  }
}

/***********************************************************************/
/** FONCTION TIR
/***********************************************************************/
function tirer(scene) {
  if (!bullets) return;
  let player2 = scene.player2;
  let bullet = bullets.get(player2.x, player2.y);
  if (bullet) {
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.body.allowGravity = false;
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;
    bullet.y = player2.y;
    bullet.setVelocityX(player2.flipX ? -400 : 400);
  }
}

/***********************************************************************/
/** SCENE NIVEAU1
/***********************************************************************/
export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  preload() {
    // --- MAP + PARALLAX ---
    this.load.tilemapTiledJSON("carte_2", "./assets/map_2.json");
    this.load.image("parallax2_arriere", "./assets/f2_arriere.png");
    this.load.image("parallax2_milieu1", "./assets/f2_milieu1.png");
    this.load.image("parallax2_milieu2", "./assets/f2_milieu2.png");
    this.load.image("parallax2_avant", "./assets/f2_avant.png");

    // --- PORTES ---
    this.load.image("porteFermee", "./assets/porte_fermee.png");
    this.load.image("porteOuverte", "./assets/porte_ouverte.png");
    this.load.audio("musique1", "./assets/musique1.mp3");

    // --- ITEMS ---
    this.load.image("objet5", "./assets/objet5.png");
    this.load.image("objet6", "./assets/objet6.png");
    this.load.spritesheet("objet7", "./assets/objet7_animation.png", { frameWidth: 32, frameHeight: 32 });

    // --- RESSOURCES DES ENNEMIS ---
    this.load.spritesheet('enemy1_run', './assets/enemy1_run.png', { frameWidth: 32, frameHeight: 24 });
    this.load.spritesheet('enemy2_run', './assets/enemy2_run.png', { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('enemy1_attack', './assets/enemy1_attack.png', { frameWidth: 32, frameHeight: 24 });
    this.load.spritesheet('enemy2_attack', './assets/enemy2_attack.png', { frameWidth: 32, frameHeight: 40 });
    this.load.image("bullet2", "./assets/bullet2.png");
    this.load.image("bullet3", "./assets/bullet3.png");

    fct.preloadCommun(this);
    preloadPersonnage(this, "img_perso", "./assets/dude2.png");
  }

  create() {
    // Nettoyer l'ancien HUD avant d'en créer un nouveau
    fct.cleanupHUD();
    if (!this.game.musiqueGlobale) {
      this.game.musiqueGlobale = this.game.sound.add('musique1', { loop: true, volume: 0.5 });
      this.game.musiqueGlobale.play();
    } else if (!this.game.musiqueGlobale.isPlaying) {
      this.game.musiqueGlobale.play();
    }

    const carteDuNiveau = this.add.tilemap("carte_2");
    const tileset = carteDuNiveau.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");
    const tileset3 = carteDuNiveau.addTilesetImage("tuiles_de_jeu3", "Phaser_tuilesdejeu3");

    const calque_background = carteDuNiveau.createLayer("calque_background", tileset);
    const calque_background3 = carteDuNiveau.createLayer("calque_background3", tileset);
    const calque_background2 = carteDuNiveau.createLayer("calque_background2", [tileset, tileset3]);
    this.ladder_layer = carteDuNiveau.createLayer("ladder_layer", tileset);
    const calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", tileset);
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    const worldWidth = carteDuNiveau.widthInPixels || 1280;
    const worldHeight = carteDuNiveau.heightInPixels || 720;
    
    // Ajout de l'animation de l'objet 7
    this.anims.create({
      key: "anim_objet7",
      frames: this.anims.generateFrameNumbers("objet7", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

    // --- ANIMATIONS ENNEMIS ---
    this.anims.create({
      key: "anim_enemy1_run",
      frames: this.anims.generateFrameNumbers("enemy1_run", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

        // Animation ennemi2
    this.anims.create({
      key: "anim_enemy2_run",
      frames: this.anims.generateFrameNumbers("enemy2_run", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });


    // --- FOND PARALLAX ---
    this.fond_arriere = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax2_arriere").setOrigin(0).setScrollFactor(0.2).setDepth(-4);
    this.fond_milieu1 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax2_milieu1").setOrigin(0).setScrollFactor(0.5).setDepth(-3);
    this.fond_milieu2 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax2_milieu2").setOrigin(0).setScrollFactor(1).setDepth(-2);
    this.fond_avant = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax2_avant").setOrigin(0).setScrollFactor(0.95).setDepth(-1);

    // --- player2 ---
    creerplayer2(this, 100, 450);
    this.player = this.player2;
    this.physics.add.collider(this.player2, calque_plateformes);
    fct.initClavier(this);
    creerAnimations(this);

    // --- GESTION DES GROUPES ---
    this.grp_items = this.physics.add.group();
    this.grp_portal = this.physics.add.group();
    this.grp_ennemis = this.physics.add.group();
    this.grp_balles_ennemis = this.physics.add.group();

    // --- GESTION DES COLLISIONS ENNEMIS ---
    this.physics.add.collider(this.grp_ennemis, calque_plateformes);
    this.physics.add.collider(this.grp_balles_ennemis, calque_plateformes, (balle) => {
      balle.destroy();
    });
    this.physics.add.overlap(this.player2, this.grp_balles_ennemis, (player, balle) => {
      balle.destroy();
      fct.perdreCoeur(this);
    });

    // --- GESTION DES TOUCHES ---
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.toucheI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // --- LECTURE DE LA CARTE ---
    const tab_objects = carteDuNiveau.getObjectLayer("object_layer")?.objects || [];
    this.spawnPoint = { x: 100, y: 450 };

    tab_objects.forEach(point => {
      if (point.name === "start") {
        this.player2.x = point.x;
        this.player2.y = point.y;
        this.spawnPoint = { x: point.x, y: point.y };
      }

      // --- GESTION DES ITEMS ---
      if (point.name === "item") {
        let itemType = "objet1"; // Type par défaut
        let itemId = null;

        if (point.properties) {
          point.properties.forEach(property => {
            if (property.name === "type") itemType = property.value;
            if (property.name === "id") itemId = property.value;
          });
        }

        const item = new Item(this, point.x, point.y, itemType, itemId);
        this.grp_items.add(item);
        
        if (itemType === "objet7") {
          item.anims.play("anim_objet7", true);
        }
      }
      
      // --- GESTION DES ENNEMIS ---
      if (point.name === "enemy_1") {
        let ennemi = new Enemy(this, point.x, point.y, calque_plateformes);
        this.grp_ennemis.add(ennemi);
        ennemi.setCollideWorldBounds(true);
        ennemi.setDepth(1);
      }

      if (point.name === "enemy_2") {
        let ennemi = new Enemy2(this, point.x, point.y, calque_plateformes);
        this.grp_ennemis.add(ennemi);
        ennemi.setCollideWorldBounds(true);
      }

      // --- GESTION DES PORTAILS ---
      if (point.name === "portal") {
        let portal_properties = {};
        point.properties.forEach(property => {
          if (property.name === "id") portal_properties.id = property.value;
          if (property.name === "target") portal_properties.target = property.value;
        });

        let portal = this.physics.add.sprite(point.x, point.y, "porteFermee");
        portal.id = portal_properties.id;
        portal.target = portal_properties.target;
        portal.ouverte = false;
        portal.setDepth(0);

        this.grp_portal.add(portal);
        portal.body.allowGravity = false;
        this.physics.add.overlap(this.player2, portal, this.portalActivation, null, this);
      }
    });

    // --- COLLISION JOUEUR / ITEMS ---
    this.physics.add.overlap(this.player2, this.grp_items, (player2, item) => {
      fct.ramasserItem(this, item);
    }, null, this);

    // --- COLLISION ENTRE JOUEUR ET HITBOX D'ATTAQUE DES ENNEMIS ---
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        this.grp_ennemis.children.iterate(ennemi => {
          if (ennemi && ennemi.attackHitbox && ennemi.attackHitbox.active) {
            const distance = Phaser.Math.Distance.Between(
              this.player2.x, this.player2.y,
              ennemi.attackHitbox.x, ennemi.attackHitbox.y
            );
            
            if (distance < 30) {
              fct.perdreCoeur(this);
              if (ennemi.attackHitbox) {
                ennemi.attackHitbox.destroy();
                ennemi.attackHitbox = null;
              }
            }
          }
        });
      }
    });

    // --- CONFIGURATION DE LA SCÈNE ET CAMÉRA ---
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player2);

    this.game.config.sceneTarget = "niveau1";

    if (this.game.config.portalTarget != null) {
      this.portalSpawning();
    }

    // --- INITIALISER LE HUD ---
    fct.initHUD_Objets(this);

    // --- GESTION DES ÉVÉNEMENTS DE LA SCÈNE ---
    this.events.on('shutdown', () => { 
      if (this.game.musiqueGlobale) {
        this.game.musiqueGlobale.stop();
        this.game.musiqueGlobale.destroy();
        this.game.musiqueGlobale = null;
      }
      console.log("shutdown scene");
      fct.cleanupHUD();
    });
    
    this.events.on('wake', () => {
      console.log('La scène niveau1 a été réactivée !');
      fct.cleanupHUD();
      fct.initHUD_Objets(this);

      if (!this.game.musiqueGlobale.isPlaying) {
        this.game.musiqueGlobale.resume();
      }
    });
  }

  update() {
    // --- MISE À JOUR DES ENNEMIS ---
    this.grp_ennemis.children.iterate(ennemi => {
      if (ennemi && ennemi.update) {
        ennemi.update(this.time.now);
      }
    });
     
    // --- OUVERTURE PORTES ---
    this.grp_portal.children.iterate(portal => {
      let dist = Phaser.Math.Distance.Between(this.player2.x, this.player2.y, portal.x, portal.y);
      if (dist < 60 && !portal.ouverte) {
        portal.setTexture("porteOuverte");
        portal.ouverte = true;
      } else if (dist >= 60 && portal.ouverte) {
        portal.setTexture("porteFermee");
        portal.ouverte = false;
      }
    });

    // ECHELLE : si joueur est sur une échelle
    const surEchelle = this.ladder_layer.getTileAtWorldXY(this.player2.x, this.player2.y);
    if (surEchelle) {
      this.player2.body.setAllowGravity(false);
      if (fct.clavier.up.isDown) this.player2.setVelocityY(-200);
      else if (fct.clavier.down.isDown) this.player2.setVelocityY(120);
      else this.player2.setVelocityY(0);
    } else {
      this.player2.body.setAllowGravity(true);
    }

    updateplayer2(this, null, fct.gameOverActif);
  }

  portalActivation(player2, portal) {
    if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
      this.game.config.portalTarget = portal.target;

      // Arrêter la musique avant de changer de scène
      if (this.game.musiqueGlobale && this.game.musiqueGlobale.isPlaying) {
        this.game.musiqueGlobale.stop();
      }

      if (portal.target == 1) {
        this.game.config.sceneTarget = "selection";
        this.scene.switch("selection");
      } else if (portal.target == 4) {
        if (fct.objets >= 7) {
          this.game.config.sceneTarget = "checkpoint2";
          this.scene.switch("checkpoint2");
        } else {
          fct.afficherMessage(this, "Vous n'avez pas tous les objets !");
        }
      }
    }
  }

  portalSpawning() {
    let portalFound = false;

    this.grp_portal.children.iterate(portal => {
      if (portal.id === this.game.config.portalTarget) {
        this.player2.x = portal.x;
        this.player2.y = portal.y;
        this.game.config.portalTarget = null;
        portalFound = true;
      }
    });

    if (!portalFound && this.spawnPoint) {
      this.player2.x = this.spawnPoint.x;
      this.player2.y = this.spawnPoint.y;
      this.game.config.portalTarget = null;
    }
  }
}