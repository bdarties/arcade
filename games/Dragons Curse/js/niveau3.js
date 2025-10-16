import PauseManager from "./pause.js";
import * as fct from "./fonctions.js";
import Ennemi1 from "./ennemi.js";

export default class niveau3 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau3" });
  }

  preload() {
    // Charger uniquement la map spécifique à ce niveau
    this.load.tilemapTiledJSON("arena3", "./assets/maps/arene3.json");
    this.load.image("filtre", "./assets/black.png");
    
    // Charger le spritesheet de l'ennemi
    this.load.spritesheet("ennemi1", "./assets/ennemi1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    // --- PvManager
    this.pvManager = new fct.PvManager(this);
    
    // --- Initialiser le système de skills (accès global)
    this.skillManager = new fct.SkillManager(this);
    
    // ===========================
    // NOUVEAU Système de porte
    // ===========================
    this.porteDeverrouillee = false;
    this.surPorte = false;
    this.indicateurPorte = null;
    
    // --- Groupe de potions au sol
    this.groupePotions = this.physics.add.group();

    // --- Groupe de bullets pour le tir
    this.groupeBullets = this.physics.add.group();

    // --- Charger la map arena3
    this.map = this.make.tilemap({ key: "arena3" });

    // Associer les tilesets de Tiled avec les images chargées (dans l'ordre défini dans le JSON)
    const tilesetPiege = this.map.addTilesetImage("piege", "piege");
    const tilesetAnimations = this.map.addTilesetImage("animations", "animations");
    const tileset2 = this.map.addTilesetImage("tileset2", "tileset2");
    const tileset1 = this.map.addTilesetImage("tileset1", "tileset1");
    
    // Créer les calques de la carte arena3
    this.calque_sol = this.map.createLayer("calque_sol", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_mur = this.map.createLayer("calque_mur", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_fenetres = this.map.createLayer("calque_fenetres", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calques_objets = this.map.createLayer("calques_objets", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_trap = this.map.createLayer("calque_trap", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_mur_haut = this.map.createLayer("calque_mur_haut", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);

    // Définir la profondeur des calques pour l'affichage correct
    if (this.calque_sol) this.calque_sol.setDepth(0);
    if (this.calque_mur) this.calque_mur.setDepth(1);
    if (this.calque_fenetres) this.calque_fenetres.setDepth(2);
    if (this.calques_objets) this.calques_objets.setDepth(3);
    if (this.calque_trap) this.calque_trap.setDepth(4);
    if (this.calque_mur_haut) this.calque_mur_haut.setDepth(10);

    // Référence pour les pièges (utilisé dans l'animation)
    this.pics = this.calque_trap;
    
    // Référence pour les coffres
    this.poteaux = this.calques_objets;

    // --- Animation manuelle des pièges
    this.animatePics();

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

    // ==========================
    //
    // Configuration des levels
    //
    // ==========================

    // Initialiser le système de level (3 ennemis = 1 level)
    this.levelManager = new fct.LevelManager(this, { enemiesPerLevel: 3 });

    // Initialiser le système de skills
    this.skillManager = this.levelManager.skillManager;

    // ===========================
    //
    // Configuration des collisions
    //
    // ===========================

    if (this.calque_mur) {
      this.calque_mur.setCollisionByProperty({ estSolide: true });
      this.physics.add.collider(this.player, this.calque_mur);
    }
    
    if (this.calque_sol) {
      this.calque_sol.setCollisionByProperty({ estSolide: true });
      this.physics.add.collider(this.player, this.calque_sol);
    }

    if (this.calques_objets) {
      this.calques_objets.setCollisionByProperty({ estSolide: true });
      this.physics.add.collider(this.player, this.calques_objets);
    }

    // Collision avec les potions
    this.physics.add.overlap(this.player, this.groupePotions, this.ramasserPotion, null, this);

    // --- Collision bullets avec les murs
    this.physics.add.collider(this.groupeBullets, this.calque_mur, (bullet) => {
      bullet.destroy();
    });

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
    this.clavier.E = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // ===========================
    //
    // Création des ennemis
    //
    // ==========================
    this.groupeEnnemis = fct.creerEnnemis(this, Ennemi1);

    if (this.groupeEnnemis.getChildren().length === 0) {
      console.log("Aucun ennemi trouvé dans Tiled, création manuelle...");
      this.groupeEnnemis = this.physics.add.group();

      // Créer 5 ennemis à des positions personnalisées
      const ennemi1 = new Ennemi1(this, 650, 450);
      const ennemi2 = new Ennemi1(this, 620, 100);
      const ennemi3 = new Ennemi1(this, 1100, 180);
      const ennemi4 = new Ennemi1(this, 1100, 520);

      this.groupeEnnemis.add(ennemi1);
      this.groupeEnnemis.add(ennemi2);
      this.groupeEnnemis.add(ennemi3);
      this.groupeEnnemis.add(ennemi4);
    }

    this.physics.add.collider(this.groupeEnnemis, this.calque_mur);
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

    this.damageSound = this.sound.add("damageSound");
    this.damageSound.setVolume(0.5);

    // ==========================
    // OPTIMISATION: Configurer les listeners Light2D une seule fois
    // ==========================
    this.setupLight2DListeners();
  }

  setupLight2DListeners() {
    // Configurer les listeners pour appliquer Light2D aux nouveaux objets
    if (this.groupeFlechesEnnemis && this.groupeFlechesEnnemis.on && !this.flechesListenerSet) {
      this.groupeFlechesEnnemis.on("add", (group, child) => {
        if (child && child.setPipeline) {
          child.setPipeline("Light2D");
        }
      });
      this.flechesListenerSet = true;
    }

    if (this.groupeBullets && this.groupeBullets.on && !this.bulletsListenerSet) {
      this.groupeBullets.on("add", (group, child) => {
        if (child && child.setPipeline) {
          child.setPipeline("Light2D");
        }
      });
      this.bulletsListenerSet = true;
    }

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
    // Les animations des pièges sont déjà définies dans Tiled et gérées automatiquement par Phaser
  }

  verifierContactPorte() {
    // Calculer la position du joueur en tuiles
    const tileX = this.calque_mur.worldToTileX(this.player.x);
    const tileY = this.calque_mur.worldToTileY(this.player.y);
    
    // Réinitialiser l'état du contact avec la porte
    this.surPorte = false;
    
    // Vérifier les tuiles autour du joueur (car le joueur peut chevaucher plusieurs tuiles)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tile = this.calque_mur.getTileAt(tileX + dx, tileY + dy);
        
        if (tile && tile.properties && tile.properties.estPorte === true) {
          this.surPorte = true;
          
          // Vérifier si tous les ennemis sont éliminés
          const ennemisRestants = this.groupeEnnemis ? this.groupeEnnemis.getChildren().length : 0;
          
          // Afficher un message d'indication
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
    // Vérifier si le joueur est sur une porte et si elle est déverrouillée
    if (this.surPorte && this.porteDeverrouillee) {
      console.log("Passage au niveau suivant !");
      
      // Téléporter vers la salle de sélection (ou le niveau suivant)
      this.scene.start("salleporte");
    } else if (this.surPorte && !this.porteDeverrouillee) {
      const ennemisRestants = this.groupeEnnemis ? this.groupeEnnemis.getChildren().length : 0;
      console.log(`🔒 Éliminez les ${ennemisRestants} ennemi(s) restant(s) pour ouvrir la porte!`);
    }
  }

  afficherFeedback(texte, couleur, x, y) {
    const feedback = this.add.text(x, y, texte, {
      fontSize: "16px",
      color: `#${couleur.toString(16).padStart(6, '0')}`,
      backgroundColor: "#000000",
      padding: { x: 8, y: 8 }
    });
    feedback.setOrigin(0.5);
    feedback.setDepth(100);

    this.tweens.add({
      targets: feedback,
      alpha: 0,
      y: y - 30,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        feedback.destroy();
      }
    });
  }

  verifierTousEnnemisElimines() {
    // Vérifier s'il reste des ennemis vivants
    if (this.groupeEnnemis && this.groupeEnnemis.getChildren().length === 0) {
      if (!this.porteDeverrouillee) {
        this.porteDeverrouillee = true;
        console.log("Tous les ennemis éliminés ! Porte déverrouillée !");
        
        // Feedback visuel
        this.afficherFeedback("Porte déverrouillée !", 0x00ff00, this.cameras.main.centerX, this.cameras.main.centerY);
        
        // Effet sonore optionnel
        // this.sound.play('unlockSound');
      }
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

    // Vérifier si tous les ennemis sont éliminés
    this.verifierTousEnnemisElimines();

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

  ramasserPotion(player, potion) {
    fct.ramasserPotion(this, player, potion);
  }

  balleToucheEnnemi(bullet, ennemi) {
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
    if (fleche.origine === "ennemi" && fleche.ennemiSource === ennemi) {
      return;
    }

    if (fleche.origine !== "ennemi") {
      ennemi.prendreDegats(fleche.degats);
      fleche.destroy();
    }
  }
}
