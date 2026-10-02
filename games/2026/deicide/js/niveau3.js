import { creerPersonnage, majPersonnage } from "./Personnage/personnage.js";
import { creerHud } from "./Personnage/hud.js";
import { jouerSon, musiqueDeScene } from "./sons.js"; // bruitages et musique
import * as effets from "./effets.js"; // tremblements, flashs et éclats

export default class niveau3 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau3" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }
  preload() { }

  create() {
    this.cameras.main.setBackgroundColor("#1a1a1a"); // fond gris très sombre : la lumière du boss ressortira
    this.groupe_plateformes = this.physics.add.staticGroup(); // groupe des sols, personnage.js y arrête aussi les balles
    const sol = this.add.rectangle(640, 700, 1280, 40, 0x0a0a0a); // sol noir de toute la largeur de l'écran, collé en bas
    this.physics.add.existing(sol, true); // donne un corps physique au sol, true = statique (il ne bouge jamais)
    this.groupe_plateformes.add(sol); // range le sol dans le groupe des plateformes

    this.player = creerPersonnage(this, 640, 600); // le robot apparaît au milieu de l'arène, au-dessus du sol
    this.player.setCollideWorldBounds(true); // il ne peut pas sortir de l'écran
    this.clavier = this.input.keyboard.createCursorKeys(); // les flèches du clavier (le joystick de la borne)
    this.physics.add.collider(this.player, this.groupe_plateformes); // le robot marche sur le sol

    this.pv = 5; // PV du joueur
    this.hud = creerHud(this, this.player, this.pv); // barre de vie, vies, jauge de dash, score et chrono

    this.tirsJoueur = this.physics.add.group({ allowGravity: false }); // tirs du robot, personnage.js les range ici
    this.ennemis = this.physics.add.group(); // vide pour l'instant : il servira aux chérubins invoqués par le boss
    this.tirsEnnemis = this.physics.add.group({ allowGravity: false }); // les orbes que lancera le boss
    this.physics.add.overlap(this.player, this.tirsEnnemis, (joueur, orbe) => { // un tir du boss touche le robot
      orbe.destroy(); // l'orbe disparaît
      this.blesserJoueur(1, "Foudroyé par le Dieu de la Lumière"); // et le robot perd un PV
    });
    this.physics.add.collider(this.tirsEnnemis, this.groupe_plateformes, (orbe) => orbe.destroy()); // une orbe qui touche le sol disparaît
    musiqueDeScene(this, "musique_niveau"); // musique (on mettra celle du boss plus tard)
  }

  update() {
    majPersonnage(this.player, this.clavier); // déplacements du personnages
  }
  blesserJoueur(degats, cause) {
    this.pv -= degats; // retire les PV
    this.hud.majPV(this.pv); // met la barre de vie à jour
    jouerSon(this, this.pv <= 0 ? "joueur_mort" : "joueur_touche"); // bruit de mort ou d'impact
    effets.joueurTouche(this); // tremblement, écran rouge et robot qui clignote
    console.log(cause); // affiche la cause dans la console
  }
}

