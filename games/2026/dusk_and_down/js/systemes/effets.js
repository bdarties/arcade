import { PROFONDEUR } from "../reglages/config.js";

export function jouerEffet(scene, animation, x, y, options) {
  const reglages = options || {};
  const texture = scene.anims.get(animation).frames[0].textureKey;
  const effet = scene.add.sprite(x, y, texture);
  effet.setOrigin(0.5, reglages.origineY || 0.5);
  effet.setDepth(PROFONDEUR.lumieres);
  if (reglages.echelle) {
    effet.setScale(reglages.echelle);
  }
  effet.play(animation);
  effet.once("animationcomplete", () => effet.destroy());
  return effet;
}

export function flashLumineux(scene, x, y, couleur, taille) {
  const lueur = scene.add.image(x, y, "img_lumiere");
  lueur.setTint(couleur).setBlendMode(Phaser.BlendModes.ADD).setDepth(PROFONDEUR.lumieres);
  lueur.setDisplaySize(taille * 0.4, taille * 0.2).setAlpha(0.9);
  scene.tweens.add({
    targets: lueur,
    displayWidth: taille,
    displayHeight: taille * 0.5,
    alpha: 0,
    duration: 350,
    onComplete: () => lueur.destroy()
  });
}
