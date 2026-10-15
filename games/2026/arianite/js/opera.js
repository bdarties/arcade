import * as fct from "./fonctions.js";

/***********************************************************************/
/** RÉGLAGES (à adapter si besoin)
/***********************************************************************/

const FICHIER_TUILES = "./assets/tileset_opera.png";
const NOM_TUILESET = "tileset_opera";
const FICHIER_FOND = "./assets/fondopera.png";

// corde / échelle (même principe que dans exterieur.js)
const CORDE_VITESSE = 120; // vitesse de montée / descente (px/s)

export default class opera extends Phaser.Scene {
  constructor() {
    super({ key: "opera" });
  }

  // reçoit { depuis: "precedent" } quand on arrive du grenier,
  //        { depuis: "suivant" } quand on revient des égouts
  init(data) {
    this.depuis = data.depuis;
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    this.load.image("img_tuiles_opera", FICHIER_TUILES);
    this.load.image("img_fond_opera", FICHIER_FOND);
    this.load.tilemapTiledJSON("map_opera", "./assets/opera.json");
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
    const donnees = this.cache.tilemap.get("map_opera").data;
    donnees.tilesets = donnees.tilesets.map((ts) =>
      ts.source
        ? {
            firstgid: ts.firstgid,
            name: NOM_TUILESET,
            image: FICHIER_TUILES,
            imagewidth: 224,
            imageheight: 160,
            tilewidth: 32,
            tileheight: 32,
            columns: 7,
            tilecount: 35,
            margin: 0,
            spacing: 0
          }
        : ts
    );

    const map = this.make.tilemap({ key: "map_opera" });
    const tileset = map.addTilesetImage(NOM_TUILESET, "img_tuiles_opera");

    this.cameras.main.setBackgroundColor("#14101c");
    this.add.image(640, 360, "img_fond_opera").setScrollFactor(0).setDepth(-20);

    map.createLayer("decor", tileset, 0, 0).setDepth(-5);
    this.calque_corde = map.createLayer("corde", tileset, 0, 0).setDepth(-3);
    this.calque_sol = map.createLayer("Calque de Tuiles 1", tileset, 0, 0);
    this.calque_sol.setCollisionByExclusion([-1, 0]);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.hauteurMap = map.heightInPixels;

    /*************************************
     *  PORTES (zones + sprites)         *
     *************************************/
    const prop = (o, nom, defaut) => {
      const p = o.properties && o.properties.find((p) => p.name === nom);
      return p ? p.value : defaut;
    };

    // crée une zone d'interaction et, si l'objet Tiled a une propriété "sprite", dessine la porte
    const creerPorte = (o) => {
      const zone = this.add.zone(o.x, o.y - 48, 48, 96);
      this.physics.add.existing(zone, true);
      const cle = prop(o, "sprite", null);
      if (cle && this.textures.exists(cle)) {
        this.add
          .image(o.x, o.y, cle)
          .setOrigin(0.5, 1)
          .setScale(prop(o, "echelle", 3))
          .setDepth(-1);
      }
      return zone;
    };

    // porte d'arrivée (retour vers le grenier) : objet "entree" du calque "spawn"
    const entree = map.findObject("spawn", (o) => o.name === "entree");
    if (entree) {
      this.porte_precedent = creerPorte(entree);
    } else {
      console.warn('Point "entree" introuvable dans le calque "spawn" : position par défaut utilisée');
      this.porte_precedent = creerPorte({ x: 100, y: 352 });
    }

    // porte de sortie (vers les égouts) : objet "sortie" du calque "portes"
    const sortie = map.findObject("portes", (o) => o.name === "sortie");
    if (sortie) {
      this.porte_suivant = creerPorte(sortie);
    } else {
      console.warn('Point "sortie" introuvable dans le calque "portes"');
      this.porte_suivant = creerPorte({ x: 170, y: 832, properties: [{ name: "sprite", value: "img_porte1" }] });
    }

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

    // pendant qu'on est sur la corde, le sol ne bloque plus (la corde traverse les plateformes)
    this.enCorde = false;
    this.physics.add.collider(this.player, this.calque_sol, null, () => !this.enCorde, this);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    fct.initVies(this, false); // on garde les vies du niveau précédent

    this.texte_info = this.add
      .text(640, 60, "", { fontSize: "24px", color: "#ffffff", backgroundColor: "#000000" })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);

    // Calque "ennemis" (objet "boss") : le combat de boss n'est pas encore programmé
  }

  /***********************************************************************/
  /** CORDE
  /***********************************************************************/

  // renvoie le haut et le bas (en pixels) de la corde à laquelle appartient la tuile donnée
  bornesCorde(tuile) {
    let haut = tuile.y;
    let bas = tuile.y;
    while (this.calque_corde.hasTileAt(tuile.x, haut - 1)) haut--;
    while (this.calque_corde.hasTileAt(tuile.x, bas + 1)) bas++;
    return { haut: haut * 32, bas: (bas + 1) * 32 };
  }

  quitterCorde() {
    this.enCorde = false;
    this.player.body.setAllowGravity(true);
    this.player.anims.resume();
  }

  gererCorde() {
    const p = this.player;
    const b = p.body;
    const c = this.clavier;
    const tuileCentre = this.calque_corde.getTileAtWorldXY(b.center.x, b.center.y);

    if (!this.enCorde) {
      // on s'accroche : Haut sur une corde, ou Bas quand on se tient sur le sommet d'une corde
      let tuile = null;
      if (c.up.isDown && tuileCentre) {
        tuile = tuileCentre;
      } else if (c.down.isDown) {
        const tuilePieds = this.calque_corde.getTileAtWorldXY(b.center.x, b.bottom + 4);
        if (tuilePieds) tuile = tuilePieds;
        else if (tuileCentre && b.bottom < this.bornesCorde(tuileCentre).bas - 2) tuile = tuileCentre;
      }
      if (!tuile) return;

      this.enCorde = true;
      b.setAllowGravity(false);
      p.x = tuile.pixelX + tuile.width / 2; // centré sur la corde
    }

    // sur la corde
    const tuile = tuileCentre || this.calque_corde.getTileAtWorldXY(b.center.x, b.bottom + 4);
    if (!tuile) {
      this.quitterCorde();
      return;
    }
    const { haut, bas } = this.bornesCorde(tuile);

    // sommet atteint : on se pose sur la plateforme
    if (b.center.y < haut && c.up.isDown) {
      p.y += haut - b.bottom;
      p.setVelocity(0, 0);
      this.quitterCorde();
      return;
    }
    // bas atteint : on se pose sur le sol
    if (b.bottom >= bas && c.down.isDown) {
      p.y += bas - b.bottom;
      p.setVelocity(0, 0);
      this.quitterCorde();
      return;
    }
    // gauche / droite : on lâche la corde (sauf si on est encore dans une plateforme)
    if (c.left.isDown || c.right.isDown) {
      const dansSol =
        this.calque_sol.hasTileAtWorldXY(b.center.x, b.center.y) ||
        this.calque_sol.hasTileAtWorldXY(b.center.x, b.bottom - 4) ||
        this.calque_sol.hasTileAtWorldXY(b.center.x, b.top + 4);
      if (!dansSol) {
        this.quitterCorde();
        return;
      }
    }

    p.setVelocityX(0);
    const bouge = c.up.isDown || c.down.isDown;
    p.setVelocityY(c.up.isDown ? -CORDE_VITESSE : c.down.isDown ? CORDE_VITESSE : 0);

    const descend = c.down.isDown && !c.up.isDown;
    const mauvaisSens = p.anims.inReverse !== descend;
    if (p.anims.currentAnim?.key !== "aria_up" || (bouge && mauvaisSens)) {
      if (descend) p.anims.playReverse("aria_up");
      else p.anims.play("aria_up");
    }
    if (bouge) p.anims.resume();
    else p.anims.pause();
  }

  /***********************************************************************/
  /** UPDATE
  /***********************************************************************/

  update() {
    this.gererCorde();

    if (!this.enCorde) {
      const auSol = this.player.body.touching.down || this.player.body.blocked.down;
      fct.deplacerPerso(this.player, this.clavier, auSol);
      if ((this.clavier.up.isDown || this.clavier.jump.isDown) && auSol) {
        this.player.setVelocityY(-330);
      }
    }

    // chute dans le vide (bas de la map) : mort
    if (this.player.body.bottom >= this.hauteurMap - 1) {
      fct.mortParChute(this, () => this.scene.restart({ depuis: "precedent" }));
    }

    if (fct.justDownInteragir(this.clavier)) {
      if (this.physics.overlap(this.player, this.porte_precedent)) {
        this.scene.start("toit", { depuis: "suivant" });
      } else if (this.physics.overlap(this.player, this.porte_suivant)) {
        this.scene.start("egouts", { depuis: "precedent" });
      }
    }
  }
}
