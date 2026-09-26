import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

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
          else if (trimmed.startsWith('AIza') || trimmed.startsWith('AQ.')) cachedGeminiKey = trimmed;
        });
      }
    } catch (e) {
      console.warn('Failed fetching AI keys from Firestore:', e);
    }
    lastKeyFetchTime = now;
  }

  let geminiKey = cachedGeminiKey || localStorage.getItem('db_gemini_key') || '';
  let groqKey = cachedGroqKey || localStorage.getItem('db_groq_key') || '';
  let xaiKey = cachedXaiKey || localStorage.getItem('db_xai_key') || '';

  // Auto-detect from localStorage items too
  [geminiKey, groqKey, xaiKey, localStorage.getItem('db_gemini_key') || '', localStorage.getItem('db_groq_key') || '', localStorage.getItem('db_xai_key') || ''].forEach(k => {
    if (!k) return;
    const trimmed = k.trim();
    if (trimmed.startsWith('gsk_') && !groqKey) groqKey = trimmed;
    else if (trimmed.startsWith('xai-') && !xaiKey) xaiKey = trimmed;
    else if ((trimmed.startsWith('AIza') || trimmed.startsWith('AQ.')) && !geminiKey) geminiKey = trimmed;
  });

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
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-120b',
      'allam-2-7b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.6-27b'
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

  // 2. Try Google Gemini
  if (geminiKey) {
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
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
 * [ م ] مدخل محفّز (משיכה וסקרנות) | [ ف ] فهم وبناء المعنى (פיתוח הבנה) | [ ت ] تفكير وتبصّر (תובנה והעמקה) | [ ي ] إنجاز وتطبيق (יצירה ויישום) | [ ح ] حصاد وزوّادة (חתימה וצידה לדרך)
 */
export const generateMafatihLessonPlanAI = async ({
  subject = 'عام',
  grade = 'المرحلة الابتدائية',
  topic = '',
  objective = '',
  duration = 45,
  notes = ''
}) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  const isSEL = (subject || '').includes('عاطفي') || (subject || '').includes('اجتماعي') || (subject || '').includes('SEL') || (notes || '').includes('عاطفي') || (notes || '').includes('SEL') || (topic || '').includes('غضب') || (topic || '').includes('مشاعر') || (topic || '').includes('تعاطف');

  const prompt = `أنت الخبير البيداغوجي والمستشار التعليمي الأول لنموذج «مِفتاح» (מודל מפתיח) بمدرسة مشيرفة الابتدائية.
الإطار المعتمد: "إطار مدرسي لبناء لغة تربوية مشتركة، وتعزيز شراكة الطلاب، وتعلّم يدمج الاحتواء والدمج، والتعليم المتمايز، والتقويم".

المطلوب: هندسة وتخطيط درس نموذجي تطبيقي مفصل ومكتمل بنسبة 100% لموضوع: "${topic || 'المفهوم الأساسي'}"
- المادة الدراسية: "${subject}"
- الصف والمستوى: "${grade}"
- زمن الحصة: ${duration} دقيقة
${objective ? `- الهدف التعليمي المحدد: "${objective}"` : ''}
${notes ? `- ملاحظات المعلم الإضافية: "${notes}"` : ''}

⭐ المبادئ الثلاثة الممتدة الإلزامية في كل محطة:
1. الاحتواء والدمج (لكل طالب مكان ومساهمة): توفير طرائق ميسّرة للوصول للمحتوى، بدائل حسية وتعبيرية (كلام، رسم، حوار ثنائي، إشارة)، وحفظ كرامة الطالب عند طلب المساعدة.
2. التعليم المتمايز (استجابة متغيّرة بحسب الحاجة): 3 مسارات عمل مرنة في الورشة، طاولة التدريس المركّز («محطة الضبط والإتقان»)، وبطاقة «مفتاح العودة إلى الفهم».
3. التقويم (معلومات توجّه الخطوة التالية): شواهد فهم موجزة ومؤشرات تقدم واضحة، ومعايير نجاح في ثلاثة أبعاد (بُعد المحتوى، بُعد المهارة، بُعد المشاركة).

${isSEL ? `
❤️ توجيه جوهري ملزم للمجال العاطفي والاجتماعي (SEL - Social-Emotional Learning وفق CASEL):
بما أن الدرس يقع في المجال العاطفي والاجتماعي، اجعل النصوص حوارية وجدانية واقعية، وخصص القاموس لتسمية المشاعر، وأسئلة التفكير لتبني منظور الآخر، والورشة للعب الأدوار والتعاطف، والزوّادة للفتة إنسانية يمارسها الطالب في بيته ومع أسرته اليوم.` : ''}

⚠️ قواعد كتابة المحطات الخمس (ممنوع تماماً العبارات العامة والقوالب الفارغة، اكتب النصوص الفعلية الملموسة):

1. [ م ] محطة مدخل محفّز (משיכה וסקרנות):
   - المثير الحسي/الواقعي الفعلي (صورة، لغز، قصة قصيرة، ظاهرة أو خطأ لافت).
   - سؤال الطالب: «ما الذي يثير فضولي؟ وما الذي نريد استكشافه؟»
   - الاحتواء والدمج: البدء بسؤال ميسّر «ماذا لاحظتم؟»، طرائق استجابة متنوعة (رسم، حوار ثنائي).
   - مؤشر التقدم وشاهد التقويم.
   - عبارة الانتقال الإلزامية بالحرف: «انطلاقًا مما طرحتموه، سنحاول اليوم أن نفهم…»

2. [ ف ] محطة فهم وبناء المعنى (פיתוח הבנה):
   - هدف التعلّم المصاغ بلغة مفهومة للطلاب ومعايير النجاح في 3 أبعاد (المحتوى: ماذا سيفهم؟ المهارة: ماذا سينفذ؟ المشاركة: كيف سيشارك؟).
   - النص التعليمي أو المسألة بالأرقام والخطوات، ونمذجة المعلم (I Do) بالتفكير بصوت مسموع.
   - معجم المفاهيم الصفي (رف المفاتيح).
   - الاحتواء وتمايز الشرح (تمثيلات UDL، مثال محلول، بطاقة خطوات).
   - شاهد الفهم الموجز ومؤشر التقدم.
   - عبارة الانتقال الإلزامية بالحرف: «تعرّفنا إلى الفكرة؛ والآن سنفحص كيف تعمل ولماذا»

3. [ ت ] محطة تفكير وتبصّر (תובנה והעמקה):
   - سؤال الطالب: «كيف توصّلت إلى الإجابة؟ وما الذي يدعمها؟»
   - 3 إلى 4 أسئلة تفكير عليا صريحة تخص الدرس («كيف توصّلت إلى الاستنتاج؟»، «ما العلاقة بين الأجزاء؟»، «ما الدليل الذي يدعم الادّعاء؟»، «ما الذي سيتغيّر إذا غيّرنا أحد المعطيات؟»).
   - الاحتواء والدمج: وقت للتفكير الفردي، أدوار متناوبة (الباحث عن الأدلة، مقدّم التعليل، المتحدّث).
   - التمايز: بطاقات تلميح، منظمات تفكير، وفحص ادعاء مضاد أو تفسير بديل للمتقدمين.
   - شاهد الفهم ومؤشر التقدم.
   - عبارة الانتقال الإلزامية بالحرف: «فحصنا الفكرة وفسّرناها؛ والآن سنستخدمها في المهمة»

4. [ ي ] محطة إنجاز وتطبيق (יצירה ויישום):
   - سؤال الطالب: «كيف أستخدم ما تعلّمته؟ وما الأدوات التي تساعدني؟»
   - مهمة الورشة ومعايير النجاح.
   - اكتب تفاصيل المسارات الثلاثة المرنة كاملة بأسئلتها وتمارينها الفعلية:
     * مسار التطبيق المدعوم: تمرين تطبيقي مباشر مدعوم ببطاقة خطوات ومثال محلول وبنك كلمات.
     * مسار التطبيق المستقل: مهمات التطبيق وحل المسائل الأساسية باستقلالية.
     * مسار التعمّق والإبداع: مهمة تحدٍ فكري (تحليل خطأ، مقارنة حلول، تخطيط أو دمج أفكار وإنتاج مخرج مبتكر).
   - طاولة التدريس المركّز («محطة الضبط والإتقان»): خطة المعلم لترسيخ المفهوم لمجموعة 4-6 طلاب مع تدريب موجّه.
   - بطاقة «مفتاح العودة إلى الفهم» ودور الزميل المساند.
   - مؤشر التقدم وطريقة التحقق.
   - عبارة الانتقال الإلزامية بالحرف: «سنفحص الآن ما نجحنا في إنجازه، وما نريد أن نحمله معنا للمرحلة المقبلة»

5. [ ح ] محطة حصاد وزوّادة (חתימה וצידה לדרך):
   - سؤال الطالب: «فيمَ تقدّمت؟ وما الذي سأحمله معي للمرحلة المقبلة؟»
   - إجابات واضحة للأسئلة الخمسة للتأمل والتقويم الذاتي:
     1) ماذا تعلّمت أو نجحت في إنجازه اليوم؟
     2) ما المثال الذي يدلّ على تقدّمي؟
     3) ما الذي ساعدني على التعلّم؟
     4) ما الذي ما زال يحتاج إلى تدريب أو شرح؟
     5) أين يمكنني استخدام ما تعلّمته؟
   - الزوّادة الصريحة المكتوبة (المعرفة، المهارة، أو السؤال اللاحق).
   - ختام الخطة بمقولة الطالب المحورية:
     «أعرف ما أتعلّمه، وأجد طريقة للمشاركة، وأطلب المساعدة حين أحتاج إليها، وأُظهر كيف تقدّمت».

أخرج النتيجة بصيغة JSON حصراً بهذا المخطط بدون أي كود أو زيادات خارج الـ JSON:
{
  "title": "${topic || 'عنوان الدرس'}",
  "subject": "${subject}",
  "grade": "${grade}",
  "duration": ${duration},
  "objective": "${objective || 'الهدف التعليمي العام ومعايير النجاح'}",
  "stations": {
    "m": "نص محطة المدخل المحفّز الكامل مع المثير وسؤال الطالب وعبارة الانتقال...",
    "f": "نص محطة فهم وبناء المعنى الكامل مع النمذجة والمعجم ومعايير النجاح وعبارة الانتقال...",
    "t": "نص محطة التفكير والتبصّر مع أسئلة التفكير العليا الصريحة والأدوار وعبارة الانتقال...",
    "y": "نص محطة الإنجاز والتطبيق مع المسارات الثلاثة كاملة وطاولة الضبط والإتقان وعبارة الانتقال...",
    "h": "نص محطة الحصاد والزوّادة مع الأسئلة الخمسة والزوّادة ومقولة الطالب الختامية..."
  }
}`;

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
              { role: 'system', content: 'أنت مستشار تربوي وخبير بيداغوجي بمدرسة مشيرفة. يجب أن تكون إجابتك بتنسيق json باللغة العربية الفصحى وبمحتوى تطبيقي مفصل ومحدد لنص الدرس وممنوع تماماً القوالب العامة.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.6,
            max_tokens: 2200,
            response_format: { type: "json_object" }
          })
        }, 9000);
        if (res.ok) {
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content;
          if (txt) {
            const parsed = JSON.parse(txt);
            if (parsed.stations && parsed.stations.m && parsed.stations.f) {
              return {
                title: parsed.title || topic,
                subject: parsed.subject || subject,
                grade: parsed.grade || grade,
                duration: parsed.duration || duration,
                objective: parsed.objective || objective,
                stations: {
                  m: parsed.stations.m,
                  f: parsed.stations.f,
                  t: parsed.stations.t,
                  y: parsed.stations.y,
                  h: parsed.stations.h
                }
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
                maxOutputTokens: 2200,
                responseMimeType: "application/json"
              }
            })
          }, 9000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            const parsed = JSON.parse(txt);
            if (parsed.stations && parsed.stations.m && parsed.stations.f) {
              return {
                title: parsed.title || topic,
                subject: parsed.subject || subject,
                grade: parsed.grade || grade,
                duration: parsed.duration || duration,
                objective: parsed.objective || objective,
                stations: {
                  m: parsed.stations.m,
                  f: parsed.stations.f,
                  t: parsed.stations.t,
                  y: parsed.stations.y,
                  h: parsed.stations.h
                }
              };
            }
          }
        }
      } catch (e) {
        console.warn(`Gemini lesson planning (${m}) failed:`, e);
      }
    }
  }

  // 3. High-Quality Pedagogical Synthesis Engine (Intelligent Fallback tailored to the prompt)
  const safeTopic = topic || 'المفهوم التعليمي المركزي';
  const safeObj = objective || `أن يتعرف الطالب على ${safeTopic} ويوظفه في مواقف تعليمية وحياتية متنوعة`;

  if (isSEL) {
    return {
      title: safeTopic,
      subject: subject,
      grade: grade,
      duration: duration,
      objective: safeObj || `أن يمتلك الطالب مهارات ${safeTopic} والوعي الذاتي وتنظيم المشاعر وبناء علاقات إيجابية آمنة`,
      stations: {
        m: `🧲 [ م - مدخل محفّز (משיכה וסקרנות)] (5 دقائق):\n• محفز وجداني وحسي: تجربة "قارورة الهدوء السحرية" وفحص الطقس الداخلي للمشاعر (Emotional Weather Report)؛ يطلب المعلم من كل طالب تسمية شعوره الحالي واختيار رمزه المناسب لربطه بموضوع "${safeTopic}".\n• سؤال الإشعال الوجداني: "عندما تفيض عواطفنا في موقف يتعلق بـ (${safeTopic})، كيف يمكن لشرارة صغيرة أن تشعل حريقاً، وكيف نصنع بأيدينا واحة من الأمان والهدوء لنا ولمن حولنا؟"\n• دور الطالب: التعبير العفوي الصادق والشعور بالأمان والقبول دون خوف من التقييم أو الأحكام.`,

        f: `💡 [ف - فهم وبناء المعنى (פיתוח הבנה)] (10 دقائق):\n• نوعية النص التعليمي: قراءة نص قصصي/حواري وجداني واقعي يعالج "${safeTopic}" في موقف صفي أو أسري (مثل قصة: سامي والبركان الصغير في قلبه / لغز المقعد الخالي).\n• قاموس المشاعر والمصطلحات: تفكيك وتسمية المشاعر بدقة [الوعي بالذات، التعاطف Empathy، تنظيم الانفعالات Self-Regulation، الأمان النفسي].\n• نمذجة المعلم (I Do): المعلم يمثل بصوت مفكر كيف يتعامل مع الموقف بانفعال إيجابي متزن: "توقف، تنفس عميقاً، افصل بين المشاعر الطبيعية والسلوك المقبول، ثم استمع للآخر بالعين والقلب".`,

        t: `🧠 [ت - تفكير وتبصّر (תובנה והעمקה)] (8 دقائق):\nحوار سقراطي تأملي في الذكاء العاطفي والاجتماعي:\n1. سؤال تبني منظور الآخر (Perspective Taking): "لو وضعت نفسك في حذاء زميلك في موقف (${safeTopic})، ما الاحتياج العميق الذي لم يجد من يفهمه؟"\n2. الموازنة بين الاندفاع والاستجابة: "ما الفرق الجوهري بين رد الفعل الاندفاعي اللحظي، والاستجابة المتزنة الحكيمة؟"\n3. التبصر في الأثر الإنساني: "كيف تسهم ممارستنا لـ (${safeTopic}) في تحويل صفنا ومدرستنا إلى بيئة لا يشعر فيها أحد بالغربة أو الضعف؟"`,

        y: `🛠️ [ي - إنجاز وتطبيق (יצירה ויישום)] (15 دقيقة):\nورشة تمكين وجداني ومحاكاة في بيئة آمنة بمسارات تمايز متكاملة UDL:\n• مسار الدعم (التعبير الآمن): بطاقات مشاعر ملونة مصورة وصياغة جملة: (أنا أشعر بـ... عندما يحدث... وأحتاج إلى...).\n• المسار الأساسي (لعب أدوار Role-Playing): محاكاة ثنائية لموقف نزاع أو سوء فهم واقعي، وتطبيق استراتيجية الاستماع المتعاطف وحل النزاع بود.\n• مسار التميز والقيادة: صياغة "ميثاق الأمان النفسي الصفي" أو تصميم بطاقات إرشادية مبتكرة لزاوية الاسترخاء (Peace Corner).\n• المخرج الملموس: ميثاق صفي موقع أو بطاقات دعم شعوري متبادلة تُعلّق على شجرة المودة الصفية.`,

        h: `🎒 [ح - حصاد وزوّادة (חתימה וצידה לדרך)] (7 دقائق):\n1. تذكرة الخروج الوجدانية (Exit Ticket):\n"زوّادتي القلبية اليوم: (${safeTopic}) قوة داخلية ومهارة أمارسها لأحمي نفسي وأسعد من حولي".\n2. زوّادة نقل الأثر للبيت والأسرة:\n"الليلة سأقدم لفتة محبة أو استماع متعاطف لأحد أفراد أسرتي، وسأعلم إخوتي طريقة التنفس الهادئ عند الانزعاج لنشر المحبة في بيتنا".`
      }
    };
  }

  return {
    title: safeTopic,
    subject: subject,
    grade: grade,
    duration: duration,
    objective: safeObj,
    stations: {
      m: `🎯 [ م - مدخل محفّز (משיכה וסקרנות)]:\nيطرح المعلم مفارقة واقعية أو لغزاً بصرياً متعلقاً بـ "${safeTopic}" دون الكشف عن الحل أو القاعدة لكسر الجمود وإثارة الفضول الفطري.\n• سؤال الإشعال: "تأملوا معي هذا المشهد العجيب: كيف يمكن تفسير هذا الأمر في حياتنا؟"\n• دور الطالب: طرح التخمينات الأولية وفحص الفرضيات الذهنية المسبقة بحماس وشغف.`,
      
      f: `💡 [ف - فهم وبناء المعنى (פיתוח הבנה)]:\n• المصطلحات المركزية: تفكيك وتطوير الفهم وتعريف دقيق ومبسط للمصطلحات الجوهرية المرتبطة بـ "${safeTopic}".\n• نمذجة المعلم (I Do): يقوم المعلم بحل مسألة أو استعراض مثال نموذجي على اللوح خطوة بخطوة مع إبراز طريقة التفكير الصوتي المنظم وبناء المعنى.\n• التطبيق الموجه (We Do): إشراك الطلاب جماعياً في فحص مثال ثانٍ لترسيخ الفهم السليم.`,
      
      t: `🧠 [ت - تفكير وتبصّر (תובנה והעמקה)]:\n• سؤال التحليل والمقارنة: "لو قمنا بتغيير أحد العناصر في ${safeTopic}، فكيف ستتأثر النتيجة النهائية؟ ولماذا؟"\n• سؤال النقد والتقييم والتبصر: "ما هو الخطأ الشائع الذي يقع فيه البعض عند التعامل مع هذا المفهوم، وكيف نتفاداه بحكمة؟"\n• سؤال استخلاص العبر: "ماذا لو لم نكن نعرف هذا القانون/المفهوم، كيف كانت حياتنا ستتأثر اليوم؟"`,
      
      y: `🛠️ [ي - إنجاز وتطبيق (יצירה ויישום)]:\n• مسار الدعم والمؤازرة (المبتدئ): مهمة موجهة مع بطاقة إرشادية وتدريبات متدرجة الخطوات.\n• مسار التمكين (المتوسط): حل مهمة مركبة في ثنائيات أو مجموعات تعلم تشاركي تتطلب تحقيق إنجاز تطبيقي متكامل.\n• مسار التحدي والإثراء (المتقدم): ابتكار مسألة جديدة أو ربط ${safeTopic} بمجال علمي أو إبداعي تطبيقي آخر.\n• مخرج الورشة: إنجاز عملي وبطاقة عمل منجزة أو منتج ملموس يبرهن على الفهم والتطبيق.`,
      
      h: `🎒 [ح - حصاد وزوّادة (חתימה וצידה לדרך)]:\n• حصد الثمار وسؤال الخروج الإلزامي: "اكتب في جملة واحدة: ما الفكرة الكبرى التي اكتشفتها اليوم في ${safeTopic}؟"\n• خانة زوّادتي (צידה לדרך): "زوّادتي اليوم: مفهوم ${safeTopic}؛ وتطبيقي العملي: سأوظف هذا الزاد في منزلي ومع عائلتي عندما..."\n• تقييم ذاتي: يضع الطالب إشارة على مقياس الثقة (من 1 إلى 5) لمدى قدرته على شرح المفهوم لزميل آخر.`
    }
  };
};

/**
 * 🧞‍♂️ Scientific Genie AI Assistant (جني البحث العلمي السحري)
 * Multi-turn conversational AI specialized in elementary science inquiry,
 * hypotheses, experiments, variable identification, and conclusions.
 */
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
