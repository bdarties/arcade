import * as fct from "./fonctions.js";
import Enemy from "./enemy.js";
import Enemy2 from "./enemy2.js";
import Boss from "./boss.js";

/***********************************************************************/
/** VARIABLES LOCALES AU NIVEAU
/***********************************************************************/
let player2;

/***********************************************************************/
/** FONCTIONS PERSONNAGE LOCALES
/***********************************************************************/
function preloadPersonnage(scene) {
  scene.load.spritesheet("img_perso2", "./assets/dude2.png", { frameWidth: 32, frameHeight: 48 });
  scene.load.spritesheet("img_perso2_shoot", "./assets/dude2_shoot.png", { frameWidth: 32, frameHeight: 48 });
  scene.load.image("dude2_face", "./assets/dude_face.png");
  scene.load.image("bullet", "./assets/bullet.png");
}

function creerPlayer(scene, x, y) {
  player2 = scene.physics.add.sprite(x, y, "img_perso2");
  player2.setCollideWorldBounds(true);
  player2.setDepth(2);
  return player2;
}

function creerAnimations(scene) {
  scene.anims.create({
    key: "anim2_marche",
    frames: scene.anims.generateFrameNumbers("img_perso2", { start: 0, end: 4 }),
    frameRate: 10,
    repeat: -1
  });

  scene.anims.create({
    key: "anim2_idle",
    frames: [{ key: "img_perso2", frame: 0 }],
    frameRate: 20
  });

  scene.anims.create({
    key: "anim2_shoot",
    frames: scene.anims.generateFrameNumbers("img_perso2_shoot", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: 0
  });
}

/***********************************************************************/
/** UPDATE PLAYER
/***********************************************************************/
function updatePlayer(scene, background, gameOverActif = false, isShooting = false) {
  if (gameOverActif) return;

  const vitesseX = player2.body.velocity.x;
  const onGround = player2.body.blocked.down;
  
  if (background && vitesseX !== 0) background.tilePositionX += vitesseX * 0.005;
  
  if (!isShooting) {
    if (fct.clavier.left.isDown) {
      player2.setVelocityX(-160);
      player2.setFlipX(false);
      player2.anims.play("anim2_marche", true);
    } else if (fct.clavier.right.isDown) {
      player2.setVelocityX(160);
      player2.setFlipX(true);
      player2.anims.play("anim2_marche", true);
    } else {
      player2.setVelocityX(0);
      player2.anims.stop();
      player2.setTexture("dude2_face");
    }
  } else {
    if (fct.clavier.left.isDown) {
      player2.setVelocityX(-160);
      player2.setFlipX(false);
    } else if (fct.clavier.right.isDown) {
      player2.setVelocityX(160);
      player2.setFlipX(true);
    } else {
      player2.setVelocityX(0);
    }
  }

  if (scene.toucheI.isDown && onGround) {
    player2.setVelocityY(-280);
  }
}

/***********************************************************************/
/** SCENE NIVEAU3
/***********************************************************************/
export default class niveau3 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau3" });
  }

  preload() {
    this.load.tilemapTiledJSON("carte_4", "./assets/map_4.json");

    this.load.image("parallax4_arriere", "./assets/f4_arriere.png");
    this.load.image("parallax4_milieu1", "./assets/f4_milieu1.png");
    this.load.image("parallax4_milieu2", "./assets/f4_milieu2.png");
    this.load.image("parallax4_milieu3", "./assets/f4_milieu3.png");
    this.load.image("parallax4_avant", "./assets/f4_avant.png");

    this.load.spritesheet('boss_walk', './assets/boss_walk.png', { frameWidth: 72, frameHeight: 72 });
    this.load.spritesheet('boss_attack', './assets/boss_attack.png', { frameWidth: 72, frameHeight: 72 });
    this.load.spritesheet('boss_attack2', './assets/boss_attack2.png', { frameWidth: 72, frameHeight: 72 });
    this.load.spritesheet('boss_attack3', './assets/boss_attack3.png', { frameWidth: 72, frameHeight: 72 });
    this.load.spritesheet('boss_jump', './assets/boss_jump.png', { frameWidth: 72, frameHeight: 72 });
    this.load.spritesheet('boss_death', './assets/boss_death.png', { frameWidth: 72, frameHeight: 72 });

    this.load.spritesheet('enemy1_run', './assets/enemy1_run.png', { frameWidth: 32, frameHeight: 24 });
    this.load.spritesheet('enemy2_run', './assets/enemy2_run.png', { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('enemy1_attack', './assets/enemy1_attack.png', { frameWidth: 32, frameHeight: 24 });
    this.load.spritesheet('enemy2_attack', './assets/enemy2_attack.png', { frameWidth: 32, frameHeight: 40 });
    
    this.load.image("bullet2", "./assets/bullet2.png");
    this.load.image("bullet3", "./assets/bullet3.png");

    this.load.image("porteFermee", "./assets/porte_fermee.png");
    this.load.image("porteOuverte", "./assets/door3_open.png");

    this.load.audio("musique2", "./assets/musique2.mp3");
    this.load.audio("shoot", "./assets/shoot1.mp3");
    fct.preloadCommun(this);
    preloadPersonnage(this);
  }

  create() {
    const carteDuNiveau = this.add.tilemap("carte_4");
    const tileset4 = carteDuNiveau.addTilesetImage("tuiles_de_jeu4", "Phaser_tuilesdejeu4");
    const tileset5 = carteDuNiveau.addTilesetImage("tuiles_de_jeu5", "Phaser_tuilesdejeu5");

    const calque_background = carteDuNiveau.createLayer("calque_background", tileset4);
    const calque_background3 = carteDuNiveau.createLayer("calque_background3", [tileset4, tileset5]);
    const calque_background2 = carteDuNiveau.createLayer("calque_background2", [tileset4, tileset5]);
    this.ladder_layer = carteDuNiveau.createLayer("ladder_layer", tileset4);
    const calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", tileset4);
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    const worldWidth = carteDuNiveau.widthInPixels || 1280;
    const worldHeight = carteDuNiveau.heightInPixels || 720;

    this.fond_arriere = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax4_arriere").setOrigin(0).setScrollFactor(0.2).setDepth(-5);
    this.fond_milieu1 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax4_milieu1").setOrigin(0).setScrollFactor(0.5).setDepth(-4);
    this.fond_milieu2 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax4_milieu2").setOrigin(0).setScrollFactor(1).setDepth(-3);
    this.fond_milieu3 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax4_milieu3").setOrigin(0).setScrollFactor(1.3).setDepth(-2);
    this.fond_avant = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax4_avant").setOrigin(0).setScrollFactor(0.95).setDepth(-1);

    this.player2 = creerPlayer(this, 100, 450);
    this.physics.add.collider(this.player2, calque_plateformes);

    fct.initClavier(this);
    creerAnimations(this);

    this.grp_balles_ennemis = this.physics.add.group();

    this.physics.add.collider(this.grp_balles_ennemis, calque_plateformes, (balle) => {
      balle.destroy();
    });

    this.physics.add.overlap(player2, this.grp_balles_ennemis, (player, balle) => {
      balle.destroy();
      fct.perdreCoeur(this);
    });

    this.grp_portal = this.physics.add.group();
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.toucheI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    this.grp_bullets = this.physics.add.group({
      defaultKey: "bullet",
      maxSize: 10
    });

    this.spawnPoint = { x: 100, y: 450 };

    this.grp_ennemis = this.physics.add.group();

    this.anims.create({
      key: "anim_enemy1_run",
      frames: this.anims.generateFrameNumbers("enemy1_run", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "anim_enemy1_attack",
      frames: this.anims.generateFrameNumbers("enemy1_attack", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0
    });

    this.anims.create({
      key: "anim_enemy2_run",
      frames: this.anims.generateFrameNumbers("enemy2_run", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "anim_enemy2_attack",
      frames: this.anims.generateFrameNumbers("enemy2_attack", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0
    });

    const tab_objects = carteDuNiveau.getObjectLayer("object_layer")?.objects || [];
    
    tab_objects.forEach(point => {
      if (point.name === "start") {
        this.spawnPoint = { x: point.x, y: point.y };
      }
    });

    tab_objects.forEach(point => {
      if (point.name === "portal") {
        let portal_properties = {};
        point.properties.forEach(prop => {
          if (prop.name === "id") portal_properties.id = prop.value;
          if (prop.name === "target") portal_properties.target = prop.value;
        });

        let portal = this.physics.add.sprite(point.x, point.y, "porteFermee");
        portal.id = portal_properties.id;
        portal.target = portal_properties.target;
        portal.ouverte = false;
        portal.setDepth(1);

        this.grp_portal.add(portal);
        portal.body.allowGravity = false;
      }
    });

    tab_objects.forEach(point => {
      if (point.name === "enemy_1") {
        let ennemi = new Enemy(this, point.x, point.y, calque_plateformes);
        this.grp_ennemis.add(ennemi);
        ennemi.setCollideWorldBounds(true);
        ennemi.setDepth(1);
      }

      if (point.name === "enemy_2") {
        let ennemi = new Enemy2(this, point.x, point.y, calque_plateformes);
        this.grp_ennemis.add(ennemi);
        ennemi.setCollideWorldBounds(true);
        ennemi.setDepth(1);
      }

      if (point.name === "boss") {
        this.boss = new Boss(this, point.x, point.y, calque_plateformes);
        this.grp_ennemis.add(this.boss);
        this.boss.setCollideWorldBounds(true);
        this.boss.setDepth(1);

        this.onBossDefeated = () => {
          console.log("Boss vaincu ! Victoire !");
        };
      }
    });

    this.physics.add.collider(this.grp_ennemis, calque_plateformes);

    this.physics.add.overlap(this.grp_bullets, this.grp_ennemis, (bullet, ennemi) => {
      if (!bullet.active || !bullet.body.enable) return;
      bullet.body.enable = false;
      bullet.setVisible(false);
      
      if (ennemi && ennemi.takeDamage && !ennemi.isDead) {
        ennemi.takeDamage(1);
      }
    });

    this.physics.add.collider(this.grp_bullets, calque_plateformes, (bullet) => {
      bullet.setActive(false);
      bullet.setVisible(false);
    });

    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        this.grp_ennemis.children.iterate(ennemi => {
          if (ennemi && ennemi.attackHitbox && ennemi.attackHitbox.active) {
            const distance = Phaser.Math.Distance.Between(
              player2.x, player2.y,
              ennemi.attackHitbox.x, ennemi.attackHitbox.y
            );
            
            if (distance < 30) {
              fct.perdreCoeur(this);
              if (ennemi.attackHitbox) {
                ennemi.attackHitbox.destroy();
                ennemi.attackHitbox = null;
              }
            }
          }
        });
      }
    });

    if (this.game.config.portalTarget != null) {
      this.portalSpawning();
    } else {
      player2.x = this.spawnPoint.x;
      player2.y = this.spawnPoint.y;
    }

    fct.initHUD_Gardes(this);

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(player2);

    this.game.config.sceneTarget = "niveau3";

    this.events.on("shutdown", () => {
      fct.cleanupHUD();
    });
    this.events.on("destroy", () => {
      fct.cleanupHUD();
    });
    this.events.on('wake', () => {
      console.log('La scène niveau3 a été réactivée !');
      fct.cleanupHUD();
      fct.initHUD_Gardes(this);

      if (this.game.musiqueGlobale && !this.game.musiqueGlobale.isPlaying) {
        this.game.musiqueGlobale.resume();
      }
    });
  }

  arreterMusique() {
    if (this.game.musiqueGlobale && this.game.musiqueGlobale.isPlaying) {
      this.game.musiqueGlobale.stop();
    }
  }

  update() {
    if (this.game.config.sceneTarget !== "niveau3") return;

    this.grp_ennemis.children.iterate(ennemi => {
      if (ennemi && ennemi.update) {
        ennemi.update(this.time.now);
      }
    });

    if (this.boss && !this.boss.isDead) {
      this.boss.update(this.time.now);
    }

    this.grp_portal.children.iterate(portal => {
      let dist = Phaser.Math.Distance.Between(player2.x, player2.y, portal.x, portal.y);

      if (dist < 60 && !portal.ouverte) {
        portal.setTexture("porteOuverte");
        portal.ouverte = true;
      } else if (dist >= 60 && portal.ouverte) {
        portal.setTexture("porteFermee");
        portal.ouverte = false;
      }

      if (dist < 60 && Phaser.Input.Keyboard.JustDown(this.actionKey)) {
        this.game.config.portalTarget = portal.target;
        if (portal.target == 5) {
          this.game.config.sceneTarget = "niveau2";
          this.scene.switch("niveau2");
          return;
        }
      }
    });

    const surEchelle = this.ladder_layer.getTileAtWorldXY(player2.x, player2.y);
    if (surEchelle) {
      player2.body.setAllowGravity(false);
      if (fct.clavier.up.isDown) player2.setVelocityY(-200);
      else if (fct.clavier.down.isDown) player2.setVelocityY(120);
      else player2.setVelocityY(0);
    } else {
      player2.body.setAllowGravity(true);
    }

    let isShooting = false;
    if (Phaser.Input.Keyboard.JustDown(this.shootKey)) {
      isShooting = true;
      player2.anims.play("anim2_shoot", true);

      this.sound.play("shoot", { volume: 1.3 });

      let bullet = this.grp_bullets.get(player2.x, player2.y);
      if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.body.allowGravity = false;
        bullet.body.enable = true;

        if (player2.flipX) {
          bullet.setVelocityX(400);
          bullet.setFlipX(false);
        } else {
          bullet.setVelocityX(-400);
          bullet.setFlipX(true);
        }

        this.time.delayedCall(2000, () => {
          if (bullet.active) {
            bullet.setActive(false);
            bullet.setVisible(false);
          }
        });
      }

      player2.once("animationcomplete", () => {
        player2.setTexture("dude2_face");
      });
    }

    if (player2.anims.currentAnim && player2.anims.currentAnim.key === "anim2_shoot" && player2.anims.isPlaying) {
      isShooting = true;
    }

    // VÉRIFIER LA COLLECTE DU TICKET DE VICTOIRE
    fct.verifierTicketVictoire(this, player2);

    updatePlayer(this, null, fct.gameOverActif, isShooting);
  }

  portalSpawning() {
    let portalFound = false;
    this.grp_portal.children.iterate(portal => {
      if (portal.id === this.game.config.portalTarget) {
        player2.x = portal.x;
        player2.y = portal.y;
        this.game.config.portalTarget = null;
        portalFound = true;
      }
    });

    if (!portalFound && this.spawnPoint) {
      player2.x = this.spawnPoint.x;
      player2.y = this.spawnPoint.y;
      this.game.config.portalTarget = null;
    }
  }
}