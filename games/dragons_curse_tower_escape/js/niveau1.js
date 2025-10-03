import PauseManager from "./pause.js";
import * as fct from "./fonctions.js";
import Inventory from "./inventory.js";
import Coffre from "./coffre.js"

export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  preload() {
    this.load.image("tuiles_de_jeu", "../assets/maps/tiles/tuilesJeu2.png"); 
    this.load.image("pics", "../assets/maps/tiles/pics.png"); 
    this.load.tilemapTiledJSON("map3", "../assets/maps/map3.json");
    this.load.spritesheet("mage1", "./assets/mage1.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("magemarche", "./assets/magemarche.png", {
      frameWidth: 64,
      frameHeight: 64
    });
  }

  create() {
    // --- PvManager
    this.pvManager = new fct.PvManager(this);

    // --- Charger la map
    this.map = this.make.tilemap({ key: "map3" });

    // Associer les tilesets de Tiled avec les images chargées
    const tileset1 = this.map.addTilesetImage("tuiles_de_jeux", "tuiles_de_jeu");
    const tileset2 = this.map.addTilesetImage("pics", "pics");
    
    // Calques background et objets avec tileset de jeu
    this.calque_background = this.map.createLayer("calque_background", tileset1);
    
    // Calque pics - on va animer manuellement
    this.pics = this.map.createLayer("pics", tileset2);
    this.pics.setDepth(10);
    
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset1);
    this.portes = this.map.createLayer("portes", tileset1);
    this.objets = this.map.createLayer("objets", tileset1);

    // --- Animation manuelle des pics
    this.animatePics();

    // --- Joueur
    this.player = this.physics.add.sprite(220, 250, "mage1");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(36, 48);
    this.player.body.setOffset(14, 8);
    this.scene.bringToTop('hud');

    // --- Collision plateformes
    if (this.calque_plateformes) {
      this.calque_plateformes.setCollisionByProperty({ estSolide: true });
      this.physics.add.collider(this.player, this.calque_plateformes);
    }

    // --- Collision danger (pics) avec timer de vérification
    this.isDamaged = false;
    this.damageTimer = null;
    
    this.physics.add.overlap(this.player, this.pics, (player, tile) => {
      if (tile && tile.index >= 183 && tile.index <= 196) {
        if (!this.isDamaged) {
          this.isDamaged = true;
          this.scene.restart();
          this.cameras.main.shake(100, 0.005);
          
          this.damageTimer = this.time.delayedCall(50, () => {
            const tileUnderPlayer = this.pics.getTileAtWorldXY(this.player.x, this.player.y);
            
            if (tileUnderPlayer && tileUnderPlayer.index >= 183 && tileUnderPlayer.index <= 196) {
              console.log("Trop longtemps sur les pics ! Reset...");
                            this.pvManager.damage(1);
            }
            
            this.isDamaged = false;
          });
        }
      }
    });

    /***********************
     *  CREATION MINIMAP   *
     ***********************/ 
    this.minimap = fct.creerMinimap(this, this.player, this.map, {
      width: 180,
      height: 100,
      zoom: 0.10,
      x: 10,
      y: 10,
      calques: ["calque_background", "calque_plateformes", "poteaux"]
    });

    /***********************
     *  CREATION DU CLAVIER *
     ************************/
    this.clavier = this.input.keyboard.createCursorKeys();
    this.clavier.O = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.clavier.P = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.clavier.I = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.clavier.F = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    //==========================================
    // Ouverture/fermeture inventaire avec P
    //==========================================
    // IMPORTANT : On n'utilise plus keydown-P mais JustDown dans update()
    // pour éviter les conflits entre scènes

    // ===========================
    // Menu pause avec touche F
    // ===========================
    // Même chose : on utilisera JustDown dans update()

    // ===========================
    // Ouvrir coffre avec touche I
    // ===========================
    // Même chose : on utilisera JustDown dans update()
    
    // --- Animations du joueur
    this.anims.create({
      key: "mage_idle",
      frames: this.anims.generateFrameNumbers("mage1", { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1
    });
    this.anims.create({
      key: "mage_walk",
      frames: this.anims.generateFrameNumbers("magemarche", { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1
    });

    // --- Caméra
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player);

    // --- Contrôles
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  animatePics() {
    const frameCount = 14;
    const frameDuration = 100;
    const firstGid = 183;
    
    let currentFrame = 0;
    this.picsToAnimate = [];
    
    this.pics.forEachTile(tile => {
      if (tile.index >= firstGid && tile.index < firstGid + frameCount) {
        this.picsToAnimate.push({ x: tile.x, y: tile.y });
      }
    });

    this.time.addEvent({
      delay: frameDuration,
      callback: () => {
        currentFrame = (currentFrame + 1) % frameCount;
        this.picsToAnimate.forEach(pos => {
          const tile = this.pics.getTileAt(pos.x, pos.y);
          if (tile) {
            tile.index = firstGid + currentFrame;
          }
        });
      },
      loop: true
    });
  }

  update() {
    const speed = 150;
    this.player.setVelocity(0);

    // Mouvements
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.flipX = true;
      this.player.anims.play("mage_walk", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.flipX = false;
      this.player.anims.play("mage_walk", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("mage_idle", true);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
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
}