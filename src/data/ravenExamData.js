// Raven's Standard Progressive Matrices (SPM - 60 Questions)
// Extracted and verified 100% against Raven_Test_Arabic_60Q.pdf

export const RAVEN_ANSWER_KEY = [
  // Set 1 (A1 - A12): 6 options each
  4, 5, 1, 2, 6, 3, 6, 2, 1, 3, 5, 4,
  // Set 2 (B1 - B12): 6 options each
  2, 6, 1, 2, 1, 3, 5, 6, 4, 3, 4, 5,
  // Set 3 (C1 - C12): 8 options each
  8, 2, 3, 8, 7, 4, 5, 1, 7, 6, 1, 2,
  // Set 4 (D1 - D12): 8 options each
  3, 4, 3, 7, 8, 6, 5, 4, 1, 2, 5, 6,
  // Set 5 (E1 - E12): 8 options each
  7, 6, 8, 2, 1, 5, 2, 4, 1, 6, 3, 5,
];

export const RAVEN_SETS = [
  { setNumber: 1, code: 'A', name: 'المجموعة 1', subtitle: 'الأنماط البصرية والإكمال المباشر', start: 1, end: 12 },
  { setNumber: 2, code: 'B', name: 'المجموعة 2', subtitle: 'التماثل والعلاقات الثنائية', start: 13, end: 24 },
  { setNumber: 3, code: 'C', name: 'المجموعة 3', subtitle: 'التدرج والتغير المتتابع', start: 25, end: 36 },
  { setNumber: 4, code: 'D', name: 'المجموعة 4', subtitle: 'التوزيع المنطقي في المصفوفة', start: 37, end: 48 },
  { setNumber: 5, code: 'E', name: 'المجموعة 5', subtitle: 'التركيب والتحليل التجريدي', start: 49, end: 60 },
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

export function formatTimeMMSS(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
