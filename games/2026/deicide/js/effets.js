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

export function eclats(scene, x, y, couleur, nombre, vitesse) { // fait jaillir des éclats depuis le point x, y
    creerTexturePixel(scene); // s'assure que la texture des particules existe
    const emetteur = scene.add.particles(x, y, "pixel", { // crée un émetteur de particules à cet endroit
        speed: { min: vitesse * 0.4, max: vitesse }, // chaque éclat part avec une vitesse au hasard entre ces deux valeurs
        angle: { min: 0, max: 360 }, // dans toutes les directions
        scale: { start: 1.5, end: 0 }, // les éclats rétrécissent jusqu'à disparaître
        lifespan: { min: 250, max: 550 }, // chaque éclat vit entre 0,25 et 0,55 s
        gravityY: 600, // les éclats retombent
        tint: couleur, // couleur des éclats
        emitting: false // n'émet rien tout seul : on déclenche une seule explosion juste en dessous
    });
    emetteur.setDepth(52); // au-dessus du voile et des halos, pour que les éclats se voient dans le noir
    emetteur.explode(nombre); // lance tous les éclats d'un coup
    scene.time.delayedCall(700, () => emetteur.destroy()); // supprime l'émetteur quand tous les éclats ont disparu
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
    eclats(scene, ennemi.body.center.x, ennemi.body.center.y, 0xc79bff, 6, 160); // quelques éclats violets
}

export function ennemiMort(scene, ennemi) { // effets quand un ennemi meurt
    flash(ennemi, 0xffffff, 90); // flash blanc plus long
    eclats(scene, ennemi.body.center.x, ennemi.body.center.y, 0xc79bff, 22, 320); // grosse gerbe d'éclats violets
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
    eclats(scene, lanterne.x, lanterne.y, 0xf3e6b8, 14, 220); // éclats de verre doré
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

export function alerte(scene, ennemi, symbole) { // affiche « ! » (il t'a vu) ou « ? » (il t'a perdu) au-dessus d'un ennemi
    const texte = scene.add.text(ennemi.body.center.x, ennemi.body.top - 10, symbole, { // texte posé au-dessus de la tête de l'ennemi
        fontFamily: "monospace", fontSize: "28px", fontStyle: "bold", // gros caractère gras
        color: symbole === "!" ? "#ffffff" : "#9a9aa8", // « ! » en blanc qui claque, « ? » en gris plus discret
        stroke: "#000000", strokeThickness: 5 // contour noir pour rester lisible sur la lumière comme dans le noir
    });
    texte.setOrigin(0.5, 1); // ancré au milieu, en bas : il se pose pile sur la tête
    texte.setDepth(60); // au-dessus du voile et des halos
    texte.setScale(0.3); // commence tout petit...
    scene.tweens.add({ targets: texte, scale: 1, duration: 120, ease: "Back.Out" }); // ...et grossit d'un coup avec un petit rebond
    scene.tweens.add({ targets: texte, y: texte.y - 18, alpha: 0, delay: 450, duration: 300, onComplete: () => texte.destroy() }); // puis monte en s'effaçant
}

export function textePoints(scene, x, y, texte) { // affiche les points gagnés (« +100 ») qui montent et s'effacent
    const affichage = scene.add.text(x, y, texte, { // texte posé à l'endroit du gain
        fontFamily: "monospace", fontSize: "22px", fontStyle: "bold", // caractère gras
        color: "#ffd45c", // jaune doré, la couleur des points
        stroke: "#000000", strokeThickness: 4 // contour noir pour rester lisible partout
    });
    affichage.setOrigin(0.5, 1); // ancré au milieu, en bas
    affichage.setDepth(60); // au-dessus du voile et des halos
    scene.tweens.add({ targets: affichage, y: y - 50, alpha: 0, duration: 900, ease: "Cubic.Out", onComplete: () => affichage.destroy() }); // monte de 50 px en s'effaçant, puis disparaît
}
