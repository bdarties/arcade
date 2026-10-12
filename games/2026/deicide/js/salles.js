// salles.js : les salles de combat fermées, au-dessus de certains grands sols de la map
// C'est le même système que l'arène du boss (arene.js) : quand le joueur passe l'ouverture d'un grand sol et arrive au-dessus, la caméra
// se fige sur la salle, l'ouverture se referme derrière lui et des ennemis apparaissent. La sortie (l'ouverture du sol du dessus) est
// bouchée : elle ne s'ouvre que quand tous les ennemis de la salle sont morts. Le temps compte (chrono du classement), donc plus vite on
// les tue, mieux c'est.
// Pour ajouter une salle : copier une ligne de SALLES (les numéros de ligne sont ceux de la map dans Tiled, tuiles de 32 px).
import * as effets from "./effets.js"; // éclats à l'apparition des ennemis
import * as ennemis from "./ennemis.js"; // création des archers, mages et orcs
import { jouerSon } from "./sons.js"; // bruitages

const TUILE = 32; // taille d'une tuile de la map, en px
const POLICE = "monospace"; // la police du menu et du HUD

// ligneSol : la ligne du grand sol que le joueur franchit par l'ouverture (la salle est juste au-dessus)
// ligneSortie : la ligne du sol du dessus, dont l'ouverture est bouchée tant qu'il reste des ennemis
// entree : les colonnes de l'ouverture du sol, rebouchées derrière le joueur [première, dernière]
// sortie : les colonnes de l'ouverture du sol du dessus, bouchées jusqu'à la fin du combat (une liste, il peut y en avoir plusieurs)
// tuilesEntree, tuilesSortie : les numéros de tuiles des deux sols (alternées une colonne sur deux, comme le sol à côté)
// ennemis : [type, x, y] ; x, y = les pieds de l'ennemi sur le sol (il tombe dessus), en px dans la map
export const SALLES_NIVEAU1 = [
    {
        nom: "salle1",
        ligneSol: 153, ligneSortie: 136, // sol de la ligne 153 ; la sortie est dans le sol de la ligne 136
        entree: [32, 39], sortie: [[31, 39]], tuilesEntree: [625], tuilesSortie: [625],
        ennemis: [["orc", 250, 4896], ["orc", 620, 4896], ["archer", 130, 4896], ["archer", 760, 4896], ["mage", 830, 4768]] // le mage est sur la plateforme de droite
    },
    {
        nom: "salle2",
        ligneSol: 89, ligneSortie: 71,
        entree: [33, 39], sortie: [[0, 2], [4, 6], [33, 39]], tuilesEntree: [625], tuilesSortie: [631, 632], // deux ouvertures dans le sol du dessus (la colonne 3 est un pilier)
        ennemis: [["orc", 150, 2848], ["orc", 480, 2848], ["orc", 700, 2848], ["archer", 300, 2848], ["archer", 950, 2848], ["mage", 480, 2464], ["mage", 830, 2464]] // les mages sont sur les plateformes
    }
];
// Salle HORIZONTALE (niveau 2) : type "horizontale", colonnes = [première, dernière] de la salle (40 colonnes = un écran), lignes = [haut, bas] des murs de
// lumière posés à gauche (derrière le joueur, définitif) et à droite (la sortie, jusqu'à la mort du dernier ennemi).
export const SALLES_NIVEAU2 = [
    {
        nom: "salle_n2", type: "horizontale",
        colonnes: [232, 271], lignes: [0, 19], tuilesEntree: [625], tuilesSortie: [625],
        ennemis: [["orc", 7700, 640], ["orc", 8080, 640], ["orc", 8400, 640], ["archer", 7850, 640], ["archer", 8560, 640], ["mage", 7790, 512], ["mage", 8300, 512]] // les mages sont sur les plateformes
    }
];
const DECALAGE_PIEDS = { orc: 60, archer: 40, mage: 50 }; // de combien on pose chaque ennemi au-dessus de ses pieds (les créateurs d'ennemis placent leur centre)
const CREER = { orc: ennemis.creerOrc, archer: ennemis.creerArcher, mage: ennemis.creerMage };

export function preparerSalles(scene, salles) { // à appeler dans le create() du niveau, avec la liste des salles de ce niveau (vide pour un niveau sans salle)
    scene.salleActive = null; // la salle en cours de combat (le niveau recommence avec la même scène après une mort : on remet à zéro)
    scene.salles = salles.map((salle) => ({ ...salle, etat: "attente" })); // "attente" : pas encore atteinte, "combat" : fermée, "finie" : ouverte
}

export function verifierSalles(scene) { // à appeler dans update()
    const joueur = scene.player.body;
    for (const salle of scene.salles) {
        if (salle.etat === "attente") {
            if (!scene.salleActive && !scene.partieFinie && joueurDansLaSalle(joueur, salle)) fermerSalle(scene, salle);
        } else if (salle.etat === "combat" && salle.apparus) { // (on ne compte qu'une fois les ennemis apparus : ils arrivent 1 s après la fermeture)
            const restants = compterRestants(scene, salle);
            if (restants !== salle.restants) { salle.restants = restants; salle.compteur.setText("ENNEMIS RESTANTS : " + restants); }
            if (restants === 0) ouvrirSalle(scene, salle);
        }
    }
}

function joueurDansLaSalle(joueur, salle) { // vrai quand le joueur est entré dans la salle
    if (salle.type === "horizontale") { // il a passé le mur de gauche de quelques tuiles, et n'est pas déjà sorti à droite
        return joueur.center.x > (salle.colonnes[0] + 3) * TUILE && joueur.center.x < salle.colonnes[1] * TUILE;
    }
    const sousLePlafond = joueur.bottom > salle.ligneSortie * TUILE; // le joueur est bien dans la salle, pas au-dessus
    return joueur.bottom <= salle.ligneSol * TUILE && sousLePlafond; // ses pieds sont passés au-dessus du sol
}

function cellulesEntree(salle) { // les cases de tuiles qui ferment l'entrée : [colonne, ligne]
    if (salle.type === "horizontale") return colonneDeMur(salle.colonnes[0], salle.lignes);
    return plage(salle.entree, salle.ligneSol);
}
function cellulesSortie(salle) { // les cases qui bouchent la sortie
    if (salle.type === "horizontale") return colonneDeMur(salle.colonnes[1], salle.lignes);
    return salle.sortie.flatMap((tranche) => plage(tranche, salle.ligneSortie));
}
function plage([debut, fin], ligne) { return Array.from({ length: fin - debut + 1 }, (_, i) => [debut + i, ligne]); } // des cases côte à côte sur une ligne
function colonneDeMur(colonne, [haut, bas]) { return Array.from({ length: bas - haut + 1 }, (_, i) => [colonne, haut + i]); } // des cases l'une sur l'autre dans une colonne

function compterRestants(scene, salle) { // le nombre d'ennemis de la salle encore vivants
    return scene.ennemis.getChildren().filter((ennemi) => ennemi.salle === salle && ennemi.etat !== "mort").length;
}

function poserTuiles(scene, salle, nom, cellules, tuiles) { // pose des tuiles de sol sur ces cases ; renvoie les cases posées, et le calque visible
    const visible = scene.carte.createBlankLayer("mur_" + salle.nom + "_" + nom, scene.tilesets); // calque qui montre les nouvelles tuiles (le calque Gameplay n'est plus dessiné, voir figerCalques)
    visible.setDepth(1); // au-dessus du décor mais SOUS le voile (50) : le sol ajouté est assombri comme le reste
    const cases = [];
    cellules.forEach(([colonne, ligne], i) => {
        if (scene.groupe_plateformes.getTileAt(colonne, ligne)) return; // il y a déjà une tuile (pilier, plateforme) : on n'y touche pas
        const index = tuiles[(salle.type === "horizontale" ? i : colonne) % tuiles.length]; // les tuiles alternent d'une case à l'autre
        visible.putTileAt(index, colonne, ligne);
        const solide = scene.groupe_plateformes.putTileAt(index, colonne, ligne); // la même tuile dans le calque Gameplay : le joueur, les tirs et les orcs la sentent comme du sol
        solide.setCollision(true, true, true, true);
        cases.push([colonne, ligne]);
    });
    visible.setAlpha(0); // les tuiles sont invisibles au départ...
    scene.tweens.add({ targets: visible, alpha: 1, duration: 300 }); // ...et apparaissent en 0,3 s
    return { visible, cases };
}

function fermerSalle(scene, salle) {
    salle.etat = "combat";
    salle.apparus = false; // les ennemis ne sont pas encore là
    scene.salleActive = salle; // une seule salle à la fois
    const camera = scene.cameras.main;
    camera.stopFollow(); // la caméra arrête de suivre le joueur...
    const centreX = salle.type === "horizontale" ? (salle.colonnes[0] + salle.colonnes[1] + 1) / 2 * TUILE : 640; // le milieu de la salle
    const centreY = salle.type === "horizontale" ? scene.carte.heightInPixels / 2 : (salle.ligneSortie + 1 + salle.ligneSol) / 2 * TUILE; // (en hauteur : entre le sol du dessus et celui du dessous)
    camera.pan(centreX, centreY, 800, "Sine.easeInOut"); // ...et glisse en 0,8 s pour cadrer toute la salle
    salle.entreeMur = poserTuiles(scene, salle, "entree", cellulesEntree(salle), salle.tuilesEntree); // l'entrée se referme derrière le joueur (elle reste fermée)
    salle.sortieMur = poserTuiles(scene, salle, "sortie", cellulesSortie(salle), salle.tuilesSortie); // et la sortie se bouche, jusqu'à la mort du dernier ennemi
    camera.shake(300, 0.01); // tremblement : on sent que la salle se referme
    salle.restants = salle.ennemis.length;
    salle.compteur = scene.add.text(640, 36, "ENNEMIS RESTANTS : " + salle.restants, { fontFamily: POLICE, fontSize: "24px", color: "#e7e0e9", stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(100); // le compteur, en haut au milieu de l'écran
    scene.time.delayedCall(1000, () => faireApparaitreEnnemis(scene, salle)); // les ennemis apparaissent une fois la caméra en place
}

function faireApparaitreEnnemis(scene, salle) {
    salle.apparus = true; // à partir de maintenant on compte les ennemis restants
    salle.ennemis.forEach(([type, x, piedsY]) => {
        const ennemi = CREER[type](scene, x, piedsY - DECALAGE_PIEDS[type]); // il apparaît un peu au-dessus du sol et tombe dessus
        ennemi.salle = salle; // on retient de quelle salle il vient pour les compter
        ennemi.toujoursVoit = true; // dans la salle, il repère toujours le joueur (voir repere dans ennemis.js) : il faut les affronter
        ennemi.prochainTir = scene.time.now + 1500; // pas de tir à la seconde où il apparaît
        ennemi.prochainCoup = scene.time.now + 1000;
        ennemi.setAlpha(0); // il apparaît en fondu
        scene.tweens.add({ targets: ennemi, alpha: 1, duration: 500 });
        if (ennemi.halo) { ennemi.halo.setAlpha(0); scene.tweens.add({ targets: ennemi.halo, alpha: 0.8, duration: 500 }); }
        effets.eclats(scene, x, piedsY - DECALAGE_PIEDS[type], 0xc79bff, 14, 220); // gerbe violette, comme leur halo
    });
}

function ouvrirSalle(scene, salle) { // le dernier ennemi est mort : la sortie s'ouvre
    salle.etat = "finie";
    scene.salleActive = null;
    jouerSon(scene, "porte"); // bruit de porte : la sortie s'ouvre
    salle.sortieMur.cases.forEach(([colonne, ligne]) => scene.groupe_plateformes.removeTileAt(colonne, ligne)); // les tuiles de la sortie ne sont plus solides
    scene.tweens.add({ targets: salle.sortieMur.visible, alpha: 0, duration: 400, onComplete: () => salle.sortieMur.visible.destroy() }); // et s'effacent en 0,4 s
    salle.compteur.setText("SORTIE OUVERTE");
    scene.tweens.add({ targets: salle.compteur, alpha: 0, delay: 1500, duration: 500, onComplete: () => salle.compteur.destroy() }); // le message disparaît après 1,5 s
    const camera = scene.cameras.main;
    camera.startFollow(scene.player, false, 0.08, 0.08); // la caméra reprend le joueur, en douceur...
    scene.time.delayedCall(1500, () => camera.setLerp(1, 1)); // ...puis revient à son suivi normal, sans retard
}
