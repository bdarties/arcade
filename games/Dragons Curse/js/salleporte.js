import PauseManager from "./pause.js";
import * as fct from "./fonctions.js";

export default class salleporte extends Phaser.Scene {
  constructor() {
    super({ key: "salleporte" });
  }

  preload() {
    // Charger uniquement la map spécifique à ce niveau
    this.load.tilemapTiledJSON("salleporte", "./assets/maps/salle_portes.json");
    this.load.image("filtre", "./assets/black.png");
  }

  create() {
    // --- PvManager
    this.pvManager = new fct.PvManager(this);
    
    // --- Initialiser le système de skills (accès global)
    this.skillManager = new fct.SkillManager(this);
    
    // ===========================
    // Système de porte
    // ===========================
    this.surPorte = false;
    
    // --- Groupe de potions au sol
    this.groupePotions = this.physics.add.group();

    // --- Groupe de bullets pour le tir
    this.groupeBullets = this.physics.add.group();

    // --- Charger la map salleporte
    this.map = this.make.tilemap({ key: "salleporte" });

    // Associer les tilesets de Tiled avec les images chargées (dans l'ordre défini dans le JSON)
    const tilesetPiege = this.map.addTilesetImage("piege", "piege");
    const tilesetAnimations = this.map.addTilesetImage("animations", "animations");
    const tileset2 = this.map.addTilesetImage("tileset2", "tileset2");
    const tileset1 = this.map.addTilesetImage("tileset1", "tileset1");

    // Créer les calques de la carte salleporte (cette carte n'a pas de calque_trap)
    this.calque_sol = this.map.createLayer("calque_sol", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_mur = this.map.createLayer("calque_mur", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_fenetres = this.map.createLayer("calque_fenetres", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calques_objets = this.map.createLayer("calques_objets", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_mur_haut = this.map.createLayer("calque_mur_haut", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);

    // Définir la profondeur des calques pour l'affichage correct
    if (this.calque_mur_haut) this.calque_mur_haut.setDepth(10);

    // Référence pour les coffres
    this.poteaux = this.calques_objets;

    // Charger les animations des projectiles
    this.anims.create({
      key: "fireball_anim",
      frames: this.anims.generateFrameNumbers("fireball", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    // --- Joueur
    this.player = this.physics.add.sprite(220, 250, "mage1");
    this.player.body.setSize(36, 48);
    this.player.body.setOffset(14, 8);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
    this.scene.bringToTop('hud');

    // ==========================
    //
    // Configuration de la lumière et du filtre
    //
    // ==========================
    
    // Activer le système de lumières
    this.lights.enable().setAmbientColor(0x555555);
    
    // Créer une lumière qui suit le joueur
    this.playerLight = this.lights.addLight(0, 0, 180).setColor(0xffffff).setIntensity(1);
    
    // Appliquer Light2D au joueur
    this.player.setPipeline('Light2D');
    
    // Créer le filtre noir avec opacité réduite qui suit le joueur
    this.filtrenoir = this.add
      .image(this.player.x, this.player.y, "filtre")
      .setScale(4)
      .setAlpha(0.85)
      .setDepth(100);

    // --- Collision avec les murs et le sol
    if (this.calque_mur) {
      this.calque_mur.setCollisionByProperty({ estSolide: true });
      this.physics.add.collider(this.player, this.calque_mur);
    }
    
    if (this.calque_sol) {
      this.calque_sol.setCollisionByProperty({ estSolide: true });
      this.physics.add.collider(this.player, this.calque_sol);
    }

    // Collision avec les objets (coffres, portes, etc.)
    if (this.calques_objets) {
      this.calques_objets.setCollisionByExclusion([{ estSolide: true }]);
      this.physics.add.collider(this.player, this.calques_objets);
    }

    // --- Collision bullets avec les murs
    this.physics.add.collider(this.groupeBullets, this.calque_mur, (bullet) => {
      bullet.destroy();
    });

    // --- Collision avec les tiles estLeve (nouveauté)
    this.isOnLeve = false;
    this.leveDamageTimer = null;
    
    // Vérifier chaque calque qui pourrait contenir des tiles estLeve
    const calquesAVerifier = [this.calque_sol, this.calque_mur, this.calques_objets];
    
    calquesAVerifier.forEach(calque => {
      if (calque) {
        this.physics.add.overlap(this.player, calque, (player, tile) => {
          if (tile && tile.properties.estLeve) {
            if (!this.isOnLeve) {
              this.isOnLeve = true;
              console.log("Contact avec une tile estLeve !");
              
              // Effet visuel (shake caméra)
              this.cameras.main.shake(100, 0.003);
              
              // Infliger des dégâts immédiatement
              this.pvManager.damage(1);
              
              // Timer pour éviter les dégâts multiples trop rapides
              this.leveDamageTimer = this.time.delayedCall(500, () => {
                this.isOnLeve = false;
              });
            }
          }
        });
      }
    });

    /***********************
     *  CREATION DU CLAVIER *
     ************************/
    this.clavier = this.input.keyboard.createCursorKeys();
    this.clavier.O = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.clavier.I = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.clavier.F = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.clavier.P = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.clavier.M = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

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
    this.anims.create({
      key: "mage_attack",
      frames: this.anims.generateFrameNumbers("mage_attaque", { start: 0, end: 11 }),
      frameRate: 24,
      repeat: 0
    });

    // --- Caméra
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player);
    
    // Variables pour le système de tir
    this.lastDirection = 'right';

    // Enregistrer cette scène comme la scène de jeu active
    this.registry.set('currentGameScene', this.scene.key);

    // Afficher le message d'instruction au début du niveau
    this.afficherMessageInstruction();
  }

  afficherMessageInstruction() {
    const messageInstruction = this.add.text(
      this.cameras.main.centerX,
      100,
      "Trouvez la bonne porte",
      {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }
    ).setOrigin(0.5);
    
    messageInstruction.setScrollFactor(0);
    messageInstruction.setDepth(1000);
    this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: messageInstruction,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          messageInstruction.destroy();
        }
      });
    });
  }

  verifierContactPorte() {
    // Calculer la position du joueur en tuiles
    const tileX = this.calque_mur.worldToTileX(this.player.x);
    const tileY = this.calque_mur.worldToTileY(this.player.y);
    
    // Réinitialiser l'état du contact avec la porte
    this.surPorte = false;
    
    // Vérifier les tuiles autour du joueur
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tile = this.calque_mur.getTileAt(tileX + dx, tileY + dy);
        
        if (tile && tile.properties && tile.properties.estPorte === true) {
          this.surPorte = true;
          return;
        }
      }
    }
  }

  utiliserPorte() {
    // Vérifier si le joueur est sur une porte
    if (this.surPorte) {
      // Téléporter vers le menu (ou la prochaine scène)
      this.scene.start("niveau4");
    }
  }

  update() {
    // Ne pas bouger si les inputs sont bloqués (pendant la sélection de skill)
    if (this.inputsBlocked) {
      this.player.setVelocity(0);
      return;
    }

    // Ne pas bouger si on est en train d'attaquer
    if (this.isAttacking) {
      this.player.setVelocity(0);
      return;
    }
    
    const baseSpeed = 90;
    const speedMultiplier = this.skillManager ? this.skillManager.getSpeedMultiplier() : 1;
    const speed = baseSpeed * speedMultiplier;
    
    this.player.setVelocity(0);

    // Mouvements
    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.flipX = true;
      this.player.anims.play("mage_walk", true);
      this.lastDirection = 'left';
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.flipX = false;
      this.player.anims.play("mage_walk", true);
      this.lastDirection = 'right';
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("mage_idle", true);
    }

    if (this.clavier.up.isDown) {
      this.player.setVelocityY(-speed);
      this.lastDirection = 'up';
    } else if (this.clavier.down.isDown) {
      this.player.setVelocityY(speed);
      this.lastDirection = 'down';
    }

    // ===========================
    // Gestion du shoot (touche O)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.O)) {
      fct.lancerAttaque(this);
    }

    // ===========================
    // Gestion du menu pause (touche M)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.M)) {
      this.scene.launch("PauseScene", { from: this.scene.key });
      this.scene.pause();
    }

    // ===========================
    // Gestion des coffres (touche I)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.I)) {
      // Priorité 1 : Vérifier si on est sur une porte
      if (this.surPorte) {
        this.utiliserPorte();
      }
      // Priorité 2 : Gérer les coffres normalement
      else {
        fct.gererCoffre(this);
      }
    }

    // ===========================
    // Utiliser une potion (touche P)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.P)) {
      fct.utiliserPotion(this, this.pvManager);
    }

    // ===========================
    // Vérifier le contact avec la porte
    // ===========================
    this.verifierContactPorte();

    // ===========================
    // Mettre à jour la position de la lumière et du filtre noir
    // ===========================
    if (this.playerLight) {
      this.playerLight.x = this.player.x;
      this.playerLight.y = this.player.y;
    }
    
    // Mettre à jour la position du filtre noir
    if (this.filtrenoir) {
      this.filtrenoir.x = this.player.x;
      this.filtrenoir.y = this.player.y;
    }

    // Appliquer Light2D sur les bullets (existantes et futures)
    if (this.groupeBullets && this.groupeBullets.getChildren) {
      this.groupeBullets.getChildren().forEach((child) => {
        if (child.setPipeline && !child._light2dApplied) {
          child.setPipeline("Light2D");
          child._light2dApplied = true;
        }
      });

      if (this.groupeBullets.on) {
        this.groupeBullets.on("add", (group, child) => {
          if (child.setPipeline) {
            child.setPipeline("Light2D");
            child._light2dApplied = true;
          }
        });
      }
    }
  }

}
