const fs = require('fs');
const path = '../js/api.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Dynamic API_BASE_URL
content = content.replace(
    'const API_BASE_URL = "http://127.0.0.1:8000/api";',
    'const host = (window.location.hostname === "localhost") ? "localhost" : "127.0.0.1";\nconst API_BASE_URL = `http://${host}:8000/api`;'
);

// 2. Add checkHealth function
if (!content.includes('checkHealth')) {
    content += '\n\n/**\n * Checks backend health.\n */\nasync function checkHealth() {\n    return await apiRequest(\'/health\', \'GET\');\n}\n';
}

fs.writeFileSync(path, content);
console.log('api.js updated.');
