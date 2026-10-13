// faisceaux.js : les faisceaux de lumière du niveau 2 : de hautes colonnes de lumière qui s'allument à tour de rôle
// Chaque faisceau suit le même cycle : éteint (on passe), il clignote (avertissement), puis il s'allume et blesse (1 PV) ; les faisceaux
// sont décalés les uns des autres, il faut donc choisir son moment et souvent dasher pour traverser avant qu'ils ne s'allument.
// Les faisceaux sont des points du calque d'objets "faisceau" de la map Tiled (un point par faisceau : seul son x compte).

const PERIODE = 3300; // ms d'un cycle complet
const AVERTISSEMENT = 500; // ms de clignotement avant l'allumage
const ALLUME = 700; // ms où le faisceau blesse
const DECALAGE = 1100; // ms de décalage entre un faisceau et le suivant
const LARGEUR = 56; // largeur du faisceau en px

export function preparerFaisceaux(scene, xs) { // à appeler dans le create() du niveau ; xs = la position x (en px) de chaque faisceau
    const hauteur = scene.carte.heightInPixels;
    scene.faisceaux = xs.map((x, i) => {
        // le rayon, invisible au départ
        const rayon = scene.add.rectangle(x, hauteur / 2, LARGEUR, hauteur, 0xfff2c0, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setAlpha(0);
        return { x, rayon, decalage: i * DECALAGE, allume: false, touche: false };
    });
}

export function majFaisceaux(scene) { // à appeler dans update()
    const maintenant = scene.time.now;
    const corps = scene.player.body;
    for (const faisceau of scene.faisceaux) {
        const phase = (maintenant + faisceau.decalage) % PERIODE; // où on en est dans le cycle, de 0 à PERIODE
        const debutAvertissement = PERIODE - ALLUME - AVERTISSEMENT;
        const debutAllume = PERIODE - ALLUME;
        if (phase >= debutAllume) { // allumé
            faisceau.rayon.setAlpha(0.9);
            const dedans = corps.center.x + corps.halfWidth * 0.6 > faisceau.x - LARGEUR / 2 && corps.center.x - corps.halfWidth * 0.6 < faisceau.x + LARGEUR / 2;
            // l'invincibilité d'une seconde de blesserJoueur évite les coups en rafale
            if (dedans && !scene.mort && !scene.partieFinie) scene.blesserJoueur(1, "Brûlé par un faisceau");
        } else if (phase >= debutAvertissement) { // avertissement : il clignote
            faisceau.rayon.setAlpha(Math.floor(maintenant / 70) % 2 === 0 ? 0.28 : 0.1);
        } else {
            faisceau.rayon.setAlpha(0); // éteint
        }
    }
}
