// Tous les petits éléments graphiques (notes, étoiles, décor de Music Fall...)
// sont dessinés avec des Graphics puis transformés en texture avec
// generateTexture(). Avantages : pas d'image à charger, pas de problème de
// droits, et on peut changer une couleur ou une taille directement dans le code.

export function creerTextures(scene) {
  // communes
  etoile(scene);
  vie(scene);
  halo(scene);
  // Music Fall
  page(scene);
  note(scene);
  rideau(scene);
}

function nouveauDessin(scene) {
  return scene.make.graphics({ x: 0, y: 0, add: false });
}

// une croche : (x, y) = coin en haut à gauche, s = échelle (1 = 64 x 128 px)
function dessinerCroche(g, x, y, s, couleur) {
  g.fillStyle(couleur);
  g.fillEllipse(x + 22 * s, y + 112 * s, 36 * s, 26 * s); // tete
  g.fillRect(x + 34 * s, y + 8 * s, 7 * s, 104 * s); // hampe
  var crochet = [
    { x: 41, y: 8 },
    { x: 55, y: 26 },
    { x: 63, y: 48 },
    { x: 56, y: 74 },
    { x: 58, y: 50 },
    { x: 50, y: 34 },
    { x: 41, y: 30 }
  ];
  g.fillPoints(
    crochet.map((p) => ({ x: x + p.x * s, y: y + p.y * s })),
    true
  );
}

// dessine une forme avec un contour : la forme en sombre décalée de 2 px
// dans les 4 sens, puis la forme en couleur par-dessus
function avecContour(dessiner, couleurContour, couleur) {
  [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2]
  ].forEach(([dx, dy]) => dessiner(dx, dy, couleurContour));
  dessiner(0, 0, couleur);
}

// ---------------------------------------------------------------------------
// COMMUNES
// ---------------------------------------------------------------------------

// petite étoile dorée
function etoile(scene) {
  var g = nouveauDessin(scene);
  var points = [];
  for (var i = 0; i < 10; i++) {
    var r = i % 2 == 0 ? 14 : 6;
    var a = (i * Math.PI) / 5 - Math.PI / 2;
    points.push({ x: 15 + r * Math.cos(a), y: 15 + r * Math.sin(a) });
  }
  g.fillStyle(0xffd23f);
  g.fillPoints(points, true);
  g.generateTexture("tx_etoile", 30, 30);
  g.destroy();
}


// une vie = une petite croche dorée avec un contour sombre
function vie(scene) {
  var g = nouveauDessin(scene);
  avecContour((dx, dy, c) => dessinerCroche(g, 2 + dx, 2 + dy, 0.33, c), 0x1b1030, 0xffd23f);
  g.generateTexture("tx_vie", 26, 47);
  g.destroy();
}

// halo lumineux : des cercles de plus en plus transparents
function halo(scene) {
  var g = nouveauDessin(scene);
  for (var r = 64; r > 0; r -= 4) {
    g.fillStyle(0xffffff, 0.06 + (1 - r / 64) * 0.1);
    g.fillCircle(64, 64, r);
  }
  g.generateTexture("tx_halo", 128, 128);
  g.destroy();
}

// ---------------------------------------------------------------------------
// MUSIC FALL
// ---------------------------------------------------------------------------



// la grande fiche de partition vierge (900 x 700)
function page(scene) {
  var g = nouveauDessin(scene);
  // ombre portée
  g.fillStyle(0x000000, 0.3);
  g.fillRect(12, 12, 900, 700);
  // papier
  g.fillStyle(0xfbf5e6);
  g.fillRect(0, 0, 900, 700);
  // portées très pâles (la fiche est "vierge", juste les lignes)
  g.lineStyle(2, 0xe3d9c6, 1);
  for (var y0 = 120; y0 < 470; y0 += 90) {
    for (var k = 0; k < 5; k++) {
      g.lineBetween(60, y0 + k * 9, 860, y0 + k * 9);
    }
  }
  // petits trous de classeur sur le coté
  g.fillStyle(0x6b4127);
  [100, 300, 500].forEach((y) => g.fillCircle(22, y, 9));
  g.generateTexture("tx_page", 912, 712);
  g.destroy();
}


// la grande croche qui tombe avec le perso (64 x 128)
function note(scene) {
  var g = nouveauDessin(scene);
  dessinerCroche(g, 0, 0, 1, 0x1d1830);
  g.generateTexture("tx_note", 64, 128);
  g.destroy();
}

// le rideau rouge de l'opéra (essai 3) 900 x 300
function rideau(scene) {
  var g = nouveauDessin(scene);
  // les plis du velours
  for (var x = 0; x < 900; x += 30) {
    g.fillStyle(0x9b1b24);
    g.fillRect(x, 0, 30, 280);
    g.fillStyle(0xc0303a);
    g.fillRect(x + 6, 0, 10, 280);
    g.fillStyle(0x6e1018);
    g.fillRect(x + 22, 0, 8, 280);
    // festons arrondis en bas
    g.fillStyle(0x9b1b24);
    g.fillCircle(x + 15, 278, 15);
  }
  // barre dorée en haut et frange dorée en bas
  g.fillStyle(0xe0b440);
  g.fillRect(0, 0, 900, 10);
  g.fillRect(0, 284, 900, 6);
  for (var x2 = 0; x2 < 900; x2 += 10) {
    g.fillTriangle(x2, 290, x2 + 10, 290, x2 + 5, 299);
  }
  g.generateTexture("tx_rideau", 900, 300);
  g.destroy();
}
