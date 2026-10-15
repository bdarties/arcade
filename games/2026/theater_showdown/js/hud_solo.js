import * as fct from "./fonctions.js";
import { PV_MAX, ENERGIE_MAX } from "./combattant.js";
import { BARRE_DEBUT, BARRE_FIN } from "./combat.js";
import { creerTouchesDeuxJoueurs } from "./controles.js";
import { BOSS } from "./reglages.js";

/***********************************************************************/
/** INTERFACE DU MODE SOLO
/** Scène lancée par-dessus "solo" (scene.launch) : sa caméra n'est pas
/** zoomée, l'interface garde donc la même taille et la même place que
/** dans le mode duel (barre de vie, jauge de 5 notes).
/** Données reçues : { joueur, ennemis }  (+ boss : le Chef d'orchestre, pour le combat final)
/***********************************************************************/

// La barre de vie du joueur est réduite pour laisser la place à celle du boss, au centre de l'écran.
const ECHELLE_JOUEUR = 0.7;
// barre du boss (assets/images/barre_boss_*.png, 880 x 186 px) : le rouge va de la colonne 14 (0 %) à la 863 (100 %)
const BARRE_BOSS_DEBUT = 14;
const BARRE_BOSS_FIN = 863;
const ECHELLE_BOSS = 0.62;

export default class hud_solo extends Phaser.Scene {
  constructor() {
    super({ key: "hud_solo" });
  }

  init(donnees) {
    this.joueur = donnees.joueur;
    this.ennemis = donnees.ennemis;
    this.boss = donnees.boss || null; // null dans le niveau 1
    this.totalEnnemis = donnees.ennemis.getLength();
    this.menuFin = null; // menu de l'écran de victoire
  }

  create() {
    // barre de vie, comme celle du J1 en duel mais plus petite ; la barre "fantôme" rattrape doucement la vraie vie
    // (les positions sont celles du mode duel, multipliées par ECHELLE_JOUEUR à partir du coin de la barre)
    const k = ECHELLE_JOUEUR;
    this.barreVide = this.add.image(14, 4, "barre_vie_vide").setOrigin(0, 0).setScale(k);
    this.barreFantome = this.add.image(14, 4, "barre_vie_pleine").setOrigin(0, 0).setScale(k).setTintFill(0xfff0d0).setAlpha(0.7);
    this.barrePleine = this.add.image(14, 4, "barre_vie_pleine").setOrigin(0, 0).setScale(k);
    this.add.text(14 + 58 * k, 4 + 58 * k, "J1", fct.style(20, "#6cb8ff")).setOrigin(0.5);
    this.add.text(14 + 120 * k, 4 + 96 * k, this.joueur.perso.nom, fct.style(16, "#6cb8ff")).setOrigin(0, 0.5);

    // jauge d'attaque spéciale : 5 notes
    this.notes = [];
    for (let i = 0; i < 5; i++) {
      const x = 14 + (126 + i * 44) * k;
      const y = 4 + 138 * k;
      this.notes.push({
        vide: this.add.image(x, y, "note_ult_vide").setScale(k),
        pleine: this.add.image(x, y, "note_ult").setScale(k)
      });
    }

    this.texteEnnemis = this.add.text(1260, 30, "", fct.style(24, "#ffd65a")).setOrigin(1, 0.5);
    this.add.text(640, 706, "Start / Échap : menu", fct.style(16, "#e8d8c0")).setOrigin(0.5).setAlpha(0.7);
    if (this.boss) this.creerBarreBoss();

    this.pvAffiches = this.joueur.pv;
    this.affiche = {}; // dernières valeurs affichées : on ne redessine que ce qui change
  }

  // barre de vie du boss, au centre en haut de l'écran (le titre "Chef d'orchestre" fait partie de l'image) :
  // la barre pleine est rognée sur la droite, par-dessus la barre vide
  creerBarreBoss() {
    this.texteEnnemis.setVisible(false);
    this.add.image(640, 2, "barre_boss_vide").setOrigin(0.5, 0).setScale(ECHELLE_BOSS);
    this.barreBoss = this.add.image(640, 2, "barre_boss_pleine").setOrigin(0.5, 0).setScale(ECHELLE_BOSS);
    this.consigne = this.add.text(640, 676, "A au bon moment : renvoie les touches de piano au boss !", fct.style(24, "#9fe8ff")).setOrigin(0.5);
    this.tweens.add({ targets: this.consigne, alpha: 0, delay: 8000, duration: 1000 });
  }

  // grand titre au milieu de l'écran (le nom du boss à son apparition)
  annoncer(texte) {
    const titre = this.add.text(640, 300, texte, fct.style(72, "#ffd65a")).setOrigin(0.5).setScale(0.2);
    this.tweens.add({ targets: titre, scale: 1, duration: 500, ease: "Back.easeOut" });
    this.tweens.add({ targets: titre, alpha: 0, delay: 1800, duration: 500, onComplete: () => titre.destroy() });
  }

  // écran de victoire : texte et menu (la scène "boss" fait ensuite le changement de scène)
  afficherVictoire() {
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6);
    const titre = this.add.text(640, 190, "Bravo !", fct.style(110, "#ffd65a")).setOrigin(0.5).setScale(0.2);
    this.tweens.add({ targets: titre, scale: 1, duration: 600, ease: "Back.easeOut" });
    this.add.text(640, 290, BOSS.nom + " est vaincu : le public est debout !", fct.style(32)).setOrigin(0.5);
    this.menuFin = fct.creerMenu(this, [{ texte: "Rejouer le boss", action: "rejouer" }, { texte: "Menu principal", action: "menu" }], 640, 430, 70, 42);
    this.touchesMenu = creerTouchesDeuxJoueurs(this);
  }

  afficherKO() {
    const ko = this.add.image(640, 320, "texte_ko").setScale(0.2);
    this.tweens.add({ targets: ko, scale: 1, duration: 400, ease: "Back.easeOut" });
  }

  update(temps) {
    if (this.menuFin) {
      const choix = fct.lireMenu(this, this.menuFin, this.touchesMenu);
      if (choix && choix !== "retour") {
        fct.jouerSon(this, "menu_valider");
        this.menuFin = null;
        const scenePrincipale = this.scene.get("boss");
        if (choix.action === "rejouer") scenePrincipale.rejouer();
        else scenePrincipale.retourMenu();
      }
    }
    const joueur = this.joueur;

    this.pvAffiches = Math.abs(this.pvAffiches - joueur.pv) < 0.1 ? joueur.pv : Phaser.Math.Linear(this.pvAffiches, joueur.pv, 0.06);
    if (this.affiche.pv !== joueur.pv) {
      this.affiche.pv = joueur.pv;
      this.rognerBarre(this.barrePleine, joueur.pv / PV_MAX);
    }
    if (this.affiche.pvAffiches !== this.pvAffiches) {
      this.affiche.pvAffiches = this.pvAffiches;
      this.rognerBarre(this.barreFantome, this.pvAffiches / PV_MAX);
    }

    // notes de la jauge : pleines, en cours de remplissage ou vides ; elles pulsent quand la jauge est pleine
    if (this.affiche.energie !== joueur.energie) {
      this.affiche.energie = joueur.energie;
      this.notes.forEach((note, k) => {
        const remplissage = Phaser.Math.Clamp(joueur.energie / 20 - k, 0, 1);
        note.pleine.setAlpha(remplissage >= 1 ? 1 : remplissage * 0.6).setScale(ECHELLE_JOUEUR);
        note.vide.setScale(ECHELLE_JOUEUR);
      });
    }
    if (joueur.energie >= ENERGIE_MAX) {
      this.notes.forEach((note, k) => {
        const echelle = ECHELLE_JOUEUR * (1 + 0.15 * Math.sin(temps / 90 + k));
        note.pleine.setScale(echelle);
        note.vide.setScale(echelle);
      });
    }

    if (this.boss) {
      if (this.affiche.pvBoss !== this.boss.pv) {
        this.affiche.pvBoss = this.boss.pv;
        const ratio = this.boss.pv / BOSS.pv;
        this.barreBoss.setCrop(0, 0, BARRE_BOSS_DEBUT + ratio * (BARRE_BOSS_FIN - BARRE_BOSS_DEBUT), this.barreBoss.height);
      }
      return;
    }
    const restants = this.ennemis.getChildren().filter((ennemi) => ennemi.actif).length;
    if (this.affiche.restants !== restants) {
      this.affiche.restants = restants;
      this.texteEnnemis.setText("Ennemis : " + restants + " / " + this.totalEnnemis);
    }
  }

  // même calcul que la barre du J1 en duel (combat.rognerBarre)
  rognerBarre(image, ratio) {
    const largeur = BARRE_DEBUT + ratio * (BARRE_FIN - BARRE_DEBUT);
    image.setCrop(0, 0, largeur, image.height);
  }
}
