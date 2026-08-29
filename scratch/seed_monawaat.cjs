const https = require('https');

const data = JSON.stringify({
  fields: {
    title: { stringValue: "🎨 صفحة منوعات (معرض رسمات المعلمين)" },
    content: { 
      stringValue: `<div style="text-align:center; padding: 40px; font-family: sans-serif;">
        <h2 style="color: #1e293b; font-size: 1.8rem; margin-bottom: 12px;">🎨 أهلاً بكم في صفحة منوعات اليوم التحضيري</h2>
        <p style="color: #475569; font-size: 1.1rem;">اضغط على الزر أدناه للانتقال المباشر إلى معرض رسمات المعلمين التفاعلي:</p>
        <a href="#/monawaat" onclick="window.location.hash='#/monawaat'; window.location.reload();" style="display:inline-block; margin-top:20px; padding:16px 32px; background:linear-gradient(135deg, #ec4899, #d946ef); color:white; border-radius:14px; font-weight:bold; text-decoration:none; font-size:1.2rem; box-shadow: 0 6px 20px rgba(236,72,153,0.3);">🎨 اضغط هنا لدخول معرض منوعات المعلمين</a>
      </div>` 
    },
    createdAt: { stringValue: new Date().toISOString() }
  }
});

const req = https.request({
  hostname: 'firestore.googleapis.com',
  path: '/v1/projects/site-a8b88/databases/(default)/documents/pages?documentId=monawaat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  console.log('Status Code:', res.statusCode);
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
