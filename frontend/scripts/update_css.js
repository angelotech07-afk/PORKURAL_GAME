const fs = require('fs');
const cssPath = '../css/combat-rig.css';
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('.rig-shield')) {
    const shieldCSS = `
/* Shield Container attached to left hand */
.rig-shield {
    width: 60px;
    height: 60px;
    left: -20px;
    top: -10px;
    transform-origin: 50% 50%; /* Grip center pivot */
    background: transparent;
    border: none;
    z-index: 10;
}
`;
    // Insert just before character specifics
    css = css.replace('/* ==========================================================================', shieldCSS + '\n/* ==========================================================================');
    
    // Add specific backgrounds
    css = css.replace('.hero-rig .rig-weapon', '.hero-rig .rig-shield { background-image: url(\'../assets/characters/player/shield.svg\'); }\n.hero-rig .rig-weapon');
    css = css.replace('.enemy-rig .rig-weapon', '.enemy-rig .rig-shield { background-image: url(\'../assets/characters/ai_normal/shield.svg\'); }\n.enemy-rig .rig-weapon');
    css = css.replace('.boss-rig .rig-weapon', '.boss-rig .rig-shield { background-image: url(\'../assets/characters/boss/shield.svg\'); }\n.boss-rig .rig-weapon');
    
    fs.writeFileSync(cssPath, css);
    console.log('combat-rig.css updated for shield.');
} else {
    console.log('combat-rig.css already has shield.');
}
