import { creerTouches, unJoueurAppuie } from "./controles.js";
import { jouerSon, arreterMusique } from "./sons.js";
import { participants } from "./persos.js";
import { infosJeu } from "./jeux.js";
import {
  style,
  styleTexte,
  fondAssombri,
  aideBas,
  creerMedaillon,
  OR
} from "./interface.js";

// Écran des résultats et meilleurs scores, commun aux trois mini-jeux.
// On reçoit { scores: [score J1, score J2], stats: [{ titre, valeurs }] }
//  - en solo : le score et les stats ;
//  - en duo : le gagnant et les scores des 2 joueurs.
export default class resultats extends Phaser.Scene {
  constructor() {
    super({ key: "resultats" });
  }

  init(donnees) {
    this.scores = donnees.scores;
    this.stats = donnees.stats;
  }

  create() {
    arreterMusique(this);
    this.touches = creerTouches(this);
    this.jeu = infosJeu(this.registry.get("jeu"));
    this.mode = this.registry.get("mode");
    this.niveau = this.jeu.niveaux ? (this.registry.get("niveau") || 1) : 0;
    this.choixFait = false;
    this.sauvegardeEnCours = true;
    var joueurs = participants(this.registry);

    fondAssombri(this, this.jeu.fond, 0.6);
    this.add.text(640, 112, this.jeu.titre, styleTexte(22, "#ffe9a8")).setOrigin(0.5);
    this.aide = aideBas(this, [["a", "Rejouer"], ["b", "Menu"]]);
    if (joueurs.length == 1) this.creerSolo(joueurs[0]);
    else this.creerDuo(joueurs);
    this.tableauClassement = null;
    this.classement = joueurs.map((joueur, i) => ({ jeu: this.jeu.cle, mode: this.mode, niveau: this.niveau, nom: joueur.nom, joueur: i + 1, score: this.scores[i] }));
    this.classement.sort((a, b) => this.jeu.croissant ? a.score - b.score : b.score - a.score);
    this.afficherClassement();
    this.texteSauvegarde = this.add.text(950, 545, "Enregistrement du score...", styleTexte(18, "#46282c")).setOrigin(0.5).setDepth(1);
    this.enregistrerScores();

    this.cameras.main.fadeIn(300);
  }

  // le perso en grand (les Foxy de Music Fall sont animés)
  afficherPerso(j, x) {
    // si le perso a une planche pour l'écran de fin (j.fin), on l'utilise à la place de son image
    var texture = j.fin ? j.fin.texture : j.texture;
    var echelle = j.fin ? j.fin.echelle : j.echelle;
    var sprite = this.add.sprite(x, 610, texture).setOrigin(0.5, 1).setScale(echelle * 0.45).setFlipX(x > 350);
    if (j.fin) sprite.play(j.fin.anim);
    else if (j.anim) sprite.play(j.anim);
    return sprite;
  }

  score(i) {
    return this.scores[i] + " " + this.jeu.unite;
  }

  // Notice : lire la liste, ajouter la partie, trier, puis réécrire.
  async enregistrerScores() {
    try {
      var liste = await window.lireDonneesJSON();
      if (liste === null) liste = [];
      if (!Array.isArray(liste)) throw new Error("La sauvegarde doit contenir une liste.");
      var memeCategorie = (s) => s && s.jeu == this.jeu.cle && s.mode == this.mode && s.niveau == this.niveau;
      var classement = liste.filter(memeCategorie);
      classement = classement.concat(this.classement);
      classement = classement.filter((s) => Number.isFinite(s.score) && typeof s.nom == "string");
      classement.sort((a, b) => this.jeu.croissant ? a.score - b.score : b.score - a.score);
      this.classement = classement.slice(0, 5);
      await window.ecrireDonneesJSON(liste.filter((s) => !memeCategorie(s)).concat(this.classement));
      this.afficherClassement();
      this.texteSauvegarde.setText("Scores enregistrés");
    } catch (erreur) {
      this.texteSauvegarde.setText("Sauvegarde indisponible");
    }
    this.sauvegardeEnCours = false;
  }

  afficherClassement() {
    if (this.tableauClassement) this.tableauClassement.destroy();
    this.tableauClassement = this.add.container(0, 0);
    this.tableauClassement.add(this.add.image(950, 385, "ui_regles").setDisplaySize(510, 490));
    this.tableauClassement.add(this.add.text(950, 235, "MEILLEURS SCORES", style(32, "#7b2830", 0)).setOrigin(0.5));
    var titre = this.mode.toUpperCase();
    if (this.niveau) titre += " · NIVEAU " + this.niveau;
    this.tableauClassement.add(this.add.text(950, 275, titre, styleTexte(22, "#46282c")).setOrigin(0.5));
    this.tableauClassement.add(this.add.text(750, 320, "RANG", styleTexte(22, "#7b2830")).setOrigin(0.5));
    this.tableauClassement.add(this.add.text(810, 320, "PERSONNAGE", styleTexte(22, "#7b2830")).setOrigin(0, 0.5));
    this.tableauClassement.add(this.add.text(1160, 320, "SCORE", styleTexte(22, "#7b2830")).setOrigin(1, 0.5));
    this.classement.forEach((s, i) => {
      var y = 355 + i * 38;
      var nom = s.nom + (this.mode == "duo" ? " (J" + s.joueur + ")" : "");
      this.tableauClassement.add(this.add.text(750, y, i + 1, styleTexte(24, "#7b2830")).setOrigin(0.5));
      this.tableauClassement.add(this.add.text(810, y, nom, styleTexte(22, "#46282c")).setOrigin(0, 0.5));
      this.tableauClassement.add(this.add.text(1160, y, s.score + " " + this.jeu.unite, styleTexte(24, "#7b2830")).setOrigin(1, 0.5));
    });
  }

  // //////////////////////////////////SOLO TOP SCOREE ///////////////////////////////////////////////////////
  
  creerSolo(j) {
    this.add.text(640, 60, "Fin de la partie", style(52, OR, 10)).setOrigin(0.5);

    // le score et les stats de la partie
    this.add.image(350, 385, "ui_regles").setDisplaySize(570, 490);
    creerMedaillon(this, 350, 210, j, j.etiquette);
    this.add.text(350, 272, j.nom, style(28, "#46282c", 0)).setOrigin(0.5);
    this.add.text(350, 318, this.score(0), style(46, "#7b2830", 0)).setOrigin(0.5);
    this.stats.forEach((stat, k) => {
      var y = 380 + k * 34;
      this.add.text(120, y, stat.titre, styleTexte(22, "#46282c")).setOrigin(0, 0.5);
      this.add.text(580, y, String(stat.valeurs[0]), styleTexte(24, "#7b2830")).setOrigin(1, 0.5);
    });
    this.afficherPerso(j, 350);
  }

  // ---------------------------------------------------------------------------
  // DUO : qui a gagné ? (le plus grand score... ou le plus petit à Music Fall)
  // ---------------------------------------------------------------------------
  creerDuo(joueurs) {
    var gagnant = -1;
    var ecart = this.scores[0] - this.scores[1];
    if (this.jeu.croissant) ecart = -ecart;
    if (ecart > 0) gagnant = 0;
    if (ecart < 0) gagnant = 1;
    var message = gagnant == -1 ? "Égalité parfaite !" : joueurs[gagnant].nom + " gagne !";
    this.add.text(640, 62, message, style(56, OR, 10)).setOrigin(0.5);

    this.add.image(350, 385, "ui_regles").setDisplaySize(570, 490);
    var colonnes = [205, 495];
    joueurs.forEach((j, i) => {
      creerMedaillon(this, colonnes[i], 210, j, j.etiquette);
      this.add.text(colonnes[i], 270, j.nom, style(28, "#46282c", 0)).setOrigin(0.5);
      this.add.text(colonnes[i], 318, this.score(i), style(44, "#7b2830", 0)).setOrigin(0.5);
    });
    this.add.text(350, 318, "-", style(38, "#46282c", 0)).setOrigin(0.5);
    this.stats.forEach((stat, k) => {
      var y = 380 + k * 34;
      this.add.text(350, y, stat.titre, styleTexte(20, "#46282c")).setOrigin(0.5);
      stat.valeurs.forEach((v, i) => this.add.text(colonnes[i], y, String(v), styleTexte(26, "#7b2830")).setOrigin(0.5));
    });

    // les persos : le gagnant saute de joie, le perdant réagit à sa façon
    joueurs.forEach((j, i) => {
      this.afficherPerso(j, colonnes[i]);
    });
  }

  update() {
    if (this.choixFait || this.sauvegardeEnCours) return;
    if (unJoueurAppuie(this.touches, "a")) {
      this.choixFait = true;
      jouerSon(this, "valider");
      if (this.jeu.scene == "piano_time") this.registry.set("niveau", 1);
      // Nouvelle partie : premier essai et aucun centimètre conservé.
      this.scene.start(this.jeu.scene, { numEssai: 0, scores: [[], []] });
    } else if (unJoueurAppuie(this.touches, "b")) {
      this.choixFait = true;
      jouerSon(this, "retour");
      this.scene.start("menu");
    }
  }
}
