import * as fct from "./fonctions.js";

export default class niveau2 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau2" });
  }

  preload() {
    this.load.tilemapTiledJSON("carte_3", "./assets/map_3.json");

    this.load.image("parallax3_arriere", "./assets/f3Arriere.png");
    this.load.image("parallax3_milieu1", "./assets/f3Milieu1.png");
    this.load.image("parallax3_milieu2", "./assets/f3Milieu2.png");
    this.load.image("parallax3_avant", "./assets/f3Avant.png");

    this.load.image("ma_porte2", "./assets/door2.png");
    this.load.image("ma_porte3", "./assets/door3.png");

    fct.preloadCommun(this);
  }

// NIVEAU2.JS - Section create() corrigée
create() {
    const carteDuNiveau = this.add.tilemap("carte_3");
    const tileset = carteDuNiveau.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");
    const calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", tileset);
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    const worldWidth = carteDuNiveau.widthInPixels || 1280;
    const worldHeight = carteDuNiveau.heightInPixels || 720;

    // Parallax
    this.fondArriere = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax3_arriere").setOrigin(0, 0).setScrollFactor(0).setDepth(-4);
    this.fondMilieu1 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax3_milieu1").setOrigin(0, 0).setScrollFactor(0).setDepth(-3);
    this.fondMilieu2 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax3_milieu2").setOrigin(0, 0).setScrollFactor(0).setDepth(-2);
    this.fondAvant = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax3_avant").setOrigin(0, 0).setScrollFactor(0).setDepth(-1);

    // Player
    fct.creerPlayer(this, 100, 450);
    this.physics.add.collider(fct.player, calque_plateformes);

    fct.initClavier(this);
    this.input.keyboard.resetKeys();

    // Portails
    this.grp_portal = this.physics.add.group();
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    const tab_objects = carteDuNiveau.getObjectLayer("object_layer");
    if (tab_objects) {
      tab_objects.objects.forEach(point => {
        if (point.name === "start") {
          this.spawnPoint = { x: point.x, y: point.y };
        }

        if (point.name === "portal") {
          let portal_properties = {};
          point.properties.forEach(property => {
            if (property.name === "id") portal_properties.id = property.value;
            if (property.name === "target") portal_properties.target = property.value;
          });

          let portal = this.physics.add.sprite(point.x, point.y, "ma_porte2");
          portal.id = portal_properties.id;
          portal.target = portal_properties.target;

          this.grp_portal.add(portal);
          portal.body.allowGravity = false;
          portal.setDepth(47);

          this.physics.add.overlap(fct.player, portal, this.portalActivation, null, this);
        }
      });
    }

    // IMPORTANT: Placement du joueur APRÈS que tous les portails soient créés
    if (this.game.config.portalTarget != null) {
      this.portalSpawning();
    } else if (this.spawnPoint) {
      fct.player.x = this.spawnPoint.x;
      fct.player.y = this.spawnPoint.y;
    }

    // Camera
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(fct.player);

    fct.creerAnimations(this);
    fct.initHUD(this);

    this.game.config.sceneTarget = "niveau2";
}

  update() {
    if (fct.clavier.left.isDown) {
      this.fondArriere.tilePositionX -= 0.2;
      this.fondMilieu1.tilePositionX -= 0.5;
      this.fondMilieu2.tilePositionX -= 1;
      this.fondAvant.tilePositionX -= 1.8;
    } else if (fct.clavier.right.isDown) {
      this.fondArriere.tilePositionX += 0.2;
      this.fondMilieu1.tilePositionX += 0.5;
      this.fondMilieu2.tilePositionX += 1;
      this.fondAvant.tilePositionX += 1.8;
    }

    if (this.game.config.sceneTarget !== "niveau2") return;

    if (this.game.config.portalTarget != null) {
      this.portalSpawning();
    }

    fct.updatePlayer(this, null);
  }

portalActivation(player, portal) {
  if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
    console.log("[niveau2] activation du portail id=" + portal.id + " target=" + portal.target);
    
    // On stocke le TARGET du portail (où on veut aller)
    this.game.config.portalTarget = portal.target;

    // Logique corrigée : chaque portail va vers sa destination spécifique
    if (portal.target == 6) { 
      // Portail vers niveau3
      this.game.config.sceneTarget = "niveau3";
      this.scene.start("niveau3");
    } else if (portal.target == 4) {
      // Portail id=4 avec target=4 - définir où il doit vraiment aller
      // Par exemple, rester sur place, ou aller vers un autre niveau
      console.log("Portail id=4 activé - pas de transition définie");
      // Ou si c'est un portail de retour :
      // this.game.config.sceneTarget = "niveau1";
      // this.scene.start("niveau1");
    }
    // Suppression du code dupliqué qui causait le problème
  }
}



  portalSpawning() {
    let portalFound = false;

    this.grp_portal.children.iterate(portal => {
      if (portal.id === this.game.config.portalTarget) {
        fct.player.x = portal.x;
        fct.player.y = portal.y;
        this.game.config.portalTarget = null;
        portalFound = true;
      }
    });

    if (!portalFound && this.spawnPoint) {
      fct.player.x = this.spawnPoint.x;
      fct.player.y = this.spawnPoint.y;
      this.game.config.portalTarget = null;
    }
  }
}
