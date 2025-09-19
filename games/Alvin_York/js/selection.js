import Player from './Player.js';
import * as fct from "./fonctions.js";
import { Ennemi3, Ennemi1 } from './Ennemis.js';

let player;
let clavier;
let groupe_soldats;
let groupe_balles;
let groupe_balles_ennemi;
let gameOver = false;
let vie = 100;
let calque_plateformes;
let spriteBarreVieFond;
let spriteBarreVieRemplie;
let boutonRejouer;

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
    
    // Variables pour le système de vagues
    this.vagueActuelle = 0;
    this.maxVagues = 5;
    this.dureeVague = 30; // secondes
    this.pauseEntreVagues = 5; // secondes
    this.timerVague = 0;
    this.timerPause = 0;
    this.enVague = false;
    this.jaugeVague = null;
    this.texteVague = null;
    this.texteTimer = null;
    this.intervalEnnemis = null;
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    
    this.load.setBaseURL(baseURL);

    // Background
    this.load.image('menu_bg', './assets/background_test.png');

    // Player sprites
    this.load.spritesheet("img_player_idle", "./assets/player_normal_idle.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("img_player_run", "./assets/player_run.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("img_player_dead", "./assets/player_is_dead.png", { frameWidth: 64, frameHeight: 64 });

    // Enemies
    this.load.spritesheet("ennemi_run", "./assets/ennemi_run.png", {frameWidth: 64,frameHeight: 64});
    this.load.spritesheet("ennemi_is_dead", "./assets/ennemi_is_dead.png", {frameWidth: 64,frameHeight: 64 });
    this.load.spritesheet("ennemi_shoot", "./assets/ennemi_shoot.png", {frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("ennemi2_run_left", "./assets/ennemi2_run_left.png", { frameWidth: 64,frameHeight: 64 });
    this.load.spritesheet("ennemi2_run_right", "./assets/ennemi2_run_right.png", {frameWidth: 64,frameHeight: 64});
    this.load.spritesheet("ennemi2_is_dead_right", "./assets/ennemi2_is_dead_right.png", {frameWidth: 64,frameHeight: 64});
    this.load.spritesheet("ennemi2_is_dead_left", "./assets/ennemi2_is_dead_left.png", { frameWidth: 64,frameHeight: 64});
    this.load.spritesheet("ennemi2_throw_left", "./assets/ennemi2_throw_left.png", {frameWidth: 64,frameHeight: 64});
    this.load.spritesheet("ennemi2_throw_right", "./assets/ennemi2_throw_right.png", {frameWidth: 64,frameHeight: 64 });
    this.load.spritesheet("ennemi3_attack", "./assets/ennemi3_attack.png", {frameWidth: 64,frameHeight: 64});
    this.load.spritesheet("ennemi3_run", "./assets/ennemi3_run.png", {frameWidth: 64,frameHeight: 64 });
    this.load.spritesheet("ennemi3_is_dead", "./assets/ennemi3_is_dead.png", {frameWidth: 64,frameHeight: 64 });

    // Tilemap
    this.load.image("Phaser_tuilesdejeu", "./assets/tileset_city.png");
    this.load.image("Phaser_tuilesdejeu2", "./assets/tileset_war.png");
    this.load.tilemapTiledJSON("carte", "./assets/carte.tmj");

    // Projectiles and weapons
    this.load.image("img_balle", "./assets/balle.png");
    this.load.image("weapons", "./assets/Weapons/weapons.png");
    this.load.image("german_weapons", "./assets/Weapons/german_weapons.png");

    // Health bar
    this.load.image("empty_health_bar", "./assets/empty_health_bar.png");
    this.load.image("full_health_bar", "./assets/full_health_bar.png");
    
  }

  create() {

    this.physics.world.gravity.y = 0;
    // --- Tilemap ---
    const carteDuNiveau = this.make.tilemap({ key: "carte" });
    const tileset = carteDuNiveau.addTilesetImage("tileset_city", "Phaser_tuilesdejeu");
    const tileset2 = carteDuNiveau.addTilesetImage("tileset_war", "Phaser_tuilesdejeu2");
    carteDuNiveau.createLayer("calque_background", [tileset, tileset2]);
    carteDuNiveau.createLayer("calque_background2", [tileset, tileset2]);
    calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", [tileset, tileset2]);
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    // --- Groupes ---
    groupe_soldats = this.physics.add.group();
    groupe_balles = this.physics.add.group();
      groupe_balles_ennemi = this.physics.add.group();
      this.groupe_balles_ennemi = groupe_balles_ennemi;
    this.groupe_balles = groupe_balles; // Pour accès depuis Player.js

    // --- Player ---
    player = new Player(this, 100, 450);
    this.player = player;          // 🔥 permet à Ennemi3 d’y accéder
    player.setName("player");      // 🔥 si jamais tu utilises getByName

    // Animation de mort du joueur
    if (!this.anims.exists('anim_dead')) {
      this.anims.create({
        key: 'anim_dead',
        frames: this.anims.generateFrameNumbers('img_player_dead', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: 0
      });
    }


    // --- Camera ---
    this.physics.world.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);
    this.cameras.main.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);
    this.cameras.main.startFollow(player);
    this.cameras.main.setZoom(2);

    // --- Collisions ---
    this.physics.add.collider(player, calque_plateformes);
    this.physics.add.collider(groupe_soldats, calque_plateformes);
    this.physics.add.collider(player, groupe_soldats, this.chocAvecSoldat, null, this);
    this.physics.add.collider(groupe_balles, groupe_soldats, this.chocAvecBalles, null, this);

    // --- Clavier ---
    clavier = this.input.keyboard.createCursorKeys();

    // --- Barre de vie ---
    const largeurBarre = 300;
    const hauteurBarre = 32;
    const barreVieX = 350; // centre horizontal (1280 / 2)
    const barreVieY = 200; // centre vertical (720 / 2)

    // TEST : Affiche une image de fond à la place de la barre de vie pour vérifier l'affichage
    spriteBarreVieFond = this.add.image(barreVieX, barreVieY, "empty_health_bar")
      .setOrigin(0, 0)
      .setDisplaySize(largeurBarre, hauteurBarre)
      .setScrollFactor(0)
      .setDepth(100);

    spriteBarreVieRemplie = this.add.image(barreVieX, barreVieY, "full_health_bar")
      .setOrigin(0, 0)
      .setDisplaySize(largeurBarre, hauteurBarre)
      .setScrollFactor(0)
      .setDepth(101);

    console.log('Barre de vie créée', spriteBarreVieFond, spriteBarreVieRemplie);

    // --- Création de 3 Ennemi3 pour test ---
    // for (let i = 0; i < 3; i++) {
    //   let x = 300 + i * 100;
    //   let y = 450;
    //   let ennemi = new Ennemi3(this, x, y);
    //   groupe_soldats.add(ennemi);
    // }

    // --- Spawn d'un Ennemi1 aléatoirement ---
    // let xT = Phaser.Math.Between(100, carteDuNiveau.widthInPixels - 100);
    // let yT = Phaser.Math.Between(100, carteDuNiveau.heightInPixels - 100);
    // let tireurAleatoire = new Ennemi1(this, xT, yT);
    // groupe_soldats.add(tireurAleatoire);

    // --- Jauge de vague ---
    this.jaugeVagueFond = this.add.rectangle(
      this.cameras.main.centerX, 30, 300, 20, 0x333333
    ).setOrigin(0.5).setScrollFactor(0);
    this.jaugeVague = this.add.rectangle(
      this.cameras.main.centerX, 30, 300, 20, 0x00ff00
    ).setOrigin(0.5).setScrollFactor(0);

    this.texteVague = this.add.text(
      this.cameras.main.centerX, 8, "Vague 1/5", { fontSize: "16px", color: "#fff" }
    ).setOrigin(0.5, 0).setScrollFactor(0);

    this.texteTimer = this.add.text(
      this.cameras.main.centerX, 52, "30s", { fontSize: "16px", color: "#fff" }
    ).setOrigin(0.5, 0).setScrollFactor(0);

    // Lance la première vague
    this.lancerVague();
  }

  lancerVague() {
    this.vagueActuelle++;
    if (this.vagueActuelle > this.maxVagues) return;

    this.enVague = true;
    this.timerVague = this.dureeVague;
    this.texteVague.setText(`Vague ${this.vagueActuelle}/${this.maxVagues}`);

    // Génère 2 ennemis aléatoires chaque seconde pendant la vague
    this.intervalEnnemis = this.time.addEvent({
      delay: 1000,
      callback: () => this.genererEnnemisVague(),
      callbackScope: this,
      repeat: this.dureeVague - 1
    });
  }

  genererEnnemisVague() {
    // Liste des classes d'ennemis à utiliser
    const classesEnnemis = [Ennemi1, Ennemi3 /*, Ennemi2, Ennemi1, etc.*/];
    for (let i = 0; i < 1; i++) {
      const EnnemiClass = Phaser.Utils.Array.GetRandom(classesEnnemis);

      // Génère une position loin du joueur (par exemple, au moins 200px de distance)
      let x, y = 450;
      let essais = 0;
      do {
        x = Phaser.Math.Between(50, this.physics.world.bounds.width - 50);
        essais++;
        // Sécurité pour éviter une boucle infinie si la map est trop petite
        if (essais > 20) break;
      } while (Math.abs(x - player.x) < 100);

      const ennemi = new EnnemiClass(this, x, y);
      groupe_soldats.add(ennemi);
    }
  }

  update(time, delta) {
    if (gameOver) return;

    // Met à jour tous les ennemis
    groupe_soldats.getChildren().forEach(ennemi => {
      if (ennemi && ennemi.update) ennemi.update();
    });

      // Met à jour les balles ennemies (détruit si hors map)
      groupe_balles_ennemi.getChildren().forEach(balle => {
        if (balle.x < 0 || balle.x > this.physics.world.bounds.width || balle.y < 0 || balle.y > this.physics.world.bounds.height) {
          balle.destroy();
        }
      });

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

    // Collision balle ennemi / joueur (à placer dans create, pas update)
    this.physics.add.overlap(groupe_balles_ennemi, player, this.chocAvecBalleEnnemi, null, this);
  
    // Gestion du timer de vague et de la jauge
    if (this.enVague) {
      this.timerVague -= delta / 1000;
      if (this.timerVague <= 0) {
        this.enVague = false;
        this.timerPause = this.pauseEntreVagues;
        if (this.intervalEnnemis) this.intervalEnnemis.remove();
      }
      // Mise à jour jauge et timer
      const ratio = Math.max(this.timerVague / this.dureeVague, 0);
      this.jaugeVague.width = 300 * ratio;
      this.jaugeVague.fillColor = ratio > 0.5 ? 0x00ff00 : (ratio > 0.2 ? 0xffff00 : 0xff0000);
      this.texteTimer.setText(`${Math.ceil(this.timerVague)}s`);
    } else if (this.vagueActuelle < this.maxVagues) {
      this.timerPause -= delta / 1000;
      this.jaugeVague.width = 0;
      this.texteTimer.setText(`Pause (${Math.ceil(this.timerPause)}s)`);
      if (this.timerPause <= 0) {
        this.lancerVague();
      }
    } else {
      // Fin des vagues
      this.jaugeVague.width = 0;
      this.texteTimer.setText("Vagues terminées !");
    }
  }

  chocAvecSoldat(un_player, un_soldat) {
    vie -= 100;
    if (vie <= 0) {
      vie = 0;
      player.setTint(0xff0000);
      player.anims.play('anim_dead');
      this.physics.pause();
      gameOver = true;

      // Arrêter la génération de vagues et d'ennemis
      this.enVague = false;
      if (this.intervalEnnemis) this.intervalEnnemis.remove();

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
    // Si c'est un Ennemi1 ou Ennemi3, joue l'animation de mort
    if ((soldat instanceof Ennemi1 || soldat instanceof Ennemi3) && typeof soldat.mourir === 'function') {
      soldat.mourir();
    } else {
      soldat.destroy();
    }
  }

  // Collision balle ennemi / joueur
  chocAvecBalleEnnemi(balle, joueur) {
    balle.destroy();
    vie -= 100;
    if (vie < 0) vie = 0;
    this.updateBarreVie();
    joueur.setTint(0xff0000);
    joueur.anims.play('anim_dead');
    this.physics.pause();
    gameOver = true;

    // Arrêter la génération de vagues et d'ennemis
    this.enVague = false;
    if (this.intervalEnnemis) this.intervalEnnemis.remove();

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
      joueur.direction = "right";
      joueur.dernierTir = 0;
    });
  }

  updateBarreVie() {
    const largeurMax = 300;
    const largeurVie = largeurMax * (vie / 100);
    spriteBarreVieRemplie.setDisplaySize(largeurVie, 32);
  }
}