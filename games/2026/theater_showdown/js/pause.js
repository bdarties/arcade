import * as fct from "./fonctions.js";
import { creerTouchesDeuxJoueurs } from "./controles.js";
import { enregistrerMatch } from "./comptes.js";

/***********************************************************************/
/** MENU PAUSE
/** Lancé PAR-DESSUS la scène de combat (scene.launch), qui est mise
/** en pause : physique, timers, tweens et animations sont figés.
/** Ouverture / fermeture : bouton Start de n'importe quel joueur (ou Échap).
/***********************************************************************/

export default class pause extends Phaser.Scene {
  constructor() {
    super({ key: "pause" });
  }

  init(donnees) {
    this.donnees = donnees; // données du combat en cours : { j1, j2, arene, ... }
  }

  create() {
    this.enTransition = false;
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
    this.add.rectangle(640, 380, 560, 470, 0x12040a, 0.92).setStrokeStyle(4, 0xf5c542);
    this.add.image(640, 200, "titre_entracte").setScale(0.85);

    this.menu = fct.creerMenu(this, [
      { texte: "Reprendre", action: "reprendre" },
      { texte: "Commandes", action: "commandes" },
      { texte: "Recommencer le duel", action: "recommencer" },
      { texte: "Changer d'artistes", action: "selection" },
      { texte: "Menu principal", action: "menu" }
    ], 640, 285, 64, 34);

    this.add.text(640, 668, "A : valider     B / Start : reprendre", fct.style(22, "#e8d8c0")).setOrigin(0.5);
    if (this.duelClasse()) this.add.text(640, 638, "Duel classé : quitter = défaite pour celui qui a mis en pause", fct.style(18, "#ff8a8a")).setOrigin(0.5);

    this.touches = creerTouchesDeuxJoueurs(this);
    this.toucheEchap = this.input.keyboard.addKey("ESC");

    // au retour de l'écran des commandes, on vide les appuis faits là-bas
    const relacherTouches = () => this.input.keyboard.resetKeys();
    this.events.on("resume", relacherTouches);
    this.events.once("shutdown", () => this.events.off("resume", relacherTouches));
  }

  update() {
    if (this.enTransition) return;

    // Start ou Échap referment la pause (à lire avant lireMenu qui "consomme" les appuis)
    const fermer = Phaser.Input.Keyboard.JustDown(this.toucheEchap) ||
      this.touches.some((touches) => Phaser.Input.Keyboard.JustDown(touches.start));
    if (fermer) {
      this.reprendre();
      return;
    }

    const choix = fct.lireMenu(this, this.menu, this.touches);
    if (!choix) return;
    if (choix === "retour") {
      this.reprendre();
      return;
    }

    fct.jouerSon(this, "menu_valider");
    switch (choix.action) {
      case "reprendre":
        this.reprendre();
        break;
      case "commandes":
        // l'écran des commandes s'affiche au-dessus, la pause attend en dessous
        this.scene.launch("commandes", { depuisPause: true });
        this.scene.bringToTop("commandes");
        this.scene.pause();
        break;
      case "recommencer":
        this.quitterCombat("combat", {
          j1: this.donnees.j1, j2: this.donnees.j2, arene: this.donnees.arene, victoires: [0, 0], manche: 1
        });
        break;
      default:
        this.quitterCombat(choix.action);
    }
  }

  // un duel est classé quand les deux joueurs sont connectés (voir connexion.js)
  duelClasse() {
    const joueurs = this.registry.get("joueurs") || [null, null];
    return joueurs[0] !== null && joueurs[1] !== null;
  }

  // Quitter le duel depuis la pause (ou le recommencer) = abandon : le joueur qui a mis en pause
  // perd le match classé. Sans cette règle, il suffirait de quitter pour éviter une défaite.
  async abandonner() {
    const pauseur = this.donnees.pauseur;
    if (!this.duelClasse() || !pauseur) return; // invité, ou pause lancée avec Échap (clavier)
    const joueurs = this.registry.get("joueurs");
    const resultat = await enregistrerMatch(joueurs[0].pseudo, joueurs[1].pseudo, pauseur === 1 ? 2 : 1);
    if (resultat) {
      joueurs[0].elo = resultat.apres[0];
      joueurs[1].elo = resultat.apres[1];
    }
  }

  reprendre() {
    this.sound.resumeAll();
    this.scene.resume("combat");
    this.scene.stop();
  }

  // arrête le combat (et ses sons) puis lance une autre scène :
  // rideau qui se ferme pour le menu principal, simple fondu sinon
  quitterCombat(cle, donnees) {
    this.abandonner();
    const suite = () => {
      this.sound.stopAll();
      fct.arreterMusique(this);
      this.scene.stop("combat");
      this.scene.start(cle, donnees);
    };
    if (cle === "menu") {
      fct.transitionRideau(this, "rideau_fermeture", suite);
      return;
    }
    this.enTransition = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", suite);
  }
}
