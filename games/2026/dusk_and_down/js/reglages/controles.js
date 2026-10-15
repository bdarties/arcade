export const TOUCHES_BORNE = {
  1: { haut: "UP", bas: "DOWN", gauche: "LEFT", droite: "RIGHT", A: "I", B: "O", C: "P", D: "K", E: "L", F: "M" },
  2: { haut: "Z", bas: "S", gauche: "Q", droite: "D", A: "R", B: "T", C: "Y", D: "F", E: "G", F: "H" }
};

export function creerControles(scene, numeroJoueur) {
  const touches = scene.input.keyboard.addKeys(TOUCHES_BORNE[numeroJoueur]);
  for (const nom in touches) {
    const touche = touches[nom];
    touche.appuiEnAttente = false;
    touche.removeAllListeners("down");
    touche.on("down", (cle, evenement) => {
      if (!evenement.repeat) {
        touche.appuiEnAttente = true;
      }
    });
  }
  return touches;
}

export function vientDEtrePressee(touche) {
  const presse = touche.appuiEnAttente;
  touche.appuiEnAttente = false;
  return presse;
}

export function boutonPresse(controlesJ1, controlesJ2, bouton) {
  const parJ1 = vientDEtrePressee(controlesJ1[bouton]);
  const parJ2 = vientDEtrePressee(controlesJ2[bouton]);
  return parJ1 || parJ2;
}
