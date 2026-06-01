const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');
const devHtmlPath = path.join(rootDir, 'index.html');
const tempDevHtmlPath = path.join(rootDir, 'index-dev-backup.html');

try {
  console.log("1. Running Vite build...");
  execSync('npm run build', { stdio: 'inherit' });

  console.log("2. Backing up development index.html...");
  fs.copyFileSync(devHtmlPath, tempDevHtmlPath);

  console.log("3. Copying compiled assets to root assets folder...");
  const assetsDistDir = path.join(distDir, 'assets');
  const assetsRootDir = path.join(rootDir, 'assets');

  if (!fs.existsSync(assetsRootDir)) {
    fs.mkdirSync(assetsRootDir);
  }

  // Copy files from dist/assets to root/assets
  const files = fs.readdirSync(assetsDistDir);
  files.forEach(file => {
    fs.copyFileSync(path.join(assetsDistDir, file), path.join(assetsRootDir, file));
  });

  console.log("4. Copying built production index.html to root...");
  fs.copyFileSync(path.join(distDir, 'index.html'), devHtmlPath);

  console.log("5. Committing and pushing production build to GitHub main branch...");
  execSync('git add index.html assets', { stdio: 'inherit' });
  try {
    execSync('git commit -m "Deploy production build to root of main branch"', { stdio: 'inherit' });
  } catch (commitErr) {
    console.log("No changes to commit in build files.");
  }
  
  console.log("Pushing to main branch...");
  execSync('git push origin main', { stdio: 'inherit' });

  console.log("6. Restoring development index.html...");
  fs.copyFileSync(tempDevHtmlPath, devHtmlPath);
  fs.unlinkSync(tempDevHtmlPath);

  console.log("✨ Radical deployment completed successfully! The site is now live on main branch root.");
} catch (error) {
  console.error("❌ Deployment failed:", error);
  // Restore backup if it exists
  if (fs.existsSync(tempDevHtmlPath)) {
    fs.copyFileSync(tempDevHtmlPath, devHtmlPath);
    fs.unlinkSync(tempDevHtmlPath);
    console.log("Restored dev index.html from backup.");
  }
}
