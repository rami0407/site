const https = require('https');

const req = https.request({
  hostname: 'firestore.googleapis.com',
  path: '/v1/projects/site-a8b88/databases/(default)/documents/navigation/nav_prep_day',
  method: 'DELETE'
}, (res) => {
  console.log('Status Code:', res.statusCode);
});

req.on('error', (e) => console.error(e));
req.end();
