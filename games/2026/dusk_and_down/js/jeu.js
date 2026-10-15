import { creerCarte, creerCamera, mettreAJourCamera } from "./systemes/carte.js";
import { creerTemple, creerTenebres, mettreAJourTenebres } from "./systemes/temple.js";
import {
  creerJoueur, mettreAJourJoueur, garderJoueursEnsemble, verifierReanimations, tousTombes
} from "./systemes/joueurs.js";
import { mettreAJourArme, mettreAJourProjectiles, projectileTouche } from "./systemes/armes.js";
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
import { vientDEtrePressee } from "./reglages/controles.js";

export default class jeu extends Phaser.Scene {
  constructor() {
    super({ key: "jeu" });
  }

  init(donnees) {
    this.nbJoueurs = donnees.nbJoueurs || 1;
    this.classes = donnees.classes || ["chevalier", "chevalier"];
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
    this.bossActif = null;
    this.nbBossApparus = 0;
    this.bossVaincus = 0;
    reinitialiserEffets();

    creerCarte(this);
    creerTemple(this);

    this.groupeEnnemis = this.physics.add.group();
    this.groupeGemmes = this.physics.add.group();
    this.groupeProjectiles = this.physics.add.group();
    this.groupeCranes = this.physics.add.group();

    this.joueurs = [];
    for (let numero = 1; numero <= this.nbJoueurs; numero++) {
      this.joueurs.push(creerJoueur(this, numero, this.classes[numero - 1]));
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
    this.physics.add.overlap(this.groupeProjectiles, this.groupeEnnemis, (projectile, ennemi) =>
      projectileTouche(this, projectile, ennemi)
    );
    this.physics.add.overlap(this.joueurs, this.groupeCranes, (joueur, crane) => craneToucheJoueur(this, crane, joueur));
    this.physics.add.overlap(temple.corps, this.groupeCranes, (corps, crane) => craneToucheTemple(this, crane));
    this.physics.add.collider(this.groupeCranes, this.groupeObstacles, (crane) => exploserCrane(this, crane));

    creerHud(this);
    annoncer(this, "Protégez le Temple de l'Aube", "Joystick : se déplacer   ·   l'attaque est automatique   ·   B : pause");
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
    for (const joueur of this.joueurs) {
      if (vientDEtrePressee(joueur.touches.B)) {
        this.scene.pause();
        this.scene.launch("pause");
        return;
      }
    }
    this.tempsJeu += delta;

    for (const joueur of this.joueurs) {
      mettreAJourJoueur(this, joueur, delta);
      mettreAJourArme(this, joueur);
    }
    garderJoueursEnsemble(this);
    verifierReanimations(this);

    mettreAJourEnnemis(this);
    mettreAJourProjectiles(this);
    mettreAJourCranes(this);
    mettreAJourGemmes(this);

    mettreAJourCamera(this);
    mettreAJourTenebres(this);
    mettreAJourHud(this);

    if (this.temple.detruit && tousTombes(this)) {
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
        bossVaincus: this.bossVaincus,
        score: this.score,
        nbJoueurs: this.joueurs.length,
        classes: this.classes
      });
    });
  }
}
