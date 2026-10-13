const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');
const zipFile = path.join(__dirname, 'dist.zip');

console.log('🚀 Building self-contained production dist package for Netlify...');

// 1. Clean and create dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Recursive copy helper
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy public assets to dist
copyRecursiveSync(srcDir, distDir);

// 3. Create a 100% Self-Contained dist/index.html (Inlined CSS + Inlined JS)
const htmlPath = path.join(distDir, 'index.html');
const cssPath = path.join(srcDir, 'css', 'style.css');
const configJsPath = path.join(srcDir, 'js', 'config.js');
const apiJsPath = path.join(srcDir, 'js', 'api.js');
const appJsPath = path.join(srcDir, 'js', 'app.js');

if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Inline CSS
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    const inlinedCssTag = `<style>\n${css}\n</style>`;
    html = html.replace(/<link\s+rel="stylesheet"\s+href="[^"]*style\.css">/i, inlinedCssTag);
  }

  // Inline JavaScript (config.js, api.js, app.js)
  const configJs = fs.existsSync(configJsPath) ? fs.readFileSync(configJsPath, 'utf8') : '';
  const apiJs = fs.existsSync(apiJsPath) ? fs.readFileSync(apiJsPath, 'utf8') : '';
  const appJs = fs.existsSync(appJsPath) ? fs.readFileSync(appJsPath, 'utf8') : '';

  const inlinedScriptsTag = `
  <!-- Inlined App Scripts for 100% Guaranteed Execution on any CDN / Netlify -->
  <script>
  ${configJs}
  </script>
  <script>
  ${apiJs}
  </script>
  <script>
  ${appJs}
  </script>
  `;

  // Replace script tags with inlined code
  html = html.replace(/<script\s+src="[^"]*config\.js[^"]*"><\/script>/i, '');
  html = html.replace(/<script\s+src="[^"]*api\.js[^"]*"><\/script>/i, '');
  html = html.replace(/<script\s+src="[^"]*app\.js[^"]*"><\/script>/i, inlinedScriptsTag);

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✨ Inlined CSS and all JS scripts directly into dist/index.html (100% bulletproof execution)!');
}

// 4. Create Netlify _headers file
const headersContent = `/*
  X-Frame-Options: SAMEORIGIN
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Cache-Control: no-cache, no-store, must-revalidate
`;
fs.writeFileSync(path.join(distDir, '_headers'), headersContent);

console.log('✅ Dist folder created successfully at: ' + distDir);

// 5. Generate clean dist.zip
if (fs.existsSync(zipFile)) {
  fs.rmSync(zipFile, { force: true });
}

try {
  execSync(`powershell -Command "Compress-Archive -Path dist\\* -DestinationPath dist.zip -Force"`, { cwd: __dirname });
  console.log('📦 Successfully generated updated dist.zip at: ' + zipFile);
} catch (e) {
  console.warn('Zip creation note:', e.message);
}

console.log('📁 Contents of dist:');
function listDir(dir, prefix = '  ') {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      console.log(`${prefix}📁 ${file}/`);
      listDir(full, prefix + '  ');
    } else {
      console.log(`${prefix}📄 ${file}`);
    }
  });
}
listDir(distDir);
