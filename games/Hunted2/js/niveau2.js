import * as fct from "./fonctions.js";

/***********************************************************************/
/** VARIABLES LOCALES AU NIVEAU
/***********************************************************************/
let player2;


/***********************************************************************/
/** VARIABLES HUD
/***********************************************************************/
let coeurs = 5;
let tempsRestant = 300;
let gardesTues = 0;   // 👈 compteur de gardes tués
let vies = 3;

let texteTemps;
let texteGardes;      // 👈 texte pour les gardes
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
  texteGardes = scene.add.text(640, 16, " Gardes tués : " + gardesTues, { fontSize: "22px", fill: "#fff" }).setScrollFactor(0);
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
function preloadPersonnage(scene) {
  // sprite de marche
  scene.load.spritesheet("img_perso2", "./assets/dude2.png", { frameWidth: 32, frameHeight: 48 });
  // sprite de tir
  scene.load.spritesheet("img_perso2_shoot", "./assets/dude2_shoot.png", { frameWidth: 32, frameHeight: 48 });
  // images fixes
  scene.load.image("dude2_face", "./assets/dude_face.png");
  scene.load.image("bullet", "./assets/bullet.png"); // image balle
}

function creerPlayer(scene, x, y) {
  player2 = scene.physics.add.sprite(x, y, "img_perso2");
  player2.setCollideWorldBounds(true);
  // player2.setBounce(0.2);
  return player2;
}

function creerAnimations(scene) {
  scene.anims.create({
    key: "anim2_marche",
    frames: scene.anims.generateFrameNumbers("img_perso2", { start: 0, end: 4 }),
    frameRate: 10,
    repeat: -1
  });
  scene.anims.create({
    key: "anim2_idle",
    frames: [{ key: "img_perso2", frame: 0 }],
    frameRate: 20
  });
  scene.anims.create({
    key: "anim2_shoot",
    frames: scene.anims.generateFrameNumbers("img_perso2_shoot", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: 0
  });
}

function updatePlayer(background, gameOverActif = false, isShooting = false) {
  if (gameOverActif) return;

  const vitesseX = player2.body.velocity.x;
  const onGround = player2.body.blocked.down;

  if (background && vitesseX !== 0) background.tilePositionX += vitesseX * 0.005;

  // Ne pas changer l'animation si on est en train de tirer
  if (!isShooting) {
    if (fct.clavier.left.isDown) {
      player2.setVelocityX(-160);
      player2.setFlipX(false);
      player2.anims.play("anim2_marche", true);
    } else if (fct.clavier.right.isDown) {
      player2.setVelocityX(160);
      player2.setFlipX(true);
      player2.anims.play("anim2_marche", true);
    } else {
      player2.setVelocityX(0);
      player2.anims.stop();
      player2.setTexture("dude2_face");
    }
  } else {
    // Permet de bouger même en tirant
    if (fct.clavier.left.isDown) {
      player2.setVelocityX(-160);
      player2.setFlipX(false);
    } else if (fct.clavier.right.isDown) {
      player2.setVelocityX(160);
      player2.setFlipX(true);
    } else {
      player2.setVelocityX(0);
    }
  }

  if (fct.clavier.up.isDown && onGround) player2.setVelocityY(-280);
}

/***********************************************************************/
/** SCENE NIVEAU2
/***********************************************************************/
export default class niveau2 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau2" });
  }

  preload() {
    this.load.tilemapTiledJSON("carte_3", "./assets/map_3.json");

    this.load.image("parallax3_arriere", "./assets/f3_arriere.png");
    this.load.image("parallax3_milieu1", "./assets/f3_milieu1.png");
    this.load.image("parallax3_milieu2", "./assets/f3_milieu2.png");
    this.load.image("parallax3_avant", "./assets/f3_avant.png");

    this.load.image("porteFermee", "./assets/porte_fermee.png");
    this.load.image("porteOuverte", "./assets/door2_open.png");

    // --- SON ---
    this.load.audio("musique2", "./assets/musique2.mp3");

    fct.preloadCommun(this);
    preloadPersonnage(this);
  }

  create() {
    // --- MUSIQUE DE FOND ---
    this.musique_de_fond = this.sound.add('musique2');
    this.musique_de_fond.play({ loop: true, volume: 0.5 });

    const carteDuNiveau = this.add.tilemap("carte_3");
    const tileset = carteDuNiveau.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");
    const tileset2 = carteDuNiveau.addTilesetImage("tuiles_de_jeu2", "Phaser_tuilesdejeu2");
    const tileset3 = carteDuNiveau.addTilesetImage("tuiles_de_jeu3", "Phaser_tuilesdejeu3");
    
    const calque_background = carteDuNiveau.createLayer("calque_background", [tileset3, tileset2]);
    const calque_background3 = carteDuNiveau.createLayer("calque_background3", [tileset3, tileset2]);
    const calque_background2 = carteDuNiveau.createLayer("calque_background2", [tileset3, tileset2, tileset]);
    this.ladder_layer = carteDuNiveau.createLayer("ladder_layer", tileset);
    const calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", [tileset3, tileset2]);
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    const worldWidth = carteDuNiveau.widthInPixels || 1280;
    const worldHeight = carteDuNiveau.heightInPixels || 720;

    // --- FOND PARALLAX ---
    this.fond_arriere = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax3_arriere").setOrigin(0).setScrollFactor(0).setDepth(-4);
    this.fond_milieu1 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax3_milieu1").setOrigin(0).setScrollFactor(0).setDepth(-3);
    this.fond_milieu2 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax3_milieu2").setOrigin(0).setScrollFactor(0).setDepth(-2);
    this.fond_avant = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax3_avant").setOrigin(0).setScrollFactor(0).setDepth(-1);

    // --- PLAYER ---
    creerPlayer(this, 100, 450);
    this.physics.add.collider(player2, calque_plateformes);

    fct.initClavier(this);
    creerAnimations(this);

    initHUD(this);

    // --- PORTAILS ---
    this.grp_portal = this.physics.add.group();
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.grp_bullets = this.physics.add.group({
  defaultKey: 'bullet',
  maxSize: 10
});
    this.spawnPoint = { x: 100, y: 450 };

    const tab_objects = carteDuNiveau.getObjectLayer("object_layer")?.objects || [];
    tab_objects.forEach(point => {
      if (point.name === "start") {
        player2.x = point.x;
        player2.y = point.y;
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

    // Placement joueur
    if(this.game.config.portalTarget != null) this.portalSpawning();
    else if(this.spawnPoint) { player2.x = this.spawnPoint.x; player2.y = this.spawnPoint.y; }

    // --- CAMERA ---
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(player2);

    this.game.config.sceneTarget = "niveau2";
  }

  update() {
    // --- PARALLAX ---
    if(fct.clavier.left.isDown){
      this.fond_arriere.tilePositionX -= 0.2;
      this.fond_milieu1.tilePositionX -= 0.5;
      this.fond_milieu2.tilePositionX -= 1;
      this.fond_avant.tilePositionX -= 1.8;
    } else if(fct.clavier.right.isDown){
      this.fond_arriere.tilePositionX += 0.2;
      this.fond_milieu1.tilePositionX += 0.5;
      this.fond_milieu2.tilePositionX += 1;
      this.fond_avant.tilePositionX += 1.8;
    }

    // --- PORTES OUVERTURE / FERMETURE ---
    this.grp_portal.children.iterate(portal => {
      let dist = Phaser.Math.Distance.Between(player2.x, player2.y, portal.x, portal.y);

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

        if(portal.target == 6){
          this.musique_de_fond.stop();
          this.game.config.sceneTarget = "niveau3";
          this.scene.start("niveau3");
        } else if(portal.target == 4){
          this.musique_de_fond.stop();
          console.log("Portail id=4 activé - pas de transition définie");
        }
      }
    });

    if(this.game.config.sceneTarget !== "niveau2") return;

    // ECHELLE : si joueur est sur une échelle
    const surEchelle = this.ladder_layer.getTileAtWorldXY(player2.x, player2.y);
    if (surEchelle) {
      // Désactiver la gravité
      player2.body.setAllowGravity(false);
      // Monter ou descendre
      if (fct.clavier.up.isDown) player2.setVelocityY(-200);
      else if (fct.clavier.down.isDown) player2.setVelocityY(120);
      else player2.setVelocityY(0);
    } else {
      // Réactiver la gravité
      player2.body.setAllowGravity(true);
    }

    // --- TIR ---
let isShooting = false;
if (Phaser.Input.Keyboard.JustDown(this.shootKey)) {
  isShooting = true;
  player2.anims.play("anim2_shoot", true);
  
  // Créer le bullet
  let bullet = this.grp_bullets.get(player2.x, player2.y);
  if (bullet) {
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.body.allowGravity = false;
    
    // Direction selon l'orientation du joueur
    if (player2.flipX) {
      bullet.setVelocityX(400); // Droite
    } else {
      bullet.setVelocityX(-400); // Gauche
    }
    
    // Détruire le bullet après 2 secondes
    this.time.delayedCall(2000, () => {
      if (bullet.active) {
        bullet.setActive(false);
        bullet.setVisible(false);
      }
    });
  }
  
  player2.once('animationcomplete', () => {
    player2.setTexture("dude2_face");
  });
}

// Vérifier si l'animation de tir est en cours
if (player2.anims.currentAnim && player2.anims.currentAnim.key === "anim2_shoot" && player2.anims.isPlaying) {
  isShooting = true;
}

    updatePlayer(null, fct.gameOverActif, isShooting);
  }

  portalSpawning() {
    let portalFound = false;
    this.grp_portal.children.iterate(portal => {
      if(portal.id === this.game.config.portalTarget){
        player2.x = portal.x;
        player2.y = portal.y;
        this.game.config.portalTarget = null;
        portalFound = true;
      }
    });

    if(!portalFound && this.spawnPoint){
      player2.x = this.spawnPoint.x;
      player2.y = this.spawnPoint.y;
      this.game.config.portalTarget = null;
    }
  }
}