// versus.js : le mode 1 contre 1, dans l'arène du début de la map 1 (assets/maps/arene_versus.json, fichier Tiled : le bas de la map 1)
// Deux robots, la visée automatique de chacun vise l'autre (voir chercherCible dans personnage.js). 3 PV chacun par manche, au meilleur des
// 3 manches :
// le premier à gagner 2 manches gagne la partie. Chaque manche relance la scène (this.scene.restart) : tout repart propre, seuls les points
// des manches passent.
// Joueur 1 : flèches, I (saut), K (tir), L (dash). Joueur 2 : Q Z D S (ou A W D S), R (saut), F (tir), G (dash) : les mêmes boutons que ceux de la borne
// (voir gpio2keys.py).
import { creerPersonnage, creerAnimationsPersonnage, majPersonnage, jouerAction } from "../personnage/personnage.js"; // le robot : création, animations, mise à jour, actions
import { jouerSon, musiqueDeScene, chargerMusiqueBoss, VOLUME_MUSIQUE_BOSS } from "../systemes/sons.js"; // sons et musique du boss
import * as effets from "../systemes/effets.js"; // flashs, éclats, tremblements
import { objetsDe } from "../systemes/chargement.js"; // lecture des points de la carte Tiled
import { preparerPause } from "./pause.js"; // le menu pause (Échap ou X), comme dans les niveaux
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
    this.cameras.main.setBackgroundColor("#3a3a3a"); // fond gris
    const carte = this.make.tilemap({ key: "carte_versus" }); // la carte du 1 contre 1
    const tilesets = [carte.addTilesetImage("dawn_of_the_gods_ombre", "tuiles_dawn"), carte.addTilesetImage("white", "tuile_blanc")]; // les deux jeux de tuiles
    carte.createLayer("Background and background", tilesets).setDepth(-10); // le calque du fond
    carte.createLayer("Background", tilesets).setDepth(-10); // le calque du décor
    const calqueGameplay = carte.createLayer("Gameplay", tilesets).setDepth(-10); // le calque du gameplay (sol et murs)
    calqueGameplay.setCollisionByProperty({ colision: true }); // les tuiles marquées « colision » sont solides
    this.groupe_plateformes = calqueGameplay; // les balles disparaissent contre lui (voir personnage.js)
    this.physics.world.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels); // le monde physique a la taille de la carte
    this.cameras.main.setScroll(0, (carte.heightInPixels - this.cameras.main.height) / 2); // l'arène (704 px) est centrée dans l'écran (720 px)

    // les deux robots
    const [depart1] = objetsDe(carte, "depart1"); // point de départ du joueur 1
    const [depart2] = objetsDe(carte, "depart2"); // point de départ du joueur 2
    this.joueurs = [ // la liste des deux robots
      creerPersonnage(this, depart1.x, depart1.y, { teinte: COULEUR_J1 }), // le joueur 1, teinté en rouge
      creerPersonnage(this, depart2.x, depart2.y, { teinte: COULEUR_J2, touches: { saut: "R", tir: "F", dash: "G" } }) // le joueur 2, teinté en bleu, avec ses touches R, F et G
    ]; // fin de la liste
    this.joueurs[1].regardeGauche = true; // le joueur 2 regarde vers le joueur 1
    // joueur 2 : Q Z D S sur un clavier AZERTY. A et W marchent aussi : le joystick de la borne envoie A et W (clavier QWERTY, voir gpio2keys.py)
    const touche = (nom) => this.input.keyboard.addKey(nom, false); // fonction qui crée une touche du clavier
    const ou = (a, b) => ({ get isDown() { return a.isDown || b.isDown; } }); // « l'une ou l'autre est enfoncée »
    this.claviers = [ // les commandes des deux joueurs
      this.input.keyboard.createCursorKeys(), // joueur 1 : les flèches
      { left: ou(touche("Q"), touche("A")), right: touche("D"), up: ou(touche("Z"), touche("W")), down: touche("S") } // joueur 2 : Q/A, D, Z/W, S
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
    this.annoncer("MANCHE " + this.manche, 1200); // une annonce au début de chaque manche
  } // fin de create

  update() { // appelée à chaque image
    this.joueurs.forEach((joueur, i) => { // pour chaque joueur
      if (!joueur.mortVersus) majPersonnage(joueur, this.claviers[i]); // s'il est en vie, on le fait vivre
      joueur.halo.setPosition(joueur.body.center.x, joueur.body.center.y); // son halo le suit
    });
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
