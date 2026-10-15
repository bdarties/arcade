// PARTIE 2 : nous ne souhaitons pas soumettre cette partie du code à l'évaluation. Nous ne présentons que la partie 1 (js/partie1/).
// La partie 2 est uniquement présente pour améliorer la rejouabilité du jeu sur la borne (un jeu plus difficile et plus de contenu), suite à la demande
// de Nicolas Maurin. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// astuce.js : le rappel du dash, au début du niveau 2 (la fuite) : là, le dash est indispensable pour franchir les trous.
// Il ne s'affiche qu'une fois par partie : « numeroPartie » (registre du jeu) augmente à chaque nouvelle partie (menu.js, reset de la borne).
import { message } from "../partie1/systemes/guide.js";

export function montrerAstuceDash(scene) {
  const partie = scene.registry.get("numeroPartie") ?? 0;
  if (scene.registry.get("astuceDashVue") === partie) return; // déjà montré pendant cette partie
  scene.registry.set("astuceDashVue", partie);
  message(scene, "BOUTON E : DASH\nPOUR FRANCHIR LES TROUS ET ÉCHAPPER À LA LUMIÈRE", 0);
}
