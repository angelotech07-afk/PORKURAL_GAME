const fs = require('fs');
const path = '../js/api.js';
let content = fs.readFileSync(path, 'utf8');

const replacement = `const API_BASE_URL = "http://127.0.0.1:8000/api";`;
const dynamic = 'const host = (window.location.hostname === "localhost") ? "localhost" : "127.0.0.1";\nconst API_BASE_URL = `http://${host}:8000/api`;';

content = content.replace(dynamic, replacement);

fs.writeFileSync(path, content);
console.log('Reverted API_BASE_URL in api.js');
