// powerups.js
const PowerUps = [
    {
        name: "Dégâts d'attaque", //ça marche 
        type: "attaque",
        description: "+5% de dégâts",
        image: "carte_degats", // Image à charger dans MainScene
        effect: (player) => { player.damageMultiplier += 0.5; }
    },
    {
        name: "Bouclier orbe", // ça marche 
        type: "défense",
        description: "Une boule de protection qui inflige des dégâts",
        image: "carte_orbe",
        effect: (player) => { player.orbeActive = true; player.activateOrbe(); }
    },
    {
        name: "Cadence de tir", // ça marche 
        type: "attaque",
        description: "+5% de cadence de tir",
        image: "carte_cadence",
        effect: (player) => { player.shootDelay *= 0.95; }
    },
    {
        name: "Soins", // ça marche 
        type: "vie",
        description: "+5% de vie",
        image: "carte_soins",
        effect: (player) => { player.vies = Math.min(player.vies * 1.05, 100); player.updateLifeBar(); }
    },
    {
        name: "Vélocité", // ça marche
        type: "déplacement",
        description: "+5% de vélocité",
        image: "carte_velocite",
        effect: (player) => { player.velocityMultiplier += 0.05; }
    },
    {
        name: "XP Boost", // 
        type: "xp",
        description: "+5% XP",
        image: "carte_xp",
        effect: (player) => { player.xpMultiplier += 400; }
    }
];

export default PowerUps;
