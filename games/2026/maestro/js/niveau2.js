// ============================================================================
//  js/niveau2.js — NIVEAU 2 : le théâtre (carte Tiled map2maestro + tilesetmap2)
//
//  Ce fichier REMPLACE js/niveau2.js du gabarit. Il ne touche à aucun autre fichier.
//
//  POUR LE BRANCHER
//  1. Copie dans le dossier assets/ :   tilesetmap2.png   map2maestro.json   map2_sombre.png
//  2. Remplace js/niveau2.js par ce fichier. C'est tout : index.js et selection.js
//     (la porte n°2 de la sélection mène déjà à "niveau2") ne changent pas.
//
//  CE QUE LE NIVEAU RÉUTILISE DE LA SÉLECTION
//  - le sprite "img_perso" et ses animations (anim_tourne_gauche, anim_face, anim_tourne_droite)
//  - l'image de porte "img_porte2" (porte de retour vers la sélection)
//
//  COMMANDES : flèches gauche/droite = marcher, haut = sauter,
//              haut/bas devant une échelle = monter/descendre,
//              Espace devant la porte (près du départ) = retour à la sélection,
//              Espace devant le rideau rouge = terminer le niveau.
// ============================================================================

// ----------------------------------------------------------------------------
// Réglages du niveau (faciles à modifier)
// ----------------------------------------------------------------------------
const LARGEUR_CARTE = 2176;   // 68 tuiles x 32 px
const HAUTEUR_CARTE = 736;    // 23 tuiles x 32 px
const VITESSE_MARCHE = 160;
const VITESSE_SAUT = -330;    // même saut que les autres niveaux du gabarit
const VITESSE_ECHELLE = 120;  // vitesse de montée / descente sur une échelle
const LAMPES_REQUISES = 0;    // lampes à ramasser pour pouvoir sortir (0 = aucune, 7 = toutes)

// positions [x, y] des 7 lampes : 4 sur la route du haut, 3 sur la route du bas
const POSITIONS_LAMPES = [
  [780, 258], [1070, 258], [1350, 226], [1620, 258],   // route du haut
  [1085, 514], [1230, 418], [1620, 514]                // route du bas
];

export default class niveau2 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau2" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }

  // --------------------------------------------------------------------------
  // preload : chargement du fond, du tileset et de la carte
  // --------------------------------------------------------------------------
  preload() {
    // comme dans selection.js : on indique où se trouvent les fichiers du jeu
    this.load.setBaseURL(this.sys.game.config.baseURL);

    this.load.image("fond_theatre", "./assets/map2_sombre.png");      // fond (déjà assombri)
    this.load.image("tuiles_theatre", "./assets/tilesetmap2.png");    // image du tileset
    this.load.tilemapTiledJSON("carte_theatre", "./assets/map2maestro.json"); // la carte
  }

  // --------------------------------------------------------------------------
  // create : on construit le niveau (décor, objets, joueur, caméra)
  // --------------------------------------------------------------------------
  create() {
    // remise à zéro : create() est rappelée à chaque restart
    this.estMort = false;
    this.niveauTermine = false;
    this.enEchelle = false;
    this.lampesRamassees = 0;

    // si on revient dans ce niveau après l'avoir terminé, on le recommence à zéro
    this.events.off("wake");
    this.events.on("wake", () => {
      if (this.niveauTermine == true) {
        this.scene.restart();
      }
    });

    /*************************************
     *  FOND + CARTE TILED               *
     *************************************/
    // le fond est posé en (0,0) et étiré à la taille exacte de la carte
    this.add.image(0, 0, "fond_theatre").setOrigin(0, 0).setDisplaySize(LARGEUR_CARTE, HAUTEUR_CARTE);

    // les calques, du plus loin au plus proche : les noms doivent être identiques à ceux de Tiled
    this.carte = this.add.tilemap("carte_theatre");
    const tileset = this.carte.addTilesetImage("tileset_maestro", "tuiles_theatre");
    this.carte.createLayer("calque_background", tileset);
    this.calque_echelles = this.carte.createLayer("calque_background2", tileset); // contient les échelles
    this.carte.createLayer("calque_background2_bis", tileset);
    this.carte.createLayer("Calque_deco", tileset);
    this.carte.createLayer("Calque_deco_bis", tileset);
    this.carte.createLayer("Calque_deco_ter", tileset);
    this.calque_plateformes = this.carte.createLayer("calque_plateformes", tileset);
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });

    /*************************************
     *  DÉPART ET ARRIVÉE (calque objets)  *
     *************************************/
    // NOUVEAU : on lit des rectangles dessinés dans Tiled, dans le calque d'objets "objets"
    const pointDepart = this.carte.findObject("objets", function (objet) {
      return objet.name === "depart";
    });
    const pointArrivee = this.carte.findObject("objets", function (objet) {
      return objet.name === "arrivee";
    });

    // NOUVEAU : une zone invisible devant le rideau rouge (true = corps statique, ne bouge pas)
    this.zone_sortie = this.add.zone(
      pointArrivee.x + pointArrivee.width / 2,
      pointArrivee.y + pointArrivee.height / 2,
      pointArrivee.width,
      pointArrivee.height
    );
    this.physics.add.existing(this.zone_sortie, true);

    // porte de retour vers la sélection (comme dans les niveaux du gabarit), à côté du départ
    this.porte_retour = this.physics.add.staticSprite(330, 620, "img_porte2");

    /*************************************
     *  LAMPES À RAMASSER                *
     *************************************/
    // NOUVEAU : pas d'image de lampe dans le gabarit, alors on en dessine une
    // (graphics + generateTexture fabriquent une vraie texture réutilisable)
    if (this.textures.exists("img_lampe_theatre") == false) {
      const dessin = this.add.graphics();
      dessin.fillStyle(0xff9a1f).fillRect(6, 18, 8, 7);   // le pied
      dessin.fillStyle(0xffd24a).fillCircle(10, 10, 9);   // la flamme
      dessin.fillStyle(0xffffff).fillCircle(8, 8, 3);     // un reflet
      dessin.generateTexture("img_lampe_theatre", 20, 26);
      dessin.destroy();
    }
    this.groupe_lampes = this.physics.add.group();
    POSITIONS_LAMPES.forEach((position) => {
      const lampe = this.groupe_lampes.create(position[0], position[1], "img_lampe_theatre");
      lampe.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
    this.physics.add.collider(this.groupe_lampes, this.calque_plateformes);

    /*************************************
     *  PERSONNAGE + CLAVIER             *
     *************************************/
    this.player = this.physics.add.sprite(pointDepart.x + 20, pointDepart.y + 24, "img_perso");
    this.player.setCollideWorldBounds(true);
    this.clavier = this.input.keyboard.createCursorKeys();
    this.physics.add.collider(this.player, this.calque_plateformes);
    this.physics.add.overlap(this.player, this.groupe_lampes, this.ramasserLampe, null, this);

    /*************************************
     *  MONDE + CAMÉRA                   *
     *************************************/
    this.physics.world.setBounds(0, 0, LARGEUR_CARTE, HAUTEUR_CARTE);
    // NOUVEAU : (gauche, droite, haut, bas) -> le bas du monde ne bloque plus : on peut tomber dans les fosses
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBounds(0, 0, LARGEUR_CARTE, HAUTEUR_CARTE);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.fadeIn(600); // NOUVEAU : fondu à l'arrivée

    /*************************************
     *  TEXTES FIXÉS À L'ÉCRAN           *
     *************************************/
    const police = 'Georgia, "Goudy Bookletter 1911", Times, serif';
    this.texte_lampes = this.add.text(20, 20, "Lampes : 0 / " + POSITIONS_LAMPES.length, {
      fontFamily: police, fontSize: "20pt", fill: "#fff", stroke: "#000", strokeThickness: 4
    });
    this.texte_lampes.setScrollFactor(0).setDepth(10); // setScrollFactor(0) : le texte ne suit pas la caméra

    this.texte_message = this.add.text(640, 90, "Niveau 2 : le théâtre", {
      fontFamily: police, fontSize: "22pt", fill: "#ffe9a8", stroke: "#000", strokeThickness: 4
    });
    this.texte_message.setOrigin(0.5).setScrollFactor(0).setDepth(10);
    this.afficherMessage("Niveau 2 : le théâtre\n↑ ↓ pour grimper aux échelles · Espace devant le rideau rouge pour sortir", 5000);
  }

  // --------------------------------------------------------------------------
  // update : tourne en boucle (~60 fois par seconde)
  // --------------------------------------------------------------------------
  update() {
    // rien à faire pendant la mort ou la sortie du niveau
    if (this.estMort == true || this.niveauTermine == true) {
      return;
    }

    // ---- Échelle : on s'accroche en appuyant haut/bas devant une échelle, on lâche en la quittant ----
    const surUneEchelle = this.estSurEchelle();
    if (surUneEchelle == true && (this.clavier.up.isDown || this.clavier.down.isDown)) {
      this.enEchelle = true;
    }
    if (surUneEchelle == false) {
      this.enEchelle = false;
    }
    // NOUVEAU : sur l'échelle, on coupe la gravité de ce joueur seulement
    this.player.body.allowGravity = (this.enEchelle == false);

    // ---- Gauche / droite ----
    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-VITESSE_MARCHE);
      this.player.anims.play("anim_tourne_gauche", true);
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(VITESSE_MARCHE);
      this.player.anims.play("anim_tourne_droite", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("anim_face");
    }

    // ---- Vertical : monter / descendre sur l'échelle, sinon sauter ----
    if (this.enEchelle == true) {
      if (this.clavier.up.isDown) {
        this.player.setVelocityY(-VITESSE_ECHELLE);
      } else if (this.clavier.down.isDown) {
        this.player.setVelocityY(VITESSE_ECHELLE);
      } else {
        this.player.setVelocityY(0); // immobile sur l'échelle
      }
    } else if (this.clavier.up.isDown && this.player.body.blocked.down) {
      // avec une tilemap on utilise blocked.down (et non touching.down)
      this.player.setVelocityY(VITESSE_SAUT);
    }

    // ---- Chute dans une fosse : sous le bas de la carte, on recommence ----
    if (this.player.y > HAUTEUR_CARTE + 60) {
      this.mourir();
      return;
    }

    // ---- Touche Espace : porte de retour ou sortie du niveau ----
    if (Phaser.Input.Keyboard.JustDown(this.clavier.space) == true) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        this.scene.switch("selection");
      } else if (this.physics.overlap(this.player, this.zone_sortie)) {
        this.sortirDuNiveau();
      }
    }
  }

  // ==========================================================================
  //  Méthodes du niveau
  // ==========================================================================

  // NOUVEAU : vrai si le joueur est devant une tuile d'échelle.
  // On regarde la tuile au centre du joueur ET celle sous ses pieds, puis on lit la propriété
  // "estEchelle" posée dans Tiled (comme "estSolide", mais pour les échelles).
  estSurEchelle() {
    const corps = this.player.body;
    const tuileCentre = this.calque_echelles.getTileAtWorldXY(corps.center.x, corps.center.y);
    const tuilePieds = this.calque_echelles.getTileAtWorldXY(corps.center.x, corps.bottom - 2);
    return this.tuileEstUneEchelle(tuileCentre) || this.tuileEstUneEchelle(tuilePieds);
  }

  tuileEstUneEchelle(tuile) {
    // getTileAtWorldXY renvoie null s'il n'y a pas de tuile à cet endroit
    return tuile != null && tuile.properties != null && tuile.properties.estEchelle == true;
  }

  // Le joueur ramasse une lampe (même principe que les étoiles du tutoriel)
  ramasserLampe(un_player, une_lampe) {
    une_lampe.disableBody(true, true);
    this.lampesRamassees += 1;
    this.texte_lampes.setText("Lampes : " + this.lampesRamassees + " / " + POSITIONS_LAMPES.length);
  }

  // Sortie par le rideau rouge : possible seulement si on a assez de lampes
  sortirDuNiveau() {
    if (this.lampesRamassees < LAMPES_REQUISES) {
      this.afficherMessage("Il te faut " + LAMPES_REQUISES + " lampes pour ouvrir le rideau !", 2500);
      return;
    }
    this.niveauTermine = true;
    this.player.setVelocity(0, 0);
    this.physics.pause();
    this.afficherMessage("Bravo, niveau terminé !", 2000);
    this.cameras.main.fadeOut(1200); // NOUVEAU : fondu au noir
    this.time.delayedCall(1200, () => {
      this.scene.switch("selection");
    });
  }

  // Mort dans une fosse : le joueur devient rouge, puis le niveau recommence
  mourir() {
    this.estMort = true;
    this.player.setTint(0xff0000);
    this.physics.pause();
    this.cameras.main.fadeOut(600);
    this.time.delayedCall(700, () => {
      this.scene.restart();
    });
  }

  // Affiche un message au centre de l'écran, puis l'efface après "duree" millisecondes
  afficherMessage(texte, duree) {
    this.texte_message.setText(texte);
    this.time.delayedCall(duree, () => {
      this.texte_message.setText("");
    });
  }
}
