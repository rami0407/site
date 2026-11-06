const https = require('https');

function check(url, name) {
  https.get(url, (r) => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => {
      console.log(`[${name}] Status:`, r.statusCode);
      console.log(`[${name}] Has 036301448:`, d.includes('036301448'));
      console.log(`[${name}] Has <div class="hint-box">:`, d.includes('<div class="hint-box">'));
    });
  });
}

check('https://raw.githubusercontent.com/rami0407/site/gh-pages/tab/teacher/index.html?t=' + Date.now(), 'Raw gh-pages');
check('https://raw.githubusercontent.com/rami0407/site/main/tab/teacher/index.html?t=' + Date.now(), 'Raw main');
check('https://musherfe.com/tab/teacher/index.html?t=' + Date.now(), 'Musherfe Live');
