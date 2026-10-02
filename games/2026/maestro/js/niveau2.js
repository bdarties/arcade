// ============================================================================
//  js/niveau2.js — NIVEAU 2 : LES OMBRES CHINOISES (carte Tiled)
//
//  ÉTAPE 1 : la carte, la Cantatrice qui marche et saute, la caméra.
//  (Les étapes suivantes ajoutent : le Détective, les cœurs, les échelles,
//   les pouvoirs, les ennemis, la sortie.)
//
//  Commandes : flèches (ou ZQSD) pour marcher, bouton A (I ou R) pour sauter.
// ============================================================================

import { REGLAGES } from "./reglages.js";
import { creerPanneau } from "./controles.js";

const LARGEUR_MONDE = 2176; // 68 tuiles x 32 px
const HAUTEUR_MONDE = 736; // 23 tuiles x 32 px

export default class niveau2 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau2" });
  }

  // --------------------------------------------------------------------------
  //  PRELOAD : le fond, l'image des tuiles et la carte créée avec Tiled
  // --------------------------------------------------------------------------
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("fond_niveau2", "./assets/map2_sombre.jpg");
    this.load.image("tuiles_niveau2", "./assets/tilesetmap2.png");
    this.load.tilemapTiledJSON("carte_niveau2", "./assets/map2maestro.json");
  }

  // --------------------------------------------------------------------------
  //  CREATE : on construit le niveau
  // --------------------------------------------------------------------------
  create() {
    // create() est rappelée à chaque (re)lancement : on remet tout à zéro
    this.fini = false;

    // La gravité de CE niveau
    this.physics.world.gravity.y = REGLAGES.gravite;
    this.physics.world.setBounds(0, 0, LARGEUR_MONDE, HAUTEUR_MONDE);
    // (gauche, droite, haut, bas) : le bas du monde ne bloque pas, on peut tomber dans la fosse
    this.physics.world.setBoundsCollision(true, true, true, false);

    this.creerCarte();
    this.creerPersonnages();
    this.creerCamera();
  }

  // --------------------------------------------------------------------------
  //  La carte : fond + calques Tiled (les noms doivent être ceux de Tiled)
  // --------------------------------------------------------------------------
  creerCarte() {
    // Le fond, étiré à la taille exacte de la carte
    this.add.image(0, 0, "fond_niveau2").setOrigin(0, 0).setDisplaySize(LARGEUR_MONDE, HAUTEUR_MONDE);

    this.carte = this.add.tilemap("carte_niveau2");
    // 1er nom = le nom du tileset dans Tiled, 2e nom = la clé de l'image chargée dans preload
    const tileset = this.carte.addTilesetImage("tileset_maestro", "tuiles_niveau2");

    // Les calques, du plus loin au plus proche
    this.carte.createLayer("calque_background", tileset);
    this.carte.createLayer("calque_background2", tileset);
    this.carte.createLayer("calque_background2_bis", tileset);
    this.carte.createLayer("Calque_deco", tileset);
    this.carte.createLayer("Calque_deco_bis", tileset);
    this.carte.createLayer("Calque_deco_ter", tileset);
    this.calque_plateformes = this.carte.createLayer("calque_plateformes", tileset);

    // Seules les tuiles marquées estSolide = true dans Tiled bloquent les personnages
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });

    // Le point de départ est un rectangle dessiné dans le calque d'objets "objets" de Tiled
    this.pointDepart = this.carte.findObject("objets", function (objet) {
      return objet.name === "depart";
    });
  }

  // --------------------------------------------------------------------------
  //  Le personnage (pour l'instant : seulement la Cantatrice)
  // --------------------------------------------------------------------------
  creerPersonnages() {
    const j1 = creerPanneau(this, "j1"); // touches du joueur 1
    const j2 = creerPanneau(this, "j2"); // touches du joueur 2

    this.cantatrice = this.creerPersonnage("cantatrice", [j1, j2]);
    this.physics.add.collider(this.cantatrice, this.calque_plateformes);
  }

  creerPersonnage(nom, touches) {
    const perso = this.physics.add.sprite(this.pointDepart.x + 20, this.pointDepart.y, nom + "_idle");
    perso.setDepth(10);
    perso.setCollideWorldBounds(true);
    // Hitbox plus petite que l'image de 64 x 64 : seulement le corps, pieds en bas de l'image
    perso.body.setSize(24, 54, false);
    perso.body.setOffset(20, 9);
    perso.play(nom + "_idle");

    perso.nom = nom; // "cantatrice" ou "detective"
    perso.touches = touches; // liste des claviers qui le contrôlent
    perso.regardeADroite = true;
    return perso;
  }

  // --------------------------------------------------------------------------
  //  Caméra : elle suit le personnage sans sortir de la carte
  // --------------------------------------------------------------------------
  creerCamera() {
    this.cameras.main.setBounds(0, 0, LARGEUR_MONDE, HAUTEUR_MONDE);
    this.cameras.main.startFollow(this.cantatrice, true, 0.08, 0.08);
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  // ==========================================================================
  //  UPDATE : appelée environ 60 fois par seconde
  // ==========================================================================
  update() {
    if (this.fini == true) {
      return;
    }
    this.gererPersonnage(this.cantatrice);

    // Tombé dans la fosse (sous le bas de la carte) : retour au départ
    // (à l'étape 3, cette chute fera perdre un cœur)
    if (this.cantatrice.y > HAUTEUR_MONDE + 80) {
      this.cantatrice.setPosition(this.pointDepart.x + 20, this.pointDepart.y);
      this.cantatrice.setVelocity(0, 0);
    }
  }

  // --------------------------------------------------------------------------
  //  Lecture des touches (un perso peut avoir plusieurs claviers)
  // --------------------------------------------------------------------------
  toucheEnfoncee(perso, bouton) {
    return perso.touches.some((clavier) => clavier[bouton].isDown);
  }

  // Vrai UNE SEULE FOIS par appui (pas tant que la touche reste enfoncée)
  toucheAppuyee(perso, bouton) {
    return perso.touches.map((clavier) => Phaser.Input.Keyboard.JustDown(clavier[bouton])).includes(true);
  }

  // --------------------------------------------------------------------------
  //  Déplacement, saut et animation d'un personnage
  // --------------------------------------------------------------------------
  gererPersonnage(perso) {
    const aTerre = perso.body.blocked.down || perso.body.touching.down;

    let direction = 0; // -1 gauche, 0 immobile, 1 droite
    if (this.toucheEnfoncee(perso, "gauche")) {
      direction = -1;
    } else if (this.toucheEnfoncee(perso, "droite")) {
      direction = 1;
    }
    perso.setVelocityX(direction * REGLAGES.vitesse);
    if (direction != 0) {
      perso.regardeADroite = direction > 0;
      perso.setFlipX(direction < 0); // les images regardent vers la droite : on les retourne
    }

    // Bouton A : sauter (seulement depuis le sol)
    if (this.toucheAppuyee(perso, "A") && aTerre) {
      perso.setVelocityY(REGLAGES.saut);
    }

    // Quelle animation jouer ?
    let anim = "idle";
    if (aTerre == false) {
      anim = "jump";
    } else if (direction != 0) {
      anim = "walk";
    }
    this.jouerAnimation(perso, perso.nom + "_" + anim);
  }

  // Lance l'animation seulement si ce n'est pas déjà celle qui joue (sinon elle recommencerait sans cesse)
  jouerAnimation(sprite, cle) {
    if (sprite.anims.currentAnim == null || sprite.anims.currentAnim.key != cle) {
      sprite.anims.play(cle);
    }
  }
}
