import https from 'https';

const testKey = "AIzaSyDGENg8Aity9L2bHr-XAgebNEOf_4YFP8Y";

const modelsToTest = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
  "gemini-2.5-flash"
];

function testModel(model) {
  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${testKey}`;
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: "Hi" }] }]
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        resolve({ model, status: res.statusCode, body: data.substring(0, 300) });
      });
    });

    req.on('error', (e) => resolve({ model, status: 'ERROR', body: e.message }));
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('Testing key:', testKey);
  for (const m of modelsToTest) {
    const res = await testModel(m);
    console.log(`Model [${res.model}]: Status ${res.status}`);
    if (res.status !== 200) {
      console.log(' -> Body:', res.body);
    }
  }
}

run();
