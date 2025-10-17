import * as fct from "./fonctions.js";
import Enemy from "./enemy.js";
import Enemy2 from "./enemy2.js";
import Item from "./item.js";

/***********************************************************************/
/** VARIABLES LOCALES AU NIVEAU
/***********************************************************************/
let player;

/***********************************************************************/
/** FONCTIONS PERSONNAGE LOCALES
/***********************************************************************/
function preloadPersonnage(scene, spriteKey = "img_perso", spriteFile = "./assets/dude.png") {
  scene.load.spritesheet(spriteKey, spriteFile, { frameWidth: 32, frameHeight: 40 });
  scene.load.image("dude_face", "./assets/dude_face.png");
  scene.load.image("dude_face_stop", "./assets/dude_face_stop.png");
}

function creerPlayer(scene, x, y, spriteKey = "img_perso") {
  scene.player = scene.physics.add.sprite(x, y, spriteKey);
  scene.player.setCollideWorldBounds(true);
  scene.player.setDepth(1);
  return scene.player;
}

function creerAnimations(scene, spriteKey = "img_perso") {
  scene.anims.create({
    key: "anim_marche",
    frames: scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 4 }),
    frameRate: 10,
    repeat: -1
  });
  scene.anims.create({
    key: "anim_idle",
    frames: [{ key: spriteKey, frame: 0 }],
    frameRate: 20
  });
}

/***********************************************************************/
/** SCENE SELECTION
/***********************************************************************/
export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
  }

  preload() {
    this.load.tilemapTiledJSON("carte", "./assets/map_1.json");
    this.load.image("parallax_arriere", "./assets/f1_arriere.png");
    this.load.image("parallax_milieu1", "./assets/f1_milieu1.png");
    this.load.image("parallax_milieu2", "./assets/f1_milieu2.png");
    this.load.image("parallax_avant", "./assets/f1_avant.png");

    this.load.image("porteFermee", "./assets/porte_fermee.png");
    this.load.image("porteOuverte", "./assets/porte_ouverte.png");
    this.load.audio("musique1", "./assets/musique1.mp3");

    // --- ITEMS ---
    this.load.image("objet1", "./assets/objet1.png");
    this.load.image("objet2", "./assets/objet2.png");
    this.load.image("objet3", "./assets/objet3.png");
    this.load.image("objet4", "./assets/objet4.png");

    fct.preloadCommun(this);
    preloadPersonnage(this);

    this.load.spritesheet('enemy1_run', './assets/enemy1_run.png', { frameWidth: 32, frameHeight: 24 });
    this.load.spritesheet('enemy2_run', './assets/enemy2_run.png', { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('enemy1_attack', './assets/enemy1_attack.png', { frameWidth: 32, frameHeight: 24 });
    this.load.spritesheet('enemy2_attack', './assets/enemy2_attack.png', { frameWidth: 32, frameHeight: 40 });
    this.load.image("bullet2", "./assets/bullet2.png");
    this.load.image("bullet3", "./assets/bullet3.png");
  }

  create() {
    // Nettoyer l'ancien HUD avant d'en créer un nouveau
    fct.cleanupHUD();
    
 // --- MUSIQUE GLOBALE ---
if (!this.game.musiqueGlobale) {
  // Utiliser le sound manager global du jeu
  this.game.musiqueGlobale = this.game.sound.add('musique1', { loop: true, volume: 0.5 });
  this.game.musiqueGlobale.play();
} else if (!this.game.musiqueGlobale.isPlaying) {
  // Si elle existe mais n'est pas en cours, on la rejoue
  this.game.musiqueGlobale.play();
}


    const carteDuNiveau = this.add.tilemap("carte");
    const tileset = carteDuNiveau.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");
    const tileset3 = carteDuNiveau.addTilesetImage("tuiles_de_jeu3", "Phaser_tuilesdejeu3");

    carteDuNiveau.createLayer("calque_background", tileset);
    carteDuNiveau.createLayer("calque_background2", [tileset, tileset3]);
    this.ladder_layer = carteDuNiveau.createLayer("ladder_layer", tileset);
    const calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", tileset);
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    const worldWidth = carteDuNiveau.widthInPixels || 1280;
    const worldHeight = carteDuNiveau.heightInPixels || 720;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // --- FOND PARALLAX ---
    this.fond_arriere = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax_arriere").setOrigin(0).setScrollFactor(0.2).setDepth(-4);
    this.fond_milieu1 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax_milieu1").setOrigin(0).setScrollFactor(0.5).setDepth(-3);
    this.fond_milieu2 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax_milieu2").setOrigin(0).setScrollFactor(1).setDepth(-2);
    this.fond_avant = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax_avant").setOrigin(0).setScrollFactor(1.5).setDepth(-1);

    // --- PLAYER ---
    creerPlayer(this, 100, 450);
    this.physics.add.collider(this.player, calque_plateformes);
    this.clavier = this.input.keyboard.createCursorKeys();
    this.toucheI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    
    creerAnimations(this);

    // --- GROUPE D'ITEMS ---
    this.grp_items = this.physics.add.group();

    // --- GROUPE DE BALLES DES ENNEMIS ---
    this.grp_balles_ennemis = this.physics.add.group();

    // --- COLLISION BALLES ENNEMIS AVEC PLATEFORMES ---
    this.physics.add.collider(this.grp_balles_ennemis, calque_plateformes, (balle) => {
      balle.destroy();
    });

    // --- COLLISION BALLES ENNEMIS AVEC JOUEUR ---
    this.physics.add.overlap(this.player, this.grp_balles_ennemis, (player, balle) => {
      balle.destroy();
      fct.perdreCoeur(this);
    });

    // --- PORTES ---
    this.grp_portal = this.physics.add.group();
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    
    // Spawn point par défaut (sera mis à jour avec le point "start")
    this.spawnPoint = { x: 100, y: 450 };

    // --- ENNEMIS ---
    this.grp_ennemis = this.physics.add.group();
    creerAnimations(this);

    // Animation ennemi
    this.anims.create({
      key: "anim_enemy1_run",
      frames: this.anims.generateFrameNumbers("enemy1_run", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

    // Animation ennemi2
    this.anims.create({
      key: "anim_enemy2_run",
      frames: this.anims.generateFrameNumbers("enemy2_run", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    const tab_objects = carteDuNiveau.getObjectLayer("object_layer")?.objects || [];

    // BOUCLE POUR TROUVER LE START EN PREMIER
    tab_objects.forEach(point => {
      if (point.name === "start") {
        this.spawnPoint = { x: point.x, y: point.y };
      }
    });

    // BOUCLE POUR LES PORTAILS
    tab_objects.forEach(point => {
      if (point.name === "portal") {
        let portal_properties = {};
        point.properties.forEach(property => {
          if (property.name === "id") portal_properties.id = property.value;
          if (property.name === "target") portal_properties.target = property.value;
        });

        let portal = this.physics.add.sprite(point.x, point.y, "porteFermee");
        portal.id = portal_properties.id;
        portal.target = portal_properties.target;
        portal.ouverte = false;
        portal.setDepth(0);

        this.grp_portal.add(portal);
        portal.body.allowGravity = false;
      }

      // --- GESTION DES ITEMS ---
      if (point.name === "item") {
        let itemType = "objet1";
        let itemId = null;

        if (point.properties) {
          point.properties.forEach(property => {
            if (property.name === "type") itemType = property.value;
            if (property.name === "id") itemId = property.value;
          });
        }

        const item = fct.creerItem(this, point.x, point.y, itemType, itemId);
        this.grp_items.add(item);
      }
    });

    // BOUCLE POUR LES ENNEMIS
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
      }
    });

    // --- COLLISION JOUEUR / ITEMS ---
    this.physics.add.overlap(this.player, this.grp_items, (player, item) => {
      fct.ramasserItem(this, item);
    }, null, this);
    
    // COLLISION ENNEMIS AVEC PLATEFORMES
    this.physics.add.collider(this.grp_ennemis, calque_plateformes);

    // --- COLLISION ENTRE JOUEUR ET HITBOX D'ATTAQUE DES ENEMY2 ---
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        this.grp_ennemis.children.iterate(ennemi => {
          if (ennemi && ennemi.attackHitbox && ennemi.attackHitbox.active) {
            const distance = Phaser.Math.Distance.Between(
              this.player.x, this.player.y,
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

    this.game.config.sceneTarget = "selection";

    // Placer le joueur au bon endroit (portal ou spawn)
    if (this.game.config.portalTarget != null) {
      this.portalSpawning();
    } else {
      // Si pas de portal target, mettre au spawn point
      this.player.x = this.spawnPoint.x;
      this.player.y = this.spawnPoint.y;
    }

    // --- INITIALISER LE HUD (APRÈS avoir placé le joueur) ---
    fct.initHUD_Objets(this);

    this.cameras.main.startFollow(this.player);


       this.events.on('wake', () => {
      // Code à exécuter lorsque la scène est réactivée
      console.log('La scène selection a été réactivée !');
      fct.cleanupHUD();
      fct.initHUD_Objets(this);

      // Rejouer la musique si elle n'est pas déjà en cours
      if (!this.game.musiqueGlobale.isPlaying) {
        this.game.musiqueGlobale.resume();
      }
    });
  }

    afficherMessage(message) {
    // Créer un fond semi-transparent
    const fond = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      400,
      100,
      0x000000,
      0.6 // transparence
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

    // Ajouter le texte par-dessus
    const texte = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      message,
      {
        fontSize: "20px",
        color: "#ffffff",
        fontFamily: "Arial",
        align: "center",
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    // Animation d’apparition et de disparition progressive
    this.tweens.add({
      targets: [fond, texte],
      alpha: { from: 0, to: 1 },
      duration: 300,
      yoyo: true,
      hold: 1500, // temps d’affichage
      onComplete: () => {
        fond.destroy();
        texte.destroy();
      }
    });
  }


  update() {
    
    // --- PORTES OUVERTURE / FERMETURE ---
    this.grp_portal.children.iterate(portal => {
      let dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, portal.x, portal.y);
      if(dist < 60 && !portal.ouverte){
        portal.setTexture("porteOuverte");
        portal.ouverte = true;
      } else if(dist >= 60 && portal.ouverte){
        portal.setTexture("porteFermee");
        portal.ouverte = false;
      }

      // TELEPORTATION SI ACTION
      if(dist < 60 && Phaser.Input.Keyboard.JustDown(this.actionKey)){
        this.game.config.portalTarget = portal.target;
        this.scene.switch("niveau1");  // start recrée la scène comme niveau2→niveau3
      }
    });

    // --- MISE À JOUR DES ENNEMIS ---
    this.grp_ennemis.children.iterate(ennemi => {
      if (ennemi && ennemi.update) {
        ennemi.update(this.time.now);
      }
    });

    if(this.game.config.sceneTarget !== "selection") return;

    // --- MOUVEMENT PLAYER ---
    const vitesseX = this.player.body.velocity.x;
    const onGround = this.player.body.blocked.down;

    const surEchelle = this.ladder_layer.getTileAtWorldXY(this.player.x, this.player.y);
    if (surEchelle) {
      this.player.body.setAllowGravity(false);
      if (this.clavier.up.isDown) this.player.setVelocityY(-200);
      else if (this.clavier.down.isDown) this.player.setVelocityY(120);
      else this.player.setVelocityY(0);
    } else {
      this.player.body.setAllowGravity(true);
    }

    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.setFlipX(false);
      this.player.anims.play("anim_marche", true);
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(160);
      this.player.setFlipX(true);
      this.player.anims.play("anim_marche", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.stop();
      this.player.setTexture("dude_face_stop");
    }

    if (this.toucheI.isDown && onGround) {
      this.player.setVelocityY(-280);
    }
  }



  portalSpawning() {
    let portalFound = false;
    this.grp_portal.children.iterate(portal => {
      if (portal.id === this.game.config.portalTarget) {
        this.player.x = portal.x;
        this.player.y = portal.y;
        this.game.config.portalTarget = null;
        portalFound = true;
      }
    });

    if(!portalFound && this.spawnPoint){
      this.player.x = this.spawnPoint.x;
      this.player.y = this.spawnPoint.y;
      this.game.config.portalTarget = null;
    }
  }
}