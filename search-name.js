const fs = require('fs');
const path = require('path');

function searchDir(dir, searchStr) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, searchStr);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(searchStr) || content.includes('فنة') || content.includes('ابو فنة') || content.includes('أبو فنة')) {
        console.log(`Found in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('فنة')) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log('Searching for Abu Fana in src...');
searchDir('C:\\Users\\ramia\\.gemini\\antigravity\\scratch\\musheirifa_school\\src', 'أبو فنة');
