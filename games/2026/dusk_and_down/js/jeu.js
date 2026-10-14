import { creerCarte, creerCamera, mettreAJourCamera } from "./systemes/carte.js";
import { creerTemple, creerTenebres, mettreAJourTenebres } from "./systemes/temple.js";
import {
  creerJoueur, mettreAJourJoueur, garderJoueursEnsemble, tousTombes
} from "./systemes/joueurs.js";
import { mettreAJourArme } from "./systemes/armes.js";
import {
  mettreAJourEnnemis, ombreAttaqueTemple, ombreToucheJoueur, craneToucheJoueur, craneToucheTemple,
  exploserCrane, mettreAJourCranes
} from "./systemes/ennemis.js";
import { mettreAJourGemmes, ramasserGemme } from "./systemes/butin.js";
import { xpPourNiveau, ouvrirChoixSiNecessaire } from "./systemes/progression.js";
import { demarrerVagues } from "./systemes/vagues.js";
import { creerHud, mettreAJourHud, annoncer } from "./systemes/hud.js";
import { reinitialiserEffets } from "./systemes/effets.js";
import { initialiserSons, jouerMusique } from "./systemes/sons.js";

export default class jeu extends Phaser.Scene {
  constructor() {
    super({ key: "jeu" });
  }

  init(donnees) {
    this.nbJoueurs = donnees.nbJoueurs || 1;
  }

  create() {
    this.tempsJeu = 0;
    this.partieTerminee = false;
    this.score = 0;
    this.ennemisVaincus = 0;
    this.niveau = 1;
    this.xp = 0;
    this.xpRequise = xpPourNiveau(1);
    this.niveauxEnAttente = 0;
    this.choixEnCours = false;
    reinitialiserEffets();

    creerCarte(this);
    creerTemple(this);

    this.groupeEnnemis = this.physics.add.group();
    this.groupeGemmes = this.physics.add.group();
    this.groupeCranes = this.physics.add.group();

    this.joueurs = [];
    for (let numero = 1; numero <= this.nbJoueurs; numero++) {
      this.joueurs.push(creerJoueur(this, numero, "chevalier"));
    }

    creerTenebres(this);
    creerCamera(this);

    const temple = this.temple;
    this.physics.add.collider(this.groupeEnnemis, this.groupeEnnemis);
    this.physics.add.collider(this.groupeEnnemis, this.groupeObstacles);
    this.physics.add.collider(this.groupeEnnemis, temple.corpsStatues);
    this.physics.add.collider(temple.corps, this.groupeEnnemis, (corps, ennemi) => ombreAttaqueTemple(this, ennemi));
    this.physics.add.collider(this.joueurs, temple.corps);
    this.physics.add.collider(this.joueurs, temple.corpsStatues);
    this.physics.add.collider(this.joueurs, this.groupeObstacles);
    this.physics.add.overlap(this.joueurs, this.groupeEnnemis, (joueur, ennemi) => ombreToucheJoueur(this, joueur, ennemi));
    this.physics.add.overlap(this.joueurs, this.groupeGemmes, (joueur, gemme) => ramasserGemme(this, joueur, gemme));
    this.physics.add.overlap(this.joueurs, this.groupeCranes, (joueur, crane) => craneToucheJoueur(this, crane, joueur));
    this.physics.add.overlap(temple.corps, this.groupeCranes, (corps, crane) => craneToucheTemple(this, crane));
    this.physics.add.collider(this.groupeCranes, this.groupeObstacles, (crane) => exploserCrane(this, crane));

    creerHud(this);
    annoncer(this, "Protégez le Temple de l'Aube", "Joystick : se déplacer   ·   l'attaque est automatique");
    demarrerVagues(this);
    initialiserSons(this);
    jouerMusique(this, "musique_jeu");

    this.events.on("resume", this.reprendre, this);
    this.events.once("shutdown", () => {
      this.events.off("resume", this.reprendre, this);
    });
  }

  update(time, delta) {
    if (this.partieTerminee) {
      return;
    }
    this.tempsJeu += delta;

    for (const joueur of this.joueurs) {
      mettreAJourJoueur(this, joueur, delta);
      mettreAJourArme(this, joueur);
    }
    garderJoueursEnsemble(this);

    mettreAJourEnnemis(this);
    mettreAJourCranes(this);
    mettreAJourGemmes(this);

    mettreAJourCamera(this);
    mettreAJourTenebres(this);
    mettreAJourHud(this);

    if (tousTombes(this)) {
      this.terminerPartie();
      return;
    }

    ouvrirChoixSiNecessaire(this);
  }

  reprendre() {
    this.input.keyboard.resetKeys();
  }

  terminerPartie() {
    this.partieTerminee = true;
    this.physics.pause();
    annoncer(this, "LES OMBRES ONT TRIOMPHÉ", "");
    this.cameras.main.fadeOut(2600, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("fin", {
        temps: this.tempsJeu,
        vague: this.vague.numero,
        niveau: this.niveau,
        ennemisVaincus: this.ennemisVaincus,
        score: this.score,
        nbJoueurs: this.joueurs.length
      });
    });
  }
}
