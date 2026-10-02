// ============================================================================
//  js/niveau1.js — NIVEAU 1 : LES COULISSES
//
//  Une salle de 2 écrans de large. Objectif : récupérer le FRAGMENT DE PARTITION
//  tout en haut à droite, puis franchir la PORTE DE SORTIE.
//
//  - Cantatrice (J1) : O = tire une onde · P = change de note (Do / Mi / Sol)
//  - Détective (J2)  : T = allume / éteint la lampe · Y = recharge la batterie
//  - Les deux        : flèches ou ZQSD pour marcher, bouton A pour sauter
//  - Solo : le bouton D (K) change de personnage. Duo : chacun son personnage.
//
//  Les touches sont dans controles.js, les chiffres d'équilibrage dans reglages.js.
// ============================================================================

import { REGLAGES } from "./reglages.js";
import { creerPanneau } from "./controles.js";

// ---- Dimensions du niveau ----
const LARGEUR_MONDE = 2560; // 2 écrans de 1280
const HAUTEUR_MONDE = 720;
const Y_SOL = 656; // hauteur du dessus du sol
const ECART_MAX_DUO = 1180; // en duo, les joueurs ne peuvent pas s'éloigner plus que ça (pour rester à l'écran)
const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif';

// Les 3 notes de la Cantatrice (même ordre que les lignes de la planche d'onde)
const NOTES = [
  { nom: "do", texte: "DO", couleur: "#ff6b7d" },
  { nom: "mi", texte: "MI", couleur: "#62b0ff" },
  { nom: "sol", texte: "SOL", couleur: "#ffd24a" }
];

export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  // ==========================================================================
  //  CREATE : on construit le niveau
  // ==========================================================================
  create() {
    // create() est rappelée à chaque (re)lancement : on remet tout à zéro
    this.mode = this.registry.get("mode") || "solo"; // "solo" ou "duo" (choisi dans choix_mode)
    this.fini = false; // vrai quand le niveau est gagné ou perdu
    this.fragmentRecupere = false;
    this.noteActuelle = 0; // 0 = Do, 1 = Mi, 2 = Sol
    this.lampe = { allumee: false, batterie: 100 }; // batterie en %
    this.viesMax = this.mode == "duo" ? REGLAGES.vies.duo : REGLAGES.vies.solo;
    this.vies = this.viesMax; // les cœurs sont partagés entre les deux personnages
    this.messageJusqua = 0;

    // La gravité de CE niveau (les autres scènes du gabarit gardent la leur)
    this.physics.world.gravity.y = REGLAGES.gravite;
    this.physics.world.setBounds(0, 0, LARGEUR_MONDE, HAUTEUR_MONDE);

    this.creerDecor();
    this.creerPlateformes();
    this.creerPersonnages();
    this.creerEnnemis();
    this.creerObjets();
    this.creerCollisions();
    this.creerCamera();
    this.creerInterface();

    this.afficherMessage(this.texteCommandes(), 7000);
  }

  // --------------------------------------------------------------------------
  //  Décor : fond qui défile moins vite que le niveau (effet de profondeur)
  // --------------------------------------------------------------------------
  creerDecor() {
    this.add.image(0, 0, "img_fond_niveau1").setOrigin(0, 0).setScrollFactor(0.5).setDepth(0);
    this.add.image(1280, 0, "img_fond_niveau1").setOrigin(0, 0).setScrollFactor(0.5).setFlipX(true).setDepth(0);

    // Deux panneaux d'indication posés dans le décor
    const style = {
      fontFamily: POLICE,
      fontSize: "14pt",
      color: "#ffe9a8",
      align: "center",
      stroke: "#000000",
      strokeThickness: 4,
      backgroundColor: "#000000aa", // fond sombre semi-transparent pour bien lire sur le décor
      padding: { x: 10, y: 6 }
    };
    this.add.text(1010, 520, "Un TUBA hanté patrouille...\nSaute par-dessus son onde !", style).setOrigin(0.5).setDepth(1);
    this.add.text(1620, 470, "Plateformes fantômes !\nLe Détective doit allumer sa lampe", style).setOrigin(0.5).setDepth(1);
  }

  // --------------------------------------------------------------------------
  //  Plateformes : normales (solides) et fantômes (solides seulement si éclairées)
  // --------------------------------------------------------------------------
  creerPlateformes() {
    this.groupe_plateformes = this.physics.add.staticGroup();
    this.groupe_fantomes = this.physics.add.staticGroup();

    // Le sol, sur toute la largeur
    this.ajouterPlateforme(0, Y_SOL, LARGEUR_MONDE, 64);

    // Plateformes normales : x, y (dessus), largeur
    this.ajouterPlateforme(400, 550, 192); // première marche
    this.ajouterPlateforme(680, 450, 192);
    this.ajouterPlateforme(1080, 550, 140); // ces trois-là permettent de passer au-dessus du Tuba
    this.ajouterPlateforme(1280, 450, 140);
    this.ajouterPlateforme(1480, 550, 140);
    this.ajouterPlateforme(2300, 256, 260); // le balcon du fragment, tout en haut

    // Escalier fantôme qui mène au balcon (invisible sans la lampe du Détective)
    this.ajouterFantome(1700, 566, 128);
    this.ajouterFantome(1850, 476, 128);
    this.ajouterFantome(2000, 386, 128);
    this.ajouterFantome(2150, 296, 128);
  }

  // x, y = coin haut-gauche. Un tileSprite répète la texture de bois sur toute la plateforme.
  ajouterPlateforme(x, y, largeur, hauteur = 32) {
    const plateforme = this.add.tileSprite(x + largeur / 2, y + hauteur / 2, largeur, hauteur, "tex_bois");
    plateforme.setDepth(1);
    this.groupe_plateformes.add(plateforme); // ajouter au groupe statique lui donne un corps solide
  }

  ajouterFantome(x, y, largeur) {
    const plateforme = this.add.tileSprite(x + largeur / 2, y + 16, largeur, 32, "tex_fantome");
    plateforme.setDepth(2).setAlpha(0); // invisible au départ
    plateforme.setData("allumee", false); // éclairée ? (mis à jour à chaque image)
    plateforme.zone = new Phaser.Geom.Rectangle(x, y, largeur, 32); // son rectangle, pour mesurer la distance à la lampe
    this.groupe_fantomes.add(plateforme);
  }

  // --------------------------------------------------------------------------
  //  Personnages : Cantatrice (J1) et Détective (J2)
  // --------------------------------------------------------------------------
  creerPersonnages() {
    const j1 = creerPanneau(this, "j1"); // touches du joueur 1
    const j2 = creerPanneau(this, "j2"); // touches du joueur 2

    // En duo chacun a ses touches. En solo, les deux joysticks fonctionnent pour le perso actif.
    const touchesCantatrice = this.mode == "duo" ? [j1] : [j1, j2];
    const touchesDetective = this.mode == "duo" ? [j2] : [j1, j2];

    this.cantatrice = this.creerPersonnage("cantatrice", 120, touchesCantatrice);
    this.detective = this.creerPersonnage("detective", 200, touchesDetective);
    this.persos = [this.cantatrice, this.detective];
    this.actif = this.cantatrice; // en solo : le personnage qu'on contrôle en ce moment

    this.groupe_ondes = this.physics.add.group({ allowGravity: false }); // ondes de la Cantatrice

    // Halo de lumière de la lampe (additif = il éclaircit ce qu'il recouvre)
    this.halo = this.add.image(0, 0, "tex_lumiere");
    this.halo.setBlendMode(Phaser.BlendModes.ADD).setDepth(15).setVisible(false);
    this.halo.setScale((REGLAGES.lampe.rayon * 2) / 256);
  }

  creerPersonnage(type, x, touches) {
    const perso = this.physics.add.sprite(x, Y_SOL - 40, type + "_idle");
    perso.setDepth(10);
    perso.setCollideWorldBounds(true);
    // Hitbox plus petite que l'image de 64 x 64 : seulement le corps, pieds en bas de l'image
    perso.body.setSize(24, 54, false);
    perso.body.setOffset(20, 9);
    perso.play(type + "_idle");

    perso.nom = type; // "cantatrice" ou "detective"
    perso.touches = touches; // liste des claviers qui le contrôlent
    perso.regardeADroite = true;
    perso.invincibleJusqua = 0; // pas de dégâts avant cet instant (ms)
    perso.sonneJusqua = 0; // choc : pas de contrôle avant cet instant (ms)
    perso.tireJusqua = 0; // animation de tir / d'allumage en cours jusqu'à cet instant (ms)
    perso.dernierTir = -9999;
    return perso;
  }

  // --------------------------------------------------------------------------
  //  Ennemis : 1 Tuba qui patrouille + 3 Cristaux
  // --------------------------------------------------------------------------
  creerEnnemis() {
    this.groupe_tubas = this.physics.add.group();
    this.groupe_cristaux = this.physics.add.group({ allowGravity: false }); // les cristaux flottent
    this.groupe_ondes_ennemies = this.physics.add.group({ allowGravity: false }); // ondes du Tuba

    this.creerTuba(1250, 1050, 1450); // x de départ, limite gauche, limite droite

    this.creerCristal(900, 380);
    this.creerCristal(1600, 300);
    this.creerCristal(2080, 200);
  }

  creerTuba(x, xMin, xMax) {
    const tuba = this.groupe_tubas.create(x, Y_SOL - 40, "tuba_walk");
    tuba.setDepth(9);
    tuba.body.setSize(40, 50, false);
    tuba.body.setOffset(12, 14);
    tuba.play("tuba_walk");
    tuba.xMin = xMin;
    tuba.xMax = xMax;
    tuba.sens = 1; // 1 = vers la droite, -1 = vers la gauche
    tuba.etourdiJusqua = 0;
    tuba.attaqueJusqua = 0;
    tuba.prochaineOnde = this.time.now + REGLAGES.tuba.ondeToutesMs;
  }

  creerCristal(x, y) {
    const cristal = this.groupe_cristaux.create(x, y, "cristal_idle");
    cristal.setDepth(9);
    cristal.setCollideWorldBounds(true);
    cristal.body.setCircle(20, 12, 16); // hitbox ronde
    cristal.play("cristal_idle");
    cristal.pv = REGLAGES.cristal.pv; // points de vie : 2 ondes pour le détruire
    cristal.etourdiJusqua = 0;
    cristal.mort = false;
  }

  // --------------------------------------------------------------------------
  //  Objets : le fragment de partition et la porte de sortie
  // --------------------------------------------------------------------------
  creerObjets() {
    // Le fragment, posé sur le balcon, qui flotte doucement
    this.partition = this.physics.add.image(2430, 208, "img_partition");
    this.partition.setDisplaySize(60, 60).setDepth(6);
    this.partition.body.setAllowGravity(false);
    this.tweens.add({ targets: this.partition, y: 196, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // La porte (image 96 x 120), fermée au début : frame 0
    this.porte = this.physics.add.staticSprite(2470, Y_SOL - 60, "porte_sortie", 0);
    this.porte.setDepth(3);
    this.porteOuverte = false;
  }

  // --------------------------------------------------------------------------
  //  Collisions : qui touche qui
  // --------------------------------------------------------------------------
  creerCollisions() {
    // Les personnages et le Tuba marchent sur les plateformes
    this.physics.add.collider(this.persos, this.groupe_plateformes);
    this.physics.add.collider(this.groupe_tubas, this.groupe_plateformes);

    // Les plateformes fantômes ne sont solides que si elles sont éclairées (3e fonction = condition)
    this.physics.add.collider(this.persos, this.groupe_fantomes, null, function (perso, plateforme) {
      return plateforme.getData("allumee") == true;
    });

    // Les ondes s'arrêtent sur les murs et plateformes
    this.physics.add.collider(this.groupe_ondes, this.groupe_plateformes, function (onde) {
      onde.destroy();
    });
    this.physics.add.collider(this.groupe_ondes_ennemies, this.groupe_plateformes, function (onde) {
      onde.destroy();
    });

    // Onde de la Cantatrice -> ennemi touché ; contact ennemi -> personnage blessé
    [this.groupe_tubas, this.groupe_cristaux].forEach((groupe) => {
      this.physics.add.overlap(this.groupe_ondes, groupe, this.ondeTouche, null, this);
      this.physics.add.overlap(this.persos, groupe, this.contactEnnemi, null, this);
    });
    this.physics.add.overlap(this.persos, this.groupe_ondes_ennemies, this.ondeEnnemieTouche, null, this);

    // Ramasser le fragment, franchir la porte
    this.physics.add.overlap(this.persos, this.partition, this.ramasserFragment, null, this);
    this.physics.add.overlap(this.persos, this.porte, this.franchirPorte, null, this);
  }

  // --------------------------------------------------------------------------
  //  Caméra : solo = suit le perso actif · duo = suit le milieu des deux joueurs
  // --------------------------------------------------------------------------
  creerCamera() {
    this.cameras.main.setBounds(0, 0, LARGEUR_MONDE, HAUTEUR_MONDE);
    // Une "cible" invisible que la caméra suit ; on la déplace à chaque image
    this.cible_camera = this.add.zone(this.cantatrice.x, HAUTEUR_MONDE / 2, 10, 10);
    this.cameras.main.startFollow(this.cible_camera, true, 0.08, 0.08);
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  // --------------------------------------------------------------------------
  //  Interface (fixée à l'écran : setScrollFactor(0)) : cœurs, note, batterie, fragment
  // --------------------------------------------------------------------------
  creerInterface() {
    const fixe = (objet) => objet.setScrollFactor(0).setDepth(100);

    // Cœurs en haut à gauche
    this.coeurs = [];
    for (let i = 0; i < this.viesMax; i++) {
      this.coeurs.push(fixe(this.add.image(32 + i * 36, 30, "tex_coeur")));
    }

    // Note choisie par la Cantatrice
    this.texteNote = fixe(
      this.add.text(18, 56, "", { fontFamily: POLICE, fontSize: "15pt", fontStyle: "bold", stroke: "#000000", strokeThickness: 4 })
    );

    // Batterie de la lampe du Détective
    this.texteLampe = fixe(
      this.add.text(18, 86, "LAMPE", { fontFamily: POLICE, fontSize: "13pt", color: "#ffe9a8", stroke: "#000000", strokeThickness: 4 })
    );
    this.barreBatterie = fixe(this.add.graphics());

    // Fragment de partition en haut à droite
    this.iconeFragment = fixe(this.add.image(1236, 44, "img_partition")).setDisplaySize(54, 54).setTint(0x444444);
    this.texteFragment = fixe(
      this.add
        .text(1200, 44, "0 / 1", { fontFamily: POLICE, fontSize: "16pt", color: "#dfe6ff", stroke: "#000000", strokeThickness: 4 })
        .setOrigin(1, 0.5)
    );

    // Message temporaire au centre en bas
    this.texteMessage = fixe(
      this.add
        .text(640, 676, "", {
          fontFamily: POLICE,
          fontSize: "14pt",
          color: "#ffffff",
          align: "center",
          stroke: "#000000",
          strokeThickness: 5
        })
        .setOrigin(0.5)
    );

    // En solo : une petite flèche dorée au-dessus du personnage qu'on contrôle
    this.fleche = this.add.image(0, 0, "tex_fleche").setDepth(20).setVisible(this.mode == "solo");

    this.majCoeurs();
    this.majNote();
  }

  // ==========================================================================
  //  UPDATE : appelée environ 60 fois par seconde
  // ==========================================================================
  update(temps, delta) {
    if (this.fini == true) {
      return; // niveau gagné ou perdu : on fige le jeu (les animations de fin jouent toutes seules)
    }

    // Solo : le bouton D change de personnage
    if (this.mode == "solo" && this.toucheAppuyee(this.actif, "D")) {
      this.changerDePerso();
    }

    this.persos.forEach((perso) => this.gererPersonnage(perso, temps));
    this.mettreAJourLampe(temps, delta);
    this.actualiserFantomes();

    this.groupe_tubas.getChildren().forEach((tuba) => this.mettreAJourTuba(tuba, temps));
    this.groupe_cristaux.getChildren().forEach((cristal) => this.mettreAJourCristal(cristal, temps));
    this.nettoyerOndes();

    if (this.mode == "duo") {
      this.limiterEcartDuo();
    }
    this.mettreAJourCamera();
    this.mettreAJourInterface(temps);
  }

  // --------------------------------------------------------------------------
  //  Lecture des touches (un perso peut avoir plusieurs claviers : voir creerPersonnages)
  // --------------------------------------------------------------------------
  toucheEnfoncee(perso, bouton) {
    return perso.touches.some((clavier) => clavier[bouton].isDown);
  }

  // Vrai UNE SEULE FOIS par appui (pas tant que la touche reste enfoncée)
  toucheAppuyee(perso, bouton) {
    return perso.touches.map((clavier) => Phaser.Input.Keyboard.JustDown(clavier[bouton])).includes(true);
  }

  // --------------------------------------------------------------------------
  //  Un personnage : déplacement, saut, pouvoir, animation
  // --------------------------------------------------------------------------
  gererPersonnage(perso, temps) {
    // En duo les deux jouent. En solo, seul le personnage actif obéit aux touches.
    const controle = this.mode == "duo" || perso == this.actif;
    const sonne = temps < perso.sonneJusqua; // vient d'être touché : pas de contrôle un court instant
    const aTerre = perso.body.blocked.down || perso.body.touching.down;

    let direction = 0; // -1 gauche, 0 immobile, 1 droite
    if (controle && sonne == false) {
      if (this.toucheEnfoncee(perso, "gauche")) {
        direction = -1;
      } else if (this.toucheEnfoncee(perso, "droite")) {
        direction = 1;
      }
    }

    if (sonne == false) {
      perso.setVelocityX(direction * REGLAGES.vitesse);
    }
    if (direction != 0) {
      perso.regardeADroite = direction > 0;
      perso.setFlipX(direction < 0); // les images regardent vers la droite : on les retourne
    }

    if (controle && sonne == false) {
      // Bouton A : sauter (seulement depuis le sol)
      if (this.toucheAppuyee(perso, "A") && aTerre) {
        perso.setVelocityY(REGLAGES.saut);
      }
      // Pouvoir propre à chaque personnage
      if (perso.nom == "cantatrice") {
        this.pouvoirCantatrice(perso, temps);
      } else {
        this.pouvoirDetective(perso, temps);
      }
    }

    // ---- Quelle animation jouer ? (par ordre de priorité) ----
    let anim = "idle";
    if (sonne) {
      anim = "hurt";
    } else if (temps < perso.tireJusqua) {
      anim = "shoot";
    } else if (aTerre == false) {
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

  // --------------------------------------------------------------------------
  //  Pouvoirs
  // --------------------------------------------------------------------------
  pouvoirCantatrice(perso, temps) {
    // Bouton C : changer de note (Do -> Mi -> Sol -> Do...)
    if (this.toucheAppuyee(perso, "C")) {
      this.noteActuelle = (this.noteActuelle + 1) % NOTES.length;
      this.majNote();
    }
    // Bouton B : chanter une onde (tenir appuyé = une onde toutes les 500 ms)
    if (this.toucheEnfoncee(perso, "B") && temps - perso.dernierTir >= REGLAGES.onde.cadenceMs) {
      perso.dernierTir = temps;
      perso.tireJusqua = temps + 500;
      perso.anims.play("cantatrice_shoot"); // on force le redémarrage de l'animation
      this.lancerOnde(perso);
    }
  }

  lancerOnde(perso) {
    const sens = perso.regardeADroite ? 1 : -1;
    const onde = this.groupe_ondes.create(perso.x + sens * 30, perso.y - 14, "onde");
    onde.setDepth(8);
    onde.setScale(1.5);
    onde.setFlipX(sens < 0);
    onde.play("onde_" + NOTES[this.noteActuelle].nom); // la couleur dépend de la note choisie
    onde.body.setSize(22, 18);
    onde.setVelocityX(sens * REGLAGES.onde.vitesse);
    onde.xDepart = onde.x; // pour savoir quand elle a parcouru sa portée maximale
  }

  pouvoirDetective(perso, temps) {
    // Bouton B : allumer / éteindre la lampe
    if (this.toucheAppuyee(perso, "B")) {
      if (this.lampe.allumee == true) {
        this.lampe.allumee = false;
      } else if (this.lampe.batterie > 0) {
        this.lampe.allumee = true;
        perso.tireJusqua = temps + 500;
        perso.anims.play("detective_shoot"); // le faisceau de la lampe apparaît dans l'animation
      } else {
        this.afficherMessage("Batterie vide ! Appuie sur le bouton C pour recharger", 2500);
      }
    }
    // Bouton C : recharger la batterie (appuis répétés)
    if (this.toucheAppuyee(perso, "C")) {
      this.lampe.batterie = Math.min(100, this.lampe.batterie + REGLAGES.lampe.rechargeParAppui);
    }
  }

  // La batterie se vide tant que la lampe est allumée (même si on joue l'autre personnage)
  mettreAJourLampe(temps, delta) {
    const lampe = this.lampe;
    if (lampe.allumee == true) {
      lampe.batterie -= (delta / 1000) * (100 / REGLAGES.lampe.batterieSec);
      if (lampe.batterie <= 0) {
        lampe.batterie = 0;
        lampe.allumee = false;
      }
    }
    // Le halo suit le Détective
    this.halo.setPosition(this.detective.body.center.x, this.detective.body.center.y);
    this.halo.setVisible(lampe.allumee);
    if (lampe.allumee == true) {
      const faible = lampe.batterie <= REGLAGES.lampe.seuilClignote;
      // batterie faible : le halo clignote
      this.halo.setAlpha(faible && Math.floor(temps / 120) % 2 == 0 ? 0.3 : 1);
    }
  }

  // Une plateforme fantôme est visible + solide si la lampe est allumée ET que son
  // point le plus proche du Détective est dans le cercle de lumière.
  actualiserFantomes() {
    const centre = this.detective.body.center;
    this.groupe_fantomes.getChildren().forEach((plateforme) => {
      let eclairee = false;
      if (this.lampe.allumee == true) {
        const zone = plateforme.zone;
        const xProche = Phaser.Math.Clamp(centre.x, zone.left, zone.right);
        const yProche = Phaser.Math.Clamp(centre.y, zone.top, zone.bottom);
        eclairee = Phaser.Math.Distance.Between(centre.x, centre.y, xProche, yProche) <= REGLAGES.lampe.rayon;
      }
      plateforme.setData("allumee", eclairee);
      plateforme.setAlpha(eclairee ? 1 : 0);
    });
  }

  // --------------------------------------------------------------------------
  //  Solo : changer de personnage
  // --------------------------------------------------------------------------
  changerDePerso() {
    this.actif = this.actif == this.cantatrice ? this.detective : this.cantatrice;
    // petit flash blanc pour montrer qui est actif maintenant
    const nouveau = this.actif;
    nouveau.setTintFill(0xffffff);
    this.time.delayedCall(120, () => nouveau.clearTint());
  }

  // --------------------------------------------------------------------------
  //  Ennemis
  // --------------------------------------------------------------------------
  mettreAJourTuba(tuba, temps) {
    if (tuba.active == false) {
      return;
    }
    // Étourdi par une onde : il ne bouge plus et n'attaque plus
    if (temps < tuba.etourdiJusqua) {
      tuba.setVelocityX(0);
      tuba.setTint(0x8899ff);
      this.jouerAnimation(tuba, "tuba_idle");
      return;
    }
    tuba.clearTint();

    // Pendant son attaque il reste sur place
    if (temps < tuba.attaqueJusqua) {
      tuba.setVelocityX(0);
      return;
    }

    // Patrouille : il fait des allers-retours entre xMin et xMax
    if (tuba.x <= tuba.xMin) {
      tuba.sens = 1;
    } else if (tuba.x >= tuba.xMax) {
      tuba.sens = -1;
    }
    tuba.setVelocityX(tuba.sens * REGLAGES.tuba.vitesse);
    tuba.setFlipX(tuba.sens < 0);
    this.jouerAnimation(tuba, "tuba_walk");

    // Toutes les 3 secondes il lance une onde, mais seulement si un joueur est proche
    if (temps >= tuba.prochaineOnde && Math.abs(tuba.x - this.persoLePlusProche(tuba).x) < 650) {
      tuba.prochaineOnde = temps + REGLAGES.tuba.ondeToutesMs;
      tuba.attaqueJusqua = temps + 700;
      tuba.anims.play("tuba_attack");
      // l'onde part au milieu de l'animation
      this.time.delayedCall(400, () => {
        if (tuba.active && this.time.now >= tuba.etourdiJusqua) {
          this.lancerOndeTuba(tuba);
        }
      });
    }
  }

  lancerOndeTuba(tuba) {
    const sens = tuba.flipX ? -1 : 1;
    const onde = this.groupe_ondes_ennemies.create(tuba.x + sens * 36, tuba.y - 6, "onde");
    onde.setDepth(8);
    onde.setScale(1.6);
    onde.setFlipX(sens < 0);
    onde.setTint(0xb066ff); // violette, pour ne pas la confondre avec celles de la Cantatrice
    onde.play("onde_mi");
    onde.body.setSize(22, 18);
    onde.setVelocityX(sens * REGLAGES.tuba.vitesseOnde);
    onde.xDepart = onde.x;
  }

  // Le cristal flotte vers le joueur le plus proche, s'il est assez près
  mettreAJourCristal(cristal, temps) {
    if (cristal.mort == true) {
      return;
    }
    if (temps < cristal.etourdiJusqua) {
      cristal.setVelocity(0, 0);
      cristal.setTint(0x8899ff);
      return;
    }
    cristal.clearTint();

    const cible = this.persoLePlusProche(cristal);
    const distance = Phaser.Math.Distance.Between(cristal.x, cristal.y, cible.x, cible.y);
    if (distance < REGLAGES.cristal.detectionPx) {
      this.physics.moveToObject(cristal, cible, REGLAGES.cristal.vitesse);
    } else {
      cristal.setVelocity(0, 0);
    }
  }

  persoLePlusProche(ennemi) {
    const distCantatrice = Phaser.Math.Distance.Between(ennemi.x, ennemi.y, this.cantatrice.x, this.cantatrice.y);
    const distDetective = Phaser.Math.Distance.Between(ennemi.x, ennemi.y, this.detective.x, this.detective.y);
    return distCantatrice <= distDetective ? this.cantatrice : this.detective;
  }

  etourdir(ennemi, dureeMs) {
    ennemi.etourdiJusqua = this.time.now + dureeMs;
  }

  // Une onde de la Cantatrice touche un ennemi
  ondeTouche(onde, ennemi) {
    if (ennemi.mort == true) {
      return;
    }
    onde.destroy();
    if (ennemi.pv !== undefined) {
      this.blesserCristal(ennemi); // le cristal perd un point de vie
    } else {
      this.etourdir(ennemi, REGLAGES.onde.etourdissementMs); // le tuba est étourdi
    }
  }

  blesserCristal(cristal) {
    cristal.pv -= 1;
    if (cristal.pv <= 0) {
      cristal.mort = true;
      cristal.body.enable = false; // il ne touche plus personne
      cristal.clearTint();
      cristal.anims.play("cristal_death");
      cristal.once("animationcomplete", () => cristal.destroy());
    } else {
      this.etourdir(cristal, REGLAGES.onde.etourdissementMs);
    }
  }

  // Les ondes de la Cantatrice disparaissent après leur portée maximale
  nettoyerOndes() {
    this.groupe_ondes.getChildren().slice().forEach((onde) => {
      if (Math.abs(onde.x - onde.xDepart) > REGLAGES.onde.portee) {
        onde.destroy();
      }
    });
    this.groupe_ondes_ennemies.getChildren().slice().forEach((onde) => {
      if (Math.abs(onde.x - onde.xDepart) > REGLAGES.tuba.porteeOnde) {
        onde.destroy();
      }
    });
  }

  // --------------------------------------------------------------------------
  //  Dégâts et cœurs
  // --------------------------------------------------------------------------
  // Un ennemi touche un personnage (sauf s'il est étourdi ou détruit)
  contactEnnemi(perso, ennemi) {
    if (ennemi.mort == true || this.time.now < ennemi.etourdiJusqua) {
      return;
    }
    this.blesser(perso, ennemi.x);
  }

  ondeEnnemieTouche(perso, onde) {
    onde.destroy();
    this.blesser(perso, onde.x);
  }

  // sourceX = d'où vient le coup (pour savoir de quel côté repousser le personnage)
  blesser(perso, sourceX) {
    const temps = this.time.now;
    if (this.fini == true || temps < perso.invincibleJusqua) {
      return; // invincible 1,5 s après un coup
    }
    this.vies -= 1;
    this.majCoeurs();
    perso.invincibleJusqua = temps + REGLAGES.vies.invincibiliteMs;

    if (this.vies <= 0) {
      this.perdre();
      return;
    }

    // Recul + animation "hurt"
    const sens = perso.x < sourceX ? -1 : 1;
    perso.sonneJusqua = temps + REGLAGES.recul.dureeMs;
    perso.setVelocity(sens * REGLAGES.recul.x, REGLAGES.recul.y);
    perso.anims.play(perso.nom + "_hurt");

    // Le personnage clignote pendant toute la durée d'invincibilité
    this.tweens.add({
      targets: perso,
      alpha: 0.35,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(REGLAGES.vies.invincibiliteMs / 200) - 1,
      onComplete: () => perso.setAlpha(1)
    });
  }

  // Plus de cœur : on joue l'animation de mort, puis écran Game Over
  perdre() {
    this.fini = true;
    this.persos.forEach((perso) => {
      perso.setVelocityX(0);
      perso.setAlpha(1);
      perso.anims.play(perso.nom + "_death");
    });
    this.halo.setVisible(false);
    this.time.delayedCall(1700, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("gameover");
      });
    });
  }

  // --------------------------------------------------------------------------
  //  Fragment et porte
  // --------------------------------------------------------------------------
  ramasserFragment(perso, partition) {
    if (this.fragmentRecupere == true) {
      return;
    }
    this.fragmentRecupere = true;
    partition.disableBody(true, true); // le fragment disparaît
    this.porteOuverte = true;
    this.porte.anims.play("porte_ouvre"); // la porte s'ouvre
    this.iconeFragment.clearTint();
    this.texteFragment.setText("1 / 1");
    this.afficherMessage("Fragment de partition récupéré ! La porte de sortie est ouverte.", 4000);
  }

  franchirPorte() {
    if (this.porteOuverte == false || this.fini == true) {
      return;
    }
    this.fini = true;
    this.persos.forEach((perso) => {
      perso.setVelocity(0, 0);
      this.jouerAnimation(perso, perso.nom + "_idle");
    });
    this.physics.pause();
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("niveau_termine");
    });
  }

  // --------------------------------------------------------------------------
  //  Caméra
  // --------------------------------------------------------------------------
  // Duo : un joueur ne peut pas s'éloigner de l'autre de plus de ECART_MAX_DUO pixels,
  // pour que la caméra puisse toujours cadrer les deux.
  limiterEcartDuo() {
    const c = this.cantatrice;
    const d = this.detective;
    const ecart = c.x - d.x;
    if (Math.abs(ecart) <= ECART_MAX_DUO) {
      return;
    }
    const sens = Math.sign(ecart); // de quel côté se trouve la Cantatrice
    // celui qui s'éloigne encore est bloqué
    if (c.body.velocity.x * sens > 0) {
      c.x = d.x + sens * ECART_MAX_DUO;
      c.setVelocityX(0);
    }
    if (d.body.velocity.x * -sens > 0) {
      d.x = c.x - sens * ECART_MAX_DUO;
      d.setVelocityX(0);
    }
  }

  mettreAJourCamera() {
    let x;
    if (this.mode == "solo") {
      x = this.actif.x;
    } else {
      x = (this.cantatrice.x + this.detective.x) / 2;
    }
    this.cible_camera.setPosition(x, HAUTEUR_MONDE / 2);
  }

  // --------------------------------------------------------------------------
  //  Interface
  // --------------------------------------------------------------------------
  majCoeurs() {
    this.coeurs.forEach((coeur, i) => {
      coeur.setTexture(i < this.vies ? "tex_coeur" : "tex_coeur_vide");
    });
  }

  majNote() {
    const note = NOTES[this.noteActuelle];
    this.texteNote.setText("Onde : " + note.texte).setColor(note.couleur);
  }

  mettreAJourInterface(temps) {
    // Barre de batterie : verte, puis rouge quand elle est faible
    const faible = this.lampe.batterie <= REGLAGES.lampe.seuilClignote;
    this.barreBatterie.clear();
    this.barreBatterie.fillStyle(0x000000, 0.6).fillRect(104, 88, 154, 18);
    this.barreBatterie.fillStyle(faible ? 0xff4a4a : 0xffd24a).fillRect(106, 90, 150 * (this.lampe.batterie / 100), 14);
    this.barreBatterie.lineStyle(2, 0xf5d97a).strokeRect(104, 88, 154, 18);

    // Solo : on met en avant les informations du personnage actif
    if (this.mode == "solo") {
      this.texteNote.setAlpha(this.actif == this.cantatrice ? 1 : 0.45);
      this.texteLampe.setAlpha(this.actif == this.detective ? 1 : 0.45);
      this.barreBatterie.setAlpha(this.actif == this.detective ? 1 : 0.45);
      this.fleche.setPosition(this.actif.x, this.actif.y - 46 + Math.sin(temps / 150) * 4);
    }

    // Le message temporaire s'efface quand son temps est écoulé
    if (temps > this.messageJusqua) {
      this.texteMessage.setText("");
    }
  }

  afficherMessage(texte, dureeMs) {
    this.texteMessage.setText(texte);
    this.messageJusqua = this.time.now + dureeMs;
  }

  texteCommandes() {
    if (this.mode == "duo") {
      return "J1 Cantatrice : flèches · I saut · O onde · P note\nJ2 Détective : ZQSD · R saut · T lampe · Y recharge";
    }
    return "Flèches · I saut · O onde / lampe · P note / recharge · K changer de personnage";
  }
}
