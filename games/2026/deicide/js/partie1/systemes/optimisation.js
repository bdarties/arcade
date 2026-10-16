// optimisation.js : réglages pour que le jeu reste fluide sur la borne (un Raspberry Pi 3, très peu puissant)
import { TOUCHES } from "./raccourcis.js"; // toutes les touches du jeu (F3 : la boîte d'images par seconde)

// 1. Le décor figé -------------------------------------------------------------------------------------------------------
// Les calques de tuiles de Phaser sont redessinés tuile par tuile à CHAQUE image : plus de 1 200 tuiles dans le niveau 1,
// et c'est le plus gros travail du processeur. Or le décor ne bouge jamais. On le dessine donc UNE SEULE FOIS, au chargement
// du niveau, dans des images en bandes de 512 px de haut (une bande fait 1280 x 512, ce qui reste petit pour une carte
// graphique de Pi 3). À chaque image il ne reste qu'à afficher les 2 ou 3 bandes qu'on voit, au lieu de 1 200 tuiles.
// Le dessin à l'écran est identique : ce sont les mêmes tuiles, aux mêmes endroits, dans le même ordre.
//
// 2. Le shader le plus simple pour les grandes images -------------------------------------------------------------------
// Phaser dessine tout avec un "shader" qui, pour CHAQUE pixel, doit d'abord chercher dans laquelle des images (textures)
// qu'il peut utiliser (16 par défaut) se trouve le pixel à lire. Sur la carte graphique d'un Pi 3, ce choix coûte bien plus
// cher que le reste. Les bandes du décor et le voile d'obscurité couvrent tout l'écran (1,8 million de pixels à chaque
// image), et les halos sont de grosses taches : ils n'ont qu'une seule image à lire. On leur donne donc le shader
// "SinglePipeline" de Phaser, qui lit directement la bonne image sans chercher. Le dessin est identique.
// (Le reste, petit, garde le shader normal, réglé sur 4 images au lieu de 16 dans index.js.)
//
// 3. Les ennemis qui dorment --------------------------------------------------------------------------------------------
// Les ennemis ne repèrent le joueur qu'à moins de 400 px : ceux qui sont loin ne font rien. On les endort (plus de physique,
// plus d'animation, plus de test) tant que le joueur est à plus d'un écran d'eux.
const HAUTEUR_BANDE = 512; // hauteur d'une bande de décor, en pixels
const MARGE = 32; // pixels de marge autour de l'écran avant de cacher une bande (le tremblement d'écran bouge un peu la vue)
const IMAGES_SANS_TRI = 2; // pendant les 2 premières images la caméra n'est pas encore à sa place : on affiche tout
const DISTANCE_VEILLE = 900; // un ennemi est réveillé quand le joueur est à moins de 900 px de hauteur de lui (un écran fait 720 px)
const DISTANCE_VEILLE_X = 1500; // ... et à moins de 1500 px de largeur (un écran fait 1280 px) : sert aux niveaux horizontaux
const LARGEUR_BANDE = 512; // pour un niveau horizontal, les bandes du décor sont verticales : 512 px de large chacune
const IMAGES_AVANT_VEILLE = 90; // 1,5 s au départ : le temps que les ennemis tombent sur le sol

// calques : les calques de la map à figer, dans l'ordre où ils se superposent (le premier est tout au fond).
// Ils restent dans la scène pour les collisions et pour savoir où est le sol, mais ils ne sont plus dessinés.
// couleurFond : la couleur qu'on voit derrière les tuiles là où la map est vide. Elle est peinte dans les bandes elles-mêmes,
// donc le niveau n'a plus besoin de peindre le fond de la caméra (un rectangle de la taille de l'écran en moins à chaque image).
// À appeler dans create(), juste après avoir créé les calques et AVANT de créer le joueur et les ennemis
// (les bandes doivent se trouver sous eux dans l'ordre d'affichage). Renvoie la liste des bandes.
export function figerCalques(scene, calques, largeur, hauteur, couleurFond) { // remplace les calques de tuiles par des bandes dessinées une seule fois
    const bandes = []; // la liste des bandes
    const horizontal = largeur > hauteur; // une map plus large que haute (niveau 2) est découpée en bandes verticales, sinon en bandes horizontales
    const longueur = horizontal ? largeur : hauteur; // la longueur à découper
    const pas = horizontal ? LARGEUR_BANDE : HAUTEUR_BANDE; // la taille d'une bande
    for (let debut = 0; debut < longueur; debut += pas) { // pour chaque bande
        const taille = Math.min(pas, longueur - debut); // la dernière bande peut être plus courte
        // une zone de dessin de la taille de la bande
        const bande = horizontal ? scene.add.renderTexture(debut, 0, taille, hauteur) : scene.add.renderTexture(0, debut, largeur, taille); // une image vide de la taille de la bande
        bande.setOrigin(0, 0); // son point d'ancrage est son coin haut-gauche
        bande.fill(couleurFond); // le fond d'abord, les tuiles par-dessus
        // dessine tous les calques dedans, décalés pour que la bonne tranche de la map tombe dans la bande
        bande.draw(calques, horizontal ? -debut : 0, horizontal ? 0 : -debut); // on y dessine les calques, décalés pour la bonne tranche
        bande.setPipeline("SinglePipeline"); // shader simple : une bande = une seule image (voir plus haut)
        bandes.push(bande); // on range la bande dans la liste
    }
    calques.forEach(calque => calque.setVisible(false)); // les calques ne sont plus dessinés (mais ils servent toujours aux collisions)

    let images = 0; // compteur d'images
    const trier = () => { // chaque image : on n'affiche que les bandes qui touchent l'écran
        const camera = scene.cameras.main; // la caméra
        const haut = (horizontal ? camera.scrollX : camera.scrollY) - MARGE; // le bord haut de l'écran, avec une marge
        const bas = (horizontal ? camera.scrollX + camera.width : camera.scrollY + camera.height) + MARGE; // le bord bas de l'écran, avec une marge
        images++; // une image de plus
        bandes.forEach(bande => { // pour chaque bande
            const debut = horizontal ? bande.x : bande.y; // le bord de la bande dans le sens du niveau
            const taille = horizontal ? bande.width : bande.height; // sa taille
            bande.visible = images <= IMAGES_SANS_TRI || (debut < bas && debut + taille > haut); // visible si elle touche l'écran (ou au début)
        });
    };
    scene.events.on(Phaser.Scenes.Events.UPDATE, trier); // on branche cette fonction sur chaque image
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, trier)); // et on la débranche à l'arrêt de la scène
    return bandes; // on renvoie les bandes
}

// Cadence fixe : le jeu est cadencé par une minuterie (fps.forceSetTimeOut dans index.js), qui attend toujours un peu plus que prévu
// (environ 0,8 ms de trop à chaque image : 38,7 images par seconde au lieu de 40). Chaque seconde on regarde le temps réel entre
// deux images et on raccourcit l'attente de ce qui manque, pour tomber pile sur le nombre d'images par seconde voulu.
export function regulerCadence(jeu, imagesParSeconde) { // corrige la cadence pour tomber pile sur les images par seconde voulues
    const but = 1000 / imagesParSeconde; // durée voulue d'une image, en ms
    const boucle = jeu.loop; // la boucle de jeu de Phaser
    let debut = 0; // début de la seconde en cours
    let images = 0; // images comptées depuis ce début
    jeu.events.on(Phaser.Core.Events.STEP, (maintenant) => { // à chaque image du jeu
        if (!boucle.raf.isSetTimeOut) return; // pas cadencé par minuterie : rien à régler
        if (!debut) { debut = maintenant; return; } // première image : on note l'heure et on s'arrête
        images++; // une image de plus
        if (maintenant - debut < 1000) return; // avant une seconde, on attend
        const periode = (maintenant - debut) / images; // durée moyenne réelle d'une image pendant cette seconde
        // (si c'est bien plus long, la page était cachée : on ne règle rien)
        if (periode < but * 3) boucle.raf.delay = Phaser.Math.Clamp(boucle.raf.delay + (but - periode) * 0.6, 1, but); // on corrige le délai de la minuterie
        debut = maintenant; // on repart pour une nouvelle seconde
        images = 0; // le compteur d'images est remis à zéro
    });
}

// Pour mesurer sur la borne : la touche F3 (ou le bouton B de la borne, la touche O) affiche ou cache le nombre d'images par seconde (et de sons qui jouent), en haut à gauche de la page
// (on peut aussi l'afficher dès le départ en ajoutant ?fps à l'adresse du jeu). Caché, il ne coûte presque rien (une addition par image).
export function compteurImages(jeu) { // affiche les images par seconde (touche F3 ou O)
    const boite = document.createElement("div"); // la petite boîte de texte
    boite.style.cssText = "position:fixed;left:6px;top:6px;padding:2px 8px;background:rgba(0,0,0,.75);color:#8f8;font:16px monospace;z-index:10;pointer-events:none;display:" + (location.search.includes("fps") ? "block" : "none"); // le style de la boîte : en haut à gauche, texte vert sur fond sombre, cachée au départ
    document.body.appendChild(boite); // on l'ajoute à la page
    // On compte les images que le jeu calcule VRAIMENT (l'événement « step », une fois par image du jeu). jeu.loop.actualFps, lui, compte les images de l'écran (60 par
    // seconde) même quand le jeu en saute une sur deux pour tenir ses 30 images par seconde : il afficherait 60.
    let images = 0, depuis = performance.now(); // nombre d'images comptées et heure de départ
    jeu.events.on("step", () => { images++; }); // on compte chaque image du jeu
    setInterval(() => { // (le nombre de sons en train de jouer et l'état de l'audio aident à comprendre un bruit de moteur : si le nombre de sons monte sans arrêt, ils s'accumulent)
        const maintenant = performance.now(), cadence = images * 1000 / (maintenant - depuis); // ...on calcule la cadence...
        images = 0; depuis = maintenant; // ...et on repart de zéro
        if (boite.style.display === "none") return; // si la boîte est cachée, rien d'autre
        const jouent = jeu.sound.sounds.filter((son) => son.isPlaying).length; // nombre de sons en train de jouer
        boite.textContent = Math.round(cadence) + " images/s | " + jouent + " sons | audio " + (jeu.sound.context ? jeu.sound.context.state : "aucun"); // on affiche la cadence, les sons et l'état de l'audio
    }, 500); // fin du minuteur de 500 ms
    window.addEventListener("keydown", (evenement) => { // à chaque touche appuyée
        // F3 sur un ordinateur ; sur la borne, le bouton B (la touche O) : pas de clavier pour taper F3. (En jeu, O ne sert à rien d'autre ; dans le menu elle lance aussi la partie.)
        if (evenement.key === TOUCHES.test.cadence || (evenement.code === "KeyO" && !evenement.repeat)) { evenement.preventDefault(); boite.style.display = boite.style.display === "none" ? "block" : "none"; } // F3 ou O : afficher ou cacher la boîte
    });
}

// À appeler dans create(), une fois les ennemis créés (scene.ennemis et scene.player doivent exister).
// Chaque image, un ennemi loin du joueur s'endort : ennemi.endormi = true, son corps physique et son animation s'arrêtent
// (majEnnemis, dans ennemis_normaux.js, l'ignore aussi). Il se réveille quand le joueur revient à moins de DISTANCE_VEILLE px.
// Rien ne s'endort pendant la première seconde et demie, le temps que tous les ennemis tombent et se posent sur le sol, ni
// un ennemi en l'air, ni un ennemi touché ou en train de mourir (il finit son animation, qui le fait disparaître).
export function endormirLesLoins(scene) { // endort les ennemis éloignés du robot
    let images = 0; // compteur d'images
    const surveiller = () => { // fonction appelée à chaque image
        const joueur = scene.player; // le robot
        if (!joueur || !joueur.body) return; // pas de robot : rien
        if (images < IMAGES_AVANT_VEILLE) { images++; return; } // les ennemis se posent d'abord
        const liste = scene.ennemis.getChildren(); // la liste des ennemis
        for (let i = 0; i < liste.length; i++) { // pour chaque ennemi
            const ennemi = liste[i]; // cet ennemi
            if (ennemi.etat === "mort" || ennemi.etat === "touche") continue; // il finit sa mort ou son coup reçu
            const loin = Math.abs(ennemi.y - joueur.y) > DISTANCE_VEILLE || Math.abs(ennemi.x - joueur.x) > DISTANCE_VEILLE_X; // vrai s'il est trop loin du robot
            if (loin === Boolean(ennemi.endormi)) continue; // rien ne change pour lui
            if (loin && !ennemi.body.blocked.down) continue; // encore en l'air : il doit d'abord se poser
            ennemi.endormi = loin; // on note s'il dort
            ennemi.body.enable = !loin; // plus de physique
            ennemi.setActive(!loin); // plus d'animation (Phaser ne met à jour que les objets actifs)
        }
    };
    scene.events.on(Phaser.Scenes.Events.UPDATE, surveiller); // on branche cette fonction sur chaque image
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, surveiller)); // et on la débranche à l'arrêt de la scène
}
