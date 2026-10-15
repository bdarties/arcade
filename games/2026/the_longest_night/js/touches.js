// Touches de la borne d'arcade (une seule source de vérité pour les menus et écrans de fin).
// Joystick J1 = flèches, boutons J1 = I O P / K L M
// Joystick J2 = Z Q S D, boutons J2 = R T Y / F G H
// Les touches clavier Entrée / Échap restent actives pour tester sur ordinateur.
export const TOUCHES = {
  haut:    ["UP", "Z"],           // joystick J1 ou J2
  bas:     ["DOWN", "S"],
  valider: ["ENTER", "I", "R"],   // bouton I (J1) ou R (J2)
  retour:  ["ESC", "K", "F"]      // bouton K (J1) ou F (J2)
};

// branche la même action sur toutes les touches d'une liste
export function ecouter(scene, touches, action) {
  touches.forEach((t) => scene.input.keyboard.on("keydown-" + t, action));
}