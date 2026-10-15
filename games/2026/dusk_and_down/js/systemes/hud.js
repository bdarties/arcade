import { ECRAN, PROFONDEUR, POLICE_TITRE, POLICE_TEXTE, BARRES } from "../reglages/config.js";
import { BIENFAITS, CATEGORIES } from "../reglages/bienfaits.js";
import { formaterTemps } from "../fonctions.js";
import { estVisible } from "./carte.js";

const TITRE = { fontFamily: POLICE_TITRE, fontSize: "20px", color: "#f6e6c8", stroke: "#000000", strokeThickness: 4 };
const TEXTE = { fontFamily: POLICE_TEXTE, fontSize: "17px", color: "#e8dcc4", stroke: "#000000", strokeThickness: 3 };

export function creerHud(scene) {
  const hud = {};
  const fixer = (objet) => objet.setScrollFactor(0).setDepth(PROFONDEUR.hud);
  const centre = ECRAN.largeur / 2;

  const templeX = centre - 220;
  hud.templeRemplissage = fixer(
    scene.add.image(templeX + BARRES.temple.x, BARRES.temple.y, "temple_remplissage").setOrigin(0)
  );
  const templeCadre = fixer(scene.add.image(templeX, 0, "temple_cadre").setOrigin(0));
  const sousTemple = templeCadre.height;
  hud.templeTitre = fixer(scene.add.text(centre, sousTemple, "TEMPLE DE L'AUBE", TITRE).setOrigin(0.5, 0));
  hud.infos = fixer(scene.add.text(centre, sousTemple + 24, "", { ...TEXTE, fontSize: "16px" }).setOrigin(0.5, 0));
  hud.texteTemple = "";
  hud.texteInfos = "";

  hud.joueurs = scene.joueurs.map((joueur) => {
    const aGauche = joueur.numero === 1;
    const cle = "joueur_" + joueur.numero;
    const x = aGauche ? 12 : ECRAN.largeur - 232;
    const panneau = { aGauche: aGauche, bord: aGauche ? 16 : ECRAN.largeur - 16, pastilles: [], nbBienfaits: -1, texteEtat: "" };
    panneau.remplissage = fixer(scene.add.image(x + BARRES[cle].x, 6 + BARRES[cle].y, cle + "_remplissage").setOrigin(0));
    fixer(scene.add.image(x, 6, cle + "_cadre").setOrigin(0));
    panneau.nom = fixer(
      scene.add
        .text(panneau.bord, 80, "J" + joueur.numero + " · " + joueur.classe.nom.toUpperCase(), { ...TITRE, fontSize: "17px" })
        .setOrigin(aGauche ? 0 : 1, 0)
    );
    panneau.etat = fixer(
      scene.add.text(panneau.bord, 126, "", { ...TEXTE, fontSize: "15px", color: "#ffb0b0" }).setOrigin(aGauche ? 0 : 1, 0)
    );
    return panneau;
  });

  const xp = scene.textures.get("xp_remplissage").getSourceImage();
  const xpY = ECRAN.hauteur - xp.height - 6;
  hud.xpFond = fixer(scene.add.rectangle(centre, xpY + xp.height / 2, xp.width, xp.height, 0x120d1c, 0.85));
  hud.xpRemplissage = fixer(scene.add.image(centre - xp.width / 2, xpY, "xp_remplissage").setOrigin(0));
  hud.niveau = fixer(scene.add.text(centre, xpY - 2, "", TITRE).setOrigin(0.5, 1));
  hud.texteNiveau = "";

  const boss = scene.textures.get("boss_cadre").getSourceImage();
  const bossX = centre - boss.width / 2;
  const bossY = xpY - 30 - boss.height;
  hud.bossRemplissage = fixer(
    scene.add.image(bossX + BARRES.boss.x, bossY + BARRES.boss.y, "boss_remplissage").setOrigin(0)
  );
  hud.bossCadre = fixer(scene.add.image(bossX, bossY, "boss_cadre").setOrigin(0));
  hud.bossNom = fixer(
    scene.add.text(centre, bossY - 4, "ROI DE L'OMBRE", { ...TITRE, color: "#d8b4ff" }).setOrigin(0.5, 1)
  );
  afficherBarreBoss(hud, false);

  hud.fleche = fixer(scene.add.triangle(0, 0, 0, -14, 28, 0, 0, 14, 0xffa531)).setVisible(false);

  hud.annonce = fixer(
    scene.add
      .text(centre, 230, "", { fontFamily: POLICE_TITRE, fontSize: "52px", color: "#ffe2a8", stroke: "#1a0f05", strokeThickness: 8 })
      .setOrigin(0.5)
      .setAlpha(0)
  );
  hud.sousAnnonce = fixer(
    scene.add.text(centre, 282, "", { ...TEXTE, fontSize: "22px", strokeThickness: 4 }).setOrigin(0.5).setAlpha(0)
  );

  scene.hud = hud;
}

function remplir(image, part, depuisDroite) {
  const largeur = image.width * Phaser.Math.Clamp(part, 0, 1);
  image.setCrop(depuisDroite ? image.width - largeur : 0, 0, largeur, image.height);
}

function afficherBarreBoss(hud, visible) {
  hud.bossNom.setVisible(visible);
  hud.bossCadre.setVisible(visible);
  hud.bossRemplissage.setVisible(visible);
}

export function mettreAJourHud(scene) {
  const hud = scene.hud;
  const temple = scene.temple;

  remplir(hud.templeRemplissage, temple.pv / temple.pvMax, false);
  const attaque = scene.tempsJeu - temple.derniereAttaque < 400;
  hud.templeRemplissage.setTint(attaque && Math.floor(scene.tempsJeu / 100) % 2 === 0 ? 0xff6060 : 0xffffff);
  hud.templeRemplissage.setVisible(!temple.detruit);

  let texteTemple = "TEMPLE DE L'AUBE";
  if (temple.detruit) {
    const restantes = Math.max(0, temple.vagueReconstruction - scene.vague.numero - 1);
    texteTemple =
      restantes > 0
        ? "TEMPLE DÉTRUIT · renaît dans " + restantes + " vague" + (restantes > 1 ? "s" : "")
        : "TEMPLE DÉTRUIT · renaît à la fin de cette vague";
  }
  if (texteTemple !== hud.texteTemple) {
    hud.texteTemple = texteTemple;
    hud.templeTitre.setText(texteTemple);
    hud.templeTitre.setColor(temple.detruit ? "#ff8a8a" : "#f6e6c8");
  }

  scene.joueurs.forEach((joueur, i) => {
    const panneau = hud.joueurs[i];
    remplir(panneau.remplissage, joueur.pv / joueur.stats.pvMax, !panneau.aGauche);
    let texte = "";
    if (joueur.estMort) {
      if (temple.detruit) {
        texte = "Tombé · en attente de l'aube";
      } else {
        texte = "Tombé · retour dans " + Math.max(0, Math.ceil((joueur.reanimationA - scene.tempsJeu) / 1000)) + " s";
      }
    }
    if (texte !== panneau.texteEtat) {
      panneau.texteEtat = texte;
      panneau.etat.setText(texte);
    }
    mettreAJourPastilles(scene, joueur, panneau);
  });

  remplir(hud.xpRemplissage, scene.xp / scene.xpRequise, false);
  const texteNiveau = "NIVEAU " + scene.niveau;
  if (texteNiveau !== hud.texteNiveau) {
    hud.texteNiveau = texteNiveau;
    hud.niveau.setText(texteNiveau);
  }

  const texteInfos = "Vague " + scene.vague.numero + "   ·   " + formaterTemps(scene.tempsJeu) + "   ·   Score " + scene.score;
  if (texteInfos !== hud.texteInfos) {
    hud.texteInfos = texteInfos;
    hud.infos.setText(texteInfos);
  }

  const boss = scene.bossActif;
  const bossVisible = boss !== null && boss.active;
  afficherBarreBoss(hud, bossVisible);
  if (bossVisible) {
    remplir(hud.bossRemplissage, boss.pv / boss.pvMax, false);
  }

  placerFlecheTemple(scene);
}

function mettreAJourPastilles(scene, joueur, panneau) {
  const ids = Object.keys(joueur.bienfaits);
  if (ids.length === panneau.nbBienfaits) {
    return;
  }
  panneau.nbBienfaits = ids.length;
  panneau.pastilles.forEach((pastille) => pastille.destroy());
  panneau.pastilles = ids.map((id, i) => {
    const couleur = CATEGORIES[BIENFAITS[id].categorie].couleur;
    const x = panneau.aGauche ? panneau.bord + 6 + i * 17 : panneau.bord - 6 - i * 17;
    return scene.add.circle(x, 112, 6, couleur).setStrokeStyle(1, 0x000000).setScrollFactor(0).setDepth(PROFONDEUR.hud);
  });
}

function placerFlecheTemple(scene) {
  const hud = scene.hud;
  const temple = scene.temple;
  if (estVisible(scene, temple.x, temple.y - 30, -40)) {
    hud.fleche.setVisible(false);
    return;
  }
  const camera = scene.cameras.main;
  const centreX = ECRAN.largeur / 2;
  const centreY = ECRAN.hauteur / 2;
  const angle = Math.atan2(temple.y - camera.scrollY - centreY, temple.x - camera.scrollX - centreX);
  hud.fleche.setPosition(centreX + Math.cos(angle) * (centreX - 50), centreY + Math.sin(angle) * (centreY - 90));
  hud.fleche.setRotation(angle);
  hud.fleche.setVisible(true);
  const attaque = scene.tempsJeu - temple.derniereAttaque < 400;
  hud.fleche.setFillStyle(temple.detruit ? 0x7a6a8a : attaque ? 0xff3030 : 0xffa531);
}

export function annoncer(scene, titre, sousTitre) {
  const hud = scene.hud;
  if (!hud) {
    return;
  }
  hud.annonce.setText(titre);
  hud.sousAnnonce.setText(sousTitre || "");
  scene.tweens.killTweensOf([hud.annonce, hud.sousAnnonce]);
  hud.annonce.setAlpha(0);
  hud.sousAnnonce.setAlpha(0);
  scene.tweens.add({
    targets: [hud.annonce, hud.sousAnnonce],
    alpha: 1,
    duration: 350,
    hold: 2000,
    yoyo: true
  });
}
