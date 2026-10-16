// versus.js : le mode 1 contre 1, dans une tour qui monte : l'écran monte en permanence (de plus en plus vite) et la zone rouge en bas de l'écran
// tue le robot qui la touche. Les plateformes sont fabriquées par le code et sont symétriques (le même parcours pour les deux joueurs).
// Deux robots, la visée automatique de chacun vise l'autre (voir chercherCible dans personnage.js). 3 PV chacun par manche, au meilleur des
// 3 manches :
// le premier à gagner 2 manches gagne la partie. Chaque manche relance la scène (this.scene.restart) : tout repart propre, seuls les points
// des manches passent.
// Joueur 1 : flèches, I (saut), K (tir), L (dash). Joueur 2 : Q Z D S (ou A W D S), R (saut), F (tir), G (dash) : les mêmes boutons que ceux de la borne
// (voir gpio2keys.py).
import { creerPersonnage, creerAnimationsPersonnage, majPersonnage, jouerAction } from "../personnage/personnage.js"; // le robot : création, animations, mise à jour, actions
import { jouerSon, musiqueDeScene, chargerMusiqueBoss, VOLUME_MUSIQUE_BOSS } from "../systemes/sons.js"; // sons et musique du boss
import * as effets from "../systemes/effets.js"; // flashs, éclats, tremblements
import { TOUCHES } from "../systemes/raccourcis.js"; // toutes les touches du jeu
import { preparerPause } from "./pause.js"; // le menu pause (Échap ou X), comme dans les niveaux
import { preparerSoinsVersus } from "../mecanismes/soins_versus.js"; // les croix de soin qui tombent
import { preparerLanternesVersus } from "../ennemis/lanterne_vivante.js"; // les lanternes vivantes qui poursuivent les robots
import { creerTextureHalo } from "../systemes/dessins_en_code.js"; // le halo de lumière : on s'en sert pour faire ressortir chaque robot

const PV_PAR_MANCHE = 3; // PV de chaque joueur par manche
const MANCHES_POUR_GAGNER = 2; // nombre de manches à gagner pour gagner la partie
const DUREE_INVINCIBLE = 600; // ms après un coup : une rafale ne tue pas en une image
const DELAI_FIN_MANCHE = 2300; // ms entre la mort d'un robot et la manche suivante
const DELAI_RETOUR_ACCUEIL = 10000; // ms sans bouton après la victoire : retour à l'écran d'accueil
const COULEUR_J1 = 0xff5a4a; // la couleur du joueur 1 (rouge : robot, halo, cellules de vie)...
const COULEUR_J2 = 0x8fd8ff; // ...et du joueur 2 (c'est aussi la teinte de son robot)
const COULEUR_VIDE = 0x3a2f45; // couleur d'une cellule de vie vide
const POLICE = "monospace"; // la police des textes

// la tour qui monte
const LARGEUR_TUILES = 40, HAUTEUR_TUILES = 500; // la tour : 40 tuiles de large (comme l'arène d'avant) et 500 de haut (16 000 px)
const MUR_TUILES = 4; // l'épaisseur des murs de chaque côté
const SOL_TUILES = 3; // l'épaisseur du sol de départ
// les numéros de tuiles du tileset « dawn » (les mêmes que dans la map solo et l'ancienne arène)
const TUILE_BOUT = 639, TUILE_MILIEU = 638; // une plateforme : un bout (639, retourné à gauche), du milieu (638), l'autre bout (639)
const TUILES_MUR = [800, 801, 802, 803]; // les 4 colonnes de chaque mur
const TUILE_SOL = 1126, TUILE_SOL_BORD = 1131; // le sol (pleine) et le bord du sol
const ECART_MIN = 3, ECART_MAX = 4; // l'écart (en tuiles) entre deux rangées de plateformes : le saut du robot fait 5 tuiles, on reste en dessous
const VITESSE_DEPART = 45, VITESSE_MAX = 180, ACCELERATION = 2.5; // l'écran monte de 45 px/s, +2,5 px/s chaque seconde (le maximum est atteint après environ 54 s), jusqu'à 180 px/s
const DELAI_DEFILEMENT = 3000; // ms avant que l'écran commence à monter (le temps de lire « MANCHE 1 » et de grimper)
const HAUTEUR_ZONE = 44; // px : la zone rouge en bas de l'écran. La toucher, c'est mourir
// les objets qui apparaissent pendant la manche
const SOINS = { delaiMin: 7000, delaiMax: 12000, maximum: 2 }; // une croix de soin toutes les 7 à 12 s, 2 au plus en même temps (+1 PV, jusqu'à 3)
const LANTERNES = { delai: 9000, maximum: 2 }; // une lanterne vivante toutes les 9 s, 2 au plus en même temps
const NIVEAU_BOOST_MAX = 3; // une lanterne abattue = un niveau de boost (voir boost.js), 3 au maximum
const DUREE_BOOST = 8000; // ms de boost après la dernière lanterne abattue

export default class versus extends Phaser.Scene { // la scène du 1 contre 1
  constructor() { // le constructeur
    super({ key: "versus" }); // on donne son nom à la scène
  }

  preload() { // charge la musique avant le début
    chargerMusiqueBoss(this); // la musique du boss n'est pas chargée au lancement (voir sons.js) : le 1 contre 1 en a besoin tout de suite
  }

  init(donnees) { // donnees : { manche, victoires } à partir de la 2e manche
    this.manche = donnees.manche ?? 1; // numéro de manche (1 par défaut)
    this.victoires = donnees.victoires ?? [0, 0]; // victoires de chaque joueur (0 - 0 par défaut)
  }

  create() { // construit l'arène et les deux robots
    creerAnimationsPersonnage(this); // animations du robot
    this.cameras.main.setBackgroundColor("#000000"); // fond noir uni (pas de tuiles de fond : en défilement elles laissaient voir un quadrillage entre elles)
    this.cameras.main.roundPixels = true; // la caméra se pose sur des pixels entiers : plus de fines lignes entre les tuiles quand l'écran monte
    const hauteurPx = HAUTEUR_TUILES * 32; // la hauteur de la tour en pixels
    this.groupe_plateformes = this.construireTour(); // les murs, le sol et les plateformes (les balles disparaissent contre eux, voir personnage.js)
    this.physics.world.setBounds(0, 0, LARGEUR_TUILES * 32, hauteurPx); // le monde physique a la taille de la tour
    this.bordsSansSautDeMur = new Phaser.Geom.Rectangle(MUR_TUILES * 32, 0, (LARGEUR_TUILES - 2 * MUR_TUILES) * 32, hauteurPx); // l'intérieur de la tour : les murs gauche et droit ne permettent ni glissade ni saut de mur (voir personnage.js)
    this.cameras.main.setScroll(0, hauteurPx - this.cameras.main.height + 24); // l'écran commence en bas de la tour (24 px plus bas : le sol est au-dessus de la zone rouge, les robots ont le temps de grimper)
    this.defilement = this.cameras.main.scrollY; // la position exacte de l'écran, avec des décimales (la caméra, elle, reçoit un nombre entier)
    this.vitesseEcran = VITESSE_DEPART; // la vitesse à laquelle l'écran monte (px/s)
    this.debutDefilement = this.time.now + DELAI_DEFILEMENT; // l'écran ne monte pas avant cet instant

    // les deux robots
    const depart1 = { x: 208, y: hauteurPx - SOL_TUILES * 32 }, depart2 = { x: 1072, y: hauteurPx - SOL_TUILES * 32 }; // les départs, sur le sol, symétriques
    this.joueurs = [ // la liste des deux robots
      creerPersonnage(this, depart1.x, depart1.y, { teinte: COULEUR_J1 }), // le joueur 1, teinté en rouge
      creerPersonnage(this, depart2.x, depart2.y, { teinte: COULEUR_J2, touches: TOUCHES.joueur2 }) // le joueur 2, teinté en bleu, avec ses touches R, F et G
    ]; // fin de la liste
    this.joueurs[1].regardeGauche = true; // le joueur 2 regarde vers le joueur 1
    // joueur 2 : Q Z D S sur un clavier AZERTY. A et W marchent aussi : le joystick de la borne envoie A et W (clavier QWERTY, voir gpio2keys.py)
    const touche = (nom) => this.input.keyboard.addKey(nom, false); // fonction qui crée une touche du clavier
    const D = TOUCHES.joueur2Deplacement; // les touches de déplacement du joueur 2
    const ou = (a, b) => ({ get isDown() { return a.isDown || b.isDown; } }); // « l'une ou l'autre est enfoncée »
    this.claviers = [ // les commandes des deux joueurs
      this.input.keyboard.addKeys(TOUCHES.joueur1Deplacement), // joueur 1 : les flèches
      { left: ou(...D.gauche.map(touche)), right: touche(D.droite), up: ou(...D.haut.map(touche)), down: touche(D.bas) } // joueur 2 : Q/A, D, Z/W, S
    ]; // fin de la liste
    this.joueurs.forEach((joueur, i) => { // pour chaque joueur
      joueur.numero = i; // 0 = joueur 1, 1 = joueur 2
      joueur.adversaire = this.joueurs[1 - i]; // la visée automatique le prend pour cible
      joueur.pvVersus = PV_PAR_MANCHE; // ses PV de la manche
      joueur.mortVersus = false; // il est vivant
      joueur.invincibleJusqua = 0; // pas d'invincibilité au départ
      joueur.tirs = this.physics.add.group({ allowGravity: false }); // les balles de ce joueur
      // les robots sont sombres et le décor aussi (ici il n'y a pas de lumière) : un halo de la couleur du joueur derrière lui le fait ressortir
      creerTextureHalo(this); // on fabrique l'image du halo
      joueur.halo = this.add.image(joueur.x, joueur.y, "halo").setTint(i === 0 ? COULEUR_J1 : COULEUR_J2).setBlendMode(Phaser.BlendModes.ADD).setScale(0.8).setAlpha(0.6).setDepth(-1); // un halo de sa couleur derrière lui
      this.physics.add.collider(joueur, this.groupe_plateformes); // il ne traverse pas le sol
    }); // fin de la boucle
    this.joueurs.forEach((joueur, i) => { // une balle d'un joueur qui touche l'autre
      this.physics.add.overlap(this.joueurs[1 - i], joueur.tirs, (cible, balle) => this.toucher(cible, balle)); // une balle de ce joueur qui touche l'autre
    }); // fin de la boucle
    effets.preparerEffets(this); // on prépare les effets

    this.creerInterface(); // on crée l'interface
    this.finie = false; // la manche n'est pas finie
    this.ecranFinal = false; // pas d'écran final
    this.partieFinie = false; // vrai entre deux manches et à l'écran final : pas de pause (voir preparerPause)
    preparerPause(this); // le menu pause
    musiqueDeScene(this, "musique_boss_boucle", VOLUME_MUSIQUE_BOSS); // le metal des combats de boss
    this.creerZoneBas(); // la zone rouge en bas de l'écran
    preparerSoinsVersus(this, { ...SOINS, pvMax: PV_PAR_MANCHE }); // les croix de soin
    preparerLanternesVersus(this, { ...LANTERNES, surContact: (robot) => this.perdreUnPV(robot), surTir: (robot) => this.donnerBoost(robot) }); // les lanternes : elles blessent, un tir donne un boost au tireur
    this.annoncer("MANCHE " + this.manche, 1200); // une annonce au début de chaque manche
  } // fin de create

  update(temps, delta) { // appelée à chaque image
    this.joueurs.forEach((joueur, i) => { // pour chaque joueur
      if (!joueur.mortVersus) majPersonnage(joueur, this.claviers[i]); // s'il est en vie, on le fait vivre
      joueur.halo.setPosition(joueur.body.center.x, joueur.body.center.y); // son halo le suit
    });
    this.joueurs.forEach((joueur) => { if (joueur.boostNiveau && this.time.now >= joueur.boostJusqua) joueur.boostNiveau = 0; }); // un boost qui se termine
    if (this.finie || this.time.now < this.debutDefilement) return; // manche finie ou écran pas encore parti : il ne monte pas
    this.monterEcran(delta); // l'écran monte
    this.verifierZoneBas(); // la zone du bas tue celui qu'elle touche
  }

  // ---- la tour qui monte ----
  construireTour() { // fabrique la tour avec les tuiles de la map solo (tileset « dawn ») : murs, sol et plateformes symétriques. Renvoie le calque solide
    const carte = this.make.tilemap({ tileWidth: 32, tileHeight: 32, width: LARGEUR_TUILES, height: HAUTEUR_TUILES }); // une carte vide
    const tuiles = carte.addTilesetImage("dawn_of_the_gods_ombre", "tuiles_dawn", 32, 32, 0, 0, 1); // le tileset de la map solo ; le dernier 1 = premier numéro de tuile (comme dans Tiled)
    const calque = carte.createBlankLayer("tour", tuiles).setDepth(-10); // le calque solide : murs, sol, plateformes
    const poser = (x, y, tuile, retournee = false) => { const t = calque.putTileAt(tuile, x, y); t.flipX = retournee; }; // pose une tuile (retournée = miroir gauche-droite)
    const poserSym = (x, y, tuile, retournee = false) => { poser(x, y, tuile, retournee); poser(LARGEUR_TUILES - 1 - x, y, tuile, !retournee); }; // pose une tuile ET sa symétrique (le miroir par rapport au centre)
    for (let y = 0; y < HAUTEUR_TUILES; y++) for (let i = 0; i < MUR_TUILES; i++) { poser(i, y, TUILES_MUR[i]); poser(LARGEUR_TUILES - MUR_TUILES + i, y, TUILES_MUR[i]); } // les deux murs, sur toute la hauteur
    for (let y = HAUTEUR_TUILES - SOL_TUILES; y < HAUTEUR_TUILES; y++) for (let x = MUR_TUILES; x < LARGEUR_TUILES - MUR_TUILES; x++) { // le sol du départ
      const bord = x < MUR_TUILES + 4 || x >= LARGEUR_TUILES - MUR_TUILES - 4; // les 4 tuiles de chaque bout ont une autre tuile (comme dans l'arène)
      poser(x, y, y === HAUTEUR_TUILES - SOL_TUILES && bord ? TUILE_SOL_BORD : TUILE_SOL); // la rangée du haut suit l'arène, les autres sont pleines
    }
    let y = HAUTEUR_TUILES - SOL_TUILES - Phaser.Math.Between(ECART_MIN, ECART_MAX); // la rangée de la première plateforme, au-dessus du sol
    let x = 8; // la colonne de départ de la plateforme précédente
    while (y > 6) { // on monte, rangée par rangée, jusqu'en haut
      x = Phaser.Math.Clamp(x + Phaser.Math.Between(-6, 6), MUR_TUILES + 1, 17); // elle est décalée de 6 tuiles au plus de la précédente : toujours atteignable
      const largeur = Phaser.Math.Between(4, 7); // sa largeur
      for (let i = 0; i < largeur; i++) { // une plateforme de la map solo : un bout retourné, le milieu, l'autre bout
        const bout = i === 0 || i === largeur - 1; // vrai pour la première et la dernière tuile
        poserSym(x + i, y, bout ? TUILE_BOUT : TUILE_MILIEU, i === 0); // le bout de gauche est retourné ; le miroir (côté droit) retourne tout à l'envers, donc il reste juste
      }
      y -= Phaser.Math.Between(ECART_MIN, ECART_MAX); // la rangée suivante est 3 ou 4 tuiles plus haut
    }
    calque.setCollision([TUILE_BOUT, TUILE_MILIEU, TUILE_SOL, TUILE_SOL_BORD, ...TUILES_MUR]); // ces tuiles sont solides
    return calque; // on renvoie le calque
  }

  creerZoneBas() { // la zone rouge, collée au bas de l'écran (elle ne bouge pas : c'est l'écran qui monte)
    const haut = this.cameras.main.height - HAUTEUR_ZONE; // le y de son bord haut sur l'écran
    this.zoneBas = this.add.rectangle(640, haut + HAUTEUR_ZONE / 2, 1280, HAUTEUR_ZONE, 0xd02828, 0.6).setScrollFactor(0).setDepth(95); // le rectangle rouge
    this.add.rectangle(640, haut + 2, 1280, 4, 0xff6a5a).setScrollFactor(0).setDepth(96); // un trait vif sur son bord haut
    this.tweens.add({ targets: this.zoneBas, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 }); // elle pulse
  }

  monterEcran(delta) { // fait monter l'écran d'un petit pas
    const camera = this.cameras.main; // la caméra
    this.vitesseEcran = Math.min(VITESSE_MAX, this.vitesseEcran + ACCELERATION * delta / 1000); // il accélère doucement
    this.defilement = Math.max(0, this.defilement - this.vitesseEcran * delta / 1000); // il monte (sans dépasser le haut de la tour)
    camera.scrollY = Math.round(this.defilement); // la caméra ne reçoit que des pixels entiers
    this.joueurs.forEach((joueur) => { // le haut de l'écran est un plafond : on ne peut pas sortir par le haut
      if (joueur.mortVersus || joueur.body.top >= camera.scrollY) return; // mort, ou bien dans l'écran : rien à faire
      joueur.body.y = camera.scrollY; // on le remet sous le bord haut
      if (joueur.body.velocity.y < 0) joueur.body.setVelocityY(0); // et il ne continue pas à monter
    });
  }

  verifierZoneBas() { // un robot qui touche la zone rouge meurt
    const camera = this.cameras.main; // la caméra
    const limite = camera.scrollY + camera.height - HAUTEUR_ZONE; // le y (dans la tour) du bord haut de la zone rouge
    const touches = this.joueurs.filter((joueur) => !joueur.mortVersus && joueur.body.bottom > limite); // les robots vivants qui la touchent
    if (touches.length === 0) return; // personne
    const perdant = touches.length === 2 && touches[0].body.bottom === touches[1].body.bottom ? Phaser.Utils.Array.GetRandom(touches) : touches.reduce((a, b) => (a.body.bottom > b.body.bottom ? a : b)); // si les deux la touchent, le plus bas perd (à égalité : au hasard)
    perdant.pvVersus = 0; // il n'a plus de PV
    this.majVies(); // les cellules de vie s'éteignent
    jouerSon(this, "joueur_mort"); // bruit de mort
    effets.flash(perdant, 0xff3030, 100); // il clignote en rouge
    effets.eclats(this, perdant.body.center.x, perdant.body.bottom, 0xff6a5a, 16, 300); // éclats rouges
    this.finirManche(perdant.adversaire); // l'autre gagne la manche
  }

  // ---- interface : 3 cellules de vie par joueur, le score des manches au milieu ----
  creerInterface() { // crée l'interface : cellules de vie et score
    this.cellules = [[], []]; // les cellules de chaque joueur
    const placer = (numero, x0, sens, couleur, nom) => { // fonction qui place les cellules d'un joueur
      this.add.text(x0, 22, nom, { fontFamily: POLICE, fontSize: "30px", fontStyle: "bold", color: "#" + couleur.toString(16).padStart(6, "0"), stroke: "#000000", strokeThickness: 5 }).setOrigin(sens > 0 ? 0 : 1, 0).setScrollFactor(0).setDepth(100); // le nom du joueur (J1 ou J2)
      for (let i = 0; i < PV_PAR_MANCHE; i++) { // une cellule par PV
        const x = x0 + sens * (i * 54 + (sens > 0 ? 0 : 50)); // x de la cellule
        this.cellules[numero].push(this.add.rectangle(x, 78, 46, 24, couleur).setOrigin(sens > 0 ? 0 : 1, 0.5).setStrokeStyle(3, 0x15111a).setScrollFactor(0).setDepth(100)); // on crée la cellule
      }
    };
    placer(0, 28, 1, COULEUR_J1, "J1"); // cellules du joueur 1 à gauche
    placer(1, 1252, -1, COULEUR_J2, "J2"); // cellules du joueur 2 à droite
    this.add.text(640, 22, this.victoires[0] + "  -  " + this.victoires[1], { fontFamily: POLICE, fontSize: "40px", fontStyle: "bold", color: "#f5f0f8", stroke: "#000000", strokeThickness: 6 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100); // le score des manches au milieu
    this.add.text(640, 70, "MANCHE " + this.manche, { fontFamily: POLICE, fontSize: "18px", color: "#8a779b", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100); // le numéro de la manche
    this.majVies(); // on allume les cellules
  }

  majVies() { // allume autant de cellules que de PV
    this.joueurs.forEach((joueur, i) => this.cellules[i].forEach((cellule, c) => cellule.setFillStyle(c < joueur.pvVersus ? (i === 0 ? COULEUR_J1 : COULEUR_J2) : COULEUR_VIDE))); // pour chaque cellule : pleine si elle est sous les PV, sinon vide
  }

  annoncer(texte, duree) { // un grand texte au milieu de l'écran, qui s'efface
    const t = this.add.text(640, 300, texte, { fontFamily: POLICE, fontSize: "64px", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 9 }).setOrigin(0.5).setScrollFactor(0).setDepth(110); // le texte au milieu de l'écran
    this.tweens.add({ targets: t, alpha: 0, delay: duree, duration: 400, onComplete: () => t.destroy() }); // il disparaît après la durée donnée
    return t; // on le renvoie
  }

  // ---- les coups et la fin des manches ----
  toucher(cible, balle) { // la balle d'un joueur touche l'autre
    balle.destroy(); // la balle disparaît
    this.perdreUnPV(cible); // il perd 1 PV
  }

  donnerBoost(robot) { // un robot abat une lanterne : un niveau de boost de plus (plus vite, une balle de plus par tir : voir personnage.js)
    if (this.finie || robot.mortVersus) return; // rien si la manche est finie ou si le robot est mort
    robot.boostNiveau = Math.min(NIVEAU_BOOST_MAX, (robot.boostNiveau ?? 0) + 1); // un niveau de plus, jusqu'au maximum
    robot.boostJusqua = this.time.now + DUREE_BOOST; // le boost est prolongé
    effets.flash(robot, 0xffffff, 90); // éclair blanc sur le robot
    effets.textePoints(this, robot.x, robot.y - 70, "BOOST " + robot.boostNiveau); // au-dessus de sa tête
  }

  perdreUnPV(cible) { // un robot perd 1 PV (balle ou lanterne), sauf s'il est invincible
    if (this.finie || cible.mortVersus || this.time.now < cible.invincibleJusqua) return; // rien si la manche est finie, si le joueur est mort ou invincible
    cible.invincibleJusqua = this.time.now + DUREE_INVINCIBLE; // nouvelle invincibilité
    cible.pvVersus -= 1; // il perd 1 PV
    this.majVies(); // on met les cellules à jour
    jouerSon(this, cible.pvVersus <= 0 ? "joueur_mort" : "joueur_touche"); // bruit de mort ou de coup
    effets.flash(cible, 0xff3030, 100); // il clignote en rouge
    this.cameras.main.shake(120, 0.005); // l'écran tremble
    effets.eclats(this, cible.body.center.x, cible.body.center.y, 0xff6a5a, 12, 260); // éclats rouges
    if (cible.pvVersus <= 0) this.finirManche(cible.adversaire); // à 0 PV, la manche est finie
  }

  finirManche(vainqueur) { // un robot est à 0 PV
    this.finie = true; // la manche est finie
    this.partieFinie = true; // plus de pause possible
    const perdant = vainqueur.adversaire; // le perdant
    perdant.mortVersus = true; // il est mort
    perdant.body.setVelocityX(0); // il s'arrête
    jouerAction(perdant, "mort"); // animation de mort
    this.tweens.add({ targets: perdant.halo, alpha: 0, duration: 600 }); // son halo s'éteint
    this.cameras.main.shake(400, 0.008); // l'écran tremble
    this.victoires[vainqueur.numero] += 1; // une victoire de plus pour le gagnant
    const nom = vainqueur.numero === 0 ? "J1" : "J2"; // son nom
    if (this.victoires[vainqueur.numero] >= MANCHES_POUR_GAGNER) { // s'il a assez de manches...
      this.time.delayedCall(DELAI_FIN_MANCHE, () => this.afficherVictoire(nom)); // ...on affiche l'écran de victoire
    } else { // sinon...
      this.annoncer(nom + " MARQUE", DELAI_FIN_MANCHE - 500); // ...on annonce le point...
      this.time.delayedCall(DELAI_FIN_MANCHE, () => this.scene.restart({ manche: this.manche + 1, victoires: this.victoires })); // ...et on lance la manche suivante
    } // fin du test
  }

  afficherVictoire(nom) { // l'écran de victoire : rejouer avec un bouton, ou retour à l'accueil au bout de 10 s
    this.ecranFinal = true; // l'écran final est affiché
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.55).setScrollFactor(0).setDepth(105); // un voile sombre
    this.add.text(640, 250, nom + " GAGNE", { fontFamily: POLICE, fontSize: "88px", fontStyle: "bold", color: nom === "J1" ? "#ff7a6a" : "#8fd8ff", stroke: "#000000", strokeThickness: 10 }).setOrigin(0.5).setScrollFactor(0).setDepth(110); // « J1 GAGNE » ou « J2 GAGNE »
    this.add.text(640, 350, this.victoires[0] + "  -  " + this.victoires[1], { fontFamily: POLICE, fontSize: "56px", color: "#f5f0f8", stroke: "#000000", strokeThickness: 8 }).setOrigin(0.5).setScrollFactor(0).setDepth(110); // le score des manches
    const aide = this.add.text(640, 470, "UN BOUTON : REJOUER", { fontFamily: POLICE, fontSize: "26px", color: "#e7e0e9", stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(110); // « UN BOUTON : REJOUER »
    this.tweens.add({ targets: aide, alpha: 0.35, duration: 600, yoyo: true, repeat: -1 }); // il clignote
    const debut = this.time.now; // l'heure d'affichage
    this.input.keyboard.on("keydown", () => { // quand une touche est pressée...
      if (this.time.now - debut < 1200) return; // les joueurs tapent encore sur leurs boutons : on laisse passer un instant
      this.scene.restart({}); // une nouvelle partie : 0 - 0
    });
    this.time.delayedCall(DELAI_RETOUR_ACCUEIL, () => { this.sound.stopAll(); this.scene.start("menu"); }); // sans appui pendant 10 s : retour à l'accueil
  }
}
