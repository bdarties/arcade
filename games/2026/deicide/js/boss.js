// boss.js : le Dieu de la Lumière, le boss final, dans l'arène en haut du niveau 1
// Son dessin est une feuille de 8 images de 274 x 202 px (assets/images/boss/boss_idle.png) : il plane, ses ailes battent.
// Il apparaît quand arene.js ferme l'arène (voir faireApparaitreBoss) et flotte en haut de la salle.
// Pour l'instant : apparition, animation et flottement. Les attaques, les PV et la mort viennent après.

const ECHELLE = 2; // le sprite est agrandi x2 : 548 x 404 px à l'écran (l'arène fait 1280 px de large)
const NB_IMAGES = 8;

export function chargerBoss(scene) { // à appeler dans chargerJeu (preload)
    scene.load.spritesheet("boss_idle", "./assets/images/boss/boss_idle.png", { frameWidth: 274, frameHeight: 202 });
}

export function faireApparaitreBoss(scene, x, y) { // fait apparaître le boss en (x, y) : le centre de son sprite
    if (!scene.anims.exists("boss_idle")) {
        scene.anims.create({ key: "boss_idle", frames: scene.anims.generateFrameNumbers("boss_idle", { start: 0, end: NB_IMAGES - 1 }), frameRate: 8, repeat: -1 }); // les ailes battent en boucle
    }
    scene.textures.get("boss_idle").setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
    const boss = scene.physics.add.sprite(x, y, "boss_idle", 0); // un sprite avec un corps physique, pour les tirs du joueur plus tard
    boss.body.setAllowGravity(false); // il vole : la gravité ne l'affecte pas
    boss.body.setImmovable(true);
    boss.body.setSize(60, 150).setOffset(107, 40); // la hitbox est le corps de l'ange, sans les ailes
    boss.setScale(ECHELLE).setDepth(51).setAlpha(0); // au-dessus du voile d'ombre (50) : c'est lui la lumière
    boss.play("boss_idle");
    boss.pv = 30; // PV du boss (une trentaine de tirs)
    boss.etat = "apparition"; // apparition -> combat -> mort
    boss.departY = y; // hauteur autour de laquelle il flotte

    if (scene.textures.exists("halo_doux")) { // une lueur blanche derrière lui (la texture vient d'ennemis.js)
        const halo = scene.add.image(x, y, "halo_doux");
        halo.setScale(4.2).setTint(0xfff2c0).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setAlpha(0).setPipeline("SinglePipeline");
        boss.halo = halo;
        boss.once("destroy", () => halo.destroy());
    }
    scene.tweens.add({ targets: [boss, boss.halo].filter(Boolean), alpha: { value: (cible) => (cible === boss ? 1 : 0.7) }, duration: 1500, onComplete: () => { boss.etat = "combat"; } }); // apparition en fondu

    scene.boss = boss;
    const suivre = (temps) => majBoss(scene, boss, temps);
    scene.events.on(Phaser.Scenes.Events.UPDATE, suivre);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, suivre));
    return boss;
}

function majBoss(scene, boss, temps) { // à chaque image : le boss flotte doucement de haut en bas et de gauche à droite
    if (!boss.active) return;
    boss.x = scene.areneCentreX + Math.sin(temps / 1700) * 160;
    boss.y = boss.departY + Math.sin(temps / 900) * 14;
    if (boss.halo) boss.halo.setPosition(boss.x, boss.y);
}
