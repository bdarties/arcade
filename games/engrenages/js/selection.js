import * as fct from "./fonctions.js";

var player;
var clavier;

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);
    this.load.image("background", "./assets/screen_selection.png");
    this.load.image("retour_menu", "./assets/retour_menu.png");
    this.load.spritesheet("img_perso", "./assets/mouv_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("img_perso_idle", "./assets/idle_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.image("img_porte1", "./assets/terminal_rempli.png");
    this.load.image("img_porte2", "./assets/terminal_rempli.png");
    this.load.image("img_porte3", "./assets/terminal_rempli.png");
  }

  create() {
    // Ajout du fond d'écran centré et adapté à la taille de l'écran
    const background = this.add.image(this.game.config.width / 2, this.game.config.height / 2, "background");
    background.setDisplaySize(this.game.config.width, this.game.config.height);
    
    this.add.text(650, 450, "Seul le J1 peut choisir le niveau. J2 n'a aucun contrôle ici.", { fontSize: "25px", fill: "#fff" }).setOrigin(0.5);

    // Positions des portes
    const portesY = 650;

    // Ajout des portes
    this.porte1 = this.physics.add.staticSprite(450, portesY, "img_porte1");
    this.porte2 = this.physics.add.staticSprite(650, portesY, "img_porte2");
    this.porte3 = this.physics.add.staticSprite(850, portesY, "img_porte3");

    // Textes au-dessus des portes
    this.add.text(450, portesY - 90, "Niveau 1", { fontSize: "24px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(650, portesY - 90, "Niveau 2", { fontSize: "24px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(850, portesY - 90, "Niveau 3", { fontSize: "24px", fill: "#fff" }).setOrigin(0.5);

    // Création du J1
    player = this.physics.add.sprite(450, 600, "img_perso");
    player.refreshBody();
    player.setBounce(0.15);
    player.setCollideWorldBounds(true);
    player.setSize(26, 58); // Hitbox identique à niveau1.js
  // propriétés pour lissage des déplacements (comme niveau1)
  player.smoothVel = 0;
  player.targetVel = 0;

    // A l'avenir, il faudra retirer les portes des niveaux 2 et 3 pour que le joueur n'accède qu'au premier niveau puis progresse normalement.

    // Animations J1
    this.anims.create({
      key: "anim_tourne_gauche",
      frames: this.anims.generateFrameNumbers("img_perso", { start: 9, end: 15 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "anim_face",
      frames: this.anims.generateFrameNumbers("img_perso_idle", { start: 5, end: 6 }),
      frameRate: 20
    });
    this.anims.create({
      key: "anim_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_perso", { start: 25, end: 31 }),
      frameRate: 10,
      repeat: -1
    });

    // Contrôles clavier J1
    clavier = this.input.keyboard.createCursorKeys();
  // Remap J1 jump to K
  clavier.up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    clavier.menu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    clavier.action = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I); // Touche I pour actions

    // // Image retour au menu (visuel seulement)
    // this.add.image(100, 60, "retour_menu").setOrigin(0.5);
  }

  update() {
    // Contrôles J1
    // Mouvements lissés pour la sélection
    let desiredVel = 0;
    if (clavier.left.isDown) {
      desiredVel = -160;
      player.anims.play("anim_tourne_gauche", true);
    } else if (clavier.right.isDown) {
      desiredVel = 160;
      player.anims.play("anim_tourne_droite", true);
    } else {
      desiredVel = 0;
      player.anims.play("anim_face");
    }

    // interpolation simple
    player.targetVel = desiredVel;
  const pressLerpSel = 0.6;
  const releaseLerpSel = 0.45;
    const lerpFactorSel = Math.abs(player.targetVel) > Math.abs(player.smoothVel) ? pressLerpSel : releaseLerpSel;
    player.smoothVel = Phaser.Math.Linear(player.smoothVel, player.targetVel, lerpFactorSel);
  if (Math.abs(player.smoothVel) < 2) player.smoothVel = 0;
    player.setVelocityX(Math.round(player.smoothVel));
    // Saut
    if (clavier.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }

    // Choix du niveau
    if (Phaser.Input.Keyboard.JustDown(clavier.space) || Phaser.Input.Keyboard.JustDown(clavier.action)) {
      if (this.physics.overlap(player, this.porte1)) this.scene.switch("niveau1");
      if (this.physics.overlap(player, this.porte2)) this.scene.switch("niveau2");
      if (this.physics.overlap(player, this.porte3)) this.scene.switch("niveau3");
    }

      // Retour à l'accueil
      if (Phaser.Input.Keyboard.JustDown(clavier.menu)) {
        this.scene.switch("accueil");
      }
  }
}