// effets.js : tous les effets qui rendent les actions satisfaisantes (tremblements, flashs, éclats, traînée de dash, alertes)
// chaque effet est une petite fonction qu'on appelle au bon moment depuis les autres fichiers

function creerTexturePixel(scene) { // crée une texture d'un carré blanc de 4 x 4 px, utilisée pour toutes les particules
    if (scene.textures.exists("pixel")) return; // déjà créée : on la réutilise
    const dessin = scene.make.graphics({ add: false }); // un dessin qui n'est pas affiché à l'écran
    dessin.fillStyle(0xffffff); // couleur blanche : on pourra la teinter de n'importe quelle couleur ensuite
    dessin.fillRect(0, 0, 4, 4); // un carré de 4 px
    dessin.generateTexture("pixel", 4, 4); // transforme le dessin en texture nommée "pixel"
    dessin.destroy(); // le dessin ne sert plus, seule la texture compte
}

// les trois sortes d'éclats du jeu : [couleur, vitesse]. Un émetteur de particules est assez long à fabriquer, alors on en
// garde un par sorte (OPTIMISATION pour la borne) et on le réutilise à chaque fois, au lieu d'en fabriquer puis détruire un à chaque tir.
const ECLATS_ENNEMI_TOUCHE = [0xc79bff, 160]; // éclats violets d'un ennemi touché
const ECLATS_ENNEMI_MORT = [0xc79bff, 320]; // grosse gerbe violette d'un ennemi qui meurt
const ECLATS_LANTERNE = [0xf3e6b8, 220]; // éclats de verre doré d'une lanterne

function emetteurEclats(scene, couleur, vitesse) { // l'émetteur d'éclats de cette couleur et de cette vitesse (fabriqué la première fois)
    creerTexturePixel(scene); // s'assure que la texture des particules existe
    if (!scene.emetteursEclats) scene.emetteursEclats = {};
    const cle = couleur + "_" + vitesse;
    let emetteur = scene.emetteursEclats[cle];
    if (!emetteur || !emetteur.scene) { // pas encore fabriqué (ou détruit avec une ancienne partie)
        emetteur = scene.add.particles(0, 0, "pixel", { // un émetteur de particules, qui ne bouge pas : les éclats naissent là où on les demande
            speed: { min: vitesse * 0.4, max: vitesse }, // chaque éclat part avec une vitesse au hasard entre ces deux valeurs
            angle: { min: 0, max: 360 }, // dans toutes les directions
            scale: { start: 1.5, end: 0 }, // les éclats rétrécissent jusqu'à disparaître
            lifespan: { min: 250, max: 550 }, // chaque éclat vit entre 0,25 et 0,55 s
            gravityY: 600, // les éclats retombent
            tint: couleur, // couleur des éclats
            emitting: false // n'émet rien tout seul : on déclenche les explosions à la demande
        });
        emetteur.setDepth(52); // au-dessus du voile et des halos, pour que les éclats se voient dans le noir
        scene.emetteursEclats[cle] = emetteur;
    }
    return emetteur;
}

export function eclats(scene, x, y, couleur, nombre, vitesse) { // fait jaillir des éclats depuis le point x, y
    emetteurEclats(scene, couleur, vitesse).explode(nombre, x, y); // lance tous les éclats d'un coup, à cet endroit
}

export function flash(objet, couleur, duree) { // colore entièrement un sprite pendant un court instant
    objet.setTintFill(couleur); // remplit le sprite d'une seule couleur (la forme reste, les détails disparaissent)
    objet.scene.time.delayedCall(duree, () => { if (objet.active) objet.clearTint(); }); // puis lui rend ses vraies couleurs
}

export function arretSurImage(scene, duree) { // fige toute la physique un très court instant : chaque coup donne l'impression de « peser »
    scene.physics.world.pause(); // tout s'arrête : joueur, ennemis, tirs
    scene.time.delayedCall(duree, () => scene.physics.world.resume()); // et repart après quelques millisecondes
}

export function ennemiTouche(scene, ennemi) { // effets quand un tir touche un ennemi sans le tuer
    flash(ennemi, 0xffffff, 70); // l'ennemi devient blanc 70 ms : on voit tout de suite que le tir a touché
    eclats(scene, ennemi.body.center.x, ennemi.body.center.y, ECLATS_ENNEMI_TOUCHE[0], 6, ECLATS_ENNEMI_TOUCHE[1]); // quelques éclats violets
}

export function ennemiMort(scene, ennemi) { // effets quand un ennemi meurt
    flash(ennemi, 0xffffff, 90); // flash blanc plus long
    eclats(scene, ennemi.body.center.x, ennemi.body.center.y, ECLATS_ENNEMI_MORT[0], 22, ECLATS_ENNEMI_MORT[1]); // grosse gerbe d'éclats violets
    scene.cameras.main.shake(120, 0.006); // petit tremblement d'écran : 120 ms, faible intensité
    arretSurImage(scene, 60); // micro-pause de 60 ms au moment du coup final
}

export function joueurTouche(scene) { // effets quand le joueur perd un PV
    scene.cameras.main.shake(180, 0.012); // tremblement plus fort que pour un ennemi : c'est le joueur qui souffre
    scene.cameras.main.flash(120, 120, 0, 0); // l'écran clignote en rouge sombre (durée, rouge, vert, bleu)
    scene.player.flashJusqua = scene.time.now + 300; // pendant 0,3 s, la lumière ne change pas la teinte du joueur (voir lumiere.js)
    flash(scene.player, 0xff3030, 100); // le robot devient rouge
    scene.time.delayedCall(200, () => flash(scene.player, 0xff3030, 100)); // puis clignote une deuxième fois
}

export function lanterneCassee(scene, lanterne) { // effets quand une lanterne s'éteint
    eclats(scene, lanterne.x, lanterne.y, ECLATS_LANTERNE[0], 14, ECLATS_LANTERNE[1]); // éclats de verre doré
    scene.cameras.main.shake(80, 0.004); // tout petit tremblement
}

export function traineeDash(joueur) { // laisse des copies fantômes du robot derrière lui pendant le dash
    const scene = joueur.scene; // la scène du robot
    scene.time.addEvent({ // répète une action plusieurs fois
        delay: 45, // toutes les 45 ms
        repeat: 5, // 6 fois au total (la 1re + 5 répétitions), sur la durée du dash
        callback: () => {
            const fantome = scene.add.image(joueur.x, joueur.y, joueur.texture.key, joueur.frame.name); // copie de l'image actuelle du robot
            fantome.setOrigin(joueur.originX, joueur.originY); // même point d'ancrage que le robot, sinon la copie serait décalée
            fantome.setScale(joueur.scaleX, joueur.scaleY); // même taille
            fantome.setFlipX(joueur.flipX); // même sens
            fantome.setTintFill(0xff3030); // fantôme rouge
            fantome.setAlpha(0.5); // à moitié transparent
            fantome.setDepth(joueur.depth - 1); // juste derrière le robot
            scene.tweens.add({ targets: fantome, alpha: 0, duration: 220, onComplete: () => fantome.destroy() }); // s'efface en 0,22 s puis disparaît
        }
    });
}

// OPTIMISATION (borne) : un texte Phaser fabrique une image (canvas + texture) à chaque fois qu'on le crée, et ça fait
// un à-coup d'une ou deux images au moment où l'ennemi te repère ou meurt. On garde donc les textes déjà fabriqués dans une
// réserve : quand une alerte ou des points disparaissent, leur texte retourne dans la réserve au lieu d'être détruit, et le
// suivant le reprend. preparerEffets() en fabrique quelques-uns d'avance, au début du niveau.
const STYLE_ALERTE = { fontFamily: "monospace", fontSize: "28px", fontStyle: "bold", stroke: "#000000", strokeThickness: 5 }; // gros caractère gras, contour noir pour rester lisible sur la lumière comme dans le noir
const COULEUR_ALERTE = { "!": "#ffffff", "?": "#9a9aa8" }; // « ! » en blanc qui claque, « ? » en gris plus discret
const STYLE_POINTS = { fontFamily: "monospace", fontSize: "22px", fontStyle: "bold", color: "#ffd45c", stroke: "#000000", strokeThickness: 4 }; // jaune doré, la couleur des points, avec un contour noir pour rester lisible partout

function prendreTexte(scene, x, y, contenu, style) { // un texte tout prêt (pris dans la réserve s'il y en a un, sinon fabriqué)
    const cle = contenu + style.color; // un « ! » blanc et un « ? » gris ne se ressemblent pas : chaque texte a sa propre pile
    if (!scene.reserveTextes) scene.reserveTextes = {};
    const pile = scene.reserveTextes[cle] || (scene.reserveTextes[cle] = []);
    let texte = pile.pop();
    if (texte && texte.scene) { // un texte de la réserve (s'il a été détruit avec une ancienne partie, texte.scene n'existe plus : on l'ignore)
        texte.setPosition(x, y).setActive(true).setVisible(true).setAlpha(1).setScale(1);
    } else {
        texte = scene.add.text(x, y, contenu, style);
        texte.setOrigin(0.5, 1); // ancré au milieu, en bas
        texte.setDepth(60); // au-dessus du voile et des halos
    }
    texte.cleReserve = cle;
    return texte;
}

function rendreTexte(scene, texte) { // le texte n'est plus affiché : il retourne dans la réserve, caché, pour le prochain
    texte.setActive(false).setVisible(false);
    scene.reserveTextes[texte.cleReserve].push(texte);
}

export function preparerEffets(scene) { // à appeler au début d'un niveau : fabrique d'avance les textes et les émetteurs d'éclats pour ne pas le faire en pleine action
    scene.reserveTextes = {}; // réserve vide : les textes d'une partie précédente ont été détruits avec elle
    scene.emetteursEclats = {}; // pareil pour les émetteurs d'éclats
    for (const [couleur, vitesse] of [ECLATS_ENNEMI_TOUCHE, ECLATS_ENNEMI_MORT, ECLATS_LANTERNE]) emetteurEclats(scene, couleur, vitesse);
    const fabriquer = (contenu, style, nombre) => {
        const textes = [];
        for (let i = 0; i < nombre; i++) textes.push(prendreTexte(scene, 0, 0, contenu, style));
        textes.forEach(texte => rendreTexte(scene, texte));
    };
    for (const symbole of ["!", "?"]) fabriquer(symbole, { ...STYLE_ALERTE, color: COULEUR_ALERTE[symbole] }, 4);
    for (const points of [100, 200, 400]) fabriquer("+" + points, STYLE_POINTS, 3);
    fabriquer("+1 PV", STYLE_POINTS, 2); // le texte quand on ramasse un PV (voir bonus.js)
    fabriquer("PV MAX", STYLE_POINTS, 1); // ...ou quand la barre est déjà pleine
}

export function alerte(scene, ennemi, symbole) { // affiche « ! » (il t'a vu) ou « ? » (il t'a perdu) au-dessus d'un ennemi
    const texte = prendreTexte(scene, ennemi.body.center.x, ennemi.body.top - 10, symbole, { ...STYLE_ALERTE, color: COULEUR_ALERTE[symbole] }); // texte posé au-dessus de la tête de l'ennemi
    texte.setScale(0.3); // commence tout petit...
    scene.tweens.add({ targets: texte, scale: 1, duration: 120, ease: "Back.Out" }); // ...et grossit d'un coup avec un petit rebond
    scene.tweens.add({ targets: texte, y: texte.y - 18, alpha: 0, delay: 450, duration: 300, onComplete: () => rendreTexte(scene, texte) }); // puis monte en s'effaçant
}

export function textePoints(scene, x, y, texte) { // affiche les points gagnés (« +100 ») qui montent et s'effacent
    const affichage = prendreTexte(scene, x, y, texte, STYLE_POINTS); // texte posé à l'endroit du gain
    scene.tweens.add({ targets: affichage, y: y - 50, alpha: 0, duration: 900, ease: "Cubic.Out", onComplete: () => rendreTexte(scene, affichage) }); // monte de 50 px en s'effaçant, puis retourne dans la réserve
}
