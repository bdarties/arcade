// astuce.js : le rappel du dash, au début du niveau 2 (la fuite) : là, le dash est indispensable pour franchir les trous.
// Il ne s'affiche qu'une fois par partie : « numeroPartie » (registre du jeu) augmente à chaque nouvelle partie (menu.js, reset de la borne).
import { message } from "../partie1/systemes/guide.js";

export function montrerAstuceDash(scene) {
  const partie = scene.registry.get("numeroPartie") ?? 0;
  if (scene.registry.get("astuceDashVue") === partie) return; // déjà montré pendant cette partie
  scene.registry.set("astuceDashVue", partie);
  message(scene, "BOUTON E : DASH\nPOUR FRANCHIR LES TROUS ET ÉCHAPPER À LA LUMIÈRE", 0);
}
