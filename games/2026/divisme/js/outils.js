// ==============================================================
// OUTILS PARTAGÉS ET CHARTE GRAPHIQUE DE DIVISME
// ==============================================================
// Ce fichier est la "boîte à outils" commune à toutes les scènes.
// Il contient tout ce qui doit être IDENTIQUE partout dans le jeu :
//   1. les couleurs
//   2. les textes (police, tailles) et les positions standards
//   3. les formes arrondies, boutons et jauges
//   4. l'en-tête des mini-jeux (titre, consigne, temps)
//   5. les masques de vie
//   6. le cadre de résultat
//   7. les effets visuels (étincelles, confettis, notes d'ambiance)
//   8. les sons
//   9. les scores de la partie
//
// Pour changer l'allure du jeu, on modifie CE fichier : toutes les scènes suivent.


// ==============================================================
// 1. COULEURS
// ==============================================================

export const COULEURS = {
    // Palette de la direction artistique
    DORE: 0xC7AC72,
    ROUGE: 0xAE5050,
    TURQUOISE: 0x19798D,

    // Compléments : fond sombre, texte clair, variantes lisibles sur fond sombre
    NUIT: 0x10252B,
    CREME: 0xF6EBD0,
    TURQUOISE_CLAIR: 0x4FC3D9,
    ROUGE_CLAIR: 0xE07B7B
};

// Couleurs des joueurs : valables dans TOUS les mini-jeux
export const COULEUR_J1 = COULEURS.TURQUOISE;
export const COULEUR_J2 = COULEURS.ROUGE;

// Transforme une couleur numérique (0x19798D) en texte CSS ("#19798d"),
// car les textes de Phaser attendent ce second format.
export function css(couleur) {
    return "#" + couleur.toString(16).padStart(6, "0");
}


// ==============================================================
// 2. TEXTES ET POSITIONS STANDARDS
// ==============================================================

export const POLICE = 'Arial, "Times New Roman", serif';

// Un "rôle" = une taille et une couleur. Un titre a toujours la même allure,
// dans n'importe quelle scène : on demande le rôle, pas la taille.
const ROLES_TEXTE = {
    titre:         { taille: 40, couleur: COULEURS.DORE },
    temps:         { taille: 32, couleur: COULEURS.CREME },
    consigne:      { taille: 24, couleur: COULEURS.CREME },
    label:         { taille: 28, couleur: COULEURS.CREME },
    score:         { taille: 36, couleur: COULEURS.CREME },
    bouton:        { taille: 36, couleur: COULEURS.CREME },
    boutonGrand:   { taille: 48, couleur: COULEURS.CREME },
    indication:    { taille: 20, couleur: COULEURS.CREME },
    petit:         { taille: 18, couleur: COULEURS.CREME },
    resultatTitre: { taille: 50, couleur: COULEURS.DORE },
    resultatSous:  { taille: 30, couleur: COULEURS.CREME }
};

// Renvoie le style d'un texte pour un rôle donné.
// "extra" permet de modifier un détail : style("label", { color: "#ff0000" })
export function style(role, extra = {}) {

    const r = ROLES_TEXTE[role];

    return Object.assign({
        fontFamily: POLICE,
        fontSize: r.taille + "px",
        color: css(r.couleur),
        fontStyle: "bold",
        align: "center",
        stroke: css(COULEURS.NUIT),                     // contour sombre : lisible sur tous les fonds
        strokeThickness: Math.max(2, Math.round(r.taille / 10))
    }, extra);
}

// Positions identiques dans tous les mini-jeux
export const POS = {
    LARGEUR: 1280,
    HAUTEUR: 720,
    TITRE_Y: 50,
    TEMPS_Y: 105,
    CONSIGNE_Y: 150
};


// ==============================================================
// 3. FORMES ARRONDIES, BOUTONS, JAUGES
// ==============================================================

// Phaser ne sait pas arrondir un rectangle. On dessine donc UNE FOIS un rectangle
// arrondi, on le transforme en texture, puis on s'en sert comme d'une image normale
// (qu'on peut donc rendre cliquable, agrandir, animer avec des tweens...).
// options : rayon, alpha (transparence), bordure (couleur), epaisseur (de la bordure)
export function imageArrondie(scene, x, y, largeur, hauteur, couleur, options = {}) {

    const rayon = Math.min(options.rayon ?? Math.min(largeur, hauteur) / 2.5, Math.min(largeur, hauteur) / 2);
    const alpha = options.alpha ?? 1;
    const bordure = options.bordure;
    const epaisseur = options.epaisseur ?? 4;

    // Chaque combinaison de réglages a sa clé : la texture n'est fabriquée qu'une fois
    const cle = `arrondi_${largeur}x${hauteur}_${rayon}_${couleur}_${alpha}_${bordure}_${epaisseur}`;

    if (!scene.textures.exists(cle)) {

        const dessin = scene.make.graphics({ x: 0, y: 0, add: false });

        dessin.fillStyle(couleur, alpha);
        dessin.fillRoundedRect(0, 0, largeur, hauteur, rayon);

        if (bordure !== undefined) {
            dessin.lineStyle(epaisseur, bordure, 1);
            dessin.strokeRoundedRect(
                epaisseur / 2,
                epaisseur / 2,
                largeur - epaisseur,
                hauteur - epaisseur,
                rayon
            );
        }

        dessin.generateTexture(cle, largeur, hauteur);
        dessin.destroy();
    }

    return scene.add.image(x, y, cle);
}


// Bouton arrondi avec texte, qui grossit quand on le survole.
// Renvoie { fond, label, ensemble } ("ensemble" = les deux objets, pour les animer ensemble).
export function creerBouton(scene, x, y, texte, couleur, action, options = {}) {

    const largeur = options.largeur ?? 420;
    const hauteur = options.hauteur ?? 110;

    const fond = imageArrondie(scene, x, y, largeur, hauteur, couleur, {
        bordure: COULEURS.DORE,
        epaisseur: 5
    });

    const label = scene.add.text(x, y, texte, style(options.role ?? "bouton")).setOrigin(0.5);

    const ensemble = [fond, label];

    fond.setInteractive({ useHandCursor: true });

    fond.on("pointerover", () => {
        scene.tweens.add({ targets: ensemble, scale: 1.1, duration: 120 });
    });

    fond.on("pointerout", () => {
        scene.tweens.add({ targets: ensemble, scale: 1, duration: 120 });
    });

    fond.on("pointerup", action);

    return { fond, label, ensemble };
}


// Jauge arrondie (crescendo du clicker, barre de temps du rythme...).
// On l'utilise ainsi :  const jauge = creerJauge(this, 640, 225, 500, 40);
//                       jauge.maj(0.5, COULEURS.DORE);   // à moitié pleine, en doré
export function creerJauge(scene, x, y, largeur, hauteur) {

    const bordure = 4;
    const largeurInterieure = largeur - 2 * bordure;
    const hauteurInterieure = hauteur - 2 * bordure;

    // Le fond (avec sa bordure dorée)
    const fond = imageArrondie(scene, x, y, largeur, hauteur, COULEURS.NUIT, {
        alpha: 0.85,
        bordure: COULEURS.DORE,
        epaisseur: bordure,
        rayon: hauteur / 2
    });

    // Le remplissage : une image blanche arrondie, qu'on colorie avec "setTint"
    // et qu'on COUPE (setCrop) à la bonne largeur. Son origine est à gauche.
    const remplissage = imageArrondie(
        scene,
        x - largeur / 2 + bordure,
        y,
        largeurInterieure,
        hauteurInterieure,
        0xffffff,
        { rayon: hauteurInterieure / 2 }
    ).setOrigin(0, 0.5);

    return {
        fond: fond,
        remplissage: remplissage,

        // ratio : de 0 (vide) à 1 (pleine) ; couleur : couleur du remplissage
        maj: function (ratio, couleur) {

            const largeurVisible = largeurInterieure * Phaser.Math.Clamp(ratio, 0, 1);

            remplissage.setVisible(largeurVisible >= 1);

            if (largeurVisible >= 1) {
                remplissage.setCrop(0, 0, largeurVisible, hauteurInterieure);
            }

            remplissage.setTint(couleur);
        }
    };
}


// Les objets apparaissent en grossissant depuis rien (avec un petit rebond).
export function apparition(scene, cibles, delai = 0) {

    const liste = Array.isArray(cibles) ? cibles : [cibles];

    // On les cache tout de suite, sinon ils seraient visibles pendant le délai
    liste.forEach(objet => objet.setScale(0).setAlpha(0));

    return scene.tweens.add({
        targets: liste,
        scale: 1,
        alpha: 1,
        duration: 450,
        delay: delai,
        ease: "Back.easeOut"
    });
}


// Battement permanent : l'objet grossit et rétrécit doucement.
export function pulser(scene, cible, amplitude = 0.05, duree = 700) {

    return scene.tweens.add({
        targets: cible,
        scale: 1 + amplitude,
        duration: duree,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
    });
}


// Redimensionne une image pour qu'elle ait la hauteur voulue,
// sans la déformer (on garde les proportions).
export function hauteurFixe(image, hauteur) {
    image.setScale(hauteur / image.height);
}


// ==============================================================
// 4. EN-TÊTE DES MINI-JEUX
// ==============================================================

// Titre (en haut) + consigne (dessous), toujours aux mêmes endroits, avec la même allure.
export function creerEnTete(scene, nomMiniJeu, consigne) {

    const titre = scene.add.text(POS.LARGEUR / 2, POS.TITRE_Y, nomMiniJeu.toUpperCase(), style("titre")).setOrigin(0.5);
    const texteConsigne = scene.add.text(POS.LARGEUR / 2, POS.CONSIGNE_Y, consigne, style("consigne")).setOrigin(0.5);

    // Entrée en scène : le titre descend du haut de l'écran, la consigne apparaît en fondu.
    // (le rideau est encore fermé au début, donc personne ne voit les objets "cachés")
    titre.setAlpha(0).setY(-40);
    texteConsigne.setAlpha(0);

    scene.tweens.add({ targets: titre, y: POS.TITRE_Y, alpha: 1, duration: 600, delay: 400, ease: "Back.easeOut" });
    scene.tweens.add({ targets: texteConsigne, alpha: 1, duration: 500, delay: 700 });

    return { titre: titre, consigne: texteConsigne };
}


// Le texte "Temps : 15", à sa place standard
export function creerTexteTemps(scene, secondes) {

    return scene.add.text(POS.LARGEUR / 2, POS.TEMPS_Y, "Temps : " + secondes, style("temps")).setOrigin(0.5);
}


// Met à jour le temps. Pendant les 5 dernières secondes : le texte devient rouge et "pulse".
export function majTemps(scene, texte, secondes) {

    texte.setText("Temps : " + secondes);

    if (secondes <= 5) {
        texte.setColor(css(COULEURS.ROUGE_CLAIR));
        scene.tweens.add({ targets: texte, scale: { from: 1.4, to: 1 }, duration: 300 });
    }
}


// ==============================================================
// 5. MASQUES DE VIE
// ==============================================================

// Nombre de masques (= vies de chaque joueur dans un mini-jeu)
export const VIES_MAX = 3;

// Crée la rangée de masques (les vies) et renvoie la liste des images.
export function creerVies(scene, x, y, vies) {

    const masques = [];

    for (let i = 0; i < VIES_MAX; i++) {

        const masque = scene.add.image(x + (i - 1) * 70, y, "masque_content");

        // On mémorise la hauteur normale : les animations en ont besoin
        masque.baseY = y;

        masques.push(masque);
    }

    majVies(scene, masques, vies);

    return masques;
}


// Met à jour les masques :
// - vie restante : masque content, qui se balance doucement
// - vie perdue   : masque triste, rougeâtre, immobile
export function majVies(scene, masques, vies) {

    masques.forEach((masque, i) => {

        // On repart de zéro : plus d'animation, position et angle normaux
        scene.tweens.killTweensOf(masque);
        masque.setY(masque.baseY).setAngle(0);

        if (i < vies) {
            masque.setTexture("masque_content");
            masque.clearTint();
            hauteurFixe(masque, 60);
            animerMasque(scene, masque, i);
        } else {
            masque.setTexture("masque_triste");
            masque.setTint(0xff6666); // teinte rouge
            hauteurFixe(masque, 60);
        }
    });
}


// Balancement permanent d'un masque (monte, descend, se penche).
export function animerMasque(scene, masque, index) {

    masque.setAngle(-5);

    scene.tweens.add({
        targets: masque,
        y: masque.baseY - 6,
        angle: 5,
        duration: 900,
        delay: index * 150,      // décalage : les masques ne bougent pas tous en même temps
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1               // -1 = pour toujours
    });
}


// Animation du masque qui vient de perdre : il grossit et tremble.
export function animerPerte(scene, masque) {

    const echelle = masque.scaleX;

    scene.tweens.add({
        targets: masque,
        scaleX: echelle * 1.6,
        scaleY: echelle * 1.6,
        duration: 150,
        yoyo: true,
        ease: "Quad.easeOut"
    });

    scene.tweens.add({
        targets: masque,
        angle: { from: -15, to: 15 },
        duration: 60,
        yoyo: true,
        repeat: 4,
        onComplete: () => masque.setAngle(0)
    });
}


// Retire une vie (jamais sous 0), met les masques à jour et renvoie le nouveau nombre de vies.
export function retirerVie(scene, masques, vies) {

    const nouvellesVies = Math.max(0, vies - 1);

    majVies(scene, masques, nouvellesVies);

    // Si une vie a vraiment été perdue, le masque concerné réagit
    if (nouvellesVies < vies) {
        animerPerte(scene, masques[nouvellesVies]);
    }

    return nouvellesVies;
}


// ==============================================================
// 6. CADRE DE RÉSULTAT
// ==============================================================

// Affiche un résultat lisible : panneau arrondi sombre + titre + sous-titre.
// fete = true : pluie de confettis (victoire).
export function afficherResultat(scene, titre, sousTitre, couleurSousTitre, fete = false) {

    const panneau = imageArrondie(scene, 640, 385, 820, 130, COULEURS.NUIT, {
        alpha: 0.85,
        bordure: COULEURS.DORE,
        epaisseur: 4,
        rayon: 36
    }).setDepth(60);

    const elements = [panneau];

    elements.push(
        scene.add.text(640, 355, titre, style("resultatTitre")).setOrigin(0.5).setDepth(61)
    );

    if (sousTitre) {

        const extra = couleurSousTitre ? { color: couleurSousTitre } : {};

        elements.push(
            scene.add.text(640, 420, sousTitre, style("resultatSous", extra)).setOrigin(0.5).setDepth(61)
        );
    }

    // Apparition : fondu + léger zoom
    scene.tweens.add({
        targets: elements,
        alpha: { from: 0, to: 1 },
        scale: { from: 0.85, to: 1 },
        duration: 250,
        ease: "Back.easeOut"
    });

    if (fete) {
        confettis(scene, 640, 330, 50);
    }
}


// ==============================================================
// 7. EFFETS VISUELS
// ==============================================================

// Petite gerbe de particules colorées qui part dans toutes les directions.
// (faite avec des cercles et des tweens : marche dans toutes les versions de Phaser)
export function explosion(scene, x, y, nombre = 18, portee = 220, taille = 9) {

    const couleurs = [COULEURS.DORE, COULEURS.TURQUOISE_CLAIR, COULEURS.ROUGE_CLAIR, COULEURS.CREME];

    for (let i = 0; i < nombre; i++) {

        const particule = scene.add.circle(
            x,
            y,
            Phaser.Math.Between(Math.max(2, taille - 4), taille),
            Phaser.Utils.Array.GetRandom(couleurs)
        ).setDepth(70);

        // Chaque particule part dans une direction au hasard
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.Between(portee * 0.4, portee);

        scene.tweens.add({
            targets: particule,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            scale: 0.2,
            duration: Phaser.Math.Between(500, 900),
            ease: "Cubic.easeOut",
            onComplete: () => particule.destroy() // on nettoie toujours
        });
    }
}


// Une petite texture ronde blanche, fabriquée à la demande (pour les émetteurs de particules)
function creerTextureParticule(scene) {

    if (scene.textures.exists("particule")) return;

    const dessin = scene.make.graphics({ x: 0, y: 0, add: false });
    dessin.fillStyle(0xffffff, 1);
    dessin.fillCircle(8, 8, 8);
    dessin.generateTexture("particule", 16, 16);
    dessin.destroy();
}


// Confettis : un "émetteur de particules" Phaser qui crache d'un coup des particules
// colorées, soumises à la gravité. (Phaser 3.60 ou plus ; sinon on utilise "explosion")
export function confettis(scene, x, y, nombre = 40) {

    if (parseFloat(Phaser.VERSION) < 3.6) {
        explosion(scene, x, y, nombre, 260, 9);
        return;
    }

    creerTextureParticule(scene);

    const emetteur = scene.add.particles(x, y, "particule", {
        speed: { min: 150, max: 450 },
        angle: { min: 200, max: 340 },        // vers le haut
        gravityY: 700,                        // puis elles retombent
        lifespan: 1500,
        scale: { start: 0.9, end: 0.2 },
        alpha: { start: 1, end: 0 },
        tint: [COULEURS.DORE, COULEURS.TURQUOISE_CLAIR, COULEURS.ROUGE_CLAIR, COULEURS.CREME],
        emitting: false                       // on n'émet que sur demande (explode)
    }).setDepth(70);

    emetteur.explode(nombre);

    // On supprime l'émetteur quand toutes les particules ont disparu
    scene.time.delayedCall(1700, () => emetteur.destroy());
}


// "+1" ou "-1" qui monte et disparaît (texte clair cerclé de la couleur donnée).
export function texteFlottant(scene, x, y, texte, couleurContour) {

    const objet = scene.add.text(x, y, texte, style("score", {
        stroke: css(couleurContour),
        strokeThickness: 8
    })).setOrigin(0.5).setDepth(50);

    scene.tweens.add({
        targets: objet,
        y: y - 100,
        alpha: 0,
        duration: 700,
        ease: "Cubic.easeOut",
        onComplete: () => objet.destroy()
    });
}


// Notes de musique qui flottent doucement DERRIÈRE le jeu, en permanence.
// (profondeur -5 : l'image de fond de la scène doit être en profondeur -10)
export function lancerAmbiance(scene) {

    const couleurs = [COULEURS.DORE, COULEURS.TURQUOISE_CLAIR, COULEURS.ROUGE_CLAIR];

    return scene.time.addEvent({

        delay: 600,
        loop: true,

        callback: () => {

            const x = Phaser.Math.Between(40, POS.LARGEUR - 40);
            const y = POS.HAUTEUR + 30;

            const note = scene.add.text(
                x,
                y,
                Phaser.Utils.Array.GetRandom(["♪", "♫", "♩", "♬"]),
                {
                    fontFamily: POLICE,
                    fontSize: Phaser.Math.Between(28, 60) + "px",
                    color: css(Phaser.Utils.Array.GetRandom(couleurs))
                }
            ).setOrigin(0.5).setAlpha(0.3).setDepth(-5);

            scene.tweens.add({
                targets: note,
                x: x + Phaser.Math.Between(-80, 80),
                y: -40,
                angle: Phaser.Math.Between(-40, 40),
                duration: Phaser.Math.Between(5000, 8000),
                onComplete: () => note.destroy()
            });
        }
    });
}


// ==============================================================
// 8. SONS
// ==============================================================

// Joue un son seulement s'il a bien été chargé (sinon : silence, mais pas de plantage).
export function jouerSon(scene, cle, config = {}) {

    if (scene.cache.audio.exists(cle)) {
        scene.sound.play(cle, config);
    }
}


// Gamme pentatonique majeure : ces notes sonnent toujours bien ensemble (do ré mi sol la)
const GAMME = [0, 2, 4, 7, 9];

// Joue une note de harpe. Un seul fichier son existe (harpe.wav, un do) :
// on change sa hauteur avec "detune", exprimé en centièmes de demi-ton.
//   degre : 0 = do, 1 = ré, 2 = mi, 3 = sol, 4 = la, 5 = do (octave au-dessus), 6 = ré...
//   options : volume, pan (-1 = gauche, +1 = droite), decalage (en centièmes de demi-ton)
export function jouerHarpe(scene, degre, options = {}) {

    const octave = Math.floor(degre / GAMME.length);
    const demiTons = GAMME[degre % GAMME.length] + 12 * octave;

    jouerSon(scene, "harpe", {
        detune: demiTons * 100 + (options.decalage ?? 0),
        volume: options.volume ?? 0.5,
        pan: options.pan ?? 0
    });
}


// ==============================================================
// 9. SCORES DE LA PARTIE
// ==============================================================
// Chaque mini-jeu enregistre ses points dans le "registry" (la mémoire commune
// à toutes les scènes). La scène "resultat" les lit à la fin pour faire le classement.

// Les trois mini-jeux, dans l'ordre (leur nom sert de titre ET de ligne du classement)
export const MINIJEUX = {
    clicker: { nom: "Le Grand Concert" },
    rythme:  { nom: "L'Air d'Opéra" },
    taupe:   { nom: "Frappe le Maestro" }
};

// Combien de points rapporte chaque réussite
export const POINTS = {
    PAR_MELODIE: 10,    // rythme : une mélodie réussie
    PAR_MAESTRO: 5      // taupe : un Maestro touché
};

// Titres honorifiques selon le total de points (du plus bas au plus haut)
export const RANGS = [
    { min: 0,   titre: "Figurant" },
    { min: 100, titre: "Choriste" },
    { min: 200, titre: "Soliste" },
    { min: 300, titre: "Diva" }
];

// À appeler au début d'une nouvelle partie
export function reinitialiserScores(scene) {
    scene.registry.set("scores", {});
}

// À appeler à la fin d'un mini-jeu : cle = "clicker", "rythme" ou "taupe"
export function enregistrerScore(scene, cle, pointsJ1, pointsJ2 = 0) {

    // On copie l'objet avant de le modifier, puis on le remet dans le registry
    const scores = Object.assign({}, scene.registry.get("scores") || {});

    scores[cle] = [pointsJ1, pointsJ2];

    scene.registry.set("scores", scores);
}

export function lireScores(scene) {
    return scene.registry.get("scores") || {};
}

// Total d'un joueur (numero : 0 pour le joueur 1, 1 pour le joueur 2)
export function totalJoueur(scores, numero) {

    return Object.keys(MINIJEUX).reduce((total, cle) => {
        const points = scores[cle] || [0, 0];
        return total + (points[numero] || 0);
    }, 0);
}

// Titre honorifique correspondant à un total
export function rangPour(total) {

    let rang = RANGS[0];

    RANGS.forEach(r => {
        if (total >= r.min) rang = r;
    });

    return rang;
}


// ==============================================================
// 10. TOUCHES DE LA BORNE D'ARCADE
// ==============================================================
// Ce que chaque joueur "envoie" sur la borne.
// Les boutons sont dans l'ordre : rangée du haut (gauche -> droite), puis rangée du bas.
// Si la borne change, on modifie UNIQUEMENT ce tableau.

export const BORNE = {
    j1: {
        gauche: "LEFT", droite: "RIGHT", haut: "UP", bas: "DOWN",
        boutons: ["I", "O", "P", "K", "L", "M"]
    },
    j2: {
        gauche: "Q", droite: "D", haut: "Z", bas: "S",
        boutons: ["R", "T", "Y", "F", "G", "H"]
    }
};

// Transforme une liste de noms ("I", "O"...) en objets Key que Phaser surveille.
// À appeler dans create().
export function creerTouches(scene, noms) {
    return noms.map(nom => scene.input.keyboard.addKey(nom));
}

// Vrai si AU MOINS UNE touche de la liste vient d'être enfoncée (à cette image précise).
export function uneTouchePressee(touches) {

    let pressee = false;

    // forEach et non "some" : JustDown "consomme" l'appui. Si on s'arrêtait à la
    // première touche trouvée, les autres garderaient leur appui en mémoire
    // et le déclencheraient à l'image suivante (appui "fantôme").
    touches.forEach(touche => {
        if (Phaser.Input.Keyboard.JustDown(touche)) {
            pressee = true;
        }
    });

    return pressee;
}