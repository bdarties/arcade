import * as fct from "./fonctions.js";

/***********************************************************************/
/** RÉGLAGES (à adapter si besoin)
/***********************************************************************/

const FICHIER_TUILES = "./assets/tileset_sewer.png";
const NOM_TUILESET = "tileset_sewer";
const COULEUR_FOND = "#383543"; // couleur du bandeau au-dessus de la map (la map fait 640px de haut pour un écran de 720)

export default class egouts extends Phaser.Scene {
  constructor() {
    super({ key: "egouts" });
  }

  // reçoit { depuis: "precedent" } quand on arrive de l'opéra
  init(data) {
    this.depuis = data.depuis;
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    this.load.image("img_tuiles_egouts", FICHIER_TUILES);
    this.load.tilemapTiledJSON("map_egouts", "./assets/map-sewer.json");
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");
    fct.chargerPerso(this);
  }

  create() {
    /*************************************
     *  MAP TILED                        *
     *************************************/
    // Phaser ne sait pas lire les tilesets externes (.tsx) : on les remplace par une définition intégrée
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

    // la map est plus basse que l'écran : on la colle au bas de l'écran
    const hauteurEcran = this.cameras.main.height;
    const decalageY = hauteurEcran - map.heightInPixels;
    this.cameras.main.setBackgroundColor(COULEUR_FOND);

    map.createLayer("calque_background", tileset, 0, decalageY).setDepth(-9);
    map.createLayer("calque_background_2", tileset, 0, decalageY).setDepth(-8);
    map.createLayer("calque_background_ombres", tileset, 0, decalageY).setDepth(-7);
    const calque_sol = map.createLayer("calque_plateformes", tileset, 0, decalageY);
    calque_sol.setCollisionByExclusion([-1, 0]);

    // le bas de la map est le fond du monde : y tomber = mort (voir update)
    this.physics.world.setBounds(0, decalageY, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, hauteurEcran);

    /*************************************
     *  PORTES (zones sur le décor)      *
     *************************************/
    // les portes sont déjà dessinées dans les tuiles : on pose seulement des zones d'interaction
    const creerZonePorte = (o) => {
      const zone = this.add.zone(o.x, o.y + decalageY - 48, 48, 96);
      this.physics.add.existing(zone, true);
      return zone;
    };

    // porte d'arrivée (retour vers l'opéra) : objet "entree" du calque "spawn"
    const entree = map.findObject("spawn", (o) => o.name === "entree");
    this.porte_precedent = creerZonePorte(entree || { x: 112, y: 224 });
    if (!entree) console.warn('Point "entree" introuvable dans le calque "spawn" : position par défaut utilisée');

    // porte de fin de niveau : objet "sortie" du calque "portes"
    const sortie = map.findObject("portes", (o) => o.name === "sortie");
    this.porte_suivant = creerZonePorte(sortie || { x: 3796, y: 576 });
    if (!sortie) console.warn('Point "sortie" introuvable dans le calque "portes" : position par défaut utilisée');

    this.texte_info = this.add
      .text(640, 60, "", { fontSize: "24px", color: "#ffffff", backgroundColor: "#000000" })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);

    /*************************************
     *  JOUEUR                           *
     *************************************/
    const porteDepart = this.depuis === "suivant" ? this.porte_suivant : this.porte_precedent;
    const departX = porteDepart.x;
    const departY = porteDepart.y - 40;

    fct.creerAnimsPerso(this);
    this.player = this.physics.add.sprite(departX, departY, "img_perso");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.clavier = fct.creerClavier(this);

    this.physics.add.collider(this.player, calque_sol);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    fct.initVies(this, false); // on garde les vies du niveau précédent
  }

  update() {
    // chute dans l'eau / le vide (bas de la map) : mort
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
        // dernier niveau pour l'instant
        this.texte_info.setText("Niveau suivant pas encore disponible").setVisible(true);
        if (this.timerInfo) this.timerInfo.remove();
        this.timerInfo = this.time.delayedCall(1500, () => this.texte_info.setVisible(false));
      }
    }
  }
}
