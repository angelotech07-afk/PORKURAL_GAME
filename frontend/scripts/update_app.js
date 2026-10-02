const fs = require('fs');
const path = '../js/app.js';
let content = fs.readFileSync(path, 'utf8');

const replacement = `    // Check backend health
    const health = await checkHealth();
    if (health) {
        window.gameState.serverConnected = true;
        if (statusEl) {
            statusEl.textContent = "🟢 SERVER ONLINE";
            statusEl.style.color = "#4caf50";
        }
    } else {
        window.gameState.serverConnected = false;
        if (statusEl) {
            statusEl.textContent = "🔴 SERVER OFFLINE";
            statusEl.style.color = "#ff3b3b";
        }
    }

    if (!storedPid) {`;

content = content.replace('    if (!storedPid) {', replacement);

fs.writeFileSync(path, content);
console.log('app.js updated.');
