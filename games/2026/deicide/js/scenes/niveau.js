// niveau.js : la classe de base de tous les niveaux (niveau 1, niveau 2, arène du dernier combat).
// Elle crée la carte Tiled, le robot, les ennemis, la lumière, l'interface, la musique ; elle gère les dégâts du robot et sa mort.
// Chaque niveau (niveau1.js, niveau2.js, niveau3.js) hérite de cette classe et lui donne une CONFIG, c'est-à-dire ce qui change d'un niveau
// à l'autre :
//   carte          : la clé de la map Tiled (chargée dans chargement.js)
//   depart         : { x, y } où apparaît le robot (utilisé seulement si la map n'a pas de calque d'objets "depart")
//   musique        : la musique du niveau ; volumeMusique : son volume de base (facultatif)
//   salles         : les salles de combat fermées (voir mecanismes/salles.js), [] s'il n'y en a pas
//   arene          : une fonction appelée à chaque image, propre au niveau (ferme l'arène du boss, vérifie la sortie, la poursuite...)
//   creer          : une fonction appelée une fois à la fin du create (facultative)
//   fondVide       : la couleur de la map là où il n'y a rien (facultative, gris par défaut)
//   teleportBoss   : { x, y } où la touche de test F8 téléporte le robot
import { creerPersonnage, creerAnimationsPersonnage, majPersonnage, jouerAction } from "../personnage/personnage.js";
import { creerHud } from "../personnage/hud.js";
import * as ennemis from "../ennemis/ennemis.js";
import * as lumiere from "../mecanismes/lumiere.js";
import { jouerSon, musiqueDeScene } from "../systemes/sons.js"; // bruitages et musique
import * as effets from "../systemes/effets.js"; // tremblements, flashs, éclats et alertes
// décor dessiné une seule fois, ennemis lointains endormis (optimisations pour la borne)
import { figerCalques, endormirLesLoins } from "../systemes/optimisation.js";
import { chargerJeu, objetsDe } from "../systemes/chargement.js";
import { preparerSalles, verifierSalles } from "../mecanismes/salles.js"; // salles de combat fermées
import { preparerPause } from "./pause.js"; // menu pause (Échap ou X) : réglages et crédits
import { preparerBonus } from "../mecanismes/bonus.js"; // les PV que lâchent les ennemis
import { preparerBoost } from "../mecanismes/boost.js"; // le boost du robot (rafale, vitesse, reflet)
import { preparerLanternesVivantes } from "../ennemis/lanterneVivante.js"; // les lanternes ailées qui donnent le boost

const PV_DEPART = 5; // PV du robot au début d'un niveau
const DUREE_GRACE = 2500; // ms d'invincibilité quand le niveau (re)commence : réapparaître ne doit pas coûter un PV tout de suite
const DUREE_INVINCIBLE = 1000; // ms d'invincibilité du robot après un coup

export default class niveau extends Phaser.Scene {
  constructor(cle, config) { // la clé de la scène ("niveau1"...) et la config du niveau (voir plus haut)
    super({ key: cle });
    this.cfg = config;
  }

  preload() { // tous les assets sont normalement déjà chargés par le menu (voir menu.js) ; sinon ils se chargent ici
    chargerJeu(this);
  }

  // Le create suit toujours le même ordre : les étapes plus bas ont besoin de ce que les précédentes ont créé.
  create() {
    creerAnimationsPersonnage(this); // animations du robot (une seule fois, elles servent à tous les niveaux)
    ennemis.creerAnimationsEnnemis(this); // animations des archers, des mages, des orcs et des flèches
    const carte = this.creerCarte(); // la carte Tiled, les collisions, la caméra
    this.creerRobot(carte); // le robot, son interface, la caméra qui le suit
    this.creerEnnemisEtTirs(carte); // les archers, et les tirs du robot et des ennemis
    this.creerLumieres(carte); // les zones de lumière qui brûlent, les lanternes, le voile d'obscurité
    musiqueDeScene(this, this.cfg.musique, this.cfg.volumeMusique); // lance la musique du niveau, et la relance quand on revient dans le niveau
    // crée un mage sur chaque point du calque "mage" de Tiled, un peu au-dessus
    objetsDe(carte, "mage").forEach(point => ennemis.creerMage(this, point.x, point.y - 50));
    // crée un orc sur chaque point du calque "orc" de Tiled, un peu au-dessus
    objetsDe(carte, "orc").forEach(point => ennemis.creerOrc(this, point.x, point.y - 60));
    this.remettreAZero(); // la scène est réutilisée à chaque nouvelle partie ou après une mort : on remet son état à zéro
    preparerBonus(this); // le groupe des PV que lâchent les ennemis (30 % de chances à chaque ennemi tué)
    preparerBoost(this); // le boost du robot (donné quand il abat une lanterne vivante)
    preparerLanternesVivantes(this); // une lanterne vivante toutes les 15 secondes, qui vole vers le robot
    endormirLesLoins(this); // les ennemis loin du joueur s'endorment (optimisation pour la borne)
    preparerSalles(this, this.cfg.salles); // les salles de combat fermées (voir salles.js)
    if (this.cfg.creer) this.cfg.creer(this); // ce qui est propre à ce niveau (vide, faisceaux, poursuite...)
    preparerPause(this); // Échap ou X ouvre le menu pause
    // fabrique d'avance les « ! », « ? », « +100 » et les éclats (optimisation pour la borne : pas d'à-coup quand ils apparaissent)
    effets.preparerEffets(this);
  }

  // La carte : les calques de tuiles, les collisions, la taille du monde et de la caméra. Renvoie la carte (les points d'apparition en sont
  // lus plus bas).
  creerCarte() {
    const carte = this.make.tilemap({ key: this.cfg.carte });
    // le 1er nom est celui du tileset dans Tiled, le 2e la clé de l'image chargée dans chargement.js
    const tuilesDawn = carte.addTilesetImage("dawn_of_the_gods_ombre", "tuiles_dawn");
    const tuileBlanc = carte.addTilesetImage("white", "tuile_blanc");
    const tilesets = [tuilesDawn, tuileBlanc];
    this.carte = carte; // on garde la map dans la scène, pour que les mécanismes (arene.js, salles.js) puissent y ajouter des tuiles
    this.tilesets = tilesets; // pareil pour les tilesets, nécessaires pour créer un nouveau calque
    const calqueFond = carte.createLayer("Background and background", tilesets);
    const calqueDecor = carte.createLayer("Background", tilesets);
    const calqueGameplay = carte.createLayer("Gameplay", tilesets);
    // seules les tuiles du calque Gameplay qui ont la propriété "colision" dans Tiled sont solides
    calqueGameplay.setCollisionByProperty({ colision: true });
    // personnage.js arrête les balles sur groupe_plateformes : ici c'est le calque Gameplay
    this.groupe_plateformes = calqueGameplay;
    // optimisation pour la borne : le décor est dessiné une seule fois dans des images au lieu de 1 200 tuiles à chaque image (voir optimisation.js)
    // le gris qu'on voit là où la map est vide (noir dans le niveau 2 : c'est le vide des trous)
    this.bandesDecor = figerCalques(this, [calqueFond, calqueDecor, calqueGameplay], carte.widthInPixels, carte.heightInPixels, this.cfg.fondVide ?? 0x3a3a3a);

    // le monde et la caméra prennent la taille de la map (sinon le joueur reste bloqué dans le 1er écran)
    this.physics.world.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
    this.cameras.main.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
    // le gris de fond est peint dans les bandes du décor (voir figerCalques), la caméra n'a donc plus à repeindre un rectangle de la taille
    // de l'écran
    // à chaque image. Il reste la couleur d'effacement de l'écran, la même, pour ce que le tremblement découvre au bord de la map.
    const effacement = this.sys.game.renderer.config.backgroundColor;
    const gris = this.cfg.fondVide ?? 0x3a3a3a; // la couleur de la map vide, même réglage que figerCalques
    const fondGris = () => effacement.setTo((gris >> 16) & 255, (gris >> 8) & 255, gris & 255); // ce niveau est affiché
    const fondNoir = () => effacement.setTo(0, 0, 0); // une autre scène prend le relais : elle retrouve le noir
    fondGris();
    this.events.on(Phaser.Scenes.Events.WAKE, fondGris); // scene.switch endort et réveille les scènes sans refaire create
    this.events.on(Phaser.Scenes.Events.SLEEP, fondNoir);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, fondNoir);
    return carte;
  }

  // Le robot : il apparaît au point "depart" de la carte (sinon à la position de la config), la caméra le suit, l'interface s'affiche.
  creerRobot(carte) {
    const pointDepart = objetsDe(carte, "depart")[0]; // le point de départ posé dans Tiled (calque "depart"), sinon celui de la config
    // (pour un point Tiled : x = milieu du robot, y = ses pieds)
    this.depart = pointDepart ? { x: pointDepart.x, y: pointDepart.y } : this.cfg.depart;
    this.player = creerPersonnage(this, this.depart.x, this.depart.y);
    this.player.refreshBody();
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.clavier = this.input.keyboard.createCursorKeys();
    this.physics.add.collider(this.player, this.groupe_plateformes);
    // la caméra suit le joueur
    this.cameras.main.startFollow(this.player);
    this.pv = PV_DEPART; // PV du joueur
    this.hud = creerHud(this, this.player, this.pv); // HUD : barre de vie, vies, jauge de dash, score et chrono
  }

  // Les tirs du robot, les ennemis, et les archers (un sur chaque point du calque "archer"). Les mages et les orcs sont créés plus tard dans create.
  creerEnnemisEtTirs(carte) {
    this.tirsJoueur = this.physics.add.group({ allowGravity: false }); // personnage.js y range les balles du robot
    this.ennemis = this.physics.add.group();
    this.physics.add.collider(this.ennemis, this.groupe_plateformes);
    // un archer sur chaque point du calque d'objets "archer" de Tiled (le point = ses pieds, on le pose un peu au-dessus et il tombe sur le sol)
    objetsDe(carte, "archer").forEach(point => ennemis.creerArcher(this, point.x, point.y - 40));
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
  }

  // La lumière : des zones qui brûlent le robot, des lanternes qu'on éteint en tirant dessus, et le voile d'obscurité (créé en dernier : il
  // passe au-dessus).
  creerLumieres(carte) {
    this.zonesLumiere = this.physics.add.staticGroup(); // groupe des zones de lumière (dégâts)
    this.prochainDegatLumiere = 0; // instant à partir duquel la lumière peut de nouveau blesser le joueur
    lumiere.creerTextureHalo(this); // dessine la texture du halo avant de poser les lumières
    // une zone de lumière sur chaque point du calque "lumière" de Tiled
    objetsDe(carte, "lumière").forEach(point => lumiere.creerZoneRonde(this, point.x, point.y, 100));
    this.lanternes = this.physics.add.staticGroup(); // groupe des lanternes
    // une lanterne sur chaque point du calque "lanterne" de Tiled
    objetsDe(carte, "lanterne").forEach(point => lumiere.creerLanterne(this, point.x, point.y, 90));
    // un tir éteint la lanterne
    this.physics.add.overlap(this.tirsJoueur, this.lanternes, (tir, lanterne) => lumiere.eteindreLanterne(this, tir, lanterne));
    lumiere.creerVoile(this);
  }

  // L'état de départ du niveau. Phaser réutilise la même scène quand on rejoue : tout ce qui change pendant la partie doit être remis ici.
  remettreAZero() {
    this.areneLancee = false; // le combat contre le boss n'a pas encore commencé
    // sans cette remise à zéro, après avoir fini le jeu on était envoyé directement au niveau 2 en arrivant en haut (arene.js)
    this.fuiteOuverte = false;
    this.murDroit = null; // le mur de droite de l'arène du Soldat (pas encore posé)
    this.elementsFuite = []; // les flèches et le texte « FUIS » (pas encore affichés)
    this.boss = null; // le boss n'existe pas encore (arene.js le crée)
    this.zonesBoss = []; // les zones de lumière dangereuses du boss : colonnes, balayage (voir boss.js)
    // instant jusqu'auquel le robot ne peut pas être blessé (le répit de réapparition est posé à la première image, voir update : l'horloge
    // n'est pas encore à jour dans create)
    this.invincibleJusqua = 0;
    this.graceAPoser = true;
    this.mort = false; // vrai quand le robot est tombé à 0 PV (voir mourir)
    this.partieFinie = false; // vrai une fois la partie terminée (voir finirPartie dans points.js)
  }

  update() {
    if (this.graceAPoser) { // première image du niveau : répit de réapparition (invincible et clignotant) pour ne pas se faire toucher en arrivant
      this.graceAPoser = false;
      this.invincibleJusqua = this.time.now + DUREE_GRACE;
      this.tweens.add({ targets: this.player, alpha: 0.35, duration: 90, yoyo: true, repeat: Math.round(DUREE_GRACE / 180) - 1, onComplete: () => this.player.setAlpha(1) });
    }
    lumiere.majLumiere(this); // vérifie si le joueur est dans la lumière et le brûle
    majPersonnage(this.player, this.clavier);
    ennemis.majEnnemis(this);
    verifierSalles(this); // ferme une salle de combat quand le joueur y entre, l'ouvre quand tous les ennemis sont morts
    this.cfg.arene(this); // si le joueur arrive en haut, on ferme l'arène
    lumiere.majVoile(this);
  }

  blesserJoueur(degats, cause) {
    if (this.mort || this.partieFinie) return; // un robot qui meurt ne prend plus de coups (et la partie finie, plus rien ne blesse)
    // juste après un coup : une seconde d'invincibilité, pour qu'une orbe et une lanterne ne fassent pas deux dégâts d'un coup
    if (this.time.now < this.invincibleJusqua) return;
    this.invincibleJusqua = this.time.now + DUREE_INVINCIBLE;
    this.pv -= degats;
    this.hud.majPV(this.pv); // met la barre de vie à jour
    jouerSon(this, this.pv <= 0 ? "joueur_mort" : "joueur_touche"); // bruit de mort si plus de PV, sinon bruit d'impact
    effets.joueurTouche(this); // tremblement, écran rouge et robot qui clignote
    console.log(cause);
    if (this.pv <= 0) this.mourir();
    else this.tweens.add({ targets: this.player, alpha: 0.35, duration: 90, yoyo: true, repeat: 5, onComplete: () => this.player.setAlpha(1) }); // il clignote pendant l'invincibilité
  }

  mourir() { // 0 PV : le robot meurt, puis le niveau recommence depuis le bas. Le chrono continue (la mort coûte du temps) et le score repart de zéro
    this.mort = true;
    jouerAction(this.player, "mort"); // animation de mort du robot (il ne peut plus bouger)
    this.time.delayedCall(1300, () => this.cameras.main.fadeOut(500, 0, 0, 0));
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.registry.set("score", 0); // sinon on referait le tour des ennemis pour gagner des points à chaque mort
      this.scene.restart(); // tout le niveau est refait : les ennemis, les lanternes, l'arène et le boss
    });
  }
}
