const https = require('https');

const data = JSON.stringify({
  fields: {
    title: { stringValue: "🎨 صفحة التميز لليوم التحضيري" },
    content: { 
      stringValue: `<div style="text-align:center; padding: 40px; font-family: sans-serif;">
        <h2 style="color: #1e293b; font-size: 1.8rem; margin-bottom: 12px;">🎨 أهلاً بكم في صفحة التميز لليوم التحضيري</h2>
        <p style="color: #475569; font-size: 1.1rem;">اضغط على الزر أدناه للانتقال المباشر إلى معرض رسمات المعلمين التفاعلي:</p>
        <a href="#/prep-day" onclick="window.location.hash='#/prep-day'; window.location.reload();" style="display:inline-block; margin-top:20px; padding:16px 32px; background:linear-gradient(135deg, #2563eb, #1d4ed8); color:white; border-radius:14px; font-weight:bold; text-decoration:none; font-size:1.2rem; box-shadow: 0 6px 20px rgba(37,99,235,0.3);">🚀 اضغط هنا لدخول معرض التميز ورسمات المعلمين</a>
      </div>` 
    },
    createdAt: { stringValue: new Date().toISOString() }
  }
});

const req = https.request({
  hostname: 'firestore.googleapis.com',
  path: '/v1/projects/site-a8b88/databases/(default)/documents/pages?documentId=prep-day',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  console.log('Status Code:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
