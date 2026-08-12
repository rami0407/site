const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');
const devHtmlPath = path.join(rootDir, 'index.html');

try {
  console.log("1. Running Vite build...");
  execSync('npm run build', { stdio: 'inherit' });

  console.log("2. Cleaning old assets and copying compiled assets to root assets folder...");
  const assetsDistDir = path.join(distDir, 'assets');
  const assetsRootDir = path.join(rootDir, 'assets');

  if (fs.existsSync(assetsRootDir)) {
    const oldFiles = fs.readdirSync(assetsRootDir);
    oldFiles.forEach(file => {
      try {
        fs.unlinkSync(path.join(assetsRootDir, file));
      } catch (e) {}
    });
  } else {
    fs.mkdirSync(assetsRootDir);
  }

  // Copy files from dist/assets to root/assets
  const files = fs.readdirSync(assetsDistDir);
  files.forEach(file => {
    fs.copyFileSync(path.join(assetsDistDir, file), path.join(assetsRootDir, file));
  });

  console.log("3. Copying built production index.html and adding cache-busting query params...");
  let compiledHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  const cacheBuster = Date.now();
  compiledHtml = compiledHtml.replace(/\.js"/g, `.js?v=${cacheBuster}"`);
  compiledHtml = compiledHtml.replace(/\.css"/g, `.css?v=${cacheBuster}"`);
  
  // Remove existing auto-redirect scripts if present in source index.html
  compiledHtml = compiledHtml.replace(/<script>\(function\(\)\{if\(!window\.location\.search\.includes[\s\S]*?<\/script>\s*/g, '');

  const versionTag = `v_${cacheBuster}`;
  const forceReloadScript = `<script>(function(){if(!window.location.search.includes('${versionTag}')){var s=window.location.search?window.location.search+'&ver=${versionTag}':'?ver=${versionTag}';window.location.replace(window.location.pathname+s+window.location.hash);}})();</script>`;

  compiledHtml = compiledHtml.replace(
    '<head>',
    `<head>\n    ${forceReloadScript}\n    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />\n    <meta http-equiv="Pragma" content="no-cache" />\n    <meta http-equiv="Expires" content="0" />`
  );
  
  fs.writeFileSync(devHtmlPath, compiledHtml, 'utf-8');

  // Copy other files in dist/ root (e.g. books_list.pdf, CNAME, favicon.svg, icons.svg) to root
  const distRootFiles = fs.readdirSync(distDir);
  const gitAddedFiles = ['index.html'];
  distRootFiles.forEach(file => {
    const srcPath = path.join(distDir, file);
    const destPath = path.join(rootDir, file);
    const stat = fs.statSync(srcPath);
    if (stat.isFile() && file !== 'index.html') {
      fs.copyFileSync(srcPath, destPath);
      gitAddedFiles.push(file);
    }
  });

  console.log("4. Committing and pushing all source code and production build to GitHub main branch...");
  execSync('git add .', { stdio: 'inherit' });
  try {
    execSync('git commit -m "Deploy latest source code and production build to main branch"', { stdio: 'inherit' });
  } catch (commitErr) {
    console.log("No changes to commit in build files.");
  }
  
  console.log("Pushing to main branch...");
  execSync('git push origin main', { stdio: 'inherit' });

  console.log("Pushing to gh-pages branch...");
  execSync('git push origin main:gh-pages --force', { stdio: 'inherit' });

  console.log("✨ Radical deployment completed successfully! The site is now live on main branch root.");
} catch (error) {
  console.error("❌ Deployment failed:", error);
}
