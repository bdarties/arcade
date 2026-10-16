import { PERSO, PERSO2, TUILES, MAPS, JOUEUR, CLE, ECRANS, HASARD, MURMURES, ENIGMES, POINTS, DUREE_PARTIE, REVIE } from "./maps.js";
import combat from "./combat.js"; // ennemis, tirs, laser, potions, PNJ
import { jouer, chargerSons } from "./sons.js"; // bruitages
import { scoresDeLaPartie } from "./scores.js";

// réglages de l'escalier
const MARCHE_MAX = 40;
const ADHERENCE = 8;

//durée de la partie : voir DUREE_PARTIE dans maps.js (3 min 30)

//barre de vie (images dans assets/ui/)
const HUD = {
  x: 10, // position de la barre du J1
  y: 10,
  ecartX: 216, // décalage horizontal de la barre du J2 : les deux barres sont côte à côte
  echelle: 0.5, // taille d'affichage
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
  // origine = map d'où l'on vient ; hasard = true si on arrive par une porte aléatoire
  init(data) {
    this.nomMap = (data && data.map) || "map1";
    this.origine = data && data.origine;
    this.hasard = !!(data && data.hasard);
    this.porteIdx = data && data.porteIdx; // numéro de la porte devant laquelle on apparaît
    this.spawnForce = data && data.spawn; // point d'apparition imposé (quand on REVIT dans la même salle)
  }

  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);

    // fichiers qui n'ont pas pu être chargés
    this.manquants = [];
    this.load.on("loaderror", (f) => this.manquants.push(f.src));

    const cfg = MAPS[this.nomMap];
    this.load.tilemapTiledJSON(this.nomMap, "./assets/maps/" + cfg.fichier);

    // on ne charge que les images de tuiles utilisées par cette map
    const cles = new Set(Object.values(cfg.tilesets).flat());
    cles.forEach((cle) => this.load.image(cle, encodeURI("./assets/tuiles/" + TUILES[cle])));

    // images de la barre de vie
    IMAGES_HUD.forEach((nom) => {
      if (!this.textures.exists(nom)) this.load.image(nom, "./assets/ui/" + nom + ".png");
    });

    // image de l'écran Game Over
    if (!this.textures.exists("game_over")) this.load.image("game_over", ECRANS.gameOver);

    // image du bouton Rejouer
    if (!this.textures.exists("rejouer")) this.load.image("rejouer", ECRANS.boutonRejouer);

    // image du bouton Retour au menu
    if (!this.textures.exists("retour_menu")) this.load.image("retour_menu", ECRANS.boutonMenu);

    // image du bouton Revivre
    if (!this.textures.exists("revivre")) this.load.image("revivre", ECRANS.boutonRevivre);

    // image de la clé
    if (!this.textures.exists("cle")) this.load.image("cle", CLE.fichier);

    // sons
    chargerSons(this);

    // sprites des ennemis, PNJ, potions, boules
    this.chargerCombat();

    this.load.spritesheet(PERSO.cle, PERSO.fichier, {
      frameWidth: PERSO.frameWidth,
      frameHeight: PERSO.frameHeight
    });
    // sprite sheet du joueur 2
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
    this.partiEnCours = false;
    this.perdu = false;
    this.gel = false; // true pendant l'écran figé "Temps écoulé"
    this.nbUpdates = 0; // compte les images : la vue de la caméra n'est fiable qu'après les toutes premières
    this.anims.resumeAll(); // au cas où l'écran figé les avait mises en pause
    this.events.once("shutdown", () => this.anims.resumeAll());
    this.gagne = false; // passe à true quand on franchit la porte de fin
    this.physics.resume(); // au cas où on rejoue après un "game over"
    this.cameras.main.fadeIn(250);

    /*MAP*/

    const carte = this.make.tilemap({ key: this.nomMap });
    this.carte = carte; // gardée pour lire les calques d'objets (ennemis, potions) dans combat.js

    // addTilesetImage
    const tilesets = [];
    for (const nomTiled in cfg.tilesets) {
      const cle = [].concat(cfg.tilesets[nomTiled]).find((c) => this.textures.exists(c));
      if (cle) tilesets.push(carte.addTilesetImage(nomTiled, cle));
    }

    // on crée les calques dans l'ordre de Tiled
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

    // SOL INVISIBLE (cfg.sol) : pour les cartes dont le calque plateformes n'a pas de sol (map7)
    if (plateformes && cfg.sol !== undefined) {
      const modele = plateformes.findTile((t) => t.index !== -1);
      if (modele) {
        for (let ty = cfg.sol; ty < carte.height; ty++) {
          for (let tx = 0; tx < carte.width; tx++) {
            const t = plateformes.putTileAt(modele.index, tx, ty);
            if (t) {
              t.alpha = 0;
              t.visible = false;
            }
          }
        }
      }
    }

    // toutes les tuiles du calque plateformes sont solides
    if (plateformes) plateformes.setCollisionByExclusion([-1]);

    /*PORTES*/

    this.portes = cfg.portes.map((p, idx) => {
      const l = p.l || 2; // largeur de la porte en tuiles
      const h = p.h || 3; // hauteur de la porte en tuiles
      const zone = this.add.zone((p.x + l / 2) * 32, (p.y + h / 2) * 32, l * 32, h * 32);
      this.physics.add.existing(zone, true);
      zone.vers = p.vers;
      zone.idx = idx; // numéro de la porte dans la map
      zone.cle = p.cle; // true : la porte est fermée à clé
      zone.enigme = p.enigme; // nom d'un état à résoudre avant de pouvoir passer (ex : énigme de la Dame blanche)
      return zone;
    });
    this.indice = this.add
      .text(0, 0, "Appuie sur B", { fontSize: "16px", color: "#fff", backgroundColor: "#000a" })
      .setOrigin(0.5, 1)
      .setDepth(300)
      .setVisible(false);

    /*JOUEUR*/

    // on apparaît devant la porte qui mène à la map d'où l'on vient.
    // Au lancement du jeu (pas de map d'origine), on apparaît au point de départ de la map (cfg.depart).
    let porteDepart = cfg.portes.find((p) => p.vers === this.origine);
    // arrivée par une porte aléatoire : porte d'arrivée déjà choisie (aller ou retour), sinon une porte "hasard" tirée au sort
    if (this.porteIdx !== undefined && cfg.portes[this.porteIdx]) {
      porteDepart = cfg.portes[this.porteIdx];
    } else if (this.hasard) {
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

    if (this.spawnForce) {
      departX = this.spawnForce.x;
      departY = this.spawnForce.y;
    }
    this.spawnPoint = { x: departX, y: departY }; // pour revivre ici

    this.toucheE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E); // raccourci clavier de test (J1) : même rôle que O
    const K = Phaser.Input.Keyboard.KeyCodes;
    const clavier = this.input.keyboard;
    const nb = this.registry.get("nbJoueurs") || 1; // choisi dans le menu (1 ou 2)

    // contrôles de la borne : J1 = joystick flèches + bouton B (O) + bouton A (I) + saut (K) ; J2 = joystick Z/Q/S/D + bouton B (T) + bouton A (R) + saut (F)
    // le joystick vers le haut (up) sert UNIQUEMENT à monter aux échelles, le saut a sa propre touche
    const reglages = [
      { teinte: null, decalage: nb > 1 ? -20 : 0, touches: { ...clavier.createCursorKeys(), action: clavier.addKey(K.O), saut: clavier.addKey(K.K), attaque: clavier.addKey(K.I) } },
      {
        teinte: 0x66aaff,
        decalage: 20,
        touches: {
          up: clavier.addKey(K.Z),
          down: clavier.addKey(K.S),
          left: clavier.addKey(K.Q),
          right: clavier.addKey(K.D),
          action: clavier.addKey(K.T),
          saut: clavier.addKey(K.F),
          attaque: clavier.addKey(K.R)
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
        if (t.index === -1) return;
        // la tuile d'escalier n°243 (de TuileDeJeu1) est le dessin de la pente qui DESCEND vers la droite (map7, escalier de gauche)
        const ts = t.tileset;
        const local = t.index - (ts && ts.firstgid ? ts.firstgid : 1);
        this.marches.push({ x: t.pixelX, y: t.pixelY, flipX: t.flipX || local === 243 });
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

    /*MONDE + CAMÉRA*/

    this.physics.world.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
    this.cameras.main.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);

    // la caméra suit le milieu des joueurs (en solo : le joueur lui-même)
    this.cible = this.add.zone(0, 0, 1, 1);
    this.placerCible();
    this.cameras.main.startFollow(this.cible, true, 0.1, 0.1);
    this.cameras.main.centerOn(this.cible.x, this.cible.y);

    /*CLÉ*/

    this.creerCle();
    this.boiteMessage = null;
    this.minuteurMessage = null;
    this.boutonSecret = null;
    this.enigme = null;
    this.creerPoints();
    this.initCombat(plateformes); // ennemis, potions, PNJ
    this.murmurer();

    /*TIMER*/

    // l'heure de fin est gardée dans le registry : le timer continue quand on change de map
    if (!this.registry.has("finPartie")) {
      this.registry.set("finPartie", Date.now() + DUREE_PARTIE * 1000);
    }
    this.texteTimer = this.add
      .text(this.scale.width - 10, 10, "03:30", {
        fontFamily: "Georgia, serif",
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#000a",
        padding: { x: 8, y: 4 }
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    /*BARRE DE VIE*/

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
          fontFamily: "Georgia, serif",
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

    // SCORES (en haut, au milieu) : un par joueur, gardés d'une map à l'autre (registry : score_1, score_2)
    const duo = nb > 1;
    this.texteScores = this.joueurs.map((j, i) =>
      this.add
        .text(this.scale.width / 2 + (duo ? (i ? 8 : -8) : 0), 10, "", {
          fontSize: duo ? "20px" : "24px",
          color: duo ? (i ? "#7ab8ff" : "#ff9a9a") : "#cccccc",
          backgroundColor: "#000a",
          padding: { x: 8, y: 4 },
          fontStyle: "bold"
        })
        .setOrigin(duo ? (i ? 0 : 1) : 0.5, 0)
        .setScrollFactor(0)
        .setDepth(1000)
    );

    this.toucheRejouer = this.input.keyboard.addKeys({
      entree: Phaser.Input.Keyboard.KeyCodes.ENTER,
      espace: Phaser.Input.Keyboard.KeyCodes.SPACE
    });
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

  // nom de l'animation à jouer pour le joueur
  anim(j, nom) {
    return j.sheet2 ? nom + "_2" : nom;
  }

  changerDeMap(destination, origine, hasard = false, porteIdx) {
    if (this.enTransition || !MAPS[destination]) return;
    this.enTransition = true;
    this.cameras.main.fadeOut(250);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      if (this.perdu) return; // le temps s'est écoulé pendant le fondu : on reste sur "Tu as perdu"
      this.scene.restart({ map: destination, origine: origine, hasard: hasard, porteIdx: porteIdx });
    });
  }

  // tire au sort la map où mène une porte "hasard" (exclue : une map à éviter si possible)
  destinationAleatoire(exclue) {
    const base = Object.keys(MAPS).filter((m) => m !== this.nomMap && !HASARD.interdites.includes(m));
    const candidates = base.filter((m) => m !== exclue);
    return Phaser.Utils.Array.GetRandom(candidates.length ? candidates : base);
  }

  // PORTE ALÉATOIRE. Règles :
  //  1) une porte mène à une map tirée au sort, et on arrive devant une de ses portes (la "porte d'arrivée") ;
  //  2) si on reprend CETTE porte d'arrivée, on revient devant la porte d'où l'on était parti ;
  //  3) si on reprend alors cette porte de départ, elle nous mène ailleurs : jamais dans la map qu'on vient de quitter.
  // La mémoire est gardée dans le registry : "lien" (aller en cours) et "exclusions" (map à éviter pour une porte).
  prendrePorteHasard(porte) {
    const lien = this.registry.get("lien"); // { map, porte, versMap, versPorte }
    const exclusions = { ...(this.registry.get("exclusions") || {}) };

    // 2) retour par la porte d'arrivée
    if (lien && lien.map === this.nomMap && lien.porte === porte.idx) {
      exclusions[lien.versMap + ":" + lien.versPorte] = this.nomMap; // la prochaine fois, cette porte ne mènera plus ici
      this.registry.set("exclusions", exclusions);
      this.registry.remove("lien");
      this.changerDeMap(lien.versMap, null, false, lien.versPorte);
      return;
    }

    // 1) nouvelle destination (3 : on évite la map notée dans les exclusions pour cette porte)
    const cle = this.nomMap + ":" + porte.idx;
    const exclue = exclusions[cle];
    delete exclusions[cle];
    this.registry.set("exclusions", exclusions);
    const dest = this.destinationAleatoire(exclue);
    const portesDest = MAPS[dest].portes;
    const arrivees = portesDest.map((p, i) => i).filter((i) => portesDest[i].vers === "hasard");
    const arrivee = Phaser.Utils.Array.GetRandom(arrivees);
    this.registry.set("lien", { map: dest, porte: arrivee, versMap: this.nomMap, versPorte: porte.idx });
    this.changerDeMap(dest, null, true, arrivee);
  }

  // petit murmure d'ambiance quand on arrive par une porte aléatoire
  murmurer() {
    if (!this.hasard || Math.random() > 0.5) return;
    this.message(Phaser.Utils.Array.GetRandom(MURMURES), 3000);
  }

  // affiche un texte en bas de l'écran pendant "duree" ms
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

  /*  POINTS D'INTERACTION  */

  // notes, miroir, bouton secret, cuvette : zones où l'on appuie sur B
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

  // le point est-il utilisable ?
  pointActif(def) {
    return !def.si || !!this.registry.get(def.si);
  }

  // dessine le petit bouton rouge secret
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

  // action du joueur j qui appuie sur B sur un point d'interaction
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

  /*ÉNIGMES*/

  ouvrirEnigme(id, joueur) {
    this.couperLasers();
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
    objets.push(fixe(this.add.text(L / 2, H / 2 + 208, "Joystick : choisir     B : valider     Saut : fermer", { fontSize: "15px", color: "#999999" }).setOrigin(0.5), 1502));

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

  // joystick : choisir la réponse, B : valider, saut : fermer
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
      this.fermerEnigme();
      return;
    }
    if (dir) {
      en.index = (en.index + dir + n) % n;
      en.retour.setText("");
      this.majOptionsEnigme();
    }
    if (!valider) return;

    if (en.index === en.def.bonne) {
      const { id, def, joueur } = en;
      this.fermerEnigme();
      this.registry.set(def.resolu, true);
      this.cameras.main.flash(350, 255, 255, 255);
      if (def.recompense) {
        if (def.recompense.score) this.ajouterScore(def.recompense.score, joueur);
        if (def.recompense.soin) this.vivants().forEach((j) => this.soigner(j, def.recompense.soin));
      }
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
    this.montrerCle(true);
  }

  /*CLÉ*/

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

  // écran Game Over (image plein écran) + choix : REVIVRE (si on est K.O., pas si le temps est écoulé) / REJOUER / RETOUR AU MENU
  afficherGameOver(raison = "Le temps est écoulé", peutRevivre = false) {
    this.perdu = true;
    this.peutRevivre = peutRevivre;
    this.heureMort = Date.now(); // le chrono est mis en pause tant qu'on choisit
    this.couperLasers();
    this.perduPret = false; // évite de relancer tout de suite si le joueur appuie sur B au moment de mourir
    this.time.delayedCall(800, () => (this.perduPret = true));
    this.physics.pause();
    this.vivants().forEach((j) => {
      j.sprite.setVelocity(0, 0);
      j.sprite.anims.play(this.anim(j, "anim_face"));
    });

    const L = this.scale.width;
    const H = this.scale.height;
    const texte = (x, y, t, style, prof = 2002) => this.add.text(x, y, t, style).setOrigin(0.5).setScrollFactor(0).setDepth(prof).setShadow(2, 2, "#000000", 4);
    const elements = [this.add.rectangle(L / 2, H / 2, L, H, 0x000000, 1).setScrollFactor(0).setDepth(2000)];

    if (this.textures.exists("game_over")) {
      elements.push(this.add.image(L / 2, H / 2, "game_over").setDisplaySize(L, H).setScrollFactor(0).setDepth(2000));
    } else {
      elements.push(texte(L / 2, H / 2 - 40, "Game Over", { fontSize: "72px", color: "#cc1111", fontStyle: "bold" }), texte(L / 2, H / 2 + 30, raison, { fontSize: "24px", color: "#ffffff" }));
    }

    // score(s) de la partie : un par joueur en duo
    const scores = scoresDeLaPartie(this.registry).map((s) => (s.joueur ? "J" + s.joueur + " : " : "SCORE : ") + s.score);
    elements.push(texte(L / 2, H - 205, scores.join("        "), { fontFamily: "Georgia, serif", fontSize: "34px", color: "#ffd24a", fontStyle: "bold" }));

    if (peutRevivre) {
      const nbC = Math.max(1, Math.round(REVIE.pv / (JOUEUR.pvMax / HUD.nbCoeurs))); // nombre de cœurs rendus
      elements.push(texte(L / 2, H - 150, "Revivre : " + nbC + (nbC > 1 ? " cœurs" : " cœur") + ", scores remis à zéro", { fontFamily: "Georgia, serif", fontSize: "22px", color: "#ffffff" }));
    }

    // boutons : Revivre (si possible), Rejouer, Retour au menu
    this.goBoutons = [];
    const nbBoutons = peutRevivre ? 3 : 2;
    const ecart = nbBoutons === 3 ? 330 : 360;
    const bouton = (cle, action) => {
      const x = L / 2 + (this.goBoutons.length - (nbBoutons - 1) / 2) * ecart;
      const b = this.add.image(x, H - 80, cle).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive({ useHandCursor: true });
      b.base = 0.5;
      const i = this.goBoutons.push({ obj: b, action }) - 1;
      b.on("pointerover", () => {
        this.goChoix = i;
        this.majChoixGameOver();
      });
      b.on("pointerdown", () => this.perduPret && action());
      elements.push(b);
    };
    if (peutRevivre) bouton("revivre", () => this.revivre());
    bouton("rejouer", () => this.rejouer());
    bouton("retour_menu", () => this.retourMenu());
    this.goChoix = 0; // par défaut : Revivre (ou Rejouer s'il n'y a pas Revivre)
    this.majChoixGameOver();

    elements.push(texte(L / 2, H - 24, "Joystick : choisir      Bouton B : valider", { fontSize: "16px", color: "#cccccc" }));

    // apparition en fondu
    elements.forEach((e) => e.setAlpha(0));
    this.tweens.add({ targets: elements, alpha: 1, duration: 500, onComplete: () => this.majChoixGameOver() });
  }

  // le bouton choisi grossit, l'autre est assombri
  majChoixGameOver() {
    if (!this.goBoutons) return;
    this.goBoutons.forEach((b, i) => {
      const actif = i === this.goChoix;
      b.obj.setScale(b.obj.base * (actif ? 1.1 : 0.95));
      actif ? b.obj.clearTint() : b.obj.setTint(0x888888);
    });
  }

  // manette sur l'écran Game Over : joystick = choisir, B = valider
  gererGameOver() {
    const J = Phaser.Input.Keyboard.JustDown;
    let dir = 0;
    let valider = J(this.toucheRejouer.entree) || J(this.toucheRejouer.espace);
    this.joueurs.forEach((j) => {
      const c = j.touches;
      if (J(c.left) || J(c.up)) dir = -1;
      if (J(c.right) || J(c.down)) dir = 1;
      if (J(c.action)) valider = true;
    });
    if (dir && this.goBoutons.length > 1) {
      this.goChoix = Phaser.Math.Clamp(this.goChoix + dir, 0, this.goBoutons.length - 1);
      this.majChoixGameOver();
    }
    if (valider && this.perduPret) this.goBoutons[this.goChoix].action();
  }

  // le temps est écoulé : l'écran se FIGE (tout s'arrête), on voit en gros "00:00", puis l'écran Game Over
  tempsEcoule() {
    if (this.gel || this.perdu) return;
    this.perdu = true;
    this.gel = true;
    this.couperLasers();
    this.fermerEnigme(); // (perdu = true : la physique ne repart pas)
    if (this.dialogue) {
      const d = this.dialogue;
      this.dialogue = null;
      d.minuteur.remove(false);
      d.objets.forEach((o) => o.destroy());
    }
    // on fige tout : physique, animations, mouvements de tweens
    this.physics.pause();
    this.anims.pauseAll();
    try {
      (this.tweens.getTweens ? this.tweens.getTweens() : this.tweens.getAllTweens()).forEach((t) => t.pause());
    } catch (e) {
      /* tant pis : seuls les petits flottements (potions...) continuent */
    }
    this.texteTimer.setText("00:00").setColor("#ff3333");

    const L = this.scale.width;
    const H = this.scale.height;
    const fixe = (o, prof) => o.setScrollFactor(0).setDepth(prof);
    const objets = [];
    const voile = fixe(this.add.rectangle(L / 2, H / 2, L, H, 0x300000, 1), 1900).setAlpha(0);
    objets.push(voile);
    this.tweens.add({ targets: voile, alpha: 0.55, duration: 400 });
    this.cameras.main.resetFX(); // au cas où un fondu de porte était en cours
    this.cameras.main.flash(250, 255, 0, 0);

    const police = { fontFamily: "Georgia, serif", fontStyle: "bold" };
    const gros = fixe(this.add.text(L / 2, H / 2 - 40, "00:00", { ...police, fontSize: "150px", color: "#ff3333" }).setOrigin(0.5), 1901);
    const sous = fixe(this.add.text(L / 2, H / 2 + 70, "Le manoir t'a piégé pour toujours...", { fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "28px", color: "#dddddd" }).setOrigin(0.5), 1901);
    objets.push(gros, sous);
    // 00:00 clignote ; la phrase apparaît en fondu
    this.tweens.add({ targets: gros, alpha: 0.1, duration: 280, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    sous.setAlpha(0);
    this.tweens.add({ targets: sous, alpha: 1, duration: 600, delay: 500 });

    // après un petit moment : écran Game Over (Rejouer / Retour au menu)
    this.time.delayedCall(3200, () => {
      this.anims.resumeAll();
      this.gel = false;
      this.afficherGameOver("Le temps est écoulé", false);
      this.time.delayedCall(700, () => objets.forEach((o) => o.destroy())); // le Game Over (fondu 500 ms) les recouvre
    });
  }

  // une horloge est ramassée : on gagne des secondes (le chrono est dans le registry)
  ajouterTemps(secondes) {
    this.registry.set("finPartie", this.registry.get("finPartie") + secondes * 1000);
    this.timerVertJusqua = this.time.now + 1200;
    this.tweens.add({ targets: this.texteTimer, scale: 1.4, duration: 150, yoyo: true });
    const t = this.add
      .text(this.scale.width - 10, 52, "+" + secondes + " s", { fontSize: "30px", color: "#66ff88", fontStyle: "bold", stroke: "#000000", strokeThickness: 5 })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1001);
    this.tweens.add({ targets: t, y: 90, alpha: 0, duration: 1300, onComplete: () => t.destroy() });
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

  // le joueur j récupère des points de vie. DUO : un cœur récupéré ramène aussi le coéquipier K.O. à la vie
  soigner(j, pv) {
    if (j.mort) return;
    const cle = "pv_" + j.num;
    this.registry.set(cle, Math.min(JOUEUR.pvMax, (this.registry.get(cle) ?? JOUEUR.pvMax) + pv));
    this.joueurs.filter((x) => x.mort).forEach((x) => this.ressusciter(x, j));
  }

  // le joueur K.O. j revient à côté de son coéquipier, avec 1 cœur (REVIE.pvCoequipier) et une courte protection
  ressusciter(j, sauveur) {
    const s = sauveur.sprite;
    j.mort = false;
    this.registry.set("pv_" + j.num, REVIE.pvCoequipier);
    j.sprite.enableBody(true, s.x + (j.num === 2 ? 24 : -24), s.y, true, true);
    j.sprite.setVelocity(0, 0).setAlpha(0.4);
    j.invulJusqua = this.time.now + 1500;
    this.time.delayedCall(1500, () => j.sprite.active && j.sprite.setAlpha(1));
    this.etincelles(j.sprite.x, j.sprite.y - 30, 0xff6677, 12);
    this.message("Joueur " + j.num + " est de retour !  (1 cœur)", 3000);
  }

  // un joueur n'a plus de points de vie : en solo c'est perdu, en duo il faut que les deux soient K.O.
  joueurMort(j) {
    if (j.mort) return;
    j.mort = true;
    j.sprite.disableBody(true, true);
    if (this.joueurs.every((x) => x.mort)) this.afficherGameOver("Tu es K.O. !", true);
    else this.message("Joueur " + j.num + " est K.O. !  Ramasse un cœur pour le ramener.", 4000);
  }

  // met à jour les cœurs de chaque joueur (1 cœur = pvMax / nbCoeurs, un cœur peut être rempli en partie)
  majBarres() {
    const part = JOUEUR.pvMax / HUD.nbCoeurs;
    this.joueurs.forEach((j, i) => {
      const sc = this.registry.get("score_" + j.num) || 0;
      if (sc !== j.dernierScore) {
        j.dernierScore = sc;
        this.texteScores[i].setText((this.joueurs.length > 1 ? "J" + j.num + "  " : "SCORE ") + String(sc).padStart(5, "0"));
      }
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

  // REJOUER : on passe par l'écran des scores, puis nouvelle partie depuis la map1
  rejouer() {
    if (this.partiEnCours) return;
    this.partiEnCours = true;
    this.scene.start("scores", { scores: scoresDeLaPartie(this.registry), suite: "rejouer" });
  }

  // RETOUR AU MENU : on passe par l'écran des scores (pour sauvegarder les scores), puis on revient à l'écran d'accueil
  retourMenu() {
    if (this.partiEnCours) return;
    this.partiEnCours = true;
    this.scene.start("scores", { scores: scoresDeLaPartie(this.registry), suite: "accueil" });
  }

  // REVIVRE : on reste dans la même salle, avec REVIE.pv points de vie, les scores sont perdus. Le chrono reprend là où il s'était arrêté.
  revivre() {
    if (this.partiEnCours) return;
    this.partiEnCours = true;
    this.registry.set("finPartie", this.registry.get("finPartie") + (Date.now() - this.heureMort));
    this.registry.set("pv_1", REVIE.pv);
    this.registry.set("pv_2", REVIE.pv);
    this.registry.set("score_1", 0);
    this.registry.set("score_2", 0);
    this.scene.restart({ map: this.nomMap, origine: this.origine, hasard: false, spawn: this.spawnPoint });
  }

  // ajoute des points au joueur j (et affiche "+100" à l'endroit indiqué)
  ajouterScore(points, j, x, y) {
    const cle = "score_" + (j ? j.num : 1);
    this.registry.set(cle, (this.registry.get(cle) || 0) + points);
    if (x === undefined) return;
    const t = this.add
      .text(x, y, "+" + points, { fontSize: "22px", color: "#ffd24a", fontStyle: "bold", stroke: "#000", strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(260);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  update(time, delta) {
    // ÉCRAN FIGÉ "TEMPS ÉCOULÉ" : tout est gelé, on attend la fin de l'animation
    if (this.gel) return;

    // GAME OVER : on attend le choix du joueur
    if (this.perdu) {
      this.gererGameOver();
      return;
    }

    // TIMER
    const restant = Math.max(0, Math.ceil((this.registry.get("finPartie") - Date.now()) / 1000));
    const mm = String(Math.floor(restant / 60)).padStart(2, "0");
    const ss = String(restant % 60).padStart(2, "0");
    this.texteTimer.setText(mm + ":" + ss);
    // rouge sur les 30 dernières secondes, vert un instant quand on gagne du temps (horloge)
    this.texteTimer.setColor(time < (this.timerVertJusqua || 0) ? "#66ff88" : restant <= 30 ? "#ff5555" : "#ffffff");
    if (restant <= 0 && !this.gagne) {
      this.tempsEcoule();
      return;
    }

    // APPUIS sur le bouton B (action)
    const toucheE = Phaser.Input.Keyboard.JustDown(this.toucheE);
    this.joueurs.forEach((j) => {
      j.appuiAction = Phaser.Input.Keyboard.JustDown(j.touches.action) || (toucheE && j.num === 1);
    });

    // DIALOGUE d'un PNJ ouvert : tout est figé
    if (this.dialogue) {
      this.vivants().forEach((j) => j.sprite.setVelocityX(0));
      this.gererDialogue();
      return;
    }

    // ÉNIGME ouverte : les joueurs sont figés, le temps continue de tourner !
    if (this.enigme) {
      this.vivants().forEach((j) => j.sprite.setVelocityX(0));
      this.gererEnigme();
      return;
    }

    if (this.enTransition) {
      this.vivants().forEach((j) => j.sprite.setVelocityX(0));
      return;
    }

    // PORTES : un seul joueur qui appuie sur B devant une porte fait passer tout le monde
    let porteVisible = null;
    for (const j of this.vivants()) {
      const porte = this.portes.find((z) => this.physics.overlap(j.sprite, z));
      if (!porte) continue;
      if (!porteVisible) porteVisible = porte;
      const fermee = !!this.raisonFermee(porte); // porte fermée à clé / énigme pas résolue
      if (porte.vers && !fermee && j.appuiAction) {
        if (porte.vers === "fin") this.finir(); // grande porte de la map6 : fin du jeu
        else if (porte.vers === "hasard") this.prendrePorteHasard(porte); // on ne sait pas où elle mène !
        else {
          this.registry.remove("lien"); // porte fixe : plus de retour mémorisé
          this.changerDeMap(porte.vers, this.nomMap);
        }
        return;
      }
    }
    if (porteVisible) {
      const raison = this.raisonFermee(porteVisible);
      const fermee = !!raison;
      const mystere = porteVisible.vers === "hasard";
      const lien = this.registry.get("lien");
      const retour = mystere && lien && lien.map === this.nomMap && lien.porte === porteVisible.idx; // la porte par laquelle on est arrivé
      this.indice.setText(fermee ? raison : retour ? "Appuie sur B... retour" : mystere ? "Appuie sur B... où mène-t-elle ?" : "Appuie sur B");
      this.indice.setColor(fermee ? "#ff8888" : "#ffffff");
    }
    this.indice.setVisible(!!(porteVisible && porteVisible.vers));
    if (porteVisible) this.indice.setPosition(porteVisible.x, porteVisible.y - 60);

    // POINTS D'INTERACTION (notes, miroir, bouton secret, cuvette) : B devant
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
        this.indice.setText("Appuie sur B").setColor("#ffffff").setVisible(true);
        this.indice.setPosition(pointVisible.x, pointVisible.y - pointVisible.height / 2 - 10);
      }
    }

    // DÉPLACEMENTS de chaque joueur
    this.vivants().forEach((j) => this.majJoueur(j));

    // COMBAT : attaques, ennemis, potions, piques
    this.majCombat(time, delta);

    // DUO : on empêche un joueur de sortir de l'écran
    // (pas pendant les 2 premières images : la vue de la caméra n'est pas encore calculée,
    //  sinon un joueur qui arrive par une porte à droite est ramené au milieu de la map)
    this.nbUpdates++;
    if (this.vivants().length > 1 && this.nbUpdates > 2) {
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

    // ESCALIER : on se pose dessus si on tombe (ou marche) sur la pente
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

    // ÉCHELLE : haut/bas pour grimper, la gravité est coupée tant qu'on est dessus
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

    // DÉPLACEMENTS
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