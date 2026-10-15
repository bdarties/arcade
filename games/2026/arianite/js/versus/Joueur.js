import { PHYSIQUE, REGLES, FRAME_IMPACT, JOUEURS, POLICE, DEBUG } from "./versusConfig.js";
import { ARMES, jouerSon } from "./armes.js";

// Attribution des directions et actions aux touches propres à chaque joueur.
const TOUCHES_ARCADE = {
  J1: {
    gauche: Phaser.Input.Keyboard.KeyCodes.LEFT,
    droite: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    haut: Phaser.Input.Keyboard.KeyCodes.UP,
    bas: Phaser.Input.Keyboard.KeyCodes.DOWN,
    sautBouton: Phaser.Input.Keyboard.KeyCodes.I,
    action: Phaser.Input.Keyboard.KeyCodes.O,
    lacher: Phaser.Input.Keyboard.KeyCodes.M
  },
  J2: {
    gauche: Phaser.Input.Keyboard.KeyCodes.Q,
    droite: Phaser.Input.Keyboard.KeyCodes.D,
    haut: Phaser.Input.Keyboard.KeyCodes.Z,
    bas: Phaser.Input.Keyboard.KeyCodes.S,
    sautBouton: Phaser.Input.Keyboard.KeyCodes.R,
    action: Phaser.Input.Keyboard.KeyCodes.T,
    lacher: Phaser.Input.Keyboard.KeyCodes.H
  }
};

// État, contrôles et apparence d'un participant du mode Versus.
export default class Joueur {
  constructor(scene, index, x, y) {
    this.scene = scene;
    this.index = index;
    this.infos = JOUEURS[index];

    this.sprite = scene.physics.add.sprite(x, y, "img_perso");
    this.sprite.setCollideWorldBounds(true);
    this.appliquerTeinte();

    this.touches = scene.input.keyboard.addKeys(TOUCHES_ARCADE[index === 0 ? "J1" : "J2"]);

    this.vies = REGLES.VIES;
    this.vivant = true;
    this.enCoup = false;
    this.dernierCoup = 0;
    this.coupDroit = true;
    this.etourdiJusqua = 0;
    this.invulnerableJusqua = 0;
    this.rouge = false;
    this.tweenMort = null;

    this.arme = null;
    this.armeSprite = null;
    this.endormi = false;
    this.endormiJusqua = 0;
    this.prochainZ = 0;

    this.etiquette = scene.add
      .text(x, y, index === 0 ? "J1" : "J2", { fontFamily: POLICE, fontSize: "20px", color: this.infos.couleurTexte, stroke: "#000", strokeThickness: 4 })
      .setOrigin(0.5, 1)
      .setDepth(50);

    this.sprite.on("animationcomplete", (anim) => {
      if (anim.key.startsWith("aria_punch")) this.enCoup = false;
    });
    // Les dégâts ne sont évalués qu'à la frame d'impact de l'animation.
    this.sprite.on("animationupdate", (anim, frame) => {
      if (!this.vivant || FRAME_IMPACT[anim.key] !== frame.textureFrame) return;
      scene.events.emit("versus:coup", this, this.zoneCoup());
      if (DEBUG) this.afficherZoneCoup();
    });
  }

  // Renvoie si les temporisations de dégâts ou de recul sont encore actives.
  get invulnerable() {
    return this.scene.time.now < this.invulnerableJusqua;
  }
  get etourdi() {
    return this.scene.time.now < this.etourdiJusqua;
  }

  // Combine la teinte de l'équipe avec les états temporaires du joueur.
  appliquerTeinte() {
    if (this.endormi) this.sprite.setTint(0x9a8cff);
    else if (this.infos.teinte !== null) this.sprite.setTint(this.infos.teinte);
    else this.sprite.clearTint();
  }

  // Replace le joueur et remet son sprite dans un état de départ valide.
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
    this.sprite.body.reset(x, y);
    this.sprite.setFlipX(!regardeDroite);
    this.sprite.anims.play("aria_stand", true);
  }

  // Réinitialise les vies et l'état du joueur au début d'une manche.
  nouvelleManche(x, y, regardeDroite) {
    this.vies = REGLES.VIES;
    this.invulnerableJusqua = 0;
    this.etourdiJusqua = 0;
    this.endormi = false;
    this.retirerArme(true);
    this.placer(x, y, regardeDroite);
  }

  // Équipe le sprite de l'arme et actualise l'interface du match.
  equiper(id, usages) {
    this.retirerArme(true);
    const def = ARMES[id];
    this.arme = { id, usages, vide: false, fusee: null, prochainTir: 0, clic: 0 };
    this.armeSprite = this.scene.add.image(0, 0, def.cle).setScale(def.echelle).setOrigin(def.origine[0], def.origine[1]).setDepth(3);
    this.majArme();
    if (this.scene.rafraichirArmesHUD) this.scene.rafraichirArmesHUD();
  }

  // Retire l'arme tenue et, sauf demande silencieuse, actualise l'interface.
  retirerArme(silencieux = false) {
    if (this.armeSprite) this.armeSprite.destroy();
    this.armeSprite = null;
    this.arme = null;
    if (!silencieux && this.scene.rafraichirArmesHUD) this.scene.rafraichirArmesHUD();
  }

  // Positionne l'arme dans la main selon la direction et l'apparence du joueur.
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

  // Endort le joueur et neutralise ses contrôles jusqu'à l'expiration du délai.
  endormir(duree) {
    if (!this.vivant) return;
    this.retirerArme();
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

  // Rétablit la teinte normale et joue le son de réveil.
  reveiller() {
    this.endormi = false;
    this.appliquerTeinte();
    jouerSon(this.scene, "reveil");
  }

  // Affiche périodiquement un « Z » animé au-dessus d'un joueur endormi.
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

  // Retire des cœurs et applique recul et invulnérabilité après un impact.
  subirCoup(direction, degats = 1, recul = 1) {
    if (!this.vivant || (this.invulnerable && !this.endormi)) return false;
    const maintenant = this.scene.time.now;
    this.vies = Math.max(0, this.vies - degats);
    if (this.endormi) return true;
    this.enCoup = false;
    this.etourdiJusqua = maintenant + PHYSIQUE.DUREE_ETOURDI;
    this.invulnerableJusqua = maintenant + PHYSIQUE.DUREE_INVULNERABLE;
    this.sprite.setVelocity(direction * PHYSIQUE.RECUL_X * recul, -PHYSIQUE.RECUL_Y * recul);
    this.sprite.setFlipX(direction > 0);
    return true;
  }

  // Désactive le joueur et joue son animation d'élimination.
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

  // Gère les états temporaires, les commandes, le mouvement et les animations.
  mettreAJour(actif) {
    const s = this.sprite;
    const t = this.touches;
    const maintenant = this.scene.time.now;
    const auSol = s.body.blocked.down || s.body.touching.down;

    this.etiquette.setPosition(s.x, s.body.top - 6);
    this.majArme();
    if (!this.vivant) {
      // Évite qu'une touche appuyée pendant l'élimination déclenche une action au retour.
      Phaser.Input.Keyboard.JustDown(t.action); // vide les touches : pas de coup "en attente"
      Phaser.Input.Keyboard.JustDown(t.lacher);
      return;
    }

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

    const rouge = this.etourdi;
    if (rouge !== this.rouge) {
      this.rouge = rouge;
      if (rouge) s.setTint(0xff5555);
      else this.appliquerTeinte();
    }
    s.setAlpha(this.invulnerable && Math.floor(maintenant / 70) % 2 ? 0.35 : 1);

    if (this.enCoup && !s.anims.currentAnim?.key.startsWith("aria_punch")) this.enCoup = false;

    if (!actif) {
      Phaser.Input.Keyboard.JustDown(t.action);
      Phaser.Input.Keyboard.JustDown(t.lacher);
      s.setVelocityX(0);
      if (auSol && !this.enCoup) s.anims.play("aria_stand", true);
      return;
    }

    if (this.etourdi) {
      Phaser.Input.Keyboard.JustDown(t.action);
      Phaser.Input.Keyboard.JustDown(t.lacher);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(t.lacher) && this.arme) this.scene.armes.lacher(this);

    if (!this.enCoup && Phaser.Input.Keyboard.JustDown(t.action)) {
      if (this.arme) {
        this.scene.armes.tirer(this);
      } else if (maintenant - this.dernierCoup >= PHYSIQUE.DELAI_ENTRE_COUPS) {
        this.enCoup = true;
        this.dernierCoup = maintenant;
        s.anims.play(this.coupDroit ? "aria_punch_right" : "aria_punch_left");
        this.coupDroit = !this.coupDroit;
        jouerSon(this.scene, "vent");
      }
    }
    if (this.enCoup && auSol) {
      s.setVelocityX(0);
      return;
    }

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

    if ((t.haut.isDown || t.sautBouton.isDown) && auSol) s.setVelocityY(-PHYSIQUE.SAUT);
    if (!auSol && t.bas.isDown && s.body.velocity.y < PHYSIQUE.CHUTE_RAPIDE) s.setVelocityY(PHYSIQUE.CHUTE_RAPIDE);

    if (this.enCoup) return;
    if (!auSol) {
      if (s.anims.currentAnim?.key !== "aria_jump") s.anims.play("aria_jump");
    } else if (gauche !== droite) {
      s.anims.play("aria_walk", true);
    } else {
      s.anims.play("aria_stand", true);
    }
  }

  // Calcule la zone rectangulaire située devant le joueur lors d'un coup.
  zoneCoup() {
    const b = this.sprite.body;
    const x = this.sprite.flipX ? b.left - PHYSIQUE.COUP_PORTEE : b.right;
    return new Phaser.Geom.Rectangle(x, b.top, PHYSIQUE.COUP_PORTEE, b.height);
  }

  // Affiche temporairement la zone de coup pour le diagnostic du combat.
  afficherZoneCoup() {
    const z = this.zoneCoup();
    const r = this.scene.add.rectangle(z.centerX, z.centerY, z.width, z.height, 0xffffff, 0.35).setDepth(40);
    this.scene.tweens.add({ targets: r, alpha: 0, duration: 200, onComplete: () => r.destroy() });
  }

  // Libère les touches et détruit les objets créés pour ce joueur.
  detruire() {
    if (this.tweenMort) this.tweenMort.stop();
    this.retirerArme(true);
    Object.values(this.touches).forEach((k) => this.scene.input.keyboard.removeKey(k, true, true));
    this.etiquette.destroy();
    this.sprite.destroy();
  }
}