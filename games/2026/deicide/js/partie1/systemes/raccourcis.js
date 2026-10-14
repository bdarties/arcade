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
const COMBOS = [
    { nom: "reset", touches: [80, "Semicolon"], texte: "MAINTIENS POUR RECOMMENCER", action: (jeu) => reinitialiser(jeu) } // P (bouton C) et ; (bouton F)
];
const DUREE = 500; // ms à maintenir les deux boutons
const DEBUT_AFFICHAGE = 120; // ms avant d'afficher la barre (un appui très court ne montre rien)
const CODES = COMBOS.flatMap((combo) => combo.touches);
const identifiant = (evenement) => (evenement.code === "Semicolon" ? "Semicolon" : evenement.keyCode); // la touche ; (ou M en AZERTY) par sa position, les autres par leur code

export function arreterToutesLesScenes(jeu) {
    jeu.sound.stopAll(); // coupe la musique
    jeu.scene.getScenes(false).forEach((scene) => jeu.scene.stop(scene.scene.key)); // arrête toutes les scènes (niveau, pause, classement...)
}

// vrai si cette scène tourne ou est en pause (le niveau reste « en pause » sous le menu pause)
function enCours(jeu, cle) {
    const scene = jeu.scene.getScene(cle);
    if (!scene) return false; // cette scène n'existe pas (la partie 2 n'est pas installée)
    return scene.sys.isActive() || scene.sys.isPaused();
}

// recommence la partie en cours : une partie solo repart du début du niveau 1, un 1 contre 1 repart à 0 - 0. Depuis l'accueil ou l'écran de fin,
// il n'y a pas de partie en cours : on revient à l'accueil.
function reinitialiser(jeu) {
    const solo = ["niveau1", "niveau2", "niveau3"].some((cle) => enCours(jeu, cle));
    const versus = enCours(jeu, "versus");
    arreterToutesLesScenes(jeu);
    if (solo) { nouvellePartie(jeu); jeu.scene.start("niveau1"); }
    else jeu.scene.start(versus ? "versus" : "menu");
}

export function nouvellePartie(jeu) { // les mêmes valeurs de départ que menu.js
    jeu.registry.set("chrono", 0);
    jeu.registry.set("score", 0);
    jeu.registry.set("morts", 0);
    jeu.registry.set("chronoActif", true);
    jeu.registry.set("phaseBoss", null); // le boss repart de sa phase 1
    jeu.registry.set("guideVu", false); // le but et le rappel du dash s'affichent de nouveau (voir guide.js)
    jeu.registry.set("numeroPartie", (jeu.registry.get("numeroPartie") ?? 0) + 1); // une partie de plus (sert aux conseils qui ne s'affichent qu'une fois par partie)
    jeu.registry.set("reprendreAuBoss", false); // pas de reprise dans l'arène : on repart du bas de la tour
}

// ---- touches de test F8, F9 et F10 (TEMPORAIRES) ----
function teleporterRobot(jeu) { // F8 : chaque niveau indique où dans sa config (teleportBoss)
    jeu.scene.getScenes(true).forEach((scene) => { // (seulement les scènes qui tournent : pas un niveau en pause)
        if (!scene.cfg || !scene.cfg.teleportBoss) return;
        scene.player.setPosition(scene.cfg.teleportBoss.x, scene.cfg.teleportBoss.y);
        scene.player.body.setVelocity(0, 0);
    });
}

function lancerVictoire(jeu) { // F4 : l'écran de victoire, avec un temps de test
    arreterToutesLesScenes(jeu); // (coupe aussi la musique)
    jeu.scene.start("classement", { tempsBrutMs: 600000, points: 20000, tempsNetMs: 400000, morts: 3 });
}

export function activerRaccourcis(jeu) {
    window.addEventListener("keydown", (evenement) => { // les touches de test
        if (evenement.key === "F4") { evenement.preventDefault(); lancerVictoire(jeu); }
        if (evenement.key === "F8") teleporterRobot(jeu);
    });

    const enfoncees = new Set(); // les touches de combo actuellement maintenues
    let combo = null; // le combo dont les deux touches sont enfoncées
    let debut = 0; // l'instant où elles ont été enfoncées ensemble

    const boite = document.createElement("div"); // la barre de progression, en bas de l'écran
    boite.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);padding:8px 16px;background:rgba(21,17,26,.92);border:2px solid #5f4f6e;color:#e7e0e9;font:16px monospace;z-index:20;pointer-events:none;display:none;text-align:center";
    const texte = document.createElement("div");
    const fond = document.createElement("div");
    fond.style.cssText = "margin-top:6px;width:260px;height:10px;background:#3a2f45";
    const barre = document.createElement("div");
    barre.style.cssText = "height:100%;width:0;background:#f4b6c2";
    fond.appendChild(barre);
    boite.append(texte, fond);
    document.body.appendChild(boite);

    // Après un reset les boutons sont encore enfoncés : le clavier répète alors la touche (un « keydown » toutes les 30 ms), et le combo repartait aussitôt,
    // sans fin (un reset toutes les 0,5 s tant qu'on tient les boutons : le jeu redémarrait en boucle et restait figé sur la borne). Ce verrou
    // l'empêche : après un reset il faut RELÂCHER tous les boutons avant de pouvoir en déclencher un autre.
    let verrou = false;

    function annuler() { combo = null; boite.style.display = "none"; }

    window.addEventListener("keydown", (evenement) => {
        // Un vrai appui commence toujours par un « keydown » qui n'est pas une répétition. Si les boutons étaient DÉJÀ enfoncés quand la page s'est chargée
        // (au lancement du jeu sur la borne), le navigateur ne voit que des répétitions : on les ignore, sinon le reset se déclencherait tout seul.
        if (evenement.repeat) return;
        const touche = identifiant(evenement);
        if (!CODES.includes(touche)) return;
        enfoncees.add(touche);
        if (verrou) return; // un reset vient d'avoir lieu : on attend que tout soit relâché
        const trouve = COMBOS.find((c) => c.touches.every((code) => enfoncees.has(code))); // les deux touches d'un combo sont enfoncées ensemble
        if (trouve && combo === null) { combo = trouve; debut = performance.now(); }
    });
    window.addEventListener("keyup", (evenement) => {
        const touche = identifiant(evenement);
        if (!CODES.includes(touche)) return;
        enfoncees.delete(touche);
        if (verrou && enfoncees.size === 0) verrou = false; // tout est relâché : un nouveau reset est possible
        if (combo && !combo.touches.every((code) => enfoncees.has(code))) annuler(); // un des deux boutons est relâché : on annule
    });
    window.addEventListener("blur", () => { enfoncees.clear(); verrou = false; annuler(); }); // la page perd le focus : on oublie les touches

    setInterval(() => { // vérifie la durée et met la barre à jour
        if (combo === null) return;
        const maintenu = performance.now() - debut;
        if (maintenu >= DUREE) {
            const action = combo.action;
            verrou = true; // (les touches restent dans « enfoncees » : elles sont toujours physiquement enfoncées)
            annuler();
            action(jeu);
            return;
        }
        if (maintenu < DEBUT_AFFICHAGE) return;
        boite.style.display = "block";
        texte.textContent = combo.texte;
        barre.style.width = Math.round(100 * maintenu / DUREE) + "%";
    }, 50);
}
