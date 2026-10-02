const fs = require('fs');
const jsPath = '../js/combat-engine.js';
let js = fs.readFileSync(jsPath, 'utf8');

if (!js.includes("elements.shield = document.createElement")) {
    js = js.replace("elements.weapon.className = 'rig-part rig-weapon';", 
        "elements.weapon.className = 'rig-part rig-weapon';\n\n        elements.shield = document.createElement('div');\n        elements.shield.className = 'rig-part rig-shield';");
    
    js = js.replace("elements.handL.className = 'rig-part rig-hand-l';",
        "elements.handL.className = 'rig-part rig-hand-l';\n        // We will append shield to handL later");

    js = js.replace("elements.handR.appendChild(elements.weapon);",
        "elements.handR.appendChild(elements.weapon);\n        elements.handL.appendChild(elements.shield);");
        
    fs.writeFileSync(jsPath, js);
    console.log('combat-engine.js createRig updated.');
} else {
    console.log('combat-engine.js already has shield.');
}
