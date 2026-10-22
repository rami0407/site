const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = [
  'math-snake.html',
  'math-space.html',
  'math-mario.html',
  'math-racing.html',
  'hebrew-minecraft.html',
  'hebrew-penalty.html',
  'hebrew-racer.html',
  'hebrew-space.html',
  'hebrew-ninja.html',
  'english-basketball.html',
  'english-ninja.html',
  'english-racer.html',
  'english-space.html',
  'english-subway.html'
];

let count = 0;
files.forEach(file => {
  const filePath = path.join(publicDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('school-auth-sync.js')) {
      content = content.replace('</body>', '  <!-- Unified Student Identity & Auth Sync -->\n  <script src="school-auth-sync.js"></script>\n</body>');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Injected school-auth-sync.js into:', file);
      count++;
    } else {
      console.log('Already present in:', file);
    }
  } else {
    console.warn('File not found:', file);
  }
});
console.log(`Successfully updated ${count} games!`);
