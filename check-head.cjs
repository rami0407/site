const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public/miftah/manasa/player.js');
const code = fs.readFileSync(filePath, 'utf8');

// Check syntax and structure
console.log('player.js length:', code.length);
console.log('Includes wireSharedTabletGroupBox:', code.includes('wireSharedTabletGroupBox'));
console.log('Includes renderSharedTabletGroupBoxHtml:', code.includes('renderSharedTabletGroupBoxHtml'));
console.log('head() definition:');
const headMatch = code.match(/function head[\s\S]*?return[\s\S]*?<\/h2>';\s*\}/);
console.log(headMatch ? headMatch[0] : 'NOT FOUND');
