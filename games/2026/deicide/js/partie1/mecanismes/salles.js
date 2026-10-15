// salles.js : les salles de combat fermées, au-dessus de certains grands sols de la map
// C'est le même système que l'arène du boss (arene.js) : quand le joueur passe l'ouverture d'un grand sol et arrive au-dessus, la caméra
// se fige sur la salle, l'ouverture se referme derrière lui et des ennemis apparaissent. La sortie (l'ouverture du sol du dessus) est
// bouchée : elle ne s'ouvre que quand tous les ennemis de la salle sont morts. Le temps compte (chrono du classement), donc plus vite on
// les tue, mieux c'est.
// Pour ajouter une salle : copier une ligne de SALLES (les numéros de ligne sont ceux de la map dans Tiled, tuiles de 32 px).
import * as effets from "../systemes/effets.js"; // éclats à l'apparition des ennemis
import * as ennemis from "../ennemis/ennemis_normaux.js"; // création des archers, mages et orcs
import { jouerSon } from "../systemes/sons.js"; // bruitages

const TUILE = 32; // taille d'une tuile de la map, en px
const POLICE = "monospace"; // la police du menu et du HUD

// ligneSol : la ligne du grand sol que le joueur franchit par l'ouverture (la salle est juste au-dessus)
// ligneSortie : la ligne du sol du dessus, dont l'ouverture est bouchée tant qu'il reste des ennemis
// entree : les colonnes de l'ouverture du sol, rebouchées derrière le joueur [première, dernière]
// sortie : les colonnes de l'ouverture du sol du dessus, bouchées jusqu'à la fin du combat (une liste, il peut y en avoir plusieurs)
// tuilesEntree, tuilesSortie : les numéros de tuiles des deux sols (alternées une colonne sur deux, comme le sol à côté)
// ennemis : [type, x, y] ; x, y = les pieds de l'ennemi sur le sol (il tombe dessus), en px dans la map
export const SALLES_NIVEAU1 = [ // la liste des salles de combat du niveau 1
    { // début de la première salle
        nom: "salle1", // son nom
        ligneSol: 153, ligneSortie: 136, // sol de la ligne 153 ; la sortie est dans le sol de la ligne 136
        entree: [32, 39], sortie: [[31, 39]], tuilesEntree: [625], tuilesSortie: [625], // colonnes de l'entrée et de la sortie, et numéros des tuiles qui les ferment
        // le mage est sur la plateforme de droite
        ennemis: [["orc", 250, 4896], ["orc", 620, 4896], ["archer", 130, 4896], ["archer", 760, 4896], ["mage", 830, 4768]] // les ennemis de la salle : type, x, et y de leurs pieds
    },
    { // début de la deuxième salle
        nom: "salle2", // son nom
        ligneSol: 89, ligneSortie: 71, // lignes du sol de la salle et de sa sortie
        // deux ouvertures dans le sol du dessus (la colonne 3 est un pilier)
        entree: [33, 39], sortie: [[0, 2], [4, 6], [33, 39]], tuilesEntree: [625], tuilesSortie: [631, 632], // colonnes de l'entrée et de la sortie, et tuiles qui les ferment
        // les mages sont sur les plateformes
        ennemis: [["orc", 150, 2848], ["orc", 480, 2848], ["orc", 700, 2848], ["archer", 300, 2848], ["archer", 950, 2848], ["mage", 480, 2464], ["mage", 830, 2464]] // les ennemis de la salle : type, x, et y de leurs pieds
    }
];
// de combien on pose chaque ennemi au-dessus de ses pieds (les créateurs d'ennemis placent leur centre)
const DECALAGE_PIEDS = { orc: 60, archer: 40, mage: 50 }; // de combien un ennemi apparaît au-dessus du sol (il tombe ensuite dessus)
const CREER = { orc: ennemis.creerOrc, archer: ennemis.creerArcher, mage: ennemis.creerMage }; // la fonction qui crée chaque type d'ennemi

// à appeler dans le create() du niveau, avec la liste des salles de ce niveau (vide pour un niveau sans salle)
export function preparerSalles(scene, salles) { // prépare les salles du niveau (appelée à la création)
    scene.salleActive = null; // la salle en cours de combat (le niveau recommence avec la même scène après une mort : on remet à zéro)
    scene.salles = salles.map((salle) => ({ ...salle, etat: "attente" })); // "attente" : pas encore atteinte, "combat" : fermée, "finie" : ouverte
}

export function verifierSalles(scene) { // à appeler dans update()
    const joueur = scene.player.body; // la hitbox du robot
    for (const salle of scene.salles) { // on regarde chaque salle
        if (salle.etat === "attente") { // salle pas encore atteinte :
            if (!scene.salleActive && !scene.partieFinie && joueurDansLaSalle(joueur, salle)) fermerSalle(scene, salle); // si le robot entre dedans et qu'aucune autre n'est active, elle se ferme
        } else if (salle.etat === "combat" && salle.apparus) { // (on ne compte qu'une fois les ennemis apparus : ils arrivent 1 s après la fermeture)
            const restants = compterRestants(scene, salle); // nombre d'ennemis encore vivants
            if (restants !== salle.restants) { salle.restants = restants; salle.compteur.setText("ENNEMIS RESTANTS : " + restants); } // si ce nombre change, on met à jour le compteur à l'écran
            if (restants === 0) ouvrirSalle(scene, salle); // plus aucun ennemi : la sortie s'ouvre
        }
    }
}

function joueurDansLaSalle(joueur, salle) { // vrai quand le joueur est entré dans la salle
    const sousLePlafond = joueur.bottom > salle.ligneSortie * TUILE; // le joueur est bien dans la salle, pas au-dessus
    return joueur.bottom <= salle.ligneSol * TUILE && sousLePlafond; // ses pieds sont passés au-dessus du sol
}

// Les cases de tuiles [colonne, ligne] qui ferment l'entrée (l'ouverture du sol) et qui bouchent la sortie (l'ouverture du sol du dessus).
function cellulesEntree(salle) { return plage(salle.entree, salle.ligneSol); } // les cases de l'entrée de la salle
function cellulesSortie(salle) { return salle.sortie.flatMap((tranche) => plage(tranche, salle.ligneSortie)); } // les cases de la sortie de la salle
// des cases côte à côte sur une ligne
function plage([debut, fin], ligne) { return Array.from({ length: fin - debut + 1 }, (_, i) => [debut + i, ligne]); } // liste les cases d'une ligne, de la colonne de début à celle de fin

function compterRestants(scene, salle) { // le nombre d'ennemis de la salle encore vivants
    return scene.ennemis.getChildren().filter((ennemi) => ennemi.salle === salle && ennemi.etat !== "mort").length; // nombre d'ennemis de cette salle qui ne sont pas morts
}

function poserTuiles(scene, salle, nom, cellules, tuiles) { // pose des tuiles de sol sur ces cases ; renvoie les cases posées, et le calque visible
    // calque qui montre les nouvelles tuiles (le calque Gameplay n'est plus dessiné, voir figerCalques)
    const visible = scene.carte.createBlankLayer("mur_" + salle.nom + "_" + nom, scene.tilesets); // un calque vide qui montrera les nouvelles tuiles
    visible.setDepth(1); // au-dessus du décor mais SOUS le voile (50) : le sol ajouté est assombri comme le reste
    const cases = []; // la liste des cases posées
    cellules.forEach(([colonne, ligne]) => { // pour chaque case demandée
        if (scene.groupe_plateformes.getTileAt(colonne, ligne)) return; // il y a déjà une tuile (pilier, plateforme) : on n'y touche pas
        const index = tuiles[colonne % tuiles.length]; // les tuiles alternent d'une colonne à l'autre, comme le sol à côté
        visible.putTileAt(index, colonne, ligne); // on pose la tuile visible
        // la même tuile dans le calque Gameplay : le joueur, les tirs et les orcs la sentent comme du sol
        const solide = scene.groupe_plateformes.putTileAt(index, colonne, ligne); // on pose la même tuile solide
        solide.setCollision(true, true, true, true); // elle bloque dans les 4 directions
        cases.push([colonne, ligne]); // on retient cette case
    });
    visible.setAlpha(0); // les tuiles sont invisibles au départ...
    scene.tweens.add({ targets: visible, alpha: 1, duration: 300 }); // ...et apparaissent en 0,3 s
    return { visible, cases }; // on renvoie le calque visible et les cases posées
}

function fermerSalle(scene, salle) { // ferme une salle : le combat commence
    salle.etat = "combat"; // la salle passe en état « combat »
    salle.apparus = false; // les ennemis ne sont pas encore là
    scene.salleActive = salle; // une seule salle à la fois
    const camera = scene.cameras.main; // la caméra
    camera.stopFollow(); // la caméra arrête de suivre le joueur...
    // le milieu de la salle en hauteur : entre le sol du dessus et celui du dessous
    const centreY = (salle.ligneSortie + 1 + salle.ligneSol) / 2 * TUILE; // la hauteur du milieu de la salle, en pixels
    camera.pan(640, centreY, 800, "Sine.easeInOut"); // ...et glisse en 0,8 s pour cadrer toute la salle
    // l'entrée se referme derrière le joueur (elle reste fermée)
    salle.entreeMur = poserTuiles(scene, salle, "entree", cellulesEntree(salle), salle.tuilesEntree); // on ferme l'entrée
    // et la sortie se bouche, jusqu'à la mort du dernier ennemi
    salle.sortieMur = poserTuiles(scene, salle, "sortie", cellulesSortie(salle), salle.tuilesSortie); // on ferme la sortie
    camera.shake(300, 0.01); // tremblement : on sent que la salle se referme
    salle.restants = salle.ennemis.length; // nombre d'ennemis à tuer
    // le compteur, en haut au milieu de l'écran
    salle.compteur = scene.add.text(640, 36, "ENNEMIS RESTANTS : " + salle.restants, { fontFamily: POLICE, fontSize: "24px", color: "#e7e0e9", stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(100); // le texte du compteur d'ennemis restants
    // la consigne, sous le compteur : sans elle le joueur ne sait pas pourquoi la sortie reste fermée
    salle.consigne = scene.add.text(640, 70, "TUE TOUS LES ENNEMIS POUR POUVOIR MONTER", { fontFamily: POLICE, fontSize: "20px", color: "#f4b6c2", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(100); // la consigne affichée sous le compteur
    scene.time.delayedCall(1000, () => faireApparaitreEnnemis(scene, salle)); // les ennemis apparaissent une fois la caméra en place
}

function faireApparaitreEnnemis(scene, salle) { // fait apparaître les ennemis de la salle
    salle.apparus = true; // à partir de maintenant on compte les ennemis restants
    salle.ennemis.forEach(([type, x, piedsY]) => { // pour chaque ennemi de la liste
        const ennemi = CREER[type](scene, x, piedsY - DECALAGE_PIEDS[type]); // il apparaît un peu au-dessus du sol et tombe dessus
        ennemi.salle = salle; // on retient de quelle salle il vient pour les compter
        ennemi.toujoursVoit = true; // dans la salle, il repère toujours le joueur (voir repere dans ennemis_normaux.js) : il faut les affronter
        ennemi.prochainTir = scene.time.now + 1500; // pas de tir à la seconde où il apparaît
        ennemi.prochainCoup = scene.time.now + 1000; // il ne frappe pas tout de suite
        ennemi.setAlpha(0); // il apparaît en fondu
        scene.tweens.add({ targets: ennemi, alpha: 1, duration: 500 }); // il apparaît en fondu
        if (ennemi.halo) { ennemi.halo.setAlpha(0); scene.tweens.add({ targets: ennemi.halo, alpha: 0.8, duration: 500 }); } // son halo apparaît en fondu aussi
        effets.eclats(scene, x, piedsY - DECALAGE_PIEDS[type], 0xc79bff, 14, 220); // gerbe violette, comme leur halo
    });
}

function ouvrirSalle(scene, salle) { // le dernier ennemi est mort : la sortie s'ouvre
    salle.etat = "finie"; // la salle est terminée
    scene.salleActive = null; // plus aucune salle active
    jouerSon(scene, "porte"); // bruit de porte : la sortie s'ouvre
    // les tuiles de la sortie ne sont plus solides
    salle.sortieMur.cases.forEach(([colonne, ligne]) => scene.groupe_plateformes.removeTileAt(colonne, ligne)); // les tuiles de la sortie ne sont plus solides
    // et s'effacent en 0,4 s
    scene.tweens.add({ targets: salle.sortieMur.visible, alpha: 0, duration: 400, onComplete: () => salle.sortieMur.visible.destroy() }); // elles s'effacent en 0,4 s
    salle.compteur.setText("SORTIE OUVERTE"); // le compteur annonce que la sortie est ouverte
    salle.consigne.destroy(); // la consigne n'a plus de raison d'être
    // le message disparaît après 1,5 s
    scene.tweens.add({ targets: salle.compteur, alpha: 0, delay: 1500, duration: 500, onComplete: () => salle.compteur.destroy() }); // le compteur disparaît après 1,5 s
    reprendreCamera(scene); // la caméra suit de nouveau le robot
}

// La caméra était figée au milieu de la salle ; le robot, lui, est souvent loin de ce milieu (au sol en bas de la salle, par exemple). Si
// la caméra se recentrait
// d'un coup sur lui (startFollow le fait sans transition), elle descendrait puis remonterait quand il va vers la sortie. On lui laisse donc
// une « zone morte » autour du milieu de la salle (la caméra
// ne bouge que si le robot en sort), puis on la rétrécit en douceur : la caméra revient se centrer sur le robot sans à-coup.
export function reprendreCamera(scene) { // (exportée pour pouvoir la tester seule)
    const camera = scene.cameras.main; // la caméra
    const zone = { l: 400, h: 260 }; // taille de la zone morte, en px (plus petite qu'avant : la caméra ne reste plus longtemps en dessous du robot)
    // startFollow (et setDeadzone quand la caméra suit déjà) place la caméra d'un coup sur le robot : c'était le saut brutal. On retient où
    // elle est...
    const { scrollX, scrollY } = camera; // où est la caméra maintenant
    const milieuX = camera.midPoint.x; // le milieu de la caméra en x
    const milieuY = camera.midPoint.y; // le milieu de la caméra en y
    camera.setDeadzone(zone.l, zone.h); // (la zone morte d'abord, tant que la caméra ne suit rien : elle ne saute pas)
    camera.startFollow(scene.player, false, 0.22, 0.22); // suit vite (0,1 avant : la caméra traînait sous le robot qui montait)
    camera.midPoint.set(milieuX, milieuY); // on remet la caméra où elle était
    camera.setScroll(scrollX, scrollY); // ...et on la remet là : elle rejoindra le robot en douceur
    // La zone morte se rétrécit quand le robot se rapproche du milieu de l'écran (il est monté vers la sortie), et au pire après 5 s. Elle
    // rétrécit petit à petit : la caméra se recentre sans à-coup, puis le suivi redevient normal.
    const debut = scene.time.now; // l'heure de départ
    let retrait = false; // vrai quand la zone morte commence à rétrécir
    const majCamera = () => { // fonction appelée à chaque image pour rétrécir la zone morte
        const proche = Math.abs(scene.player.y - camera.midPoint.y) < 140; // vrai si le robot est proche du milieu de la caméra
        if (!retrait && (proche || scene.time.now - debut > 1500)) retrait = true; // on commence à rétrécir si le robot est proche, ou après 1,5 s
        if (retrait) { zone.l *= 0.85; zone.h *= 0.85; } // la zone morte rétrécit de 15 % à chaque image
        if (zone.l < 6) { // la zone est presque nulle : on la retire, le suivi du niveau reprend (le robot est déjà au centre)
            scene.events.off(Phaser.Scenes.Events.UPDATE, majCamera); // on arrête de mettre à jour la zone
            camera.setDeadzone(); // on retire la zone morte
            // le suivi redevient « collé » au robot petit à petit (lerp de 0,1 à 1) : passer d'un coup à 1 faisait un petit à-coup
            const rampe = () => { // fonction qui rend le suivi de plus en plus collé au robot
                const lerp = Math.min(1, camera.lerp.x + 0.15); // le suivi augmente petit à petit jusqu'à 1
                camera.setLerp(lerp, lerp); // on l'applique à la caméra
                if (lerp >= 1) scene.events.off(Phaser.Scenes.Events.UPDATE, rampe); // à 1, on arrête
            };
            scene.events.on(Phaser.Scenes.Events.UPDATE, rampe); // on la branche sur la mise à jour du niveau
            scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, rampe)); // et on la débranche à l'arrêt de la scène
        } else if (camera.deadzone) { // on change la taille directement : setDeadzone re-sauterait sur le robot
            camera.deadzone.width = zone.l; // largeur de la zone morte
            camera.deadzone.height = zone.h; // hauteur de la zone morte
        }
    };
    scene.events.on(Phaser.Scenes.Events.UPDATE, majCamera); // on branche la mise à jour de la caméra
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, majCamera)); // et on la débranche à l'arrêt de la scène
}
