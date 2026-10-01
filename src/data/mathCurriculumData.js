/**
 * منهاج الرياضيات لمدرسة مشيرفة الابتدائية
 * متوافق مع منهاج وزارة التربية والتعليم في دولة إسرائيل للمرحلة الابتدائية (الوسط العربي)
 * الصفوف: من الأول وحتى السادس + بطولة جدول الضرب الكبرى
 */

// قائمة الصفوف المعتمدة
export const MATH_GRADES = [
  {
    id: 'grade_1',
    level: 1,
    name: 'الصف الأول',
    title: 'مستكشفو الأرقام الصغار',
    icon: '🐣',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    description: 'الأعداد حتى 20 وحتى 100، الجمع والطرح البسيط، المقارنة، وسلاسل الأعداد والأشكال.',
    topics: [
      { id: 'g1_addition_20', title: 'الجمع حتى 20', icon: '➕' },
      { id: 'g1_subtraction_20', title: 'الطرح حتى 20', icon: '➖' },
      { id: 'g1_compare', title: 'المقارنة وميزان الأعداد (< , > , =)', icon: '⚖️' },
      { id: 'g1_sequences_100', title: 'السابق والتالي وسلاسل الأعداد حتى 100', icon: '🔢' },
      { id: 'g1_shapes', title: 'الأشكال الهندسية الأساسية', icon: '📐' }
    ]
  },
  {
    id: 'grade_2',
    level: 2,
    name: 'الصف الثاني',
    title: 'فرسان الحساب والمبنى العشري',
    icon: '🦊',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    description: 'الجمع والطرح مع تبديل حتى 100، مبنى العدد (آحاد وعشرات)، الأعداد الزوجية، ومقدمة الضرب (2، 5، 10).',
    topics: [
      { id: 'g2_add_sub_100', title: 'الجمع والطرح مع تبديل حتى 100', icon: '🧮' },
      { id: 'g2_place_value', title: 'مبنى العدد: آحاد وعشرات', icon: '🧱' },
      { id: 'g2_even_odd', title: 'الأعداد الزوجية والفردية', icon: '⚖️' },
      { id: 'g2_multi_intro', title: 'مقدمة الضرب: جداول 2 و 5 و 10 كجمع متكرر', icon: '✖️' },
      { id: 'g2_word_problems', title: 'مسائل كلامية حياتية', icon: '📖' }
    ]
  },
  {
    id: 'grade_3',
    level: 3,
    name: 'الصف الثالث',
    title: 'أبطال جدول الضرب ومحيط الأشكال',
    icon: '🦁',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    description: 'جدول الضرب كاملاً (حتى 10×10)، القسمة المترابطة، الأعداد حتى 1,000، المحيط والمساحة.',
    topics: [
      { id: 'g3_multiplication_full', title: 'جدول الضرب الشامل حتى 10×10', icon: '✖️' },
      { id: 'g3_division_basics', title: 'القسمة كعملية عكسية للضرب', icon: '➗' },
      { id: 'g3_numbers_1000', title: 'الأعداد حتى 1,000 ومبنى العدد', icon: '🏛️' },
      { id: 'g3_perimeter_area', title: 'المحيط والمساحة بوحدات مربعة', icon: '📏' },
      { id: 'g3_word_multi_step', title: 'مسائل كلامية متعددة المراحل', icon: '🎯' }
    ]
  },
  {
    id: 'grade_4',
    level: 4,
    name: 'الصف الرابع',
    title: 'رواد الكسور العادية والأعداد الكبيرة',
    icon: '🦅',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    description: 'الأعداد حتى مليون، مفهوم الكسور العادية وتوسيعها واختزالها، الزوايا وتصنيف المثلثات.',
    topics: [
      { id: 'g4_large_numbers', title: 'الأعداد حتى مليون والعمليات الحسابية', icon: '💎' },
      { id: 'g4_fractions_intro', title: 'الكسور العادية: المفهوم والتوسيع والاختزال', icon: '🍰' },
      { id: 'g4_fractions_add_sub', title: 'جمع وطرح كسور بمقامات متساوية', icon: '➕' },
      { id: 'g4_prime_divisibility', title: 'قابلية القسمة والأعداد الأولية والمضاعفات', icon: '🔍' },
      { id: 'g4_geometry_angles', title: 'الزوايا (حادة، قائمة، منفرجة) وتصنيف المثلثات', icon: '📐' }
    ]
  },
  {
    id: 'grade_5',
    level: 5,
    name: 'الصف الخامس',
    title: 'قادة الكسور العشرية والنسبة والمساحات',
    icon: '⚡',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    description: 'الكسور العشرية، جمع وطرح الكسور بمقامات مختلفة، مساحات المثلث ومتوازي الأضلاع، والنسبة.',
    topics: [
      { id: 'g5_fractions_unlike', title: 'جمع وطرح كسور بمقامات مختلفة وضربها', icon: '🍕' },
      { id: 'g5_decimals_basics', title: 'الكسور العشرية: أجزاء من 10 و 100 و 1000', icon: '🪙' },
      { id: 'g5_decimals_add_sub', title: 'جمع وطرح ومقارنة الكسور العشرية', icon: '🧮' },
      { id: 'g5_area_triangles', title: 'مساحة المثلث، المستطيل، ومتوازي الأضلاع', icon: '📐' },
      { id: 'g5_ratio_average', title: 'مفهوم النسبة، المعدل الحسابي، والمخططات البيانية', icon: '📊' }
    ]
  },
  {
    id: 'grade_6',
    level: 6,
    name: 'الصف السادس',
    title: 'علماء النسبة المئوية والأعداد الموجهة',
    icon: '👑',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    description: 'النسبة المئوية (%)، ترتيب العمليات الحسابية، الأعداد الموجهة (الموجبة والسالبة)، والحجوم.',
    topics: [
      { id: 'g6_percentages', title: 'النسبة المئوية (%) والتخفيض والزيادة', icon: '🏷️' },
      { id: 'g6_decimals_mult_div', title: 'ضرب وقسمة الكسور العشرية وقوى العشرة', icon: '✖️' },
      { id: 'g6_order_operations', title: 'ترتيب العمليات الحسابية والأقواس', icon: '🧠' },
      { id: 'g6_directed_numbers', title: 'الأعداد الموجهة (الموجبة والسالبة) على خط الأعداد', icon: '❄️' },
      { id: 'g6_volume_capacity', title: 'الحجوم: حجم الصندوق والمكعب وسعة السوائل', icon: '📦' }
    ]
  }
];

// بطولة جدول الضرب الكبرى المستقلة
export const MULTIPLICATION_TOURNAMENT = {
  id: 'multiplication_championship',
  title: 'بطولة جدول الضرب الكبرى ⚡🏆',
  subtitle: 'الماراثون الملكي لجداول الضرب من 1 وحتى 10 و 12 - تحدي السرعة وحصد الكؤوس',
  icon: '⚡',
  color: '#eab308',
  tables: [
    { num: 1, label: 'جدول 1', tip: 'محايد الضرب: أي عدد ضرب 1 يبقى كما هو' },
    { num: 2, label: 'جدول 2', tip: 'مضاعفة العدد مرتين (أعداد زوجية)' },
    { num: 3, label: 'جدول 3', tip: 'مضاعفة الثلاثات (مجموع أرقام الناتج من مضاعفات 3)' },
    { num: 4, label: 'جدول 4', tip: 'مضاعفة العدد مرتين ثم مرتين (ضعف الضعف)' },
    { num: 5, label: 'جدول 5', tip: 'رقم آحاده دائماً إما 0 أو 5' },
    { num: 6, label: 'جدول 6', tip: 'ضعف نواتج جدول 3' },
    { num: 7, label: 'جدول 7', tip: 'جدول التحدي الذهني الرائع' },
    { num: 8, label: 'جدول 8', tip: 'ضعف جدول 4 (مضاعفة ثلاث مرات)' },
    { num: 9, label: 'جدول 9', tip: 'مجموع أرقام نواتجه دائماً يساوي 9 (18، 27، 36...)' },
    { num: 10, label: 'جدول 10', tip: 'إضافة صفر على يمين العدد' },
    { num: 11, label: 'جدول 11', tip: 'تكرار الرقم للأعداد من 1 إلى 9' },
    { num: 12, label: 'جدول 12', tip: 'جدول العباقرة للمتميزين' },
    { num: 'all', label: 'خلطة الجداول الشاملة 🌪️', tip: 'مسائل مختلطة عشوائية من جميع الجداول' }
  ],
  modes: [
    {
      id: 'speed_race',
      name: 'سباق التوقيت (Speed Race)',
      icon: '⏱️',
      duration: 60, // ثانية
      bonusPerCorrect: 2, // إضافة ثانيتين
      penaltyPerWrong: 3, // خصم 3 ثوانٍ
      description: 'حل أكبر عدد ممكن من المسائل خلال 60 ثانية! كل إجابة صحيحة تزيد وقتك بنقاط إضافية.'
    },
    {
      id: 'cups_quest',
      name: 'ماراثون الكؤوس (10 مستويات)',
      icon: '🏆',
      duration: 90,
      description: '10 مستويات متصاعدة الصعوبة. تجاوز كل مرحلة لفتح كأس جديد وصولاً للكأس الألماسي.'
    },
    {
      id: 'streak_master',
      name: 'مبارزة الدقة (بدون خطأ)',
      icon: '🎯',
      duration: 0, // لا يوجد وقت محدد، تنتهي عند الخطأ
      description: 'كم مسألة متتالية تستطيع حلها دون ارتكاب أي خطأ؟ مضاعف النقاط Combo يرتفع مع كل إجابة!'
    },
    {
      id: 'missing_factor',
      name: 'لغز العامل المفقود (___ × 8 = 56)',
      icon: '🧩',
      duration: 75,
      description: 'اكتشف العدد المفقود في جملة الضرب أو القسمة المرتبطة بها!'
    }
  ]
};

// الأوسمة والكؤوس التقديرية للبطولة
export const CHAMPIONSHIP_AWARDS = [
  {
    id: 'cup_bronze',
    type: 'trophy',
    tier: 'bronze',
    name: 'كأس البرونز للمستكشفين',
    icon: '🥉',
    color: '#cd7f32',
    minScore: 100,
    minQuestions: 10,
    description: 'أحرز أكثر من 100 نقطة وحل 10 مسائل صحيحة'
  },
  {
    id: 'cup_silver',
    type: 'trophy',
    tier: 'silver',
    name: 'كأس الفضة للمجتهدين',
    icon: '🥈',
    color: '#94a3b8',
    minScore: 300,
    minQuestions: 25,
    description: 'أحرز أكثر من 300 نقطة وحل 25 مسألة صحيحة'
  },
  {
    id: 'cup_gold',
    type: 'trophy',
    tier: 'gold',
    name: 'كأس الذهب للفرسان',
    icon: '🥇',
    color: '#eab308',
    minScore: 600,
    minQuestions: 45,
    description: 'أحرز أكثر من 600 نقطة وتألق في سباق المسابقة'
  },
  {
    id: 'cup_diamond',
    type: 'trophy',
    tier: 'diamond',
    name: 'كأس البطولة الألماسي الملكي',
    icon: '💎',
    color: '#38bdf8',
    minScore: 1000,
    minQuestions: 70,
    description: 'تجاوز 1000 نقطة وأصبح أسطورة الرياضيات لمدرسة مشيرفة'
  },
  {
    id: 'badge_speed',
    type: 'badge',
    tier: 'lightning',
    name: 'وسام البرق السريع',
    icon: '⚡',
    color: '#f59e0b',
    condition: 'حل 15 مسألة في أقل من دقيقة',
    description: 'سرعة فائقة ودقة استثنائية'
  },
  {
    id: 'badge_streak',
    type: 'badge',
    tier: 'streak',
    name: 'تاج الإتقان المتواصل (Combo 10x)',
    icon: '👑',
    color: '#a855f7',
    condition: 'سلسلة 10 إجابات صحيحة متتالية دون خطأ',
    description: 'تركيز فولاذي دون أي هفوة'
  },
  {
    id: 'badge_curriculum',
    type: 'badge',
    tier: 'scholar',
    name: 'وسام عبقري المنهاج المدرسي',
    icon: '🎓',
    color: '#10b981',
    condition: 'التفوق في أسئلة الصف والمنهاج الوزاري',
    description: 'إتقان محاور المنهاج الدراسي بامتياز'
  },
  {
    id: 'badge_detective',
    type: 'badge',
    tier: 'detective',
    name: 'وسام المحقق الرياضي الذكي 🕵️‍♂️',
    icon: '🕵️‍♂️',
    color: '#0284c7',
    minScore: 200,
    condition: 'إحراز 200 نقطة واكتشاف الأخطاء وتصحيحها',
    description: 'دقة الملاحظة وكشف المغالطات الحسابية ببراعة'
  },
  {
    id: 'cup_sherlock_math',
    type: 'cup',
    tier: 'master_detective',
    name: 'كأس شارلوك هولمز الحسابي 🏆🔍',
    icon: '🏆',
    color: '#38bdf8',
    minScore: 450,
    condition: 'إحراز 450 نقطة وحل قضايا التحقيق المتقدمة',
    description: 'الرتبة العليا في التفكير الناقد والتحقيق الرياضي'
  },
  {
    id: 'badge_real_world',
    type: 'badge',
    tier: 'merchant',
    name: 'وسام المستكشف الحياتي 🛒',
    icon: '🛒',
    color: '#10b981',
    minScore: 200,
    condition: 'إحراز 200 نقطة في حل المسائل الكلامية والواقعية',
    description: 'توظيف الرياضيات ببراعة في مواقف الحياة اليومية والشراء'
  },
  {
    id: 'cup_math_merchant',
    type: 'cup',
    tier: 'master_merchant',
    name: 'كأس عبقري الاقتصاد والحياة 🏆🪙',
    icon: '🏆',
    color: '#059669',
    minScore: 450,
    condition: 'إحراز 450 نقطة وحل المسائل الحياتية المتقدمة',
    description: 'الرتبة العليا في حل المشكلات الاقتصادية والتطبيقية'
  },
  {
    id: 'badge_pemdas_master',
    type: 'badge',
    tier: 'pemdas',
    name: 'وسام خبير ترتيب العمليات 🧠',
    icon: '🧠',
    color: '#8b5cf6',
    minScore: 200,
    condition: 'إحراز 200 نقطة في تحدي أسبقية العمليات والرمز المفقود',
    description: 'إتقان قواعد ترتيب العمليات الحسابية والأقواس باقتدار'
  },
  {
    id: 'cup_pemdas_genius',
    type: 'cup',
    tier: 'master_pemdas',
    name: 'كأس بروفيسور الحساب والترتيب 🏆⚡',
    icon: '🏆',
    color: '#a855f7',
    minScore: 450,
    condition: 'إحراز 450 نقطة وحل معادلات الأقواس والعمليات المعقدة',
    description: 'قمة الذكاء الرياضي في فك ألغاز العمليات الحسابية المتشابكة'
  }
];

// دالة مساعدة لتوليد أرقام عشوائية
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// دالة خلط المصفوفة
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// إنشاء خيارات متعددة فريدة تشمل الإجابة الصحيحة
const makeChoices = (correct, offsets = [-2, -1, 1, 2, 3, -3, 10, -10]) => {
  const set = new Set([correct]);
  const shuffledOffsets = shuffle(offsets);
  for (const off of shuffledOffsets) {
    const val = correct + off;
    if (val >= 0 && val !== correct) set.add(val);
    if (set.size >= 4) break;
  }
  while (set.size < 4) {
    const fallback = Math.max(0, correct + rand(-5, 5));
    if (fallback !== correct) set.add(fallback);
  }
  return shuffle(Array.from(set));
};

/**
 * مولّد أسئلة جدول الضرب الديناميكي (شامل ودقيق)
 */
export const generateMultiplicationQuestion = (selectedTable = 'all', mode = 'speed_race') => {
  let a, b;
  if (selectedTable === 'all') {
    a = rand(2, 10);
    b = rand(2, 10);
  } else {
    a = Number(selectedTable);
    b = rand(1, 10);
  }

  // في بعض الأنماط نضع لغز العامل المفقود
  const isMissingFactor = mode === 'missing_factor' || Math.random() < 0.25;
  const isTrueFalse = Math.random() < 0.2 && mode !== 'missing_factor';

  const product = a * b;

  if (isMissingFactor) {
    const hideFirst = Math.random() < 0.5;
    const missing = hideFirst ? a : b;
    const known = hideFirst ? b : a;
    const questionText = hideFirst 
      ? `___ × ${known} = ${product}` 
      : `${known} × ___ = ${product}`;

    const choices = makeChoices(missing, [-1, 1, 2, -2, 3]);

    return {
      type: 'multiple_choice',
      category: 'جدول الضرب',
      prompt: 'ما هو العدد المفقود في المعادلة؟',
      questionText,
      equation: questionText,
      correctAnswer: missing,
      choices,
      explanation: `${a} × ${b} = ${product}، وبالتالي العدد الناقص هو ${missing}.`,
      points: 20
    };
  }

  if (isTrueFalse) {
    const isCorrectEquation = Math.random() < 0.5;
    const displayedProduct = isCorrectEquation ? product : product + (Math.random() < 0.5 ? rand(1, 4) : -rand(1, 4));
    const questionText = `هل المعادلة التالية صحيحة؟  ${a} × ${b} = ${displayedProduct}`;

    return {
      type: 'true_false',
      category: 'جدول الضرب',
      prompt: 'صح أم خطأ؟',
      questionText,
      equation: `${a} × ${b} = ${displayedProduct}`,
      correctAnswer: isCorrectEquation ? 'صح' : 'خطأ',
      choices: ['صح', 'خطأ'],
      explanation: isCorrectEquation 
        ? `صحيح! لأن حاصل ضرب ${a} في ${b} هو بالفعل ${product}.` 
        : `خطأ! حاصل ضرب ${a} × ${b} هو ${product} وليس ${displayedProduct}.`,
      points: 15
    };
  }

  // سؤال الاختيار من متعدد الكلاسيكي
  const choices = makeChoices(product, [-a, a, -1, 1, 2, -2, 10, -10]);

  return {
    type: 'multiple_choice',
    category: `جدول الضرب (${a})`,
    prompt: 'أوجد حاصل الضرب:',
    questionText: `${a} × ${b} = ؟`,
    equation: `${a} × ${b} = `,
    correctAnswer: product,
    choices,
    explanation: `${a} × ${b} = ${product}`,
    points: 15
  };
};

/**
 * مولّد أسئلة المنهاج المدرسي بحسب الصف (الصفوف 1 - 6)
 * متوافق بنسبة 100% مع منهاج وزارة التربية والتعليم
 */
export const generateGradeCurriculumQuestion = (gradeId, topicId = 'all') => {
  switch (gradeId) {
    // ==========================================
    // الصف الأول
    // ==========================================
    case 'grade_1': {
      const sub = topicId === 'all' 
        ? ['add_sub_20', 'compare', 'sequence', 'shapes'][rand(0, 3)] 
        : topicId;

      if (sub.includes('compare')) {
        const n1 = rand(1, 20);
        const n2 = Math.random() < 0.25 ? n1 : rand(1, 20);
        let correct = '=';
        if (n1 > n2) correct = '>';
        if (n1 < n2) correct = '<';

        return {
          type: 'compare',
          category: 'مقارنة الأعداد',
          prompt: 'ضع الإشارة المناسبة بين العددين:',
          questionText: `${n1}  [ ؟ ]  ${n2}`,
          correctAnswer: correct,
          choices: ['>', '<', '='],
          explanation: n1 === n2 ? `العددان متساويان (${n1} = ${n2})` : `${Math.max(n1, n2)} أكبر من ${Math.min(n1, n2)}`,
          points: 15
        };
      }

      if (sub.includes('sequence')) {
        const start = rand(1, 15);
        const step = 1;
        const missingIndex = rand(1, 3);
        const seq = [start, start + 1, start + 2, start + 3];
        const correct = seq[missingIndex];
        seq[missingIndex] = '___';

        const choices = makeChoices(correct, [-2, -1, 1, 2]);

        return {
          type: 'sequence',
          category: 'سلاسل الأعداد',
          prompt: 'ما هو العدد الناقص في المتتالية؟',
          questionText: seq.join(' ، '),
          correctAnswer: correct,
          choices,
          explanation: `الأعداد تتصاعد بواحد في كل خطوة، فالعدد الناقص هو ${correct}.`,
          points: 15
        };
      }

      if (sub.includes('shapes')) {
        const shapes = [
          { name: 'مربع', sides: 4, desc: 'له 4 أضلاع متساوية و 4 رؤوس' },
          { name: 'مثلث', sides: 3, desc: 'له 3 أضلاع و 3 رؤوس' },
          { name: 'مستطيل', sides: 4, desc: 'له 4 أضلاع كل ضلعين متقابلين متساويان' },
          { name: 'دائرة', sides: 0, desc: 'منحنى مغلق ليس له أضلاع مستقيمة ولا رؤوس' }
        ];
        const chosen = shapes[rand(0, shapes.length - 1)];
        const choices = shuffle(shapes.map(s => s.name));

        return {
          type: 'shapes',
          category: 'الأشكال الهندسية',
          prompt: 'خمّن الشكل الهندسي:',
          questionText: `شكل هندسي ${chosen.desc}، فما هو؟`,
          correctAnswer: chosen.name,
          choices,
          explanation: `الشكل هو الـ ${chosen.name}.`,
          points: 15
        };
      }

      // جمع أو طرح حتى 20
      const isAdd = Math.random() < 0.6;
      if (isAdd) {
        const a = rand(2, 11);
        const b = rand(1, 20 - a);
        const sum = a + b;
        return {
          type: 'multiple_choice',
          category: 'الجمع حتى 20',
          prompt: 'احسب حاصل الجمع:',
          questionText: `${a} + ${b} = ؟`,
          correctAnswer: sum,
          choices: makeChoices(sum, [-1, 1, 2, -2]),
          explanation: `${a} + ${b} = ${sum}`,
          points: 10
        };
      } else {
        const sum = rand(5, 20);
        const b = rand(1, sum - 1);
        const a = sum - b;
        return {
          type: 'multiple_choice',
          category: 'الطرح حتى 20',
          prompt: 'احسب ناتج الطرح:',
          questionText: `${sum} - ${b} = ؟`,
          correctAnswer: a,
          choices: makeChoices(a, [-1, 1, 2, -2]),
          explanation: `${sum} - ${b} = ${a}`,
          points: 10
        };
      }
    }

    // ==========================================
    // الصف الثاني
    // ==========================================
    case 'grade_2': {
      const mode = rand(1, 4);

      if (mode === 1) {
        // مبنى العدد: آحاد وعشرات
        const tens = rand(2, 9);
        const ones = rand(1, 9);
        const num = tens * 10 + ones;
        const askTens = Math.random() < 0.5;

        return {
          type: 'multiple_choice',
          category: 'مبنى العدد',
          prompt: askTens ? `في العدد ${num}، ما هي قيمة منزلة العشرات؟` : `في العدد ${num}، ما هو رقم الآحاد؟`,
          questionText: askTens ? `منزلة العشرات في ${num}` : `رقم الآحاد في ${num}`,
          correctAnswer: askTens ? tens * 10 : ones,
          choices: askTens ? makeChoices(tens * 10, [-10, 10, 20, -20]) : makeChoices(ones, [-1, 1, 2, -2]),
          explanation: `في العدد ${num}: الآحاد هي ${ones} والعشرات هي ${tens} (وقيمتها ${tens * 10}).`,
          points: 15
        };
      }

      if (mode === 2) {
        // الأعداد الزوجية والفردية
        const num = rand(11, 89);
        const isEven = num % 2 === 0;

        return {
          type: 'true_false',
          category: 'أعداد زوجية وفردية',
          prompt: 'حدّد طبيعة العدد:',
          questionText: `العدد ${num} هو عدد زوجي. هل هذه العبارة صحيحة؟`,
          correctAnswer: isEven ? 'صح' : 'خطأ',
          choices: ['صح', 'خطأ'],
          explanation: isEven 
            ? `صح! لأن رقم آحاده (${num % 10}) هو رقم زوجي.` 
            : `خطأ! لأن رقم آحاده (${num % 10}) فردي، فالعدد ${num} عدد فردي.`,
          points: 15
        };
      }

      if (mode === 3) {
        // الضرب الأولي (2، 5، 10) كجمع متكرر
        const multiplier = [2, 5, 10][rand(0, 2)];
        const count = rand(2, 8);
        const product = multiplier * count;
        const rep = Array(count).fill(multiplier).join(' + ');

        return {
          type: 'multiple_choice',
          category: 'الجمع المتكرر والضرب',
          prompt: 'عبّر عن الجمع المتكرر بجملة ضرب:',
          questionText: `${rep} = ؟`,
          correctAnswer: `${count} × ${multiplier} = ${product}`,
          choices: shuffle([
            `${count} × ${multiplier} = ${product}`,
            `${count + 1} × ${multiplier} = ${product + multiplier}`,
            `${count - 1} × ${multiplier} = ${product - multiplier}`,
            `${count} + ${multiplier} = ${count + multiplier}`
          ]),
          explanation: `تكرار العدد ${multiplier} بمقدار ${count} مرات يساوي ${count} × ${multiplier} = ${product}.`,
          points: 20
        };
      }

      // جمع وطرح حتى 100 مع تبديل
      const a = rand(15, 65);
      const b = rand(15, 35);
      const sum = a + b;
      return {
        type: 'multiple_choice',
        category: 'الجمع حتى 100',
        prompt: 'احسب المجموع:',
        questionText: `${a} + ${b} = ؟`,
        correctAnswer: sum,
        choices: makeChoices(sum, [-10, 10, -1, 1]),
        explanation: `${a} + ${b} = ${sum}`,
        points: 15
      };
    }

    // ==========================================
    // الصف الثالث
    // ==========================================
    case 'grade_3': {
      const mode = rand(1, 4);

      if (mode === 1) {
        // القسمة كعملية عكسية للضرب
        const b = rand(3, 9);
        const q = rand(2, 9);
        const div = b * q;

        return {
          type: 'multiple_choice',
          category: 'القسمة والضرب',
          prompt: 'احسب خارج القسمة:',
          questionText: `${div} ÷ ${b} = ؟`,
          correctAnswer: q,
          choices: makeChoices(q, [-1, 1, 2, -2]),
          explanation: `لأن ${b} × ${q} = ${div}، فإن ${div} ÷ ${b} = ${q}.`,
          points: 20
        };
      }

      if (mode === 2) {
        // المحيط والمساحة
        const width = rand(3, 8);
        const length = rand(width, 10);
        const isArea = Math.random() < 0.5;

        if (isArea) {
          const area = width * length;
          return {
            type: 'multiple_choice',
            category: 'مساحة المستطيل',
            prompt: 'احسب المساحة:',
            questionText: `مستطيل طوله ${length} سم وعرضه ${width} سم. ما مساحته؟`,
            correctAnswer: `${area} سم²`,
            choices: shuffle([
              `${area} سم²`,
              `${2 * (length + width)} سم²`,
              `${area + 4} سم²`,
              `${area - 4} سم²`
            ]),
            explanation: `مساحة المستطيل = الطول × العرض = ${length} × ${width} = ${area} سم².`,
            points: 20
          };
        } else {
          const perimeter = 2 * (length + width);
          return {
            type: 'multiple_choice',
            category: 'محيط المستطيل',
            prompt: 'احسب المحيط:',
            questionText: `مستطيل طوله ${length} سم وعرضه ${width} سم. ما محيطه؟`,
            correctAnswer: `${perimeter} سم`,
            choices: shuffle([
              `${perimeter} سم`,
              `${length * width} سم`,
              `${perimeter + 2} سم`,
              `${perimeter - 2} سم`
            ]),
            explanation: `محيط المستطيل = 2 × (الطول + العرض) = 2 × (${length} + ${width}) = ${perimeter} سم.`,
            points: 20
          };
        }
      }

      if (mode === 3) {
        // الأعداد حتى 1000
        const hundreds = rand(1, 8);
        const tens = rand(1, 9);
        const ones = rand(1, 9);
        const fullNum = hundreds * 100 + tens * 10 + ones;

        return {
          type: 'multiple_choice',
          category: 'مبنى العدد حتى 1000',
          prompt: 'ما هي قيمة المئات في العدد التالي؟',
          questionText: `في العدد ${fullNum}، ما هي القيمة المنزلية للرقم ${hundreds}؟`,
          correctAnswer: hundreds * 100,
          choices: makeChoices(hundreds * 100, [-100, 100, -10, 10]),
          explanation: `الرقم ${hundreds} يقع في منزلة المئات، لذا قيمته المنزلية هي ${hundreds * 100}.`,
          points: 15
        };
      }

      // مسألة كلامية سريعة
      const packs = rand(3, 8);
      const itemsPerPack = rand(4, 9);
      const total = packs * itemsPerPack;

      return {
        type: 'multiple_choice',
        category: 'مسألة كلامية في الضرب',
        prompt: 'اقرأ المسألة ثم أجب:',
        questionText: `اشترى سامي ${packs} علب أقلام، في كل علبة يوجد ${itemsPerPack} أقلام. كم قلماً اشترى سامي في المجموع؟`,
        correctAnswer: `${total} أقلام`,
        choices: shuffle([
          `${total} أقلام`,
          `${total + itemsPerPack} أقلام`,
          `${total - itemsPerPack} أقلام`,
          `${packs + itemsPerPack} أقلام`
        ]),
        explanation: `${packs} علب × ${itemsPerPack} أقلام = ${total} قلماً.`,
        points: 20
      };
    }

    // ==========================================
    // الصف الرابع
    // ==========================================
    case 'grade_4': {
      const mode = rand(1, 4);

      if (mode === 1) {
        // الكسور العادية: توسيع واختزال
        const num = rand(1, 4);
        const den = rand(num + 1, 6);
        const factor = rand(2, 4);
        const expNum = num * factor;
        const expDen = den * factor;

        return {
          type: 'multiple_choice',
          category: 'توسيع الكسور المتكافئة',
          prompt: 'اختر الكسر المكافئ للكسر المعطى:',
          questionText: `ما هو الكسر المكافئ للكسر ${num}/${den} بعد توسيعه بالعدد ${factor}؟`,
          correctAnswer: `${expNum}/${expDen}`,
          choices: shuffle([
            `${expNum}/${expDen}`,
            `${expNum + 1}/${expDen}`,
            `${num}/${expDen}`,
            `${expNum}/${den}`
          ]),
          explanation: `نضرب البسط والمقام في ${factor}: (${num}×${factor}) / (${den}×${factor}) = ${expNum}/${expDen}.`,
          points: 25
        };
      }

      if (mode === 2) {
        // جمع وطرح كسور بمقامات متساوية
        const den = rand(5, 12);
        const n1 = rand(1, den - 3);
        const n2 = rand(1, den - n1 - 1);
        const sumN = n1 + n2;

        return {
          type: 'multiple_choice',
          category: 'جمع الكسور العادية',
          prompt: 'احسب ناتج جمع الكسرين:',
          questionText: `${n1}/${den} + ${n2}/${den} = ؟`,
          correctAnswer: `${sumN}/${den}`,
          choices: shuffle([
            `${sumN}/${den}`,
            `${sumN}/${den * 2}`,
            `${sumN + 1}/${den}`,
            `${n1 * n2}/${den}`
          ]),
          explanation: `بما أن المقامات متساوية (${den})، نجمع البسطين ونبقي المقام كما هو: ${n1} + ${n2} = ${sumN}/${den}.`,
          points: 20
        };
      }

      if (mode === 3) {
        // قابلية القسمة والأعداد الأولية
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
        const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21];
        const isAskPrime = Math.random() < 0.5;

        if (isAskPrime) {
          const chosenPrime = primes[rand(0, primes.length - 1)];
          const fake = shuffle(composites).slice(0, 3);
          const choices = shuffle([chosenPrime, ...fake]);

          return {
            type: 'multiple_choice',
            category: 'الأعداد الأولية',
            prompt: 'أي من الأعداد التالية هو عدد أولي (يقبل القسمة فقط على 1 وعلى نفسه)؟',
            questionText: 'اختر العدد الأولي:',
            correctAnswer: chosenPrime,
            choices,
            explanation: `العدد ${chosenPrime} أولي لأنه لا يقبل القسمة إلا على نفسه وعلى 1 فقط.`,
            points: 25
          };
        } else {
          return {
            type: 'multiple_choice',
            category: 'قابلية القسمة على 5',
            prompt: 'أي من الأعداد التالية يقبل القسمة على 5 بدون باقٍ؟',
            questionText: 'اختر العدد الذي يقبل القسمة على 5:',
            correctAnswer: 85,
            choices: shuffle([85, 42, 63, 71]),
            explanation: 'العدد يقبل القسمة على 5 إذا كان رقم آحاده 0 أو 5 (وهنا الآحاد 5).',
            points: 20
          };
        }
      }

      // تصنيف الزوايا
      const angles = [
        { type: 'زاوية قائمة', deg: 90, desc: 'قياسها 90 درجة تماماً' },
        { type: 'زاوية حادة', deg: 45, desc: 'قياسها أصغر من 90 درجة' },
        { type: 'زاوية منفرجة', deg: 120, desc: 'قياسها أكبر من 90 وأصغر من 180 درجة' }
      ];
      const ang = angles[rand(0, 2)];
      return {
        type: 'multiple_choice',
        category: 'الهندسة: الزوايا',
        prompt: 'حدّد نوع الزاوية:',
        questionText: `زاوية قياسها ${ang.deg}°، ما هو نوعها؟`,
        correctAnswer: ang.type,
        choices: shuffle(['زاوية قائمة', 'زاوية حادة', 'زاوية منفرجة', 'زاوية مستقيمة']),
        explanation: `${ang.type}: لأنها ${ang.desc}.`,
        points: 20
      };
    }

    // ==========================================
    // الصف الخامس
    // ==========================================
    case 'grade_5': {
      const mode = rand(1, 4);

      if (mode === 1) {
        // جمع وطرح كسور بمقامات مختلفة (إيجاد المقام المشترك)
        const d1 = [2, 3, 4][rand(0, 2)];
        const d2 = d1 === 2 ? 4 : (d1 === 3 ? 6 : 8); // مضاعف بسيط
        const n1 = 1;
        const n2 = 1;
        // n1/d1 + n2/d2
        const commonDen = d2;
        const newN1 = n1 * (d2 / d1);
        const sumN = newN1 + n2;

        return {
          type: 'multiple_choice',
          category: 'جمع الكسور بمقامات مختلفة',
          prompt: 'وحّد المقامات ثم احسب المجموع:',
          questionText: `${n1}/${d1} + ${n2}/${d2} = ؟`,
          correctAnswer: `${sumN}/${commonDen}`,
          choices: shuffle([
            `${sumN}/${commonDen}`,
            `${n1 + n2}/${d1 + d2}`,
            `${sumN + 1}/${commonDen}`,
            `${sumN}/${d1 * d2}`
          ]),
          explanation: `نوحد المقامات إلى ${commonDen}: ${n1}/${d1} تصبح ${newN1}/${commonDen}، فيكون الناتج ${newN1} + ${n2} = ${sumN}/${commonDen}.`,
          points: 30
        };
      }

      if (mode === 2) {
        // الكسور العشرية
        const dec1 = (rand(1, 8) / 10).toFixed(1);
        const dec2 = (rand(1, 8) / 10).toFixed(1);
        const sum = (parseFloat(dec1) + parseFloat(dec2)).toFixed(1);

        return {
          type: 'multiple_choice',
          category: 'جمع الكسور العشرية',
          prompt: 'احسب ناتج الجمع العشري:',
          questionText: `${dec1} + ${dec2} = ؟`,
          correctAnswer: sum,
          choices: shuffle([
            sum,
            (parseFloat(sum) + 0.1).toFixed(1),
            (parseFloat(sum) - 0.1).toFixed(1),
            (parseFloat(dec1) + parseFloat(dec2) * 10).toFixed(1)
          ]),
          explanation: `${dec1} + ${dec2} = ${sum}`,
          points: 25
        };
      }

      if (mode === 3) {
        // مساحة المثلث = (القاعدة × الارتفاع) ÷ 2
        const base = rand(4, 12);
        const height = rand(3, 8);
        const area = (base * height) / 2;

        return {
          type: 'multiple_choice',
          category: 'مساحة المثلث',
          prompt: 'احسب مساحة المثلث:',
          questionText: `مثلث طول قاعدته ${base} سم وارتفاعه النازل عليها ${height} سم. ما مساحته؟`,
          correctAnswer: `${area} سم²`,
          choices: shuffle([
            `${area} سم²`,
            `${base * height} سم²`,
            `${area + 3} سم²`,
            `${base + height} سم²`
          ]),
          explanation: `مساحة المثلث = (القاعدة × الارتفاع) ÷ 2 = (${base} × ${height}) ÷ 2 = ${base * height} ÷ 2 = ${area} سم².`,
          points: 25
        };
      }

      // المعدل الحسابي البسيط
      const s1 = rand(70, 95);
      const s2 = rand(70, 95);
      const s3 = 3 * rand(75, 90) - (s1 + s2); // ليكون الناتج عدداً صحيحاً
      const avg = Math.round((s1 + s2 + s3) / 3);

      return {
        type: 'multiple_choice',
        category: 'المعدل الحسابي',
        prompt: 'احسب المعدل:',
        questionText: `حصلت تلميذة في 3 امتحانات على العلامات: ${s1} ، ${s2} ، ${s3}. ما هو معدل علاماتها؟`,
        correctAnswer: avg,
        choices: makeChoices(avg, [-2, 2, -1, 1]),
        explanation: `المعدل = مجموع العلامات ÷ عددها = (${s1} + ${s2} + ${s3}) ÷ 3 = ${s1 + s2 + s3} ÷ 3 = ${avg}.`,
        points: 25
      };
    }

    // ==========================================
    // الصف السادس
    // ==========================================
    case 'grade_6': {
      const mode = rand(1, 4);

      if (mode === 1) {
        // النسبة المئوية والتخفيض
        const price = [50, 100, 200, 300, 400][rand(0, 4)];
        const discountPercent = [10, 20, 25, 50][rand(0, 3)];
        const discountAmount = (price * discountPercent) / 100;
        const newPrice = price - discountAmount;

        return {
          type: 'multiple_choice',
          category: 'النسبة المئوية (%) والتخفيض',
          prompt: 'احسب السعر بعد التخفيض:',
          questionText: `قميص سعره الأصلي ${price} شيكل، أُجري عليه تخفيض بنسبة ${discountPercent}%. كم أصبح سعره بعد التخفيض؟`,
          correctAnswer: `${newPrice} شيكل`,
          choices: shuffle([
            `${newPrice} شيكل`,
            `${discountAmount} شيكل`,
            `${newPrice + 10} شيكل`,
            `${price - 10} شيكل`
          ]),
          explanation: `قيمة التخفيض = ${price} × ${discountPercent}% = ${discountAmount} شيكل. السعر الجديد = ${price} - ${discountAmount} = ${newPrice} شيكل.`,
          points: 30
        };
      }

      if (mode === 2) {
        // ترتيب العمليات الحسابية والأقواس
        // أولوية الأقواس ثم الضرب والقسمة ثم الجمع والطرح
        const a = rand(2, 6);
        const b = rand(3, 8);
        const c = rand(2, 5);
        // a + b × c
        const result = a + (b * c);

        return {
          type: 'multiple_choice',
          category: 'ترتيب العمليات الحسابية',
          prompt: 'احسب وفق أسبقية العمليات الحسابية:',
          questionText: `${a} + ${b} × ${c} = ؟`,
          correctAnswer: result,
          choices: shuffle([
            result,
            (a + b) * c, // الخطأ الشائع (الجمع قبل الضرب)
            result + 2,
            result - 2
          ]),
          explanation: `حسب ترتيب العمليات، الأولوية للضرب أولاً: ${b} × ${c} = ${b * c}، ثم نجمع: ${a} + ${b * c} = ${result}.`,
          points: 25
        };
      }

      if (mode === 3) {
        // الأعداد الموجهة (الموجبة والسالبة)
        const t1 = rand(-10, -1);
        const t2 = rand(1, 10);
        const isCompare = Math.random() < 0.5;

        if (isCompare) {
          const correct = t1 < t2 ? '<' : '>';
          return {
            type: 'compare',
            category: 'الأعداد الموجهة',
            prompt: 'قارن بين العددين الموجهين:',
            questionText: `(${t1})  [ ؟ ]  (${t2})`,
            correctAnswer: correct,
            choices: ['>', '<', '='],
            explanation: `أي عدد موجب دائماً أكبر من أي عدد سالب، لذلك (${t1}) أصغر من (${t2}).`,
            points: 20
          };
        } else {
          // جمع بسيط: -a + b
          const sum = t1 + t2;
          return {
            type: 'multiple_choice',
            category: 'جمع الأعداد الموجهة',
            prompt: 'احسب ناتج الجمع:',
            questionText: `(${t1}) + (${t2}) = ؟`,
            correctAnswer: sum,
            choices: makeChoices(sum, [-2, 2, -1, 1, 5, -5]),
            explanation: `(${t1}) + (${t2}) = ${sum}`,
            points: 25
          };
        }
      }

      // حجم الصندوق والمكعب
      const l = rand(3, 6);
      const w = rand(2, 4);
      const h = rand(2, 5);
      const volume = l * w * h;

      return {
        type: 'multiple_choice',
        category: 'حجوم المجسمات',
        prompt: 'احسب الحجم:',
        questionText: `صندوق على شكل شبه مكعب أبعاده: طوله ${l} سم، عرضه ${w} سم، وارتفاعه ${h} سم. ما هو حجمه؟`,
        correctAnswer: `${volume} سم³`,
        choices: shuffle([
          `${volume} سم³`,
          `${2 * (l + w + h)} سم³`,
          `${volume + 10} سم³`,
          `${volume - 6} سم³`
        ]),
        explanation: `حجم شبه المكعب = الطول × العرض × الارتفاع = ${l} × ${w} × ${h} = ${volume} سم³.`,
        points: 30
      };
    }

    default:
      return generateMultiplicationQuestion('all', 'speed_race');
  }
};

/**
 * تحدي المحقق الرياضي (اكتشف الخطأ وصححه)
 */
export const DETECTIVE_CHALLENGE = {
  id: 'math_detective',
  title: 'تحدي المحقق الرياضي: اكتشف الخطأ وصححه 🕵️‍♂️🔍',
  subtitle: 'دقق في المسائل والحلول الحسابية، اكتشف المغالطات الشائعة، وكن المحقق البارع!',
  icon: '🕵️‍♂️',
  color: '#0284c7',
  badge: 'تفكير ناقد 🔍',
  levels: [
    { id: 'progressive', name: 'المسار التدريجي الذكي 🚀', desc: 'يبدأ من السهل ويتصاعد تلقائياً كلما حللت إجابات صحيحة!', icon: '📈' },
    { id: 'easy', name: 'المحقق الصغير (سهل 🟢)', desc: 'الصفوف 1-2: الجمع والطرح، مبنى العدد، والأشكال', icon: '🔍' },
    { id: 'medium', name: 'المحقق الماهر (متوسط 🟡)', desc: 'الصفوف 3-4: جدول الضرب، المحيط، وقابلية القسمة', icon: '🔎' },
    { id: 'hard', name: 'كبير المحققين (صعب 🔴)', desc: 'الصفوف 5-6: ترتيب العمليات، الكسور، والنسبة المئوية', icon: '🧠' }
  ]
};

/**
 * مولّد تحدي المحقق الرياضي (اكتشف الخطأ وصححه)
 * مبني تدريجياً من السهل إلى الصعب وفق منهاج الرياضيات
 */
export const generateMathDetectiveQuestion = (level = 'progressive', questionIndex = 0) => {
  let effectiveLevel = level;
  if (level === 'progressive') {
    if (questionIndex < 3) effectiveLevel = 'easy';
    else if (questionIndex < 7) effectiveLevel = 'medium';
    else effectiveLevel = 'hard';
  }

  // EASY (الصفوف 1 و 2)
  if (effectiveLevel === 'easy') {
    const caseType = rand(1, 5);

    if (caseType === 1) {
      // خطأ الجمع والطرح البسيط
      const a = rand(10, 30);
      const b = rand(5, 18);
      const isAddition = Math.random() < 0.5;
      const isActuallyCorrect = Math.random() < 0.28;

      if (isAddition) {
        const correctSum = a + b;
        const shownSum = isActuallyCorrect ? correctSum : correctSum + (Math.random() < 0.5 ? -2 : 3);
        const statement = `${a} + ${b} = ${shownSum}`;

        if (isActuallyCorrect) {
          return {
            type: 'detective',
            level: 'easy',
            category: 'تحقيق الجمع البسيط',
            prompt: '🕵️‍♂️ مهمة المحقق: دقق في ورقة الحل أدناه:',
            caseScenario: 'قام أحد الطلاب بحل تمرين الجمع التالي:',
            suspectEquation: statement,
            questionText: 'ما هو حكمك كمحقق رياضي؟',
            correctAnswer: 'الحل صحيح تماماً، والناتج سليم!',
            choices: shuffle([
              'الحل صحيح تماماً، والناتج سليم!',
              `خطأ! الناتج الصحيح هو ${correctSum + 4}`,
              `خطأ! الناتج الصحيح هو ${correctSum - 3}`,
              `خطأ! كان يجب أن يطرح بدلاً من الجمع`
            ]),
            explanation: `أحسنت التحقيق! ${a} + ${b} = ${correctSum} بالفعل، الحل سليم ولا غبار عليه.`,
            points: 20
          };
        } else {
          return {
            type: 'detective',
            level: 'easy',
            category: 'تحقيق الجمع البسيط',
            prompt: '🕵️‍♂️ مهمة المحقق: دقق في ورقة الحل أدناه:',
            caseScenario: 'كتب الطالب على اللوح:',
            suspectEquation: statement,
            questionText: 'ما هو الخطأ وما هو التصحيح السليم؟',
            correctAnswer: `خطأ! الناتج الصحيح هو ${correctSum}`,
            choices: shuffle([
              `خطأ! الناتج الصحيح هو ${correctSum}`,
              'الحل صحيح تماماً ولا يوجد أي خطأ',
              `خطأ! الناتج الصحيح هو ${shownSum + 5}`,
              `خطأ! الناتج الصحيح هو ${shownSum - 4}`
            ]),
            explanation: `كشف رائع للخطأ! الجمع الصحيح هو ${a} + ${b} = ${correctSum}، بينما كتب الطالب ${shownSum}.`,
            points: 20
          };
        }
      } else {
        const diff = a - b;
        const shownDiff = isActuallyCorrect ? diff : (diff === 1 ? 4 : diff - 2);
        const statement = `${a} - ${b} = ${shownDiff}`;

        if (isActuallyCorrect) {
          return {
            type: 'detective',
            level: 'easy',
            category: 'تحقيق الطرح البسيط',
            prompt: '🕵️‍♂️ مهمة المحقق: دقق في تمرين الطرح:',
            caseScenario: 'حلت سلمى مسألة الطرح:',
            suspectEquation: statement,
            questionText: 'ما هو حكمك كمحقق رياضي؟',
            correctAnswer: 'الحل صحيح تماماً، والناتج دقيق!',
            choices: shuffle([
              'الحل صحيح تماماً، والناتج دقيق!',
              `خطأ! الناتج الصحيح هو ${diff + 2}`,
              `خطأ! الناتج الصحيح هو ${diff - 1}`,
              'خطأ! نسي تبديل العشرات'
            ]),
            explanation: `تحقيق صائب! ${a} - ${b} = ${diff} والحل صحيح ومتقن.`,
            points: 20
          };
        } else {
          return {
            type: 'detective',
            level: 'easy',
            category: 'تحقيق الطرح البسيط',
            prompt: '🕵️‍♂️ مهمة المحقق: دقق في تمرين الطرح:',
            caseScenario: 'حلت سلمى مسألة الطرح:',
            suspectEquation: statement,
            questionText: 'أين الخطأ وما هو الصواب؟',
            correctAnswer: `خطأ! الناتج الصحيح هو ${diff}`,
            choices: shuffle([
              `خطأ! الناتج الصحيح هو ${diff}`,
              'الحل صحيح تماماً والناتج سليم',
              `خطأ! الناتج الصحيح هو ${shownDiff + 3}`,
              `خطأ! الناتج الصحيح هو ${shownDiff - 1}`
            ]),
            explanation: `أحسنت! ${a} - ${b} = ${diff}، والطالب أخطأ في الحساب بحاصل ${shownDiff}.`,
            points: 20
          };
        }
      }
    }

    if (caseType === 2) {
      // مقارنة الأعداد وميزان الأرقام
      const n1 = rand(21, 99);
      const tens = Math.floor(n1 / 10);
      const ones = n1 % 10;
      if (tens !== ones) {
        const n2 = ones * 10 + tens;
        const isActuallyGreater = n1 > n2;
        const claimedSymbol = isActuallyGreater ? '<' : '>'; // false claim
        const statement = `${n1} ${claimedSymbol} ${n2}`;

        return {
          type: 'detective',
          level: 'easy',
          category: 'تحقيق مقارنة الأعداد',
          prompt: '🕵️‍♂️ مهمة المحقق: دقق في ميزان المقارنة:',
          caseScenario: 'كتب طالب مقارنة بين عددين مقلوبي المنازل:',
          suspectEquation: statement,
          questionText: 'هل المقارنة صحيحة أم خاطئة؟',
          correctAnswer: `خطأ! لأن ${n1} ${isActuallyGreater ? '>' : '<'} ${n2}`,
          choices: shuffle([
            `خطأ! لأن ${n1} ${isActuallyGreater ? '>' : '<'} ${n2}`,
            'صحيحة تماماً لأننا ننظر لرقم الآحاد فقط',
            'صحيحة لأن العددين متساويان في القيمة',
            `خطأ! لأن ${n1} = ${n2}`
          ]),
          explanation: `كشف دقيق! عند مقارنة عددين نقارن منزلة العشرات أولاً: منزلة العشرات في ${isActuallyGreater ? n1 : n2} هي ${Math.max(tens, ones)} وهي أكبر.`,
          points: 20
        };
      }
    }

    if (caseType === 3) {
      // مبنى العدد (قيمة الرقم)
      const num = rand(31, 89);
      const tensDigit = Math.floor(num / 10);
      const onesDigit = num % 10;
      const statement = `في العدد (${num}): قيمة الرقم (${tensDigit}) هي (${tensDigit}) فقط!`;

      return {
        type: 'detective',
        level: 'easy',
        category: 'تحقيق مبنى العدد والمنزلة',
        prompt: '🕵️‍♂️ مهمة المحقق: دقق في ادعاء القيمة المنزلية:',
        caseScenario: 'ادعى أحد الطلاب قائلاً:',
        suspectEquation: statement,
        questionText: 'ما رأي المحقق الرياضي في هذا القول؟',
        correctAnswer: `خطأ! لأن الرقم ${tensDigit} في منزلة العشرات وقيمته ${tensDigit * 10}`,
        choices: shuffle([
          `خطأ! لأن الرقم ${tensDigit} في منزلة العشرات وقيمته ${tensDigit * 10}`,
          'صحيح! الرقم يحتفظ بقيمته نفسها في أي منزلة',
          `خطأ! لأن قيمته هي ${onesDigit}`,
          `صحيح، لأن ${num} يتكون من ${tensDigit} فقط`
        ]),
        explanation: `تحقيق ممتاز! في المبنى العشري، الرقم في منزلة العشرات يمثل حزم عشرات كاملة، لذا قيمة ${tensDigit} هي ${tensDigit * 10}.`,
        points: 20
      };
    }

    if (caseType === 4) {
      // متتالية الأعداد الزوجية والفردية
      const start = rand(2, 12);
      const isEvenSeq = start % 2 === 0;
      const s1 = start;
      const s2 = start + 2;
      const s3 = start + 4;
      const s4 = start + 5; // intruder!
      const s5 = start + 8;
      const statement = `المتتالية: ${s1} ، ${s2} ، ${s3} ، ${s4} ، ${s5}`;

      return {
        type: 'detective',
        level: 'easy',
        category: 'تحقيق المتتاليات الزوجية والفردية',
        prompt: '🕵️‍♂️ مهمة المحقق: هناك عنصر دخيل في المتتالية!',
        caseScenario: `كتب المعلم على اللوح متتالية أعداد ${isEvenSeq ? 'زوجية' : 'فردية'}، ولكن طالباً وضع عدداً دخيلاً:`,
        suspectEquation: statement,
        questionText: 'ما هو العدد الدخيل غير المناسب؟',
        correctAnswer: `العدد ${s4} لأنه عدد ${isEvenSeq ? 'فردي' : 'زوجي'} وسط أعداد ${isEvenSeq ? 'زوجية' : 'فردية'}`,
        choices: shuffle([
          `العدد ${s4} لأنه عدد ${isEvenSeq ? 'فردي' : 'زوجي'} وسط أعداد ${isEvenSeq ? 'زوجية' : 'فردية'}`,
          `العدد ${s1} لأنه أول عدد في السلسلة`,
          `العدد ${s3} لأنه يقع في المنتصف`,
          'لا يوجد أي عدد دخيل، فالمتتالية سليمة تماماً'
        ]),
        explanation: `محقق بارع! العدد ${s4} خالف قاعدة النمط لأنه عدد ${isEvenSeq ? 'فردي' : 'زوجي'}، والصحيح مكانه هو ${start + 6}.`,
        points: 25
      };
    }

    // caseType === 5: السابق والتالي
    const val = rand(20, 90);
    const statement = `العدد السابق للعدد (${val}) هو (${val + 1})`;
    return {
      type: 'detective',
      level: 'easy',
      category: 'تحقيق السابق والتالي',
      prompt: '🕵️‍♂️ مهمة المحقق: فحص مفهوم السابق والتالي:',
      caseScenario: 'أجاب طالب في الاختبار السريع:',
      suspectEquation: statement,
      questionText: 'هل إجابة الطالب صحيحة؟',
      correctAnswer: `خطأ! السابق هو ${val - 1} بينما ${val + 1} هو التالي`,
      choices: shuffle([
        `خطأ! السابق هو ${val - 1} بينما ${val + 1} هو التالي`,
        'صحيحة تماماً، السابق يعني نزيد 1',
        `خطأ، السابق هو ${val - 10}`,
        'صحيحة، السابق والتالي لهما نفس المعنى'
      ]),
      explanation: `العدد السابق هو العدد الذي يسبقه بمقدار 1 أي (${val} - 1 = ${val - 1})، أما (${val + 1}) فهو العدد التالي.`,
      points: 20
    };
  }

  // MEDIUM (الصفوف 3 و 4)
  if (effectiveLevel === 'medium') {
    const caseType = rand(1, 5);

    if (caseType === 1) {
      // أخطاء جدول الضرب
      const a = rand(6, 9);
      const b = rand(6, 9);
      const trueProduct = a * b;
      const isActuallyCorrect = Math.random() < 0.25;
      const shownProduct = isActuallyCorrect ? trueProduct : trueProduct + (Math.random() < 0.5 ? -2 : 4);
      const statement = `${a} × ${b} = ${shownProduct}`;

      if (isActuallyCorrect) {
        return {
          type: 'detective',
          level: 'medium',
          category: 'تحقيق جدول الضرب',
          prompt: '🕵️‍♂️ مهمة المحقق: تدقيق حاصل الضرب:',
          caseScenario: 'سجل رامي في دفتره العملية التالية:',
          suspectEquation: statement,
          questionText: 'ما رأي المحقق في هذا الحاصل؟',
          correctAnswer: 'صحيح تماماً، الحاصل دقيق 100%!',
          choices: shuffle([
            'صحيح تماماً، الحاصل دقيق 100%!',
            `خطأ! الحاصل الصحيح هو ${trueProduct + 6}`,
            `خطأ! الحاصل الصحيح هو ${trueProduct - 4}`,
            `خطأ! لأن حاصل الضرب يجب أن يكون فردياً`
          ]),
          explanation: `فحص محترف! ${a} × ${b} = ${trueProduct} دون أي خطأ.`,
          points: 25
        };
      } else {
        return {
          type: 'detective',
          level: 'medium',
          category: 'تحقيق جدول الضرب',
          prompt: '🕵️‍♂️ مهمة المحقق: تدقيق حاصل الضرب:',
          caseScenario: 'سجل رامي في مسابقة السرعة:',
          suspectEquation: statement,
          questionText: 'أين الخطأ وما هو الصواب؟',
          correctAnswer: `خطأ! الناتج الصحيح هو ${trueProduct}`,
          choices: shuffle([
            `خطأ! الناتج الصحيح هو ${trueProduct}`,
            'صحيح تماماً ولا يوجد أي خطأ',
            `خطأ! الناتج الصحيح هو ${shownProduct + 6}`,
            `خطأ! الناتج الصحيح هو ${shownProduct - 8}`
          ]),
          explanation: `كشف سريع! حقيقة الضرب هي ${a} × ${b} = ${trueProduct}، ورامي تسرع وكتب ${shownProduct}.`,
          points: 25
        };
      }
    }

    if (caseType === 2) {
      // محيط ومساحة المستطيل
      const l = rand(6, 10);
      const w = rand(3, 5);
      const area = l * w;
      const perimeter = 2 * (l + w);
      const statement = `مستطيل طوله ${l} سم وعرضه ${w} سم. قال يوسف: محيطه = ${area} سم!`;

      return {
        type: 'detective',
        level: 'medium',
        category: 'تحقيق المحيط والمساحة',
        prompt: '🕵️‍♂️ مهمة المحقق: كشف الخلط بين المحيط والمساحة!',
        caseScenario: 'في امتحان الهندسة، أجاب يوسف عن سؤال المحيط:',
        suspectEquation: statement,
        questionText: 'ما الخطأ المفاهيمي الذي ارتكبه يوسف؟',
        correctAnswer: `خطأ! حسب المساحة بدلاً من المحيط، والمحيط الصحيح هو ${perimeter} سم`,
        choices: shuffle([
          `خطأ! حسب المساحة بدلاً من المحيط، والمحيط الصحيح هو ${perimeter} سم`,
          'إجابة يوسف صحيحة تماماً والمحيط هو حاصل الضرب',
          `خطأ! المحيط الصحيح هو ${l + w} سم فقط`,
          `خطأ! كان يجب أن يطرح العرض من الطول: ${l - w} سم`
        ]),
        explanation: `محقق متميز! يوسف ضرب الطول في العرض (${l} × ${w} = ${area}) وهذا قانون المساحة! أما المحيط فهو مجموع الأضلاع = 2 × (${l} + ${w}) = ${perimeter} سم.`,
        points: 30
      };
    }

    if (caseType === 3) {
      // جمع الكسور بمقامات متساوية
      const denom = rand(5, 9);
      const num1 = rand(1, 2);
      const num2 = rand(1, 3);
      const correctSumNum = num1 + num2;
      const statement = `${num1}/${denom} + ${num2}/${denom} = ${correctSumNum}/${denom * 2}`;

      return {
        type: 'detective',
        level: 'medium',
        category: 'تحقيق جمع الكسور العادية',
        prompt: '🕵️‍♂️ مهمة المحقق: فحص عملية جمع الكسور:',
        caseScenario: 'حل أحد الطلاب مسألة الكسور التالية:',
        suspectEquation: statement,
        questionText: 'ما الخطأ الشائع الذي وقع فيه الطالب؟',
        correctAnswer: `خطأ! جمع المقامات، بينما الصحيح أن يبقى المقام كما هو: ${correctSumNum}/${denom}`,
        choices: shuffle([
          `خطأ! جمع المقامات، بينما الصحيح أن يبقى المقام كما هو: ${correctSumNum}/${denom}`,
          'الحل صحيح تماماً، نجمع البسوط والمقامات معاً',
          `خطأ! كان يجب أن يطرح البسوط: ${Math.abs(num1 - num2)}/${denom}`,
          `خطأ! الناتج الصحيح هو 1 صحيح دائماً`
        ]),
        explanation: `ملاحظة عبقرية! في جمع الكسور ذات المقامات المتساوية، نجمع البسوط فقط ونحتفظ بنفس المقام، فالصحيح هو ${correctSumNum}/${denom}.`,
        points: 30
      };
    }

    if (caseType === 4) {
      // القسمة مع باقٍ
      const divisor = rand(4, 7);
      const quotient = rand(3, 6);
      const remainder = rand(1, divisor - 1);
      const dividend = divisor * quotient + remainder;
      const fakeRemainder = remainder === 1 ? remainder + 2 : remainder - 1;
      const statement = `${dividend} ÷ ${divisor} = ${quotient} والباقي ${fakeRemainder}`;

      return {
        type: 'detective',
        level: 'medium',
        category: 'تحقيق القسمة مع باقٍ',
        prompt: '🕵️‍♂️ مهمة المحقق: التحقق من باقي القسمة:',
        caseScenario: 'أجرى خالد عملية قسمة وكتب في النتيجة:',
        suspectEquation: statement,
        questionText: 'هل باقي القسمة الذي كتبه خالد صحيح؟',
        correctAnswer: `خطأ! الناتج ${quotient} ولكن الباقي الصحيح هو ${remainder}`,
        choices: shuffle([
          `خطأ! الناتج ${quotient} ولكن الباقي الصحيح هو ${remainder}`,
          'صحيح تماماً، الباقي وحاصل القسمة دقيقان',
          `خطأ! لا يوجد أي باقٍ في هذه المسألة والباقي صفر`,
          `خطأ! حاصل القسمة هو ${quotient + 1} بدون باقٍ`
        ]),
        explanation: `تحقيق دقيق! لأن ${divisor} × ${quotient} = ${divisor * quotient}، وبطرحها من ${dividend} نجد أن الباقي هو ${dividend - divisor * quotient} = ${remainder}.`,
        points: 25
      };
    }

    // caseType === 5: قابلية القسمة
    const statement = 'العدد (435) يقبل القسمة على 2 بدون باقٍ لأنه ينتهي برقم 5';
    return {
      type: 'detective',
      level: 'medium',
      category: 'تحقيق قابلية القسمة',
      prompt: '🕵️‍♂️ مهمة المحقق: فحص قواعد قابلية القسمة:',
      caseScenario: 'قال وليد لزملائه أثناء المراجعة:',
      suspectEquation: statement,
      questionText: 'كيف تصحح مقولة وليد؟',
      correctAnswer: 'خطأ! يقبل على 5 وليس على 2، لأن شروط القسمة على 2 أن يكون الآحاد زوجياً',
      choices: shuffle([
        'خطأ! يقبل على 5 وليس على 2، لأن شروط القسمة على 2 أن يكون الآحاد زوجياً',
        'صحيح تماماً، كل عدد ينتهي بـ 5 يقبل على 2',
        'خطأ! هذا العدد لا يقبل القسمة على أي عدد إطلاقاً',
        'صحيح، لأن 5 عدد أولي'
      ]),
      explanation: `رائع! العدد يقبل القسمة على 2 إذا وفقط إذا كان رقم آحاده زوجياً (0، 2، 4، 6، 8). أما انتهاؤه بـ 5 فيعني أنه يقبل القسمة على 5!`,
      points: 25
    };
  }

  // HARD (الصفوف 5 و 6)
  const caseType = rand(1, 6);

  if (caseType === 1) {
    // ترتيب العمليات الحسابية (أشهر خطأ: الجمع قبل الضرب)
    const a = rand(4, 9);
    const b = rand(3, 7);
    const c = rand(2, 6);
    const wrongResult = (a + b) * c; // الجمع قبل الضرب
    const correctResult = a + (b * c);
    const statement = `${a} + ${b} × ${c} = ${wrongResult}`;

    return {
      type: 'detective',
      level: 'hard',
      category: 'تحقيق أسبقية العمليات (PEMDAS)',
      prompt: '🕵️‍♂️ مهمة المحقق: كشف لغز ترتيب العمليات الحسابية:',
      caseScenario: 'حل طالب مسألة العمليات المركبة على السبورة وكتب:',
      suspectEquation: statement,
      questionText: 'ما هي المغالطة الرياضية التي وقع فيها الطالب؟',
      correctAnswer: `خطأ! جمع قبل أن يضرب، والحل الصحيح هو ${correctResult}`,
      choices: shuffle([
        `خطأ! جمع قبل أن يضرب، والحل الصحيح هو ${correctResult}`,
        'الحل صحيح تماماً لأننا نحسب من اليمين إلى اليسار دائماً',
        `خطأ! الحل الصحيح هو ${correctResult + 10}`,
        `خطأ! كان يجب أن يضرب ${a} × ${b} أولاً`
      ]),
      explanation: `تحقيق عبقري! في الرياضيات، الضرب له أولوية تسبق الجمع، فنحسب أولاً ${b} × ${c} = ${b * c}، ثم نجمع: ${a} + ${b * c} = ${correctResult}. والنتيجة ${wrongResult} جاءت من خطأ جمع ${a} + ${b} أولاً!`,
      points: 35
    };
  }

  if (caseType === 2) {
    // جمع كسور بمقامات مختلفة
    const statement = '1/2 + 1/4 = 2/6 = 1/3';
    return {
      type: 'detective',
      level: 'hard',
      category: 'تحقيق جمع الكسور غير متحدة المقام',
      prompt: '🕵️‍♂️ مهمة المحقق: فحص جمع الكسور المختلفة في المقام:',
      caseScenario: 'كتبت طالبة في دفتر الواجب:',
      suspectEquation: statement,
      questionText: 'ما هو الخطأ الجسيم وما هو الحل السليم؟',
      correctAnswer: 'خطأ! جمعت المقامات بدلاً من توحيدها، والحل الصحيح هو 3/4',
      choices: shuffle([
        'خطأ! جمعت المقامات بدلاً من توحيدها، والحل الصحيح هو 3/4',
        'الحل سليم تماماً، نجمع البسوط والمقامات ونختزل',
        'خطأ! الحل الصحيح هو 1 صحيح',
        'خطأ! الحل الصحيح هو 2/4 = 1/2'
      ]),
      explanation: `محقق خبير! نصف زائد ربع يساوي ثلاثة أرباع (1/2 = 2/4، إذن 2/4 + 1/4 = 3/4). لا يجوز أبداً جمع المقامات!`,
      points: 35
    };
  }

  if (caseType === 3) {
    // ضرب الكسور العشرية والمنازل
    const statement = '0.3 × 0.2 = 0.6';
    return {
      type: 'detective',
      level: 'hard',
      category: 'تحقيق ضرب الكسور العشرية',
      prompt: '🕵️‍♂️ مهمة المحقق: فحص منازل الفاصلة العشرية:',
      caseScenario: 'قام أحد الطلاب بحساب ضرب كسرين عشريين:',
      suspectEquation: statement,
      questionText: 'أين وقع الخطأ في الفاصلة العشرية؟',
      correctAnswer: 'خطأ! نسي منزلة عشرية، والناتج الصحيح هو 0.06',
      choices: shuffle([
        'خطأ! نسي منزلة عشرية، والناتج الصحيح هو 0.06',
        'الحل صحيح تماماً لأن 3 × 2 = 6',
        'خطأ! الناتج الصحيح هو 6 صحيح بدون فاصلة',
        'خطأ! الناتج الصحيح هو 0.006'
      ]),
      explanation: `تحقيق دقيق جداً! عند ضرب 0.3 (منزلة واحدة) × 0.2 (منزلة واحدة)، يجب أن يكون في الناتج منزلتان عشريتان بعد الفاصلة: 3 × 2 = 6، ونضع صفرين ومنزلتين فيصبح 0.06.`,
      points: 35
    };
  }

  if (caseType === 4) {
    // النسبة المئوية ومغالطة التخفيض
    const statement = 'حقيبة سعرها 200 ₪ عليها تخفيض 20%، إذن سندفع للبائع 20 ₪!';
    return {
      type: 'detective',
      level: 'hard',
      category: 'تحقيق النسبة المئوية والتخفيض',
      prompt: '🕵️‍♂️ مهمة المحقق: تدقيق فاتورة التخفيض في المتجر:',
      caseScenario: 'قرأ كريم لافتة التخفيضات وقال لأمه:',
      suspectEquation: statement,
      questionText: 'ما هو الخطأ في حساب كريم وما المبلغ الحقيقي المطلوب دفعه؟',
      correctAnswer: 'خطأ! التخفيض هو 40 ₪، والسعر المطلوب دفعه هو 160 ₪',
      choices: shuffle([
        'خطأ! التخفيض هو 40 ₪، والسعر المطلوب دفعه هو 160 ₪',
        'حساب كريم صحيح تماماً، يدفع نسبة التخفيض',
        'خطأ! المطلوب دفعه هو 180 ₪',
        'خطأ! التخفيض 20% يعني أن الحقيبة أصبحت مجانية'
      ]),
      explanation: `كشف مالي رائع! 20% من 200 ₪ = (20 × 200) ÷ 100 = 40 ₪ (قيمة الخصم). إذن السعر بعد التخفيض = 200 - 40 = 160 ₪. كريم خلط بين نسبة التخفيض والسعر النهائي!`,
      points: 35
    };
  }

  if (caseType === 5) {
    // مساحة المثلث
    const base = rand(6, 12);
    const height = rand(4, 8);
    const wrongArea = base * height;
    const correctArea = (base * height) / 2;
    const statement = `مثلث قاعدته ${base} سم وارتفاعه ${height} سم. قال رائد: مساحته = ${base} × ${height} = ${wrongArea} سم²!`;

    return {
      type: 'detective',
      level: 'hard',
      category: 'تحقيق مساحة المثلث',
      prompt: '🕵️‍♂️ مهمة المحقق: فحص قانون مساحة المثلث:',
      caseScenario: 'في مسابقة الهندسة، قدم رائد حله:',
      suspectEquation: statement,
      questionText: 'ما القانون الناقص في إجابة رائد وما المساحة الصحيحة؟',
      correctAnswer: `خطأ! نسي القسمة على 2، فمساحة المثلث الصحيحة هي ${correctArea} سم²`,
      choices: shuffle([
        `خطأ! نسي القسمة على 2، فمساحة المثلث الصحيحة هي ${correctArea} سم²`,
        'حل رائد صحيح تماماً ومساحة المثلث هي القاعدة × الارتفاع',
        `خطأ! المساحة الصحيحة هي ${base + height} سم²`,
        `خطأ! كان يجب أن يضرب في 2 بدلاً من القسمة: ${wrongArea * 2} سم²`
      ]),
      explanation: `محقق هندسي بارع! قانون مساحة المثلث هو (القاعدة × الارتفاع) ÷ 2. رائد حسب مساحة مستطيل، والصحيح هو (${base} × ${height}) ÷ 2 = ${correctArea} سم².`,
      points: 35
    };
  }

  // caseType === 6: الأعداد الموجهة
  const statement = '(-6) + (-4) = +10';
  return {
    type: 'detective',
    level: 'hard',
    category: 'تحقيق الأعداد الموجهة السالبة',
    prompt: '🕵️‍♂️ مهمة المحقق: فحص إشارات الأعداد الموجهة:',
    caseScenario: 'كتب طالب في اختبار الجبر والأعداد الموجهة:',
    suspectEquation: statement,
    questionText: 'ما الخطأ في إشارة الناتج؟',
    correctAnswer: 'خطأ! جمع عددين سالبين يعطي دائماً عدداً سالباً: -10',
    choices: shuffle([
      'خطأ! جمع عددين سالبين يعطي دائماً عدداً سالباً: -10',
      'صحيح تماماً، سالب مع سالب يتحول إلى موجب دائماً',
      'خطأ! الناتج الصحيح هو -2',
      'خطأ! الناتج الصحيح هو +2'
    ]),
    explanation: `كشف جبري متقن! عند جمع خسارتين تكون النتيجة خسارة أكبر: (-6) + (-4) = -10. الطالب خلط بين قاعدة الضرب (سالب × سالب = موجب) وقاعدة الجمع!`,
    points: 35
  };
};

/**
 * تحدي المسائل الكلامية ومواقف الحياة اليومية (حل المشكلات الحياتية)
 */
export const REAL_WORLD_CHALLENGE = {
  id: 'real_world_math',
  title: 'تحدي المسائل الكلامية ومواقف الحياة اليومية 🛒🍎',
  subtitle: 'مسائل واقعية مشوقة بالتسوق، النقود بالشيكل ₪، المسافات، وحل المشكلات الحياتية!',
  icon: '🛒',
  color: '#10b981',
  badge: 'حل مشكلات واقعية 💡',
  levels: [
    { id: 'progressive', name: 'المسار التدريجي الذكي 🚀', desc: 'يبدأ من السهل ويتصاعد تلقائياً كلما حللت مسائل صحيحة!', icon: '📈' },
    { id: 'easy', name: 'رواد التسوق الصغار (سهل 🟢)', desc: 'الصفوف 1-2: نقود وتسوق بسيط بالشيكل ₪، جمع وطرح قصصي ومقارنة', icon: '🍎' },
    { id: 'medium', name: 'أبطال الحياة اليومية (متوسط 🟡)', desc: 'الصفوف 3-4: تسوق متعدد المراحل، توزيع وضرب، محيط حديقة، وكسور', icon: '🛍️' },
    { id: 'hard', name: 'خبراء الاقتصاد والرياضيات (صعب 🔴)', desc: 'الصفوف 5-6: تخفيضات %، سرعة ومسافة، كسور كميات، وحجوم وسعة', icon: '💼' }
  ]
};

/**
 * مولد أسئلة المسائل الكلامية ومواقف الحياة اليومية
 * مبني تدريجياً من السهل إلى الصعب وفق منهاج الرياضيات
 */
export const generateRealWorldMathQuestion = (level = 'progressive', questionIndex = 0) => {
  let effectiveLevel = level;
  if (level === 'progressive') {
    if (questionIndex < 3) effectiveLevel = 'easy';
    else if (questionIndex < 7) effectiveLevel = 'medium';
    else effectiveLevel = 'hard';
  }

  // EASY (الصفوف 1 و 2)
  if (effectiveLevel === 'easy') {
    const caseType = rand(1, 5);

    if (caseType === 1) {
      // تسوق بالشيكل وحساب الباقي من 10 أو 20 أو 50
      const price1 = rand(3, 8);
      const price2 = rand(2, 6);
      const total = price1 + price2;
      const cash = total <= 8 ? 10 : (total <= 16 ? 20 : 50);
      const change = cash - total;

      const itemNames = [
        ['دفتر رسم', 'علبة ألوان'],
        ['ساندويش جبنة', 'عصير برتقال طازج'],
        ['لعبة سيارة صغيرة', 'كرة مطاطية'],
        ['كيس تفاح لذيذ', 'موزة طازجة']
      ][rand(0, 3)];

      return {
        type: 'real_world',
        level: 'easy',
        category: 'التسوق بالنقود ₪ (حساب الباقي)',
        prompt: '🛒 موقف حياتي في المتجر المدرسي:',
        storyText: `اشترت ليلى ${itemNames[0]} بسعر ${price1} ₪، و${itemNames[1]} بسعر ${price2} ₪. دفعت للبائع قطعة نقدية من فئة ${cash} ₪.`,
        questionText: 'كم شيكلاً يجب أن يعيد البائع إلى ليلى؟',
        correctAnswer: `${change} ₪`,
        choices: shuffle([
          `${change} ₪`,
          `${total} ₪`,
          `${Math.max(1, change + 2)} ₪`,
          `${Math.max(0, change - 2)} ₪`
        ]),
        explanation: `خطوات الحل: 1) نحسب مجموع المشتريات: ${price1} + ${price2} = ${total} ₪. 2) نحسب الباقي بطرح المجموع من المبلغ المدفوع: ${cash} - ${total} = ${change} ₪.`,
        points: 20
      };
    }

    if (caseType === 2) {
      // جمع قصصي من الحياة المدرسية
      const boys = rand(11, 25);
      const girls = rand(10, 22);
      const total = boys + girls;

      return {
        type: 'real_world',
        level: 'easy',
        category: 'الجمع في الأنشطة المدرسية',
        prompt: '🏫 موقف في ساحة المدرسة:',
        storyText: `في احتفال يوم التميز بمدرسة مشيرفة، شارك في العرض الرياضي ${boys} طالباً و ${girls} طالبة.`,
        questionText: 'ما هو العدد الكلي للطلاب والطالبات المشاركين في العرض؟',
        correctAnswer: `${total} مشاركاً`,
        choices: shuffle([
          `${total} مشاركاً`,
          `${total - 2} مشاركاً`,
          `${total + 10} مشاركاً`,
          `${Math.abs(boys - girls)} مشاركاً`
        ]),
        explanation: `لإيجاد المجموع الكلي، نجمع عدد الطلاب مع عدد الطالبات: ${boys} + ${girls} = ${total} مشاركاً ومشاركة.`,
        points: 15
      };
    }

    if (caseType === 3) {
      // طرح قصصي (الكرات والبالونات والتوزيع)
      const initial = rand(15, 30);
      const used = rand(6, 12);
      const remaining = initial - used;

      return {
        type: 'real_world',
        level: 'easy',
        category: 'الطرح القصصي وحساب المتبقي',
        prompt: '🎈 موقف الاحتفال بالصف:',
        storyText: `نفخ طلاب الصف ${initial} بالوناً ملوناً لتزيين الصف. وأثناء التزيين فرقعت ${used} بالونات.`,
        questionText: 'كم بالوناً سليماً بقي لتزيين الصف؟',
        correctAnswer: `${remaining} بالونات`,
        choices: shuffle([
          `${remaining} بالونات`,
          `${remaining + 3} بالونات`,
          `${initial + used} بالونات`,
          `${Math.max(1, remaining - 4)} بالونات`
        ]),
        explanation: `نطرح عدد البالونات التي فرقعت من العدد الكلي: ${initial} - ${used} = ${remaining} بالونات متبقية.`,
        points: 15
      };
    }

    if (caseType === 4) {
      // المقارنة القصصية (بكم يزيد؟)
      const countA = rand(16, 35);
      const countB = rand(8, countA - 4);
      const diff = countA - countB;

      return {
        type: 'real_world',
        level: 'easy',
        category: 'المقارنة القصصية (بكم يزيد؟)',
        prompt: '⭐ نجوم التميز والتحفيز:',
        storyText: `جمع سامي ${countA} نجمة تفوق خلال أسبوع القراءة، بينما جمع زميله يوسف ${countB} نجمة.`,
        questionText: 'بكم نجمة يزيد ما جمعه سامي عن يوسف؟',
        correctAnswer: `${diff} نجوم`,
        choices: shuffle([
          `${diff} نجوم`,
          `${countA + countB} نجوم`,
          `${diff + 2} نجوم`,
          `${Math.max(1, diff - 3)} نجوم`
        ]),
        explanation: `لمعرفة مقدار الزيادة أو الفرق، نطرح العدد الأصغر من الأكبر: ${countA} - ${countB} = ${diff} نجوم.`,
        points: 20
      };
    }

    // caseType === 5: الوقت وساعات الحصص المدرسية
    const startHour = rand(8, 11);
    const duration = rand(1, 3);
    const endHour = startHour + duration;

    return {
      type: 'real_world',
      level: 'easy',
      category: 'الوقت والجدول اليومي',
      prompt: '⏰ جدول الأنشطة والرحلات:',
      storyText: `انطلقت حافلة الرحلة المدرسية من مشيرفة في تمام الساعة ${startHour}:00 صباحاً، واستغرقت الطريق ${duration} ساعات للوصول إلى الحديقة الوطنية.`,
      questionText: 'في أي ساعة وصلت الحافلة إلى وجهتها؟',
      correctAnswer: `الساعة ${endHour}:00`,
      choices: shuffle([
        `الساعة ${endHour}:00`,
        `الساعة ${endHour + 1}:00`,
        `الساعة ${endHour - 1}:00`,
        `الساعة 12:00`
      ]),
      explanation: `نضيف ساعات السفر إلى ساعة الانطلاق: ${startHour} + ${duration} = ${endHour}:00 تماماً.`,
      points: 20
    };
  }

  // MEDIUM (الصفوف 3 و 4)
  if (effectiveLevel === 'medium') {
    const caseType = rand(1, 5);

    if (caseType === 1) {
      // تسوق وحساب كميات متعددة (Multiplication & Change)
      const qty = rand(3, 5);
      const unitPrice = rand(6, 12);
      const totalCost = qty * unitPrice;
      const cash = totalCost <= 30 ? 50 : 100;
      const change = cash - totalCost;

      return {
        type: 'real_world',
        level: 'medium',
        category: 'التسوق وحساب التكلفة والباقي ₪',
        prompt: '🛒 التسوق في المكتبة المدرسية:',
        storyText: `اشترى طارق ${qty} دفاتر هندسة متطابقة، سعر الدفتر الواحد ${unitPrice} ₪. وأعطى البائع ورقة نقدية من فئة ${cash} ₪.`,
        questionText: 'كم شيكلاً يجب أن يسترجع طارق من البائع؟',
        correctAnswer: `${change} ₪`,
        choices: shuffle([
          `${change} ₪`,
          `${totalCost} ₪`,
          `${change + 5} ₪`,
          `${Math.max(1, change - 5)} ₪`
        ]),
        explanation: `1) ثمن الدفاتر = ${qty} × ${unitPrice} = ${totalCost} ₪. 2) الباقي = ${cash} - ${totalCost} = ${change} ₪.`,
        points: 25
      };
    }

    if (caseType === 2) {
      // التوزيع بالتساوي والقسمة العادلة
      const boxes = rand(4, 8);
      const perBox = rand(6, 12);
      const totalItems = boxes * perBox;

      return {
        type: 'real_world',
        level: 'medium',
        category: 'التوزيع العادل والقسمة',
        prompt: '📦 تغليف الهدايا المدرسية:',
        storyText: `تبرع فاعل خير بـ ${totalItems} قصة علمية للمدرسة، وقررت إدارة المدرسة توزيعها بالتساوي على ${boxes} صفوف.`,
        questionText: 'كم قصة ستحصل عليها كل غرفة صف؟',
        correctAnswer: `${perBox} قصص`,
        choices: shuffle([
          `${perBox} قصص`,
          `${perBox + 2} قصص`,
          `${perBox - 1} قصص`,
          `${perBox * 2} قصص`
        ]),
        explanation: `نقسم عدد القصص الكلي على عدد الصفوف: ${totalItems} ÷ ${boxes} = ${perBox} قصص لكل صف بالتساوي.`,
        points: 25
      };
    }

    if (caseType === 3) {
      // محيط حديقة أو غرفة وسياج واقعي
      const length = rand(8, 15);
      const width = rand(4, 7);
      const perimeter = 2 * (length + width);

      return {
        type: 'real_world',
        level: 'medium',
        category: 'الهندسة في الحياة الواقعية (المحيط والسياج)',
        prompt: '🏡 حديقة المدرسة الخضراء:',
        storyText: `يريد طاقم الزراعة إحاطة حديقة مستطيلة الشكل بسياج حماية. طول الحديقة ${length} متراً وعرضها ${width} أمتار.`,
        questionText: 'كم متراً من السياج يحتاج الطاقم لإحاطة الحديقة كاملة؟',
        correctAnswer: `${perimeter} متراً`,
        choices: shuffle([
          `${perimeter} متراً`,
          `${length * width} متراً`,
          `${length + width} متراً`,
          `${perimeter + 4} متراً`
        ]),
        explanation: `طول السياج يمثل محيط المستطيل = 2 × (الطول + العرض) = 2 × (${length} + ${width}) = 2 × ${length + width} = ${perimeter} متراً.`,
        points: 30
      };
    }

    if (caseType === 4) {
      // كسور البيتزا والكعك في الحياة الواقعية
      const denom = [6, 8, 10, 12][rand(0, 3)];
      const eaten1 = rand(1, 2);
      const eaten2 = rand(2, 3);
      const totalEaten = eaten1 + eaten2;
      const left = denom - totalEaten;

      return {
        type: 'real_world',
        level: 'medium',
        category: 'الكسور في الحياة اليومية',
        prompt: '🍕 تقاسم وجبة البيتزا مع الأصدقاء:',
        storyText: `قسمت العائلة صينية بيتزا كبيرة إلى ${denom} قطع متساوية. أكل كريم ${eaten1}/${denom} من الصينية، وأكلت أخته رنا ${eaten2}/${denom} منها.`,
        questionText: 'ما هو الكسر الذي يمثل ما تبقى من صينية البيتزا؟',
        correctAnswer: `${left}/${denom}`,
        choices: shuffle([
          `${left}/${denom}`,
          `${totalEaten}/${denom}`,
          `${left}/${denom * 2}`,
          `${Math.max(1, left - 1)}/${denom}`
        ]),
        explanation: `1) مجموع ما أكله الاثنان = ${eaten1}/${denom} + ${eaten2}/${denom} = ${totalEaten}/${denom}. 2) المتبقي = 1 صحيح (${denom}/${denom}) - ${totalEaten}/${denom} = ${left}/${denom}.`,
        points: 30
      };
    }

    // caseType === 5: التوفير الأسبوعي المتكرر
    const savePerWeek = [15, 20, 25, 30][rand(0, 3)];
    const weeks = rand(4, 8);
    const targetPrice = savePerWeek * weeks;

    return {
      type: 'real_world',
      level: 'medium',
      category: 'التوفير وإدارة المصروف الشخصي ₪',
      prompt: '🪙 التوفير والشراء الذكي:',
      storyText: `يدخر علاء ${savePerWeek} ₪ في حصالته كل أسبوع من مصروفه الشخصي لشراء حذاء رياضي جديد. كم شيكلاً يوفر علاء في ${weeks} أسابيع؟`,
      questionText: 'ما هو المبلغ الإجمالي الذي وفره علاء؟',
      correctAnswer: `${targetPrice} ₪`,
      choices: shuffle([
        `${targetPrice} ₪`,
        `${targetPrice + savePerWeek} ₪`,
        `${targetPrice - 10} ₪`,
        `${savePerWeek + weeks} ₪`
      ]),
      explanation: `نضرب مقدار التوفير الأسبوعي في عدد الأسابيع: ${savePerWeek} × ${weeks} = ${targetPrice} ₪.`,
      points: 25
    };
  }

  // HARD (الصفوف 5 و 6)
  const caseType = rand(1, 5);

  if (caseType === 1) {
    // نسبة مئوية وتخفيضات في متجر الملابس والأجهزة
    const originalPrice = [200, 300, 400, 500, 150][rand(0, 4)];
    const discountPct = [10, 20, 25, 50][rand(0, 3)];
    const discountVal = (originalPrice * discountPct) / 100;
    const finalPrice = originalPrice - discountVal;

    return {
      type: 'real_world',
      level: 'hard',
      category: 'النسبة المئوية (%) والتخفيضات التجارية',
      prompt: '🏷️ مهرجان التخفيضات والتسوق الذكي:',
      storyText: `في متجر للأجهزة الإلكترونية، تم الإعلان عن تخفيض بنسبة ${discountPct}% على ساعة ذكية كان سعرها الأصلي ${originalPrice} ₪.`,
      questionText: 'كم يدفع المشتري ثمناً للساعة الذكية بعد التخفيض؟',
      correctAnswer: `${finalPrice} ₪`,
      choices: shuffle([
        `${finalPrice} ₪`,
        `${discountVal} ₪`,
        `${originalPrice - 10} ₪`,
        `${finalPrice + 20} ₪`
      ]),
      explanation: `1) نحسب قيمة التخفيض: (${originalPrice} × ${discountPct}) ÷ 100 = ${discountVal} ₪. 2) السعر بعد التخفيض = ${originalPrice} - ${discountVal} = ${finalPrice} ₪.`,
      points: 35
    };
  }

  if (caseType === 2) {
    // السرعة والمسافة والزمن
    const speed = [60, 70, 80, 90][rand(0, 3)];
    const time1 = 2;
    const dist1 = speed * time1;
    const time2 = rand(3, 5);
    const dist2 = speed * time2;

    return {
      type: 'real_world',
      level: 'hard',
      category: 'السرعة والمسافة والزمن (النسبة والتناسب)',
      prompt: '🚗 رحلة سياحية على الطريق السريع:',
      storyText: `قطعت حافلة سياحية مسافة ${dist1} كم خلال ساعتين (${time1} ساعات) بسرعة ثابتة دون توقف.`,
      questionText: `كم كيلومتراً ستقطع هذه الحافلة خلال ${time2} ساعات إذا واصلت السير بنفس السرعة؟`,
      correctAnswer: `${dist2} كم`,
      choices: shuffle([
        `${dist2} كم`,
        `${dist2 + speed} كم`,
        `${dist2 - 20} كم`,
        `${dist1 + time2} كم`
      ]),
      explanation: `1) سرعة الحافلة في الساعة الواحدة = ${dist1} ÷ ${time1} = ${speed} كم/ساعة. 2) المسافة في ${time2} ساعات = ${speed} × ${time2} = ${dist2} كم.`,
      points: 35
    };
  }

  if (caseType === 3) {
    // كسر من كمية (Fraction of a Quantity in Nature / School)
    const base = [120, 150, 180, 200, 240][rand(0, 4)];
    const num = rand(2, 3);
    const denom = 5;
    const part = (base / denom) * num;
    const remaining = base - part;

    return {
      type: 'real_world',
      level: 'hard',
      category: 'كسر من كمية وتطبيقات بيئية',
      prompt: '🌳 غابة أشجار الزيتون في القرية:',
      storyText: `في مزرعة نموذجية يوجد ${base} شجرة مثمرة. إذا كانت ${num}/${denom} الأشجار هي أشجار زيتون بلدي، وباقي الأشجار هي أشجار لوز.`,
      questionText: 'كم شجرة لوز توجد في المزرعة؟',
      correctAnswer: `${remaining} شجرة لوز`,
      choices: shuffle([
        `${remaining} شجرة لوز`,
        `${part} شجرة لوز`,
        `${remaining + 10} شجرة لوز`,
        `${base / denom} شجرة لوز`
      ]),
      explanation: `1) عدد أشجار الزيتون = (${base} ÷ ${denom}) × ${num} = ${base / denom} × ${num} = ${part} شجرة. 2) عدد أشجار اللوز المتبقية = ${base} - ${part} = ${remaining} شجرة لوز.`,
      points: 35
    };
  }

  if (caseType === 4) {
    // حجم وسعة السوائل وحمامات السباحة
    const l = rand(4, 8);
    const w = rand(3, 5);
    const h = rand(2, 3);
    const vol = l * w * h;

    return {
      type: 'real_world',
      level: 'hard',
      category: 'الحجوم وسعة السوائل (م³)',
      prompt: '🏊‍♂️ مسبح القرية الرياضي:',
      storyText: `خزان مياه مخصص لمسبح مدرسي على شكل شبه مكعب، طول قاعدته ${l} أمتار، عرضه ${w} أمتار، وارتفاعه ${h} أمتار.`,
      questionText: 'ما هو حجم المياه الذي يملأ الخزان بالكامل بوحدة متر مكعب (م³)؟',
      correctAnswer: `${vol} م³`,
      choices: shuffle([
        `${vol} م³`,
        `${2 * (l + w + h)} م³`,
        `${vol + 12} م³`,
        `${vol - 8} م³`
      ]),
      explanation: `حجم شبه المكعب = الطول × العرض × الارتفاع = ${l} × ${w} × ${h} = ${vol} متر مكعب (م³).`,
      points: 30
    };
  }

  // caseType === 5: المعدل الحسابي في الحياة اليومية
  const targetAvg = [85, 88, 90, 92][rand(0, 3)];
  const diffs = [2, -3, 5, -4];
  const s1 = targetAvg + diffs[0];
  const s2 = targetAvg + diffs[1];
  const s3 = targetAvg + diffs[2];
  const s4 = targetAvg + diffs[3];

  return {
    type: 'real_world',
    level: 'hard',
    category: 'المعدل الحسابي في الحياة اليومية',
    prompt: '🎯 نتائج دوري المسابقات العلمية:',
    storyText: `حصل فريق مدرسة مشيرفة في 4 جولات من أولمبياد العلوم على العلامات التالية: ${s1}، ${s2}، ${s3}، و ${s4}.`,
    questionText: 'ما هو المعدل الحسابي لعلامات الفريق في الجولات الأربع؟',
    correctAnswer: `${targetAvg}`,
    choices: shuffle([
      `${targetAvg}`,
      `${targetAvg + 3}`,
      `${targetAvg - 2}`,
      `${targetAvg + 5}`
    ]),
    explanation: `المعدل الحسابي = مجموع العلامات ÷ عدد الجولات = (${s1} + ${s2} + ${s3} + ${s4}) ÷ 4 = ${targetAvg * 4} ÷ 4 = ${targetAvg}.`,
    points: 35
  };
};

/**
 * تحدي ترتيب العمليات الحسابية والرمز المفقود (PEMDAS & Operations Mastery)
 */
export const PEMDAS_CHALLENGE = {
  id: 'pemdas_challenge',
  title: 'تحدي ترتيب العمليات الحسابية والرمز المفقود 🧠⚡',
  subtitle: 'أتقن أسبقية العمليات والأقواس، واكتشف الإشارة أو العدد المفقود بمهارة فائقة!',
  icon: '🧠',
  color: '#8b5cf6',
  badge: 'ترتيب العمليات والأقواس 🎯',
  levels: [
    { id: 'progressive', name: 'المسار التدريجي الذكي 🚀', desc: 'تدرج فوري من الرمز المفقود (1-2) إلى أسبقية الضرب (3-4) ثم معادلات الأقواس (5-6)', icon: '📈' },
    { id: 'easy', name: 'رواد العمليات والرمز المفقود (سهل 🟢)', desc: 'الصفوف 1-2: إشارة الجمع والطرح الناقصة، العدد المفقود ▢، وميزان المعادلات', icon: '➕' },
    { id: 'medium', name: 'فرسان الترتيب والأقواس (متوسط 🟡)', desc: 'الصفوف 3-4: أسبقية الضرب والقسمة قبل الجمع، والأقواس ( ) والرمز المفقود', icon: '✖️' },
    { id: 'hard', name: 'عباقرة المعادلات المركبة (صعب 🔴)', desc: 'الصفوف 5-6: أين تضع القوسين؟ وسلاسل العمليات المتشابكة مع كسور وأعداد عشرية', icon: '💡' }
  ]
};

export const generatePemdasQuestion = (level = 'progressive', questionIndex = 0) => {
  let effectiveLevel = level;
  if (level === 'progressive') {
    if (questionIndex < 3) effectiveLevel = 'easy';
    else if (questionIndex < 7) effectiveLevel = 'medium';
    else effectiveLevel = 'hard';
  }

  // ==========================================
  // EASY (الصفوف 1 و 2)
  // ==========================================
  if (effectiveLevel === 'easy') {
    const caseType = rand(1, 5);

    if (caseType === 1) {
      // الرمز الحسابي المفقود (+ أو -)
      const isAdd = Math.random() < 0.5;
      const a = rand(6, 18);
      const b = rand(2, 9);
      const result = isAdd ? a + b : a - b;

      return {
        type: 'pemdas',
        level: 'easy',
        category: 'الرمز الحسابي المفقود ◯',
        prompt: 'ما هي الإشارة الحسابية الصحيحة التي يجب وضعها مكان الدائرة ◯؟',
        equation: `${a} ◯ ${b} = ${result}`,
        questionText: `${a} ◯ ${b} = ${result}`,
        correctAnswer: isAdd ? '+' : '-',
        choices: ['+', '-', '×', '÷'],
        explanation: isAdd 
          ? `نضع إشارة الجمع (+): لأن ${a} + ${b} = ${result}.`
          : `نضع إشارة الطرح (-): لأن ${a} - ${b} = ${result}.`,
        points: 15
      };
    }

    if (caseType === 2) {
      // العدد المفقود في الجمع
      const a = rand(5, 25);
      const missing = rand(4, 15);
      const sum = a + missing;
      const hideFirst = Math.random() < 0.5;
      const eq = hideFirst ? `▢ + ${a} = ${sum}` : `${a} + ▢ = ${sum}`;

      return {
        type: 'pemdas',
        level: 'easy',
        category: 'العدد المفقود في الجمع ▢',
        prompt: 'ما هو العدد الذي يجب وضعه في المربع ▢ لتكون المعادلة صحيحة؟',
        equation: eq,
        questionText: eq,
        correctAnswer: `${missing}`,
        choices: shuffle([
          `${missing}`,
          `${missing + rand(1, 3)}`,
          `${Math.max(1, missing - rand(1, 3))}`,
          `${sum}`
        ]),
        explanation: `لحساب المجهول نطرح: ${sum} - ${a} = ${missing}. إذن ▢ = ${missing}.`,
        points: 15
      };
    }

    if (caseType === 3) {
      // العدد المفقود في الطرح
      const result = rand(5, 16);
      const sub = rand(3, 12);
      const total = result + sub;
      const eq = `${total} - ▢ = ${result}`;

      return {
        type: 'pemdas',
        level: 'easy',
        category: 'العدد المفقود في الطرح ▢',
        prompt: 'ما هو العدد الناقص داخل المربع ▢؟',
        equation: eq,
        questionText: eq,
        correctAnswer: `${sub}`,
        choices: shuffle([
          `${sub}`,
          `${sub + 2}`,
          `${Math.max(1, sub - 2)}`,
          `${total}`
        ]),
        explanation: `لحساب المطروح: ${total} - ${result} = ${sub}. إذن ▢ = ${sub}.`,
        points: 15
      };
    }

    if (caseType === 4) {
      // ميزان المعادلات (كفتا التوازن)
      const a = rand(4, 12);
      const b = rand(3, 9);
      const sum = a + b;
      const c = rand(2, sum - 2);
      const missing = sum - c;

      return {
        type: 'pemdas',
        level: 'easy',
        category: 'ميزان المعادلات وتساوي الطرفين ⚖️',
        prompt: 'وازن بين الطرفين: ما هو العدد الذي يجعل الكفتين متساويتين؟',
        equation: `${a} + ${b} = ${c} + ▢`,
        questionText: `${a} + ${b} = ${c} + ▢`,
        correctAnswer: `${missing}`,
        choices: shuffle([
          `${missing}`,
          `${missing + 1}`,
          `${Math.max(1, missing - 2)}`,
          `${sum}`
        ]),
        explanation: `الطرف الأيمن = ${a} + ${b} = ${sum}. ولكي يصبح الطرف الأيسر مساوياً لـ ${sum}: نحتاج ${c} + ${missing} = ${sum}. إذن ▢ = ${missing}.`,
        points: 20
      };
    }

    // caseType === 5: سلسلة جمع وطرح من 3 أعداد
    const a = rand(10, 25);
    const b = rand(3, 8);
    const c = rand(2, 6);
    const result = a - b + c;

    return {
      type: 'pemdas',
      level: 'easy',
      category: 'سلسلة العمليات المتتالية',
      prompt: 'احسب بالترتيب من اليسار إلى اليمين:',
      equation: `${a} - ${b} + ${c} = ؟`,
      questionText: `${a} - ${b} + ${c} = ؟`,
      correctAnswer: `${result}`,
      choices: shuffle([
        `${result}`,
        `${a - (b + c)}`,
        `${result + 2}`,
        `${result - 3}`
      ]),
      explanation: `في الجمع والطرح فقط نحسب بالترتيب من اليسار لليمين: أولاً ${a} - ${b} = ${a - b}، ثم نضيف ${c}: ${a - b} + ${c} = ${result}.`,
      points: 15
    };
  }

  // ==========================================
  // MEDIUM (الصفوف 3 و 4)
  // ==========================================
  if (effectiveLevel === 'medium') {
    const caseType = rand(1, 5);

    if (caseType === 1) {
      // أسبقية الضرب على الجمع: a + b × c
      const a = rand(3, 10);
      const b = rand(2, 7);
      const c = rand(2, 6);
      const mult = b * c;
      const correct = a + mult;
      const wrong = (a + b) * c;

      return {
        type: 'pemdas',
        level: 'medium',
        category: 'أسبقية الضرب على الجمع (PEMDAS)',
        prompt: 'طبق قواعد ترتيب العمليات الحسابية واحسب الناتج:',
        equation: `${a} + ${b} × ${c} = ؟`,
        questionText: `${a} + ${b} × ${c} = ؟`,
        correctAnswer: `${correct}`,
        choices: shuffle([
          `${correct}`,
          `${wrong}`,
          `${correct + 2}`,
          `${mult}`
        ]),
        explanation: `قاعدة ذهبية: الضرب يسبق الجمع دائماً! أولاً نحسب الضرب: ${b} × ${c} = ${mult}، ثم نجمع: ${a} + ${mult} = ${correct}. (احذر من جمع ${a} + ${b} أولاً!).`,
        points: 25
      };
    }

    if (caseType === 2) {
      // أسبقية القسمة على الطرح: a - b ÷ c
      const divisor = rand(2, 6);
      const quotient = rand(2, 7);
      const b = divisor * quotient;
      const a = b + rand(5, 20);
      const correct = a - quotient;
      const wrong = Math.floor((a - b) / divisor);

      return {
        type: 'pemdas',
        level: 'medium',
        category: 'أسبقية القسمة على الطرح',
        prompt: 'احسب بدقة وفق ترتيب العمليات:',
        equation: `${a} - ${b} ÷ ${divisor} = ؟`,
        questionText: `${a} - ${b} ÷ ${divisor} = ؟`,
        correctAnswer: `${correct}`,
        choices: shuffle([
          `${correct}`,
          `${wrong}`,
          `${correct + 3}`,
          `${a - b}`
        ]),
        explanation: `القسمة تسبق الطرح! أولاً: ${b} ÷ ${divisor} = ${quotient}. ثانياً: ${a} - ${quotient} = ${correct}.`,
        points: 25
      };
    }

    if (caseType === 3) {
      // قوة الأقواس: الأقواس تكسر الترتيب المعتاد!
      const a = rand(2, 8);
      const b = rand(2, 7);
      const c = rand(2, 6);
      const parenSum = a + b;
      const correct = parenSum * c;
      const wrong = a + (b * c);

      return {
        type: 'pemdas',
        level: 'medium',
        category: 'أسبقية ما بين الأقواس ( )',
        prompt: 'ما ناتج المعادلة بوجود الأقواس؟',
        equation: `(${a} + ${b}) × ${c} = ؟`,
        questionText: `(${a} + ${b}) × ${c} = ؟`,
        correctAnswer: `${correct}`,
        choices: shuffle([
          `${correct}`,
          `${wrong}`,
          `${correct + c}`,
          `${parenSum + c}`
        ]),
        explanation: `الأقواس تأتي في المرتبة الأولى دائماً! ما بين القوسين أولاً: (${a} + ${b} = ${parenSum})، ثم نضرب في ${c}: ${parenSum} × ${c} = ${correct}.`,
        points: 25
      };
    }

    if (caseType === 4) {
      // اكتشف الرمز المفقود بين الضرب والجمع
      const a = rand(3, 8);
      const b = rand(2, 6);
      const c = rand(4, 12);
      const res = a * b + c;

      return {
        type: 'pemdas',
        level: 'medium',
        category: 'اكتشاف رمز العملية المفقود',
        prompt: 'ما هي الإشارة المناسبة مكان ◯ لتتساوى المعادلة؟',
        equation: `${a} ◯ ${b} + ${c} = ${res}`,
        questionText: `${a} ◯ ${b} + ${c} = ${res}`,
        correctAnswer: '×',
        choices: ['×', '+', '-', '÷'],
        explanation: `الإشارة الصحيحة هي (×): لأن الضرب أولاً: ${a} × ${b} = ${a * b}، ثم + ${c} = ${res}.`,
        points: 25
      };
    }

    // caseType === 5: ضرب وقسمة متتاليان (من اليسار إلى اليمين)
    const mult = rand(2, 6);
    const div = mult;
    const a = rand(3, 9);
    const b = mult;
    const c = div;
    const correct = (a * b) / c;

    return {
      type: 'pemdas',
      level: 'medium',
      category: 'تساوي رتبة الضرب والقسمة',
      prompt: 'عند تساوي الرتبة (ضرب وقسمة معاً)، من أين نبدأ؟',
      equation: `${a} × ${b} ÷ ${c} = ؟`,
      questionText: `${a} × ${b} ÷ ${c} = ؟`,
      correctAnswer: `${correct}`,
      choices: shuffle([
        `${correct}`,
        `${correct * 2}`,
        `${a + b}`,
        `${Math.max(1, correct - 1)}`
      ]),
      explanation: `الضرب والقسمة لهما نفس الرتبة والأسبقية، لذا نحل بالترتيب من اليسار لليمين: ${a} × ${b} = ${a * b}، ثم ${a * b} ÷ ${c} = ${correct}.`,
      points: 25
    };
  }

  // ==========================================
  // HARD (الصفوف 5 و 6)
  // ==========================================
  const caseType = rand(1, 5);

  if (caseType === 1) {
    // لغز: أين يجب وضع القوسين؟
    const a = rand(2, 6);
    const b = rand(3, 7);
    const c = rand(2, 5);
    const target = (a + b) * c;

    return {
      type: 'pemdas',
      level: 'hard',
      category: 'لغز تحديد مكان الأقواس ( )',
      prompt: 'أين يجب وضع القوسين في الطرف الأيسر لجعل المعادلة صحيحة؟',
      equation: `${a} + ${b} × ${c} = ${target}`,
      questionText: `أين نضع القوسين في: ${a} + ${b} × ${c} = ${target}؟`,
      correctAnswer: `(${a} + ${b}) × ${c}`,
      choices: shuffle([
        `(${a} + ${b}) × ${c}`,
        `${a} + (${b} × ${c})`,
        `(${a} + ${b} × ${c})`,
        `لا حاجة لأقواس`
      ]),
      explanation: `بدون أقواس: ${a} + (${b} × ${c}) = ${a + b * c} (لا يساوي ${target}). أما بوضع القوسين حول الجمع: (${a} + ${b}) × ${c} = ${a + b} × ${c} = ${target}!`,
      points: 35
    };
  }

  if (caseType === 2) {
    // معادلة مركبة متعددة المراحل مع أقواس
    const a = rand(2, 5);
    const b = rand(4, 8);
    const innerAdd = rand(2, 6);
    const innerMult = a * b;
    const parenVal = innerMult + innerAdd;
    const divisor = [2, 3, 4, 5].find(d => parenVal % d === 0) || 1;
    const divResult = parenVal / divisor;
    const start = divResult + rand(10, 30);
    const finalResult = start - divResult;

    return {
      type: 'pemdas',
      level: 'hard',
      category: 'العمليات المركبة والأقواس المتعددة',
      prompt: 'احسب ناتج التعبير الحسابي المركب وفق الترتيب القياسي:',
      equation: `${start} - (${a} × ${b} + ${innerAdd}) ÷ ${divisor} = ؟`,
      questionText: `${start} - (${a} × ${b} + ${innerAdd}) ÷ ${divisor} = ؟`,
      correctAnswer: `${finalResult}`,
      choices: shuffle([
        `${finalResult}`,
        `${finalResult + divisor}`,
        `${start - innerMult}`,
        `${finalResult - 5}`
      ]),
      explanation: `الخطوات: 1) داخل القوسين نبدأ بالضرب: ${a} × ${b} = ${innerMult}. 2) نجمع داخل القوس: ${innerMult} + ${innerAdd} = ${parenVal}. 3) نقسم: ${parenVal} ÷ ${divisor} = ${divResult}. 4) وأخيراً نطرح: ${start} - ${divResult} = ${finalResult}.`,
      points: 35
    };
  }

  if (caseType === 3) {
    // لغز الرمزين المفقودين ◯ ... ◯
    const a = rand(3, 7);
    const b = rand(2, 5);
    const c = rand(4, 15);
    const res = a * b + c;

    return {
      type: 'pemdas',
      level: 'hard',
      category: 'لغز الإشارتين المفقودتين ◯ و ◯',
      prompt: 'ما هما الإشارتان الحسابيتان اللتان تجعلان العبارة صحيحة بالترتيب؟',
      equation: `${a} ◯ ${b} ◯ ${c} = ${res}`,
      questionText: `${a} ◯ ${b} ◯ ${c} = ${res}`,
      correctAnswer: '× ثم +',
      choices: shuffle([
        '× ثم +',
        '+ ثم ×',
        '- ثم ×',
        '÷ ثم +'
      ]),
      explanation: `الإشارتان هما (× ثم +): لأن ${a} × ${b} + ${c} = ${a * b} + ${c} = ${res}. بينما لو كانت (+ ثم ×) لكان الناتج ${a} + ${b * c} = ${a + b * c}.`,
      points: 35
    };
  }

  if (caseType === 4) {
    // ترتيب عمليات مع كسور أو أعداد عشرية
    const dec = [0.5, 0.25, 0.2, 0.4][rand(0, 3)];
    const multInt = [8, 12, 16, 20][rand(0, 3)];
    const decProduct = dec * multInt;
    const addInt = rand(5, 15);
    const total = decProduct + addInt;

    return {
      type: 'pemdas',
      level: 'hard',
      category: 'ترتيب العمليات مع الأعداد العشرية',
      prompt: 'احسب بدقة متناهية مراعياً قواعد الترتيب:',
      equation: `${addInt} + ${dec} × ${multInt} = ؟`,
      questionText: `${addInt} + ${dec} × ${multInt} = ؟`,
      correctAnswer: `${total}`,
      choices: shuffle([
        `${total}`,
        `${(addInt + dec) * multInt}`,
        `${total + 2}`,
        `${addInt + multInt}`
      ]),
      explanation: `الضرب يسبق الجمع: أولاً نضرب ${dec} × ${multInt} = ${decProduct}. ثانياً نجمع: ${addInt} + ${decProduct} = ${total}.`,
      points: 35
    };
  }

  // caseType === 5: قوسان متتاليان ( ) × ( )
  const a = rand(5, 12);
  const b = rand(2, 4);
  const c = rand(6, 15);
  const d = rand(2, 5);
  const paren1 = a + b;
  const paren2 = c - d;
  const finalVal = paren1 * paren2;

  return {
    type: 'pemdas',
    level: 'hard',
    category: 'ضرب ناتجي قوسين: ( ) × ( )',
    prompt: 'ما ناتج ضرب القوسين معاً؟',
    equation: `(${a} + ${b}) × (${c} - ${d}) = ؟`,
    questionText: `(${a} + ${b}) × (${c} - ${d}) = ؟`,
    correctAnswer: `${finalVal}`,
    choices: shuffle([
      `${finalVal}`,
      `${paren1 + paren2}`,
      `${finalVal + 10}`,
      `${a * c - b * d}`
    ]),
    explanation: `الأقواس أولاً: القوس الأول (${a} + ${b} = ${paren1}). القوس الثاني (${c} - ${d} = ${paren2}). وأخيراً نضرب الناتجين: ${paren1} × ${paren2} = ${finalVal}.`,
    points: 35
  };
};
