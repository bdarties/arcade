// apparence_boss.js : l'APPARENCE des attaques du boss (couleurs, texture des orbes), à un seul endroit.
// Seule l'apparence est décrite ici : les hitbox, les vitesses et les délais restent dans boss.js et dans js/partie2.
// Le boss ne tire plus des rayons et des boules de lumière dorée (le style du « Radiance » de Hollow Knight) mais des lames et des éclats d'argent à contour sombre,
// dans la palette du jeu : argent clair (#e7e0e9), lavande (#ac98b6) et ombre (#251d2a, la couleur du HUD). Rien ne brille en additif : le danger se lit par sa forme dure.
export const ARGENT = 0xe7e0e9; // le corps des lames et des éclats
export const LAVANDE = 0xac98b6; // les traits d'annonce (ce qui va arriver)
export const OMBRE = 0x251d2a; // le contour sombre
export const ETINCELLE = 0xd9c8ff; // les petites étincelles (impacts, changements de phase)

export function habillerRayon(rect, epaisseur = 4) { // un rayon devient une lame : même rectangle (même hitbox), avec un contour sombre
    return rect.setStrokeStyle(epaisseur, OMBRE, 1);
}

// L'orbe du boss : une étoile d'argent à quatre pointes, contour sombre, qui tourne sur elle-même. Texture de 256 x 256 comme le halo qu'elle remplace : la hitbox ronde
// (rayon 40, centrée) n'a pas changé ; les pointes dépassent à peine d'elle (46).
export function creerTextureEclat(scene) {
    if (scene.textures.exists("eclat_boss")) return "eclat_boss";
    const texture = scene.textures.createCanvas("eclat_boss", 256, 256);
    const ctx = texture.getContext();
    const etoile = (rayonPointe, rayonCreux) => {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = -Math.PI / 2 + i * Math.PI / 4;
            const r = i % 2 === 0 ? rayonPointe : rayonCreux;
            const x = 128 + Math.cos(angle) * r, y = 128 + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
    };
    etoile(58, 20); ctx.fillStyle = "#251d2a"; ctx.fill(); // le contour sombre : l'étoile en plus grand
    etoile(46, 14); ctx.fillStyle = "#e7e0e9"; ctx.fill(); // le corps d'argent
    etoile(30, 8); ctx.fillStyle = "#ffffff"; ctx.fill(); // un cœur blanc
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    return "eclat_boss";
}
