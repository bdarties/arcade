// ⚠ PARTIE 2 : HORS ÉVALUATION. Cette partie n'est pas à prendre en compte dans la partie évaluée (qui est la partie 1, dans js/partie1/).
// Elle a été ajoutée à la fin, uniquement pour rendre le jeu plus intéressant sur la borne et répondre à la demande de Nicolas Maurin :
// rendre le jeu plus difficile et ajouter du contenu. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// vide.js : le vide du niveau 2 (les trous entre les plateformes)
// Tomber dans un trou coûte 1 PV, puis le robot revient sur le dernier endroit sûr où il a posé les pieds. Sans ça il resterait coincé
// en bas de la map (le bas du monde est un sol invisible) et le niveau ne pourrait pas se finir.

export function preparerVide(scene) { // à appeler dans le create() du niveau
    scene.dernierSol = { x: scene.player.x, y: scene.player.y }; // au départ : le point de départ du niveau
}

export function majVide(scene) { // à appeler dans update()
    const joueur = scene.player;
    const corps = joueur.body;
    if (scene.mort || scene.partieFinie) return;
    // il a les pieds sur un sol : on retient l'endroit, s'il est sûr (du sol sous les deux côtés du robot, donc pas au bord d'un trou)
    if (corps.blocked.down) {
        const calque = scene.groupe_plateformes;
        const dessous = corps.bottom + 4;
        const gauche = calque.getTileAtWorldXY(corps.center.x - corps.halfWidth - 6, dessous);
        const droite = calque.getTileAtWorldXY(corps.center.x + corps.halfWidth + 6, dessous);
        if (gauche && gauche.collides && droite && droite.collides) scene.dernierSol = { x: joueur.x, y: joueur.y };
    }
    if (corps.bottom < scene.carte.heightInPixels - 4) return; // pas encore tombé tout en bas de la map
    scene.blesserJoueur(1, "Tombé dans le vide"); // -1 PV (et s'il n'en reste plus, le niveau recommence)
    if (scene.mort) return;
    joueur.setPosition(scene.dernierSol.x, scene.dernierSol.y - 4); // retour sur le dernier sol sûr
    corps.setVelocity(0, 0);
    scene.cameras.main.flash(250, 255, 255, 255);
}
