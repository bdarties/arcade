import * as fct from "./fonctions.js";
import Ennemi1 from "./ennemi.js";
import Inventory from "./inventory.js";
import Coffre from "./coffre.js"

var clavier;
var groupe_plateformes;

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    this.load.image("tuiles_de_jeu", "../assets/maps/tiles/tuilesJeu.png");
    this.load.tilemapTiledJSON("map2", "../assets/maps/map2.json");
    this.load.spritesheet("mage1", "./assets/mage1.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("magemarche", "./assets/magemarche.png", {
      frameWidth: 64,
      frameHeight: 64
    }); 
    this.load.spritesheet('mage_attaque', 'assets/mage_attaque.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('ennemi1', './assets/ennemi1.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('fireball', './assets/fireball_1.png', {
      frameWidth: 16,
      frameHeight: 16
    });
    this.load.spritesheet('arrow', './assets/arrow.png', {
      frameWidth: 16,
      frameHeight: 16
    });
    this.load.image('bullet', './assets/balle.png');
    this.load.audio('damageSound', '../assets/sounds/givedamage.mp3');
  }

  create() {
    // Création du monde + plateformes
    this.map = this.add.tilemap("map2")
    const tileset = this.map.addTilesetImage("tuiles_de_jeu", "tuiles_de_jeu");

    this.calque_background = this.map.createLayer("calque_background", tileset);
    this.porte = this.map.createLayer("porte", tileset);
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset);  
    this.poteaux = this.map.createLayer("poteaux", tileset);

    this.anims.create({
      key: 'fireball_anim',
      frames: this.anims.generateFrameNumbers('fireball', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'arrow_anim',
      frames: this.anims.generateFrameNumbers('arrow', { start: 0, end: 4 }),
      frameRate: 10,
      repeat: -1
    });

    // Création du personnage
    this.player = this.physics.add.sprite(120, 250, "mage1");
    this.player.body.setSize(36, 48);
    this.player.body.setOffset(14, 8);
    this.player.setCollideWorldBounds(true);
    this.pvManager = new fct.PvManager(this);

    if (this.calque_plateformes) {
      this.calque_plateformes.setCollisionByProperty({ estSolide: true });
      this.physics.add.collider(this.player, this.calque_plateformes);
    }
    
    this.physics.world.setBounds(0, 0, 3200, 640);
    this.cameras.main.setBounds(0, 0, 3200, 640);
    this.cameras.main.startFollow(this.player);
    this.lastDirection = 'right';
    this.scene.bringToTop('hud');

    // Animations
    this.anims.create({
      key: "mage_idle",
      frames: this.anims.generateFrameNumbers("mage1", { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1
    });
    this.anims.create({
      key: "mage_walk_left",
      frames: this.anims.generateFrameNumbers("magemarche", { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'mage_attack',
      frames: this.anims.generateFrameNumbers('mage_attaque', { start: 0, end: 11 }),
      frameRate: 24,   
      repeat: 0        
    });

    // Création du clavier
    this.clavier = this.input.keyboard.createCursorKeys();
    this.clavier.O = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.clavier.P = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.clavier.I = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.clavier.F = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // Initialiser l'état de l'inventaire si nécessaire
    if (!this.registry.has('inventaireCree')) {
      this.registry.set('inventaireCree', false);
    }

    // Création des ennemis
    this.groupeBullets = this.physics.add.group();
    this.physics.add.collider(this.groupeBullets, this.calque_plateformes, (bullet) => {
      bullet.destroy();
    });

    this.groupeEnnemis = fct.creerEnnemis(this, Ennemi1);
    
    if (this.groupeEnnemis.getChildren().length === 0) {
      console.log("Aucun ennemi trouvé dans Tiled, création manuelle...");
      this.groupeEnnemis = this.physics.add.group();
      const ennemi = new Ennemi1(this, 400, 250);
      this.groupeEnnemis.add(ennemi);
      console.log("Ennemi créé à la position (400, 250)");
    }

    this.physics.add.collider(this.groupeEnnemis, this.calque_plateformes);
    this.physics.add.overlap(this.groupeBullets, this.groupeEnnemis, this.balleToucheEnnemi, null, this);

    this.groupeFlechesEnnemis = this.physics.add.group();
    this.physics.add.collider(this.groupeFlechesEnnemis, this.calque_plateformes, (fleche) => {
      fleche.destroy();
    });
    this.physics.add.overlap(this.groupeFlechesEnnemis, this.player, this.flecheToucheJoueur, null, this);

    this.damageSound = this.sound.add('damageSound');
    this.damageSound.setVolume(0.5);
    
    console.log("Nombre d'ennemis créés:", this.groupeEnnemis.getChildren().length);
  }

  update() {
    // Mouvements
    let vx = 0;
    let vy = 0;
    const speed = 90;
    
    if (!this.isAttacking) {
      if (this.clavier.left.isDown) {
        vx = -speed;
        this.player.flipX = true;
        this.lastDirection = 'left';
        this.player.anims.play("mage_walk_left", true);
      } 
      if (this.clavier.right.isDown) {
        vx = speed;
        this.player.flipX = false;
        this.lastDirection = 'right';
        this.player.anims.play("mage_walk_left", true);
      }
      if (this.clavier.up.isDown) {
        vy = -speed;
        this.lastDirection = 'up';
      } 
      if (this.clavier.down.isDown) {
        vy = speed;
        this.lastDirection = 'down';
      }

      this.player.setVelocity(
        Phaser.Math.Linear(this.player.body.velocity.x, vx, 0.2),
        Phaser.Math.Linear(this.player.body.velocity.y, vy, 0.2)
      );

      if (vx !== 0 || vy !== 0) {
        this.player.anims.play("mage_walk_left", true);
      } else {
        this.player.anims.play("mage_idle", true);
      }
    }

    // Tir
    if (Phaser.Input.Keyboard.JustDown(this.clavier.O)) {
      fct.lancerAttaque(this);
    }

    // ===========================
    // Gestion de l'inventaire (touche P)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.P)) {
      this.toggleInventory();
    }

    // ===========================
    // Gestion du menu pause (touche F)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.F)) {
      this.scene.launch("PauseScene", { from: this.scene.key });
      this.scene.pause();
    }

    // ===========================
    // Gestion des coffres (touche I)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.I)) {
      this.handleChestInteraction();
    }

    // Mise à jour des ennemis
    if (this.groupeEnnemis) {
      this.groupeEnnemis.getChildren().forEach(ennemi => {
        ennemi.update();
      });
    }
  }

  toggleInventory() {
    // Vérifier si l'inventaire est actuellement actif
    const inventoryActive = this.scene.isActive('Inventory');
    
    if (inventoryActive) {
      // Fermer l'inventaire
      console.log("Fermeture de l'inventaire");
      this.scene.bringToTop(this.scene.key);
      this.scene.bringToTop("hud");
      this.scene.pause('Inventory');
      this.scene.resume();
    } else {
      // Ouvrir l'inventaire
      console.log("Ouverture de l'inventaire");
      this.registry.set('lastScene', this.scene.key);
      
      // Créer ou reprendre l'inventaire
      if (!this.registry.get('inventaireCree')) {
        this.scene.launch('Inventory');
        this.registry.set('inventaireCree', true);
      } else {
        this.scene.resume('Inventory');
        this.scene.bringToTop('Inventory');
      }
      this.scene.pause();
    }
  }

  handleChestInteraction() {
    if (!this.poteaux) {
      console.log("Pas de calque poteaux");
      return;
    }

    const tile = this.poteaux.getTileAtWorldXY(this.player.x, this.player.y, true);

    if (tile && tile.properties.estCoffre) {
      const coffreId = `${tile.x},${tile.y}`;
      let coffresOuverts = this.registry.get("coffresOuverts") || {};
      
      if (coffresOuverts[coffreId]) {
        console.log("Ce coffre a déjà été ouvert !");
        return;
      }

      coffresOuverts[coffreId] = true;
      this.registry.set("coffresOuverts", coffresOuverts);

      console.log("Coffre trouvé et ouvert !");
      this.registry.set("lastScene", this.scene.key);

      if (!this.scene.isActive("Coffre") && !this.registry.get("coffreCree")) {
        this.scene.launch("Coffre", { coffreId });
        this.registry.set("coffreCree", true);
        this.scene.pause();
      } else {
        this.scene.stop("Coffre");
        this.scene.launch("Coffre", { coffreId });
        this.scene.bringToTop("Coffre");
        this.scene.pause();
      }
    } else {
      console.log("Pas de coffre sous le joueur.");
      
      if (this.porte && fct.estPorte(this, this.player, this.porte)) {
        console.log("Ouverture de la porte vers un niveau aléatoire !");
      }
    }
  }

  balleToucheEnnemi(bullet, ennemi) {
    ennemi.prendreDegats();
    bullet.destroy();
    this.damageSound.play();
  }

  flecheToucheJoueur(player, fleche) {
    if (fleche.origine === 'ennemi') {
      console.log("Joueur touché par une flèche !");
      this.pvManager.damage(fleche.degats || 1);

      player.setTint(0xff0000);
      this.time.delayedCall(200, () => {
        player.clearTint();
      });
      
      fleche.destroy();
    }
  }

  flecheToucheEnnemi(fleche, ennemi) {
    if (fleche.origine === 'ennemi' && fleche.ennemiSource === ennemi) {
      return;
    }
    
    if (fleche.origine !== 'ennemi') {
      ennemi.prendreDegats(fleche.degats);
      fleche.destroy();
    }
  }
}