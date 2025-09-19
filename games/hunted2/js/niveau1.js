import * as fct from "./fonctions.js";

export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  preload() {
    this.load.tilemapTiledJSON("carte_2", "./assets/map_2.json");
    this.load.image("parallax2_arriere", "./assets/f2Arriere.png");
    this.load.image("parallax2_milieu1", "./assets/f2Milieu1.png");
    this.load.image("parallax2_milieu2", "./assets/f2Milieu2.png");
    this.load.image("parallax2_avant", "./assets/f2Avant.png");

    this.load.image("ma_porte1", "./assets/door1.png");
    this.load.image("ma_porte2", "./assets/door2.png");

    fct.preloadCommun(this);
  }

  create() {
    const carteDuNiveau = this.add.tilemap("carte_2");
    const tileset = carteDuNiveau.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");
    const calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", tileset);
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    const worldWidth = carteDuNiveau.widthInPixels || 1280;
    const worldHeight = carteDuNiveau.heightInPixels || 720;

    this.fondArriere = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax2_arriere").setOrigin(0, 0).setScrollFactor(0).setDepth(-4);
    this.fondMilieu1 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax2_milieu1").setOrigin(0, 0).setScrollFactor(0).setDepth(-3);
    this.fondMilieu2 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax2_milieu2").setOrigin(0, 0).setScrollFactor(0).setDepth(-2);
    this.fondAvant = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax2_avant").setOrigin(0, 0).setScrollFactor(0).setDepth(-1);

    fct.creerPlayer(this, 100, 450);
    this.physics.add.collider(fct.player, calque_plateformes);

    fct.initClavier(this);
    this.input.keyboard.resetKeys();

    this.grp_portal = this.physics.add.group();
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    const tab_objects = carteDuNiveau.getObjectLayer("object_layer");
    if (tab_objects) {
      tab_objects.objects.forEach(point => {
        if (point.name === "start") {
          fct.player.x = point.x;
          fct.player.y = point.y;
          this.spawnPoint = { x: point.x, y: point.y };
        }

        if (point.name === "portal") {
          let portal_properties = {};
          point.properties.forEach(property => {
            if (property.name === "id") portal_properties.id = property.value;
            if (property.name === "target") portal_properties.target = property.value;
          });

          let portal = this.physics.add.sprite(point.x, point.y, "ma_porte1");
          portal.id = portal_properties.id;
          portal.target = portal_properties.target;

          this.grp_portal.add(portal);
          portal.body.allowGravity = false;
          portal.setDepth(47);

          this.physics.add.overlap(fct.player, portal, this.portalActivation, null, this);
        }
      });
    }

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(fct.player);

    fct.creerAnimations(this);
    fct.initHUD(this);

    this.game.config.sceneTarget = "niveau1";
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

    if (this.game.config.sceneTarget !== "niveau1") return;

    if (this.game.config.portalTarget != null) {
      this.portalSpawning();
    }

    fct.updatePlayer(this, null);
  }

portalActivation(player, portal) {
  if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
    console.log("[niveau1] activation du portail id=" + portal.id + " target=" + portal.target);
    
    // On stocke le TARGET du portail (où on veut aller)
    this.game.config.portalTarget = portal.target;

    if (portal.target == 1) { // Retour vers selection
      this.game.config.sceneTarget = "selection";
      this.scene.start("selection");
    } else if (portal.target == 4) { // Vers niveau2 (arrive sur portail id=4, sens unique)
      this.game.config.sceneTarget = "niveau2";
      this.scene.start("niveau2");
    }
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
