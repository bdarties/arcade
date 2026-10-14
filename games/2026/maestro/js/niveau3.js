// ============================================================================
//  js/niveau3.js — NIVEAU 3 : LA GRANDE SCÈNE (boss) — PROTOTYPE, phase 1 « Le piano-mémoire »
//
//  Le Maestro montre une partition (une suite de notes) sur la portée, pendant quelques secondes,
//  puis la cache. La Cantatrice la rejoue de mémoire avec le clavier, comme un piano :
//  A = Do, B = Mi, C = Sol. Une partition réussie retire un point de vie au Maestro.
//  Une fausse note : le Maestro renvoie une onde, et la même partition est remontrée.
// ============================================================================

import { creerPanneau } from "./controles.js";
import { jouerSonNote } from "./musique.js";

const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif';
const NOMS_NOTES = ["DO", "MI", "SOL"]; // 0 = Do (A), 1 = Mi (B), 2 = Sol (C)
const COULEURS_NOTES = [0xff6b7d, 0x62b0ff, 0xffd24a]; // les mêmes couleurs que les ondes
const HAUTEUR_NOTES = [196, 174, 152]; // hauteur de chaque note sur la portée (en pixels)
const PARTITIONS = [[0, 2, 1, 0], [1, 0, 2, 1, 0], [2, 0, 1, 2, 1, 0]]; // de plus en plus longues
const TEMPS_MONTRE_MS = 4000; // durée pendant laquelle la partition reste visible

export default class niveau3 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau3" });
  }

  create() {
    this.fini = false; // vrai quand la phase est terminée
    this.pointsDeVie = PARTITIONS.length; // un point de vie par partition à rejouer
    this.numero = 0; // la partition en cours
    this.etat = "montre"; // "montre" = on regarde la partition, "joue" = on la rejoue
    this.joue = []; // les notes jouées jusqu'ici
    this.clavier = creerPanneau(this, "j1"); // les touches A, B, C du joueur 1

    // Décor : fond sombre et scène
    this.add.rectangle(640, 360, 1280, 720, 0x0a0a14);
    this.add.rectangle(640, 680, 1280, 80, 0x3a2a1a);

    // Le Maestro : géant, il flotte doucement de haut en bas
    this.maestro = this.add.container(640, 380);
    const corps = this.add.graphics();
    corps.fillStyle(0x4a2a6a, 1).fillRoundedRect(-170, -40, 340, 330, 40).lineStyle(8, 0xf5d97a).strokeRoundedRect(-170, -40, 340, 330, 40); // le manteau
    corps.fillStyle(0xe8d9b0, 1).fillCircle(0, -90, 90).lineStyle(6, 0xf5d97a).strokeCircle(0, -90, 90); // le visage
    corps.fillStyle(0x4a2a6a, 1).fillTriangle(-140, -220, 140, -220, 0, -300); // le chapeau
    this.maestro.add(corps);
    this.tweens.add({ targets: this.maestro, y: 362, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // La Cantatrice, à gauche, sur la scène
    this.cantatrice = this.add.sprite(160, 600, "cantatrice_idle").setScale(2.5).play("cantatrice_idle");

    // La portée : 5 lignes, dessinées une fois, affichées ou cachées avec la partition
    this.portee = this.add.graphics().lineStyle(4, 0xf5d97a, 0.9);
    for (let i = 0; i < 5; i++) {
      this.portee.lineBetween(200, 130 + i * 22, 1080, 130 + i * 22);
    }
    this.notes = this.add.group(); // les notes de la partition affichée

    // Les textes : le titre, le message, et les points de vie
    this.add.text(640, 40, "Phase 1 · Retiens la partition", { fontFamily: POLICE, fontSize: "36pt", color: "#f5d97a", stroke: "#000000", strokeThickness: 6 }).setOrigin(0.5);
    this.texteMessage = this.add.text(640, 706, "", { fontFamily: POLICE, fontSize: "26pt", color: "#ffffff", stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5);
    this.texteVie = this.add.text(1240, 40, "", { fontFamily: POLICE, fontSize: "26pt", color: "#f5d97a", stroke: "#000000", strokeThickness: 5 }).setOrigin(1, 0.5);
    this.majVie();

    this.lancerPartition();
  }

  update() {
    if (this.fini == true || this.etat != "joue") {
      return; // on ne réagit aux touches que pendant que la Cantatrice rejoue
    }
    if (Phaser.Input.Keyboard.JustDown(this.clavier.A)) this.jouerNote(0); // A = Do
    if (Phaser.Input.Keyboard.JustDown(this.clavier.B)) this.jouerNote(1); // B = Mi
    if (Phaser.Input.Keyboard.JustDown(this.clavier.C)) this.jouerNote(2); // C = Sol
  }

  // Montre la partition pendant TEMPS_MONTRE_MS, puis la cache et laisse la Cantatrice la rejouer
  lancerPartition() {
    this.etat = "montre";
    this.joue = [];
    this.afficherPartition(PARTITIONS[this.numero]);
    this.texteMessage.setText("Retiens bien la partition !");
    this.time.delayedCall(TEMPS_MONTRE_MS, () => {
      this.cacherPartition();
      this.etat = "joue";
      this.texteMessage.setText("À toi ! A = Do · B = Mi · C = Sol");
    });
  }

  // La Cantatrice joue une note : juste = on continue, fausse = on recommence
  jouerNote(note) {
    jouerSonNote(this, note);
    const partition = PARTITIONS[this.numero];
    this.joue.push(note);
    if (partition[this.joue.length - 1] != note) {
      this.erreur();
      return;
    }
    if (this.joue.length == partition.length) {
      this.partitionReussie();
    }
  }

  // Fausse note : le Maestro renvoie une onde, et la même partition est remontrée
  erreur() {
    this.cameras.main.shake(300, 0.01);
    this.texteMessage.setText("Fausse note ! Le Maestro te renvoie une onde.");
    this.lancerPartition();
  }

  // Partition réussie : le Maestro perd un point de vie, puis on passe à la suivante (ou on finit)
  partitionReussie() {
    this.pointsDeVie -= 1;
    this.majVie();
    this.maestro.list[0].setAlpha(0.5); // petit flash du Maestro
    this.time.delayedCall(150, () => this.maestro.list[0].setAlpha(1));
    this.numero += 1;
    if (this.numero == PARTITIONS.length) {
      this.finirPhase1();
      return;
    }
    this.lancerPartition();
  }

  // Fin de la phase 1 : pour l'instant, le prototype s'arrête ici
  finirPhase1() {
    this.fini = true;
    this.texteMessage.setText("Phase 1 terminée ! (La phase 2 n'est pas encore faite.)");
  }

  // Dessine la partition : une note colorée par case, à droite de la précédente
  afficherPartition(suite) {
    this.notes.clear(true, true);
    this.portee.setVisible(true);
    suite.forEach((note, i) => {
      const x = 260 + i * 130; // une note tous les 130 pixels
      const y = HAUTEUR_NOTES[note];
      this.notes.add(this.add.circle(x, y, 20, COULEURS_NOTES[note]).setStrokeStyle(4, 0x000000));
      this.notes.add(this.add.text(x, y + 40, NOMS_NOTES[note], { fontFamily: POLICE, fontSize: "18pt", color: "#ffffff" }).setOrigin(0.5));
    });
  }

  // Cache la partition (la portée et les notes)
  cacherPartition() {
    this.notes.clear(true, true);
    this.portee.setVisible(false);
  }

  // Affiche les points de vie du Maestro (une note par point)
  majVie() {
    this.texteVie.setText(this.pointsDeVie > 0 ? "Maestro : " + "♪ ".repeat(this.pointsDeVie).trim() : "Maestro : vaincu");
  }
}
