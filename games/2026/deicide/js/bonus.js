// bonus.js : les bonus que lâchent les ennemis quand ils meurent (pour l'instant : un PV)
// Un ennemi tué a CHANCE_PV de chances de laisser une croix de soin : elle jaillit, tombe sur le sol, et le joueur doit la
// ramasser en passant dessus pour regagner 1 PV (la barre de PV du HUD s'allume d'une cellule).
// Si la barre est déjà pleine, la croix est ramassée quand même (le texte affiche « PV MAX » et rien n'est regagné).
// Utilisation : tenterDropPV(scene, x, y) quand un ennemi meurt ; preparerBonus(scene) dans le create() du niveau.
import { textePoints } from "./effets.js"; // pour afficher « +1 PV » à l'endroit où on la ramasse
import { PV_MAX_BARRE } from "./Personnage/barreDeVie.js"; // nombre de cellules de la barre (le maximum de PV)

const CHANCE_PV = 0.3; // 30 % de chances qu'un ennemi tué laisse un PV
const ECHELLE = 4; // la croix fait 9 x 9 pixels : 36 px à l'écran

// La croix de soin : un simple « + » blanc, dessiné pixel par pixel (# = pixel blanc, . = transparent)
const MOTIF_CROIX = [
    "...###...",
    "...###...",
    "...###...",
    "#########",
    "#########",
    "#########",
    "...###...",
    "...###...",
    "...###..."
];

function creerTextureCroix(scene) {
    if (scene.textures.exists("bonus_pv")) return; // déjà dessinée (autre niveau, ou scène relancée)
    const texture = scene.textures.createCanvas("bonus_pv", 9, 9);
    const ctx = texture.getContext();
    MOTIF_CROIX.forEach((ligne, y) => {
        [...ligne].forEach((lettre, x) => {
            if (lettre === ".") return; // transparent
            ctx.fillStyle = "#ffffff"; // blanc
            ctx.fillRect(x, y, 1, 1);
        });
    });
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
}

// à appeler quand un ennemi meurt, à l'endroit où il est mort
export function tenterDropPV(scene, x, y) {
    if (typeof scene.pv !== "number") return; // cette scène n'a pas de PV à soigner
    if (Math.random() >= CHANCE_PV) return; // 7 fois sur 10, rien ne tombe
    creerBonusPV(scene, x, y);
}

// à appeler dans create() d'un niveau (une fois le joueur et les plateformes créés) : prépare le groupe des croix à ramasser
export function preparerBonus(scene) {
    groupeBonus(scene);
}

// le groupe qui contient toutes les croix à ramasser de la scène (créé par preparerBonus, ou au premier drop sinon)
function groupeBonus(scene) {
    if (scene.bonusPV && scene.bonusPV.scene) return scene.bonusPV; // déjà créé (s'il vient d'une ancienne partie, il n'a plus de scène : on en refait un)
    creerTextureCroix(scene);
    const groupe = scene.physics.add.group({ collideWorldBounds: true, bounceY: 0.35 }); // elles rebondissent un peu en tombant
    if (scene.groupe_plateformes) scene.physics.add.collider(groupe, scene.groupe_plateformes); // elles se posent sur les plateformes
    scene.physics.add.overlap(scene.player, groupe, (joueur, bonus) => ramasserPV(scene, bonus)); // le joueur les ramasse en les touchant
    const suivre = () => groupe.getChildren().forEach(bonus => { if (bonus.halo) bonus.halo.setPosition(bonus.x, bonus.y); }); // la lueur suit la croix
    scene.events.on(Phaser.Scenes.Events.UPDATE, suivre);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, suivre));
    scene.bonusPV = groupe;
    return groupe;
}

function creerBonusPV(scene, x, y) {
    const bonus = groupeBonus(scene).create(x, y, "bonus_pv");
    bonus.setScale(ECHELLE);
    bonus.setDepth(51); // au-dessus du voile d'ombre (50) pour qu'on la voie même dans le noir
    bonus.body.setGravityY(700); // elle tombe plus vite que le reste (la gravité du jeu est faible : 300), sinon elle flotterait
    bonus.setVelocity(Phaser.Math.Between(-90, 90), -260); // elle jaillit vers le haut, un peu de côté
    bonus.setDragX(150); // et ralentit sur le sol
    bonus.setAlpha(0);
    scene.tweens.add({ targets: bonus, alpha: 1, duration: 120 }); // elle apparaît d'un coup rapide
    if (scene.textures.exists("halo_doux")) { // une petite lueur blanche autour, qui bat doucement (la texture du halo vient d'ennemis.js)
        const halo = scene.add.image(x, y, "halo_doux");
        halo.setScale(0.4).setTint(0xe7e0e9).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setAlpha(0.9);
        halo.setPipeline("SinglePipeline"); // le shader simple (voir optimisation.js)
        scene.tweens.add({ targets: halo, scale: 0.55, alpha: 0.5, duration: 600, yoyo: true, repeat: -1 });
        bonus.halo = halo;
        bonus.once("destroy", () => halo.destroy()); // la lueur disparaît avec la croix
    }
    return bonus;
}

function ramasserPV(scene, bonus) {
    if (!bonus.active) return; // déjà ramassée à cette image
    if (scene.pv <= 0) return; // le robot est à terre : un soin ne le relève pas
    const x = bonus.x;
    const y = bonus.y;
    bonus.destroy(); // la croix est toujours ramassée, même si la barre est pleine
    const gagne = scene.pv < PV_MAX_BARRE; // vrai s'il reste une cellule à allumer
    if (gagne) {
        scene.pv += 1; // un PV de plus
        scene.hud.majPV(scene.pv); // la barre s'allume d'une cellule
    }
    textePoints(scene, x, y - 24, gagne ? "+1 PV" : "PV MAX"); // le texte monte puis s'efface (« PV MAX » : rien à regagner)
    bipPV(scene);
}

// petit bip montant fabriqué dans le code (pas de fichier son) : trois notes rapides
function bipPV(scene) {
    const contexte = scene.sound.context; // le moteur audio du navigateur (absent si le son est coupé)
    if (!contexte) return;
    const t = contexte.currentTime;
    const oscillateur = contexte.createOscillator();
    const volume = contexte.createGain();
    oscillateur.type = "square";
    [523, 784, 1046].forEach((note, i) => oscillateur.frequency.setValueAtTime(note, t + i * 0.08)); // do, sol, do aigu
    volume.gain.setValueAtTime(0.1, t);
    volume.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
    oscillateur.connect(volume);
    volume.connect(scene.sound.destination || contexte.destination);
    oscillateur.start(t);
    oscillateur.stop(t + 0.35);
}
