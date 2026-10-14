// Progression : niveaux terminés, portes ouvertes, fragments.

// Les niveaux du jeu. disponible = false : le niveau n'est pas encore jouable (la porte s'ouvre mais affiche « bientôt »).
export const NIVEAUX = [
  { numero: 1, nom: "LES COULISSES", scene: "niveau1", disponible: true },
  { numero: 2, nom: "LES OMBRES CHINOISES", scene: "niveau2", disponible: true },
  { numero: 3, nom: "LA GRANDE SCÈNE", scene: "niveau3", disponible: true }
];

// La liste des numéros de niveaux terminés (vide au début)
export function niveauxTermines(registry) {
  return registry.get("niveauxTermines") || [];
}

// Nouvelle partie : plus aucun niveau terminé
export function nouvellePartie(registry) {
  registry.set("niveauxTermines", []);
  registry.set("deblocage", null);
}

export function estTermine(registry, numero) {
  return niveauxTermines(registry).includes(numero);
}

// Le niveau 1 est toujours accessible ; les autres demandent d'avoir terminé le niveau précédent
export function estDebloque(registry, numero) {
  return numero == 1 || estTermine(registry, numero - 1);
}

// À appeler quand un niveau est gagné. Renvoie true si c'est la PREMIÈRE fois (donc un nouveau fragment).
export function enregistrerVictoire(registry, numero) {
  if (estTermine(registry, numero) == true) {
    return false; // niveau rejoué : pas de nouveau fragment
  }
  const liste = niveauxTermines(registry).slice(); // une copie : on ne modifie pas la liste d'origine
  liste.push(numero);
  registry.set("niveauxTermines", liste);
  return true;
}

// Le niveau qu'il faut jouer ensuite (le premier non terminé), ou undefined s'ils sont tous terminés
export function prochainNiveau(registry) {
  return NIVEAUX.find((niveau) => estTermine(registry, niveau.numero) == false);
}
