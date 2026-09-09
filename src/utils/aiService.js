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

  return { geminiKey, groqKey, xaiKey };
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 7000) => {
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
    const models = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
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
                maxOutputTokens: 1000
              }
            })
          },
          7000
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