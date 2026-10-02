const fs = require('fs');
const path = require('path');

const chars = {
    player: { dir: '../assets/characters/player', base: '#d4af37', ring1: '#8b0000', ring2: '#555' },
    ai_normal: { dir: '../assets/characters/ai_normal', base: '#b8860b', ring1: '#1d3557', ring2: '#333' },
    boss: { dir: '../assets/characters/boss', base: '#a52a2a', ring1: '#d4af37', ring2: '#111' }
};

Object.keys(chars).forEach(key => {
    const c = chars[key];
    const fullDir = path.join(__dirname, c.dir);
    
    // Create detailed Paricha (concentric, domed shield with center boss/spike)
    const shield = `
        <!-- Base Dome -->
        <circle cx="30" cy="30" r="28" fill="${c.base}" stroke="#222" stroke-width="2"/>
        <circle cx="30" cy="30" r="26" fill="none" stroke="${c.ring1}" stroke-width="4"/>
        
        <!-- Inner Details (Metal Rings) -->
        <circle cx="30" cy="30" r="18" fill="none" stroke="${c.ring2}" stroke-width="2"/>
        <circle cx="30" cy="30" r="10" fill="${c.ring1}"/>
        
        <!-- Center Boss (Knopp) -->
        <circle cx="30" cy="30" r="4" fill="#fff"/>
        
        <!-- Decorative Rivets -->
        <circle cx="30" cy="8" r="1.5" fill="#fff"/>
        <circle cx="30" cy="52" r="1.5" fill="#fff"/>
        <circle cx="8" cy="30" r="1.5" fill="#fff"/>
        <circle cx="52" cy="30" r="1.5" fill="#fff"/>
        <circle cx="14" cy="14" r="1.5" fill="#fff"/>
        <circle cx="46" cy="46" r="1.5" fill="#fff"/>
        <circle cx="14" cy="46" r=\"1.5\" fill=\"#fff\"/>
        <circle cx=\"46\" cy=\"14\" r=\"1.5\" fill=\"#fff\"/>
        
        <!-- Lighting / Shading overlay for 3D dome effect -->
        <path d=\"M 30 2 A 28 28 0 0 1 58 30 A 28 28 0 0 0 30 2 Z\" fill=\"#fff\" opacity=\"0.3\"/>
        <path d=\"M 30 58 A 28 28 0 0 0 2 30 A 28 28 0 0 1 30 58 Z\" fill=\"#000\" opacity=\"0.4\"/>
    `;
    
    const svg = `<svg viewBox="0 0 60 60" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${shield}</svg>`;
    fs.writeFileSync(path.join(fullDir, 'shield.svg'), svg);
});
console.log('Shield SVGs generated successfully.');
