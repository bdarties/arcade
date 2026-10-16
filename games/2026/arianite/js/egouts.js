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
    //À changer :
    this.load.spritesheet("ennemi_grenier", "./assets/spritesheet/ennemigreniert.png", {
      frameWidth: 36,
      frameHeight: 64
    });
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

    //À changer :
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
    fct.activerCoups(this.player, this.ennemis);
    
    this.sound.stopByKey("son_pluie");
    this.sound.stopByKey("musique_menu");
    
    if (this.cache.audio.exists("musique_grenier")) {
      let musique = this.sound.get("musique_grenier");
      if (!musique) {
        musique = this.sound.add("musique_grenier", { loop: true, volume: 0.5 });
        musique.play();
      }
    } else {
      console.warn("Musique introuvable : vérifie le chemin ./assets/musique/music_grenier.mp3");
    }
      
  }

// Fait patrouiller les ennemis et les fait rebrousser chemin près des bords.
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

  // Applique les dégâts puis redémarre le niveau si toutes les vies sont perdues.
  perdreVie(degats, source) {
    if (fct.perdreVieJoueur(this, this.player, degats, source)) {
      this.scene.restart({ depuis: "precedent" });
    }
  }

  update() {
    // Met à jour les ennemis, le joueur, les chutes et les portes.
    if (this.player.body.bottom >= this.cameras.main.height - 1) {
      fct.mortParChute(this, () => this.scene.restart({ depuis: "precedent" }));
    }
    this.mettreAJourEnnemis();


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
        this.texte_info.setText("Niveau suivant pas encore disponible").setVisible(true);
        if (this.timerInfo) this.timerInfo.remove();
        this.timerInfo = this.time.delayedCall(1500, () => this.texte_info.setVisible(false));
      }
    }
  }
}
