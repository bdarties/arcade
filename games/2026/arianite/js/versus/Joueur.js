// ============================================================================
// VERSUS : un joueur (sprite d'Aria + ses touches + ses mouvements + ses cœurs)
//
// Une seule classe pour les DEUX joueurs : seuls l'index (0 ou 1) et les touches changent.
// Elle n'utilise pas deplacerPerso() de fonctions.js (qui est lié à la touche "F" et aux
// flèches du mode narratif) ; elle réutilise seulement les animations d'Aria.
// ============================================================================
import { PHYSIQUE, REGLES, FRAME_IMPACT, JOUEURS, POLICE, DEBUG } from "./versusConfig.js";
import { ARMES, jouerSon } from "./armes.js";

// Configuration des touches de la borne d'arcade pour le Mode 2 Joueurs (Versus)
const TOUCHES_ARCADE = {
  J1: {
    gauche: Phaser.Input.Keyboard.KeyCodes.LEFT,
    droite: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    haut: Phaser.Input.Keyboard.KeyCodes.UP,
    bas: Phaser.Input.Keyboard.KeyCodes.DOWN,
    sautBouton: Phaser.Input.Keyboard.KeyCodes.I, // Bouton A (I)
    action: Phaser.Input.Keyboard.KeyCodes.O,     // Bouton B (O) - Attaquer
    lacher: Phaser.Input.Keyboard.KeyCodes.M      // Bouton F (M) - Lâcher objet
  },
  J2: {
    gauche: Phaser.Input.Keyboard.KeyCodes.Q,
    droite: Phaser.Input.Keyboard.KeyCodes.D,
    haut: Phaser.Input.Keyboard.KeyCodes.Z,
    bas: Phaser.Input.Keyboard.KeyCodes.S,
    sautBouton: Phaser.Input.Keyboard.KeyCodes.R, // Bouton A (R)
    action: Phaser.Input.Keyboard.KeyCodes.T,     // Bouton B (T) - Attaquer
    lacher: Phaser.Input.Keyboard.KeyCodes.H      // Bouton F (H) - Lâcher objet
  }
};

export default class Joueur {
  /**
   * @param scene  la VersusScene
   * @param index  0 = joueur 1, 1 = joueur 2
   * @param x, y   position de départ
   */
  constructor(scene, index, x, y) {
    this.scene = scene;
    this.index = index;
    this.infos = JOUEURS[index];

    // ---- sprite physique (même spritesheet qu'Aria) ----
    this.sprite = scene.physics.add.sprite(x, y, "img_perso");
    this.sprite.setCollideWorldBounds(true);
    this.appliquerTeinte();

    // ---- touches : { gauche, droite, haut, bas, sautBouton, action, lacher } ----
    this.touches = scene.input.keyboard.addKeys(TOUCHES_ARCADE[index === 0 ? "J1" : "J2"]);

    // ---- état ----
    this.vies = REGLES.VIES;
    this.vivant = true;
    this.enCoup = false;
    this.dernierCoup = 0; // date du dernier coup (pour le délai entre deux coups)
    this.coupDroit = true; // alterne poing droit / poing gauche
    this.etourdiJusqua = 0; // date de fin du recul (pas de contrôle avant)
    this.invulnerableJusqua = 0; // date de fin de l'invulnérabilité
    this.rouge = false; // le sprite est teinté en rouge (recul en cours)
    this.tweenMort = null;

    // ---- arme tenue : { id, usages, vide, fusee, prochainTir } ou null (= à mains nues) ----
    this.arme = null;
    this.armeSprite = null; // l'image de l'arme dans la main
    // ---- sommeil (Dormimus) ----
    this.endormi = false;
    this.endormiJusqua = 0;
    this.prochainZ = 0; // date du prochain "Z" qui s'envole

    // ---- étiquette "J1" / "J2" au-dessus de la tête ----
    this.etiquette = scene.add
      .text(x, y, index === 0 ? "J1" : "J2", { fontFamily: POLICE, fontSize: "20px", color: this.infos.couleurTexte, stroke: "#000", strokeThickness: 4 })
      .setOrigin(0.5, 1)
      .setDepth(50);

    // ---- événements d'animation (fin de coup, image d'impact) ----
    this.sprite.on("animationcomplete", (anim) => {
      if (anim.key.startsWith("aria_punch")) this.enCoup = false;
    });
    this.sprite.on("animationupdate", (anim, frame) => {
      if (!this.vivant || FRAME_IMPACT[anim.key] !== frame.textureFrame) return;
      // la scène écoute cet événement : elle regarde si l'adversaire est dans la zone et lui retire un cœur
      scene.events.emit("versus:coup", this, this.zoneCoup());
      if (DEBUG) this.afficherZoneCoup();
    });
  }

  get invulnerable() {
    return this.scene.time.now < this.invulnerableJusqua;
  }
  get etourdi() {
    return this.scene.time.now < this.etourdiJusqua;
  }

  appliquerTeinte() {
    if (this.endormi) this.sprite.setTint(0x9a8cff); // endormi : violet pâle
    else if (this.infos.teinte !== null) this.sprite.setTint(this.infos.teinte);
    else this.sprite.clearTint();
  }

  // ==========================================================================
  //  PLACEMENT
  // ==========================================================================

  // pose le joueur à un endroit (retour au départ après une chute, changement d'arène...)
  placer(x, y, regardeDroite) {
    if (this.tweenMort) this.tweenMort.stop();
    this.tweenMort = null;
    this.vivant = true;
    this.enCoup = false;
    this.rouge = false;
    this.sprite.setActive(true).setVisible(true).setAlpha(1).setAngle(0);
    this.appliquerTeinte();
    this.etiquette.setVisible(true);
    this.sprite.body.enable = true;
    this.sprite.body.reset(x, y); // position + vitesse remises à zéro
    this.sprite.setFlipX(!regardeDroite);
    this.sprite.anims.play("aria_stand", true);
  }

  // début de manche : placement + cœurs au maximum
  nouvelleManche(x, y, regardeDroite) {
    this.vies = REGLES.VIES;
    this.invulnerableJusqua = 0;
    this.etourdiJusqua = 0;
    this.endormi = false; // plus d'arme ni de sommeil d'une manche à l'autre
    this.retirerArme(true);
    this.placer(x, y, regardeDroite);
  }

  // ==========================================================================
  //  ARME
  // ==========================================================================

  // prend une arme en main (remplace celle qu'on tenait, mais le gestionnaire ne le permet pas : 1 arme à la fois)
  equiper(id, usages) {
    this.retirerArme(true);
    const def = ARMES[id];
    this.arme = { id, usages, vide: false, fusee: null, prochainTir: 0, clic: 0 };
    this.armeSprite = this.scene.add.image(0, 0, def.cle).setScale(def.echelle).setOrigin(def.origine[0], def.origine[1]).setDepth(3);
    this.majArme();
    if (this.scene.rafraichirArmesHUD) this.scene.rafraichirArmesHUD();
  }

  // l'arme disparaît (plus de munitions, désarmé, éliminé...)
  retirerArme(silencieux = false) {
    if (this.armeSprite) this.armeSprite.destroy();
    this.armeSprite = null;
    this.arme = null;
    if (!silencieux && this.scene.rafraichirArmesHUD) this.scene.rafraichirArmesHUD();
  }

  // place le sprite de l'arme dans la main du joueur (suit sa direction et son clignotement)
  majArme() {
    if (!this.armeSprite) return;
    const def = ARMES[this.arme.id];
    const dir = this.sprite.flipX ? -1 : 1;
    this.armeSprite
      .setPosition(this.sprite.x + dir * def.main[0], this.sprite.y + def.main[1])
      .setFlipX(this.sprite.flipX)
      .setAlpha(this.sprite.alpha)
      .setVisible(this.vivant);
  }

  // ==========================================================================
  //  SOMMEIL (Dormimus)
  // ==========================================================================
  endormir(duree) {
    if (!this.vivant) return;
    this.retirerArme(); // désarmé
    this.endormi = true;
    this.endormiJusqua = this.scene.time.now + duree;
    this.prochainZ = 0;
    this.enCoup = false;
    this.etourdiJusqua = 0;
    this.rouge = false;
    this.sprite.setVelocityX(0);
    this.sprite.setAlpha(1);
    this.appliquerTeinte();
    this.sprite.anims.play("aria_stand", true);
  }

  reveiller() {
    this.endormi = false;
    this.appliquerTeinte();
    jouerSon(this.scene, "reveil");
  }

  // petits "Z" qui s'envolent au-dessus de la tête
  zzz(maintenant) {
    if (maintenant < this.prochainZ) return;
    this.prochainZ = maintenant + 550;
    const dir = this.sprite.flipX ? -1 : 1;
    const z = this.scene.add
      .text(this.sprite.x + dir * 12, this.sprite.body.top - 6, Math.random() < 0.5 ? "Z" : "z", {
        fontFamily: POLICE, fontSize: "28px", color: "#cfc8ff", stroke: "#000", strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(60);
    this.scene.tweens.add({ targets: z, x: z.x + dir * 22, y: z.y - 46, alpha: 0, scale: 1.6, duration: 1100, onComplete: () => z.destroy() });
  }

  // ==========================================================================
  //  DÉGÂTS
  // ==========================================================================

  // reçoit un coup venant de la gauche (direction = -1) ou de la droite (+1) : -1 cœur + recul.
  // Renvoie false si le coup est ignoré (joueur déjà éliminé ou invulnérable).
  // degats : cœurs perdus ; recul : multiplicateur du recul (explosion = plus fort)
  // Endormi : vulnérable à TOUT (pas d'invulnérabilité après un coup), et il ne bouge pas (pas de recul).
  subirCoup(direction, degats = 1, recul = 1) {
    if (!this.vivant || (this.invulnerable && !this.endormi)) return false;
    const maintenant = this.scene.time.now;
    this.vies = Math.max(0, this.vies - degats);
    if (this.endormi) return true;
    this.enCoup = false;
    this.etourdiJusqua = maintenant + PHYSIQUE.DUREE_ETOURDI;
    this.invulnerableJusqua = maintenant + PHYSIQUE.DUREE_INVULNERABLE;
    this.sprite.setVelocity(direction * PHYSIQUE.RECUL_X * recul, -PHYSIQUE.RECUL_Y * recul);
    this.sprite.setFlipX(direction > 0); // il se tourne vers celui qui l'a frappé
    return true;
  }

  // animation d'élimination : le joueur bascule et disparaît
  mourir() {
    this.vivant = false;
    this.enCoup = false;
    this.rouge = false;
    this.endormi = false;
    this.retirerArme();
    this.sprite.setVelocity(0, 0);
    this.sprite.body.enable = false;
    this.etiquette.setVisible(false);
    this.tweenMort = this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      angle: this.sprite.flipX ? -90 : 90,
      y: this.sprite.y - 30,
      duration: 600,
      ease: "Cubic.easeOut"
    });
  }

  // ==========================================================================
  //  MISE À JOUR (appelée à chaque image par la scène)
  //  actif = false : les touches sont ignorées (décompte, fin de manche)
  // ==========================================================================
  mettreAJour(actif) {
    const s = this.sprite;
    const t = this.touches;
    const maintenant = this.scene.time.now;
    const auSol = s.body.blocked.down || s.body.touching.down;

    this.etiquette.setPosition(s.x, s.body.top - 6);
    this.majArme();
    if (!this.vivant) {
      Phaser.Input.Keyboard.JustDown(t.action); // vide les touches : pas de coup "en attente"
      Phaser.Input.Keyboard.JustDown(t.lacher);
      return;
    }

    // ---- endormi : aucun contrôle jusqu'au réveil (il tombe quand même si le sol manque) ----
    if (this.endormi) {
      Phaser.Input.Keyboard.JustDown(t.action);
      Phaser.Input.Keyboard.JustDown(t.lacher);
      s.setVelocityX(0);
      if (maintenant < this.endormiJusqua) {
        s.setAlpha(1);
        this.zzz(maintenant);
        if (auSol) s.anims.play("aria_stand", true);
        return;
      }
      this.reveiller();
    }

    // ---- apparence : rouge pendant le recul, clignote quand invulnérable ----
    const rouge = this.etourdi;
    if (rouge !== this.rouge) {
      this.rouge = rouge;
      if (rouge) s.setTint(0xff5555);
      else this.appliquerTeinte();
    }
    s.setAlpha(this.invulnerable && Math.floor(maintenant / 70) % 2 ? 0.35 : 1);

    // sécurité : si l'animation de coup a été interrompue, on libère le joueur
    if (this.enCoup && !s.anims.currentAnim?.key.startsWith("aria_punch")) this.enCoup = false;

    // ---- contrôles bloqués (décompte, fin de manche) : le joueur reste sur place ----
    if (!actif) {
      Phaser.Input.Keyboard.JustDown(t.action);
      Phaser.Input.Keyboard.JustDown(t.lacher);
      s.setVelocityX(0);
      if (auSol && !this.enCoup) s.anims.play("aria_stand", true);
      return;
    }

    // ---- recul après un coup reçu : aucun contrôle, la vitesse du coup continue ----
    if (this.etourdi) {
      Phaser.Input.Keyboard.JustDown(t.action);
      Phaser.Input.Keyboard.JustDown(t.lacher);
      return;
    }

    // ---- lâcher l'arme : retour aux poings ----
    if (Phaser.Input.Keyboard.JustDown(t.lacher) && this.arme) this.scene.armes.lacher(this);

    // ---- action : tir de l'arme tenue, sinon coup de poing (au sol comme en l'air) ----
    if (!this.enCoup && Phaser.Input.Keyboard.JustDown(t.action)) {
      if (this.arme) {
        this.scene.armes.tirer(this);
      } else if (maintenant - this.dernierCoup >= PHYSIQUE.DELAI_ENTRE_COUPS) {
        this.enCoup = true;
        this.dernierCoup = maintenant;
        s.anims.play(this.coupDroit ? "aria_punch_right" : "aria_punch_left");
        this.coupDroit = !this.coupDroit;
        jouerSon(this.scene, "vent"); // bruit de vent à chaque coup de poing
      }
    }
    // au sol, le joueur reste sur place pendant le coup ; en l'air il garde sa vitesse et ses contrôles
    if (this.enCoup && auSol) {
      s.setVelocityX(0);
      return;
    }

    // ---- déplacement gauche / droite (si les deux touches sont tenues : on ne bouge pas) ----
    const gauche = t.gauche.isDown;
    const droite = t.droite.isDown;
    if (gauche && !droite) {
      s.setVelocityX(-PHYSIQUE.VITESSE);
      s.setFlipX(true);
    } else if (droite && !gauche) {
      s.setVelocityX(PHYSIQUE.VITESSE);
      s.setFlipX(false);
    } else {
      s.setVelocityX(0);
    }

    // ---- saut (Joystick Haut OU Bouton A) et chute rapide (Joystick Bas) ----
    if ((t.haut.isDown || t.sautBouton.isDown) && auSol) s.setVelocityY(-PHYSIQUE.SAUT);
    if (!auSol && t.bas.isDown && s.body.velocity.y < PHYSIQUE.CHUTE_RAPIDE) s.setVelocityY(PHYSIQUE.CHUTE_RAPIDE);

    // ---- animation (pendant un coup on garde l'animation du coup) ----
    if (this.enCoup) return;
    if (!auSol) {
      if (s.anims.currentAnim?.key !== "aria_jump") s.anims.play("aria_jump");
    } else if (gauche !== droite) {
      s.anims.play("aria_walk", true);
    } else {
      s.anims.play("aria_stand", true);
    }
  }

  // rectangle devant le joueur où le coup touche (même calcul que fonctions.js)
  zoneCoup() {
    const b = this.sprite.body;
    const x = this.sprite.flipX ? b.left - PHYSIQUE.COUP_PORTEE : b.right;
    return new Phaser.Geom.Rectangle(x, b.top, PHYSIQUE.COUP_PORTEE, b.height);
  }

  // DEBUG : rectangle blanc qui s'efface, pour vérifier la portée des coups
  afficherZoneCoup() {
    const z = this.zoneCoup();
    const r = this.scene.add.rectangle(z.centerX, z.centerY, z.width, z.height, 0xffffff, 0.35).setDepth(40);
    this.scene.tweens.add({ targets: r, alpha: 0, duration: 200, onComplete: () => r.destroy() });
  }

  // libère les touches et les objets créés (appelée à la sortie de la scène)
  detruire() {
    if (this.tweenMort) this.tweenMort.stop();
    this.retirerArme(true);
    Object.values(this.touches).forEach((k) => this.scene.input.keyboard.removeKey(k, true, true));
    this.etiquette.destroy();
    this.sprite.destroy();
  }
}