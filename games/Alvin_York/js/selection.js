import Player from './Player.js';
import * as fct from "./fonctions.js";
import { Ennemi1, Ennemi2, Ennemi3 } from './Ennemis.js';

let player;
let clavier;
let groupe_soldats;
let groupe_balles;
let gameOver = false;
let vie = 100;
let calque_plateformes;
let spriteBarreVieFond;
let spriteBarreVieRemplie;
let boutonRejouer;

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    
    this.load.setBaseURL(baseURL);

    // Background
    this.load.image('menu_bg', './assets/background_test.png');

    // Player sprites
    this.load.spritesheet("img_player_idle", "./assets/player_normal_idle.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("img_player_run", "./assets/player_run.png", { frameWidth: 64, frameHeight: 64 });

    // Enemies
    this.load.spritesheet("ennemi_run", "./assets/Enemies/ennemi_run.png", {frameWidth: 64,frameHeight: 64});

    this.load.spritesheet("ennemi_is_dead", "./assets/Enemies/ennemi_is_dead.png", {frameWidth: 64,frameHeight: 64 });

    this.load.spritesheet("ennemi2_run_left", "./assets/Enemies/ennemi2_run_left.png", { frameWidth: 64,frameHeight: 64 });
 
    this.load.spritesheet("ennemi2_run_right", "./assets/Enemies/ennemi2_run_right.png", {frameWidth: 64,frameHeight: 64});

    this.load.spritesheet("ennemi2_is_dead_right", "./assets/Enemies/ennemi2_is_dead_right.png", {frameWidth: 64,frameHeight: 64});
  
    this.load.spritesheet("ennemi2_is_dead_left", "./assets/Enemies/ennemi2_is_dead_left.png", { frameWidth: 64,frameHeight: 64});

    this.load.spritesheet("ennemi2_throw_left", "./assets/Enemies/ennemi2_throw_left.png", {frameWidth: 64,frameHeight: 64});
  
    this.load.spritesheet("ennemi2_throw_right", "./assets/Enemies/ennemi2_throw_right.png", {frameWidth: 64,frameHeight: 64 });

    this.load.spritesheet("ennemi3_attack", "./assets/Enemies/ennemi3_attack.png", {frameWidth: 64,frameHeight: 64});

    this.load.spritesheet("ennemi3_run", "./assets/Enemies/ennemi3_run.png", {frameWidth: 64,frameHeight: 64 });

    // Tilemap
    this.load.image("Phaser_tuilesdejeu", "./assets/tileset_city.png");
    this.load.image("Phaser_tuilesdejeu2", "./assets/tileset_war.png");
    this.load.tilemapTiledJSON("carte", "./assets/carte.tmj");

    // Projectiles and weapons
    this.load.image("img_balle", "./assets/balle.png");
    this.load.image("weapons", "./assets/Weapons/weapons.png");

    // Health bar
    this.load.image("barre_vie_fond", "./assets/empty_health_bar.png");
    this.load.image("barre_vie_remplie", "./assets/full_health_bar.png");
  }

  create() {
    // --- Tilemap ---
    const carteDuNiveau = this.make.tilemap({ key: "carte" });
    const tileset = carteDuNiveau.addTilesetImage("tileset_city", "Phaser_tuilesdejeu");
    const tileset2 = carteDuNiveau.addTilesetImage("tileset_war", "Phaser_tuilesdejeu2");
    carteDuNiveau.createLayer("calque_background", [tileset, tileset2]);
    carteDuNiveau.createLayer("calque_background_1", [tileset, tileset2]);
    carteDuNiveau.createLayer("calque_background_0", [tileset, tileset2]);
    calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", [tileset, tileset2]);
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    // --- Groupes ---
    groupe_soldats = this.physics.add.group();
    groupe_balles = this.physics.add.group();
    
    this.groupe_balles = groupe_balles; // Pour accès depuis Player.js

    // --- Player ---
    player = new Player(this, 100, 450);

    // --- Camera ---
    this.physics.world.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);
    this.cameras.main.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);
    this.cameras.main.startFollow(player);
    this.cameras.main.setZoom(2);

    // --- Collisions ---
    this.physics.add.collider(player, calque_plateformes);
    this.physics.add.collider(player, groupe_soldats, this.chocAvecSoldat, null, this);
    this.physics.add.collider(groupe_balles, groupe_soldats, this.chocAvecBalles, null, this);

    // --- Clavier ---
    clavier = this.input.keyboard.createCursorKeys();

    // --- Ennemis pour test ---
    for (let i = 0; i < 10; i++) {
      let x = Phaser.Math.Between(200, 2000);
      let y = Phaser.Math.Between(100, 500);
      let soldat = groupe_soldats.create(x, y, 'ennemi_run');
      soldat.setCollideWorldBounds(true);
      soldat.setBounce(1);
      soldat.setVelocityX(Phaser.Math.Between(-100, 100));
      soldat.setVelocityY(Phaser.Math.Between(-100, 100));
    }

    // --- Barre de vie ---
    const largeurBarre = 300;
    const hauteurBarre = 32;
    const barreVieX = 16;
    const barreVieY = 16;

    spriteBarreVieFond = this.add.image(barreVieX, barreVieY, "barre_vie_fond")
      .setOrigin(0, 0)
      .setDisplaySize(largeurBarre, hauteurBarre)
      .setScrollFactor(0);

    spriteBarreVieRemplie = this.add.image(barreVieX, barreVieY, "barre_vie_remplie")
      .setOrigin(0, 0)
      .setDisplaySize(largeurBarre, hauteurBarre)
      .setScrollFactor(0);
  }

  update() {
    if (gameOver) return;

    const enMouvement = player.move(clavier);
    player.updateHitbox();

    // CORRECTION: Vérifier les ennemis dans la hitbox avec protection contre les erreurs
    let ennemiCible = null;
    try {
      const ennemis = groupe_soldats.getChildren();
      ennemiCible = player.ennemiDansHitbox(ennemis);
    } catch (error) {
      console.warn("Erreur lors de la détection d'ennemi:", error);
    }
    
    // Mettre à jour l'arme avec la cible
    player.updateArme(ennemiCible);

    // CORRECTION: Tir automatique même en mouvement
    if (ennemiCible && !enMouvement) {
      try {
        player.tirer(ennemiCible);
      } catch (error) {
        console.warn("Erreur lors du tir:", error);
      }
    }

    // Animation idle si le joueur ne bouge pas
    if (!enMouvement && !gameOver) {
      player.anims.play("anim_idle", true);
      player.setFlipX(player.direction === "left");
    }
  }

  chocAvecSoldat(un_player, un_soldat) {
    vie -= 100;
    if (vie <= 0) {
      vie = 0;
      player.setTint(0xff0000);
      this.physics.pause();
      gameOver = true;

      // Bouton Rejouer
      boutonRejouer = this.add.text(window.innerWidth/2, window.innerHeight/2, 'Rejouer', {
        fontSize: '40px',
        fill: '#fff',
        backgroundColor: '#555555ff'
      })
      .setOrigin(0.5)
      .setPadding(10)
      .setInteractive()
      .setScrollFactor(0);

      boutonRejouer.on('pointerdown', () => {
        this.scene.restart();
        vie = 100;
        gameOver = false;
        player.direction = "right";
        player.dernierTir = 0;
      });
    }
    this.updateBarreVie();
  }

  chocAvecBalles(balle, soldat) {
    balle.destroy();
    soldat.destroy();
  }

  updateBarreVie() {
    const largeurMax = 300;
    const largeurVie = largeurMax * (vie / 100);
    spriteBarreVieRemplie.setDisplaySize(largeurVie, 32);
  }
}