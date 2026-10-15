// PIANO TIME : les notes d'un morceau descendent vers une zone dorée.
// Il faut appuyer sur la touche du couloir quand la note est dans la zone.
// 3 niveaux (repertoire.js) : chaque niveau a une partition fixe, toujours la même.
// Solo : 6 couloirs (A B C à gauche en noir, A B C à droite en rouge).
// Duo : 3 couloirs par joueur (J1 : I O P, J2 : R T Y).

import { creerTouches, vientDAppuyer, unJoueurAppuie, oublierAppuis } from "./controles.js";
import { jouerSon, jouerPiano, arreterMusique } from "./sons.js";
import { participants } from "./persos.js";
import { infosJeu } from "./jeux.js";
import { NIVEAUX } from "./repertoire.js";
import { style, styleTexte, panneauPresentation, fermerPanneau, creerMedaillon, texteFlottant, annonce, partieTerminee, compteRebours, OR } from "./interface.js";

////////////////////////////////// Réglages du mini-jeu ///////////////////////////////////////////////

const JEU = infosJeu("piano_time");  // titre, fond, règles... (dans jeux.js)

const X_PIANO_SOLO = 640;            // solo : un seul piano au centre
const X_PIANO_DUO = [330, 950];      // duo : un piano à gauche (J1), un à droite (J2)
const X_PANNEAU_SOLO = 1115;         // solo : le titre et le morceau sont à droite du piano

const LARGEUR_COULOIR = 100;         // largeur d'un couloir = d'une touche du piano
const Y_HAUT = 150;                  // les notes apparaissent en haut des couloirs
const Y_ZONE = 520;                  // centre de la zone dorée, là où il faut jouer
const HAUTEUR_ZONE = 64;             // épaisseur de la zone dorée
const COULEUR_ZONE = 0xffd23f;       // couleur de la zone (et des lumières quand on joue)
const BORD_ZONE = 0xe0a818;

const Y_CLAVIER = 580;               // hauteur du haut des touches du piano
const Y_PIEDS = 694;                 // les persos sont debout sur les touches
const ECHELLE_PERSO = 2;             // taille des persos : x2 (pixel art de ~65 px de haut)

// Les touches de la borne : 3 boutons (A B C) par joueur.
// Solo : A B C de gauche en noir, A B C de droite en rouge. Duo : I O P (J1), R T Y (J2).
const BOUTONS = ["a", "b", "c"];
const LETTRES_SOLO = [["A", "B", "C"], ["A", "B", "C"]];
const COULEURS_SOLO = ["#000000", "#e02020"];
const LETTRES_DUO = [["I", "O", "P"], ["R", "T", "Y"]]; // [J1, J2]

const IMAGE_TUILE = "img_touche_note";
const ERREURS_MAX = 5;               // 5 erreurs D'AFFILÉE : le joueur est éliminé
const DUREE_PARTIE = 90;             // la partie dure 1 min 30 au maximum
const LONGUEUR_PARTITION = 400;      // en temps : de quoi tenir toute la partie (la partition se répète)

// Vitesse du jeu : le tempo dépend du temps écoulé, pas du score.
// Chaque palier = [seconde, coefficient] : le tempo de départ du niveau est multiplié
// par ce coefficient (il monte, reste stable, puis remonte).
const PALIERS = [
  [0, 1],     // départ : le tempo de départ du niveau
  [25, 1.25], // première montée
  [45, 1.25], // palier stable
  [70, 1.55], // deuxième montée
  [90, 1.55]  // stable jusqu'à la fin
];
const PX_PAR_TEMPS = 150;            // écart vertical entre 2 temps de la partition

const FENETRE_BIEN = 46;             // jusqu'à 46 px d'écart pour le "bien"
const FENETRE_PARFAIT = 15;          // jusqu'à 15 px d'écart pour le "parfait"
const FENETRE_TROP_TOT = 110;        // appui trop tôt (c'est une erreur)

const STYLE_AUTEUR = { fontFamily: "Jersey15", fontSize: "18px", fontStyle: "normal", color: "#ffe9a8" };

// Ordre d'affichage : plus le chiffre est grand, plus l'élément est devant
const PROF = { piste: 1, zone: 2, tuile: 3, clavier: 4, lumiere: 5, perso: 6, voile: 7, hud: 50 };

// Présentation (panneau + bouton lancer) -> décompte (1, 2, 3, 4) -> jeu (1 min 30) -> fin
export default class piano_time extends Phaser.Scene {
  constructor() {
    super({ key: "piano_time" });
  }

  create() {
    arreterMusique(this);
    this.touches = creerTouches(this);
    this.etat = "presentation";
    this.solo = this.registry.get("mode") == "solo";
    this.nbCouloirs = this.solo ? 6 : 3; // solo : 6 couloirs, duo : 3 par joueur
    this.tempsEcoule = 0;                // secondes de jeu (le décompte ne compte pas)

    // le niveau choisi dans le menu (1, 2 ou 3) : son air et son tempo sont toujours les mêmes
    this.niveau = NIVEAUX[(this.registry.get("niveau") || 1) - 1];
    this.tempo = this.niveau.tempo;
    // Duo : la partition est la même pour les 2 joueurs
    this.partition = this.construirePartition();

    this.add.image(0, 0, JEU.fond).setOrigin(0);
    if (this.solo) this.creerCotesSolo();
    else this.creerCentre();

    // le chrono (temps restant), en haut à droite
    this.texteTemps = this.add.text(1240, 30, "1:30", style(34, OR, 6)).setOrigin(1, 0.5).setDepth(PROF.hud);

    // on crée un joueur par personnage choisi (1 en solo, 2 en duo)
    this.joueurs = participants(this.registry).map((perso, i) => this.creerJoueur(perso, i));

    this.presenter();
  }

  //////////////////////////////// PARTITION DU NIVEAU //////////////////////////////////

  // la partition est fixe : même notes, même touches, même ordre à chaque partie.
  // On répète l'air du niveau jusqu'à couvrir toute la partie.
  construirePartition() {
    var partition = [];
    var temps = 0;
    while (temps < LONGUEUR_PARTITION) {
      this.niveau.notes.forEach(([hauteur, duree]) => {
        // le couloir = la touche qui porte cette hauteur (en duo : 3 couloirs par joueur)
        if (hauteur != null) {
          var couloir = this.niveau.touches.indexOf(hauteur) % this.nbCouloirs;
          partition.push({ temps: temps, couloir: couloir, hauteur: hauteur });
        }
        temps += duree;
      });
    }
    return partition;
  }

  // le tempo à un moment de la partie : on cherche entre quels 2 paliers on se trouve
  // et on calcule la valeur intermédiaire (c'est ce qui rend la montée progressive)
  tempoA(secondes) {
    var coef = PALIERS[PALIERS.length - 1][1]; // après le dernier palier : on garde le tempo final
    for (var i = 1; i < PALIERS.length; i++) {
      var avant = PALIERS[i - 1];
      var apres = PALIERS[i];
      if (secondes <= apres[0]) {
        coef = avant[1] + ((apres[1] - avant[1]) * (secondes - avant[0])) / (apres[0] - avant[0]);
        break;
      }
    }
    return this.niveau.tempo * coef;
  }

  //////////////////////////////// FOND DU JEU AVEC INTERFACE ///////////////////////////

  // en solo : le titre et le morceau à droite du piano
  creerCotesSolo() {
    var x = X_PANNEAU_SOLO;
    var feuille = this.add.image(x, 250, "ui_regles");
    feuille.scaleX = 310 / feuille.width;
    feuille.scaleY = 220 / feuille.height;
    this.add.text(x, 205, JEU.titre, style(36, "#7b2830", 0)).setOrigin(0.5);
    this.add.text(x, 255, this.niveau.titre, { ...styleTexte(24, "#46282c"), wordWrap: { width: 230 } }).setOrigin(0.5);
    this.add.text(x, 285, this.niveau.auteur, { ...STYLE_AUTEUR, color: "#46282c" }).setOrigin(0.5);
  }

  // en duo : le titre et le morceau au milieu, entre les 2 pianos
  creerCentre() {
    this.add.text(640, 46, JEU.titre, style(40, OR, 8)).setOrigin(0.5).setDepth(PROF.hud);
    this.add.text(640, 96, "♪ " + this.niveau.titre, styleTexte(20)).setOrigin(0.5).setDepth(PROF.hud);
    this.add.text(640, 122, this.niveau.auteur, STYLE_AUTEUR).setOrigin(0.5).setDepth(PROF.hud);
  }

  // position X du centre d'un couloir (c = 0 pour le couloir le plus à gauche)
  xCouloir(j, c) {
    return j.gauche + (c + 0.5) * LARGEUR_COULOIR;
  }

  // la piste = une feuille de papier à musique avec ses couloirs et la zone dorée
  dessinerPiste(j) {
    var gauche = j.gauche;
    var largeur = j.largeur;

    // "graphics" = un objet sur lequel on dessine des formes (rectangles, lignes...)
    var g = this.add.graphics().setDepth(PROF.piste);

    // ombre (fond noir transparent) puis feuille de papier beige
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(gauche - 4, Y_HAUT - 22, largeur + 28, Y_CLAVIER - Y_HAUT + 40, 14);
    g.fillStyle(0xfbf5e6, 0.94);
    g.fillRoundedRect(gauche - 10, Y_HAUT - 30, largeur + 20, Y_CLAVIER - Y_HAUT + 40, 14);

    // une ligne verticale entre 2 couloirs
    g.lineStyle(2, 0xd8ccb4);
    for (var k = 1; k < j.couloirs.length; k++) {
      g.lineBetween(gauche + k * LARGEUR_COULOIR, Y_HAUT - 20, gauche + k * LARGEUR_COULOIR, Y_CLAVIER);
    }

    // la zone dorée : c'est là qu'il faut jouer les notes
    g.fillStyle(COULEUR_ZONE, 0.35);
    g.fillRect(gauche, Y_ZONE - HAUTEUR_ZONE / 2, largeur, HAUTEUR_ZONE);
    g.lineStyle(3, BORD_ZONE);
    g.strokeRect(gauche, Y_ZONE - HAUTEUR_ZONE / 2, largeur, HAUTEUR_ZONE);

    // pour chaque couloir : la touche écrite dans la zone + une lumière (elle s'allume à l'appui)
    j.lumieres = j.couloirs.map((couloir, c) => {
      var x = this.xCouloir(j, c);
      this.add.text(x, Y_ZONE, couloir.lettre, style(30, couloir.couleur, 6)).setOrigin(0.5).setDepth(PROF.zone);
      return this.add.rectangle(x, Y_ZONE, LARGEUR_COULOIR - 6, HAUTEUR_ZONE - 6, COULEUR_ZONE).setAlpha(0).setDepth(PROF.zone);
    });

    // texte en haut de la piste (tempo)
    j.texteTempo = this.add
      .text(j.x, Y_HAUT - 12, "", styleTexte(16, "#ee009f"))
      .setOrigin(0.5)
      .setDepth(PROF.zone);
  }

  // le piano géant sur lequel le perso se déplace
  dessinerClavier(j) {
    // l'image du piano a 3 touches : 1 image en duo, 2 côte à côte en solo (6 couloirs)
    var nbPianos = j.couloirs.length / 3;
    for (var p = 0; p < nbPianos; p++) {
      var xPiano = j.gauche + (p * 3 + 1.5) * LARGEUR_COULOIR;
      this.add.image(xPiano, Y_CLAVIER - 6, "img_piano").setOrigin(0.5, 0).setDepth(PROF.clavier);
    }

    // une lumière par touche : l'image d'une touche, invisible, qui s'allume quand on appuie
    j.lumieresClavier = j.couloirs.map((couloir, c) =>
      this.add
        .image(this.xCouloir(j, c), Y_CLAVIER + 62, "img_touche_piano")
        .setAlpha(0)
        .setDepth(PROF.lumiere)
    );
  }

  /////////////////////////////// CRÉATION DES JOUEURS //////////////////////////////////

  // les couloirs d'un joueur : chacun a une lettre affichée et la touche à presser
  // solo : les 6 couloirs (J1 puis J2) ; duo : les 3 couloirs du joueur
  couloirsDuJoueur(i) {
    var joueurs = this.solo ? [0, 1] : [i];
    var couloirs = [];
    joueurs.forEach((p) => {
      BOUTONS.forEach((bouton, k) => {
        var lettre = this.solo ? LETTRES_SOLO[p][k] : LETTRES_DUO[p][k];
        var couleur = this.solo ? COULEURS_SOLO[p] : "#ffffff";
        couloirs.push({ lettre: lettre, couleur: couleur, touches: this.touches[p][bouton] });
      });
    });
    return couloirs;
  }

  creerJoueur(perso, i) {
    var x = this.solo ? X_PIANO_SOLO : X_PIANO_DUO[i];
    var largeur = this.nbCouloirs * LARGEUR_COULOIR;
    var j = {
      perso: perso,
      i: i,
      x: x,
      gauche: x - largeur / 2,                  // bord gauche du piano
      largeur: largeur,
      couloirs: this.couloirsDuJoueur(i),      // les touches de ce joueur
      pan: this.solo ? 0 : i == 0 ? -0.6 : 0.6, // son : J1 à gauche, J2 à droite, solo au centre
      temps: -(Y_ZONE - Y_HAUT) / PX_PAR_TEMPS,   // la première note part du haut après le décompte
      prochaine: 0,                             // numéro de la prochaine note à faire apparaître
      tuiles: [],                               // les tuiles actuellement visibles sur sa piste
      score: 0,
      combo: 0,                                 // notes réussies d'affilée
      meilleurCombo: 0,
      notesJouees: 0,
      erreurs: 0,                               // erreurs d'affilée (retombe à 0 dès qu'on réussit une note)
      totalErreurs: 0,                          // toutes les erreurs de la partie (pour les stats)
      elimine: false
    };

    this.dessinerPiste(j);
    this.dessinerClavier(j);

    // le perso est debout au milieu du piano (image 0 de sa marche)
    var milieu = Math.floor((this.nbCouloirs - 1) / 2);
    j.sprite = this.add
      .sprite(this.xCouloir(j, milieu), Y_PIEDS, perso.marche, 0)
      .setOrigin(0.5, 1)
      .setScale(ECHELLE_PERSO)
      .setDepth(PROF.perso)
      .setFlipX(i == 1); // le joueur 2 regarde vers la gauche
    this.creerHUD(j);
    return j;
  }

  // le score à côté de la tête du perso, les erreurs d'affilée, le multiplicateur et le combo
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

  // multiplicateur de score : x1 au départ, +1 tous les 10 combos, maximum x4
  multiplicateur(j) {
    return Math.min(4, 1 + Math.floor(j.combo / 10));
  }

  // met à jour le score, les erreurs d'affilée, le multiplicateur et le combo
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
    // les touches affichées : "A B C (gauche) A B C (droite)" en solo, "J1 : I O P   J2 : R T Y" en duo
    var touches = this.solo
      ? "A B C à gauche (noir) et A B C à droite (rouge)"
      : "J1 : " + LETTRES_DUO[0].join(" ") + "      J2 : " + LETTRES_DUO[1].join(" ");

    this.panneau = panneauPresentation(this, JEU.titre, [
      "Appuie sur la touche du couloir dans la zone dorée.",
      "Touches : " + touches,
      "Une erreur casse ton combo. " + ERREURS_MAX + " d'affilée : terminé !",
      "Niveau " + (this.registry.get("niveau") || 1) + " : " + this.niveau.titre + " (" + this.niveau.auteur + ")"
    ]);
  }

  // le chef d'orchestre compte les 4 temps avant de commencer
  decompte() {
    this.etat = "decompte";
    compteRebours(this, () => {
      this.etat = "jeu";
      oublierAppuis(this.touches); // ignore les appuis faits pendant le décompte
      annonce(this, "Jouez !", "#ffffff", 500, 300);
    });
  }

  update(time, delta) {
    if (this.etat == "presentation") {
      // pendant la présentation, on attend que quelqu'un appuie sur A pour lancer
      if (unJoueurAppuie(this.touches, "a")) {
        this.etat = "lancement"; // évite de relancer plusieurs fois
        jouerSon(this, "valider");
        fermerPanneau(this, this.panneau, () => this.decompte());
      }
      return;
    }

    // la partition reste immobile jusqu'à la fin des quatre temps
    if (this.etat != "jeu") return;

    var dt = Math.min(delta, 50) / 1000;
    this.tempo = this.tempoA(this.tempsEcoule); // le tempo dépend du temps écoulé
    this.joueurs.forEach((j) => this.avancer(j, dt));

    // le chrono ne tourne que pendant la partie : à 0, c'est la fin
    if (this.etat == "jeu") {
      this.tempsEcoule += dt;
      var reste = Math.max(0, Math.ceil(DUREE_PARTIE - this.tempsEcoule));
      this.texteTemps.setText(Math.floor(reste / 60) + ":" + String(reste % 60).padStart(2, "0"));
      if (this.tempsEcoule >= DUREE_PARTIE) this.fin();
    }
  }

  avancer(j, dt) {
    if (j.elimine) return;
    // on avance dans la partition au tempo du jeu
    // (tempo en battements par minute, donc / 60 pour avoir des battements par seconde)
    j.temps += (dt * this.tempo) / 60;
    this.majTempo(j);

    // les notes qui entrent dans la piste apparaissent en haut
    var tempsVisibles = (Y_ZONE - Y_HAUT) / PX_PAR_TEMPS;
    while (this.partition[j.prochaine].temps - j.temps <= tempsVisibles) {
      this.creerTuile(j, this.partition[j.prochaine]);
      j.prochaine++;
    }

    // place chaque tuile : plus sa note approche dans le temps, plus elle est proche de la zone
    j.tuiles.slice().forEach((t) => {
      if (j.elimine) return; // éliminé par la tuile précédente
      t.y = Y_ZONE - (t.note.temps - j.temps) * PX_PAR_TEMPS;
      t.setVisible(t.y >= Y_HAUT);
      if (t.y - Y_ZONE > FENETRE_BIEN) this.rater(j, t); // elle a dépassé la zone
    });

    // les touches ne comptent que pendant la partie (pas pendant le décompte)
    if (this.etat == "jeu" && !j.elimine) this.lireTouches(j);
  }

  // une tuile = une note qui descend dans son couloir
  creerTuile(j, note) {
    var tuile = this.add
      .image(this.xCouloir(j, note.couloir), Y_HAUT, IMAGE_TUILE)
      .setDisplaySize(90, 60)
      .setDepth(PROF.tuile);
    tuile.note = note;
    j.tuiles.push(tuile);
  }

  // supprime une tuile : on la retire de la liste du joueur et on la détruit à l'écran
  supprimerTuile(j, tuile) {
    j.tuiles = j.tuiles.filter((t) => t != tuile);
    tuile.destroy();
  }

  // supprime toutes les tuiles d'un joueur
  viderTuiles(j) {
    j.tuiles.forEach((t) => t.destroy());
    j.tuiles = [];
  }

  // regarde si le joueur vient d'appuyer sur la touche d'un de ses couloirs
  lireTouches(j) {
    j.couloirs.forEach((couloir, c) => {
      if (vientDAppuyer(couloir.touches)) this.appuyer(j, c);
    });
  }

  // le joueur appuie sur la touche du couloir c
  appuyer(j, c) {
    j.sprite.x = this.xCouloir(j, c); // téléportation sur la touche jouée
    this.eclairer(j, c);

    // la tuile de ce couloir la plus proche de la zone
    var cible = null;
    j.tuiles.forEach((t) => {
      if (t.note.couloir != c) return;
      if (cible == null || Math.abs(t.y - Y_ZONE) < Math.abs(cible.y - Y_ZONE)) cible = t;
    });

    // distance entre cette tuile et le centre de la zone
    var ecart = cible ? Math.abs(cible.y - Y_ZONE) : Infinity;

    if (ecart <= FENETRE_BIEN) {
      this.reussir(j, cible, ecart <= FENETRE_PARFAIT); // dans la zone : réussi (parfait si très précis)
    } else if (cible && cible.y < Y_ZONE && ecart <= FENETRE_TROP_TOT) {
      this.tropTot(j, c); // tuile au-dessus de la zone et pas trop loin : appui trop tôt
    } else {
      this.fausseNote(j, c); // aucune tuile proche : fausse note
    }
  }

  // allume brièvement la lumière de la zone et de la touche du piano
  eclairer(j, c) {
    j.lumieres[c].setFillStyle(COULEUR_ZONE); // la zone est un rectangle : on le colore
    j.lumieresClavier[c].setTint(COULEUR_ZONE); // la touche du piano est une image : on la teinte
    [j.lumieres[c], j.lumieresClavier[c]].forEach((lumiere) => {
      lumiere.setAlpha(0.8); // on l'allume d'un coup
      this.tweens.add({ targets: lumiere, alpha: 0, duration: 250 }); // puis elle s'éteint en 250 ms
    });
  }

  reussir(j, tuile, parfait) {
    var x = tuile.x; // on garde la position avant de détruire la tuile
    jouerPiano(this, tuile.note.hauteur, { pan: j.pan }); // on joue la note de la mélodie
    this.supprimerTuile(j, tuile);

    j.combo++;
    j.meilleurCombo = Math.max(j.meilleurCombo, j.combo);
    j.notesJouees++;
    j.erreurs = 0; // une note réussie remet le compteur d'erreurs d'affilée à 0
    j.score += (parfait ? 100 : 50) * this.multiplicateur(j);

    texteFlottant(this, x, Y_ZONE - 48, parfait ? "PARFAIT" : "BIEN", parfait ? OR : "#ffffff", 22);

    // à 10, 20 et 30 combos : on annonce le nouveau multiplicateur
    if (j.combo % 10 == 0 && j.combo <= 30) {
      texteFlottant(this, j.x, 330, "COMBO x" + this.multiplicateur(j) + " !", OR, 36);
      jouerSon(this, "combo", j.pan);
    }

    this.majHUD(j);
    this.verifierFin(); // en duo, le gagnant est peut-être déjà connu
  }

  // les 3 sortes d'erreurs : appui trop tôt, fausse note, note qui passe sans être jouée
  tropTot(j, c) {
    texteFlottant(this, this.xCouloir(j, c), Y_ZONE - 48, "Trop tôt !", "#ffa23a", 20);
    this.erreur(j, "trop_tot");
  }

  fausseNote(j, c) {
    texteFlottant(this, this.xCouloir(j, c), Y_ZONE - 48, "Fausse note !", "#ff4d5e", 20);
    this.erreur(j);
  }

  // la tuile a dépassé la zone sans être jouée
  rater(j, tuile) {
    texteFlottant(this, tuile.x, Y_ZONE - 48, "Raté !", "#ff4d5e", 22);
    this.supprimerTuile(j, tuile);
    this.erreur(j);
  }

  // une erreur coupe le combo et s'ajoute aux erreurs d'affilée : à 5, le joueur est éliminé
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

    // voile sombre sur son piano
    this.add
      .rectangle(j.x, (Y_HAUT - 30 + 720) / 2, j.largeur + 24, 720 - Y_HAUT + 30, 0x0b0618, 0.55)
      .setDepth(PROF.voile);

    jouerSon(this, "elimine", j.pan);
    this.verifierFin();
  }

  // la partie s'arrête quand tous les joueurs sont éliminés (ou quand le gagnant est connu en duo)
  verifierFin() {
    if (this.etat == "jeu" && partieTerminee(this.joueurs)) this.fin();
  }

  fin() {
    if (this.etat == "fin") return;
    this.etat = "fin";
    this.joueurs.forEach((j) => this.viderTuiles(j));
    annonce(this, "FIN DU RÉCITAL !", OR, 1700, 300);
    jouerSon(this, "final");

    // après 2,3 s : fondu au noir (0,3 s), puis on lance la scène des résultats avec les stats
    this.time.delayedCall(2300, () => {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () =>
        this.scene.start("resultats", {
          scores: this.joueurs.map((j) => j.score), // une valeur par joueur
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
