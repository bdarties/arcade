// soins_versus.js : les croix de soin du 1 contre 1. De temps en temps une croix apparaît en haut de l'écran, à un endroit au hasard,
// et tombe sur la première plateforme. Le premier robot qui la touche regagne 1 PV (s'il n'est pas déjà au maximum : sinon la croix reste).
// Une croix qui tombe sous l'écran (dans la zone rouge) disparaît. Utilisation : preparerSoinsVersus(this, { ... }) dans create() de versus.js.
import { creerTextureCroix, creerTextureHaloDoux } from "../systemes/dessins_en_code.js"; // la croix de soin et sa lueur (dessinées en code)
import { textePoints, clignoter } from "../systemes/effets.js"; // le texte « +1 PV » et la lueur qui pulse
import { bipPV } from "./bonus.js"; // le petit bip de ramassage (le même que dans le solo)

const ECHELLE = 4; // la croix fait 9 x 9 pixels : 36 px à l'écran (comme dans le solo)
const X_MIN = 6 * 32, X_MAX = 33 * 32; // la croix apparaît entre les murs (de la tuile 6 à la tuile 33)

// options : delaiMin et delaiMax (ms entre deux croix), maximum (croix en même temps), pvMax (PV maximum d'un robot)
export function preparerSoinsVersus(scene, { delaiMin, delaiMax, maximum, pvMax }) { // prépare les croix de soin du 1 contre 1
    creerTextureCroix(scene); // on fabrique l'image de la croix
    creerTextureHaloDoux(scene); // et celle de sa lueur
    const groupe = scene.physics.add.group({ collideWorldBounds: true, bounceY: 0.35 }); // elles rebondissent un peu en tombant
    scene.soinsVersus = groupe; // la scène retient le groupe
    scene.physics.add.collider(groupe, scene.groupe_plateformes); // elles se posent sur les plateformes
    scene.joueurs.forEach((joueur) => scene.physics.add.overlap(joueur, groupe, (robot, croix) => ramasser(scene, robot, croix, pvMax))); // un robot les ramasse en les touchant
    const suivre = () => groupe.getChildren().forEach((croix) => { // à chaque image
        if (croix.halo) croix.halo.setPosition(croix.x, croix.y); // la lueur suit la croix
        if (croix.y > scene.cameras.main.scrollY + scene.cameras.main.height + 60) croix.destroy(); // sous l'écran : la croix disparaît
    });
    scene.events.on(Phaser.Scenes.Events.UPDATE, suivre); // on branche cette fonction sur la mise à jour
    let minuterie = null; // le minuteur de la prochaine croix
    const programmer = () => { // programme l'apparition de la prochaine croix, après un délai au hasard
        minuterie = scene.time.delayedCall(Phaser.Math.Between(delaiMin, delaiMax), () => { // quand le délai est passé...
            if (!scene.finie && groupe.countActive() < maximum) faireApparaitre(scene, groupe); // ...on en fait apparaître une (sauf manche finie ou déjà trop de croix)
            programmer(); // et on programme la suivante
        });
    };
    programmer(); // la première
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { scene.events.off(Phaser.Scenes.Events.UPDATE, suivre); if (minuterie) minuterie.remove(); }); // on débranche tout à l'arrêt de la scène
}

function faireApparaitre(scene, groupe) { // une croix apparaît en haut de l'écran et tombe
    const x = Phaser.Math.Between(X_MIN, X_MAX); // un x au hasard entre les murs
    const y = scene.cameras.main.scrollY + 30; // juste sous le bord haut de l'écran
    const croix = groupe.create(x, y, "bonus_pv").setScale(ECHELLE).setDepth(51); // la croix, au-dessus du reste
    croix.body.setGravityY(700); // elle tombe vite (la gravité du jeu est faible)
    croix.setDragX(150); // et ralentit sur le sol
    croix.setAlpha(0); // invisible au départ
    scene.tweens.add({ targets: croix, alpha: 1, duration: 200 }); // elle apparaît en fondu
    const halo = scene.add.image(x, y, "halo_doux").setScale(0.4).setTint(0xe7e0e9).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setAlpha(0.9); // une lueur blanche
    halo.setPipeline("SinglePipeline"); // le shader simple (voir optimisation.js)
    clignoter(scene, halo, { scale: 0.55, alpha: 0.5, duration: 600 }); // la lueur pulse
    croix.halo = halo; // la croix retient sa lueur
    croix.once("destroy", () => halo.destroy()); // la lueur disparaît avec la croix
}

function ramasser(scene, robot, croix, pvMax) { // un robot touche une croix
    if (!croix.active || robot.mortVersus || scene.finie) return; // croix déjà prise, robot mort ou manche finie : rien
    if (robot.pvVersus >= pvMax) return; // ses PV sont au maximum : la croix reste là
    const x = croix.x, y = croix.y; // l'endroit où elle était
    croix.destroy(); // elle est ramassée
    robot.pvVersus += 1; // un PV de plus
    scene.majVies(); // les cellules de vie s'allument
    textePoints(scene, x, y - 24, "+1 PV"); // le texte monte puis s'efface
    bipPV(scene); // le petit bip
}
