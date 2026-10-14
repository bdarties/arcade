// ============================================================================
//  js/niveau_termine.js — ÉCRAN « NIVEAU TERMINÉ » (le bilan après chaque victoire)
//
//  Le niveau qui vient d'être gagné nous envoie ici avec des informations (voir terminerNiveau dans niveau1.js) :
//    numero, nom, vies, viesMax, secondes, premiereFois.
//  On affiche : le fragment de partition gagné, les cœurs restants, le temps, et ce que ça débloque.
//  Puis A / Entrée ramène au LOBBY, où la porte suivante est maintenant ouverte.
// ============================================================================

import { creerClavierMenu } from "./controles.js";
import { NIVEAUX, niveauxTermines } from "./progression.js";

const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif';
const SCENE_SUIVANTE = "lobby";

export default class niveau_termine extends Phaser.Scene {
  constructor() {
    super({ key: "niveau_termine" });
  }

  // init(data) est appelée par Phaser AVANT create() : data = ce que le niveau nous a envoyé avec scene.start(...)
  init(data) {
    this.bilan = data || { numero: 1, nom: "", vies: 0, viesMax: 0, secondes: 0, premiereFois: false };
  }

  create() {
    this.enTransition = false;
    this.clavier = creerClavierMenu(this);
    this.cameras.main.fadeIn(600, 0, 0, 0);
    const b = this.bilan;

    // Fond : l'image de victoire, assombrie pour que le texte reste lisible
    this.add.image(640, 360, "img_victoire");
    this.add.rectangle(640, 360, 1280, 720, 0x000010, 0.68);

    const style = (taille, couleur) => ({ fontFamily: POLICE, fontSize: taille, color: couleur, align: "center", stroke: "#000000", strokeThickness: 5 });

    this.add.text(640, 80, "NIVEAU " + b.numero + " TERMINÉ !", { ...style("36pt", "#f5d97a"), fontStyle: "bold", strokeThickness: 7 }).setOrigin(0.5);
    this.add.text(640, 138, b.nom, style("17pt", "#dfe6ff")).setOrigin(0.5);

    // ---- Le fragment de partition gagné : grand, avec un halo ----
    const halo = this.add.image(640, 290, "tex_lumiere").setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd98a).setScale(2.2).setAlpha(0.6);
    const partition = this.add.image(640, 290, "img_partition").setDisplaySize(150, 150);
    this.tweens.add({ targets: [partition, halo], y: 280, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: halo, scale: 2.6, duration: 900, yoyo: true, repeat: -1 });

    const total = niveauxTermines(this.registry).length;
    this.add.text(640, 395, "Fragment de partition : " + total + " / " + NIVEAUX.length, style("20pt", "#ffe9a8")).setOrigin(0.5);
    const detail = b.premiereFois == true ? "NOUVEAU FRAGMENT !" : "(fragment déjà récupéré : tu rejoues ce niveau)";
    this.add.text(640, 432, detail, style("13pt", b.premiereFois == true ? "#9dffb0" : "#aab4e0")).setOrigin(0.5);

    // ---- Le bilan : cœurs restants et temps ----
    const minutes = Math.floor(b.secondes / 60);
    const secondes = b.secondes % 60;
    const temps = minutes + " min " + (secondes < 10 ? "0" : "") + secondes + " s";
    this.add.text(640, 495, "Cœurs restants : " + Math.max(b.vies, 0) + " / " + b.viesMax + "      ·      Temps : " + temps, style("16pt", "#dfe6ff")).setOrigin(0.5);

    // ---- Ce que ça débloque ----
    const suivant = NIVEAUX.find((n) => n.numero == b.numero + 1);
    let consigne;
    if (suivant === undefined) {
      consigne = "Tous les niveaux sont terminés !";
    } else if (b.premiereFois == true) {
      this.registry.set("deblocage", suivant.numero); // le lobby fera une petite animation sur cette porte
      consigne = "La porte " + suivant.numero + " « " + suivant.nom + " » est débloquée !" + (suivant.disponible == true ? "" : "\n(ce niveau est encore en construction)");
    } else {
      consigne = "Retourne au lobby pour choisir une porte.";
    }
    this.add.text(640, 568, consigne, style("17pt", "#f5d97a")).setOrigin(0.5);

    const aide = this.add.text(640, 672, "Bouton A / Entrée : retourner au lobby", style("14pt", "#cfd6f5")).setOrigin(0.5);
    this.tweens.add({ targets: aide, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });
  }

  update() {
    if (this.enTransition == false && this.clavier.presse("valider")) {
      this.enTransition = true;
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start(SCENE_SUIVANTE);
      });
    }
  }
}
