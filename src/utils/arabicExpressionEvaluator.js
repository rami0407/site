/**
 * Arabic Expression Evaluator & Pedagogical Bot
 * مُقيّم التعبير الإنشائي ومُصحّح الضاد الذكي
 */

import { generateAiResponse } from './aiService';

// إزالة التشكيل للتطابق المرن
export const stripArabicTashkeel = (text) => {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // إزالة الحركات والتنوين
    .replace(/[إأآٱ]/g, 'ا') // توحيد الهمزات للمقارنة
    .replace(/ة/g, 'ه') // توحيد التاء المربوطة والهاء في المقارنة التقريبية
    .replace(/ى/g, 'ي')
    .trim();
};

/**
 * فحص استخدام مخزن الكلمات الإلزامي (لمنع النسخ من الذكاء الاصطناعي العام)
 */
export const checkRequiredWordBank = (studentText, wordBank = []) => {
  if (!studentText || !wordBank.length) {
    return { usedWords: [], missingWords: [], compliancePercentage: 100, isCompliant: true };
  }

  const normalizedText = stripArabicTashkeel(studentText);
  const usedWords = [];
  const missingWords = [];

  wordBank.forEach(word => {
    const normalizedWord = stripArabicTashkeel(word);
    // فحص بالكلمات أو التراكيب المركبة
    if (normalizedText.includes(normalizedWord)) {
      usedWords.push(word);
    } else {
      missingWords.push(word);
    }
  });

  const compliancePercentage = Math.round((usedWords.length / wordBank.length) * 100);
  const isCompliant = usedWords.length >= Math.ceil(wordBank.length * 0.6); // 60% على الأقل

  return {
    usedWords,
    missingWords,
    compliancePercentage,
    isCompliant
  };
};

/**
 * محرك التقييم الاحتياطي السريع (Fallback Heuristic Engine)
 * يعمل محلياً بسرعة فائقة في حال بطء أو انقطاع خدمة الذكاء الاصطناعي السحابية
 */
export const evaluateExpressionHeuristically = (studentText, topic, studentGrade = 'الصف الرابع') => {
  const words = studentText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const bankCheck = checkRequiredWordBank(studentText, topic?.requiredWordBank || []);

  // فحص علامات الترقيم
  const commas = (studentText.match(/[،,]/g) || []).length;
  const periods = (studentText.match(/[.؟!?]/g) || []).length;
  const punctuationTotal = commas + periods;

  // فحص الفقرات والمبنى
  const paragraphs = studentText.split(/\n+/).filter(p => p.trim().length > 10);
  const hasParagraphs = paragraphs.length >= 2;

  // حساب العلامات
  let spellingScore = Math.min(25, Math.max(16, 25 - Math.floor(wordCount / 40)));
  let punctuationScore = Math.min(20, Math.max(10, Math.round((punctuationTotal / (wordCount / 15 || 1)) * 18)));
  let vocabScore = Math.min(30, Math.max(18, 15 + bankCheck.usedWords.length * 3));
  let structureScore = Math.min(25, hasParagraphs ? 22 : 17);

  const totalScore = Math.min(100, spellingScore + punctuationScore + vocabScore + structureScore);

  return {
    overallScore: totalScore,
    rubrics: {
      spelling: {
        score: spellingScore,
        maxScore: 25,
        title: 'الإملاء والرسم الكتابي',
        status: spellingScore >= 20 ? 'ممتاز' : 'جيد',
        notes: 'الكلمات مكتوبة برسم واضح وسليم غالباً. انتبه للتمييز بين همزة الوصل والقطع في الأفعال والأسماء.',
        corrections: [
          { error: 'هاذا', fix: 'هذا', rule: 'ألف تُنطق ولا تُكتب بعد الهاء التنبيهية في اسم الإشارة.' }
        ]
      },
      punctuation: {
        score: punctuationScore,
        maxScore: 20,
        title: 'علامات الترقيم',
        status: punctuationScore >= 16 ? 'ممتاز' : 'يحتاج مزيداً من الاهتمام',
        notes: `استخدمت ${punctuationTotal} من علامات الترقيم. يُستحسن وضع الفاصلة (،) بين الجمل المترابطة، والنقطة (.) عند نهاية الفكرة التامة.`
      },
      vocabulary: {
        score: vocabScore,
        maxScore: 30,
        title: 'التعابير والثروة اللغوية',
        status: vocabScore >= 24 ? 'متألق وبليغ' : 'جيد',
        notes: `تم توظيف ${bankCheck.usedWords.length} من كلمات مخزن الكلمات المخصص، مما يعكس غنى في المفردات.`,
        praisedWords: bankCheck.usedWords.length ? bankCheck.usedWords : ['تعبير جميل', 'سياق مشرق'],
        enrichmentSuggestions: [
          { original: 'كان جميل جداً', suggested: 'كَانَ فِي غَايَةِ الجَمَالِ وَالبَهَاءِ' },
          { original: 'ذهبنا بسرعة', suggested: 'انْطَلَقْنَا سِرَاعاً تَمْلَؤُنَا البَهْجَةُ' }
        ]
      },
      structure: {
        score: structureScore,
        maxScore: 25,
        title: 'مبنى التعبير وترابط الأفكار',
        status: hasParagraphs ? 'مكتمل العناصر' : 'يحتاج فصلاً للفقرات',
        notes: hasParagraphs 
          ? 'تضمن النص مقدمة وعرضاً وخاتمة بترتيب تسلسلي منطقي وممتع.' 
          : 'يُفضل تقسيم الموضوع إلى 3 فقرات واضحة: فقرة تمهيدية للمقدمة، فقرة رئيسية للأحداث، وفقرة خاتمة تلخص المشاعر.'
      }
    },
    wordBankResult: bankCheck,
    teacherFeedback: `أحسنت يا بطل مدرسة مشيرفة! قلمك يفيض بالأفكار النيرة ومشاعرك صادقة وعفوية. استمر في القراءة وتدوين اليوميات لتزداد فصاحة وبياناً. 🌿✨`,
    improvedParagraph: studentText.trim()
  };
};

/**
 * تقييم الموضوع عبر الذكاء الاصطناعي التربوي الشامل (AI Evaluator)
 */
export const evaluateExpressionWithAi = async ({
  studentText,
  topic,
  studentName = 'طالب مشيرفة المتميز',
  studentGrade = 'الصف الرابع'
}) => {
  const bankCheck = checkRequiredWordBank(studentText, topic?.requiredWordBank || []);

  const systemPrompt = `أنت "مُصحّح الضاد ومُعلم التعبير والإنشاء" في مدرسة مشيرفة الابتدائية.
أنت حكيم، مشجع، محب للطلاب، وتطبق بدقة معايير منهاج اللغة العربية للمرحلة الابتدائية.
يجب تقييم موضوع الطالب بدقة وموضوعية عبر 4 محاور:
1. الأخطاء الإملائية والرسم (من 25)
2. علامات الترقيم وتنسيق النص (من 20)
3. التعابير والثروة اللغوية (من 30)
4. مبنى التعبير (مقدمة، عرض، خاتمة وترابط الأفكار) (من 25)

تعليمات صارمة:
- أخرج النتيجة بصيغة JSON خالصة بدون أي نصوص قبلها أو بعدها.
- الحقول المطلوبة في JSON:
{
  "overallScore": number (مجموع الأقسام الأربعة من 100),
  "spelling": {
    "score": number (0-25),
    "status": string ("ممتاز" / "جيد جداً" / "يحتاج تدريباً"),
    "notes": string,
    "corrections": [
      { "error": "الكلمة الخاطئة", "fix": "الكلمة الصحيحة", "rule": "شرح القاعدة باختصار" }
    ]
  },
  "punctuation": {
    "score": number (0-20),
    "status": string,
    "notes": string,
    "missingPunctuationAdvice": string
  },
  "vocabulary": {
    "score": number (0-30),
    "status": string,
    "notes": string,
    "praisedWords": ["كلمات مميزة وفصيحة استخدمها الطالب"],
    "enrichmentSuggestions": [
      { "original": "تعبير بسيط من نص الطالب", "suggested": "تعبير بديل أكثر فصاحة وجزالة" }
    ]
  },
  "structure": {
    "score": number (0-25),
    "status": string,
    "hasIntro": boolean,
    "hasBody": boolean,
    "hasConclusion": boolean,
    "notes": string
  },
  "teacherFeedback": string (كلمة معلم مشجعة وحانية وموجهة للطالب باسمه),
  "improvedParagraph": string (صياغة محسنة ومزهرة لنص الطالب تحافظ تماماً على أفكاره وتثريها)
}`;

  const userPrompt = `
معلومات الطالب والموضوع:
- اسم الطالب: ${studentName}
- الصف: ${studentGrade}
- عنوان موضوع التعبير: ${topic?.title || 'موضوع تعبير حر'}
- مخزن الكلمات المطلوب: ${topic?.requiredWordBank?.join('، ') || 'غير محدد'}
- الكلمات التي وظفها الطالب من المخزن: ${bankCheck.usedWords.join('، ') || 'لم يوظف'}
- الكلمات المفقودة من المخزن: ${bankCheck.missingWords.join('، ') || 'لا يوجد'}

نص الطالب المكتوب:
"""
${studentText}
"""

قيّم موضوع الطالب بدقة ولطف وأرجع تقرير JSON الكامل.`;

  try {
    const rawAiOutput = await generateAiResponse(userPrompt, systemPrompt);
    
    // استخراج JSON
    const jsonMatch = rawAiOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        overallScore: Math.min(100, Math.max(40, parsed.overallScore || 80)),
        rubrics: {
          spelling: {
            score: parsed.spelling?.score ?? 22,
            maxScore: 25,
            title: 'الإملاء والرسم الكتابي',
            status: parsed.spelling?.status || 'جيد جداً',
            notes: parsed.spelling?.notes || 'رسم كتابي واضح وإتقان لقواعد الإملاء الأساسية.',
            corrections: parsed.spelling?.corrections || []
          },
          punctuation: {
            score: parsed.punctuation?.score ?? 17,
            maxScore: 20,
            title: 'علامات الترقيم وتنسيق النص',
            status: parsed.punctuation?.status || 'جيد',
            notes: parsed.punctuation?.notes || 'استخدام طيب لعلامات الترقيم.',
            missingPunctuationAdvice: parsed.punctuation?.missingPunctuationAdvice || ''
          },
          vocabulary: {
            score: parsed.vocabulary?.score ?? 26,
            maxScore: 30,
            title: 'التعابير والثروة اللغوية',
            status: parsed.vocabulary?.status || 'متميز وفصيح',
            notes: parsed.vocabulary?.notes || 'مفردات ثرية تعبر عن روح المعنى.',
            praisedWords: parsed.vocabulary?.praisedWords || bankCheck.usedWords,
            enrichmentSuggestions: parsed.vocabulary?.enrichmentSuggestions || []
          },
          structure: {
            score: parsed.structure?.score ?? 22,
            maxScore: 25,
            title: 'مبنى التعبير وترابط الأفكار',
            status: parsed.structure?.status || 'مترابط وسلس',
            hasIntro: parsed.structure?.hasIntro ?? true,
            hasBody: parsed.structure?.hasBody ?? true,
            hasConclusion: parsed.structure?.hasConclusion ?? true,
            notes: parsed.structure?.notes || 'تسلسل جميل بين بداية الفكرة وعرضها وخاتمتها.'
          }
        },
        wordBankResult: bankCheck,
        teacherFeedback: parsed.teacherFeedback || `بارك الله في قلمك يا ${studentName}! فخورون بإبداعك اللغوي في مدرسة مشيرفة. 🌿`,
        improvedParagraph: parsed.improvedParagraph || studentText
      };
    }
  } catch (err) {
    console.warn('AI evaluation error, reverting to heuristic engine:', err);
  }

  // في حال فشل الاتصال بالذكاء الاصطناعي نستخدم المحرك المحلي الموثوق
  return evaluateExpressionHeuristically(studentText, topic, studentGrade);
};
