// scripts/generateAudio.js
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../public/audio/quest');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const audioList = [
  {
    id: 'welcome',
    text: 'أهلاً بك يا بطلنا في مغامرة البحث العلمي! أنا صديقك الروبوت مُشيرفي، وسنكتشف معاً كيف يفكر العلماء، من طرح الأسئلة إلى التجربة والاكتشاف. هل أنت مستعد للرحلة؟'
  },
  {
    id: 'station1',
    text: 'في المحطة الأولى، سنقرأ قصة النبتة العجيبة لنعرف ما هو البحث العلمي، ثم تجتاز اختباراً ذكياً من ثلاثة أسئلة لتنال وسام شعلة الفضول!'
  },
  {
    id: 'comic1',
    text: 'المشهد الأول: لاحظ كنان أن نبتة النعناع في غرفته قد ذبلت واصفرّت، بينما نبتة الشرفة خضراء ومورقة! تساءل بدهشة: يا ترى ما السبب الخفي وراء ذلك؟'
  },
  {
    id: 'comic2',
    text: 'المشهد الثاني: ظهر الروبوت مُشيرفي بابتسامته اللطيفة وقال: لا تقلق يا كنان! هنا يأتي دور البحث العلمي، العلم أسلوب تفكير منظم نستخدمه لفهم العالم وحل المشكلات!'
  },
  {
    id: 'comic3',
    text: 'المشهد الثالث: قام كنان بنقل النبتة بجانب نافذة مشمسة، وبدأ يسقيها بانتظام. بعد أيام، عادت النبتة نضرة ومخضرة! هكذا استطاع بالتجربة والملاحظة حل المشكلة واكتشاف حاجة النبات لضوء الشمس.'
  },
  {
    id: 'station2',
    text: 'أهلاً بك في مختبر التساؤل! اكتب سؤال بحثك في الصندوق وسأقوم بمساعدتك لصياغته بأعلى دقة علمية ليكون قابلاً للاختبار والتجربة.'
  },
  {
    id: 'station3',
    text: 'في المحطة الثالثة نتعلم كيف نصوغ الفرضية الذكية: إذا قمنا بكذا، نتوقع كذا، لأن كذا! هيا نبني فرضيتك العلمية معاً!'
  },
  {
    id: 'station4',
    text: 'مبارك من أعماق القلب يا بطلنا المتألق! لقد أكملت خطوات البحث العلمي واستحققت شهادة المستكشف العلمي بجدارة واستحقاق!'
  },
  {
    id: 'feedback_approved',
    text: 'رائع جداً يا بطل! هذا سؤال علمي ممتاز ومحدد وقابل للاختبار والتجربة. لقد فزت بوسام مفتاح التساؤل وأنت جاهز لصياغة الفرضية الآن!'
  },
  {
    id: 'feedback_hint',
    text: 'محاولة طيبة يا بطل! فكر في تحويل سؤالك ليبدأ بـ: كيف يؤثر، أو ما العلاقة بين أمرين، حتى نستطيع قياسه وتجربته في المختبر!'
  }
];

// Helper to download an audio chunk
function downloadChunk(chunk) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(chunk);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=ar&client=tw-ob`;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    };

    https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Status code ${res.statusCode} for chunk: ${chunk}`));
      }
      const data = [];
      res.on('data', c => data.push(c));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

// Split into sentences under 150 chars
function splitText(text, maxLen = 140) {
  const parts = text.split(/([.!؟،]+)/);
  const sentences = [];
  for (let i = 0; i < parts.length; i += 2) {
    const s = (parts[i] || '') + (parts[i + 1] || '');
    if (s.trim()) sentences.push(s.trim());
  }
  const chunks = [];
  let current = '';
  for (const s of sentences) {
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = current ? (current + ' ' + s) : s;
    } else {
      if (current) chunks.push(current);
      current = s;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function run() {
  console.log('Generating audio files into:', targetDir);
  for (const item of audioList) {
    const chunks = splitText(item.text);
    console.log(`Processing "${item.id}" (${chunks.length} chunks)...`);
    const buffers = [];
    for (const chunk of chunks) {
      const buf = await downloadChunk(chunk);
      buffers.push(buf);
      // Small pause to be gentle
      await new Promise(r => setTimeout(r, 200));
    }
    const finalBuffer = Buffer.concat(buffers);
    const filePath = path.join(targetDir, `${item.id}.mp3`);
    fs.writeFileSync(filePath, finalBuffer);
    console.log(`Saved ${filePath} (${finalBuffer.length} bytes)`);
  }
  console.log('All audio files successfully generated!');
}

run().catch(err => {
  console.error('Error generating audio:', err);
  process.exit(1);
});
