const fs = require('fs');
const path = require('path');
global.window = global;
global.window.scrollTo = function() {};
const el = { innerHTML: '', style: {}, querySelectorAll: function() { return []; }, addEventListener: function() {}, querySelector: function() { return null; } };
global.document = {
  getElementById: function(id) { return el; },
  querySelector: function() { return el; },
  querySelectorAll: function() { return []; },
  createElement: function() { return el; },
  addEventListener: function() {},
  body: { appendChild: function() {} }
};
global.location = { search: '?c=M2S87&go=1&tz=343445417&nm=126', hostname: 'musherfe.com', pathname: '/miftah/manasa/lesson.html' };
global.localStorage = { getItem: function() { return null; }, setItem: function() {}, removeItem: function() {} };
global.sessionStorage = { getItem: function() { return null; }, setItem: function() {}, removeItem: function() {} };
global.URLSearchParams = require('url').URLSearchParams;

const filePath = path.join(__dirname, 'public/miftah/manasa/player.js');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace('start();', `
  S.st = 2;
  const hRes = head('🎯 محاكاة');
  console.log('head() includes ta-shared-group-box:', hRes.includes('ta-shared-group-box'));
  console.log('head() snippet:', hRes);
`);

try {
  eval(code);
} catch(e) {
  console.error('Runtime error in player.js:', e);
}
