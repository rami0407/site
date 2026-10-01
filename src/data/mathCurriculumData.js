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
