// ⚠ PARTIE 2 : HORS ÉVALUATION. Cette partie n'est pas à prendre en compte dans la partie évaluée (qui est la partie 1, dans js/partie1/).
// Elle a été ajoutée à la fin, uniquement pour rendre le jeu plus intéressant sur la borne et répondre à la demande de Nicolas Maurin :
// rendre le jeu plus difficile et ajouter du contenu. Voir js/partie2/lisez-moi.md.
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
