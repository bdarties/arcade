// ============================================================================
//  js/lobby.js — LE LOBBY (« les Cintres ») : le point d'apparition des joueurs
//
//  On y arrive en début de partie et après un Game Over (on y réapparaît au "spawn").
//  Le lobby a 3 portes, une par niveau. Pour entrer dans une porte : se placer
//  devant et appuyer sur le bouton B.
//     1 — Les Coulisses (à gauche, au niveau du sol)  -> toujours ouverte
//     2 — Les Ombres chinoises (en haut)             -> s'ouvre quand le niveau 1 est terminé
//     3 — La Grande Scène (à droite, sur une marche) -> « bientôt » (niveau pas encore fait)
//  Les portes fermées affichent un cadenas (règles dans progression.js).
//
//  - Flèches (J1) ou ZQSD (J2) pour marcher, bouton A pour sauter
//  - Solo : le bouton D (K) change de personnage. Duo : chacun son personnage.
//
//  La carte vient de Tiled (assets/lobby.json). Elle ne contient que des calques de tuiles :
//  les zones solides, les échelles et les portes sont décrites dans ce fichier (SOLIDES, ECHELLES, PORTES).
// ============================================================================

import { REGLAGES } from "./reglages.js";
import { creerPanneau } from "./controles.js";
import { jouerMusique } from "./musique.js";
import { aideClavier } from "./controles.js";
import { NIVEAUX, estTermine, estDebloque, niveauxTermines, prochainNiveau } from "./progression.js";

// ---- Dimensions de la carte (64 x 96 tuiles de 16 px) : elle est plus HAUTE que large ----
const LARGEUR_CARTE = 1024;
const HAUTEUR_CARTE = 1536;
const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif';

// Les zones SOLIDES du lobby : [x, y, largeur, hauteur] en pixels de la carte.
// La carte Tiled ne les décrit pas (et son calque "Plateforme" contient aussi des tuiles invisibles) :
// on les a donc relevées sur le dessin. Pour déplacer ou ajouter une plateforme, il suffit de changer cette liste.
const SOLIDES = [
  [0, 1434, 1024, 102], // le sol
  [0, 1328, 352, 32], // l'estrade de la porte 1 (« Les Coulisses »)
  [400, 1234, 224, 16], // plateforme centrée sur x = 512, au pied de la longue échelle
  [724, 1330, 300, 32], // le portail complet, contre le bord droit
  [610, 1401, 14, 15], // les marches de l'escalier vers le portail
  [624, 1386, 10, 30],
  [634, 1371, 20, 45],
  [654, 1354, 20, 62],
  [674, 1342, 28, 74],
  [702, 1330, 22, 86],
  [10, 1076, 332, 12], // le dessus du rideau de la porte 1 est praticable
  [0, 814, 192, 16], // la plateforme contre le bord gauche, au-dessus du rideau
  [512, 974, 180, 16], // la poutre centrée sur l'arrivée de l'échelle (x = 602)
  [336, 752, 256, 32], // les plateformes qui mènent à la porte 2
  [624, 754, 224, 16], // bord doré de la plateforme sous l'échelle de droite
  [624, 596, 240, 44], // dessus visible de la plateforme à l'arrivée de cette échelle
  [350, 508, 270, 18] // la passerelle sous la porte 2 : sans elle, on ne pouvait pas se tenir devant
];

// Les échelles dessinées dans la carte (calque "decor"). La carte Tiled ne les décrit pas : on les relève ici.
// x = le milieu de l'échelle ; haut / bas = hauteur approximative de ses extrémités (elle est ensuite
// ajustée sur le dessus de la plateforme la plus proche, voir trouverEchelles).
const ECHELLES = [
  { x: 221, haut: 1328, bas: 1440 }, // sous l'estrade de la porte 1 (« Les Coulisses »)
  { x: 602, haut: 974, bas: 1234 }, // du bord droit de la plateforme centrale au milieu de la poutre
  { x: 174, haut: 814, bas: 1076 }, // du dessus du rideau à la plateforme supérieure gauche
  { x: 814, haut: 596, bas: 754 } // sous la porte 2 (« Les Ombres chinoises »)
];

// Où apparaissent les joueurs (x, et y du sol sur lequel ils se posent)
const SPAWN = { x: 450, solY: 1434 };

// Les 3 portes. x, y, largeur, hauteur = la zone (en pixels de la carte) où l'on peut l'utiliser.
// niveau = le numéro du niveau qu'elle ouvre (son nom, sa scène et son état viennent de progression.js).
// Leur nom est déjà dessiné sur l'illustration du lobby : on affiche seulement une consigne quand on est devant.
const PORTES = [
  { niveau: 1, x: 104, y: 1250, largeur: 168, hauteur: 184 },
  { niveau: 2, x: 400, y: 430, largeur: 224, hauteur: 130 },
  { niveau: 3, x: 776, y: 1160, largeur: 192, hauteur: 170 }
];

export default class lobby extends Phaser.Scene {
  constructor() {
    super({ key: "lobby" });
  }

  // ==========================================================================
  //  PRELOAD : la carte, le fond et les images des tuiles
  // ==========================================================================
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.tilemapTiledJSON("carte_lobby", "./assets/lobby.json");
    this.load.image("img_lobby_fond", "./assets/lobby_fond.jpg");
    // Images des tuiles. Si l'une manque, le lobby reste jouable avec un décor de secours.
    this.load.image("ts_lobby_tilesett", "./assets/tilesett.png");
    this.load.image("ts_lobby_fond", "./assets/fond.png");
    this.load.image("ts_lobby_portail", "./assets/portail.png");
  }

  // ==========================================================================
  //  CREATE
  // ==========================================================================
  create() {
    // create() est rappelée à chaque retour au lobby : on remet tout à zéro
    this.mode = this.registry.get("mode") || "solo"; // "solo" ou "duo" (choisi dans choix_mode)
    this.enTransition = false;

    this.physics.world.gravity.y = REGLAGES.gravite;
    this.physics.world.setBounds(0, 0, LARGEUR_CARTE, HAUTEUR_CARTE);
    this.cameras.main.setBackgroundColor(0x05060d);

    this.creerDecor();
    this.creerSol();
    this.trouverEchelles();
    this.creerPortes();
    this.creerPersonnages();
    this.creerCamera();
    this.creerInterface();
    this.demarrerMusique();
  }

  // La musique du lobby : la même piste que l'accueil, sans coupure (voir musique.js)
  demarrerMusique() {
    jouerMusique(this, "musique_accueil", 0.4);
  }

  // --------------------------------------------------------------------------
  //  Décor : l'illustration du lobby derrière, puis les calques de tuiles de Tiled
  // --------------------------------------------------------------------------
  creerDecor() {
    // Les 3 images de tuiles sont-elles là ?
    this.avecTuiles =
      this.textures.exists("ts_lobby_tilesett") && this.textures.exists("ts_lobby_fond") && this.textures.exists("ts_lobby_portail");

    if (this.textures.exists("img_lobby_fond")) {
      // Même taille que la carte (1024 x 1536) et posée en (0, 0) : les tuiles tombent pile dessus
      this.add.image(0, 0, "img_lobby_fond").setOrigin(0, 0).setDisplaySize(LARGEUR_CARTE, HAUTEUR_CARTE).setDepth(0);
    }

    if (this.avecTuiles == true) {
      const carte = this.add.tilemap("carte_lobby");
      // 1er nom = le nom du jeu de tuiles dans Tiled, 2e nom = la clé chargée dans preload
      const tuiles = [
        carte.addTilesetImage("tilesett", "ts_lobby_tilesett"),
        carte.addTilesetImage("fond", "ts_lobby_fond"),
        carte.addTilesetImage("PORTAIL", "ts_lobby_portail")
      ];
      carte.createLayer("Plateforme", tuiles).setDepth(2);
      carte.createLayer("decor", tuiles).setDepth(3);
    }
  }

  // --------------------------------------------------------------------------
  //  Le sol et les plateformes : des rectangles invisibles avec un corps statique (qui ne bouge pas)
  // --------------------------------------------------------------------------
  creerSol() {
    this.groupe_sol = this.physics.add.staticGroup();

    SOLIDES.forEach(([x, y, largeur, hauteur]) => {
      const zone = this.add.zone(x + largeur / 2, y + hauteur / 2, largeur, hauteur);
      this.groupe_sol.add(zone); // ajouter au groupe statique lui donne un corps solide
      if (this.avecTuiles == false) {
        // décor de secours : on dessine les zones solides en bois
        this.add.tileSprite(zone.x, zone.y, largeur, hauteur, "tex_bois").setDepth(2);
      }
    });
  }

  // --------------------------------------------------------------------------
  //  Les échelles : on cale le haut et le bas de chacune sur le dessus d'une plateforme proche
  // --------------------------------------------------------------------------
  trouverEchelles() {
    const solides = this.groupe_sol.getChildren().map((z) => ({
      gauche: z.x - z.width / 2,
      droite: z.x + z.width / 2,
      haut: z.y - z.height / 2
    }));
    // le dessus de plateforme le plus proche de y (à 32 px près) sous l'échelle ; sinon on garde y
    const caler = (x, y) => {
      let meilleur = y;
      let ecart = 33;
      solides.forEach((s) => {
        if (x >= s.gauche - 4 && x <= s.droite + 4 && Math.abs(s.haut - y) < ecart) {
          ecart = Math.abs(s.haut - y);
          meilleur = s.haut;
        }
      });
      return meilleur;
    };
    this.echelles = ECHELLES.map((e) => ({ centreX: e.x, haut: caler(e.x, e.haut), bas: caler(e.x, e.bas) }));

    // Les échelles ajoutées après coup ne sont pas dans l'illustration : on les dessine nous-mêmes
    ECHELLES.forEach((e, i) => {
      if (e.dessiner == true) {
        const { haut, bas } = this.echelles[i];
        const dessin = this.add.graphics().setDepth(4);
        dessin.lineStyle(4, 0xc9a24a).lineBetween(e.x - 8, haut, e.x - 8, bas).lineBetween(e.x + 8, haut, e.x + 8, bas);
        for (let y = haut + 12; y < bas; y += 18) {
          dessin.lineBetween(e.x - 8, y, e.x + 8, y); // les barreaux
        }
      }
    });
  }

  // Haut / bas du joystick devant une échelle pour s'y accrocher (même principe qu'au niveau 1)
  gererEchelle(perso, controle) {
    const corps = perso.body;
    const pied = corps.bottom; // hauteur des pieds
    const echelle = this.echelles.find(function (e) {
      return Math.abs(corps.center.x - e.centreX) <= 16 && pied >= e.haut - 3 && pied <= e.bas + 3;
    });

    // S'accrocher : on monte (sauf si on est déjà tout en haut) ou on descend (sauf si on est tout en bas)
    if (perso.enEchelle == false && controle == true && echelle !== undefined) {
      const veutMonter = this.toucheEnfoncee(perso, "haut") && pied > echelle.haut + 2;
      const veutDescendre = this.toucheEnfoncee(perso, "bas") && pied < echelle.bas - 2;
      if (veutMonter || veutDescendre) {
        perso.enEchelle = true;
      }
    }
    if (perso.enEchelle == false) {
      return;
    }
    if (echelle === undefined) {
      this.lacherEchelle(perso);
      return;
    }

    let vitesseY = 0;
    if (controle == true) {
      if (this.toucheEnfoncee(perso, "haut")) {
        vitesseY = -REGLAGES.echelle.vitesse;
      } else if (this.toucheEnfoncee(perso, "bas")) {
        vitesseY = REGLAGES.echelle.vitesse;
      }
      // Bouton A : on saute de l'échelle
      if (this.toucheAppuyee(perso, "A")) {
        this.lacherEchelle(perso);
        perso.setVelocityY(REGLAGES.saut);
        return;
      }
    }
    perso.body.setAllowGravity(false); // pas de gravité sur l'échelle
    perso.setVelocity(0, vitesseY);
    perso.x = echelle.centreX;

    // Arrivé en haut ou en bas : on se pose sur la plateforme et on lâche l'échelle
    if (vitesseY < 0 && pied <= echelle.haut) {
      perso.y += echelle.haut - pied;
      this.lacherEchelle(perso);
    } else if (vitesseY > 0 && pied >= echelle.bas) {
      perso.y -= pied - echelle.bas;
      this.lacherEchelle(perso);
    }
  }

  lacherEchelle(perso) {
    perso.enEchelle = false;
    perso.body.setAllowGravity(true);
  }

  // --------------------------------------------------------------------------
  //  Les portes : une consigne apparaît quand un joueur est devant
  // --------------------------------------------------------------------------
  creerPortes() {
    const deblocage = this.registry.get("deblocage"); // numéro du niveau qu'on vient de débloquer (ou null)
    this.portes = PORTES.map((porte) => {
      const niveau = NIVEAUX.find((n) => n.numero == porte.niveau);
      const centreX = porte.x + porte.largeur / 2;
      const centreY = porte.y + porte.hauteur / 2;
      const texte = this.add
        .text(centreX, porte.y - 20, "", {
          fontFamily: POLICE,
          fontSize: "13pt",
          color: "#ffe9a8",
          align: "center",
          stroke: "#000000",
          strokeThickness: 4,
          backgroundColor: "#000000aa",
          padding: { x: 10, y: 6 }
        })
        .setOrigin(0.5)
        .setDepth(6)
        .setAlpha(0); // invisible tant que personne n'est devant la porte
      // un voile sombre + un cadenas sur la porte quand elle n'est pas ouverte
      const voile = this.add.rectangle(centreX, centreY, porte.largeur, porte.hauteur, 0x000010, 0.62).setDepth(5);
      const cadenas = this.add.graphics().setDepth(5.5);
      cadenas.fillStyle(0xd4a94f).fillRoundedRect(centreX - 15, centreY - 2, 30, 24, 4);
      cadenas.lineStyle(5, 0xd4a94f).beginPath().arc(centreX, centreY - 4, 10, Math.PI, 0, false).strokePath();
      cadenas.fillStyle(0x3a2a10).fillCircle(centreX, centreY + 10, 3);
      // le fragment de partition qui récompense ce niveau : éteint tant qu'il n'est pas gagné
      const icone = this.add.image(centreX, porte.y - 64, "img_partition").setDisplaySize(46, 46).setDepth(6);

      const objet = { donnees: porte, niveau: niveau, zone: new Phaser.Geom.Rectangle(porte.x, porte.y, porte.largeur, porte.hauteur), texte: texte, voile: voile, cadenas: cadenas, icone: icone };
      if (deblocage == porte.niveau) {
        // la porte vient d'être débloquée : on la montre d'abord verrouillée, puis le verrou disparaît
        this.majPorte(objet, "verrouillee");
        this.time.delayedCall(1100, () => {
          this.majPorte(objet);
          this.tweens.add({ targets: icone, scale: icone.scale * 1.5, duration: 350, yoyo: true, repeat: 2 });
          this.cameras.main.flash(350, 255, 235, 170);
          this.afficherMessage("Porte " + niveau.numero + " débloquée : " + niveau.nom + " !", 5000);
          this.registry.set("deblocage", null);
        });
      } else {
        this.majPorte(objet);
      }
      return objet;
    });
  }

  // L'état d'une porte : "terminee", "ouverte", "bientot" (ouverte mais niveau en construction) ou "verrouillee"
  etatPorte(niveau) {
    if (estTermine(this.registry, niveau.numero) == true) {
      return "terminee";
    }
    if (estDebloque(this.registry, niveau.numero) == false) {
      return "verrouillee";
    }
    return niveau.disponible == true ? "ouverte" : "bientot";
  }

  // Met à jour l'apparence d'une porte (texte, voile, cadenas, fragment) selon son état
  majPorte(porte, etatForce) {
    const etat = etatForce !== undefined ? etatForce : this.etatPorte(porte.niveau);
    const messages = {
      ouverte: "Bouton B : entrer",
      terminee: "Terminée · Bouton B : rejouer",
      bientot: "En construction · bientôt !",
      verrouillee: "Verrouillée · termine le niveau " + (porte.niveau.numero - 1)
    };
    porte.etat = etat;
    porte.texte.setText(messages[etat]).setColor(etat == "verrouillee" || etat == "bientot" ? "#aab4d8" : "#ffe9a8");
    porte.voile.setVisible(etat == "verrouillee" || etat == "bientot").setAlpha(etat == "verrouillee" ? 0.62 : 0.4);
    porte.cadenas.setVisible(etat == "verrouillee");
    // le fragment : doré et lumineux si le niveau est terminé, gris et transparent sinon
    if (etat == "terminee") {
      porte.icone.clearTint().setAlpha(1);
    } else {
      porte.icone.setTint(0x6a7288).setAlpha(0.45);
    }
  }

  // --------------------------------------------------------------------------
  //  Personnages : Cantatrice (J1) et Détective (J2)
  // --------------------------------------------------------------------------
  creerPersonnages() {
    const j1 = creerPanneau(this, "j1"); // touches du joueur 1
    const j2 = creerPanneau(this, "j2"); // touches du joueur 2

    // En duo chacun a ses touches. En solo, les deux joysticks fonctionnent pour le perso actif.
    this.cantatrice = this.creerPersonnage("cantatrice", SPAWN.x, this.mode == "duo" ? [j1] : [j1, j2]);
    // En solo il n'y a qu'un seul corps (comme au niveau 1) : pas de Détective dans le lobby
    this.detective = this.mode == "duo" ? this.creerPersonnage("detective", SPAWN.x + 60, [j2]) : null;
    this.persos = this.mode == "duo" ? [this.cantatrice, this.detective] : [this.cantatrice];
    this.actif = this.cantatrice; // en solo : le personnage qu'on contrôle en ce moment

    // On marche sur le sol, sauf quand on est accroché à une échelle
    // (la 3e fonction est une CONDITION : si elle renvoie false, il n'y a pas de collision)
    this.physics.add.collider(this.persos, this.groupe_sol, null, function (perso) {
      return perso.enEchelle != true;
    });

    // En solo : une petite flèche dorée au-dessus du personnage qu'on contrôle
    this.fleche = this.add.image(0, 0, "tex_fleche").setDepth(20).setVisible(this.mode == "solo");
  }

  creerPersonnage(nom, x, touches) {
    const perso = this.physics.add.sprite(x, SPAWN.solY - 40, nom + "_idle");
    perso.setDepth(10);
    perso.setCollideWorldBounds(true);
    // Hitbox plus petite que l'image de 64 x 64 : seulement le corps, pieds en bas de l'image
    perso.body.setSize(24, 54, false);
    perso.body.setOffset(20, 9);
    perso.body.setMaxVelocity(600, 800);
    perso.play(nom + "_idle");

    perso.nom = nom; // "cantatrice" ou "detective"
    perso.touches = touches; // liste des claviers qui le contrôlent
    perso.enEchelle = false; // vrai quand le personnage est accroché à une échelle
    return perso;
  }

  // --------------------------------------------------------------------------
  //  Caméra : la carte est en hauteur, la caméra suit les personnages vers le haut et le bas
  // --------------------------------------------------------------------------
  creerCamera() {
    const camera = this.cameras.main;
    // La carte (1024 px de large) est plus étroite que l'écran (1280 px) : on la centre, avec 128 px de marge de chaque côté
    camera.setBounds(-128, 0, 1280, HAUTEUR_CARTE);
    camera.setScroll(-128, HAUTEUR_CARTE - 720); // on commence tout en bas, là où apparaissent les joueurs
    this.cible_camera = this.add.zone(LARGEUR_CARTE / 2, SPAWN.solY - 100, 10, 10);
    camera.startFollow(this.cible_camera, true, 0.08, 0.08);
    camera.fadeIn(600, 0, 0, 0);
  }

  creerInterface() {
    const style = {
      fontFamily: POLICE,
      fontSize: "15pt",
      color: "#dfe6ff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 5
    };
    const consigne = "LE LOBBY · " + (this.mode == "solo" ? "joystick : marcher · A : sauter" : "J1 : A sauter · J2 : A sauter") + "\n" + aideClavier();
    this.texteConsigne = this.add.text(640, 30, consigne, { ...style, fontStyle: "bold" }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.tweens.add({ targets: this.texteConsigne, alpha: 0, delay: 6000, duration: 1500 });

    // Message en bas de l'écran (ex : « cette porte n'est pas encore ouverte »)
    this.texteMessage = this.add
      .text(640, 676, "", { ...style, fontSize: "14pt", fontStyle: "bold" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);
    this.messageJusqua = 0;

    // En haut à droite : les fragments de partition trouvés, et le prochain objectif
    const fixe = (objet) => objet.setScrollFactor(0).setDepth(100);
    const termines = niveauxTermines(this.registry).length;
    fixe(this.add.image(1228, 44, "img_partition")).setDisplaySize(46, 46);
    fixe(this.add.text(1196, 44, "Fragments : " + termines + " / " + NIVEAUX.length, { ...style, fontSize: "14pt", color: "#ffe9a8" }).setOrigin(1, 0.5));
    const suivant = prochainNiveau(this.registry);
    let objectif = "Tous les niveaux sont terminés !";
    if (suivant !== undefined) {
      objectif = suivant.disponible == true ? "Prochain objectif : porte " + suivant.numero + " — " + suivant.nom : "Niveau " + suivant.numero + " : en construction";
    }
    fixe(this.add.text(1250, 82, objectif, { ...style, fontSize: "12pt", color: "#dfe6ff" }).setOrigin(1, 0.5));
  }

  // ==========================================================================
  //  UPDATE
  // ==========================================================================
  update(temps) {
    if (this.enTransition == true) {
      return;
    }

    this.persos.forEach((perso) => this.gererPersonnage(perso));
    this.verifierPortes(temps);
    this.mettreAJourCamera();
    if (this.mode == "solo") {
      this.fleche.setPosition(this.actif.x, this.actif.y - 46 + Math.sin(temps / 150) * 4);
    }
    if (temps > this.messageJusqua) {
      this.texteMessage.setText("");
    }
  }

  toucheEnfoncee(perso, bouton) {
    return perso.touches.some((clavier) => clavier[bouton].isDown);
  }

  // Vrai UNE SEULE FOIS par appui (pas tant que la touche reste enfoncée)
  toucheAppuyee(perso, bouton) {
    return perso.touches.map((clavier) => Phaser.Input.Keyboard.JustDown(clavier[bouton])).includes(true);
  }

  // Marcher, sauter, animer. En solo, seul le personnage actif obéit aux touches.
  gererPersonnage(perso) {
    const controle = this.mode == "duo" || perso == this.actif;
    this.gererEchelle(perso, controle);
    const aTerre = perso.body.blocked.down || perso.body.touching.down;

    let direction = 0; // -1 gauche, 0 immobile, 1 droite
    if (controle == true && perso.enEchelle == false) {
      if (this.toucheEnfoncee(perso, "gauche")) {
        direction = -1;
      } else if (this.toucheEnfoncee(perso, "droite")) {
        direction = 1;
      }
    }
    // Sur une échelle, la vitesse est gérée par gererEchelle
    if (perso.enEchelle == false) {
      perso.setVelocityX(direction * REGLAGES.vitesse);
    }
    if (direction != 0) {
      perso.setFlipX(direction < 0); // les images regardent vers la droite : on les retourne
    }
    if (controle == true && perso.enEchelle == false && aTerre && this.toucheAppuyee(perso, "A")) {
      perso.setVelocityY(REGLAGES.saut);
    }

    let anim = "idle";
    if (perso.enEchelle == true) {
      anim = perso.body.velocity.y != 0 ? "walk" : "idle"; // il "marche" en grimpant
    } else if (aTerre == false) {
      anim = "jump";
    } else if (direction != 0) {
      anim = "walk";
    }
    const cle = perso.nom + "_" + anim;
    if (perso.anims.currentAnim == null || perso.anims.currentAnim.key != cle) {
      perso.anims.play(cle);
    }
  }

  // Un joueur devant une porte appuie sur B : porte ouverte = on part dans le niveau, sinon un message
  verifierPortes(temps) {
    this.portes.forEach((porte) => {
      let quelquUnDevant = false;
      this.persos.forEach((perso) => {
        const controle = this.mode == "duo" || perso == this.actif;
        if (Phaser.Geom.Rectangle.Contains(porte.zone, perso.x, perso.y)) {
          quelquUnDevant = true;
          if (controle == true && this.toucheAppuyee(perso, "B")) {
            this.utiliserPorte(porte);
          }
        }
      });
      // la consigne apparaît (et pulse) quand quelqu'un est devant la porte
      porte.texte.setAlpha(quelquUnDevant ? 0.85 + Math.sin(temps / 200) * 0.15 : 0);
    });
  }

  utiliserPorte(porte) {
    if (porte.etat == "verrouillee") {
      const precedent = NIVEAUX.find((n) => n.numero == porte.niveau.numero - 1);
      this.afficherMessage("Porte verrouillée : termine d'abord le niveau " + precedent.numero + " (" + precedent.nom + ")", 3500);
      return;
    }
    if (porte.etat == "bientot") {
      this.afficherMessage("Le niveau " + porte.niveau.numero + " est en construction : reviens bientôt !", 3500);
      return;
    }
    this.entrerDansLaPorte(porte.niveau.scene);
  }

  afficherMessage(texte, dureeMs) {
    this.messageJusqua = this.time.now + dureeMs;
    this.texteMessage.setText(texte);
  }

  // Zoom de la caméra + fondu au noir, puis le niveau
  entrerDansLaPorte(scene) {
    this.enTransition = true;
    this.persos.forEach((perso) => {
      perso.setVelocityX(0);
      perso.anims.play(perso.nom + "_idle");
    });
    this.cameras.main.zoomTo(1.5, 800);
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(scene);
    });
  }

  // Solo : on suit le personnage actif. Duo : on suit le milieu des deux (surtout en hauteur ici).
  mettreAJourCamera() {
    let y;
    if (this.mode == "solo") {
      y = this.actif.y;
    } else {
      y = (this.cantatrice.y + this.detective.y) / 2;
    }
    this.cible_camera.setPosition(LARGEUR_CARTE / 2, y);
  }
}
