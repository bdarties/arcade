import { creerTouches, vientDAppuyer, unJoueurAppuie, oublierAppuis } from "./controles.js";
import { jouerSon, jouerSaxo, arreterMusique } from "./sons.js";
import { participants } from "./persos.js";
import { infosJeu } from "./jeux.js";
import {style,styleTexte,
  panneauPresentation, fermerPanneau, creerMedaillon, creerVies, casserVie, texteFlottant, annonce, partieTerminee, compteRebours, OR } from "./interface.js";

const BOUTONS = ["a", "b", "c", "d", "e", "f"];
const LETTRES = ["A", "B", "C", "D", "E", "F"];

const JEU = infosJeu("memory_song"); // titre, fond, règles...

// ---------------------------------------------------------------------------
// Réglages du mini-jeu
// ---------------------------------------------------------------------------
// centre de chaque touche dans l'image du saxophone (mesuré sur les images
// touche1 à touche6) : A B C en haut, D E F en bas, rangées comme les
// boutons de la borne d'arcade
const TOUCHES = [
  { x: 189, y: 176 },
  { x: 272, y: 185 },
  { x: 356, y: 185 },
  { x: 189, y: 258 },
  { x: 272, y: 266 },
  { x: 356, y: 266 }
];
// la note de chaque touche : Sol La Do en haut (aigu), Do Ré Mi en bas (grave).
// C'est une gamme "pentatonique" : n'importe quelle suite de notes sonne bien.
const NOTES = [67, 69, 72, 60, 62, 64];
const COULEURS = [0xff5a5a, 0xffa23a, 0xffe14d, 0x5ee06a, 0x4db8ff, 0xc77dff];
const TEINTE_ETEINTE = 0xa08868; // touche au repos : dorée mais plus sombre

const LONGUEUR_DEPART = 3; // la 1re mélodie a 3 notes, puis une de plus à chaque manche
const CHANCES = 3;
const DELAI_REPONSE = 4000; // ms max pour jouer la note suivante, sinon "trop lent"
const POINTS_NOTE = 10;
const BONUS_MELODIE = 50;

const ECHELLE_PERSOS = 0.83; // les planches des persos font 252 px de haut
const Y_PIEDS = 592;
const Y_PROGRES = 632; // les ronds qui montrent où on en est dans la mélodie
const Y_CHRONO = 662;

const PROF = { saxo: 2, touche: 4, lettre: 5, perso: 7, hud: 30 };

// Déroulement (this.etat) :
// presentation -> demo (le saxo joue) -> saisie (les joueurs rejouent)
// -> bilan -> demo de la manche suivante... -> fin
export default class memoire extends Phaser.Scene {
  constructor() {
    super({ key: "memoire" });
  }

  create() {
    arreterMusique(this);
    this.touches = creerTouches(this);
    this.etat = "presentation";
    this.solo = this.registry.get("mode") == "solo";
    this.manche = 0;
    this.erreurManche = false;
    if (!this.sonsSaxo) this.sonsSaxo = {};
    this.arretsSaxo = {};
    NOTES.forEach((note) => {
      this.arretsSaxo[note] = [];
      if (!this.sonsSaxo[note]) {
        this.sonsSaxo[note] = [];
        for (var voie = 0; voie < 3; voie++) this.sonsSaxo[note].push(this.sound.add("saxo_" + note));
      }
    });
    // la mélodie : une liste de touches (0 = A ... 5 = F). La 1re manche en
    // ajoute une, donc on part avec LONGUEUR_DEPART - 1 notes.
    this.sequence = [];
    for (var k = 0; k < LONGUEUR_DEPART - 1; k++) this.sequence.push(this.noteAuHasard());

    this.add.image(0, 0, JEU.fond).setOrigin(0);
    this.departs = [{ x: 150 }, { x: 1130 }];
    this.creerSaxo();
    this.creerTextes();
    this.joueurs = participants(this.registry).map((perso, i) => this.creerJoueur(perso, i));

    this.panneau = panneauPresentation(this, JEU.titre, JEU.regles.split("\n"));
  }

  // pas 3 fois de suite la meme touche (ce serait trop facile... ou trop bizarre)
  noteAuHasard() {
    var s = this.sequence;
    var n;
    do {
      n = Phaser.Math.Between(0, 5);
    } while (s.length >= 2 && n == s[s.length - 1] && n == s[s.length - 2]);
    return n;
  }

  // ---------------------------------------------------------------------------
  // DECOR
  // ---------------------------------------------------------------------------
  creerSaxo() {
    var saxo = { x: 320, y: 118 };
    this.add.image(saxo.x, saxo.y, "img_saxo").setOrigin(0).setDepth(PROF.saxo);
    this.touchesSaxo = TOUCHES.map((pos, k) => {
      var x = saxo.x + pos.x;
      var y = saxo.y + pos.y;
      var couleur = "#" + COULEURS[k].toString(16).padStart(6, "0");
      return {
        image: this.add.image(x, y, "img_touche" + (k + 1)).setTint(TEINTE_ETEINTE).setDepth(PROF.touche),
        lettre: this.add
          .text(x, y, LETTRES[k], style(26, couleur, 6))
          .setOrigin(0.5)
          .setDepth(PROF.lettre)
      };
    });
  }

  creerTextes() {
    // bandeau sombre derrière le titre (sinon on le lit mal sur le lustre)
    var bandeau = this.add.image(640, 55, "ui_bandeau").setDepth(PROF.hud);
    bandeau.scaleX = 500 / bandeau.width;
    bandeau.scaleY = 160 / bandeau.height;
    this.add.text(640, 34, JEU.titre, style(40, OR)).setOrigin(0.5).setDepth(PROF.hud);
    this.texteManche = this.add.text(640, 76, "", styleTexte(22, "#ffe9a8")).setOrigin(0.5).setDepth(PROF.hud);
    this.texteStatut = this.add.text(640, 552, "", style(32)).setOrigin(0.5).setDepth(PROF.hud);
  }

  statut(texte, couleur) {
    this.texteStatut.setText(texte).setTint(couleur == OR ? 0xffd23f : 0xffffff);
  }

  // La touche s’éclaire pendant la note, puis revient à sa teinte de repos.
  allumer(k, duree, couleur) {
    var touche = this.touchesSaxo[k];
    var image = touche.image;
    if (touche.retour) touche.retour.remove();
    image.setTint(couleur || COULEURS[k]);
    image.scaleX = 1.18;
    image.scaleY = 1.18;
    touche.retour = this.time.delayedCall(duree, () => {
      image.scaleX = 1;
      image.scaleY = 1;
      image.setTint(TEINTE_ETEINTE);
    });
  }

  // ---------------------------------------------------------------------------
  // JOUEURS
  // ---------------------------------------------------------------------------
  creerJoueur(perso, i) {
    var x = this.departs[i].x;
    var j = {
      perso: perso,
      x: x,
      touches: this.touches[i],
      // en duo, J1 entend ses notes à gauche et J2 à droite
      pan: this.solo ? 0 : i == 0 ? -0.6 : 0.6,
      score: 0,
      chances: CHANCES,
      elimine: false,
      position: 0, // combien de notes de la mélodie il a déjà rejouées
      fini: true, // a fini la manche en cours (réussie ou ratée)
      reussi: false,
      timer: null, // timer de réponse, retiré à chaque nouvelle note
      notesJustes: 0,
      plusLongue: 0
    };
    j.sprite = this.add
      .sprite(x, Y_PIEDS, perso.texture)
      .setOrigin(0.5, 1)
      .setDepth(PROF.perso);
    j.sprite.scaleX = ECHELLE_PERSOS;
    j.sprite.scaleY = ECHELLE_PERSOS;
    j.sprite.flipX = i == 1;

    // HUD en haut dans le coin : la tete, le score à coté et les chances
    var gauche = i == 0;
    var xTete = gauche ? 70 : 1210;
    creerMedaillon(this, xTete, 62, perso, perso.etiquette);
    j.texteScore = this.add
      .text(gauche ? 122 : 1158, 46, "0", style(34, perso.couleur))
      .setOrigin(gauche ? 0 : 1, 0.5)
      .setDepth(PROF.hud);
    j.imagesVies = creerVies(this, gauche ? 132 : 1096, 90, CHANCES);
    j.imagesVies.forEach((v) => { v.scaleX = 0.8; v.scaleY = 0.8; });

    j.progres = this.add.text(j.x, Y_PROGRES, "", styleTexte(22)).setOrigin(0.5).setDepth(PROF.hud);
    j.chrono = this.add.text(j.x, Y_CHRONO, "", styleTexte(20)).setOrigin(0.5).setDepth(PROF.hud);
    return j;
  }

  majScore(j) {
    j.texteScore.setText(j.score);
  }

  // Le tuto du premier jeu met à jour les scores avec setText.
  dessinerProgres(j) {
    j.progres.setText(j.elimine ? "" : j.position + " / " + this.sequence.length + " notes");
  }

  // Tuto timers : un événement par seconde et un nombre de répétitions limité.
  demarrerChrono(j, secondes) {
    if (j.timer) j.timer.remove();
    j.chrono.setText(secondes + " s");
    j.timer = this.time.addEvent({
      delay: 1000,
      repeat: secondes - 1,
      callback: () => {
        secondes--;
        j.chrono.setText(secondes + " s");
        if (secondes == 0) this.erreur(j, "Trop lent !");
      }
    });
  }

  // ---------------------------------------------------------------------------
  // DEROULEMENT D'UNE MANCHE
  // ---------------------------------------------------------------------------
  commencer() {
    this.etat = "decompte";
    compteRebours(this, () => this.nouvelleManche());
  }

  nouvelleManche() {
    if (!this.erreurManche) {
     this.manche++;
     this.sequence.push(this.noteAuHasard());
   }
   this.erreurManche = false;
    this.texteManche.setText("Mélodie n°" + this.manche + "  ·  " + this.sequence.length + " notes");
    this.joueurs.forEach((j) => {
      j.position = 0;
      j.fini = j.elimine;
      j.reussi = false;
      this.dessinerProgres(j);
    });
    this.time.delayedCall(600, () => this.demonstration());
  }

  // le saxophone joue la mélodie : chaque touche s'allume avec sa note.
  // Plus la mélodie est longue, plus il joue vite.
  demonstration() {
    this.etat = "demo";
    this.statut("Écoute bien...");
    var duree = Math.max(0.22, 0.5 - 0.025 * (this.sequence.length - LONGUEUR_DEPART)); // en secondes
    var pas = (duree + 0.14) * 1000; // en ms
    this.sequence.forEach((k, rang) => {
      this.time.delayedCall(300 + rang * pas, () => {
        this.allumer(k, duree * 1000);
        jouerSaxo(this, NOTES[k], { duree: duree });
      });
    });
    this.time.delayedCall(300 + this.sequence.length * pas + 250, () => this.aVous());
  }

  aVous() {
    this.etat = "saisie";
    this.statut("À vous de jouer !", OR);
    oublierAppuis(this.touches); // les appuis faits pendant la démo ne comptent pas
    this.joueurs.forEach((j) => {
      if (j.elimine) return;
      // un peu plus de temps pour la 1re note
      this.demarrerChrono(j, DELAI_REPONSE / 1000 + 1);
    });
  }

  update() {
    if (this.etat == "presentation") {
      if (unJoueurAppuie(this.touches, "a")) {
        this.etat = "lancement";
        jouerSon(this, "valider");
        fermerPanneau(this, this.panneau, () => this.commencer());
      }
      return;
    }

    // on lit les 6 boutons de chaque joueur à chaque image
    // (meme hors de la saisie, pour ne pas garder de vieux appuis)
    this.joueurs.forEach((j) => {
      BOUTONS.forEach((bouton, k) => {
        if (vientDAppuyer(j.touches[bouton]) && this.etat == "saisie") this.jouerTouche(j, k);
      });
    });

  }

  // le joueur j appuie sur la touche k
  jouerTouche(j, k) {
    if (j.fini || j.elimine) return;
    var attendue = this.sequence[j.position];
    if (k != attendue) {
      if (this.solo) this.allumer(k, 250, 0xff2020);
      this.erreur(j, "Fausse note !");
      return;
    }
    jouerSaxo(this, NOTES[k], { duree: 0.3, pan: j.pan });
    // en solo, les touches du saxo s'allument quand le joueur joue
    // (en duo on ne les allume pas, sinon l'autre pourrait copier)
    if (this.solo) this.allumer(k, 250);

    j.position++;
    j.notesJustes++;
    j.score += POINTS_NOTE;
    this.demarrerChrono(j, DELAI_REPONSE / 1000);
    this.majScore(j);
    this.dessinerProgres(j);
    if (j.position >= this.sequence.length) this.reussite(j);
  }

  reussite(j) {
    j.fini = true;
    j.reussi = true;
    j.score += BONUS_MELODIE;
    j.plusLongue = Math.max(j.plusLongue, this.sequence.length);
    if (j.timer) j.timer.remove();
    j.chrono.setText("");
    this.majScore(j);
    this.dessinerProgres(j);
    jouerSon(this, "bravo", j.pan);
    texteFlottant(this, j.x, Y_PIEDS - j.sprite.displayHeight - 60, "Bravo ! +" + BONUS_MELODIE, OR, 28);
    this.verifierFinManche();
  }

  erreur(j, texte) {
    if (j.fini) return;
    this.erreurManche = true;
    j.fini = true;
    j.reussi = false;
    j.chances--;
    if (j.timer) j.timer.remove();
    j.chrono.setText("");
    casserVie(this, j.imagesVies[j.chances]);
    jouerSon(this, "couac", j.pan);
    texteFlottant(this, j.x, Y_PIEDS - j.sprite.displayHeight - 60, texte, "#ff4d5e", 28);
    if (j.chances <= 0) this.eliminer(j);
    this.verifierFinManche();
  }

  eliminer(j) {
    j.elimine = true;
    j.progres.setText("");
    this.add
      .text(j.x, Y_PROGRES, this.solo ? "TERMINÉ" : "ÉLIMINÉ", style(34, "#ff4d5e", 7))
      .setOrigin(0.5)
      .setDepth(PROF.hud);
    jouerSon(this, "elimine", j.pan);
  }

  // quand tout le monde a fini la manche : manche suivante (ou fin)
  verifierFinManche() {
    if (this.etat != "saisie") return;
    if (this.joueurs.some((j) => !j.fini)) return;
    this.etat = "bilan";
    this.time.delayedCall(1400, () => {
      if (partieTerminee(this.joueurs)) this.fin();
      else this.nouvelleManche();
    });
  }

  fin() {
    if (this.etat == "fin") return;
    this.etat = "fin";
    this.statut("");
    annonce(this, "FIN DU CONCERT !", OR, 1700, 330);
    jouerSon(this, "final");
    this.time.delayedCall(2300, () => {
      this.scene.start("resultats", {
          scores: this.joueurs.map((j) => j.score),
          stats: [
            { titre: "Plus longue mélodie", valeurs: this.joueurs.map((j) => j.plusLongue + " notes") },
            { titre: "Notes justes", valeurs: this.joueurs.map((j) => j.notesJustes) }
          ]
      });
    });
  }
}
