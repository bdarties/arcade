import PauseManager from "./pause.js";
import * as fct from "./fonctions.js";
import Ennemi1 from "./ennemi.js";

export default class niveau2 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau2" });
  }

  preload() {
    // Charger les tilesets pour arene1
    this.load.image("piege", "./assets/maps/tiles/piege.png");
    this.load.image("animations", "./assets/maps/tiles/animations.png");
    this.load.image("tileset1", "./assets/maps/tiles/tileset1.png");
    this.load.image("tileset2", "./assets/maps/tiles/tileset2.png");
    this.load.tilemapTiledJSON("salle_leviers", "./assets/maps/salle_leviers.json");
    this.load.spritesheet("mage1", "./assets/mage1.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("magemarche", "./assets/magemarche.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("mage_attaque", "./assets/mage_attaque.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("ennemi1", "./assets/ennemi1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("fireball", "./assets/fireball_1.png", {
      frameWidth: 16,
      frameHeight: 16
    });
    // Charger l'image de la potion (on utilise le coeur comme placeholder)
    this.load.image('potion', './assets/hud/health/heart_3q.png');
    
    // NOUVEAU : Charger l'image du levier
    this.load.image("img_levier", "./assets/levier.png");
  }

  create() {
    // --- PvManager
    this.pvManager = new fct.PvManager(this);
    
    // --- Initialiser le système de skills (accès global)
    this.skillManager = new fct.SkillManager(this);
    
    // ===========================
    // NOUVEAU Système de leviers
    // ===========================
    this.leviers = [];
    this.sequenceCorrecte = Phaser.Utils.Array.Shuffle([0, 1, 2, 3, 4]);
    this.etapeActuelle = 0;
    this.porteDeverrouillee = false;
    this.surPorte = false;
    this.surLevier = null; // Index du levier sur lequel on se trouve
    this.indicateurLevier = null;
        
    // --- Groupe de potions au sol
    this.groupePotions = this.physics.add.group();

    // --- Groupe de bullets pour le tir
    this.groupeBullets = this.physics.add.group();

    // --- Charger la map salle_leviers
    this.map = this.make.tilemap({ key: "salle_leviers" });

    // Associer les tilesets de Tiled avec les images chargées (dans l'ordre défini dans le JSON)
    const tilesetPiege = this.map.addTilesetImage("piege", "piege");
    const tilesetAnimations = this.map.addTilesetImage("animations", "animations");
    const tileset2 = this.map.addTilesetImage("tileset2", "tileset2");
    const tileset1 = this.map.addTilesetImage("tileset1", "tileset1");

    // Créer les calques de la carte salle_leviers
    this.calque_sol = this.map.createLayer("calque_sol", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_mur = this.map.createLayer("calque_mur", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_fenetres = this.map.createLayer("calque_fenetres", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calques_objets = this.map.createLayer("calque_objets", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
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
    this.player = this.physics.add.sprite(220, 60, "mage1");
    this.player.body.setSize(36, 48);
    this.player.body.setOffset(14, 8);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5); // Entre les objets et les murs hauts
    this.scene.bringToTop('hud');

    // ==========================
    // NOUVEAU : Création des 5 leviers avec positions personnalisées
    // ==========================
    const positionsLeviers = [
      { x: 110, y: 290 },  // Levier 0
      { x: 810, y: 80 },  // Levier 1
      { x: 305, y: 520 },  // Levier 2
      { x: 1150, y: 600 },  // Levier 3
      { x: 1130, y: 90 }   // Levier 4
    ];
    
    for (let i = 0; i < 5; i++) {
      let levier = this.physics.add.staticSprite(
        positionsLeviers[i].x,
        positionsLeviers[i].y,
        "img_levier"
      );
      levier.setScale(1); // Ajuster si nécessaire (32x32)
      levier.setDepth(6); // Au-dessus du joueur
      levier.active = false; // État du levier (activé ou non)
      levier.numero = i; // Numéro du levier (0 à 4)
      
      this.leviers.push(levier);
    }

    // ==========================
    //
    // Configuration de la lumière
    //
    // ==========================
    // Configurer la lumière autour du joueur
    this.playerLight = fct.setupPlayerLight(this, this.player, {
      radius: 160,
      color: 0xf1faff,
      intensity: 0.9,
      ambientColor: 0x404040,
      tileLayers: [
        this.calque_sol,
        this.calque_mur,
        this.calque_fenetres,
        this.calques_objets,
        this.calques_cles,
        this.calque_trap,
        this.calque_mur_haut,
      ],
      groups: ["groupeEnnemis", "groupeBullets", "groupeFlechesEnnemis"],
      offsetY: -6,
    });

    // Créer un sprite de glow qui suit le joueur
    this.playerGlow = this.add.sprite(
      this.player.x,
      this.player.y,
      this.player.texture.key
    );
    this.playerGlow.setScale(this.player.scaleX, this.player.scaleY);
    this.playerGlow.setAlpha(0.6);
    
    if (this.playerGlow.setPipeline) {
      this.playerGlow.setPipeline("Light2D");
    }
    
    this.playerGlow.setDepth(this.player.depth - 1);

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

      // ===========================
        //
        // Création des ennemis
        //
        // ==========================
        this.groupeBullets = this.physics.add.group();
        this.physics.add.collider(
          this.groupeBullets,
          this.calque_mur,
          (bullet) => {
            bullet.destroy();
          }
        );
    
        this.groupeEnnemis = fct.creerEnnemis(this, Ennemi1);
    
    if (this.groupeEnnemis.getChildren().length === 0) {
      console.log("Aucun ennemi trouvé dans Tiled, création manuelle...");
      this.groupeEnnemis = this.physics.add.group();

      // Créer 6 ennemis à des positions proches
      const ennemi1 = new Ennemi1(this, 680, 250);
      const ennemi2 = new Ennemi1(this, 210, 270);
      const ennemi3 = new Ennemi1(this, 700, 520);
      const ennemi4 = new Ennemi1(this, 200, 650);

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
  }

  animatePics() {
    // Les animations des pièges sont déjà définies dans Tiled et gérées automatiquement par Phaser
    // Cette fonction pourrait être utilisée pour des animations personnalisées si nécessaire
    
    // Pour activer l'animation automatique des tiles, Phaser le fait par défaut
    // Si besoin d'animation manuelle, décommenter le code ci-dessous :
    
    /*
    const frameCount = 14;
    const frameDuration = 100;
    const firstGid = 1; // Premier GID du tileset piege
    
    let currentFrame = 0;
    this.picsToAnimate = [];
    
    if (this.pics) {
      this.pics.forEachTile(tile => {
        if (tile && tile.properties.estPiege) {
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
    */
  }

  // REMPLACER genererCombinaison() par cette version simplifiée
  // (déjà fait dans create avec Phaser.Utils.Array.Shuffle)

  // REMPLACER verifierContactLevier()
  verifierContactLevier() {
    // Réinitialiser l'état du contact
    const ancienLevier = this.surLevier;
    this.surLevier = null;
    
    // Vérifier si le joueur est proche d'un levier
    this.leviers.forEach((levier, index) => {
      if (this.physics.overlap(this.player, levier)) {
        this.surLevier = index;
        
        // Afficher l'indicateur seulement si on vient d'arriver sur le levier
        if (ancienLevier !== this.surLevier) {
          this.afficherIndicateurLevier(levier);
        }
      }
    });
    
    // Si on n'est plus sur un levier, supprimer l'indicateur
    if (ancienLevier !== null && this.surLevier === null) {
      this.supprimerIndicateurLevier();
    }
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

  // REMPLACER activerLevier()
  activerLevier() {
    if (this.surLevier === null) return;
    
    const indexLevier = this.surLevier;
    const levier = this.leviers[indexLevier];
    
    // Supprimer l'indicateur lors de l'activation
    this.supprimerIndicateurLevier();
    
    // Vérifier si c'est le bon levier dans la séquence
    if (indexLevier === this.sequenceCorrecte[this.etapeActuelle]) {
      // BON LEVIER !
      // Animation du levier (rotation)
      this.tweens.add({
        targets: levier,
        angle: { from: 0, to: -30 },
        yoyo: true,
        duration: 200
      });
      
      // Afficher une note/check ✅
      this.afficherFeedback("✅", 0x00ff00, levier.x, levier.y);
      
      // Marquer le levier comme activé
      levier.active = true;
      levier.setTint(0x00ff00); // Teinte verte
      
      this.etapeActuelle++;
      
      // Vérifier si la séquence est complète
      if (this.etapeActuelle === this.sequenceCorrecte.length) {
        console.log("🎉 Séquence complète ! Porte déverrouillée !");
        this.porteDeverrouillee = true;
        this.afficherFeedback("🎉 PORTE OUVERTE !", 0xffff00, 640, 300);
        
        // Effet visuel de succès
        this.cameras.main.flash(500, 0, 255, 0);
      }
    } else {
      // MAUVAIS LEVIER !
      // Afficher une croix ❌
      this.afficherFeedback("❌", 0xff0000, levier.x, levier.y);
      
      console.log("❌ Mauvaise séquence ! Reset...");
      
      // Effet visuel d'erreur
      this.cameras.main.shake(200, 0.005);
      
      // Réinitialiser la séquence
      this.reinitialiserSequence();
    }
  }

  reinitialiserSequence() {
    this.leviers.forEach(levier => {
      levier.active = false;
      levier.clearTint(); // Enlever la teinte
      levier.angle = 0; // Remettre l'angle à 0
    });
    this.etapeActuelle = 0;
  }

  afficherFeedback(texte, couleur, x, y) {
    // Position par défaut au-dessus du joueur si non spécifiée
    if (x === undefined) x = this.player.x;
    if (y === undefined) y = this.player.y - 40;
    
    // Créer un texte flottant
    const feedbackText = this.add.text(x, y, texte, {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    feedbackText.setOrigin(0.5);
    feedbackText.setDepth(100);
    
    // Animation : monte et disparaît
    this.tweens.add({
      targets: feedbackText,
      y: feedbackText.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        feedbackText.destroy();
      }
    });
  }

  afficherIndicateurLevier(levier) {
    // Supprimer l'ancien indicateur s'il existe
    this.supprimerIndicateurLevier();
    
    // Créer le texte indicateur
    this.indicateurLevier = this.add.text(
      levier.x,
      levier.y - 50,
      'Appuyez sur I',
      {
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    this.indicateurLevier.setOrigin(0.5);
    this.indicateurLevier.setDepth(100);
    
    // Animation de pulsation
    this.tweens.add({
      targets: this.indicateurLevier,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  supprimerIndicateurLevier() {
    if (this.indicateurLevier) {
      this.indicateurLevier.destroy();
      this.indicateurLevier = null;
    }
  }

  utiliserPorte() {
    // Vérifier si le joueur est sur une porte ET si elle est déverrouillée
    if (this.surPorte) {
      if (this.porteDeverrouillee) {
        console.log("🚪 Passage à la salle suivante...");
        this.scene.start("niveau3");
      } else {
        console.log("🔒 La porte est verrouillée ! Complétez la séquence de leviers.");
        this.afficherFeedback("🔒 Porte verrouillée !", 0xff0000);
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
    // Gestion du menu pause (touche F)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.F)) {
      this.scene.launch("PauseScene", { from: this.scene.key });
      this.scene.pause();
    }

    // ===========================
    // Gestion des leviers, coffres et de la porte (touche I)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.I)) {
      // Priorité 1 : Vérifier si on est sur un levier
      if (this.surLevier !== null) {
        this.activerLevier();
      }
      // Priorité 2 : Vérifier si on est sur une porte
      else if (this.surPorte) {
        this.utiliserPorte();
      }
      // Priorité 3 : Gérer les coffres normalement
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
    // Vérifier les contacts avec leviers et porte
    // ===========================
    this.verifierContactLevier();
    this.verifierContactPorte();


        // Mise à jour des ennemis
    if (this.groupeEnnemis) {
      this.groupeEnnemis.getChildren().forEach((ennemi) => {
        ennemi.update();
      });
    }

    // ===========================
    // Synchroniser le glow avec le joueur
    // ===========================
    if (this.playerGlow) {
      this.playerGlow.x = this.player.x;
      this.playerGlow.y = this.player.y;
      this.playerGlow.flipX = this.player.flipX;
      if (this.player.anims && this.player.anims.currentAnim) {
        const key = this.player.anims.currentAnim.key;
        if (
          !this.playerGlow.anims.currentAnim ||
          this.playerGlow.anims.currentAnim.key !== key
        ) {
          this.playerGlow.anims.play(key, true);
        }
      } else {
        // si pas d'anim, forcer le frame courant
        if (this.player.frame)
          this.playerGlow.setFrame(
            this.player.frame.name || this.player.frame.index
          );
      }
    }

    // Mettre à jour la position de la lumière
    if (this.playerLight) {
      this.playerLight.x = this.player.x;
      this.playerLight.y = this.player.y - 6; // Offset Y
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
