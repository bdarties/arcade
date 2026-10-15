import * as fct from "../fonctions.js";
import { CLE_SCENE, REGLES, ETATS, JOUEURS, POLICE, PHYSIQUE, ARENES_REGLES } from "./versusConfig.js";
import Joueur from "./Joueur.js";
import { ARENES, chargerAssetsArenes, construireArene, detruireArene, etendreOrdre } from "./arenes.js";
import { ARMES, chargerAssetsArmes, jouerSon } from "./armes.js";
import GestionnaireArmes from "./GestionnaireArmes.js";

// Pilote l'ensemble du match local : scènes, manches, arènes et interface.
export default class VersusScene extends Phaser.Scene {
  constructor() {
    super({ key: CLE_SCENE,
            physics: {
              default: 'arcade',
              arcade: {
                gravity: {y:400}
              }
            }
     });
  }

  // Réinitialise les données du match, y compris lors d'un redémarrage.
  init() {
    this.etat = null;
    this.scores = [0, 0];
    this.manche = 1;
    this.ordreArenes = [];
    this.compteur = 0;
    this.evenementDecompte = null;
    this.peutRelancer = false;

    this.joueurs = [];
    this.collisions = [];
    this.arene = null;
    this.coeurs = [];
    this.iconesArmes = [];
    this.armes = null;
  }

  // Charge les ressources partagées par les joueurs, les arènes et les armes.
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    fct.chargerPerso(this);
    chargerAssetsArenes(this);
    chargerAssetsArmes(this);
  }

  // Assemble l'interface et les objets du match avant de lancer la première manche.
  create() {
    this.sound.stopByKey("musique_menu");

    this.musiqueVersus = this.sound.add("versus_s_MerryGo", { loop: true, volume: 0.1 });
    this.musiqueVersus.play();

    this.cameras.main.setBackgroundColor("#0b0b1a");
    
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.6).setOrigin(0).setDepth(-1);

    fct.creerAnimsPerso(this);

    this.creerTexturesCoeur();
    this.creerHUD();
    this.creerEntrees();

    this.physics.world.setBoundsCollision(true, true, true, false);

    this.chargerArene(this.arenePourManche(1));
    this.creerJoueurs();
    this.armes = new GestionnaireArmes(this);
    this.brancherCollisions();

    this.events.on("versus:coup", this.traiterCoup, this);

    this.events.once("shutdown", () => this.nettoyer());

    this.demarrerManche();
  }

  // Met à jour les joueurs et les objets, et détecte les chutes pendant le combat.
  update(_temps, delta) {
    const actif = this.etat === ETATS.COMBAT;
    this.joueurs.forEach((j) => j.mettreAJour(actif));
    if (this.armes) this.armes.mettreAJour(delta, actif);

    if (actif) {
      const limite = this.arene.limiteBas + ARENES_REGLES.MARGE_CHUTE;
      this.joueurs.forEach((j, i) => {
        if (j.sprite.y > limite) this.joueurTombe(i);
      });
    }
  }

  // Vérifie si la zone du coup de l'attaquant touche le joueur adverse.
  traiterCoup(attaquant, zone) {
    if (this.etat !== ETATS.COMBAT) return;
    const i = this.joueurs.indexOf(attaquant);
    const cible = this.joueurs[1 - i];
    const b = cible.sprite.body;
    const corps = new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
    if (!Phaser.Geom.Intersects.RectangleToRectangle(zone, corps)) return;

    const direction = cible.sprite.x >= attaquant.sprite.x ? 1 : -1;
    if (this.infligerDegats(1 - i, direction)) {
      jouerSon(this, "punch");
    }
  }

  // Centralise les dégâts, l'actualisation des cœurs et l'élimination.
  infligerDegats(index, direction, degats = 1, recul = 1) {
    if (this.etat !== ETATS.COMBAT) return false;
    const cible = this.joueurs[index];
    if (!cible.subirCoup(direction, degats, recul)) return false;
    this.rafraichirCoeurs();
    if (cible.vies <= 0) this.eliminer(index);
    return true;
  }

  // Retire une vie après une chute puis replace le joueur, ou l'élimine.
  joueurTombe(i) {
    const joueur = this.joueurs[i];
    joueur.vies = REGLES.CHUTE === "elimination" ? 0 : Math.max(0, joueur.vies - 1);
    this.rafraichirCoeurs();
    if (joueur.vies <= 0) {
      this.eliminer(i);
      return;
    }
    const spawn = this.arene.spawns[i];
    joueur.placer(spawn.x, spawn.y, spawn.droite);
    joueur.invulnerableJusqua = this.time.now + PHYSIQUE.DUREE_INVULNERABLE_RESPAWN;
  }

  // Marque le joueur comme éliminé et attribue la manche à l'adversaire.
  eliminer(i) {
    this.joueurs[i].mourir();
    this.rafraichirArmesHUD();
    this.finDeManche(1 - i);
  }

  // Crée les deux joueurs aux positions définies par l'arène active.
  creerJoueurs() {
    this.joueurs = [0, 1].map((i) => {
      const spawn = this.arene.spawns[i];
      const joueur = new Joueur(this, i, spawn.x, spawn.y);
      joueur.sprite.setFlipX(!spawn.droite);
      return joueur;
    });
    this.rafraichirCoeurs();
  }

  // Replace les joueurs et réinitialise les objets au début d'une manche.
  placerJoueurs() {
    this.joueurs.forEach((j, i) => {
      const spawn = this.arene.spawns[i];
      j.nouvelleManche(spawn.x, spawn.y, spawn.droite);
    });
    if (this.armes) this.armes.nouvelleManche();
    this.rafraichirCoeurs();
    this.rafraichirArmesHUD();
  }

  // Relie les joueurs et les objets aux plateformes de l'arène.
  brancherCollisions() {
    this.retirerCollisions();
    const [j1, j2] = this.joueurs.map((j) => j.sprite);
    this.collisions.push(this.physics.add.collider(j1, this.arene.solides));
    this.collisions.push(this.physics.add.collider(j2, this.arene.solides));
    if (PHYSIQUE.COLLISION_ENTRE_JOUEURS) this.collisions.push(this.physics.add.collider(j1, j2));
    if (this.armes) this.armes.brancherCollisions();
  }

  // Retire les collisions avant de détruire ou remplacer l'arène.
  retirerCollisions() {
    this.collisions.forEach((c) => c.destroy());
    this.collisions = [];
    if (this.armes) this.armes.retirerCollisions();
  }

  // Renvoie l'arène prévue pour la manche, en complétant l'ordre au besoin.
  arenePourManche(manche) {
    etendreOrdre(this.ordreArenes, manche, ARENES_REGLES.ORDRE);
    return this.ordreArenes[manche - 1];
  }

  // Remplace proprement l'arène en cours et reconnecte les collisions.
  chargerArene(index) {
    if (this.arene) {
      this.retirerCollisions();
      detruireArene(this.arene);
    }
    this.arene = construireArene(this, index);
    if (this.joueurs.length) this.brancherCollisions();
    this.rafraichirHUD();
  }

  // Dessine les textures des cœurs une seule fois dans le gestionnaire Phaser.
  creerTexturesCoeur() {
    const dessiner = (cle, couleur, alpha) => {
      if (this.textures.exists(cle)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(couleur, alpha);
      g.fillCircle(8, 8, 7.5);
      g.fillCircle(20, 8, 7.5);
      g.fillTriangle(0.8, 10.5, 27.2, 10.5, 14, 26);
      g.generateTexture(cle, 28, 27);
      g.destroy();
    };
    dessiner("versus_coeur", 0xe8344a, 1);
    dessiner("versus_coeur_vide", 0x3a3a4e, 0.8);
  }

  // Crée les scores, les cœurs et les textes centraux de l'interface.
  creerHUD() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.coeurs = [0, 1].map((i) =>
      Array.from({ length: REGLES.VIES }, (_, k) =>
        this.add
          .image(i === 0 ? 40 + k * 32 : w - 68 - k * 32, 128, "versus_coeur")
          .setOrigin(0, 0.5)
          .setDepth(100)
      )
    );

    this.iconesArmes = [0, 1].map((i) => ({
      icone: this.add.image(i === 0 ? 40 : w - 40, 172, "versus_pv").setOrigin(i === 0 ? 0 : 1, 0.5).setDepth(100).setVisible(false),
      texte: this.add
        .text(0, 172, "", { fontFamily: POLICE, fontSize: "26px", color: JOUEURS[i].couleurTexte, stroke: "#000", strokeThickness: 4 })
        .setOrigin(i === 0 ? 0 : 1, 0.5)
        .setDepth(100)
    }));

    this.texteScores = JOUEURS.map((j, i) =>
      this.add
        .text(i === 0 ? 40 : w - 40, 24, "", {
          fontFamily: POLICE,
          fontSize: "34px",
          color: j.couleurTexte
        })
        .setOrigin(i === 0 ? 0 : 1, 0)
        .setDepth(100)
    );

    this.texteManche = this.add
      .text(w / 2, 24, "", { fontFamily: POLICE, fontSize: "28px", color: "#ffffff", align: "center" })
      .setOrigin(0.5, 0)
      .setDepth(100);

    this.texteCentre = this.add
      .text(w / 2, h / 2, "", {
        fontFamily: POLICE,
        fontSize: "86px",
        color: "#ffffff",
        align: "center",
        stroke: "#000000",
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.rafraichirHUD();

    document.fonts.ready.then(() => {
      this.children.list.forEach((objet) => {
        if (objet.type === "Text") {
          objet.setPadding(8, 8);
          objet.setFontFamily(POLICE);
        }
      });
    });
  }

  // Met à jour les icônes pleines ou vides selon les vies restantes.
  rafraichirCoeurs() {
    this.coeurs.forEach((rangee, i) => {
      const vies = this.joueurs[i] ? this.joueurs[i].vies : REGLES.VIES;
      rangee.forEach((img, k) => img.setTexture(k < vies ? "versus_coeur" : "versus_coeur_vide"));
    });
  }

  // Affiche l'arme tenue et ses munitions pour chaque joueur.
  rafraichirArmesHUD() {
    this.iconesArmes.forEach((h, i) => {
      const arme = this.joueurs[i] && this.joueurs[i].arme;
      if (!arme) {
        h.icone.setVisible(false);
        h.texte.setText("");
        return;
      }
      const def = ARMES[arme.id];
      h.icone.setTexture(arme.vide ? def.cleVide : def.cle).setVisible(true);
      h.icone.setScale(Math.min(60 / h.icone.width, 30 / h.icone.height));
      const marge = h.icone.displayWidth + 10;
      h.texte.setText(def.usages > 1 ? `x${arme.usages}` : "").setX(i === 0 ? 40 + marge : this.cameras.main.width - 40 - marge);
    });
  }

  // Synchronise les scores, le numéro de manche et le nom de l'arène.
  rafraichirHUD() {
    this.texteScores.forEach((t, i) => t.setText(`${JOUEURS[i].nom}\n${this.scores[i]} / ${REGLES.MANCHES_POUR_GAGNER}`));
    this.texteManche.setText(`MANCHE ${this.manche}\n${this.arene ? this.arene.def.nom : ""}`);
  }

  // Active les commandes de retour au menu et de relance après le match.
  creerEntrees() {
    const clavier = this.input.keyboard;

    const quitterMatch = () => {
      if (this.etat === ETATS.FIN_MATCH) this.quitter();
    };
    clavier.on("keydown-M", quitterMatch);
    clavier.on("keydown-H", quitterMatch);

    const relancer = () => {
      if (this.etat === ETATS.FIN_MATCH && this.peutRelancer) this.scene.restart();
    };
    clavier.on("keydown-I", relancer);
    clavier.on("keydown-R", relancer);
  }

  // Démarre le décompte après le placement des joueurs et la remise à zéro de la manche.
  demarrerManche() {
    this.etat = ETATS.DECOMPTE;
    this.rafraichirHUD();

    this.placerJoueurs();

    this.lancerDecompte();
  }

  // Compte avant le combat, puis active les contrôles au signal « GO ! ».
  lancerDecompte() {
    this.compteur = REGLES.DUREE_DECOMPTE;
    this.texteCentre.setText(String(this.compteur)).setColor("#ffffff");
    jouerSon(this, "decompte_1_2_3");

    this.evenementDecompte = this.time.addEvent({
      delay: 1000,
      repeat: REGLES.DUREE_DECOMPTE - 1,
      callback: () => {
        this.compteur--;
        if (this.compteur > 0) {
          this.texteCentre.setText(String(this.compteur));
          jouerSon(this, "decompte_1_2_3");
        } else {
          this.texteCentre.setText("GO !").setColor("#ffd24b");
          jouerSon(this, "decompte_go");
          this.etat = ETATS.COMBAT;
          this.time.delayedCall(700, () => {
            if (this.etat === ETATS.COMBAT) this.texteCentre.setText("");
          });
        }
      }
    });
  }

  // Enregistre le gagnant et décide s'il faut continuer ou terminer le match.
  finDeManche(gagnant) {
    if (this.etat !== ETATS.COMBAT) return;
    this.scores[gagnant]++;
    this.rafraichirHUD();

    if (this.scores[gagnant] >= REGLES.MANCHES_POUR_GAGNER) {
      this.finDuMatch(gagnant);
      return;
    }

    this.etat = ETATS.FIN_MANCHE;
    this.texteCentre
      .setFontSize(40)
      .setLineSpacing(14)
      .setColor(JOUEURS[gagnant].couleurTexte)
      .setText(`${JOUEURS[gagnant].nom}\nGAGNE LA MANCHE`);

    this.time.delayedCall(REGLES.DELAI_FIN_MANCHE, () => {
      if (this.etat === ETATS.FIN_MANCHE) this.passerALaMancheSuivante();
    });
  }

  // Change d'arène sous fondu puis redémarre la manche suivante.
  passerALaMancheSuivante() {
    const camera = this.cameras.main;
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.texteCentre.setFontSize(96);
      this.manche++;
      this.chargerArene(this.arenePourManche(this.manche));
      this.demarrerManche();
      camera.fadeIn(ARENES_REGLES.DUREE_FONDU);
    });
    camera.fadeOut(ARENES_REGLES.DUREE_FONDU);
  }

  // Affiche le vainqueur et active les commandes de fin de match.
  finDuMatch(gagnant) {
    this.etat = ETATS.FIN_MATCH;
    this.peutRelancer = false;
    this.time.delayedCall(1000, () => (this.peutRelancer = true));
    this.texteCentre
      .setFontSize(32)
      .setLineSpacing(14)
      .setColor(JOUEURS[gagnant].couleurTexte)
      .setText(`${JOUEURS[gagnant].nom}\nREMPORTE LE MATCH !\n\nBOUTON A : rejouer\nBOUTON F : menu`);
  }

  // Retourne au menu principal.
  quitter() {
    this.scene.start("accueil");
  }

  // Libère temporisations, musique, collisions et objets avant l'arrêt de la scène.
  nettoyer() {
    if (this.evenementDecompte) this.evenementDecompte.remove(false);
    this.evenementDecompte = null;
    
    if (this.musiqueVersus) {
      this.musiqueVersus.stop();
      this.musiqueVersus.destroy();
      this.musiqueVersus = null;
    }

    this.events.off("versus:coup", this.traiterCoup, this);
    this.retirerCollisions();
    if (this.armes) this.armes.detruire();
    this.armes = null;
    this.joueurs.forEach((j) => j.detruire());
    this.joueurs = [];
    if (this.arene) detruireArene(this.arene);
    this.arene = null;
  }
}