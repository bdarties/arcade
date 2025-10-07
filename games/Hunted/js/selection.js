
import * as fct from "./fonctions.js";
import Enemy from "./enemy.js";

/***********************************************************************/
/** VARIABLES LOCALES AU NIVEAU
/***********************************************************************/
let player; // joueur local à ce niveau


/***********************************************************************/
/** VARIABLES HUD
/***********************************************************************/
let coeurs = 5;
let tempsRestant = 300;
let objets = 0;
let vies = 3;

let texteTemps;
let texteObjets;
let texteVies;
let hudPerso;
let coeursImages = [];

let gameOverActif = false;

/***********************************************************************/
/** INITIALISER LE HUD
/***********************************************************************/
function initHUD(scene) {
  coeursImages = [];
  for (let i = 0; i < coeurs; i++) {
    let coeur = scene.add.image(16 + i * 40, 16, "coeur")
      .setOrigin(0, 0)
      .setScale(0.45)
      .setScrollFactor(0);
    coeursImages.push(coeur);
  }

  texteTemps = scene.add.text(320, 16, "Temps : " + tempsRestant + "s", { fontSize: "22px", fill: "#fff" }).setScrollFactor(0);
  texteObjets = scene.add.text(640, 16, " Objets : " + objets + "/5", { fontSize: "22px", fill: "#fff" }).setScrollFactor(0);
  texteVies = scene.add.text(960, 16, " " + vies + "/3", { fontSize: "22px", fill: "#fff" }).setScrollFactor(0);

  hudPerso = scene.add.image(935, 10, "dude_face").setOrigin(0, 0).setScrollFactor(0);

  scene.time.addEvent({
    delay: 1000,
    loop: true,
    callback: () => {
      if (tempsRestant > 0) {
        tempsRestant--;
        texteTemps.setText("Temps : " + tempsRestant + "s");
      } else if (!gameOverActif) {
        gameOverActif = true;
        scene.scene.launch("gameover");
      }
    }
  });
}

/***********************************************************************/
/** FONCTIONS PERSONNAGE LOCALES
/***********************************************************************/
function preloadPersonnage(scene, spriteKey = "img_perso", spriteFile = "./assets/dude.png") {
  scene.load.spritesheet(spriteKey, spriteFile, { frameWidth: 32, frameHeight: 40 });
  scene.load.image("dude_face", "./assets/dude_face.png");
  scene.load.image("dude_face_stop", "./assets/dude_face_stop.png");
}

function creerPlayer(scene, x, y, spriteKey = "img_perso") {
  scene.player = scene.physics.add.sprite(x, y, spriteKey);
  scene.player.setCollideWorldBounds(true);
  return scene.player;
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

/***********************************************************************/
/** FONCTION POUR RÉDUIRE LES CŒURS
/***********************************************************************/
function perdreCoeur(scene) {
  if (coeurs > 0) {
    coeurs--;
    if (coeursImages[coeurs]) {
      coeursImages[coeurs].destroy();
    }
    
    if (coeurs <= 0) {
      // Game Over
      if (!gameOverActif) {
        gameOverActif = true;
        scene.scene.launch("gameover");
      }
    }
  }

  // Effet de clignotement rouge
scene.player.setTint(0xff0000); // Rouge

// Séquence de clignotements
scene.time.delayedCall(100, () => scene.player.clearTint());
scene.time.delayedCall(200, () => scene.player.setTint(0xff0000));
scene.time.delayedCall(300, () => scene.player.clearTint());
scene.time.delayedCall(400, () => scene.player.setTint(0xff0000));
scene.time.delayedCall(500, () => scene.player.clearTint());
}

/***********************************************************************/
/** SCENE SELECTION
/***********************************************************************/
export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
  }

  preload() {
    this.load.tilemapTiledJSON("carte", "./assets/map_1.json");
    this.load.image("parallax_arriere", "./assets/f1_arriere.png");
    this.load.image("parallax_milieu1", "./assets/f1_milieu1.png");
    this.load.image("parallax_milieu2", "./assets/f1_milieu2.png");
    this.load.image("parallax_avant", "./assets/f1_avant.png");

    this.load.image("porteFermee", "./assets/porte_fermee.png");
    this.load.image("porteOuverte", "./assets/porte_ouverte.png");
    this.load.audio("musique1", "./assets/musique1.mp3");

    fct.preloadCommun(this);
    preloadPersonnage(this);

    this.load.spritesheet('enemy_1_run', './assets/enemy_1_run.png', { frameWidth: 64, frameHeight: 64 });
    this.load.image("bullet2", "./assets/bullet2.png");
  }

  create() {
    this.musique_de_fond = this.sound.add('musique1');
    this.musique_de_fond.play({ loop: true, volume: 0.5 });

    const carteDuNiveau = this.add.tilemap("carte");
    const tileset = carteDuNiveau.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");
    const tileset3 = carteDuNiveau.addTilesetImage("tuiles_de_jeu3", "Phaser_tuilesdejeu3");

    carteDuNiveau.createLayer("calque_background", tileset);
    carteDuNiveau.createLayer("calque_background3", tileset);
    carteDuNiveau.createLayer("calque_background2", [tileset, tileset3]);
    this.ladder_layer = carteDuNiveau.createLayer("ladder_layer", tileset);
    const calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", tileset);
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    const worldWidth = carteDuNiveau.widthInPixels || 1280;
    const worldHeight = carteDuNiveau.heightInPixels || 720;

    // DÉFINIR LES BOUNDS DU MONDE EN PREMIER !!!
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // --- FOND PARALLAX ---
    this.fond_arriere = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax_arriere").setOrigin(0).setScrollFactor(0).setDepth(-4);
    this.fond_milieu1 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax_milieu1").setOrigin(0).setScrollFactor(0).setDepth(-3);
    this.fond_milieu2 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax_milieu2").setOrigin(0).setScrollFactor(0).setDepth(-2);
    this.fond_avant = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax_avant").setOrigin(0).setScrollFactor(0).setDepth(-1);

    // --- PLAYER ---
    creerPlayer(this, 100, 450);
    this.physics.add.collider(this.player, calque_plateformes);
    this.clavier = this.input.keyboard.createCursorKeys();
    creerAnimations(this);

   initHUD(this);

   // --- GROUPE DE BALLES DES ENNEMIS ---
    this.grp_balles_ennemis = this.physics.add.group();

    // --- COLLISION BALLES ENNEMIS AVEC PLATEFORMES ---
    this.physics.add.collider(this.grp_balles_ennemis, calque_plateformes, (balle) => {
      balle.destroy();
    });

    // --- COLLISION BALLES ENNEMIS AVEC JOUEUR ---
    this.physics.add.overlap(this.player, this.grp_balles_ennemis, (player, balle) => {
      balle.destroy();
      perdreCoeur(this);
    });

    // --- PORTES ---
    this.grp_portal = this.physics.add.group();
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.spawnPoint = { x: 100, y: 450 };

    // --- ENNEMIS ---
    this.grp_ennemis = this.physics.add.group();
    creerAnimations(this);
    // Animation ennemi
    this.anims.create({
      key: "anim_enemy_1_run",
      frames: this.anims.generateFrameNumbers("enemy_1_run", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });


    const tab_objects = carteDuNiveau.getObjectLayer("object_layer")?.objects || [];


    // BOUCLE POUR LES PORTAILS
    tab_objects.forEach(point => {
      if (point.name === "start") {
        this.player.x = point.x;
        this.player.y = point.y;
        this.spawnPoint = { x: point.x, y: point.y };
      }

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

        this.grp_portal.add(portal);
        portal.body.allowGravity = false;
        portal.setDepth(47);
      }
    });

    // BOUCLE POUR LES ENNEMIS - REMPLACER CETTE PARTIE
    tab_objects.forEach(point => {
      if (point.name === "enemy_1") {
        let ennemi = new Enemy(this, point.x, point.y, calque_plateformes);  // Utiliser la classe Enemy
        this.grp_ennemis.add(ennemi);
        ennemi.setCollideWorldBounds(true);
      }
    });
    
    // COLLISION ENNEMIS AVEC PLATEFORMES
    this.physics.add.collider(this.grp_ennemis, calque_plateformes);
    this.cameras.main.startFollow(this.player);

    this.game.config.sceneTarget = "selection";

    if (this.game.config.portalTarget != null) {
    this.portalSpawning();
  }

    // --- FLAGS VICTOIRE / GAMEOVER ---
    this.victoireDejaDeclenchee = false;
    this.gameOverDejaDeclenche = false;

    // --- ARRÊT MUSIQUE ---
    this.events.on('shutdown', () => { if(this.musique_de_fond) this.musique_de_fond.stop(); });
    this.events.on('destroy', () => { if(this.musique_de_fond) this.musique_de_fond.stop(); });
  }

  update() {
    // --- PARALLAX ---
    if (this.clavier.left.isDown) {
      this.fond_arriere.tilePositionX -= 0.2;
      this.fond_milieu1.tilePositionX -= 0.5;
      this.fond_milieu2.tilePositionX -= 1;
      this.fond_avant.tilePositionX -= 1.8;
    } else if (this.clavier.right.isDown) {
      this.fond_arriere.tilePositionX += 0.2;
      this.fond_milieu1.tilePositionX += 0.5;
      this.fond_milieu2.tilePositionX += 1;
      this.fond_avant.tilePositionX += 1.8;
    }

    // --- PORTES OUVERTURE / FERMETURE ---
    this.grp_portal.children.iterate(portal => {
      let dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, portal.x, portal.y);
      if(dist < 60 && !portal.ouverte){
        portal.setTexture("porteOuverte");
        portal.ouverte = true;
      } else if(dist >= 60 && portal.ouverte){
        portal.setTexture("porteFermee");
        portal.ouverte = false;
      }

      // TELEPORTATION SI ACTION
      if(dist < 60 && Phaser.Input.Keyboard.JustDown(this.actionKey)){
        this.game.config.portalTarget = portal.target;
        this.scene.switch("niveau1");
      }
    });

    // --- MISE À JOUR DES ENNEMIS ---
    this.grp_ennemis.children.iterate(ennemi => {
      if (ennemi && ennemi.update) {
        ennemi.update(this.time.now);
      }
    });

    if(this.game.config.sceneTarget !== "selection") return;

    // --- MOUVEMENT PLAYER ---
    const vitesseX = this.player.body.velocity.x;
    const onGround = this.player.body.blocked.down;

    const surEchelle = this.ladder_layer.getTileAtWorldXY(this.player.x, this.player.y);
    if (surEchelle) {
      this.player.body.setAllowGravity(false);
      if (this.clavier.up.isDown) this.player.setVelocityY(-200);
      else if (this.clavier.down.isDown) this.player.setVelocityY(120);
      else this.player.setVelocityY(0);
    } else {
      this.player.body.setAllowGravity(true);
    }

    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.setFlipX(false);
      this.player.anims.play("anim_marche", true);
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(160);
      this.player.setFlipX(true);
      this.player.anims.play("anim_marche", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.stop();
      this.player.setTexture("dude_face_stop");
    }

    if (this.clavier.up.isDown && onGround) this.player.setVelocityY(-280);
  }

  portalSpawning() {
    let portalFound = false;
    this.grp_portal.children.iterate(portal => {
      if (portal.id === this.game.config.portalTarget) {
        this.player.x = portal.x;
        this.player.y = portal.y;
        this.game.config.portalTarget = null;
        portalFound = true;
      }
    });

    if(!portalFound && this.spawnPoint){
      this.player.x = this.spawnPoint.x;
      this.player.y = this.spawnPoint.y;
      this.game.config.portalTarget = null;
    }
  }
}

