import { PERSO, PERSO2, TUILES, MAPS, DEBUG, JOUEUR, CLE, ECRANS } from "./maps.js";

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

  // data = { map: "map2", origine: "map1" }  (origine = map d'où l'on vient)
  init(data) {
    this.nomMap = (data && data.map) || "map1";
    this.origine = data && data.origine;
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
    const porteDepart = cfg.portes.find((p) => p.vers === this.origine);
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
      { teinte: null, decalage: nb > 1 ? -20 : 0, touches: { ...clavier.createCursorKeys(), action: clavier.addKey(K.I), saut: clavier.addKey(K.K) } },
      {
        teinte: 0x66aaff,
        decalage: 20,
        touches: {
          up: clavier.addKey(K.Z),
          down: clavier.addKey(K.S),
          left: clavier.addKey(K.Q),
          right: clavier.addKey(K.D),
          action: clavier.addKey(K.R),
          saut: clavier.addKey(K.F)
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

  changerDeMap(destination, origine) {
    if (this.enTransition || !MAPS[destination]) return;
    this.enTransition = true;
    this.cameras.main.fadeOut(250);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      if (this.perdu) return; // le temps s'est écoulé pendant le fondu : on reste sur "Tu as perdu"
      this.scene.restart({ map: destination, origine: origine });
    });
  }

  // pose la clé dans la map si c'est la bonne map et qu'elle n'a pas encore été trouvée.
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
      .setDepth(50);
    // la clé flotte doucement pour qu'on la remarque
    this.tweens.add({
      targets: this.cleSprite,
      y: this.cleSprite.y - 6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  ramasserCle() {
    this.registry.set("cle", true);
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

  // écran Game Over (image plein écran) + bouton pour rejouer
  afficherGameOver(raison = "Le temps est écoulé") {
    this.perdu = true;
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
  perdreVie(j, degats) {
    if (j.mort || this.perdu || this.enTransition || this.time.now < (j.invulJusqua || 0)) return;
    const cle = "pv_" + j.num;
    const pv = Math.max(0, (this.registry.get(cle) ?? JOUEUR.pvMax) - degats);
    this.registry.set(cle, pv);
    if (pv <= 0) {
      this.joueurMort(j);
      return;
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
    this.registry.remove("finPartie"); // le timer repart à 3 minutes
    this.registry.remove("cle"); // la clé est à retrouver
    this.registry.set("pv_1", JOUEUR.pvMax);
    this.registry.set("pv_2", JOUEUR.pvMax);
    this.scene.restart({ map: "map1" }); // retour au début de la première map
  }

  update() {
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
      const fermee = porte.cle && !this.registry.get("cle"); // porte fermée à clé et clé pas encore trouvée
      if (porte.vers && !fermee && j.appuiAction) {
        if (porte.vers === "fin") this.finir(); // grande porte de la map6 : fin du jeu
        else this.changerDeMap(porte.vers, this.nomMap);
        return;
      }
    }
    if (porteVisible) {
      const fermee = porteVisible.cle && !this.registry.get("cle");
      this.indice.setText(fermee ? "Trouve la clé !" : "Appuie sur A");
      this.indice.setColor(fermee ? "#ff8888" : "#ffffff");
    }
    this.indice.setVisible(!!(porteVisible && porteVisible.vers));
    if (porteVisible) this.indice.setPosition(porteVisible.x, porteVisible.y - 60);

    // --- CLÉ : un joueur qui touche la clé la ramasse ---
    if (this.cleSprite) {
      const zoneCle = this.cleSprite.getBounds();
      const touche = this.vivants().some((j) =>
        Phaser.Geom.Intersects.RectangleToRectangle(j.sprite.getBounds(), zoneCle)
      );
      if (touche) this.ramasserCle();
    }

    // --- DÉPLACEMENTS de chaque joueur ---
    this.vivants().forEach((j) => this.majJoueur(j));

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
    if (c.left.isDown) {
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
    }
  }
}