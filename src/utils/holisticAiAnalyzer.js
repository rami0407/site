// Holistic Mapping Pedagogical AI Engine (Privacy-Preserving, Bilingual AR/HE)
// Exclusively powers Principal Rami & Coordinator Jihan's Analytics Hub (`#/holistic-analytics`)
// Never transmits student national ID numbers (`idNumber` / ת.ז) to external AI providers.

import { getActiveAiKeys, cleanAiResponse } from './aiService.js';

const callPedagogicalLlm = async ({ systemPrompt, userPrompt, timeoutMs = 18000 }) => {
  const { geminiKey, groqKey } = await getActiveAiKeys();

  // 1. High-speed Groq LLM models
  if (groqKey) {
    const groqModels = [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
      'allam-2-7b'
    ];
    for (const model of groqModels) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.55,
            max_tokens: 2400
          })
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const raw = data?.choices?.[0]?.message?.content;
          if (raw && raw.trim()) {
            const cleaned = cleanAiResponse(raw.trim());
            if (cleaned) return cleaned;
          }
        }
      } catch {
        clearTimeout(timer);
      }
    }
  }

  // 2. Google Gemini fallback if configured
  if (geminiKey && geminiKey.startsWith('AIza')) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: {
              temperature: 0.55,
              maxOutputTokens: 2400
            }
          })
        }
      );
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw && raw.trim()) {
          const cleaned = cleanAiResponse(raw.trim());
          if (cleaned) return cleaned;
        }
      }
    } catch {
      clearTimeout(timer);
    }
  }

  return null;
};

const getLanguageDirective = (langMode) => {
  if (langMode === 'he') {
    return 'כתוב את התשובה המלאה בעברית פדגוגית רשמית, מקצועית ורהוטה המותאמת למשרד החינוך, למפקח בית הספר ולהנהלה. השתמש בכותרות ברורות, נקודות מסודרות והמלצות יישומיות. אל תכלול מחשבות פנימיות באנגלית.';
  }
  if (langMode === 'both') {
    return 'اكتب التقرير بشكل ثنائي اللغة مرتب وواضح: أولاً ملخص تنفيذي وتوصيات باللغة العربية الفصحى التربوية لإدارة المدرسة والطاقم، يليه مباشرة قسم رسمي متكامل باللغة العبرية التربوية الرسمية (עברית פדגוגית תקנית למשרד החינוך ולפיקוח). يمنع كتابة أي مسودات تفكير بالإنجليزية.';
  }
  return 'اكتب الإجابة الكاملة باللغة العربية الفصحى التربوية الواضحة والمهنية، مقسمة إلى عناوين واضحة ونقاط عملية قابلة للتطبيق الفوري في المدرسة. يمنع كتابة أي مسودات تفكير بالإنجليزية.';
};

/**
 * 1. Natural Language School / Grade / Class Data Analyst & Official Report Generator
 */
export const runSchoolPedagogicalAiAnalysis = async ({
  questionOrTopic,
  reportType = 'custom_question',
  langMode = 'ar',
  contextSummary
}) => {
  const langRule = getLanguageDirective(langMode);

  const roleHeader =
    reportType === 'inspector_report'
      ? 'أنت مستشار تربوي خبير في التقييم والقياس بوزارة المعارف ومدرسة مشيرفة الابتدائية، متخصص في إعداد تقارير رسمية للمفتش والإدارة (דוחות פיקוח והערכה רב-שנתית).'
      : reportType === 'team_meeting'
      ? 'أنت خبير قيادة تربوية متخصص في تحضير جلسات التقييم التربوية للمربين والمركزين (ישיבות פדגוגיות ומיפוי הוליסטי).'
      : reportType === 'interventions_impact'
      ? 'أنت محلل بيانات تربوية متخصص في قياس نجاعة التدخلات العلاجية وعدالة توزيع الموارد والساعات الفردية (אפקטיביות מענים והקצאת משאבים).'
      : 'أنت المحلل التربوي الذكي لمدرسة مشيرفة الابتدائية، تساعد مدير المدرسة الأستاذ رامي ارفاعية ومركزة التقييم المربية جيهان اغبارية في فهم معطيات الميبوي الهوليستي بعمق واتخاذ قرارات تربوية دقيقة.';

  const systemPrompt = `${roleHeader}\n${langRule}`;

  const userPrompt = `فيما يلي المعطيات الحقيقية المجمّعة (بدون أرقام هوية حفاظاً على الخصوصية) من منظومة الميبوي الهوليستي متعدد السنوات في مدرسة مشيرفة الابتدائية:

${contextSummary}

المطلوب تحليله بدقة:
${questionOrTopic}

يرجى تقديم تقرير منظم يشمل:
1. قراءة تنفيذية سريعة لأهم المؤشرات والأرقام البارزة.
2. تشخيص الفجوات الخفية ونقاط القوة في الصفوف/الطبقات.
3. توصيات عملية محددة وقابلة للتنفيذ الفوري (توزيع ساعات فردية، مجموعات تقوية، مرافقة عاطفية/اجتماعية، ومتابعة المربين).`;

  const aiResult = await callPedagogicalLlm({ systemPrompt, userPrompt });
  if (aiResult) return aiResult;

  // Deterministic offline/fallback structured summary from real data
  if (langMode === 'he') {
    return `📊 דוח ניתוח פדגוגי מבוסס נתונים — בית ספר משירפה היסודי\n\n${contextSummary}\n\n✅ המלצות מרכזיות לביצוע:\n1. מתן עדיפות מיידית לתלמידים המסומנים ברדאר ההתרעה המוקדמת (ציון 0–54 ללא מענה לימודי מתועד).\n2. איזון הקצאת שעות פרטניות ושילוב בין הכיתות בהתאם למדד פער הצרכים מול המענים.\n3. קיום שיחות מיפוי ממוקדות עם מחנכי הכיתות שבהן אחוז השלמת המיפוי טרם הגיע ל-100%.`;
  }
  return `📊 ملخص التحليل التربوي المستند إلى المعطيات الحية — مدرسة مشيرفة الابتدائية\n\n${contextSummary}\n\n✅ التوصيات العملية الفورية:\n1. منح أولوية قصوى للطلاب المرصودين في رادار الإنذار المبكر (علامات 0–54 بدون استجابة تعليمية مسجلة).\n2. موازنة الساعات الفردية وساعات الدمج بين الصفوف وفق مؤشر عدالة توزيع الموارد.\n3. متابعة استكمال التعبئة في الصفوف التي لم تصل نسبة الإنجاز فيها إلى 100% وتحديد موعد مراجعة في سجل القرارات.`;
};

/**
 * 2. Individualized Intervention Plan (תוכנית התערבות אישית - תח"י) OR Parent Meeting Guide
 */
export const generateStudentAiPlanOrParentBrief = async ({
  mode = 'intervention_plan', // 'intervention_plan' | 'parent_brief'
  langMode = 'ar',
  studentProfileSummary
}) => {
  const langRule = getLanguageDirective(langMode);

  const systemPrompt =
    mode === 'parent_brief'
      ? `أنت مستشار تربوي خبير في التواصل البنّاء والحساس مع أولياء الأمور في مدرسة مشيرفة الابتدائية.\n${langRule}`
      : `أنت خبير تربوي وعلاجي متخصص في بناء خطط التدخل الفردية الشاملة (תוכנית התערבות אישית - תח"י) لطلاب المرحلة الابتدائية.\n${langRule}`;

  const userPrompt =
    mode === 'parent_brief'
      ? `بيانات الطالب التربوية والاجتماعية وتطور علاماته (بدون رقم هوية):
${studentProfileSummary}

المطلوب: صياغة دليل محادثة ورسالة تربوية راقية، دافئة وبنّاءة لاجتماع ولي الأمر تشمل:
1. افتتاحية إيجابية تبرز نقاط القوة والتميز لدى الطالب وتعزز ثقة الأهل.
2. عرض لطيف ومهني للمهارات أو الجوانب التي تحتاج دعماً مشتركاً (دون لوم أو إحباط).
3. ما تقدمه المدرسة من استجابات ودعم للطالب.
4. 3 خطوات عملية بسيطة وواضحة للتعاون اليومي في البيت حتى المحطة القادمة.`
      : `بيانات الطالب التربوية والاجتماعية وتطور علاماته في المحطات (بدون رقم هوية):
${studentProfileSummary}

المطلوب: بناء خطة تدخل فردية عملية ومتكاملة (תוכנית התערבות אישית) تشمل:
1. كيف نستثمر نقاط القوة لدى الطالب كمدخل للتحفيز وبناء الثقة بالنفس.
2. أهداف تعليمية قابلة للقياس في المهارات الضعيفة (هدف محدد للمحطة القادمة).
3. استجابات مقترحة داخل الصف وفي الساعات الفردية (שעות פרטניות / שילוב).
4. دعم اجتماعي وعاطفي ومواظبة (إن لزم) وتقسيم الأدوار بين المربي، معلم الموضوع، والمستشارة.`;

  const aiResult = await callPedagogicalLlm({ systemPrompt, userPrompt });
  if (aiResult) return aiResult;

  if (mode === 'parent_brief') {
    return langMode === 'he'
      ? `🤝 נקודות מפתח לשיחת הורים בונה ומעצימה\n\n${studentProfileSummary}\n\n1. פתיחה חיובית והעצמה: הדגשת נקודות החוזק והמאמץ של התלמיד/ה בכיתה.\n2. מוקדי חיזוק: הצגת המיומנויות הדורשות תרגול הדרגתי לקראת תחנת ההערכה הבאה.\n3. שותפות בית-ספר והורים: קריאה יומית משותפת של 15 דקות, מעקב שיעורי בית וחיזוק חיובי על התקדמות.`
      : `🤝 دليل محادثة تربوية بنّاءة مع ولي الأمر\n\n${studentProfileSummary}\n\n1. الانطلاق من نقاط القوة: الإشادة بجوانب التميز لدى الطالب لتعزيز دافعيته وثقته بنفسه.\n2. مجالات التعزيز: عرض المهارات التي تحتاج متابعة هادئة ومتدرجة قبل المحطة القادمة.\n3. شراكة البيت والمدرسة: تخصيص 15 دقيقة يومية للمراجعة القرائية/الحسابية، تشجيع المواظبة، والتواصل المستمر مع مربي الصف.`;
  }

  return langMode === 'he'
    ? `🎯 תוכנית התערבות אישית מומלצת (תח"י)\n\n${studentProfileSummary}\n\n1. מנוף חוזקות: שילוב תחומי החוזק של התלמיד/ה במשימות כיתתיות להעלאת תחושת המסוגלות.\n2. יעד לימודי מדיד: שיפור של 10–15 נקודות במיומנויות המזוהות כנמוכות עד לתחנה הבאה באמצעות 2 שעות פרטניות בשבוע.\n3. מעטפת רגשית-חברתית: שיחת העצמה קבועה עם המחנך/ת ומעקב דו-שבועי ביומן ההחלטות.`
    : `🎯 خطة تدخل فردية مقترحة (תוכנית התערבות אישית)\n\n${studentProfileSummary}\n\n1. استثمار نقاط القوة: توظيف مهارات الطالب الإيجابية لمنحه دوراً فاعلاً يرفع دافعيته وثقته داخل الصف.\n2. الهدف التعليمي القابل للقياس: رفع التمكن بـ 10–15 درجة في المهارات المتراجعة حتى المحطة القادمة عبر حصص فردية مركزة.\n3. المتابعة العاطفية والاجتماعية: مرافقة تشجيعية أسبوعية من مربي الصف وتقييم التقدم بعد 3 أسابيع.`;
};
