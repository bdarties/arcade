// Niveau 1 : Les Coulisses. Lampe, passerelles fantômes, ondes, Tuba et cristaux.

// On importe ce dont le niveau a besoin : réglages, touches, progression, musique et sons
import { REGLAGES, POLICE } from "./reglages.js";
import { creerPanneau, aideBorne, aideClavier } from "./controles.js";
import { enregistrerVictoire, NIVEAUX } from "./progression.js";
import { jouerMusique, arreterMusique, jouerSonNote, jouerSonEnnemi } from "./musique.js";
import { toucheEnfoncee, toucheAppuyee, lacherEchelle, gererEchelle } from "./controles.js";

// ---- Dimensions du niveau (136 x 46 tuiles de 16 px) ----
const LARGEUR_MONDE = 2176;
const HAUTEUR_MONDE = 736;
const COULEUR_FOND = 0x090d17; // couleur de fond de la carte (réglée dans Tiled)
const OPACITE_FOND = 0.42; // opacité de l'image de fond (propriété fond_opacite de la carte)
const ECART_MAX_DUO = 1180; // en duo, les joueurs ne peuvent pas s'éloigner plus que ça (pour rester à l'écran)
// Mur de lumière : empêche d'atteindre le parchemin en sautant depuis la plateforme de droite
// (sol_14). Sans lui, on pourrait se passer des passerelles fantômes, donc du Détective.
const MUR_LUMIERE = { x: 1664, y: 100, largeur: 16, hauteur: 246 };
const MARGE_REPRISE = 96; // à la réapparition, le héros est au moins à 96 px du bord de sa plateforme (au milieu si elle est étroite)
const FIGE_REPRISE_MS = 500; // et il est figé 0,5 s pour ne pas retomber avec une touche encore enfoncée
const SEUIL_TIR_LAMPE_MS = 350; // au-delà de ce temps d'appui sur B, c'est un tir (et non un allumage de lampe)
const CADENCE_ECLAT_MS = 600; // délai minimum entre deux éclats

// Les 3 notes de la Cantatrice (même ordre que les lignes de la planche d'onde)
const NOTES = [
  { nom: "do", texte: "DO", couleur: "#ff6b7d" }, // rouge
  { nom: "mi", texte: "MI", couleur: "#62b0ff" }, // bleu
  { nom: "sol", texte: "SOL", couleur: "#ffd24a" } // doré
];

// La carte Tiled ne place pas d'ennemis : on les place ici (positions en pixels)
const TUBAS = [{ x: 1900, solY: 620, xMin: 1820, xMax: 1990 }]; // sur la grande plateforme du bas, entre les 2 échelles
// Chaque cristal a une COULEUR (= une note). Seule l'onde de la même note le détruit ;
// une autre note ne fait que l'étourdir un instant.
const CRISTAUX = [
  { x: 700, y: 250, note: 0 }, // Do (rouge)
  { x: 1000, y: 340, note: 1 }, // Mi (bleu)
  { x: 1620, y: 380, note: 2 } // Sol (doré)
];

// La classe du niveau 1 : Phaser la crée à partir de ce modèle
export default class niveau1 extends Phaser.Scene {
  // niveau2.js « hérite » de cette classe : il reprend toutes les mécaniques (héros, lampe, ondes, ennemis, vies)
  // et ne redéfinit que ce qui change (la carte, les objets à ramasser, les textes). On lui passe donc sa clé.
  constructor(cle = "niveau1") { // par défaut la clé est « niveau1 » ; niveau2 envoie « niveau2 »
    super({ key: cle });
  }

  // --------------------------------------------------------------------------
  //  Ce qui change d'un niveau à l'autre (niveau2.js redéfinit cette méthode)
  // --------------------------------------------------------------------------
  definirNiveau() {
    this.largeurMonde = LARGEUR_MONDE; // taille du monde (utilisée par la physique et la caméra)
    this.hauteurMonde = HAUTEUR_MONDE;
    this.couleurFond = COULEUR_FOND; // couleur de fond de la caméra
    this.listeTubas = TUBAS; // la liste des Tubas de ce niveau
    this.listeCristaux = CRISTAUX; // la liste des cristaux de ce niveau
    this.numeroNiveau = 1; // son numéro dans la progression (voir progression.js)
    // En SOLO, un seul corps : la Cantatrice se transforme en Détective (bouton D) pour révéler les plateformes.
    // En duo, les deux joueurs restent séparés. (Le niveau 2 remet ce drapeau à false.)
    this.formeUnique = true; // vrai = un seul corps en solo (transformation avec K)
    this.musiqueNiveau = "musique_niveau1"; // la piste jouée pendant ce niveau (chargée dans chargement.js)
    this.messageVictoire = "Niveau 1 terminé !";
    this.objectif = "OBJECTIF : récupère la partition lumineuse tout en haut,\npuis franchis la porte de sortie"; // l'objectif affiché au début
  }

  // ==========================================================================
  //  PRELOAD : la carte et ses images
  // ==========================================================================
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.tilemapTiledJSON("carte_coulisse", "./assets/coulisse.json");
    // Images de la carte. Si l'une manque, le niveau est quand même jouable :
    // il utilise alors un décor de secours (voir creerCarte).
    this.load.image("ts_plateformes", "./assets/plateformes-coulisses-grid-50.png"); // tuiles des plateformes
    this.load.image("ts_complements", "./assets/coulisses_complements.png"); // tuiles de la structure et des échelles
    this.load.image("img_lanterne", "./assets/lanterne_chinoise.png");
    this.load.image("img_fond_coulisse", "./assets/coulisse.jpg");
  }

  // ==========================================================================
  //  CREATE : on construit le niveau
  // ==========================================================================
  create() {
    // create() est rappelée à chaque (re)lancement : on remet tout à zéro
    this.definirNiveau();
    this.mode = this.registry.get("mode") || "solo"; // "solo" ou "duo" (choisi dans choix_mode)
    this.fini = false; // vrai quand le niveau est gagné ou perdu
    this.debutNiveau = this.time.now; // pour mesurer le temps mis à finir le niveau
    this.effets = []; // les effets lumineux décoratifs : on peut les supprimer si l'ordinateur est trop lent (mode économique)
    if (this.sys.game.renderer.type == Phaser.CANVAS) {
      this.registry.set("modeLeger", true); // sans WebGL le dessin est bien plus lent : on économise dès le départ
    }
    this.fragmentRecupere = false; // le parchemin n'est pas encore pris
    this.sonPartitionJoue = false; // le chœur de la partition n'a pas encore été lancé
    this.events.once("shutdown", () => this.arreterSonPartition()); // en quittant la scène, on coupe le chœur
    this.noteActuelle = 0; // 0 = Do, 1 = Mi, 2 = Sol
    this.lampe = { allumee: false, angle: 0 }; // angle de la lampe en degrés (0 = à l'horizontale)
    this.viesMax = this.mode == "duo" ? REGLAGES.vies.duo : REGLAGES.vies.solo; // 8 cœurs en duo, 5 en solo
    this.vies = this.viesMax; // les cœurs sont partagés entre les deux personnages
    this.messageJusqua = 0; // le message en bas de l'écran est vide

    // La gravité de CE niveau (les autres scènes du gabarit gardent la leur)
    this.physics.world.gravity.y = REGLAGES.gravite;
    this.physics.world.setBounds(0, 0, this.largeurMonde, this.hauteurMonde); // le monde a cette taille
    // (gauche, droite, haut, bas) : le bas du monde ne bloque pas, on peut tomber dans le vide
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBackgroundColor(this.couleurFond); // couleur de fond de l'écran

    this.creerTexturesDeSecours(); // quelques images dessinées par le code, au cas où
    this.creerCarte(); // le décor, les plateformes, les passerelles et les objets de la carte
    this.creerPersonnages(); // la Cantatrice et le Détective, la lampe
    this.creerEnnemis(); // les Tubas et les cristaux
    this.creerObjets(); // le parchemin et la porte de sortie
    this.creerCollisions(); // qui touche qui
    this.creerCamera(); // la caméra qui suit les personnages
    this.creerInterface(); // cœurs, note, fragment

    this.creerPanneauCommandes(); // le cadre fixe en bas : les commandes restent toujours visibles
    this.afficherIntroduction(); // l'objectif, au centre de l'écran, avant de commencer à jouer
    this.installerSurveillance(); // le compteur d'images par seconde et le mode économique automatique
    this.demarrerMusique(); // la musique du niveau
  }

  // --------------------------------------------------------------------------
  //  Performances : mode économique et compteur d'images par seconde
  // --------------------------------------------------------------------------
  // Vrai quand les effets lumineux doivent être réduits (ordinateur lent, ou rendu sans WebGL)
  get modeLeger() {
    return this.registry.get("modeLeger") == true;
  }

  // Une lueur décorative (image de lumière en mode additif). Renvoie null en mode économique.
  lueur(x, y, echelle, alpha, couleur, profondeur) {
    if (this.modeLeger == true) {
      return null; // mode économique : pas de lueur
    }
    const image = this.add.image(x, y, "tex_lumiere").setBlendMode(Phaser.BlendModes.ADD).setScale(echelle).setAlpha(alpha).setDepth(profondeur);
    if (couleur !== undefined) {
      image.setTint(couleur); // on colore la lueur si une couleur est donnée
    }
    this.effets.push(image); // on la garde dans la liste des effets (pour pouvoir la supprimer)
    return image;
  }

  // Surveille la vitesse du jeu : F2 affiche le compteur ; si le jeu reste lent plusieurs secondes de suite,
  // on passe en mode économique tout seul.
  installerSurveillance() {
    this.compteurFps = this.add // le texte du compteur, en bas à droite
      .text(1270, 712, "", { fontFamily: "monospace", fontSize: "12pt", color: "#9dffb0", stroke: "#000000", strokeThickness: 3 })
      .setOrigin(1, 1) // aligné en bas à droite
      .setScrollFactor(0) // fixe à l'écran
      .setDepth(200)
      .setVisible(false); // caché au départ
    this.input.keyboard.on("keydown-F2", () => this.compteurFps.setVisible(this.compteurFps.visible == false)); // F2 affiche ou cache le compteur
    this.time.addEvent({
      delay: 1000, // toutes les secondes
      loop: true, // en boucle
      callback: () => {
        const fps = this.game.loop.actualFps; // les images par seconde réellement obtenues
        const rendu = this.game.renderer.type == Phaser.CANVAS ? "Canvas" : "WebGL"; // le moteur de dessin utilisé
        this.compteurFps.setText(Math.round(fps) + " fps · " + rendu + (this.modeLeger == true ? " · éco" : "")); // on affiche le compteur
      }
    });
  }

  // La musique du niveau : celle du menu s'arrête, celle du niveau démarre et s'arrête en quittant le niveau
  demarrerMusique() {
    arreterMusique(this); // on coupe la musique du menu
    jouerMusique(this, this.musiqueNiveau, 0.45); // on lance la musique du niveau (volume 0,45)
    this.events.once("shutdown", () => arreterMusique(this)); // en quittant le niveau, on coupe la musique
  }

  // L'objectif, au CENTRE de l'écran, avant de commencer : il disparaît au premier appui (ou après 6 s)
  afficherIntroduction() {
    const fond = this.add.rectangle(0, 0, 820, 250, 0x0b1030, 0.94).setStrokeStyle(4, 0xf5d97a); // le cadre sombre et doré
    const titre = this.add
      .text(0, -78, "OBJECTIF", { fontFamily: POLICE, fontSize: "20pt", fontStyle: "bold", color: "#f5d97a", stroke: "#000000", strokeThickness: 5 }) // le titre
      .setOrigin(0.5);
    const objectif = this.add
      .text(0, -22, this.objectif.replace(/^OBJECTIF :\s*/, ""), { fontFamily: POLICE, fontSize: "17pt", fontStyle: "bold", color: "#ffffff", align: "center", stroke: "#000000", strokeThickness: 4 }) // le texte de l'objectif, sans le mot « OBJECTIF : » déjà écrit
      .setOrigin(0.5);
    const consigne = this.add
      .text(0, 82, "Appuie sur une touche pour commencer", { fontFamily: POLICE, fontSize: "12pt", color: "#cfd6f5", stroke: "#000000", strokeThickness: 3 }) // la consigne du bas
      .setOrigin(0.5);
    const cadre = this.add.container(640, 330, [fond, titre, objectif, consigne]).setScrollFactor(0).setDepth(150); // on regroupe le tout au centre
    this.introduction = cadre; // on garde le cadre pour pouvoir le fermer
    const fermer = () => { // fonction qui fait disparaître le cadre en fondu
      if (cadre.active) {
        this.tweens.add({ targets: cadre, alpha: 0, duration: 500, onComplete: () => cadre.destroy() }); // fondu de 0,5 s, puis suppression
      }
    };
    this.input.keyboard.once("keydown", fermer); // à la première touche, on ferme
    this.time.delayedCall(6000, fermer); // sinon, on ferme après 6 s
  }

  // Le cadre fixe en bas de l'écran : les commandes, toujours visibles (petit mais lisible)
  creerPanneauCommandes() {
    const texte = this.add // le texte des commandes (généré depuis controles.js)
      .text(0, 0, this.texteCommandes(), { fontFamily: POLICE, fontSize: "11pt", color: "#e8ecff", align: "center", lineSpacing: 2, stroke: "#000000", strokeThickness: 3 })
      .setOrigin(0.5, 0.5);
    const marge = 6; // un peu d'espace autour du texte
    const fond = this.add.rectangle(0, 0, texte.width + 24, texte.height + marge * 2, 0x05081a, 0.82).setStrokeStyle(2, 0xf5d97a, 0.8); // le fond sombre du cadre
    fond.setDepth(0); // le fond est derrière…
    texte.setDepth(1); // …le texte
    // Le cadre est calé au bas de l'écran (720 px) selon sa hauteur réelle, pour que rien ne dépasse
    const hauteurCadre = texte.height + marge * 2; // la hauteur totale du cadre
    this.panneauCommandes = this.add.container(640, 720 - 6 - hauteurCadre / 2, [fond, texte]).setScrollFactor(0).setDepth(120); // posé en bas, fixe à l'écran
  }

  // Un panneau d'indication posé dans le décor (lisible sur n'importe quel fond)
  ajouterIndice(x, y, texte) {
    const style = {
      fontFamily: POLICE,
      fontSize: "13pt",
      color: "#ffe9a8",
      align: "center",
      stroke: "#000000",
      strokeThickness: 4,
      backgroundColor: "#000000aa", // fond sombre semi-transparent pour bien lire sur le décor
      padding: { x: 10, y: 6 }
    };
    this.add.text(x, y, texte, style).setOrigin(0.5).setDepth(6); // le texte, centré sur (x, y)
  }

  // --------------------------------------------------------------------------
  //  Textures de secours dessinées en code (utilisées si les images de la carte manquent)
  // --------------------------------------------------------------------------
  creerTexturesDeSecours() {
    if (this.textures.exists("tex_echelle")) {
      return; // déjà créées : on ne refait rien
    }
    const pinceau = this.make.graphics({ add: false }); // un pinceau qui ne s'affiche pas (on fabrique juste des images)

    // Échelle (16 x 16, se répète vers le haut avec un tileSprite)
    pinceau.fillStyle(0xb08a4a); // couleur bois
    pinceau.fillRect(1, 0, 2, 16).fillRect(13, 0, 2, 16); // les 2 montants
    pinceau.fillRect(1, 3, 14, 2).fillRect(1, 11, 14, 2); // les barreaux
    pinceau.generateTexture("tex_echelle", 16, 16); // on en fait une image réutilisable

    // Lanterne (40 x 64)
    pinceau.clear(); // on efface avant de dessiner la lanterne
    pinceau.fillStyle(0xffd24a).fillRect(14, 0, 12, 6).fillRect(10, 10, 20, 4).fillRect(10, 50, 20, 4); // les attaches dorées
    pinceau.fillStyle(0x9a2a2a).fillRoundedRect(6, 14, 28, 36, 10); // le corps rouge
    pinceau.fillStyle(0xffe9a0).fillRoundedRect(12, 20, 16, 24, 6); // la lumière à l'intérieur
    pinceau.fillStyle(0xffd24a).fillRect(19, 54, 2, 10); // la petite frange dorée
    pinceau.generateTexture("tex_lanterne", 40, 64); // on en fait une image réutilisable
    pinceau.destroy(); // le pinceau n'est plus utile
  }

  // --------------------------------------------------------------------------
  //  La carte : fond, calques de tuiles, puis tous les objets posés dans Tiled
  // --------------------------------------------------------------------------
  creerCarte() {
    this.carte = this.add.tilemap("carte_coulisse"); // on lit la carte Tiled
    this.groupe_plateformes = this.physics.add.staticGroup(); // plateformes solides
    this.groupe_fantomes = this.physics.add.staticGroup(); // passerelles fantômes

    // Les images de tuiles sont-elles là ? (1er nom = nom du tileset dans Tiled, 2e nom = clé chargée dans preload)
    const tuilesPlateformes = this.textures.exists("ts_plateformes")
      ? this.carte.addTilesetImage("plateformes_coulisses_niveau1", "ts_plateformes")
      : null;
    const tuilesComplements = this.textures.exists("ts_complements")
      ? this.carte.addTilesetImage("coulisses_complements", "ts_complements")
      : null;
    // Chaque jeu d'images est indépendant : s'il manque, on dessine un décor de secours à la place
    this.avecTuilesPlateformes = tuilesPlateformes != null; // vrai si les images des plateformes sont là
    this.avecTuilesComplements = tuilesComplements != null; // vrai si les images de la structure sont là

    this.creerFond(); // l'image de fond
    this.creerCalquesDeTuiles(tuilesPlateformes, tuilesComplements); // les calques de tuiles, du fond vers l'avant

    // ---- Les objets de la carte ----
    const objetsDe = (calque) => this.carte.getObjectLayer(calque).objects; // la liste des objets d'un calque d'objets
    const mecaniques = objetsDe("mecaniques"); // les objets du calque « mecaniques » (échelles, départs, porte…)
    const deType = (type) => mecaniques.filter((objet) => objet.type == type); // ne garder que les objets d'un type donné

    // Plateformes solides (calque "collisions")
    objetsDe("collisions").forEach((objet) => this.ajouterPlateforme(objet)); // chaque rectangle devient une plateforme

    // Le mur de lumière (invisible pour la physique, un faisceau doré pour le joueur)
    this.creerMurDeLumiere();

    // Échelles : on garde le point où le personnage se tient en haut et en bas (= dessus des plateformes)
    this.echelles = deType("echelle").map((objet) => { // pour chaque échelle de la carte
      if (this.avecTuilesComplements == false) {
        this.add.tileSprite(objet.x + 8, objet.y + objet.height / 2, 16, objet.height, "tex_echelle").setDepth(3); // décor de secours : une échelle dessinée
      }
      return {
        centreX: objet.x + objet.width / 2, // le milieu de l'échelle en x
        haut: objet.y + 12, // le haut de l'échelle dépasse de 12 px au-dessus de la plateforme
        bas: objet.y + objet.height - 12 // le bas, 12 px au-dessus du bas de l'objet
      };
    });

    // Passerelles fantômes (les "marche_chrono")
    deType("pont_temporaire").forEach((objet) => this.ajouterFantome(objet)); // chaque passerelle devient un fantôme

    // Points de départ, ligne de chute, porte et parchemin : on mémorise leur position
    const depart = (nom) => deType("depart").find((objet) => objet.name == nom); // retrouve un point de départ par son nom
    this.departs = { j1: depart("depart_j1"), j2: depart("depart_j2") }; // où apparaît chaque personnage
    this.yChute = deType("danger")[0].y; // sous cette ligne : on tombe dans le vide
    this.rectSortie = deType("sortie")[0]; // la zone de la porte de sortie
    this.objetPartition = deType("partition")[0];

    // Lanternes décoratives
    deType("lampe").forEach((objet) => { // pour chaque lanterne posée dans Tiled
      const cle = this.textures.exists("img_lanterne") ? "img_lanterne" : "tex_lanterne"; // l'image, ou celle de secours
      this.add.image(objet.x + 20, objet.y + 32, cle).setDisplaySize(40, 64).setDepth(4); // la lanterne
      // petite lueur autour de la lanterne (un effet décoratif : supprimé en mode économique)
      this.lueur(objet.x + 20, objet.y + 32, 0.6, 0.4, undefined, 4);
    });

    // Panneaux d'indication posés dans le décor
    this.ajouterIndice(
      960,
      255,
      "Passerelles fantômes !\nDétective : éclaire-les avec la lampe (B, haut / bas pour orienter)\nElles restent en place une fois révélées"
    );
    this.ajouterIndice(330, 150, "Cristaux colorés !\nChoisis la note de la même couleur (bouton C) et tire (bouton B)");
    this.ajouterIndice(1880, 560, "Un TUBA hanté patrouille...\nÉtourdis-le avec une onde (bouton B) et passe !");
  }

  // Le fond : l'image de la carte (coulisse.jpg) si elle est là, sinon fond_niveau1.jpg.
  // Dans les deux cas l'image est ÉTIRÉE pour couvrir toute la carte, quelle que soit sa taille d'origine.
  creerFond() {
    if (this.textures.exists("img_fond_coulisse")) { // l'image du niveau est là
      this.add
        .image(0, 0, "img_fond_coulisse") // posée au coin haut gauche
        .setOrigin(0, 0)
        .setDisplaySize(LARGEUR_MONDE, HAUTEUR_MONDE) // étirée à la taille du monde
        .setAlpha(OPACITE_FOND) // un peu transparente, pour que le décor reste sombre
        .setDepth(0); // tout au fond
    } else {
      this.add.image(0, 0, "img_fond_niveau1").setOrigin(0, 0).setDisplaySize(LARGEUR_MONDE, HAUTEUR_MONDE).setDepth(0); // image de secours
    }
  }

  // Les calques de tuiles de Tiled (leurs noms doivent être ceux de Tiled), du plus loin au plus proche.
  // Chaque calque n'utilise qu'UN des deux jeux d'images : on ne crée que ceux dont l'image est présente.
  creerCalquesDeTuiles(tuilesPlateformes, tuilesComplements) {
    // Calques dessinés avec coulisses_complements.png : la structure et les échelles
    if (tuilesComplements != null) {
      this.carte.createLayer("structure", tuilesComplements).setDepth(1).setAlpha(0.65); // la structure, un peu transparente
      this.carte.createLayer("echelles", tuilesComplements).setDepth(3); // les échelles
    }
    // Calques dessinés avec plateformes-coulisses-grid-50.png : plateformes, décors, passerelles
    if (tuilesPlateformes != null) {
      this.carte.createLayer("plateformes_tuiles", tuilesPlateformes).setDepth(2); // les plateformes visibles
      this.calque_decorations = this.carte.createLayer("decorations", tuilesPlateformes).setDepth(4); // les décors, gardés pour retirer la porte d'origine
      // Les passerelles fantômes : chaque tuile aura son propre alpha (voir afficherFantome)
      this.calque_passerelles = this.carte.createLayer("passerelles_temporaires", tuilesPlateformes).setDepth(5);
      this.calque_passerelles.forEachTile((tuile) => { // pour chaque tuile de passerelle
        tuile.alpha = 0; // invisibles tant qu'elles ne sont pas éclairées
      });
    }
  }

  // Une plateforme solide = un rectangle invisible avec un corps statique (qui ne bouge pas)
  ajouterPlateforme(objet) {
    const zone = this.add.zone(objet.x + objet.width / 2, objet.y + objet.height / 2, objet.width, objet.height); // le rectangle, centré
    this.groupe_plateformes.add(zone); // ajouter au groupe statique lui donne un corps solide
    if (this.avecTuilesPlateformes == false) {
      // décor de secours : on dessine la plateforme en bois
      this.add.tileSprite(zone.x, zone.y, objet.width, objet.height, "tex_bois").setDepth(2);
    }
  }

  // Un mur qui ne laisse passer personne : on le dessine comme un faisceau de projecteur
  creerMurDeLumiere() {
    const m = MUR_LUMIERE; // les dimensions du mur
    this.groupe_murs = this.physics.add.staticGroup(); // un groupe de solides qui ne bougent pas
    this.murZone = this.add.zone(m.x + m.largeur / 2, m.y + m.hauteur / 2, m.largeur, m.hauteur); // la zone solide du mur
    this.groupe_murs.add(this.murZone); // elle devient solide
    this.murOuvert = false; // vrai quand le mur a disparu
    const faisceau = this.add // le dessin du mur : un rectangle doré et lumineux
      .rectangle(m.x + m.largeur / 2, m.y + m.hauteur / 2, m.largeur, m.hauteur, 0xffe9a0, 0.22)
      .setDepth(6)
      .setBlendMode(Phaser.BlendModes.ADD); // mode additif : il éclaircit ce qu'il recouvre
    this.murVisuel = faisceau; // on garde le dessin pour le faire disparaître
    this.tweenMur = this.tweens.add({ targets: faisceau, alpha: 0.08, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" }); // il pulse doucement
  }

  // Le mur n'est utile que tant que le Détective n'a pas révélé les passerelles : dès qu'elles sont toutes
  // révélées, il disparaît (sinon il bloquerait inutilement un joueur qui a déjà fait son travail).
  ouvrirMurDeLumiere() {
    this.murOuvert = true; // le mur est maintenant ouvert
    this.murZone.destroy(); // la zone solide disparaît tout de suite : on peut passer
    this.tweenMur.stop(); // on arrête le pulsement
    this.tweens.add({ targets: this.murVisuel, alpha: 0, duration: 600, onComplete: () => this.murVisuel.destroy() }); // le dessin s'efface, puis disparaît
    this.afficherMessage("Les passerelles sont révélées : le mur de lumière disparaît !", 3500);
  }

  // Une passerelle fantôme : solide seulement quand la lampe l'éclaire
  ajouterFantome(objet) {
    const zone = this.add.zone(objet.x + objet.width / 2, objet.y + objet.height / 2, objet.width, objet.height); // la zone, centrée
    this.groupe_fantomes.add(zone); // elle est dans le groupe des fantômes
    zone.setData("allumee", false); // éclairée ? (mis à jour à chaque image)
    zone.rect = new Phaser.Geom.Rectangle(objet.x, objet.y, objet.width, objet.height); // pour mesurer la distance à la lumière
    zone.eclaireJusqua = 0; // reste solide jusqu'à cet instant (ms)
    zone.alphaVisuel = 0; // 0 = invisible, 1 = bien visible (monte et descend en douceur)

    if (this.avecTuilesPlateformes == true) {
      // les tuiles de la passerelle dessinées dans Tiled : la surface + une rangée au-dessus et une en dessous
      zone.tuiles = []; // la liste des tuiles de cette passerelle
      for (let colonne = objet.x / 16; colonne < (objet.x + objet.width) / 16; colonne++) { // chaque colonne de tuiles
        for (let ligne = objet.y / 16 - 1; ligne <= objet.y / 16 + 1; ligne++) { // la rangée du dessus, celle-ci, et celle du dessous
          const tuile = this.calque_passerelles.getTileAt(colonne, ligne); // la tuile à cet endroit (ou rien)
          if (tuile != null) {
            zone.tuiles.push(tuile); // on la garde pour changer sa transparence
          }
        }
      }
    } else {
      zone.visuel = this.add.tileSprite(zone.x, zone.y, objet.width, objet.height, "tex_fantome").setDepth(5).setAlpha(0); // décor de secours
    }
  }

  // --------------------------------------------------------------------------
  //  Personnages : Cantatrice (J1) et Détective (J2)
  // --------------------------------------------------------------------------
  creerPersonnages() {
    const j1 = creerPanneau(this, "j1"); // touches du joueur 1
    const j2 = creerPanneau(this, "j2"); // touches du joueur 2

    // En duo chacun a ses touches. En solo, les deux joysticks fonctionnent pour le perso actif.
    const touchesCantatrice = this.mode == "duo" ? [j1] : [j1, j2]; // qui contrôle la Cantatrice
    const touchesDetective = this.mode == "duo" ? [j2] : [j1, j2]; // qui contrôle le Détective

    this.cantatrice = this.creerPersonnage("cantatrice", this.departs.j1, touchesCantatrice); // la Cantatrice, au point de départ J1
    this.detective = this.creerPersonnage("detective", this.departs.j2, touchesDetective); // le Détective, au point de départ J2
    this.persos = [this.cantatrice, this.detective];
    this.actif = this.cantatrice; // en solo : le personnage qu'on contrôle en ce moment
    if (this.formeUnique == true && this.mode == "solo") {
      this.masquerCorps(this.detective); // un seul corps à la fois : le Détective attend sa transformation
    }

    this.groupe_ondes = this.physics.add.group({ allowGravity: false });

    // Lumière de la lampe (additive = elle éclaircit ce qu'elle recouvre) : un cône + 2 taches de lumière
    this.faisceau = this.add.graphics().setDepth(15).setBlendMode(Phaser.BlendModes.ADD);
    this.halo = this.add.image(0, 0, "tex_lumiere").setBlendMode(Phaser.BlendModes.ADD).setDepth(15).setVisible(false);
    this.halo.setScale((REGLAGES.lampe.rayon * 2) / 256); // taille de la tache, d'après le rayon réglé
    if (this.modeLeger == true) {
      this.faisceau.setBlendMode(Phaser.BlendModes.NORMAL); // mode économique : pas de mélange additif
      this.halo.setBlendMode(Phaser.BlendModes.NORMAL);
    }
    this.haloProche = this.add.image(0, 0, "tex_lumiere").setBlendMode(Phaser.BlendModes.ADD).setDepth(15).setVisible(false);
    this.haloProche.setScale((REGLAGES.lampe.rayonProche * 2) / 256); // sa taille, d'après le réglage
  }

  // point = l'objet "depart" de Tiled (x, y = où les pieds se posent)
  creerPersonnage(nom, point, touches) {
    const perso = this.physics.add.sprite(point.x, point.y - 40, nom + "_idle"); // le personnage, posé au point de départ
    perso.setScale(REGLAGES.taillePerso); // taille réglée dans reglages.js (1 = d'origine)
    perso.setDepth(10);
    perso.setCollideWorldBounds(true);
    // Hitbox plus petite que l'image de 64 x 64 : seulement le corps, pieds en bas de l'image
    perso.body.setSize(24, 54, false); // taille de la boîte de collision
    perso.body.setOffset(20, 9); // décalage de la boîte
    // Vitesse de chute limitée : les plateformes ne font que 16 px d'épaisseur, il ne faut pas les traverser
    perso.body.setMaxVelocity(600, 800); // vitesse maximale horizontale et verticale
    perso.play(nom + "_idle"); // animation d'attente au départ

    perso.nom = nom; // "cantatrice" ou "detective"
    perso.touches = touches; // liste des claviers qui le contrôlent
    perso.regardeADroite = true;
    perso.enEchelle = false; // vrai quand le personnage est accroché à une échelle
    perso.invincibleJusqua = 0;
    perso.sonneJusqua = 0; // choc : pas de contrôle avant cet instant (ms)
    perso.figeJusqua = 0; // après une réapparition : pas de contrôle avant cet instant (ms), sans animation de choc
    perso.tireJusqua = 0; // animation de tir / d'allumage en cours jusqu'à cet instant (ms)
    perso.dernierTir = -9999; // dernier tir de la Cantatrice (très ancien au départ, pour pouvoir tirer tout de suite)
    perso.dernierEclat = -9999; // dernier éclat du Détective (voir tirerEclat)
    return perso;
  }

  // --------------------------------------------------------------------------
  //  Ennemis : Tubas qui patrouillent et Cristaux (positions en haut du fichier)
  // --------------------------------------------------------------------------
  creerEnnemis() {
    this.groupe_tubas = this.physics.add.group();
    this.groupe_cristaux = this.physics.add.group({ allowGravity: false }); // les cristaux flottent
    this.groupe_ondes_ennemies = this.physics.add.group({ allowGravity: false }); // ondes du Tuba

    this.listeTubas.forEach((t) => this.creerTuba(t.x, t.solY, t.xMin, t.xMax)); // on crée chaque Tuba
    this.listeCristaux.forEach((c) => this.creerCristal(c.x, c.y, c.note)); // on crée chaque cristal
  }

  // Crée un Tuba : il patrouille entre xMin et xMax, et lance une onde de temps en temps
  creerTuba(x, solY, xMin, xMax) {
    const tuba = this.groupe_tubas.create(x, solY - 40, "tuba_walk"); // le Tuba, posé au-dessus du sol
    tuba.setDepth(9);
    tuba.body.setSize(40, 50, false); // taille de sa boîte de collision
    tuba.body.setOffset(12, 14); // décalage de la boîte
    tuba.body.setMaxVelocity(300, 800); // vitesse maximale
    tuba.play("tuba_walk"); // animation de marche
    tuba.xMin = xMin; // limite gauche de sa patrouille
    tuba.xMax = xMax; // limite droite
    tuba.sens = 1; // 1 = vers la droite, -1 = vers la gauche
    tuba.etourdiJusqua = 0; // pas étourdi au départ
    tuba.attaqueJusqua = 0; // pas en train d'attaquer
    tuba.prochaineOnde = this.time.now + REGLAGES.tuba.ondeToutesMs; // sa prochaine onde dans 4 s
  }

  // Crée un cristal de la couleur d'une note : il ne se détruit qu'avec la même note
  creerCristal(x, y, note) {
    const cristal = this.groupe_cristaux.create(x, y, "cristal_idle"); // le cristal, à sa position
    cristal.setDepth(9);
    cristal.setCollideWorldBounds(true);
    cristal.body.setCircle(20, 12, 16); // hitbox ronde
    cristal.play("cristal_idle"); // animation d'attente
    cristal.pv = REGLAGES.cristal.pv; // points de vie : 1 onde de la bonne note suffit
    cristal.note = NOTES[note].nom; // la note qui le détruit ("do", "mi" ou "sol")
    cristal.couleur = parseInt(NOTES[note].couleur.replace("#", ""), 16); // teinte du cristal, convertie de texte hexadécimal en nombre
    cristal.setTint(cristal.couleur); // on le colore avec cette teinte
    cristal.etourdiJusqua = 0; // pas étourdi au départ
    cristal.mort = false; // il n'est pas détruit
  }

  // --------------------------------------------------------------------------
  //  Objets : le parchemin (fragment de partition) et la porte de sortie
  // --------------------------------------------------------------------------
  creerObjets() {
    // Le parchemin : dans Tiled c'est un objet-image, son point (x, y) est en BAS à gauche
    const p = this.objetPartition;
    this.partition = this.physics.add.image(p.x + p.width / 2, p.y - p.height / 2, "img_partition"); // on le place à son centre
    this.partition.setDisplaySize(p.width, p.height).setDepth(6); // à la taille de l'objet Tiled, devant le décor
    this.partition.body.setAllowGravity(false); // il ne tombe pas
    this.tweens.add({ // il flotte de haut en bas
      targets: this.partition,
      y: this.partition.y - 10, // monte de 10 px
      duration: 900, // en 0,9 s
      yoyo: true, // puis redescend
      repeat: -1, // sans fin
      ease: "Sine.easeInOut" // mouvement doux
    });

    // Une seule porte : on reprend celle du décor pour qu'elle puisse s'ouvrir.
    const s = this.rectSortie;
    const centreX = s.x + s.width / 2;
    const plateforme = this.groupe_plateformes.getChildren().find((sol) => centreX >= sol.body.left && centreX <= sol.body.right && sol.body.top >= s.y + s.height - 16);
    const solY = plateforme ? plateforme.body.top : s.y + s.height - 16;
    this.animationPorte = "porte_ouvre";
    if (this.avecTuilesPlateformes) {
      const texture = this.textures.get("ts_plateformes");
      if (!texture.has("porte_fermee")) {
        texture.add("porte_fermee", 0, 480, 312, 72, 76);
        texture.add("porte_ouverte", 0, 576, 392, 72, 76);
      }
      // Supprime les 5 × 6 tuiles de la porte initiale, remplacées par le sprite.
      for (let y = s.y / 16; y < s.y / 16 + 6; y++) {
        for (let x = s.x / 16; x < s.x / 16 + 5; x++) {
          this.calque_decorations.removeTileAt(x, y);
        }
      }
      this.animationPorte = "porte_coulisse_ouvre";
      if (!this.anims.exists(this.animationPorte)) {
        this.anims.create({ key: this.animationPorte, frames: [{ key: "ts_plateformes", frame: "porte_fermee" }, { key: "ts_plateformes", frame: "porte_ouverte" }], frameRate: 8, repeat: 0 });
      }
      this.porte = this.physics.add.staticSprite(centreX + 4, solY - 38, "ts_plateformes", "porte_fermee");
    } else {
      this.porte = this.physics.add.staticSprite(centreX, solY - 60, "porte_sortie", 0);
    }
    this.porte.setDepth(4);
    this.porteOuverte = false;
  }

  // --------------------------------------------------------------------------
  //  Collisions : qui touche qui
  // --------------------------------------------------------------------------
  creerCollisions() {
    // Les personnages marchent sur les plateformes, sauf quand ils sont accrochés à une échelle
    // (la 3e fonction est une CONDITION : si elle renvoie false, il n'y a pas de collision)
    this.physics.add.collider(this.persos, this.groupe_plateformes, null, (perso, plateforme) => this.peutMarcherSur(perso, plateforme));
    this.physics.add.collider(this.groupe_tubas, this.groupe_plateformes); // les Tubas marchent sur les plateformes
    this.physics.add.collider(this.persos, this.groupe_murs); // le mur de lumière bloque les personnages

    // Les passerelles fantômes ne sont solides que si elles sont éclairées
    this.physics.add.collider(this.persos, this.groupe_fantomes, null, function (perso, plateforme) {
      return plateforme.getData("allumee") == true && perso.enEchelle != true; // solide seulement si éclairée et pas sur une échelle
    });

    // Les ondes s'arrêtent sur les plateformes
    this.physics.add.collider(this.groupe_ondes, this.groupe_plateformes, function (onde) {
      onde.destroy(); // l'onde de la Cantatrice disparaît au contact d'une plateforme
    });
    this.physics.add.collider(this.groupe_ondes_ennemies, this.groupe_plateformes, function (onde) {
      onde.destroy(); // l'onde du Tuba aussi
    });

    // Onde de la Cantatrice -> ennemi touché ; contact ennemi -> personnage blessé
    [this.groupe_tubas, this.groupe_cristaux].forEach((groupe) => { // pour les Tubas et pour les cristaux
      this.physics.add.overlap(this.groupe_ondes, groupe, this.ondeTouche, null, this); // une onde qui touche l'ennemi
      this.physics.add.overlap(this.persos, groupe, this.contactEnnemi, null, this); // un personnage qui touche l'ennemi
    });
    this.physics.add.overlap(this.persos, this.groupe_ondes_ennemies, this.ondeEnnemieTouche, null, this); // une onde du Tuba touche un personnage

    this.collisionsObjets(); // le parchemin et la porte (voir plus bas)
  }

  // Le héros peut-il marcher sur cette plateforme ? Pas s'il est sur une échelle. Et une plateforme « à sens unique »
  // (propriété unSens, utilisée au niveau 2) se traverse par le DESSOUS et par les côtés : on ne se cogne plus la tête,
  // on ne s'y pose que si on tombe depuis le dessus.
  peutMarcherSur(perso, plateforme) {
    if (perso.enEchelle == true) {
      return false; // sur une échelle, on traverse la plateforme
    }
    if (plateforme.unSens == true) {
      return perso.body.velocity.y >= 0 && perso.body.bottom <= plateforme.body.top + 14; // on se pose seulement en tombant, pieds près du dessus
    }
    return true; // plateforme normale : solide de tous les côtés
  }

  // Ramasser le parchemin, franchir la porte (niveau2.js remplace le parchemin par des lampes)
  collisionsObjets() {
    this.physics.add.overlap(this.persos, this.partition, this.ramasserFragment, null, this); // toucher le parchemin le prend
    this.physics.add.overlap(this.persos, this.porte, this.franchirPorte, null, this); // toucher la porte tente de la franchir
  }

  // --------------------------------------------------------------------------
  //  Caméra : solo = suit le perso actif · duo = suit le milieu des deux joueurs
  // --------------------------------------------------------------------------
  creerCamera() {
    this.cameras.main.setBounds(0, 0, this.largeurMonde, this.hauteurMonde); // la caméra ne sort pas du monde
    // Une "cible" invisible que la caméra suit ; on la déplace à chaque image
    this.cible_camera = this.add.zone(this.cantatrice.x, this.hauteurMonde / 2, 10, 10);
    this.cameras.main.startFollow(this.cible_camera, true, 0.08, 0.08); // la caméra suit ce point en douceur
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  // --------------------------------------------------------------------------
  //  Interface (fixée à l'écran : setScrollFactor(0)) : cœurs, note, fragment
  // --------------------------------------------------------------------------
  creerInterface() {
    const fixe = (objet) => objet.setScrollFactor(0).setDepth(100); // petite aide : objet fixe à l'écran, au-dessus de tout

    // Barre de vie en haut à gauche : l'image de la barre est rouge partout, et un rectangle
    // de la couleur du fond de la barre cache la partie "vide" (il grandit quand on perd des vies)
    fixe(this.add.image(10, 8, "img_barre_vie").setOrigin(0, 0)); // l'image de la barre de vie
    this.videBarre = fixe(this.add.rectangle(10 + 231, 8 + 35, 0, 8, 0x041e48).setOrigin(1, 0)); // le rectangle qui cache la partie perdue

    // Note choisie par la Cantatrice
    this.texteNote = fixe(
      this.add.text(18, 66, "", { fontFamily: POLICE, fontSize: "15pt", fontStyle: "bold", stroke: "#000000", strokeThickness: 4 })
    );


    // Fragment de partition en haut à droite
    this.iconeFragment = fixe(this.add.image(1236, 44, "img_partition")).setDisplaySize(54, 54).setTint(0x444444); // l'icône, grise au départ
    this.texteFragment = fixe(
      this.add
        .text(1200, 44, "0 / 1", { fontFamily: POLICE, fontSize: "16pt", fontStyle: "bold", color: "#dfe6ff", stroke: "#000000", strokeThickness: 4 })
        .setOrigin(1, 0.5)
    );

    // Message temporaire au centre en bas
    this.texteMessage = fixe(
      this.add
        .text(640, 628, "", {
          fontFamily: POLICE,
          fontSize: "14pt",
          fontStyle: "bold",
          color: "#ffffff",
          align: "center",
          stroke: "#000000",
          strokeThickness: 5
        })
        .setOrigin(0.5)
    );

    // En solo : une petite flèche dorée au-dessus du personnage qu'on contrôle
    this.fleche = this.add.image(0, 0, "tex_fleche").setDepth(20).setVisible(this.mode == "solo");

    this.majCoeurs(); // on affiche le bon nombre de cœurs
    this.majNote(); // et la bonne note
  }

  // ==========================================================================
  //  UPDATE : appelée environ 60 fois par seconde
  // ==========================================================================
  update(temps, delta) {
    if (this.fini == true) {
      return; // niveau gagné ou perdu : on fige le jeu (les animations de fin jouent toutes seules)
    }

    // Solo : le bouton D change de personnage
    if (this.mode == "solo" && toucheAppuyee(this.actif, "D")) {
      this.changerDePerso(); // on change (ou on se transforme) une seule fois par appui
    }

    this.persos.forEach((perso) => { // pour chaque personnage
      if (perso.body.enable == true) {
        this.gererPersonnage(perso, temps, delta);
      }
    });
    this.mettreAJourLampe(temps, delta); // le faisceau et la tache de lumière
    this.actualiserFantomes(temps); // les passerelles s'allument ou s'éteignent

    this.groupe_tubas.getChildren().forEach((tuba) => this.mettreAJourTuba(tuba, temps)); // chaque Tuba
    this.groupe_cristaux.getChildren().forEach((cristal) => this.mettreAJourCristal(cristal, temps)); // chaque cristal
    this.nettoyerOndes(); // on supprime les ondes trop loin
    this.verifierChutes(); // on vérifie si quelqu'un est tombé dans le vide

    if (this.mode == "duo") {
      this.limiterEcartDuo(); // en duo, on ne peut pas trop s'éloigner
    }
    this.mettreAJourCamera(); // la caméra suit
    this.mettreAJourInterface(temps); // les textes et les messages
    this.verifierSonPartition(); // le chœur de la partition
  }

  // Niveau 1 : le chœur s'élève dès que la partition entre dans le cadre de la caméra.
  // Les autres niveaux conservent leur déclenchement à proximité.
  verifierSonPartition() {
    const partition = this.partition; // le parchemin
    // le son ne peut se jouer que si le parchemin est là, actif, non pris, et le fragment pas encore gagné
    const disponible = partition && partition.active && partition.body && partition.body.enable && this.partitionActive !== false && this.partitionPrise !== true && this.fragmentRecupere !== true;
    if (!disponible) {
      this.arreterSonPartition(); // pas disponible : on coupe le chœur
      return;
    }
    if (this.numeroNiveau == 1) {
      const vue = this.cameras.main.worldView; // la partie du monde affichée à l'écran
      const limites = partition.getBounds(); // le rectangle occupé par le parchemin
      // vrai si le parchemin touche la zone affichée à l'écran
      const visible = partition.visible && partition.alpha > 0 && limites.right > vue.left && limites.left < vue.right && limites.bottom > vue.top && limites.top < vue.bottom;
      if (visible && this.sonPartitionJoue !== true) {
        this.sonPartitionJoue = true; // on retient que le chœur a démarré
        this.sound.play("son_partition", { volume: 0.3 }); // le chœur, doucement
      } else if (!visible) {
        this.arreterSonPartition(); // le parchemin est sorti de l'écran : on coupe
      }
      return; // le niveau 1 s'arrête là (pas de test de distance)
    }
    // Autres niveaux : on regarde la distance du personnage le plus proche (les personnages cachés sont ignorés)
    const plusProche = Math.min(...this.persos.filter((perso) => perso.body.enable == true).map((perso) => Phaser.Math.Distance.Between(perso.x, perso.y, partition.x, partition.y)));
    if (plusProche < 200 && this.sonPartitionJoue !== true) {
      this.sonPartitionJoue = true; // on est assez proche : le chœur démarre
      this.sound.play("son_partition", { volume: this.numeroNiveau == 1 ? 0.3 : 0.6 }); // volume selon le niveau
    } else if (plusProche > 320) {
      this.arreterSonPartition(); // on s'éloigne : le chœur pourra rejouer à la prochaine approche
    }
  }

  // Coupe le chœur de la partition, s'il joue
  arreterSonPartition() {
    if (this.sonPartitionJoue == true) {
      this.sound.stopByKey("son_partition"); // on arrête tous les sons de ce nom
    }
    this.sonPartitionJoue = false; // le prochain passage pourra le relancer
  }

  // --------------------------------------------------------------------------
  //  Un personnage : échelle, déplacement, saut, pouvoir, animation
  // --------------------------------------------------------------------------
  gererPersonnage(perso, temps, delta) {
    // En duo les deux jouent. En solo, seul le personnage actif obéit aux touches.
    // Figé juste après une réapparition : sinon une touche encore enfoncée le ferait retomber dans le vide
    const fige = temps < perso.figeJusqua; // encore figé après une réapparition ?
    const controle = (this.mode == "duo" || perso == this.actif) && fige == false; // ce personnage est-il commandé ?
    const sonne = temps < perso.sonneJusqua; // vient d'être touché : pas de contrôle un court instant

    gererEchelle(this, perso, controle, sonne); // l'échelle peut modifier le mouvement
    const aTerre = perso.body.blocked.down || perso.body.touching.down; // vrai s'il touche le sol

    let direction = 0; // -1 gauche, 0 immobile, 1 droite
    if (controle && sonne == false && perso.enEchelle == false) {
      if (toucheEnfoncee(perso, "gauche")) {
        direction = -1;
      } else if (toucheEnfoncee(perso, "droite")) {
        direction = 1;
      }
    }

    // Sur une échelle, la vitesse est gérée par gererEchelle
    if (sonne == false && perso.enEchelle == false) {
      perso.setVelocityX(direction * REGLAGES.vitesse); // la vitesse de marche, dans le sens choisi
    }
    if (direction != 0) {
      perso.regardeADroite = direction > 0; // on retient le sens du regard (utile pour tirer)
      perso.setFlipX(direction < 0); // les images regardent vers la droite : on les retourne
    }

    if (controle && sonne == false) {
      // Bouton A : sauter (seulement depuis le sol)
      if (perso.enEchelle == false && toucheAppuyee(perso, "A") && aTerre) {
        perso.setVelocityY(REGLAGES.saut); // saut vers le haut
      }
      // Pouvoir propre à chaque personnage
      if (perso.nom == "cantatrice") {
        this.pouvoirCantatrice(perso, temps); // la Cantatrice chante ses ondes
      } else {
        this.pouvoirDetective(perso, temps, delta); // le Détective allume sa lampe
      }
    }

    // ---- Quelle animation jouer ? (par ordre de priorité) ----
    let anim = "idle"; // attente par défaut
    if (sonne) {
      anim = "hurt"; // blessé
    } else if (perso.enEchelle == true) {
      anim = perso.body.velocity.y != 0 ? "walk" : "idle"; // il "marche" en grimpant
    } else if (temps < perso.tireJusqua) {
      anim = "shoot"; // en train de tirer
    } else if (aTerre == false) {
      anim = "jump"; // en l'air
    } else if (direction != 0) {
      anim = "walk"; // au sol et en mouvement
    }
    this.jouerAnimation(perso, perso.nom + "_" + anim); // on joue la bonne animation
  }

  // Lance l'animation seulement si ce n'est pas déjà celle qui joue (sinon elle recommencerait sans cesse)
  jouerAnimation(sprite, cle) {
    if (sprite.anims.currentAnim == null || sprite.anims.currentAnim.key != cle) {
      sprite.anims.play(cle);
    }
  }

  // --------------------------------------------------------------------------
  //  Pouvoirs
  // --------------------------------------------------------------------------
  // La Cantatrice : C change de note, B chante une onde
  pouvoirCantatrice(perso, temps) {
    // Bouton C : changer de note (Do -> Mi -> Sol -> Do...)
    if (toucheAppuyee(perso, "C")) {
      this.noteActuelle = (this.noteActuelle + 1) % NOTES.length; // la note suivante, et on revient à Do après Sol
      this.majNote(); // on met à jour l'affichage de la note
    }
    // Bouton B : chanter une onde (tenir appuyé = une onde toutes les 500 ms)
    if (toucheEnfoncee(perso, "B") && temps - perso.dernierTir >= REGLAGES.onde.cadenceMs) {
      perso.dernierTir = temps; // on retient l'instant du tir
      perso.tireJusqua = temps + 500; // l'animation de tir dure 0,5 s
      perso.anims.play("cantatrice_shoot"); // on force le redémarrage de l'animation
      this.lancerOnde(perso); // l'onde part
    }
  }

  // Crée une onde de la note choisie, qui part devant la Cantatrice
  lancerOnde(perso) {
    const sens = perso.regardeADroite ? 1 : -1; // vers la droite (1) ou vers la gauche (-1)
    const onde = this.groupe_ondes.create(perso.x + sens * 30, perso.y - 14, "onde"); // l'onde, juste devant la bouche
    onde.setDepth(8);
    onde.setScale(1.5);
    onde.setFlipX(sens < 0); // retournée si elle va à gauche
    onde.note = NOTES[this.noteActuelle].nom; // pour savoir quel cristal elle peut détruire
    onde.play("onde_" + NOTES[this.noteActuelle].nom); // la couleur dépend de la note choisie
    onde.body.setSize(22, 18); // taille de sa boîte de collision
    onde.setVelocityX(sens * REGLAGES.onde.vitesse); // elle avance
    onde.xDepart = onde.x; // pour savoir quand elle a parcouru sa portée maximale
    jouerSonNote(this, this.noteActuelle); // la note de l'onde, doucement
  }

  // Le Détective : B (appui court = lampe, appui long = éclat), C recharge (en duo), haut / bas orientent la lampe
  pouvoirDetective(perso, temps, delta) {
    // Bouton B : un APPUI COURT allume / éteint la lampe ; un appui MAINTENU plus de 0,35 s tire un éclat de lumière.
    const bTenu = toucheEnfoncee(perso, "B"); // B est-il maintenu ?
    if (bTenu == true && perso.appuiB === undefined) {
      perso.appuiB = temps; // début de l'appui
    }
    if (bTenu == false && perso.appuiB !== undefined) {
      const duree = temps - perso.appuiB; // combien de temps B a été appuyé
      perso.appuiB = undefined; // l'appui est terminé
      if (duree < SEUIL_TIR_LAMPE_MS) {
        this.basculerLampe(perso, temps); // appui court : la lampe
      }
    }
    if (bTenu == true && perso.appuiB !== undefined && temps - perso.appuiB >= SEUIL_TIR_LAMPE_MS) {
      if (temps - perso.dernierEclat >= CADENCE_ECLAT_MS) {
        this.tirerEclat(perso, temps); // appui maintenu : l'éclat, répété tant que le bouton est tenu
      }
    }
    // Haut / bas du joystick : orienter la lampe (sauf sur une échelle, où ils servent à grimper)
    if (this.lampe.allumee == true && perso.enEchelle == false) {
      const pas = REGLAGES.lampe.vitesseVisee * (delta / 1000); // de combien tourner pendant cette image
      if (toucheEnfoncee(perso, "haut")) {
        this.lampe.angle += pas; // vers le haut
      }
      if (toucheEnfoncee(perso, "bas")) {
        this.lampe.angle -= pas; // vers le bas
      }
      this.lampe.angle = Phaser.Math.Clamp(this.lampe.angle, -REGLAGES.lampe.angleMax, REGLAGES.lampe.angleMax); // on reste dans les limites
    }
  }

  // Appui court : allume la lampe ou l'éteint
  basculerLampe(perso, temps) {
    if (this.lampe.allumee == true) {
      this.lampe.allumee = false; // elle était allumée : on l'éteint
    } else {
      this.lampe.allumee = true; // elle était éteinte : on l'allume
      this.lampe.angle = 0; // on repart avec la lampe à l'horizontale
      perso.tireJusqua = temps + 500; // petite animation d'allumage
      perso.anims.play("detective_shoot"); // le faisceau de la lampe apparaît dans l'animation
    }
  }

  // Appui maintenu : un éclat de lumière qui part devant le Détective. Il ÉTOURDIT les cristaux et les Tubas
  // (il ne les détruit pas : seules les notes détruisent les cristaux).
  tirerEclat(perso, temps) {
    perso.dernierEclat = temps; // on retient l'instant de l'éclat
    perso.tireJusqua = temps + 350; // petite animation de tir
    perso.anims.play("detective_shoot");
    const sens = perso.regardeADroite ? 1 : -1; // le sens du regard
    const eclat = this.groupe_ondes.create(perso.x + sens * 30, perso.y - 14, "onde"); // l'éclat, devant le Détective
    eclat.setDepth(8).setScale(1.2).setFlipX(sens < 0).setTint(0xfff3b0); // taille, sens, couleur jaune pâle
    eclat.note = "lumiere"; // pas une note : le cristal est seulement étourdi
    eclat.play("onde_mi"); // l'animation de l'onde (la couleur n'a pas d'importance ici)
    eclat.body.setSize(22, 18); // taille de sa boîte de collision
    eclat.setVelocityX(sens * REGLAGES.onde.vitesse); // il avance
    eclat.xDepart = eclat.x; // pour savoir quand il a parcouru sa portée
    this.sound.play("son_lampe", { volume: 0.3 }); // le son de la lampe qui tire
  }

  // Où pointe la lampe : origine (la main du Détective), direction, et centre de la tache de lumière
  calculerFaisceau() {
    const detective = this.detective; // le Détective
    const sens = detective.regardeADroite ? 1 : -1; // la lampe suit le regard du Détective
    const angle = Phaser.Math.DegToRad(this.lampe.angle); // l'angle de la lampe, en radians (positif = vers le haut)
    const dx = sens * Math.cos(angle); // la direction horizontale
    const dy = -Math.sin(angle); // la direction verticale (négatif = vers le haut à l'écran)
    const ox = detective.body.center.x + sens * 16; // le point d'origine, un peu devant le Détective
    const oy = detective.body.center.y - 6; // et un peu au-dessus de son centre
    return { ox: ox, oy: oy, dx: dx, dy: dy, cx: ox + dx * REGLAGES.lampe.portee, cy: oy + dy * REGLAGES.lampe.portee }; // cx, cy = centre de la tache
  }

  // (la lampe ne se vide pas : elle reste allumée tant qu'on ne l'éteint pas)
  mettreAJourLampe(temps, delta) {
    const lampe = this.lampe;

    this.faisceau.clear(); // on efface le faisceau dessiné à l'image précédente
    this.halo.setVisible(lampe.allumee); // la tache de lumière n'est visible que si la lampe est allumée
    this.haloProche.setVisible(lampe.allumee && this.modeLeger == false); // et le petit halo autour du Détective (pas en mode économique)
    if (lampe.allumee == false) {
      return; // éteinte : rien d'autre à dessiner
    }
    const intensite = 1; // la lumière reste pleine

    const f = this.calculerFaisceau(); // où pointe la lampe
    // le cône de lumière : un triangle de la main du Détective jusqu'à la tache de lumière
    const nx = -f.dy; // perpendiculaire à la direction, pour donner sa largeur au cône
    const ny = f.dx;
    const largeur = REGLAGES.lampe.rayon * 0.6; // la demi-largeur du cône, à l'arrivée
    this.faisceau.fillStyle(0xffe9a0, 0.2 * intensite); // couleur dorée, transparente
    this.faisceau.fillTriangle(f.ox, f.oy, f.cx + nx * largeur, f.cy + ny * largeur, f.cx - nx * largeur, f.cy - ny * largeur); // le cône
    this.halo.setPosition(f.cx, f.cy).setAlpha(intensite);
    this.haloProche.setPosition(this.detective.body.center.x, this.detective.body.center.y).setAlpha(0.7 * intensite); // le petit halo autour du Détective
  }

  // Distance entre un point et un rectangle (0 si le point est dedans)
  distanceAuRectangle(x, y, rectangle) {
    const xProche = Phaser.Math.Clamp(x, rectangle.left, rectangle.right); // le point du rectangle le plus proche, en x
    const yProche = Phaser.Math.Clamp(y, rectangle.top, rectangle.bottom); // et en y
    return Phaser.Math.Distance.Between(x, y, xProche, yProche); // la distance entre le point et ce point proche
  }

  // Une passerelle fantôme est éclairée si la tache de lumière de la lampe la touche,
  // ou si elle est tout près du Détective. Elle reste ensuite solide un petit moment.
  actualiserFantomes(temps) {
    const lampe = this.lampe;
    const centre = this.detective.body.center; // le centre du Détective
    const faisceau = lampe.allumee == true ? this.calculerFaisceau() : null; // où pointe la lampe (rien si elle est éteinte)

    this.groupe_fantomes.getChildren().forEach((passerelle) => { // pour chaque passerelle
      if (faisceau !== null) {
        const dansLaTache = this.distanceAuRectangle(faisceau.cx, faisceau.cy, passerelle.rect) <= REGLAGES.lampe.rayon; // la tache touche la passerelle ?
        const toutPres = this.distanceAuRectangle(centre.x, centre.y, passerelle.rect) <= REGLAGES.lampe.rayonProche; // le Détective est-il tout près ?
        if (dansLaTache || toutPres) {
          passerelle.dejaEclairee = true; // éclairée au moins une fois (sert à ouvrir le mur de lumière)
          passerelle.eclaireJusqua = temps + REGLAGES.lampe.persistanceMs; // elle reste allumée encore un peu
          if (REGLAGES.lampe.passerellesFixes == true) {
            passerelle.revelee = true; // révélée une fois : elle ne disparaîtra plus
          }
        }
      }
      // sinon : lampe éteinte = la passerelle disparaît tout de suite
      const eclairee = passerelle.revelee == true || (lampe.allumee == true && temps < passerelle.eclaireJusqua); // solide maintenant ?
      passerelle.setData("allumee", eclairee); // le collider lit cette valeur

      // elle apparaît / disparaît en douceur
      passerelle.alphaVisuel = Phaser.Math.Linear(passerelle.alphaVisuel, eclairee ? 1 : 0, 0.25); // on se rapproche de 1 ou de 0
      this.afficherFantome(passerelle, passerelle.alphaVisuel); // on dessine la passerelle avec cette transparence
    });

    // Toutes les passerelles ont été révélées au moins une fois : le mur de lumière (s'il y en a un) disparaît
    const passerelles = this.groupe_fantomes.getChildren(); // la liste des passerelles
    if (this.murZone !== undefined && this.murOuvert == false && passerelles.length > 0) {
      if (passerelles.every((passerelle) => passerelle.dejaEclairee == true)) { // toutes éclairées au moins une fois ?
        this.ouvrirMurDeLumiere(); // alors le mur disparaît
      }
    }
  }

  // Dessine une passerelle avec une transparence donnée (tuiles de la carte, ou image de secours)
  afficherFantome(passerelle, alpha) {
    if (passerelle.visuel !== undefined) {
      passerelle.visuel.setAlpha(alpha); // décor de secours
    } else {
      passerelle.tuiles.forEach((tuile) => {
        tuile.alpha = alpha; // tuiles de la carte
      });
    }
  }

  // --------------------------------------------------------------------------
  //  Solo : changer de personnage
  // --------------------------------------------------------------------------
  changerDePerso() {
    if (this.formeUnique == true && this.mode == "solo") {
      this.transformer(); // solo avec un seul corps : on se transforme
      return;
    }
    this.actif = this.actif == this.cantatrice ? this.detective : this.cantatrice; // sinon on passe simplement au personnage suivant
    // petit flash blanc pour montrer qui est actif maintenant
    const nouveau = this.actif; // le personnage qui vient de devenir actif
    nouveau.setTintFill(0xffffff); // il devient blanc
    this.time.delayedCall(120, () => nouveau.clearTint()); // 0,12 s plus tard, il reprend ses couleurs
  }

  // Solo, niveau 1 : la Cantatrice devient Détective (et redevient Cantatrice). Le corps garde sa place.
  transformer() {
    const ancien = this.actif; // la forme qu'on quitte
    const nouveau = ancien == this.cantatrice ? this.detective : this.cantatrice; // la forme qu'on prend
    const x = ancien.x; // on garde la position de l'ancienne forme
    const y = ancien.y;
    this.masquerCorps(ancien); // l'ancienne forme disparaît
    this.actif = nouveau; // la nouvelle devient celle qu'on contrôle
    nouveau.body.enable = true; // son corps redevient actif
    nouveau.setVisible(true); // et on le montre
    nouveau.body.reset(x, y); // on remet la position à l'endroit du corps précédent
    nouveau.setVelocity(0, 0); // par sécurité : body.reset() remet déjà la vitesse à zéro, mais on le dit explicitement
    nouveau.enEchelle = false; // il n'est pas accroché à une échelle
    nouveau.regardeADroite = ancien.regardeADroite; // il garde le même sens du regard
    nouveau.setFlipX(ancien.flipX); // et la même orientation d'image
    nouveau.anims.play(nouveau.nom + "_idle"); // animation d'attente
    if (nouveau == this.detective) {
      this.lampe.angle = 0; // la lampe repart à l'horizontale
    } else {
      this.lampe.allumee = false; // la lampe ne peut exister que sous la forme du Détective
    }
    // effet de transformation : le nouveau corps grossit en rebondissant, flash blanc
    nouveau.setTintFill(0xffffff); // flash blanc
    this.time.delayedCall(140, () => nouveau.clearTint()); // puis il reprend ses couleurs
    this.tweens.add({ targets: nouveau, scaleX: nouveau.scaleX * 1.25, scaleY: nouveau.scaleY * 1.25, duration: 120, yoyo: true }); // il grossit puis revient
    this.afficherMessage(nouveau == this.detective ? "Transformation : Détective (lampe)" : "Transformation : Cantatrice (voix)", 1800); // le message
  }

  // Cache un corps et le désactive (il ne bouge plus, ne tombe pas, ne touche rien)
  masquerCorps(perso) {
    perso.setVisible(false); // invisible
    perso.body.enable = false; // plus de physique
  }

  // --------------------------------------------------------------------------
  //  Ennemis
  // --------------------------------------------------------------------------
  // Chaque image : patrouille, attaque, ou étourdissement d'un Tuba
  mettreAJourTuba(tuba, temps) {
    if (tuba.active == false) {
      return; // un Tuba détruit ne fait plus rien
    }
    // Étourdi par une onde : il ne bouge plus et n'attaque plus
    if (temps < tuba.etourdiJusqua) {
      tuba.setVelocityX(0); // immobile
      tuba.setTint(0x8899ff); // il devient bleu
      this.jouerAnimation(tuba, "tuba_idle"); // animation d'attente
      return;
    }
    tuba.clearTint(); // il reprend sa couleur normale

    // Pendant son attaque il reste sur place
    if (temps < tuba.attaqueJusqua) {
      tuba.setVelocityX(0);
      return;
    }

    // Patrouille : il fait des allers-retours entre xMin et xMax
    if (tuba.x <= tuba.xMin) {
      tuba.sens = 1; // il repart vers la droite
    } else if (tuba.x >= tuba.xMax) {
      tuba.sens = -1; // il repart vers la gauche
    }
    tuba.setVelocityX(tuba.sens * REGLAGES.tuba.vitesse); // il avance dans son sens
    tuba.setFlipX(tuba.sens < 0); // on retourne son image selon le sens
    this.jouerAnimation(tuba, "tuba_walk"); // animation de marche

    // Toutes les 4 secondes (REGLAGES.tuba.ondeToutesMs) il lance une onde, mais seulement si un joueur est proche
    if (temps >= tuba.prochaineOnde && Math.abs(tuba.x - this.persoLePlusProche(tuba).x) < 650) {
      tuba.prochaineOnde = temps + REGLAGES.tuba.ondeToutesMs; // la prochaine dans 4 s
      tuba.attaqueJusqua = temps + 700; // il reste sur place pendant son attaque
      tuba.anims.play("tuba_attack"); // animation d'attaque
      // l'onde part au milieu de l'animation
      this.time.delayedCall(400, () => { // 0,4 s après le début de l'attaque
        if (tuba.active && this.time.now >= tuba.etourdiJusqua) { // s'il n'est pas étourdi entre-temps
          this.lancerOndeTuba(tuba); // l'onde part
          // une note de tuba, mais seulement si on voit ce Tuba à l'écran (pas de bruit pour un Tuba lointain)
          if (this.cameras.main.worldView.contains(tuba.x, tuba.y)) {
            jouerSonEnnemi(this, "son_tuba");
          }
        }
      });
    }
  }

  // Crée l'onde violette du Tuba, qui va vers le joueur
  lancerOndeTuba(tuba) {
    const sens = tuba.flipX ? -1 : 1; // le sens dans lequel le Tuba regarde
    const onde = this.groupe_ondes_ennemies.create(tuba.x + sens * 36, tuba.y - 6, "onde"); // l'onde, devant le Tuba
    onde.setDepth(8);
    onde.setScale(1.6);
    onde.setFlipX(sens < 0); // retournée si elle va à gauche
    onde.setTint(0xb066ff); // violette, pour ne pas la confondre avec celles de la Cantatrice
    onde.play("onde_mi"); // animation de l'onde
    onde.body.setSize(22, 18); // taille de sa boîte de collision
    onde.setVelocityX(sens * REGLAGES.tuba.vitesseOnde); // elle avance
    onde.xDepart = onde.x; // pour savoir quand elle a parcouru sa portée
    jouerSonEnnemi(this, "son_tuba"); // le tuba crache son onde avec son cri
  }

  // Le cristal flotte vers le joueur le plus proche, s'il est assez près
  mettreAJourCristal(cristal, temps) {
    if (cristal.mort == true) {
      return; // un cristal détruit ne bouge plus
    }
    if (temps < cristal.etourdiJusqua) {
      cristal.setVelocity(0, 0); // étourdi : immobile
      cristal.setTint(0x8899ff); // il devient bleu
      return;
    }
    cristal.setTint(cristal.couleur); // il reprend sa couleur après l'étourdissement

    const cible = this.persoLePlusProche(cristal); // le personnage le plus proche
    const distance = Phaser.Math.Distance.Between(cristal.x, cristal.y, cible.x, cible.y); // la distance qui les sépare
    if (distance < REGLAGES.cristal.detectionPx) {
      if (cristal.reveille !== true) {
        cristal.reveille = true; // il vient de se réveiller : un petit son, une seule fois par réveil
        jouerSonEnnemi(this, "son_cristal");
      }
      this.physics.moveToObject(cristal, cible, REGLAGES.cristal.vitesse); // il se dirige vers lui
    } else {
      cristal.reveille = false; // trop loin : il se rendormira, et refera son son à la prochaine approche
      cristal.setVelocity(0, 0); // trop loin : il attend
    }
  }

  // Renvoie le personnage (Cantatrice ou Détective) le plus proche de l'ennemi
  persoLePlusProche(ennemi) {
    const distCantatrice = Phaser.Math.Distance.Between(ennemi.x, ennemi.y, this.cantatrice.x, this.cantatrice.y); // distance à la Cantatrice
    const distDetective = Phaser.Math.Distance.Between(ennemi.x, ennemi.y, this.detective.x, this.detective.y); // distance au Détective
    return distCantatrice <= distDetective ? this.cantatrice : this.detective; // le plus proche des deux
  }

  // Étourdit un ennemi pendant dureeMs millisecondes
  etourdir(ennemi, dureeMs) {
    ennemi.etourdiJusqua = this.time.now + dureeMs; // jusqu'à cet instant il ne bouge plus
  }

  // Une onde de la Cantatrice touche un ennemi
  ondeTouche(onde, ennemi) {
    if (ennemi.mort == true) {
      return; // déjà détruit : l'onde passe à travers
    }
    onde.destroy(); // l'onde disparaît au contact
    if (ennemi.pv !== undefined) {
      this.blesserCristal(ennemi, onde.note); // c'est un cristal : détruit seulement si c'est la bonne note
    } else {
      this.etourdir(ennemi, REGLAGES.onde.etourdissementMs); // c'est un Tuba : il est étourdi
    }
  }

  // Une onde touche un cristal : bonne note = il perd un point de vie, mauvaise note = il est étourdi
  blesserCristal(cristal, note) {
    if (note == "lumiere") {
      this.etourdir(cristal, REGLAGES.onde.etourdissementMs); // l'éclat du Détective étourdit, sans détruire
      return;
    }
    if (note != cristal.note) {
      // mauvaise note : il est juste étourdi un court instant
      this.etourdir(cristal, REGLAGES.cristal.etourdissementMauvaiseNoteMs);
      jouerSonEnnemi(this, "son_cristal"); // le cristal grince sous la mauvaise note
      this.afficherMessage("Mauvaise note ! Ce cristal est " + cristal.note.toUpperCase() + " (P pour changer de note)", 2500); // on aide le joueur
      return;
    }
    cristal.pv -= 1; // bonne note : un point de vie en moins
    if (cristal.pv <= 0) {
      cristal.mort = true; // il est détruit
      cristal.body.enable = false; // il ne touche plus personne
      cristal.clearTint(); // il reprend sa couleur pour l'animation de destruction
      cristal.anims.play("cristal_death"); // animation de destruction
      cristal.once("animationcomplete", () => cristal.destroy()); // on le supprime à la fin de l'animation
    } else {
      this.etourdir(cristal, REGLAGES.onde.etourdissementMs); // il lui reste de la vie : il est juste étourdi
    }
  }

  // Les ondes disparaissent après leur portée maximale
  nettoyerOndes() {
    this.groupe_ondes.getChildren().slice().forEach((onde) => { // une copie de la liste, pour pouvoir supprimer en la parcourant
      if (Math.abs(onde.x - onde.xDepart) > REGLAGES.onde.portee) {
        onde.destroy(); // l'onde de la Cantatrice a trop voyagé
      }
    });
    this.groupe_ondes_ennemies.getChildren().slice().forEach((onde) => {
      if (Math.abs(onde.x - onde.xDepart) > REGLAGES.tuba.porteeOnde) {
        onde.destroy(); // l'onde du Tuba a trop voyagé
      }
    });
  }

  // --------------------------------------------------------------------------
  //  Dégâts, chute et cœurs
  // --------------------------------------------------------------------------
  // Un ennemi touche un personnage (sauf s'il est étourdi ou détruit)
  contactEnnemi(perso, ennemi) {
    if (ennemi.mort == true || this.time.now < ennemi.etourdiJusqua) {
      return; // détruit ou étourdi : pas de dégâts
    }
    this.blesser(perso, ennemi.x); // le personnage est blessé, repoussé du côté de l'ennemi
  }

  // Une onde du Tuba touche un personnage : l'onde disparaît, le personnage est blessé
  ondeEnnemieTouche(perso, onde) {
    onde.destroy();
    this.blesser(perso, onde.x);
  }

  // sourceX = d'où vient le coup (pour savoir de quel côté repousser le personnage)
  blesser(perso, sourceX) {
    const temps = this.time.now; // l'heure actuelle
    if (this.fini == true || temps < perso.invincibleJusqua) {
      return; // invincible 1,5 s après un coup
    }
    if (this.perdreUnCoeur() == false) {
      return; // plus de cœur : c'est perdu
    }
    perso.invincibleJusqua = temps + REGLAGES.vies.invincibiliteMs; // invincible pendant 1,5 s

    // Recul + animation "hurt"
    const sens = perso.x < sourceX ? -1 : 1; // on le repousse à l'opposé du coup
    lacherEchelle(perso); // s'il était sur une échelle, il la lâche
    perso.sonneJusqua = temps + REGLAGES.recul.dureeMs; // pendant le recul il ne contrôle plus rien
    perso.setVelocity(sens * REGLAGES.recul.x, REGLAGES.recul.y); // la poussée : sur le côté et un petit saut
    perso.anims.play(perso.nom + "_hurt"); // animation de blessure
    this.faireClignoter(perso); // il clignote pendant l'invincibilité
  }

  // Enlève un cœur. Renvoie false si c'était le dernier (la partie est alors perdue).
  perdreUnCoeur() {
    this.vies -= 1; // un cœur de moins
    this.majCoeurs(); // on met à jour l'affichage
    if (this.vies <= 0) {
      this.perdre(); // plus de cœur : la partie est perdue
      return false;
    }
    return true; // il reste au moins un cœur
  }

  // Le personnage clignote pendant toute la durée d'invincibilité
  faireClignoter(perso) {
    this.tweens.add({
      targets: perso,
      alpha: 0.35, // presque transparent
      duration: 100, // 0,1 s pour aller et 0,1 s pour revenir
      yoyo: true, // on revient à 1
      repeat: Math.floor(REGLAGES.vies.invincibiliteMs / 200) - 1, // le nombre de clignotements, pour durer toute l'invincibilité
      onComplete: () => perso.setAlpha(1) // à la fin, il redevient bien visible
    });
  }

  // Un personnage passe sous la ligne de chute de la carte
  verifierChutes() {
    this.persos.forEach((perso) => {
      if (perso.body.enable == false) {
        return; // corps caché
      }
      this.memoriserPositionSure(perso); // on retient où il est en sécurité
      if (this.fini == false && perso.body.bottom > this.yChute) {
        this.tomber(perso); // il est tombé dans le vide
      }
    });
  }

  // On retient le dernier endroit où le personnage s'est tenu sur une plateforme SOLIDE
  // (pas une passerelle fantôme, qui peut disparaître) : c'est là qu'il réapparaîtra s'il tombe.
  memoriserPositionSure(perso) {
    const aTerre = perso.body.blocked.down || perso.body.touching.down; // il touche le sol ?
    if (aTerre == false || perso.enEchelle == true) {
      return; // en l'air ou sur une échelle : pas une position sûre
    }
    const corps = perso.body;
    // la plateforme solide sur laquelle il se tient (son dessus est juste sous ses pieds)
    const sol = this.groupe_plateformes.getChildren().find((plateforme) => {
      const p = plateforme.body;
      return Math.abs(p.top - corps.bottom) < 3 && corps.center.x > p.left && corps.center.x < p.right;
    });
    if (sol === undefined) {
      return; // il se tient sur une passerelle fantôme : on garde l'ancienne position
    }
    // on reste LOIN du bord de la plateforme pour ne pas retomber tout de suite (au milieu si elle est étroite)
    const marge = Math.min(MARGE_REPRISE, sol.body.width / 2); // la marge, sans dépasser la moitié de la plateforme
    const x = Phaser.Math.Clamp(corps.center.x, sol.body.left + marge, sol.body.right - marge); // on le garde à l'intérieur, à distance du bord
    perso.positionSure = { x: x, y: perso.y }; // la position sûre à retenir
  }

  // Tombé dans le vide : -1 cœur, et on réapparaît à SA dernière position sûre
  // (jamais à l'emplacement de l'autre personnage, qui peut être en l'air ou près d'un danger)
  tomber(perso) {
    if (this.perdreUnCoeur() == false) {
      return; // plus de cœur : la partie est perdue (perdreUnCoeur s'en occupe)
    }
    const depart = perso == this.cantatrice ? this.departs.j1 : this.departs.j2; // le point de départ de ce personnage
    // sa dernière position sûre, ou le point de départ s'il n'en a pas encore
    const sure = perso.positionSure !== undefined ? perso.positionSure : { x: depart.x, y: depart.y - 40 };
    lacherEchelle(perso); // il lâche l'échelle s'il y était
    // body.reset : la bonne façon de téléporter un corps physique (position ET vitesse remises à zéro).
    // Avec un simple setPosition, le corps garde sa vitesse de chute : le héros s'enfonçait dans le sol et retombait.
    perso.body.reset(sure.x, sure.y); // on le replace à sa position sûre
    perso.invincibleJusqua = this.time.now + REGLAGES.vies.invincibiliteMs; // invincible un moment après la chute
    perso.figeJusqua = this.time.now + FIGE_REPRISE_MS; // il ne bouge pas pendant un court instant
    this.faireClignoter(perso); // il clignote
    this.afficherMessage("Tombé dans le vide ! (-1 cœur)", 2500); // on le dit au joueur
  }

  // Plus de cœur : on joue l'animation de mort, puis écran Game Over
  perdre() {
    this.fini = true; // le niveau est terminé (perdu)
    this.arreterSonPartition(); // le chœur s'arrête
    this.persos.forEach((perso) => {
      lacherEchelle(perso); // plus d'échelle
      perso.setVelocityX(0); // on arrête la marche
      perso.setAlpha(1); // on le rend bien visible pour l'animation de mort
      perso.anims.play(perso.nom + "_death"); // animation de mort
    });
    this.faisceau.clear(); // plus de faisceau de lampe
    this.halo.setVisible(false); // plus de tache de lumière
    this.haloProche.setVisible(false);
    this.time.delayedCall(1700, () => { // on laisse l'animation de mort se jouer 1,7 s
      this.cameras.main.fadeOut(600, 0, 0, 0); // puis fondu au noir
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("gameover"); // et l'écran Game Over
      });
    });
  }

  // --------------------------------------------------------------------------
  //  Parchemin et porte
  // --------------------------------------------------------------------------
  // Le joueur touche le parchemin : il disparaît et la porte s'ouvre
  ramasserFragment(perso, partition) {
    if (this.fragmentRecupere == true) {
      return; // déjà pris : on ne fait rien
    }
    this.fragmentRecupere = true; // le fragment est gagné
    this.arreterSonPartition(); // le chœur s'arrête
    partition.disableBody(true, true); // le parchemin disparaît
    this.porteOuverte = true;
    this.porte.anims.play(this.animationPorte); // la porte s'ouvre
    this.iconeFragment.clearTint();
    this.texteFragment.setText("1 / 1");
    this.afficherMessage("Partition récupérée ! La porte de sortie est ouverte.", 4000);
  }

  // Le joueur franchit la porte : si elle est ouverte, le niveau est gagné
  franchirPorte() {
    if (this.porteOuverte == false || this.fini == true) {
      return; // porte fermée, ou niveau déjà fini : rien à faire
    }
    this.fini = true; // le niveau est gagné
    this.persos.forEach((perso) => {
      lacherEchelle(perso); // plus d'échelle
      perso.setVelocity(0, 0); // on arrête les personnages
      this.jouerAnimation(perso, perso.nom + "_idle"); // animation d'attente
    });
    this.physics.pause(); // la physique s'arrête
    this.afficherMessage(this.messageVictoire, 2000); // « Niveau 1 terminé ! »
    this.cameras.main.fadeOut(900, 0, 0, 0); // fondu au noir
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.terminerNiveau(); // la victoire mène à l'écran « Niveau terminé »
    });
  }

  // Le niveau est gagné : on enregistre la victoire (progression.js) et on montre le bilan
  terminerNiveau() {
    const premiereFois = enregistrerVictoire(this.registry, this.numeroNiveau); // vrai si c'est la première victoire de ce niveau
    const niveau = NIVEAUX.find((n) => n.numero == this.numeroNiveau);
    this.scene.start("niveau_termine", { // on lance l'écran de bilan avec les informations
      numero: this.numeroNiveau,
      nom: niveau.nom,
      vies: this.vies, // les cœurs restants
      viesMax: this.viesMax, // le nombre de cœurs de départ
      secondes: Math.round((this.time.now - this.debutNiveau) / 1000), // le temps mis, en secondes
      premiereFois: premiereFois
    });
  }

  // --------------------------------------------------------------------------
  //  Caméra
  // --------------------------------------------------------------------------
  // Duo : un joueur ne peut pas s'éloigner de l'autre de plus de ECART_MAX_DUO pixels,
  // pour que la caméra puisse toujours cadrer les deux.
  limiterEcartDuo() {
    const c = this.cantatrice; // la Cantatrice
    const d = this.detective; // le Détective
    const ecart = c.x - d.x; // la distance entre eux (positive si la Cantatrice est à droite)
    if (Math.abs(ecart) <= ECART_MAX_DUO) {
      return; // l'écart est acceptable : rien à faire
    }
    const sens = Math.sign(ecart); // de quel côté se trouve la Cantatrice
    // celui qui s'éloigne encore est bloqué
    if (c.body.velocity.x * sens > 0) {
      c.x = d.x + sens * ECART_MAX_DUO; // on la ramène à la limite
      c.setVelocityX(0); // et on arrête sa marche
    }
    if (d.body.velocity.x * -sens > 0) {
      d.x = c.x - sens * ECART_MAX_DUO; // même chose pour le Détective
      d.setVelocityX(0);
    }
  }

  // Duo : la caméra vise le milieu des deux joueurs.
  // Solo : elle vise le personnage actif, mais tant que l'autre personnage reste à l'écran elle
  // le cadre aussi (utile pour voir la lumière du Détective pendant que la Cantatrice saute).
  // Quand ils s'éloignent, la caméra glisse doucement vers le personnage actif seul.
  mettreAJourCamera() {
    const milieu = (this.cantatrice.x + this.detective.x) / 2; // le milieu entre les deux
    let x = milieu; // par défaut, on vise le milieu
    if (this.mode == "solo") {
      const autre = this.actif == this.cantatrice ? this.detective : this.cantatrice; // l'autre personnage
      const ecart = Math.abs(this.actif.x - autre.x); // la distance entre eux
      // poids 0 = on cadre les deux ; poids 1 = on ne suit que le personnage actif
      const poids = Phaser.Math.Clamp((ecart - 700) / (ECART_MAX_DUO - 700), 0, 1); // entre 0 et 1, selon l'écart
      x = Phaser.Math.Linear(milieu, this.actif.x, poids); // un mélange entre les deux visées
    }
    // la hauteur du niveau tient presque dans l'écran : la caméra ne bouge qu'à l'horizontale
    this.cible_camera.setPosition(x, this.hauteurMonde / 2);
  }

  // --------------------------------------------------------------------------
  //  Interface
  // --------------------------------------------------------------------------
  // Met la barre de vie à jour selon le nombre de cœurs restants
  majCoeurs() {
    // la partie rouge va de x = 68 à x = 231 dans l'image (163 px) : on cache la fraction perdue
    const perdu = 1 - Math.max(this.vies, 0) / this.viesMax; // la part de vie perdue, entre 0 et 1
    this.videBarre.setSize(163 * perdu, 8); // setSize (et pas .width) pour que le dessin change vraiment
  }

  // Affiche la note choisie par la Cantatrice, dans sa couleur
  majNote() {
    const note = NOTES[this.noteActuelle]; // la note en cours
    this.texteNote.setText("Onde : " + note.texte).setColor(note.couleur); // le texte et sa couleur
  }

  // Chaque image : l'estompage des personnages non actifs, et le message
  mettreAJourInterface(temps) {
    // Solo : on met en avant les informations du personnage actif
    if (this.mode == "solo") {
      this.texteNote.setAlpha(this.actif == this.cantatrice ? 1 : 0.45); // la note est pleine si la Cantatrice est active
      this.fleche.setPosition(this.actif.x, this.actif.y - 46 + Math.sin(temps / 150) * 4); // la flèche suit le personnage actif, en oscillant
    }

    // Le message temporaire s'efface quand son temps est écoulé
    if (temps > this.messageJusqua) {
      this.texteMessage.setText("");
    }
  }

  // Affiche un message en bas de l'écran pendant dureeMs millisecondes
  afficherMessage(texte, dureeMs) {
    this.texteMessage.setText(texte); // le texte
    this.messageJusqua = this.time.now + dureeMs; // jusqu'à quand il reste affiché
  }

  // Le texte du cadre des commandes : celui du duo, ou celui du solo (avec la transformation)
  texteCommandes() {
    if (this.mode == "duo") {
      return aideBorne() + "\n" + aideClavier(); // en duo : les commandes de la borne et du clavier
    }
    if (this.formeUnique == true) {
      return aideBorne() + "\n" + aideClavier() + "\nD (K au clavier) : se transformer (Cantatrice ↔ Détective)"; // solo avec transformation
    }
    return aideBorne() + "\n" + aideClavier(); // solo sans transformation
  }
}
