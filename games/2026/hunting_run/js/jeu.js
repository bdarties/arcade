import { PERSO, PERSO2, TUILES, MAPS, DEBUG, JOUEUR, CLE, ECRANS, HASARD, MURMURES, ENIGMES, POINTS, ETATS_PARTIE } from "./maps.js";
import combat from "./combat.js"; // ennemis, tirs, laser, potions, PNJ
import { jouer, chargerSons } from "./sons.js"; // bruitages

// --- réglages de l'escalier ---
const MARCHE_MAX = 40;
const ADHERENCE = 8;

// --- durée de la partie ---
const DUREE_PARTIE = 180; // secondes (3 minutes)

// --- barre de vie (images dans assets/ui/) ---
const HUD = {
  x: 10, // position de la barre du J1 (haut gauche)
  y: 10,
  ecartX: 216, // décalage horizontal de la barre du J2 : les deux barres sont côte à côte
  echelle: 0.5, // taille d'affichage (les images font 400 px de large -> 200 px à l'écran)
  nbCoeurs: 3, // 3 cœurs = pvMax : 1 cœur = pvMax / 3
  // centre de chaque cœur dans l'image de la barre (pixels de l'image)
  coeurs: [[176, 65], [220, 65], [265, 65]],
  ko: [220, 65] // où s'affiche "K.O." quand le joueur n'a plus de vie
};
const IMAGES_HUD = ["barre-vie-j1", "barre-vie-j2", "coeur-plein", "coeur-vide"];

export default class jeu extends Phaser.Scene {
  constructor() {
    super({ key: "jeu" });
  }

  // data = { map: "map2", origine: "map1", hasard: false }
  //   origine = map d'où l'on vient ; hasard = true si on arrive par une porte aléatoire
  init(data) {
    this.nomMap = (data && data.map) || "map1";
    this.origine = data && data.origine;
    this.hasard = !!(data && data.hasard);
  }

  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);

    // fichiers qui n'ont pas pu être chargés (affichés à l'écran en mode DEBUG)
    this.manquants = [];
    this.load.on("loaderror", (f) => this.manquants.push(f.src));

    const cfg = MAPS[this.nomMap];
    this.load.tilemapTiledJSON(this.nomMap, "./assets/maps/" + cfg.fichier);

    // on ne charge que les images de tuiles utilisées par cette map
    const cles = new Set(Object.values(cfg.tilesets).flat());
    cles.forEach((cle) => this.load.image(cle, encodeURI("./assets/tuiles/" + TUILES[cle])));

    // images de la barre de vie (chargées une seule fois)
    IMAGES_HUD.forEach((nom) => {
      if (!this.textures.exists(nom)) this.load.image(nom, "./assets/ui/" + nom + ".png");
    });

    // image de l'écran Game Over (chargée une seule fois)
    if (!this.textures.exists("game_over")) this.load.image("game_over", ECRANS.gameOver);

    // image du bouton Rejouer (chargée une seule fois)
    if (!this.textures.exists("rejouer")) this.load.image("rejouer", ECRANS.boutonRejouer);

    // image de la clé (chargée une seule fois)
    if (!this.textures.exists("cle")) this.load.image("cle", CLE.fichier);

    // sons (fichiers de assets/sons/)
    chargerSons(this);

    // sprites des ennemis, PNJ, potions, boules (voir SPRITES dans maps.js)
    this.chargerCombat();

    this.load.spritesheet(PERSO.cle, PERSO.fichier, {
      frameWidth: PERSO.frameWidth,
      frameHeight: PERSO.frameHeight
    });
    // sprite sheet du joueur 2 (seulement en duo)
    if ((this.registry.get("nbJoueurs") || 1) > 1) {
      this.load.spritesheet(PERSO2.cle, PERSO2.fichier, {
        frameWidth: PERSO2.frameWidth,
        frameHeight: PERSO2.frameHeight
      });
    }
  }

  create() {
    const cfg = MAPS[this.nomMap];
    this.enTransition = false;
    this.perdu = false;
    this.gagne = false; // passe à true quand on franchit la porte de fin
    this.physics.resume(); // au cas où on rejoue après un "game over"
    this.cameras.main.fadeIn(250);

    /*************************
     *  MAP                   *
     *************************/
    const carte = this.make.tilemap({ key: this.nomMap });
    this.carte = carte; // gardée pour lire les calques d'objets (ennemis, potions) dans combat.js

    // addTilesetImage("nom du tileset DANS TILED", "clé de l'image chargée")
    const tilesets = [];
    for (const nomTiled in cfg.tilesets) {
      const cle = [].concat(cfg.tilesets[nomTiled]).find((c) => this.textures.exists(c));
      if (cle) tilesets.push(carte.addTilesetImage(nomTiled, cle));
    }

    // on crée les calques dans l'ordre de Tiled (du fond vers l'avant)
    let plateformes = null;
    let escalier = null;
    let echelle = null;
    carte.layers.forEach((infos, i) => {
      const nom = infos.name;
      const calque = carte.createLayer(nom, tilesets);
      if (!calque) return;
      calque.setDepth(nom.includes("front") ? 200 : i); // "front" passe devant le joueur
      if (nom.includes("platformes")) plateformes = calque;
      if (nom.includes("escalier")) escalier = calque;
      if (nom.includes("echelle")) echelle = calque;
    });

    // toutes les tuiles du calque plateformes sont solides
    if (plateformes) plateformes.setCollisionByExclusion([-1]);

    /*************************
     *  PORTES                *
     *************************/
    this.portes = cfg.portes.map((p) => {
      const l = p.l || 2; // largeur de la porte en tuiles (2 par défaut)
      const h = p.h || 3; // hauteur de la porte en tuiles (3 par défaut)
      const zone = this.add.zone((p.x + l / 2) * 32, (p.y + h / 2) * 32, l * 32, h * 32);
      this.physics.add.existing(zone, true);
      zone.vers = p.vers;
      zone.cle = p.cle; // true : la porte est fermée à clé
      zone.enigme = p.enigme; // nom d'un état à résoudre avant de pouvoir passer (ex : énigme de la Dame blanche)
      return zone;
    });
    this.indice = this.add
      .text(0, 0, "Appuie sur A", { fontSize: "16px", color: "#fff", backgroundColor: "#000a" })
      .setOrigin(0.5, 1)
      .setDepth(300)
      .setVisible(false);
    this.toucheE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E); // raccourci clavier de test (J1)

    /*************************
     *  JOUEUR                *
     *************************/
    // on apparaît devant la porte qui mène à la map d'où l'on vient.
    // Au lancement du jeu (pas de map d'origine), on apparaît au point de départ de la map (cfg.depart).
    let porteDepart = cfg.portes.find((p) => p.vers === this.origine);
    // arrivée par une porte aléatoire : on apparaît devant une des portes "hasard" de la map, tirée au sort
    if (this.hasard) {
      const possibles = cfg.portes.filter((p) => p.vers === "hasard");
      if (possibles.length) porteDepart = Phaser.Utils.Array.GetRandom(possibles);
    }
    let departX, departY;
    if (porteDepart) {
      departX = (porteDepart.x + 1) * 32;
      departY = (porteDepart.y + 3) * 32;
    } else if (cfg.depart) {
      departX = cfg.depart.x;
      departY = cfg.depart.y;
    } else {
      const porte = cfg.portes[0];
      departX = porte ? (porte.x + 1) * 32 : 100;
      departY = porte ? (porte.y + 3) * 32 : 500;
    }

    const K = Phaser.Input.Keyboard.KeyCodes;
    const clavier = this.input.keyboard;
    const nb = this.registry.get("nbJoueurs") || 1; // choisi dans le menu (1 ou 2)

    // contrôles de la borne : J1 = joystick flèches + bouton A (I) + bouton D = saut (K) ; J2 = joystick Z/Q/S/D + bouton A (R) + bouton D = saut (F)
    // le joystick vers le haut (up) sert UNIQUEMENT à monter aux échelles, le saut a sa propre touche
    const reglages = [
      { teinte: null, decalage: nb > 1 ? -20 : 0, touches: { ...clavier.createCursorKeys(), action: clavier.addKey(K.I), saut: clavier.addKey(K.K), attaque: clavier.addKey(K.O) } },
      {
        teinte: 0x66aaff,
        decalage: 20,
        touches: {
          up: clavier.addKey(K.Z),
          down: clavier.addKey(K.S),
          left: clavier.addKey(K.Q),
          right: clavier.addKey(K.D),
          action: clavier.addKey(K.R),
          saut: clavier.addKey(K.F),
          attaque: clavier.addKey(K.G)
        }
      }
    ];

    this.joueurs = [];
    for (let i = 0; i < nb; i++) {
      const r = reglages[i];
      // le joueur 2 a son propre sprite sheet s'il a bien été chargé, sinon sprite du joueur 1 teinté en bleu
      const sheet2 = i === 1 && this.textures.exists(PERSO2.cle);
      const sprite = this.physics.add
        .sprite(departX + r.decalage, departY, sheet2 ? PERSO2.cle : PERSO.cle)
        .setOrigin(0.5, 1);
      sprite.setBounce(0.1);
      sprite.setCollideWorldBounds(true);
      sprite.setDepth(100 + i);
      if (r.teinte && !sheet2) sprite.setTint(r.teinte);
      const j = { num: i + 1, sprite, sheet2, touches: r.touches, surEscalier: false, surEchelle: false, appuiAction: false };
      sprite.joueur = j;
      // la vie est gardée dans le registry : elle suit le joueur d'une map à l'autre
      const pv = this.registry.get("pv_" + j.num) ?? JOUEUR.pvMax;
      this.registry.set("pv_" + j.num, pv);
      j.mort = pv <= 0;
      if (j.mort) sprite.disableBody(true, true); // un joueur K.O. reste K.O. (duo)
      this.joueurs.push(j);
    }

    this.creerAnimations();

    // Escalier : on liste les tuiles d'escalier (position + sens de la pente)
    this.marches = [];
    if (escalier) {
      escalier.forEachTile((t) => {
        if (t.index !== -1) this.marches.push({ x: t.pixelX, y: t.pixelY, flipX: t.flipX });
      });
    }

    // Échelle : liste des tuiles d'échelle (map4)
    this.echelles = [];
    if (echelle) {
      echelle.forEachTile((t) => {
        if (t.index !== -1) this.echelles.push({ x: t.pixelX, y: t.pixelY });
      });
    }

    // un joueur ne collisionne pas avec les plateformes tant qu'IL est sur l'escalier
    // (les deux joueurs ne se bloquent pas entre eux : pas de collider J1/J2)
    if (plateformes) {
      this.physics.add.collider(
        this.joueurs.map((j) => j.sprite),
        plateformes,
        null,
        (sprite) => !sprite.joueur.surEscalier
      );
    }

    /*************************
     *  MONDE + CAMÉRA        *
     *************************/
    this.physics.world.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
    this.cameras.main.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);

    // la caméra suit le milieu des joueurs (en solo : le joueur lui-même)
    this.cible = this.add.zone(0, 0, 1, 1);
    this.placerCible();
    this.cameras.main.startFollow(this.cible, true, 0.1, 0.1);
    this.cameras.main.centerOn(this.cible.x, this.cible.y);

    /*************************
     *  CLÉ                   *
     *************************/
    this.creerCle();
    this.boiteMessage = null;
    this.minuteurMessage = null;
    this.boutonSecret = null;
    this.enigme = null;
    this.creerPoints();
    this.initCombat(plateformes); // ennemis, potions, PNJ
    this.murmurer();

    /*************************
     *  TIMER (3 minutes)     *
     *************************/
    // l'heure de fin est gardée dans le registry : le timer continue quand on change de map
    if (!this.registry.has("finPartie")) {
      this.registry.set("finPartie", Date.now() + DUREE_PARTIE * 1000);
    }
    this.texteTimer = this.add
      .text(this.scale.width - 10, 10, "03:00", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#000a",
        padding: { x: 8, y: 4 }
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    /*************************
     *  BARRE DE VIE          *
     *************************/
    // une barre par joueur, côte à côte : portrait + 3 cœurs (rouge pour J1, bleu pour J2)
    this.hud = this.joueurs.map((j, i) => {
      const ox = HUD.x + i * HUD.ecartX;
      const oy = HUD.y;
      const e = HUD.echelle;
      this.add
        .image(ox, oy, "barre-vie-j" + j.num)
        .setOrigin(0)
        .setScale(e)
        .setScrollFactor(0)
        .setDepth(1000);
      const vides = [];
      const coeurs = HUD.coeurs.map(([cx, cy]) => {
        const x = ox + cx * e;
        const y = oy + cy * e;
        vides.push(this.add.image(x, y, "coeur-vide").setScale(e).setScrollFactor(0).setDepth(1001)); // contour du cœur vide
        return this.add.image(x, y, "coeur-plein").setScale(e).setScrollFactor(0).setDepth(1002);
      });
      const ko = this.add
        .text(ox + HUD.ko[0] * e, oy + HUD.ko[1] * e, "K.O.", {
          fontSize: "14px",
          color: "#ff5555",
          fontStyle: "bold"
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1003)
        .setVisible(false);
      return { coeurs, vides, ko, dernierPv: -1 };
    });

    this.initHudCombat();

    this.toucheRejouer = this.input.keyboard.addKeys({
      entree: Phaser.Input.Keyboard.KeyCodes.ENTER,
      espace: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    /*************************
     *  DEBUG                 *
     *************************/
    if (DEBUG) {
      // raccourci de test : touches 1 à 6 pour changer de map (aucun texte affiché)
      this.input.keyboard.on("keydown", (e) => {
        if (e.key >= "1" && e.key <= "6") this.changerDeMap("map" + e.key, null);
        // tests de la barre de vie : 7 = -10 PV pour tous, 8 = +10 PV pour tous
        if (e.key === "9") this.finir(); // test : aller directement à l'écran de fin
        if (e.key === "0") this.vivants().forEach((j) => this.donnerPouvoir(j)); // test : donne le pouvoir
        if (e.key === "7") this.vivants().forEach((j) => this.perdreVie(j, 10));
        if (e.key === "8") this.vivants().forEach((j) => this.soigner(j, 10));
      });
    }
  }

  creerAnimations() {
    this.creerSerie(PERSO, "");
    if (this.textures.exists(PERSO2.cle)) this.creerSerie(PERSO2, "_2"); // animations du joueur 2 : clés finissant par _2
  }

  creerSerie(p, suffixe) {
    if (this.anims.exists("anim_face" + suffixe)) return; // déjà créées (les animations sont globales)
    this.anims.create({
      key: "anim_tourne_gauche" + suffixe,
      frames: this.anims.generateFrameNumbers(p.cle, { start: p.anim_gauche.debut, end: p.anim_gauche.fin }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "anim_face" + suffixe,
      frames: [{ key: p.cle, frame: p.anim_face.frame }],
      frameRate: 20
    });
    this.anims.create({
      key: "anim_tourne_droite" + suffixe,
      frames: this.anims.generateFrameNumbers(p.cle, { start: p.anim_droite.debut, end: p.anim_droite.fin }),
      frameRate: 10,
      repeat: -1
    });
  }

  // nom de l'animation à jouer pour le joueur j ("anim_face" -> "anim_face_2" pour le joueur 2 s'il a son sprite sheet)
  anim(j, nom) {
    return j.sheet2 ? nom + "_2" : nom;
  }

  changerDeMap(destination, origine, hasard = false) {
    if (this.enTransition || !MAPS[destination]) return;
    this.enTransition = true;
    this.cameras.main.fadeOut(250);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      if (this.perdu) return; // le temps s'est écoulé pendant le fondu : on reste sur "Tu as perdu"
      this.scene.restart({ map: destination, origine: origine, hasard: hasard });
    });
  }

  // tire au sort la map où mène une porte "hasard" (jamais la map actuelle, jamais une map interdite comme la map6)
  destinationAleatoire() {
    const candidates = Object.keys(MAPS).filter((m) => m !== this.nomMap && !HASARD.interdites.includes(m));
    const poids = candidates.map((m) => (HASARD.poids && HASARD.poids[m]) ?? 1);
    let tirage = Math.random() * poids.reduce((a, b) => a + b, 0);
    for (let i = 0; i < candidates.length; i++) {
      tirage -= poids[i];
      if (tirage <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
  }

  // petit murmure d'ambiance quand on arrive par une porte aléatoire
  murmurer() {
    if (!this.hasard || Math.random() > 0.5) return;
    this.message(Phaser.Utils.Array.GetRandom(MURMURES), 3000);
  }

  // affiche un texte en bas de l'écran pendant "duree" ms (remplace le message précédent)
  message(texte, duree = 4500) {
    if (this.boiteMessage) this.boiteMessage.destroy();
    if (this.minuteurMessage) this.minuteurMessage.remove(false);
    const boite = this.add
      .text(this.scale.width / 2, this.scale.height - 40, texte, {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#ffffff",
        backgroundColor: "#000d",
        padding: { x: 16, y: 10 },
        align: "center",
        wordWrap: { width: 820 }
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(1100);
    this.boiteMessage = boite;
    this.minuteurMessage = this.time.delayedCall(duree, () => {
      boite.destroy();
      if (this.boiteMessage === boite) this.boiteMessage = null;
    });
  }

  /*************************
   *  POINTS D'INTERACTION  *
   *************************/
  // notes, miroir, bouton secret, cuvette : zones où l'on appuie sur A
  creerPoints() {
    this.points = [];
    (POINTS[this.nomMap] || []).forEach((def) => {
      const zone = this.add.zone((def.x + def.l / 2) * 32, (def.y + def.h / 2) * 32, def.l * 32, def.h * 32);
      this.physics.add.existing(zone, true);
      zone.def = def;
      this.points.push(zone);
      if (def.type === "bouton") this.creerBouton(def);
    });
  }

  // le point est-il utilisable ? (le bouton secret n'existe qu'après le miroir)
  pointActif(def) {
    return !def.si || !!this.registry.get(def.si);
  }

  // dessine le petit bouton rouge secret (invisible tant que le miroir n'est pas résolu)
  creerBouton(def) {
    const x = def.bx * 32;
    const y = def.by * 32;
    const presse = !!this.registry.get("cle_revelee");
    const lueur = this.add.circle(x, y, 14, presse ? 0x33aa33 : 0xff2222, 0.3).setDepth(60);
    const bouton = this.add.circle(x, y, 7, presse ? 0x33aa33 : 0xcc1111).setStrokeStyle(2, 0x220000).setDepth(61);
    this.boutonSecret = { lueur, bouton };
    this.boutonSecret.visible = this.pointActif(def);
    lueur.setVisible(this.boutonSecret.visible);
    bouton.setVisible(this.boutonSecret.visible);
    if (!presse) this.pulser();
  }

  pulser() {
    if (!this.boutonSecret) return;
    this.tweens.add({ targets: this.boutonSecret.lueur, alpha: 0.05, scale: 1.6, duration: 700, yoyo: true, repeat: -1 });
  }

  // le miroir vient d'être résolu : le bouton apparaît
  afficherBouton() {
    if (!this.boutonSecret) return;
    const { lueur, bouton } = this.boutonSecret;
    lueur.setVisible(true).setAlpha(0);
    bouton.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: [lueur, bouton], alpha: { from: 0, to: 1 }, duration: 800 });
    this.time.delayedCall(850, () => this.pulser());
  }

  // action du joueur j qui appuie sur A sur un point d'interaction
  actionPoint(def, j) {
    switch (def.type) {
      case "note":
        this.message(def.texte, 7500);
        break;
      case "enigme":
        if (this.registry.get(ENIGMES[def.enigme].resolu)) this.message(def.deja, 4000);
        else this.ouvrirEnigme(def.enigme, j);
        break;
      case "bouton":
        if (this.registry.get("cle_revelee")) this.message(def.deja, 4000);
        else this.ouvrirEnigme(def.enigme, j);
        break;
      case "pnj":
        this.parler(def.pnj, j);
        break;
      case "toilettes":
        if (!this.registry.get("cle_revelee")) this.message(def.texte, 6000);
        else if (!this.registry.get("cle")) this.ramasserCle();
        else this.message(def.vide, 3000);
        break;
    }
  }

  /*************************
   *  ÉNIGMES               *
   *************************/
  ouvrirEnigme(id, joueur) {
    this.couperLasers();
    jouer(this, "page");
    this.physics.world.pause(); // les ennemis s'arrêtent aussi pendant l'énigme
    const e = ENIGMES[id];
    const L = this.scale.width;
    const H = this.scale.height;
    const fixe = (o, prof) => o.setScrollFactor(0).setDepth(prof);
    const police = { fontFamily: "Georgia, serif" };

    const objets = [];
    objets.push(fixe(this.add.rectangle(L / 2, H / 2, L, H, 0x000000, 0.85), 1500));
    objets.push(fixe(this.add.rectangle(L / 2, H / 2, 900, 470, 0x140a12, 1).setStrokeStyle(3, 0x8a1c1c), 1501));
    objets.push(fixe(this.add.text(L / 2, H / 2 - 195, e.titre, { ...police, fontSize: "30px", fontStyle: "italic", color: "#c9a24a" }).setOrigin(0.5), 1502));
    objets.push(fixe(this.add.text(L / 2, H / 2 - 140, e.question, { ...police, fontSize: "24px", color: "#ffffff", align: "center", wordWrap: { width: 820 } }).setOrigin(0.5, 0), 1502));
    const options = e.choix.map((c, i) =>
      fixe(this.add.text(L / 2, H / 2 + 30 + i * 52, c, { ...police, fontSize: "28px" }).setOrigin(0.5), 1502)
    );
    const retour = fixe(this.add.text(L / 2, H / 2 + 175, "", { ...police, fontSize: "20px", color: "#ff6666" }).setOrigin(0.5), 1502);
    objets.push(fixe(this.add.text(L / 2, H / 2 + 208, "Joystick : choisir     A : valider     Saut : fermer", { fontSize: "15px", color: "#999999" }).setOrigin(0.5), 1502));

    this.enigme = { id, def: e, index: 0, joueur, objets: objets.concat(options, [retour]), options, retour };
    // on vide les appuis "en retard" des touches pour ne pas valider/choisir par erreur à l'ouverture
    this.joueurs.forEach((j) => {
      const c = j.touches;
      [c.left, c.right, c.up, c.down, c.saut].forEach((k) => Phaser.Input.Keyboard.JustDown(k));
    });
    this.majOptionsEnigme();
  }

  majOptionsEnigme() {
    const en = this.enigme;
    en.options.forEach((t, i) => {
      t.setText((i === en.index ? "▶  " : "    ") + en.def.choix[i]);
      t.setColor(i === en.index ? "#ffd24a" : "#bbbbbb");
    });
  }

  fermerEnigme() {
    if (!this.enigme) return;
    this.enigme.objets.forEach((o) => o.destroy());
    this.enigme = null;
    if (!this.perdu) this.physics.world.resume();
  }

  // joystick : choisir la réponse, A : valider, saut : fermer
  gererEnigme() {
    const en = this.enigme;
    const n = en.def.choix.length;
    let dir = 0;
    let valider = false;
    let fermer = false;
    this.vivants().forEach((j) => {
      const c = j.touches;
      const J = Phaser.Input.Keyboard.JustDown;
      if (J(c.left)) dir = -1;
      if (J(c.up)) dir = -1;
      if (J(c.right)) dir = 1;
      if (J(c.down)) dir = 1;
      if (J(c.saut)) fermer = true;
      if (j.appuiAction) {
        valider = true;
        en.joueur = j; // c'est ce joueur qui perdra de la vie s'il se trompe
      }
    });
    if (fermer) {
      jouer(this, "retour");
      this.fermerEnigme();
      return;
    }
    if (dir) {
      jouer(this, "clic");
      en.index = (en.index + dir + n) % n;
      en.retour.setText("");
      this.majOptionsEnigme();
    }
    if (!valider) return;

    if (en.index === en.def.bonne) {
      const id = en.id;
      const def = en.def;
      this.fermerEnigme();
      this.registry.set(def.resolu, true);
      jouer(this, "bonneReponse");
      this.cameras.main.flash(350, 255, 255, 255);
      if (id === "miroir") {
        this.message(def.succes, 6000);
        this.afficherBouton();
      } else if (id === "bouton") {
        this.revelerCle();
      } else if (def.succes) {
        this.message(def.succes, 6000); // ex : la Dame blanche ouvre la grande porte
      }
    } else {
      en.retour.setText("Faux... le manoir s'agite.");
      this.cameras.main.shake(250, 0.01);
      this.perdreVie(en.joueur, en.def.degats);
    }
  }

  // le bouton secret a été actionné : la chasse d'eau se déclenche et la clé remonte dans la cuvette
  revelerCle() {
    if (this.boutonSecret) {
      this.boutonSecret.bouton.setFillStyle(0x33aa33);
      this.boutonSecret.lueur.setFillStyle(0x33aa33, 0.3);
    }
    this.message("Clic... Un grondement monte des canalisations... CHHHHHH !\nQuelque chose brille au fond de la cuvette.", 6000);
    this.cameras.main.shake(700, 0.006);
    jouer(this, "clic");
    this.time.delayedCall(300, () => jouer(this, "chasse"));
    this.montrerCle(true);
  }

  /*************************
   *  CLÉ                   *
   *************************/

  // pose la clé dans la cuvette (map5). Elle reste INVISIBLE tant que les énigmes ne sont pas résolues.
  // Quand la clé est trouvée, une petite icône s'affiche sous le timer.
  creerCle() {
    this.cleSprite = null;
    if (!this.textures.exists("cle")) return; // image introuvable : pas de clé
    if (this.registry.get("cle")) {
      this.afficherIconeCle();
      return;
    }
    if (CLE.map !== this.nomMap) return;
    this.cleSprite = this.add
      .image(CLE.x * 32, CLE.y * 32, "cle")
      .setOrigin(0.5, 1)
      .setScale(CLE.echelle)
      .setDepth(50)
      .setVisible(false);
    // si la chasse d'eau a déjà été tirée (on est parti sans prendre la clé), elle est déjà là
    if (this.registry.get("cle_revelee")) this.montrerCle(false);
  }

  // fait apparaître la clé dans la cuvette (anime = true : elle remonte doucement avec la chasse d'eau)
  montrerCle(anime) {
    const s = this.cleSprite;
    if (!s) return;
    const base = CLE.y * 32;
    s.setVisible(true);
    const flotter = () => {
      this.tweens.add({ targets: s, y: base - 5, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    };
    if (anime) {
      s.setAlpha(0);
      s.y = base + 30;
      this.tweens.add({ targets: s, alpha: 1, y: base, duration: 1200, ease: "Sine.easeOut", onComplete: flotter });
    } else {
      flotter();
    }
  }

  ramasserCle() {
    if (!this.cleSprite) return;
    this.registry.set("cle", true);
    this.tweens.killTweensOf(this.cleSprite);
    this.cleSprite.destroy();
    this.cleSprite = null;
    this.afficherIconeCle();
    const message = this.add
      .text(this.scale.width / 2, 120, "Tu as trouvé la clé !", {
        fontSize: "28px",
        color: "#ffffff",
        backgroundColor: "#000a",
        padding: { x: 12, y: 6 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);
    this.time.delayedCall(2000, () => message.destroy());
    jouer(this, "cle");
    // INDICES : la clé ouvre la grande porte, cachée derrière la bibliothèque (des notes le rappellent dans chaque pièce)
    this.time.delayedCall(2200, () =>
      this.message("La clé est froide... Elle ouvre la GRANDE PORTE, derrière la bibliothèque.\nDes notes aux murs te guideront. Cherche l'échelle, tout en haut à droite.", 7500)
    );
  }

  afficherIconeCle() {
    this.add
      .image(this.scale.width - 10, 52, "cle")
      .setOrigin(1, 0)
      .setScale(0.6)
      .setScrollFactor(0)
      .setDepth(1000);
  }

  // on a franchi la grande porte : fondu puis écran de fin
  finir() {
    if (this.enTransition || this.gagne) return;
    this.gagne = true;
    this.enTransition = true;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("fin"));
  }

  // hauteur (y) de la surface de l'escalier à la position x, ou null s'il n'y a pas d'escalier là.
  hauteurEscalier(x) {
    for (const m of this.marches) {
      if (x >= m.x && x < m.x + 32) {
        const dx = m.flipX ? m.x + 32 - x : x - m.x;
        return m.y + 32 - dx;
      }
    }
    return null;
  }

  // pourquoi une porte est fermée (null = ouverte)
  raisonFermee(porte) {
    if (porte.cle && !this.registry.get("cle")) return "Trouve la clé !";
    if (porte.enigme && !this.registry.get(porte.enigme)) return "Parle à la Dame blanche !";
    return null;
  }

  // écran Game Over (image plein écran) + bouton pour rejouer
  afficherGameOver(raison = "Le temps est écoulé") {
    this.perdu = true;
    this.couperLasers();
    this.time.delayedCall(500, () => jouer(this, "gameOver"));
    this.perduPret = false; // évite de relancer tout de suite si le joueur appuie sur A au moment de mourir
    this.time.delayedCall(800, () => (this.perduPret = true));
    this.physics.pause();
    this.joueurs.forEach((j) => {
      j.sprite.setVelocity(0, 0);
      j.sprite.anims.play(this.anim(j, "anim_face"));
    });

    const L = this.scale.width;
    const H = this.scale.height;
    const fond = this.add.rectangle(L / 2, H / 2, L, H, 0x000000, 1).setScrollFactor(0).setDepth(2000);
    const elements = [fond];

    if (this.textures.exists("game_over")) {
      // l'image remplit tout l'écran
      elements.push(this.add.image(L / 2, H / 2, "game_over").setDisplaySize(L, H).setScrollFactor(0).setDepth(2000));
    } else {
      // image introuvable : texte de secours
      elements.push(
        this.add
          .text(L / 2, H / 2 - 40, "Game Over", { fontSize: "72px", color: "#cc1111", fontStyle: "bold" })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(2001),
        this.add
          .text(L / 2, H / 2 + 30, raison, { fontSize: "24px", color: "#ffffff" })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(2001)
      );
    }

    // bouton Rejouer (ton image ; si elle est introuvable, un bouton en texte)
    let bouton;
    if (this.textures.exists("rejouer")) {
      bouton = this.add.image(L / 2, H - 80, "rejouer").setScale(0.5);
      bouton.on("pointerover", () => bouton.setScale(0.55)); // grossit un peu au survol
      bouton.on("pointerout", () => bouton.setScale(0.5));
    } else {
      bouton = this.add.text(L / 2, H - 70, "Rejouer", {
        fontFamily: "Georgia, serif",
        fontSize: "34px",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: "#7a0c0c",
        padding: { x: 36, y: 10 }
      });
      bouton.on("pointerover", () => bouton.setBackgroundColor("#c01818"));
      bouton.on("pointerout", () => bouton.setBackgroundColor("#7a0c0c"));
    }
    bouton.setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive({ useHandCursor: true });
    bouton.on("pointerdown", () => this.perduPret && this.rejouer());
    elements.push(bouton);

    // bouton A pour la borne
    elements.push(
      this.add
        .text(L / 2, H - 24, "(ou appuie sur le bouton A)", { fontSize: "16px", color: "#cccccc" })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2002)
        .setShadow(2, 2, "#000000", 4)
    );

    // apparition en fondu
    elements.forEach((e) => e.setAlpha(0));
    this.tweens.add({ targets: elements, alpha: 1, duration: 500 });
  }

  // joueurs encore en vie
  vivants() {
    return this.joueurs.filter((j) => !j.mort);
  }

  // le joueur j perd des points de vie (appelle cette méthode depuis un ennemi, un piège...)
  // srcX (facultatif) : position de l'attaquant, pour repousser le joueur
  perdreVie(j, degats, srcX) {
    if (j.mort || this.perdu || this.enTransition || this.time.now < (j.invulJusqua || 0)) return;
    const cle = "pv_" + j.num;
    const pv = Math.max(0, (this.registry.get(cle) ?? JOUEUR.pvMax) - degats);
    this.registry.set(cle, pv);
    jouer(this, "degats"); // son hurt (fichier)
    if (pv <= 0) {
      this.time.delayedCall(250, () => jouer(this, "mortJoueur"));
      this.joueurMort(j);
      return;
    }
    this.cameras.main.shake(120, 0.004);
    if (srcX !== undefined) {
      j.reculJusqua = this.time.now + 200; // repoussé : pas de contrôle un instant
      j.sprite.setVelocity(j.sprite.x < srcX ? -190 : 190, -170);
    }
    j.invulJusqua = this.time.now + JOUEUR.invincibilite;
    j.sprite.setAlpha(0.4); // clignote pendant l'invincibilité
    this.time.delayedCall(JOUEUR.invincibilite, () => j.sprite.active && j.sprite.setAlpha(1));
  }

  // le joueur j récupère des points de vie
  soigner(j, pv) {
    if (j.mort) return;
    const cle = "pv_" + j.num;
    this.registry.set(cle, Math.min(JOUEUR.pvMax, (this.registry.get(cle) ?? JOUEUR.pvMax) + pv));
  }

  // un joueur n'a plus de points de vie : en solo c'est perdu, en duo il faut que les deux soient K.O.
  joueurMort(j) {
    if (j.mort) return;
    j.mort = true;
    j.sprite.disableBody(true, true);
    if (this.joueurs.every((x) => x.mort)) this.afficherGameOver("Tu es K.O. !");
  }

  // met à jour les cœurs de chaque joueur (1 cœur = pvMax / nbCoeurs, un cœur peut être rempli en partie)
  majBarres() {
    const part = JOUEUR.pvMax / HUD.nbCoeurs;
    this.joueurs.forEach((j, i) => {
      const h = this.hud[i];
      const pv = Math.max(0, this.registry.get("pv_" + j.num) ?? JOUEUR.pvMax);
      if (pv === h.dernierPv) return; // rien n'a changé
      h.dernierPv = pv;
      h.coeurs.forEach((coeur, k) => {
        const rempli = Phaser.Math.Clamp((pv - k * part) / part, 0, 1);
        coeur.setVisible(rempli > 0);
        coeur.setCrop(0, 0, Math.ceil(coeur.width * rempli), coeur.height); // coupe le cœur en partie si besoin
      });
      h.ko.setVisible(pv <= 0);
      h.vides.forEach((v) => v.setVisible(pv > 0)); // à 0 PV : "K.O." à la place des cœurs
    });
  }

  // point entre les joueurs : cible de la caméra
  placerCible() {
    const liste = this.vivants().length ? this.vivants() : this.joueurs;
    const n = liste.length;
    const x = liste.reduce((somme, j) => somme + j.sprite.x, 0) / n;
    const y = liste.reduce((somme, j) => somme + j.sprite.y - j.sprite.height / 2, 0) / n;
    this.cible.setPosition(x, y);
  }

  rejouer() {
    ETATS_PARTIE.forEach((k) => this.registry.remove(k)); // timer, clé et énigmes repartent de zéro
    this.registry.set("pv_1", JOUEUR.pvMax);
    this.registry.set("pv_2", JOUEUR.pvMax);
    this.scene.restart({ map: "map1" }); // retour au début de la première map
  }

  update(time, delta) {
    // --- GAME OVER : on attend que le joueur relance ---
    if (this.perdu) {
      const relance =
        Phaser.Input.Keyboard.JustDown(this.toucheRejouer.entree) ||
        Phaser.Input.Keyboard.JustDown(this.toucheRejouer.espace) ||
        this.joueurs.some((j) => Phaser.Input.Keyboard.JustDown(j.touches.action));
      if (relance && this.perduPret) this.rejouer();
      return;
    }

    // --- TIMER ---
    const restant = Math.max(0, Math.ceil((this.registry.get("finPartie") - Date.now()) / 1000));
    const mm = String(Math.floor(restant / 60)).padStart(2, "0");
    const ss = String(restant % 60).padStart(2, "0");
    this.texteTimer.setText(mm + ":" + ss);
    this.texteTimer.setColor(restant <= 30 ? "#ff5555" : "#ffffff"); // rouge sur les 30 dernières secondes
    if (restant <= 0 && !this.gagne) {
      this.afficherGameOver();
      return;
    }

    // --- APPUIS sur le bouton A (lus une seule fois par image pour ne pas garder d'appui "en retard") ---
    const toucheE = Phaser.Input.Keyboard.JustDown(this.toucheE);
    this.joueurs.forEach((j) => {
      j.appuiAction = Phaser.Input.Keyboard.JustDown(j.touches.action) || (toucheE && j.num === 1);
    });

    // --- DIALOGUE d'un PNJ ouvert : tout est figé ---
    if (this.dialogue) {
      this.vivants().forEach((j) => j.sprite.setVelocityX(0));
      this.gererDialogue();
      return;
    }

    // --- ÉNIGME ouverte : les joueurs sont figés, le temps continue de tourner ! ---
    if (this.enigme) {
      this.vivants().forEach((j) => j.sprite.setVelocityX(0));
      this.gererEnigme();
      return;
    }

    if (this.enTransition) {
      this.vivants().forEach((j) => j.sprite.setVelocityX(0));
      return;
    }

    // --- PORTES : un seul joueur qui appuie sur A devant une porte fait passer tout le monde ---
    let porteVisible = null;
    for (const j of this.vivants()) {
      const porte = this.portes.find((z) => this.physics.overlap(j.sprite, z));
      if (!porte) continue;
      if (!porteVisible) porteVisible = porte;
      const fermee = !!this.raisonFermee(porte); // porte fermée à clé / énigme pas résolue
      if (porte.vers && fermee && j.appuiAction) jouer(this, "verrou"); // porte fermée : clac !
      if (porte.vers && !fermee && j.appuiAction) {
        jouer(this, "porte");
        if (porte.vers === "fin") this.finir(); // grande porte de la map6 : fin du jeu
        else if (porte.vers === "hasard") this.changerDeMap(this.destinationAleatoire(), null, true); // on ne sait pas où elle mène !
        else this.changerDeMap(porte.vers, this.nomMap);
        return;
      }
    }
    if (porteVisible) {
      const raison = this.raisonFermee(porteVisible);
      const fermee = !!raison;
      const mystere = porteVisible.vers === "hasard";
      this.indice.setText(fermee ? raison : mystere ? "Appuie sur A... où mène-t-elle ?" : "Appuie sur A");
      this.indice.setColor(fermee ? "#ff8888" : "#ffffff");
    }
    this.indice.setVisible(!!(porteVisible && porteVisible.vers));
    if (porteVisible) this.indice.setPosition(porteVisible.x, porteVisible.y - 60);

    // --- POINTS D'INTERACTION (notes, miroir, bouton secret, cuvette) : A devant ---
    if (!porteVisible) {
      let pointVisible = null;
      for (const j of this.vivants()) {
        const pt = this.points.find((z) => this.pointActif(z.def) && this.physics.overlap(j.sprite, z));
        if (!pt) continue;
        if (!pointVisible) pointVisible = pt;
        if (j.appuiAction) {
          this.actionPoint(pt.def, j);
          return;
        }
      }
      if (pointVisible) {
        this.indice.setText("Appuie sur A").setColor("#ffffff").setVisible(true);
        this.indice.setPosition(pointVisible.x, pointVisible.y - pointVisible.height / 2 - 10);
      }
    }

    // --- DÉPLACEMENTS de chaque joueur ---
    this.vivants().forEach((j) => this.majJoueur(j));

    // --- COMBAT : attaques, ennemis, potions, piques ---
    this.majCombat(time, delta);

    // --- DUO : on empêche un joueur de sortir de l'écran ---
    if (this.vivants().length > 1) {
      const vue = this.cameras.main.worldView;
      this.vivants().forEach((j) => {
        const s = j.sprite;
        const min = vue.x + 20;
        const max = vue.right - 20;
        if (s.x < min) { s.x = min; if (s.body.velocity.x < 0) s.setVelocityX(0); }
        if (s.x > max) { s.x = max; if (s.body.velocity.x > 0) s.setVelocityX(0); }
      });
    }

    this.placerCible();
    this.majBarres();
  }

  // escalier, échelle, marche et saut pour UN joueur
  majJoueur(j) {
    const sprite = j.sprite;
    const corps = sprite.body;
    const c = j.touches;

    // --- ESCALIER : on se pose dessus si on tombe (ou marche) sur la pente ---
    const etaitSurEscalier = j.surEscalier;
    j.surEscalier = false;
    if (corps.velocity.y >= 0) {
      const surface = this.hauteurEscalier(corps.center.x);
      if (surface !== null) {
        const piedsAvant = corps.prev.y + corps.height;
        const atteint = corps.bottom >= surface - (etaitSurEscalier ? ADHERENCE : 0);
        if (atteint && piedsAvant <= surface + MARCHE_MAX) {
          corps.y = surface - corps.height; // pieds posés sur la pente
          corps.velocity.y = 0;
          j.surEscalier = true;
        }
      }
    }

    // --- ÉCHELLE : haut/bas pour grimper, la gravité est coupée tant qu'on est dessus ---
    const surTuileEchelle = this.echelles.some(
      (e) => corps.center.x >= e.x && corps.center.x < e.x + 32 && corps.bottom > e.y && corps.top < e.y + 32
    );
    const veutGrimper = c.up.isDown || c.down.isDown;
    if (surTuileEchelle && (veutGrimper || j.surEchelle)) {
      j.surEchelle = true;
      corps.allowGravity = false;
      if (c.up.isDown) sprite.setVelocityY(-PERSO.vitesse_echelle);
      else if (c.down.isDown) sprite.setVelocityY(PERSO.vitesse_echelle);
      else sprite.setVelocityY(0);
    } else if (j.surEchelle) {
      j.surEchelle = false;
      corps.allowGravity = true;
    }

    // --- DÉPLACEMENTS ---
    if (c.left.isDown) j.dir = -1; // sens du regard (pour frapper / tirer)
    else if (c.right.isDown) j.dir = 1;
    if (this.time.now < (j.reculJusqua || 0)) {
      // repoussé par un coup : on ne contrôle pas pendant un court instant
    } else if (c.left.isDown) {
      sprite.setVelocityX(-PERSO.vitesse);
      sprite.anims.play(this.anim(j, "anim_tourne_gauche"), true);
    } else if (c.right.isDown) {
      sprite.setVelocityX(PERSO.vitesse);
      sprite.anims.play(this.anim(j, "anim_tourne_droite"), true);
    } else {
      sprite.setVelocityX(0);
      sprite.anims.play(this.anim(j, "anim_face"));
    }

    if (!j.surEchelle && c.saut.isDown && (corps.blocked.down || j.surEscalier)) {
      sprite.setVelocityY(PERSO.saut);
      if (this.time.now > (j.sautSonJusqua || 0)) {
        jouer(this, "saut");
        j.sautSonJusqua = this.time.now + 250; // évite de rejouer le son deux fois pour le même saut
      }
    }
  }
}

// on ajoute les fonctions de combat (js/combat.js) à la scène
Object.assign(jeu.prototype, combat);
