// raccourcis.js : les raccourcis clavier et borne : le reset (qui reste dans le jeu fini) et les raccourcis de test (à retirer avant la borne).
// Appelé une fois par index.js (activerRaccourcis).
//
// DEUX BOUTONS MAINTENUS 1,5 s (une barre en bas de l'écran se remplit) :
//   - Z + X (select + start)   : remettre le jeu à zéro, retour à l'écran d'accueil, sans relancer la borne (le joueur suivant)
//   - C + F (P + ; au clavier) : aller directement au boss  (TEMPORAIRE, pour tester : à retirer avant la borne)
// Les boutons de la borne sont nommés A à F ; ils envoient I, O, P, K, L et ; (voir gpio2keys.py) : C = P et F = ;. Z (select) et X (start) sont les
// deux boutons du centre. Les touches du robot sont I, K, L et O : aucune de ces combinaisons ne se déclenche en jouant, et la durée évite un appui par accident.
//
// TOUCHES DE TEST DU CLAVIER (TEMPORAIRES, à retirer avant la borne) :
//   - F8 : téléporte le robot dans l'arène du boss (niveau 1) ou loin dans la map (niveau 2)
//   - F9 : lance directement le niveau 2
const COMBOS = [
    { nom: "reset", touches: [90, 88], texte: "MAINTIENS POUR RECOMMENCER", action: (jeu) => reinitialiser(jeu) }, // Z et X
    { nom: "boss", touches: [80, 186], texte: "ALLER AU BOSS (TEST)", action: (jeu) => allerAuBoss(jeu) } // P et ;
];
const DUREE = 1500; // ms à maintenir les deux boutons
const DEBUT_AFFICHAGE = 300; // ms avant d'afficher la barre (un appui très court ne montre rien)
const CODES = COMBOS.flatMap((combo) => combo.touches);

function arreterToutesLesScenes(jeu) {
    jeu.sound.stopAll(); // coupe la musique
    jeu.scene.getScenes(false).forEach((scene) => jeu.scene.stop(scene.scene.key)); // arrête toutes les scènes (niveau, pause, classement...)
}

function reinitialiser(jeu) { // revient à l'écran d'accueil : le chrono, le score et les vies repartent de zéro quand on relance une partie (voir menu.js)
    arreterToutesLesScenes(jeu);
    jeu.scene.start("menu");
}

function nouvellePartie(jeu) { // les mêmes valeurs de départ que menu.js
    jeu.registry.set("chrono", 0);
    jeu.registry.set("score", 0);
    jeu.registry.set("vies", 3);
    jeu.registry.set("chronoActif", true);
}

function allerAuBoss(jeu) { // niveau 1 : dans l'arène du Soldat ; ensuite (ou depuis le niveau 2) : dans l'arène du dernier combat
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
    if (courante) { jeu.scene.start("niveau3"); return; } // arène du Soldat déjà faite, ou niveau 2 : on passe au dernier combat
    nouvellePartie(jeu); // depuis l'accueil ou le classement : nouvelle partie directement dans l'arène du Soldat
    jeu.scene.start("niveau1");
    jeu.scene.getScene("niveau1").events.once(Phaser.Scenes.Events.CREATE, () => {
        const niveau = jeu.scene.getScene("niveau1");
        niveau.player.setPosition(niveau.cfg.teleportBoss.x, niveau.cfg.teleportBoss.y);
    });
}

// ---- touches de test F8 et F9 (TEMPORAIRES) ----
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

export function activerRaccourcis(jeu) {
    window.addEventListener("keydown", (evenement) => { // les touches de test
        if (evenement.key === "F8") teleporterRobot(jeu);
        if (evenement.key === "F9") { evenement.preventDefault(); lancerNiveau2(jeu); }
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
