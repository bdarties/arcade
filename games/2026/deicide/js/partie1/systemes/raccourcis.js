// raccourcis.js : les raccourcis clavier et borne : le reset (qui reste dans le jeu fini) et les raccourcis de test (à retirer avant la borne).
// Appelé une fois par index.js (activerRaccourcis).
//
// DEUX BOUTONS MAINTENUS 0,5 s (une barre en bas de l'écran se remplit) :
//   - C + F (P et ;)           : recommencer la partie en cours (nouvelle partie au début du niveau 1, ou nouveau 1 contre 1) ; depuis
//                                l'accueil ou l'écran de fin : retour à l'accueil. La borne n'est pas relancée.
// C et F sont les boutons 3 et 6 du joueur 1 : ils envoient P et ; (voir gpio2keys.py). Sur un clavier AZERTY, la touche ; est la touche M :
// on reconnaît donc ; par sa position (evenement.code "Semicolon"), pas par la lettre. Les touches du robot sont I, K, L et O : cette combinaison
// ne se déclenche pas en jouant, et la durée évite un appui par accident.
//
// TOUCHES DE TEST DU CLAVIER (TEMPORAIRES, à retirer avant la borne) :
//   - F4 : lance directement l'écran de victoire (classement.js, avec un temps de test)
//   - F8 : téléporte le robot dans l'arène du boss (niveau 1) ou loin dans la map (niveau 2)
//   (F9 : lancer le niveau 2, F10 : lancer la phase 3 du dernier boss : ce sont des touches de test de la partie 2, voir partie2/tests_borne.js)
// ---------------------------------------------------------------------------------------------
// TOUTES LES TOUCHES DU JEU (un seul endroit : pour en changer une, c'est ici)
// ---------------------------------------------------------------------------------------------
// Deux façons de nommer une touche, selon l'outil qui la lit :
//   - noms Phaser en MAJUSCULES ("ENTER", "SPACE", "X", "SEMICOLON"...) : pour this.input.keyboard.on("keydown-...") et addKey ;
//   - codes du navigateur ("KeyO", "Enter", "Semicolon"...) : pour evenement.code (crédits, mode NO HIT) ; evenement.key pour les touches F.
// Deux cas ne sont PAS listés, car ils lisent toutes les touches : « n'importe quelle touche » pour rejouer en 1 contre 1 (versus.js) et la saisie du nom au classement (classement.js).
// Sur la borne, les boutons A à F envoient I, O, P, K, L et ; (voir gpio2keys.py) ; le joystick du joueur 2 envoie Q/A, D, Z/W, S.
// L'aide affichée en jeu (personnage/hud.js) lit ces touches : changer une touche ici suffit (les lettres A à F viennent de BOUTONS_BORNE, les flèches de l'aide sont dessinées en dur).
export const TOUCHES = {
    joueur1Deplacement: { left: "LEFT", right: "RIGHT", up: "UP", down: "DOWN" }, // bouger (gauche, droite) et viser (haut, bas) du joueur 1 : les noms left/right/up/down sont ceux que le code attend
    joueur1: { saut: "I", tir: "K", dash: "L" }, // le robot du joueur 1 (personnage.js) : A = I, D = K, E = L sur la borne
    joueur2: { saut: "R", tir: "F", dash: "G" }, // le robot du joueur 2 en 1 contre 1 (versus.js)
    joueur2Deplacement: { gauche: ["Q", "A"], droite: "D", haut: ["Z", "W"], bas: "S" }, // déplacer et viser le joueur 2 (Q Z D S en AZERTY, A et W : joystick de la borne)
    menu: { // l'accueil (menu.js)
        jouer: ["ENTER", "SPACE", "X", "I", "O", "P", "K", "L", "SEMICOLON"], // lancent le jeu solo : clavier et boutons de la borne (X = start)
        jouer2: ["R", "T", "Y", "F", "G", "H", "N"], // boutons du joueur 2 (N = son start) : lancent le 1 contre 1
        haut: ["UP", "W", "Z"], bas: ["DOWN", "S"], droite: ["RIGHT", "D"], gauche: ["LEFT", "Q"] // changer de mode : solo, 1 contre 1, classement
    },
    pause: { // le menu pause (pause.js)
        ouvrir: ["ESC", "X"], // ouvrent la pause en jeu
        valider: ["ENTER", "SPACE", "I"], // valident une ligne (le panthéon les utilise aussi)
        retour: ["ESC", "X", "K", "O"], // reviennent en arrière : des crédits au menu, du menu au jeu
        haut: ["UP"], bas: ["DOWN"], gauche: ["LEFT"], droite: ["RIGHT"] // naviguer dans le menu pause et régler les curseurs
    },
    pantheon: { precedent: ["LEFT", "UP"], suivant: ["RIGHT", "DOWN"] }, // le choix de fin de boss (pantheon.js) ; valider = pause.valider
    classement: { // l'écran de fin (classement.js), codes du navigateur
        valider: ["KeyI", "Enter", "Space"], // valident le choix, le nom et le classement (I = le bouton de saut de la borne)
        gauche: "ArrowLeft", droite: "ArrowRight", haut: "ArrowUp", bas: "ArrowDown" // OUI / NON, puis changer la lettre (haut, bas) et la case (gauche, droite)
    },
    credits: { sortir: ["KeyI", "Enter", "Space", "KeyO", "KeyK", "KeyL"] }, // passent les crédits (credits.js), codes du navigateur
    noHit: ["KeyO", "Semicolon"], // maintenues ensemble : le mode NO HIT (mode_no_hit.js) ; ; = la touche M d'un clavier AZERTY
    reset: [80, "Semicolon"], // maintenues 0,5 s : recommencer la partie (ci-dessous) ; P (bouton C) = 80 et ; (bouton F)
    test: { // touches de test du clavier (TEMPORAIRES, à retirer avant la borne), lues par evenement.key
        victoire: "F4", teleporter: "F8", // F4 : écran de victoire ; F8 : téléporter le robot (ci-dessous)
        niveau2: "F9", phase3: "F10", phase4: "F5", // lancent le niveau 2, la phase 3 et la phase 4 du dernier boss (partie2/tests_borne.js)
        cadence: "F3" // affiche ou cache la boîte d'images par seconde (optimisation.js) ; sur la borne : le bouton B (touche O)
    }
};

// Le bouton de la borne (A à F) que chaque touche représente, pour l'aide affichée en jeu (hud.js) : A = I, B = O, C = P, D = K, E = L, F = ;
export const BOUTONS_BORNE = { I: "A", O: "B", P: "C", K: "D", L: "E", SEMICOLON: "F" };

const COMBOS = [ // la liste des combinaisons de touches (une seule : le reset)
    { nom: "reset", touches: TOUCHES.reset, texte: "MAINTIENS POUR RECOMMENCER", action: (jeu) => reinitialiser(jeu) } // P (bouton C) et ; (bouton F)
]; // fin de la liste
const DUREE = 500; // ms à maintenir les deux boutons
const DEBUT_AFFICHAGE = 120; // ms avant d'afficher la barre (un appui très court ne montre rien)
const CODES = COMBOS.flatMap((combo) => combo.touches); // toutes les touches des combinaisons
const identifiant = (evenement) => (evenement.code === "Semicolon" ? "Semicolon" : evenement.keyCode); // la touche ; (ou M en AZERTY) par sa position, les autres par leur code

export function arreterToutesLesScenes(jeu) { // arrête toutes les scènes et la musique
    jeu.sound.stopAll(); // coupe la musique
    jeu.scene.getScenes(false).forEach((scene) => jeu.scene.stop(scene.scene.key)); // arrête toutes les scènes (niveau, pause, classement...)
} // fin de la fonction

// vrai si cette scène tourne ou est en pause (le niveau reste « en pause » sous le menu pause)
function enCours(jeu, cle) { // vrai si cette scène tourne ou est en pause
    const scene = jeu.scene.getScene(cle); // la scène de cette clé
    if (!scene) return false; // cette scène n'existe pas (la partie 2 n'est pas installée)
    return scene.sys.isActive() || scene.sys.isPaused(); // vrai si elle est active ou en pause
}

// recommence la partie en cours : une partie solo repart du début du niveau 1, un 1 contre 1 repart à 0 - 0. Depuis l'accueil ou l'écran de fin,
// il n'y a pas de partie en cours : on revient à l'accueil.
function reinitialiser(jeu) { // recommence la partie en cours
    const solo = ["niveau1", "niveau2", "niveau3"].some((cle) => enCours(jeu, cle)); // vrai si une partie solo est en cours
    const versus = enCours(jeu, "versus"); // vrai si un 1 contre 1 est en cours
    arreterToutesLesScenes(jeu); // on arrête tout
    if (solo) { nouvellePartie(jeu); jeu.scene.start("niveau1"); } // solo : nouvelle partie au niveau 1
    else jeu.scene.start(versus ? "versus" : "menu"); // sinon : 1 contre 1 ou accueil
}

export function nouvellePartie(jeu) { // les mêmes valeurs de départ que menu.js
    jeu.registry.set("chrono", 0); // le chrono à zéro
    jeu.registry.set("score", 0); // le score à zéro
    jeu.registry.set("morts", 0); // zéro mort
    jeu.registry.set("coups", 0); // zéro coup reçu
    jeu.registry.set("chronoActif", true); // le chrono peut tourner
    jeu.registry.set("phaseBoss", null); // le boss repart de sa phase 1
    jeu.registry.set("guideVu", false); // le but et le rappel du dash s'affichent de nouveau (voir guide.js)
    jeu.registry.set("numeroPartie", (jeu.registry.get("numeroPartie") ?? 0) + 1); // une partie de plus (sert aux conseils qui ne s'affichent qu'une fois par partie)
    jeu.registry.set("reprendreAuBoss", false); // pas de reprise dans l'arène : on repart du bas de la tour
}

// ---- touches de test F8, F9 et F10 (TEMPORAIRES) ----
function teleporterRobot(jeu) { // F8 : chaque niveau indique où dans sa config (teleportBoss)
    jeu.scene.getScenes(true).forEach((scene) => { // (seulement les scènes qui tournent : pas un niveau en pause)
        if (!scene.cfg || !scene.cfg.teleportBoss) return; // pas de position de test : on passe
        scene.player.setPosition(scene.cfg.teleportBoss.x, scene.cfg.teleportBoss.y); // on place le robot à cet endroit
        scene.player.body.setVelocity(0, 0); // il ne bouge plus
    });
}

function lancerVictoire(jeu) { // F4 : l'écran de victoire, avec un temps de test
    arreterToutesLesScenes(jeu); // (coupe aussi la musique)
    jeu.scene.start("classement", { tempsBrutMs: 600000, points: 20000, tempsNetMs: 400000, morts: 3, coups: 7 }); // on affiche l'écran de victoire
}

export function activerRaccourcis(jeu) { // branche les raccourcis sur le clavier (appelée par index.js)
    window.addEventListener("keydown", (evenement) => { // les touches de test
        if (evenement.key === TOUCHES.test.victoire) { evenement.preventDefault(); lancerVictoire(jeu); } // F4 : écran de victoire
        if (evenement.key === TOUCHES.test.teleporter) teleporterRobot(jeu); // F8 : téléportation
    }); // fin de la liste des touches de test

    const enfoncees = new Set(); // les touches de combo actuellement maintenues
    let combo = null; // le combo dont les deux touches sont enfoncées
    let debut = 0; // l'instant où elles ont été enfoncées ensemble

    const boite = document.createElement("div"); // la barre de progression, en bas de l'écran
    boite.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);padding:8px 16px;background:rgba(21,17,26,.92);border:2px solid #5f4f6e;color:#e7e0e9;font:16px monospace;z-index:20;pointer-events:none;display:none;text-align:center"; // son style : en bas de l'écran, cachée au départ
    const texte = document.createElement("div"); // le texte de la boîte
    const fond = document.createElement("div"); // le fond de la barre
    fond.style.cssText = "margin-top:6px;width:260px;height:10px;background:#3a2f45"; // son style
    const barre = document.createElement("div"); // la barre qui se remplit
    barre.style.cssText = "height:100%;width:0;background:#f4b6c2"; // son style
    fond.appendChild(barre); // la barre est dans son fond
    boite.append(texte, fond); // on assemble la boîte
    document.body.appendChild(boite); // on l'ajoute à la page

    // Après un reset les boutons sont encore enfoncés : le clavier répète alors la touche (un « keydown » toutes les 30 ms), et le combo repartait aussitôt,
    // sans fin (un reset toutes les 0,5 s tant qu'on tient les boutons : le jeu redémarrait en boucle et restait figé sur la borne). Ce verrou
    // l'empêche : après un reset il faut RELÂCHER tous les boutons avant de pouvoir en déclencher un autre.
    let verrou = false; // vrai juste après un reset : il faut tout relâcher avant d'en refaire un

    function annuler() { combo = null; boite.style.display = "none"; } // annule le combo en cours et cache la barre

    window.addEventListener("keydown", (evenement) => { // à chaque touche appuyée
        // Un vrai appui commence toujours par un « keydown » qui n'est pas une répétition. Si les boutons étaient DÉJÀ enfoncés quand la page s'est chargée
        // (au lancement du jeu sur la borne), le navigateur ne voit que des répétitions : on les ignore, sinon le reset se déclencherait tout seul.
        if (evenement.repeat) return; // une répétition de touche est ignorée
        const touche = identifiant(evenement); // la touche appuyée
        if (!CODES.includes(touche)) return; // si elle ne fait partie d'aucun combo, rien
        enfoncees.add(touche); // on note qu'elle est enfoncée
        if (verrou) return; // un reset vient d'avoir lieu : on attend que tout soit relâché
        const trouve = COMBOS.find((c) => c.touches.every((code) => enfoncees.has(code))); // les deux touches d'un combo sont enfoncées ensemble
        if (trouve && combo === null) { combo = trouve; debut = performance.now(); } // on le démarre
    });
    window.addEventListener("keyup", (evenement) => { // à chaque touche relâchée
        const touche = identifiant(evenement); // la touche relâchée
        if (!CODES.includes(touche)) return; // si elle ne fait partie d'aucun combo, rien
        enfoncees.delete(touche); // on note qu'elle est relâchée
        if (verrou && enfoncees.size === 0) verrou = false; // tout est relâché : un nouveau reset est possible
        if (combo && !combo.touches.every((code) => enfoncees.has(code))) annuler(); // un des deux boutons est relâché : on annule
    });
    window.addEventListener("blur", () => { enfoncees.clear(); verrou = false; annuler(); }); // la page perd le focus : on oublie les touches

    setInterval(() => { // vérifie la durée et met la barre à jour
        if (combo === null) return; // pas de combo en cours : rien
        const maintenu = performance.now() - debut; // la durée maintenue
        if (maintenu >= DUREE) { // assez longtemps :
            const action = combo.action; // l'action du combo
            verrou = true; // (les touches restent dans « enfoncees » : elles sont toujours physiquement enfoncées)
            annuler(); // on annule l'affichage
            action(jeu); // on lance l'action
            return; // on s'arrête là
        }
        if (maintenu < DEBUT_AFFICHAGE) return; // trop tôt pour afficher la barre
        boite.style.display = "block"; // on affiche la boîte
        texte.textContent = combo.texte; // le texte du combo
        barre.style.width = Math.round(100 * maintenu / DUREE) + "%"; // la barre se remplit selon la durée
    }, 50); // toutes les 50 ms
}
