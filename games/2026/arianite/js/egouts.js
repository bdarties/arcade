import * as fct from "./fonctions.js";

const FICHIER_TUILES = "./assets/tileset_sewer.png";
const NOM_TUILESET = "tileset_sewer";
const COULEUR_FOND = "#383543";

// Niveau des égouts : carte Tiled, portes de transition et déplacement du joueur.
export default class egouts extends Phaser.Scene {
  constructor() {
    super({ key: "egouts" });
  }

  // Conserve l'origine de la transition pour choisir la porte de départ.
  init(data) {
    this.depuis = data.depuis;
  }

  // Charge la carte, les tuiles, les portes et les sprites du joueur.
  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    this.load.image("img_tuiles_egouts", FICHIER_TUILES);
    this.load.tilemapTiledJSON("map_egouts", "./assets/map_sewer.json");
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");
    fct.chargerPerso(this);
  }

  // Construit la carte et ses collisions, puis place le joueur et les portes.
  create() {
    // Les tilesets externes Tiled (.tsx) sont remplacés par une définition intégrée pour Phaser.
    const donnees = this.cache.tilemap.get("map_egouts").data;
    donnees.tilesets = donnees.tilesets.map((ts) =>
      ts.source
        ? {
            firstgid: ts.firstgid,
            name: NOM_TUILESET,
            image: FICHIER_TUILES,
            imagewidth: 512,
            imageheight: 288,
            tilewidth: 32,
            tileheight: 32,
            columns: 16,
            tilecount: 144,
            margin: 0,
            spacing: 0
          }
        : ts
    );

    const map = this.make.tilemap({ key: "map_egouts" });
    const tileset = map.addTilesetImage(NOM_TUILESET, "img_tuiles_egouts");

    const hauteurEcran = this.cameras.main.height;
    const decalageY = hauteurEcran - map.heightInPixels;
    this.cameras.main.setBackgroundColor(COULEUR_FOND);

    map.createLayer("calque_background", tileset, 0, decalageY).setDepth(-9);
    map.createLayer("calque_background_2", tileset, 0, decalageY).setDepth(-8);
    map.createLayer("calque_background_ombres", tileset, 0, decalageY).setDepth(-7);
    const calque_sol = map.createLayer("calque_plateformes", tileset, 0, decalageY);
    calque_sol.setCollisionByExclusion([-1, 0]);

    this.physics.world.setBounds(0, decalageY, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, hauteurEcran);

    const creerZonePorte = (o) => {
      const zone = this.add.zone(o.x, o.y + decalageY - 48, 48, 96);
      this.physics.add.existing(zone, true);
      return zone;
    };

    const entree = map.findObject("spawn", (o) => o.name === "entree");
    this.porte_precedent = creerZonePorte(entree || { x: 112, y: 224 });
    if (!entree) console.warn('Point "entree" introuvable dans le calque "spawn" : position par défaut utilisée');

    const sortie = map.findObject("portes", (o) => o.name === "sortie");
    this.porte_suivant = creerZonePorte(sortie || { x: 3796, y: 576 });
    if (!sortie) console.warn('Point "sortie" introuvable dans le calque "portes" : position par défaut utilisée');

    this.texte_info = this.add
      .text(640, 60, "", { fontSize: "24px", color: "#ffffff", backgroundColor: "#000000" })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);

    const porteDepart = this.depuis === "suivant" ? this.porte_suivant : this.porte_precedent;
    const departX = porteDepart.x;
    const departY = porteDepart.y - 40;

    fct.creerAnimsPerso(this);
    this.player = this.physics.add.sprite(departX, departY, "img_perso");
    this.player.setCollideWorldBounds(true);
    this.clavier = fct.creerClavier(this);

    this.physics.add.collider(this.player, calque_sol);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    fct.initVies(this, false);
  }

  // Gère les chutes, le déplacement, les sauts et les interactions avec les portes.
  update() {
    if (this.player.body.bottom >= this.cameras.main.height - 1) {
      fct.mortParChute(this, () => this.scene.restart({ depuis: "precedent" }));
    }

    const auSol = this.player.body.touching.down || this.player.body.blocked.down;
    fct.deplacerPerso(this.player, this.clavier, auSol);
    if ((this.clavier.up.isDown || this.clavier.jump.isDown) && auSol) {
      this.player.setVelocityY(-330);
    }

    if (fct.justDownInteragir(this.clavier)) {
      if (this.physics.overlap(this.player, this.porte_precedent)) {
        this.scene.start("opera", { depuis: "suivant" });
      } else if (this.physics.overlap(this.player, this.porte_suivant)) {
        this.scene.start("victory");
      }
    }
  }
}