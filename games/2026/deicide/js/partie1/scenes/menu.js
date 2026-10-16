// menu.js : l'écran d'accueil du jeu, avec les boutons JOUER (solo), 1 V 1 (1 contre 1, voir versus.js) et CLASSEMENT (le panthéon, voir classement.js)
// C'est la première scène : elle charge tous les assets du jeu (avec une barre de chargement), puis attend qu'on appuie
// sur un bouton. Le fond est l'image du menu (assets/images/menu/fond_menu.png, 1280 x 720). Le bouton Jouer est dans
// assets/images/menu/bouton_jouer.png (15 images de 104 x 44 empilées : 0 = normal, 1 à 12 = survol animé, 13 et 14 = clic).
// L'image est fixe, alors le menu l'anime avec quelques petits effets posés par-dessus (voir animer) : le robot tire,
// il cligne de l'œil, le titre "glitche" de temps en temps et de la poussière flotte dans l'air.
import { chargerJeu } from "../systemes/chargement.js"; // charge tous les assets du jeu pendant que le menu s'affiche
import { creerAnimationsPersonnage } from "../personnage/personnage.js"; // crée la texture de la balle du robot
import { TOUCHES } from "../systemes/raccourcis.js"; // toutes les touches du jeu
import { GLITCH_TITRE } from "../parametres.js"; // les chiffres du glitch du titre
import { jouerSon } from "../systemes/sons.js"; // bruitages
import { VERSION } from "../../version.js"; // le numéro de version du jeu (voir outils/version.py)
import { ecrire } from "./classement.js"; // l'écriture en police pixel du jeu (pour écrire « 1 V 1 » sur la dalle) et ses couleurs
import { creerPolice, creerTexturePixel, plaque } from "../systemes/dessins_en_code.js"; // la police pixel et les particules (dessinées en code)

// les touches qui lancent le jeu : Entrée, Espace, et les boutons de la borne (X = start, puis les boutons 1 à 6 : I O P K L ;)
const TOUCHES_JOUER = TOUCHES.menu.jouer; // les touches qui lancent le jeu : clavier et boutons de la borne
// les boutons du joueur 2 (R T Y F G H, et son start N) lancent directement le 1 contre 1
const TOUCHES_JOUEUR2 = TOUCHES.menu.jouer2; // les boutons du joueur 2 : ils lancent le 1 contre 1

// Le robot de l'image est un Bot Wheel dessiné avec des pixels de 10,4 px (mesuré sur l'image). Pour que la flamme du tir
// tombe pile au bout de son canon, on pose les images de "shoot_fx.png" avec la même taille de pixel.
const PIXEL = 10.4; // taille d'un pixel du robot dans l'image du menu
const CANON = { x: 330, y: 584 }; // le bout du canon du robot dans l'image
// le centre de la flamme : 11,5 pixels devant le bout du canon (comme dans l'image du tir)
const CENTRE_FLAMME = { x: CANON.x + 11.5 * PIXEL, y: CANON.y }; // le centre de la flamme du tir
const OEIL = { x: 217, y: 501, largeur: 46, hauteur: 26 }; // l'œil du robot, pour le faire clignoter
const TITRE = { x: 229, y: 79, largeur: 822, hauteur: 152 }; // la zone du titre DEICIDE, pour l'effet glitch

export default class menu extends Phaser.Scene { // l'écran d'accueil
  constructor() { // le constructeur
    super({ key: "menu" }); // on donne son nom à la scène
  }

  preload() { // charge les images et les sons, avec une barre de chargement
    this.cameras.main.setBackgroundColor("#0e0e11"); // fond sombre pendant le chargement
    this.load.setBaseURL(this.sys.game.config.baseURL); // chemin du jeu, pour que les assets se chargent aussi depuis la borne
    // barre de chargement : elle se remplit pendant que les images et les sons du jeu se chargent
    const texte = this.add.text(640, 380, "CHARGEMENT", { fontFamily: "monospace", fontSize: "24px", color: "#8a779b" }).setOrigin(0.5); // le texte « CHARGEMENT »
    const cadre = this.add.rectangle(640, 430, 404, 18, 0x251d2a).setStrokeStyle(2, 0x5f4f6e); // le cadre de la barre
    const barre = this.add.rectangle(440, 430, 0, 10, 0xe7e0e9).setOrigin(0, 0.5); // la barre elle-même, vide au départ
    this.load.on("progress", (avancement) => { barre.width = 400 * avancement; }); // à chaque progrès, la barre s'élargit
    this.load.on("complete", () => { texte.destroy(); cadre.destroy(); barre.destroy(); }); // quand tout est chargé, on retire la barre
    this.load.image("fond_menu", "./assets/images/menu/fond_menu.png"); // l'image du menu
    this.load.spritesheet("bouton_jouer", "./assets/images/menu/bouton_jouer.png", { frameWidth: 104, frameHeight: 44 }); // le bouton Jouer
    // la flamme du canon, seule (4 images)
    this.load.spritesheet("menu_flamme_tir", "./assets/spritesheet/player/bot_wheel/shoot_fx.png", { frameWidth: 117, frameHeight: 26 }); // la flamme du canon : 4 images
    chargerJeu(this); // tout le reste du jeu
  }

  create() { // construit le menu une fois tout chargé
    creerAnimationsPersonnage(this); // crée entre autres la texture "botwheel_balle" (la balle du robot)
    this.add.image(0, 0, "fond_menu").setOrigin(0, 0); // l'image du menu, sur tout l'écran
    this.animer(); // les petits effets qui font vivre l'image

    // le bouton Jouer, au centre : toujours en survol (flammes), il s'enfonce quand on le lance
    this.textures.get("bouton_jouer").setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou
    if (!this.anims.exists("bouton_jouer_survol")) { // si les animations du bouton n'existent pas encore...
      this.anims.create({ key: "bouton_jouer_survol", frames: this.anims.generateFrameNumbers("bouton_jouer", { start: 1, end: 12 }), frameRate: 12, repeat: -1 }); // ...le bouton brille en boucle...
      this.anims.create({ key: "bouton_jouer_clic", frames: this.anims.generateFrameNumbers("bouton_jouer", { start: 13, end: 14 }), frameRate: 12, repeat: 0 }); // ...et s'enfonce au clic
    }
    // agrandi x4 : la dalle fait 384 x 128 px (assez haut pour ne pas toucher la flamme du tir)
    this.bouton = this.add.sprite(640, 405, "bouton_jouer", 1).setScale(4); // le bouton agrandi 4 fois, au centre
    this.bouton.play("bouton_jouer_survol"); // il brille tout de suite
    // seule la dalle réagit, pas les flammes
    this.bouton.setInteractive({ hitArea: new Phaser.Geom.Rectangle(4, 10, 96, 32), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true }); // seule la dalle réagit à la souris
    this.bouton.on("pointerdown", () => this.lancer()); // un clic lance le jeu

    // le bouton « 1 V 1 » : la même dalle que « JOUER ». Haut / bas change de mode, un bouton valide celui qui
    // est choisi. Le bouton CLASSEMENT est à droite de JOUER : la flèche droite l'atteint, la flèche gauche revient à JOUER.
    this.mode = 1; // 1 = solo, 2 = 1 contre 1, 3 = classement
    this.boutonDeux = this.creerBoutonDeux(640, 545); // le bouton 1 V 1
    this.boutonClassement = this.creerBoutonClassement(947, 477); // à droite, à mi-hauteur entre JOUER (y 405) et 1 V 1 (y 545)
    this.indication = this.add.text(640, 640, "FLÈCHES : CHOISIR", { fontFamily: "monospace", fontSize: "16px", color: "#8a779b", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5); // le texte d'aide sous les boutons
    this.majMode(); // on affiche le mode choisi
    TOUCHES.menu.haut.forEach((nom) => this.input.keyboard.on("keydown-" + nom, () => this.changerMode(1))); // flèche haut : mode solo
    TOUCHES.menu.bas.forEach((nom) => this.input.keyboard.on("keydown-" + nom, () => this.changerMode(2))); // flèche bas : mode 1 contre 1
    TOUCHES.menu.droite.forEach((nom) => this.input.keyboard.on("keydown-" + nom, () => { if (this.mode === 1) this.changerMode(3); })); // de JOUER vers CLASSEMENT
    TOUCHES.menu.gauche.forEach((nom) => this.input.keyboard.on("keydown-" + nom, () => { if (this.mode === 3) this.changerMode(1); })); // et le retour
    this.boutonDeux.dalle.on("pointerdown", () => { this.mode = 2; this.lancer(); }); // un clic sur 1 V 1 le lance

    this.add.text(1262, 686, VERSION, { fontFamily: "monospace", fontSize: "20px", color: "#8a779b", stroke: "#000000", strokeThickness: 3 }).setOrigin(1, 1).setDepth(10); // en bas à droite : sur la borne, on voit si le jeu est à jour
    const aide = this.add.text(640, 674, "APPUIE SUR UN BOUTON", { fontFamily: "monospace", fontSize: "22px", color: "#8a779b", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5); // le texte « APPUIE SUR UN BOUTON »
    // le but du jeu, sous le titre
    this.add.text(640, 275, "BATS LE DIEU DE LA LUMIÈRE LE PLUS VITE POSSIBLE", { fontFamily: "monospace", fontSize: "22px", color: "#f4b6c2", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5); // le but du jeu sous le titre
    this.tweens.add({ targets: aide, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 }); // il clignote doucement

    TOUCHES_JOUER.forEach((nom) => this.input.keyboard.addKey(nom).on("down", () => this.lancer())); // chaque touche de la liste lance le jeu
    // un bouton du joueur 2 : directement le 1 contre 1
    TOUCHES_JOUEUR2.forEach((nom) => this.input.keyboard.addKey(nom).on("down", () => { this.mode = 2; this.lancer(); })); // un bouton du joueur 2 lance le 1 contre 1
    this.lance = false; // le jeu n'est pas encore lancé
  }

  creerTextureDalleVide(cle, debut, fin) { // la dalle « JOUER » sans son texte : on recopie dans chaque image la colonne vide à droite du mot (colonnes debut à fin), sur toute sa place
    if (this.textures.exists(cle)) return; // si elle existe déjà, rien à faire
    const source = this.textures.get("bouton_jouer").getSourceImage(); // l'image d'origine du bouton
    const texture = this.textures.createCanvas(cle, 104, 44 * 15); // une image vide de la même taille
    const ctx = texture.getContext(); // son pinceau de dessin
    ctx.drawImage(source, 0, 0); // on y recopie le bouton
    for (let image = 0; image < 15; image++) { // pour chacune des 15 images du bouton
      for (let x = debut; x < fin; x++) ctx.drawImage(source, 84, image * 44 + 15, 1, 17, x, image * 44 + 15, 1, 17); // lignes 15 à 31 : l'intérieur de la dalle
      texture.add(image, 0, 0, image * 44, 104, 44); // on découpe cette image
    }
    texture.refresh(); // on envoie le dessin à la carte graphique
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou
    this.anims.create({ key: cle + "_survol", frames: this.anims.generateFrameNumbers(cle, { start: 1, end: 12 }), frameRate: 12, repeat: -1 }); // les flammes
  }

  creerBoutonDeux(x, y) { // la même dalle animée que « JOUER », sans son texte, avec « 1V1 » écrit à la place (police pixel du jeu)
    creerPolice(this, "police_blanche", "#ffffff"); // comme le mot « JOUER » : tout blanc
    this.creerTextureDalleVide("bouton_vide", 34, 80); // la flèche reste, seul le mot est effacé
    const dalle = this.add.sprite(x, y, "bouton_vide", 1).setScale(4); // le bouton agrandi 4 fois
    dalle.play("bouton_vide_survol"); // il brille en boucle
    const texte = ecrire(this, x + 23, y + 7, "1V1", 7, { profondeur: 0, police: "police_blanche" }); // le texte « 1V1 » posé dessus
    const voile = this.add.rectangle(x, y, 416, 176, 0x0e0e11, 0.6); // atténue la dalle quand elle n'est pas choisie (on n'utilise pas l'alpha : le mot « JOUER » transparaîtrait sous le cache)
    this.add.container(0, 0, [dalle, texte, voile]); // on les range ensemble
    dalle.setInteractive({ hitArea: new Phaser.Geom.Rectangle(4, 10, 96, 32), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true }); // seule la dalle réagit à la souris
    return { voile, dalle }; // on renvoie le voile et la dalle
  }

  creerBoutonClassement(x, y) { // la même dalle animée que « JOUER », deux fois plus petite (il n'y a pas la place à côté), avec « CLASSEMENT » écrit à la place du mot
    creerPolice(this, "police_blanche", "#ffffff"); // tout blanc, comme le mot « JOUER »
    this.creerTextureDalleVide("bouton_vide_large", 16, 88); // « CLASSEMENT » est plus long que « JOUER » : on efface aussi la flèche pour lui laisser toute la place
    const ECHELLE = 2.25; // la dalle fait 104 x 44 px : x2,25 = 234 x 99 px (c'est tout ce que la place à droite permet : le pilier du décor est à 1065)
    const dalle = this.add.sprite(x, y, "bouton_vide_large", 1).setScale(ECHELLE); // le bouton
    dalle.play("bouton_vide_large_survol"); // il brille en boucle
    const texte = ecrire(this, x, y + 2.5, "CLASSEMENT", ECHELLE, { profondeur: 0, police: "police_blanche" }); // le texte « CLASSEMENT »
    const voile = this.add.rectangle(x, y, 104 * ECHELLE, 44 * ECHELLE, 0x0e0e11, 0.6); // atténue la dalle quand elle n'est pas choisie (comme « 1 V 1 »)
    dalle.setInteractive({ hitArea: new Phaser.Geom.Rectangle(4, 10, 96, 32), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true }); // seule la dalle réagit, pas les flammes
    dalle.on("pointerover", () => this.changerMode(3)); // la souris dessus : le bouton est choisi
    dalle.on("pointerdown", () => { this.mode = 3; this.lancer(); }); // un clic lance le classement
    return { dalle, texte, voile }; // on renvoie les morceaux du bouton
  }

  changerMode(mode) { // haut : solo, bas : 1 contre 1, droite : classement
    if (this.lance || this.mode === mode) return; // déjà lancé ou déjà choisi : rien
    this.mode = mode; // on retient le nouveau mode
    this.majMode(); // on met l'affichage à jour
  }

  majMode() { // le mode choisi est en pleine couleur, l'autre est atténué
    this.bouton.setAlpha(this.mode === 1 ? 1 : 0.4); // JOUER est atténué s'il n'est pas choisi
    this.boutonDeux.voile.setVisible(this.mode !== 2); // le voile de 1 V 1 est visible s'il n'est pas choisi
    this.boutonClassement.voile.setVisible(this.mode !== 3); // CLASSEMENT : atténué quand il n'est pas choisi, comme les deux autres
  }

  animer() { // les effets qui font vivre l'image fixe du menu
    // 1. le robot tire : la flamme apparaît au bout de son canon et une balle traverse l'écran
    this.textures.get("menu_flamme_tir").setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou
    // une seule fois : le menu se rouvre après chaque partie
    if (!this.anims.exists("menu_flamme_tir")) this.anims.create({ key: "menu_flamme_tir", frames: this.anims.generateFrameNumbers("menu_flamme_tir", { start: 0, end: 3 }), frameRate: 10, repeat: 0 }); // on crée l'animation de la flamme (une seule fois)
    const flamme = this.add.sprite(CENTRE_FLAMME.x - 42.5 * PIXEL, CENTRE_FLAMME.y - 10 * PIXEL, "menu_flamme_tir").setOrigin(0, 0).setScale(PIXEL).setVisible(false); // la flamme du canon, invisible au départ
    flamme.on("animationcomplete", () => flamme.setVisible(false)); // quand son animation finit, elle disparaît
    const tirer = () => { // fonction qui fait tirer le robot
      flamme.setVisible(true).play("menu_flamme_tir"); // le centre de la flamme est à 42,5 colonnes et 10 lignes du coin de l'image
      const balle = this.add.image(CENTRE_FLAMME.x, CENTRE_FLAMME.y, "botwheel_balle").setScale(PIXEL); // la balle part du centre de la flamme
      // elle accélère vers la droite
      this.tweens.add({ targets: balle, x: 1340, duration: 1000, ease: "Quad.easeIn", onComplete: () => balle.destroy() }); // elle accélère vers la droite
    };
    this.time.addEvent({ delay: 2600, loop: true, startAt: 1800, callback: tirer }); // un tir toutes les 2,6 s, le premier peu après l'arrivée

    // 2. le robot cligne de l'œil : un rectangle de la couleur de la visière cache l'œil un instant
    const paupiere = this.add.rectangle(OEIL.x, OEIL.y, OEIL.largeur, OEIL.hauteur, 0x211924).setVisible(false); // le rectangle qui cache l'œil, invisible au départ
    this.time.addEvent({ delay: 3300, loop: true, callback: () => { paupiere.setVisible(true); this.time.delayedCall(130, () => paupiere.setVisible(false)); } }); // toutes les 3,3 s, il cache l'œil 0,13 s

    // 3. le titre "glitche" : quelques tranches de l'image du titre sont décalées sur le côté pendant un instant
    const glitcher = () => { // fonction qui fait glitcher le titre
      const tranches = []; // la liste des tranches décalées
      for (let i = Phaser.Math.Between(GLITCH_TITRE.bandesMin, GLITCH_TITRE.bandesMax); i > 0; i--) { // 2 ou 3 tranches
        const hauteur = Phaser.Math.Between(GLITCH_TITRE.hauteurMin, GLITCH_TITRE.hauteurMax); // hauteur de la tranche, au hasard
        const y = Phaser.Math.Between(TITRE.y, TITRE.y + TITRE.hauteur - hauteur); // sa position verticale, dans la zone du titre
        const decalage = Phaser.Math.Between(GLITCH_TITRE.decalageMin, GLITCH_TITRE.decalageMax) * (Math.random() < 0.5 ? -1 : 1); // son décalage : à gauche ou à droite
        // la même image, découpée en tranche et décalée
        tranches.push(this.add.image(decalage, 0, "fond_menu").setOrigin(0, 0).setCrop(TITRE.x, y, TITRE.largeur, hauteur)); // la tranche : une copie de l'image décalée et découpée
      }
      this.time.delayedCall(GLITCH_TITRE.dureeMs, () => tranches.forEach((tranche) => tranche.destroy())); // 110 ms plus tard, on les supprime
      this.time.delayedCall(Phaser.Math.Between(GLITCH_TITRE.pauseMinMs, GLITCH_TITRE.pauseMaxMs), glitcher); // le prochain glitch arrive plus tard, à un moment au hasard
    };
    this.time.delayedCall(GLITCH_TITRE.premierApresMs, glitcher); // le premier glitch arrive à 1,5 s

    // 4. de la poussière flotte lentement vers le haut
    creerTexturePixel(this, "menu_poussiere"); // on fabrique le grain de poussière
    this.add.particles(0, 0, "menu_poussiere", { // le générateur de poussière
      x: { min: 0, max: 1280 }, y: { min: 380, max: 700 }, // elle naît dans la moitié basse de l'écran
      speedY: { min: -26, max: -10 }, speedX: { min: -6, max: 6 }, // elle monte lentement
      lifespan: 7000, frequency: 500, quantity: 1, // environ 14 grains en même temps
      alpha: { start: 0.3, end: 0 }, tint: 0xe7e0e9 // elle s'efface en montant
    });
  }

  lancer() { // un bouton a été pressé : le bouton s'enfonce, l'écran s'éteint, puis le niveau 1 commence
    if (this.lance) return; // déjà lancé : on ne le fait pas deux fois
    this.lance = true; // on note que c'est lancé
    if (this.mode === 3) { // le classement : on regarde le panthéon, sans animation
      jouerSon(this, "porte"); // bruit de porte
      this.scene.start("classement", { consultation: true }); // tout de suite : la dalle ne bouge pas au clic, comme « 1 V 1 »
      return; // on s'arrête là
    }
    if (this.mode === 2) { // 1 contre 1 : pas de chrono, on file dans l'arène
      jouerSon(this, "porte"); // bruit de porte
      this.cameras.main.fadeOut(350, 0, 0, 0); // l'écran s'assombrit
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start("versus")); // puis on lance le 1 contre 1
      return; // on s'arrête là
    }
    this.registry.set("chrono", 0); // nouvelle partie : le chrono repart de zéro
    this.registry.set("score", 0); // le score aussi
    this.registry.set("morts", 0); // et le nombre de morts
    this.registry.set("coups", 0); // et le nombre de coups reçus
    this.registry.set("numeroPartie", (this.registry.get("numeroPartie") ?? 0) + 1); // une partie de plus (sert aux conseils qui ne s'affichent qu'une fois par partie)
    this.registry.set("phaseBoss", null); // le boss repart de sa phase 1
    this.registry.set("guideVu", false); // le guide (but et commandes) s'affichera au début de cette partie
    this.registry.set("chronoActif", true); // le chrono peut tourner (il a pu être arrêté par la partie précédente)
    this.bouton.play("bouton_jouer_clic"); // le bouton s'enfonce
    jouerSon(this, "porte"); // bruit de porte, comme quand on entre dans un niveau
    this.time.delayedCall(180, () => this.cameras.main.fadeOut(350, 0, 0, 0)); // puis l'écran s'assombrit
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start("niveau1")); // quand il est noir, le niveau 1 commence
  }
}
