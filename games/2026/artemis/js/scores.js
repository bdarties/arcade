import * as fct from "./fonctions.js";
import { BOUTONS_VALIDER } from "./menu.js";

/***********************************************************************/
/** SCORES : calcul, sauvegarde (cf. donnees.js, fourni par la borne) et écran "Classement"
/** le score est uniquement le niveau atteint (ni ennemis tués, ni pierres)
/** format stocké : [ { initiales: "LIN", niveau: 3 }, ... ] trié du meilleur au moins bon, 10 entrées au plus
/***********************************************************************/

const NB_SCORES = 10; // taille du classement
const DUREE_FONDU = 300; // ms
const DELAI_RETOUR = 400; // ms : le bouton qui a ouvert l'écran est peut-être encore enfoncé, on l'ignore un instant

// lit le classement ; une valeur absente ou abîmée donne un classement vide plutôt qu'une erreur
export async function lireClassement() {
  const liste = await lireDonneesJSON();
  if (!Array.isArray(liste)) return [];
  return liste.filter((e) => e && typeof e.niveau === "number" && typeof e.initiales === "string");
}

// ajoute une partie au classement (lire, modifier, réécrire : ecrireDonneesJSON remplace tout)
// renvoie le rang (à partir de 0) de la nouvelle entrée, ou -1 si elle n'entre pas dans le top
export async function ajouterScore(initiales, niveau) {
  const entree = { initiales: initiales, niveau: niveau };
  const liste = await lireClassement();
  liste.push(entree);
  liste.sort((a, b) => b.niveau - a.niveau); // à niveau égal, la plus ancienne reste devant (le tri est stable)
  const gardes = liste.slice(0, NB_SCORES);
  await ecrireDonneesJSON(gardes);
  return gardes.indexOf(entree);
}

export default class scores extends Phaser.Scene {
  constructor() {
    super({ key: "scores" });
  }

  // data.rang : entrée à mettre en avant (on arrive du game over) ; data.choix : bouton du menu à retrouver au retour
  async create(data) {
    this.choix = data?.choix;
    this.depuis_pause = data?.depuis_pause === true; // ouvert depuis le menu pause : on y revient sans passer par le menu
    this.retour = true; // bloqué le temps du délai d'ouverture
    this.time.delayedCall(DELAI_RETOUR, () => { this.retour = false; });
    this.cameras.main.setBackgroundColor("#080D1C");
    this.cameras.main.fadeIn(DUREE_FONDU);

    this.add.image(0, 0, "img_fond_menu").setOrigin(0, 0);
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x080d1c, 0.78).setOrigin(0, 0);
    this.add.text(this.scale.width / 2, 70, "CLASSEMENT", { fontFamily: fct.POLICES.bouton, fontSize: "40px", color: "#EC8697", stroke: "#20283A", strokeThickness: 6 })
      .setOrigin(0.5);
    this.add.text(this.scale.width / 2, this.scale.height - 34, "Appuie sur le bouton " + fct.ETIQUETTES.frapper_tirer + " pour revenir", { fontFamily: fct.POLICES.texte, fontSize: "22px", color: "#E8EBF0", stroke: "#080D1C", strokeThickness: 5 })
      .setOrigin(0.5);

    this.touches = fct.JOUEURS.map((joueur) => fct.creerTouches(this, joueur.touches));

    const liste = await lireClassement();
    if (!this.scene.isActive("scores")) return; // on a déjà quitté l'écran pendant la lecture
    if (liste.length === 0) {
      this.add.text(this.scale.width / 2, 340, "Aucun score pour le moment", { fontFamily: fct.POLICES.texte, fontSize: "28px", color: "#BFC3CC" }).setOrigin(0.5);
      return;
    }
    liste.slice(0, NB_SCORES).forEach((e, i) => {
      const y = 150 + i * 46;
      const couleur = i === data?.rang ? "#EC8697" : "#E8EBF0";
      const style = (police, taille) => ({ fontFamily: police, fontSize: taille + "px", color: couleur, stroke: "#080D1C", strokeThickness: 4 });
      this.add.text(380, y, (i + 1) + ".", style(fct.POLICES.bouton, 24)).setOrigin(1, 0.5);
      this.add.text(430, y, e.initiales, style(fct.POLICES.bouton, 26)).setOrigin(0, 0.5);
      this.add.text(900, y, "Niveau " + e.niveau, style(fct.POLICES.bouton, 26)).setOrigin(1, 0.5);
    });
  }

  update() {
    if (this.retour || !this.touches) return;
    const appuye = (touche) => Phaser.Input.Keyboard.JustDown(touche);
    if (!this.touches.some((t) => BOUTONS_VALIDER.some((bouton) => appuye(t[bouton])))) return;
    this.retour = true;
    this.sound.play("son_touche_sortant");
    if (this.depuis_pause) {
      this.scene.stop();
      this.scene.resume("pause");
      return;
    }
    this.cameras.main.fadeOut(DUREE_FONDU);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu", { choix: this.choix }));
  }
}
