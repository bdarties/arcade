import { creerTouches, vientDAppuyer, unJoueurAppuie, oublierAppuis } from "./controles.js";
import { jouerSon, jouerpiano_time, lancerMusique, volumeMusique } from "./sons.js";
import { participants } from "./persos.js";
import { infosJeu } from "./jeux.js";
import { choisirMorceau } from "./repertoire.js";
import { style, styleTexte, panneauPresentation, fermerPanneau, creerMedaillon, texteFlottant, annonce, partieTerminee, OR } from "./interface.js";

////////////////////////////////// Réglages du mini-jeu ///////////////////////////////////////////////

const JEU = infosJeu("piano_time"); // Infos du mini-jeu récupérées dans jeux.js

const X_PIANO_SOLO = [640];          // Mode SOLO : un piano au centre
const X_PIANO_DUO  = [330, 950];     // Mode DUO : un piano de chaque côté

const LARGEUR_COULOIR = 100;         // 3 couloirs par piano
const Y_HAUT          = 150;         // Les notes apparaissent en haut de chaque couloir
const HAUTEUR_ZONE    = 64;          // Épaisseur d'une zone de sélection

const Y_CLAVIER = 580;               // Hauteur du haut des touches du piano
const Y_PIEDS   = 694;               // Les persos sont sur les touches

const ECHELLE_PERSO = 2;             // Taille des persos : x2 (pixel art de ~65 px de haut)
const DUREE_PAS     = 120;           // Temps pour marcher d'une touche à la suivante (ms)

// Les 2 zones de sélection, collées l'une à l'autre : chaque note tombe vers la zone de son type
//   type 0 = note noire   -> zone du BAS (dorée)    -> J1 : K L M    J2 : F G H
//   type 1 = note blanche -> zone du HAUT (blanche) -> J1 : I O P    J2 : R T Y  (elle rapporte 2 fois plus)
// "boutons" = les touches définies dans controles.js, "lettres" = ce qu'on écrit sur la zone [J1, J2]
const Y_ZONE = 520; // Centre de la zone du bas (la zone blanche est collée juste au-dessus)
const ZONES = [
  { y: Y_ZONE,                 couleur: 0xffd23f, bord: 0xe0a818, alpha: 0.35, boutons: ["d", "e", "f"], lettres: [["K", "L", "M"], ["F", "G", "H"]], points: 1 },
  { y: Y_ZONE - HAUTEUR_ZONE,  couleur: 0xffffff, bord: 0x8a7f6a, alpha: 0.9,  boutons: ["a", "b", "c"], lettres: [["I", "O", "P"], ["R", "T", "Y"]], points: 2 }
];

// Images des tuiles : la tuile blanche n'a pas encore d'image.
// Pour en ajouter une : mets touche_blanche.png dans assets/images et ajoute dans chargement.js
//   this.load.image("img_touche_blanche", "./assets/images/touche_blanche.png");
const IMAGES_TUILES = ["img_touche_note", "img_touche_blanche"]; // [noire, blanche]

const PROBA_BLANCHE = 0.3;           // Chance qu'une note soit blanche (les 12 premières sont noires)
const ERREURS_MAX   = 5;             // 5 erreurs D'AFFILÉE : le joueur est éliminé
const DUREE_PARTIE  = 90;            // La partie dure 1 min 30 au maximum

// Vitesse du jeu : le tempo dépend du temps écoulé, pas du score
// Chaque palier = [seconde, tempo] : le tempo monte, reste stable, puis remonte
const PALIERS = [
  [0, 100],   // Départ : déjà dynamique, mais pas trop lent
  [25, 125],  // Première montée
  [45, 125],  // Palier stable (on respire)
  [70, 155],  // Deuxième montée
  [90, 155]   // Stable jusqu'à la fin
];
const TEMPO_DEPART = PALIERS[0][1];  // Tempo du décompte
const PX_PAR_TEMPS = 150;            // Écart vertical entre 2 temps de la partition

const FENETRE_BIEN     = 46;         // Jusqu'à 46 px d'écart pour le "bien"
const FENETRE_PARFAIT  = 15;         // Jusqu'à 15 px d'écart pour le "parfait"
const FENETRE_TROP_TOT = 110;        // Appui trop tôt (c'est une erreur)

const STYLE_AUTEUR = { fontFamily: "Georgia, serif", fontSize: "18px", fontStyle: "italic", color: "#ffe9a8" };

// Ordre d'affichage : plus le chiffre est grand, plus l'élément est devant
const PROF = { piste: 1, zone: 2, tuile: 3, clavier: 4, lumiere: 5, perso: 6, voile: 7, hud: 50 };

// Présentation (panneau + bouton lancer) -> décompte (1, 2, 3, 4) -> jeu (1 min 30) -> fin
export default class piano_time extends Phaser.Scene {
  constructor() {
    super({ key: "piano_time" });
  }

  create() {
    this.touches = creerTouches(this);
    this.etat = "presentation";
    this.solo = this.registry.get("mode") == "solo";
    this.tempsEcoule = 0;                 // Secondes de jeu (le décompte ne compte pas)
    this.tempo = TEMPO_DEPART;

    // Duo : la partition est la même pour les 2 joueurs
    this.morceau = choisirMorceau();
    this.partition = [];
    this.fabrique = { phrase: 0, note: 0, temps: 2, couloir: 1, hauteur: null, demiTemps: false };
    this.allongerPartition(64); // Génération des 64 premières notes

    this.add.image(0, 0, JEU.fond).setOrigin(0);
    if (this.solo) this.creerCotesSolo();
    else this.creerCentre();

    // Le chrono (temps restant), en haut à droite
    this.texteTemps = this.add.text(1240, 30, "1:30", style(34, OR, 6)).setOrigin(1, 0.5).setDepth(PROF.hud);

    // On crée un joueur par personnage choisi (1 en solo, 2 en duo)
    this.joueurs = participants(this.registry).map((perso, i) => this.creerJoueur(perso, i));

    lancerMusique(this);
    this.presenter();
  }

  //////////////////////////////// PARTITION INFINIE //////////////////////////////////

  // On ajoute des notes à la fin de la partition, au fur et à mesure.
  allongerPartition(nombre) {
    var f = this.fabrique;
    for (var k = 0; k < nombre; k++) {
      var phrase = this.morceau.phrases[f.phrase]; // La phrase musicale en cours
      var hauteur = phrase[f.note];                // La note à placer

      // Après un demi-temps, la note suivante est forcément dans un autre couloir
      var ecart = f.hauteur == null ? 0 : hauteur - f.hauteur;
      var couloir = this.choisirCouloir(f.couloir, ecart);
      if (f.demiTemps && couloir == f.couloir) couloir = (couloir + Phaser.Math.Between(1, 2)) % 3;

      // Type de la note : 0 = noire, 1 = blanche (jamais de blanche au début)
      var type = this.partition.length > 12 && Math.random() < PROBA_BLANCHE ? 1 : 0;
      this.partition.push({ temps: f.temps, couloir: couloir, hauteur: hauteur, type: type });

      // On mémorise cette note pour calculer la suivante
      f.couloir = couloir;
      f.hauteur = hauteur;

      // La note suivante arrive 1 temps plus tard, ou parfois (15 % de chances) un demi-temps
      f.demiTemps = this.partition.length > 12 && Math.random() < 0.15;
      f.temps += f.demiTemps ? 0.5 : 1;

      // On passe à la note suivante de la phrase
      f.note++;
      if (f.note >= phrase.length) {
        // Fin de la phrase : on passe à la suivante (et on revient à la première après la dernière)
        f.note = 0;
        f.phrase = (f.phrase + 1) % this.morceau.phrases.length;
        f.temps += 1; // 1 temps de pause entre 2 phrases
      }
    }
  }

  // Le couloir suit le dessin de la mélodie : plus aigu = à droite, plus grave = à gauche
  choisirCouloir(dernier, ecart) {
    var c;
    if (ecart > 0) c = dernier + (ecart >= 5 ? 2 : 1);       // plus aigu : droite
    else if (ecart < 0) c = dernier - (ecart <= -5 ? 2 : 1); // plus grave : gauche
    else c = Phaser.Math.Between(0, 2);                      // même hauteur : couloir au hasard

    // Si on sort du piano, on repart de l'autre côté
    if (c > 2) c = Phaser.Math.Between(0, 1);
    if (c < 0) c = Phaser.Math.Between(1, 2);
    return c;
  }

  // Le tempo à un moment de la partie : on cherche entre quels 2 paliers on se trouve
  // et on calcule la valeur intermédiaire (c'est ce qui rend la montée progressive)
  tempoA(secondes) {
    for (var i = 1; i < PALIERS.length; i++) {
      var avant = PALIERS[i - 1];
      var apres = PALIERS[i];
      if (secondes <= apres[0]) {
        return avant[1] + ((apres[1] - avant[1]) * (secondes - avant[0])) / (apres[0] - avant[0]);
      }
    }
    return PALIERS[PALIERS.length - 1][1]; // Après le dernier palier : on garde le tempo final
  }

  //////////////////////////////// FOND DU JEU AVEC INTERFACE ///////////////////////////

  // En solo : le titre et le morceau à gauche du piano
  creerCotesSolo() {
    this.add.rectangle(235, 250, 330, 220, 0x1b1030, 0.8).setStrokeStyle(2, 0xe0a818);
    this.add.text(235, 180, JEU.titre, style(40, OR, 8)).setOrigin(0.5);
    this.add.text(235, 240, "♪ " + this.morceau.titre, styleTexte(20)).setOrigin(0.5);
    this.add.text(235, 268, this.morceau.auteur, STYLE_AUTEUR).setOrigin(0.5);
  }

  // En duo : le titre et le morceau au milieu, entre les 2 pianos
  creerCentre() {
    this.add.text(640, 46, JEU.titre, style(40, OR, 8)).setOrigin(0.5).setDepth(PROF.hud);
    this.add.text(640, 96, "♪ " + this.morceau.titre, styleTexte(20)).setOrigin(0.5).setDepth(PROF.hud);
    this.add.text(640, 122, this.morceau.auteur, STYLE_AUTEUR).setOrigin(0.5).setDepth(PROF.hud);
  }

  // Position X du centre d'un couloir : c vaut 0 (gauche), 1 (milieu) ou 2 (droite)
  xCouloir(j, c) {
    return j.x + (c - 1) * LARGEUR_COULOIR;
  }

  // La piste = une feuille de papier à musique avec 3 couloirs et les 2 zones de sélection
  dessinerPiste(j) {
    var gauche = j.x - 1.5 * LARGEUR_COULOIR; // Bord gauche de la piste
    var largeur = 3 * LARGEUR_COULOIR;

    // "graphics" = un objet sur lequel on dessine des formes (rectangles, lignes...)
    var g = this.add.graphics().setDepth(PROF.piste);

    // Ombre (fond noir transparent) puis feuille de papier beige
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(gauche - 4, Y_HAUT - 22, largeur + 28, Y_CLAVIER - Y_HAUT + 40, 14);
    g.fillStyle(0xfbf5e6, 0.94);
    g.fillRoundedRect(gauche - 10, Y_HAUT - 30, largeur + 20, Y_CLAVIER - Y_HAUT + 40, 14);

    // 2 lignes verticales qui séparent les 3 couloirs
    g.lineStyle(2, 0xd8ccb4);
    for (var k = 1; k < 3; k++) {
      g.lineBetween(gauche + k * LARGEUR_COULOIR, Y_HAUT - 20, gauche + k * LARGEUR_COULOIR, Y_CLAVIER);
    }

    // Les 2 zones de sélection : c'est là qu'il faut jouer les notes
    j.lumieres = [];
    ZONES.forEach((zone, type) => {
      g.fillStyle(zone.couleur, zone.alpha);
      g.fillRect(gauche, zone.y - HAUTEUR_ZONE / 2, largeur, HAUTEUR_ZONE);
      g.lineStyle(3, zone.bord);
      g.strokeRect(gauche, zone.y - HAUTEUR_ZONE / 2, largeur, HAUTEUR_ZONE);

      // Pour chaque couloir : la touche du joueur + une lumière (elle s'allume quand on appuie)
      j.lumieres[type] = [0, 1, 2].map((c) => {
        var x = this.xCouloir(j, c);
        this.add.text(x, zone.y, zone.lettres[j.i][c], style(30, "#ffffff", 6)).setOrigin(0.5).setAlpha(0.6).setDepth(PROF.zone);
        return this.add.rectangle(x, zone.y, LARGEUR_COULOIR - 6, HAUTEUR_ZONE - 6, zone.couleur).setAlpha(0).setDepth(PROF.zone);
      });
    });

    // Texte en haut de la piste (tempo)
    j.texteTempo = this.add
      .text(j.x, Y_HAUT - 12, "", { ...styleTexte(16, "#ee009f"), fontStyle: "bold italic" })
      .setOrigin(0.5)
      .setDepth(PROF.zone);
  }

  // Le piano géant sur lequel le perso se déplace
  dessinerClavier(j) {
    var gauche = j.x - 1.5 * LARGEUR_COULOIR;
    var g = this.add.graphics().setDepth(PROF.clavier);

    // Boîtier sombre du piano
    g.fillStyle(0x1b1030);
    g.fillRoundedRect(gauche - 10, Y_CLAVIER - 6, 3 * LARGEUR_COULOIR + 20, 150, 10);

    // 3 touches blanches (avec une bande grise en bas pour l'effet de relief)
    for (var c = 0; c < 3; c++) {
      var x = gauche + c * LARGEUR_COULOIR + 3;
      g.fillStyle(0xfdfaf2);
      g.fillRoundedRect(x, Y_CLAVIER, LARGEUR_COULOIR - 6, 124, { tl: 0, tr: 0, bl: 10, br: 10 });
      g.fillStyle(0xd9d0c0);
      g.fillRect(x, Y_CLAVIER + 108, LARGEUR_COULOIR - 6, 16);
    }

    // 2 touches noires, entre les touches blanches
    g.fillStyle(0x16101f);
    for (var k = 1; k < 3; k++) {
      g.fillRoundedRect(gauche + k * LARGEUR_COULOIR - 18, Y_CLAVIER, 36, 62, { tl: 0, tr: 0, bl: 6, br: 6 });
    }

    // Une lumière par touche (invisible, elle s'allume quand on appuie)
    j.lumieresClavier = [0, 1, 2].map((c) =>
      this.add
        .rectangle(this.xCouloir(j, c), Y_CLAVIER + 62, LARGEUR_COULOIR - 6, 124, ZONES[0].couleur)
        .setAlpha(0)
        .setDepth(PROF.lumiere)
    );
  }

  /////////////////////////////// CRÉATION DES JOUEURS //////////////////////////////////

  creerJoueur(perso, i) {
    var j = {
      perso: perso,
      i: i,
      x: this.solo ? X_PIANO_SOLO[i] : X_PIANO_DUO[i],
      touches: this.touches[i],                 // Les touches de ce joueur
      pan: this.solo ? 0 : i == 0 ? -0.6 : 0.6, // Son : J1 à gauche, J2 à droite, solo au centre
      temps: -4,                                // Position dans la partition, en battements (négatif = décompte)
      prochaine: 0,                             // Numéro de la prochaine note à faire apparaître
      tuiles: [],                               // Les tuiles actuellement visibles sur sa piste
      score: 0,
      combo: 0,                                 // Nombre de notes réussies d'affilée
      meilleurCombo: 0,
      notesJouees: 0,
      erreurs: 0,                               // Erreurs d'affilée (retombe à 0 dès qu'on réussit une note)
      totalErreurs: 0,                          // Toutes les erreurs de la partie (pour les stats)
      elimine: false
    };

    this.dessinerPiste(j);
    this.dessinerClavier(j);

    // Le perso est debout sur la touche du milieu (image 0 de sa marche)
    j.sprite = this.add
      .sprite(this.xCouloir(j, 1), Y_PIEDS, perso.marche, 0)
      .setOrigin(0.5, 1)
      .setScale(ECHELLE_PERSO)
      .setDepth(PROF.perso)
      .setFlipX(i == 1); // Le joueur 2 regarde vers la gauche
    this.creerHUD(j);
    return j;
  }

  // Le score à côté de la tête du perso, les erreurs d'affilée, le multiplicateur et le combo
  creerHUD(j) {
    var xTete = j.x - 110;
    creerMedaillon(this, xTete, 56, j.perso, j.perso.etiquette);
    j.texteScore = this.add.text(xTete + 50, 40, "0", style(34, j.perso.couleur)).setOrigin(0, 0.5).setDepth(PROF.hud);
    j.texteErreurs = this.add.text(xTete + 50, 84, "", styleTexte(17, "#ffd23f")).setOrigin(0, 0.5).setDepth(PROF.hud);
    j.texteMulti = this.add.text(j.x + 150, 42, "", style(30, OR)).setOrigin(1, 0.5).setDepth(PROF.hud);
    j.texteCombo = this.add.text(j.x + 150, 80, "", styleTexte(17, "#ffffff")).setOrigin(1, 0.5).setDepth(PROF.hud);
    this.majHUD(j);
    this.majTempo(j);
  }

  // Multiplicateur de score : x1 au départ, +1 tous les 10 combos, maximum x4
  multiplicateur(j) {
    return Math.min(4, 1 + Math.floor(j.combo / 10));
  }

  // Met à jour le score, les erreurs d'affilée, le multiplicateur et le combo
  majHUD(j) {
    j.texteScore.setText(j.score);
    j.texteErreurs.setText(j.erreurs > 0 ? "Erreurs : " + j.erreurs + " / " + ERREURS_MAX : "");
    var multi = this.multiplicateur(j);
    j.texteMulti.setText(multi > 1 ? "x" + multi : "");
    j.texteCombo.setText(j.combo > 1 ? j.combo + " combos" : "");
  }

  majTempo(j) {
    j.texteTempo.setText("♩ = " + Math.round(this.tempo));
  }

  /////////////////////////////// PANNEAU EXPLICATIF //////////////////////////////////////

  presenter() {
    // Les touches de chaque zone : "K L M" en solo, "K L M  /  F G H" en duo
    var touches = (zone) => zone.lettres.slice(0, this.joueurs.length).map((l) => l.join(" ")).join("   /   ");

    this.panneau = panneauPresentation(this, JEU.titre, [
      "Les notes descendent vers les 2 zones de ton piano.",
      "Zone du haut (notes blanches, points x2) : " + touches(ZONES[1]),
      "Zone du bas (notes noires) : " + touches(ZONES[0]),
      "Une erreur fait perdre ton combo. " + ERREURS_MAX + " erreurs d'affilée : c'est fini !",
      "La musique accélère pendant 1 min 30 : tiens bon !",
      "Au programme : " + this.morceau.titre + " (" + this.morceau.auteur + ")"
    ]);
  }

  // Le chef d'orchestre compte les 4 temps avant de commencer
  decompte() {
    this.etat = "decompte";
    volumeMusique(this, 0); // La musique est faite par les joueurs
    var dureeTemps = 60000 / TEMPO_DEPART; // Durée d'un temps en ms

    for (var k = 0; k < 4; k++) {
      let numero = k;
      this.time.delayedCall(numero * dureeTemps, () => {
        annonce(this, String(numero + 1), OR, dureeTemps * 0.5, 300);
        jouerSon(this, numero == 3 ? "top" : "tic");
      });
    }

    // La partie commence après les 4 temps
    this.time.delayedCall(4 * dureeTemps, () => {
      this.etat = "jeu";
      oublierAppuis(this.touches); // Ignore les appuis faits pendant le décompte
      annonce(this, "Jouez !", "#ffffff", 500, 300);
    });
  }

  update(time, delta) {
    if (this.etat == "presentation") {
      // Pendant la présentation, on attend que quelqu'un appuie sur A pour lancer
      if (unJoueurAppuie(this.touches, "a")) {
        this.etat = "lancement"; // Évite de relancer plusieurs fois
        jouerSon(this, "valider");
        fermerPanneau(this, this.panneau, () => this.decompte());
      }
      return;
    }

    // On ne fait avancer le jeu que pendant le décompte et la partie
    if (this.etat != "decompte" && this.etat != "jeu") return;

    var dt = Math.min(delta, 50) / 1000;
    this.tempo = this.tempoA(this.tempsEcoule); // Le tempo dépend du temps écoulé
    this.joueurs.forEach((j) => this.avancer(j, dt));

    // Le chrono ne tourne que pendant la partie : à 0, c'est la fin
    if (this.etat == "jeu") {
      this.tempsEcoule += dt;
      var reste = Math.max(0, Math.ceil(DUREE_PARTIE - this.tempsEcoule));
      this.texteTemps.setText(Math.floor(reste / 60) + ":" + String(reste % 60).padStart(2, "0"));
      if (this.tempsEcoule >= DUREE_PARTIE) this.fin();
    }
  }

  avancer(j, dt) {
    if (j.elimine) return;
    // On avance dans la partition au tempo du jeu
    // (tempo en battements par minute, donc / 60 pour avoir des battements par seconde)
    j.temps += (dt * this.tempo) / 60;
    this.majTempo(j);

    // Les notes qui entrent dans la piste apparaissent en haut
    // (on prend la zone du bas, la plus éloignée : les notes blanches restent cachées jusqu'à leur arrivée)
    var tempsVisibles = (ZONES[0].y - Y_HAUT) / PX_PAR_TEMPS;
    while (this.partition[j.prochaine].temps - j.temps <= tempsVisibles) {
      this.creerTuile(j, this.partition[j.prochaine]);
      j.prochaine++;

      // Il reste moins de 16 notes d'avance : on en génère 32 de plus
      if (j.prochaine > this.partition.length - 16) this.allongerPartition(32);
    }

    // Place chaque tuile : plus sa note approche dans le temps, plus elle est proche de SA zone
    j.tuiles.slice().forEach((t) => {
      if (j.elimine) return; // Éliminé par la tuile précédente
      var zone = ZONES[t.note.type];
      t.y = zone.y - (t.note.temps - j.temps) * PX_PAR_TEMPS;
      t.setVisible(t.y >= Y_HAUT);
      if (t.y - zone.y > FENETRE_BIEN) this.rater(j, t); // Elle a dépassé sa zone
    });

    // Les touches ne comptent que pendant la partie (pas pendant le décompte)
    if (this.etat == "jeu" && !j.elimine) this.lireTouches(j);
  }

  // Chaque type de note a son image (même taille). Si l'image n'est pas chargée (cas de la
  // tuile blanche pour le moment), on crée un rectangle sans couleur : il ne s'affiche pas
  creerTuile(j, note) {
    var x = this.xCouloir(j, note.couloir);
    var cle = IMAGES_TUILES[note.type];
    var tuile;
    if (this.textures.exists(cle)) tuile = this.add.image(x, Y_HAUT, cle).setDisplaySize(90, 60);
    else tuile = this.add.rectangle(x, Y_HAUT, 90, 60);
    tuile.setDepth(PROF.tuile);
    tuile.note = note;
    j.tuiles.push(tuile);
  }

  // Supprime une tuile : on la retire de la liste du joueur et on la détruit à l'écran
  supprimerTuile(j, tuile) {
    j.tuiles = j.tuiles.filter((t) => t != tuile); // filter = on garde toutes les tuiles sauf celle-ci
    tuile.destroy();
  }

  // Supprime toutes les tuiles d'un joueur
  viderTuiles(j) {
    j.tuiles.forEach((t) => t.destroy());
    j.tuiles = [];
  }

  // Regarde si le joueur vient d'appuyer sur une de ses 6 touches (3 par zone)
  lireTouches(j) {
    ZONES.forEach((zone, type) => {
      zone.boutons.forEach((bouton, c) => {
        if (vientDAppuyer(j.touches[bouton])) this.appuyer(j, c, type);
      });
    });
  }

  // Le perso marche jusqu'au couloir c, puis s'arrête
  marcherVers(j, c) {
    var xCible = this.xCouloir(j, c);
    if (j.marche) j.marche.stop(); // S'il marchait déjà, on part de là où il est
    if (xCible == j.sprite.x) {
      j.sprite.stop();
      j.sprite.setFrame(0);
      return;
    }

    var distance = Math.abs(xCible - j.sprite.x);
    j.sprite.setFlipX(xCible < j.sprite.x);  // Il regarde dans le sens où il marche
    j.sprite.play(j.perso.animMarche, true); // true = on ne relance pas l'anim si elle tourne déjà
    j.marche = this.tweens.add({
      targets: j.sprite,
      x: xCible,
      duration: DUREE_PAS * (distance / LARGEUR_COULOIR),
      onComplete: () => {
        j.sprite.stop();
        j.sprite.setFrame(0); // Il s'arrête, debout
      }
    });
  }

  // Le joueur appuie sur la touche du couloir c, pour la zone "type" (0 = bas / noire, 1 = haut / blanche)
  appuyer(j, c, type) {
    var zone = ZONES[type];
    this.marcherVers(j, c); // Le perso marche jusqu'à la touche jouée
    this.eclairer(j, c, type);

    // La tuile de ce couloir ET de ce type la plus proche de sa zone
    var cible = null;
    j.tuiles.forEach((t) => {
      if (t.note.couloir != c || t.note.type != type) return; // Pas le bon couloir ou pas la bonne couleur
      if (cible == null || Math.abs(t.y - zone.y) < Math.abs(cible.y - zone.y)) cible = t;
    });

    // Distance entre cette tuile et le centre de la zone
    var ecart = cible ? Math.abs(cible.y - zone.y) : Infinity;

    if (ecart <= FENETRE_BIEN) {
      this.reussir(j, cible, ecart <= FENETRE_PARFAIT); // Dans la zone : réussi (parfait si très précis)
    } else if (cible && cible.y < zone.y && ecart <= FENETRE_TROP_TOT) {
      this.tropTot(j, c, zone); // Tuile au-dessus de la zone et pas trop loin : appui trop tôt
    } else {
      this.fausseNote(j, c, zone); // Aucune tuile proche : fausse note
    }
  }

  // Allume brièvement la lumière de la zone et de la touche du piano (de la couleur de la zone)
  eclairer(j, c, type) {
    var zone = ZONES[type];
    [j.lumieres[type][c], j.lumieresClavier[c]].forEach((lumiere) => {
      lumiere.setFillStyle(zone.couleur);
      lumiere.setAlpha(0.8); // On l'allume d'un coup
      this.tweens.add({ targets: lumiere, alpha: 0, duration: 250 }); // Puis elle s'éteint en 250 ms
    });
  }

  reussir(j, tuile, parfait) {
    var zone = ZONES[tuile.note.type];
    var x = tuile.x; // On garde la position avant de détruire la tuile
    jouerpiano_time(this, tuile.note.hauteur, { pan: j.pan }); // On joue la note de la mélodie
    this.supprimerTuile(j, tuile);

    j.combo++;
    j.meilleurCombo = Math.max(j.meilleurCombo, j.combo); // Math.max = garde le plus grand des deux
    j.notesJouees++;
    j.erreurs = 0; // Une note réussie remet le compteur d'erreurs d'affilée à 0
    j.score += (parfait ? 100 : 50) * zone.points * this.multiplicateur(j);

    texteFlottant(this, x, zone.y - 48, parfait ? "PARFAIT" : "BIEN", parfait ? OR : "#ffffff", 22);

    // À 10, 20 et 30 combos : on annonce le nouveau multiplicateur
    if (j.combo % 10 == 0 && j.combo <= 30) {
      texteFlottant(this, j.x, 330, "COMBO x" + this.multiplicateur(j) + " !", OR, 36);
      jouerSon(this, "combo", j.pan);
    }

    this.majHUD(j);
    this.verifierFin(); // En duo, le gagnant est peut-être déjà connu
  }

  // Les 3 sortes d'erreurs : appui trop tôt, fausse note, note qui passe sans être jouée
  tropTot(j, c, zone) {
    texteFlottant(this, this.xCouloir(j, c), zone.y - 48, "Trop tôt !", "#ffa23a", 20);
    this.erreur(j, "trop_tot");
  }

  fausseNote(j, c, zone) {
    texteFlottant(this, this.xCouloir(j, c), zone.y - 48, "Fausse note !", "#ff4d5e", 20);
    this.erreur(j);
  }

  // La tuile a dépassé sa zone sans être jouée
  rater(j, tuile) {
    texteFlottant(this, tuile.x, ZONES[tuile.note.type].y - 48, "Raté !", "#ff4d5e", 22);
    this.supprimerTuile(j, tuile);
    this.erreur(j);
  }

  // Une erreur coupe le combo et s'ajoute aux erreurs d'affilée : à 5, le joueur est éliminé
  erreur(j, son) {
    if (j.elimine) return;
    j.combo = 0;
    j.erreurs++;
    j.totalErreurs++;
    jouerSon(this, son || "couac", j.pan);
    this.majHUD(j);
    if (j.erreurs >= ERREURS_MAX) this.eliminer(j);
  }

  /////////////////////////////////////// FIN DE LA PARTIE //////////////////////////////////////

  eliminer(j) {
    j.elimine = true;
    this.viderTuiles(j);

    // Voile sombre sur son piano
    this.add
      .rectangle(j.x, (Y_HAUT - 30 + 720) / 2, 3 * LARGEUR_COULOIR + 24, 720 - Y_HAUT + 30, 0x0b0618, 0.55)
      .setDepth(PROF.voile);

    jouerSon(this, "elimine", j.pan);
    this.verifierFin();
  }

  // La partie s'arrête quand tous les joueurs sont éliminés (ou quand le gagnant est connu en duo)
  verifierFin() {
    if (this.etat == "jeu" && partieTerminee(this.joueurs)) this.fin();
  }

  fin() {
    this.etat = "fin";
    this.joueurs.forEach((j) => this.viderTuiles(j));
    annonce(this, "FIN DU RÉCITAL !", OR, 1700, 300);
    jouerSon(this, "bravo");

    // Après 2,3 s : fondu au noir (0,3 s), puis on lance la scène des résultats avec les stats
    this.time.delayedCall(2300, () => {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () =>
        this.scene.start("resultats", {
          scores: this.joueurs.map((j) => j.score), // .map = on construit une liste avec une valeur par joueur
          stats: [
            { titre: "Meilleur combo", valeurs: this.joueurs.map((j) => j.meilleurCombo) },
            { titre: "Notes jouées", valeurs: this.joueurs.map((j) => j.notesJouees) },
            { titre: "Erreurs", valeurs: this.joueurs.map((j) => j.totalErreurs) }
          ]
        })
      );
    });
  }
}