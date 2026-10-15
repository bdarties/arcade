// niveau_de_base.js : la classe de base de tous les niveaux (niveau 1, niveau 2, arène du dernier combat).
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
//   departArene    : { x, y } où le robot réapparaît s'il meurt pendant le combat du boss (facultatif : sans lui, le niveau recommence du début)
//   teleportBoss   : { x, y } où la touche de test F8 téléporte le robot
import { ROBOT, DEGATS } from "../parametres.js"; // PV de départ et invincibilité
import { creerPersonnage, creerAnimationsPersonnage, majPersonnage, jouerAction } from "../personnage/personnage.js"; // le robot : création, animations, mise à jour, actions
import { creerHud } from "../personnage/hud.js"; // l'interface : vie, dash, score, chrono
import * as ennemis from "../ennemis/ennemis_normaux.js"; // les ennemis normaux
import * as lumiere from "../mecanismes/lumiere.js"; // la lumière et le voile d'ombre
import { creerTextureHalo } from "../systemes/dessins_en_code.js"; // les dessins faits en code
import { jouerSon, musiqueDeScene, chargerMusiqueBoss, chargerMusiqueBossEnArrierePlan } from "../systemes/sons.js"; // bruitages et musique
import { majBoule } from "../personnage/boule.js"; // le robot immobile se met en boule
import * as effets from "../systemes/effets.js"; // tremblements, flashs, éclats et alertes
// décor dessiné une seule fois, ennemis lointains endormis (optimisations pour la borne)
import { figerCalques, endormirLesLoins } from "../systemes/optimisation.js"; // les optimisations pour la borne
import { chargerJeu, objetsDe } from "../systemes/chargement.js"; // le chargement des fichiers et la lecture de la carte Tiled
import { preparerSalles, verifierSalles } from "../mecanismes/salles.js"; // salles de combat fermées
import { preparerPause } from "./pause.js"; // menu pause (Échap ou X) : réglages et crédits
import { preparerBonus } from "../mecanismes/bonus.js"; // les PV que lâchent les ennemis
import { montrerGuide } from "../systemes/guide.js"; // le but, affiché une fois au début de la partie
import { preparerBoost } from "../mecanismes/boost.js"; // le boost du robot (rafale, vitesse, reflet)
import { preparerLanternesVivantes } from "../ennemis/lanterne_vivante.js"; // les lanternes ailées qui donnent le boost


export default class niveau extends Phaser.Scene { // la classe de base : chaque niveau en hérite
  constructor(cle, config) { // la clé de la scène ("niveau1"...) et la config du niveau (voir plus haut)
    super({ key: cle }); // on crée la scène avec son nom
    this.cfg = config; // on garde la config du niveau
  }

  preload() { // tous les assets sont normalement déjà chargés par le menu (voir menu.js) ; sinon ils se chargent ici
    chargerJeu(this); // on charge les fichiers du jeu si ce n'est pas déjà fait
    if (this.cfg.musique === "musique_boss_boucle") chargerMusiqueBoss(this); // le niveau 2 joue la musique du boss dès le début
  }

  // Le create suit toujours le même ordre : les étapes plus bas ont besoin de ce que les précédentes ont créé.
  create() { // crée tout le niveau (appelée au lancement et à chaque relance)
    creerAnimationsPersonnage(this); // animations du robot (une seule fois, elles servent à tous les niveaux)
    ennemis.creerAnimationsEnnemis(this); // animations des archers, des mages, des orcs et des flèches
    const carte = this.creerCarte(); // la carte Tiled, les collisions, la caméra
    this.creerRobot(carte); // le robot, son interface, la caméra qui le suit
    this.creerEnnemisEtTirs(carte); // les archers, et les tirs du robot et des ennemis
    this.creerLumieres(carte); // les zones de lumière qui brûlent, les lanternes, le voile d'obscurité
    musiqueDeScene(this, this.cfg.musique, this.cfg.volumeMusique); // lance la musique du niveau, et la relance quand on revient dans le niveau
    // crée un mage sur chaque point du calque "mage" de Tiled, un peu au-dessus
    objetsDe(carte, "mage").forEach(point => ennemis.creerMage(this, point.x, point.y - 50)); // un mage sur chaque point « mage » de la carte
    // crée un orc sur chaque point du calque "orc" de Tiled, un peu au-dessus
    objetsDe(carte, "orc").forEach(point => ennemis.creerOrc(this, point.x, point.y - 60)); // un orc sur chaque point « orc » de la carte
    this.remettreAZero(); // la scène est réutilisée à chaque nouvelle partie ou après une mort : on remet son état à zéro
    preparerBonus(this); // le groupe des PV que lâchent les ennemis (30 % de chances à chaque ennemi tué)
    preparerBoost(this); // le boost du robot (donné quand il abat une lanterne vivante)
    preparerLanternesVivantes(this); // une lanterne vivante toutes les 15 secondes, qui vole vers le robot
    endormirLesLoins(this); // les ennemis loin du joueur s'endorment (optimisation pour la borne)
    preparerSalles(this, this.cfg.salles); // les salles de combat fermées (voir salles.js)
    if (this.cfg.creer) this.cfg.creer(this); // ce qui est propre à ce niveau (vide, faisceaux, poursuite...)
    preparerPause(this); // Échap ou X ouvre le menu pause
    montrerGuide(this); // le but (une seule fois par partie, ils s'effacent seuls)
    // fabrique d'avance les « ! », « ? », « +100 » et les éclats (optimisation pour la borne : pas d'à-coup quand ils apparaissent)
    effets.preparerEffets(this); // on prépare les effets à l'avance (pas d'à-coup sur la borne)
    this.reprendreAuBoss(); // si le robot est mort contre le boss : on le remet dans l'arène
    (this.cfg.extensions || []).forEach((extension) => extension(this)); // ce que la partie 2 ajoute à ce niveau (voir niveau1.js) : la fuite après le boss
    chargerMusiqueBossEnArrierePlan(this); // la musique du boss, décodée pendant qu'on joue (pas au lancement : voir sons.js)
  }

  // La carte : les calques de tuiles, les collisions, la taille du monde et de la caméra. Renvoie la carte (les points d'apparition en sont
  // lus plus bas).
  creerCarte() { // construit la carte et ses collisions
    const carte = this.make.tilemap({ key: this.cfg.carte }); // on crée la carte à partir du fichier Tiled
    // le 1er nom est celui du tileset dans Tiled, le 2e la clé de l'image chargée dans chargement.js
    const tuilesDawn = carte.addTilesetImage("dawn_of_the_gods_ombre", "tuiles_dawn"); // le premier jeu de tuiles (le décor)
    const tuileBlanc = carte.addTilesetImage("white", "tuile_blanc"); // le deuxième jeu de tuiles (le blanc)
    const tilesets = [tuilesDawn, tuileBlanc]; // la liste des deux jeux de tuiles
    this.carte = carte; // on garde la map dans la scène, pour que les mécanismes (arene.js, salles.js) puissent y ajouter des tuiles
    this.tilesets = tilesets; // pareil pour les tilesets, nécessaires pour créer un nouveau calque
    const calqueFond = carte.createLayer("Background and background", tilesets); // le calque du fond
    const calqueDecor = carte.createLayer("Background", tilesets); // le calque du décor
    const calqueGameplay = carte.createLayer("Gameplay", tilesets); // le calque du gameplay (sol, murs, plateformes)
    // seules les tuiles du calque Gameplay qui ont la propriété "colision" dans Tiled sont solides
    calqueGameplay.setCollisionByProperty({ colision: true }); // seules les tuiles marquées « colision » sont solides
    // personnage.js arrête les balles sur groupe_plateformes : ici c'est le calque Gameplay
    this.groupe_plateformes = calqueGameplay; // le calque du gameplay sert de sol pour tout le niveau
    // optimisation pour la borne : le décor est dessiné une seule fois dans des images au lieu de 1 200 tuiles à chaque image (voir optimisation.js)
    // le gris qu'on voit là où la map est vide (noir dans le niveau 2 : c'est le vide des trous)
    this.bandesDecor = figerCalques(this, [calqueFond, calqueDecor, calqueGameplay], carte.widthInPixels, carte.heightInPixels, this.cfg.fondVide ?? 0x3a3a3a); // le décor est dessiné une fois pour toutes (optimisation)

    // le monde et la caméra prennent la taille de la map (sinon le joueur reste bloqué dans le 1er écran)
    this.physics.world.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels); // le monde physique a la taille de la carte
    this.cameras.main.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels); // la caméra aussi
    // le gris de fond est peint dans les bandes du décor (voir figerCalques), la caméra n'a donc plus à repeindre un rectangle de la taille
    // de l'écran
    // à chaque image. Il reste la couleur d'effacement de l'écran, la même, pour ce que le tremblement découvre au bord de la map.
    const effacement = this.sys.game.renderer.config.backgroundColor; // la couleur d'effacement de l'écran
    const gris = this.cfg.fondVide ?? 0x3a3a3a; // la couleur de la map vide, même réglage que figerCalques
    const fondGris = () => effacement.setTo((gris >> 16) & 255, (gris >> 8) & 255, gris & 255); // ce niveau est affiché
    const fondNoir = () => effacement.setTo(0, 0, 0); // une autre scène prend le relais : elle retrouve le noir
    fondGris(); // on applique le gris dès maintenant
    this.events.on(Phaser.Scenes.Events.WAKE, fondGris); // scene.switch endort et réveille les scènes sans refaire create
    this.events.on(Phaser.Scenes.Events.SLEEP, fondNoir); // quand elle s'endort, on remet le noir
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.events.off(Phaser.Scenes.Events.WAKE, fondGris); this.events.off(Phaser.Scenes.Events.SLEEP, fondNoir); }); // (ils s'empilaient à chaque nouvelle partie)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, fondNoir); // et on remet le noir
    return carte; // on renvoie la carte
  }

  // Le robot : il apparaît au point "depart" de la carte (sinon à la position de la config), la caméra le suit, l'interface s'affiche.
  creerRobot(carte) { // crée le robot et son interface
    const pointDepart = objetsDe(carte, "depart")[0]; // le point de départ posé dans Tiled (calque "depart"), sinon celui de la config
    // (pour un point Tiled : x = milieu du robot, y = ses pieds)
    this.depart = pointDepart ? { x: pointDepart.x, y: pointDepart.y } : this.cfg.depart; // le départ : celui de la carte, sinon celui de la config
    this.player = creerPersonnage(this, this.depart.x, this.depart.y); // on crée le robot
    this.player.refreshBody(); // on met sa hitbox à jour
    this.player.setBounce(0.2); // il rebondit un peu
    this.player.setCollideWorldBounds(true); // il ne sort pas de la carte
    this.clavier = this.input.keyboard.createCursorKeys(); // les flèches du clavier
    this.physics.add.collider(this.player, this.groupe_plateformes); // il ne traverse pas le sol
    // la caméra suit le joueur
    this.cameras.main.startFollow(this.player); // la caméra suit le robot
    this.pv = ROBOT.pvDepart; // PV du joueur
    this.hud = creerHud(this, this.player, this.pv); // HUD : barre de vie, vies, jauge de dash, score et chrono
  }

  // Les tirs du robot, les ennemis, et les archers (un sur chaque point du calque "archer"). Les mages et les orcs sont créés plus tard dans create.
  creerEnnemisEtTirs(carte) { // crée les tirs et les ennemis
    this.tirsJoueur = this.physics.add.group({ allowGravity: false }); // personnage.js y range les balles du robot
    this.ennemis = this.physics.add.group(); // le groupe des ennemis
    this.physics.add.collider(this.ennemis, this.groupe_plateformes); // ils ne traversent pas le sol
    // un archer sur chaque point du calque d'objets "archer" de Tiled (le point = ses pieds, on le pose un peu au-dessus et il tombe sur le sol)
    objetsDe(carte, "archer").forEach(point => ennemis.creerArcher(this, point.x, point.y - 40)); // un archer sur chaque point « archer » de la carte
    this.physics.add.overlap(this.tirsJoueur, this.ennemis, (tir, ennemi) => ennemis.toucherEnnemi(this, tir, ennemi)); // un tir du robot touche un ennemi
    this.tirsEnnemis = this.physics.add.group({ allowGravity: false }); // le groupe des tirs ennemis
    this.physics.add.overlap(this.player, this.tirsEnnemis, (joueur, fleche) => { // un tir ennemi touche le robot
      fleche.destroy(); // le tir disparaît
      this.blesserJoueur(fleche.degats ?? DEGATS.fleche, "Abattu par un archer"); // chaque tir ennemi porte ses dégâts (fleche.degats), sinon ceux de la flèche
    }); // fin de la fonction de contact
    this.physics.add.collider(this.tirsEnnemis, this.groupe_plateformes, (tir) => { // un tir ennemi qui touche un mur disparait
      if (tir.texture.key === "fleche") jouerSon(this, "fleche_mur"); // seule la flèche fait un bruit de bois en se plantant
      tir.destroy(); // le tir disparaît
    }); // fin de la fonction de contact
  }

  // La lumière : des zones qui brûlent le robot, des lanternes qu'on éteint en tirant dessus, et le voile d'obscurité (créé en dernier : il
  // passe au-dessus).
  creerLumieres(carte) { // crée la lumière du niveau
    this.zonesLumiere = this.physics.add.staticGroup(); // groupe des zones de lumière (dégâts)
    this.prochainDegatLumiere = 0; // instant à partir duquel la lumière peut de nouveau blesser le joueur
    creerTextureHalo(this); // dessine la texture du halo avant de poser les lumières
    // une zone de lumière sur chaque point du calque "lumière" de Tiled
    objetsDe(carte, "lumière").forEach(point => lumiere.creerZoneRonde(this, point.x, point.y, 100)); // une zone de lumière sur chaque point « lumière » de la carte
    this.lanternes = this.physics.add.staticGroup(); // groupe des lanternes
    // une lanterne sur chaque point du calque "lanterne" de Tiled
    objetsDe(carte, "lanterne").forEach(point => lumiere.creerLanterne(this, point.x, point.y, 90)); // une lanterne sur chaque point « lanterne » de la carte
    // un tir éteint la lanterne
    this.physics.add.overlap(this.tirsJoueur, this.lanternes, (tir, lanterne) => lumiere.eteindreLanterne(this, tir, lanterne)); // un tir du robot éteint une lanterne
    lumiere.creerVoile(this); // on crée le voile d'ombre en dernier : il passe au-dessus
  }

  // L'état de départ du niveau. Phaser réutilise la même scène quand on rejoue : tout ce qui change pendant la partie doit être remis ici.
  remettreAZero() { // remet à zéro tout ce qui change pendant la partie
    this.areneLancee = false; // le combat contre le boss n'a pas encore commencé
    this.murDroit = null; // le mur de droite de l'arène du Dieu (pas encore posé)
    this.boss = null; // le boss n'existe pas encore (arene.js le crée)
    this.areneSolY = undefined; // les repères de l'arène (posés quand elle se lance, voir arene.js) : oubliés à chaque nouvelle partie
    this.areneCentreX = undefined; // et son centre
    this.zonesBoss = []; // les zones de lumière dangereuses du boss : colonnes, balayage (voir boss.js)
    // instant jusqu'auquel le robot ne peut pas être blessé (le répit de réapparition est posé à la première image, voir update : l'horloge
    // n'est pas encore à jour dans create)
    this.invincibleJusqua = 0; // pas d'invincibilité au départ
    this.graceAPoser = true; // mais le répit de réapparition sera posé à la première image
    this.mort = false; // vrai quand le robot est tombé à 0 PV (voir mourir)
    this.immobileDepuis = null; // l'instant où le robot s'est arrêté (voir boule.js)
    this.partieFinie = false; // vrai une fois la partie terminée (voir finirPartie dans points.js)
  }

  reprendreAuBoss() { // appelée à la fin de create : après une mort contre le boss, le robot repart de l'entrée de l'arène (elle se referme alors toute seule)
    if (!this.registry.get("reprendreAuBoss")) return; // pas de reprise demandée : rien à faire
    this.registry.set("reprendreAuBoss", false); // on efface la demande
    this.player.setPosition(this.cfg.departArene.x, this.cfg.departArene.y); // on place le robot à l'entrée de l'arène
    this.player.body.setVelocity(0, 0); // il ne bouge plus
  }

  update() { // appelée à chaque image du jeu
    if (this.graceAPoser) { // première image du niveau : répit de réapparition (invincible et clignotant) pour ne pas se faire toucher en arrivant
      this.graceAPoser = false; // on ne le refait plus
      this.invincibleJusqua = this.time.now + ROBOT.invincibleAuDebut; // le robot est invincible un moment
      this.tweens.add({ targets: this.player, alpha: 0.35, duration: 90, yoyo: true, repeat: Math.round(ROBOT.invincibleAuDebut / 180) - 1, onComplete: () => this.player.setAlpha(1) }); // et clignote pendant ce temps
    }
    lumiere.majLumiere(this); // vérifie si le joueur est dans la lumière et le brûle
    majPersonnage(this.player, this.clavier); // le robot
    majBoule(this); // immobile plus d'une seconde : le robot se met en boule (invulnérable, sauf aux rayons du boss)
    ennemis.majEnnemis(this); // les ennemis agissent
    verifierSalles(this); // ferme une salle de combat quand le joueur y entre, l'ouvre quand tous les ennemis sont morts
    this.cfg.arene(this); // si le joueur arrive en haut, on ferme l'arène
    if (this.areneLancee) this.garderDansLArene(); // filet de sécurité : le robot ne peut pas sortir de la salle du boss
    lumiere.majVoile(this); // le voile d'ombre est redessiné
  }

  // perce : vrai pour les rayons du boss (colonnes, balayage, geysers, lasers) et le mur de lumière de la fuite : ils blessent même un robot en boule
  blesserJoueur(degats, cause, perce = false) { // retire des PV au robot (degats) ; cause = ce qui l'a touché
    if (this.mort || this.partieFinie) return; // un robot qui meurt ne prend plus de coups (et la partie finie, plus rien ne blesse)
    if (this.player.enBoule && !perce) return; // en boule : invulnérable (et le coup ne déclenche pas l'invincibilité d'une seconde)
    // juste après un coup : une seconde d'invincibilité, pour qu'une orbe et une lanterne ne fassent pas deux dégâts d'un coup
    if (this.time.now < this.invincibleJusqua) return; // pendant l'invincibilité, rien
    this.invincibleJusqua = this.time.now + ROBOT.invincibleApresCoup; // nouvelle invincibilité après ce coup
    this.registry.set("coups", (this.registry.get("coups") ?? 0) + 1); // un coup de plus reçu dans la partie (affiché dans le panthéon) : ici seulement les vrais dégâts, pas les coups esquivés
    this.pv -= degats; // il perd les PV
    this.hud.majPV(this.pv); // met la barre de vie à jour
    jouerSon(this, this.pv <= 0 ? "joueur_mort" : "joueur_touche"); // bruit de mort si plus de PV, sinon bruit d'impact
    effets.joueurTouche(this); // tremblement, écran rouge et robot qui clignote
    console.log(cause); // on écrit la cause dans la console (pour tester)
    if (this.pv <= 0) this.mourir(); // s'il n'a plus de PV, il meurt
    else this.tweens.add({ targets: this.player, alpha: 0.35, duration: 90, yoyo: true, repeat: 5, onComplete: () => this.player.setAlpha(1) }); // il clignote pendant l'invincibilité
  }

  // Filet de sécurité de l'arène du boss : si le robot se retrouve SOUS le sol de l'arène ou hors de la salle (par exemple après des sauts et des dashs répétés
  // dans un coin), on le remet à l'intérieur tout de suite. Le sol ne fait qu'une rangée de tuiles (32 px) : sans ça, une seule image « ratée » de la
  // physique suffit pour passer dessous et tomber hors de l'écran.
  garderDansLArene() { // remet le robot dans l'arène s'il en sort
    const corps = this.player.body; // la hitbox du robot
    const bornes = this.physics.world.bounds; // les limites de la carte
    const droite = this.murDroit ? this.murDroit.x : bornes.right; // la salle du niveau 1 est fermée par un mur à droite (il est brisé dans la partie 2)
    const limiteSol = this.areneSolY + 20; // en atterrissant, le robot s'enfonce d'au plus 8 px dans le sol : au-delà de 20 px, il est passé dessous
    if (corps.bottom > limiteSol) { // sous le sol : on le pose dessus
      this.player.y -= corps.bottom - this.areneSolY; // on le remonte
      this.player.setVelocityY(0); // il ne tombe plus
    }
    if (corps.right > droite) { // dans le mur de droite (ou hors de la carte)
      this.player.x -= corps.right - droite; // on le repousse à gauche
      this.player.setVelocityX(0); // il ne bouge plus à l'horizontale
    }
    if (corps.left < bornes.left) { // hors de la carte à gauche
      this.player.x += bornes.left - corps.left; // on le repousse à droite
      this.player.setVelocityX(0); // il ne bouge plus à l'horizontale
    }
  }

  mourir() { // 0 PV : le robot meurt, puis le niveau recommence. Le chrono continue (la mort coûte du temps)
    this.mort = true; // le robot est mort
    this.registry.set("morts", (this.registry.get("morts") ?? 0) + 1); // le nombre de morts de la partie, affiché dans le panthéon
    // mort pendant le combat du boss : on ne refait pas la tour, seulement le boss (et le score retrouve sa valeur d'avant le combat)
    const auBoss = Boolean(this.areneLancee); // vrai si le robot est mort pendant le combat du boss
    this.registry.set("reprendreAuBoss", auBoss && Boolean(this.cfg.departArene)); // (le niveau 3 est déjà juste l'arène : rien à déplacer)
    jouerAction(this.player, "mort"); // animation de mort du robot (il ne peut plus bouger)
    this.time.delayedCall(1300, () => this.cameras.main.fadeOut(500, 0, 0, 0)); // 1,3 s plus tard, l'écran s'assombrit
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => { // quand il est tout noir...
      // hors boss : le score repart de zéro (sinon on referait le tour des ennemis pour gagner des points à chaque mort)
      this.registry.set("score", auBoss ? this.registry.get("scoreArene") : 0); // le score est remis à zéro, ou à sa valeur d'avant le boss
      this.scene.restart(); // tout le niveau est refait : les ennemis, les lanternes, l'arène et le boss
    });
  }
}
