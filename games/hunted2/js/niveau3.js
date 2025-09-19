import * as fct from "./fonctions.js";

/***********************************************************************/
/** SCÈNE NIVEAU1
/***********************************************************************/
export default class niveau3 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau3" });
  }

  preload() {
    // Map spécifique à cette scène
    this.load.tilemapTiledJSON("carte_4", "./assets/map_4.json");

    // Chargement des couches de parallax
    this.load.image("parallax4_arriere", "./assets/f4Arriere.png");
    this.load.image("parallax4_milieu1", "./assets/f4Milieu1.png");
    this.load.image("parallax4_milieu2", "./assets/f4Milieu2.png");
    this.load.image("parallax4_milieu3", "./assets/f4Milieu3.png");
    this.load.image("parallax4_avant", "./assets/f4Avant.png");

    // Porte
    this.load.image("ma_porte3", "./assets/door3.png");

    // Préchargement commun
    fct.preloadCommun(this);
  }

  create() {
    // --- MAP ---
    const carteDuNiveau = this.add.tilemap("carte_4");
    const tileset = carteDuNiveau.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");
    const calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", tileset);
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    const worldWidth = carteDuNiveau.widthInPixels || 1280;
    const worldHeight = carteDuNiveau.heightInPixels || 720;

    // --- PARALLAX ---
    this.fondArriere = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax4_arriere").setOrigin(0, 0).setScrollFactor(0).setDepth(-5);
    this.fondMilieu1 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax4_milieu1").setOrigin(0, 0).setScrollFactor(0).setDepth(-4);
    this.fondMilieu2 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax4_milieu2").setOrigin(0, 0).setScrollFactor(0).setDepth(-3);
     this.fondMilieu3 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax4_milieu3").setOrigin(0, 0).setScrollFactor(0).setDepth(-2);
    this.fondAvant = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax4_avant").setOrigin(0, 0).setScrollFactor(0).setDepth(-1);

    // --- PLAYER ---
    fct.creerPlayer(this, 100, 450);
    this.physics.add.collider(fct.player, calque_plateformes);

    // --- CLAVIER ---
    fct.initClavier(this);
    this.input.keyboard.resetKeys(); // ⚡ reset clavier pour éviter le déplacement automatique

    // --- PORTAILS ---
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

          let portal = this.physics.add.sprite(point.x, point.y, "ma_porte3");
          portal.id = portal_properties.id;
          portal.target = portal_properties.target;

          this.grp_portal.add(portal);
          portal.body.allowGravity = false;
          portal.setDepth(47);

          this.physics.add.overlap(fct.player, portal, this.portalActivation, null, this);
        }
      });
    }

    // --- CAMERA ---
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(fct.player);

    // --- ANIM / HUD ---
    fct.creerAnimations(this);
    fct.initHUD(this);

    // --- SCÈNE CIBLE ---
    this.game.config.sceneTarget = "niveau3";
  }

  update() {
    if (fct.clavier.left.isDown) {
        this.fondArriere.tilePositionX -= 0.2;
        this.fondMilieu1.tilePositionX -= 0.5;
        this.fondMilieu2.tilePositionX -= 1;
        this.fondMilieu3.tilePositionX -= 1.3;
        this.fondAvant.tilePositionX -= 1.8;
      }
      else if (fct.clavier.right.isDown) {
        this.fondArriere.tilePositionX += 0.2;
        this.fondMilieu1.tilePositionX += 0.5;
        this.fondMilieu2.tilePositionX += 1;
        this.fondMilieu3.tilePositionX += 1.3;
        this.fondAvant.tilePositionX += 1.8;
      }
    if (this.game.config.sceneTarget !== "niveau3") return;

    if (this.game.config.portalTarget != null) {
      this.portalSpawning();
    }

    fct.updatePlayer(this, null);
  }

portalActivation(player, portal) {
  if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
    console.log("[niveau3] activation du portail id=" + portal.id + " target=" + portal.target);
    
    // CORRECTION: On stocke le TARGET du portail, pas son ID
    this.game.config.portalTarget = portal.target; // ✅ Changement ici !

    if (portal.target == 5) {
      // Portail vers niveau2 - arrivée sur portail id=5
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
