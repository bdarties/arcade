import * as fct from "./fonctions.js";

<<<<<<< HEAD
=======
/***********************************************************************/
/** RÉGLAGES (à adapter si besoin)
/***********************************************************************/

// image du tileset de la map grenier (même rôle que tuilesJeu.png pour l'extérieur)
const FICHIER_TUILES = "./assets/greniertile.png";
// nom donné au tileset (la map Tiled pointe vers un .tsx externe que Phaser ne sait pas lire,
// on le remplace par un tileset "intégré" au chargement : voir create())
const NOM_TUILESET = "greniertile";
// image de fond
const FICHIER_FOND = "./assets/fondgrenier.png";
// parallaxe : 0 = le fond ne bouge pas, 1 = il bouge comme le décor (petit = lointain)
const PARALLAXE_FOND = 0.15;

// ennemis (les vies du joueur et la barre de vie sont dans fonctions.js)
const ENNEMI_DEGATS = 1; // vies perdues au contact
const ENNEMI_PV = 2; // coups nécessaires pour le tuer (modifiable par ennemi dans Tiled : pv)
// valeurs par défaut des ennemis (modifiables par ennemi dans Tiled : vitesse, distance, echelle)
const ENNEMI_VITESSE = 60; // px/s
const ENNEMI_DISTANCE = 150; // px de patrouille de chaque côté du point de départ
const ENNEMI_ECHELLE = 1; // 1 = même taille qu'Aria (36x64)

// portes dessinées dans le calque "decor" (pile de 3 tuiles), on pose juste une zone dessus
// col = colonne de la tuile, ligne_pieds = ligne de la tuile sur laquelle la porte est posée (le sol)
const PORTE_GAUCHE = { col: 1, ligne_pieds: 16 }; // retour vers l'extérieur
const PORTE_DROITE = { col: 111, ligne_pieds: 13 }; // vers le backstage

>>>>>>> Arianite
export default class toit extends Phaser.Scene {
  constructor() {
    super({ key: "toit" });
  }

  // reçoit { depuis: "precedent" | "suivant" } pour savoir où placer le joueur
  init(data) {
    this.depuis = data.depuis;
  }

  preload() {
<<<<<<< HEAD
=======
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    this.load.image("img_tuiles_grenier", FICHIER_TUILES);
    this.load.image("img_fond_grenier", FICHIER_FOND);
    this.load.tilemapTiledJSON("map_grenier", "./assets/map_grenier.json");
    // ennemis : 8 frames de 36x64
    this.load.spritesheet("ennemi_grenier", "./assets/spritesheet/ennemigreniert.png", {
      frameWidth: 36,
      frameHeight: 64
    });
    this.load.image("img_porte1", "./assets/door1.png"); // (déjà chargées par l'extérieur : sans effet)
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");
    this.load.audio("musique_grenier", "./assets/musique/music_grenier.mp3");
>>>>>>> Arianite
    fct.chargerPerso(this);
  }

  create() {
<<<<<<< HEAD
    this.add.image(0, 0, "img_ciel").setOrigin(0, 0).setDisplaySize(1280, 720);

    // sol
    this.groupe_plateformes = this.physics.add.staticGroup();
    this.groupe_plateformes.create(200, 584, "img_plateforme");
    this.groupe_plateformes.create(600, 584, "img_plateforme");
    this.groupe_plateformes.create(1000, 584, "img_plateforme");
    this.groupe_plateformes.create(1200, 584, "img_plateforme");

    this.add.text(400, 100, "Niveau 2 : Toit", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    // porte vers le niveau précédent
    this.porte_precedent = this.physics.add.staticSprite(60, 548, "img_porte2");

    // porte vers le niveau suivant
    this.porte_suivant = this.physics.add.staticSprite(1220, 548, "img_porte1");

    // joueur : à droite s'il revient du niveau suivant, sinon à gauche
    const departX = this.depuis === "suivant" ? 1120 : 100;
    fct.creerAnimsPerso(this);
    this.player = this.physics.add.sprite(departX, 450, "img_perso");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.clavier = this.input.keyboard.createCursorKeys();
    this.physics.add.collider(this.player, this.groupe_plateformes);
  }

  update() {
    fct.deplacerPerso(this.player, this.clavier, this.player.body.touching.down);
    if (this.clavier.up.isDown && this.player.body.touching.down) {
=======
    /*************************************
     *  MAP TILED                        *
     *************************************/

    // Phaser ne lit pas les tilesets externes (.tsx) : on les remplace par un tileset intégré
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

    // la map fait 640 px de haut, l'écran 720 : on la colle en bas, le haut reste en fond uni
    const hauteurEcran = this.cameras.main.height;
    const decalageY = hauteurEcran - map.heightInPixels;
    this.cameras.main.setBackgroundColor("#1a1410");

    // image de fond en parallaxe : elle défile moins vite que la caméra.
    // Elle est agrandie juste assez pour ne jamais laisser de bord visible.
    const largeurEcran = this.cameras.main.width;
    const fond = this.add.image(0, 0, "img_fond_grenier").setOrigin(0, 0).setDepth(-20);
    const largeurNeeded = largeurEcran + PARALLAXE_FOND * (map.widthInPixels - largeurEcran);
    const echelleFond = Math.max(hauteurEcran / fond.height, largeurNeeded / fond.width);
    fond
      .setScale(echelleFond)
      .setScrollFactor(PARALLAXE_FOND, 0)
      .setY((hauteurEcran - fond.height * echelleFond) / 2); // centré en hauteur

    map.createLayer("decor", tileset, 0, decalageY).setDepth(-5); // derrière le joueur
    const calque_sol = map.createLayer("Calque de Tuiles 1", tileset, 0, decalageY);
    // toutes les tuiles non vides sont solides
    calque_sol.setCollisionByExclusion([-1, 0]);

    this.physics.world.setBounds(0, 0, map.widthInPixels, hauteurEcran);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, hauteurEcran);

    /*************************************
     *  PORTES (zones sur les tuiles)    *
     *************************************/
    const creerZonePorte = (p) => {
      const x = p.col * 32 + 16;
      const piedsY = p.ligne_pieds * 32 + decalageY;
      const zone = this.add.zone(x, piedsY - 48, 48, 96); // 3 tuiles de haut
      this.physics.add.existing(zone, true); // corps statique
      return zone;
    };
    this.porte_precedent = creerZonePorte(PORTE_GAUCHE);

    // porte de sortie (vers le backstage) : POINT nommé "sortie" dans le calque d'objets "portes"
    // (le point = le bas au milieu de la porte). Propriétés Tiled optionnelles :
    //   sprite (string) : clé d'une image de porte à afficher (ex : img_porte1) ; sans elle, zone invisible
    //   echelle (float) : taille du sprite (défaut 3)
    // si le point n'existe pas, on garde la porte dessinée dans le décor (colonne 111)
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

    // petit message si la scène suivante n'existe pas encore
    this.texte_info = this.add
      .text(640, 60, "", { fontSize: "24px", color: "#ffffff", backgroundColor: "#000000" })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);

    /*************************************
     *  JOUEUR                           *
     *************************************/
    // arrive par la porte de droite s'il revient du backstage, sinon par celle de gauche
    let departX, departY;
    if (this.depuis === "suivant") {
      departX = this.porte_suivant.x;
      departY = this.porte_suivant.y - 40;
    } else {
      // point de départ : objet "depart" du calque d'objets "spawn" (Tiled), sinon à côté de la porte de gauche
      const calque_spawn = map.getObjectLayer("spawn");
      const depart = calque_spawn && calque_spawn.objects.find((o) => o.name === "depart");
      if (depart) {
        departX = depart.x;
        departY = depart.y + decalageY - 30; // un peu au-dessus du point pour ne pas être dans le sol
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
    this.clavier = this.input.keyboard.createCursorKeys();

    this.physics.add.collider(this.player, calque_sol);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    /*************************************
     *  ENNEMIS (calque Tiled "ennemis") *
     *************************************/
    // Chaque POINT du calque d'objets "ennemis" = un ennemi (le point = ses pieds).
    // Propriétés Tiled optionnelles : vitesse (float), distance (int), echelle (float)
    this.calque_sol = calque_sol;
    fct.initVies(this, false); // barre de vie (les vies viennent du niveau précédent)

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
        e.body.setSize(24, 58).setOffset(6, 6); // hitbox un peu plus petite que l'image
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
    fct.activerCoups(this.player, this.ennemis); // les coups de poing (touche F) blessent les ennemis

    /*************************************
     *  MUSIQUE                          *
     *************************************/
    // on coupe les musiques des niveaux précédents
    this.sound.stopByKey("son_pluie");
    this.sound.stopByKey("musique_menu");

    // musique du grenier en boucle (ignorée si le fichier n'est pas trouvé, pour ne rien casser)
    if (this.cache.audio.exists("musique_grenier")) {
      const musique = this.sound.add("musique_grenier", { loop: true, volume: 0.5 });
      musique.play();
      this.events.once("shutdown", () => musique.stop()); // coupée quand on quitte la scène
    } else {
      console.warn("Musique introuvable : vérifie le chemin ./assets/musique/music_grenier.mp3");
    }
  }

  // patrouille : l'ennemi fait demi-tour contre un mur, au bord d'une plateforme ou en bout de parcours
  mettreAJourEnnemis() {
    this.ennemis.forEach((e) => {
      const b = e.body;
      const aDroite = e.sens > 0;
      const auSol = b.blocked.down || b.touching.down;

      const mur = aDroite ? b.blocked.right : b.blocked.left;
      const tropLoin = Math.abs(e.x - e.departX) > e.distance;
      // y a-t-il du sol devant ses pieds ?
      const xDevant = aDroite ? b.right + 4 : b.left - 4;
      const videDevant = auSol && !this.calque_sol.hasTileAtWorldXY(xDevant, b.bottom + 4);

      if (mur || videDevant || (tropLoin && (e.x - e.departX > 0) === aDroite)) e.sens = -e.sens;

      e.setVelocityX(e.sens * e.vitesse);
      e.setFlipX(e.sens < 0); // le dessin regarde à droite
    });
  }

  // le joueur perd des vies (voir fonctions.js) ; s'il n'en a plus, on recommence le niveau
  perdreVie(degats, source) {
    if (fct.perdreVieJoueur(this, this.player, degats, source)) {
      this.scene.restart({ depuis: "precedent" });
    }
  }

  update() {
    this.mettreAJourEnnemis();

    const auSol = this.player.body.touching.down || this.player.body.blocked.down;

    fct.deplacerPerso(this.player, this.clavier, auSol);
    if (this.clavier.up.isDown && auSol) {
>>>>>>> Arianite
      this.player.setVelocityY(-330);
    }

    if (Phaser.Input.Keyboard.JustDown(this.clavier.space)) {
      if (this.physics.overlap(this.player, this.porte_precedent)) {
        this.scene.start("exterieur", { depuis: "suivant" });
<<<<<<< HEAD
      }
      if (this.physics.overlap(this.player, this.porte_suivant)) {
        this.scene.start("backstage", { depuis: "precedent" });
      }
    }
  }
}
=======
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
>>>>>>> Arianite
