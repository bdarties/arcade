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

// On importe ce dont le lobby a besoin : les réglages (vitesses, sauts), les touches,
// la musique, et la progression (quelles portes sont ouvertes).
import { REGLAGES } from "./reglages.js";
import { creerPanneau, aideClavier } from "./controles.js";
import { jouerMusique } from "./musique.js";
import { NIVEAUX, estTermine, estDebloque, niveauxTermines, prochainNiveau } from "./progression.js";

// ---- Dimensions de la carte (64 x 96 tuiles de 16 px) : elle est plus HAUTE que large ----
const LARGEUR_CARTE = 1024; // largeur de la carte, en pixels
const HAUTEUR_CARTE = 1536; // hauteur de la carte, en pixels
const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif'; // police de tous les textes du lobby

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

// La scène « lobby » : Phaser la crée à partir de cette classe
export default class lobby extends Phaser.Scene {
  constructor() {
    super({ key: "lobby" }); // le nom sous lequel les autres écrans ouvrent le lobby
  }

  // ==========================================================================
  //  PRELOAD : la carte, le fond et les images des tuiles
  // ==========================================================================
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL); // les fichiers sont cherchés depuis le dossier du jeu
    this.load.tilemapTiledJSON("carte_lobby", "./assets/lobby.json"); // la carte dessinée dans Tiled
    this.load.image("img_lobby_fond", "./assets/lobby_fond.jpg"); // l'illustration du lobby, derrière tout
    // Images des tuiles. Si l'une manque, le lobby reste jouable avec un décor de secours.
    this.load.image("ts_lobby_tilesett", "./assets/tilesett.png"); // les tuiles de plateformes
    this.load.image("ts_lobby_fond", "./assets/fond.png"); // les tuiles de décor
    this.load.image("ts_lobby_portail", "./assets/portail.png"); // les tuiles du portail
  }

  // ==========================================================================
  //  CREATE
  // ==========================================================================
  create() {
    // create() est rappelée à chaque retour au lobby : on remet tout à zéro
    this.mode = this.registry.get("mode") || "solo"; // "solo" ou "duo" (choisi dans choix_mode)
    this.enTransition = false; // devient vrai pendant un fondu : on ne peut plus rien faire

    this.physics.world.gravity.y = REGLAGES.gravite; // la gravité du lobby (la même que les niveaux)
    this.physics.world.setBounds(0, 0, LARGEUR_CARTE, HAUTEUR_CARTE); // le monde ne dépasse pas la carte
    this.cameras.main.setBackgroundColor(0x05060d); // couleur de fond, derrière l'illustration

    this.creerDecor(); // l'illustration et les calques de tuiles
    this.creerSol(); // les zones solides où l'on marche
    this.trouverEchelles(); // on cale les échelles sur les plateformes
    this.creerPortes(); // les trois portes, avec leur consigne et leur état
    this.creerPersonnages(); // la Cantatrice (et le Détective en duo)
    this.creerCamera(); // la caméra qui suit les joueurs
    this.creerInterface(); // les textes en haut et en bas de l'écran
    this.demarrerMusique(); // la musique du lobby
  }

  // La musique du lobby : la même piste que l'accueil, sans coupure (voir musique.js)
  demarrerMusique() {
    jouerMusique(this, "musique_accueil", 0.4); // 0.4 = volume (entre 0 et 1)
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
      const carte = this.add.tilemap("carte_lobby"); // on lit la carte Tiled
      // 1er nom = le nom du jeu de tuiles dans Tiled, 2e nom = la clé chargée dans preload
      const tuiles = [
        carte.addTilesetImage("tilesett", "ts_lobby_tilesett"),
        carte.addTilesetImage("fond", "ts_lobby_fond"),
        carte.addTilesetImage("PORTAIL", "ts_lobby_portail")
      ];
      carte.createLayer("Plateforme", tuiles).setDepth(2); // le calque des plateformes, au-dessus du fond
      carte.createLayer("decor", tuiles).setDepth(3); // le calque de décor, devant les plateformes
    }
  }

  // --------------------------------------------------------------------------
  //  Le sol et les plateformes : des rectangles invisibles avec un corps statique (qui ne bouge pas)
  // --------------------------------------------------------------------------
  creerSol() {
    this.groupe_sol = this.physics.add.staticGroup(); // un groupe de solides qui ne bougent pas

    SOLIDES.forEach(([x, y, largeur, hauteur]) => {
      // pour chaque zone de la liste : un rectangle invisible centré (Phaser prend le centre, pas le coin)
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
    // on transforme chaque zone solide en un simple objet : ses bords gauche, droit et son dessus
    const solides = this.groupe_sol.getChildren().map((z) => ({
      gauche: z.x - z.width / 2,
      droite: z.x + z.width / 2,
      haut: z.y - z.height / 2
    }));
    // le dessus de plateforme le plus proche de y (à 32 px près) sous l'échelle ; sinon on garde y
    const caler = (x, y) => {
      let meilleur = y; // par défaut, on garde la hauteur prévue
      let ecart = 33; // on ne cale que si une plateforme est à moins de 32 px
      solides.forEach((s) => {
        // la plateforme doit être sous l'échelle (x compris, à 4 px près) et assez proche en hauteur
        if (x >= s.gauche - 4 && x <= s.droite + 4 && Math.abs(s.haut - y) < ecart) {
          ecart = Math.abs(s.haut - y); // on garde la plateforme la plus proche trouvée jusqu'ici
          meilleur = s.haut;
        }
      });
      return meilleur;
    };
    // on calcule le haut et le bas de chaque échelle, calés sur les plateformes
    this.echelles = ECHELLES.map((e) => ({ centreX: e.x, haut: caler(e.x, e.haut), bas: caler(e.x, e.bas) }));
  }

  // Haut / bas du joystick devant une échelle pour s'y accrocher (même principe qu'au niveau 1)
  gererEchelle(perso, controle) {
    const corps = perso.body; // le corps physique du personnage (sa boîte de collision)
    const pied = corps.bottom; // hauteur des pieds
    // on cherche une échelle à laquelle le personnage peut s'accrocher (centré dessus, pieds à la bonne hauteur)
    const echelle = this.echelles.find(function (e) {
      return Math.abs(corps.center.x - e.centreX) <= 16 && pied >= e.haut - 3 && pied <= e.bas + 3;
    });

    // S'accrocher : on monte (sauf si on est déjà tout en haut) ou on descend (sauf si on est tout en bas)
    if (perso.enEchelle == false && controle == true && echelle !== undefined) {
      const veutMonter = this.toucheEnfoncee(perso, "haut") && pied > echelle.haut + 2;
      const veutDescendre = this.toucheEnfoncee(perso, "bas") && pied < echelle.bas - 2;
      if (veutMonter || veutDescendre) {
        perso.enEchelle = true; // le personnage est maintenant accroché
      }
    }
    if (perso.enEchelle == false) {
      return; // pas accroché : rien à faire ici
    }
    if (echelle === undefined) {
      this.lacherEchelle(perso); // accroché mais plus d'échelle sous lui : on lâche
      return;
    }

    let vitesseY = 0; // vitesse verticale sur l'échelle (0 = immobile)
    if (controle == true) {
      if (this.toucheEnfoncee(perso, "haut")) {
        vitesseY = -REGLAGES.echelle.vitesse; // négatif = vers le haut
      } else if (this.toucheEnfoncee(perso, "bas")) {
        vitesseY = REGLAGES.echelle.vitesse; // positif = vers le bas
      }
      // Bouton A : on saute de l'échelle
      if (this.toucheAppuyee(perso, "A")) {
        this.lacherEchelle(perso);
        perso.setVelocityY(REGLAGES.saut); // on lance un petit saut
        return;
      }
    }
    perso.body.setAllowGravity(false);
    perso.setVelocity(0, vitesseY); // pas de marche sur l'échelle, seulement monter ou descendre
    perso.x = echelle.centreX; // on reste bien au milieu de l'échelle

    // Arrivé en haut ou en bas : on se pose sur la plateforme et on lâche l'échelle
    if (vitesseY < 0 && pied <= echelle.haut) {
      perso.y += echelle.haut - pied; // on le remet pile sur le dessus de la plateforme
      this.lacherEchelle(perso);
    } else if (vitesseY > 0 && pied >= echelle.bas) {
      perso.y -= pied - echelle.bas; // on le remet pile en bas de l'échelle
      this.lacherEchelle(perso);
    }
  }

  // Lâcher l'échelle : la gravité revient et le personnage n'est plus « accroché »
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
      const niveau = NIVEAUX.find((n) => n.numero == porte.niveau); // les infos du niveau (nom, scène…)
      const centreX = porte.x + porte.largeur / 2; // centre horizontal de la porte
      const centreY = porte.y + porte.hauteur / 2; // centre vertical de la porte
      // la consigne au-dessus de la porte (« Bouton B : entrer »…), invisible au départ
      const texte = this.add
        .text(centreX, porte.y - 20, "", {
          fontFamily: POLICE,
          fontSize: "13pt",
          color: "#ffe9a8",
          align: "center",
          stroke: "#000000",
          strokeThickness: 4,
          backgroundColor: "#000000aa", // fond noir semi-transparent : lisible sur tous les décors
          padding: { x: 10, y: 6 }
        })
        .setOrigin(0.5)
        .setDepth(6)
        .setAlpha(0); // invisible tant que personne n'est devant la porte
      // un voile sombre + un cadenas sur la porte quand elle n'est pas ouverte
      const voile = this.add.rectangle(centreX, centreY, porte.largeur, porte.hauteur, 0x000010, 0.62).setDepth(5);
      const cadenas = this.add.graphics().setDepth(5.5); // le dessin du cadenas (un corps et une anse)
      cadenas.fillStyle(0xd4a94f).fillRoundedRect(centreX - 15, centreY - 2, 30, 24, 4); // le corps du cadenas
      cadenas.lineStyle(5, 0xd4a94f).beginPath().arc(centreX, centreY - 4, 10, Math.PI, 0, false).strokePath(); // l'anse
      cadenas.fillStyle(0x3a2a10).fillCircle(centreX, centreY + 10, 3); // le trou de la serrure
      // le fragment de partition qui récompense ce niveau : éteint tant qu'il n'est pas gagné
      const icone = this.add.image(centreX, porte.y - 64, "img_partition").setDisplaySize(46, 46).setDepth(6);

      // on regroupe tout ce qui concerne cette porte dans un seul objet
      const objet = { donnees: porte, niveau: niveau, zone: new Phaser.Geom.Rectangle(porte.x, porte.y, porte.largeur, porte.hauteur), texte: texte, voile: voile, cadenas: cadenas, icone: icone };
      if (deblocage == porte.niveau) {
        // la porte vient d'être débloquée : on la montre d'abord verrouillée, puis le verrou disparaît
        this.majPorte(objet, "verrouillee");
        this.time.delayedCall(1100, () => {
          this.majPorte(objet); // après 1,1 s : la porte s'ouvre vraiment
          this.tweens.add({ targets: icone, scale: icone.scale * 1.5, duration: 350, yoyo: true, repeat: 2 }); // le fragment pulse
          this.cameras.main.flash(350, 255, 235, 170); // petit flash doré
          this.afficherMessage("Porte " + niveau.numero + " débloquée : " + niveau.nom + " !", 5000);
          this.registry.set("deblocage", null); // on n'annonce la porte qu'une seule fois
        });
      } else {
        this.majPorte(objet); // état normal de la porte
      }
      return objet;
    });
  }

  // L'état d'une porte : "terminee", "ouverte", "bientot" (ouverte mais niveau en construction) ou "verrouillee"
  etatPorte(niveau) {
    if (estTermine(this.registry, niveau.numero) == true) {
      return "terminee"; // déjà gagné
    }
    if (estDebloque(this.registry, niveau.numero) == false) {
      return "verrouillee"; // le niveau précédent n'est pas fini
    }
    return niveau.disponible == true ? "ouverte" : "bientot"; // ouvert, ou pas encore fait
  }

  // Met à jour l'apparence d'une porte (texte, voile, cadenas, fragment) selon son état
  majPorte(porte, etatForce) {
    const etat = etatForce !== undefined ? etatForce : this.etatPorte(porte.niveau); // l'état forcé gagne sur le calcul
    const messages = {
      ouverte: "Bouton B : entrer",
      terminee: "Terminée · Bouton B : rejouer",
      bientot: "En construction · bientôt !",
      verrouillee: "Verrouillée · termine le niveau " + (porte.niveau.numero - 1)
    };
    porte.etat = etat; // on retient l'état, utilisé par utiliserPorte()
    porte.texte.setText(messages[etat]).setColor(etat == "verrouillee" || etat == "bientot" ? "#aab4d8" : "#ffe9a8");
    porte.voile.setVisible(etat == "verrouillee" || etat == "bientot").setAlpha(etat == "verrouillee" ? 0.62 : 0.4);
    porte.cadenas.setVisible(etat == "verrouillee"); // le cadenas n'est visible que si la porte est fermée
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
    const j1 = creerPanneau(this, "j1");
    const j2 = creerPanneau(this, "j2");

    // En duo chacun a ses touches. En solo, les deux joysticks fonctionnent pour le perso actif.
    this.cantatrice = this.creerPersonnage("cantatrice", SPAWN.x, this.mode == "duo" ? [j1] : [j1, j2]);
    // En solo il n'y a qu'un seul corps (comme au niveau 1) : pas de Détective dans le lobby
    this.detective = this.mode == "duo" ? this.creerPersonnage("detective", SPAWN.x + 60, [j2]) : null;
    this.persos = this.mode == "duo" ? [this.cantatrice, this.detective] : [this.cantatrice]; // les personnages présents
    this.actif = this.cantatrice; // en solo : le personnage qu'on contrôle en ce moment

    // On marche sur le sol, sauf quand on est accroché à une échelle
    // (la 3e fonction est une CONDITION : si elle renvoie false, il n'y a pas de collision)
    this.physics.add.collider(this.persos, this.groupe_sol, null, function (perso) {
      return perso.enEchelle != true;
    });

    // En solo : une petite flèche dorée au-dessus du personnage qu'on contrôle
    this.fleche = this.add.image(0, 0, "tex_fleche").setDepth(20).setVisible(this.mode == "solo");
  }

  // Crée un personnage : son image, sa hitbox, et la liste des touches qui le contrôlent
  creerPersonnage(nom, x, touches) {
    const perso = this.physics.add.sprite(x, SPAWN.solY - 40, nom + "_idle"); // il apparaît juste au-dessus du sol
    perso.setScale(REGLAGES.taillePerso); // taille réglée dans reglages.js (1 = d'origine)
    perso.setDepth(10); // devant le décor
    perso.setCollideWorldBounds(true); // il ne sort pas de la carte
    // Hitbox plus petite que l'image de 64 x 64 : seulement le corps, pieds en bas de l'image
    perso.body.setSize(24, 54, false); // taille de la boîte de collision
    perso.body.setOffset(20, 9); // décalage de la boîte par rapport à l'image
    perso.body.setMaxVelocity(600, 800); // vitesse maximale horizontale et verticale
    perso.play(nom + "_idle"); // il commence par son animation d'attente

    perso.nom = nom;
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
    camera.setBounds(-128, 0, 1280, HAUTEUR_CARTE); // la caméra ne sort pas de cette zone
    camera.setScroll(-128, HAUTEUR_CARTE - 720); // on commence tout en bas, là où apparaissent les joueurs
    this.cible_camera = this.add.zone(LARGEUR_CARTE / 2, SPAWN.solY - 100, 10, 10); // un point invisible que la caméra suit
    camera.startFollow(this.cible_camera, true, 0.08, 0.08); // la caméra suit ce point en douceur
    camera.fadeIn(600, 0, 0, 0); // on part d'un noir qui s'éclaircit en 0,6 s
  }

  // Les textes fixes : la consigne en haut, le message en bas, et les fragments en haut à droite
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
    this.tweens.add({ targets: this.texteConsigne, alpha: 0, delay: 6000, duration: 1500 }); // la consigne disparaît après 6 s

    // Message en bas de l'écran (ex : « cette porte n'est pas encore ouverte »)
    this.texteMessage = this.add
      .text(640, 676, "", { ...style, fontSize: "14pt", fontStyle: "bold" })
      .setOrigin(0.5)
      .setScrollFactor(0) // le texte reste fixe à l'écran, la caméra ne le bouge pas
      .setDepth(100);
    this.messageJusqua = 0; // jusqu'à quand le message reste affiché (en ms)

    // En haut à droite : les fragments de partition trouvés, et le prochain objectif
    const fixe = (objet) => objet.setScrollFactor(0).setDepth(100); // petite aide : objet fixe à l'écran, au-dessus de tout
    const termines = niveauxTermines(this.registry).length; // combien de niveaux sont terminés
    fixe(this.add.image(1228, 44, "img_partition")).setDisplaySize(46, 46);
    fixe(this.add.text(1196, 44, "Fragments : " + termines + " / " + NIVEAUX.length, { ...style, fontSize: "14pt", color: "#ffe9a8" }).setOrigin(1, 0.5));
    const suivant = prochainNiveau(this.registry); // le premier niveau pas encore terminé
    let objectif = "Tous les niveaux sont terminés !";
    if (suivant !== undefined) {
      objectif = suivant.disponible == true ? "Prochain objectif : porte " + suivant.numero + " — " + suivant.nom : "Niveau " + suivant.numero + " : en construction";
    }
    fixe(this.add.text(1250, 82, objectif, { ...style, fontSize: "12pt", color: "#dfe6ff" }).setOrigin(1, 0.5));
  }

  // ==========================================================================
  //  UPDATE
  // ==========================================================================
  // update est appelée à chaque image : elle lit les touches et fait bouger le lobby
  update(temps) {
    if (this.enTransition == true) {
      return; // pendant un fondu, on ne fait plus rien
    }

    this.persos.forEach((perso) => this.gererPersonnage(perso)); // chaque personnage marche, saute, etc.
    this.verifierPortes(temps); // on regarde si quelqu'un est devant une porte
    this.mettreAJourCamera();
    if (this.mode == "solo") {
      // la petite flèche dorée suit le personnage actif, et oscille doucement de haut en bas
      this.fleche.setPosition(this.actif.x, this.actif.y - 46 + Math.sin(temps / 150) * 4);
    }
    if (temps > this.messageJusqua) {
      this.texteMessage.setText(""); // le message est fini : on l'efface
    }
  }

  // Vrai si le bouton est maintenu enfoncé (une touche de ce personnage est appuyée)
  toucheEnfoncee(perso, bouton) {
    return perso.touches.some((clavier) => clavier[bouton].isDown);
  }

  // Vrai UNE SEULE FOIS par appui (pas tant que la touche reste enfoncée)
  toucheAppuyee(perso, bouton) {
    return perso.touches.map((clavier) => Phaser.Input.Keyboard.JustDown(clavier[bouton])).includes(true);
  }

  // Marcher, sauter, animer. En solo, seul le personnage actif obéit aux touches.
  gererPersonnage(perso) {
    const controle = this.mode == "duo" || perso == this.actif; // ce personnage est-il commandé par le joueur ?
    this.gererEchelle(perso, controle); // d'abord : l'échelle peut changer son mouvement
    const aTerre = perso.body.blocked.down || perso.body.touching.down; // vrai s'il touche le sol

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
      perso.setVelocityX(direction * REGLAGES.vitesse); // la vitesse de marche, dans le sens choisi
    }
    if (direction != 0) {
      perso.setFlipX(direction < 0); // les images regardent vers la droite : on les retourne
    }
    if (controle == true && perso.enEchelle == false && aTerre && this.toucheAppuyee(perso, "A")) {
      perso.setVelocityY(REGLAGES.saut); // saut seulement depuis le sol
    }

    let anim = "idle"; // animation d'attente par défaut
    if (perso.enEchelle == true) {
      anim = perso.body.velocity.y != 0 ? "walk" : "idle"; // il "marche" en grimpant
    } else if (aTerre == false) {
      anim = "jump";
    } else if (direction != 0) {
      anim = "walk"; // au sol et en mouvement : animation de marche
    }
    const cle = perso.nom + "_" + anim; // le nom de l'animation, par exemple « cantatrice_walk »
    if (perso.anims.currentAnim == null || perso.anims.currentAnim.key != cle) {
      perso.anims.play(cle); // on ne relance l'animation que si elle a changé
    }
  }

  // Un joueur devant une porte appuie sur B : porte ouverte = on part dans le niveau, sinon un message
  verifierPortes(temps) {
    this.portes.forEach((porte) => {
      let quelquUnDevant = false; // vrai si un personnage est dans la zone de cette porte
      this.persos.forEach((perso) => {
        const controle = this.mode == "duo" || perso == this.actif;
        if (Phaser.Geom.Rectangle.Contains(porte.zone, perso.x, perso.y)) {
          quelquUnDevant = true;
          if (controle == true && this.toucheAppuyee(perso, "B")) {
            this.utiliserPorte(porte); // le joueur a appuyé sur B devant la porte
          }
        }
      });
      // la consigne apparaît (et pulse) quand quelqu'un est devant la porte
      porte.texte.setAlpha(quelquUnDevant ? 0.85 + Math.sin(temps / 200) * 0.15 : 0);
    });
  }

  // Ce qui se passe quand on utilise une porte, selon son état
  utiliserPorte(porte) {
    if (porte.etat == "verrouillee") {
      const precedent = NIVEAUX.find((n) => n.numero == porte.niveau.numero - 1); // le niveau à terminer avant
      this.afficherMessage("Porte verrouillée : termine d'abord le niveau " + precedent.numero + " (" + precedent.nom + ")", 3500);
      return; // on ne va pas plus loin : la porte reste fermée
    }
    if (porte.etat == "bientot") {
      this.afficherMessage("Le niveau " + porte.niveau.numero + " est en construction : reviens bientôt !", 3500);
      return;
    }
    this.entrerDansLaPorte(porte.niveau.scene); // la porte est ouverte : on entre dans le niveau
  }

  // Affiche un message en bas de l'écran pendant dureeMs millisecondes
  afficherMessage(texte, dureeMs) {
    this.messageJusqua = this.time.now + dureeMs; // l'heure à laquelle le message doit disparaître
    this.texteMessage.setText(texte);
  }

  // Zoom de la caméra + fondu au noir, puis le niveau
  entrerDansLaPorte(scene) {
    this.enTransition = true; // on bloque les commandes pendant la transition
    this.persos.forEach((perso) => {
      perso.setVelocityX(0);
      perso.anims.play(perso.nom + "_idle");
    });
    this.cameras.main.zoomTo(1.5, 800); // zoom sur 0,8 s
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(scene); // une fois noir, on lance le niveau choisi
    });
  }

  // Solo : on suit le personnage actif. Duo : on suit le milieu des deux (surtout en hauteur ici).
  mettreAJourCamera() {
    let y; // la hauteur visée par la caméra
    if (this.mode == "solo") {
      y = this.actif.y; // solo : on suit le personnage actif
    } else {
      y = (this.cantatrice.y + this.detective.y) / 2; // duo : on vise le milieu des deux
    }
    this.cible_camera.setPosition(LARGEUR_CARTE / 2, y); // le point invisible suivi par la caméra
  }
}
