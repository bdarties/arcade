import { MONDE, ECRAN, PROFONDEUR } from "../reglages/config.js";

const ANIMATIONS = { arbre_anime: "anim_arbre", trone_liche: "anim_trone" };

export function creerCarte(scene) {
  scene.physics.world.setBounds(0, 0, MONDE.largeur, MONDE.hauteur);
  scene.groupeObstacles = scene.physics.add.staticGroup();

  const carte = scene.add.tilemap("carte");
  const tuiles = carte.addTilesetImage("sol", "sol_tuiles");
  const sol = carte.createLayer("sol", tuiles);
  const solFixe = scene.add.renderTexture(0, 0, MONDE.largeur, MONDE.hauteur).setOrigin(0).setDepth(PROFONDEUR.sol);
  solFixe.draw(sol);
  sol.destroy();

  for (const objet of carte.getObjectLayer("paves").objects) {
    scene.add
      .image(objet.x, objet.y, objet.name)
      .setOrigin(0.5, 1)
      .setFlipX(objet.flippedHorizontal)
      .setAlpha(0.9)
      .setDepth(PROFONDEUR.decorSol);
  }

  for (const objet of carte.getObjectLayer("decor").objects) {
    let element;
    if (ANIMATIONS[objet.name]) {
      element = scene.add.sprite(objet.x, objet.y, objet.name, 0);
      element.play(ANIMATIONS[objet.name]);
      element.anims.setProgress(Math.random());
    } else {
      element = scene.add.image(objet.x, objet.y, objet.name);
    }
    element.setOrigin(0.5, 1).setFlipX(objet.flippedHorizontal).setDepth(objet.y);
  }

  for (const zone of carte.getObjectLayer("collisions").objects) {
    scene.groupeObstacles.add(scene.add.zone(zone.x + zone.width / 2, zone.y + zone.height / 2, zone.width, zone.height));
  }
}

export function creerCamera(scene) {
  scene.cibleCamera = scene.add.zone(scene.temple.x, scene.temple.y, 1, 1);
  scene.cameras.main.setBounds(0, 0, MONDE.largeur, MONDE.hauteur);
  scene.cameras.main.startFollow(scene.cibleCamera, true, 0.1, 0.1);
  scene.cameras.main.setRoundPixels(true);
}

export function mettreAJourCamera(scene) {
  const vivants = scene.joueurs.filter((joueur) => !joueur.estMort);
  if (vivants.length === 0) {
    scene.cibleCamera.setPosition(scene.temple.x, scene.temple.y);
    return;
  }
  let sommeX = 0;
  let sommeY = 0;
  for (const joueur of vivants) {
    sommeX += joueur.x;
    sommeY += joueur.y - 20;
  }
  scene.cibleCamera.setPosition(sommeX / vivants.length, sommeY / vivants.length);
}

export function estVisible(scene, x, y, marge) {
  const vue = scene.cameras.main.worldView;
  return (
    x > vue.x - marge &&
    x < vue.x + ECRAN.largeur + marge &&
    y > vue.y - marge &&
    y < vue.y + ECRAN.hauteur + marge
  );
}
