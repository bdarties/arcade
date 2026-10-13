// guide.js : explique au joueur le but du jeu et les mouvements qu'il ne devine pas, sans jamais gêner la partie.
// Rien ne met le jeu en pause et rien ne bloque une touche : ce sont de simples textes posés sur l'écran (fixes, par-dessus la caméra),
// qui apparaissent en fondu puis s'effacent tout seuls. Les commandes de base n'ont pas besoin d'un guide en plus :
// la légende du HUD (personnage/hud.js, en haut à droite) les affiche déjà en permanence.
// Les boutons de la borne sont nommés A à F : A = saut (touche I), E = dash (touche L), voir gpio2keys.py.
// Chaque guide ne s'affiche qu'une fois par partie : si le robot meurt et que le niveau recommence, il ne revient pas (voir menu.js).

const DUREE = 7000; // ms pendant lesquelles un message reste affiché
const STYLE = { fontFamily: "monospace", fontSize: "26px", fontStyle: "bold", color: "#e7e0e9", stroke: "#000000", strokeThickness: 6, align: "center" };

// un message en haut de l'écran : il apparaît après `delai` ms, reste DUREE ms, puis s'efface
function message(scene, texte, delai) {
  scene.time.delayedCall(delai, () => {
    const t = scene.add.text(640, 150, texte, STYLE).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);
    scene.tweens.add({ targets: t, alpha: 1, duration: 600 }); // il apparaît en fondu
    scene.time.delayedCall(DUREE, () => scene.tweens.add({ targets: t, alpha: 0, duration: 500, onComplete: () => t.destroy() }));
  });
}

// au début de la partie : le but, puis le saut de mur (on le fait en montant la tour, mais rien ne l'explique)
export function montrerGuide(scene) {
  if (scene.registry.get("guideVu")) return; // déjà montré pendant cette partie
  scene.registry.set("guideVu", true);
  message(scene, "MONTE LA TOUR ET BATS LE DIEU DE LA LUMIÈRE\nLE PLUS VITE POSSIBLE", 0);
  message(scene, "WALL JUMP : CONTRE UN MUR, APPUIE SUR LE BOUTON A\nPOUR REBONDIR ET MONTER", DUREE + 600);
}

// Le rappel du dash, au début du niveau 2 (la fuite) : là, le dash est indispensable pour franchir les trous.
export function montrerAstuceDash(scene) {
  if (scene.registry.get("astuceDashVue")) return;
  scene.registry.set("astuceDashVue", true);
  message(scene, "BOUTON E : DASH\nPOUR FRANCHIR LES TROUS ET ÉCHAPPER À LA LUMIÈRE", 0);
}
