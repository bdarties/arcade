import { creerCarte, creerCamera, mettreAJourCamera } from "./systemes/carte.js";
import { creerTemple, creerTenebres, mettreAJourTenebres } from "./systemes/temple.js";
import {
  creerJoueur, mettreAJourJoueur, garderJoueursEnsemble, tousTombes
} from "./systemes/joueurs.js";
import { mettreAJourArme } from "./systemes/armes.js";
import { mettreAJourEnnemis, ombreAttaqueTemple, ombreToucheJoueur } from "./systemes/ennemis.js";
import { demarrerVagues } from "./systemes/vagues.js";
import { creerHud, mettreAJourHud, annoncer } from "./systemes/hud.js";
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

    creerCarte(this);
    creerTemple(this);

    this.groupeEnnemis = this.physics.add.group();

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

    creerHud(this);
    annoncer(this, "Protégez le Temple de l'Aube", "Joystick : se déplacer   ·   l'attaque est automatique");
    demarrerVagues(this);
    initialiserSons(this);
    jouerMusique(this, "musique_jeu");
  }

  update(time, delta) {
    if (this.partieTerminee) {
      return;
    }
    this.tempsJeu += delta;

    for (const joueur of this.joueurs) {
      mettreAJourJoueur(this, joueur);
      mettreAJourArme(this, joueur);
    }
    garderJoueursEnsemble(this);

    mettreAJourEnnemis(this);

    mettreAJourCamera(this);
    mettreAJourTenebres(this);
    mettreAJourHud(this);

    if (tousTombes(this)) {
      this.terminerPartie();
    }
  }

  terminerPartie() {
    this.partieTerminee = true;
    this.physics.pause();
    annoncer(this, "LES TÉNÈBRES ONT TOUT ENGLOUTI", "");
    this.cameras.main.fadeOut(2600, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("fin", {
        temps: this.tempsJeu,
        vague: this.vague.numero,
        ennemisVaincus: this.ennemisVaincus,
        score: this.score,
        nbJoueurs: this.joueurs.length
      });
    });
  }
}
