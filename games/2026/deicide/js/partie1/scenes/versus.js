// versus.js : le mode 1 contre 1, dans l'arène du début de la map 1 (assets/maps/arene_versus.json, fichier Tiled : le bas de la map 1)
// Deux robots, la visée automatique de chacun vise l'autre (voir chercherCible dans personnage.js). 3 PV chacun par manche, au meilleur des
// 3 manches :
// le premier à gagner 2 manches gagne la partie. Chaque manche relance la scène (this.scene.restart) : tout repart propre, seuls les points
// des manches passent.
// Joueur 1 : flèches, I (saut), K (tir), L (dash). Joueur 2 : Q Z D S (ou A W D S), R (saut), F (tir), G (dash) : les mêmes boutons que ceux de la borne
// (voir gpio2keys.py).
import { creerPersonnage, creerAnimationsPersonnage, majPersonnage, jouerAction } from "../personnage/personnage.js";
import { jouerSon, musiqueDeScene, chargerMusiqueBoss, VOLUME_MUSIQUE_BOSS } from "../systemes/sons.js";
import * as effets from "../systemes/effets.js";
import { objetsDe } from "../systemes/chargement.js";
import { preparerPause } from "./pause.js"; // le menu pause (Échap ou X), comme dans les niveaux
import { creerTextureHalo } from "../mecanismes/lumiere.js"; // le halo de lumière : on s'en sert pour faire ressortir chaque robot

const PV_PAR_MANCHE = 3;
const MANCHES_POUR_GAGNER = 2;
const DUREE_INVINCIBLE = 600; // ms après un coup : une rafale ne tue pas en une image
const DELAI_FIN_MANCHE = 2300; // ms entre la mort d'un robot et la manche suivante
const DELAI_RETOUR_ACCUEIL = 10000; // ms sans bouton après la victoire : retour à l'écran d'accueil
const COULEUR_J1 = 0xff5a4a; // la couleur du joueur 1 (rouge : robot, halo, cellules de vie)...
const COULEUR_J2 = 0x8fd8ff; // ...et du joueur 2 (c'est aussi la teinte de son robot)
const COULEUR_VIDE = 0x3a2f45;
const POLICE = "monospace";

export default class versus extends Phaser.Scene {
  constructor() {
    super({ key: "versus" });
  }

  preload() {
    chargerMusiqueBoss(this); // la musique du boss n'est pas chargée au lancement (voir sons.js) : le 1 contre 1 en a besoin tout de suite
  }

  init(donnees) { // donnees : { manche, victoires } à partir de la 2e manche
    this.manche = donnees.manche ?? 1;
    this.victoires = donnees.victoires ?? [0, 0];
  }

  create() {
    creerAnimationsPersonnage(this);
    this.cameras.main.setBackgroundColor("#3a3a3a");
    const carte = this.make.tilemap({ key: "carte_versus" });
    const tilesets = [carte.addTilesetImage("dawn_of_the_gods_ombre", "tuiles_dawn"), carte.addTilesetImage("white", "tuile_blanc")];
    carte.createLayer("Background and background", tilesets).setDepth(-10);
    carte.createLayer("Background", tilesets).setDepth(-10);
    const calqueGameplay = carte.createLayer("Gameplay", tilesets).setDepth(-10);
    calqueGameplay.setCollisionByProperty({ colision: true });
    this.groupe_plateformes = calqueGameplay; // les balles disparaissent contre lui (voir personnage.js)
    this.physics.world.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
    this.cameras.main.setScroll(0, (carte.heightInPixels - this.cameras.main.height) / 2); // l'arène (704 px) est centrée dans l'écran (720 px)

    // les deux robots
    const [depart1] = objetsDe(carte, "depart1");
    const [depart2] = objetsDe(carte, "depart2");
    this.joueurs = [
      creerPersonnage(this, depart1.x, depart1.y, { teinte: COULEUR_J1 }),
      creerPersonnage(this, depart2.x, depart2.y, { teinte: COULEUR_J2, touches: { saut: "R", tir: "F", dash: "G" } })
    ];
    this.joueurs[1].regardeGauche = true; // le joueur 2 regarde vers le joueur 1
    // joueur 2 : Q Z D S sur un clavier AZERTY. A et W marchent aussi : le joystick de la borne envoie A et W (clavier QWERTY, voir gpio2keys.py)
    const touche = (nom) => this.input.keyboard.addKey(nom, false);
    const ou = (a, b) => ({ get isDown() { return a.isDown || b.isDown; } }); // « l'une ou l'autre est enfoncée »
    this.claviers = [
      this.input.keyboard.createCursorKeys(),
      { left: ou(touche("Q"), touche("A")), right: touche("D"), up: ou(touche("Z"), touche("W")), down: touche("S") }
    ];
    this.joueurs.forEach((joueur, i) => {
      joueur.numero = i; // 0 = joueur 1, 1 = joueur 2
      joueur.adversaire = this.joueurs[1 - i]; // la visée automatique le prend pour cible
      joueur.pvVersus = PV_PAR_MANCHE;
      joueur.mortVersus = false;
      joueur.invincibleJusqua = 0;
      joueur.tirs = this.physics.add.group({ allowGravity: false }); // les balles de ce joueur
      // les robots sont sombres et le décor aussi (ici il n'y a pas de lumière) : un halo de la couleur du joueur derrière lui le fait ressortir
      creerTextureHalo(this);
      joueur.halo = this.add.image(joueur.x, joueur.y, "halo").setTint(i === 0 ? COULEUR_J1 : COULEUR_J2).setBlendMode(Phaser.BlendModes.ADD).setScale(0.8).setAlpha(0.6).setDepth(-1);
      this.physics.add.collider(joueur, this.groupe_plateformes);
    });
    this.joueurs.forEach((joueur, i) => { // une balle d'un joueur qui touche l'autre
      this.physics.add.overlap(this.joueurs[1 - i], joueur.tirs, (cible, balle) => this.toucher(cible, balle));
    });
    effets.preparerEffets(this);

    this.creerInterface();
    this.finie = false;
    this.ecranFinal = false;
    this.partieFinie = false; // vrai entre deux manches et à l'écran final : pas de pause (voir preparerPause)
    preparerPause(this);
    musiqueDeScene(this, "musique_boss_boucle", VOLUME_MUSIQUE_BOSS); // le metal des combats de boss
    this.annoncer("MANCHE " + this.manche, 1200); // une annonce au début de chaque manche
  }

  update() {
    this.joueurs.forEach((joueur, i) => {
      if (!joueur.mortVersus) majPersonnage(joueur, this.claviers[i]);
      joueur.halo.setPosition(joueur.body.center.x, joueur.body.center.y);
    });
  }

  // ---- interface : 3 cellules de vie par joueur, le score des manches au milieu ----
  creerInterface() {
    this.cellules = [[], []];
    const placer = (numero, x0, sens, couleur, nom) => {
      this.add.text(x0, 22, nom, { fontFamily: POLICE, fontSize: "30px", fontStyle: "bold", color: "#" + couleur.toString(16).padStart(6, "0"), stroke: "#000000", strokeThickness: 5 }).setOrigin(sens > 0 ? 0 : 1, 0).setScrollFactor(0).setDepth(100);
      for (let i = 0; i < PV_PAR_MANCHE; i++) {
        const x = x0 + sens * (i * 54 + (sens > 0 ? 0 : 50));
        this.cellules[numero].push(this.add.rectangle(x, 78, 46, 24, couleur).setOrigin(sens > 0 ? 0 : 1, 0.5).setStrokeStyle(3, 0x15111a).setScrollFactor(0).setDepth(100));
      }
    };
    placer(0, 28, 1, COULEUR_J1, "J1");
    placer(1, 1252, -1, COULEUR_J2, "J2");
    this.add.text(640, 22, this.victoires[0] + "  -  " + this.victoires[1], { fontFamily: POLICE, fontSize: "40px", fontStyle: "bold", color: "#f5f0f8", stroke: "#000000", strokeThickness: 6 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
    this.add.text(640, 70, "MANCHE " + this.manche, { fontFamily: POLICE, fontSize: "18px", color: "#8a779b", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
    this.majVies();
  }

  majVies() { // allume autant de cellules que de PV
    this.joueurs.forEach((joueur, i) => this.cellules[i].forEach((cellule, c) => cellule.setFillStyle(c < joueur.pvVersus ? (i === 0 ? COULEUR_J1 : COULEUR_J2) : COULEUR_VIDE)));
  }

  annoncer(texte, duree) { // un grand texte au milieu de l'écran, qui s'efface
    const t = this.add.text(640, 300, texte, { fontFamily: POLICE, fontSize: "64px", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 9 }).setOrigin(0.5).setScrollFactor(0).setDepth(110);
    this.tweens.add({ targets: t, alpha: 0, delay: duree, duration: 400, onComplete: () => t.destroy() });
    return t;
  }

  // ---- les coups et la fin des manches ----
  toucher(cible, balle) { // la balle d'un joueur touche l'autre
    balle.destroy();
    if (this.finie || cible.mortVersus || this.time.now < cible.invincibleJusqua) return;
    cible.invincibleJusqua = this.time.now + DUREE_INVINCIBLE;
    cible.pvVersus -= 1;
    this.majVies();
    jouerSon(this, cible.pvVersus <= 0 ? "joueur_mort" : "joueur_touche");
    effets.flash(cible, 0xff3030, 100);
    this.cameras.main.shake(120, 0.005);
    effets.eclats(this, cible.body.center.x, cible.body.center.y, 0xff6a5a, 12, 260);
    if (cible.pvVersus <= 0) this.finirManche(cible.adversaire);
  }

  finirManche(vainqueur) { // un robot est à 0 PV
    this.finie = true;
    this.partieFinie = true;
    const perdant = vainqueur.adversaire;
    perdant.mortVersus = true;
    perdant.body.setVelocityX(0);
    jouerAction(perdant, "mort"); // animation de mort
    this.tweens.add({ targets: perdant.halo, alpha: 0, duration: 600 }); // son halo s'éteint
    this.cameras.main.shake(400, 0.008);
    this.victoires[vainqueur.numero] += 1;
    const nom = vainqueur.numero === 0 ? "J1" : "J2";
    if (this.victoires[vainqueur.numero] >= MANCHES_POUR_GAGNER) {
      this.time.delayedCall(DELAI_FIN_MANCHE, () => this.afficherVictoire(nom));
    } else {
      this.annoncer(nom + " MARQUE", DELAI_FIN_MANCHE - 500);
      this.time.delayedCall(DELAI_FIN_MANCHE, () => this.scene.restart({ manche: this.manche + 1, victoires: this.victoires }));
    }
  }

  afficherVictoire(nom) { // l'écran de victoire : rejouer avec un bouton, ou retour à l'accueil au bout de 10 s
    this.ecranFinal = true;
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.55).setScrollFactor(0).setDepth(105);
    this.add.text(640, 250, nom + " GAGNE", { fontFamily: POLICE, fontSize: "88px", fontStyle: "bold", color: nom === "J1" ? "#ff7a6a" : "#8fd8ff", stroke: "#000000", strokeThickness: 10 }).setOrigin(0.5).setScrollFactor(0).setDepth(110);
    this.add.text(640, 350, this.victoires[0] + "  -  " + this.victoires[1], { fontFamily: POLICE, fontSize: "56px", color: "#f5f0f8", stroke: "#000000", strokeThickness: 8 }).setOrigin(0.5).setScrollFactor(0).setDepth(110);
    const aide = this.add.text(640, 470, "UN BOUTON : REJOUER", { fontFamily: POLICE, fontSize: "26px", color: "#e7e0e9", stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(110);
    this.tweens.add({ targets: aide, alpha: 0.35, duration: 600, yoyo: true, repeat: -1 });
    const debut = this.time.now;
    this.input.keyboard.on("keydown", () => {
      if (this.time.now - debut < 1200) return; // les joueurs tapent encore sur leurs boutons : on laisse passer un instant
      this.scene.restart({}); // une nouvelle partie : 0 - 0
    });
    this.time.delayedCall(DELAI_RETOUR_ACCUEIL, () => { this.sound.stopAll(); this.scene.start("menu"); });
  }
}
