import * as fct from "./fonctions.js";

/***********************************************************************/
/** RÉGLAGES (à adapter si besoin)
/***********************************************************************/

const FICHIER_TUILES = "./assets/greniertile.png";
const NOM_TUILESET = "greniertile";
const FICHIER_FOND = "./assets/fondgrenier.png";
const PARALLAXE_FOND = 0.15;

const ENNEMI_DEGATS = 1;
const ENNEMI_PV = 2;
const ENNEMI_VITESSE = 60;
const ENNEMI_DISTANCE = 150;
const ENNEMI_ECHELLE = 1;

const PORTE_GAUCHE = { col: 1, ligne_pieds: 16 };
const PORTE_DROITE = { col: 111, ligne_pieds: 13 };

export default class toit extends Phaser.Scene {
  constructor() {
    super({ key: "toit" });
  }

  init(data) {
    this.depuis = data.depuis;
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    this.load.image("img_tuiles_grenier", FICHIER_TUILES);
    this.load.image("img_fond_grenier", FICHIER_FOND);
    this.load.tilemapTiledJSON("map_grenier", "./assets/map_grenier.json");
    this.load.spritesheet("ennemi_grenier", "./assets/spritesheet/ennemigreniert.png", {
      frameWidth: 36,
      frameHeight: 64
    });
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");
    this.load.audio("musique_grenier", "./assets/musique/music_grenier.mp3");
    fct.chargerPerso(this);
  }

  create() {
    /*************************************
     *  MAP TILED                        *
     *************************************/
    const donnees = this.cache.tilemap.get("map_grenier").data;
    donnees.tilesets = donnees.tilesets.map((ts) =>
      ts.source
        ? {
            firstgid: ts.firstgid,
            name: NOM_TUILESET,
            image: FICHIER_TUILES,
            imagewidth: 320,
            imageheight: 320,
            tilewidth: 32,
            tileheight: 32,
            columns: 10,
            tilecount: 100,
            margin: 0,
            spacing: 0
          }
        : ts
    );

    const map = this.make.tilemap({ key: "map_grenier" });
    const tileset = map.addTilesetImage(NOM_TUILESET, "img_tuiles_grenier");

    const hauteurEcran = this.cameras.main.height;
    const decalageY = hauteurEcran - map.heightInPixels;
    this.cameras.main.setBackgroundColor("#1a1410");

    const largeurEcran = this.cameras.main.width;
    const fond = this.add.image(0, 0, "img_fond_grenier").setOrigin(0, 0).setDepth(-20);
    const largeurNeeded = largeurEcran + PARALLAXE_FOND * (map.widthInPixels - largeurEcran);
    const echelleFond = Math.max(hauteurEcran / fond.height, largeurNeeded / fond.width);
    fond
      .setScale(echelleFond)
      .setScrollFactor(PARALLAXE_FOND, 0)
      .setY((hauteurEcran - fond.height * echelleFond) / 2);

    map.createLayer("decor", tileset, 0, decalageY).setDepth(-5);
    const calque_sol = map.createLayer("Calque de Tuiles 1", tileset, 0, decalageY);
    calque_sol.setCollisionByExclusion([-1, 0]);

    this.physics.world.setBounds(0, 0, map.widthInPixels, hauteurEcran);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, hauteurEcran);

    /*************************************
     *  PORTES (zones sur les tuiles)    *
     *************************************/
    const creerZonePorte = (p) => {
      const x = p.col * 32 + 16;
      const piedsY = p.ligne_pieds * 32 + decalageY;
      const zone = this.add.zone(x, piedsY - 48, 48, 96);
      this.physics.add.existing(zone, true);
      return zone;
    };
    this.porte_precedent = creerZonePorte(PORTE_GAUCHE);

    const calque_portes = map.getObjectLayer("portes");
    const pointSortie = calque_portes && calque_portes.objects.find((o) => o.name === "sortie");
    if (pointSortie) {
      const prop = (nom, defaut) => {
        const p = pointSortie.properties && pointSortie.properties.find((p) => p.name === nom);
        return p ? p.value : defaut;
      };
      const yPieds = pointSortie.y + decalageY;
      this.porte_suivant = this.add.zone(pointSortie.x, yPieds - 48, 48, 96);
      this.physics.add.existing(this.porte_suivant, true);
      const cle = prop("sprite", null);
      if (cle && this.textures.exists(cle)) {
        this.add
          .image(pointSortie.x, yPieds, cle)
          .setOrigin(0.5, 1)
          .setScale(prop("echelle", 3))
          .setDepth(-1);
      }
    } else {
      console.warn('Point "sortie" introuvable dans le calque "portes" : porte du décor utilisée');
      this.porte_suivant = creerZonePorte(PORTE_DROITE);
    }

    this.texte_info = this.add
      .text(640, 60, "", { fontSize: "24px", color: "#ffffff", backgroundColor: "#000000" })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);

    /*************************************
     *  JOUEUR                           *
     *************************************/
    let departX, departY;
    if (this.depuis === "suivant") {
      departX = this.porte_suivant.x;
      departY = this.porte_suivant.y - 40;
    } else {
      const calque_spawn = map.getObjectLayer("spawn");
      const depart = calque_spawn && calque_spawn.objects.find((o) => o.name === "depart");
      if (depart) {
        departX = depart.x;
        departY = depart.y + decalageY - 30;
      } else {
        console.warn('Point "depart" introuvable dans le calque "spawn" : position par défaut utilisée');
        departX = this.porte_precedent.x + 80;
        departY = this.porte_precedent.y - 40;
      }
    }

    fct.creerAnimsPerso(this);
    this.player = this.physics.add.sprite(departX, departY, "img_perso");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.clavier = fct.creerClavier(this);

    this.physics.add.collider(this.player, calque_sol);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    /*************************************
     *  ENNEMIS (calque Tiled "ennemis") *
     *************************************/
    this.calque_sol = calque_sol;
    fct.initVies(this, false);

    if (!this.anims.exists("ennemi_marche")) {
      this.anims.create({
        key: "ennemi_marche",
        frames: this.anims.generateFrameNumbers("ennemi_grenier", { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1
      });
    }

    this.ennemis = [];
    const calque_ennemis = map.getObjectLayer("ennemis");
    if (!calque_ennemis) {
      console.warn('Calque d\'objets "ennemis" introuvable dans la map Tiled');
    } else {
      calque_ennemis.objects.forEach((o) => {
        const prop = (nom, defaut) => {
          const p = o.properties && o.properties.find((p) => p.name === nom);
          return p ? p.value : defaut;
        };
        const e = this.physics.add
          .sprite(o.x, o.y + decalageY, "ennemi_grenier", 0)
          .setOrigin(0.5, 1)
          .setScale(prop("echelle", ENNEMI_ECHELLE))
          .setDepth(1);
        e.body.setSize(24, 58).setOffset(6, 6);
        e.vitesse = prop("vitesse", ENNEMI_VITESSE);
        e.distance = prop("distance", ENNEMI_DISTANCE);
        e.pv = prop("pv", ENNEMI_PV);
        e.departX = o.x;
        e.sens = Math.random() < 0.5 ? -1 : 1;
        e.play("ennemi_marche");
        this.physics.add.collider(e, calque_sol);
        this.physics.add.overlap(this.player, e, () => this.perdreVie(ENNEMI_DEGATS, e));
        this.ennemis.push(e);
      });
    }
    fct.activerCoups(this.player, this.ennemis); // les coups de poing (Bouton B : O / T) blessent les ennemis

    /*************************************
     *  MUSIQUE                          *
     *************************************/
    this.sound.stopByKey("son_pluie");
    this.sound.stopByKey("musique_menu");

    if (this.cache.audio.exists("musique_grenier")) {
      const musique = this.sound.add("musique_grenier", { loop: true, volume: 0.5 });
      musique.play();
      this.events.once("shutdown", () => musique.stop());
    } else {
      console.warn("Musique introuvable : vérifie le chemin ./assets/musique/music_grenier.mp3");
    }
  }

  mettreAJourEnnemis() {
    this.ennemis.forEach((e) => {
      const b = e.body;
      const aDroite = e.sens > 0;
      const auSol = b.blocked.down || b.touching.down;

      const mur = aDroite ? b.blocked.right : b.blocked.left;
      const tropLoin = Math.abs(e.x - e.departX) > e.distance;
      const xDevant = aDroite ? b.right + 4 : b.left - 4;
      const videDevant = auSol && !this.calque_sol.hasTileAtWorldXY(xDevant, b.bottom + 4);

      if (mur || videDevant || (tropLoin && (e.x - e.departX > 0) === aDroite)) e.sens = -e.sens;

      e.setVelocityX(e.sens * e.vitesse);
      e.setFlipX(e.sens < 0);
    });
  }

  perdreVie(degats, source) {
    if (fct.perdreVieJoueur(this, this.player, degats, source)) {
      this.scene.restart({ depuis: "precedent" });
    }
  }

  update() {
    this.mettreAJourEnnemis();

    const auSol = this.player.body.touching.down || this.player.body.blocked.down;

    fct.deplacerPerso(this.player, this.clavier, auSol);
    if ((this.clavier.up.isDown || this.clavier.jump.isDown) && auSol) {
      this.player.setVelocityY(-330);
    }

    if (fct.justDownInteragir(this.clavier)) {
      if (this.physics.overlap(this.player, this.porte_precedent)) {
        this.scene.start("exterieur", { depuis: "suivant" });
      } else if (this.physics.overlap(this.player, this.porte_suivant)) {
        if (this.scene.manager.keys["backstage"]) {
          this.scene.start("backstage", { depuis: "precedent" });
        } else {
          this.texte_info.setText("Niveau suivant pas encore disponible").setVisible(true);
          this.time.delayedCall(1500, () => this.texte_info.setVisible(false));
        }
      }
    }
  }
}