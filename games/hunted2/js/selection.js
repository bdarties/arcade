import * as fct from "./fonctions.js";

/***********************************************************************/
/** SCENE SELECTION
/***********************************************************************/
export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
  }


  preload() {
    // Map spécifique à cette scène
    this.load.tilemapTiledJSON("carte", "./assets/map_1.json");

    // Chargement des couches de parallax avec des clés uniques
    this.load.image("parallax_arriere", "./assets/f1Arriere.png");
    this.load.image("parallax_milieu1", "./assets/f1Milieu1.png");
    this.load.image("parallax_milieu2", "./assets/f1Milieu2.png");
    this.load.image("parallax_avant", "./assets/f1Avant.png");

    // Ajouter après les autres chargements
    this.load.image("ma_porte1", "./assets/door1.png");

    // Préchargement commun (peut écraser nos images si même clé)
    fct.preloadCommun(this);

   
  }

  create() {
    // --- MAP --- (on récupère d'abord les dimensions)
    const carteDuNiveau = this.add.tilemap("carte");
    const tileset = carteDuNiveau.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");
    const calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", tileset);
    calque_plateformes.setCollisionByProperty({ estSolide: true });

    // Dimensions du monde
    const worldWidth = carteDuNiveau.widthInPixels || 1280;
    const worldHeight = carteDuNiveau.heightInPixels || 720;

    // --- FOND PARALLAX ---
    this.fondArriere = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax_arriere").setOrigin(0, 0).setScrollFactor(0).setDepth(-4);
    this.fondMilieu1 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax_milieu1").setOrigin(0, 0).setScrollFactor(0).setDepth(-3);
    this.fondMilieu2 = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax_milieu2").setOrigin(0, 0).setScrollFactor(0).setDepth(-2);
    this.fondAvant = this.add.tileSprite(0, 0, worldWidth, this.sys.game.config.height, "parallax_avant").setOrigin(0, 0).setScrollFactor(0).setDepth(-1);
    // --- PLAYER ---
    fct.creerPlayer(this, 100, 450);
    this.physics.add.collider(fct.player, calque_plateformes);

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

          let portal = this.physics.add.sprite(point.x, point.y, "ma_porte1");
          portal.id = portal_properties.id;
          portal.target = portal_properties.target;

          this.grp_portal.add(portal);
          portal.body.allowGravity = false;
          portal.setDepth(47);

          console.log("[selection] portail créé: id " + portal.id + " target : " + portal.target);

          this.physics.add.overlap(
            fct.player,
            portal,
            this.portalActivation,
            () => Phaser.Input.Keyboard.JustDown(this.actionKey),
            this
          );
        }
      });
    }

    // Configuration de la scène cible
    this.game.config.sceneTarget = "selection";

    // --- CAMERA ---
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(fct.player);

    // --- ANIM / HUD / CLAVIER ---
    fct.creerAnimations(this);
    fct.initHUD(this);
    fct.initClavier(this);
  }

  update() {
  // --- Déplacement manuel du parallax
  if (fct.clavier.left.isDown) {
      this.fondArriere.tilePositionX -= 0.2;
      this.fondMilieu1.tilePositionX -= 0.5;
      this.fondMilieu2.tilePositionX -= 1;
      this.fondAvant.tilePositionX -= 1.8;
    }
    else if (fct.clavier.right.isDown) {
      this.fondArriere.tilePositionX += 0.2;
      this.fondMilieu1.tilePositionX += 0.5;
      this.fondMilieu2.tilePositionX += 1;
      this.fondAvant.tilePositionX += 1.8;
    }

    if (this.game.config.sceneTarget !== "selection") return;

    if (this.game.config.portalTarget != null) {
      this.portalSpawning();
    }

    fct.updatePlayer(this, null);
  }

portalActivation(player, portal) {
  console.log("[selection] activation de portail, id: " + portal.id + ", cible: " + portal.target);
  
  // IMPORTANT: On stocke l'ID du portail de destination, pas le target
  this.game.config.portalTarget = portal.target; // Ceci doit correspondre à l'ID d'un portail dans niveau1
  this.game.config.sceneTarget = "niveau1";
  this.scene.switch("niveau1");
}

  portalSpawning() {
    let portalFound = false;
    console.log("spawn sur portail depuis selection");
    console.log(this.game.config.portalTarget);

    this.grp_portal.children.iterate(portal => {
      console.log("portail analysé : " + portal.id + " cible :" + this.game.config.portalTarget);
      if (portal.id === this.game.config.portalTarget) {
        fct.player.x = portal.x;
        fct.player.y = portal.y;
        console.log("on téléporte player à " + fct.player.x + ", " + fct.player.y);
        this.game.config.portalTarget = null;
        portalFound = true;
        return true;
      }
    }, this);

    if (!portalFound) {
      console.warn("destination inconnue - spawn au point de départ");
      if (this.spawnPoint) {
        fct.player.x = this.spawnPoint.x;
        fct.player.y = this.spawnPoint.y;
      }
      this.game.config.portalTarget = null;
    }
  }
}
