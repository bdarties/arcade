// ============================================================================
//  js/niveau3.js — NIVEAU 3 : LA GRANDE SCÈNE (boss du jeu)
//
//  Le Maestro a perdu sa voix. Pour la lui rendre, il faut lui rendre sa musique.
//
//  PHASE 1 « Les trois fragments » : le Maestro joue le thème de chaque fragment (3 notes).
//    La Cantatrice le reproduit : A = Do, B = Mi, C = Sol (le clavier fait office de piano).
//    Bonne séquence = un point de vie en moins pour le Maestro. Mauvaise note = il riposte.
//    Quand les 3 thèmes sont joués, la dernière partition tombe sur la scène : il faut aller la ramasser.
//
//  PHASE 2 « Le morceau complet » (le noir) : les lumières s'éteignent.
//    Le Maestro n'est visible que quand le Détective allume sa lampe (T), et seulement pendant quelques secondes.
//    La Cantatrice joue le morceau complet ; seules les notes jouées pendant qu'il est visible comptent.
//    Une fausse note recommence le morceau, et le Maestro reste visible un peu plus longtemps.
//
//  Commandes : Cantatrice = flèches (déplacement) + A B C (notes). Détective = Z Q S D + T (lampe).
//  En solo, la touche K alterne entre les deux personnages. En duo, les deux jouent en même temps.
//  Les thèmes et le morceau ci-dessous sont des EXEMPLES, à remplacer par les vraies partitions.
// ============================================================================

import { creerPanneau, touche } from "./controles.js";
import { jouerSonNote } from "./musique.js";

const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif';
const NOMS_NOTES = ["DO", "MI", "SOL"]; // 0 = Do (A), 1 = Mi (B), 2 = Sol (C)
const COULEURS_NOTES = [0xff6b7d, 0x62b0ff, 0xffd24a]; // les mêmes couleurs que les ondes
const HAUTEUR_NOTES = [196, 174, 152]; // hauteur de chaque note sur la portée (en pixels)
const THEMES = [[0, 2, 1], [1, 0, 2], [2, 1, 0]]; // phase 1 : un thème par fragment (3 notes)
const MORCEAU = [0, 2, 1, 0, 1, 2, 0, 1]; // phase 2 : le morceau complet (8 notes)
const TEMPS_THEME_MS = 6000; // temps pour reproduire un thème
const TEMPS_MONTRE_MS = 3000; // temps pendant lequel le thème reste affiché
const LAMPE_MS = 2000; // durée de la révélation du Maestro par la lampe
const LAMPE_RECHARGE_MS = 4000; // délai avant de pouvoir rallumer la lampe
const DISTANCE_LAMPE = 520; // le Maestro est révélé si la lampe est assez proche de lui
const ECHELLE_MAESTRO = 5; // le Maestro fait 64 px : ×5 = 320 px

export default class niveau3 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau3" });
  }

  // Les images et les sons propres au Maestro (chargés ici, car ils ne servent qu'à ce niveau)
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.spritesheet("maestro_idle", "./assets/maestro_idle.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("maestro_attack", "./assets/maestro_attack.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("maestro_hurt", "./assets/maestro_hurt.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("maestro_death", "./assets/maestro_death.png", { frameWidth: 64, frameHeight: 64 });
    this.load.image("maestro_notes", "./assets/maestro_notes.png");
  }

  create() {
    this.mode = this.registry.get("mode") || "solo"; // "solo" ou "duo"
    this.phase = 1; // 1 = les fragments, 2 = le morceau (le noir), 3 = fini
    this.fini = false;
    this.themeNumero = 0; // le thème de la phase 1 en cours
    this.pointsDeVie = THEMES.length; // un point de vie par thème
    this.joue = []; // les notes jouées dans la séquence en cours
    this.etat = "attente"; // "montre" = le thème s'affiche, "joue" = on le reproduit
    this.progressionMorceau = 0; // combien de notes du morceau sont justes
    this.lampeAllumee = false;
    this.lampePrete = true; // vrai quand on peut rallumer la lampe
    this.forme = "cantatrice"; // en solo : la forme active (la touche K la change)
    this.clavierJ1 = creerPanneau(this, "j1");
    this.clavierJ2 = creerPanneau(this, "j2");

    this.creerAnimations();
    this.creerDecor();
    this.creerPersonnages();
    this.creerTextes();

    this.lancerTheme();
  }

  creerAnimations() {
    if (this.anims.exists("maestro_idle") == false) {
      this.anims.create({ key: "maestro_idle", frames: this.anims.generateFrameNumbers("maestro_idle", { start: 0, end: 6 }), frameRate: 6, repeat: -1 });
      this.anims.create({ key: "maestro_attack", frames: this.anims.generateFrameNumbers("maestro_attack", { start: 0, end: 6 }), frameRate: 10, repeat: 0 });
      this.anims.create({ key: "maestro_hurt", frames: this.anims.generateFrameNumbers("maestro_hurt", { start: 0, end: 6 }), frameRate: 12, repeat: 0 });
      this.anims.create({ key: "maestro_death", frames: this.anims.generateFrameNumbers("maestro_death", { start: 0, end: 6 }), frameRate: 8, repeat: 0 });
    }
  }

  // Le décor : une scène et un fond sombre (la nuit de la phase 2 vient s'ajouter par-dessus)
  creerDecor() {
    this.add.rectangle(640, 360, 1280, 720, 0x0a0a14);
    this.add.rectangle(640, 690, 1280, 60, 0x3a2a1a);

    // La portée : 5 lignes, affichées avec les thèmes ou le morceau
    this.portee = this.add.graphics().lineStyle(4, 0xf5d97a, 0.9);
    for (let i = 0; i < 5; i++) {
      this.portee.lineBetween(200, 130 + i * 22, 1080, 130 + i * 22);
    }
    this.notes = this.add.group();

    // Le Maestro : géant, il flotte doucement
    this.maestro = this.add.sprite(640, 400, "maestro_idle").setScale(ECHELLE_MAESTRO).play("maestro_idle").setDepth(22); // au-dessus du voile noir quand il est révélé
    this.tweens.add({ targets: this.maestro, y: 380, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // La nuit : un voile noir qui cache tout en phase 2 (la lampe fait un trou dedans)
    this.nuit = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.94).setDepth(20).setVisible(false);
    this.lumiere = this.add.image(0, 0, "tex_lumiere").setBlendMode(Phaser.BlendModes.ADD).setDepth(21).setVisible(false);
  }

  creerPersonnages() {
    // La Cantatrice (à gauche) et le Détective (à droite) : leurs images d'attente et de marche
    this.cantatrice = this.add.sprite(200, 600, "cantatrice_idle").setScale(2.5).play("cantatrice_idle").setDepth(10);
    this.detective = this.add.sprite(1080, 600, "detective_idle").setScale(2.5).play("detective_idle").setDepth(23).setFlipX(true); // le Détective est au-dessus du voile : on le voit avec sa lampe
    this.detective.setAlpha(0.35); // en solo, le Détective est estompé tant qu'on ne le contrôle pas
  }

  creerTextes() {
    this.add.text(640, 40, "Le Maestro a volé sa musique : rejoue ses partitions !", { fontFamily: POLICE, fontSize: "28pt", color: "#f5d97a", stroke: "#000000", strokeThickness: 6 }).setOrigin(0.5).setDepth(30);
    this.texteMessage = this.add.text(640, 648, "", { fontFamily: POLICE, fontSize: "24pt", color: "#ffffff", stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5).setDepth(30);
    this.texteVie = this.add.text(1240, 100, "", { fontFamily: POLICE, fontSize: "26pt", color: "#f5d97a", stroke: "#000000", strokeThickness: 5 }).setOrigin(1, 0.5).setDepth(30);
    this.texteForme = this.add.text(40, 100, "", { fontFamily: POLICE, fontSize: "20pt", color: "#ffffff", stroke: "#000000", strokeThickness: 4 }).setDepth(30);
    // La voix du Maestro (phase 2) : une barre qui se remplit à chaque note juste
    this.barreVoix = this.add.graphics().setDepth(30);
    this.dessinerBarreVoix();
    // Les fragments trouvés, toujours visibles en haut à gauche
    this.fragmentsTrouves = this.add.group();
    // Les commandes, toujours visibles
    this.add.text(640, 706, "BORNE · A B C : notes · flèches : bouger · T : lampe · K : changer    CLAVIER · " + touche("j1", "A") + " " + touche("j1", "B") + " " + touche("j1", "C") + " : notes · " + touche("j2", "B") + " : lampe", { fontFamily: POLICE, fontSize: "13pt", color: "#e8ecff", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
    this.majVie();
    this.majForme();
  }

  update(temps) {
    if (this.fini == true) {
      return; // le combat est fini
    }
    this.deplacerPersonnages();
    if (this.mode == "solo" && Phaser.Input.Keyboard.JustDown(this.clavierJ1.D)) {
      this.changerForme(); // K : la Cantatrice ↔ le Détective (solo)
    }
    if (this.phase == 1 && this.etat == "joue") {
      this.lirePhase1();
    }
    if (this.phase == 2) {
      this.lirePhase2(temps);
      this.mettreAJourLumiere(temps);
    }
    if (this.phase == 1 && this.etat == "joue" && temps > this.limite) {
      this.raterTheme("Trop lent ! Recommence le thème.");
    }
    if (this.phase == 3 || this.fini) {
      return;
    }
    this.verifierFragmentTombe();
  }

  // Déplacement : la Cantatrice avec les flèches, le Détective avec Z Q S D
  deplacerPersonnages() {
    const pouvoirCantatrice = this.mode == "duo" || this.forme == "cantatrice";
    const pouvoirDetective = this.mode == "duo" || this.forme == "detective";
    if (pouvoirCantatrice) {
      const v = this.clavierJ1.gauche.isDown ? -260 : this.clavierJ1.droite.isDown ? 260 : 0;
      this.cantatrice.x = Phaser.Math.Clamp(this.cantatrice.x + v * 0.016, 60, 1220);
      if (v != 0) this.cantatrice.setFlipX(v < 0);
    }
    if (pouvoirDetective) {
      const v = this.clavierJ2.gauche.isDown ? -260 : this.clavierJ2.droite.isDown ? 260 : 0;
      this.detective.x = Phaser.Math.Clamp(this.detective.x + v * 0.016, 60, 1220);
      if (v != 0) this.detective.setFlipX(v > 0);
    }
  }

  // En solo : on alterne entre la Cantatrice et le Détective
  changerForme() {
    this.forme = this.forme == "cantatrice" ? "detective" : "cantatrice";
    this.cantatrice.setAlpha(this.forme == "cantatrice" ? 1 : 0.35);
    this.detective.setAlpha(this.forme == "detective" ? 1 : 0.35);
    this.majForme();
  }

  majForme() {
    this.texteForme.setText(this.mode == "duo" ? "Duo : chacun joue" : "Forme : " + (this.forme == "cantatrice" ? "Cantatrice (chant)" : "Détective (lampe)"));
  }

  // ---------------- PHASE 1 : les thèmes des fragments ----------------

  // Le Maestro joue le thème (animation, son, notes affichées), puis le cache et laisse la Cantatrice le rejouer
  lancerTheme() {
    this.etat = "montre";
    this.joue = [];
    const theme = THEMES[this.themeNumero];
    this.maestro.play("maestro_attack");
    this.sound.play("son_maestro", { volume: 0.35 });
    this.afficherNotes(theme, 260);
    this.texteMessage.setText("Retiens le thème " + (this.themeNumero + 1) + " / " + THEMES.length + " !");
    this.time.delayedCall(TEMPS_MONTRE_MS, () => {
      this.cacherNotes();
      this.maestro.play("maestro_idle");
      this.etat = "joue";
      this.limite = this.time.now + TEMPS_THEME_MS;
      this.texteMessage.setText("À toi ! A = Do · B = Mi · C = Sol");
    });
  }

  // Les notes jouées avec A, B, C (uniquement quand la Cantatrice est active)
  lirePhase1() {
    if (this.peutChanter() == false) {
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.clavierJ1.A)) this.chanter(0);
    if (Phaser.Input.Keyboard.JustDown(this.clavierJ1.B)) this.chanter(1);
    if (Phaser.Input.Keyboard.JustDown(this.clavierJ1.C)) this.chanter(2);
  }

  // Les notes de la Cantatrice ne comptent que si elle est active (en solo) ou toujours (en duo)
  peutChanter() {
    return this.mode == "duo" || this.forme == "cantatrice";
  }

  // Une note de la Cantatrice en phase 1 : juste = on avance, fausse = on recommence le thème
  chanter(note) {
    jouerSonNote(this, note);
    const theme = THEMES[this.themeNumero];
    this.joue.push(note);
    if (theme[this.joue.length - 1] != note) {
      this.raterTheme("Mauvaise note ! Le Maestro te renvoie une note.");
      return;
    }
    if (this.joue.length == theme.length) {
      this.themeReussi();
    }
  }

  // Un thème réussi : le Maestro perd un point de vie ; après le 3e, la dernière partition tombe
  themeReussi() {
    this.pointsDeVie -= 1;
    this.majVie();
    this.themeNumero += 1;
    this.etat = "attente";
    if (this.themeNumero == THEMES.length) {
      this.maestro.play("maestro_hurt");
      this.time.delayedCall(900, () => this.faireTomberFragment());
      return;
    }
    this.maestro.play("maestro_hurt");
    this.time.delayedCall(900, () => this.lancerTheme());
  }

  // Une erreur : le Maestro riposte (une note vole vers la Cantatrice), et le thème recommence
  raterTheme(message) {
    this.cameras.main.shake(300, 0.01);
    this.texteMessage.setText(message);
    const projectile = this.add.image(this.maestro.x - 120, this.maestro.y, "maestro_notes").setScale(3).setDepth(15);
    this.tweens.add({ targets: projectile, x: this.cantatrice.x, y: this.cantatrice.y, duration: 900, onComplete: () => projectile.destroy() });
    this.etat = "attente";
    this.time.delayedCall(900, () => this.lancerTheme());
  }

  // La dernière partition tombe sur la scène : il faut la ramasser (aller dessus avec la Cantatrice ou le Détective)
  faireTomberFragment() {
    this.fragmentFinal = this.add.image(640, -60, "img_partition").setDisplaySize(84, 84).setDepth(12);
    this.tweens.add({ targets: this.fragmentFinal, y: 600, duration: 1200, ease: "Bounce.easeOut" });
    this.texteMessage.setText("La dernière partition tombe : va la ramasser !");
  }

  // Tant que la partition n'est pas ramassée, on regarde si un personnage est dessus
  verifierFragmentTombe() {
    if (this.fragmentFinal == undefined || this.fragmentFinal.y < 500 || this.phase != 1) {
      return;
    }
    const pris = Math.abs(this.cantatrice.x - this.fragmentFinal.x) < 80 || Math.abs(this.detective.x - this.fragmentFinal.x) < 80;
    if (pris) {
      this.fragmentFinal.destroy();
      this.fragmentFinal = undefined;
      this.commencerPhase2();
    }
  }

  // ---------------- PHASE 2 : le morceau complet, dans le noir ----------------

  commencerPhase2() {
    this.phase = 2;
    this.etat = "joue";
    this.progressionMorceau = 0;
    this.nuit.setVisible(true);
    this.afficherNotes(MORCEAU, 230); // le morceau est affiché sur la portée
    this.maestro.setAlpha(0); // le Maestro disparaît dans le noir
    this.texteMessage.setText("Les lumières s'éteignent ! Éclaire-le avec T (Détective).");
    this.majVoix();
  }

  // La lampe : T (Détective) révèle le Maestro quelques secondes
  lirePhase2(temps) {
    const peutLampe = this.mode == "duo" || this.forme == "detective";
    if (peutLampe && this.lampePrete && Phaser.Input.Keyboard.JustDown(this.clavierJ2.B)) {
      this.allumerLampe(temps);
    }
    if (this.peutChanter() == false) {
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.clavierJ1.A)) this.chanterMorceau(0);
    if (Phaser.Input.Keyboard.JustDown(this.clavierJ1.B)) this.chanterMorceau(1);
    if (Phaser.Input.Keyboard.JustDown(this.clavierJ1.C)) this.chanterMorceau(2);
  }

  allumerLampe(temps) {
    this.lampeAllumee = true;
    this.lampePrete = false;
    this.lampeFin = temps + LAMPE_MS;
    this.time.delayedCall(LAMPE_MS, () => {
      this.lampeAllumee = false;
      this.time.delayedCall(LAMPE_RECHARGE_MS - LAMPE_MS, () => (this.lampePrete = true));
    });
  }

  // Le Maestro est révélé si la lampe est allumée et assez proche de lui
  mettreAJourLumiere() {
    const lampeQuiTouche = this.lampeAllumee && Math.abs(this.detective.x - this.maestro.x) < DISTANCE_LAMPE;
    this.lumiere.setVisible(this.lampeAllumee).setPosition(this.detective.x, this.detective.y - 80).setScale(1.6);
    this.maestro.setAlpha(lampeQuiTouche ? 1 : 0);
  }

  // Une note du morceau : seule une note jouée pendant que le Maestro est visible compte
  chanterMorceau(note) {
    jouerSonNote(this, note);
    if (this.maestro.alpha < 0.5) {
      this.texteMessage.setText("Il est dans le noir ! Éclaire-le avec T.");
      return;
    }
    if (MORCEAU[this.progressionMorceau] != note) {
      this.progressionMorceau = 0; // fausse note : le morceau recommence depuis le début
      this.texteMessage.setText("Fausse note ! Recommence le morceau.");
      this.afficherNotes(MORCEAU, 230);
      this.majVoix();
      return;
    }
    this.progressionMorceau += 1;
    this.majVoix();
    if (this.progressionMorceau == MORCEAU.length) {
      this.gagner();
    }
  }

  // Le morceau est joué en entier : la voix du Maestro revient, il est libéré
  gagner() {
    this.fini = true;
    this.phase = 3;
    this.maestro.setAlpha(1);
    this.maestro.play("maestro_death");
    this.nuit.setVisible(false);
    this.lumiere.setVisible(false);
    this.texteMessage.setText("Sa voix revient ! Le Maestro est libéré.");
  }

  // ---------------- Affichage ----------------

  // Dessine une suite de notes sur la portée, à partir de la position x donnée
  afficherNotes(suite, departX) {
    this.notes.clear(true, true);
    this.portee.setVisible(true);
    suite.forEach((note, i) => {
      const x = departX + i * 110;
      const y = HAUTEUR_NOTES[note];
      this.notes.add(this.add.circle(x, y, 18, COULEURS_NOTES[note]).setStrokeStyle(4, 0x000000).setDepth(25));
      this.notes.add(this.add.text(x, y + 38, NOMS_NOTES[note], { fontFamily: POLICE, fontSize: "16pt", color: "#ffffff" }).setOrigin(0.5).setDepth(25));
    });
  }

  cacherNotes() {
    this.notes.clear(true, true);
    this.portee.setVisible(false);
  }

  // Une barre qui se remplit avec le morceau : une part par note juste
  dessinerBarreVoix() {
    this.barreVoix.clear();
    this.barreVoix.fillStyle(0x000000, 0.6).fillRect(40, 130, 260, 20);
    this.barreVoix.lineStyle(2, 0xf5d97a).strokeRect(40, 130, 260, 20);
  }

  majVoix() {
    this.dessinerBarreVoix();
    const part = this.phase == 2 ? this.progressionMorceau / MORCEAU.length : 0;
    this.barreVoix.fillStyle(0xffd24a).fillRect(42, 132, 256 * part, 16);
  }

  majVie() {
    this.texteVie.setText(this.pointsDeVie > 0 ? "Maestro : " + "♪ ".repeat(this.pointsDeVie).trim() : "Maestro : vaincu");
  }
}
