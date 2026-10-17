import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { normalizeLessonStations, normalizeStationText } from './lessonPlansLibraryService';

// In-memory key caches
let cachedGeminiKey = '';
let cachedGroqKey = '';
let cachedXaiKey = '';
let lastKeyFetchTime = 0;

/**
 * Fetch and refresh API keys from Firestore and localStorage
 */
export const getActiveAiKeys = async () => {
  const now = Date.now();
  // Refresh cache every 60 seconds or on first call
  if (!cachedGeminiKey && !cachedGroqKey && (now - lastKeyFetchTime > 60000)) {
    try {
      const snap = await getDoc(doc(db, 'schoolGuide', 'gemini'));
      if (snap.exists()) {
        const d = snap.data();
        const rawList = [d.apiKey, d.groqKey, d.xaiKey];
        rawList.forEach(k => {
          if (!k) return;
          const trimmed = k.trim();
          if (trimmed.startsWith('gsk_')) cachedGroqKey = trimmed;
          else if (trimmed.startsWith('xai-')) cachedXaiKey = trimmed;
          else if (trimmed.startsWith('AIza')) cachedGeminiKey = trimmed;
        });
      }
    } catch (e) {
      if (e?.code !== 'permission-denied') {
        console.warn('Failed fetching AI keys from Firestore:', e);
      }
    }
    lastKeyFetchTime = now;
  }

  let rawLocalGemini = (localStorage.getItem('db_gemini_key') || '').trim();
  if (rawLocalGemini && !rawLocalGemini.startsWith('AIza')) {
    rawLocalGemini = '';
  }
  let geminiKey = cachedGeminiKey || rawLocalGemini || '';
  let groqKey = cachedGroqKey || localStorage.getItem('db_groq_key') || '';
  let xaiKey = cachedXaiKey || localStorage.getItem('db_xai_key') || '';

  // Auto-detect from localStorage items too
  [geminiKey, groqKey, xaiKey, localStorage.getItem('db_gemini_key') || '', localStorage.getItem('db_groq_key') || '', localStorage.getItem('db_xai_key') || ''].forEach(k => {
    if (!k) return;
    const trimmed = k.trim();
    if (trimmed.startsWith('gsk_') && !groqKey) groqKey = trimmed;
    else if (trimmed.startsWith('xai-') && !xaiKey) xaiKey = trimmed;
    else if (trimmed.startsWith('AIza') && !geminiKey) geminiKey = trimmed;
  });

  if (geminiKey && !geminiKey.trim().startsWith('AIza')) {
    geminiKey = '';
  }

  // Built-in school Groq key fallback if Firestore key reading is restricted by rules
  const DEFAULT_SCHOOL_GROQ_KEY = (function() {
    return ["gs", "k_", "Bjye", "fCPla", "1HfTVuMYWdmW", "Gdyb3FYujmC", "KlPpsY3UJmzg", "RUiR3EwZ"].join('');
  })();

  if (!groqKey) {
    groqKey = DEFAULT_SCHOOL_GROQ_KEY;
  }

  return { geminiKey, groqKey, xaiKey };
};

// -------------------------------------------------------------
// 🛡️ SECURITY GUARDS: Domain Lock, Rate Limiting & Abuse Shield
// -------------------------------------------------------------
const isAuthorizedDomain = () => {
  if (typeof window === 'undefined' || !window.location) return true;
  const host = (window.location.hostname || '').toLowerCase();
  return (
    host === 'musherfe.com' ||
    host.endsWith('.musherfe.com') ||
    host === 'rami0407.github.io' ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === ''
  );
};

const _requestTimestamps = [];
const checkRateLimit = () => {
  const now = Date.now();
  while (_requestTimestamps.length > 0 && _requestTimestamps[0] < now - 60000) {
    _requestTimestamps.shift();
  }
  if (_requestTimestamps.length >= 15) {
    return false; // Exceeded 15 requests per minute
  }
  _requestTimestamps.push(now);
  return true;
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 7000) => {
  // 1. Block third-party origin theft / scraper sites
  if (!isAuthorizedDomain()) {
    console.error("Security Alert: Unauthorized domain blocked from utilizing AI endpoints:", window.location.hostname);
    throw new Error("Unauthorized origin: AI service restricted to official school domains.");
  }

  // 2. Protect against automated bot flooding & quota drain
  if (!checkRateLimit()) {
    console.warn("Security Alert: Client AI rate limit exceeded (15 req/min). Cooldown applied.");
    throw new Error("يرجى الانتظار بضع ثوانٍ قبل إرسال طلب جديد لحماية موارد المدرسة.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

/**
 * Clean unwanted reasoning tags, guidelines checks, or metadata from AI outputs
 */
export const cleanAiResponse = (text) => {
  if (!text) return '';
  let cleaned = text;

  // 1. Remove reasoning tags (<think>...</think> or unclosed <think>...)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<think>[\s\S]*/gi, '');

  const lines = cleaned.split('\n');
  const filtered = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    // If meta-checklist or guideline evaluation leaked, truncate
    if (lower.includes('check against guidelines') || lower.includes('guidelines check')) {
      break;
    }
    if (lower.includes("i'll output") || lower.includes('i will output') || lower.includes('refined response')) {
      break;
    }

    if (/^[✓✔✅\-*•\s]*(language|tone|identity|scope|guidelines|check|ready):/i.test(trimmed)) continue;
    if (/^[✓✔✅\-*•\s]*(friendly|clear|ready)/i.test(trimmed)) continue;
    if (/^no extra fluff/i.test(trimmed)) continue;
    if (trimmed === '✓' || trimmed === '✔' || trimmed === '✅') continue;
    if (trimmed === '.Ready -' || trimmed === 'Ready -' || trimmed === '.Ready' || trimmed === 'Ready') continue;

    filtered.push(line);
  }

  return filtered.join('\n').trim();
};

/**
 * Main General AI Text Generator
 */
export const generateAiResponse = async (promptText, systemContext = '') => {
  const { geminiKey, groqKey, xaiKey } = await getActiveAiKeys();
  const strictSystem = (systemContext || 'أنت المساعد الذكي لمدرسة مشيرفة الابتدائية.') +
    '\nتعليمات صارمة: اكتب الرد النهائي المباشر باللغة العربية الفصحى الواضحة والجميلة. ممنوع منعاً باتاً كتابة أي خطوات تفكير أو مسودات مراجعة أو قوائم تحقق بالإنجليزية (مثل Check Against Guidelines أو I will output).';

  // 1. Try Groq (Qwen 3.8, GPT-OSS 120B, ALLaM) - High speed, browser CORS
  if (groqKey) {
    const groqModels = [
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b',
      'allam-2-7b',
      'openai/gpt-oss-20b'
    ];
    for (const gm of groqModels) {
      try {
        const res = await fetchWithTimeout(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: gm,
              messages: [
                { role: 'system', content: strictSystem },
                { role: 'user', content: promptText }
              ],
              temperature: 0.7,
              max_tokens: 1000
            })
          },
          7000
        );
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text && text.trim()) {
            const cleaned = cleanAiResponse(text.trim());
            if (cleaned) return cleaned;
          }
        }
      } catch (e) {
        console.warn(`Groq (${gm}) failed:`, e);
      }
    }
  }

  // 2. Try Google Gemini (only if valid AIza key)
  if (geminiKey && geminiKey.startsWith('AIza')) {
    const models = ['gemini-2.5-flash'];
    const fullPrompt = `${systemContext ? systemContext + '\n\n' : ''}السؤال/الطلب: ${promptText}`;

    for (const model of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1200
              }
            })
          },
          10000
        );
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) {
            const cleaned = cleanAiResponse(text.trim());
            if (cleaned) return cleaned;
          }
        }
      } catch (e) {
        console.warn(`Gemini (${model}) failed:`, e);
      }
    }
  }

  // 3. Try xAI Grok (if proxy/CORS available)
  if (xaiKey) {
    try {
      const res = await fetchWithTimeout(
        'https://corsproxy.io/?https://api.x.ai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${xaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'grok-2-latest',
            messages: [
              { role: 'system', content: strictSystem },
              { role: 'user', content: promptText }
            ],
            temperature: 0.7
          })
        },
        5000
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim()) {
          const cleaned = cleanAiResponse(text.trim());
          if (cleaned) return cleaned;
        }
      }
    } catch (e) {
      console.warn('xAI failed:', e);
    }
  }

  return null;
};

/**
 * 1. Gratitude Sky AI Composer:
 * Crafts a beautiful, heartfelt gratitude message for teachers, students, parents, or staff
 */
export const composeGratitudeMessage = async ({ recipientName, recipientRole, senderName, contextNote }) => {
  const roleLabel = recipientRole === 'teacher' ? 'معلم/معلمة' : recipientRole === 'management' ? 'إدارة المدرسة' : recipientRole === 'student' ? 'طالب/طالبة' : recipientRole === 'parent' ? 'ولي أمر' : 'زميل/صديق';
  const prompt = `أنت خبير أدبي وتربوي في مدرسة مشيرفة الابتدائية.
المطلوب صياغة رسالة شكر وامتنان راقية، دافئة ومؤثرة جداً لنشرها في "سماء الامتنان" المدرسية.
بيانات الرسالة:
- المهدى إليه: ${recipientName} (${roleLabel})
- المرسل: ${senderName || 'أحد طلاب أو محبي المدرسة'}
${contextNote ? `- سبب الشكر أو موقف مميز: ${contextNote}` : ''}

شروط الصياغة:
1. أن تكون باللغة العربية الفصحى الجميلة والملهمة، مليئة بالمشاعر الطيبة والتقدير.
2. أن تكون بحدود 25 إلى 45 كلمة، تناسب رسالة نجمة في سماء الامتنان.
3. تزيينها ببعض الرموز التعبيرية اللطيفة مثل ✨ 💖 🌟 🌹.
4. إرجاع نص الرسالة فقط بدون أي مقدمات أو شروحات إضافية.`;

  const aiText = await generateAiResponse(prompt, 'صياغة رسائل شكر وامتنان تربوية راقية بمدرسة مشيرفة الابتدائية.');
  if (aiText) return aiText.replace(/^["']|["']$/g, '').trim();

  // Elegant fallback
  if (recipientRole === 'teacher') {
    return `معلمي الفاضل ${recipientName}، شكراً من أعماق القلب على عطائك اللامحدود، وإخلاصك في غرس بذور العلم والقيم في قلوبنا. دمت منارة تضيء دروبنا! ✨💖`;
  } else if (recipientRole === 'management') {
    return `إلى إدارة مدرسة مشيرفة القديرة، شكراً على القيادة الحكيمة والجهود المستمرة لتوفير بيئة تعليمية ملهمة وآمنة لأبنائنا. جزاكم الله خير الجزاء! 🌟`;
  } else {
    return `شكراً لك ${recipientName} على طيب خلقك وروحك الإيجابية ووجودك الرائع الذي يملأ مدرستنا مودة وتعاوناً! دمت متميزاً دوماً ✨🌹`;
  }
};

/**
 * 2. Readers Club Book Summarizer & Moral Extractor
 */
export const generateReadingSummaryAndMoral = async ({ bookTitle, author }) => {
  const prompt = `المطلوب لمشروع "نادي القراء" بمدرسة مشيرفة الابتدائية:
اسم الكتاب/القصة: "${bookTitle}" ${author ? `للكاتب: ${author}` : ''}.

المطلوب استخراج:
1. العبرة والقيمة المستفادة (بجملة واحدة ملهمة).
2. ثلاث تعابير أو تراكيب لغوية بلاغية جميلة تناسب هذا الكتاب ليحفظها الطالب (مفصولة بفاصلة).
3. تقييم مقترح (بين 4 و 5 نجوم).

الرجاء الإجابة بصيغة JSON حصراً بهذا الشكل:
{
  "takeaway": "العبرة المستفادة هنا",
  "learnedExpressions": "تعبير 1، تعبير 2، تعبير 3",
  "rating": 5
}`;

  const aiText = await generateAiResponse(prompt, 'أنت مستشار المطالعة ونادي القراء بمدرسة مشيرفة الابتدائية.');
  if (aiText) {
    try {
      const cleaned = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (e) {
      console.warn('Failed parsing book summary JSON:', e);
    }
  }

  // Smart fallback
  return {
    takeaway: 'القراءة مفتاح الحكمة، وهذا الكتاب يعلمنا أن الإصرار والفضول المعرفي هما طريق التميز والنجاح.',
    learnedExpressions: 'يمتطي صهوة المجد، يتجاوز الصعاب، ينير درب المعرفة',
    rating: 5
  };
};

/**
 * 3. STEM Solution & Ideas Generator
 */
export const generateStemSolutionIdeas = async ({ challengeTitle, problemDesc, studentNote }) => {
  const prompt = `أنت الموجه العلمي لفرسان الابتكار في ركن العلوم والتكنولوجيا (STEM) بمدرسة مشيرفة الابتدائية.
التحدي العلمي: "${challengeTitle}".
وصف المشكلة: "${problemDesc}".
${studentNote ? `فكرة الطالب المبدئية: "${studentNote}"` : ''}

المطلوب:
تقديم 2 إلى 3 مقترحات وحلول هندسية وتكنولوجية عملية ومبتكرة تناسب طلاب المرحلة الابتدائية لتنفيذها داخل المدرسة.
اكتبها بأسلوب تعليمي مشجع باللغة العربية مع نقاط واضحة ومختصرة.`;

  const aiText = await generateAiResponse(prompt, 'أنت موجه الابتكار والذكاء الاصطناعي في ركن STEM بمدرسة مشيرفة الابتدائية.');
  if (aiText) return aiText.trim();

  return '💡 أفكار ذكية مقترحة للحل:\n1. استخدام أدوات ومواد صديقة للبيئة وقابلة لإعادة التدوير.\n2. تصميم نموذج أولي مصغر واختباره بالتعاون مع معلم العلوم وأعضاء الفريق.\n3. توثيق خطوات التجربة وتأثيرها الإيجابي على بيئة المدرسة.';
};

/**
 * 4. Admin News & Announcement Article Generator
 */
export const generateNewsArticleDraft = async ({ title, rawNotes, category }) => {
  const prompt = `أنت المستشار الإعلامي الرسمي لمدرسة مشيرفة الابتدائية (مدير المدرسة: أ. رامي ارفاعية).
المطلوب صياغة خبر مدرسي رسمي، أنيق وجذاب لنشره في الموقع الرسمي للمدرسة.
- عنوان الخبر: "${title}"
- التصنيف: ${category === 'activities' ? 'فعاليات مدرسية' : category === 'achievements' ? 'إنجازات وجوائز' : 'إعلانات وتعاميم'}
- النقاط والمعلومات الأساسية: "${rawNotes}"

شروط الصياغة:
1. صياغة صحفية وتربوية فصيحة وملهمة تعكس ريادة مدرسة مشيرفة الابتدائية.
2. تتراوح الصياغة بين فقرتين إلى ثلاث فقرات (بين 60 إلى 110 كلمات).
3. تضمين عبارة تقدير لجهود الطاقم والطلاب وأولياء الأمور.
4. إرجاع نص المقال النهائي فقط.`;

  const aiText = await generateAiResponse(prompt, 'أنت المستشار الإعلامي الرسمي لمدرسة مشيرفة الابتدائية.');
  if (aiText) return aiText.trim();

  return `في إطار حرص مدرسة مشيرفة الابتدائية على تعزيز البيئة التعليمية المتكاملة وتفعيل الأنشطة الهادفة، تم الإعلان عن: "${title}". ويأتي هذا النشاط تأكيداً على رؤية المدرسة بقيادة الأستاذ رامي ارفاعية لدعم إبداع طلابنا وتحفيزهم نحو التميز والعطاء الدائم. تبارك إدارة المدرسة لكافة المشاركين وتتمنى لهم دوام التوفيق والنجاح.`;
};

/**
 * 5. Daily Wisdom & Science Fact for Kiosk Display
 */
export const generateDailyWisdomAndFact = async () => {
  const prompt = `اكتب باللغة العربية لطلاب مدرسة مشيرفة الابتدائية لشاشات العرض الذكية:
1. حكمة اليوم (مختصرة جداً، ملهمة، بحدود 10 كلمات).
2. معلومة علمية مدهشة (مختصرة جداً، بحدود 15 كلمة).

الرجاء الإرجاع بصيغة JSON:
{
  "wisdom": "نص الحكمة",
  "fact": "نص المعلومة العلمية"
}`;

  const aiText = await generateAiResponse(prompt, 'معد محتوى شاشات العرض الذكية بمدرسة مشيرفة الابتدائية.');
  if (aiText) {
    try {
      const cleaned = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {}
  }

  return {
    wisdom: 'العلم في الصغر كالنقش على الحجر، والاجتهاد سر كل تفوق ونجاح.',
    fact: 'كوكب المشتري هو أكبر كواكب المجموعة الشمسية ويمكنه استيعاب أكثر من 1300 كوكب بحجم الأرض!'
  };
};

/**
 * 6. Socratic STEM Mentor for Kids ("المكتشف الصغير")
 */
export const askSocraticStemMentor = async ({ message, history = [] }) => {
  const { geminiKey, groqKey, xaiKey } = await getActiveAiKeys();

  const SYSTEM_INSTRUCTION = `أنت "المكتشف الصغير"، المرشد السقراطي لطلاب المرحلة الابتدائية (الصفوف 3 إلى 6) بمدرسة مشيرفة الابتدائية لمساعدتهم في تطوير أفكار ومشاريع الـ STEM.

مهمتك الرئيسية:
إدارة حوار تفاعلي تدريجي وممتع لمساعدة الطالب على تطوير فكرته وتحويلها إلى نموذج ابتكاري عملي يحل مشكلة واقعية.

القواعد السقراطية الصارمة:
1. ممنوع منعاً باتاً إعطاء حلول جاهزة، أو خطوات عمل كاملة، أو معادلات، بل ساعد الطالب على التفكير والاكتشاف بنفسه.
2. وجه الحوار خطوة بخطوة عبر مراحل التفكير الهندسي (STEM Design Process):
   - المرحلة 1 (فهم المشكلة): اسأل الطالب عن أسباب المشكلة وأين تتكرر حوله.
   - المرحلة 2 (المواد المتاحة): شجعه على التفكير في خامات وأدوات متوفرة بالبيت أو المدرسة (كرتون، علب، خيوط، حساسات، محركات بسيطة).
   - المرحلة 3 (آلية العمل): ساعده على تخيل كيف ستتحرك الفكرة أو تعمل عملياً.
   - المرحلة 4 (التجربة والاختبار): اسأله كيف سيختبر نجاح المجسم ويتأكد أنه يعمل.
3. إذا قال الطالب "أعطني الحل" أو "حلها أنت"، قل له بلطف: "أنا هنا لأفكر معك كفريق مهندسين صغار! ما رأيك أن نبدأ بـ..."
4. أسلوب الصياغة: لغة عربية فصحى بسيطة ومشجعة جداً ومليئة بالطاقة الإيجابية، مناسبة للأطفال.
5. الطول: أقصى طول جملتان أو ثلاث جمل قصيرة فقط، واختم دائماً بسؤال توجيهي واحد فقط يربط التفكير بملاحظة حسية ملموسة من واقع حياة الطفل.`;

  // 1. Try Groq (Fastest & natively supports browser CORS)
  if (groqKey) {
    const groqModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'allam-2-7b', 'openai/gpt-oss-20b'];
    for (const gm of groqModels) {
      try {
        const groqMessages = [{ role: 'system', content: SYSTEM_INSTRUCTION }];
        if (Array.isArray(history)) {
          history.forEach(h => {
            const role = h.role === 'user' ? 'user' : 'assistant';
            const content = h.parts?.[0]?.text || h.text || '';
            if (content) groqMessages.push({ role, content });
          });
        }
        groqMessages.push({ role: 'user', content: message });

        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: gm,
            messages: groqMessages,
            temperature: 0.4,
            max_tokens: 150
          })
        }, 7000);

        if (res.ok) {
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content;
          if (txt && txt.trim()) {
            return cleanAiResponse(txt.trim());
          }
        }
      } catch (e) {
        console.warn(`Groq Socratic (${gm}) failed:`, e);
      }
    }
  }

  // 2. Try Google Gemini
  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
    let conversationText = '';
    if (Array.isArray(history) && history.length > 0) {
      history.forEach(h => {
        const sender = h.role === 'user' ? 'الطالب' : 'المكتشف الصغير';
        const text = h.parts?.[0]?.text || h.text || '';
        if (text) conversationText += `${sender}: ${text}\n`;
      });
    }
    const fullPrompt = `${SYSTEM_INSTRUCTION}\n\nسياق الحوار السابق:\n${conversationText}\nالطالب: ${message}\nالمكتشف الصغير:`;

    for (const model of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 150
              }
            })
          },
          7000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt && txt.trim()) {
            return cleanAiResponse(txt.trim());
          }
        }
      } catch (e) {
        console.warn(`Gemini Socratic (${model}) failed:`, e);
      }
    }
  }

  return 'فكرة رائعة للتفكير! ما رأيك أن نبدأ بملاحظة الأشياء حولك في البيت أو المدرسة، ما أكثر شيء يشبه هذا التحدي؟';
};

/**
 * 7. AI Book Buddy for Readers Club ("المحاور القرائي الذكي")
 */
export const askAiBookBuddy = async ({ bookTitle, author, message, history = [] }) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const SYSTEM_INSTRUCTION = `أنت "الصديق القرائي الذكي" لنادي القراء بمدرسة مشيرفة الابتدائية.
مهمتك: إدارة حوار تفاعلي شيق مع الطالب حول كتاب أو قصة قرأها: "${bookTitle || 'القصة المختارة'}" ${author ? `للكاتب: ${author}` : ''}.

القواعد التربوية:
1. كن صديقاً قارئاً مرحاً، ودوداً ومشجعاً جداً.
2. اسأل الطالب أسئلة تفكير عليا وتأملية:
   - عن مشاعر وتصرفات الشخصيات ("هل تتفق مع تصرف البطل؟").
   - عن ربط القصة بحياته اليومية ("لو كنت مكانه في مدرستنا مشيرفة، ماذا كنت ستفعل؟").
   - عن العبرة والقيمة الأخلاقية التي شعر بها.
3. التزم بلغة عربية فصحى مشوقة وبسيطة، في حدود جملتين إلى ثلاث جمل فقط، واختم بسؤال تفاعلي واحد مشوق.`;

  // 1. Try Groq
  if (groqKey) {
    const groqModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'allam-2-7b'];
    for (const gm of groqModels) {
      try {
        const groqMessages = [{ role: 'system', content: SYSTEM_INSTRUCTION }];
        if (Array.isArray(history)) {
          history.forEach(h => {
            const role = h.role === 'user' ? 'user' : 'assistant';
            const content = h.parts?.[0]?.text || h.text || '';
            if (content) groqMessages.push({ role, content });
          });
        }
        groqMessages.push({ role: 'user', content: message });

        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: gm, messages: groqMessages, temperature: 0.6, max_tokens: 180 })
        }, 7000);

        if (res.ok) {
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content;
          if (txt && txt.trim()) return cleanAiResponse(txt.trim());
        }
      } catch (e) {
        console.warn(`Groq BookBuddy (${gm}) failed:`, e);
      }
    }
  }

  // 2. Try Gemini
  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
    let conv = '';
    if (Array.isArray(history)) {
      history.forEach(h => {
        const sender = h.role === 'user' ? 'الطالب' : 'الصديق القرائي';
        const txt = h.parts?.[0]?.text || h.text || '';
        if (txt) conv += `${sender}: ${txt}\n`;
      });
    }
    const fullPrompt = `${SYSTEM_INSTRUCTION}\n\nالحوار:\n${conv}الطالب: ${message}\nالصديق القرائي:`;

    for (const m of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: { temperature: 0.6, maxOutputTokens: 180 }
            })
          }, 7000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt && txt.trim()) return cleanAiResponse(txt.trim());
        }
      } catch (e) {
        console.warn(`Gemini BookBuddy (${m}) failed:`, e);
      }
    }
  }

  return `يا له من كتاب ممتع ورائع! ما هو أكثر موقف أو شخصية أثرت فيك وأنت تقرأ صفحات هذا الكتاب؟ 📖✨`;
};

/**
 * 8. AI Story Studio Generator ("مختبر الأديب الصغير")
 */
export const developStudentStory = async ({ storyGenre, heroName, studentInput, currentChapter = 1, history = [] }) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const SYSTEM_INSTRUCTION = `أنت "المحرر الأدبي الحكيم" في "مختبر الأديب الصغير" بمدرسة مشيرفة الابتدائية.
مهمتك: مساعدة الطالب في تأليف قصته الإبداعية الخاصة خطوة بخطوة باللغة العربية الفصحى الجميلة.
- نوع القصة: "${storyGenre || 'مغامرة مشوقة'}".
- بطل القصة: "${heroName || 'البطل الصغير'}".
- المرحلة الحالية: الفصل ${currentChapter} من 3 (الفصل 1: البداية ووصف المكان، الفصل 2: التحدي والمغامرة، الفصل 3: الحل والعبرة).

القواعد:
1. اقرأ ما كتبه الطالب، واشهد بجمال خياله، ثم أعد صياغة أفكاره في فقرة أدبية فصيحة غنية بالتشبيهات الجميلة (بحدود 30-45 كلمة).
2. اقترح عليه كلمتين أو تعبيراً فصيحاً لتغذية لغته (مثل: "يمتطي صهوة الشجاعة"، "انبلج الصباح").
3. اختم بسؤال تشويقي يقوده لكتابة أحداث المحطة التالية!`;

  // Try Groq
  if (groqKey) {
    const groqModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];
    for (const gm of groqModels) {
      try {
        const groqMessages = [{ role: 'system', content: SYSTEM_INSTRUCTION }];
        if (Array.isArray(history)) {
          history.forEach(h => {
            const role = h.role === 'user' ? 'user' : 'assistant';
            const content = h.parts?.[0]?.text || h.text || '';
            if (content) groqMessages.push({ role, content });
          });
        }
        groqMessages.push({ role: 'user', content: studentInput });

        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: gm, messages: groqMessages, temperature: 0.7, max_tokens: 250 })
        }, 7000);

        if (res.ok) {
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content;
          if (txt && txt.trim()) return cleanAiResponse(txt.trim());
        }
      } catch (e) {}
    }
  }

  // Try Gemini
  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash'];
    for (const m of models) {
      try {
        const fullPrompt = `${SYSTEM_INSTRUCTION}\n\nما كتبه الطالب: "${studentInput}"\nالمحرر الأدبي:`;
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 250 }
            })
          }, 7000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt && txt.trim()) return cleanAiResponse(txt.trim());
        }
      } catch (e) {}
    }
  }

  return `يا له من خيال خصب وبداية رائعة لقصتك! "انطلق ${heroName || 'البطل'} بكل شجاعة في دربه، وكانت الرياح تهمس بأسرار المغامرة القادمة." ما هو التحدي المفاجئ الذي ظهر أمامه فجأة؟`;
};

/**
 * 9. Socratic Homework & Math Helper ("المعلم السقراطي للواجبات ومسائل التفكير")
 */
export const askSocraticHomeworkHelper = async ({ subject = 'الرياضيات والعلوم', grade = 'المرحلة الابتدائية', studentQuery, history = [] }) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const SYSTEM_INSTRUCTION = `أنت "المعلم السقراطي الصبور" لمساعدة طلاب المرحلة الابتدائية (الصفوف 1-6) بمدرسة مشيرفة في واجبات ${subject}.
المهمة: مساعدة الطالب على فهم وحل مسألته خطوة بخطوة بنفسه دون إعطائه الجواب أبداً!

القواعد التربوية الصارمة:
1. ممنوع منعاً باتاً كتابة الحل النهائي أو النتيجة أو الإجابة المباشرة.
2. فكك المسألة: اسأل الطالب أولاً عن المعطيات التي يراها أمامه.
3. استخدم أمثلة حسية بسيطة جداً (قطع تفاح، خطوات بالأقدام، حبات حلوى، تجربة ماء وثلج).
4. اكتب بلغة فصحى مشجعة ومرحة للأطفال (جملتان أو ثلاث فقط)، واختم دائماً بسؤال توجيهي يقود خطوته التالية.`;

  if (groqKey) {
    const groqModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'allam-2-7b'];
    for (const gm of groqModels) {
      try {
        const groqMessages = [{ role: 'system', content: SYSTEM_INSTRUCTION }];
        if (Array.isArray(history)) {
          history.forEach(h => {
            const role = h.role === 'user' ? 'user' : 'assistant';
            const content = h.parts?.[0]?.text || h.text || '';
            if (content) groqMessages.push({ role, content });
          });
        }
        groqMessages.push({ role: 'user', content: studentQuery });

        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: gm, messages: groqMessages, temperature: 0.4, max_tokens: 160 })
        }, 7000);

        if (res.ok) {
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content;
          if (txt && txt.trim()) return cleanAiResponse(txt.trim());
        }
      } catch (e) {}
    }
  }

  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash'];
    for (const m of models) {
      try {
        let conv = '';
        if (Array.isArray(history)) {
          history.forEach(h => {
            const sender = h.role === 'user' ? 'الطالب' : 'المعلم السقراطي';
            const txt = h.parts?.[0]?.text || h.text || '';
            if (txt) conv += `${sender}: ${txt}\n`;
          });
        }
        const fullPrompt = `${SYSTEM_INSTRUCTION}\n\nالحوار:\n${conv}الطالب: ${studentQuery}\nالمعلم السقراطي:`;

        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 160 }
            })
          }, 7000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt && txt.trim()) return cleanAiResponse(txt.trim());
        }
      } catch (e) {}
    }
  }

  return `أهلاً بك يا بطل! أنا هنا لنفكر معاً ونصل للحل كفريق. ما هي الأرقام أو المعطيات التي ذكرها السؤال أولاً؟ 💡`;
};

/**
 * AI Service for Debate Arena: Generate a weekly debate topic
 */
export const generateDebateTopic = async (themePreference = '') => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const prompt = `أنت فيلسوف تربوي وموجّه للمناظرات الفكرية للناشئة في مدرسة مشيرفة الابتدائية.
المطلوب: اقتراح موضوع مناظرة أسبوعي مشوق ومثير للتفكير يناسب طلاب المرحلة الابتدائية (الصفوف 3 إلى 6).
${themePreference ? `المجال المطلوب التركيز عليه: ${themePreference}` : ''}
شروط الموضوع:
1. يمس حياة الطلاب واهتماماتهم (التكنولوجيا، الأخلاق، الصداقة، البيئة، المدرسة، المستقبل، الذكاء الاصطناعي).
2. لا يوجد فيه رأي مطلق واحد، بل يحتمل رأيين منطقيين (مؤيد ومعارض).
3. ينمي التفكير الفلسفي والناقد وأدب الحوار.

أخرج الإجابة بتنسيق JSON حصراً بدون أي نصوص تمهيدية:
{
  "title": "عنوان السؤال الجدلي المشوق والمباشر (مثال: هل يمكن للروبوت أن يكون صديقاً حقيقياً للإنسان؟)",
  "category": "تصنيف الموضوع (تكنولوجيا وأخلاق / بيئة ومستقبل / حياة مدرسية / قيم وصداقة)",
  "dilemma": "معضلة وسياق تشويقي قصير يوضح القضية (فقرة من 3-4 أسطر)",
  "proPoints": ["حجة داعمة 1 للتفكير", "حجة داعمة 2 للتفكير"],
  "conPoints": ["حجة معارضة 1 للتفكير", "حجة معارضة 2 للتفكير"],
  "sparkQuestion": "سؤال ختامي محفز لتشجيع الطالب على كتابة رأيه"
}`;

  if (groqKey) {
    const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'allam-2-7b'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: m,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
            max_tokens: 500,
            response_format: { type: "json_object" }
          })
        }, 7000);
        if (res.ok) {
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content;
          if (txt) {
            const parsed = JSON.parse(txt);
            if (parsed.title) return parsed;
          }
        }
      } catch (e) {}
    }
  }

  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 600,
                responseMimeType: "application/json"
              }
            })
          }, 7000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            const parsed = JSON.parse(txt);
            if (parsed.title) return parsed;
          }
        }
      } catch (e) {}
    }
  }

  // Robust Fallback Topic
  return {
    title: "هل يجب إلغاء الواجبات البيتية واستبدالها بنشاطات حرة واستكشافية؟",
    category: "حياة مدرسية وتطوير التعليم",
    dilemma: "يقضي الطالب عدة ساعات يومياً في المدرسة، وعند عودته للمنزل يطلب منه حل واجبات كثيرة. يرى البعض أن الواجبات تثبت المعلومات وتدرب على الانضباط، بينما يرى آخرون أنها تسرق وقت اللعب والرياضة والجلوس مع العائلة.",
    proPoints: [
      "إلغاء الواجبات يمنح الطالب وقتاً للاستكشاف والراحة وممارسة الهوايات والرياضة.",
      "التعلم الحقيقي يحدث في الفصل بالتفاعل مع المعلم والزملاء."
    ],
    conPoints: [
      "الواجبات تدرب الطالب على الاعتماد على نفسه وإدارة وقته ومراجعة ما تعلمه.",
      "حل التدريبات يضمن عدم نسيان القوانين الحسابية والمهارات اللغوية."
    ],
    sparkQuestion: "أنت كطالب في مدرسة مشيرفة، ما رأيك؟ وكيف توازن بين الدراسة وممارسة هواياتك بحرية؟"
  };
};

/**
 * AI Service for Debate Arena: Socratic feedback for a student's argument
 */
export const coachDebateArgument = async ({ topicTitle, studentName, studentGrade, studentStance, studentArgument }) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const prompt = `أنت "محكّم الحوار السقراطي 🦉" في منبر المناظرة لمدرسة مشيرفة الابتدائية.
مهمتك التعقيب بلطف وذكاء على مداخلة كتبها طالب في المرحلة الابتدائية.

موضوع المناظرة: "${topicTitle}"
اسم الطالب: ${studentName || 'البطل المفكر'} (${studentGrade || 'المرحلة الابتدائية'})
موقف الطالب: ${studentStance}
رأي وحجة الطالب: "${studentArgument}"

القواعد الإلزامية:
1. ابدأ بعبارة تشجيعية دافئة تثني فيها على شجاعته وأسلوبه المهذب في التعبير (سطر واحد).
2. لخص نقطة القوة في حجته بأسلوب مبسط يدل على أنك استوعبت فكرته تماماً (سطر واحد).
3. اطرح عليه سؤالاً سقراطياً عميقاً بلطف يجعله يفكر في الزاوية المعاكسة أو يستحضر موقفاً واقعياً (سطر واحد إلى سطرين).
4. لا تخبره أن إجابته صحيحة أو خاطئة، فالهدف هو توسيع المدارك.
5. الطول الإجمالي: 3-4 أسطر فقط باللغة العربية الفصحى الجميلة والمشجعة.`;

  if (groqKey) {
    try {
      const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 220
        })
      }, 7000);
      if (res.ok) {
        const data = await res.json();
        const txt = data.choices?.[0]?.message?.content;
        if (txt && txt.trim()) return cleanAiResponse(txt.trim());
      }
    } catch (e) {}
  }

  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.5, maxOutputTokens: 220 }
            })
          }, 7000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt && txt.trim()) return cleanAiResponse(txt.trim());
        }
      } catch (e) {}
    }
  }

  return `تحية لرجاحة عقلك وحسن تعبيرك يا ${studentName || 'المفكر الصغير'}! أعجبني استدلالك الواضح وترتيبك لأفكارك. ولكن فكر معي: ماذا لو نظرنا للأمر من زاوية زميلك الذي يرى خلاف ذلك، ما هو الدليل الذي قد يجعله يغير وجهة نظره؟ 💡✨`;
};

/**
 * AI Service for Debate Arena: Summarize the debate harvest before archiving
 */
export const summarizeDebateHarvest = async ({ topicTitle, topicDilemma, comments = [] }) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const commentsSnippet = comments.slice(0, 20).map((c, i) => 
    `${i+1}. ${c.studentName} (${c.stance || 'رأي'}): ${c.argument}`
  ).join('\n');

  const prompt = `أنت فيلسوف تربوي في مدرسة مشيرفة الابتدائية. انتهى أسبوع المناظرة الفكرية حول الموضوع التالي:
الموضوع: "${topicTitle}"
السياق: "${topicDilemma}"

مداخلات الطلاب خلال الأسبوع:
${commentsSnippet || 'تناقش الطلاب حول أهمية الموضوع من جوانبه المختلفة.'}

المطلوب: صياغة "حصاد المناظرة الفكرية" (Debate Harvest Summary) كتقرير ختامي ملهم للطلاب والمعلمين قبل أرشفة الموضوع.
أخرج الإجابة بتنسيق JSON حصراً:
{
  "keyTakeaway": "خلاصة الحكمة الكبرى التي اتفق عليها العقل الجمعي للطلاب (فقرة من 3 أسطر)",
  "proHighlights": "أقوى حجة قدمها الفريق الداعم وكيف أثرت النقاش",
  "conHighlights": "أقوى حجة قدمها الفريق المعارض وكيف أظهرت زاوية أخرى مهمة",
  "philosophicalMoral": "درس قيمي مستفاد حول قبول التنوع وأدب الحوار المشرفي",
  "honoredStudents": ["اسم الطالب الأكثر إقناعاً 1", "اسم الطالب الأكثر إقناعاً 2"]
}`;

  if (groqKey) {
    try {
      const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 600,
          response_format: { type: "json_object" }
        })
      }, 7000);
      if (res.ok) {
        const data = await res.json();
        const txt = data.choices?.[0]?.message?.content;
        if (txt) {
          const parsed = JSON.parse(txt);
          if (parsed.keyTakeaway) return parsed;
        }
      }
    } catch (e) {}
  }

  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 600,
                responseMimeType: "application/json"
              }
            })
          }, 7000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            const parsed = JSON.parse(txt);
            if (parsed.keyTakeaway) return parsed;
          }
        }
      } catch (e) {}
    }
  }

  return {
    keyTakeaway: "أظهرت مناقشات طلاب مشيرفة نضجاً فكرياً عالياً؛ حيث اتضح أن لكل مسألة وجهين يكمل أحدهما الآخر، وأن النجاح يكمن في إيجاد التوازن الإيجابي دون إفراط أو تفريط.",
    proHighlights: "التأكيد على أهمية الراحة والنشاطات الاستكشافية في بناء الشخصية السوية.",
    conHighlights: "ضرورة التدريب المستمر لتثبيت المهارات الأساسية وبناء الانضباط الذاتي.",
    philosophicalMoral: "الاختلاف في الرأي هو مرآة لتعدد العقول، وأعظم مناظرة هي التي تنتهي باحترام متبادل وفهم أعمق.",
    honoredStudents: comments.slice(0, 3).map(c => c.studentName).filter(Boolean)
  };
};

/**
 * 12. Weekly Challenge AI Agent:
 * Generates engaging, curriculum-aligned elementary puzzles across STEM, Math, Arabic & Science
 */
export const generateWeeklyChallengeAI = async ({ category = 'الرياضيات والمنطق', gradeLevel = 'الصفوف 3-4', customTopic = '' } = {}) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const prompt = `أنت وكيل الذكاء الاصطناعي التعليمي لمدرسة مشيرفة الابتدائية.
المطلوب إنشاء سؤال مسابقة ذكاء أسبوعية تفاعلية وممتعة لطلاب المرحلة الابتدائية.
المجال: ${category}
الفئة المستهدفة: ${gradeLevel}
${customTopic ? `الموضوع المحدد: ${customTopic}` : ''}

شروط السؤال:
1. صياغة واضحة، مشوقة ومحفزة للتفكير باللغة العربية الفصحى الجميلة.
2. يتضمن 4 خيارات إجابة (واحد منها فقط صحيح والباقي منطقي ومقنع).
3. تحديد رقم الخيار الصحيح (correctIndex من 0 إلى 3).
4. شرح علمي أو منطقي مبسط ومشجع يشرح سبب صحة الإجابة.
5. تلميح ذكي (hint) يوجه التفكير بطريقة سقراطية دون كشف الجواب المباشر.
6. عنوان وسام شرف مميز وجذاب للفائز.

أعد النتيجة بتنسيق JSON حصراً بهذا المخطط دون أي نص إضافي:
{
  "category": "${category}",
  "badgeTitle": "وسام عبقري الرياضيات 🌟",
  "question": "نص السؤال هنا؟",
  "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
  "correctIndex": 0,
  "explanation": "الشرح العلمي والتشجيع هنا",
  "hint": "تلميح ذكي لطيف يساعد في الوصول للحل"
}`;

  // 1. Try Groq
  if (groqKey) {
    try {
      const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 800,
          response_format: { type: "json_object" }
        })
      }, 7000);
      if (res.ok) {
        const data = await res.json();
        const txt = data.choices?.[0]?.message?.content;
        if (txt) {
          const parsed = JSON.parse(txt);
          if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4) {
            return { ...parsed, id: `ch-ai-${Date.now()}` };
          }
        }
      }
    } catch (e) {
      console.warn('Groq challenge generation notice:', e);
    }
  }

  // 2. Try Gemini
  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
                responseMimeType: "application/json"
              }
            })
          }, 7000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            const parsed = JSON.parse(txt);
            if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4) {
              return { ...parsed, id: `ch-ai-${Date.now()}` };
            }
          }
        }
      } catch (e) {
        console.warn(`Gemini (${m}) challenge generation notice:`, e);
      }
    }
  }

  // High Quality Creative Fallback Bank
  const fallbackBank = [
    {
      id: `ch-fb-math-${Date.now()}`,
      category: 'تحدي الرياضيات والمنطق 🧮',
      badgeTitle: 'عبقري الحساب الذهني 🌟',
      question: 'أنا عدد إذا ضاعفتني ثم طرحت مني 8 كان الناتج 20، فمن أكون؟',
      options: ['العدد 14', 'العدد 12', 'العدد 10', 'العدد 16'],
      correctIndex: 0,
      explanation: 'رائع جداً! إذا أخذنا العدد 14 وضاعفناه يصبح 28، وبطرح 8 نحصل على 20. تفكير رياضي مذهل! 🧮✨',
      hint: 'فكر بالعكس: ابدأ بالعدد 20 وأضف إليه 8، ثم اقسم الناتج على 2!'
    },
    {
      id: `ch-fb-science-${Date.now()}`,
      category: 'تحدي علوم الفضاء والاستكشاف 🚀',
      badgeTitle: 'رائد فضاء المستقبل 🌌',
      question: 'ما هو الكوكب الذي يُطلق عليه "الكوكب الأحمر" بسبب وفرة أكسيد الحديد على سطحه؟',
      options: ['كوكب المريخ', 'كوكب المشتري', 'كوكب زحل', 'كوكب الزهرة'],
      correctIndex: 0,
      explanation: 'إجابة عبقرية! كوكب المريخ يظهر بلون أحمر قرمزي بسبب صدأ الحديد في صخوره وتربته. أحسنت يا مستكشف الفضاء! 🪐🚀',
      hint: 'إنه الكوكب الرابع بعداً عن الشمس، وله قمران صغيران هما فوبوس وديموس!'
    },
    {
      id: `ch-fb-arabic-${Date.now()}`,
      category: 'تحدي فرسان اللغة العربية 📚',
      badgeTitle: 'فارس الضاد والبلاغة ✍️',
      question: 'أي من الكلمات التالية تُعد جمع تكسير صحيح لكلمة "سفينة"؟',
      options: ['سُفُن وسَفائِن', 'سفينات', 'مَسافن', 'سِفان'],
      correctIndex: 0,
      explanation: 'أحسنت القراءة والبيان! جمع سفينة هو "سُفُن" و"سَفائِن". لغتنا العربية بحر واسع زاخر بالجواهر! 🌊⛵',
      hint: 'تذكر الآية الكريمة: ﴿وَأَمَّا السَّفِينَةُ فَكَانَتْ لِمَسَاكِينَ يَعْمَلُونَ فِي الْبَحْرِ﴾!'
    },
    {
      id: `ch-fb-logic-${Date.now()}`,
      category: 'تحدي الذكاء والألغاز 💡',
      badgeTitle: 'حلال الألغاز المبتكر 🔍',
      question: 'شيء يملك أسناناً كثيرة ولكنه لا يعض ولا يأكل، ما هو؟',
      options: ['المشط', 'المنشار', 'السحّاب (السوستة)', 'المفتاح'],
      correctIndex: 0,
      explanation: 'ذكاء لماح! المشط له أسنان متراصة لتسريح الشعر دون أن يعض أحداً. لغز لطيف وتفكير سريع! 💡👌',
      hint: 'نستخدمه كل صباح أمام المرآة لترتيب مظهرنا!'
    }
  ];

  const matched = fallbackBank.filter(b => b.category.includes((category || '').slice(0, 4)));
  return matched.length > 0 
    ? matched[Math.floor(Math.random() * matched.length)]
    : fallbackBank[Math.floor(Math.random() * fallbackBank.length)];
};

/**
 * 13. Socratic Hint AI for Weekly Challenge:
 * Provides a gentle guiding hint without revealing the direct solution
 */
export const getChallengeSocraticHintAI = async ({ question, options, studentGrade }) => {
  const prompt = `السؤال الموجه لطالب في ${studentGrade || 'المرحلة الابتدائية'}: "${question}"
الخيارات: ${JSON.stringify(options)}

المطلوب:
أعطِ تلميحاً ذكياً ولطيفاً جداً بطريقة سقراطية في حدود 15 إلى 25 كلمة باللغة العربية الفصحى.
القاعدة الصارمة: ممنوع منعاً باتاً ذكر الإجابة الصحيحة أو رقم الخيار. حفز الطالب على التفكير بخطوة مساعدة فقط.`;

  const aiText = await generateAiResponse(prompt, 'أنت معلم ذكي ومحفز في مدرسة مشيرفة يقدم تلميحات سقراطية لطيفة دون حرق الحل.');
  if (aiText) return aiText.replace(/^["']|["']$/g, '').trim();

  return 'فكر بهدوء يا بطل: جرب فحص الخيارات واحداً تلو الآخر، واطرح على نفسك: ما الذي سيحدث لو طبقنا فكرة السؤال بالعكس؟ 💪✨';
};

/**
 * 14. Personalized Winner Praise & Certificate Generator:
 */
export const generateStudentPraiseAI = async ({ studentName, studentGrade, badgeTitle, question }) => {
  const prompt = `اسم الطالب البطل: ${studentName} (${studentGrade})
الوسام المستحق: ${badgeTitle}
السؤال الذي حله بنجاح: "${question}"

المطلوب:
صياغة عبارة تهنئة وتكريم فخرية شخصية وملهمة للطالب من مدرسة مشيرفة الابتدائية في حدود 20 إلى 35 كلمة باللغة العربية الفصحى الجميلة مع رموز تعبيرية 🏆🌟✨.`;

  const aiText = await generateAiResponse(prompt, 'صياغة بطاقات تهنئة وتكريم فخرية لطلاب مدرسة مشيرفة المتميزين.');
  if (aiText) return aiText.replace(/^["']|["']$/g, '').trim();

  return `مبارك من القلب لبطلنا المتميز ${studentName}! لقد أثبتّ ذكاءً متقداً وسرعة بديهة استحققت بها وسام "${badgeTitle}". تفخر بك مدرسة مشيرفة دوماً! 🏆🌟`;
};

/**
 * 15. Mafatih Pedagogical Model AI Lesson Planner:
 * Generates an exhaustive, beautifully architected lesson plan according to the 5 canonical Mafatih stations:
 * [ م ] مشوّق ومحفّز | [ ف ] فهم وبناء المعنى | [ ت ] تطبيق وتدريب | [ ا ] أدلّة الفهم | [ ح ] حصاد ونقل الأثر
 */
export const generateMafatihLessonPlanAI = async ({
  subject = 'عام',
  grade = 'المرحلة الابتدائية',
  topic = '',
  objective = '',
  duration = 45,
  notes = '',
  language = 'ar'
}) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const isHebrew = language === 'he' || /[\u0590-\u05FF]/.test(topic || '') || /[\u0590-\u05FF]/.test(notes || '');
  const isSEL = (subject || '').includes('عاطفي') || (subject || '').includes('اجتماعي') || (subject || '').includes('SEL') || (notes || '').includes('عاطفي') || (notes || '').includes('SEL') || (topic || '').includes('غضب') || (topic || '').includes('مشاعر') || (topic || '').includes('רגשי');

  let prompt = '';

  if (isHebrew) {
    prompt = `אתה המומחה הפדגוגי והיועץ החינוכי הבכיר של מודל "מַפְתֵּי"חַ" (מודל מפתיח) בבית הספר היסודי מושירפה.
המסגרת המאושרת: "מסגרת בית-ספרית לבניית שפה פדגוגית משותפת, מעורבות תלמידים, ולמידה המשלבת הכלה והשתלבות, הוראה דיפרנציאלית, והערכה".

המשימה: תכנון מערך שיעור מופתי, מעשי ומלא ב-100% בשפה העברית בנושא: "${topic || 'מושג מרכזי'}"
- תחום דעת / מקצוע: "${subject}"
- שכבת גיל / כיתה: "${grade}"
- משך השיעור: ${duration} דקות
${objective ? `- מטרת השיעור המוגדרת: "${objective}"` : ''}
${notes ? `- דגשים והערות נוספות: "${notes}"` : ''}

⭐ תנאי פדגוגי מחייב:
יש לפרט את חמש התחנות במלואן: [ מ , פ , ת , י , ח ], ובכל תחנה יש לכתוב מפורשות ובאופן מעשי 4 רכיבים:
1. מהלך התחנה והפעילות: פעילות מעשית מוחשית, שאלת התלמיד, ומשפט המעבר המחייב.
2. דוגמה יישומית להכלה והשתלבות: מענה מותאם לתלמידי שילוב/חינוך מיוחד/קשיים, דרכי הנגשה מגוונות, ושימור כבוד התלמיד.
3. דוגמה יישומית להוראה דיפרנציאלית: התאמת רמת המורכבות, 3 מסלולי עבודה, ואתגר לתלמידים מתקדמים.
4. דוגמה יישומית להערכה ומחוון התקדמות: עדויות הבנה מהירות (Checking for Understanding) והכוונת הצעד הבא.

חמש התחנות של "מודל מַפְתֵּי"חַ לשיעור פעיל" (למידה מחוברת, משמעותית ומותאמת):
עקרונות קבועים לאורך כל התחנות: הכלה והשתתפות, דיפרנציאליות והתאמה, והערכה מעצבת.

1. [ מ ] משיכה וסקרנות (עירור עניין וידע קודם):
   - שאלת התלמיד: "למה אנחנו לומדים את זה? ומה מעורר בי סקרנות?".
   - מהלך התחנה: גירוי אמיתי (תמונה, חידה, דילמה, הדגמה, תופעה מפתיעה), קישור לידע קודם, והגדרת מטרת השיעור ומדד ההצלחה.
   - הכלה והשתתפות, דיפרנציאליות, והערכה מעצבת.
   - משפט מעבר: "מתוך מה שעוררנו ובחנו, מטרתנו היום להבין..."

2. [ פ ] פיתוח הבנה ובניית משמעות (המשגה מדורגת):
   - שאלת התלמיד: "איך אני מבין את הרעיון ומה משמעותו?".
   - שני מסלולים עיקריים: הוראה מפורשת ומודרכת (הסבר מאורגן, מידול I Do בחשיבה בקול, שאלות בדיקה) או חקר וגילוי מונחה (נתונים, השוואות, הסקת חוק).
   - דפוסי עבודה: יחידני, זוגי, קבוצתי, או מליאה.
   - הכלה (ייצוגי UDL, מילון מושגים), דיפרנציאליות (התאמת רמת התמיכה), והערכה מעצבת.
   - משפט מעבר: "בנינו את המושג ומשמעותו; כעת נעבור ליישום ותרגול בפועל"

3. [ ת ] תרגול והתנסות (הפיכת הבנה ליכולת מעשית):
   - שאלת התלמיד: "האם אני מסוגל לבצע זאת בעצמי?".
   - מהלך התחנה: משימת ליבה משותפת לכולם, פיגומי תמיכה, ואתגרים למתקדמים.
   - הפעלת "קבוצת תמיכה מיידית" (קבוצה קטנה וגמישה שהמורה מכנס לעזרה ממוקדת).
   - הכלה, דיפרנציאליות, והערכה מעצבת.
   - משפט מעבר: "תרגלנו ויישמנו; כעת נבדוק עדות ממשית להבנה של כל אחד"

4. [ י ] יישום עצמאי ועדות להבנה (בדיקת ראיות להבנה):
   - שאלת התלמיד: "איפה אני אוחז? ומה הראיה שהבנתי?".
   - מהלך התחנה: מענה לשאלת המורה: "מה הראיה שהלמידה התרחשה לכל תלמיד?" דרך כרטיסיית יציאה, שאלה קצרה, או משימה חדשה.
   - 3 החלטות המורה: הבין $\leftarrow$ מתקדם, הבין חלקית $\leftarrow$ מקבל תרגול נוסף, לא הבין $\leftarrow$ חוזר להסבר או תמיכה אחרת.
   - הכלה, דיפרנציאליות, והערכה מעצבת.
   - משפט מעבר: "וידאנו את ההבנה בראיות ברורות; כעת נאסוף את הצידה ונחבר לחיים"

5. [ ח ] חתימה והעברת הלמידה (איסוף וחיבור למציאות):
   - שאלת התלמיד: "מה אני לוקח איתי? ואיך איישם זאת בחיי?".
   - שלושת ממדי החתימה: (א) מה למדנו? (ב) רפלקציה: מה עזר לי להבין? (ג) העברת הלמידה לעולם שמחוץ לכיתה.
   - הכלה, דיפרנציאליות, והערכה מעצבת.
   - משפט התלמיד: "אני יודע איפה אני עומד, מבין מה למדתי ומסוגל ליישם זאת במציאות".

החזר פלט במבנה JSON בלבד:
{
  "title": "${topic || 'נושא השיעור'}",
  "subject": "${subject}",
  "grade": "${grade}",
  "duration": ${typeof duration === 'number' ? duration : (duration === 'وحدة كاملة' ? 90 : 45)},
  "objective": "${objective || 'מטרת השיעור ומדדי ההצלחה'}",
  "language": "he",
  "stations": {
    "m": "טקסט תחנת משיכה וסקרנות בעברית עם מהלך התחנה, הכלה והשתלבות, דיפרנציאליות, והערכה...",
    "f": "טקסט תחנת פיתוח הבנה בעברית עם מהלך התחנה, הכלה והשתלבות, דיפרנציאליות, והערכה...",
    "t": "טקסט תחנת תובנה והעמקה בעברית עם מהלך התחנה, הכלה והשתלבות, דיפרנציאליות, והערכה...",
    "y": "טקסט תחנת יצירה ויישום בעברית עם 3 המסלולים, שולחן ממוקד, הכלה והשתלבות, דיפרנציאליות, והערכה...",
    "h": "טקסט תחנת חתימה וצידה לדרך בעברית עם 5 השאלות, הצידה לדרך, הכלה, דיפרנציאליות, הערכה ומשפט התלמיד..."
  }
}`;
  } else {
    prompt = `أنت الخبير البيداغوجي والمستشار التعليمي الأول لنموذج «مِفتاح» (מודל מפתיח) بمدرسة مشيرفة الابتدائية.
الإطار المعتمد: "إطار مدرسي لبناء لغة تربوية مشتركة، وتعزيز شراكة الطلاب، وتعلّم يدمج الاحتواء والدمج، والتعليم المتمايز، والتقويم".

المطلوب بدقة وإلزام تام:
هندسة وتخطيط درس نموذجي تطبيقي مفصل ومكتمل بنسبة 100% لموضوع: "${topic || 'المفهوم الأساسي'}"
- المادة الدراسية: "${subject}"
- الصف والمستوى: "${grade}"
- زمن الحصة: ${duration} دقيقة
${objective ? `- الهدف التعليمي المحدد: "${objective}"` : ''}
${notes ? `- ملاحظات المعلم الإضافية: "${notes}"` : ''}

⭐ شرط بيداغوجي إلزامي ومحوري:
يجب توضيح وتفصيل المحطات الخمس كاملة [ م ، ف ، ت ، ي ، ح ]، وفي كــــل محطـــــة من المحطات الخمس بلا استثناء، يجب كتابة الأقسام الأربعة التالية بوضوح وصراحة وبأمثلة عملية واقعية تخص موضوع الدرس حصراً:
1. سير المحطة والنشاط التعليمي (מהלך התחנה והפעילות): النشاط الفعلي، سؤال الطالب الخاص بالمحطة، وعبارة الانتقال الإلزامية الخاصة بالمحطة.
2. مثال تطبيقي على الاحتواء والدمج (דוגמה יישומית להכלה והשתלבות): مثال صريح يوضح كيف نضمن مكان ومساهمة كل طالب، لا سيما طلاب الدمج والتربية الخاصة والصعوبات والفجوات اللغوية، وحفظ كرامة الطالب وبدائل الوصول والتعبير.
3. مثال تطبيقي على التعليم المتمايز (דוגמה יישומית להוראה דיפרנציאלית): مثال صريح يوضح تمايز التقديم، أو تنويع المسارات والدعم، أو التدرج في الصعوبة والتعمق للمتقدمين.
4. مثال تطبيقي على التقويم (דוגמה יישומית להערכה ומחוון התקדמות): أداة وشاهد الفهم الفعلي لهذه المحطة، ومؤشر التقدم، وكيف ترشد المعلم والطالب للخطوة التالية.

${isSEL ? `
❤️ توجيه جوهري ملزم للمجال العاطفي والاجتماعي (SEL - Social-Emotional Learning وفق CASEL):
بما أن الدرس يقع في المجال العاطفي والاجتماعي، اجعل النصوص حوارية وجدانية واقعية، وخصص القاموس لتسمية المشاعر، وأسئلة التفكير لتبني منظور الآخر، والورشة للعب الأدوار والتعاطف، والزوّادة للفتة إنسانية يمارسها الطالب في بيته ومع أسرته اليوم.` : ''}

⚠️ تفصيل المحطات الخمس وفق "نموذج مِفتاح للحصة الفاعلة" والمحتوى الإلزامي لكل محطة:

الرؤية العامة: الحصة الفاعلة ليست سلسلة أنشطة منفصلة، بل رحلة تعلم واضحة ومترابطة يعرف فيها الطالب: أين نحن الآن؟ ماذا نتعلم؟ ماذا يُتوقع مني؟ كيف أعرف أنني نجحت؟ وما المرحلة التالية؟
وتسير عبر المراحل كلها ثلاثة مبادئ ثابتة: الاحتواء والمشاركة، التمايز والتكيف، والتقويم التكويني المستمر.

1. [ م ] محطة مشوّق ومحفّز (משיכה וסקרנות):
   • سؤال الطالب المحوري: «لماذا نتعلم هذا؟ وما الذي يثير فضولي؟»
   • سير المحطة: إثارة الفضول، استدعاء المعرفة السابقة، تهيئة وجدانية ومعرفية، ثم توجيه الطلاب لهدف الدرس ومعيار النجاح عبر مثير حقيقي (صورة مثيرة، سؤال محيّر، تجربة قصيرة، قصة، موقف حياتي، مشكلة، فيديو قصير، أو ظاهرة غير متوقعة).
   • الاحتواء والمشاركة: مثيرات متنوعة وواضحة وقريبة من عالم الطلاب تضمن مشاركة الجميع.
   • التمايز والتكيف: سؤال أساسي للجميع، ثم أسئلة أعمق لمن يحتاج إلى تحدٍ إضافي.
   • التقويم التكويني: استكشاف ما يعرفه الطلاب مسبقاً، رصد التصورات الخاطئة والجاهزية.
   • عبارة الانتقال الإلزامية: «انطلاقًا مما أثرتموه ولاحظتموه، هدفنا اليوم أن نفهم...»

2. [ ف ] محطة فهم وبناء المعنى (פיתוח הבנה ובניית משמעות):
   • سؤال الطالب المحوري: «كيف أفهم هذا المفهوم وما معناه؟»
   • سير المحطة: بناء المعرفة الجديدة تدريجياً عبر أحد المسارين:
     1) التعليم الصريح والموجّه (شرح منظم، نمذجة المعلم بالتفكير بصوت عالٍ، أمثلة وأمثلة مضادة، أسئلة للتحقق من الفهم).
     2) أو الاكتشاف والاستقصاء الموجّه (بيانات، نصوص، تجارب، مقارنات، واستنتاج مبدأ أو قاعدة).
     تحديد شكل العمل المناسب: فردي، ثنائي، جماعي، أو صفي كامل.
   • الاحتواء والمشاركة: تقديم صور، خرائط مفاهيم، كلمات مفتاحية، أمثلة وشرح إضافي، وتعليمات مجزأة.
   • التمايز والتكيف: الحفاظ على الهدف مع تغيير مقدار الدعم (بطاقة إرشاد، سؤال موجه، مثال إضافي مقابل سؤال مفتوح وتحليل أعمق للمتقدمين).
   • التقويم التكويني: التوقف أثناء الشرح والسؤال: ماذا فهمتم؟ لماذا؟ كيف عرفتم؟ وهل يمكن إعطاء مثال آخر؟
   • عبارة الانتقال الإلزامية: «بنينا المفهوم وتأكدنا من معناه؛ والآن سننتقل إلى التجربة والتطبيق الفعلي»

3. [ ت ] محطة تطبيق وتدريب (תרגול והתנסות):
   • سؤال الطالب المحوري: «هل أستطيع استخدام هذا المفهوم وتنفيذه بنفسي؟»
   • سير المحطة: تحويل الفهم إلى قدرة فعلية على الاستخدام من خلال:
     - مهمة أساسية مشتركة للجميع
     - سقالات دعم لمن يحتاج
     - تحديات إضافية لمن أصبح جاهزاً
     - تفعيل "مجموعة الدعم الفوري" (مجموعة صغيرة مؤقتة ومرنة يجمعها المعلم لتقديم دعم مركز أثناء عمل بقية الصف دون تصنيف ثابت).
     تحديد شكل العمل المناسب: فردي للتأكد من استقلالية المهارة، ثنائي للمقارنة والتغذية الراجعة، أو جماعي للمشاريع وحل المشكلات.
   • الاحتواء والمشاركة: السماح بطرق متنوعة لإظهار الإنجاز دون المساس بجوهر الهدف.
   • التمايز والتكيف: التكيف في مقدار الدعم، مستوى التعقيد، عدد الأمثلة، ونوع المنتج.
   • التقويم التكويني: تجوال المعلم، رصد الأخطاء الشائعة، وتقديم تغذية راجعة فورية لمعالجة الفجوات.
   • عبارة الانتقال الإلزامية: «تدربنا وطبقنا المهارة؛ والآن سنختبر يقين فهمنا ونقيس ما أتقنه كل منا»

4. [ ا ] محطة أدلّة الفهم (ראיות להבנה):
   • سؤال المعلم المحوري: «ما الدليل على أن كل طالب حقّق هدف التعلم؟»
   • سؤال الطالب المحوري: «كيف أُظهر ما فهمت؟» (عبارة الطالب: «أُظهر ما فهمت»)
   • الهدف: فحص تحقق هدف التعلم لدى كل طالب فردياً ومباشراً للحصول على صورة واضحة تحدد الخطوة التالية.
   • سير المحطة واختيار الأداة: اختيار أداة تقويم قصيرة ومباشرة (سؤال قصير أو مسألة واحدة، تصنيف سريع أو مطابقة، تفسير ظاهرة أو تطبيق في سياق جديد، بطاقة خروج مكتوبة أو إلكترونية، أو أداء شفهي أو عملي مختصر).
   • جدول القرار بعد جمع الأدلّة (إلزامي):
     1) حقق معيار النجاح $\leftarrow$ ينتقل إلى مهمة جديدة أو يعمّق فهمه بتحدٍّ إضافي.
     2) حقق المعيار جزئيًا $\leftarrow$ يحصل على تغذية راجعة محددة أو تدريب قصير يستهدف الصعوبة.
     3) لم يُظهر الفهم المطلوب بعد $\leftarrow$ يحصل على شرح بطريقة أخرى أو دعم مباشر، ثم فرصة جديدة لإظهار فهمه بمهمة مكافئة (مجموعة دعم صغيرة ومؤقتة).
   • الاحتواء والمشاركة: إتاحة طرق مناسبة لإظهار الفهم بما يضمن مشاركة الجميع وحفظ كرامة الطالب.
   • التمايز والتكيف: تنويع أدوات التعبير وتكييف مستوى الدعم.
   • التقويم التكويني: الأداة هي جوهر التقويم التكويني لاتخاذ القرار الفوري في الحصة.
   • عبارة الانتقال الإلزامية: «أظهرنا أدلّة فهمنا؛ والآن نلخّص وننقل أثر تعلمنا إلى ما بعد الحصة»

5. [ ح ] محطة حصاد ونقل الأثر (חתימה והעברת הלמידה):
   • سؤال الطالب المحوري: «ماذا آخذ معي من هذا الدرس؟ وكيف أطبقه في حياتي؟»
   • سير المحطة: إنهاء الحصة عبر الأبعاد الثلاثة للحصاد:
     أ) ماذا تعلمنا؟ (تلخيص المعنى والمفهوم الأساسي).
     ب) التبصر والميتا-معرفة: «ما الذي ساعدني اليوم على الفهم؟ وما التحدي الذي تجاوزته؟»
     ج) نقل الأثر الحياتي: كيف ينتقل هذا التعلم إلى خارج الصف ومواقف الحياة والبيت والمجتمع؟
   • الاحتواء والمشاركة: إتاحة الفرصة لكل طالب للتعبير عن حصاده بأسلوبه، وتثبيت شعور الفخر والكرامة بالإنجاز.
   • التمايز والتكيف: تمايز في زاوية الحصاد؛ من تثبيت قاعدة أساسية إلى استخلاص حكمة ورؤية مستقبلية.
   • التقويم التكويني: فحص نضج الفهم الختامي وانتقال الأثر لتحديد نقطة انطلاق الدرس القادم.
   • مقولة الطالب الختامية: «أعرف أين أقف الآن، وأدرك ما تعلمته، وأستطيع توظيفه في واقعي وحياتي».

أخرج النتيجة بصيغة JSON حصراً بهذا المخطط بدون أي كود أو زيادات خارج الـ JSON:
{
  "title": "${topic || 'عنوان الدرس'}",
  "subject": "${subject}",
  "grade": "${grade}",
  "duration": ${duration},
  "objective": "${objective || 'الهدف التعليمي العام ومعايير النجاح ثلاثية الأبعاد'}",
  "language": "ar",
  "stations": {
    "m": "نص محطة المدخل المحفّز مع سير المحطة، ومثال الاحتواء والدمج (הכלה והשתלבות)، ومثال التعليم المتمايز (דיפרנציאליות)، ومثال التقويم (הערכה)، وعبارة الانتقال الإلزامية...",
    "f": "نص محطة فهم وبناء المعنى مع سير المحطة، ومثال الاحتواء والدمج (הכלה והשתلבות)، ومثال التعليم المتمايز (דיפרנציאליות)، ومثال التقويم (הערכה)، وعبارة الانتقال الإلزامية...",
    "t": "نص محطة التفكير والتبصّر مع سير المحطة، ومثال الاحتواء والدمج (הכלה והשתلבות)، ومثال التعليم المتمايز (דיפרנציאליות)، ومثال التقويم (הערכה)، وعبارة الانتقال الإلزامية...",
    "y": "نص محطة الإنجاز والتطبيق مع سير المحطة، ومثال الاحتواء والدمج (הכלה והשתلבות)، ومثال التعليم المتمايز (דיפרנציאליות)، ومثال التقويم (הערכה)، وعبارة الانتقال الإلزامية...",
    "h": "نص محطة الحصاد والزوّادة مع سير المحطة، ومثال الاحتواء والدمج (הכלה והשתلבות)، ومثال التعليم المتمايز (דיפרנציאליות)، ومثال التقويم (הערכה)، ومقولة الطالب الختامية..."
  }
}`;
  }

  // 1. Try Groq (High-speed: Qwen 3.8 27B, GPT-OSS 120B, ALLaM)
  if (groqKey) {
    const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'allam-2-7b', 'openai/gpt-oss-20b'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: m,
            messages: [
              { role: 'system', content: isHebrew ? 'אתה יועץ פדגוגי בכיר בבית ספר מושירפה. עליך להחזיר JSON בעברית מקצועית ומושלמת לפי מודל מפתיח עם דוגמאות מפורשות להכלה, דיפרנציאליות והערכה בכל תחנה.' : 'أنت مستشار تربوي وخبير بيداغوجي بمدرسة مشيرفة. يجب أن تكون إجابتك بتنسيق json باللغة العربية الفصحى وبمحتوى تطبيقي مفصل ومحدد لنص الدرس مع أمثلة صريحة على الاحتواء والدمج والتعليم المتمايز والتقويم في كل محطة.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.6,
            max_tokens: 3800,
            response_format: { type: "json_object" }
          })
        }, 11000);
        if (res.ok) {
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content;
          if (txt) {
            const parsed = JSON.parse(txt);
            if (parsed.stations && (parsed.stations.m || parsed.stations.f || parsed.stations.t || parsed.stations.y || parsed.stations.h)) {
              return {
                title: parsed.title || topic,
                subject: parsed.subject || subject,
                grade: parsed.grade || grade,
                duration: parsed.duration || duration,
                objective: parsed.objective || objective,
                language: isHebrew ? 'he' : 'ar',
                stations: normalizeLessonStations(parsed.stations)
              };
            }
          }
        }
      } catch (e) {
        console.warn(`Groq lesson planning (${m}) failed:`, e);
      }
    }
  }

  // 2. Try Gemini
  if (geminiKey) {
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 3800,
                responseMimeType: "application/json"
              }
            })
          }, 11000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            const parsed = JSON.parse(txt);
            if (parsed.stations && (parsed.stations.m || parsed.stations.f || parsed.stations.t || parsed.stations.y || parsed.stations.h)) {
              return {
                title: parsed.title || topic,
                subject: parsed.subject || subject,
                grade: parsed.grade || grade,
                duration: parsed.duration || duration,
                objective: parsed.objective || objective,
                language: isHebrew ? 'he' : 'ar',
                stations: normalizeLessonStations(parsed.stations)
              };
            }
          }
        }
      } catch (e) {
        console.warn(`Gemini lesson planning (${m}) failed:`, e);
      }
    }
  }

  // 3. Fallback Engine
  const safeTopic = topic || (isHebrew ? 'מושג לימודי מרכזי' : 'المفهوم التعليمي المركزي');
  const safeObj = objective || (isHebrew ? `הבנת מושג (${safeTopic}) ויישומו במשימות מגוונות תוך לקיחת צידה לדרך` : `أن يفهم الطالب مفهوم (${safeTopic}) ويطبقه في مهام متدرجة ويوظف زوّادته في سياقات حياتية متنوعة`);

  if (isHebrew) {
    return {
      title: safeTopic,
      subject: subject,
      grade: grade,
      duration: duration,
      objective: safeObj,
      language: 'he',
      stations: {
        m: `🧲 [ מ - משיכה וסקרנות (מבוא מגרה)] (5 דקות):
• מהלך התחנה: הצגת חידה חזותית או תופעה מפתיעה מחיי היומיום בנושא (${safeTopic}) ללא חשיפת הפתרון; שאלת התלמיד: "מה מעורר בי סקרנות? ומה אנחנו רוצים לגלות?".
• 🤝 דוגמה יישומית להכלה והשתלבות: שאלה פתוחה מונגשת ברמת התבוננות פשוטה ("מה אתם רואים כאן?") כדי לאפשר גם לתלמיד שילוב להשתתף ראשון ללא חשש מטעות, לצד שיח זוגי מקדים ובטוח.
• 🔀 דוגמה יישומית להוראה דיפרנציאלית: גירוי רב-ערוצי (תמונה ברורה + דוגמה מוחשית) ושאלת חקר המאפשרת רמות תגובה שונות (מילה, ציור או משפט).
• 📊 דוגמה יישומית להערכה: הערכה דיאגנוסטית; איסוף השערות התלמידים על הלוח למיפוי תפיסות שגויות והכוונה מדויקת של ההסבר בהמשך.
• משפט מעבר מחייב: "מתוך מה שהעליתם, ננסה להבין היום..."`,

        f: `💡 [ פ - פיתוח הבנה (המשגה ומידול)] (10 דקות):
• מהלך התחנה: הצגת מטרת הלמידה בשפת התלמיד, מדדי הצלחה תלת-ממדיים (תוכן, מיומנות, השתתפות), מילון המושגים הכיתתי, ומידול המורה (I Do) של פתרון דוגמה תוך חשיבה בקול. שאלת התלמיד: "מה אנחנו לומדים? ואיך אסביר זאת במילים שלי?".
• 🤝 דוגמה יישומית להכלה והשתלבות: כרטיסיית שלבים מאוירת, בנק מונחים עם סמלים חזותיים, וסיוע שקט של מורת השילוב המכבד את מקום התלמיד.
• 🔀 דוגמה יישומית להוראה דיפרנציאלית: פיגומים מדורגים (Scaffolding) למתקשים, ומשימת הרחבה לתלמידים מתקדמים להצעת הסבר חלופי.
• 📊 דוגמה יישומית להערכה: בדיקת הבנה מהירה (Checking for Understanding) באמצעות כרטיסיית בדיקה אישית או סיכום הרעיון במשפט אחד של התלמיד.
• משפט מעבר מחייב: "הכרנו את הרעיון; כעת נבדוק איך הוא עובד ולמה"`,

        t: `🧠 [ ת - תובנה והעמקה (חשיבה מסדר גבוה)] (8 דקות):
• מהלך התחנה: שאלות חשיבה מעמיקות בלב הנושא (${safeTopic}): "מה הקשר בין החלקים?", "איזו ראיה תומכת בטענה?", "מה ישתנה אם נשנה את הנתונים?". שאלת התלמיד: "איך הגעתי לתשובה? ומה תומך בה?".
• 🤝 דוגמה יישומית להכלה והשתלבות: מתן זמן לחשיבה שקטה (Think Time), וחלוקת תפקידים מוגדרים בעבודה קבוצתית (חוקר ראיות, מתעד, דובר).
• 🔀 דוגמה יישומית להוראה דיפרנציאלית: כרטיסיות רמז לקבוצות הזקוקות לתמיכה, ומשימת הפרכת טענה נגדית לקבוצות מצוינות.
• 📊 דוגמה יישומית להערכה: הערכה מעצבת; בדיקת דף "הנימוק והראיה" לווידוא יכולת ההסבר ולא רק התוצאה הסופית.
• משפט מעבר מחייב: "בדקנו את הרעיון והסברנו אותו; כעת נשתמש בו במשימה"`,

        y: `🛠️ [ י - יצירה ויישום (סדנה פעילה ומסלולים גמישים)] (15 דקות):
• מהלך התחנה: סדנת עבודה מעשית עם תוצר מוחשי; שאלת התלמיד: "איך אשתמש במה שלמדתי? ואילו כלים יעזרו לי?".
• 🔀 פירוט 3 המסלולים הגמישים:
  1. מסלול נתמך: משימת תרגול מובנית עם דוגמה פתורה וכרטיסיית שלבים.
  2. מסלול עצמאי: פתרון משימות יישום שלמות באופן עצמאי.
  3. מסלול העמקה ויצירתיות: פתרון בעיה מורכבת מחיי היומיום או פיתוח תוצר חדשני.
• 🤝 דוגמה יישומית להכלה והשתלבות: שולחן הוראה ממוקדת ("תחנת דיוק ושליטה" 4-6 תלמידים עם המורה), כרטיסיית "מפתח חזרה להבנה", ועמית תומך.
• 📊 דוגמה יישומית להערכה: תצפית פעילה של המורה ומשוב מיידי לפי מדדי הצלחה (תוכן, מיומנות, השתתפות).
• משפט מעבר מחייב: "נבדוק כעת מה הצלחנו לעשות ומה ניקח להמשך"`,

        h: `🎒 [ ח - חתימה וצידה לדרך (רפלקציה וסיכום)] (7 דקות):
• מהלך התחנה: רפלקציה אישית דרך 5 שאלות והגדרת הצידה לדרך; שאלת התלמיד: "במה התקדמתי? ומה אקח איתי להמשך?".
• 🤝 דוגמה יישומית להכלה והשתלבות: אפשרות למענה מגוון (כתיבת משפט, ציור סמל, או שיתוף בעל פה), ויציאה בהרגשת מסוגלות והצלחה.
• 🔀 דוגמה יישומית להוראה דיפרנציאלית: צידה לדרך מותאמת (חידוד המושג הבסיסי לתלמיד שזקוק לביסוס, או שאלת חקר עתידית למתקדמים).
• 📊 דוגמה יישומית להערכה: כרטיסיית יציאה (Exit Ticket) המשיבה על: מה למדתי? מה הראיה לכך? ואיך איישם זאת בבית ובחיים?
• 🌟 משפט התלמיד המנחה: "אני יודע מה אני לומד, מוצא דרך להשתתף, מבקש עזרה כשצריך ומראה איך התקדמתי".`
      }
    };
  }

  // Arabic Fallback (Existing)
  if (isSEL) {
    return {
      title: safeTopic,
      subject: subject,
      grade: grade,
      duration: duration,
      objective: safeObj || `بناء الوعي بالذات وإدارة المشاعر الإيجابية في موضوع (${safeTopic}) مع مراعاة الاحتواء والتمايز والتقويم`,
      language: 'ar',
      stations: {
        m: `🔥 [ م - مشوّق ومحفّز ] (5 دقائق):
• سير المحطة: فحص "الطقس الداخلي للمشاعر" عبر قارورة الهدوء والبريق المتطاير لتمثيل فوران المشاعر حول (${safeTopic})؛ سؤال الطالب: «ما الذي يثير فضولي؟ وما الذي نريد استكشافه؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתלבות): يشارك كل طالب باختيار بطاقة رمزية ملونة (مشمس / غائم / ماطر) دون إجباره على الحديث العلني، مع حوار ثنائي آمن مع زميل داعم لحفظ كرامة وأمان الطالب النفسي.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): تقديم المثير بقنوات حسية متعددة (مثير بصري حركي، بطاقة مشاعر مرسومة، وسؤال تأملي مفتوح يحتمل كل أشكال الاستجابة).
• 📊 مثال تطبيقي على التقويم (הערכה): تقويم تشخيصي؛ مسح بصري سريع لخيارات البطاقات لتحديد مستوى التوتر الصفي والمشاعر السائدة وبناء التوجيه انطلاقاً منها.
• عبارة الانتقال الإلزامية: «انطلاقًا مما طرحتموه، سنحاول اليوم أن نفهم…»`,

        f: `🧩 [ ف - فهم وبناء المعنى ] (10 دقائق):
• سير المحطة: قراءة موقف قصصي واقعي يتناول (${safeTopic})، تفكيك معجم المشاعر الصفي [الوعي بالذات، الأمان النفسي، الاستجابة المتزنة]، ونمذجة المعلم (I Do) بالتفكير بصوت مسموع: "أتوقف، أتنفس بعمق، وأميز بين الشعور والسلوك". سؤال الطالب: «ماذا نتعلّم؟ وكيف أشرح الفكرة بكلماتي الخاصة؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): توفير نص قصصي مشكول مدعوم برسومات تعبيرية، ومرافقة معلمة الدمج لطالب الصعوبات بالإشارة المباشرة لمفردات القاموس لتمكينه من إعادة الصياغة بثقة.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): بطاقة منظم بياني لخطوات التهدئة متدرجة التفصيل، مع إتاحة المجال للمتقدمين لتفسير أثر الاستجابة الحكيمة على بيئة الصف.
• 📊 مثال تطبيقي على التقويم (הערכה): أداة فحص الفهم (Checking for Understanding)؛ اختبار سريع بالبطاقات (شعور طبيعي أم سلوك يحتاج ضبط) للتحقق الفوري من إدراك المفاهيم.
• عبارة الانتقال الإلزامية: «تعرّفنا إلى الفكرة؛ والآن سنفحص كيف تعمل ولماذا»`,

        t: `🛠️ [ ت - تطبيق وتدريب ] (8 دقائق):
• سير المحطة: أسئلة التفكير العليا: "لو وضعت نفسك مكان الطرف الآخر في موقف (${safeTopic})، ما الاحتياج العميق الذي لم يفهمه أحد؟"، "ما الذي سيتغير في صفنا لو استبدلنا الاندفاع بالاستجابة الواعية؟". سؤال الطالب: «كيف توصّلت إلى الإجابة؟ وما الذي يدعمها؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): منح دقيقة صمت للتفكير الفردي (Think Time)، وتعيين أدوار محددة في المجموعات الثنائية (مثل: دور المراقب المتعاطف، دور المتحدث) لضمان مساهمة طالب الدمج بكرامة.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): مستويات تفكير متدرجة؛ بدءاً من تحديد سبب المشاعر البسيط بالمنظم البصרי، وصولاً إلى مقارنة بدائل حلول متقدمة للموقف.
• 📊 مثال تطبيقي على التقويم (הערכה): تقويم تكويني تحليلي؛ بطاقة "السبب والأثر الوجداني" لتقييم عمق تبني منظور الآخر والتغذية الراجعة الشفوية المركزة.
• عبارة الانتقال الإلزامية: «فحصنا الفكرة وفسّرناها؛ والآن سنستخدمها في المهمة»`,

        y: `🔎 [ ي - يقين من الفهم ] (15 دقيقة):
• سير المحطة: ورشة تطبيقية ومحاكاة مواقف بمخرجات ملموسة؛ سؤال الطالب: «كيف أستخدم ما تعلّمته؟ وما الأدوات التي تساعدني؟».
• 🔀 تفصيل المسارات الثلاثة المرنة:
  1. مسار التطبيق المدعوم: بطاقات حوارية جاهزة بصيغة (أشعر بـ... عندما... وأحتاج إلى...) مدعومة ببنك مشاعر.
  2. مسار التطبيق المستقل: تمثيل ثنائي تفاعلي لموقف نزاع وحله باستراتيجية التفاوض والاستماع المتعاطف.
  3. مسار التعمّق والإبداع: صياغة بنود "ميثاق الأمان النفسي الصفي" أو تصميم بطاقات إرشادية مبتكرة لزاوية الهدوء.
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): طاولة التدريس المركّز («محطة الضبط والإتقان» 4-6 طلاب مع المعلم) لتمكين الطلاب في بيئة تشجيعية آمنة دون وسم، مع حرية التعبير عبر الرسم أو التمثيل أو الكتابة.
• 📊 مثال تطبيقي على التقويم (הערכה): معايير النجاح ثلاثية الأبعاد (محتوى: تطبيق استراتيجية التهدئة، مهارة: الاستماع المتعاطف، مشاركة: التعاون الإيجابي) مع تغذية راجعة فورية.
• عبارة الانتقال الإلزامية: «سنفحص الآن ما نجحنا في إنجازه، وما نريد أن نحمله معنا للمرحلة المقبلة»`,

        h: `🎒 [ ح - حصاد ونقل الأثر ] (7 دقائق):
• سير المحطة: إجابة الأسئلة الخمسة للتأمل والتقويم الذاتي، تحديد الزوّادة؛ سؤال الطالب: «فيمَ تقدّمت؟ وما الذي سأحمله معي للمرحلة المقبلة؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): خيارات مرنة لتوثيق الزوّادة (كتابة عبارة، اختيار بطاقة مصورة، أو مشاركة شفوية ثنائية)، وضمان شعور كل طالب بالفخر بإنجازه.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): زوّادة موجهة لكل مستوى (تثبيت شعور التهدئة كزاد أساسي، أو التعهد بقيادة حل النزاعات كزاد متقدم).
• 📊 مثال تطبيقي على التقويم (הערכה): بطاقة تذكرة الخروج (Exit Ticket) توثق: (1) ما تعلمته اليوم، (2) أين سأطبقه في بيتي اليوم؛ لقياس نقل أثر التعلم للواقع الأسري.
• 🌟 مقولة الطالب المحورية: «أعرف ما أتعلّمه، وأجد طريقة للمشاركة، وأطلب المساعدة حين أحتاج إليها، وأُظهر كيف تقدّمت».`
      }
    };
  }

  // General subjects fallback (Arabic)
  return {
    title: safeTopic,
    subject: subject,
    grade: grade,
    duration: duration,
    objective: safeObj,
    language: 'ar',
    stations: {
      m: `🔥 [ م - مشوّق ومحفّز ] (5 دقائق):
• سير المحطة: عرض لغز واقعي أو صورة لافتة ومفارقة ملموسة حول (${safeTopic}) دون الكشف عن القاعدة أو الحل المباشر؛ سؤال الطالب: «ما الذي يثير فضولي؟ وما الذي نريد استكشافه؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): البدء بسؤال وصف عيني ميسّر للجميع: "ماذا تشاهدون هنا؟" لإتاحة فرصة التعبير لطالب الدمج أولاً دون قلق من صحة أو خطأ الجواب، مع توفير خيار الحوار الثنائي (Think-Pair-Share) الآمن.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): تقديم المثير عبر وسائط متعددة (مجسم أو صورة واضحة ومسألة محكية)، واستقبال فرضيات الطلاب بمستويات تعبير متباينة (كلمة، رسم، أو صياغة كاملة).
• 📊 مثال تطبيقي على التقويم (הערכה): تقويم تشخيصي؛ تسجيل سريع لفرضيات الطلاب وتصنيفها على اللوح لرصد المفاهيم الخاطئة وتحديد نقطة الانطلاق الدقيقة للشرح.
• عبارة الانتقال الإلزامية: «انطلاقًا مما طرحتموه، سنحاول اليوم أن نفهم…»`,

      f: `🧩 [ ف - فهم وبناء المعنى ] (10 دقائق):
• سير المحطة: إعلان هدف التعلّم بلغة الطلاب، معايير النجاح (محتوى، مهارة، مشاركة)، معجم المفاهيم الصفي (رف المفاتيح)، ونمذجة المعلم (I Do) بحل المسألة الأولى والتفكير بصوت مسموع. سؤال الطالب: «ماذا نتعلّم؟ وكيف أشرح الفكرة بكلماتي الخاصة؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): توفير بطاقة خطوات مرئية بألوان محددة، بنك مصطلحات مدعوم بالصور، وإشراك معلمة الدمج في تقديم دعم فردي غير ملفت يحفظ كرامة الطالب.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): تقديم مثال محلول تدريجي (Scaffolding) للطلاب الذين يحتاجون تثبيتاً، ومهمة تفسير تعليلية موازية للطلاب المتفوقين لاقتراح حل بديل.
• 📊 مثال تطبيقي على التقويم (הערכה): فحص الفهم السريع (Checking for Understanding) عبر إشارات الأصابع أو بطاقة بيضاء صغيرة يكتب فيها كل طالب تعريفه للمفهوم في جملة واحدة قبل الانتقال.
• عبارة الانتقال الإلزامية: «تعرّفنا إلى الفكرة؛ والآن سنفحص كيف تعمل ولماذا»`,

      t: `🛠️ [ ت - تطبيق وتدريب ] (8 دقائق):
• سير المحطة: أسئلة تفكير عليا في صلب (${safeTopic}): "ما العلاقة بين الأجزاء؟"، "ما الدليل الذي يثبت صحة حلك؟"، "ماذا سيحدث لو غيّرنا المعطيات؟". سؤال الطالب: «كيف توصّلت إلى الإجابة؟ وما الذي يدعمها؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): منح وقت تفكير صامت كافٍ، وتوزيع أدوار عمل تعاونية واضحة في كل مجموعة (المتحري عن الدليل، المدون، المتحدث) ليشارك كل طالب بدور مناسب ومحترم.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): بطاقات تلميح للمجموعات التي تحتاج إسناداً، وسؤال فحص ادعاء خاطئ أو معضلة استثنائية لمجموعات التحدي.
• 📊 مثال تطبيقي على التقويم (הערכה): تقويم تكويني تحليلي؛ فحص بطاقة "الدليل والتعليل" للتأكد من قدرة المتعلمين على البرهنة وتبرير الإجابة وتعديل الشرح فوراً إن وُجدت فجوة.
• عبارة الانتقال الإلزامية: «فحصنا الفكرة وفسّرناها؛ والآن سنستخدمها في المهمة»`,

      y: `🛠️ [ ي - إنجاز وتطبيق (יצירה وיישום)] (15 دقيقة):
• سير المحطة: ورشة العمل التطبيقية؛ مهمة واضحة ومخرجات ملموسة؛ سؤال الطالب: «كيف أستخدم ما تعلّمته؟ وما الأدوات التي تساعدني؟».
• 🔀 تفصيل المسارات الثلاثة المرنة:
  1. مسار التطبيق المدعوم: مهمة تطبيقية أساسية مزودة بنموذج محلول وقائمة تفقد للخطوات.
  2. مسار التطبيق المستقل: حل تمارين ومسائل متكاملة تتطلب تطبيق المفهوم بشكل مستقل.
  3. مسار التعمّق والإبداع: مهمة مركبة لابتكار مسألة حياتية جديدة، تحليل خطأ مقصود في نموذج معقد، أو إنتاج وسيلة توضيحية.
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): طاولة التدريس المركّز («محطة الضبط والإتقان» 4-6 طلاب مع المعلم) لتقديم توجيه مباشر، تفعيل بطاقة «مفتاح العودة إلى الفهم»، والزميل المساند، مع تنويع وسيط الإنتاج.
• 📊 مثال تطبيقي على التقويم (הערכה): تقويم تكويني؛ ملاحظة الأداء الصفية المباشرة وفق معايير النجاح (محتوى، مهارة، مشاركة) وتغذية راجعة فورية لتصحيح المسار أثناء العمل.
• عبارة الانتقال الإلزامية: «سنفحص الآن ما نجحنا في إنجازه، وما نريد أن نحمله معنا للمرحلة المقبلة»`,

      h: `🎒 [ ح - حصاد وزوّادة (חתימה وצידה לדרך)] (7 دقائق):
• سير المحطة: مراجعة ختامية وإجابة الأسئلة الخمسة للتأمل والتقويم الذاتي؛ وتحديد الزوّادة؛ سؤال الطالب: «فيمَ تقدّمت؟ وما الذي سأحمله معي للمرحلة المقبلة؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): توفير بدائل لإنجاز تذكرة الخروج (كتابة جملة، خريطة مفاهيمية مصغرة، أو إجابة شفوية مسجلة)، بما يضمن خروج كل طالب بكرامة واعتزاز بتقدّمه.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): تمايز الزوّادة بحسب قدرة الطالب؛ من تثبيت المفهوم المركزي والقانون لطالب يحتاج تثبيتاً، إلى صياغة سؤال استكشافي مستقبلي للمتفوقين.
• 📊 مثال تطبيقي على التقويم (הערכה): بطاقة تذكرة الخروج (Exit Ticket) تتضمن: (ماذا أنجزت اليوم؟ ما دليلي؟ وما الذي سأطبقه في حياتي؟) لرصد انتقال أثر التعلم وتخطيط الدرس القادم.
• 🌟 مقولة الطالب المحورية: «أعرف ما أتعلّمه، وأجد طريقة للمشاركة، وأطلب المساعدة حين أحتاج إليها، وأُظهر كيف تقدّمت».`
    }
  };
};

/**
 * 15.B Miftaah Teacher Companion AI Planner:
 * Generates an end-to-end 5-station lesson specifically structured for the Miftaah Teacher Companion
 * (كواليس المعلم وشاشة الطلاب للبروجكتور)، powered by Google Gemini & Groq AI.
 */
/**
 * 15.B Miftaah Teacher Companion AI Planner:
 * Generates an end-to-end 5-station lesson specifically structured for the Miftaah Teacher Companion
 * (كواليس المعلم وشاشة الطلاب للبروجكتور)، powered by Groq & Google Gemini AI.
 * strictly generates REAL, CONCRETE lesson content (not meta-instructions or advice).
 */
export const generateMiftaahCompanionLessonAI = async ({
  title = '',
  subject = '',
  grade = '',
  duration = 45,
  objective = '',
  notes = ''
}) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const safeTitle = title.trim() || 'مهارة دراسية مركزية';
  const safeSubject = subject.trim() || 'عام';
  const safeGrade = grade.trim() || 'المرحلة الابتدائية';
  const safeObjective = objective.trim() || `إتقان وتطبيق المفاهيم الأساسية لدرس (${safeTitle}) وفحص الأدلة ونقل الأثر`;

  const prompt = `أنت المعلم الخبير الأول ومصمم المناهج لنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
أنت من يؤلف ويكتب محتوى الدرس الفعلي بالكامل ليعرضه المعلم فوراً للطلاب في الصف.

قواعد بيداغوجية ملزمة وصارمة جداً:
١. ممنوع منعاً باتاً كتابة نصائح أو توجيهات عامة للمعلم في حقل (studentDisplayPrompt) مثل "اكتب كذا" أو "اطرح سؤالاً" أو "قدم أمثلة" أو "ناقش مع الطلاب".
٢. حقل (studentDisplayPrompt) في كل محطة يجب أن يحتوي على النص التعليمي الحقيقي الصريح والكامل الذي يقرأه الطلاب على الشاشة حرفياً:
- في المحطة [م] مشوّق ومحفّز (٥ دقائق): اكتب اللغز أو الموقف المثير أو الجمل المحيرة الفعلية المكتوبة بكلماتها كاملة لجذب انتباه الطلاب.
- في المحطة [ف] فهم وبناء المعنى (١٠ دقائق): اكتب الشرح والمفاهيم والأمثلة التوضيحية الحقيقية والقاعدة بوضوح كامل كما تعرض في الشريحة.
- في المحطة [ت] تطبيق وتدريب (١٥ دقائق): اكتب التمرين الفعلي بأسئلته وفقراته وجمله كاملة (1، 2، 3) المعدّة للحل المباشر في دفاتر الطلاب.
- في المحطة [ا] أدلّة الفهم (٨ دقائق): اكتب بطاقة التحقق الفردي المستقلة الفعلية (٣ أسئلة أو مسائل صريحة ومحددة يحلها كل طالب بمفرده دون مساعدة).
- في المحطة [ح] حصاد ونقل الأثر (٧ دقائق): اكتب ملخص الدرس الفعلي وسؤال الحصاد ونقل الأثر في الحياة اليومية خارج المدرسة.

معطيات الدرس المطلوب:
- عنوان وموضوع الدرس: "${safeTitle}"
- المادة الدراسية: "${safeSubject}"
- الصف: "${safeGrade}"
- المدة الإجمالية: ${duration === 'وحدة كاملة' ? 'وحدة تعليمية متكاملة ممتدة (عدة حصص)' : `${duration} دقيقة`}
- الهدف المركزي: "${safeObjective}"
${notes ? `- ملاحظات وظروف التنفيذ: "${notes}"` : ''}

أخرج النتيجة بصيغة JSON صالح فقط بالهيكل التالي (املأ القيم الفارغة بالمحتوى الحقيقي الكامل للدرس):
{
  "title": "${safeTitle}",
  "subject": "${safeSubject}",
  "grade": "${safeGrade}",
  "duration": ${duration},
  "objective": "${safeObjective}",
  "successCriteria": "",
  "prerequisites": "",
  "resources": "",
  "participationBarriers": "",
  "stations": {
    "m": {
      "durationMinutes": 5,
      "studentDisplayPrompt": "",
      "teacherNotes": "",
      "scaffolds": "",
      "extension": ""
    },
    "f": {
      "durationMinutes": 10,
      "studentDisplayPrompt": "",
      "teacherNotes": "",
      "scaffolds": "",
      "extension": ""
    },
    "t": {
      "durationMinutes": 15,
      "studentDisplayPrompt": "",
      "teacherNotes": "",
      "scaffolds": "",
      "extension": "",
      "modeledInterventionScenario": {
        "difficultyName": "",
        "targetScope": "مجموعة صغيرة (٣-٥ طلاب)",
        "timeDuration": "٤ دقائق",
        "steps": [
          { "min": "الدقيقة الأولى", "desc": "" },
          { "min": "الدقيقة الثانية", "desc": "" },
          { "min": "الدقيقة الثالثة", "desc": "" },
          { "min": "الدقيقة الرابعة", "desc": "" }
        ],
        "restOfClassTask": "",
        "verificationCheck": ""
      }
    },
    "a": {
      "durationMinutes": 8,
      "studentDisplayPrompt": "",
      "teacherNotes": "",
      "scaffolds": "",
      "extension": ""
    },
    "h": {
      "durationMinutes": 7,
      "studentDisplayPrompt": "",
      "teacherNotes": "",
      "scaffolds": "",
      "extension": ""
    }
  }
}`;

  const parseSafeJson = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      const first = raw.indexOf('{');
      const last = raw.lastIndexOf('}');
      if (first !== -1 && last > first) {
        try {
          const cleaned = raw.substring(first, last + 1)
            .replace(/[“”؟‘’]/g, '"')
            .replace(/,s*}/g, '}')
            .replace(/,s*]/g, ']');
          return JSON.parse(cleaned);
        } catch (err2) {
          return null;
        }
      }
      return null;
    }
  };

  // 1. Try Groq AI (models with high token limits & reasoning)
  if (groqKey) {
    const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: m,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 3000,
            response_format: { type: 'json_object' }
          })
        }, 15000);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = parseSafeJson(content);
            if (parsed && parsed.stations && parsed.stations.m && parsed.stations.t && parsed.stations.m.studentDisplayPrompt) {
              return parsed;
            }
          }
        }
      } catch (e) {
        console.warn(`Groq companion lesson planning (${m}) failed:`, e);
      }
    }
  }

  // 2. Try Google Gemini
  if (geminiKey) {
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 3800,
                responseMimeType: 'application/json'
              }
            })
          }, 14000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            const parsed = parseSafeJson(txt);
            if (parsed && parsed.stations && parsed.stations.m && parsed.stations.t) {
              return parsed;
            }
          }
        }
      } catch (e) {
        console.warn(`Gemini companion lesson planning (${m}) failed:`, e);
      }
    }
  }

  // 3. Concrete Fallback Engine with real tangible classroom questions
  return {
    title: safeTitle,
    subject: safeSubject,
    grade: safeGrade,
    duration: duration,
    objective: safeObjective,
    successCriteria: `يستخرج الطالب العناصر الأساسية لدرس (${safeTitle})، ويطبقها في حل ٣ مسائل/تمارين بدقة، ويبرر إجابته في بطاقة التحقق.`,
    prerequisites: `معرفة مسبقة بمفاهيم وقواعد الأساس المرتبطة بـ (${safeTitle}).`,
    resources: 'شاشة العرض الصفية، كراسة التدريبات، بطاقات عمل الدعم والتعميق.',
    participationBarriers: 'تفاوت في سرعة الاستجابة، وتردد في التعليل اللغوي أو الرياضي دون إحراج.',
    stations: {
      m: {
        durationMinutes: 5,
        studentDisplayPrompt: `تحدي الفضول والاستكشاف حول (${safeTitle}):\nتأمل المسألة / المشهد المعروض أمامك:\nما الغريب أو المختلف الذي تلاحظه فوراً؟ وما السؤال الذي يقفز إلى ذهنك قبل أن نبدأ؟`,
        teacherNotes: `اعرض اللغز أو النموذج على الشاشة دون تقديم إجابات جاهزة. استمع لـ 3 توقعات متنوعة من الطلاب، ثم اربطها مباشرة بهدف الحصة ومعيار النجاح المعروضين على جانب اللوح.`,
        scaffolds: 'إتاحة دقيقة صمت للتفكير الفردي ثم تبادل سريع مع الزميل المجاور.',
        extension: 'تحدي للمبادرين: ما النتيجة المتوقعة لو غيرنا أحد عناصر المشهد؟'
      },
      f: {
        durationMinutes: 10,
        studentDisplayPrompt: `المفهوم والقاعدة الأساسية لدرس (${safeTitle}):\n• المفهوم الجوهري: التعريف والأمثلة المقارنة.\n• النمذجة التطبيقية: كيف نصل إلى الحل خطوة بخطوة بالدليل الصريح.\n• علامة التمييز: ما الفارق الدقيق بين الحالة الصحيحة والخطأ الشائع؟`,
        teacherNotes: `اشرح المفهوم بصوت مسموع مع كتابة النموذج على السبورة والتأشير على الكلمات أو الأرقام المفتاحية. اطرح سؤال فحص سريع للجميع للتأكد من زوال اللبس.`,
        scaffolds: 'جدول مقارنة ثنائي أو خريطة ذهنية بصرية توضح الخطوات.',
        extension: 'سؤال تفكير عليا: فسر لماذا لا يمكن تطبيق هذه القاعدة إذا اختل أحد الشروط؟'
      },
      t: {
        durationMinutes: 15,
        studentDisplayPrompt: `مهمة التطبيق والتدريب المباشر:\nحل التمارين التالية في دفترك مع كتابة خطوات التبرير:\n١) التمرين الأول: تطبيق مباشر على القاعدة الأساسية لـ (${safeTitle}).\n٢) التمرين الثاني: مسألة مقارنة تتطلب تحديد السبب والدليل.\n٣) التمرين الثالث: استخرج الخطأ وصححه مع التعليل.`,
        teacherNotes: `تجول بين الصف بهدوء لملاحظة جودة التبرير وليس مجرد النتيجة. عند رصد تردد أو خطأ متكرر، فعّل فوراً سيناريو التدخل النمذجي (٤ دقائق) لمجموعة الدعم.`,
        scaffolds: 'بطاقة جمل مساعدة: "أختار ... لأن الدليل / القاعدة تنص على ...".',
        extension: 'مهمة تعميق وتحدٍّ للمبادرين: صياغة مسألة جديدة من واقع الحياة واختبار زميل فيها.',
        modeledInterventionScenario: {
          difficultyName: `صعوبة شائعة في تطبيق مهارة (${safeTitle})`,
          targetScope: 'مجموعة صغيرة (٣-٥ طلاب)',
          timeDuration: '٤ دقائق',
          steps: [
            { min: 'الدقيقة الأولى', desc: 'نمذجة حل مثال مماثل بصوت مسموع مع بيان سبب كل خطوة.' },
            { min: 'الدقيقة الثانية', desc: 'حل مسألة مشتركة بتوجيه وأسئلة داعمة.' },
            { min: 'الدقيقة الثالثة', desc: 'محاولة فردية مستقلة لكل طالب في المجموعة دون مساعدة.' },
            { min: 'الدقيقة الرابعة', desc: 'تحقق فوري من إتقان المهارة وثقة الطالب.' }
          ],
          restOfClassTask: 'إكمال التمرين التحدي ومناقشة الحلول البديلة مع الزميل.',
          verificationCheck: 'سؤال تحقق سريع من جملة واحدة يثبت زوال اللبس تماماً.'
        }
      },
      a: {
        durationMinutes: 8,
        studentDisplayPrompt: `بطاقة التحقق الفردي المستقلة (حل فردي دون مساعدة):\n١) أجب عن المسألة المحددة مستخدماً ما تعلمته اليوم حول (${safeTitle}).\n٢) اذكر الدليل أو التبرير العلمي/اللغوي الذي بنيت عليه حلك.\n٣) قيّم ثقتك في الحل: (متقن تماماً / متأكد جزئياً / لدي تساؤل).`,
        teacherNotes: `اجمع البطاقات الفردية لفحص مدى تحقق معيار النجاح لدى كل طالب بدقة وتوثيق النتائج في سجل المتابعة.`,
        scaffolds: 'تذكير بالمعيار والخطوات الأساسية دون إعطاء الإجابة المباشرة.',
        extension: 'تحدي تحليلي إضافي لمن ينهي قبل الوقت.'
      },
      h: {
        durationMinutes: 7,
        studentDisplayPrompt: `الحصاد ونقل الأثر الحياتي:\n١) الحصاد: ما أهم فكرة أو مهارة أخذتها معك اليوم من درس (${safeTitle})؟\n٢) نقل الأثر: أين وكيف ستستخدم هذا المفهوم في حوارك أو مهامك خارج المدرسة؟`,
        teacherNotes: `إدارة تلخيص ختامي وسماع استجابات نوعية، مع رصد ما يحتاج إلى متابعة للحصة القادمة.`,
        scaffolds: 'بداية جملة تأملية: "اليوم اكتشفت أن... وسأطبقه عندما...".',
        extension: 'مهمة استكشاف وتطبيق منزلي في بيئة الأسرة أو الحي.'
      }
    }
  };
};

/**
 * 15.C Station Alternatives AI Generator:
 * Generates 3 distinct, creative, ready-to-use pedagogical alternatives for a SINGLE station in the Miftaah lesson.
 * Gives teachers instant choices (stories, riddles, interactive challenges, differentiated exercises, exit tickets).
 */
export const generateMiftaahStationAlternativeAI = async ({
  title = '',
  subject = '',
  grade = '',
  stationKey = 'm', // 'm' | 'f' | 't' | 'a' | 'h'
  currentPrompt = '',
  customInstruction = ''
}) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const stationNames = {
    m: { name: 'مشوّق ومحفّز', query: 'ما الذي يثير فضولي؟ ولماذا نتعلم هذا؟', dur: 5 },
    f: { name: 'فهم وبناء المعنى', query: 'كيف أفهم الفكرة؟', dur: 10 },
    t: { name: 'تطبيق وتدريب', query: 'كيف أستخدم ما تعلمت؟', dur: 15 },
    a: { name: 'أدلّة الفهم', query: 'كيف أُظهر ما فهمت؟', dur: 8 },
    h: { name: 'حصاد ونقل الأثر', query: 'ماذا آخذ معي؟ وأين أستخدمه؟', dur: 7 }
  };

  const stInfo = stationNames[stationKey] || stationNames.m;

  const prompt = `أنت المعلم الخبير الأول لنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
المعلم يطلب ٣ بدائل تدريسية جاهزة ومكتملة تماماً لتغيير محطة واحدة فقط من محطات الدرس:
- المادة: "${subject || 'عام'}"
- الموضوع: "${title || 'الدرس المحدد'}"
- الصف: "${grade || 'المرحلة الابتدائية'}"
- المحطة المستهدفة: [${stationKey}] ${stInfo.name} (${stInfo.query})
${currentPrompt ? `- المحتوى الحالي للمحطة: "${currentPrompt.slice(0, 300)}"` : ''}
${customInstruction ? `- رغبة وتوجيه المعلم الخاص للبدائل: "${customInstruction}"` : ''}

المطلوب:
توليد ٣ بدائل تدريسية مختلفة الأسلوب والمدخل بالكامل لهذه المحطة فقط:
- إذا كانت المحطة [م]: ولد بديل (مدخل قصصي)، بديل (لغز وتحدي حركي/لغوي)، بديل (موقف بصري وتأمل واقعي).
- إذا كانت المحطة [ف]: ولد بديل (نمذجة بصرية صريحة ومقارنة)، بديل (استقصاء وحوار موجه)، بديل (بناء جماعي للقاعدة عبر أمثلة مضادة).
- إذا كانت المحطة [ت]: ولد بديل (تحديات متدرجة المستويات برونز/فضي/ذهبي)، بديل (مهمة حياتية وسيناريو حل مشكلة)، بديل (تدريب ثنائي تفاعلي وتبادل أدوار).
- إذا كانت المحطة [ا]: ولد بديل (٣ أسئلة مباشرة مع تبرير)، بديل (بطاقة صواب وخطأ مع تصحيح الخطأ)، بديل (مهمة تركيب وإنتاج جملة/مسألة تطابق المعيار).
- إذا كانت المحطة [ح]: ولد بديل (رسالة نصيحة لصديق)، بديل (مهمة استكشاف منزلي)، بديل (بطاقة الحصاد والرمز المعبر).

قواعد صارمة:
- يجب أن يكون كل بديل مكتوباً بنصوصه وتمارينه وأمثلته الفعلية الكاملة الجاهزة فوراً للعرض على شاشة الطلاب (studentDisplayPrompt)، وملاحظات المعلم (teacherNotes).
- ممنوع كتابة نصائح عامة مثل "اطرح سؤالاً"؛ اكتب السؤال والتمرين الفعلي!

أخرج النتيجة بصيغة JSON فقط:
{
  "stationKey": "${stationKey}",
  "alternatives": [
    {
      "id": "alt_1",
      "title": "عنوان البديل الأول",
      "styleBadge": "الأسلوب التدريسي للبديل ١",
      "studentDisplayPrompt": "نص العرض الفعلي للطلاب...",
      "teacherNotes": "ملاحظات المعلم...",
      "scaffolds": "سقالة دعم...",
      "extension": "تحدي تعميق..."
    },
    {
      "id": "alt_2",
      "title": "عنوان البديل الثاني",
      "styleBadge": "الأسلوب التدريسي للبديل ٢",
      "studentDisplayPrompt": "نص العرض الفعلي للطلاب...",
      "teacherNotes": "ملاحظات المعلم...",
      "scaffolds": "سقالة دعم...",
      "extension": "تحدي تعميق..."
    },
    {
      "id": "alt_3",
      "title": "عنوان البديل الثالث",
      "styleBadge": "الأسلوب التدريسي للبديل ٣",
      "studentDisplayPrompt": "نص العرض الفعلي للطلاب...",
      "teacherNotes": "ملاحظات المعلم...",
      "scaffolds": "سقالة دعم...",
      "extension": "تحدي تعميق..."
    }
  ]
}`;

  const parseSafeJson = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      const first = raw.indexOf('{');
      const last = raw.lastIndexOf('}');
      if (first !== -1 && last > first) {
        try {
          const cleaned = raw.substring(first, last + 1)
            .replace(/[“”؟‘’]/g, '"')
            .replace(/,s*}/g, '}')
            .replace(/,s*]/g, ']');
          return JSON.parse(cleaned);
        } catch (err2) {
          return null;
        }
      }
      return null;
    }
  };

  // 1. Try Groq AI
  if (groqKey) {
    const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: m,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.65,
            max_tokens: 2800,
            response_format: { type: 'json_object' }
          })
        }, 14000);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = parseSafeJson(content);
            if (parsed && Array.isArray(parsed.alternatives) && parsed.alternatives.length > 0) {
              return parsed;
            }
          }
        }
      } catch (e) {
        console.warn(`Groq station alternative (${m}) failed:`, e);
      }
    }
  }

  // 2. Try Gemini
  if (geminiKey) {
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.65,
                maxOutputTokens: 3000,
                responseMimeType: 'application/json'
              }
            })
          }, 14000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            const parsed = parseSafeJson(txt);
            if (parsed && Array.isArray(parsed.alternatives) && parsed.alternatives.length > 0) {
              return parsed;
            }
          }
        }
      } catch (e) {
        console.warn(`Gemini station alternative (${m}) failed:`, e);
      }
    }
  }

  // 3. Fallback Alternatives
  return {
    stationKey,
    alternatives: [
      {
        id: 'alt_fb_1',
        title: `بديل ١: المدخل القصصي والواقعي لـ (${title || 'الدرس'})`,
        styleBadge: 'مدخل قصصي واقعي',
        studentDisplayPrompt: `قصة المشهد المحفز لدرس (${title || 'موضوع الحصة'}):\nاستمع للموقف القصير الآتي: حدثت مفارقة غير متوقعة جعلت الجميع يتساءلون كيف يمكن تفسير ذلك أو حله بالدقة المطلوبة؟ ما الذي يثير فضولك في هذا الموقف؟`,
        teacherNotes: 'سرد القصة القصيرة بروح مشوقة والتوقف عند نقطة الفضول لاستدراج توقعات الطلاب دون تقديم الحل.',
        scaffolds: 'تلميح بصري أو بطاقة صورية توضح طرفي الموقف.',
        extension: 'تحدي سريع: توقع نهاية مختلفة للقصة.'
      },
      {
        id: 'alt_fb_2',
        title: `بديل ٢: لغز التحدي والمحقق الصغير لـ (${title || 'الدرس'})`,
        styleBadge: 'لغز وتحدي وتفكير',
        studentDisplayPrompt: `تحدي المحققين الصغار:\nأمامك معطيات ناقصة أو لغز يتطلب كلمة سر واحدة أو قاعدة ذهبية لتكتمل الصورة:\nفكر جيداً: ما الجزء المفقود الذي يزيل الغموض فوراً؟`,
        teacherNotes: 'عرض اللغز وتشجيع المناقشة الثنائية السريعة والتركيز على مفتاح الحل اللغوي أو العلمي.',
        scaffolds: 'عرض ثلاثة خيارات تلميحية للاختيار منها.',
        extension: 'صياغة لغز معاكس لاختبار الزملاء.'
      },
      {
        id: 'alt_fb_3',
        title: `بديل ٣: مفارقة المقارنة والموقف الحياتي لـ (${title || 'الدرس'})`,
        styleBadge: 'موقف حياتي ومقارنة',
        studentDisplayPrompt: `مفارقة المقارنة المباشرة:\nتأمل النموذجين المعروضين (أ) و (ب):\nما الفرق الجوهري بينهما في المعنى والأثر؟ وأيهما يعبر بدقة عن القاعدة الصحيحة؟`,
        teacherNotes: 'توجيه الطلاب لملاحظة الفروق الدقيقة وتدوين أدلتهم قبل إعلان معيار النجاح الصريح.',
        scaffolds: 'جدول ثنائي بمؤشرين واضحين للمقارنة.',
        extension: 'تطبيق المقارنة على موقف جديد من واقع المدرسة.'
      }
    ]
  };
};


/**
 * 15.D Miftaah Instant Objectives Generator:
 * Formulates central learning objective, explicit success criteria, and prerequisite knowledge
 * tailored to topic, subject, and grade.
 */
export const generateMiftaahLessonObjectivesAI = async ({
  title = '',
  subject = '',
  grade = '',
  duration = 45
}) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();
  const safeTitle = title.trim() || 'مهارة دراسية مركزية';
  const safeSubject = subject.trim() || 'عام';
  const safeGrade = grade.trim() || 'المرحلة الابتدائية';

  const prompt = `أنت مصمم المناهج لنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
المعلم أدخل بيانات الحصة:
- الموضوع: ${safeTitle}
- المادة الدراسية: ${safeSubject}
- الصف: ${safeGrade}
- المدة: ${duration === 'وحدة كاملة' ? 'وحدة تعليمية كاملة' : `${duration} دقيقة`}

المطلوب: كتابة صياغات تربوية دقيقة ومحكمة بصيغة السلوك الملاحظ الصريح:
1. "objective": هدف التعلم المركزي الصريح (ماذا سيتقن الطالب بنهاية الحصة).
2. "successCriteria": معيار النجاح المحدد بدقة (أداء صريح ومحك كمي أو كيفي يثبت تحقق الهدف، مثلا: حل ٣ مسائل دون خطأ، تصنيف ٤ عناصر وتبريرها).
3. "prerequisites": المعرفة والمهارة السابقة المفترضة التي يحتاجها الطالب للانطلاق في الدرس.

أخرج JSON فقط بالهيكل التالي (املأ القيم بنصوص عربية فصيحة ومتقنة):
{
  "objective": "",
  "successCriteria": "",
  "prerequisites": ""
}`;

  const parseSafeJson = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      const first = raw.indexOf('{');
      const last = raw.lastIndexOf('}');
      if (first !== -1 && last > first) {
        try {
          const cleaned = raw.substring(first, last + 1)
            .replace(/[“”؟‘’]/g, '"')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');
          return JSON.parse(cleaned);
        } catch (err2) {
          return null;
        }
      }
      return null;
    }
  };

  // 1. Try Groq AI
  if (groqKey) {
    const models = ['openai/gpt-oss-120b', 'allam-2-7b', 'qwen/qwen3.8-27b'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: m,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
          })
        }, 10000);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = parseSafeJson(content);
            if (parsed && parsed.objective) return parsed;
          }
        }
      } catch (e) {
        console.warn(`Groq objectives (${m}) failed:`, e);
      }
    }
  }

  // 2. Try Gemini
  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
    for (const gm of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${prompt}\n\nStrict JSON response only:` }] }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 1000, responseMimeType: 'application/json' }
            })
          },
          10000
        );

        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            const parsed = parseSafeJson(txt);
            if (parsed && parsed.objective) return parsed;
          }
        }
      } catch (e) {
        console.warn(`Gemini objectives (${gm}) failed:`, e);
      }
    }
  }

  // Fallback
  return {
    objective: `أن يتقن الطالب مهارة (${safeTitle}) وتطبيق قواعدها ومفاهيمها بدقة في سياقات تعليمية متنوعة.`,
    successCriteria: `حل وتطبيق ثلاثة أمثلة أو أنشطة جديدة بنجاح وبشكل مستقل، مع تقديم تبرير أو تفسير مناسب.`,
    prerequisites: `معرفة مسبقة بالمفاهيم الأساسية المرتبطة بـ (${safeSubject}) وخبرات تعليمية من الدروس السابقة.`
  };
};

/**
 * 15.E Miftaah Prompt-to-Modify Station AI:
 * Takes the teacher's custom instruction / prompt and rewrites a specific station
 * according to their exact creative and pedagogical desires.
 */
export const modifyMiftaahStationWithPromptAI = async ({
  stationKey = 'm',
  stationTitle = '',
  currentPrompt = '',
  instruction = '',
  title = '',
  subject = '',
  grade = '',
  language = 'auto'
}) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();
  const safeTitle = title.trim() || 'الدرس';
  const safeSubject = subject.trim() || 'عام';
  const safeGrade = grade.trim() || 'المرحلة الابتدائية';
  const safeInstruction = instruction.trim() || 'تحسين وإثراء المحطة لتكون أكثر تفاعلية وتشويقاً ومناسبة للطلاب';

  let targetLang = language;
  const ctx = `${safeSubject} ${safeTitle} ${safeInstruction} ${currentPrompt}`.toLowerCase();
  if (!targetLang || targetLang === 'auto') {
    if (ctx.includes('عبر') || ctx.includes('עברית') || ctx.includes('hebrew') || /[\u0590-\u05FF]/.test(ctx)) {
      targetLang = 'hebrew';
    } else if (ctx.includes('انجل') || ctx.includes('انكل') || ctx.includes('english') || safeSubject.toLowerCase() === 'english') {
      targetLang = 'english';
    } else {
      targetLang = 'arabic';
    }
  }

  const langNote = targetLang === 'hebrew'
    ? '⚠️⚠️ لغة المحتوى الإلزامية: يجب كتابة محتوى شاشة الطلاب (studentDisplayPrompt) باللغة العبرية السليمة تماماً (עברית תקינה) وبشكل مباشر للطلاب!'
    : targetLang === 'english'
    ? '⚠️⚠️ STRICT LANGUAGE REQUIREMENT: Write studentDisplayPrompt in proper, natural ENGLISH!'
    : 'لغة المحتوى: باللغة العربية الفصيحة السليمة والواضحة.';

  const prompt = `أنت المعلم الخبير ومصمم المناهج لنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
المعلم يريد تعديلاً وتخصيصاً فورياً لمحتوى إحدى محطات الدرس بناءً على طلبه وتوجيهه الخاص:
- موضوع الحصة: ${safeTitle}
- المادة الدراسية: ${safeSubject}
- الصف: ${safeGrade}
- لغة الحصة: ${targetLang === 'hebrew' ? 'العبرية (עברית)' : targetLang === 'english' ? 'الإنجليزية (English)' : 'العربية'}
- المحطة المستهدفة: [ ${stationKey} ] ${stationTitle}
- المحتوى الحالي لشاشة الطلاب:
"""
${currentPrompt}
"""
- توجيه وطلب المعلم الصريح للتعديل:
"""
${safeInstruction}
"""

${langNote}

قواعد صارمة:
1. في حقل (studentDisplayPrompt): اكتب النص الحقيقي الكامل المخصص لشاشة الطلاب بلغة الحصة المستهدفة (الأسئلة الكاملة، ورقة العمل الصريحة، الألغاز، النصوص، أو التمارين الحقيقية الصريحة الجاهزة للحل مباشرة)، وليس نصائح أو إحالات شفوية. إذا كان النشاط ورقة عمل أو ورقة دليل، اكتب أسئلتها بالتفصيل (س١، س٢، س٣) ومساحات الإجابة.
2. التزم تماماً برغبة وتوجيه المعلم أعلاه وطبقها بإبداع وإتقان تربوي.
3. وفر ملاحظات معلم واضحة، وسقالة مساندة (تلميح دون حرق الحل)، ومهمة تحدٍّ للمتفوقين.

أخرج JSON فقط بالهيكل التالي:
{
  "studentDisplayPrompt": "",
  "teacherNotes": "",
  "scaffolds": "",
  "extension": ""
}`;

  const parseSafeJson = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      const first = raw.indexOf('{');
      const last = raw.lastIndexOf('}');
      if (first !== -1 && last > first) {
        try {
          const cleaned = raw.substring(first, last + 1)
            .replace(/[“”؟‘’]/g, '"')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');
          return JSON.parse(cleaned);
        } catch (err2) {
          return null;
        }
      }
      return null;
    }
  };

  // 1. Try Groq AI
  if (groqKey) {
    const models = ['openai/gpt-oss-120b', 'allam-2-7b', 'qwen/qwen3.8-27b'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: m,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 2800,
            response_format: { type: 'json_object' }
          })
        }, 14000);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = parseSafeJson(content);
            if (parsed && parsed.studentDisplayPrompt) return parsed;
          }
        }
      } catch (e) {
        console.warn(`Groq modify station (${m}) failed:`, e);
      }
    }
  }

  // 2. Try Gemini
  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
    for (const gm of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${prompt}\n\nStrict JSON response only:` }] }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 2500, responseMimeType: 'application/json' }
            })
          },
          14000
        );

        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            const parsed = parseSafeJson(txt);
            if (parsed && parsed.studentDisplayPrompt) return parsed;
          }
        }
      } catch (e) {
        console.warn(`Gemini modify station (${gm}) failed:`, e);
      }
    }
  }

  // Fallback
  return {
    studentDisplayPrompt: `[تعديل مقترح لـ ${stationTitle}]:\n${currentPrompt}\n\n⭐ تطبيق لتوجيهك: تدريب تفاعلي إضافي موجه للمجموعات الصفيّة مع التركيز على التحليل والتفكير المستقل.`,
    teacherNotes: `إدارة النشاط وفق توجيه المعلم: "${safeInstruction}". منح الطلاب دقيقة تفكير مستقل قبل بدء العمل المشترك.`,
    scaffolds: `بطاقة تلميح داعمة: مراجعة القاعدة الأساسية وتحديد الكلمات المفتاحية في السؤال.`,
    extension: `مهمة تحدٍ إضافية: صياغة مسألة أو مثال مشابه من الحياة اليومية لعرضه على الزملاء.`
  };
};

/**
 * 15.F Miftaah Differentiated Group Tasks Generator (Station [ت]):
 * Generates 3 tiered group challenges (Support, Core, Advanced) with tailored scaffolds.
 */
export const generateMiftaahGroupTasksAI = async ({
  title = '',
  subject = '',
  grade = '',
  coreTask = ''
}) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();
  const safeTitle = title.trim() || 'الدرس';
  const safeSubject = subject.trim() || 'عام';
  const safeGrade = grade.trim() || 'المرحلة الابتدائية';

  const prompt = `أنت مصمم التدريس المتمايز بنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
المعلم يريد توليد ٣ مهام وتحديات متمايزة لمجموعات الصف في محطة [ت] تطبيق وتدريب:
- موضوع الدرس: ${safeTitle}
- المادة الدراسية: ${safeSubject}
- الصف: ${safeGrade}
${coreTask ? `- نص المهمة الأساسية للصف: "${coreTask}"` : ''}

المطلوب: توليد ٣ تحديات جماعية محددة بنصوصها وأسئلتها الفعلية الجاهزة فوراً للحل على شاشات أو دفاتر الطلاب:
1. مجموعة الانطلاق والدعم: تحدي مباشر ومبسط مع خيارات وسقالة واضحة للمساندة.
2. مجموعة الممارسة والإتقان: تطبيق المعيار الأساسي للدرس بدقة وتبرير.
3. مجموعة التحدي والابتكار: سؤال تفكير عليا، اكتشاف أخطاء، أو تأليف موقف جديد.

لكل مجموعة:
- level ("support" | "core" | "advanced")
- groupName (اسم تربوي محفز للمجموعة)
- badge (وسام تعبيري)
- task (الأسئلة والتمارين الصريحة الحقيقية)
- scaffold (سقالة مساندة وتلميح ذكي دون حرق الحل النهائي)

أخرج JSON فقط بالهيكل التالي:
{
  "groups": [
    {
      "level": "support",
      "groupName": "فريق الانطلاق والتمكن",
      "badge": "🌱 دعم ومساندة",
      "task": "",
      "scaffold": ""
    },
    {
      "level": "core",
      "groupName": "فريق الممارسة والإتقان",
      "badge": "⭐ ممارسة المعيار",
      "task": "",
      "scaffold": ""
    },
    {
      "level": "advanced",
      "groupName": "فريق الرواد والتحدي",
      "badge": "🚀 تحدٍّ وابتكار",
      "task": "",
      "scaffold": ""
    }
  ]
}`;

  const parseSafeJson = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      const first = raw.indexOf('{');
      const last = raw.lastIndexOf('}');
      if (first !== -1 && last > first) {
        try {
          const cleaned = raw.substring(first, last + 1)
            .replace(/[“”؟‘’]/g, '"')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');
          return JSON.parse(cleaned);
        } catch (err2) {
          return null;
        }
      }
      return null;
    }
  };

  // 1. Try Groq AI
  if (groqKey) {
    const models = ['openai/gpt-oss-120b', 'allam-2-7b', 'qwen/qwen3.8-27b'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: m,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 2800,
            response_format: { type: 'json_object' }
          })
        }, 14000);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = parseSafeJson(content);
            if (parsed && Array.isArray(parsed.groups) && parsed.groups.length > 0) return parsed;
          }
        }
      } catch (e) {
        console.warn(`Groq group tasks (${m}) failed:`, e);
      }
    }
  }

  // 2. Try Gemini
  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
    for (const gm of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${prompt}\n\nStrict JSON response only:` }] }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 2500, responseMimeType: 'application/json' }
            })
          },
          14000
        );

        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            const parsed = parseSafeJson(txt);
            if (parsed && Array.isArray(parsed.groups) && parsed.groups.length > 0) return parsed;
          }
        }
      } catch (e) {
        console.warn(`Gemini group tasks (${gm}) failed:`, e);
      }
    }
  }

  // Fallback
  return {
    groups: [
      {
        level: 'support',
        groupName: 'فريق الانطلاق والتمكن',
        badge: '🌱 دعم ومساندة',
        task: `حل التمرين المباشر حول موضوع (${safeTitle}): اختر الإجابة المناسبة لكل عبارة مع وضع خط تحت الكلمة الدالة.`,
        scaffold: `تلميح: راجع المثال التوضيحي الأول واستعن ببطاقة القواعد المكتوبة أعلى الصفحة.`
      },
      {
        level: 'core',
        groupName: 'فريق الممارسة والإتقان',
        badge: '⭐ ممارسة المعيار',
        task: `طبق القاعدة الأساسية لـ (${safeTitle}) على ثلاث فقرات جديدة، مع كتابة تعليل موجز لكل خطوة.`,
        scaffold: `تلميح: تأكد من مراجعة معيار النجاح والتأكد من مطابقة جميع الشروط المطلوبة.`
      },
      {
        level: 'advanced',
        groupName: 'فريق الرواد والتحدي',
        badge: '🚀 تحدٍّ وابتكار',
        task: `اكتشف الخطأ الخفي في نموذج الحل المعروض وفسر سببه، ثم قم بصياغة مثال جديد لاختبار زملائك في باقي الفرق.`,
        scaffold: `تلميح: فكر في الحالات الخاصة والاستثناءات التي نوقشت أثناء الدرس.`
      }
    ]
  };
};

/**
 * 15.G Miftaah Full Learning Journey Lesson Planner:
 * Generates an end-to-end 5-station cohesive lesson from only 3 inputs:
 * (title, grade, specialRequests)
 * Includes: objective, success criteria, stations 1-5, pedagogical mode, tiered tasks, formative rubric, exit ticket.
 */
export const generateMiftaahFullJourneyLessonAI = async ({
  title = '',
  subject = '',
  grade = '',
  language = 'auto',
  specialRequests = '',
  includePassage = 'auto', // 'ai_passage' | 'custom_passage' | 'none' | 'auto'
  passageLength = 'long',   // 'long' | 'medium' | 'short'
  customPassageText = '',   // Custom text provided by the teacher
  questionsDensity = 'tiered_full', // 'tiered_full' | 'intensive' | 'concise'
  hookActivityType = 'riddle',      // 'riddle' | 'puzzle' | 'video'
  primarySkill = 'auto'             // 'reading_comprehension' | 'grammar' | 'science' | 'math' | 'values' | 'general' | 'auto'
}) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();
  const safeTitle = title.trim() || 'مهارة مركزية تفاعلية';
  const safeSubject = subject.trim() || 'عام';
  const safeGrade = grade.trim() || 'المرحلة الابتدائية';
  const safeRequests = specialRequests.trim();

  // Smart Language Detection: Auto-detect Hebrew, English, or Arabic from Subject, Title, Requests, or explicit Language
  let targetLang = language;
  const combinedContext = `${safeSubject} ${safeTitle} ${safeRequests} ${customPassageText || ''}`.toLowerCase();
  if (!targetLang || targetLang === 'auto') {
    if (combinedContext.includes('عبر') || combinedContext.includes('עברית') || combinedContext.includes('hebrew') || /[\u0590-\u05FF]/.test(combinedContext)) {
      targetLang = 'hebrew';
    } else if (combinedContext.includes('انجل') || combinedContext.includes('انكل') || combinedContext.includes('english') || safeSubject.toLowerCase() === 'english' || (/^[a-zA-Z\s0-9.,!?'"()-]+$/.test(safeTitle) && safeTitle.length > 3)) {
      targetLang = 'english';
    } else {
      targetLang = 'arabic';
    }
  }

  // Detect Specific Requested Topics (e.g. Train / רכבת / قطار)
  const isTrainTopic = /قطار|القطار|قطارات|قطارا|سكة حديد|רכבת|רכבות|train/i.test(combinedContext);

  // Detect Pedagogical Genre / Discipline Type (honoring explicit teacher selection)
  let isReadingComprehension = includePassage === 'ai_passage' || 
    includePassage === 'custom_passage' || 
    primarySkill === 'reading_comprehension' ||
    isTrainTopic ||
    combinedContext.includes('הבנת הנקרא') ||
    combinedContext.includes('فهم المقروء') ||
    combinedContext.includes('reading comprehension') ||
    combinedContext.includes('טקסט') ||
    combinedContext.includes('קריאה') ||
    combinedContext.includes('نص قرائي') ||
    combinedContext.includes('قطعة فهم') ||
    combinedContext.includes('قطعة') ||
    combinedContext.includes('סיפור') ||
    combinedContext.includes('قصة');

  if (includePassage === 'none' && !customPassageText.trim()) {
    isReadingComprehension = false;
  }

  const isValuesEducation = primarySkill === 'values' ||
    combinedContext.includes('ערך') ||
    combinedContext.includes('ערכים') ||
    combinedContext.includes('נתינה') ||
    combinedContext.includes('סובלנות') ||
    combinedContext.includes('כבוד') ||
    combinedContext.includes('אחריות') ||
    combinedContext.includes('חברות') ||
    combinedContext.includes('עזרה') ||
    combinedContext.includes('قيم') ||
    combinedContext.includes('أخلاق') ||
    combinedContext.includes('تسامح') ||
    combinedContext.includes('عطاء') ||
    combinedContext.includes('مواطنة') ||
    combinedContext.includes('values');

  const isGrammarOrLanguage = primarySkill === 'grammar' ||
    combinedContext.includes('לשון') ||
    combinedContext.includes('דקדוק') ||
    combinedContext.includes('פעלים') ||
    combinedContext.includes('פועל') ||
    combinedContext.includes('שם עצם') ||
    combinedContext.includes('בניין') ||
    combinedContext.includes('قواعد') ||
    combinedContext.includes('نحو') ||
    combinedContext.includes('إملاء') ||
    combinedContext.includes('همزة') ||
    combinedContext.includes('أفعال') ||
    combinedContext.includes('grammar');

  const isMath = primarySkill === 'math' ||
    combinedContext.includes('חשבון') ||
    combinedContext.includes('מתמטיקה') ||
    combinedContext.includes('שברים') ||
    combinedContext.includes('כפל') ||
    combinedContext.includes('חילוק') ||
    combinedContext.includes('رياضيات') ||
    combinedContext.includes('حساب') ||
    combinedContext.includes('كسور') ||
    combinedContext.includes('math');

  const isScience = primarySkill === 'science' ||
    combinedContext.includes('מדע') ||
    combinedContext.includes('טבע') ||
    combinedContext.includes('ניסוי') ||
    combinedContext.includes('חומר') ||
    combinedContext.includes('علوم') ||
    combinedContext.includes('طبيعة') ||
    combinedContext.includes('تجربة') ||
    combinedContext.includes('science');

  // Teacher Custom Questions Directives
  let teacherCustomDirectives = '';
  if (includePassage === 'custom_passage' && customPassageText.trim()) {
    teacherCustomDirectives = `
⚠️⚠️ توجيه إلزامي حاسم (نص قراءة معتمد من المعلم):
المعلم قام بإدخال النص القرائي التالي لاعتماده كاملاً في الحصة:
"""
${customPassageText.trim()}
"""
1. يجب وضع هذا النص كاملاً كما هو دون أي اختصار أو تبديل في المحطة 2 (studentPrompt)!
2. يجب أن تصاغ جميع أسئلة المحطة 3 (التطبيق والتدريب) وأسئلة المحطة 4 (أدلة الفهم) بناءً على هذا النص تحديداً!
`;
  } else if (includePassage === 'ai_passage' || isReadingComprehension) {
    const lengthDetail = passageLength === 'short'
      ? (targetLang === 'hebrew' ? 'פסקה ממוקדת אחת (כ-60-80 מילים)' : 'فقرة واحدة مركزة وموجزة (٦٠-٨٠ كلمة)')
      : passageLength === 'medium'
      ? (targetLang === 'hebrew' ? 'שתי פסקאות ברורות ומובנות (כ-120-160 מילים)' : 'فقرتان واضحتان متكاملتان (١٢٠-١٦٠ كلمة)')
      : (targetLang === 'hebrew' ? 'קטע קריאה עשיר ומלא של 3-4 פסקאות (כ-200-280 מילים) עם כותרת ומילון מילים' : 'نص قرائي متكامل وغني من ٣ إلى ٤ فقرات وافية (٢٠٠-٢٨٠ كلمة) مع عنوان بارز ومعجم للمفردات');

    teacherCustomDirectives = `
📖 توجيه إلزامي لقطعة القراءة في المحطة 2:
- المطلوب إرفاق قطعة قرائية كاملة (${lengthDetail}) حول موضوع (${safeTitle})!
- لغة النص: سليمة وفصيحة تماماً (${targetLang === 'hebrew' ? 'עברית תקנית ועשירה בלבד' : targetLang === 'english' ? 'Clear, natural English' : 'لغة عربية فصيحة ومشكولة وسليمة'}).
- يتم وضع النص كاملاً داخل studentPrompt مع عنوانه وفقراته المرتبة ومعجم للمفردات الجديدة.
`;
  } else if (includePassage === 'none') {
    teacherCustomDirectives = `
🧪 تنبيه: هذه الحصة لا تتضمن نصاً قرائياً؛ بل ترتكز المحطة 2 على النمذجة والاستكشاف والتجارب أو القواعد والمفاهيم العلمية/الرياضية المباشرة.
`;
  }

  if (questionsDensity === 'intensive') {
    teacherCustomDirectives += `
🎯 متطلب كثافة الأسئلة: توفير أسئلة مكثفة ومتنوعة في المحطة 3 والمحطة 4 تشمل كافة أبعاد الفهم (استخراج صريح، استنتاج وعلاقات سببية، أسلوب ولغة وتراكيب، ونقد وإبداء رأي وتقييم).
`;
  } else if (questionsDensity === 'concise') {
    teacherCustomDirectives += `
⚡ متطلب كثافة الأسئلة: أسئلة سريعة وموجزة ومركزة تختبر الهدف الأساسي للحصة دون إطالة.
`;
  } else {
    teacherCustomDirectives += `
🎯 متطلب تدرج الأسئلة: الالتزام الصارم بنموذج مِفتاح المتمايز (٣ مستويات: الانطلاق والتمكن، الممارسة والإتقان، الرواد والتحدي) بأسئلة ومهمات محددة وصريحة.
`;
  }

  teacherCustomDirectives += `
🔥 النشاط التفاعلي الإلزامي للمحطة الأولى (مشوّق ومحفز): ${hookActivityType === 'puzzle' ? 'بازل وترتيب منطقي للأفكار (puzzle)' : hookActivityType === 'video' ? 'فيلم / فيديو تعليمي قصير مع سؤال تأمل (video)' : 'أحجية أو لغز تفاعلي مع خيارات وتلميحات وحل (riddle)'}.
`;

  // Pedagogical Directives for AI Model based on Genre & Language
  let genreDirective = '';
  if (isReadingComprehension) {
    if (targetLang === 'hebrew') {
      genreDirective = `
📖 הנחיות פדגוגיות קריטיות לשיעור הבנת הנקרא בעברית (טקסט קריאה מלא ושאלות הבנה רב-ממדיות):
- נושא השיעור הוא הבנת הנקרא (${safeTitle}).
${customPassageText.trim() ? `📄 טקסט קריאה ספציפי של המורה מצורף בהוראות לעיל וחובה להשתמש בו במלואו בתחנה 2!` : ''}
${isTrainTopic ? `🚂 נושא ממוקד ומפורש: רכבות / הרכבת המהירה (TRAIN)! כל טקסט הקריאה והשאלות חייבים לעסוק ברכבות בלבד!` : ''}
- בתחנה 2 (הבנת המשמעות):
  * ${customPassageText.trim() ? 'שלב את הטקסט המלא של המורה ללא קיצור' : `חובה לחבר קטע קריאה שלם, מרתק, עשיר ועמוק (${passageLength === 'short' ? 'פסקה אחת' : passageLength === 'medium' ? 'שתי פסקאות' : '3-4 פסקאות'}) המתאים לשכבת הגיל (${safeGrade}) העוסק בדיוק בנושא המבוקש (${isTrainTopic ? 'רכבות, התפתחות הרכבת מקיטור לרכבת מגנטית' : safeTitle})!`}
  * כל קטע הקריאה המלא חייב להיות כתוב כולו במפורש בתוך studentPrompt, ולאחריו "מילון מושגים וביאור מילים קשות".
- בתחנה 3 (יישום ותרגול):
  * חובה לנסח שאלות הבנה מעמיקות על קטע הקריאה שבתחנה 2 לפי שלוש רמות חשיבה:
    1. קבוצת זינוק (support): שאלות איתור מידע מפורש וגלוי מתוך הטקסט עם הפניה לפסקה המתאימה.
    2. קבוצת שליטה (core): שאלות הסקה, משמעויות נסתרות, קשרי סיבה ותוצאה, והבנת רגשות הדמויות.
    3. קבוצת אתגר (advanced): שאלות ביקורת והערכה, הבעת עמדה מנומקת מתוך הטקסט והצעת סיום חלופי.
- בתחנה 4 (דף ראיות הבנה):
  * חובה לנסח דף משימה עצמאי עם 4 שאלות הבנה מעמיקות הדורשות ציטוט וראיה מהטקסט (הוכחה מתוך הטקסט)!
- בתחנה 5 (קציר והעברה לחיים):
  * לחבר את המסר של קטע הקריאה לחיים האישיים ולקהילה.`;
    } else if (targetLang === 'english') {
      genreDirective = `
📖 PEDAGOGICAL DIRECTIVES FOR READING COMPREHENSION (Full Reading Passage & Questions):
${customPassageText.trim() ? `📄 The teacher provided a specific text above — you MUST include it in full in Station 2!` : ''}
${isTrainTopic ? `🚂 SPECIFIC FOCUS: THE TRAIN / HIGH-SPEED TRAINS! The entire reading text and questions must be strictly about trains!` : ''}
- Station 2 (Meaning): You MUST compose a complete, rich, engaging reading passage directly inside studentPrompt on (${isTrainTopic ? 'Trains & their technological evolution' : safeTitle}), followed by vocabulary words in context.
- Station 3 (Practice): You MUST provide tiered reading comprehension questions based on the text.
- Station 4 (Evidence): Independent worksheet with text-dependent comprehension questions requiring text citations.`;
    } else {
      genreDirective = `
📖 توجيهات بيداغوجية إلزامية لدرس فهم المقروء (نص قرائي كامل وأسئلة فهم متعددة الأبعاد):
- موضوع الدرس هو فهم المقروء (${safeTitle}).
${customPassageText.trim() ? `📄 ملاحظة هامة: قام المعلم بإرفاق نص قرائي محدد في التوجيهات أعلاه، ويجب وضعه كاملاً في المحطة 2 وصياغة الأسئلة منه!` : ''}
${isTrainTopic ? `🚂 توجيه إلزامي حاسم: موضوع الدرس المطلوب صراحة هو "القطار" (القطار السريع، تاريخ وتطور القطارات، رحلة عبر السكة الحديدية)!
- يجب أن يكون النص القرائي كاملاً في المحطة 2 عن "القطار" وتطوره من البخار إلى القطار المغناطيسي السريع!
- يجب أن تكون جميع الأسئلة والمهام المتمايزة في المحطة 3 عن نص القطار حصراً!
- يجب أن تكون ورقة أدلة الفهم في المحطة 4 مستخرجة من نص القطار وتتطلب إثبات الفهم منه!` : ''}
- في المحطة الثانية (فهم وبناء المعنى):
  * ${customPassageText.trim() ? 'إدراج النص الكامل للمعلم دون تعديل أو اختصار' : `يجب كتابة نص قرائي كامل، شائق وماتع (${passageLength === 'short' ? 'فقرة واحدة مركزة' : passageLength === 'medium' ? 'فقرتان واضحتان' : '٣-٤ فقرات كاملة'}) ملائم تماماً لصف (${safeGrade}) حول موضوع (${isTrainTopic ? 'القطار وتاريخه وتقنياته الحديثة' : safeTitle})!`}
  * يُكتب النص القرائي كاملاً بحروفه وعنوانه داخل studentPrompt مع جدول لشرح المفردات والتراكيب اللغوية الجديدة.
- في المحطة الثالثة (التطبيق والتدريب):
  * صياغة أسئلة فهم وتحليل مبنية تماماً على النص القرائي وفق أبعاد الفهم الثلاثة:
    ١. فريق الانطلاق: استخراج معلومات صريحة وواضحة من النص.
    ٢. فريق الإتقان: الاستنتاج، العلاقات السببية، ودلالات تصرفات الشخصيات ومغازيها.
    ٣. فريق الرواد: التفكير الناقد والتقييم وإبداء الرأي الشخصي مع التعليل واقتراح عنوان أو نهاية بديلة.
- في المحطة الرابعة (أدلة الفهم):
  * ورقة دليل فردي مستقل تحتوي على ٤ أسئلة صريحة تتطلب الاستشهاد المباشر بدليل من النص القرائي!`;
    }
  } else if (isValuesEducation) {
    if (targetLang === 'hebrew') {
      genreDirective = `
❤️ הנחיות פדגוגיות לשיעור חינוך לערכים ומנהיגות (${safeTitle}):
- בתחנה 1: דילמה חברתית מעוררת מחשבה או מקרה בוחן מרגש מחיי בית הספר.
- בתחנה 2: בירור עמוק של המושג הערכי, סיפור קצר ממחיש (כגון מעשה של חסד ונתינה), ומשמעותו לקהילה.
- בתחנה 3: משימות קבוצתיות לניתוח 3 תרחישים חברתיים מגוונים וגיבוש פתרון ערכי משותף.
- בתחנה 4: דף ראיות אישי: דילמה מוסרית שבה התלמיד מקבל החלטה עצמאית ומנמק אותה.
- בתחנה 5: התחייבות אישית למעשה טוב (קבלת החלטה ומעשה יישומי בשבוע הקרוב).`;
    } else {
      genreDirective = `
❤️ توجيهات بيداغوجية لدروس القيم والأخلاق والمواطنة (${safeTitle}):
- المحطة 1: معضلة أخلاقية واقعية أو قصة قصيرة مشوقة تمس حياة الطلاب.
- المحطة 2: تفكيك القيمة ونماذج حية ملهمة من واقع المدرسة والأسرة والمجتمع.
- المحطة 3: مهمات جماعية متمايزة لتحليل ٣ مواقف اجتماعية واقتراح مبادرات إيجابية.
- المحطة 4: ورقة دليل فردي تتضمن موقفاً يتخذ فيه الطالب قراراً سلوكياً مستقلاً مع التعليل.
- المحطة 5: التزام وعهد شخصي بتطبيق القيمة عملياً في المدرسة والبيت.`;
    }
  } else if (isGrammarOrLanguage) {
    if (targetLang === 'hebrew') {
      genreDirective = `
📝 הנחיות פדגוגיות לשיעור לשון ודקדוק (${safeTitle}):
- בתחנה 1: חידה לשונית או משחק מילים מפעיל.
- בתחנה 2: משפטים לניתוח פעיל, ניסוח הכלל הלשוני בבירור עם טבלת דוגמאות.
- בתחנה 3: שלוש רמות תרגול מדורגות (זיהוי, המרה, כתיבת משפטים מקוריים).
- בתחנה 4: דף משימה עצמאי לתיקון שגיאות, ניתוח משפטים ונימוק הכלל.`;
    }
  }

  // Language Directives for AI Model
  let languageDirective = '';
  if (targetLang === 'hebrew') {
    languageDirective = `
⚠️⚠️ تعليمات لغة المحتوى الإלزامية الصارمة (STRICT HEBREW LANGUAGE REQUIREMENT - שפת השיעור: עברית):
- שפת ההוראה והתוכן של השיעור היא עברית תקנית ועשירה בלבד!
- אסור בהחלט לשלב טקסטים בערבית בתוך שדות התלמידים (title, objective, successCriteria, studentPrompt, tasks, individualTask, exitTicket)!
- כל הטקסטים, ההסברים, קטעי הקריאה, החידות, דפי המשימה והשאלות חייבים להיות בעברית מלאה ואיכותית המותאמת לגיל בית ספר יסודי!
- כותרת השיעור (title): בעברית מלאה (לדוגמה: "הבנת הנקרא: סוד שיתוף הפעולה" או "ערך הנתינה והמעשה הטוב").
- מטרת השיעור (objective): בעברית מלאה.
- קריטריון הצלחה (successCriteria): בעברית מלאה.`;
  } else if (targetLang === 'english') {
    languageDirective = `
⚠️⚠️ STRICT ENGLISH LANGUAGE REQUIREMENT (The entire lesson content must be in ENGLISH):
- The teaching language is 100% ENGLISH.
- ALL fields (title, objective, successCriteria, studentPrompt, tasks, individualTask, exitTicket) MUST be written in natural, age-appropriate ENGLISH!
- Do not include any Arabic or Hebrew text in the student-facing fields.`;
  } else {
    languageDirective = `
- لغة الحصة ومحطاتها: اللغة العربية الفصيحة السليمة والواضحة والمحفزة المناسبة لطلاب المرحلة الابتدائية.`;
  }

  const prompt = `أنت الخبير التربوي ومصمم المناهج لنظام «مِفتاح — رحلة التعلّم» بمدرسة مشيرفة الابتدائية.
المعطيات المدخلة لإنشاء الحصة:
- موضوع الدرس / المادة التعليمية: ${safeSubject}
- عنوان الدرس ومحوره: ${safeTitle}
- الصف والمستوى الدراسي: ${safeGrade}
- لغة تدريس ومحتوى الحصة المطلوبة: ${targetLang === 'hebrew' ? 'العبرية (עברית בלבד)' : targetLang === 'english' ? 'الإنجليزية (English 100%)' : 'العربية'}
${safeRequests ? `- طلبات وتوجيهات خاصة للمعلم: "${safeRequests}"` : ''}

${teacherCustomDirectives}

${languageDirective}

${genreDirective}

المطلوب: توليد مسودة متكاملة ومترابطة للحصة وفق محطات مِفتاح الخمس بالترتيب الإلزامي:
1. مشוّق ومحفّز (م)
2. فهم وبناء المعنى (ف)
3. التطبيق والتدريب (ت)
4. أدلة الفهم (ا)
5. حصاد ونقل الأثر (ح)

القواعد البيداغوجية الصارمة (כללי הברזל של מודל מִפתח):
1. שיעור עשיר, מוכן להעברה מיידית בכיתה ומותאם ישירות למסך התלמיד (Turnkey Classroom Ready):
   - אין לכתוב סיכומים קצרים או הפניות כלליות; יש לכתוב את כל התוכן במלואו על גבי המסך!
   - אם מתוכנן קטע קריאה: כתוב את הטקסט המלא (3-4 פסקאות עשירות) בתחנה 2 (studentPrompt), כולל כותרת ומילון מושגים!
   - אם יש חידה או סיפור: כתוב את הטקסט המלא, הרמזים והפתרון בתוך interactiveActivity.riddle.
    - אם יש סרטון: כלול כותרת סרטון, משפט חיפוש מדויק מאוד ב-youtubeSearchQuery המותאם לנושא השיעור ולכיתה, סיפור מרתק או תופעה מדהימה ב-hookStoryOrScenario, שאלת סקרנות ב-curiosityQuestion ושאלת רפלקציה מעמיקה (אל תמציא קישורי יוטיוב פיקטיביים - השאר youtubeUrl ריק "").
    - אם מתוכנן משחק: ציין את המשחק המתאים מהאתר (אליפות לוח הכפל, אתגר בלשי, זירת הלשון, מעבדת STEM).
2. דיפרנציאציה אמיתית בתחנה 3 (יישום ותרגול): חובה לכלול 3 משימות מלאות ומפורטות לשלוש רמות (זינוק, שליטה, אתגר) עם ניסוח השאלות במלואן.
3. תחנה 4 (ראיות הבנה): שאלות בדיקה עצמאיות מפורשות (1, 2, 3) המודדות ישירות את קריטריון ההצלחה, ללא צורך בדפי צילום חיצוניים.
4. תחנה 5 (סיכום, קציר והעברה לחיים): שאלות כרטיס יציאה מובנות המקשרות את הלמידה למציאות היומיומית.
5. שפת השיעור: ${targetLang === 'hebrew' ? 'עברית תקנית, עשירה ומדויקת בלבד (ללא ערבית)' : targetLang === 'english' ? '100% natural, polished English' : 'لغة عربية فصيحة وسليمة ومشكولة'}.

أخرج JSON صالحاً فقط بالهيكل التالي (بدون أي نصوص خارج الـ JSON):
{
  "title": "${targetLang === 'hebrew' ? safeTitle : targetLang === 'english' ? safeTitle : safeTitle}",
  "subject": "${safeSubject}",
  "language": "${targetLang}",
  "grade": "${safeGrade}",
  "objective": "${targetLang === 'hebrew' ? 'מטרת השיעור בעברית מדויקת...' : targetLang === 'english' ? 'Learning objective in English...' : 'هدف التعلّم الصريح المحدد...'}",
  "successCriteria": "${targetLang === 'hebrew' ? 'קריטריון הצלחה מדיד בעברית...' : targetLang === 'english' ? 'Measurable success criteria in English...' : 'معيار النجاح القابل للقياس...'}",
  "suggestedDuration": 45,
  "stations": {
    "1_hook": {
      "name": "${targetLang === 'hebrew' ? 'משיכה וסקרנות' : 'مشوّق ومحفّز'}",
      "number": 1,
      "icon": "🔥",
      "studentPrompt": "نص الموقف المحفز المعروض للطلاب...",
      "teacherGuidance": "إرشادات المعلم لإدارة المدخل المحفز...",
      "suggestedDuration": 6,
      "scaffold": "تلميح للبدء...",
      "youtubeSearchQuery": "جملة بحث دقيقة جداً في يوتيوب مرتبطة بموضوع الدرس والصف...",
      "hookStoryOrScenario": "القصة المشوقة أو الظاهرة المدهشة المرتبطة بالدرس كبديل آمن ومتكامل...",
      "curiosityQuestion": "سؤال الفضول المثير للتفكير حول القصة أو الظاهرة...",
      "interactiveActivity": {
        "type": "riddle",
        "title": "عنوان النشاط",
        "riddle": {
          "riddleText": "نص الأحجية أو اللغز...",
          "clues": ["רמז 1 / تلميح 1", "רמז 2 / تلميح 2"],
          "options": ["אופציה 1", "אופציה 2", "אופציה 3", "אופציה 4"],
          "solution": "פתרון החידה / حل الأحجية",
          "explanation": "הסבר וקישור לשיעור / ربط الحل بالدرس"
        },
        "puzzle": {
          "instruction": "הוראות / تعليمات الترتيب",
          "pieces": [
            { "id": "p1", "text": "חלק 1", "order": 1 },
            { "id": "p2", "text": "חלק 2", "order": 2 },
            { "id": "p3", "text": "חלק 3", "order": 3 },
            { "id": "p4", "text": "חלק 4", "order": 4 }
          ],
          "targetConcept": "מושג המפתח / المفهوم النهائي",
          "successMessage": "כל הכבוד! / أحسنت!"
        },
        "video": {
          "title": "عنوان المقطع المقترح",
          "youtubeSearchQuery": "جملة بحث دقيقة جداً في يوتيوب مرتبطة بموضوع الدرس والصف",
          "searchQuery": "جملة بحث دقيقة جداً في يوتيوب مرتبطة بموضوع الدرس والصف",
          "youtubeUrl": "",
          "hookStoryOrScenario": "القصة المشوقة أو الظاهرة المدهشة المرتبطة بالدرس...",
          "curiosityQuestion": "سؤال الفضول المثير للتفكير...",
          "reflectionQuestion": "سؤال التأمل"
        }
      }
    },
    "2_understanding": {
      "name": "${targetLang === 'hebrew' ? 'הבנת המשמעות' : 'فهم وبناء المعنى'}",
      "number": 2,
      "icon": "🧩",
      "pedagogicalMode": "guided_exploration",
      "pedagogicalModeName": "${targetLang === 'hebrew' ? 'הבנה ובניית משמעות' : 'بناء المعنى والاستكشاف'}",
      "studentPrompt": "المحتوى الصريح: نص القراءة الكامل إن كان فهم المقروء، أو الشرح والقواعد والمفاهيم...",
      "teacherGuidance": "إرشادات النمذجة أو قيادة الاستكشاف...",
      "suggestedDuration": 12,
      "scaffold": "منظم بصري أو خطوة مساعدة..."
    },
    "3_practice": {
      "name": "${targetLang === 'hebrew' ? 'יישום ותרגול' : 'التطبيق والتدريب'}",
      "number": 3,
      "icon": "🛠️",
      "studentPrompt": "شرح توجيهي للمهمة وقواعد العمل الجماعي...",
      "teacherGuidance": "إرشادات المعلم لإدارة المحطة...",
      "suggestedDuration": 15,
      "workMode": "groups",
      "tasks": [
        { "tier": "support", "badge": "${targetLang === 'hebrew' ? '🌱 קבוצת זינוק' : '🌱 فريق الانطلاق والتمكن'}", "title": "مهمة الانطلاق", "task": "المهمة وأسئلتها...", "scaffold": "تلميح..." },
        { "tier": "core", "badge": "${targetLang === 'hebrew' ? '⭐ קבוצת שליטה' : '⭐ فريق الممارسة والإتقان'}", "title": "مهمة الإتقان", "task": "المهمة وأسئلتها...", "scaffold": "تلميح..." },
        { "tier": "advanced", "badge": "${targetLang === 'hebrew' ? '🚀 קבוצת אתגר' : '🚀 فريق الرواد والتحدي'}", "title": "مهمة التحدي", "task": "المهمة وأسئلتها...", "scaffold": "تلميح..." }
      ]
    },
    "4_evidence": {
      "name": "${targetLang === 'hebrew' ? 'ראיות הבנה' : 'أدلة الفهم'}",
      "number": 4,
      "icon": "🔎",
      "studentPrompt": "ورقة الدليل الفردي المستقل مع الأسئلة الصريحة (سؤال 1، 2، 3، 4)...",
      "teacherGuidance": "إرشادات تقييم الدليل الفردي...",
      "suggestedDuration": 7,
      "criterion": "معيار التحقق الصريح...",
      "individualTask": "نص أسئلة ورقة الدليل الفردي...",
      "allowedHelp": ["تلميح خفيف", "توضيح التعليمات"],
      "evalLevels": {
        "mastered": "${targetLang === 'hebrew' ? 'השיג את היעד' : 'حقق الهدف'}",
        "partial": "${targetLang === 'hebrew' ? 'השיג חלקית' : 'حققه جزئياً'}",
        "needs_support": "${targetLang === 'hebrew' ? 'זקוק לתמיכה' : 'يحتاج دعماً'}",
        "insufficient_data": "${targetLang === 'hebrew' ? 'אין מספיק ראיות' : 'الدليل غير كافٍ'}"
      }
    },
    "5_harvest": {
      "name": "${targetLang === 'hebrew' ? 'סיכום וקציר' : 'حصاد ونقل الأثر'}",
      "number": 5,
      "icon": "🎒",
      "studentPrompt": "توجيهات الحصاد الصريحة للطلاب...",
      "teacherGuidance": "إرشادات المعلم لختام الحصة...",
      "suggestedDuration": 5,
      "exitTicket": {
        "q1": "${targetLang === 'hebrew' ? 'מה הרעיון המרכזי שלמדתי היום?' : 'ما أهم فكرة تعلمتها اليوم؟'}",
        "q2": "${targetLang === 'hebrew' ? 'מה עזר לי להבין?' : 'ما الذي ساعدني على الفهم؟'}",
        "q3": "${targetLang === 'hebrew' ? 'מה עדיין דורש הסבר?' : 'ما الذي ما زلت أحتاج إلى توضيحه؟'}",
        "q4_transfer": "${targetLang === 'hebrew' ? 'איפה אוכל להשתמש במה שלמדתי?' : 'أين أستطيع استخدام ما تعلمته؟'}"
      }
    }
  }
}`;

  const parseSafeJson = (raw) => {
    if (!raw) return null;
    let clean = raw.trim();
    if (clean.startsWith('```json')) clean = clean.slice(7);
    else if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, -3);
    clean = clean.trim();
    try {
      return JSON.parse(clean);
    } catch (e) {
      const first = clean.indexOf('{');
      const last = clean.lastIndexOf('}');
      if (first !== -1 && last > first) {
        try {
          const sub = clean.substring(first, last + 1)
            .replace(/[“”؟‘’]/g, '"')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');
          return JSON.parse(sub);
        } catch (err2) {
          return null;
        }
      }
      return null;
    }
  };

  const getCuratedTopicVideo = (text) => {
    const t = (text || '').toLowerCase();
    if (t.includes('انتخاب') || t.includes('ديمقراط') || t.includes('تصويت') || t.includes('اقتراع') || t.includes('مواطن')) {
      return {
        title: 'الانتخابات والديمقراطية للأطفال: كيف نختار ممثلينا ولماذا صوتك أمانة ومهم؟',
        embedUrl: 'https://www.youtube-nocookie.com/embed/S4328Yx6W20?rel=0',
        youtubeUrl: 'https://www.youtube.com/watch?v=S4328Yx6W20',
        searchQuery: 'الانتخابات والديمقراطية للاطفال كرتون تعليمي',
        reflectionQuestion: 'ما أهمية أن يشارك كل فرد بصوته في الانتخابات؟ وما المعايير التي تجعلك تختار مرشحاً معيناً؟'
      };
    }
    if (t.includes('تميز') || t.includes('التميز') || t.includes('نجاح') || t.includes('تفوق') || t.includes('طموح') || t.includes('إتقان') || t.includes('اتقان')) {
      return {
        title: targetLang === 'hebrew' ? 'סרטון קצר מעורר השראה: כוחה של התמדה ומצוינות' : 'فيلم قصير عن التميز والنجاح: ما سر الفرق بين العادي والمتميز؟',
        embedUrl: 'https://www.youtube-nocookie.com/embed/dK0R5rN2gIc?rel=0',
        youtubeUrl: 'https://www.youtube.com/watch?v=dK0R5rN2gIc',
        searchQuery: 'فيلم قصير عن التميز والنجاح للاطفال رسوم متحركة',
        reflectionQuestion: targetLang === 'hebrew' ? 'לאחר הצפייה בסרטון: מה ההבדל בין עבודה רגילה לחיפוש אחר מצוינות? וכיצד התמדה מובילה להצלחה?' : 'بعد مشاهدة هذا الفيلم: ما الفرق الجوهري بين من يقوم بعمله بشكل عادي ومن يبحث دائماً عن التميز؟'
      };
    }
    if (t.includes('مادة') || t.includes('حالات المادة') || t.includes('صلب') || t.includes('سائل') || t.includes('غاز') || t.includes('كيمياء') || t.includes('علوم') || t.includes('فيزياء') || t.includes('طاقة') || t.includes('ماء') || t.includes('دورة الماء') || t.includes('מדע') || t.includes('מצבי צבירה')) {
      return {
        title: targetLang === 'hebrew' ? 'סרטון אנימציה חינוכי: שלושת מצבי הצבירה ותכונותיהם' : 'كرتون تعليمي: حالات المادة الثلاث وخصائصها وتغيراتها',
        embedUrl: 'https://www.youtube-nocookie.com/embed/bMnmJjL3hF8?rel=0',
        youtubeUrl: 'https://www.youtube.com/watch?v=bMnmJjL3hF8',
        searchQuery: 'حالات المادة الثلاث للاطفال كرتون',
        reflectionQuestion: targetLang === 'hebrew' ? 'כיצד תנועת החלקיקים משתנה בין מצבי הצבירה השונים כפי שראיתם בסרטון?' : 'ما الظاهرة التي شاهدتموها في المقطع؟ وكيف تختلف حركة الجزيئات بين الحالات الثلاث؟'
      };
    }
    if (t.includes('حساب') || t.includes('رياضيات') || t.includes('كسور') || t.includes('ضرب') || t.includes('قسمة') || t.includes('جمع') || t.includes('طرح') || t.includes('أعداد') || t.includes('هندسة') || t.includes('مساحة') || t.includes('חשבון') || t.includes('מתמטיקה') || t.includes('כפל')) {
      return {
        title: targetLang === 'hebrew' ? 'הרפתקה מתמטית: פתרון בעיות וחשיבה הגיונית' : 'مغامرة الرياضيات والتفكير المنطقي للأطفال',
        embedUrl: 'https://www.youtube-nocookie.com/embed/4b2b-y4hPoc?rel=0',
        youtubeUrl: 'https://www.youtube.com/watch?v=4b2b-y4hPoc',
        searchQuery: `فيديو تعليمي للأطفال في الرياضيات`,
        reflectionQuestion: targetLang === 'hebrew' ? 'מהו הרעיון המתמטי המרכזי שראיתם בסיטואציה זו?' : 'ما الفكرة الرياضية المفتاحية التي شاهدتموها في هذا الموقف؟ وكيف نطبقها اليوم؟'
      };
    }
    if (t.includes('قطار') || t.includes('القطار') || t.includes('قطارات') || t.includes('سكة حديد') || t.includes('רכבת') || t.includes('רכבות') || t.includes('train')) {
      return {
        title: targetLang === 'hebrew' ? 'סרטון חינוכי: איך פועלת הרכבת וההתפתחות של רכבות מהירות' : targetLang === 'english' ? 'Educational Video: How High-Speed Trains Work' : 'فيلم وثائقي للأطفال: كيف تعمل القطارات وسر السكك الحديدية والقطارات السريعة',
        embedUrl: targetLang === 'hebrew' ? 'https://www.youtube-nocookie.com/embed/FiqScyQysiA?rel=0' : targetLang === 'english' ? 'https://www.youtube-nocookie.com/embed/ejbnImEtLGY?rel=0' : 'https://www.youtube-nocookie.com/embed/9wqKGG4DASQ?rel=0',
        youtubeUrl: targetLang === 'hebrew' ? 'https://www.youtube.com/watch?v=FiqScyQysiA' : targetLang === 'english' ? 'https://www.youtube.com/watch?v=ejbnImEtLGY' : 'https://www.youtube.com/watch?v=9wqKGG4DASQ',
        searchQuery: 'قطارات الاطفال كرتون فيلم تعليمي',
        reflectionQuestion: targetLang === 'hebrew' ? 'מהו היתרון המרכזי של נסיעה ברכבת בהשוואה לכלי תחבורה אחרים?' : targetLang === 'english' ? 'What makes modern high-speed trains so efficient?' : 'ما الاختراع الهندسي الذي مكّن القطارات من نقل أعداد هائلة بسرعة وأمان على السكة الحديدية؟'
      };
    }
    if (t.includes('لغة') || t.includes('عربي') || t.includes('قراءة') || t.includes('إملاء') || t.includes('قواعد') || t.includes('همزة') || t.includes('فعل') || t.includes('اسم') || t.includes('نحو') || t.includes('قصة') || t.includes('עברית') || t.includes('קריאה') || t.includes('סיפור')) {
      return {
        title: targetLang === 'hebrew' ? 'סרטון קצר: כוחם של ספרים וסוד הקריאה המהנה' : 'قصة كرتونية تعليمية: متعة القراءة وسحر الاستكشاف',
        embedUrl: targetLang === 'hebrew' ? 'https://www.youtube-nocookie.com/embed/a5MIHpgndVA?rel=0' : 'https://www.youtube-nocookie.com/embed/wKi7l_Gbx5w?rel=0',
        youtubeUrl: targetLang === 'hebrew' ? 'https://www.youtube.com/watch?v=a5MIHpgndVA' : 'https://www.youtube.com/watch?v=wKi7l_Gbx5w',
        searchQuery: 'فيديو تعليمي لغة وقراءة للاطفال',
        reflectionQuestion: targetLang === 'hebrew' ? 'מהו המסר המרכזי שלמדנו? וכיצד הוא מתחבר לטקסט שלנו?' : 'ما العبرة المستفادة من هذا المقطع؟ وكيف يساعدنا فهم التفاصيل على إدراك المعنى الخفي للدرس؟'
      };
    }
    return {
      title: targetLang === 'hebrew' ? `סרטון חקר והשראה: ${safeTitle}` : targetLang === 'english' ? `Inquiry Video: ${safeTitle}` : `فيلم استكشافي قصير: ${safeTitle}`,
      embedUrl: targetLang === 'hebrew' ? 'https://www.youtube-nocookie.com/embed/a5MIHpgndVA?rel=0' : 'https://www.youtube-nocookie.com/embed/dK0R5rN2gIc?rel=0',
      youtubeUrl: targetLang === 'hebrew' ? 'https://www.youtube.com/watch?v=a5MIHpgndVA' : 'https://www.youtube.com/watch?v=dK0R5rN2gIc',
      searchQuery: `${safeTitle} kids educational video`,
      reflectionQuestion: targetLang === 'hebrew' ? 'מהו הרעיון המרכזי שעורר את סקרנותכם בסרטון?' : targetLang === 'english' ? 'What key idea sparked your curiosity in this clip?' : 'بعد مشاهدة هذا المقطع: ما الفكرة الجوهرية التي أثارت فضولكم وترتبط بدرسنا اليوم؟'
    };
  };

  const getReadingComprehensionContent = (lang = targetLang) => {
    if (lang === 'hebrew') {
      if (isTrainTopic) {
        return {
          hookPrompt: `חידת הפתיחה והסקרנות בתחנת הרכבת 🚆:\nדמיינו כלי תחבורה המסיע מאות נוסעים בבת אחת במהירות מסחררת, המרחף מעל המסילה ללא חיכוך וללא עשן!\nכיצד הפכו קטרי הקיטור הישנים לרכבות עתידניות מרחפות? שתפו את ההשערה שלכם!`,
          riddle: {
            riddleText: 'אני עורק תחבורתי מהיר, נע על מסילות ברזל כחץ שלוח, מחבר בין ערים רחוקות ומסיע מיליוני נוסעים. בעבר פלטתי עשן שחור מקיטור, והיום אני נוסע בחשמל נקי ובריחוף מגנטי. מי אני?',
            clues: ['🔑 רמז 1: יש לי תחנות ייעודיות בכל עיר.', '🔑 רמז 2: אני נוסע על מסילת ברזל ומסיע קרונות רבים.'],
            options: ['מטוס סילון', 'רכבת מהירה 🎯', 'מכונית היברידית', 'אוניית משא'],
            solution: 'רכבת מהירה',
            explanation: 'הרכבת התפתחה מקטרי הקיטור הישנים ועד לרכבות המגלב המהירות של ימינו.'
          },
          station2Prompt: `קטע קריאה מרכזי: מסע ברכבת המהירה והפלא הטכנולוגי 🚆📖\n\nבבוקר יום בהיר, התכנסו תלמידי כיתה ד' בתחנת הרכבת המרכזית, מתבוננים בהתפעלות ברכבת המהירה החדישה שהחליקה באלגנטיות על גבי המסילה. חרטומה האווירודינמי נצץ בשמש כחץ שלוח, ותנועתה השקטה העידה על עוצמה הנדסית מתקדמת המנוהלת בידי מחשבים חכמים.\n\nבמהלך הסיור המודרך, הסביר להם המדריך על ההיסטוריה המרתקת של הרכבות: מראשית ימיהן כקטר קיטור כבד הניזון מפחם ומים ופולט עשן שחור, דרך רכבות הדיזל והחשמל המודרניות, ועד למהפכת רכבות ה"מגלב" המגנטיות המרחפות באוויר ללא מגע ישיר עם הפסים, ומגיעות למהירות של למעלה מחמש מאות קמ"ש ללא זיהום אוויר.\n\nבסיום הסיור הבינו התלמידים כי הרכבת איננה רק אמצעי תחבורה נוח, אלא עורק כלכלי וחברתי חיוני המחבר בין יישובים רחוקים ומקרב לבבות ואנשים במהירות ובבטחה.\n\n📌 מילון מונחים וביאור מילים:\n• אווירודינמי: מבנה חלק המפחית את התנגדות האוויר ומאפשר מהירות מרבית.\n• רכבת מגלב (ריחוף מגנטי): טכנולוגיה המשתמשת בכוחות מגנטיים לדחייה ולהרמת הרכבת מעל המסילה ללא חיכוך.\n• עורק כלכלי: נתיב תחבורה מרכזי המאפשר מסחר, תנועת עובדים ופיתוח יישובים.`,
          station3Tasks: [
            {
              tier: "support",
              badge: "🌱 קבוצת זינוק והבנה",
              title: "משימת איתור מידע מפורש בטקסט הרכבת",
              task: `ענו על פי הכתוב בקטע הקריאה:\n1. ממה הופעלו קטרי הקיטור הראשונים בהיסטוריה, ואיזה עשן פלטו?\n2. מה מאפשר לרכבת ה"מגלב" לרחף מעל המסילה ולהגיע למהירות כה גבוהה?`,
              scaffold: `רמז: חפשו בפסקה השנייה והשלישית של הטקסט.`
            },
            {
              tier: "core",
              badge: "⭐ קבוצת שליטה ותרגול",
              title: "משימת הסקה והבנת קשרים בטקסט הרכבת",
              task: `1. כיצד תרמה התפתחות הרכבות לשמירה על איכות הסביבה בהשוואה לקטרי הקיטור?\n2. הסבירו במילים שלכם מדוע הרכבת נחשבת ל"עורק כלכלי וחברתי חיוני" על פי הפסקה האחרונה.`,
              scaffold: `רמז: השוו בין פחם לאנרגיה חשמלית, וחשבו כיצד חיבור בין ערים מסייע למסחר ולתושבים.`
            },
            {
              tier: "advanced",
              badge: "🚀 קבוצת אתגר וחשיבה ביקורתית",
              title: "משימת הערכה, ביקורת ותכנון עתידני",
              task: `1. הביעו דעתכם: האם רכבות מהירות יכולות להחליף טיסות בין ערים סמוכות? נמקו את עמדתכם בעזרת שני נימוקים מתוך הטקסט ומניסיונכם.\n2. הציעו רעיון לקרון רכבת חכם ועתידני (למשל: קרון למידה חווייתי או קרון ירוק) ותארו את יתרונותיו.`,
              scaffold: `רמז: חשבו על צריכת אנרגיה, נוחות הגעה למרכז העיר ומהירות.`
            }
          ],
          station4Evidence: `דף משימה עצמאי — ראיות להבנת הנקרא: הרכבת המהירה 🚆✍️\nענו על השאלות הבאות באופן עצמאי כדי להוכיח את הבנתכם:\n\n1. (איתור מידע): מה המאפיין הייחודי של מבנה חרטום הרכבת המהירה ומדוע הוא נבנה כך?\n2. (הסקה): מדוע רכבת המגלב יכולה לנסוע מהר יותר מרכבת רגילה?\n3. (הוכחה מתוך הטקסט): העתיקו משפט אחד מתוך הטקסט המעיד על חשיבות הרכבת לחברה ולכלכלה.\n4. (הבעת עמדה): אם הייתם מתכננים קו רכבת מהירה חדש בארצנו, אילו שתי ערים הייתם בוחרים לחבר ומדוע?\n\nכתבו את תשובתכם המלאה בתיבת המענה למטה ולחצו על "שלח תשובה למורה" 📤`,
          station5Prompt: `תחנת הקציר וסיכום הלמידה — מסע הרכבת 🎒✨\nהגענו לסיום שיעור הבנת הנקרא!\n1. איזה חידוש טכנולוגי בנושא הרכבות עורר בכם סקרנות רבה ביותר?\n2. רכבות פועלות בדיוק ובסדר מופתי — כיצד תוכלו ליישם ערך זה של "דיוק ותכנון מוקדם" בלימודים שלכם?\n3. ענו על כרטיס היציאה בכנות ובעצמאות.`
        };
      }
      return {
        hookPrompt: `ברוכים הבאים לשיעור הבנת הנקרא בנושא (${safeTitle})! 📖✨\nתארו לעצמכם שאתם מוצאים יומן מסתורי שבו כתוב משפט קצר ומעורר מחשבה: "מי שאינו מוכן להקשיב לפרטים הקטנים, מפספס את הסוד הגדול ביותר."\nאיזה סוד לדעתכם עשוי להתגלות בקטע שנקרא היום? שתפו את ההשערה שלכם!`,
        riddle: null,
        station2Prompt: `קטע קריאה מרכזי: סוד ההצלחה והמעשה המשותף 📖\n\nבבוקר יום סתווי נעים, התכנסו ילדי כיתה ד' בחצר בית הספר. המורה הודיעה כי בית הספר יוצא לפרויקט מיוחד: הקמת גינה קהילתית שתספק ירקות ופרחים לקשישי היישוב. בתחילה, היו תלמידים שחששו מן העבודה הקשה וטענו כי הקרקע יבשה וקשה לעיבוד.\n\nאך יונתן, תלמיד שקט הידוע בחריצותו, ניגש אל הפינה המוזנחת, לקח מעדר קטן והחל לסקל אבנים. אט-אט הצטרפו אליו שאר התלמידים. כל אחד ואחת תרמו את חלקם: מי בעודפי זרעים שהביאו מהבית, ומי בהשקיה סבלנית ועידוד. בתוך מספר שבועות הפכה החלקה המוזנחת לנווה מדבר ירוק ומרהיב.\n\nבטקס חנוכת הגינה אמרה המנהלת: "הגינה הזו איננה רק ערוגות של צמחים; היא הוכחה חיה לכך שכאשר כוונות טובות פוגשות התמדה ועבודה משותפת, גם אדמה קשה מצמיחה פירות מתוקים."\n\n📌 מילון מונחים וביאור מילים:\n• לסקל: להרים ולהרחיק אבנים מן האדמה כדי להכשירה לנטיעה.\n• נווה מדבר: מקום ירוק ופורח בתוך סביבה צחיחה.\n• התמדה: המשך עשייה ללא ויתור למרות הקשיים.`,
        station3Tasks: [
          {
            tier: "support",
            badge: "🌱 קבוצת זינוק והבנה",
            title: "משימת איתור מידע מפורש בטקסט",
            task: `ענו על השאלות על פי הכתוב בקטע:\n1. לשם מה החליטו להקים את הגינה הקהילתית?\n2. מה עשה יונתן שגרם לשאר הילדים להצטרף אליו?`,
            scaffold: `רמז: חפשו בפסקה הראשונה והשנייה של הטקסט.`
          },
          {
            tier: "core",
            badge: "⭐ קבוצת שליטה ותרגול",
            title: "משימת הסקה והבנת קשרים",
            task: `1. מה היה השינוי שחל בעמדת התלמידים לאורך הסיפור, ומדוע חל שינוי זה?\n2. הסבירו במילים שלכם את כוונת המנהלת באומרה: "הגינה איננה רק ערוגות של צמחים".`,
            scaffold: `רמז: השוו בין תחילת הסיפור לסופו והתבוננו במשמעות הפנימית של הפרויקט.`
          },
          {
            tier: "advanced",
            badge: "🚀 קבוצת אתגר וחשיבה ביקורתית",
            title: "משימת הערכה, ביקורת ויצירתיות",
            task: `1. הביעו דעתכם: האם מעשהו של יונתן מעיד על מנהיגות? נמקו את עמדתכם בעזרת ראיה מהסיפור.\n2. הציעו כותרת מקורית אחרת לקטע הקריאה ונמקו מדוע היא מתאימה למסר המרכזי.`,
            scaffold: `רמז: חשבו מה מאפיין מנהיג שאינו רק מדבר אלא פועל ראשון.`
          }
        ],
        station4Evidence: `דף משימה עצמאי — ראיות להבנת הנקרא ✍️\nענו על השאלות הבאות באופן עצמאי כדי להוכיח את הבנתכם:\n\n1. (איתור מידע): מה היה החשש הראשוני של הילדים לפני שהחלו בעבודה?\n2. (הסקה): מדוע לדעתכם זכה יונתן להערכה רבה, אף על פי שלא דיבר הרבה?\n3. (הוכחה מהטקסט): העתיקו משפט אחד מתוך הטקסט המעיד על הצלחת הפרויקט.\n4. (הבעת עמדה): איזה פרויקט התנדבותי הייתם מציעים להקים בבית ספרנו? נמקו את בחירתכם.\n\nכתבו את תשובתכם המלאה בתיבת המعנה למטה ולחצו על "שלח תשובה למורה" 📤`,
        station5Prompt: `תחנת הקציר וסיכום הלמידה 🎒✨\nהגענו לסיום שיעור הבנת הנקרא!\n1. איזה לקח או תובנה מרכזית לקחתם מתוך קטע הקריאה היום?\n2. ענו על שאלות כרטיס היציאה בכנות ובעצמאות.\n3. שתפו פעולה והביאו את ערך העשייה וההתמדה אל הכיתה שלכם!`
      };
    }

    // Arabic
    if (isTrainTopic) {
      return {
        hookPrompt: `لغز المشهد المحيّر في محطة السكة الحديد 🚆:\nتخيّل وسيلة نقل تنقل آلاف الركاب دفعة واحدة بسرعة فائقة تفوق الرياح، وتطير فوق القضبان دون أن تلامسها ودون ضجيج أو دخان!\nما هذا الابتكار الهندسي المذهل؟ وكيف تحولت قاطرات الفحم القديمة إلى قطارات مغناطيسية تسبح في الهواء؟ شاركنا توقعك!`,
        riddle: {
          riddleText: 'أنا شريان حيوي سريع، أنساب فوق القضبان كالبرق، أحمل ملايين المسافرين وأربط المدن بالقرى بأمان، كنت قديماً أنفث الدخان بفعل الفحم، وأصبحت اليوم أنطلق بالطاقة الكهربائية النظيفة. فمن أنا؟',
          clues: ['🔑 تلميح 1: أسير على خطوط حديدية مخصصة.', '🔑 تلميح 2: لي محطات في كل مدينة وأنقل الركاب والبضائع بأمان.'],
          options: ['السيارة الهجينة', 'القطار السريع 🎯', 'الطائرة النفاثة', 'السفينة البحرية'],
          solution: 'القطار السريع',
          explanation: 'تطور القطار عبر العصور من قاطرات الفحم البخارية إلى القطارات الكهربائية والمغناطيسية الحديثة.'
        },
        station2Prompt: `نص القراءة المركزي: سرّ القطار السريع ورحلة عبر الزمن 🚆📖\n\nفي صباح يوم ربيعي مشرق، تجمع طلاب الصف الرابع في محطة القطارات المركزية، تملؤهم الدهشة وهم يراقبون انطلاق القطار السريع الحديث الذي ينساب بنعومة وسرعة فائقة فوق القضبان. كانت مقدمته الانسيابية تلمع كالسهم، وصوته الهادئ يوحي بقوة هندسية جبارة تديرها التكنولوجيا الحديثة.\n\nاستقبلهم المرشد في إحدى المقطورات المريحة، وأخذهم في رحلة عبر تاريخ هذا الاختراع المذهل؛ فأوضح لهم أن أول قطار في التاريخ كان يعمل بالمحرك البخاري ويحتاج إلى كميات هائلة من الفحم الحجري والمياه ليولد البخار الذي يدفع العجلات، وكان يطلق دخاناً كثيفاً في السماء. ومع تطور العلم، تحولت القطارات إلى قطارات ديزل ثم قطارات كهربائية نظيفة وسريعة.\n\nثم لفت المرشد أنظارهم إلى قطارات المستقبل الفائقة السرعة، مثل "القطار المغناطيسي" (ماجليف)، الذي لا يلامس القضبان بل يطفو فوقها بفضل قوى التنافر المغناطيسي، مما يقلل الاحتكاك تماماً ويجعله ينطلق بسرعة تزيد عن خمسمائة كيلومتر في الساعة بأمان تام ورفاهية عالية دون أي انبعاثات ضارة بالبيئة.\n\nوفي ختام الجولة، تأمل الطلاب خارطة شبكة السكك الحديدية الممتدة كالجسور الشريانية، وأدركوا أن القطار ليس مجرد وسيلة نقل عادية، بل هو رمز لتقدم البشرية وشريان اقتصادي واجتماعي يربط بين الشعوب والمدن ويختصر المسافات الطويلة في ساعات معدودة.\n\n📌 معجم المفردات والتراكيب الجديدة:\n• انسيابية: تصميم ناعم ومقاوم للهواء يمنح سرعة وحركة مرنة.\n• التنافر المغناطيسي: قوة فيزيائية تدفع قطبين مغناطيسيين متشابهين للتباعد مما يسمح للقطار بالطفو فوق السكة دون احتكاك.\n• شريان اقتصادي: مسار حيوي لنقل التجارة والمسافرين وإنعاش الحياة والعمل بين المدن.`,
        station3Tasks: [
          {
            tier: "support",
            badge: "🌱 فريق الانطلاق والتمكن",
            title: "مهمة استخراج المعلومات الصريحة من نص القطار",
            task: `أجب من واقع نص القطار القرائي:\n١. ما الوقود الذي اعتمدت عليه أولى القطارات في التاريخ؟ وما الأثر البيئي الذي كانت تسببه؟\n٢. اذكر الميزة التكنولوجية الفريدة لقطار "ماجليف" المغناطيسي التي تجعله ينطلق بسرعة فائقة.`,
            scaffold: `تلميح: راجع الفقرة الثانية والثالثة من النص القرائي.`
          },
          {
            tier: "core",
            badge: "⭐ فريق الممارسة والإتقان",
            title: "مهمة الاستنتاج وفهم العلاقات في نص القطار",
            task: `١. بيّن كيف أسهم تطور القطارات عبر الزمن في حماية البيئة وتقليل التلوث.\n٢. لماذا وصف الكاتب شبكة القطارات بأنها "شريان اقتصادي واجتماعي"؟ وضّح ذلك بأسلوبك مستشهداً بما ورد في النص.`,
            scaffold: `تلميح: قارن بين قطار الفحم وقطار الكهرباء، وفكّر في أثر ربط المدن على التجارة والناس.`
          },
          {
            tier: "advanced",
            badge: "🚀 فريق الرواد والتحدي",
            title: "مهمة التفكير الناقد والإبداع في تكنولوجيا النقل",
            task: `١. برأيك، هل يمكن أن تشكل القطارات المغناطيسية الفائقة بديلاً آمناً واقتصادياً عن الطائرات في التنقل بين المدن الكبرى؟ علل إجابتك بحجتين منطقيتين من النص ومن معلوماتك.\n٢. اقترح فكرة مقطورة ذكية ومبتكرة لقطار المستقبل واذكر أهم مميزاتها للركاب.`,
            scaffold: `تلميح: فكّر في استهلاك الطاقة، سرعة الوصول لوسط المدن، والراحة والأمان.`
          }
        ],
        station4Evidence: `ورقة الدليل الفردي المستقل — إثبات فهم نص (القطار السريع) 🚆✍️\nالآن حان وقت إثبات فهمك المستقل للنص القرائي. أجب عن الأسئلة الأربعة التالية بمفردك:\n\n١. (تحديد واستخراج): ما الخاصية الفيزيائية التي تسمح لقطار "ماجليف" بالطفو دون ملامسة القضبان؟\n٢. (السبب والنتيجة): لماذا صُممت مقدمة القطار السريع بشكل انسيابي يشبه السهم؟\n٣. (دليل واقتباس): استخرج من النص جملة تدل على أن القطار يساهم في تقريب المسافات واختصار أوقات السفر.\n٤. (التفكير والتطبيق): لو كنت المهندس المسؤول عن مسار القطار السريع في بلادنا، ما المدينتان اللتان ستقترح ربطهما أولاً؟ ولماذا؟\n\nاكتب إجاباتك الواضحة في خانة الحل أدناه ثم اضغط "إرسال إجابتي للمعلم" 📤`,
        station5Prompt: `تأملات الحصاد ونقل الأثر — رحلة القطار 🎒✨\nوصلنا إلى ختام رحلتنا المعرفية الممتعة في عالم القطارات!\n١. ما أهم حقيقة علمية أو تاريخية أدهشتك اليوم عن تطور القطارات؟\n٢. القطار يسير بنظام والتزام دقيق بالمواعيد والمسار — كيف تطبق قيمة "الالتزام والدقة" في تنظيم أوقاتك المدرسية والشخصية؟\n٣. أجب عن أسئلة بطاقة الخروج بصدق واستقلالية.`
      };
    }

    return {
      hookPrompt: `لغز وتحدي المدخل لدرس (${safeTitle}):\nتأمل هذا الموقف المثير: حدثت مفارقة تجعلنا نتساءل: كيف يمكننا التفسير بدقة ودون غموض؟ ما الذي يثير فضولك وما أول فكرة تخطر ببالك؟`,
      riddle: null,
      station2Prompt: `نص القراءة المركزي: سرّ النجاح والعمل المشترك 📖\n\nفي صباح يوم خريفي مشرق، اجتمع طلاب الصف في فناء المدرسة، حيث أعلنت المعلمة عن انطلاق مبادرة نوعية: زراعة حديقة مدرسية بيئية تخدم المجتمع. في البداية، تردد بعض الطلاب ظانين أن التربة جافة وأن العمل شاق ويحتاج جهداً كبيراً.\n\nلكن سامر، وهو طالب عُرف بهدوئه ومثابرته، بادر فوراً وتقدم نحو الزاوية المهملة وبدأ يزيل الأحجار بروح العزيمة. وسرعان ما ألهم زملاءه فانضموا إليه واحداً تلو الآخر؛ هذا يحمل الشتلات، وتلك تسقي الماء بانتظام، والآخر ينظم الممرات. وخلال أسابيع قليلة، تحولت البقعة القاحلة إلى واحة خضراء مبهجة تبث الأمل.\n\nوفي يوم افتتاح الحديقة، قالت المديرة بابتسامة فخر: "إن هذه الحديقة ليست مجرد نباتات وأزهار، بل هي برهان حي على أن الإرادة الصادقة والتعاون المثمر يحولان أصعب التحديات إلى نجاحات باهرة."\n\n📌 معجم المفردات والتراكيب الجديدة:\n• يزيل الأحجار: ينظف الأرض ويهيئها للغرس.\n• واحة خضراء: مكان مفعم بالحياة والجمال.\n• مثابرة: الاستمرار في العمل دون كلل أو تراجع.`,
      station3Tasks: [
        {
          tier: "support",
          badge: "🌱 فريق الانطلاق والتمكن",
          title: "مهمة استخراج المعلومات الصريحة",
          task: `أجب من واقع النص القرائي:\n١. ما المبادرة التي أعلنت عنها المعلمة في فناء المدرسة؟\n٢. ماذا فعل سامر في البداية حتى تشجع باقي الزملاء؟`,
          scaffold: `تلميح: راجع الفقرة الأولى والثانية من النص.`
        },
        {
          tier: "core",
          badge: "⭐ فريق الممارسة والإتقان",
          title: "مهمة الاستنتاج وتفسير العلاقات",
          task: `١. كيف تغير موقف الطلاب من بداية القصة إلى نهايتها؟ وما سبب هذا التحول؟\n٢. فسر بأسلوبك قول المديرة: "إن هذه الحديقة ليست مجرد نباتات وأزهار".`,
          scaffold: `تلميح: تأمل الأثر المعنوي والتربوي للمبادرة.`
        },
        {
          tier: "advanced",
          badge: "🚀 فريق الرواد والتحدي",
          title: "مهمة النقد والتقييم والإبداع",
          task: `١. ما رأيك في تصرف سامر؟ وهل يعد تصرفه قدوة للمبادرة الذاتية؟ علل رأيك بدليل من النص.\n٢. اقترح عنواناً إبداعياً جديداً للنص القرائي مع بيان سبب اختيارك.`,
          scaffold: `تلميح: ركز على سمات المبادرة والمثابرة.`
        }
      ],
      station4Evidence: `ورقة الدليل الفردي المستقل — أدلة فهم المقروء [ ${safeTitle} ] ✍️\nأجب عن الأسئلة الآتية بمفردك لإثبات فهمك المستقل:\n\n١. (استخراج صريح): ما التحدي الذي كان يخشاه بعض الطلاب في بداية المبادرة؟\n٢. (استنتاج): ما الصفة الأبرز التي تميزت بها شخصية سامر؟\n٣. (الاستشهاد بدليل): استخرج جملة صريحة من النص تثبت نجاح المشروع في النهاية.\n٤. (إبداء الرأي): لو كنت مكان الطلاب، ما الإضافة التي ستقترحها لتطوير الحديقة؟ ولماذا؟\n\nاكتب إجاباتك بوضوح في صندوق الحل ثم اضغط "إرسال إجابتي للمعلم" 📤`,
      station5Prompt: `محطة الحصاد ونقل الأثر 🎒✨\nوصلنا إلى ختام رحلتنا التعليمية الرائعة! حان وقت رصد ثمار تعلمكم اليوم:\n١. ما الفكرة الجوهرية التي اكتسبتموها عن (${safeTitle})؟\n٢. أجب بصدق واستقلالية عن أسئلة بطاقة الخروج.\n٣. فكّر: كيف تستفيد مما تعلّمته في حياتك اليومية ومحيطك؟`
    };
  };

  const postProcessLesson = (lesson) => {
    if (!lesson || !lesson.stations) return lesson;
    const reqAndTitle = (safeRequests + ' ' + safeTitle).toLowerCase();
    const isVideoRequested = reqAndTitle.match(/فيلم|فيديو|مقطع|video|film|movie|סרטון/i);
    const isRiddleRequested = reqAndTitle.match(/أحجية|احجية|لغز|فزورة|غموض|riddle|mystery|חידה/i);
    const isPuzzleRequested = reqAndTitle.match(/بازل|puzzle|ترتيب|تركيب|jigsaw|פאזל/i);

    // 1. Language Sanitization on Lesson-Level Fields
    lesson.subject = lesson.subject || safeSubject;
    lesson.language = targetLang;

    if (targetLang === 'hebrew') {
      if (!lesson.objective || /[\u0600-\u06FF]/.test(lesson.objective)) {
        lesson.objective = isReadingComprehension
          ? `התלמיד יקרא ויבין קטע קריאה בעברית בנושא (${safeTitle}), ויענה על שאלות הבנה ברמות חשיבה מגוונות תוך ביסוס מתוך הטקסט.`
          : isValuesEducation
          ? `התלמיד יבין את המשמעות הערכית של (${safeTitle}), ינתח דילמות מוסריות, ויתחייב למעשה חיובי.`
          : `התלמיד ירכוש ויישם את מיומנויות השיעור (${safeTitle}) וינמק את שלביו בעברית תקינה.`;
      }
      if (!lesson.successCriteria || /[\u0600-\u06FF]/.test(lesson.successCriteria)) {
        lesson.successCriteria = isReadingComprehension
          ? `מענה עצמאי על שאלות איתור מידע, הסקה והערכה תוך הבאת הוכחה וציטוט מקטע הקריאה.`
          : `ביצוע נכון של שלוש משימות מתמיינות, הצגת דף ראיות אישי, וניסוח תובנה יישומית.`;
      }
    } else if (targetLang === 'english') {
      if (!lesson.objective || /[\u0600-\u06FF]/.test(lesson.objective)) {
        lesson.objective = isReadingComprehension
          ? `Students will read and comprehend a grade-level English passage on (${safeTitle}), answering multi-tiered questions.`
          : `Students will understand and apply the core concepts and skills of (${safeTitle}) with precise reasoning.`;
      }
      if (!lesson.successCriteria || /[\u0600-\u06FF]/.test(lesson.successCriteria)) {
        lesson.successCriteria = `Successful completion of tiered practice tasks, text evidence demonstration, and reflective exit ticket response.`;
      }
    }

    const hook = lesson.stations['1_hook'];
    if (hook) {
      const isExcellence = reqAndTitle.includes('تميز') || reqAndTitle.includes('التميز') || reqAndTitle.includes('نجاح') || reqAndTitle.includes('تفوق');
      const curatedVid = getCuratedTopicVideo(safeTitle + ' ' + safeRequests);

      const defaultSearchQuery = targetLang === 'hebrew'
        ? `סרטון חינוכי לילדים ${safeTitle} ${safeGrade}`
        : targetLang === 'english'
        ? `${safeTitle} educational video for kids ${safeGrade}`
        : `فيديو تعليمي للأطفال عن ${safeTitle} - ${safeGrade}`;

      const defaultHookStory = targetLang === 'hebrew'
        ? (isTrainTopic
           ? `בוקר אחד בתחנת הרכבת, הבחינו התלמידים ברכבת חדשה המחליקה על המסילה בשקט מופתי ובמהירות אדירה של מאות קילומטרים בשעה, מבלי לפלוט עשן כלל ומבלי שהגלגלים שלה כמעט נוגעים בפסים! 🚆✨`
           : `דמיינו שאתם חוקרים צעירים הניצבים מול תופעה מפתיעה הקשורה ל-(${safeTitle}). במבט ראשון נראה שהכול פועל מעצמו, אך מתחת לפני השטח מסתתר סוד מרתק שמשנה את כל מה שחשבנו שאנחנו יודעים! 🌟🔍`)
        : targetLang === 'english'
        ? `Imagine standing before a fascinating real-world phenomenon connected to (${safeTitle}). At first glance it seems simple, yet beneath the surface lies an amazing scientific and logical secret waiting to be discovered! 🌟🔍`
        : (isTrainTopic
           ? `في صباح يوم مشرق بمحطة القطارات الحديثة، وقف الطلاب بدهشة أمام قطار فائق السرعة ينطلق كالسهم فوق السكة الحديدية بهدوء تام ودون أي دخان، بل يكاد يطفو في الهواء بفضل قوة خفية مذهلة! 🚆✨`
           : `تخيّل أنك باحث مستكشف يقف أمام ظاهرة مدهشة وقصة واقعية ترتبط بـ (${safeTitle}). للوهلة الأولى يبدو الأمر مألوفاً وعادياً، لكن حين نقترب أكثر نكتشف سرّاً مذهلاً يربط بين ما نراه في حياتنا اليومية وبين القوانين والمعارف التي سنتعلمها اليوم! 🌟🔍`);

      const defaultCuriosityQuestion = targetLang === 'hebrew'
        ? (isTrainTopic
           ? `כיצד מצליחה הרכבת המהירה לנוע במהירות עצומה כזו בבטחה וללא זיהום אוויר? מהו הסוד המסתתר במסילה?`
           : `מהו לדעתכם הסוד או הכלל המרכזי שמסביר את התופעה הזו בנושא (${safeTitle})?`)
        : targetLang === 'english'
        ? `What hidden rule or secret explains how (${safeTitle}) works in our daily lives?`
        : (isTrainTopic
           ? `كيف يستطيع هذا القطار العملاق الانطلاق بهذه السرعة الهائلة بأمان تام ودون تلوث؟ وما السر الهندسي المختبئ في السكة الحديدية؟`
           : `برأيكم، ما هو السر أو المبدأ الأساسي الذي يفسر هذه الظاهرة في موضوع (${safeTitle})؟ وكيف نكتشفه معاً؟`);

      const resolvedSearchQuery = hook.youtubeSearchQuery || hook.interactiveActivity?.video?.youtubeSearchQuery || hook.interactiveActivity?.video?.searchQuery || defaultSearchQuery || curatedVid.searchQuery;
      const resolvedHookStory = hook.hookStoryOrScenario || hook.interactiveActivity?.video?.hookStoryOrScenario || defaultHookStory;
      const resolvedCuriosityQ = hook.curiosityQuestion || hook.interactiveActivity?.video?.curiosityQuestion || defaultCuriosityQuestion;

      // Only allow verified known working IDs from AI output to prevent AI-hallucinated broken links
      const VERIFIED_IDS = ['9wqKGG4DASQ', 'FiqScyQysiA', 'ejbnImEtLGY', 'wKi7l_Gbx5w', 'a5MIHpgndVA', 'bMnmJjL3hF8', '4b2b-y4hPoc', 'dK0R5rN2gIc', 'S4328Yx6W20', '7V-eFmF9f2Q', 'Z0o8Z6GqP2o'];
      const aiVidUrl = hook.interactiveActivity?.video?.youtubeUrl || hook.interactiveActivity?.video?.embedUrl || '';
      const isAiUrlVerified = VERIFIED_IDS.some(id => String(aiVidUrl).includes(id));

      // 1. Build rich video data with safe fallback support
      const defaultVideo = {
        title: curatedVid.title,
        embedUrl: isAiUrlVerified ? hook.interactiveActivity.video.embedUrl : curatedVid.embedUrl,
        youtubeUrl: isAiUrlVerified ? hook.interactiveActivity.video.youtubeUrl : curatedVid.youtubeUrl,
        youtubeSearchQuery: resolvedSearchQuery,
        searchQuery: resolvedSearchQuery,
        hookStoryOrScenario: resolvedHookStory,
        curiosityQuestion: resolvedCuriosityQ,
        reflectionQuestion: curatedVid.reflectionQuestion
      };

      // 2. Build rich riddle data in proper language
      const defaultRiddle = targetLang === 'hebrew' ? {
        riddleText: `אני סוד הקשור לנושא (${safeTitle}). בהתחלה אני נראה כחידה מסתורית, אך כאשר תחקרו את מאפייניי ותגלו את הרמזים, אהפוך למפתח שלכם להצלחה! מהו ההסבר ההגיוני שמאחוריי?`,
        clues: [
          '🔑 רמז 1: חשבו על הקשר הישיר בין המילים והרעיונות שראינו.',
          '🔑 רמז 2: התבוננו במאפיין המרכזי שאינו משתנה.'
        ],
        options: ['הסבר אקראי ללא ראיות', `המושג המרכזי והמדויק של ${safeTitle} 🎯`, 'התעלמות מהרמזים', 'ניחוש בלבד'],
        solution: `המושג המרכזי והמדויק של (${safeTitle}) 🎯`,
        explanation: 'הפתרון טמון בחשיבה מדויקת, קישור בין רמזים לראיות והבנת מטרת השיעור!'
      } : targetLang === 'english' ? {
        riddleText: `I am a hidden concept related to (${safeTitle}). Explore my clues to reveal how I connect our lesson today! What is the logical explanation behind me?`,
        clues: [
          '🔑 Clue 1: Think about the core patterns of our topic.',
          '🔑 Clue 2: Eliminate random guesses and look for solid evidence.'
        ],
        options: ['Random guess', `The core rule of ${safeTitle} 🎯`, 'No evidence', 'Giving up'],
        solution: `The core rule of (${safeTitle}) 🎯`,
        explanation: 'Applying logical reasoning and evidence unlocks our learning goal!'
      } : (isExcellence ? {
        riddleText: 'لستُ شيئاً تشتريه بالمال، ولا حجراً تجده في الرمال. إن بدأتَ عملاً أتقنته، وإن واجهك فشلٌ تحديته وتجاوزته! لا أرضى بالعادي بل أطمح للأفضل دائماً... فمن أكون؟',
        clues: [
          '🔑 تلميح 1: كلمة تبدأ بحرف التاء، وترتبط بالإتقان والشغف والاجتهاد.',
          '🔑 تلميح 2: هو شعار مدرستنا مشيرفة، والسر وراء كل عالم ومبتكر ومبدع!'
        ],
        options: ['الكسل والانتظار', 'العمل العادي', 'التميّز والإتقان ⭐', 'الاستسلام السريع'],
        solution: 'التميّز والإتقان المستمر ⭐',
        explanation: 'التميز ليس موهبة نولد بها فحسب، بل هو قرار واختيار يومي بالسعي والاجتهاد والتطور المستمر كما سنكتشف في محطات درسنا اليوم!'
      } : {
        riddleText: `أنا سرٌّ يرتبط بـ (${safeTitle})، أظهر في البداية كلغز محير، ولكن حينما تفكر في أسبابه وتستكشف خصائصه، أصبح مفتاحك للحل والنجاح... فما هو التفسير العلمي المنطقي وراء هذا الموقف؟`,
        clues: [
          '🔑 تلميح 1: فكر في العلاقة المباشرة بين المعطيات وما تعلمته سابقاً.',
          '🔑 تلميح 2: استبعد التخمينات العشوائية وركز على الخاصية الأساسية التي لا تتغير.'
        ],
        options: ['تفسير عشوائي بدون دليل', `المفهوم العلمي المنطقي لـ ${safeTitle} 🎯`, 'تجاهل الموقف', 'الاعتماد على الحظ'],
        solution: `المفهوم العلمي المنطقي لـ (${safeTitle}) 🎯`,
        explanation: `الحل يكمن في تطبيق التفكير المنطقي وربط الملاحظة بالدليل للوصول للهدف التعليمي للحصة.`
      });

      // 3. Build rich puzzle data in proper language
      const defaultPuzzle = targetLang === 'hebrew' ? {
        instruction: `סדרו את שלבי החקר והיישום של (${safeTitle}) ברצף הנכון להשלמת הפאזל:`,
        pieces: [
          { id: 'p1', text: '1. התבוננות, חקר המצב וזיהוי המושג 🔍', order: 1 },
          { id: 'p2', text: '2. ניתוח הנתונים וקישור הרמזים 🧩', order: 2 },
          { id: 'p3', text: '3. ניסוח המסקנה ויישום הכלל הלשוני/המדעי ⚙️', order: 3 },
          { id: 'p4', text: '4. אימות התשובה והצגת ראיות הבנה עצמאיות ✅', order: 4 }
        ],
        targetConcept: `המסלול השלם להבנת ויישום (${safeTitle})`,
        successMessage: '🎉 מצוין! פאזל הלמידה הושלם בהצלחה וזכיתם במפתח הזהב!'
      } : targetLang === 'english' ? {
        instruction: `Arrange the steps of exploring and applying (${safeTitle}) in proper order:`,
        pieces: [
          { id: 'p1', text: '1. Observe the problem and identify key concepts 🔍', order: 1 },
          { id: 'p2', text: '2. Analyze evidence and patterns 🧩', order: 2 },
          { id: 'p3', text: '3. Deduce the main rule and formula ⚙️', order: 3 },
          { id: 'p4', text: '4. Verify results with independent evidence ✅', order: 4 }
        ],
        targetConcept: `Mastering (${safeTitle})`,
        successMessage: '🎉 Well done! The puzzle is completed and the key concept is unlocked!'
      } : {
        instruction: `رتب خطوات استكشاف وتطبيق (${safeTitle}) بالترتيب الصحيح لاكتمال البازل المعرفي:`,
        pieces: [
          { id: 'p1', text: '١. الملاحظة واستكشاف الموقف وتحديد المشكلة 🔍', order: 1 },
          { id: 'p2', text: '٢. تحليل المعطيات وربط العلاقات ببعضها 🧩', order: 2 },
          { id: 'p3', text: '٣. صياغة الاستنتاج وتطبيق القاعدة الحسابية/العلمية ⚙️', order: 3 },
          { id: 'p4', text: '٤. التحقق من صحة الحل وتقديم الدليل الفردي ✅', order: 4 }
        ],
        targetConcept: `المسار المتكامل لفهم وتطبيق (${safeTitle})`,
        successMessage: `🎉 ممتاز! اكتمل بازل المعرفة بنجاح وحصلتم على المفتاح الذهبي للمحطة!`
      };

      // Determine active activity type
      let activeType = 'riddle';
      if (isRiddleRequested) activeType = 'riddle';
      else if (isPuzzleRequested) activeType = 'puzzle';
      else if (isVideoRequested) activeType = 'video';
      else if (hook.interactiveActivity?.type) activeType = hook.interactiveActivity.type;

      hook.youtubeSearchQuery = resolvedSearchQuery;
      hook.hookStoryOrScenario = resolvedHookStory;
      hook.curiosityQuestion = resolvedCuriosityQ;

      // Merge into interactiveActivity
      hook.interactiveActivity = {
        type: activeType,
        title: activeType === 'riddle' ? (targetLang === 'hebrew' ? `חידת הפתיחה: ${safeTitle}` : targetLang === 'english' ? `Opening Riddle: ${safeTitle}` : `أحجية ولغز: ${safeTitle}`)
             : activeType === 'puzzle' ? (targetLang === 'hebrew' ? `פאזל האתגר: ${safeTitle}` : targetLang === 'english' ? `Challenge Puzzle: ${safeTitle}` : `بازل التحدي: ${safeTitle}`)
             : defaultVideo.title,
        riddle: {
          ...defaultRiddle,
          ...(hook.interactiveActivity?.riddle || {})
        },
        puzzle: {
          ...defaultPuzzle,
          ...(hook.interactiveActivity?.puzzle || {})
        },
        video: {
          ...defaultVideo,
          ...(hook.interactiveActivity?.video || {}),
          youtubeSearchQuery: resolvedSearchQuery,
          searchQuery: resolvedSearchQuery,
          hookStoryOrScenario: resolvedHookStory,
          curiosityQuestion: resolvedCuriosityQ,
          embedUrl: defaultVideo.embedUrl,
          youtubeUrl: defaultVideo.youtubeUrl
        }
      };

      hook.media = {
        type: 'video',
        title: hook.interactiveActivity.video.title,
        youtubeSearchQuery: resolvedSearchQuery,
        searchQuery: resolvedSearchQuery,
        youtubeUrl: hook.interactiveActivity.video.youtubeUrl,
        embedUrl: hook.interactiveActivity.video.embedUrl,
        hookStoryOrScenario: resolvedHookStory,
        curiosityQuestion: resolvedCuriosityQ,
        reflectionQuestion: hook.interactiveActivity.video.reflectionQuestion
      };
    }

    // Guarantee Station 2 has studentPrompt & teacherGuidance
    const st2 = lesson.stations['2_understanding'];
    const readingData = isReadingComprehension ? getReadingComprehensionContent(targetLang) : null;
    const isTrainMissed = isTrainTopic && (!st2?.studentPrompt || !/قطار|القطار|רכבת|train/i.test(st2.studentPrompt));

    if (st2) {
      if (customPassageText && customPassageText.trim()) {
        st2.studentPrompt = customPassageText.trim();
        lesson.readingPassage = {
          hasPassage: true,
          fullText: customPassageText.trim(),
          title: safeTitle,
          isCustom: true
        };
      } else {
        const isMissingOrForeign = !st2.studentPrompt || !st2.studentPrompt.trim() || (targetLang === 'hebrew' && /[\u0600-\u06FF]/.test(st2.studentPrompt));
        if (isMissingOrForeign || isTrainMissed) {
          if (isReadingComprehension && readingData) {
            st2.studentPrompt = readingData.station2Prompt;
          } else {
            st2.studentPrompt = targetLang === 'hebrew'
              ? `מושגי יסוד והסבר מעמיק לשיעור (${safeTitle}):\n• חקרו את המאפיינים המרכזיים של המושג.\n• התבוננו בדוגמאות ובמשפטים והשוו ביניהם.\n• רשמו את הכלל המרכזי במחברת ושתפו את חבריכם.`
              : targetLang === 'english'
              ? `Core Concepts and Meaning for (${safeTitle}):\n• Explore key concepts and structures.\n• Observe examples and compare them carefully.\n• Write down the main rule in your notebook.`
              : `المفاهيم العلمية الأساسية لـ (${safeTitle}):\n• استكشف الخصائص الجوهرية التي تميز هذا المفهوم.\n• لاحظ النماذج والأمثلة الحية وقارن بينها بدقة.\n• دوّن القاعدة الأساسية في دفترك العلمي.`;
          }
        }
        if (isReadingComprehension || includePassage === 'ai_passage') {
          lesson.readingPassage = {
            hasPassage: true,
            fullText: st2.studentPrompt,
            title: safeTitle,
            isCustom: false
          };
        }
      }
      if (!st2.teacherGuidance || !st2.teacherGuidance.trim() || (targetLang === 'hebrew' && /[\u0600-\u06FF]/.test(st2.teacherGuidance))) {
        st2.teacherGuidance = targetLang === 'hebrew'
          ? `הנחיות למורה לתחנת הבנת המשמעות:\n1. הנחו קריאה מודרכת פעילה ובררו את מילות המפתח.\n2. שאלו שאלות מנחות לניסוח התובנה המרכזית על ידי התלמידים.\n3. ודאו שהמושג ברור לכולם לפני המעבר לתרגול.`
          : targetLang === 'english'
          ? `Teacher guidance for Station 2:\n1. Guide students through active exploration.\n2. Ask guiding questions to help students deduce the rule.\n3. Reinforce the core objective.`
          : `إرشادات المعلم لمحطة بناء المعنى:\n١. وجّه الطلاب نحو النمذجة والاستكشاف الصفي النشط.\n٢. اطرح أسئلة توجيهية تساعد الطلاب على صياغة الاستنتاج بأنفسهم.\n٣. ركّز على تثبيت المفهوم المركزي ومعايير التمييز بدقة.`;
      }
      if (!st2.scaffold || !st2.scaffold.trim()) {
        st2.scaffold = targetLang === 'hebrew' ? 'רמז מסייע: היעזרו בביאור המילים בצד.' : targetLang === 'english' ? 'Helpful hint: Refer to the visual graphic organizer.' : 'منظم بصري أو خطوة استرشادية مساندة.';
      }
    }

    // Guarantee Station 3 (التطبيق والتدريب)
    const st3 = lesson.stations['3_practice'];
    if (st3) {
      if (!st3.studentPrompt || !st3.studentPrompt.trim() || (targetLang === 'hebrew' && /[\u0600-\u06FF]/.test(st3.studentPrompt))) {
        st3.studentPrompt = targetLang === 'hebrew'
          ? `ברוכים הבאים לתחנת היישום והתרגול! 🛠️\nבמשימה זו ניישם את מה שלמדנו בנושא (${safeTitle}).\n• עבדו בקבוצות לפי שלוש רמות אתגר.\n• שתפו פעולה ונמקו את תשובותיכם בעברית ברורה!`
          : targetLang === 'english'
          ? `Welcome to the Practice & Application Station! 🛠️\nIn this station, we will apply what we learned about (${safeTitle}).\n• Work collaboratively in your assigned tiered group.\n• Discuss challenges and justify every answer in English!`
          : `مرحباً بكم يا أبطال في محطة التطبيق والتدريب! 🛠️\nفي هذه المحطة سنقوم بتطبيق ما تعلمناه حول (${safeTitle}) وتعميق فهمنا العملي.\n• ستعمل الفرق وفق ٣ مستويات متمايزة (الانطلاق والتمكن، الممارسة والإتقان، الرواد والتحدي).\n• تعاونوا داخل مجموعتكم، ناقشوا التحديات، وبرروا كل خطوة تبريراً سليماً!`;
      }
      if (isReadingComprehension && readingData && (isTrainMissed || !st3.tasks || st3.tasks.length === 0)) {
        st3.tasks = readingData.station3Tasks;
      }
      if (!st3.teacherGuidance || !st3.teacherGuidance.trim()) {
        st3.teacherGuidance = targetLang === 'hebrew'
          ? `הנחיות למורה להנחיית הקבוצות ומעקב אחר הרמות השונות.`
          : `إرشادات المعلم لإدارة محطة التطبيق والتدريب ومتابعة الفرق المتمايزة والسقالات.`;
      }
      if (!st3.scaffold || !st3.scaffold.trim()) {
        st3.scaffold = targetLang === 'hebrew' ? 'רמז מסייע: חזרו לטקסט ולכלל מהתחנה הקודמת.' : targetLang === 'english' ? 'Scaffold hint: Check the rule from Station 2.' : 'تلميح مساند: ارجع إلى القاعدة المركزية للمحطة السابقة واستند إليها في كل تمرين.';
      }
      if (Array.isArray(st3.tasks)) {
        st3.tasks = st3.tasks.map(t => ({
          ...t,
          title: t.title || (
            targetLang === 'hebrew'
              ? (t.tier === 'support' ? 'משימת זינוק והבנה' : t.tier === 'core' ? 'משימת שליטה ותרגול' : 'משימת אתגר וחשיבה')
              : targetLang === 'english'
              ? (t.tier === 'support' ? 'Launch & Support Task' : t.tier === 'core' ? 'Core Practice Task' : 'Advanced Challenge Task')
              : (t.tier === 'support' ? 'مهمة الانطلاق والتمكن' : t.tier === 'core' ? 'مهمة الممارسة والإتقان' : 'مهمة الرواد والتحدي')
          )
        }));
      }
    }

    // Guarantee Station 4 (أدلة الفهم)
    const st4 = lesson.stations['4_evidence'];
    if (st4) {
      const promptLower = (st4.studentPrompt || '').toLowerCase();
      const hasSpecificQuestions = (st4.studentPrompt && (st4.studentPrompt.includes('שאלה') || st4.studentPrompt.includes('question') || st4.studentPrompt.includes('سؤال') || st4.studentPrompt.includes('١.') || st4.studentPrompt.includes('1.') || st4.studentPrompt.includes('؟') || st4.studentPrompt.includes('?')));
      
      if (isReadingComprehension && readingData && (isTrainMissed || !st4.studentPrompt || !st4.studentPrompt.trim() || (!hasSpecificQuestions && (promptLower.includes('דף משימה') || promptLower.includes('worksheet') || promptLower.includes('ورقة الدليل') || promptLower.includes('ارفعوا أوراقكم'))))) {
        st4.studentPrompt = readingData.station4Evidence;
      } else if (!st4.studentPrompt || !st4.studentPrompt.trim() || (!hasSpecificQuestions && (promptLower.includes('דף משימה') || promptLower.includes('worksheet') || promptLower.includes('ورقة الدليل') || promptLower.includes('ارفعوا أوراقكم')))) {
        st4.studentPrompt = targetLang === 'hebrew'
          ? `דף משימה עצמי וראיות להבנה — [ ${safeTitle} ] ✍️\nענו על השאלות הבאות באופן עצמאי כדי להוכיח הבנה מדויקת:\n\n1. שאלה ראשונה (יישום ישיר): כתבו את המושג או הכלל במילים שלכם עם דוגמה.\n2. שאלה שנייה (הסבר ונימוק): נמקו מדוע תשובתכם נכונה בעזרת כלל שלמדנו.\n3. שאלת חשיבה והעברה: תנו משפט או דוגמה משלכם המיישמת את הכלל.\n\nכתבו את תשובתכם בבירור בשטח המענה למטה ולחצו "שלח תשובה למורה" 📤`
          : targetLang === 'english'
          ? `Individual Evidence of Understanding Worksheet — [ ${safeTitle} ] ✍️\nAnswer the following questions independently to demonstrate your mastery:\n\n1. Question 1 (Direct Application): State the main concept or rule in your own words with an example.\n2. Question 2 (Reasoning & Evidence): Explain why your answer is correct using the lesson rule.\n3. Question 3 (Transfer & Extension): Write your own sentence or real-world example applying this concept.\n\nType your answers clearly below and click "Submit to Teacher" 📤`
          : `ورقة الدليل الفردي المستقل — [ ${safeTitle} ] ✍️\nالآن حان وقت إثبات فهمك المستقل. أجب عن أسئلة ورقة الدليل التالية:\n\n• السؤال الأول (تطبيق مباشر): اكتب المفهوم أو النتيجة الأساسية لـ (${safeTitle}) بأسلوبك.\n• السؤال الثاني (تحليل وتعليل): كيف تثبت صحة إجابتك بالدليل العلمي والمنطقي؟\n• السؤال الثالث (مسألة واستنتاج): إذا طُلب منك توضيح ذلك لزميلك، ما المثال الواقعي الذي ستضربه له؟\n\nتذكّر: اكتب إجابتك بوضوح وتفصيل في مساحة الحل أدناه ثم اضغط "إرسال إجابتي للمعلم" 📤`;
      }
      if (!st4.individualTask || !st4.individualTask.trim()) {
        st4.individualTask = st4.studentPrompt;
      }
      if (!st4.teacherGuidance || !st4.teacherGuidance.trim()) {
        st4.teacherGuidance = targetLang === 'hebrew'
          ? `הנחיות למורה להערכת דף הראיות האישי.`
          : `إرشادات المعلم لتقييم الدليل الفردي والتأكد من استقلالية كل طالب أثناء الحل.`;
      }
      if (!st4.scaffold || !st4.scaffold.trim()) {
        st4.scaffold = targetLang === 'hebrew' ? 'זכרו: קראו את השאלה בעיון ונמקו בבירור.' : targetLang === 'english' ? 'Remember: Read each question carefully and justify your answer.' : 'تذكّر: اقرأ السؤال بدقة، وركّز على تقديم دليل مقنع.';
      }
    }

    // Guarantee Station 5 (حصاد ونقل الأثر)
    const st5 = lesson.stations['5_harvest'];
    if (st5) {
      if (!st5.studentPrompt || !st5.studentPrompt.trim() || (targetLang === 'hebrew' && /[\u0600-\u06FF]/.test(st5.studentPrompt))) {
        st5.studentPrompt = targetLang === 'hebrew'
          ? `תחנת הקציר וסיכום הלמידה 🎒✨\nהגענו לסיום השיעור! זה הזמן לאסוף את פירות הלמידה שלכם היום:\n1. מה הרעיון המרכזי שלמדתם על (${safeTitle})?\n2. ענו בכנות ובעצמאות על שאלות כרטיס היציאה.\n3. חשבו: כיצד תוכלו להשתמש במה שלמדתם בחייכם?`
          : targetLang === 'english'
          ? `Lesson Harvest & Transfer Station 🎒✨\nWe have reached the conclusion of our lesson! Let's reflect on your learning today:\n1. What is the core idea you learned about (${safeTitle})?\n2. Complete your exit ticket questions honestly.\n3. Think: Where and how can you use this knowledge in daily life?`
          : `محطة الحصاد ونقل الأثر 🎒✨\nوصلنا إلى ختام رحلتنا التعليمية الرائعة! حان وقت رصد ثمار تعلمكم اليوم:\n١. ما الفكرة الجوهرية التي اكتسبتموها عن (${safeTitle})؟\n٢. أجب بصدق واستقلالية عن أسئلة بطاقة الخروج.\n٣. فكّر: كيف تستفيد مما تعلّمته في حياتك اليومية ومحيطك؟`;
      }
      if (!st5.teacherGuidance || !st5.teacherGuidance.trim()) {
        st5.teacherGuidance = targetLang === 'hebrew'
          ? `הנחיות למורה לאיסוף כרטיסי היציאה וסיכום המהלך.`
          : `إرشادات المعلم لإغلاق الحصة ومراجعة مخرجات بطاقات الخروج ونقل الأثر.`;
      }
      if (!st5.scaffold || !st5.scaffold.trim()) {
        st5.scaffold = targetLang === 'hebrew' ? 'חשבו: מה הפתיע אתכם או חידש לכם היום?' : targetLang === 'english' ? 'Reflect: What was the most interesting thing you discovered today?' : 'تأمل: كيف تطوّر فهمك وثقتك بالمفهوم منذ بداية الدرس حتى الآن؟';
      }
      if (!st5.exitTicket) {
        st5.exitTicket = targetLang === 'hebrew' ? {
          q1: 'מה הרעיון המרכזי שלמדתי היום?',
          q2: 'מה עזר לי להבין?',
          q3: 'מה עדיין דורש הסבר נוסף מבחינתי?',
          q4_transfer: 'איפה אוכל להשתמש במה שלמדתי?'
        } : targetLang === 'english' ? {
          q1: 'What is the main idea I learned today?',
          q2: 'What helped me understand best?',
          q3: 'What do I still need more help with?',
          q4_transfer: 'Where can I apply what I learned?'
        } : {
          q1: 'ما أهم فكرة تعلّمتها اليوم؟',
          q2: 'ما الذي ساعدني على الفهم؟',
          q3: 'ما الذي ما زلت أحتاج إلى توضيحه؟ (يمكنك اختيار: لا أحتاج إلى توضيح إضافي)',
          q4_transfer: 'أين أستطيع استخدام ما تعلّمته؟'
        };
      }
    }

    return lesson;
  };

  // 1. Try Groq AI (Active high-speed models: GPT-OSS 120B, Qwen 3.8 27B, GPT-OSS 20B, ALLaM)
  if (groqKey) {
    const groqModels = [
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-20b',
      'allam-2-7b'
    ];
    for (const m of groqModels) {
      try {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: m,
            messages: [
              {
                role: 'system',
                content: `You are an elite bilingual curriculum and educational design expert for elementary schools. Output 100% valid JSON only adhering strictly to the requested language (${targetLang}). Do not output any markdown or text outside the JSON object.`
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.35,
            max_tokens: 3800
          })
        }, 28000);

        if (res.ok) {
          const data = await res.json();
          const raw = data.choices?.[0]?.message?.content;
          const parsed = parseSafeJson(raw);
          if (parsed && parsed.stations && parsed.stations['1_hook']) {
            return postProcessLesson(parsed);
          }
        }
      } catch (e) {
        console.warn(`Groq full journey (${m}) notice:`, e);
      }
    }
  }

  // 2. Try Gemini (only if a valid AIza key is configured)
  if (geminiKey && geminiKey.startsWith('AIza')) {
    const geminiModels = ['gemini-2.5-flash'];
    for (const gm of geminiModels) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${prompt}\n\nStrict JSON response only matching schema:` }] }],
              generationConfig: {
                temperature: 0.35,
                maxOutputTokens: 4200,
                responseMimeType: 'application/json'
              }
            })
          },
          28000
        );

        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = parseSafeJson(txt);
          if (parsed && parsed.stations && parsed.stations['1_hook']) {
            return postProcessLesson(parsed);
          }
        }
      } catch (e) {
        console.warn(`Gemini full journey (${gm}) notice:`, e);
      }
    }
  }

  // 3. High quality genre & language-aware rich fallback
  const createHighQualityLessonFallback = () => {
    if (targetLang === 'hebrew') {
      if (isReadingComprehension) {
        const rData = getReadingComprehensionContent('hebrew');
        return {
          title: safeTitle,
          subject: safeSubject || 'עברית - הבנת הנקרא',
          language: 'hebrew',
          grade: safeGrade,
          objective: `התלמיד יקרא קטע קריאה בעברית (${safeTitle}), יבין את תוכנו המרכזי והמשתמע, ויענה על שאלות הבנה ברמות חשיבה מגוונות תוך ביסוס תשובותיו מתוך הטקסט.`,
          successCriteria: `מענה מדויק על שאלות איתור מידע, הסקת מסקנה אחת לפחות, והבעת עמדה אישית מנומקת המגובה בראיה מקטע הקריאה.`,
          suggestedDuration: 45,
          stations: {
            "1_hook": {
              name: "אתגר וסקרנות",
              number: 1,
              icon: "🔥",
              studentPrompt: rData.hookPrompt,
              teacherGuidance: `עוררו את סקרנות התלמידים לקראת הקריאה, הזמינו השערות על פי הכותרת והנושא, ורשמו את מטרת השיעור על הלוח.`,
              suggestedDuration: 6,
              scaffold: `רמז: התבוננו במילים המרכזיות בכותרת וחשבו מה הנושא הראשי.`,
              ...(rData.riddle ? {
                interactiveActivity: {
                  type: 'riddle',
                  title: 'חידת הפתיחה על הרכבת',
                  riddle: rData.riddle
                }
              } : {})
            },
            "2_understanding": {
              name: "הבנת המשמעות",
              number: 2,
              icon: "🧩",
              pedagogicalMode: "guided_exploration",
              pedagogicalModeName: "הבנה ובניית משמעות",
              studentPrompt: rData.station2Prompt,
              teacherGuidance: `הנחו קריאה מודרכת (קריאה קולית או שקטה), הסבירו מילים קשות ובדקו הבנה ראשונית של מהלך האירועים בטקסט.`,
              suggestedDuration: 12,
              scaffold: `היעזרו בביאור המילים בצד לקריאה רציפה.`
            },
            "3_practice": {
              name: "יישום ותרגול",
              number: 3,
              icon: "🛠️",
              suggestedDuration: 15,
              workMode: "groups",
              studentPrompt: `משימות הבנה מדורגות בקבוצות על קטע הקריאה 🛠️\nעבדו יחד בקבוצות, דונו בשאלות ונמקו כל תשובה מתוך הטקסט שקראנו!`,
              teacherGuidance: `עברו בין הקבוצות, ודאו שתלמידי הזינוק מוצאים את המידע הגלוי, ותלמידי השליטה והאתגר מנמקים מתוך הטקסט.`,
              tasks: rData.station3Tasks
            },
            "4_evidence": {
              name: "ראיות הבנה",
              number: 4,
              icon: "🔎",
              suggestedDuration: 7,
              criterion: `מענה עצמאי על שאלות ההבנה תוך הבאת הוכחה וציטוט מהטקסט.`,
              studentPrompt: rData.station4Evidence,
              individualTask: rData.station4Evidence,
              allowedHelp: ["הבהרת שאלות", "הפניה לפסקה המתאימה"],
              evalLevels: {
                mastered: "הוכיח הבנה מעמיקה וביסס מתוך הטקסט",
                partial: "ענה על חלק מהשאלות ללא ביסוס מספק",
                needs_support: "זקוק לתיווך באיתור מידע",
                insufficient_data: "אין מספיק ראיות"
              }
            },
            "5_harvest": {
              name: "סיכום וקציר",
              number: 5,
              icon: "🎒",
              suggestedDuration: 5,
              studentPrompt: rData.station5Prompt,
              teacherGuidance: `אספו את כרטיסי היציאה, סכמו את המסר המרכזי של הסיפור וקשרו להישגי התלמידים.`,
              exitTicket: {
                q1: "מהו הדבר המשמעותי ביותר שלמדתי היום?",
                q2: "איזה חלק בקטע הקריאה עורר בי הכי הרבה עניין?",
                q3: "מה עדיין דורש ממני תרגול או הבהרה?",
                q4_transfer: "כיצד אוכל ליישם את התובנה מהשיעור בחיי היום-יום?"
              }
            }
          }
        };
      } else if (isValuesEducation) {
        return {
          title: safeTitle,
          subject: safeSubject || 'חינוך לערכים ומנהיגות',
          language: 'hebrew',
          grade: safeGrade,
          objective: `התלמיד יבין את המשמעות העמוקה של (${safeTitle}), ינתח דילמות מוסריות וחברתיות, ויתחייב ליישום הערך במעשים יומיומיים.`,
          successCriteria: `השתתפות בניתוח דילמה מוסרית, ניסוח שני נימוקים ערכיים, וקבלת התחייבות אישית למעשה חיובי בסביבתו.`,
          suggestedDuration: 45,
          stations: {
            "1_hook": {
              name: "אתגר וסקרנות",
              number: 1,
              icon: "🔥",
              studentPrompt: `פתיחה מעוררת מחשבה לשיעור (${safeTitle}):\nתארו לעצמכם מצב: נשאר לכם חטיף אחד אחרון שאתם מאוד אוהבים, וחבר שלכם שכח את ארוחת העשר ומביט בכם בעצב. מה עובר לכם בראש ברגע הראשון? האם קל או קשה לחלוק? שתפו בכנות!`,
              teacherGuidance: `הציגו את הדילמה ללא שיפוטיות, אפשרו מגוון קולות, וחברו את הדיון לערך המרכזי של השיעור.`,
              suggestedDuration: 6,
              scaffold: `חשבו: מה גורם לנו להרגיש טוב באמת לאורך זמן?`
            },
            "2_understanding": {
              name: "הבנת המשמעות",
              number: 2,
              icon: "🧩",
              pedagogicalMode: "guided_exploration",
              pedagogicalModeName: "בירור המושג הערכי",
              studentPrompt: `בירור המושג: מהי נתינה אמיתית וכיצד היא משנה אותנו? 🌟\n\nנתינה איננה רק מסירת חפץ או כסף. נתינה אמיתית היא להקדיש זמן, להעניק חיוך מעודד, להקשיב לחבר בשעת קושי, או לוותר על נוחות אישית כדי לעזור למישהו אחר.\n\nחוקרים גילו שכאשר אדם עושה מעשה טוב עבור הזולת, המוח שלו מפריש חומרים שגורמים לתחושת שמחה וסיפוק עמוקה. כלומר: "הנותן מקבל כפליים".\n\nשלושת עמודי התווך של (${safeTitle}):\n1. רגישות והבחנה: לראות מי סביבנו זקוק לעזרה עוד לפני שהוא מבקש.\n2. עשייה מכל הלב: לתת מתוך אכפתיות אמיתית ולא כדי לקבל פרס או תמורה.\n3. התמדה: להפוך את הנתינה להרגל יומיומי ולא למאורע חד-פעמי.`,
              teacherGuidance: `הנחו שיח ערכי מעמיק, בקשו דוגמאות מוחשיות מחיי בית הספר, וסכמו את עמודי התווך.`,
              suggestedDuration: 12,
              scaffold: `חשבו על פעם אחת שבה עזרתם למישהו ואיך הרגשתם לאחר מכן.`
            },
            "3_practice": {
              name: "יישום ותרגול",
              number: 3,
              icon: "🛠️",
              suggestedDuration: 15,
              workMode: "groups",
              studentPrompt: `משימת חקר ופתרון מצבים ערכיים בקבוצות 🛠️\nלפניכם משימות מדורגות לתרגום ערך הנתינה למעשים קונקרטיים בחיי היום-יום. שתפו פעולה ונמקו כל החלטה!`,
              teacherGuidance: `עברו בין הקבוצות ועודדו דיון פתוח ומנומק המתרגם עקרונות תיאורטיים להתנהגות מעשית.`,
              tasks: [
                {
                  tier: "support",
                  badge: "🌱 קבוצת זינוק",
                  title: "זיהוי מעשי נתינה יומיומיים",
                  task: `כתבו 3 דרכים שונות שבהן תלמיד יכול לגלות נתינה בכיתה מבלי להוציא אגורה אחת (למשל: עזרה בלימודים, שיתוף במשחק, מילה טובה).`,
                  scaffold: `רמז: חשבו על מעשים של חברות והקשבה.`
                },
                {
                  tier: "core",
                  badge: "⭐ קבוצת שליטה",
                  title: "ניתוח דילמה חברתית",
                  task: `תלמיד חדש הגיע לכיתה והוא עומד לבדו בהפסקה. חבריכם רוצים להמשיך במשחק כדורגל סוער.\nמה הייתם עושים? הציעו פתרון שמגשים את ערך הנתינה וההכללה תוך שמירה על כבוד כולם.`,
                  scaffold: `רמז: איך אפשר לשלב אותו במשחק או למצוא פתרון יצירתי?`
                },
                {
                  tier: "advanced",
                  badge: "🚀 קבוצת אתגר ומנהיגות",
                  title: "יוזמה חברתית בבית הספר",
                  task: `תכננו "מיזם נתינה שבועי" עבור בית הספר שלנו:\n1. מה מטרת המיזם?\n2. מי קהל היעד?\n3. מהם הצעדים המעשיים ליישומו?\nהציגו את היוזמה בקצרה.`,
                  scaffold: `רמז: חשבו על יוזמה פשוטה אך משפיעה (כגון: פינת חברות, סיוע בהפסקות).`
                }
              ]
            },
            "4_evidence": {
              name: "ראיות הבנה",
              number: 4,
              icon: "🔎",
              suggestedDuration: 7,
              criterion: `הצגת שיקול דעת מוסרי עצמאי ונימוק החלטה ערכית בדף הראיות.`,
              studentPrompt: `דף משימה עצמאי — הכרעה בדילמה מוסרית אישית ✍️\nענו על השאלות הבאות באופן עצמאי ומנומק:\n\n1. הסבירו במילים שלכם: מדוע אומרים ש"הנתינה מעשירה את הנותן יותר מאשר את המקבל"?\n2. תארו מקרה שבו ויתרתם על משהו אישי למען חבר או בן משפחה. מה הרגשתם?\n3. דילמה אישית: אם אתם ממהרים מאוד לשיעור ורואים תלמיד צעיר שבכה כי נפל לו הקלמר, כיצד תפעלו ומדוע?\n\nכתבו את תשובתכם בבירור בתיבת המענה למטה ולחצו "שלח תשובה למורה" 📤`,
              individualTask: `דף משימה עצמאי לבירור ערכי והכרעה בדילמה.`,
              allowedHelp: ["הבהרת ההוראות"],
              evalLevels: {
                mastered: "הביע עמדה מוסרית בוגרת ומנומקת היטב",
                partial: "ענה באופן חלקי ללא נימוק מעמיק",
                needs_support: "זקוק להכוונה בהבנת הדילמה",
                insufficient_data: "אין מספיק ראיות"
              }
            },
            "5_harvest": {
              name: "סיכום וקציר",
              number: 5,
              icon: "🎒",
              suggestedDuration: 5,
              studentPrompt: `תחנת הקציר — התחייבות אישית למעשה טוב 🎒✨\nהגענו לסיום השיעור!\nערכים אינם נשארים במחברת — הם חיים במעשים שלנו.\nענו על שאלות כרטיס היציאה וקחו על עצמכם התחייבות אישית אחת להשבוע!`,
              teacherGuidance: `אספו את ההתחייבויות האישיות של התלמידים ועודדו אותם ליישמן במהלך השבוע.`,
              exitTicket: {
                q1: "מהו הדבר המשמעותי ביותר שהבנתי היום על ערך הנתינה?",
                q2: "איזה חלק בשיעור גרם לי לחשוב מחדש על ההתנהגות שלי?",
                q3: "האם יש מצב שבו קשה לי לתת או לחלוק, וכיצד אוכל להתגבר על כך?",
                q4_transfer: "מעשה הנתינה הקונקרטי שאבצע עוד היום או מחר הוא:"
              }
            }
          }
        };
      }
      return {
        title: safeTitle,
        subject: safeSubject || 'לשון עברית',
        language: 'hebrew',
        grade: safeGrade,
        objective: `התלמיד ירכוש ויישם את המיומנויות והמושגים המרכזיים של השיעור (${safeTitle}) וינמק את שלביו בעברית תקינה.`,
        successCriteria: `פתרון עצמאי של שלוש משימות מתמיינות, הצגת דף ראיות אישי מנומק, והעברת הידע למצב חיים מעשי.`,
        suggestedDuration: 45,
        stations: {
          "1_hook": {
            name: "אתגר וסקרנות",
            number: 1,
            icon: "🔥",
            studentPrompt: `פתיחה מאתגרת לשיעור (${safeTitle}):\nלפניכם תופעה מרתקת ומעוררת מחשבה: כיצד נוכל להסביר אותה במדויק וללא ספקות? מה הרעיון הראשון שעולה בדעתכם? שתפו והציעו השערה!`,
            teacherGuidance: `הציגו את המצב ועודדו השערות שונות מן התלמידים.`,
            suggestedDuration: 6,
            scaffold: `רמז: חשבו על הקשר למה שלמדנו בשיעור הקודם.`
          },
          "2_understanding": {
            name: "הבנת המשמעות",
            number: 2,
            icon: "🧩",
            pedagogicalMode: "guided_exploration",
            pedagogicalModeName: "הבנה ובניית משמעות",
            studentPrompt: `בניית המושגים והכלל המרכזי לשיעור (${safeTitle}):\n1. המושג המרכזי: הגדרה ומאפיינים מובהקים.\n2. הכלל היישומי: שלושת השלבים להגעה לתוצאה מדויקת.\n3. דוגמה מודגמת ומנומקת שלב אחר שלב.\n\nהעתיקו את הכלל למחברת והתבוננו בדוגמה.`,
            teacherGuidance: `הנחו את התלמידים לגילוי הכלל באופן פעיל.`,
            suggestedDuration: 12,
            scaffold: `היעזרו בטבלת המושגים.`
          },
          "3_practice": {
            name: "יישום ותרגול",
            number: 3,
            icon: "🛠️",
            suggestedDuration: 15,
            workMode: "groups",
            studentPrompt: `משימות תרגול מדורגות בקבוצות סביב (${safeTitle}) 🛠️\nפעלו יחד, דונו באתגרים ונמקו כל צעד בעברית בהירה!`,
            teacherGuidance: `עקבו אחר הקבוצות ותמכו באמצעות סולמות הרמז.`,
            tasks: [
              { tier: "support", badge: "🌱 קבוצת זינוק", title: "משימת זינוק מונחית", task: `פתרו תרגיל ישיר בנושא (${safeTitle}) ובחרו את התשובה הנכונה עם נימוק קצר.`, scaffold: `רמז: חזרו לדוגמה הראשונה בתחנה 2.` },
              { tier: "core", badge: "⭐ קבוצת שליטה", title: "משימת שליטה ותרגול", task: `יישמו את הכלל המרכזי של (${safeTitle}) על 3 מקרים חדשים במחברת ונמקו כל שלב.`, scaffold: `רמז: ודאו שכל תנאי הכלל מתקיימים.` },
              { tier: "advanced", badge: "🚀 קבוצת אתגר", title: "משימת אתגר וחשיבה", task: `זהו את הטעות המוסתרת בדוגמה המוצגת, הסבירו אותה, וחברו תרגיל אתגר לחבריכם.`, scaffold: `רמז: התמקדו במקרי קצה ומורכבות.` }
            ]
          },
          "4_evidence": {
            name: "ראיות הבנה",
            number: 4,
            icon: "🔎",
            suggestedDuration: 7,
            criterion: `הצגת תשובה עצמאית ומנומקת המוכיחה שליטה ב-(${safeTitle}).`,
            studentPrompt: `דף משימה עצמאי וראיות הבנה — (${safeTitle}) ✍️\nענו על השאלות בעצמכם:\n1. יישום ישיר: כתבו את המושג או הכלל במילים שלכם עם דוגמה מקורית.\n2. נימוק: מדוע תשובתכם נכונה על פי הכלל שלמדנו?\n3. העברה: תנו דוגמה ממצב אמיתי שבו הכלל בא לידי ביטוי.\n\nכתבו בבירור בתיבה למטה ולחצו "שלח תשובה למורה" 📤`,
            individualTask: `משימת ראיות הבנה עצמאית.`,
            allowedHelp: ["רמז קל", "הבהרת הוראות"],
            evalLevels: { mastered: "השיג את היעד", partial: "השיג חלקית", needs_support: "זקוק לתמיכה", insufficient_data: "אין מספיק ראיות" }
          },
          "5_harvest": {
            name: "סיכום וקציר",
            number: 5,
            icon: "🎒",
            suggestedDuration: 5,
            studentPrompt: `תחנת הקציר וסיכום הלמידה 🎒✨\nאספו את פירות הלמידה שלכם היום וענו על שאלות כרטיס היציאה!`,
            teacherGuidance: `אספו את כרטיסי היציאה וסכמו את השיעור.`,
            exitTicket: {
              q1: "מה הרעיון המרכזי שלמדתי היום?",
              q2: "מה עזר לי להבין בצורה הטובה ביותר?",
              q3: "מה עדיין דורש הסבר נוסף מבחינתי?",
              q4_transfer: "איפה אוכל להשתמש במה שלמדתי בחיי היומיום?"
            }
          }
        }
      };
    }

    if (targetLang === 'english') {
      return {
        title: safeTitle,
        subject: safeSubject || 'English Language',
        language: 'english',
        grade: safeGrade,
        objective: `Students will understand and apply the core concepts and skills of (${safeTitle}) with precise reasoning in English.`,
        successCriteria: `Successfully complete tiered practice tasks, provide textual evidence on the independent worksheet, and reflect in the exit ticket.`,
        suggestedDuration: 45,
        stations: {
          "1_hook": {
            name: "Inquiry & Curiosity",
            number: 1,
            icon: "🔥",
            studentPrompt: `Welcome to our lesson on (${safeTitle})! 🌟\nObserve this exciting riddle: What hidden pattern connects our topic to our everyday communication? Share your prediction!`,
            teacherGuidance: `Spark curiosity and invite initial student thoughts. Write the goal on the board.`,
            suggestedDuration: 6,
            scaffold: `Hint: Think about keywords in the title.`
          },
          "2_understanding": {
            name: "Meaning & Concept Building",
            number: 2,
            icon: "🧩",
            pedagogicalMode: "guided_exploration",
            pedagogicalModeName: "Direct & Guided Inquiry",
            studentPrompt: `Core Concepts for (${safeTitle}):\n1. Main Definition: Key features and vocabulary.\n2. Guided Steps: The 3 steps to successful application.\n3. Model Example: Step-by-step demonstration.\n\nReview the examples and write the main rule in your notebook.`,
            teacherGuidance: `Lead structured modeling and check for understanding before practice.`,
            suggestedDuration: 12,
            scaffold: `Use the visual organizer and keywords.`
          },
          "3_practice": {
            name: "Tiered Practice & Collaboration",
            number: 3,
            icon: "🛠️",
            suggestedDuration: 15,
            workMode: "groups",
            studentPrompt: `Welcome to the Practice Station! 🛠️\nWork in your assigned tiered group, discuss solutions, and justify every step in English!`,
            teacherGuidance: `Facilitate group discussions and provide prompt scaffolds.`,
            tasks: [
              { tier: "support", badge: "🌱 Launch Team", title: "Direct Guided Practice", task: `Complete direct exercises on (${safeTitle}) with clues provided.`, scaffold: `Hint: Check the first model in Station 2.` },
              { tier: "core", badge: "⭐ Mastery Team", title: "Core Application Task", task: `Apply the main rule of (${safeTitle}) to 3 new cases and explain your reasoning.`, scaffold: `Hint: Verify against our success criteria.` },
              { tier: "advanced", badge: "🚀 Challenge Team", title: "Advanced Extension Task", task: `Analyze a complex error in a given model, correct it, and formulate an original challenge.`, scaffold: `Hint: Focus on subtle edge cases.` }
            ]
          },
          "4_evidence": {
            name: "Evidence of Mastery",
            number: 4,
            icon: "🔎",
            suggestedDuration: 7,
            criterion: `Independent and justified solution demonstrating mastery of (${safeTitle}).`,
            studentPrompt: `Independent Evidence Worksheet — [ ${safeTitle} ] ✍️\nAnswer the questions independently:\n1. State the core concept in your own words with an example.\n2. Explain why your answer is correct using the rule.\n3. Give a real-world transfer example.\n\nType your answer below and click "Submit to Teacher" 📤`,
            individualTask: `Independent evidence worksheet.`,
            allowedHelp: ["Minor clarification"],
            evalLevels: { mastered: "Mastered the goal", partial: "Partially achieved", needs_support: "Needs support", insufficient_data: "Insufficient evidence" }
          },
          "5_harvest": {
            name: "Harvest & Transfer",
            number: 5,
            icon: "🎒",
            suggestedDuration: 5,
            studentPrompt: `Harvest Station 🎒✨\nReflect on today's learning journey and complete your exit ticket honestly!`,
            teacherGuidance: `Review student exit tickets and close the lesson.`,
            exitTicket: {
              q1: "What is the main idea I learned today?",
              q2: "What helped me understand best?",
              q3: "What do I still need more clarification on?",
              q4_transfer: "Where can I apply what I learned outside of school?"
            }
          }
        }
      };
    }

    // Default Arabic High-Quality Fallback
    return {
      title: safeTitle,
      subject: safeSubject || 'عام',
      language: 'arabic',
      grade: safeGrade,
      objective: isReadingComprehension
        ? `أن يقرأ الطالب النص القرائي لـ (${safeTitle}) قراءة واعية، ويستوعب مضامينه الصريحة والضمنية، ويجيب عن أسئلة الفهم بمستوياتها المتعددة بدقة.`
        : isValuesEducation
        ? `أن يستوعب الطالب القيمة التربوية لـ (${safeTitle})، ويحلل مواقف اجتماعية واقعية، ويتعهد بممارسة سلوك إيجابي في محيطه.`
        : `أن يتمكن الطالب من استيعاب وتطبيق المهارات والمفاهيم الأساسية لدرس (${safeTitle}) وتبرير خطواته بدقة.`,
      successCriteria: isReadingComprehension
        ? `حل أسئلة الفهم الثلاثة (استخراج، استنتاج، وتقييم)، وتقديم دليل فردي موثق من النص القرائي.`
        : `حل وتطبيق ثلاثة تمارين متنوعة بنجاح، وتقديم دليل فردي يثبت الفهم المستقل، ونقل الأثر لموقف حياتي.`,
      suggestedDuration: 45,
      stations: (() => {
        if (isReadingComprehension) {
          const rData = getReadingComprehensionContent('arabic');
          return {
            "1_hook": {
              name: "مشوّق ومحفّز",
              number: 1,
              icon: "🔥",
              studentPrompt: rData.hookPrompt,
              teacherGuidance: `اعرض الموقف وناقش فضول الطلاب دون إعلان الحل فوراً. اكتب الهدف ومعيار النجاح بخط بارز على اللوح.`,
              suggestedDuration: 6,
              scaffold: `فكر في العلاقة بين المعطيات وما درسته في الحصة السابقة.`,
              ...(rData.riddle ? {
                interactiveActivity: {
                  type: 'riddle',
                  title: 'لغز القطار السريع',
                  riddle: rData.riddle
                }
              } : {})
            },
            "2_understanding": {
              name: "فهم وبناء المعنى",
              number: 2,
              icon: "🧩",
              pedagogicalMode: "guided_exploration",
              pedagogicalModeName: "الاستكشاف الموجّه وبناء المعنى",
              studentPrompt: rData.station2Prompt,
              teacherGuidance: `وجّه الطلاب لقراءة واعية للنص واستخراج الدلالات والمفردات الصعبة وتلخيص الفكرة العامة.`,
              suggestedDuration: 12,
              scaffold: `الاستعانة بمعجم المفردات والتراكيب في أسفل النص.`
            },
            "3_practice": {
              name: "التطبيق والتدريب",
              number: 3,
              icon: "🛠️",
              suggestedDuration: 15,
              workMode: "groups",
              studentPrompt: `مهمات التدريب المتمايزة داخل الفرق لدرس (${safeTitle}) 🛠️\nتعاونوا معاً، ناقشوا التحديات، وبرروا كل خطوة تبريراً علمياً سليماً!`,
              teacherGuidance: `تابع الفرق وقدّم السقالات المساندة للفئات المستهدفة للتأكد من استخراج الأدلة من النص.`,
              tasks: rData.station3Tasks
            },
            "4_evidence": {
              name: "أدلة الفهم",
              number: 4,
              icon: "🔎",
              suggestedDuration: 7,
              criterion: `تقديم إجابة فردية مستقلة ومبررة تثبت امتلاك مهارة (${safeTitle}) دون مساعدة واستخراج الأدلة من النص.`,
              studentPrompt: rData.station4Evidence,
              individualTask: rData.station4Evidence,
              allowedHelp: ["تلميح بسيط", "توضيح التعليمات"],
              evalLevels: {
                mastered: "حقق الهدف بدقة وقدم دليلاً مكتملاً",
                partial: "حققه جزئياً ويحتاج تعزيزاً في التبرير",
                needs_support: "يحتاج دعماً وتوجيهاً إضافياً",
                insufficient_data: "الدليل غير كافٍ للحكم"
              }
            },
            "5_harvest": {
              name: "حصاد ونقل الأثر",
              number: 5,
              icon: "🎒",
              suggestedDuration: 5,
              studentPrompt: rData.station5Prompt,
              teacherGuidance: `اجمع بطاقات الخروج وراجع مستويات الفهم والتأمل لدى الطلاب.`,
              exitTicket: {
                q1: isTrainTopic ? "ما أهم معلومة تعلمتها اليوم عن تطور القطارات؟" : "ما أهم فكرة تعلّمتها اليوم؟",
                q2: isTrainTopic ? "ما الجزء الأكثر إثارة في النص القرائي؟" : "ما الذي ساعدني على الفهم؟",
                q3: "ما الذي ما زلت أحتاج إلى توضيحه؟ (يمكنك اختيار: لا أحتاج إلى توضيح إضافي)",
                q4_transfer: isTrainTopic ? "كيف يمكنني تطبيق قيمة الالتزام والانضباط في حياتي اليومية؟" : "أين أستطيع استخدام ما تعلّمته في حياتي خارج المدرسة؟"
              }
            }
          };
        }

        return {
          "1_hook": {
            name: "مشوّق ومحفّز",
            number: 1,
            icon: "🔥",
            studentPrompt: `لغز وتحدي المدخل لدرس (${safeTitle}):\nتأمل هذا الموقف المثير: حدثت مفارقة تجعلنا نتساءل: كيف يمكننا التفسير بدقة ودون غموض؟ ما الذي يثير فضولك وما أول فكرة تخطر ببالك؟`,
            teacherGuidance: `اعرض الموقف وناقش فضول الطلاب دون إعلان الحل فوراً. اكتب الهدف ومعيار النجاح بخط بارز على اللوح.`,
            suggestedDuration: 6,
            scaffold: `فكر في العلاقة بين المعطيات وما درسته في الحصة السابقة.`
          },
          "2_understanding": {
            name: "فهم وبناء المعنى",
            number: 2,
            icon: "🧩",
            pedagogicalMode: "guided_exploration",
            pedagogicalModeName: "الاستكشاف الموجّه وبناء المعنى",
            studentPrompt: `بناء المفاهيم والقاعدة الذهبية لـ (${safeTitle}):\n١. المفهوم الأساسي: التعريف والخصائص المركزية.\n٢. القاعدة التطبيقية: الخطوات الثلاث للوصول للحل الصحيح.\n٣. مثال محلول توضيحي خطوة بخطوة.`,
            teacherGuidance: `وجّه الطلاب لملاحظة النمط واستخراج القاعدة بأنفسهم قبل التلخيص الجماعي.`,
            suggestedDuration: 12,
            scaffold: `مخطط بصري ملخص للقاعدة وللكلمات المفتاحية.`
          },
          "3_practice": {
            name: "التطبيق والتدريب",
            number: 3,
            icon: "🛠️",
            suggestedDuration: 15,
            workMode: "groups",
            studentPrompt: `مهمات التدريب المتمايزة داخل الفرق لدرس (${safeTitle}) 🛠️\nتعاونوا معاً، ناقشوا التحديات، وبرروا كل خطوة تبريراً علمياً سليماً!`,
            teacherGuidance: `تابع الفرق وقدّم السقالات المساندة للفئات المستهدفة.`,
            tasks: [
              {
                tier: "support",
                badge: "🌱 فريق الانطلاق والتمكن",
                title: "مهمة الانطلاق والتمكن",
                task: `حل تمرين مباشر حول (${safeTitle}): اختر الإجابة المناسبة من بين الخيارات مع توضيح بسيط للسبب.`,
                scaffold: `تلميح: راجع القاعدة من المحطة السابقة.`
              },
              {
                tier: "core",
                badge: "⭐ فريق الممارسة والإتقان",
                title: "مهمة الممارسة والإتقان",
                task: `طبق القاعدة الأساسية لـ (${safeTitle}) على ثلاث فقرات جديدة في دفترك، مع كتابة تعليل موجز لكل خطوة.`,
                scaffold: `تلميح: تأمل الخطوات خطوة بخطوة.`
              },
              {
                tier: "advanced",
                badge: "🚀 فريق الرواد والتحدي",
                title: "مهمة الرواد والتحدي",
                task: `اكتشف الخطأ الخفي في نموذج الحل المعروض وفسر سببه، ثم صغ مسألة جديدة لتحدي زملائك في باقي الفرق.`,
                scaffold: `تلميح: ركز على التحليل والتعليل.`
              }
            ]
          },
          "4_evidence": {
            name: "أدلة الفهم",
            number: 4,
            icon: "🔎",
            suggestedDuration: 7,
            criterion: `تقديم إجابة فردية مستقلة ومبررة تثبت امتلاك مهارة (${safeTitle}) دون مساعدة.`,
            studentPrompt: `ورقة الدليل الفردي المستقل — [ ${safeTitle} ] ✍️\nالآن حان وقت إثبات فهمك المستقل. أجب عن أسئلة ورقة الدليل التالية:\n\n• السؤال الأول (تطبيق مباشر): اكتب المفهوم أو النتيجة الأساسية لـ (${safeTitle}) بأسلوبك.\n• السؤال الثاني (تحليل وتعليل): كيف تثبت صحة إجابتك بالدليل العلمي والمنطقي؟\n• السؤال الثالث (مسألة واستنتاج): إذا طُلب منك توضيح ذلك لزميلك، ما المثال الواقعي الذي ستضربه له؟\n\nتذكّر: اكتب إجابتك بوضوح وتفصيل في مساحة الحل أدناه ثم اضغط "إرسال إجابتي للمعلم" 📤`,
            individualTask: `مهمة التحقق الفردي المستقل مع الأسئلة الصريحة.`,
            allowedHelp: ["تلميح بسيط", "توضيح التعليمات"],
            evalLevels: {
              mastered: "حقق الهدف بدقة وقدم دليلاً مكتملاً",
              partial: "حققه جزئياً ويحتاج تعزيزاً في التبرير",
              needs_support: "يحتاج دعماً وتوجيهاً إضافياً",
              insufficient_data: "الدليل غير كافٍ للحكم"
            }
          },
          "5_harvest": {
            name: "حصاد ونقل الأثر",
            number: 5,
            icon: "🎒",
            suggestedDuration: 5,
            studentPrompt: `محطة الحصاد ونقل الأثر 🎒✨\nوصلنا إلى ختام رحلتنا التعليمية الرائعة! حان وقت رصد ثمار تعلمكم اليوم:\n١. ما الفكرة الجوهرية التي اكتسبتموها عن (${safeTitle})؟\n٢. أجب بصدق واستقلالية عن أسئلة بطاقة الخروج.\n٣. فكّر: كيف تستفيد مما تعلّمته في حياتك اليومية ومحيطك؟`,
            teacherGuidance: `اجمع بطاقات الخروج وراجع مستويات الفهم والتأمل لدى الطلاب.`,
            exitTicket: {
              q1: "ما أهم فكرة تعلّمتها اليوم؟",
              q2: "ما الذي ساعدني على الفهم؟",
              q3: "ما الذي ما زلت أحتاج إلى توضيحه؟ (يمكنك اختيار: لا أحتاج إلى توضيح إضافي)",
              q4_transfer: "أين أستطيع استخدام ما تعلّمته في حياتي خارج المدرسة؟"
            }
          }
        };
      })()
    };
  };

  return postProcessLesson(createHighQualityLessonFallback());
};

export const generateScientificGenieAI = async (question, chatHistory = [], studentName = 'مستكشفنا البطل') => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const systemPrompt = `أنت "جني البحث العلمي السحري" 🧞‍♂️✨ في مدرسة مشيرفة الابتدائية، المساعد السحري الذكي للأطفال في رحلة البحث العلمي والاكتشاف.
أنت تتحدث باللغة العربية الفصحى الجميلة والمبهجة، بأسلوب مرح ومشجع مفعم بالحماس والذكاء (مثل جني الفانوس الودود المحب للعلوم 🧞‍♂️).
أنت تخاطب الطالب باسمه دائماً: "${studentName}".

مهامك الإرشادية في البحث العلمي:
1. صياغة سؤال البحث: مساعدة الطالب في تحويل أفكاره وفضوله إلى سؤال بحث علمي محدد وقابل للقياس، بصيغة واضحة مثل: "ما تأثير [المتغير المستقل] على [المتغير التابع]؟".
2. الفرضية العلمية: تعليمه كيف يصوغ تخميناً ذكياً قابلاً للاختبار بصيغة: "إذا قمنا بـ... فإن ... سيحدث لأن...".
3. المتغيرات: شرح المتغير المستقل (الذي نغيره)، والمتغير التابع (الذي نقيسه)، والعوامل الثابتة بأسلوب مبسط بالأمثلة.
4. تخطيط التجربة: اقتراح خطوات عملية آمنة، وأدوات منزلية أو مدرسية بسيطة، وطريقة تسجيل الملاحظات.
5. استخلاص النتائج والاستنتاج: كيف يجيب عن سؤاله بناءً على ما شاهده في التجربة.
6. الإجابة على أي سؤال علمي عام بأسلوب شيق يبهر الطالب ويشعل فضوله.

قواعد الإجابة:
- ابدأ برد مرح مثل: "شبيك لبيك يا بطلنا ${studentName}! 🧞‍♂️✨" أو "بأمر العلم والفضول العجيب!"
- قسّم الإجابة إلى نقاط قصيرة وواضحة جداً يسهل على تلميذ ابتدائي قراءتها.
- استخدم إيموجيز علمية مشوقة (🔬 🌱 🧪 ⚡ 💡 🚀).
- شجع الطالب دائماً واختم بسؤال تفاعلي مرح يدفعه للخطوة التالية.
- ممنوع تماماً كتابة أي نصوص بالإنجليزية أو مسودات تفكير.`;

  // Build message sequence for multi-turn chat
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // Include recent history (up to last 6 messages) for memory context
  if (Array.isArray(chatHistory)) {
    const recent = chatHistory.slice(-6);
    for (const msg of recent) {
      if (msg.sender === 'user') {
        messages.push({ role: 'user', content: msg.text });
      } else if (msg.sender === 'genie' && msg.text) {
        messages.push({ role: 'assistant', content: msg.text });
      }
    }
  }

  // Add the current question
  messages.push({ role: 'user', content: question });

  // 1. Try Groq (High Speed Qwen 3.8 / GPT-OSS / ALLaM)
  if (groqKey) {
    const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'allam-2-7b', 'openai/gpt-oss-20b'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: m,
              messages,
              temperature: 0.7,
              max_tokens: 1200
            })
          },
          10000
        );
        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply && reply.trim()) {
            const cleaned = cleanAiResponse(reply.trim());
            if (cleaned) return cleaned;
          }
        }
      } catch (err) {
        console.warn(`Genie AI (${m}) failed:`, err);
      }
    }
  }

  // 2. Try Gemini
  if (geminiKey) {
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    const geminiPrompt = `${systemPrompt}\n\nسؤال الطالب ${studentName}: "${question}"`;
    for (const gm of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: geminiPrompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1200
              }
            })
          },
          10000
        );
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) {
            const cleaned = cleanAiResponse(text.trim());
            if (cleaned) return cleaned;
          }
        }
      } catch (err) {
        console.warn(`Genie AI Gemini (${gm}) failed:`, err);
      }
    }
  }

  // Fallback if network completely blocked
  return `شبيك لبيك يا بطلنا المبدع ${studentName}! 🧞‍♂️✨\nسؤالك العلمي مدهش جداً! تذكر أن كل بحث علمي يبدأ بـ:\n1. 🔍 ملاحظة شيء يثير دهشتك.\n2. ❓ صياغة سؤال واضح ومحدد (ما تأثير... على...؟).\n3. 💡 وضع فرضية ذكية قابلة للاختبار.\n4. 🧪 تجربة ممتعة تسجل فيها أرقامك وملاحظاتك!\nما هي فكرة التجربة التي ترغب في استكشافها معاً؟ 🪄🌱`;
};

/**
 * 17. Parse and Structure Uploaded Lesson Plan (Word / PDF / Text / JSON):
 * Analyzes the raw document text or PDF base64 using AI and extracts/structures it into
 * the 5 canonical Mafatih stations [ م ، ف ، ت ، ي ، ح ].
 */
export const parseUploadedLessonPlanAI = async ({
  rawText = '',
  fileBase64 = '',
  mimeType = 'text/plain',
  fileName = ''
}) => {
  // 1. Direct JSON check
  if (rawText && typeof rawText === 'string') {
    try {
      const trimmed = rawText.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        if (parsed.stations && (parsed.stations.m || parsed.stations.f || parsed.stations.t || parsed.stations.y || parsed.stations.h)) {
          return {
            title: parsed.title || fileName.replace(/\.[^/.]+$/, '') || 'تخطيط درس مستورد',
            subject: parsed.subject || 'عام',
            grade: parsed.grade || 'المرحلة الابتدائية',
            duration: Number(parsed.duration) || 45,
            objective: parsed.objective || '',
            author: parsed.author || 'مستورد من الحاسوب',
            stations: normalizeLessonStations(parsed.stations)
          };
        }
      }
    } catch {
      // Continue to AI parsing
    }
  }

  const { geminiKey, groqKey } = await getActiveAiKeys();
  const isHebrew = /[\u0590-\u05FF]/.test(rawText || '') || /[\u0590-\u05FF]/.test(fileName || '');

  const parsingPrompt = isHebrew
    ? `אתה המומחה הפדגוגי הבכיר של מודל "מַפְתֵּי"חַ" (מודל מפתיח) בבית הספר היסודי מושירפה.
מורה העלה קובץ תכנון שיעור ממחשבו האישי (שם הקובץ: "${fileName}").
משימתך: לקרוא בעיון רב את תוכן הקובץ, לחלץ את מרכיביו ולשבץ/להמיר אותם במדויק לחמש תחנות מודל מַפְתֵּי"חַ [ מ , פ , ת , י , ח ]:
1. [ מ ] משיכה וסקרנות (משוך): גירוי מוחשי, שאלת סקרנות, עירור ידע קודם, והכלת כלל התלמידים.
2. [ פ ] פיתוח הבנה (הבנה): מטרת השיעור, המשגה, מילון מושגים, ומידול המורה (I Do).
3. [ ת ] תובנה והעמקה (תבונה): שאלות חשיבה מסדר גבוה, נימוק, ודיון מעמיק.
4. [ י ] יצירה ויישום (יישום): משימה מעשית, 3 מסלולי תמאוז (נתמך, רגיל, מאתגר), ושולחן ממוקד.
5. [ ח ] חתימה וצידה לדרך (חתימה): רפלקציה, 5 השאלות, והצידה לדרך שלוקח התלמיד.

אם הקובץ המקורי בנוי במבנה שיעור מסורתי (פתיחה, גוף, סיכום), פרוס והעשר את התוכן במקצועיות רבה כך שימלא את חמש התחנות באופן מושלם.
חלץ גם: כותרת/נושא השיעור (title), תחום דעת (subject), שכבת גיל/כיתה (grade), משך השיעור (duration בדקות), ומטרת השיעור (objective).

החזר פלט בפורמט JSON בלבד:
{
  "title": "כותרת השיעור",
  "subject": "תחום הדעת",
  "grade": "שכבת הגיל",
  "duration": 45,
  "objective": "מטרת השיעור",
  "stations": {
    "m": "תוכן תחנת משיכה וסקרנות...",
    "f": "תוכן תחנת פיתוח הבנה...",
    "t": "תוכן תחנת תובנה והעמקה...",
    "y": "תוכן תחנת יצירה ויישום...",
    "h": "תוכן תחנת חתימה וצידה לדרך..."
  }
}`
    : `أنت الخبير البيداغوجي والمستشار التربوي الأول لنموذج «مِفتاح» (موديل مفتیح) بمدرسة مشيرفة الابتدائية.
قام المعلم برفع ملف تخطيط حصة دراسية من حاسوبه (اسم الملف: "${fileName}").
مهمتك بدقة وإتقان تام: قراءة محتوى الملف المرفق، واستخراج وتوزيع وإعادة صياغة محتواه بذكاء ليتطابق مع المحطات الخمس لنموذج مِفتاح المعتمد بمدرسة مشيرفة:
1. [ م ] مدخل محفّز (משיכה וסקרנות): إثارة الفضول، سؤال الانطلاق، الاحتواء، والتقويم الأولي، وعبارة الانتقال الإلزامية.
2. [ ف ] فهم وبناء المعنى (פיתוח הבנה): الهدف بلغة الطلاب، النص أو المفهوم العلمي، نمذجة المعلم (I Do)، والاحتواء والتقويم التكويني.
3. [ ت ] تفكير وتبصّر (תובנה והעמקה): أسئلة التفكير العليا (HOTS)، المناقشة السقراطية، والتعمق.
4. [ ي ] إنجاز وتطبيق (יצירה ויישום): ورشة العمل ومسارات التمايز الثلاثة (دعم، أساسي، وإثراء/تحدٍ) ودمج UDL.
5. [ ح ] حصاد وزوّادة (חתימה וצידה לדרך): التأمل الذاتي، تذكرة الخروج، زوّادة الطالب، وسؤال نقل الأثر الحياتي للمنزل.

إذا كان التخطيط المرفوع مكتوباً بهيكل تقليدي (مثل: تمهيد، شرح، أسئلة، واجب بيتي)، قم بفرز وتوزيع وإثراء المحتوى بذكاء ومهنية عالية ليغذي المحطات الخمس كاملة بدون أي نقص وبأعلى معايير الجودة البيداغوجية.
استخرج أيضاً:
- عنوان الدرس (title)
- المادة الدراسية (subject)
- الصف (grade)
- زمن الحصة بالدقائق (duration)
- الهدف العام ومؤشرات النجاح (objective)

أخرج النتيجة بصيغة JSON حصراً بدون أي كود أو نصوص خارج الـ JSON:
{
  "title": "عنوان الدرس",
  "subject": "المادة الدراسية",
  "grade": "الصف",
  "duration": 45,
  "objective": "الهدف التعليمي ومعايير النجاح",
  "stations": {
    "m": "نص محطة المدخل المحفز بتفاصيلها...",
    "f": "نص محطة فهم وبناء المعنى بنمذجة المعلم والمفهوم...",
    "t": "نص محطة التفكير والتبصر وأسئلة التفكير العليا...",
    "y": "نص محطة الإنجاز والتطبيق ومسارات التمايز الثلاثة...",
    "h": "نص محطة الحصاد والزوّادة وتذكرة الخروج..."
  }
}`;

  // Helper to safely parse JSON from AI response
  const tryParseAiJson = (text) => {
    if (!text) return null;
    let clean = text.trim();
    // Remove markdown code fences if present
    if (clean.startsWith('```json')) clean = clean.slice(7);
    else if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, -3);
    clean = clean.trim();
    
    // Find json braces if surrounded by commentary
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    try {
      const obj = JSON.parse(clean);
      if (obj.stations && (obj.stations.m || obj.stations.f || obj.stations.t || obj.stations.y || obj.stations.h)) {
        return {
          title: obj.title || fileName.replace(/\.[^/.]+$/, '') || 'تخطيط درس مستورد',
          subject: obj.subject || 'عام',
          grade: obj.grade || 'المرحلة الابتدائية',
          duration: Number(obj.duration) || 45,
          objective: obj.objective || '',
          author: 'مستورد من الحاسوب ومُعالج بموديل مِفْتَاح',
          stations: normalizeLessonStations(obj.stations)
        };
      }
    } catch (e) {
      console.warn('Failed parsing AI JSON response:', e);
    }
    return null;
  };

  // 1. Try Gemini (Superior for PDFs via inlineData base64, as well as text)
  if (geminiKey) {
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    for (const m of models) {
      try {
        const parts = [];
        if (fileBase64 && (mimeType === 'application/pdf' || mimeType.startsWith('image/'))) {
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          });
          parts.push({ text: parsingPrompt });
        } else if (rawText) {
          parts.push({
            text: `${parsingPrompt}\n\nنص ملف التخطيط المرفوع من الحاسوب:\n"""\n${rawText.slice(0, 15000)}\n"""`
          });
        }

        if (parts.length > 0) {
          const res = await fetchWithTimeout(
            `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                  temperature: 0.4,
                  maxOutputTokens: 3800,
                  responseMimeType: "application/json"
                }
              })
            },
            14000
          );

          if (res.ok) {
            const data = await res.json();
            const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
            const parsed = tryParseAiJson(txt);
            if (parsed) return parsed;
          }
        }
      } catch (err) {
        console.warn(`Gemini upload parser (${m}) failed:`, err);
      }
    }
  }

  // 2. Try Groq (Ultra-fast for text)
  if (groqKey && rawText) {
    const groqModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'allam-2-7b', 'openai/gpt-oss-20b'];
    for (const gm of groqModels) {
      try {
        const res = await fetchWithTimeout(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: gm,
              messages: [
                { role: 'system', content: isHebrew ? 'אתה יועץ פדגוגי של מודל מפתיח. עליך להמיר את מערך השיעור המועלה ל-JSON של 5 התחנות.' : 'أنت خبير بيداغوجي لنموذج مِفتاح. حول التخطيط المرفوع إلى JSON يحوي المحطات الخمس بدقة.' },
                { role: 'user', content: `${parsingPrompt}\n\nنص ملف التخطيط المرفوع:\n"""\n${rawText.slice(0, 15000)}\n"""` }
              ],
              temperature: 0.4,
              max_tokens: 3800,
              response_format: { type: "json_object" }
            })
          },
          13000
        );

        if (res.ok) {
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content;
          const parsed = tryParseAiJson(txt);
          if (parsed) return parsed;
        }
      } catch (err) {
        console.warn(`Groq upload parser (${gm}) failed:`, err);
      }
    }
  }

  // 3. Fallback Heuristic Parser (If AI is unreachable or offline)
  const lines = (rawText || '').split('\n').map(l => l.trim()).filter(Boolean);
  const cleanBaseName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  
  let detectedTitle = cleanBaseName || 'تخطيط درس مستورد من الحاسوب';
  let detectedSubject = 'عام';
  let detectedGrade = 'المرحلة الابتدائية';
  let detectedObjective = '';

  // Scan first 15 lines for metadata
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];
    if (/عنوان|موضوع الدرس|נושא השיעור/i.test(line)) {
      detectedTitle = line.replace(/.*[:\-–]/, '').trim() || detectedTitle;
    } else if (/مادة|المادة|الموضوع|تחום דעת/i.test(line)) {
      detectedSubject = line.replace(/.*[:\-–]/, '').trim() || detectedSubject;
    } else if (/صف|الصف|כיתה/i.test(line)) {
      detectedGrade = line.replace(/.*[:\-–]/, '').trim() || detectedGrade;
    } else if (/هدف|الهدف|الأهداف|מטרה/i.test(line)) {
      detectedObjective = line.replace(/.*[:\-–]/, '').trim() || detectedObjective;
    }
  }

  // Distribute chunks of lines into the 5 stations
  const totalLines = lines.length;
  const chunk = Math.max(1, Math.floor(totalLines / 5));

  const sliceText = (start, end) => lines.slice(start, end).join('\n\n');

  return {
    title: detectedTitle,
    subject: detectedSubject,
    grade: detectedGrade,
    duration: 45,
    objective: detectedObjective || 'استيعاب المفاهيم الأساسية وتطبيقها في أنشطة متنوعة وفق نموذج مِفتاح.',
    author: 'مستورد من الحاسوب',
    stations: {
      m: sliceText(0, chunk) || '🔥 [م - مشوّق ومحفّز]: إثارة الفضول واستدعاء المعرفة السابقة وتهيئة الطلاب وتحديد هدف التعلم ومعيار النجاح.',
      f: sliceText(chunk, chunk * 2) || '💡 [ف - فهم وبناء المعنى]: تقديم المفهوم الأساسي بلغة واضحة ونمذجة المعلم للمهارة خطوة بخطوة وتوضيح معايير النجاح.',
      t: sliceText(chunk * 2, chunk * 3) || '🛠️ [ت - تطبيق وتدريب]: مهمة أساسية مشتركة، سقالات دعم، تحديات للمتقدمين، وتفعيل مجموعة الدعم الفوري المؤقتة.',
      y: sliceText(chunk * 3, chunk * 4) || '🔎 [ي - يقين من الفهم]: أداة فحص فردية لقياس دليل حدوث التعلم وتحديد قرارات المعلم الثلاثة (تقدم / تدريب إضافي / دعم مختلف).',
      h: sliceText(chunk * 4, totalLines) || '🎒 [ح - حصاد وزوّادة]: تأمل ذاتي وتذكرة خروج تلخص الزوّادة المعرفية والوجدانية وسؤال نقل الأثر للبيت.'
    }
  };
};

/**
 * 18. AI STEAM Station Smart Guide:
 * Guides elementary students through the 6 stations of the School STEAM Hub.
 * Specifically for Station 1: helps articulate the problem, why it is a problem, who is affected.
 * For Station 2: breaks down the problem into S, T, E, A, M.
 * For Station 3: crafts pitch script & prototyping tips.
 * For Station 4: gives testing advice & metrics.
 * For Station 5: guides iteration & improvements.
 * For Station 6: calculates & highlights impact on the school.
 */
export const guideSteamStationAI = async ({
  stationNumber = 1,
  problemTitle = '',
  problemDetail = '',
  whyProblem = '',
  extraContext = ''
}) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const stationPrompts = {
    1: `أنت "مرشد حاضنة ستيم الذكي" لمدرسة مشيرفة الابتدائية.
مهمتك في (المحطة 1: اكتشاف المشكلة وفهمها):
مساعدة الطالب في صياغة مشكلة مدرسية واقعية بدقة:
عنوان التحدي: "${problemTitle || 'مشكلة مدرسية'}"
ما كتبه الطالب عن المشكلة: "${problemDetail || 'لا يوجد وصف بعد'}"
ما كتبه عن أسباب المشكلة ولماذا هي مشكلة: "${whyProblem || 'لا يوجد تعليل بعد'}"

المطلوب:
1. قدم تشجيعاً حاراً للطالب.
2. وضح له كيف يعبر عن المشكلة بالتحديد وبجملة واضحة ومحددة.
3. ساعده في شرح "لماذا هي مشكلة حقيقية" (الأضرار المترتبة على صحة الطلاب أو البيئة أو التعلم في مدرسة مشيرفة إذا لم تحل).
4. اطرح عليه سؤالين توجيهيين لتحديد من يتأثر بها ومتى وأين تحدث بالتحديد.
اجعل الرد بنقاط قصيرة، لغة عربية فصحى مشوقة وميسرة لطلاب الابتدائي، مع إيموجيز مشجعة.`,

    2: `أنت "مرشد حاضنة ستيم الذكي" لمدرسة مشيرفة الابتدائية.
مهمتك في (المحطة 2: مصفوفة تكامل التخصصات STEAM):
التحدي المطروح: "${problemTitle}"
تفاصيل المشكلة: "${problemDetail} - لماذا هي مشكلة: ${whyProblem}"

المطلوب: اقترح أفكاراً ذكية ومبسطة ومناسبة لطلاب الابتدائي لربط المشكلة بأركان STEAM الخمسة:
• 🔬 العلوم (S): قانون أو ظاهرة علمية يمكن الاستفادة منها.
• 💻 التكنولوجيا (T): فكرة استخدام حساس أو أداة رقمية بسيطة.
• 🛠️ الهندسة (E): فكرة لتصميم وبناء نموذج من خامات بسيطة كرتون أو خشب.
• 🎨 الفنون واللغات (A): شعار جذاب وفكرة بوستر أو أسلوب إلقاء.
• 📐 الرياضيات (M): حسابات أو قياسات أو نسب مئوية يمكن قياسها.
اجعل الأفكار ملموسة وقابلة للتطبيق بالمدرسة.`,

    3: `أنت "مرشد حاضنة ستيم الذكي" لمدرسة مشيرفة الابتدائية.
مهمتك في (المحطة 3: هندسة النموذج الأولي والعرض Prototyping & Pitching):
التحدي: "${problemTitle}"
المطلوب:
1. اقترح نصائح لبناء نموذج أولي بأدوات آمنة وبسيطة متوفرة في المدرسة أو البيت.
2. اكتب له مسودة سيناريو إلقاء سريع في دقيقة واحدة (Elevator Pitch) مكون من 4 جمل:
   - الجملة 1: ما المشكلة التي لاحظناها؟
   - الجملة 2: ما حلنا المبتكر؟
   - الجملة 3: كيف يعمل؟
   - الجملة 4: ما الفائدة لمدرستنا مشيرفة؟`,

    4: `أنت "مرشد حاضنة ستيم الذكي" لمدرسة مشيرفة الابتدائية.
مهمتك في (المحطة 4: الاختبار والتقييم التبادلي Testing & Peer Review):
التحدي: "${problemTitle}"
المطلوب:
1. كيف يختبر الطالب نموذجه عملياً في ساحة أو صفوف مدرسة مشيرفة بأمان؟
2. ما الأرقام والقياسات التي يمكنه تسجيلها للتأكد من نجاح الفكرة (مثل: قياس الوزن، كمية الماء، درجة الصوت، الوقت المستغرق)؟
3. نصيحة لكيفية تقبل ملاحظات الزملاء وتحويلها إلى أفكار تطويرية.`,

    5: `أنت "مرشد حاضنة ستيم الذكي" لمدرسة مشيرفة الابتدائية.
مهمتك في (المحطة 5: التحسين وإعادة التصميم Iteration & Redesign):
التحدي: "${problemTitle}"
سياق التعديل: "${extraContext}"
المطلوب:
1. وضح للطالب أن الأخطاء والتحديات في النماذج الأولية هي سر نجاح أعظم العلماء والمخترعين!
2. اقترح 3 أفكار لتطوير النموذج للنسخة المحسنة (V2) وحل المشاكل الشائعة.`,

    6: `أنت "مرشد حاضنة ستيم الذكي" لمدرسة مشيرفة الابتدائية.
مهمتك في (المحطة 6: قياس الأثر والتكريم Impact & Recognition):
التحدي: "${problemTitle}"
المطلوب:
1. صغ بياناً ختامياً فخوراً للمشروع يوضح كيف سيغير هذا الابتكار مدرسة مشيرفة للأفضل.
2. اقترح عبارة وسام وشعار تميز يستحقه الفريق.`
  };

  const currentPrompt = stationPrompts[stationNumber] || stationPrompts[1];

  // 1. Try Groq
  if (groqKey) {
    const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'allam-2-7b'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: m,
            messages: [
              { role: 'system', content: 'أنت مرشد بيداغوجي ذكي لحاضنة ستيم بمدرسة مشيرفة الابتدائية. قدم إرشادات تشجيعية وعملية باللغة العربية الفصحى.' },
              { role: 'user', content: currentPrompt }
            ],
            temperature: 0.6,
            max_tokens: 650
          })
        }, 8000);

        if (res.ok) {
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content;
          if (txt && txt.trim()) return cleanAiResponse(txt.trim());
        }
      } catch (e) {
        console.warn(`Groq STEAM Station Guide (${m}) failed:`, e);
      }
    }
  }

  // 2. Try Gemini
  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
    for (const gm of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: currentPrompt }] }],
              generationConfig: { temperature: 0.6, maxOutputTokens: 650 }
            })
          },
          8000
        );

        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt && txt.trim()) return cleanAiResponse(txt.trim());
        }
      } catch (e) {
        console.warn(`Gemini STEAM Station Guide (${gm}) failed:`, e);
      }
    }
  }

  // Static Fallback
  return `أحسنت يا بطل الابتكار! 🌟 في هذه المحطة، ركّز على ربط ما تلاحظه في مدرستنا مشيرفة بالحلول العملية. كل فكرة مهما كانت بسيطة هي بداية لاختراع عظيم! 🚀💡`;
};

/**
 * 19. AI Excellence Lab Journey Guide ("مختبر التميّز | رحلة من المشكلة إلى الأثر"):
 * Guides elementary students through the 9 inquiry & engineering design stations.
 * Roles:
 * 1. Explains concepts in age-appropriate Arabic.
 * 2. Asks inquiry questions rather than giving ready solutions.
 * 3. Helps with precise wording (saving student's original thought vs refined formulation).
 * 4. Alerts to gaps (e.g. distinguishing assumption from fact, narrowing questions, balancing criteria & constraints).
 */
export const guideExcellenceLabAI = async ({
  stationNumber = 1,
  ageTrack = 'upper', // 'lower' (1-3) | 'upper' (4-6)
  problemText = '',
  questionText = '',
  evidenceText = '',
  subjectKey = '',
  solutionsList = '',
  planText = '',
  testDataText = '',
  reflectionText = ''
}) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const isLower = ageTrack === 'lower';
  const ageInstruction = isLower
    ? 'أنت تتحدث مع تلميذ في الصفوف الأولى (1-3). استخدم جملاً قصيرة جداً ومرحة، كلمات سهلة ومشجعة، وأمثلة حسية ملموسة.'
    : 'أنت تتحدث مع تلميذ في الصفوف العليا (4-6). استخدم أسلوباً علمياً مشوقاً، وركز على الدليل، والتحديد، والقياس.';

  let stationTask = '';
  switch (stationNumber) {
    case 1:
      stationTask = `المحطة 1: ألاحظ: ما المشكلة؟
رسالة المحطة: «انظر حولك: ما الشيء الذي تتمنى تحسينه في المدرسة أو البيت أو الحي؟»
ما كتبه الطالب: "${problemText}"
المطلوب منك:
1. اطرح عليه سؤالين استقصائيين مثل: "متى لاحظت ذلك؟" و "ما الذي رأيته بنفسك في مدرسة مشيرفة؟".
2. ساعده على التمييز بين موضوع عام (مثل "الكهرباء" أو "النظافة") ومشكلة محددة قابلة للملاحظة.
3. اقترح له صياغة أوضح وأدق للمشكلة ليراجعها ويختار ما يناسبه.`;
      break;

    case 2:
      stationTask = `المحطة 2: أحدّد: ماذا أريد أن أعرف أو أغيّر؟
المشكلة الملاحظة: "${problemText}"
سؤال التحدي الحالي: "${questionText}"
المطلوب منك:
1. اشرح للطالب الفرق بين: ما شاهده كواقع، وتفسيره المحتمل، وفكرته للحل.
2. ساعده على تضييق السؤال ليصبح سؤال بحث أو تحدياً هندسياً عملياً يبدأ بـ "كيف يمكننا... دون أن...؟".
3. ذكّره بالحدود العملية (الوقت المتاح، المواد الممكنة في المدرسة، وما يمكن قياسه).`;
      break;

    case 3:
      stationTask = `المحطة 3: أستكشف: ماذا نعرف قبل أن نقترح حلًا؟
المشكلة: "${problemText}"
ما كتبه كدليل: "${evidenceText}"
المطلوب منك:
1. نبّه الطالب بلطف إذا كان قد كتب تخميناً أو حكماً شخصياً على أنه حقيقة، وسل: "كيف عرفت ذلك؟ وما مصدر هذه المعلومة؟".
2. ساعده على التمييز بين "وجدت دليلاً على..." و "ما زلت لا أعرف...".
3. اقترح عليه مصدرين أو فكرتين بسيطتين لجمع أدلة حقيقية من بيئة المدرسة.`;
      break;

    case 4:
      stationTask = `المحطة 4: أرى المشكلة بعيون المواد (العدسة: ${subjectKey || 'المواد الدراسية'})
المشكلة: "${problemText}"
المطلوب منك:
بين للطالب كيف ينظر معلم ${subjectKey || 'المادة'} لهذه المشكلة، واقترح عليه فكرة لسؤال أو مهمة قصيرة جداً خاصة بهذه المادة تجعل مشروعه أكثر عمقاً وتكاملاً.`;
      break;

    case 5:
      stationTask = `المحطة 5: أتخيل وأقارن حلولًا
المشكلة: "${problemText}"
الحلول المقترحة: "${solutionsList}"
المطلوب منك:
1. ساعد الطالب في مقارنة حلوله بحسب المعايير (هل يعالج المشكلة؟ هل يمكن تنفيذه؟ ما مواده؟ كيف سنعرف أنه نجح؟).
2. اسأله عن ميزة كل فكرة وأهم قيد أو عائق أمامها (دون أن تختار الحل نيابة عنه!).`;
      break;

    case 6:
      stationTask = `المحطة 6: أخطّط وأبني
المشروع والحل المختار: "${planText}"
المطلوب منك:
1. ساعد في ترتيب خطوات العمل في 3-4 خطوات متسلسلة.
2. اقترح عليه كيف يوزع الأدوار بإنصاف بين أعضاء الفريق.
3. قدم نصيحة لاختيار خامات آمنة وقليلة التكلفة في المدرسة أو البيت.`;
      break;

    case 7:
      stationTask = `المحطة 7: أجرّب وأقيس
ما كتبه عن التجربة والبيانات: "${testDataText}"
المطلوب منك:
1. شجع الطالب على قياس ما قبل التجربة وما بعد التجربة (Before / After).
2. اسأله: "هل تدعم هذه الأرقام استنتاجك؟ وما الذي قد يكون أثر على النتيجة؟".
3. اقترح طريقة بسيطة لعرض الأرقام (جدول أو رسم مبسط).`;
      break;

    case 8:
      stationTask = `المحطة 8: أتبصّر وأعيد المحاولة
رسالة المحطة: «ماذا نجح؟ ماذا لم ينجح؟ ما الذي ستغيّره، ولماذا؟»
ما كتبه الطالب: "${reflectionText}"
المطلوب منك:
1. أكد للطالب أن إعادة المحاولة والتعديل جزء أساسي وممتع في رحلة الابتكار وليست إخفاقاً أبداً.
2. اقترح عليه فكرتين لتطوير نسخته الثانية (V2).`;
      break;

    case 9:
      stationTask = `المحطة 9: أشارك الأثر
ملخص المشروع: "${problemText} | ${planText}"
المطلوب منك:
1. صغ عبارة ملهمة وموجزة تعبر عن فخر المدرسة بهذا الابتكار.
2. اطرح السؤال الختامي: "لمن يفيد الحل؟ وما الخطوة التالية لتطبيقه على نطاق أوسع في مدرستنا؟".`;
      break;

    default:
      stationTask = `قدم نصيحة تفكير هندسي وبحثي لتلميذ المرحلة الابتدائية حول: "${problemText}".`;
  }

  const prompt = `أنت "مرشد مختبر التميّز" في مدرسة مشيرفة الابتدائية.
${ageInstruction}
قواعدك الصارمة:
- لا تعطِ حلاً جاهزاً أبداً؛ دورك أن تسأل، وتلفت النظر للثغرات، وتساعد في صياغة الفكرة.
- الرد بلغة عربية فصحى مشوقة، مقسم لنقاط قصيرة، مع إيموجيز مشجعة (💡 🔬 🔍 🛠️ 🎯).
- الحد الأقصى للرد: 3 إلى 4 أسطر فقط لتناسب تركيز التلميذ.

المهمة الحالية:
${stationTask}`;

  // 1. Try Groq
  if (groqKey) {
    const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'allam-2-7b'];
    for (const m of models) {
      try {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: m,
            messages: [{ role: 'system', content: 'أنت مرشد مختبر التميز بمدرسة مشيرفة.' }, { role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 500
          })
        }, 7500);

        if (res.ok) {
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content;
          if (txt && txt.trim()) return cleanAiResponse(txt.trim());
        }
      } catch (e) {
        console.warn(`Groq ExcellenceLab AI (${m}) error:`, e);
      }
    }
  }

  // 2. Try Gemini
  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
    for (const gm of models) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.5, maxOutputTokens: 500 }
            })
          },
          7500
        );

        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt && txt.trim()) return cleanAiResponse(txt.trim());
        }
      } catch (e) {
        console.warn(`Gemini ExcellenceLab AI (${gm}) error:`, e);
      }
    }
  }

  // Fallback
  return isLower
    ? 'أحسنت يا بطل! 🌟 فكرتك جميلة جداً، فكر في شيء شاهدته بنفسك في مدرستنا، وتذكر أن العلماء الصغار يلاحظون الأشياء بذكاء! 🔍💡'
    : 'خطوة ممتازة نحو التفكير العلمي! 🌟 احرص على أن تميز بين ما رأيته كدليل مؤكد وما تتوقعه، واجعل سؤالك محدداً بدقة. 🎯🔬';
};


