// Raven's Standard Progressive Matrices (SPM - 60 Questions)
// Synced 100% with the school's official Arabic 60Q Answer Key PDF

export const RAVEN_ANSWER_KEY = [
  // أ (1 - 12): 6 options each
  4, 5, 1, 2, 6, 3, 6, 2, 1, 3, 4, 4,
  // ب (13 - 24): 6 options each
  2, 6, 1, 4, 1, 3, 5, 6, 4, 3, 4, 5,
  // ج (25 - 36): 8 options each
  8, 2, 3, 8, 7, 4, 5, 1, 7, 6, 1, 2,
  // د (37 - 48): 8 options each
  3, 4, 3, 7, 8, 6, 5, 4, 1, 2, 5, 6,
  // هـ (49 - 60): 8 options each
  7, 6, 8, 2, 1, 5, 2, 4, 1, 6, 3, 5,
];

export const RAVEN_SETS = [
  { setNumber: 1, code: 'أ', name: 'المجموعة أ', subtitle: 'الإدراك البصري والأنماط المباشرة', start: 1, end: 12 },
  { setNumber: 2, code: 'ب', name: 'المجموعة ب', subtitle: 'التماثل والعلاقات المكانية', start: 13, end: 24 },
  { setNumber: 3, code: 'ج', name: 'المجموعة ج', subtitle: 'التدرج والتسلسل المنطقي', start: 25, end: 36 },
  { setNumber: 4, code: 'د', name: 'المجموعة د', subtitle: 'التوزيع المنطقي وربط المتغيرات', start: 37, end: 48 },
  { setNumber: 5, code: 'هـ', name: 'المجموعة هـ', subtitle: 'التفكير التجريدي والتحليل المركّب', start: 49, end: 60 },
];

export const RAVEN_QUESTIONS = RAVEN_ANSWER_KEY.map((correctOption, idx) => {
  const id = idx + 1;
  const qStr = String(id).padStart(2, '0');
  const setNumber = Math.floor(idx / 12) + 1;
  const setInfo = RAVEN_SETS[setNumber - 1];
  const optionsCount = id <= 24 ? 6 : 8;
  const optionImages = Array.from({ length: optionsCount }, (_, optIdx) => ({
    optionNumber: optIdx + 1,
    src: `/raven-exam/q${qStr}/opt${optIdx + 1}.webp`,
  }));

  return {
    id,
    qStr,
    setNumber,
    setCode: setInfo.code,
    setName: setInfo.name,
    setSubtitle: setInfo.subtitle,
    optionsCount,
    correctOption,
    matrixImage: `/raven-exam/q${qStr}/matrix.webp`,
    optionImages,
  };
});

export const DEFAULT_RAVEN_CONFIG = {
  durationMinutes: 45,
  showScoreToStudent: true,
  isExamOpen: true,
  accessCode: '',
  teacherPin: '2026',
  examTitle: 'اختبار المصفوفات المتتابعة (رافن)',
};

export function calculateRavenScore(answersMap = {}) {
  let totalScore = 0;
  let answeredCount = 0;
  const setScores = RAVEN_SETS.map((s) => ({
    setNumber: s.setNumber,
    code: s.code,
    name: s.name,
    subtitle: s.subtitle,
    correct: 0,
    total: 12,
  }));

  RAVEN_QUESTIONS.forEach((q) => {
    const chosen = answersMap[q.id] ?? answersMap[String(q.id)];
    if (chosen !== undefined && chosen !== null) {
      answeredCount += 1;
      if (Number(chosen) === q.correctOption) {
        totalScore += 1;
        setScores[q.setNumber - 1].correct += 1;
      }
    }
  });

  const totalQuestions = RAVEN_QUESTIONS.length;
  const percentage = Math.round((totalScore / totalQuestions) * 100);

  let level = 'متوسط';
  let levelColor = '#2563eb';
  let levelBg = '#eff6ff';

  if (percentage >= 85) {
    level = 'متميز جداً (قدرة فائقة)';
    levelColor = '#059669';
    levelBg = '#ecfdf5';
  } else if (percentage >= 70) {
    level = 'فوق المتوسط (جيد جداً)';
    levelColor = '#0d9488';
    levelBg = '#f0fdfa';
  } else if (percentage >= 50) {
    level = 'متوسط';
    levelColor = '#2563eb';
    levelBg = '#eff6ff';
  } else if (percentage >= 35) {
    level = 'دون المتوسط';
    levelColor = '#d97706';
    levelBg = '#fffbeb';
  } else {
    level = 'يحتاج دعم ومتابعة';
    levelColor = '#dc2626';
    levelBg = '#fef2f2';
  }

  return {
    totalScore,
    totalQuestions,
    answeredCount,
    percentage,
    setScores,
    level,
    levelColor,
    levelBg,
  };
}

/**
 * Builds a rich educational cognitive & thinking-style personality analysis
 * based on overall score, 5-set profile (أ..هـ), and response pacing.
 */
export function buildRavenPersonalityAnalysis(calc, elapsedSeconds = 0) {
  const { totalScore, percentage, setScores = [], answeredCount = 0 } = calc;
  const sA = setScores[0]?.correct ?? 0;
  const sB = setScores[1]?.correct ?? 0;
  const sC = setScores[2]?.correct ?? 0;
  const sD = setScores[3]?.correct ?? 0;
  const sE = setScores[4]?.correct ?? 0;

  const avgSecPerQ = answeredCount > 0 ? Math.round(elapsedSeconds / answeredCount) : 0;

  // 1. Thinking Personality Archetype
  let archetypeTitle = '';
  let archetypeIcon = '🧠';
  let archetypeColor = '#1e3a8a';
  let archetypeSummary = '';

  if (percentage >= 85) {
    archetypeTitle = 'المفكّر التحليلي المبدع';
    archetypeIcon = '🌟';
    archetypeColor = '#059669';
    archetypeSummary =
      'يمتلك شخصية ذهنية استثنائية تجمع بين سرعة الملاحظة البصرية والقدرة العالية على التجريد وحل المشكلات المعقّدة. يستطيع اكتشاف القواعد الخفية والربط بين عدة متغيرات في آنٍ واحد بثقة واستقلالية.';
  } else if (percentage >= 70) {
    if (sD + sE >= 16) {
      archetypeTitle = 'المحلّل المنطقي المتقدّم';
      archetypeIcon = '🔷';
      archetypeColor = '#0d9488';
      archetypeSummary =
        'يتميّز بعقلية تحليلية منظّمة وقدرة لافتة على التفكير التجريدي والاستنتاجي. ينجح في تفكيك الأنماط المركّبة والوصول إلى الحلول المنطقية بثبات.';
    } else {
      archetypeTitle = 'المستكشف البصري الدقيق';
      archetypeIcon = '🧭';
      archetypeColor = '#0284c7';
      archetypeSummary =
        'يتمتع بإدراك بصري قوي وحس عالٍ بالتماثل والتدرج المنطقي. يتقن اكتشاف العلاقات الواضحة والمتدرجة، ومع مزيد من التدريب على المسائل التجريدية سيحقق قفزات نوعية رائعة.';
    }
  } else if (percentage >= 50) {
    archetypeTitle = 'المتعلّم المتّزن والمتدرّج';
    archetypeIcon = '⚖️';
    archetypeColor = '#2563eb';
    archetypeSummary =
      'يُظهر توازناً جيداً في فهم الأنماط البصرية والعلاقات المنطقية الأساسية والمتوسطة. يتفاعل بإيجابية مع التحديات الواضحة، ويستفيد كثيراً من استراتيجيات تقسيم المشكلة إلى خطوات صغيرة.';
  } else if (percentage >= 35) {
    archetypeTitle = 'الملاحظ العملي الطموح';
    archetypeIcon = '🌱';
    archetypeColor = '#d97706';
    archetypeSummary =
      'يميل إلى التعامل المباشر والعملي مع الأشكال البصرية الواضحة، بينما قد يجد صعوبة في الأنماط متعددة القواعد. يتمتع بقابلية عالية للتطور عند توجيهه للتفكير خطوة بخطوة.';
  } else {
    archetypeTitle = 'المستكشف البادئ (يحتاج مرافقة تربوية)';
    archetypeIcon = '💡';
    archetypeColor = '#dc2626';
    archetypeSummary =
      'يحتاج إلى بيئة هادئة ومرافقة تربوية منظّمة لتعزيز مهارات الملاحظة البصرية والمقارنة التدريجية. قد يكون التسرّع أو التوتر قد أثّر على التركيز، ويُنصح بإتاحة أنشطة بصرية ممتعة وبسيطة لبناء الثقة.';
  }

  // 2. Pacing & Work-Style Personality
  let pacingLabel = 'متّزن ومنظّم';
  let pacingNote = 'وزّع وقته بشكل متوازن وهادئ بين الأسئلة.';
  if (avgSecPerQ > 0 && avgSecPerQ < 12) {
    if (percentage >= 70) {
      pacingLabel = 'سريع البديهة وحاسم';
      pacingNote = `متوسط ${avgSecPerQ} ثوانٍ للسؤال مع دقة عالية، مما يعكس سرعة معالجة بصرية لافتة.`;
    } else {
      pacingLabel = 'سريع ومتعجّل نسبياً';
      pacingNote = `متوسط ${avgSecPerQ} ثوانٍ للسؤال؛ يُنصح بالتأني ومراجعة النمط في الصف والعمود قبل اختيار البديل.`;
    }
  } else if (avgSecPerQ >= 12 && avgSecPerQ <= 35) {
    pacingLabel = 'متّزن ومنظّم';
    pacingNote = `متوسط ${avgSecPerQ} ثانية للسؤال؛ يوازن بين السرعة والتفكير الهادئ قبل اتخاذ القرار.`;
  } else if (avgSecPerQ > 35) {
    pacingLabel = 'متأمّل ودقيق';
    pacingNote = `متوسط ${avgSecPerQ} ثانية للسؤال؛ يفضّل التأني العميق والتأكد قبل اختيار الإجابة.`;
  }

  // 3. Dynamic Strengths based on highest sets
  const strengthDescriptions = {
    1: 'الإدراك البصري السريع والانتباه للتفاصيل الدقيقة وإكمال الأنماط (المجموعة أ).',
    2: 'إدراك التماثل والعلاقات المكانية والمقارنة بين الأشكال المتقابلة (المجموعة ب).',
    3: 'اكتشاف التسلسل والتدرّج المنطقي وتتبّع التغيّر التدريجي (المجموعة ج).',
    4: 'التفكير المنطقي المنظّم والقدرة على ربط عدة قواعد معاً في المصفوفة (المجموعة د).',
    5: 'التفكير التجريدي العالي وتحليل الأشكال المركّبة ودمج العناصر (المجموعة هـ).',
  };

  const sortedSetsDesc = [...setScores].sort((a, b) => b.correct - a.correct);
  const strengths = [];
  sortedSetsDesc.slice(0, 2).forEach((st) => {
    if (st.correct >= 6) {
      strengths.push(strengthDescriptions[st.setNumber]);
    }
  });
  if (strengths.length === 0) {
    strengths.push('الاستعداد للمحاولة والمثابرة حتى إنهاء الاختبار، وهي خطوة أساسية لتطوير مهارات التفكير.');
  }

  // 4. Growth Areas & Recommendations
  const sortedSetsAsc = [...setScores].sort((a, b) => a.correct - b.correct);
  const growthAreas = [];
  sortedSetsAsc.slice(0, 2).forEach((st) => {
    if (st.correct < 9) {
      growthAreas.push(`${st.name} (${st.subtitle}) — حقق ${st.correct} من 12.`);
    }
  });

  const recommendations = [];
  if (percentage >= 85) {
    recommendations.push('توجيه الطالب إلى برامج الإثراء والتميز، وألعاب الشطرنج والألغاز المنطقية والبرمجة الإبداعية.');
    recommendations.push('إشراكه في تحديات بحثية ورياضية مفتوحة لتنمية الإبداع والقيادة الفكرية.');
  } else if (percentage >= 70) {
    recommendations.push('تعزيز مهارات التفكير التجريدي عبر ألغاز المصفوفات، السودوكو، ومسائل التفكير متعدد الخطوات.');
    recommendations.push('تشجيعه على شرح طريقة تفكيره شفهياً لترسيخ استراتيجيات الاستنتاج المنطقي.');
  } else if (percentage >= 50) {
    recommendations.push('التدرب على تحليل السؤال إلى قاعدتين منفصلتين (صفّاً ثم عموداً) قبل النظر إلى البدائل.');
    recommendations.push('ممارسة ألعاب الذاكرة البصرية والأنماط الهندسية لمدة 10 دقائق أسبوعياً.');
  } else {
    recommendations.push('تقديم أنشطة بصرية متدرجة وبسيطة (تطابق الأشكال، إكمال الأنماط، التماثل) في بيئة مشجعة.');
    recommendations.push('تدريب الطالب على التأني ومقارنة كل بديل بالمصفوفة قبل الاختيار لتقليل التخمين.');
  }

  if (avgSecPerQ > 0 && avgSecPerQ < 12 && percentage < 70) {
    recommendations.push('التركيز على مهارة ضبط الإيقاع والتأني: أخذ 15–20 ثانية لتفحّص النمط سيرفع العلامة بشكل ملحوظ.');
  }

  // 5. Consistency insight (Foundational أ+ب vs Abstract د+هـ)
  const foundationalPct = Math.round(((sA + sB) / 24) * 100);
  const abstractPct = Math.round(((sD + sE) / 24) * 100);
  let profileBalance = 'أداء متناغم بين المهارات البصرية الأساسية والتفكير التجريدي المتقدم.';
  if (foundationalPct - abstractPct >= 25) {
    profileBalance =
      'قوة واضحة في المهارات البصرية والتماثل (أ–ب)، مع فرصة كبيرة لتطوير التفكير التجريدي المركّب (د–هـ).';
  } else if (abstractPct - foundationalPct >= 15) {
    profileBalance =
      'قدرة عالية على التفكير التجريدي المعقّد (د–هـ)؛ بعض الأخطاء في البداية قد تكون بسبب التسرّع في الأسئلة السهلة.';
  }

  return {
    archetypeTitle,
    archetypeIcon,
    archetypeColor,
    archetypeSummary,
    pacingLabel,
    pacingNote,
    avgSecPerQ,
    foundationalPct,
    abstractPct,
    profileBalance,
    strengths,
    growthAreas,
    recommendations,
    totalScore,
    percentage,
  };
}

export function formatTimeMMSS(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
