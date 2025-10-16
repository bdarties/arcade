import PauseManager from "./pause.js";
import * as fct from "./fonctions.js";

export default class niveau3 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau3" });
  }

  preload() {
    // Charger uniquement la map spécifique à ce niveau
    this.load.tilemapTiledJSON("arena3", "./assets/maps/arene3.json");
  }

  create() {
    // --- PvManager
    this.pvManager = new fct.PvManager(this);
    
    // --- Initialiser le système de skills (accès global)
    this.skillManager = new fct.SkillManager(this);
    
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
    
    // Créer les calques de la carte arena1
    this.calque_sol = this.map.createLayer("calque_sol", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_mur = this.map.createLayer("calque_mur", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_fenetres = this.map.createLayer("calque_fenetres", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calques_objets = this.map.createLayer("calques_objets", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_trap = this.map.createLayer("calque_trap", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);
    this.calque_mur_haut = this.map.createLayer("calque_mur_haut", [tilesetPiege, tilesetAnimations, tileset2, tileset1]);

    // Définir la profondeur des calques pour l'affichage correct
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
    this.player.setDepth(5);
    this.scene.bringToTop('hud');

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
        this.calque_trap,
        this.calque_mur_haut,
      ],
      groups: ["groupeBullets"],
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

    // --- Collision avec les murs et le sol
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

    utiliserPorte() {
    // Vérifier si le joueur est sur une porte
    if (this.surPorte) {
      // Téléporter vers le menu (ou la prochaine scène)
      this.scene.start("salleporte");
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
    
    const baseSpeed = 150;
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
    // Gestion des coffres (touche I)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.I)) {
      fct.gererCoffre(this);
    }

    // ===========================
    // Utiliser une potion (touche P)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.P)) {
      fct.utiliserPotion(this, this.pvManager);
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

}
