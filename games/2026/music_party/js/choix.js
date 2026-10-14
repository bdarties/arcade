 
import { creerTouches, vientDAppuyer, oublierAppuis } from "./controles.js";
import { jouerSon, jouerMotif, lancerMusique } from "./sons.js";
import { PERSOS } from "./persos.js";
import { infosJeu } from "./jeux.js";
import { style, styleTexte, annonce, POLICE, OR } from "./interface.js";

const X_PERSO = 640; 
const Y_PIEDS = 525;
const ECART_FLECHES = 195; 
const X_ZONE = 1080; // la zone de texte, à coté du perso
const Y_CASES = 628; // les 4 cases, dans la bande rouge du bas
const ECART_CASES = 170;
const COULEURS = ["#ffd23f", "#5fc8ff"]; // J1 doré, J2 bleu

// Choix des persos : le perso sélectionné apparait en grand au milieu de la
// scène, avec son nom et sa présentation dans la zone de texte. Sa case est en
// couleur avec le cadre doré, les autres sont en noir et blanc.
// Joystick gauche / droite pour choisir, A pour valider, B pour revenir.
// En duo, J1 choisit d'abord, puis J2 (qui ne peut pas prendre le meme perso).
export default class choix extends Phaser.Scene {
  constructor() {
    super({ key: "choix" });
  }

  create() {
    this.touches = creerTouches(this);
    this.jeu = infosJeu(this.registry.get("jeu"));
    this.duo = this.registry.get("mode") == "duo";
    this.joueur = 0; // qui est en train de choisir (0 = J1, 1 = J2)
    this.pris = []; // les persos déjà validés (leur numéro dans PERSOS)
    this.attente = false; // true pendant une animation : on ignore les touches
    // on commence sur le perso de la partie précédente
    this.index = Math.max(0, PERSOS.findIndex((p) => p.cle == this.registry.get("perso1")));

    this.add.image(0, 0, "img_fond_choix").setOrigin(0);
    this.add.image(640, 64, "img_choisis");
    this.consigne = this.add.text(640, 140, "", style(20)).setOrigin(0.5);

    // le perso sélectionné (sa grande planche), entre les 2 flèches
    this.sprite = this.add.sprite(X_PERSO, Y_PIEDS, "img_grand_" + PERSOS[this.index].cle).setOrigin(0.5, 1);
    this.add.image(X_PERSO - ECART_FLECHES, 340, "img_fleche_gauche");
    this.add.image(X_PERSO + ECART_FLECHES, 340, "img_fleche_droite");

    // la zone de texte : le nom du perso en haut, puis sa présentation
    this.add.image(X_ZONE, 276, "img_zone_texte");
    this.nom = this.add.image(X_ZONE, 100, "img_nom_" + PERSOS[this.index].cle);
    this.texte = this.add.text(X_ZONE - 94, 136, "", {
      ...styleTexte(15, "#fff1dc"),
      align: "left",
      lineSpacing: 3,
      wordWrap: { width: 188 }
    });

    // les 4 cases : le portrait, avec le cadre par-dessus
    this.cases = PERSOS.map((perso, i) => {
      var x = 640 + (i - 1.5) * ECART_CASES;
      return {
        portrait: this.add.image(x, Y_CASES, "img_portrait_nb_" + perso.cle),
        cadre: this.add.image(x, Y_CASES, "img_cadre")
      };
    });
    // en duo, le perso pris par J1 garde ce badge pendant que J2 choisit
    this.badge = null;

    this.majEcran();
    lancerMusique(this);
  }

  // affiche le perso sélectionné et sa présentation, et met à jour les cases
  majEcran() {
    var perso = PERSOS[this.index];
    this.sprite.destroy();
    this.nom.destroy();
    this.sprite = this.add.sprite(X_PERSO, Y_PIEDS, "img_grand_" + perso.cle).setOrigin(0.5, 1);
    this.sprite.anims.play("anim_grand_" + perso.cle);
    this.nom = this.add.image(X_ZONE, 100, "img_nom_" + perso.cle);
    this.texte.setText(perso.description);
    this.cases.forEach((c, i) => {
      var selectionne = i == this.index;
      var x = c.cadre.x;
      c.portrait.destroy();
      c.cadre.destroy();
      c.portrait = this.add.image(x, Y_CASES, (selectionne ? "img_portrait_" : "img_portrait_nb_") + PERSOS[i].cle);
      // le cadre doré est plus grand : on le dessine par-dessus les cases voisines
      c.cadre = this.add.image(x, Y_CASES, selectionne ? "img_cadre_choisi" : "img_cadre").setDepth(selectionne ? 2 : 1);
    });
    var texte = "◄ ►  choisir     A  valider     B  retour";
    if (this.duo) texte = "JOUEUR " + (this.joueur + 1) + "  ·  " + texte;
    this.consigne.setText(texte).setTint(this.joueur == 0 ? 0xffd23f : 0x5fc8ff);
  }

  update() {
    // on lit les touches du joueur qui choisit (J1, puis J2 en duo)
    var t = this.touches[this.joueur];
    var gauche = vientDAppuyer(t.gauche);
    var droite = vientDAppuyer(t.droite);
    var a = vientDAppuyer(t.a);
    var b = vientDAppuyer(t.b);
    if (this.attente) return;
    if (gauche || droite) this.deplacer(droite ? 1 : -1);
    else if (a) this.valider();
    else if (b) this.annuler();
  }

  // perso suivant (sens = 1) ou précédent (-1), en sautant celui déjà pris par J1
  deplacer(sens) {
    do {
      this.index = (this.index + sens + PERSOS.length) % PERSOS.length;
    } while (this.pris.includes(this.index));
    jouerSon(this, "menu");
    this.majEcran();
  }

  valider() {
    var c = this.cases[this.index];
    this.pris.push(this.index);
    this.attente = true;
    jouerMotif(this, PERSOS[this.index]);
    // le perso saute de joie et sa case grossit un instant
    this.tweens.add({ targets: this.sprite, y: Y_PIEDS - 40, duration: 160, yoyo: true, ease: "Linear" });
    this.tweens.add({ targets: [c.portrait, c.cadre], scaleX: 1.15, scaleY: 1.15, duration: 150, yoyo: true, ease: "Linear" });

    if (this.duo && this.joueur == 0) {
      // au tour de J2 : il commence sur le perso suivant
      this.badge = this.add.text(c.cadre.x - 50, Y_CASES - 52, "J1", { fontFamily: POLICE, fontSize: "19px", color: "#1b1030", backgroundColor: COULEURS[0], padding: { x: 6, y: 2 } }).setOrigin(0.5).setDepth(3);
      this.time.delayedCall(800, () => {
        this.joueur = 1;
        this.attente = false;
        oublierAppuis(this.touches);
        this.deplacer(1);
      });
      return;
    }
    // tout le monde a choisi : c'est parti !
    this.registry.set("perso1", PERSOS[this.pris[0]].cle);
    if (this.duo) this.registry.set("perso2", PERSOS[this.pris[1]].cle);
    annonce(this, "C'EST PARTI !", OR, 800, 340);
    this.time.delayedCall(900, () => this.partir(this.jeu.scene, "valider"));
  }

  // B : J1 revient au menu du jeu, J2 revient au choix de J1K
  annuler() {
    if (this.joueur == 0) {
      this.partir("menu", "retour");
      return;
    }
    this.joueur = 0;
    this.index = this.pris.pop();
    this.badge.destroy();
    this.badge = null;
    oublierAppuis(this.touches);
    jouerSon(this, "retour");
    this.majEcran();
  }

  partir(scene, son) {
    this.attente = true;
    jouerSon(this, son);
    // {} = on repart de zéro (sinon Phaser redonne à Music Fall les données de la partie d'avant)
    this.scene.start(scene, {});
  }
}
