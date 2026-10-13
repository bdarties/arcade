// guide.js : rappelle au joueur le but du jeu, sans jamais gêner la partie.
// Rien ne met le jeu en pause et rien ne bloque une touche : c'est un simple texte posé sur l'écran (fixe, par-dessus la caméra),
// qui apparaît en fondu au début de la partie puis s'efface tout seul. Les commandes n'ont pas besoin d'un guide en plus :
// la légende du HUD (personnage/hud.js, en haut à droite) les affiche déjà en permanence.
// Il ne s'affiche qu'une fois par partie : si le robot meurt et que le niveau recommence, il ne revient pas (voir menu.js).

const DUREE_BUT = 7000; // ms pendant lesquelles le but reste affiché
const STYLE_BUT = { fontFamily: "monospace", fontSize: "26px", fontStyle: "bold", color: "#e7e0e9", stroke: "#000000", strokeThickness: 6, align: "center" };

export function montrerGuide(scene) {
  if (scene.registry.get("guideVu")) return; // déjà montré pendant cette partie
  scene.registry.set("guideVu", true);
  const but = scene.add.text(640, 150, "MONTE LA TOUR\nET BATS LE DIEU DE LA LUMIÈRE", STYLE_BUT)
    .setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);
  scene.tweens.add({ targets: but, alpha: 1, duration: 600 }); // il apparaît en fondu
  // puis il s'efface tout seul, et le texte est détruit
  scene.time.delayedCall(DUREE_BUT, () => scene.tweens.add({ targets: but, alpha: 0, duration: 500, onComplete: () => but.destroy() }));
}
