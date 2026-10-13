const fs = require('fs');
const path = require('path');

const configJs = fs.readFileSync(path.join(__dirname, 'public', 'js', 'config.js'), 'utf8');
const apiJs = fs.readFileSync(path.join(__dirname, 'public', 'js', 'api.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, 'public', 'js', 'app.js'), 'utf8');

console.log('Testing JS files for syntax errors...');

try {
  new Function('window', 'localStorage', 'document', configJs);
  console.log('✅ config.js syntax is valid');
} catch(e) {
  console.error('❌ config.js error:', e);
}

try {
  new Function('window', 'localStorage', 'document', 'fetch', 'URLSearchParams', apiJs);
  console.log('✅ api.js syntax is valid');
} catch(e) {
  console.error('❌ api.js error:', e);
}

try {
  new Function('window', 'localStorage', 'document', 'API', 'escapeHTML', 'showToast', appJs);
  console.log('✅ app.js syntax is valid');
} catch(e) {
  console.error('❌ app.js error:', e);
}
