// raccourcis.js : les raccourcis clavier et borne : le reset (qui reste dans le jeu fini) et les raccourcis de test (à retirer avant la borne).
// Appelé une fois par index.js (activerRaccourcis).
//
// DEUX BOUTONS MAINTENUS 1,5 s (une barre en bas de l'écran se remplit) :
//   - Z + X (select + start)   : recommencer la partie en cours (nouvelle partie au début du niveau 1, ou nouveau 1 contre 1) ; depuis
//                                l'accueil ou l'écran de fin : retour à l'accueil. La borne n'est pas relancée.
//   - Z + B (select J1 + select J2) : aller directement au boss  (TEMPORAIRE, pour tester : à retirer avant la borne)
// Z (select J1) et X (start) sont les deux boutons du centre du joueur 1, B est le select du joueur 2 (voir gpio2keys.py) : Z et B ne servent
// à rien d'autre dans le jeu. Les touches du robot sont I, K et L : aucune de ces combinaisons ne se déclenche en jouant, et la durée évite
// un appui par accident.
//
// TOUCHES DE TEST DU CLAVIER (TEMPORAIRES, à retirer avant la borne) :
//   - F8 : téléporte le robot dans l'arène du boss (niveau 1) ou loin dans la map (niveau 2)
//   - F9 : lance directement le niveau 2
//   - F10 : lance directement la phase 3 du dernier boss (niveau 3, le boss repart avec 45 PV)
const COMBOS = [
    { nom: "reset", touches: [90, 88], texte: "MAINTIENS POUR RECOMMENCER", action: (jeu) => reinitialiser(jeu) }, // Z et X
    { nom: "boss", touches: [90, 66], texte: "ALLER AU BOSS (TEST)", action: (jeu) => allerAuBoss(jeu) } // Z et B
];
const DUREE = 1500; // ms à maintenir les deux boutons
const DEBUT_AFFICHAGE = 300; // ms avant d'afficher la barre (un appui très court ne montre rien)
const CODES = COMBOS.flatMap((combo) => combo.touches);

function arreterToutesLesScenes(jeu) {
    jeu.sound.stopAll(); // coupe la musique
    jeu.scene.getScenes(false).forEach((scene) => jeu.scene.stop(scene.scene.key)); // arrête toutes les scènes (niveau, pause, classement...)
}

// vrai si cette scène tourne ou est en pause (le niveau reste « en pause » sous le menu pause)
function enCours(jeu, cle) {
    const systeme = jeu.scene.getScene(cle).sys;
    return systeme.isActive() || systeme.isPaused();
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

function nouvellePartie(jeu) { // les mêmes valeurs de départ que menu.js
    jeu.registry.set("chrono", 0);
    jeu.registry.set("score", 0);
    jeu.registry.set("chronoActif", true);
    jeu.registry.set("phaseBoss", null); // le boss repart de sa phase 1
    jeu.registry.set("guideVu", false); // le but et le rappel du dash s'affichent de nouveau (voir guide.js)
    jeu.registry.set("astuceDashVue", false);
    jeu.registry.set("reprendreAuBoss", false); // pas de reprise dans l'arène : on repart du bas de la tour
}

function allerAuBoss(jeu) { // niveau 1 : dans l'arène du Dieu ; ensuite (ou depuis le niveau 2) : dans l'arène du dernier combat
    const actives = jeu.scene.getScenes(true).map((scene) => scene.scene.key);
    const courante = actives.find((cle) => ["niveau1", "niveau2", "niveau3"].includes(cle));
    if (courante === "niveau3") return; // déjà dans le dernier combat
    if (courante === "niveau1" && !jeu.scene.getScene("niveau1").areneLancee) { // le niveau 1 en cours : on téléporte le robot dans l'arène
        if (actives.includes("pause")) { jeu.scene.stop("pause"); jeu.scene.resume("niveau1"); } // on ferme la pause d'abord
        const niveau = jeu.scene.getScene("niveau1");
        niveau.player.setPosition(niveau.cfg.teleportBoss.x, niveau.cfg.teleportBoss.y);
        niveau.player.body.setVelocity(0, 0);
        return;
    }
    arreterToutesLesScenes(jeu);
    if (courante) { jeu.scene.start("niveau3"); return; } // arène du Dieu déjà faite, ou niveau 2 : on passe au dernier combat
    nouvellePartie(jeu); // depuis l'accueil ou le classement : nouvelle partie directement dans l'arène du Dieu
    jeu.scene.start("niveau1");
    jeu.scene.getScene("niveau1").events.once(Phaser.Scenes.Events.CREATE, () => {
        const niveau = jeu.scene.getScene("niveau1");
        niveau.player.setPosition(niveau.cfg.teleportBoss.x, niveau.cfg.teleportBoss.y);
    });
}

// ---- touches de test F8, F9 et F10 (TEMPORAIRES) ----
function teleporterRobot(jeu) { // F8 : chaque niveau indique où dans sa config (teleportBoss)
    jeu.scene.getScenes(true).forEach((scene) => { // (seulement les scènes qui tournent : pas un niveau en pause)
        if (!scene.cfg || !scene.cfg.teleportBoss) return;
        scene.player.setPosition(scene.cfg.teleportBoss.x, scene.cfg.teleportBoss.y);
        scene.player.body.setVelocity(0, 0);
    });
}

function lancerNiveau2(jeu) { // F9 : une partie qui commence directement au niveau 2
    arreterToutesLesScenes(jeu); // (coupe aussi la musique)
    nouvellePartie(jeu);
    jeu.scene.start("niveau2");
}

function lancerPhase3(jeu) { // F10 : une partie qui commence directement à la phase 3 du dernier boss
    arreterToutesLesScenes(jeu);
    nouvellePartie(jeu);
    jeu.registry.set("phaseBoss", { profil: "soldat2", phase: 2 }); // la reprise de boss.js fait le reste : phase 3, PV du seuil
    jeu.scene.start("niveau3");
}

export function activerRaccourcis(jeu) {
    window.addEventListener("keydown", (evenement) => { // les touches de test
        if (evenement.key === "F8") teleporterRobot(jeu);
        if (evenement.key === "F9") { evenement.preventDefault(); lancerNiveau2(jeu); }
        if (evenement.key === "F10") { evenement.preventDefault(); lancerPhase3(jeu); }
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

    function annuler() { combo = null; boite.style.display = "none"; }

    window.addEventListener("keydown", (evenement) => {
        if (!CODES.includes(evenement.keyCode)) return;
        enfoncees.add(evenement.keyCode);
        const trouve = COMBOS.find((c) => c.touches.every((code) => enfoncees.has(code))); // les deux touches d'un combo sont enfoncées ensemble
        if (trouve && combo === null) { combo = trouve; debut = performance.now(); }
    });
    window.addEventListener("keyup", (evenement) => {
        if (!CODES.includes(evenement.keyCode)) return;
        enfoncees.delete(evenement.keyCode);
        if (combo && !combo.touches.every((code) => enfoncees.has(code))) annuler(); // un des deux boutons est relâché : on annule
    });
    window.addEventListener("blur", () => { enfoncees.clear(); annuler(); }); // la page perd le focus : on oublie les touches

    setInterval(() => { // vérifie la durée et met la barre à jour
        if (combo === null) return;
        const maintenu = performance.now() - debut;
        if (maintenu >= DUREE) {
            const action = combo.action;
            enfoncees.clear();
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
