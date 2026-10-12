import {
  SPRITES, IMAGES_COMBAT, COMBAT, TYPES_ENNEMIS, ENNEMIS, POTIONS, CALQUES_TILED, PATROUILLE_GARDE, TROUS, PNJS, MAPS, ENIGMES
} from "./maps.js";
import { SONS, jouer } from "./sons.js";

/*
  Tout le COMBAT du jeu : coup de poing, tir, laser, ennemis, potions, PNJ qui parlent.
  Ces fonctions sont ajoutées à la scène "jeu" (voir la dernière ligne de jeu.js) : "this" = la scène.
  Les réglages (vitesse, pv, positions...) sont tous dans maps.js.
*/
const combat = {
  /*************************
   *  CHARGEMENT            *
   *************************/
  chargerCombat() {
    Object.entries(SPRITES).forEach(([cle, s]) => {
      if (!this.textures.exists("sp_" + cle)) {
        this.load.spritesheet("sp_" + cle, s.fichier, { frameWidth: s.fw, frameHeight: s.fh });
      }
    });
    Object.entries(IMAGES_COMBAT).forEach(([cle, i]) => {
      if (!this.textures.exists("im_" + cle)) this.load.image("im_" + cle, i.fichier);
    });
  },

  creerTexturesCombat() {
    // potion rouge (soin) = la potion violette dont on change la couleur
    if (!this.textures.exists("potion_soin") && this.textures.exists("im_potion")) {
      try {
        const img = this.textures.get("im_potion").getSourceImage();
        const ct = this.textures.createCanvas("potion_soin", img.width, img.height);
        const ctx = ct.getContext();
        ctx.drawImage(img, 0, 0);
        const donnees = ctx.getImageData(0, 0, img.width, img.height);
        const d = donnees.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] === 0) continue;
          const hsv = Phaser.Display.Color.RGBToHSV(d[i], d[i + 1], d[i + 2]);
          if (hsv.s > 0.25) {
            const c = Phaser.Display.Color.HSVToRGB(0.0, Math.min(1, hsv.s * 1.1), hsv.v);
            d[i] = c.r;
            d[i + 1] = c.g;
            d[i + 2] = c.b;
          }
        }
        ctx.putImageData(donnees, 0, 0);
        ct.refresh();
      } catch (e) {
        /* image non modifiable : on utilisera une teinte rouge à la place */
      }
    }
  },

  creerAnimsCombat() {
    Object.entries(SPRITES).forEach(([cle, s]) => {
      if (this.anims.exists("anim_" + cle) || !this.textures.exists("sp_" + cle)) return;
      this.anims.create({
        key: "anim_" + cle,
        frames: this.anims.generateFrameNumbers("sp_" + cle, { start: 0, end: s.frames - 1 }),
        frameRate: s.fps,
        repeat: -1
      });
    });
  },

  /*************************
   *  INITIALISATION        *
   *************************/
  initCombat(plateformes) {
    this.plateformes = plateformes;
    this.ennemis = [];
    this.potions = [];
    this.dialogue = null;
    this.derniereAlertePotion = 0;

    this.creerTexturesCombat();
    this.creerAnimsCombat();

    this.groupeEnn = this.physics.add.group();
    this.boulesJ = this.physics.add.group({ allowGravity: false });
    this.boulesE = this.physics.add.group({ allowGravity: false });
    this.laserGfx = this.add.graphics().setDepth(160);
    this.barresGfx = this.add.graphics().setDepth(300);

    // état de combat de chaque joueur
    this.joueurs.forEach((j) => {
      j.dir = 1;
      j.prochainCoup = 0;
      j.prochainTir = 0;
      j.appuiT0 = null;
      j.laserActif = false;
      j.laserCePress = false;
      j.prochainTick = 0;
      j.sonLaser = null;
      j.energie = COMBAT.laser.energieMax;
      j.reculJusqua = 0;
      // petite protection à l'arrivée dans une pièce
      if (!j.mort) {
        j.invulJusqua = this.time.now + 1500;
        j.sprite.setAlpha(0.4);
        this.time.delayedCall(1500, () => j.sprite.active && j.sprite.setAlpha(1));
      }
    });

    // les ennemis marchent sur les plateformes
    if (plateformes) {
      this.physics.add.collider(this.groupeEnn, plateformes);
      this.physics.add.collider(this.boulesJ, plateformes, (b) => this.detruireBoule(b));
      this.physics.add.collider(this.boulesE, plateformes, (b) => this.detruireBoule(b));
    }
    // tir du joueur -> ennemi
    this.physics.add.overlap(this.boulesJ, this.groupeEnn, (b, s) => {
      if (!b.active || !s.active || s.e.mort) return;
      const dir = b.body.velocity.x >= 0 ? 1 : -1;
      this.etincelles(b.x, b.y, 0x66ffcc);
      b.destroy();
      this.frapperEnnemi(s, COMBAT.tir.degats, dir, 160);
    });
    // boule ennemie -> joueur
    // (Phaser peut inverser l'ordre des deux objets quand on mélange groupe et sprites : on retrouve qui est qui)
    this.physics.add.overlap(this.boulesE, this.joueurs.map((j) => j.sprite), (o1, o2) => {
      const b = o1.joueur ? o2 : o1;
      const sprite = o1.joueur ? o1 : o2;
      if (!b || !b.active || !sprite || !sprite.joueur) return;
      const j = sprite.joueur;
      if (j.mort) return;
      this.etincelles(b.x, b.y, 0xff9933);
      const dmg = b.degats || 17;
      const x = b.x;
      b.destroy();
      this.perdreVie(j, dmg, x);
    });

    this.creerEnnemis();
    this.creerPotions();
    this.creerPNJ();
    this.creerIndiceHautPorte();

    // si on quitte la map pendant un laser, on coupe le son
    this.events.once("shutdown", () => this.joueurs.forEach((j) => j.sonLaser && j.sonLaser.stop()));

    // le PNJ du début se met à parler tout seul, une seule fois
    const intro = (PNJS[this.nomMap] || []).find((p) => p.auto && !(p.vu && this.registry.get(p.vu)));
    if (intro && !this.origine && !this.hasard) {
      this.time.delayedCall(700, () => {
        const j = this.vivants()[0];
        if (j && !this.dialogue) this.parler(intro, j);
      });
    }
  },

  // petit affichage sous les cœurs : durée du pouvoir + énergie du laser
  initHudCombat() {
    this.hudGfx = this.add.graphics().setScrollFactor(0).setDepth(1004);
    this.hudPouvoir = this.joueurs.map((j, i) =>
      this.add
        .text(10 + i * 216 + 6, 90, "", { fontSize: "14px", color: "#d3b3ff", backgroundColor: "#000a", padding: { x: 4, y: 1 } })
        .setScrollFactor(0)
        .setDepth(1004)
    );
  },

  /*************************
   *  OUTILS                *
   *************************/
  aPouvoir(j) {
    return (this.registry.get("pouvoir_" + j.num) || 0) > Date.now();
  },

  donnerPouvoir(j) {
    const fin = COMBAT.pouvoirDuree > 0 ? Date.now() + COMBAT.pouvoirDuree : Number.MAX_SAFE_INTEGER;
    this.registry.set("pouvoir_" + j.num, fin);
    this.cameras.main.flash(300, 170, 80, 255); // (le son vient déjà du fichier "potion")
    this.message("Potion violette ! Tu as un POUVOIR.\nBouton B : tirer      MAINTIENS B : laser", 5500);
  },

  couperLasers() {
    (this.joueurs || []).forEach((j) => {
      if (j.sonLaser) j.sonLaser.stop();
      j.sonLaser = null;
      j.laserActif = false;
    });
    if (this.laserGfx) this.laserGfx.clear();
  },

  // joueur vivant le plus proche d'un sprite : { j, dx, dy, dist, cx, cy }
  joueurProche(s) {
    let meilleur = null;
    const c = s.body.center;
    this.vivants().forEach((j) => {
      const b = j.sprite.body;
      const dx = b.center.x - c.x;
      const dy = b.center.y - c.y;
      const dist = Math.hypot(dx, dy);
      if (!meilleur || dist < meilleur.dist) meilleur = { j, dx, dy, dist, cx: b.center.x, cy: b.center.y };
    });
    return meilleur;
  },

  rectCorps(sprite) {
    const b = sprite.body;
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
  },

  // hauteur du sol sous un point (pour poser une potion tombée d'un ennemi)
  solSous(x, y) {
    if (!this.plateformes) return y;
    for (let yy = y; yy < this.physics.world.bounds.height; yy += 8) {
      const t = this.plateformes.getTileAtWorldXY(x, yy);
      if (t && t.index !== -1) return t.pixelY;
    }
    return y;
  },

  etincelles(x, y, couleur = 0xffffff, n = 6) {
    for (let i = 0; i < n; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(2, 4), couleur).setDepth(250);
      const a = Math.random() * Math.PI * 2;
      const d = Phaser.Math.Between(14, 34);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d,
        alpha: 0,
        duration: 280,
        onComplete: () => p.destroy()
      });
    }
  },

  detruireBoule(b) {
    if (b && b.active) {
      this.etincelles(b.x, b.y, 0xdddddd, 3);
      b.destroy();
    }
  },

  /*************************
   *  ENNEMIS               *
   *************************/
  // points posés dans Tiled : [{ x, y }, ...] en PIXELS pour un calque d'objets (liste vide s'il n'existe pas)
  pointsTiled(nomCalque) {
    const calque = this.carte && this.carte.getObjectLayer(nomCalque);
    return calque && calque.objects ? calque.objects.filter((o) => o.visible !== false) : [];
  },

  // tous les ennemis de la map : ceux des calques Tiled "ennemis 1" / "ennemis 2" + ceux écrits à la main (ENNEMIS dans maps.js)
  listeEnnemis() {
    const liste = [];
    Object.entries(CALQUES_TILED).forEach(([nomCalque, c]) => {
      if (c.genre !== "ennemi") return;
      this.pointsTiled(nomCalque).forEach((o) => {
        const def = { type: c.type, x: (o.x - 16) / 32, y: o.y / 32 }; // x en tuiles (le centre de l'ennemi = le point)
        if (c.type === "garde") def.zone = [Math.floor(o.x / 32) - PATROUILLE_GARDE, Math.floor(o.x / 32) + PATROUILLE_GARDE];
        liste.push(def);
      });
    });
    return liste.concat(ENNEMIS[this.nomMap] || []);
  },

  creerEnnemis() {
    this.listeEnnemis().forEach((def) => {
      const t = TYPES_ENNEMIS[def.type];
      const sp = t && SPRITES[t.sprite];
      if (!t || !sp || !this.textures.exists("sp_" + t.sprite)) return;
      const s = this.groupeEnn.create(def.x * 32 + 16, def.y * 32, "sp_" + t.sprite);
      s.setOrigin(0.5, 1).setScale(sp.echelle).setDepth(90);
      s.body.setSize(sp.corps[0], sp.corps[1]).setOffset(sp.corps[2], sp.corps[3]);
      s.setCollideWorldBounds(true);
      s.anims.play("anim_" + t.sprite);

      const e = {
        def, t, sp, pv: t.pv, pvMax: t.pv, mort: false, dir: Math.random() < 0.5 ? -1 : 1,
        stun: 0, prochainCoup: this.time.now + 800, prepareJusqua: 0, etat: "patrouille"
      };
      e.zone = def.zone
        ? { x1: def.zone[0] * 32, x2: (def.zone[1] + 1) * 32 }
        : { x1: s.x - 16, x2: s.x + 16 };
      s.e = e;
      this.ennemis.push(s);
    });
  },

  // le dessin regarde-t-il à droite ? (flipX si l'orientation voulue est l'inverse du dessin)
  orienter(s, dir) {
    s.setFlipX(s.e.sp.regardeDroite ? dir < 0 : dir > 0);
  },

  majEnnemis(time) {
    this.ennemis.forEach((s) => {
      if (!s.active || s.e.mort) return;
      const e = s.e;
      if (e.stun > time) return; // vient d'être touché
      const cible = this.joueurProche(s);
      if (e.def.type === "garde") this.iaGarde(s, e, time, cible);
      else if (e.def.type === "tireur") this.iaTireur(s, e, time, cible);
    });
  },

  // ---- GARDE : corps à corps, il frappe ----
  iaGarde(s, e, time, cible) {
    const t = e.t;
    const z = e.zone;
    // il arme son coup
    if (e.prepareJusqua) {
      s.setVelocityX(0);
      s.anims.pause();
      if (time >= e.prepareJusqua) {
        e.prepareJusqua = 0;
        s.clearTint();
        s.anims.resume();
        jouer(this, "coup");
        this.effetCoupEnnemi(s, e.dir);
        const c = this.joueurProche(s);
        if (c && Math.abs(c.dx) < t.portee + 24 && Math.abs(c.dy) < 64) this.perdreVie(c.j, t.degats, s.x);
        e.prochainCoup = time + t.recharge;
      }
      return;
    }
    let vx;
    const voit = cible && Math.abs(cible.dy) < 90 && Math.abs(cible.dx) < t.detection;
    if (voit) {
      e.dir = cible.dx > 0 ? 1 : -1;
      if (Math.abs(cible.dx) < t.portee && time >= e.prochainCoup) {
        e.prepareJusqua = time + t.preparation;
        s.setTint(0xff8888);
        jouer(this, "alerte");
        s.setVelocityX(0);
        return;
      }
      vx = Math.abs(cible.dx) < t.portee * 0.7 ? 0 : e.dir * t.vitesseChasse;
    } else {
      if (s.body.blocked.left) e.dir = 1;
      else if (s.body.blocked.right) e.dir = -1;
      vx = e.dir * t.vitesse;
    }
    // il reste dans sa zone
    if (s.x <= z.x1 && vx < 0) { vx = voit ? 0 : t.vitesse; if (!voit) e.dir = 1; }
    if (s.x >= z.x2 && vx > 0) { vx = voit ? 0 : -t.vitesse; if (!voit) e.dir = -1; }
    s.setVelocityX(vx);
    this.orienter(s, e.dir);
    if (vx !== 0) s.anims.resume();
    else s.anims.pause();
  },

  effetCoupEnnemi(s, dir) {
    const g = this.add.graphics().setDepth(250);
    g.lineStyle(5, 0xff6666, 0.9);
    g.beginPath();
    const cx = s.x + dir * 22;
    const cy = s.y - 26;
    g.arc(cx, cy, 30, dir > 0 ? -1.0 : Math.PI - 1.0, dir > 0 ? 1.0 : Math.PI + 1.0);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
  },

  // ---- TIREUR : reste en place et envoie des boules orange ----
  iaTireur(s, e, time, cible) {
    const t = e.t;
    const voit = cible && Math.abs(cible.dx) < t.detection && Math.abs(cible.dy) < 160;
    s.setVelocityX(0);
    if (!voit) {
      if (e.prepareJusqua) {
        e.prepareJusqua = 0;
        s.clearTint();
      }
      return;
    }
    e.dir = cible.dx > 0 ? 1 : -1;
    this.orienter(s, e.dir);
    if (e.prepareJusqua) {
      if (time >= e.prepareJusqua) {
        e.prepareJusqua = 0;
        s.clearTint();
        this.tirerEnnemi(s, cible);
        e.prochainCoup = time + t.recharge;
      }
    } else if (time >= e.prochainCoup) {
      e.prepareJusqua = time + t.preparation;
      s.setTint(0xffaa55); // il charge son tir
      jouer(this, "alerte");
    }
  },

  tirerEnnemi(s, cible) {
    const t = s.e.t;
    const x = s.x + s.e.dir * 16;
    const y = s.y - 28;
    const ang = Math.atan2(cible.cy - y, cible.cx - x);
    const im = IMAGES_COMBAT.boule_ennemi;
    const b = this.boulesE.create(x, y, "im_boule_ennemi");
    b.setScale(im.echelle).setDepth(95);
    b.body.allowGravity = false;
    b.body.setSize(14, 14).setOffset(9, 9);
    b.degats = t.degats;
    b.setRotation(im.regardeDroite ? ang : ang + Math.PI);
    b.setVelocity(Math.cos(ang) * t.vitesseBoule, Math.sin(ang) * t.vitesseBoule);
    this.time.delayedCall(2600, () => b.active && b.destroy());
    jouer(this, "tirEnnemi");
  },

  // un ennemi reçoit des dégâts (dir : sens du coup, 1 = vers la droite)
  frapperEnnemi(s, degats, dir, recul = 120, silencieux = false) {
    if (!s.active || s.e.mort) return;
    const e = s.e;
    e.pv -= degats;
    if (!silencieux) jouer(this, "impact");
    s.setTintFill(0xffffff);
    this.time.delayedCall(70, () => s.active && !e.mort && s.clearTint());
    if (e.pv <= 0) {
      this.mortEnnemi(s);
      return;
    }
    e.stun = this.time.now + 180;
    e.prepareJusqua = 0;
    s.setVelocityX(dir * recul);
  },

  mortEnnemi(s) {
    const e = s.e;
    e.mort = true;
    jouer(this, "mortEnnemi");
    this.etincelles(s.x, s.y - 20, 0xffffff, 10);
    s.disableBody(true, false);
    s.clearTint();
    this.tweens.add({
      targets: s, alpha: 0, scaleX: s.scaleX * 1.3, scaleY: s.scaleY * 0.6, duration: 320,
      onComplete: () => s.destroy()
    });
    // parfois il laisse une potion rouge
    if (Math.random() < COMBAT.chanceDropSoin) {
      const sol = this.solSous(s.x, s.y);
      this.creerPotion(s.x, sol, "soin", null);
    }
  },

  /*************************
   *  POTIONS               *
   *************************/
  // toutes les potions de la map : calques Tiled "potion pouvoir" (violette) / "potion coeur" (rouge) + celles écrites à la main (POTIONS)
  listePotions() {
    const liste = [];
    Object.entries(CALQUES_TILED).forEach(([nomCalque, c]) => {
      if (c.genre !== "potion") return;
      this.pointsTiled(nomCalque).forEach((o) => {
        // le point Tiled est en l'air : on pose la potion sur le sol juste en dessous
        liste.push({ px: o.x, py: this.solSous(o.x, o.y), type: c.type });
      });
    });
    (POTIONS[this.nomMap] || []).forEach((d) => liste.push({ px: d.x * 32, py: d.y * 32, type: d.type }));
    return liste;
  },

  creerPotions() {
    const prises = this.registry.get("potions_prises") || [];
    this.listePotions().forEach((def, i) => {
      const id = this.nomMap + "_" + i;
      if (prises.includes(id)) return;
      this.creerPotion(def.px, def.py, def.type, id);
    });
  },

  creerPotion(px, py, type, id) {
    if (!this.textures.exists("im_potion")) return;
    const rouge = type === "soin";
    const cle = rouge && this.textures.exists("potion_soin") ? "potion_soin" : "im_potion";
    const echelle = IMAGES_COMBAT.potion.echelle;
    const lueur = this.add.circle(px, py - 14, 20, rouge ? 0xff3344 : 0xaa44ff, 0.28).setDepth(79);
    const img = this.add.image(px, py, cle).setOrigin(0.5, 1).setScale(echelle).setDepth(80);
    if (rouge && cle === "im_potion") img.setTint(0xff6666);
    this.tweens.add({ targets: img, y: py - 5, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: lueur, alpha: 0.08, scale: 1.4, duration: 800, yoyo: true, repeat: -1 });
    this.potions.push({ img, lueur, type, id, zone: new Phaser.Geom.Rectangle(px - 20, py - 40, 40, 46) });
  },

  majPotions() {
    for (let i = this.potions.length - 1; i >= 0; i--) {
      const p = this.potions[i];
      for (const j of this.vivants()) {
        if (!Phaser.Geom.Intersects.RectangleToRectangle(this.rectCorps(j.sprite), p.zone)) continue;
        if (p.type === "soin") {
          const pv = this.registry.get("pv_" + j.num) ?? 100;
          if (pv >= 100) {
            // vie pleine : on la laisse pour plus tard
            if (this.time.now > this.derniereAlertePotion) {
              this.derniereAlertePotion = this.time.now + 4000;
              this.message("Ta vie est pleine. Garde cette potion pour plus tard !", 2500);
            }
            continue;
          }
          this.soigner(j, COMBAT.soinPotion);
          jouer(this, "potion");
          this.etincelles(j.sprite.x, j.sprite.y - 30, 0xff6677, 8);
        } else {
          jouer(this, "potion");
          this.time.delayedCall(350, () => this.donnerPouvoir(j));
          this.etincelles(j.sprite.x, j.sprite.y - 30, 0xbb66ff, 8);
        }
        if (p.id) {
          const prises = (this.registry.get("potions_prises") || []).concat(p.id);
          this.registry.set("potions_prises", prises);
        }
        this.tweens.killTweensOf(p.img);
        this.tweens.killTweensOf(p.lueur);
        p.img.destroy();
        p.lueur.destroy();
        this.potions.splice(i, 1);
        break;
      }
    }
  },

  /*************************
   *  TROUS MORTELS         *
   *************************/
  majTrous() {
    const defs = TROUS[this.nomMap];
    if (!defs) return;
    for (const j of this.vivants()) {
      const b = j.sprite.body;
      if (!b) continue;
      const trou = defs.find((t) => j.sprite.x > t.x1 * 32 && j.sprite.x < t.x2 * 32 && b.bottom >= t.y * 32 - 2);
      if (!trou) continue;
      jouer(this, "pique");
      this.cameras.main.shake(250, 0.012);
      this.registry.set("pv_" + j.num, 0);
      this.joueurMort(j);
    }
  },

  // flèche dorée au-dessus de la porte cachée (map4) une fois la clé trouvée : indice visuel
  creerIndiceHautPorte() {
    if (!this.registry.get("cle")) return;
    const porte = (MAPS[this.nomMap].portes || []).find((p) => p.vers === "map6");
    if (!porte) return;
    const f = this.add
      .text((porte.x + 1) * 32, porte.y * 32 - 6, "▼", { fontSize: "34px", color: "#ffd24a" })
      .setOrigin(0.5, 1)
      .setDepth(150);
    this.tweens.add({ targets: f, y: f.y - 12, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  },

  /*************************
   *  ATTAQUES DU JOUEUR    *
   *************************/
  majAttaques(time, delta) {
    const L = COMBAT.laser;
    this.vivants().forEach((j) => {
      const k = j.touches.attaque;
      if (!k) return;
      const bas = k.isDown;
      const appui = Phaser.Input.Keyboard.JustDown(k);
      const relache = Phaser.Input.Keyboard.JustUp(k);
      const pouvoir = this.aPouvoir(j);

      if (!pouvoir) {
        // SANS POUVOIR : coup de poing
        if (j.laserActif) this.arreterLaser(j);
        if (appui && time >= j.prochainCoup) this.coup(j, time);
        j.appuiT0 = null;
      } else {
        // AVEC POUVOIR : appui court = tir, appui long = laser
        if (appui) {
          j.appuiT0 = time;
          j.laserCePress = false;
        }
        if (j.laserActif) {
          if (!bas || j.energie <= 0) this.arreterLaser(j);
        } else if (bas && j.appuiT0 !== null && time - j.appuiT0 >= L.delai && j.energie >= L.energieMin) {
          this.demarrerLaser(j);
        }
        if (relache) {
          if (!j.laserCePress && j.appuiT0 !== null) this.tirer(j, time);
          j.appuiT0 = null;
        }
      }

      // énergie du laser
      if (j.laserActif) j.energie = Math.max(0, j.energie - (L.coutParSeconde * delta) / 1000);
      else j.energie = Math.min(L.energieMax, j.energie + (L.rechargeParSeconde * delta) / 1000);
    });
    this.dessinerLasers(time);
  },

  coup(j, time) {
    const c = COMBAT.coup;
    j.prochainCoup = time + c.recharge;
    const s = j.sprite;
    const dir = j.dir;
    jouer(this, "coup");
    // effet visuel : un arc blanc devant le joueur
    const g = this.add.graphics().setDepth(250);
    g.lineStyle(5, 0xffffff, 0.95);
    g.beginPath();
    g.arc(s.x + dir * 18, s.y - 26, 32, dir > 0 ? -1.1 : Math.PI - 1.1, dir > 0 ? 1.1 : Math.PI + 1.1);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 140, onComplete: () => g.destroy() });

    const zone = new Phaser.Geom.Rectangle(dir > 0 ? s.x + 2 : s.x - 2 - c.portee, s.y - c.hauteur, c.portee, c.hauteur);
    this.ennemis.forEach((e) => {
      if (!e.active || e.e.mort) return;
      if (Phaser.Geom.Intersects.RectangleToRectangle(zone, this.rectCorps(e))) this.frapperEnnemi(e, c.degats, dir, c.recul);
    });
    this.boulesE.getChildren().forEach((b) => {
      if (b.active && zone.contains(b.x, b.y)) this.detruireBoule(b); // on peut casser les boules ennemies
    });
  },

  tirer(j, time) {
    const T = COMBAT.tir;
    if (time < j.prochainTir) return;
    j.prochainTir = time + T.recharge;
    const im = IMAGES_COMBAT.boule_joueur;
    const dir = j.dir;
    const b = this.boulesJ.create(j.sprite.x + dir * 18, j.sprite.y - 26, "im_boule_joueur");
    b.setScale(im.echelle).setDepth(95);
    b.setFlipX(im.regardeDroite ? dir < 0 : dir > 0);
    b.body.allowGravity = false;
    b.body.setSize(14, 14).setOffset(9, 9);
    b.setVelocityX(dir * T.vitesse);
    this.time.delayedCall(T.duree, () => b.active && b.destroy());
    jouer(this, "tir");
  },

  demarrerLaser(j) {
    j.laserActif = true;
    j.laserCePress = true;
    j.prochainTick = 0;
    j.sonLaser = SONS.laserOn(this);
  },

  arreterLaser(j) {
    j.laserActif = false;
    if (j.sonLaser) j.sonLaser.stop();
    j.sonLaser = null;
  },

  dessinerLasers(time) {
    const g = this.laserGfx;
    g.clear();
    const L = COMBAT.laser;
    this.vivants().forEach((j) => {
      if (!j.laserActif) return;
      const s = j.sprite;
      const dir = j.dir;
      const x0 = s.x + dir * 14;
      const y0 = s.y - 26;
      // le laser s'arrête sur un mur
      let len = L.longueur;
      if (this.plateformes) {
        for (let d = 0; d < L.longueur; d += 8) {
          const t = this.plateformes.getTileAtWorldXY(x0 + dir * d, y0);
          if (t && t.index !== -1) { len = d; break; }
        }
      }
      const gauche = dir > 0 ? x0 : x0 - len;
      const ep = L.epaisseur * (0.9 + Math.random() * 0.25);
      g.fillStyle(0x33ffaa, 0.28).fillRect(gauche, y0 - ep * 1.1, len, ep * 2.2);
      g.fillStyle(0x66ffcc, 0.7).fillRect(gauche, y0 - ep / 2, len, ep);
      g.fillStyle(0xffffff, 0.95).fillRect(gauche, y0 - 2, len, 4);
      g.fillStyle(0xffffff, 0.8).fillCircle(x0 + dir * len, y0, ep * 0.8);

      // dégâts à intervalle régulier
      if (time >= j.prochainTick) {
        j.prochainTick = time + L.tick;
        const zone = new Phaser.Geom.Rectangle(gauche, y0 - ep, len, ep * 2);
        this.ennemis.forEach((e) => {
          if (!e.active || e.e.mort) return;
          if (Phaser.Geom.Intersects.RectangleToRectangle(zone, this.rectCorps(e))) {
            this.frapperEnnemi(e, L.degatsParTick, dir, 30, true);
            this.etincelles(e.x, e.y - 24, 0x66ffcc, 2);
          }
        });
        this.boulesE.getChildren().forEach((b) => {
          if (b.active && zone.contains(b.x, b.y)) this.detruireBoule(b);
        });
      }
    });
  },

  /*************************
   *  BARRES (ennemis, HUD) *
   *************************/
  majBarresCombat() {
    const g = this.barresGfx;
    g.clear();
    this.ennemis.forEach((s) => {
      if (!s.active || s.e.mort || s.e.pv >= s.e.pvMax) return;
      const w = 34;
      const x = s.x - w / 2;
      const y = s.y - (s.displayHeight + 6);
      g.fillStyle(0x000000, 0.7).fillRect(x - 1, y - 1, w + 2, 7);
      g.fillStyle(0xdd2222, 1).fillRect(x, y, (w * Math.max(0, s.e.pv)) / s.e.pvMax, 5);
    });
    // HUD : énergie du laser + durée du pouvoir
    const h = this.hudGfx;
    if (!h) return;
    h.clear();
    this.joueurs.forEach((j, i) => {
      const txt = this.hudPouvoir[i];
      const reste = (this.registry.get("pouvoir_" + j.num) || 0) - Date.now();
      if (j.mort || reste <= 0) {
        txt.setVisible(false);
        return;
      }
      txt.setVisible(true);
      txt.setText(reste > 1e12 ? "POUVOIR" : "POUVOIR " + Math.ceil(reste / 1000) + "s");
      const ox = 10 + i * 216 + 6;
      const pct = j.energie / COMBAT.laser.energieMax;
      h.fillStyle(0x000000, 0.7).fillRect(ox - 1, 78, 152, 9);
      h.fillStyle(pct < 0.25 ? 0xff5555 : 0x44ffbb, 1).fillRect(ox, 79, 150 * pct, 7);
    });
  },

  majCombat(time, delta) {
    this.majAttaques(time, delta);
    this.majEnnemis(time);
    this.majPotions();
    this.majTrous();
    this.majBarresCombat();
    this.orienterPNJ();
  },

  orienterPNJ() {
    const j = this.vivants()[0];
    if (!j) return;
    (PNJS[this.nomMap] || []).forEach((def) => {
      const s = def._sprite;
      if (!s || !s.active) return;
      const aDroite = j.sprite.x > s.x;
      s.setFlipX(SPRITES[def.sprite].regardeDroite ? !aDroite : aDroite);
    });
  },

  /*************************
   *  PNJ + DIALOGUES       *
   *************************/
  creerPNJ() {
    (PNJS[this.nomMap] || []).forEach((def) => {
      const sp = SPRITES[def.sprite];
      if (!sp || !this.textures.exists("sp_" + def.sprite)) return;
      const s = this.add.sprite(def.x * 32 + 16, def.y * 32, "sp_" + def.sprite).setOrigin(0.5, 1).setScale(sp.echelle).setDepth(85);
      s.anims.play("anim_" + def.sprite);
      def._sprite = s;
      // zone où on peut lui parler (3 tuiles de large)
      this.points.push(this.fabriquerZone({ x: def.x - 1, y: def.y - 3, l: 3, h: 3, type: "pnj", pnj: def }));
      // petit "!" qui flotte tant qu'il a quelque chose à dire
      const bulle = this.add.text(s.x, s.y - s.displayHeight - 4, "!", { fontSize: "26px", color: "#ffd24a", fontStyle: "bold", stroke: "#000", strokeThickness: 4 }).setOrigin(0.5, 1).setDepth(150);
      this.tweens.add({ targets: bulle, y: bulle.y - 8, duration: 500, yoyo: true, repeat: -1 });
      def._bulle = bulle;
    });
  },

  fabriquerZone(def) {
    const zone = this.add.zone((def.x + def.l / 2) * 32, (def.y + def.h / 2) * 32, def.l * 32, def.h * 32);
    this.physics.add.existing(zone, true);
    zone.def = def;
    return zone;
  },

  // un PNJ commence à parler
  parler(pnj, joueur) {
    if (this.dialogue || this.enigme) return;
    const requisManquant = pnj.requiert && !this.registry.get(pnj.requiert);
    let lignes;
    if (pnj.enigme && this.registry.get(pnj.resolu)) lignes = pnj.apres;
    else if (requisManquant) lignes = pnj.avant;
    else if (pnj.vu && this.registry.get(pnj.vu) && pnj.rappel) lignes = [Phaser.Utils.Array.GetRandom(pnj.rappel)];
    else lignes = pnj.dialogue;

    const apres = () => {
      if (pnj.vu) this.registry.set(pnj.vu, true);
      if (pnj.enigme && !requisManquant && !this.registry.get(pnj.resolu)) this.ouvrirEnigme(pnj.enigme, joueur);
      if (pnj._bulle && (!pnj.enigme || this.registry.get(pnj.resolu))) pnj._bulle.setVisible(false);
    };
    this.ouvrirDialogue(pnj, lignes, apres);
  },

  ouvrirDialogue(pnj, lignes, quandFini) {
    this.couperLasers();
    this.physics.world.pause();
    this.indice.setVisible(false);
    const L = this.scale.width;
    const H = this.scale.height;
    const fixe = (o, prof) => o.setScrollFactor(0).setDepth(prof);
    const police = { fontFamily: "Georgia, serif" };
    const objets = [];
    objets.push(fixe(this.add.rectangle(L / 2, H - 110, 1040, 170, 0x0d0610, 0.95).setStrokeStyle(3, 0x8a1c1c), 1400));
    objets.push(fixe(this.add.text(L / 2 - 490, H - 180, pnj.nom, { ...police, fontSize: "24px", fontStyle: "italic", color: "#c9a24a" }), 1401));
    const texte = fixe(this.add.text(L / 2 - 490, H - 148, "", { ...police, fontSize: "24px", color: "#ffffff", wordWrap: { width: 980 } }), 1401);
    const suite = fixe(this.add.text(L / 2 + 490, H - 50, "A ▶", { ...police, fontSize: "18px", color: "#999999" }).setOrigin(1, 0.5), 1401);
    objets.push(texte, suite);

    const d = { pnj, lignes, i: 0, texte, suite, objets, quandFini, car: 0, fini: false, debut: Date.now(), gele: !!pnj.gelerTemps };
    d.minuteur = this.time.addEvent({
      delay: 26,
      loop: true,
      callback: () => {
        if (d.car >= d.lignes[d.i].length) return;
        d.car++;
        d.texte.setText(d.lignes[d.i].slice(0, d.car));
        if (d.car % 3 === 0) jouer(this, "parler");
        if (d.car >= d.lignes[d.i].length) d.suite.setAlpha(1);
      }
    });
    suite.setAlpha(0.3);
    this.dialogue = d;
    // on vide les appuis "en retard"
    this.joueurs.forEach((j) => [j.touches.saut, j.touches.action].forEach((k) => Phaser.Input.Keyboard.JustDown(k)));
  },

  gererDialogue() {
    const d = this.dialogue;
    let suivant = false;
    let fermer = false;
    this.vivants().forEach((j) => {
      if (j.appuiAction) suivant = true;
      if (Phaser.Input.Keyboard.JustDown(j.touches.saut)) fermer = true;
    });
    if (fermer) {
      this.fermerDialogue();
      return;
    }
    if (!suivant) return;
    const ligne = d.lignes[d.i];
    if (d.car < ligne.length) {
      d.car = ligne.length; // affiche toute la ligne d'un coup
      d.texte.setText(ligne);
      d.suite.setAlpha(1);
      return;
    }
    jouer(this, "page");
    if (d.i < d.lignes.length - 1) {
      d.i++;
      d.car = 0;
      d.texte.setText("");
      d.suite.setAlpha(0.3);
    } else {
      this.fermerDialogue();
    }
  },

  fermerDialogue() {
    const d = this.dialogue;
    if (!d) return;
    this.dialogue = null;
    d.minuteur.remove(false);
    d.objets.forEach((o) => o.destroy());
    // le timer de 3 minutes est en pause pendant que le PNJ du début parle
    if (d.gele && this.registry.has("finPartie")) this.registry.set("finPartie", this.registry.get("finPartie") + (Date.now() - d.debut));
    this.physics.world.resume();
    if (d.quandFini) d.quandFini();
  }
};

export default combat;
