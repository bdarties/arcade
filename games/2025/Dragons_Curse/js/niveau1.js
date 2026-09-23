import PauseManager from "./pause.js";
import * as fct from "./fonctions.js";
import Ennemi1 from "./ennemi.js";

export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  preload() {
    this.load.tilemapTiledJSON("arena1", "./assets/maps/arene1.json");
    this.load.image("filtre", "./assets/black.png");
    this.load.audio("porteSound", "./assets/sounds/porte.mp3");
  }

  create() {
    this.pvManager = new fct.PvManager(this);
    this.levelManager = new fct.LevelManager(this, { enemiesPerLevel: 3 });
    this.skillManager = this.levelManager.skillManager;
    
    this.surPorte = false;
    this.porteDeverrouillee = false;
    
    this.groupePotions = this.physics.add.group();

    // --- Groupe de bullets pour le tir
    this.groupeBullets = this.physics.add.group();

    // --- Charger la map arena1
    this.map = this.make.tilemap({ key: "arena1" });

    // Associer les tilesets de Tiled avec les images chargées (dans l'ordre défini dans le JSON)
    const tilesetPiege = this.map.addTilesetImage("piege", "piege");
    const tilesetAnimations = this.map.addTilesetImage("animations", "animations");
    const tileset2 = this.map.addTilesetImage("tileset2", "tileset2");
    const tileset1 = this.map.addTilesetImage("tileset1", "tileset1");
    
    // Créer les calques de la carte arena1
    this.calque_sol = this.map.createLayer("calque_sol", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_mur = this.map.createLayer("calque_mur", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_fenetres = this.map.createLayer("calque_fenetres", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calques_objets = this.map.createLayer("calques_objets", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_trap = this.map.createLayer("calque_trap", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    
    // Calque optionnel
    try {
      this.calque_mur_haut = this.map.createLayer("calque_mur_haut", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
      if (this.calque_mur_haut) {
        this.calque_mur_haut.setDepth(10);
        this.calque_mur_haut.setPipeline('Light2D');
        this.calque_mur_haut.setCollisionByProperty({ estSolide: true });
      }
    } catch (e) {
      console.log("Calque 'calque_mur_haut' non trouvé, ignoré");
    }

    // Référence pour les pièges (utilisé dans l'animation)
    this.pics = this.calque_trap;
    
    // Référence pour les coffres
    this.poteaux = this.calques_objets;

    // --- Animation manuelle des pièges
    this.animatePics();

    // Charger les animations des projectiles (seulement si elles n'existent pas)
    if (!this.anims.exists("fireball_anim")) {
      this.anims.create({
        key: "fireball_anim",
        frames: this.anims.generateFrameNumbers("fireball", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
    }
    if (!this.anims.exists("arrow_anim")) {
      this.anims.create({
        key: "arrow_anim",
        frames: this.anims.generateFrameNumbers("arrow", { start: 0, end: 4 }),
        frameRate: 10,
        repeat: -1
      });
    }

    // --- Joueur
    this.player = this.physics.add.sprite(220, 250, "mage1");
    this.player.body.setSize(36, 48);
    this.player.body.setOffset(14, 8);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5); // Entre les objets et les murs hauts
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

    // --- Collision bullets avec les murs
    this.physics.add.collider(this.groupeBullets, this.calque_mur, (bullet) => {
      bullet.destroy();
    });

    // ===========================
    // Création des ennemis
    // ===========================
    this.groupeEnnemis = fct.creerEnnemis(this, Ennemi1);

    if (this.groupeEnnemis.getChildren().length === 0) {
      console.log("Aucun ennemi trouvé dans Tiled, création manuelle...");
      this.groupeEnnemis = this.physics.add.group();

      // Créer 6 ennemis à des positions proches
      const ennemi1 = new Ennemi1(this, 600, 250);
      const ennemi2 = new Ennemi1(this, 420, 100);
      const ennemi3 = new Ennemi1(this, 1100, 180);
      const ennemi4 = new Ennemi1(this, 1100, 520);
      const ennemi6 = new Ennemi1(this, 600, 600);

      this.groupeEnnemis.add(ennemi1);
      this.groupeEnnemis.add(ennemi2);
      this.groupeEnnemis.add(ennemi3);
      this.groupeEnnemis.add(ennemi4);
      this.groupeEnnemis.add(ennemi6);
    }

    this.physics.add.overlap(
      this.groupeBullets,
      this.groupeEnnemis,
      this.balleToucheEnnemi,
      null,
      this
    );

    this.groupeFlechesEnnemis = this.physics.add.group();
    this.physics.add.collider(
      this.groupeFlechesEnnemis,
      this.calque_mur,
      (fleche) => {
        fleche.destroy();
      }
    );
    this.physics.add.overlap(
      this.groupeFlechesEnnemis,
      this.player,
      this.flecheToucheJoueur,
      null,
      this
    );

    // Appliquer Light2D aux ennemis existants et futurs
    if (this.groupeEnnemis && this.groupeEnnemis.getChildren) {
      this.groupeEnnemis.getChildren().forEach((child) => {
        if (child && child.setPipeline) {
          child.setPipeline("Light2D");
        }
      });
      
      if (this.groupeEnnemis.on) {
        this.groupeEnnemis.on("add", (group, child) => {
          if (child && child.setPipeline) {
            child.setPipeline("Light2D");
          }
        });
      }
    }

    // Appliquer Light2D aux flèches ennemies
    this.groupeFlechesEnnemis.on('add', (group, child) => {
      if (child && child.setPipeline) {
        child.setPipeline('Light2D');
      }
    });

    // Appliquer Light2D aux bullets du joueur
    this.groupeBullets.on('add', (group, child) => {
      if (child && child.setPipeline) {
        child.setPipeline('Light2D');
      }
    });

    // Appliquer Light2D aux potions
    this.groupePotions.on('add', (group, child) => {
      if (child && child.setPipeline) {
        child.setPipeline('Light2D');
      }
    });

    this.damageSound = this.sound.add("damageSound");
    this.damageSound.setVolume(0.5);

    // --- Collision avec les murs et le sol
    if (this.calque_mur) {
      this.calque_mur.setCollisionByProperty({ estSolide: true });
      this.physics.add.collider(this.player, this.calque_mur);
    }
    
    if (this.calque_sol) {
      this.calque_sol.setCollisionByProperty({ estSolide: true });
      this.physics.add.collider(this.player, this.calque_sol);
    }

    // Collision des ennemis avec les murs
    this.physics.add.collider(this.groupeEnnemis, this.calque_mur);
    if (this.calque_mur_haut) {
      this.physics.add.collider(this.groupeEnnemis, this.calque_mur_haut);
    }

    // --- Collision danger (pièges) avec timer de vérification
    this.isDamaged = false;
    this.damageTimer = null;
    
    if (this.calque_trap) {
      this.physics.add.overlap(this.player, this.calque_trap, (player, tile) => {
        if (tile && tile.properties.estPiege) {
          if (!this.isDamaged) {
            this.isDamaged = true;
            this.cameras.main.shake(100, 0.005);
            
            this.pvManager.damage(1);
            
            this.damageTimer = this.time.delayedCall(500, () => {
              this.isDamaged = false;
            });
          }
        }
      });
    }

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

    // --- Animations du joueur (seulement si elles n'existent pas)
    if (!this.anims.exists("mage_idle")) {
      this.anims.create({
        key: "mage_idle",
        frames: this.anims.generateFrameNumbers("mage1", { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
      });
    }
    if (!this.anims.exists("mage_walk")) {
      this.anims.create({
        key: "mage_walk",
        frames: this.anims.generateFrameNumbers("magemarche", { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (!this.anims.exists("mage_attack")) {
      this.anims.create({
        key: "mage_attack",
        frames: this.anims.generateFrameNumbers("mage_attaque", { start: 0, end: 11 }),
        frameRate: 24,
        repeat: 0
      });
    }

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
      "Tuez tous les ennemis !",
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

  animatePics() {
    // Vérifier que le calque existe
    if (!this.calque_trap) {
      console.warn("calque_trap non trouvé, animation des pièges ignorée");
      return;
    }
    
    const frameCount = 14;
    const frameDuration = 100;
    const firstGid = 1;
    
    let currentFrame = 0;
    this.picsToAnimate = [];
    
    this.calque_trap.forEachTile(tile => {
      if (tile.index >= firstGid && tile.index < firstGid + frameCount) {
        this.picsToAnimate.push({ x: tile.x, y: tile.y });
      }
    });

    this.time.addEvent({
      delay: frameDuration,
      callback: () => {
        currentFrame = (currentFrame + 1) % frameCount;
        this.picsToAnimate.forEach(pos => {
          const tile = this.calque_trap.getTileAt(pos.x, pos.y);
          if (tile) {
            tile.index = firstGid + currentFrame;
          }
        });
      },
      loop: true
    });
  }

  verifierContactPorte() {
    const tileX = this.calque_mur.worldToTileX(this.player.x);
    const tileY = this.calque_mur.worldToTileY(this.player.y);
    
    this.surPorte = false;
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tile = this.calque_mur.getTileAt(tileX + dx, tileY + dy);
        
        if (tile && tile.properties && tile.properties.estPorte === true) {
          this.surPorte = true;
          
          const ennemisRestants = this.groupeEnnemis ? this.groupeEnnemis.getChildren().length : 0;
          
          if (!this.messageCooldown || this.time.now > this.messageCooldown) {
            if (ennemisRestants === 0) {
              this.porteDeverrouillee = true;
              console.log("🚪 Tous les ennemis éliminés ! Porte déverrouillée ! Appuyez sur I pour passer au niveau suivant.");
            } else {
              console.log(`🔒 Porte verrouillée ! Éliminez tous les ennemis pour l'ouvrir. (${ennemisRestants} restant(s))`);
            }
            this.messageCooldown = this.time.now + 2000; // Cooldown de 2 secondes
          }
          return;
        }
      }
    }
  }

  utiliserPorte() {
    if (this.surPorte) {
      if (this.porteDeverrouillee) {
        console.log("🚪 Passage au niveau suivant...");
        this.sound.play("porteSound", { volume: 0.7 });
        this.scene.start("niveau2");
      } else {
        const ennemisRestants = this.groupeEnnemis ? this.groupeEnnemis.getChildren().length : 0;
        console.log(`🔒 La porte est verrouillée ! Éliminez tous les ennemis. (${ennemisRestants} restant(s))`);
        this.afficherMessagePorteVerrouillee();
      }
    }
  }

  afficherMessagePorteVerrouillee() {
    if (this.messagePorteActive) {
      return;
    }
    
    this.messagePorteActive = true;
    
    const messagePorte = this.add.text(
      this.player.x,
      this.player.y - 60,
      "🔒 Porte verrouillée !",
      {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff',
        padding: { x: 15, y: 8 },
        align: 'center'
      }
    ).setOrigin(0.5);
    
    // Définir la profondeur pour qu'il soit visible au-dessus de tout
    messagePorte.setDepth(1000);
    
    // Effet d'apparition : scale + bounce
    messagePorte.setScale(0);
    this.tweens.add({
      targets: messagePorte,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    // Légère animation de flottement
    this.tweens.add({
      targets: messagePorte,
      y: messagePorte.y - 10,
      duration: 800,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut'
    });
    
    // Faire disparaître le message après 2 secondes avec fondu
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: messagePorte,
        alpha: 0,
        y: messagePorte.y - 20,
        duration: 500,
        ease: 'Power2.easeIn',
        onComplete: () => {
          messagePorte.destroy();
          this.messagePorteActive = false;
        }
      });
    });
  }

  update() {
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
    // Gestion du menu pause (touche F ou M)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.F) || Phaser.Input.Keyboard.JustDown(this.clavier.M)) {
      this.scene.launch("PauseScene", { from: this.scene.key });
      this.scene.pause();
    }

    // ===========================
    // Gestion des coffres et de la porte (touche I)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.I)) {
      // Vérifier d'abord si on est sur une porte
      if (this.surPorte) {
        this.utiliserPorte();
      } else {
        // Sinon, gérer les coffres normalement
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

    // Mise à jour des ennemis
    if (this.groupeEnnemis) {
      this.groupeEnnemis.getChildren().forEach((ennemi) => {
        ennemi.update();
      });
    }

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

    // Appliquer Light2D sur les flèches ennemies (existantes et futures)
    if (this.groupeFlechesEnnemis && this.groupeFlechesEnnemis.getChildren) {
      this.groupeFlechesEnnemis.getChildren().forEach((child) => {
        if (child && child.setPipeline) {
          child.setPipeline("Light2D");
        }
      });
      
      if (this.groupeFlechesEnnemis.on) {
        this.groupeFlechesEnnemis.on("add", (group, child) => {
          if (child && child.setPipeline) {
            child.setPipeline("Light2D");
          }
        });
      }
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

  balleToucheEnnemi(bullet, ennemi) {
    // Calculer les dégâts avec le bonus de Force
    const degatsBase = 1;
    
    let bonusDegats = 0;
    if (this.skillManager) {
      bonusDegats = this.skillManager.getDamageBonus();
    }
    
    const degatsTotal = degatsBase + bonusDegats;

    ennemi.prendreDegats(degatsTotal);
    bullet.destroy();
    this.damageSound.play();
  }

  flecheToucheJoueur(player, fleche) {
    if (fleche.origine === "ennemi") {
      console.log("Joueur touché par une flèche !");
      
      const degats = fleche.degats || 1;
      this.pvManager.damage(degats);

      player.setTint(0xff0000);
      this.time.delayedCall(200, () => {
        player.clearTint();
      });

      fleche.destroy();
    }
  }

  flecheToucheEnnemi(fleche, ennemi) {
    // Ne pas toucher son propre ennemi source
    if (fleche.origine === "ennemi" && fleche.ennemiSource === ennemi) {
      return;
    }

    // Seulement les flèches du joueur blessent les ennemis
    if (fleche.origine !== "ennemi") {
      ennemi.prendreDegats(fleche.degats);
      fleche.destroy();
    }
  }

}
