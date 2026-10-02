const fs = require('fs');
const jsPath = '../js/combat-engine.js';
let js = fs.readFileSync(jsPath, 'utf8');

js = js.replace(/this\.spawnParticles\('#f2c94c', 4\);/g, "this.spawnParticles('#f2c94c', 4, true);");
js = js.replace(/this\.spawnParticles\('#ff3b3b', 10\);/g, "this.spawnParticles('#ff3b3b', 10, false);");
js = js.replace(/spawnParticles\(color, count\) \{/g, "spawnParticles(color, count, isShieldBlock = false) {");

js = js.replace(/const renderX = this\.x \* this\.engine\.scale \+ \(\(Math\.random\(\) - 0\.5\) \* 20\);/g,
    "const renderX = (this.x + (isShieldBlock ? this.direction * 30 : 0)) * this.engine.scale + ((Math.random() - 0.5) * 20);");

fs.writeFileSync(jsPath, js);
console.log('Sparks positioned on shield.');
