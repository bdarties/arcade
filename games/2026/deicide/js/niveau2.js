import * as lumiere from "./lumiere.js";
import * as ennemis from "./ennemis.js";
import { creerPersonnage, majPersonnage } from "./Personnage/personnage.js";
import { creerHud } from "./Personnage/hud.js";
export default class niveau2 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau2" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }
  preload() { }

  create() {
    this.add.image(400, 300, "img_ciel");
    this.groupe_plateformes = this.physics.add.staticGroup();
    this.groupe_plateformes.create(200, 584, "img_plateforme");
    this.groupe_plateformes.create(600, 584, "img_plateforme");
    // ajout d'un texte distintcif  du niveau
    this.add.text(400, 100, "Vous êtes dans le niveau 2", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    this.porte_retour = this.physics.add.staticSprite(100, 550, "img_porte2");

    this.player = creerPersonnage(this, 100, 450);
    this.player.refreshBody();
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.clavier = this.input.keyboard.createCursorKeys();
    this.physics.add.collider(this.player, this.groupe_plateformes);



    this.pv = 5; // défini les pv du joueur à 5
    this.hud = creerHud(this, this.player, this.pv); // affiche le HUD : barre de vie (5 cellules), vies et jauge de dash
    this.zonesLumiere = this.physics.add.staticGroup(); // permet de creer le groupe de halo lumineux
    this.prochainDegatLumiere = 0; // l'instant à partir du quel on peut faire des dégats au joueur quand il rentre dans la zone de lumière
    lumiere.creerTextureHalo(this); // permet de creer le visuel du halo sur la map
    lumiere.creerZoneRonde(this, 500, 520, 100); // pose le halo de lumière, doit etre mis après la creation de la texture

    this.lanternes = this.physics.add.staticGroup(); // permet de creer un groupe de lanternes
    lumiere.creerLanterne(this, 700, 540, 90);// pose une lumière aux coordonnées indiquées
    this.tirsJoueur = this.physics.add.group({ allowGravity: false }); // fait en sorte que les tirs soit dans un groupe et qu'ils ne soient pas soumis à la gravité
    this.physics.add.overlap(this.tirsJoueur, this.lanternes, (tir, lanterne) => lumiere.eteindreLanterne(this, tir, lanterne)); // le tir éteint la lanterne
    this.ennemis = this.physics.add.group(); // creer le groupe d'archer avec une physique dynamique
    this.physics.add.collider(this.ennemis, this.groupe_plateformes); // fait en sorte que les ennemis ne traversent pas les plateformes
    ennemis.creerArcher(this, 350, 400); // positionne un archer aux coordonnées indiquées
    this.physics.add.overlap(this.tirsJoueur, this.ennemis, (tir, ennemi) => ennemis.toucherEnnemi(this, tir, ennemi)); // si le tir toucher l'ennemi on passe à toucher ennemi
    this.tirsEnnemis = this.physics.add.group({ allowGravity: false }); // groupe qui contient toutes les fleches des ennemis
    this.physics.add.overlap(this.player, this.tirsEnnemis, (joueur, fleche) => { // vérifie si le joueur et la fleche sont en collision
      fleche.destroy(); // si ils sont en collision la fleche est détruite
      this.blesserJoueur(1, "Abattu par un archer"); // donne la raison de la mort
    });
    this.physics.add.collider(this.tirsEnnemis, this.groupe_plateformes, (fleche) => fleche.destroy()); // la fleche se détuit si il rencontre un mur
  }


  update() {
    lumiere.majLumiere(this);
    majPersonnage(this.player, this.clavier);
    ennemis.majEnnemis(this);

    if (Phaser.Input.Keyboard.JustDown(this.clavier.space) == true) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        console.log("niveau 3 : retour vers selection");
        this.scene.switch("selection");
      }
    }
  }
  blesserJoueur(degats, cause) {
    this.pv -= degats;
    this.hud.majPV(this.pv); // met la barre de vie à jour
    console.log(cause);
  }
}
