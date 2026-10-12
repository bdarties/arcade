// reset.js : remettre le jeu à zéro depuis la borne, sans relancer le navigateur
// Il faut MAINTENIR deux boutons en même temps pendant 1,5 s : BTN3 (P) et BTN6 (;) du joueur 1. Ces deux boutons ne servent à rien en jeu
// (le robot utilise I, K, L et O), donc on ne peut pas déclencher le reset par erreur en jouant ; la durée évite aussi un appui par accident.
// Le reset ramène à l'écran d'accueil : le chrono, le score et les vies repartent de zéro quand on relance une partie (voir menu.js).
const TOUCHES_RESET = [80, 186]; // codes des touches P et ; (les mêmes que Phaser.Input.Keyboard.KeyCodes.P et SEMICOLON)
const DUREE_RESET = 1500; // ms à maintenir les deux boutons
const DEBUT_AFFICHAGE = 300; // ms avant d'afficher la barre (un appui très court ne montre rien)

export function activerReset(jeu) {
    const enfoncees = new Set(); // les touches de reset actuellement maintenues
    let debut = null; // l'instant où les deux touches ont été enfoncées ensemble

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

    function reinitialiser() { // revient à l'écran d'accueil
        debut = null;
        boite.style.display = "none";
        enfoncees.clear();
        jeu.sound.stopAll(); // coupe la musique
        jeu.scene.getScenes(false).forEach((scene) => jeu.scene.stop(scene.scene.key)); // arrête toutes les scènes (niveau, pause, classement...)
        jeu.scene.start("menu");
    }

    window.addEventListener("keydown", (evenement) => {
        if (!TOUCHES_RESET.includes(evenement.keyCode)) return;
        enfoncees.add(evenement.keyCode);
        if (enfoncees.size === TOUCHES_RESET.length && debut === null) debut = performance.now(); // les deux sont enfoncées ensemble
    });
    window.addEventListener("keyup", (evenement) => {
        if (!TOUCHES_RESET.includes(evenement.keyCode)) return;
        enfoncees.delete(evenement.keyCode);
        debut = null; // un des deux boutons est relâché : on annule
        boite.style.display = "none";
    });
    window.addEventListener("blur", () => { enfoncees.clear(); debut = null; boite.style.display = "none"; }); // la page perd le focus : on oublie les touches

    setInterval(() => { // vérifie la durée et met la barre à jour
        if (debut === null) return;
        const maintenu = performance.now() - debut;
        if (maintenu >= DUREE_RESET) { reinitialiser(); return; }
        if (maintenu < DEBUT_AFFICHAGE) return;
        boite.style.display = "block";
        texte.textContent = "MAINTIENS POUR RECOMMENCER";
        barre.style.width = Math.round(100 * maintenu / DUREE_RESET) + "%";
    }, 50);
}
