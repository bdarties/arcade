// bonus.js : les bonus que lâchent les ennemis quand ils meurent (pour l'instant : un PV)
// Un ennemi tué a CHANCE_PV de chances de laisser une croix de soin : elle jaillit, tombe sur le sol, et le joueur doit la
// ramasser en passant dessus pour regagner 1 PV (la barre de PV du HUD s'allume d'une cellule).
// Si la barre est déjà pleine, la croix n'est PAS ramassée : elle reste au sol pour plus tard.
// Utilisation : tenterDropPV(scene, x, y) quand un ennemi meurt ; preparerBonus(scene) dans le create() du niveau.
import { ENNEMIS } from "../parametres.js"; // chanceDePV
import { volumeEffets } from "../systemes/sons.js"; // le bip suit le réglage des bruitages
import { textePoints, clignoter } from "../systemes/effets.js"; // pour afficher « +1 PV » à l'endroit où on la ramasse
import { PV_MAX_BARRE } from "../personnage/barre_de_vie.js"; // nombre de cellules de la barre (le maximum de PV)
import { creerTextureCroix } from "../systemes/dessins_en_code.js"; // la croix de soin (dessinée en code)

const ECHELLE = 4; // la croix fait 9 x 9 pixels : 36 px à l'écran



// à appeler quand un ennemi meurt, à l'endroit où il est mort
export function tenterDropPV(scene, x, y) { // un ennemi tué peut laisser un PV à ramasser
    if (typeof scene.pv !== "number") return; // cette scène n'a pas de PV à soigner
    if (Math.random() >= ENNEMIS.chanceDePV) return; // 7 fois sur 10, rien ne tombe
    creerBonusPV(scene, x, y); // on crée la croix de soin
}

// laisse tomber un PV à coup sûr (le boss en lâche un à chaque changement de phase)
export function lacherPV(scene, x, y) { // laisse tomber un PV à coup sûr
    if (typeof scene.pv !== "number") return; // si la scène n'a pas de PV, rien
    creerBonusPV(scene, x, y); // on crée la croix de soin
}

// à appeler dans create() d'un niveau (une fois le joueur et les plateformes créés) : prépare le groupe des croix à ramasser
export function preparerBonus(scene) { // prépare le groupe des croix de soin du niveau
    groupeBonus(scene); // on crée le groupe tout de suite
}

// le groupe qui contient toutes les croix à ramasser de la scène (créé par preparerBonus, ou au premier drop sinon)
function groupeBonus(scene) { // renvoie le groupe des croix de soin (le crée au besoin)
    // déjà créé (s'il vient d'une ancienne partie, il n'a plus de scène : on en refait un)
    if (scene.bonusPV && scene.bonusPV.scene) return scene.bonusPV; // il existe déjà : on le renvoie
    creerTextureCroix(scene); // on fabrique l'image de la croix
    const groupe = scene.physics.add.group({ collideWorldBounds: true, bounceY: 0.35 }); // elles rebondissent un peu en tombant
    if (scene.groupe_plateformes) scene.physics.add.collider(groupe, scene.groupe_plateformes); // elles se posent sur les plateformes
    scene.physics.add.overlap(scene.player, groupe, (joueur, bonus) => ramasserPV(scene, bonus)); // le joueur les ramasse en les touchant
    // la lueur suit la croix
    const suivre = () => groupe.getChildren().forEach(bonus => { if (bonus.halo) bonus.halo.setPosition(bonus.x, bonus.y); }); // à chaque image, la lueur suit sa croix
    scene.events.on(Phaser.Scenes.Events.UPDATE, suivre); // on branche cette fonction sur la mise à jour du niveau
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, suivre)); // et on la débranche à l'arrêt de la scène
    scene.bonusPV = groupe; // la scène retient son groupe de croix
    return groupe; // on renvoie le groupe
}

function creerBonusPV(scene, x, y) { // crée une croix de soin à cet endroit
    const bonus = groupeBonus(scene).create(x, y, "bonus_pv"); // on la crée dans le groupe
    bonus.setScale(ECHELLE); // on l'agrandit (9 px → 36 px)
    bonus.setDepth(51); // au-dessus du voile d'ombre (50) pour qu'on la voie même dans le noir
    bonus.body.setGravityY(700); // elle tombe plus vite que le reste (la gravité du jeu est faible : 300), sinon elle flotterait
    bonus.setVelocity(Phaser.Math.Between(-90, 90), -260); // elle jaillit vers le haut, un peu de côté
    bonus.setDragX(150); // et ralentit sur le sol
    bonus.setAlpha(0); // invisible au départ
    scene.tweens.add({ targets: bonus, alpha: 1, duration: 120 }); // elle apparaît d'un coup rapide
    if (scene.textures.exists("halo_doux")) { // une petite lueur blanche autour, qui bat doucement (la texture du halo vient d'ennemis_normaux.js)
        const halo = scene.add.image(x, y, "halo_doux"); // l'image de la lueur
        halo.setScale(0.4).setTint(0xe7e0e9).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setAlpha(0.9); // petite, blanche, qui brille
        halo.setPipeline("SinglePipeline"); // le shader simple (voir optimisation.js)
        clignoter(scene, halo, { scale: 0.55, alpha: 0.5, duration: 600 }); // la lueur pulse en boucle
        bonus.halo = halo; // la croix retient sa lueur
        bonus.once("destroy", () => halo.destroy()); // la lueur disparaît avec la croix
    }
    return bonus; // on renvoie la croix
}

function ramasserPV(scene, bonus) { // le robot ramasse une croix
    if (!bonus.active) return; // déjà ramassée à cette image
    if (scene.pv <= 0) return; // le robot est à terre : un soin ne le relève pas
    if (scene.pv >= PV_MAX_BARRE) return; // barre pleine : la croix n'est pas touchée, elle reste au sol
    const x = bonus.x; // sa position en x
    const y = bonus.y; // sa position en y
    bonus.destroy(); // une cellule à allumer : la croix est ramassée
    scene.pv += 1; // un PV de plus
    scene.hud.majPV(scene.pv); // la barre s'allume d'une cellule
    textePoints(scene, x, y - 24, "+1 PV"); // le texte monte puis s'efface
    bipPV(scene); // petit bip de ramassage
}

// petit bip montant fabriqué dans le code (pas de fichier son) : trois notes rapides
function bipPV(scene) { // joue un petit bip fabriqué dans le code
    const contexte = scene.sound.context; // le moteur audio du navigateur (absent si le son est coupé)
    if (!contexte) return; // pas de moteur audio : pas de bip
    const t = contexte.currentTime; // l'heure du moteur audio
    const oscillateur = contexte.createOscillator(); // un oscillateur : il fabrique le son
    const volume = contexte.createGain(); // un réglage de volume
    oscillateur.type = "square"; // forme d'onde carrée : un son de jeu rétro
    [523, 784, 1046].forEach((note, i) => oscillateur.frequency.setValueAtTime(note, t + i * 0.08)); // do, sol, do aigu
    // suit le réglage des bruitages (jamais 0 : la rampe exponentielle ne le supporte pas)
    volume.gain.setValueAtTime(0.1 * Math.max(volumeEffets(), 0.001), t); // le volume suit le réglage des bruitages du joueur
    volume.gain.exponentialRampToValueAtTime(0.001, t + 0.34); // le son s'éteint en 0,34 s
    oscillateur.connect(volume); // l'oscillateur est relié au volume
    volume.connect(scene.sound.destination || contexte.destination); // et le volume à la sortie audio
    oscillateur.start(t); // le bip commence maintenant
    oscillateur.stop(t + 0.35); // et s'arrête 0,35 s plus tard
}
