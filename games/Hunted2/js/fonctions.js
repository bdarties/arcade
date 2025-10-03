/***********************************************************************/
/** CONSTANTES
/***********************************************************************/
export const TEMPS_INITIAL = 120;

/***********************************************************************/
/** VARIABLES PARTAGÉES ENTRE SCÈNES
/***********************************************************************/
export let coeurs = 5;
export let tempsRestant = TEMPS_INITIAL;
export let objets = 0;
export let vies = 3;

export let gameOverActif = false;

/***********************************************************************/
/** RESET DU JEU
/***********************************************************************/
export function resetGame() {
  coeurs = 5;
  tempsRestant = TEMPS_INITIAL;
  objets = 0;
  vies = 3;
  gameOverActif = false;
}

/***********************************************************************/
/** PRELOAD COMMUN
/***********************************************************************/
export function preloadCommun(scene) {
  scene.load.image("Phaser_tuilesdejeu", "./assets/tuilesJeu.png");
  scene.load.image("Phaser_tuilesdejeu2", "./assets/tuilesJeu2.png");
  scene.load.image("Phaser_tuilesdejeu3", "./assets/tuilesJeu3.png");
  scene.load.image("coeur", "./assets/coeur.png");
  scene.load.image("btn_rejouer", "./assets/btn_rejouer.png");
  scene.load.image("btn_menu", "assets/btn_menu.png");
  scene.load.image("dude_face", "./assets/dude_face.png");
}

/***********************************************************************/
/** INITIALISER LE CLAVIER
/***********************************************************************/
export let clavier;
export function initClavier(scene) {
  clavier = scene.input.keyboard.createCursorKeys();
  return clavier;
}
