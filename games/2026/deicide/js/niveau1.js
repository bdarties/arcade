import * as fct from "./fonctions.js";
import { chargerPersonnage, creerAnimationsPersonnage, creerPersonnage, majPersonnage } from "./Personnage/personnage.js";
import { chargerHud, creerHud } from "./Personnage/hud.js";
import * as ennemis from "./ennemis.js";
import * as lumiere from "./lumiere.js";
import { chargerSons, jouerSon, musiqueDeScene } from "./sons.js"; // bruitages et musique
import * as effets from "./effets.js"; // tremblements, flashs, éclats et alertes
import { figerCalques } from "./optimisation.js"; // décor dessiné une seule fois (optimisation pour la borne)

// charge tous les assets du jeu (le cache est partagé entre les scènes). Le menu l'appelle dans son preload, avec une barre de
// chargement : quand on clique sur Jouer tout est déjà chargé. Le preload du niveau 1 le rappelle, mais il n'a plus rien à charger.
export function chargerJeu(scene) {
    scene.load.setBaseURL(scene.sys.game.config.baseURL); // chemin du jeu, pour que les assets se chargent aussi depuis la borne
    scene.load.image("img_ciel", "./assets/sky.png"); // fond des niveaux 2 et 3
    scene.load.image("img_plateforme", "./assets/platform.png"); // plateformes des niveaux 2 et 3
    scene.load.image("img_porte2", "./assets/door2.png"); // porte du niveau 2
    scene.load.image("img_porte3", "./assets/door3.png"); // porte du niveau 3
    chargerPersonnage(scene); // images du robot
    chargerHud(scene); // images du HUD
    scene.load.tilemapTiledJSON("carte_niveau1", "./assets/maps/niveau1.json"); // map du niveau 1 exportée depuis Tiled
    scene.load.image("tuiles_dawn", "./assets/maps/dawn_of_the_gods_ombre.png"); // tileset principal de la map
    scene.load.image("tuile_blanc", "./assets/maps/blanc.png"); // tuile blanche de la map
    ennemis.chargerEnnemis(scene); // images des ennemis
    chargerSons(scene); // bruitages et musique
}

export default class niveau1 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau1" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }
  preload() { // tous les assets sont normalement déjà chargés par le menu (voir menu.js) ; sinon ils se chargent ici
    chargerJeu(this);
  }

  create() {
    fct.doNothing();
    fct.doAlsoNothing();
    creerAnimationsPersonnage(this); // animations du robot (une seule fois, elles servent aussi aux niveaux 2 et 3)
    ennemis.creerAnimationsEnnemis(this); // animations des archers, des mages, des orcs et des flèches

    // la map Tiled : 40 x 200 tuiles de 32 px = 1280 x 6400 px, on part d'en bas
    const carte = this.make.tilemap({ key: "carte_niveau1" });
    // le 1er nom est celui du tileset dans Tiled, le 2e la clé de l'image chargée dans preload()
    const tuilesDawn = carte.addTilesetImage("dawn_of_the_gods_ombre", "tuiles_dawn");
    const tuileBlanc = carte.addTilesetImage("white", "tuile_blanc");
    const tilesets = [tuilesDawn, tuileBlanc];
    const calqueFond = carte.createLayer("Background and background", tilesets);
    const calqueDecor = carte.createLayer("Background", tilesets);
    const calqueGameplay = carte.createLayer("Gameplay", tilesets);
    // seules les tuiles du calque Gameplay qui ont la propriété "colision" dans Tiled sont solides
    calqueGameplay.setCollisionByProperty({ colision: true });
    // personnage.js arrête les balles sur groupe_plateformes : ici c'est le calque Gameplay
    this.groupe_plateformes = calqueGameplay;
    // optimisation pour la borne : le décor est dessiné une seule fois dans des images au lieu de 1 200 tuiles à chaque image (voir optimisation.js)
    this.bandesDecor = figerCalques(this, [calqueFond, calqueDecor, calqueGameplay], carte.widthInPixels, carte.heightInPixels);

    // le monde et la caméra prennent la taille de la map (sinon le joueur reste bloqué dans le 1er écran)
    this.physics.world.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
    this.cameras.main.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
    this.cameras.main.setBackgroundColor("#3a3a3a");

    this.player = creerPersonnage(this, 200, 6300);
    this.player.refreshBody();
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.clavier = this.input.keyboard.createCursorKeys();
    this.physics.add.collider(this.player, this.groupe_plateformes);
    // la caméra suit le joueur pendant qu'il monte
    this.cameras.main.startFollow(this.player);
    this.pv = 5; // PV du joueur
    this.hud = creerHud(this, this.player, this.pv); // HUD : barre de vie, vies et jauge de dash

    // tirs du joueur (personnage.js les y range) et ennemis
    this.tirsJoueur = this.physics.add.group({ allowGravity: false });
    this.ennemis = this.physics.add.group();
    this.physics.add.collider(this.ennemis, this.groupe_plateformes);
    // un archer sur chaque point du calque d'objets "archer" de Tiled (le point = ses pieds, on le pose un peu au-dessus et il tombe sur le sol)
    carte.getObjectLayer("archer").objects.forEach(point => ennemis.creerArcher(this, point.x, point.y - 40));
    this.physics.add.overlap(this.tirsJoueur, this.ennemis, (tir, ennemi) => ennemis.toucherEnnemi(this, tir, ennemi));
    this.tirsEnnemis = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.player, this.tirsEnnemis, (joueur, fleche) => {
      fleche.destroy();
      this.blesserJoueur(1, "Abattu par un archer");
    });
    this.physics.add.collider(this.tirsEnnemis, this.groupe_plateformes, (tir) => { // un tir ennemi qui touche un mur disparait
      if (tir.texture.key === "fleche") jouerSon(this, "fleche_mur"); // seule la flèche fait un bruit de bois en se plantant
      tir.destroy();
    });
    // lumière : zones qui brûlent le joueur et lanternes qu'on éteint en tirant dessus
    this.zonesLumiere = this.physics.add.staticGroup(); // groupe des zones de lumière (dégâts)
    this.prochainDegatLumiere = 0; // instant à partir duquel la lumière peut de nouveau blesser le joueur
    lumiere.creerTextureHalo(this); // dessine la texture du halo avant de poser les lumières
    carte.getObjectLayer("lumière").objects.forEach(point => lumiere.creerZoneRonde(this, point.x, point.y, 100)); // une zone de lumière sur chaque point du calque "lumière" de Tiled
    this.lanternes = this.physics.add.staticGroup(); // groupe des lanternes
    carte.getObjectLayer("lanterne").objects.forEach(point => lumiere.creerLanterne(this, point.x, point.y, 90)); // une lanterne sur chaque point du calque "lanterne" de Tiled
    this.physics.add.overlap(this.tirsJoueur, this.lanternes, (tir, lanterne) => lumiere.eteindreLanterne(this, tir, lanterne)); // un tir éteint la lanterne
    lumiere.creerVoile(this);
    musiqueDeScene(this, "musique_niveau"); // lance la musique du niveau, et la relance quand on revient dans le niveau // voile d'obscurité, créé en dernier
    carte.getObjectLayer("mage").objects.forEach(point => ennemis.creerMage(this, point.x, point.y - 50)); // crée un mage sur chaque point du calque "mage" de Tiled, un peu au-dessus
    carte.getObjectLayer("orc").objects.forEach(point => ennemis.creerOrc(this, point.x, point.y - 60)); // crée un orc sur chaque point du calque "orc" de Tiled, un peu au-dessus
  }

  update() {
    lumiere.majLumiere(this); // vérifie si le joueur est dans la lumière et le brûle
    majPersonnage(this.player, this.clavier);
    ennemis.majEnnemis(this);

    lumiere.majVoile(this);
  }

  blesserJoueur(degats, cause) {
    this.pv -= degats;
    this.hud.majPV(this.pv); // met la barre de vie à jour
    jouerSon(this, this.pv <= 0 ? "joueur_mort" : "joueur_touche"); // bruit de mort si plus de PV, sinon bruit d'impact
    effets.joueurTouche(this); // tremblement, écran rouge et robot qui clignote
    console.log(cause);
  }
}
