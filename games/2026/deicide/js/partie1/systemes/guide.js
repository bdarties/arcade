// guide.js : explique au joueur le but du jeu et les mouvements qu'il ne devine pas, sans jamais gêner la partie.
// Rien ne met le jeu en pause et rien ne bloque une touche : ce sont de simples textes posés sur l'écran (fixes, par-dessus la caméra),
// qui apparaissent en fondu puis s'effacent tout seuls. Les commandes de base n'ont pas besoin d'un guide en plus :
// la légende du HUD (personnage/hud.js, en haut à droite) les affiche déjà en permanence.
// Les boutons de la borne sont nommés A à F : A = saut (touche I), E = dash (touche L), voir gpio2keys.py.
// Chaque guide ne s'affiche qu'une fois par partie : si le robot meurt et que le niveau recommence, il ne revient pas (voir menu.js).

const DUREE = 7000; // ms pendant lesquelles un message reste affiché
const STYLE = { fontFamily: "monospace", fontSize: "26px", fontStyle: "bold", color: "#e7e0e9", stroke: "#000000", strokeThickness: 6, align: "center" }; // le style des messages : gros texte clair avec un contour noir

// un message en haut de l'écran : il apparaît après `delai` ms, reste DUREE ms, puis s'efface
export function message(scene, texte, delai) { // affiche un message après un délai
  scene.time.delayedCall(delai, () => { // après le délai...
    const t = scene.add.text(640, 150, texte, STYLE).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0); // ...on crée le texte en haut de l'écran, invisible
    scene.tweens.add({ targets: t, alpha: 1, duration: 600 }); // il apparaît en fondu
    scene.time.delayedCall(DUREE, () => scene.tweens.add({ targets: t, alpha: 0, duration: 500, onComplete: () => t.destroy() })); // après 7 s, il s'efface puis disparaît
  });
}

// au début de la partie : le but, puis le saut de mur (on le fait en montant la tour, mais rien ne l'explique)
export function montrerGuide(scene) { // affiche les messages d'aide au début de la partie
  if (scene.registry.get("guideVu")) return; // déjà montré pendant cette partie
  scene.registry.set("guideVu", true); // on note que le guide a été montré
  message(scene, "MONTE LA TOUR ET BATS LE DIEU DE LA LUMIÈRE\nLE PLUS VITE POSSIBLE", 0); // le but du jeu
  message(scene, "WALL JUMP : CONTRE UN MUR, APPUIE SUR LE BOUTON A\nPOUR REBONDIR ET MONTER", DUREE + 600); // l'explication du saut de mur, après le premier message
}
