const fs = require('fs');
const path = require('path');

const chars = {
    player: {
        dir: '../assets/characters/player',
        skinTone: '#d2a679',
        skinShade: '#b3825a',
        cloth: '#e63946',
        clothShade: '#a81c26',
        belt: '#f1faee',
        hair: '#1d3557',
        weaponType: 'kalari_sword',
        faceDetails: 'hero',
        scale: 1.0
    },
    ai_normal: {
        dir: '../assets/characters/ai_normal',
        skinTone: '#b8860b',
        skinShade: '#8b6508',
        cloth: '#457b9d',
        clothShade: '#1d3557',
        belt: '#ffb703',
        hair: '#000000',
        weaponType: 'spear',
        faceDetails: 'turban',
        scale: 1.0
    },
    boss: {
        dir: '../assets/characters/boss',
        skinTone: '#cd853f',
        skinShade: '#8b4513',
        cloth: '#ffffff',
        clothShade: '#d3d3d3',
        belt: '#d4af37',
        hair: '#aaaaaa',
        weaponType: 'urumi',
        faceDetails: 'beard',
        scale: 1.3
    }
};

// Generate SVGs
Object.keys(chars).forEach(key => {
    const c = chars[key];
    const fullDir = path.join(__dirname, c.dir);
    if (!fs.existsSync(fullDir)) {
        fs.mkdirSync(fullDir, { recursive: true });
    }

    // Helper to write SVG
    const writeSVG = (name, width, height, content) => {
        const svg = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
        fs.writeFileSync(path.join(fullDir, name + '.svg'), svg);
    };

    // 1. Head
    let headContent = `
        <circle cx="20" cy="20" r="15" fill="${c.skinTone}"/>
        <path d="M 20 35 A 15 15 0 0 0 35 20 L 35 25 A 15 15 0 0 1 20 40 Z" fill="${c.skinShade}" opacity="0.5"/>
        <ellipse cx="14" cy="18" rx="2" ry="1" fill="#fff"/><circle cx="14" cy="18" r="0.5" fill="#000"/>
        <ellipse cx="26" cy="18" rx="2" ry="1" fill="#fff"/><circle cx="26" cy="18" r="0.5" fill="#000"/>
        <path d="M 16 26 Q 20 28 24 26" stroke="#555" stroke-width="1" fill="none"/>
    `;
    if (c.faceDetails === 'hero') {
        headContent += `<ellipse cx="20" cy="5" rx="5" ry="6" fill="${c.hair}"/>`;
        headContent += `<path d="M 5 20 Q 20 0 35 20" fill="none" stroke="${c.hair}" stroke-width="3"/>`;
    } else if (c.faceDetails === 'turban') {
        headContent += `<path d="M 3 15 Q 20 -5 37 15 Q 20 -2 3 15" fill="${c.cloth}"/>`;
        headContent += `<path d="M 3 15 Q 20 5 37 15 Q 20 2 3 15" fill="${c.belt}"/>`;
    } else if (c.faceDetails === 'beard') {
        headContent += `<path d="M 10 25 Q 20 45 30 25 Q 20 35 10 25" fill="${c.hair}"/>`;
        headContent += `<path d="M 5 20 Q 20 0 35 20" fill="none" stroke="${c.hair}" stroke-width="2"/>`;
        headContent += `<path d="M 19 10 L 21 10 L 21 15 L 19 15 Z" fill="#e63946"/>`;
    }
    writeSVG('head', 40, 45, headContent);

    // 2. Torso
    let torsoContent = `
        <rect x="5" y="10" width="30" height="50" rx="10" fill="${c.skinTone}"/>
        <path d="M 15 20 Q 20 25 25 20" stroke="${c.skinShade}" stroke-width="1" fill="none"/>
        <path d="M 15 30 Q 20 35 25 30" stroke="${c.skinShade}" stroke-width="1" fill="none"/>
        <path d="M 20 15 L 20 40" stroke="${c.skinShade}" stroke-width="1" fill="none"/>
        <path d="M 8 20 Q 15 25 20 20 Q 25 25 32 20" stroke="${c.skinShade}" stroke-width="1" fill="none"/>
        <rect x="3" y="45" width="34" height="25" rx="5" fill="${c.cloth}"/>
        <path d="M 3 45 Q 20 65 37 45" fill="${c.clothShade}"/>
        <rect x="2" y="42" width="36" height="8" rx="2" fill="${c.belt}"/>
        <path d="M 10 42 L 15 65 L 20 42 Z" fill="${c.belt}"/>
    `;
    writeSVG('torso', 40, 70, torsoContent);

    // 3. Limbs
    const limbSVG = (color, shade, length) => `
        <circle cx="10" cy="10" r="10" fill="${color}"/>
        <circle cx="10" cy="${length - 10}" r="8" fill="${color}"/>
        <rect x="2" y="10" width="16" height="${length - 20}" fill="${color}"/>
        <rect x="14" y="10" width="4" height="${length - 20}" fill="${shade}" opacity="0.4"/>
    `;
    writeSVG('arm_upper_l', 20, 45, limbSVG(c.skinTone, c.skinShade, 45));
    writeSVG('arm_upper_r', 20, 45, limbSVG(c.skinTone, c.skinShade, 45));
    
    let lowerArm = limbSVG(c.skinTone, c.skinShade, 40);
    if (c.faceDetails === 'boss') lowerArm += `<rect x="1" y="5" width="18" height="20" fill="${c.belt}" opacity="0.8"/>`;
    writeSVG('arm_lower_l', 20, 40, lowerArm);
    writeSVG('arm_lower_r', 20, 40, lowerArm);

    let hand = `
        <circle cx="10" cy="10" r="10" fill="${c.skinTone}"/>
        <path d="M 15 10 Q 20 15 15 20 Q 10 25 5 20 Q 0 15 5 10" fill="${c.skinTone}"/>
        <path d="M 15 10 Q 20 15 15 20 Q 10 25 5 20 Q 0 15 5 10" stroke="${c.skinShade}" stroke-width="1" fill="none"/>
    `;
    writeSVG('hand_l', 20, 25, hand);
    writeSVG('hand_r', 20, 25, hand);

    let legUpper = `
        <circle cx="12" cy="12" r="12" fill="${c.cloth}"/>
        <circle cx="12" cy="40" r="10" fill="${c.skinTone}"/>
        <rect x="0" y="12" width="24" height="20" fill="${c.cloth}"/>
        <path d="M 0 32 L 12 38 L 24 32 Z" fill="${c.cloth}"/>
        <rect x="2" y="32" width="20" height="15" fill="${c.skinTone}"/>
        <rect x="16" y="32" width="6" height="15" fill="${c.skinShade}" opacity="0.4"/>
    `;
    writeSVG('leg_upper_l', 24, 52, legUpper);
    writeSVG('leg_upper_r', 24, 52, legUpper);

    let legLower = limbSVG(c.skinTone, c.skinShade, 50);
    writeSVG('leg_lower_l', 20, 50, legLower);
    writeSVG('leg_lower_r', 20, 50, legLower);

    let foot = `
        <circle cx="10" cy="10" r="10" fill="${c.skinTone}"/>
        <path d="M 2 10 Q -5 20 5 25 L 25 25 Q 28 20 20 10 Z" fill="${c.skinTone}"/>
        <path d="M 2 10 Q -5 20 5 25 L 25 25 Q 28 20 20 10 Z" stroke="${c.skinShade}" stroke-width="1" fill="none"/>
        <line x1="18" y1="20" x2="18" y2="25" stroke="${c.skinShade}" stroke-width="1"/>
        <line x1="22" y1="21" x2="22" y2="25" stroke="${c.skinShade}" stroke-width="1"/>
    `;
    writeSVG('foot_l', 30, 26, foot);
    writeSVG('foot_r', 30, 26, foot);

    // 4. Weapons
    let weapon = '';
    if (c.weaponType === 'kalari_sword') {
        weapon = `
            <rect x="4" y="90" width="6" height="20" fill="#333"/>
            <circle cx="7" cy="110" r="4" fill="#d4af37"/>
            <path d="M 0 85 L 14 85 Q 16 90 14 95 L 0 95 Z" fill="#d4af37"/>
            <path d="M 5 85 L 5 10 Q 7 0 9 10 L 9 85 Z" fill="#ddd"/>
            <path d="M 7 10 L 7 85" stroke="#aaa" stroke-width="1"/>
            <path d="M 5 10 Q 7 0 9 10 L 9 85 L 5 85 Z" fill="#fff" opacity="0.3"/>
        `;
    } else if (c.weaponType === 'spear') {
        weapon = `
            <rect x="6" y="30" width="4" height="110" fill="#5c4033"/>
            <path d="M 8 0 L 14 15 L 10 30 L 6 30 L 2 15 Z" fill="#ccc"/>
            <path d="M 8 0 L 14 15 L 10 30 L 6 30 L 2 15 Z" stroke="#888" stroke-width="1" fill="none"/>
        `;
    } else if (c.weaponType === 'urumi') {
        weapon = `
            <rect x="4" y="110" width="6" height="20" fill="#555"/>
            <circle cx="7" cy="130" r="5" fill="#d4af37"/>
            <rect x="0" y="105" width="14" height="5" fill="#d4af37"/>
            <path d="M 5 105 Q -20 50 10 20 T 50 10 T 30 50 Q 10 80 9 105" fill="none" stroke="#ddd" stroke-width="2"/>
            <path d="M 7 105 Q -30 60 5 15 T 60 5 T 40 45 Q 15 80 9 105" fill="none" stroke="#aaa" stroke-width="2"/>
        `;
    }
    writeSVG('weapon', 60, 140, weapon);

});
console.log('SVGs generated successfully.');
