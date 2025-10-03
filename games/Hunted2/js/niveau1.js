import * as fct from "./fonctions.js";

/***********************************************************************/
/** VARIABLES LOCALES AU NIVEAU
/***********************************************************************/
let bullets;
let shootKey;
let player2;

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

function creerplayer2(scene, x, y, spriteKey = "img_perso") {
  scene.player2 = scene.physics.add.sprite(x, y, spriteKey);
  scene.player2.setCollideWorldBounds(true);
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

  if (fct.clavier.up.isDown && onGround) player2.setVelocityY(-280);
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

    fct.preloadCommun(this);
    preloadPersonnage(this, "img_perso", "./assets/dude2.png");
  }

  create() {
    this.musique_de_fond = this.sound.add('musique1');
    this.musique_de_fond.play({ loop: true, volume: 0.5 });

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

    // --- FOND PARALLAX ---
    this.fond_arriere = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax2_arriere").setOrigin(0).setScrollFactor(0).setDepth(-4);
    this.fond_milieu1 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax2_milieu1").setOrigin(0).setScrollFactor(0).setDepth(-3);
    this.fond_milieu2 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax2_milieu2").setOrigin(0).setScrollFactor(0).setDepth(-2);
    this.fond_avant = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax2_avant").setOrigin(0).setScrollFactor(0).setDepth(-1);

    // --- player2 ---
    creerplayer2(this, 100, 450);
    this.physics.add.collider(this.player2, calque_plateformes);
    fct.initClavier(this);
    creerAnimations(this);

    initHUD(this);

   

    // --- PORTAILS ---
    this.grp_portal = this.physics.add.group();
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    const tab_objects = carteDuNiveau.getObjectLayer("object_layer")?.objects || [];
    this.spawnPoint = { x: 100, y: 450 };

    tab_objects.forEach(point => {
      if (point.name === "start") {
        this.player2.x = point.x;
        this.player2.y = point.y;
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
        this.physics.add.overlap(this.player2, portal, this.portalActivation, null, this);
      }
    });

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player2);

    this.game.config.sceneTarget = "niveau1";

    if (this.game.config.portalTarget != null) {
    this.portalSpawning();
  }
  }

  update() {
    // --- PARALLAX ---
    const speedLeft = fct.clavier.left.isDown;
    const speedRight = fct.clavier.right.isDown;

    if (speedLeft) {
      this.fond_arriere.tilePositionX -= 0.2;
      this.fond_milieu1.tilePositionX -= 0.5;
      this.fond_milieu2.tilePositionX -= 1;
      this.fond_avant.tilePositionX -= 1.8;
    } else if (speedRight) {
      this.fond_arriere.tilePositionX += 0.2;
      this.fond_milieu1.tilePositionX += 0.5;
      this.fond_milieu2.tilePositionX += 1;
      this.fond_avant.tilePositionX += 1.8;
    }


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

    // if (this.game.config.sceneTarget !== "niveau1") return;
    // if (this.game.config.portalTarget != null) this.portalSpawning();

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

      if (portal.target == 1) {
        this.game.config.sceneTarget = "selection";
        this.scene.switch("selection");
      } else if (portal.target == 4) {
        this.game.config.sceneTarget = "checkpoint2";
        this.scene.start("checkpoint2");
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