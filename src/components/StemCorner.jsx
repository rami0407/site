import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { getStudentSession } from '../utils/studentAuth';
import { generateStemSolutionIdeas, askSocraticStemMentor, guideSteamStationAI } from '../utils/aiService';
import { getScientificResearchVisibility, subscribeScientificResearchVisibility } from '../utils/pageVisibilityService';
import './StemCorner.css';

const STEAM_HUB_PRESETS = {
  bag: {
    id: 'bag',
    title: '🎒 تحدي الحقيبة الثقيلة',
    category: 'صحة وهندسة',
    problemDescription: 'نلاحظ أن حقائب الطلاب في المدرسة ثقيلة جداً وتتجاوز أحياناً 5 كغم بسبب حمل جميع الكتب والدفاتر والمستلزمات يومياً.',
    whyItIsAProblem: 'لأن الوزن الزائد يسبب إجهاداً مستمراً للعمود الفقري وتقوس الظهر وآلاماً للطلاب الصغار، مما يؤثر على نموهم السليم وتركيزهم الدراسي ويشعرهم بالإرهاق.',
    whoIsAffected: 'طلاب الصفوف الابتدائية وأهاليهم أثناء الذهاب والعودة.',
    whereAndWhen: 'يومياً عند الصباح وظهراً، وخاصة أثناء صعود أدراج المدرسة.',
    scienceAspect: 'دراسة تأثير قوى الجاذبية وعزم القوة وتوزيع مركز الثقل على فقرات الظهر وعضلات الكتف.',
    techAspect: 'حساس وزن إلكتروني أو تطبيق جدول مدرسي ذكي يحدد الكتب المطلوبة لليوم فقط.',
    engineeringAspect: 'تصميم هيكل خفيف مع عجلات ثلاثية لصعود الدرج، وتقسيم الحجرات هندسياً لتوزيع الثقل على الحوض.',
    artsAspect: 'تصميم شعار وبوستر توعوي جذاب: "ظهر سليم لعقل عليم"، وإلقاء مقنع في دقيقة واحدة.',
    mathAspect: 'حساب نسبة وزن الحقيبة إلى وزن الطالب (يجب ألا تزيد عن 10%-15%)، وحساب وزن الكتب لكل حصة.'
  },
  water: {
    id: 'water',
    title: '💧 تحدي ترشيد مياه المغاسل',
    category: 'بيئة وتكنولوجيا',
    problemDescription: 'ترك بعض صنابير المغاسل مفتوحة أو عدم إغلاقها بإحكام أثناء الاستراحة مما يتسبب في هدر مستمر للمياه.',
    whyItIsAProblem: 'لأن هدر المياه يضيع ثروة طبيعية ثمينة، ويزيد فاتورة المدرسة، ويسبب تجمع المياه على الأرض مما قد يؤدي لانزلاق الطلاب وتكاثر الرطوبة.',
    whoIsAffected: 'جميع طلاب المدرسة وطاقم النظافة وإدارة المدرسة.',
    whereAndWhen: 'في مغاسل ساحة المدرسة والممرات أثناء استراحة الفطور وبعد حصص الرياضة.',
    scienceAspect: 'مفهوم ضغط وتدفق السوائل، والخاصية الشعرية، وحفظ الموارد الطبيعية ودورة الماء.',
    techAspect: 'حساس حركة يعمل بالأشعة تحت الحمراء أو صمام مؤقت يغلق الماء تلقائياً بعد 7 ثوانٍ.',
    engineeringAspect: 'تصميم فوهة صنبور ميكانيكية تمزج الماء بالهواء لتقليل الاستهلاك بنسبة 50% دون إضعاف التدفق.',
    artsAspect: 'رسوم جدارية وملصقات تشجيعية ملونة بجانب كل صنبور: "كل قطرة ماء تصنع مستقبلاً".',
    mathAspect: 'حساب كمية الماء المهدورة باللتر في الدقيقة، وحساب إجمالي التوفير الشهري باللترات والشواكل.'
  },
  power: {
    id: 'power',
    title: '💡 تحدي توفير إضاءة الصفوف',
    category: 'طاقة وفيزياء',
    problemDescription: 'ترك المصابيح والمكيفات تعمل في الصفوف الفارغة عند خروج الطلاب للساحة أو لحصص الرياضة رغم وجود ضوء الشمس الكافي.',
    whyItIsAProblem: 'استهلاك غير مبرر للطاقة الكهربائية، وارتفاع تكاليف المدرسة، وانبعاثات كربونية تؤثر على البيئة وتلف المصابيح سريعاً.',
    whoIsAffected: 'المدرسة والبيئة المحيطة والأجيال القادمة.',
    whereAndWhen: 'في غرف الصفوف أثناء حصص الرياضة والاستراحة ونهاية الدوام.',
    scienceAspect: 'تحولات الطاقة الكهربائية إلى طاقة ضوئية وحرارية، وتأثير شدة الضوء الطبيعي (Lux).',
    techAspect: 'حساس إضاءة نهارية (LDR) وحساس حركة (PIR) لفصل الإضاءة أوتوماتيكياً عند خلو الصف.',
    engineeringAspect: 'إعادة توزيع زوايا العاكسات الضوئية للنوافذ للاستفادة القصوى من ضوء الشمس الطبيعي.',
    artsAspect: 'تصميم رمز تعبيري ضاحك عند إطفاء النور، وملصقات "سفير الطاقة الصفّي".',
    mathAspect: 'حساب عدد الكيلوواط الساعي المستهلك، ونسبة التوفير المئوية، والمبلغ المالي الموفر سنوياً.'
  },
  noise: {
    id: 'noise',
    title: '🔇 تحدي تقليل ضوضاء الكراسي',
    category: 'فيزياء وبيئة تعلم',
    problemDescription: 'صدور أصوات صرير حادة ومزعجة عند سحب الكراسي والطاولات على أرضية الصف أثناء الحصص.',
    whyItIsAProblem: 'تشتيت انتباه الطلاب والمعلمين، وإزعاج الصفوف المجاورة، وتآكل أرضية الصف وخلق بيئة صفية متوترة تعيق الاستيعاب.',
    whoIsAffected: 'الطلاب والمعلمون أثناء الحصص الدراسية والامتحانات.',
    whereAndWhen: 'داخل الغرف الصفية طوال اليوم الدراسي عند القيام والجلوس وتغيير المجموعات.',
    scienceAspect: 'علم الصوتيات وتردد الموجات، وقوى الاحتكاك بين المعادن والبلاط وكيفية امتصاص الاهتزاز.',
    techAspect: 'تطبيق قياس الديسيبل (Sound Meter) على الهاتف الذكي لقياس شدة الضوضاء قبل وبعد الحل.',
    engineeringAspect: 'تصميم وسادات كواتم صوت كروية من خامات معاد تدويرها (كرات تنس أو لباد سيليكوني) تثبت بأرجل الكراسي.',
    artsAspect: 'تلوين وتزيين أرجل الكراسي بتصميمات بهيجة تجعل الصف أكثر جمالاً وهدوءاً.',
    mathAspect: 'قياس قطر أرجل الكراسي بالمليمتر، وحساب عدد الكراسي في المدرسة (مثلاً 500 كرسي × 4 أرجل = 2000 قطعة).'
  },
  custom: {
    id: 'custom',
    title: '✨ مشكلة جديدة ألاحظها في مدرستي',
    category: 'ابتكار حر',
    problemDescription: '',
    whyItIsAProblem: '',
    whoIsAffected: '',
    whereAndWhen: '',
    scienceAspect: '',
    techAspect: '',
    engineeringAspect: '',
    artsAspect: '',
    mathAspect: ''
  }
};

const DEFAULT_CHALLENGES = [
  {
    id: 'bag',
    title: '🎒 تحدي الحقيبة الثقيلة',
    icon: 'fa-suitcase-rolling',
    color: '#3a86ff',
    desc: 'كيف يمكننا تصميم حقيبة إلكترونية أو جدول ذكي يقلل وزن الكتب اليومي لحماية ظهر الطالب؟',
    category: 'هندسة وصحة',
    question: 'كيف يمكننا تصميم حقيبة إلكترونية أو نظام جدول ذكي يقلل وزن الكتب المدرسية للحفاظ على صحة ظهر الطالب؟',
    realProblem: 'يشكو الكثير من الطلاب من ألم في الظهر بسبب الوزن الزائد للحقيبة المدرسية نتيجة حمل جميع الكتب والدفاتر يومياً.',
    studentMission: 'تصميم حل هندسي أو تكنولوجي لتقليل وزن الحقيبة المدرسية للحفاظ على صحة الظهر.',
    suggestedIdeas: [
      'تصميم جدول زمني ذكي ومعدل يضمن عدم إحضار نفس الدفتر يومياً.',
      'اقتراح تصميم حقيبة ذات عجلات ذكية أو نظام توزيع وزن مريح للظهر.',
      'فكرة "الكتب الرقمية الثنائية" (نسخة ورقية في البيت ونسخة رقمية في المدرسة).'
    ]
  },
  {
    id: 'water',
    title: '💧 تحدي ترشيد مياه المغاسل',
    icon: 'fa-faucet-drip',
    color: '#00b4d8',
    desc: 'كيف نبتكر صنبوراً ذكياً أو حسّاساً يمنع هدر المياه في صنابير مدرسة مشيرفة؟',
    category: 'تكنولوجيا وبيئة',
    question: 'كيف يمكننا إبتكار نظام ذكي أو حساس يمنع هدر المياه في صنابير المدرسة أثناء الاستراحة؟',
    realProblem: 'ملاحظة هدر كميات كبيرة من المياه في صنابير المدرسة أثناء استراحة الفطور نتيجة عدم إغلاقها جيداً.',
    studentMission: 'ابتكار نظام ذكي أو حساس يمنع هدر المياه في صنابير المدرسة.',
    suggestedIdeas: [
      'تصميم صنبور يعمل بالحساسات الإلكترونية (Motion Sensor).',
      'تركيب قطعة توفير مياه ميكانيكية بسيطة تقلل تدفق المياه دون إضعافه.',
      'حملة توعوية مرئية بجانب المغاسل مع رسومات توضيحية.'
    ]
  },
  {
    id: 'power',
    title: '💡 تحدي توفير إضاءة الصفوف',
    icon: 'fa-lightbulb',
    color: '#ffb703',
    desc: 'كيف نضمن إطفاء الإضاءة والمكيفات تلقائياً عند مغادرة الصف أو وجود ضوء الشمس؟',
    category: 'طاقة وتكنولوجيا',
    question: 'كيف يمكننا ضمان إطفاء الأجهزة والأنوار تلقائياً عند مغادرة الصف أو وجود ضوء شمس كافٍ؟',
    realProblem: 'ترك الأضواء والمكيفات تعمل في الصفوف رغم خروج الطلاب منها أو توفر إضاءة شمسية كافية.',
    studentMission: 'ضمان إطفاء الأجهزة والأنوار تلقائياً عند المغادرة أو عند توفر ضوء الشمس الكافي.',
    suggestedIdeas: [
      'اقتراح حساس حركة يفصل الكهرباء بعد خروج آخر طالب بدقائق.',
      'تصميم نظام إشارات أو مسؤول طاقة صفّي مسؤول عن فحص الصف قبل المغادرة.'
    ]
  },
  {
    id: 'noise',
    title: '🔇 تحدي تقليل ضوضاء الكراسي',
    icon: 'fa-volume-xmark',
    color: '#7209b7',
    desc: 'كيف نبتكر أغطية صديقة للبيئة لأرجل الطاولات والكراسي لمنع الإزعاج في الصفوف؟',
    category: 'تصميم وهندسة',
    question: 'كيف يمكننا ابتكار أغطية صديقة للبيئة لأرجل الطاولات والكراسي لمنع الإزعاج والضوضاء داخل الصفوف؟',
    realProblem: 'الصوت المزعج الصادر عن احتكاك أرجل الطاولات والكراسي بالأرضية أثناء الحركة داخل الصفوف.',
    studentMission: 'ابتكار أغطية صديقة للبيئة لأرجل الطاولات والكراسي لمنع الإزعاج الصوتي.',
    suggestedIdeas: [
      'استخدام مواد معاد استخدامها (مثل كرات التنس القديمة أو الأغطية المطاطية) لتغليف أسفل أرجل الكراسي.',
      'تصميم قطع سيليكون هندسية ممتصة للصدمات والصوت.'
    ]
  },
  {
    id: 'recycle',
    title: '♻️ تحدي إعادة تدوير البلاستيك',
    icon: 'fa-recycle',
    color: '#38b000',
    desc: 'كيف نستفيد من علب البلاستيك والورق المستعمل وصنع مجسمات وأدوات مفيدة للمدرسة؟',
    category: 'بيئة وابتكار',
    question: 'كيف يمكننا الاستفادة من مخلفات علب البلاستيك والورق المستعمل لصنع أدوات ومجسمات مفيدة للمدرسة؟',
    realProblem: 'تراكم علب البلاستيك والأوراق المستعملة في المدرسة بعد استراحة الفطور.',
    studentMission: 'الاستفادة من المخلفات لصنع مجسمات وأدوات مفيدة للمدرسة والبيئة.',
    suggestedIdeas: [
      'تحويل زجاجات البلاستيك إلى أواني زراعية لحديقة المدرسة.',
      'صنع أدوات تنظيميّة للمكتب من الكرتون والبلاستيك المعاد تدويره.'
    ]
  },
  {
    id: 'agri',
    title: '🌱 تحدي الزراعة الذكية',
    icon: 'fa-seedling',
    color: '#10b981',
    desc: 'كيف يمكننا تصميم نظام سقي نباتات ذكي أو حديقة صغيرة في المدرسة تعتمد على ظروف الطقس وتوفر المياه؟',
    category: 'هندسة زراعية وبيئة',
    question: 'كيف يمكننا تصميم نظام سقي نباتات ذكي أو حديقة مدرسية صغيرة تعتمد على ظروف الطقس وتوفر الجهد والماء؟',
    realProblem: 'الحاجة لمساحات خضراء في المدرسة وطريقة العناية بها دون إهدار للجهد والماء.',
    studentMission: 'تصميم نظام سقي نباتات ذكي أو حديقة صغيرة تعتمد على ظروف الطقس وتوفر المياه.',
    suggestedIdeas: [
      'نظام ري بالتنقيط مبني بأدوات بسيطة (أنابيب بلاستيكية وزجاجات).',
      'ربط الحديقة بجدول سقي جماعي موزع على الطلاب كمسؤوليات دورية.'
    ]
  },
  {
    id: 'canteen',
    title: '🍎 تحدي المقصف الصديق للبيئة',
    icon: 'fa-apple-whole',
    color: '#ef4444',
    desc: 'كيف نصمم نظاماً رقمياً أو طريقة ذكية لتقليل النفايات البلاستيكية وأغلفة الشيبس والحلويات المتناثرة في ساحة المدرسة بعد استراحة الفطور؟',
    category: 'تكنولوجيا وبيئة',
    question: 'كيف يمكننا تصميم نظام رقمي أو طريقة ذكية لتقليل النفايات البلاستيكية وأغلفة الأطعمة في ساحة المدرسة؟',
    realProblem: 'كثرة مخلفات أكياس الشيبس والحلويات البلاستيكية المتناثرة في ساحة المدرسة بعد استراحة الفطور.',
    studentMission: 'تصميم نظام رقمي أو طريقة ذكية لتقليل النفايات البلاستيكية في ساحة المدرسة.',
    suggestedIdeas: [
      'مبادرة "العلبة القابلة لإعادة الاستخدام" لشراء الأغذية والمأكولات.',
      'تصميم نظام نقاط وتحفيز للطلاب الذين يجمعون أكبر قدر من النفايات البلاستيكية لإعادة تدويرها.'
    ]
  },
  {
    id: 'custom',
    title: '🌟 تحدي ابتكر تحديك الخاص (مفتوح)',
    icon: 'fa-wand-magic-sparkles',
    color: '#a855f7',
    desc: 'لديك مشكلة أو فكرة مبتكرة أخرى ترغب في حلها؟ اكتب مشكلتك الخاصة وفكرتك الهندسية والعلمية لحلها بحرية تامة!',
    category: 'مبتكر مفتوح',
    question: 'كيف يمكننا حل المشكلة الخاصة التي اخترتها وتوظيف مهارات الـ STEM لحلها بحرية تامة؟',
    realProblem: 'وجود مشكلات أخرى في المدرسة أو البيت لم يتم ذكرها في القائمة يرغب الطالب في حلها.',
    studentMission: 'طرح مشكلة خاصة يختارها الطالب بنفسه وتوظيف مهارات الـ STEM لحلها بحرية تامة!',
    suggestedIdeas: [
      'ابتكار جهاز آلي لتنظيف السبورة الصفية.',
      'نظام تذكير صوتي ذكي بالحصة القادمة والواجبات.',
      'أي فكرة هندسية أو علمية جديدة تخطر ببالك!'
    ]
  }
];

const DEFAULT_EXPERIMENTS = [
  {
    id: 1,
    title: '🌋 بركان البيكنج صودا الفوار',
    icon: 'fa-volcano',
    difficulty: 'سهل وممتع 🟢',
    items: ['بيكنج صودا (بيكربونات الصوديوم)', 'خل طعام', 'كوب بلاستيكي', 'ملون طعام أحمر/برتقالي'],
    steps: [
      'ضع الكوب البلاستيكي وسط طبق أو صينية.',
      'ضع ملعقتين كبيرتين من البيكنج صودا داخل الكوب.',
      'أضف قطرات من ملون الطعام.',
      'اسكب الخل بهدوء واشهد الفوران والبركان الرائع! 💥'
    ],
    scienceSecret: 'تفاعل الخل (الحمض) مع البيكنج صودا (القاعدة) ينتج غاز ثاني أكسيد الكربون الذي يصنع الفقاعات البركانية!'
  },
  {
    id: 2,
    title: '🌈 قوس قزح والماء المتنقل',
    icon: 'fa-droplet',
    difficulty: 'سهل جداً 🟢',
    items: ['3 أكواب زجاجية أو بلاستيكية', 'ماء', 'مناديل ورقية سميكة', 'ألوان طعام (أحمر، أصفر، أزرق)'],
    steps: [
      'املأ الكوبين الخارجيين بالماء وأضف الألوان، واترك الكوب الأوسط فارغاً.',
      'اطوِ المنديل الورقي وسطه بين الكوب الملون والكوب الفارغ.',
      'انتظر بضع دقائق وشاهد كيف يسافر الماء عبر المنديل ليملأ الكوب الفارغ بلون جديد! 🎨'
    ],
    scienceSecret: 'هذا ما يُعرف بـ (الخاصية الشعرية)، وهي نفس الطريقة التي تشرب بها الأشجار والنباتات الماء من الأرض!'
  },
  {
    id: 3,
    title: '🥚 البيضة السحرية الطافية',
    icon: 'fa-egg',
    difficulty: 'سهل وممتع 🟢',
    items: ['بيضة نية', 'كوب ماء', '4 ملاعق ملح طعام كبير'],
    steps: [
      'ضع البيضة في كوب الماء العادي وشاهد كيف تغرق في القاع.',
      'أخرج البيضة وأضف 4 ملاعق ملح إلى الماء وحرّك جيداً حتى يذوب.',
      'ضع البيضة مجدداً وشاهد المفاجأة: البيضة تطفو على السطح! 🎈'
    ],
    scienceSecret: 'إضافة الملح تزين كثافة الماء، وعندما يصبح الماء أكثر كثافة من البيضة فإنها تطفو بسهولة!'
  },
  {
    id: 4,
    title: '🎈🚀 صاروخ البالون الطائر',
    icon: 'fa-rocket',
    difficulty: 'ممتع وحركي 🟡',
    items: ['بالون طويل أو عادي', 'خيط صوف طويل (3 أمتار)', 'ماصة بلاستيكية (قشة)', 'شريط لاصق'],
    steps: [
      'مرر الخيط داخل الماصة البلاستيكية وربط طرفي الخيط بين كرسيين.',
      'انفخ البالون وأمسك فوهته بأصابعك دون أن تربطه.',
      'أثبت البالون بالماصة بواسطة الشريط اللاصق.',
      'اترك الفوهة وشاهد الصاروخ ينطلق بسرعة فائقة! 💨'
    ],
    scienceSecret: 'قانون نيوتن الثالث للحركة: لكل فعل رد فعل مساوٍ له في المقدار ومضاد له في الاتجاه (اندفاع الهواء للخلف يدفع البالون للأمام).'
  }
];

const RECYCLING_ITEMS = [
  { id: 1, name: 'ورقة دفتر 📄', type: 'paper' },
  { id: 2, name: 'قنينة بلاستيك 🧴', type: 'plastic' },
  { id: 3, name: 'قشرة موز 🍌', type: 'organic' },
  { id: 4, name: 'كرتونة عصير 📦', type: 'paper' },
  { id: 5, name: 'كيس بلاستيك 🛍️', type: 'plastic' },
  { id: 6, name: 'تفاحة مأكولة 🍏', type: 'organic' }
];

const STAGE_LABELS = {
  1: { title: '1. الاعتماد الأولي وتسجيل التحدي', icon: 'fa-circle-check', color: '#3b82f6' },
  2: { title: '2. مراجعة وتوجيه معلم الـ STEM', icon: 'fa-comments', color: '#f59e0b' },
  3: { title: '3. بناء وتنفيذ النموذج الأولي', icon: 'fa-hammer', color: '#8b5cf6' },
  4: { title: '4. التكريم والوسام النهائي', icon: 'fa-award', color: '#10b981' }
};

const StemCorner = ({ isStandalone = true }) => {
  const [activeTab, setActiveTab] = useState('challenges');
  const [solutions, setSolutions] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(DEFAULT_CHALLENGES[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isResearchVisible, setIsResearchVisible] = useState(() => getScientificResearchVisibility());

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hash.includes('steam-hub') || window.location.hash.includes('stem-hub'))) {
      setActiveTab('steam-hub');
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeScientificResearchVisibility((vis) => {
      setIsResearchVisible(vis);
    });
    return () => unsub();
  }, []);

  const canSeeResearchQuest = isResearchVisible || 
    (typeof window !== 'undefined' && (
      sessionStorage.getItem('admin_preview_research') === 'true' || 
      Boolean(auth?.currentUser)
    ));

  // Auto-fill student details from global Single Sign-On session
  const [studentSession, setStudentSession] = useState(getStudentSession());
  const [studentName, setStudentName] = useState(() => studentSession?.fullName || '');
  const [studentClass, setStudentClass] = useState(() => studentSession?.studentClass || 'الصف الثالث (أ)');
  
  // Team Operation Room State
  const [participationType, setParticipationType] = useState('individual');
  const [teamName, setTeamName] = useState('');
  const [teamLeader, setTeamLeader] = useState('');
  const [teamRoles, setTeamRoles] = useState('مسؤول الفكرة: رامي | مسؤول الرسم والتصميم: أحمد | مسؤول العرض: مريم');
  
  // STEM Guided Lens State
  const [discoveryNote, setDiscoveryNote] = useState('');
  const [toolsNeeded, setToolsNeeded] = useState('');
  
  // Solution details & Prototype photo upload
  const [customProblemText, setCustomProblemText] = useState('');
  const [solutionTitle, setSolutionTitle] = useState('');
  const [solutionDesc, setSolutionDesc] = useState('');
  const [prototypeImage, setPrototypeImage] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [aiStemIdeas, setAiStemIdeas] = useState('');
  const [isLoadingAiStem, setIsLoadingAiStem] = useState(false);

  // STEAM Hub Interactive Stations State
  const [hubActiveStation, setHubActiveStation] = useState(1);
  const [hubViewMode, setHubViewMode] = useState('interactive'); // 'interactive' | 'summary'
  const [hubSelectedPresetKey, setHubSelectedPresetKey] = useState('bag');
  const [hubAiGuidance, setHubAiGuidance] = useState({});
  const [hubIsAiLoading, setHubIsAiLoading] = useState({});
  const [hubSubmitSuccess, setHubSubmitSuccess] = useState('');
  const hubPhotoInputRef = useRef(null);

  const [hubStationData, setHubStationData] = useState(() => {
    try {
      const saved = localStorage.getItem('steam_hub_station_work');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Reading steam_hub_station_work failed:", e);
    }
    const def = STEAM_HUB_PRESETS.bag;
    return {
      problemKey: 'bag',
      problemTitle: def.title,
      problemCategory: def.category,
      problemDescription: def.problemDescription,
      whyItIsAProblem: def.whyItIsAProblem,
      whoIsAffected: def.whoIsAffected,
      whereAndWhen: def.whereAndWhen,

      scienceAspect: def.scienceAspect,
      techAspect: def.techAspect,
      engineeringAspect: def.engineeringAspect,
      artsAspect: def.artsAspect,
      mathAspect: def.mathAspect,

      prototypeTitle: 'الحقيبة الذكية ذات الهيكل الموزع للضغط',
      prototypeSketchDesc: 'مخطط كرتوني يُظهر حقيبة مقسمة لثلاثة جيوب عمودية مع قاعدة عجلات خفيفة وحزام خصر عريض يوزع الحمل.',
      prototypeImage: '',
      pitchElevatorScript: 'المشكلة: يعاني زملاؤنا من ألم الظهر بسبب الحقائب الثقيلة.\nحلنا: حقيبة ذكية بهيكل خفيف وحزام توزيع الوزن وجدول مدرسي رقمي.\nكيف تعمل: نقيس الوزن أوتوماتيكياً ونحمل فقط كتب اليوم.\nالفائدة: حماية ظهور الطلاب وجعل القدوم للمدرسة تجربة مريحة وسعيدة!',
      pitchVideoUrl: '',

      testLocation: 'ممر الصفوف وأدراج مدرسة مشيرفة الابتدائية',
      testResults: 'تم فحص النموذج مع 5 طلاب، وانخفض الشعور بالثقل بنسبة 40%، وكان صعود الدرج أسهل بكثير.',
      peerReviewFeasibility: 5,
      peerReviewOriginality: 5,
      peerReviewImpact: 5,
      peerReviewNotes: 'فكرة ممتازة وعملية جداً! نقترح إضافة عاكس ضوئي في الخلف للأمان في الشارع.',

      iterationChallenges: 'كانت العجلات تصدر صوتاً خفيفاً على البلاط عند سحبها بسرعة.',
      iterationModifications: 'أضفنا طبقة سيليكون مطاطية ممتصة للصوت على العجلات (النسخة V2)، وعززنا حزام الأمان.',
      teacherTipsApplied: 'نصحنا معلم العلوم بتخفيف وزن الهيكل نفسه باستخدام مواد كرتونية معاد تدويرها.',

      finalImpactSummary: 'حماية صحة 300 طالب بالمدرسة من آلام الظهر، وتوفير بيئة تعليمية صحية ومحفزة.',
      studentLeadName: '',
      studentClassRoom: 'الصف الثالث (أ)',
      teamMembers: 'أحمد، رامي، مريم، يوسف'
    };
  });

  // Keep student name in sync if empty
  useEffect(() => {
    if (studentName && !hubStationData.studentLeadName) {
      setHubStationData(prev => ({ ...prev, studentLeadName: studentName }));
    }
  }, [studentName]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('steam_hub_station_work', JSON.stringify(hubStationData));
    } catch (e) {
      console.warn("Saving steam_hub_station_work failed:", e);
    }
  }, [hubStationData]);

  const handleSelectHubPreset = (key) => {
    setHubSelectedPresetKey(key);
    const p = STEAM_HUB_PRESETS[key];
    if (!p) return;
    setHubStationData(prev => ({
      ...prev,
      problemKey: key,
      problemTitle: p.title,
      problemCategory: p.category,
      problemDescription: p.problemDescription,
      whyItIsAProblem: p.whyItIsAProblem,
      whoIsAffected: p.whoIsAffected,
      whereAndWhen: p.whereAndWhen,
      scienceAspect: p.scienceAspect || prev.scienceAspect,
      techAspect: p.techAspect || prev.techAspect,
      engineeringAspect: p.engineeringAspect || prev.engineeringAspect,
      artsAspect: p.artsAspect || prev.artsAspect,
      mathAspect: p.mathAspect || prev.mathAspect,
      prototypeTitle: key === 'bag' ? 'الحقيبة الذكية ذات الهيكل الموزع للضغط' :
                      key === 'water' ? 'صنبور التوفير الحساس الذكي' :
                      key === 'power' ? 'نظام استشعار الطاقة الصفية الذكي' :
                      key === 'noise' ? 'كواتم الضوضاء السيليكونية لأرجل الكراسي' : prev.prototypeTitle
    }));
  };

  const handleHubPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setHubStationData(prev => ({ ...prev, prototypeImage: evt.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRequestHubAi = async (stationNum) => {
    setHubIsAiLoading(prev => ({ ...prev, [stationNum]: true }));
    try {
      let extra = '';
      if (stationNum === 5) {
        extra = `تحديات: ${hubStationData.iterationChallenges} | تعديلات: ${hubStationData.iterationModifications}`;
      }
      const guidance = await guideSteamStationAI({
        stationNumber: stationNum,
        problemTitle: hubStationData.problemTitle,
        problemDetail: hubStationData.problemDescription,
        whyProblem: hubStationData.whyItIsAProblem,
        extraContext: extra
      });
      setHubAiGuidance(prev => ({ ...prev, [stationNum]: guidance }));
    } catch (e) {
      console.warn("AI station guidance error:", e);
      setHubAiGuidance(prev => ({
        ...prev,
        [stationNum]: 'مرحباً يا بطل! فكر في أثر هذا التحدي على زملائك في المدرسة، وركز على حل بسيط وآمن يمكنك بناؤه بمواد متوفرة.'
      }));
    } finally {
      setHubIsAiLoading(prev => ({ ...prev, [stationNum]: false }));
    }
  };

  const handleSaveSteamHubProject = async () => {
    const studentLead = hubStationData.studentLeadName || studentName || 'طالب مبدع';
    const studentClassRoom = hubStationData.studentClassRoom || studentClass || 'الصف الثالث (أ)';
    const projTitle = hubStationData.prototypeTitle || hubStationData.problemTitle || 'مشروع حاضنة ستيم المدرسية';

    const newProject = {
      studentName: studentLead,
      studentClass: studentClassRoom,
      participationType: hubStationData.teamMembers ? 'team' : 'individual',
      teamName: hubStationData.prototypeTitle || 'فريق مبتكري ستيم',
      teamLeader: studentLead,
      teamRoles: hubStationData.teamMembers || '',
      challengeTitle: hubStationData.problemTitle,
      solutionTitle: projTitle,
      solutionDesc: `[مشروع متكامل في حاضنة ستيم الرقمية]\n• المشكلة: ${hubStationData.problemDescription}\n• لماذا هي مشكلة: ${hubStationData.whyItIsAProblem}\n• الحل الهندسي: ${hubStationData.prototypeSketchDesc}\n• الأثر على المدرسة: ${hubStationData.finalImpactSummary}`,
      prototypeImage: hubStationData.prototypeImage || '',
      currentStage: 4,
      teacherStars: 5,
      teacherFeedback: '🌟 مبارك! تم استلام المشروع المتكامل عبر حاضنة ستيم الرقمية، واحتسابه رسمياً ضمن ملف التقييم المدرسي.',
      studentUpdates: [`تم إنجاز المحطات الست في حاضنة ستيم واعتماد المشروع بتاريخ ${new Date().toLocaleDateString('ar-EG')}`],
      likes: 10,
      isSteamHubProject: true,
      steamHubData: hubStationData,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'stem_solutions'), newProject);
    } catch (e) {
      console.warn("Firestore save fallback:", e);
    }

    try {
      const existing = JSON.parse(localStorage.getItem('stem_local_solutions') || '[]');
      localStorage.setItem('stem_local_solutions', JSON.stringify([newProject, ...existing]));
      setSolutions(prev => [newProject, ...prev]);
    } catch (e) {
      console.warn("LocalStorage save fallback:", e);
    }

    addPoints(100);
    setHubSubmitSuccess('🎉 مبارك يا بطل! تم تسليم مشروعك بنجاح واعتماده في حاضنة ستيم الرقمية ونلت +100 نقطة ⭐');
    setTimeout(() => setHubSubmitSuccess(''), 8000);
  };

  const handleGenerateAiStemIdeas = async () => {
    if (!selectedChallenge) return;
    setIsLoadingAiStem(true);
    try {
      const ideas = await generateStemSolutionIdeas({
        challengeTitle: selectedChallenge.title,
        problemDesc: selectedChallenge.realProblem || selectedChallenge.desc,
        studentNote: solutionDesc || customProblemText
      });
      setAiStemIdeas(ideas);
    } catch (e) {
      console.warn("AI STEM error:", e);
    } finally {
      setIsLoadingAiStem(false);
    }
  };

  // Socratic STEM Mentor ("المكتشف الصغير") State
  const [socraticMessages, setSocraticMessages] = useState([
    { role: 'bot', text: 'مرحباً يا بطل العلوم! 🌟 أنا "المكتشف الصغير" مرشدك السقراطي الذكي. ما هو المشروع أو الفكرة الرائعة التي تريد أن نفكر فيها ونكتشفها معاً اليوم؟' }
  ]);
  const [socraticHistory, setSocraticHistory] = useState([]);
  const [socraticInput, setSocraticInput] = useState('');
  const [isSocraticTyping, setIsSocraticTyping] = useState(false);
  const socraticChatEndRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'socratic' && socraticChatEndRef.current) {
      socraticChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [socraticMessages, isSocraticTyping, activeTab]);

  const handleSendSocraticMessage = async (textOverride = null) => {
    const text = textOverride || socraticInput.trim();
    if (!text || isSocraticTyping) return;

    const newMsgs = [...socraticMessages, { role: 'user', text }];
    setSocraticMessages(newMsgs);
    if (!textOverride) setSocraticInput('');
    setIsSocraticTyping(true);

    try {
      const reply = await askSocraticStemMentor({
        message: text,
        history: socraticHistory
      });

      setSocraticMessages(prev => [...prev, { role: 'bot', text: reply }]);
      setSocraticHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: reply }] }
      ]);
    } catch (e) {
      console.warn("Socratic error:", e);
      setSocraticMessages(prev => [...prev, { role: 'bot', text: 'عذراً يا بطل، حدث خطأ بسيط في الاتصال. ما رأيك أن تعيد كتابة سؤالك؟' }]);
    } finally {
      setIsSocraticTyping(false);
    }
  };

  const handleResetSocratic = () => {
    setSocraticHistory([]);
    setSocraticMessages([
      { role: 'bot', text: 'مرحباً يا بطل العلوم! 🌟 أنا "المكتشف الصغير" مرشدك السقراطي الذكي. ما هو المشروع أو الفكرة الرائعة التي تريد أن نفكر فيها ونكتشفها معاً اليوم؟' }
    ]);
    setSocraticInput('');
  };

  const handleStartSocraticForChallenge = (ch) => {
    setModalOpen(false);
    setActiveTab('socratic');
    const introMsg = `أهلاً يا بطل العلوم! 🌟 هيا نطور معاً فكرة ومشروع: "${ch.title}".
المشكلة الواقعية هي: "${ch.realProblem || ch.desc}".
ما رأيك، ما أول شيء تلاحظه يسبب هذه المشكلة في مدرستنا أو بيتنا؟`;
    setSocraticHistory([]);
    setSocraticMessages([
      { role: 'bot', text: introMsg }
    ]);
  };

  const handleExportSocraticToSolution = () => {
    const studentInputs = socraticMessages
      .filter(m => m.role === 'user')
      .map(m => m.text);

    if (studentInputs.length > 0) {
      const summaryText = `💡 مسار تفكيري في تطوير الفكرة مع المكتشف الصغير:\n` +
        studentInputs.map((inp, idx) => `• خطوة ${idx + 1}: ${inp}`).join('\n') +
        `\n\n🎯 توجه الحل النهائي:\n${socraticMessages.filter(m => m.role === 'bot').slice(-1)[0]?.text || ''}`;
      setSolutionDesc(prev => (prev ? prev + '\n\n' : '') + summaryText);
      if (!solutionTitle) {
        setSolutionTitle('مشروع مبتكر تم تطويره بالحوار مع المكتشف الصغير');
      }
    }

    setActiveTab('challenges');
    if (selectedChallenge) {
      setModalOpen(true);
    } else {
      const defaultCh = DEFAULT_CHALLENGES.find(c => c.id === 'custom') || DEFAULT_CHALLENGES[0];
      handleOpenChallengeDetails(defaultCh);
    }
  };

  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedSolForUpdate, setSelectedSolForUpdate] = useState(null);
  const [progressUpdateText, setProgressUpdateText] = useState('');
  const [updatedPhoto, setUpdatedPhoto] = useState('');

  const fileInputRef = useRef(null);
  const updateFileInputRef = useRef(null);

  // Gamification State
  const [userScore, setUserScore] = useState(() => {
    return parseInt(localStorage.getItem('stem_user_score') || '0', 10);
  });
  const [completedExperiments, setCompletedExperiments] = useState(() => {
    return JSON.parse(localStorage.getItem('stem_completed_exp') || '[]');
  });

  // Game 1 State: Math Balance Scale
  const [balanceLeft, setBalanceLeft] = useState(12);
  const [balanceRightTarget, setBalanceRightTarget] = useState(7);
  const [balanceOptions, setBalanceOptions] = useState([3, 5, 8, 2]);
  const [balanceFeedback, setBalanceFeedback] = useState('');

  // Game 2 State: Circuit Puzzle
  const [circuitBattery, setCircuitBattery] = useState(false);
  const [circuitWire, setCircuitWire] = useState(false);
  const [circuitSwitch, setCircuitSwitch] = useState(false);

  // Game 3 State: Recycling Trash Game
  const [recyclingIndex, setRecyclingIndex] = useState(0);
  const [recyclingScore, setRecyclingScore] = useState(0);
  const [recyclingFeedback, setRecyclingFeedback] = useState('');

  useEffect(() => {
    const handleAuth = () => {
      const sess = getStudentSession();
      setStudentSession(sess);
      if (sess) {
        setStudentName(sess.fullName);
        setStudentClass(sess.studentClass);
        if (!teamLeader) setTeamLeader(sess.fullName);
      }
    };
    window.addEventListener('studentAuthChanged', handleAuth);
    return () => window.removeEventListener('studentAuthChanged', handleAuth);
  }, []);

  // Load solutions from Firestore & LocalStorage
  useEffect(() => {
    const fetchSolutions = async () => {
      let loaded = [];
      try {
        const snap = await getDocs(collection(db, 'stem_solutions'));
        if (!snap.empty) {
          snap.forEach(doc => {
            loaded.push({ id: doc.id, ...doc.data() });
          });
        }
      } catch (e) {
        console.warn("Firestore stem_solutions fetch offline fallback:", e);
      }

      // Merge local storage items
      const localSols = JSON.parse(localStorage.getItem('stem_local_solutions') || '[]');
      const combined = [...loaded, ...localSols];
      
      if (combined.length === 0) {
        const demoSolutions = [
          {
            id: 'demo1',
            studentName: 'أحمد محمود ارفاعية',
            studentClass: 'الصف الثالث (أ)',
            participationType: 'team',
            teamName: 'فريق رواد الفضاء',
            teamLeader: 'أحمد محمود',
            challengeTitle: '🎒 تحدي الحقيبة الثقيلة',
            solutionTitle: 'خزانة الصف الذكية مع الجدول الرقمي',
            solutionDesc: 'اقتراحي تقسيم الكتب إلى نصفين: نصف يبقى في خزانة الصف ونصف في البيت، واستخدام تطبيق مدرسي لعرض واجب اليوم فقط.',
            prototypeImage: '',
            currentStage: 3,
            teacherStars: 5,
            teacherFeedback: '🌟 ممتاز جداً! فكرة تكنولوجية رائعة تميزت بواقعيتها. تابع جمع الكرتون لإكمال المجسم.',
            studentUpdates: ['تم رسم المخطط الأولي بالصف، وجاري جمع العلب البلاستيكية لتركيب الهيكل.'],
            likes: 12,
            createdAt: new Date().toISOString()
          },
          {
            id: 'demo2',
            studentName: 'مريم يوسف',
            studentClass: 'الصف الثاني (ب)',
            participationType: 'individual',
            challengeTitle: '💧 تحدي ترشيد مياه المغاسل',
            solutionTitle: 'صنبور الضغط المكتوم المؤقت',
            solutionDesc: 'تركيب رؤوس صنابير تفتح عند الضغط لمدة 5 ثوانٍ فقط وتغلق تلقائياً حتى لا ينسى الطلاب الحنفية مفتوحة.',
            prototypeImage: '',
            currentStage: 4,
            teacherStars: 5,
            teacherFeedback: '👏 ابتكار رائع ومميز لحماية الموارد المائية! تم منحك وسام مهندس الأسبوع.',
            studentUpdates: [],
            likes: 19,
            createdAt: new Date().toISOString()
          }
        ];
        setSolutions(demoSolutions);
      } else {
        setSolutions(combined);
      }
    };

    fetchSolutions();
  }, []);

  // Save Score Helper
  const addPoints = (pts) => {
    const newScore = userScore + pts;
    setUserScore(newScore);
    localStorage.setItem('stem_user_score', newScore.toString());
  };

  const handleOpenChallengeDetails = (ch) => {
    setSelectedChallenge(ch);
    setModalOpen(true);
  };

  // Prototype Photo Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPrototypeImage(evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Follow-Up Photo Upload
  const handleUpdateImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setUpdatedPhoto(evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Experiment Complete Handler
  const handleCompleteExperiment = (expId) => {
    if (!completedExperiments.includes(expId)) {
      const updated = [...completedExperiments, expId];
      setCompletedExperiments(updated);
      localStorage.setItem('stem_completed_exp', JSON.stringify(updated));
      addPoints(50);
    }
  };

  // Pre-fill Idea into Form
  const handleUseIdea = (ideaText) => {
    setSolutionTitle(ideaText.substring(0, 45) + '...');
    setSolutionDesc(prev => (prev ? prev + '\n- ' + ideaText : 'فكرتي مبنية على: ' + ideaText));
  };

  // Submit Solution Form
  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    if (!studentName || !solutionTitle || !solutionDesc) return;

    const challengeTitleText = selectedChallenge.id === 'custom' && customProblemText 
      ? `🌟 تحدي خاص: ${customProblemText}` 
      : selectedChallenge.title;

    const newSol = {
      studentName,
      studentClass,
      participationType,
      teamName: participationType === 'team' ? teamName : '',
      teamLeader: participationType === 'team' ? teamLeader : '',
      teamRoles: participationType === 'team' ? teamRoles : '',
      discoveryNote,
      toolsNeeded,
      challengeTitle: challengeTitleText,
      solutionTitle,
      solutionDesc,
      prototypeImage,
      currentStage: 1, // Start at Stage 1: Submitted & Registered
      teacherStars: 5,
      teacherFeedback: '💬 مرحباً بك! تم اعتماد تسجيل التحدي مبدئياً، وسيتابع معك المعلم لتوجيهك في مرحلة بناء النموذج.',
      studentUpdates: [],
      likes: 1,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'stem_solutions'), newSol);
    } catch (e) {
      console.warn("Saving solution to localStorage offline fallback:", e);
    }

    const localSols = JSON.parse(localStorage.getItem('stem_local_solutions') || '[]');
    const updatedLocal = [newSol, ...localSols];
    localStorage.setItem('stem_local_solutions', JSON.stringify(updatedLocal));
    setSolutions(prev => [newSol, ...prev]);

    // Reward points
    addPoints(100);

    setFormSuccess('🎉 تم تسليم وتوثيق التحدي بنجاح! انتقلت حلك الآن إلى مرحلة المتابعة 🔍 وسيقوم معلم الـ STEM بتوجيهك خطوة بخطوة!');
    setSolutionTitle('');
    setSolutionDesc('');
    setCustomProblemText('');
    setPrototypeImage('');
    setTimeout(() => {
      setFormSuccess('');
      setModalOpen(false);
      setActiveTab('tracking'); // Auto navigate to Follow-Up tab!
    }, 3000);
  };

  // Add Progress Update in Follow-Up Stage
  const handleSaveProgressUpdate = (e) => {
    e.preventDefault();
    if (!selectedSolForUpdate || !progressUpdateText.trim()) return;

    const updatedSols = solutions.map(sol => {
      if (sol.id === selectedSolForUpdate.id || sol.createdAt === selectedSolForUpdate.createdAt) {
        const updatesList = sol.studentUpdates || [];
        const newUpdateEntry = `${new Date().toLocaleDateString('ar-EG')}: ${progressUpdateText.trim()}`;
        return {
          ...sol,
          currentStage: Math.min(4, (sol.currentStage || 1) + 1), // Advance stage upon student update!
          prototypeImage: updatedPhoto || sol.prototypeImage,
          studentUpdates: [...updatesList, newUpdateEntry]
        };
      }
      return sol;
    });

    setSolutions(updatedSols);
    localStorage.setItem('stem_local_solutions', JSON.stringify(updatedSols));
    addPoints(30);

    alert('🎉 تم حفظ تحديث المتابعة وصورة النموذج بنجاح! تم تطوير مرحلة المشروع (+30 نقطة ⭐)');
    setProgressUpdateText('');
    setUpdatedPhoto('');
    setUpdateModalOpen(false);
  };

  // Math Balance Check
  const handleBalanceOptionClick = (num) => {
    if (balanceRightTarget + num === balanceLeft) {
      setBalanceFeedback('🎉 أحسنت بطل الرياضيات! كفتا الميزان متساويتان تماماً! (+30 نقطة)');
      addPoints(30);
      setTimeout(() => {
        setBalanceFeedback('');
        const newLeft = Math.floor(Math.random() * 10) + 10;
        const newTarget = Math.floor(Math.random() * 8) + 2;
        const correctOpt = newLeft - newTarget;
        setBalanceLeft(newLeft);
        setBalanceRightTarget(newTarget);
        setBalanceOptions([correctOpt, correctOpt + 2, Math.max(1, correctOpt - 3), correctOpt + 4].sort(() => Math.random() - 0.5));
      }, 2000);
    } else {
      setBalanceFeedback('❌ جرب مجدداً! الكفة لم تتساو بعد، فكر بالرقم الذي يكمل المجموع.');
    }
  };

  // Recycling Game Click
  const handleRecycleBinClick = (binType) => {
    const currentItem = RECYCLING_ITEMS[recyclingIndex];
    if (currentItem.type === binType) {
      setRecyclingFeedback('✅ ممتاز يا صديق البيئة! وضع رائع وسليم (+20 نقطة)');
      setRecyclingScore(prev => prev + 20);
      addPoints(20);
    } else {
      setRecyclingFeedback('❌ أوه، هذه المادة تحتاج سلة أخرى! ركز في مكوناتها.');
    }

    setTimeout(() => {
      setRecyclingFeedback('');
      setRecyclingIndex(prev => (prev + 1) % RECYCLING_ITEMS.length);
    }, 1500);
  };

  // Like Solution Handler
  const handleLikeSolution = (index) => {
    setSolutions(prev => {
      const copy = [...prev];
      copy[index].likes = (copy[index].likes || 0) + 1;
      return copy;
    });
  };

  return (
    <div className={`stem-corner-container ${isStandalone ? 'standalone-page' : ''}`}>
      {/* 🚀 Hero Header Banner */}
      <header className="stem-hero">
        <div className="stem-hero-shapes">
          <span className="floating-shape s1">🚀</span>
          <span className="floating-shape s2">🧬</span>
          <span className="floating-shape s3">🤖</span>
          <span className="floating-shape s4">📐</span>
          <span className="floating-shape s5">🧪</span>
          <span className="floating-shape s6">⚡</span>
        </div>
        <div className="stem-hero-content">
          <div className="stem-badge-pill">
            <i className="fas fa-atom"></i> زاوية STEM للابتكار والصغار
          </div>
          <h1 className="stem-title">
            صناع الحلول <span className="highlight-text">والعباقرة الصغار 💡</span>
          </h1>
          <p className="stem-subtitle">
            مرحباً بكم في عالم العلوم، التكنولوجيا، الهندسة، والرياضيات بمدرسة مشيرفة الابتدائية! نتحدى المشكلات، نبتكر الحلول، ونلعب بالذكاء.
          </p>

          {/* Gamification Score Badge & Teacher Access Button */}
          <div className="hero-flex-actions">
            <div className="stem-score-card">
              <div className="score-icon"><i className="fas fa-trophy"></i></div>
              <div className="score-details">
                <span className="score-label">مجموع نقاط الابتكار لديك</span>
                <span className="score-value">{userScore} <small>نقطة ⭐</small></span>
              </div>
              <div className="score-badge-tag">
                {userScore >= 200 ? '🏅 عالم مشيرفة الصغير' : userScore >= 100 ? '🛠️ مهندس STEM' : '🌱 مبتكر صاعد'}
              </div>
            </div>

            <div className="teacher-access-hero-wrapper">
              <button 
                onClick={() => setActiveTab('steam-hub')} 
                className="teacher-portal-quick-btn"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                  border: '1.5px solid #c4b5fd',
                  marginRight: '8px'
                }}
                title="عرض وثيقة الموديل التشغيلي والبيداغوجي: حاضنة ستيم الرقمية (School STEAM Hub)"
              >
                <i className="fas fa-file-invoice"></i> 📑 وثيقة موديل حاضنة ستيم (STEAM Hub)
              </button>

              <button 
                onClick={() => setActiveTab('socratic')} 
                className="teacher-portal-quick-btn"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                  border: '1.5px solid #93c5fd',
                  marginRight: '8px'
                }}
                title="حاور المكتشف الصغير الذكي لحل المشكلات بطريقة سقراطية"
              >
                <i className="fas fa-robot"></i> 🚀 حاور المكتشف الصغير (STEM) 💡
              </button>

              <button 
                onClick={() => window.location.hash = '#/stem-teacher'} 
                className="teacher-portal-quick-btn"
                title="الانتقال المباشر لبوابة معلم المادة لمتابعة وتوجيه الطلاب"
              >
                <i className="fas fa-chalkboard-user"></i> 👨‍🏫 دخول معلم المادة لمتابعة الطلاب 🔐
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 🎯 Navigation Tabs */}
      <nav className="stem-nav-tabs">
        <button 
          className={`stem-tab-btn ${activeTab === 'steam-hub' ? 'active' : ''}`}
          onClick={() => setActiveTab('steam-hub')}
          style={{
            background: activeTab === 'steam-hub' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : undefined,
            color: activeTab === 'steam-hub' ? '#fff' : undefined,
            border: '2px solid #8b5cf6',
            fontWeight: 800
          }}
          title="وثيقة الموديل التشغيلي والبيداغوجي: حاضنة ستيم الرقمية (School STEAM Hub)"
        >
          <i className="fas fa-file-lines"></i> 📑 وثيقة موديل حاضنة ستيم
        </button>

        <button 
          className={`stem-tab-btn ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          <i className="fas fa-lightbulb"></i> 1. صناع الحلول (تحدي المشكلات)
        </button>

        <button 
          className={`stem-tab-btn ${activeTab === 'experiments' ? 'active' : ''}`}
          onClick={() => setActiveTab('experiments')}
        >
          <i className="fas fa-flask"></i> 2. تجارب علمية منزلية 🧪
        </button>

        <button 
          className={`stem-tab-btn ${activeTab === 'games' ? 'active' : ''}`}
          onClick={() => setActiveTab('games')}
        >
          <i className="fas fa-gamepad"></i> 3. محطة الألعاب والتفكير 🎮
        </button>

        <button 
          className={`stem-tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          <i className="fas fa-palette"></i> 4. معرض مشاريع الطلاب 🎨
        </button>

        <button 
          className={`stem-tab-btn ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          <i className="fas fa-bars-progress"></i> 5. متابعة ابتكاراتي وتحدياتي 🔍
        </button>

        {canSeeResearchQuest && (
          <button 
            className="stem-tab-btn"
            onClick={() => window.location.hash = '#/scientific-research'}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              borderColor: '#0284c7',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              fontWeight: 800
            }}
            title="الانتقال لرحلة خطوات البحث العلمي التفاعلية مع الروبوت مشيرفي"
          >
            <i className="fas fa-microscope"></i> 6. خطوات البحث العلمي (المستكشف الصغير) 🔬✨
          </button>
        )}

        <button 
          className={`stem-tab-btn ${activeTab === 'socratic' ? 'active' : ''}`}
          onClick={() => setActiveTab('socratic')}
          style={{
            background: activeTab === 'socratic' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : undefined,
            color: activeTab === 'socratic' ? '#fff' : undefined,
            border: '2px solid #3b82f6',
            fontWeight: 800
          }}
        >
          <i className="fas fa-robot"></i> 🤖 المكتشف الصغير (حوار ذكي)
        </button>

        <button 
          className="stem-tab-btn teacher-quick-tab-btn"
          onClick={() => window.location.hash = '#/stem-teacher'}
          title="بوابة معلم الموضوع لمتابعة وتوجيه الطلاب"
        >
          <i className="fas fa-user-shield"></i> 👨‍🏫 بوابة توجيه المعلم 🔐
        </button>
      </nav>

      {/* ======================================================== */}
      {/* TAB 1: Real-World Problem Solvers (صناع الحلول)           */}
      {/* ======================================================== */}
      {activeTab === 'challenges' && (
        <section className="stem-section animate-fade">
          <div className="section-header-box">
            <h2><i className="fas fa-hammer"></i> قسم صناع الحلول (تحديات واقعية من مدرستنا وبيتنا)</h2>
            <p>اختر مشكلة من مشاكل بيئتنا ومدرستنا اليومية، انقر لمعاينة التفاصيل وفكر كمهندس صغير واكتب حلّك المبتكر!</p>
          </div>

          {/* Grid of Real School Challenges */}
          <div className="challenges-grid">
            {DEFAULT_CHALLENGES.map(ch => (
              <div 
                key={ch.id}
                className="challenge-card"
                onClick={() => handleOpenChallengeDetails(ch)}
                style={{ '--card-accent': ch.color }}
              >
                <div className="card-top-icon">
                  <i className={`fas ${ch.icon}`}></i>
                </div>
                <span className="card-category">{ch.category}</span>
                <h3>{ch.title}</h3>
                <p>{ch.desc}</p>
                <button className="select-ch-btn">
                  تفاصيل التحدي وقدم حلك 💡
                </button>
              </div>
            ))}
          </div>

          {/* Detailed Pedagogical Challenge Modal Window */}
          {modalOpen && selectedChallenge && (
            <div className="stem-modal-overlay" onClick={() => setModalOpen(false)}>
              <div className="stem-modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                  <i className="fas fa-times"></i>
                </button>

                <div className="modal-header-banner" style={{ background: selectedChallenge.color }}>
                  <div className="modal-header-icon"><i className={`fas ${selectedChallenge.icon}`}></i></div>
                  <div>
                    <span className="modal-category">{selectedChallenge.category}</span>
                    <h2>{selectedChallenge.title}</h2>
                  </div>
                </div>

                <div className="modal-body-content">
                  
                  {/* 1. SECTION: Challenge Question & Story */}
                  <div className="detail-info-block question-story-block">
                    <span className="section-badge-pill">1️⃣ قصة المشكلة والتحدي</span>
                    <h3 className="hero-question-title">
                      🎯 سؤال التحدي الرئيسي: <br/>
                      <span className="q-highlight">"{selectedChallenge.question || selectedChallenge.desc}"</span>
                    </h3>
                    <p className="story-desc">
                      📌 <strong>المشكلة الواقعية:</strong> {selectedChallenge.realProblem}
                    </p>
                    <p className="mission-desc">
                      🛠️ <strong>مهمتك كـ (مهندس صغير):</strong> {selectedChallenge.studentMission}
                    </p>
                  </div>

                  {/* 2. SECTION: STEM Guided Lens (عدسة المهندس) */}
                  <div className="detail-info-block stem-lens-block">
                    <span className="section-badge-pill">2️⃣ عدسة المهندس (دليل تفكير الـ STEM الموجه)</span>
                    <p className="lens-subtext">اتبع خطوات التفكير العلمي الـ 4 التالية لصناعة حلك المبتكر:</p>
                    
                    <div className="stem-steps-grid">
                      <div className="stem-step-card step-1">
                        <div className="step-num">🔍 1. اكتشف</div>
                        <p>حدد المشكلة تحديداً وأين تكرر حدوثها في المدرسة أو البيت.</p>
                      </div>

                      <div className="stem-step-card step-2">
                        <div className="step-num">📐 2. فكّر وخطّط</div>
                        <p>ارسم فكرتك أو تخيل حلاً هندسياً ولو برسمة بسيطة على ورقة.</p>
                      </div>

                      <div className="stem-step-card step-3">
                        <div className="step-num">🛠️ 3. اقترح ونفذ</div>
                        <p>حدد الأدوات أو المواد البسيطة المتوفرة بالبيت/المدرسة لبناء النموذج.</p>
                      </div>

                      <div className="stem-step-card step-4">
                        <div className="step-num">💡 4. اختبر وطوّر</div>
                        <p>كيف ستتأكد من أن حلك يعمل بنجاح ومفيد للجميع؟</p>
                      </div>
                    </div>
                  </div>

                  {/* Suggested Ideas Box */}
                  {selectedChallenge.suggestedIdeas && selectedChallenge.suggestedIdeas.length > 0 && (
                    <div className="detail-info-block ideas-block">
                      <h4>💡 أفكار لحلول مقترحة (يمكنك الاستلهام منها):</h4>
                      <div className="ideas-chips-container">
                        {selectedChallenge.suggestedIdeas.map((idea, idx) => (
                          <div key={idx} className="idea-chip">
                            <span>🔹 {idea}</span>
                            <button 
                              type="button" 
                              className="use-idea-btn"
                              onClick={() => handleUseIdea(idea)}
                              title="اضغط لاستخدام هذه الفكرة في حلك"
                            >
                              استخدم هذه الفكرة 💡
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI STEM Innovation Assistant */}
                  <div style={{
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    border: '1.5px solid #93c5fd',
                    borderRadius: '16px',
                    padding: '1.15rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: aiStemIdeas ? '0.75rem' : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.3rem' }}>🤖</span>
                        <strong style={{ color: '#1e3a8a', fontSize: '0.95rem' }}>موجه الابتكار الذكي (AI STEM Mentor)</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleGenerateAiStemIdeas}
                          disabled={isLoadingAiStem}
                          style={{
                            background: isLoadingAiStem ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            color: 'white',
                            border: 'none',
                            padding: '0.45rem 0.9rem',
                            borderRadius: '20px',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: isLoadingAiStem ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                          }}
                        >
                          <i className={`fas ${isLoadingAiStem ? 'fa-spinner fa-spin' : 'fa-brain'}`}></i>
                          <span>{isLoadingAiStem ? 'جاري توليد حلول ذكية...' : '💡 حلول سريعة'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartSocraticForChallenge(selectedChallenge)}
                          style={{
                            background: 'linear-gradient(135deg, #059669, #047857)',
                            color: 'white',
                            border: 'none',
                            padding: '0.45rem 1rem',
                            borderRadius: '20px',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                          }}
                          title="حاور المكتشف الصغير لتطوير فكرة هذا التحدي خطوة بخطوة بطريقة سقراطية"
                        >
                          <i className="fas fa-comments"></i>
                          <span>🚀 حوار تطوير الفكرة مع المكتشف الصغير 💬</span>
                        </button>
                      </div>
                    </div>
                    {aiStemIdeas && (
                      <div style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid #bfdbfe',
                        color: '#1e293b',
                        fontSize: '0.88rem',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-line'
                      }}>
                        <div>{aiStemIdeas}</div>
                        <div style={{ marginTop: '0.75rem', textAlign: 'left' }}>
                          <button
                            type="button"
                            onClick={() => setSolutionDesc(prev => (prev ? prev + '\n\n' : '') + '💡 استلهام من موجه الـ STEM الذكي:\n' + aiStemIdeas)}
                            style={{
                              background: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #86efac',
                              padding: '0.35rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fas fa-plus-circle" style={{ marginLeft: '4px' }}></i>
                            أضف هذه المقترحات لصندوق وصفي ✍️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Solution Submission Form & Team Operation Room */}
                  <div className="modal-form-wrapper">
                    <h3>✍️ تقديم الابتكار والحل الهندسي (+100 نقطة ⭐)</h3>
                    
                    {formSuccess && (
                      <div className="form-alert-success">
                        {formSuccess}
                      </div>
                    )}

                    <form onSubmit={handleSubmitSolution} className="stem-form">
                      
                      {/* 3. SECTION: Team Operation Room (غرفة العمليات الجماعية) */}
                      <div className="form-group team-type-selector">
                        <label><i className="fas fa-users-gear"></i> نوع المشاركة في الابتكار:</label>
                        <div className="participation-toggle-btns">
                          <button 
                            type="button"
                            className={`toggle-type-btn ${participationType === 'individual' ? 'active' : ''}`}
                            onClick={() => setParticipationType('individual')}
                          >
                            👤 مخترع مستقل (مشاركة فردية)
                          </button>
                          <button 
                            type="button"
                            className={`toggle-type-btn ${participationType === 'team' ? 'active' : ''}`}
                            onClick={() => setParticipationType('team')}
                          >
                            👥 فريق جماعي (غرفة عمليات الابتكار)
                          </button>
                        </div>
                      </div>

                      {/* Team Details Fields */}
                      {participationType === 'team' && (
                        <div className="team-fields-box animate-fade">
                          <div className="form-row">
                            <div className="form-group">
                              <label><i className="fas fa-users"></i> اسم الفريق / المجموعة:</label>
                              <input 
                                type="text"
                                placeholder="مثال: فريق رواد الفضاء والهندسة"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                required
                              />
                            </div>

                            <div className="form-group">
                              <label><i className="fas fa-user-shield"></i> قائد الفريق:</label>
                              <input 
                                type="text"
                                placeholder="مثال: رامي ارفاعية"
                                value={teamLeader}
                                onChange={(e) => setTeamLeader(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label><i className="fas fa-sitemap"></i> توزيع أدوار الأعضاء:</label>
                            <input 
                              type="text"
                              placeholder="مثال: رامي (مسؤول الفكرة)، أحمد (مسؤول الرسم)، مريم (مسؤول العرض)"
                              value={teamRoles}
                              onChange={(e) => setTeamRoles(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Single Student Info */}
                      <div className="form-row">
                        <div className="form-group">
                          <label><i className="fas fa-user-astronaut"></i> اسم الطالب/ة المخترع/ة:</label>
                          <input 
                            type="text" 
                            placeholder="مثال: رامي ارفاعية" 
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label><i className="fas fa-graduation-cap"></i> الصف والشعبة:</label>
                          <select value={studentClass} onChange={(e) => setStudentClass(e.target.value)}>
                            <option value="الصف الأول (أ)">الصف الأول (أ)</option>
                            <option value="الصف الأول (ب)">الصف الأول (ب)</option>
                            <option value="الصف الثاني (أ)">الصف الثاني (أ)</option>
                            <option value="الصف الثاني (ب)">الصف الثاني (ب)</option>
                            <option value="الصف الثالث (أ)">الصف الثالث (أ)</option>
                            <option value="الصف الثالث (ب)">الصف الثالث (ب)</option>
                            <option value="الصف الرابع (أ)">الصف الرابع (أ)</option>
                            <option value="الصف الخامس (أ)">الصف الخامس (أ)</option>
                            <option value="الصف السادس (أ)">الصف السادس (أ)</option>
                          </select>
                        </div>
                      </div>

                      {selectedChallenge.id === 'custom' && (
                        <div className="form-group">
                          <label><i className="fas fa-question-circle"></i> المشكلة الخاصة التي اخترتها (التحدي المفتوح):</label>
                          <input 
                            type="text"
                            placeholder="مثال: تنظيف السبورة الصفية تلقائياً"
                            value={customProblemText}
                            onChange={(e) => setCustomProblemText(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      <div className="form-group">
                        <label><i className="fas fa-heading"></i> عنوان الفكرة أو الابتكار الهندسي:</label>
                        <input 
                          type="text" 
                          placeholder="مثال: الحاوية الذكية الناطقة لحفظ الأوراق" 
                          value={solutionTitle}
                          onChange={(e) => setSolutionTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label><i className="fas fa-file-signature"></i> اشرح فكرتك وكيف تعمل ببساطة:</label>
                        <textarea 
                          rows="4"
                          placeholder="اكتب أدواتك وفكرتك العلمية هنا... (مثال: نستخدم مستشعرات حركة لإغلاق الصنبور تلقائياً...)"
                          value={solutionDesc}
                          onChange={(e) => setSolutionDesc(e.target.value)}
                          required
                        ></textarea>
                      </div>

                      {/* 4. SECTION: Prototype Photo & Drawing Upload (معرض الحلول المصغرة) */}
                      <div className="form-group prototype-upload-box">
                        <label><i className="fas fa-camera"></i> توثيق النموذج/الرسمة الهندسية (اختياري 📸):</label>
                        <p className="field-hint">التقط صورة لرسمتك على ورقة أو مجسمك المصنوع من الكرتون وإعادة التدوير وارفعها هنا!</p>
                        
                        <input 
                          type="file" 
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />

                        <button 
                          type="button" 
                          className="upload-trigger-btn"
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        >
                          <i className="fas fa-cloud-arrow-up"></i> 
                          {prototypeImage ? 'تم رفع صورة النموذج! (انقر للتغيير)' : 'ارفع صورة رسمة/مجسم النموذج الأولي 📸'}
                        </button>

                        {prototypeImage && (
                          <div className="prototype-preview-wrapper">
                            <img src={prototypeImage} alt="معاينة النموذج الأولي" className="prototype-preview-img" />
                          </div>
                        )}
                      </div>

                      <button type="submit" className="submit-stem-btn">
                        <i className="fas fa-paper-plane"></i> إرسال الفكرة والانتقال لمرحلة المتابعة 🔍 (+100 نقطة ⭐)
                      </button>
                    </form>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Approved Student Solutions Showcase */}
          <div className="solutions-list-section">
            <h3 className="section-sub-title">
              <i className="fas fa-award"></i> معرض حلول ومبتكرات طلاب مشيرفة المعتمدة وتقييم اللجنة 🏅
            </h3>
            
            <div className="solutions-grid">
              {solutions.map((sol, index) => (
                <div key={sol.id || index} className="solution-item-card">
                  <div className="sol-card-header">
                    <span className="sol-badge">🏅 وسام مهندس الأسبوع</span>
                    {sol.participationType === 'team' && (
                      <span className="team-badge-chip">👥 {sol.teamName || 'فريق مبتكر'}</span>
                    )}
                  </div>

                  <h4>{sol.solutionTitle}</h4>
                  <p className="sol-desc">{sol.solutionDesc}</p>

                  {/* Prototype Image Display if exists */}
                  {sol.prototypeImage && (
                    <div className="card-prototype-image">
                      <img src={sol.prototypeImage} alt="مجسم نموذج الطالب" />
                    </div>
                  )}

                  <div className="sol-meta">
                    <span className="student-tag">
                      {sol.participationType === 'team' ? `👥 قائد الفريق: ${sol.teamLeader || sol.studentName}` : `👨‍🎓 المخترع: ${sol.studentName}`} ({sol.studentClass})
                    </span>
                    <span className="ch-tag">📌 {sol.challengeTitle}</span>
                  </div>

                  {/* 5. Teacher / STEM Committee Feedback & Rating Stars */}
                  <div className="teacher-feedback-card">
                    <div className="stars-row">
                      <span className="stars-label">تقييم لجنة الـ STEM:</span>
                      <span className="stars-icons">
                        {'⭐'.repeat(sol.teacherStars || 5)}
                      </span>
                    </div>
                    <p className="feedback-text">
                      <i className="fas fa-comment-dots"></i> {sol.teacherFeedback || '🏅 ممتازة جداً! فكرة تكنولوجية ملهمة.'}
                    </p>
                  </div>

                  <div className="sol-footer">
                    <button className="like-btn" onClick={() => handleLikeSolution(index)}>
                      👏 تشجيع وسام إبداع ({sol.likes || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 5: Interactive Follow-Up & Milestone Progress Tracker  */}
      {/* ======================================================== */}
      {activeTab === 'tracking' && (
        <section className="stem-section animate-fade">
          <div className="section-header-box">
            <h2><i className="fas fa-bars-progress"></i> مرحلة متابعة التحدي والنموذج الأولي 🔍</h2>
            <p>تتبع مراحل تقدم مشاريعك التنافسية خطوة بخطوة، واطلع على توجيهات معلم الـ STEM، وارفع تحديثات مجسمك ورسمتك الهندسية!</p>

            <div className="teacher-quick-notice-banner">
              <span>👨‍🏫 هل أنت معلم المادة؟</span>
              <button 
                onClick={() => window.location.hash = '#/stem-teacher'}
                className="teacher-notice-link-btn"
              >
                اضغط هنا لدخول بوابة معلم الموضوع لمتابعة وتوجيه الطلاب 🔐
              </button>
            </div>
          </div>

          <div className="tracking-dashboard-wrapper">
            {solutions.length === 0 ? (
              <div className="no-solutions-notice">
                <i className="fas fa-folder-open"></i>
                <p>لم تقم بتسجيل أي تحدٍّ بعد! عد إلى تبويب "صناع الحلول" واختر تحدياً جديداً لتأكيد حضورك ومتابعته هنا.</p>
              </div>
            ) : (
              <div className="tracking-cards-list">
                {solutions.map((sol, idx) => {
                  const currentStage = sol.currentStage || 2;
                  const stageInfo = STAGE_LABELS[currentStage] || STAGE_LABELS[2];

                  return (
                    <div key={sol.id || idx} className="tracking-card">
                      <div className="tracking-header">
                        <div className="tracking-title-group">
                          <span className="ch-type-badge">{sol.challengeTitle}</span>
                          <h3>{sol.solutionTitle}</h3>
                          <div className="author-info">
                            {sol.participationType === 'team' ? `👥 الفريق: ${sol.teamName} (القائد: ${sol.teamLeader})` : `👨‍🎓 المخترع/ة: ${sol.studentName}`} | {sol.studentClass}
                          </div>
                        </div>

                        <div className="current-stage-badge" style={{ background: stageInfo.color }}>
                          <i className={`fas ${stageInfo.icon}`}></i> {stageInfo.title}
                        </div>
                      </div>

                      {/* 🌟 Visual 4-Stage Progress Bar Timeline */}
                      <div className="timeline-stepper">
                        {[1, 2, 3, 4].map(stepNum => {
                          const stepData = STAGE_LABELS[stepNum];
                          const isDone = currentStage >= stepNum;
                          const isCurrent = currentStage === stepNum;

                          return (
                            <div key={stepNum} className={`stepper-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                              <div className="step-circle">
                                {isDone ? <i className="fas fa-check"></i> : stepNum}
                              </div>
                              <span className="step-label">{stepData.title}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Teacher Feedback & Directives Box */}
                      <div className="teacher-directives-box">
                        <h4><i className="fas fa-chalkboard-user"></i> توجيهات معلم وموجه الـ STEM بالمدرسة:</h4>
                        <p className="directive-msg">
                          "{sol.teacherFeedback || 'رائع جداً! استمر في تجميع الأدوات الهندسية وإعداد نموذج الرسم الأولية للعرص.'}"
                        </p>

                        <div className="stars-indicator">
                          تقييم مرحلة المتابعة: {'⭐'.repeat(sol.teacherStars || 5)}
                        </div>
                      </div>

                      {/* Student Progress Updates List */}
                      {sol.studentUpdates && sol.studentUpdates.length > 0 && (
                        <div className="student-updates-history">
                          <h5>📝 سجل التحديثات والمتابعة المضافة:</h5>
                          <ul>
                            {sol.studentUpdates.map((upd, uIdx) => (
                              <li key={uIdx}><i className="fas fa-angle-left"></i> {upd}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Prototype Image preview if uploaded */}
                      {sol.prototypeImage && (
                        <div className="tracking-prototype-view">
                          <h5>📸 صورة النموذج/الرسمة الأخيرة المرفوقة:</h5>
                          <img src={sol.prototypeImage} alt="صورة النموذج المطوّر" />
                        </div>
                      )}

                      {/* Action Button: Post Progress Update */}
                      <div className="tracking-action-bar">
                        <button 
                          className="post-update-btn"
                          onClick={() => {
                            setSelectedSolForUpdate(sol);
                            setUpdateModalOpen(true);
                          }}
                        >
                          <i className="fas fa-plus-circle"></i> إضافة تحديث جديد / رفع صورة نموذج أحدث 📸 (+30 نقطة ⭐)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Follow-Up Update Modal Window */}
          {updateModalOpen && selectedSolForUpdate && (
            <div className="stem-modal-overlay" onClick={() => setUpdateModalOpen(false)}>
              <div className="stem-modal-container small-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={() => setUpdateModalOpen(false)}>
                  <i className="fas fa-times"></i>
                </button>

                <div className="modal-header-banner" style={{ background: '#8b5cf6' }}>
                  <div className="modal-header-icon"><i className="fas fa-camera"></i></div>
                  <div>
                    <span className="modal-category">مرحلة المتابعة والتطوير</span>
                    <h2>إضافة تحديث لمشروع: {selectedSolForUpdate.solutionTitle}</h2>
                  </div>
                </div>

                <form onSubmit={handleSaveProgressUpdate} className="stem-form update-form" style={{ padding: '25px' }}>
                  <div className="form-group">
                    <label><i className="fas fa-pen"></i> اكتب ما قمت بتنفيذه في هذا التحديث (مثل: تم شراء المواد أو رسم المخطط):</label>
                    <textarea 
                      rows="3"
                      placeholder="مثال: قمت برسم المخطط وتجميع كرتونات التدوير وبدء قص الأرجل..."
                      value={progressUpdateText}
                      onChange={(e) => setProgressUpdateText(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <div className="form-group prototype-upload-box">
                    <label><i className="fas fa-camera"></i> ارفع صورة للنموذج بعد التعديل أو الرسمة الأخيرة (اختياري 📸):</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={updateFileInputRef}
                      onChange={handleUpdateImageUpload}
                      style={{ display: 'none' }}
                    />
                    <button 
                      type="button" 
                      className="upload-trigger-btn"
                      onClick={() => updateFileInputRef.current && updateFileInputRef.current.click()}
                    >
                      <i className="fas fa-cloud-arrow-up"></i> 
                      {updatedPhoto ? 'تم اختيار الصورة الأخيرة! (انقر للتغيير)' : 'ارفع صورة المجسم / الرسمة الجديدة 📸'}
                    </button>

                    {updatedPhoto && (
                      <div className="prototype-preview-wrapper">
                        <img src={updatedPhoto} alt="صورة التحديث" className="prototype-preview-img" />
                      </div>
                    )}
                  </div>

                  <button type="submit" className="submit-stem-btn">
                    <i className="fas fa-check-double"></i> حفظ التحديث وتطوير مرحلة المشروع 🚀
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 2: Simple Home Experiments (تجارب علمية منزلية)      */}
      {/* ======================================================== */}
      {activeTab === 'experiments' && (
        <section className="stem-section animate-fade">
          <div className="section-header-box">
            <h2><i className="fas fa-flask"></i> تجارب علمية منزلية مبسطة وآمنة</h2>
            <p>نفذ التجارب العلمية الممتعة مع أسرتك في المنزل واستكشف أسرار الطبيعة والعلوم بنفسك!</p>
          </div>

          <div className="experiments-grid">
            {DEFAULT_EXPERIMENTS.map(exp => {
              const isDone = completedExperiments.includes(exp.id);
              return (
                <div key={exp.id} className={`exp-card ${isDone ? 'done' : ''}`}>
                  <div className="exp-top-banner">
                    <div className="exp-icon"><i className={`fas ${exp.icon}`}></i></div>
                    <span className="exp-difficulty">{exp.difficulty}</span>
                  </div>

                  <h3 className="exp-title">{exp.title}</h3>

                  {/* Items Needed */}
                  <div className="exp-box items-box">
                    <h4>🛠️ ماذا نحتاج؟ (الأدوات المطلوبة):</h4>
                    <ul>
                      {exp.items.map((item, i) => (
                        <li key={i}><i className="fas fa-check-circle"></i> {item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Steps */}
                  <div className="exp-box steps-box">
                    <h4>📝 خطوات التجربة:</h4>
                    <ol>
                      {exp.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Science Secret */}
                  <div className="science-secret-box">
                    <span className="secret-badge">🔬 السر العلمي:</span>
                    <p>{exp.scienceSecret}</p>
                  </div>

                  {/* Action Button */}
                  <button 
                    className={`exp-action-btn ${isDone ? 'completed' : ''}`}
                    onClick={() => handleCompleteExperiment(exp.id)}
                  >
                    {isDone ? '✓ تم تنفيذ هذه التجربة! (+50 نقطة ⭐)' : '📸 جربتها في المنزل! (+50 نقطة ⭐)'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 3: Interactive JS STEM Games (محطة الألعاب والتحفيز)   */}
      {/* ======================================================== */}
      {activeTab === 'games' && (
        <section className="stem-section animate-fade">
          <div className="section-header-box">
            <h2><i className="fas fa-gamepad"></i> محطة الألعاب والتفكير المنطقي 🎮</h2>
            <p>العب، فكّر، وطوّر مهاراتك في الرياضيات والتكنولوجيا والهندسة أثناء جمع النقاط للأوسمة!</p>
          </div>

          <div className="games-container">
            {/* GAME 1: Math Balance Scale */}
            <div className="game-card balance-game">
              <div className="game-badge">⚖️ لعبة 1: ميزان الرياضيات والهندسة</div>
              <h3>تحدي كفتي الميزان الرقمي</h3>
              <p className="game-instruction">اختر الرقم المناسب لتوازن كفتي الميزان وتساوي المجموع!</p>

              <div className="balance-scale-display">
                <div className="scale-pan left-pan">
                  <span className="pan-label">الكفة اليسرى 👈</span>
                  <span className="pan-weight">{balanceLeft} kg</span>
                </div>
                <div className="scale-fulcrum">⚖️</div>
                <div className="scale-pan right-pan">
                  <span className="pan-label">الكفة اليمنى 👉</span>
                  <span className="pan-weight">{balanceRightTarget} + <small className="missing-target">؟</small> kg</span>
                </div>
              </div>

              {balanceFeedback && (
                <div className={`game-feedback-banner ${balanceFeedback.includes('أحسنت') ? 'success' : 'error'}`}>
                  {balanceFeedback}
                </div>
              )}

              <div className="balance-options">
                <span className="opt-title">اختر الرقم المكمل لوزن {balanceLeft} kg:</span>
                <div className="options-buttons">
                  {balanceOptions.map((opt, i) => (
                    <button key={i} className="opt-btn" onClick={() => handleBalanceOptionClick(opt)}>
                      {opt} kg
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* GAME 2: Simple Circuit Builder */}
            <div className="game-card circuit-game">
              <div className="game-badge">⚡ لعبة 2: تركيب الدارة الكهربائية</div>
              <h3>تحدي إضاءة المصباح الذكي</h3>
              <p className="game-instruction">انقر على المكونات الثلاثة لتوصيل البطارية والسلك والمفتاح لإضاءة المصباح!</p>

              <div className="circuit-board">
                <div 
                  className={`circuit-part battery-part ${circuitBattery ? 'active' : ''}`}
                  onClick={() => setCircuitBattery(!circuitBattery)}
                >
                  <i className="fas fa-battery-full"></i>
                  <span>1. البطارية 🔋 ({circuitBattery ? 'موصولة ✓' : 'انقر للتوصيل'})</span>
                </div>

                <div 
                  className={`circuit-part wire-part ${circuitWire ? 'active' : ''}`}
                  onClick={() => setCircuitWire(!circuitWire)}
                >
                  <i className="fas fa-plug"></i>
                  <span>2. السلك 🧵 ({circuitWire ? 'موصول ✓' : 'انقر للتوصيل'})</span>
                </div>

                <div 
                  className={`circuit-part switch-part ${circuitSwitch ? 'active' : ''}`}
                  onClick={() => setCircuitSwitch(!circuitSwitch)}
                >
                  <i className="fas fa-toggle-on"></i>
                  <span>3. المفتاح 🔘 ({circuitSwitch ? 'مغلق/مغلق ✓' : 'انقر للتشغيل'})</span>
                </div>
              </div>

              {/* Lightbulb Output Result */}
              <div className={`bulb-output-display ${circuitBattery && circuitWire && circuitSwitch ? 'lit' : ''}`}>
                <div className="bulb-icon">
                  <i className="fas fa-lightbulb"></i>
                </div>
                <h4>
                  {circuitBattery && circuitWire && circuitSwitch 
                    ? '🎉 مبروك! أضاء المصباح بنجاح! اكتملت الدارة المغلقة! (+40 نقطة ⭐)'
                    : '💡 المصباح منطفئ... قم بتوصيل جميع المكونات ليجري التيار الكهربائي!'}
                </h4>
              </div>
            </div>

            {/* GAME 3: Recycling Eco Game */}
            <div className="game-card recycling-game">
              <div className="game-badge">♻️ لعبة 3: فرز وحماية البيئة</div>
              <h3>تحدي المهندس البيئي الصغير</h3>
              <p className="game-instruction">ضع المادة الظاهرة في سلة التدوير المناسبة لحماية بيئة مدرسة مشيرفة!</p>

              <div className="recycle-item-box">
                <span className="recycle-label">المادة الحالية للفرز:</span>
                <div className="recycle-current-item">
                  {RECYCLING_ITEMS[recyclingIndex].name}
                </div>
              </div>

              {recyclingFeedback && (
                <div className={`game-feedback-banner ${recyclingFeedback.includes('ممتاز') ? 'success' : 'error'}`}>
                  {recyclingFeedback}
                </div>
              )}

              <div className="bins-row">
                <button className="bin-btn paper-bin" onClick={() => handleRecycleBinClick('paper')}>
                  🗑️ سلة الورق والكرتون 📄
                </button>
                <button className="bin-btn plastic-bin" onClick={() => handleRecycleBinClick('plastic')}>
                  🗑️ سلة البلاستيك 🧴
                </button>
                <button className="bin-btn organic-bin" onClick={() => handleRecycleBinClick('organic')}>
                  🗑️ سلة العضوي والطعوم 🍏
                </button>
              </div>

              <div className="game-footer-score">
                <span>مجموع نقاط لعبة البيئة: <strong>{recyclingScore} نقطة</strong></span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 4: Student Projects Gallery (معرض إبداعات الطلاب)     */}
      {/* ======================================================== */}
      {activeTab === 'gallery' && (
        <section className="stem-section animate-fade">
          <div className="section-header-box">
            <h2><i className="fas fa-palette"></i> معرض إبداعات ومشاريع الطلاب</h2>
            <p>استعرض الابتكارات والمجسمات الرائعة التي صممها طلاب مدرسة مشيرفة الابتدائية!</p>
          </div>

          <div className="student-projects-grid">
            <div className="project-card">
              <div className="project-img-placeholder p1">
                <i className="fas fa-car-side"></i>
              </div>
              <div className="project-body">
                <span className="project-badge">مجسم هندسي 🚗</span>
                <h3>سيارة البالون والدفع الارتدادي</h3>
                <p>مشروع يوضح كيف يتحول هواء البالون إلى طاقة حركية تدفع العجلات للأمام.</p>
                <div className="project-author">👨‍🎓 المبتكر: يوسف ارفاعية - الصف الرابع</div>
              </div>
            </div>

            <div className="project-card">
              <div className="project-img-placeholder p2">
                <i className="fas fa-house-sun"></i>
              </div>
              <div className="project-body">
                <span className="project-badge">طاقة متجددة ☀️</span>
                <h3>منزل الطاقة الشمسية المصغر</h3>
                <p>نموذج منزل يعمل بخلية شمسية صغيرة لإضاءة الغرف في النهار والليل.</p>
                <div className="project-author">👩‍🎓 المبتكرة: سارة محمود - الصف الخامس</div>
              </div>
            </div>

            <div className="project-card">
              <div className="project-img-placeholder p3">
                <i className="fas fa-trash-can-arrow-up"></i>
              </div>
              <div className="project-body">
                <span className="project-badge">حماية بيئية ♻️</span>
                <h3>حاوية تدوير العلب الذكية</h3>
                <p>مجسم حاوية مجهزة بفتحات قياسية لفصل علب الألمنيوم عن البلاستيك.</p>
                <div className="project-author">👨‍🎓 المبتكر: عمر أحمد - الصف الثالث</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB: Socratic STEM Mentor ("المكتشف الصغير")             */}
      {/* ======================================================== */}
      {activeTab === 'socratic' && (
        <section className="stem-section animate-fade">
          <div className="section-header-box" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 16px', borderRadius: '30px', color: '#1d4ed8', fontWeight: 800, fontSize: '0.9rem', marginBottom: '8px' }}>
              <span>🚀</span> المرشد السقراطي للعلوم والابتكار
            </div>
            <h2 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '4px 0' }}>
              المكتشف الصغير <span style={{ color: '#2563eb' }}>STEM 🤖💡</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
              فكر، جرب، واكتشف الحل بنفسك! لن أعطيك إجابات جاهزة، بل سأرشدك خطوة بخطوة لتفكر كعالم ومهندس حقيقي.
            </p>
          </div>

          {/* STEM Idea Development Stepper Guide */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            margin: '0 auto 1.5rem',
            maxWidth: '720px',
            background: '#ffffff',
            padding: '10px 16px',
            borderRadius: '16px',
            border: '1px solid #bfdbfe',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.88rem' }}>🎯 مسار تطوير فكرتك:</span>
            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>1. فهم المشكلة 🔍</span>
            <span style={{ color: '#94a3b8' }}>➔</span>
            <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>2. المواد والخامات 📐</span>
            <span style={{ color: '#94a3b8' }}>➔</span>
            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>3. آلية العمل 🛠️</span>
            <span style={{ color: '#94a3b8' }}>➔</span>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>4. الاختبار والنموذج 💡</span>
          </div>

          <div className="socratic-widget-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="socratic-chat-card" style={{
              width: '100%',
              maxWidth: '720px',
              background: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 12px 36px rgba(37, 99, 235, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              height: '75vh',
              minHeight: '540px',
              overflow: 'hidden',
              border: '2px solid #d0e3ff'
            }}>
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '42px', height: '42px', background: 'white', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    🤖
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>المكتشف الصغير (STEM)</h3>
                    <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>مرشد التفكير العلمي السقراطي</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetSocratic}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background 0.2s'
                  }}
                  title="بدء جلسة تفكير جديدة"
                >
                  <i className="fas fa-rotate-right"></i> جديد 🔄
                </button>
              </div>

              {/* Chat Messages */}
              <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: '#f8fafc'
              }}>
                {socraticMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-start' : 'flex-end',
                      width: '100%'
                    }}
                  >
                    <div style={{
                      maxWidth: '82%',
                      padding: '12px 18px',
                      borderRadius: '18px',
                      lineHeight: 1.6,
                      fontSize: '0.96rem',
                      wordBreak: 'break-word',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#ffffff',
                      color: msg.role === 'user' ? '#ffffff' : '#0369a1',
                      borderBottomLeftRadius: msg.role === 'user' ? '4px' : '18px',
                      borderBottomRightRadius: msg.role === 'bot' ? '4px' : '18px',
                      border: msg.role === 'bot' ? '1.5px solid #bae6fd' : 'none',
                      boxShadow: msg.role === 'bot' ? '0 2px 8px rgba(2, 132, 199, 0.08)' : '0 2px 8px rgba(37, 99, 235, 0.25)'
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isSocraticTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      background: '#e0f2fe',
                      borderRadius: '16px',
                      borderBottomRightRadius: '4px',
                      color: '#0369a1',
                      fontSize: '0.9rem',
                      fontWeight: 700
                    }}>
                      <span>يفكر المكتشف الصغير... 💭</span>
                      <i className="fas fa-spinner fa-spin"></i>
                    </div>
                  </div>
                )}
                <div ref={socraticChatEndRef} />
              </div>

              {/* Quick Starters */}
              <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                padding: '10px 16px',
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0'
              }}>
                {[
                  'كيف أصنع مجسماً لجسر قوي؟',
                  'كيف أجعل سيارة اللعبة أسرع؟',
                  'لماذا ينطفئ المصباح إذا انقطع السلك؟'
                ].map((st, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendSocraticMessage(st)}
                    disabled={isSocraticTyping}
                    style={{
                      background: '#f1f5f9',
                      color: '#1e293b',
                      border: '1px solid #cbd5e1',
                      padding: '7px 14px',
                      borderRadius: '14px',
                      fontSize: '0.85rem',
                      cursor: isSocraticTyping ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      fontWeight: 700,
                      transition: 'all 0.2s'
                    }}
                  >
                    💡 {st}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div style={{
                display: 'flex',
                padding: '12px 16px',
                borderTop: '1px solid #e2e8f0',
                background: 'white',
                gap: '8px',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  placeholder="اكتب فكرتك أو سؤالك العلمي هنا..."
                  value={socraticInput}
                  onChange={(e) => setSocraticInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendSocraticMessage(); }}
                  disabled={isSocraticTyping}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '2px solid #cbd5e1',
                    borderRadius: '14px',
                    fontSize: '0.95rem',
                    outline: 'none',
                    direction: 'rtl'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSendSocraticMessage()}
                  disabled={!socraticInput.trim() || isSocraticTyping}
                  style={{
                    background: (!socraticInput.trim() || isSocraticTyping) ? '#94a3b8' : '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '12px 22px',
                    borderRadius: '14px',
                    fontWeight: 800,
                    cursor: (!socraticInput.trim() || isSocraticTyping) ? 'not-allowed' : 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>إرسال</span>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>

              {/* Bottom Action: Export to Challenge Submission */}
              <div style={{
                background: '#f8fafc',
                padding: '10px 16px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  💡 طورت فكرتك وتريد تسليمها ونيل وسام التميز؟
                </span>
                <button
                  type="button"
                  onClick={handleExportSocraticToSolution}
                  style={{
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                  }}
                  title="نقل الأفكار التي تم التوصل إليها إلى نموذج تسليم التحدي في صناع الحلول"
                >
                  <i className="fas fa-check-circle"></i>
                  <span>اعتماد الفكرة وتسليمها في صناع الحلول (+100 نقطة ⭐)</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB: STEAM Hub Operational & Pedagogical Model Document  */}
      {/* ======================================================== */}
      {activeTab === 'steam-hub' && (
        <section className="steam-hub-model-section">
          {/* Header & Meta */}
          <div className="steam-model-hero-card">
            <div className="steam-model-badge">
              <i className="fas fa-graduation-cap"></i> وثيقة الموديل التشغيلي والبيداغوجي الرسمي
            </div>
            <h2 className="steam-model-title">
              حاضنة ستيم الرقمية <span className="highlight">(School STEAM Hub)</span>
            </h2>
            <p className="steam-model-org">
              <i className="fas fa-school"></i> مدرسة مشيرفة الابتدائية — منصة تفاعلية للابتكار وريادة التفكير الطلابي
            </p>

            <div className="steam-model-goal-box">
              <div className="goal-icon">
                <i className="fas fa-bullseye"></i>
              </div>
              <div className="goal-content">
                <strong>الهدف الاستراتيجي للمنظومة:</strong>
                <p>
                  كسر القوالب التقليدية للتعلم عبر توظيف موقع المدرسة كمنظومة تشغيل وبحث، لدمج كافة التخصصات المنهجية لحل مشكلات مدرسية واقعية وتنمية وكالة الطالب (Student Agency).
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="steam-model-quick-actions">
              <button 
                type="button" 
                className="model-action-btn primary"
                onClick={() => setActiveTab('challenges')}
              >
                <i className="fas fa-rocket"></i> الانتقال لصناع الحلول (التحديات المدرسية)
              </button>
              <button 
                type="button" 
                className="model-action-btn secondary"
                onClick={() => window.location.hash = '#/stem-teacher'}
              >
                <i className="fas fa-chalkboard-teacher"></i> بوابة معلم المادة للتقييم والتوجيه
              </button>
              <button 
                type="button" 
                className="model-action-btn secondary"
                onClick={() => setActiveTab('socratic')}
              >
                <i className="fas fa-robot"></i> محاورة المكتشف الصغير (سقراطي)
              </button>
              <button 
                type="button" 
                className="model-action-btn outline"
                onClick={() => window.print()}
              >
                <i className="fas fa-print"></i> طباعة / حفظ الوثيقة
              </button>
            </div>
          </div>

          {/* Section 1: Philosophy & Vision */}
          <div className="steam-doc-block">
            <div className="doc-block-header">
              <div className="block-number">1</div>
              <div className="block-title-group">
                <h3>فلسفة الموديل وفكرة المنصة</h3>
                <span className="block-subtitle">من مجرد واجهة إخبارية إلى مختبر تفكير هندسي وبحثي مفتوح</span>
              </div>
            </div>

            <div className="doc-content-body">
              <p className="doc-lead-text">
                بدلًا من فرض حصص متزامنة ترهق الجدول المدرسي، يتحول موقع المدرسة من مجرد واجهة إخبارية إلى <strong>مختبر تفكير هندسي وبحثي مفتوح</strong> يتكامل فيه التعلم الصفي مع الواقع العملي للبيئة المدرسية.
              </p>

              <div className="philosophy-grid">
                <div className="phil-card">
                  <div className="phil-icon-circle blue">
                    <i className="fas fa-crosshairs"></i>
                  </div>
                  <h4>المحرك الأساسي</h4>
                  <p>
                    مشكلة حقيقية من واقع المدرسة (مثل: أوزان الحقائب، هدر مياه الشرب، الضوضاء، تنظيم الساحات، ترشيد الطاقة).
                  </p>
                </div>

                <div className="phil-card">
                  <div className="phil-icon-circle purple">
                    <i className="fas fa-network-wired"></i>
                  </div>
                  <h4>طريقة التعلم (Blended / Asynchronous Hub)</h4>
                  <p>
                    التحدي يطرح رقميًا عبر المنصة مع مصادر توجيهية ولقاءات إرشادية قصيرة. البحث والتجريب يتم فرديًا أو في مجموعات، والمنصة توثق المسار التراكمي وتدير تسليم المخرجات وتلقي التغذية الراجعة.
                  </p>
                </div>

                <div className="phil-card">
                  <div className="phil-icon-circle green">
                    <i className="fas fa-seedling"></i>
                  </div>
                  <h4>وكالة الطالب (Student Agency)</h4>
                  <p>
                    وضع الطالب في مركز القيادة وصناعة القرار: من تحديد المشكلة وتحليلها، إلى قيادة الفريق وهندسة النموذج واختباره وتعديله.
                  </p>
                </div>
              </div>

              {/* STEAM 5 Pillars Matrix */}
              <div className="steam-pillars-container">
                <h4 className="pillars-heading">
                  <i className="fas fa-puzzle-piece"></i> الدمج البيداغوجي (STEAM): تكامل التخصصات الخمسة لحل كل تحدٍ مدرسي
                </h4>
                <div className="pillars-grid">
                  <div className="pillar-card s">
                    <div className="pillar-header">
                      <span className="pillar-letter">S</span>
                      <span className="pillar-name">العلوم (Science)</span>
                    </div>
                    <p className="pillar-desc">
                      تفسير الظواهر العلمية، جمع البيانات الميدانية، وضع الفرضيات وإجراء الفحوصات والتجارب المخبرية والحقلية.
                    </p>
                  </div>

                  <div className="pillar-card t">
                    <div className="pillar-header">
                      <span className="pillar-letter">T</span>
                      <span className="pillar-name">التكنولوجيا (Technology)</span>
                    </div>
                    <p className="pillar-desc">
                      البحث الرقمي، توظيف الحساسات الذكية (Sensors)، برمجيات المحاكاة والنمذجة، وتطبيقات الذكاء الاصطناعي التوليدي.
                    </p>
                  </div>

                  <div className="pillar-card e">
                    <div className="pillar-header">
                      <span className="pillar-letter">E</span>
                      <span className="pillar-name">الهندسة (Engineering)</span>
                    </div>
                    <p className="pillar-desc">
                      تطبيق مراحل التفكير التصميمي (Design Thinking)، تخطيط النماذج الأولية، واختيار المواد المناسبة وتجربة الأداء.
                    </p>
                  </div>

                  <div className="pillar-card a">
                    <div className="pillar-header">
                      <span className="pillar-letter">A</span>
                      <span className="pillar-name">الفنون واللغات (Arts & Languages)</span>
                    </div>
                    <p className="pillar-desc">
                      الكتابة الإقناعية والتوثيق، التصميم الجمالي وتجربة المستخدم، والإلقاء والعرض الفعّال (Elevator Pitch).
                    </p>
                  </div>

                  <div className="pillar-card m">
                    <div className="pillar-header">
                      <span className="pillar-letter">M</span>
                      <span className="pillar-name">الرياضيات (Mathematics)</span>
                    </div>
                    <p className="pillar-desc">
                      القياسات والحسابات الدقيقة، الجداول والنسب، دراسة التكاليف والجدوى، والتحليل الإحصائي الدقيق للنتائج.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Six Stations (Student Workflow) */}
          <div className="steam-doc-block">
            <div className="doc-block-header">
              <div className="block-number">2</div>
              <div className="block-title-group">
                <h3>المحطات الست في مسار الطالب (Interactive STEAM Studio)</h3>
                <span className="block-subtitle">مختبر التفكير الهندسي والبحثي: صمم، جرب، وحل مشكلات مدرستك خطوة بخطوة</span>
              </div>
              <div className="hub-mode-toggle-group">
                <button
                  type="button"
                  className={`hub-toggle-btn ${hubViewMode === 'interactive' ? 'active' : ''}`}
                  onClick={() => setHubViewMode('interactive')}
                >
                  <i className="fas fa-flask-vial"></i> الاستوديو التفاعلي
                </button>
                <button
                  type="button"
                  className={`hub-toggle-btn ${hubViewMode === 'summary' ? 'active' : ''}`}
                  onClick={() => setHubViewMode('summary')}
                >
                  <i className="fas fa-list-check"></i> النظرة الشاملة
                </button>
              </div>
            </div>

            <div className="doc-content-body">
              {hubSubmitSuccess && (
                <div className="hub-success-alert">
                  <i className="fas fa-circle-check"></i>
                  <span>{hubSubmitSuccess}</span>
                </div>
              )}

              {/* INTERACTIVE STUDIO VIEW */}
              {hubViewMode === 'interactive' && (
                <div className="steam-interactive-studio">
                  {/* Stepper Navigation */}
                  <div className="studio-stepper-bar">
                    {[
                      { num: 1, title: 'اكتشاف المشكلة', icon: 'fa-magnifying-glass' },
                      { num: 2, title: 'مصفوفة STEAM', icon: 'fa-puzzle-piece' },
                      { num: 3, title: 'النموذج والإلقاء', icon: 'fa-drafting-compass' },
                      { num: 4, title: 'الاختبار والتقييم', icon: 'fa-vial-circle-check' },
                      { num: 5, title: 'التحسين V2', icon: 'fa-arrows-rotate' },
                      { num: 6, title: 'قياس الأثر والتكريم', icon: 'fa-trophy' }
                    ].map(st => (
                      <button
                        key={st.num}
                        type="button"
                        className={`stepper-station-btn ${hubActiveStation === st.num ? 'active' : ''}`}
                        onClick={() => setHubActiveStation(st.num)}
                      >
                        <span className="step-circle">{st.num}</span>
                        <span className="step-txt">{st.title}</span>
                      </button>
                    ))}
                  </div>

                  {/* Station 1: Problem Discovery */}
                  {hubActiveStation === 1 && (
                    <div className="station-workspace-card station-1-card">
                      <div className="station-card-banner">
                        <div className="banner-icon blue">
                          <i className="fas fa-magnifying-glass"></i>
                        </div>
                        <div className="banner-content">
                          <span className="station-tag">المحطة 1 من 6</span>
                          <h4>اكتشاف المشكلة وفهمها (Problem Discovery)</h4>
                          <p>
                            مرحباً بك يا بطل الاستكشاف! 🌟 مهمتك هنا هي ملاحظة مشكلة واقعية في مدرسة مشيرفة، وشرحها بدقة، وتوضيح <strong>لماذا هي مشكلة حقيقية</strong> تؤثر على الطلاب والبيئة المدرسية.
                          </p>
                        </div>
                      </div>

                      {/* Problem Quick Presets Chips */}
                      <div className="preset-selector-row">
                        <span className="preset-label">💡 اختر تحدياً مقترحاً أو اكتب مشكلتك الخاصة:</span>
                        <div className="preset-chips">
                          <button
                            type="button"
                            className={`preset-chip ${hubSelectedPresetKey === 'bag' ? 'active' : ''}`}
                            onClick={() => handleSelectHubPreset('bag')}
                          >
                            🎒 حقيبة الظهر الثقيلة
                          </button>
                          <button
                            type="button"
                            className={`preset-chip ${hubSelectedPresetKey === 'water' ? 'active' : ''}`}
                            onClick={() => handleSelectHubPreset('water')}
                          >
                            💧 هدر مياه المغاسل
                          </button>
                          <button
                            type="button"
                            className={`preset-chip ${hubSelectedPresetKey === 'power' ? 'active' : ''}`}
                            onClick={() => handleSelectHubPreset('power')}
                          >
                            💡 توفير إضاءة الصفوف
                          </button>
                          <button
                            type="button"
                            className={`preset-chip ${hubSelectedPresetKey === 'noise' ? 'active' : ''}`}
                            onClick={() => handleSelectHubPreset('noise')}
                          >
                            🔇 ضوضاء الكراسي
                          </button>
                          <button
                            type="button"
                            className={`preset-chip ${hubSelectedPresetKey === 'custom' ? 'active' : ''}`}
                            onClick={() => handleSelectHubPreset('custom')}
                          >
                            ✏️ مشكلة جديدة من اقتراحي
                          </button>
                        </div>
                      </div>

                      {/* Station 1 Interactive Questions */}
                      <div className="station-form-grid">
                        <div className="stem-input-group full">
                          <label>
                            <i className="fas fa-heading"></i> 1. عنوان المشكلة أو التحدي المدرسي:
                          </label>
                          <input
                            type="text"
                            value={hubStationData.problemTitle}
                            onChange={(e) => setHubStationData({ ...hubStationData, problemTitle: e.target.value })}
                            placeholder="مثال: تحدي تقليل وزن الحقيبة المدرسية، أو ترشيد مياه المغاسل..."
                            className="stem-text-input"
                          />
                        </div>

                        <div className="stem-input-group full">
                          <label>
                            <i className="fas fa-eye"></i> 2. ما هي المشكلة بالتحديد؟ (اشرح ما تلاحظه في المدرسة بالتفصيل):
                          </label>
                          <textarea
                            rows={3}
                            value={hubStationData.problemDescription}
                            onChange={(e) => setHubStationData({ ...hubStationData, problemDescription: e.target.value })}
                            placeholder="صف ما الذي يحدث بالضبط في المدرسة... متى رأيته؟ وماذا يفعل الطلاب؟"
                            className="stem-textarea"
                          />
                        </div>

                        {/* Special Accent Box for WHY it is a problem */}
                        <div className="stem-input-group full why-problem-wrapper">
                          <div className="why-problem-header">
                            <i className="fas fa-triangle-exclamation"></i>
                            <strong>3. لماذا تعتبر هذه مشكلة؟ (ما هي الأضرار والآثار السلبية الناتجة عنها؟)</strong>
                          </div>
                          <p className="why-problem-hint">
                            فكر كعالم وباحث: ما الضرر الذي يقع على صحة الطلاب، تركيزهم، البيئة المدرسية، أو الموارد إذا لم نقم بحل هذه المشكلة فوراً؟
                          </p>
                          <textarea
                            rows={3}
                            value={hubStationData.whyItIsAProblem}
                            onChange={(e) => setHubStationData({ ...hubStationData, whyItIsAProblem: e.target.value })}
                            placeholder="مثال: لأنها تسبب آلاماً في العمود الفقري للطلاب، وتؤدي لتشتيت الانتباه أثناء الحصص، وتكلف المدرسة مبالغ إضافية..."
                            className="stem-textarea why-textarea"
                          />
                        </div>

                        <div className="stem-input-group half">
                          <label>
                            <i className="fas fa-users"></i> 4. من هم الأشخاص المتأثرون بهذه المشكلة؟
                          </label>
                          <input
                            type="text"
                            value={hubStationData.whoIsAffected}
                            onChange={(e) => setHubStationData({ ...hubStationData, whoIsAffected: e.target.value })}
                            placeholder="مثال: طلاب الصفوف الثالث والرابع، المعلمون، طاقم النظافة..."
                            className="stem-text-input"
                          />
                        </div>

                        <div className="stem-input-group half">
                          <label>
                            <i className="fas fa-location-dot"></i> 5. متى وأين تحدث هذه المشكلة في مدرستنا؟
                          </label>
                          <input
                            type="text"
                            value={hubStationData.whereAndWhen}
                            onChange={(e) => setHubStationData({ ...hubStationData, whereAndWhen: e.target.value })}
                            placeholder="مثال: في ساحة الاستراحة أثناء الفطور، أو عند صعود الأدراج صباحاً..."
                            className="stem-text-input"
                          />
                        </div>
                      </div>

                      {/* AI Mentor Scaffolding */}
                      <div className="hub-ai-helper-box">
                        <button
                          type="button"
                          className="hub-ai-btn"
                          disabled={hubIsAiLoading[1]}
                          onClick={() => handleRequestHubAi(1)}
                        >
                          <i className={`fas ${hubIsAiLoading[1] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                          <span>{hubIsAiLoading[1] ? 'المكتشف الصغير يفكر معك...' : 'استشر المكتشف الصغير: كيف أصوغ المشكلة وأشرح أثرها؟'}</span>
                        </button>

                        {hubAiGuidance[1] && (
                          <div className="hub-ai-response-card">
                            <div className="response-header">
                              <i className="fas fa-lightbulb"></i> إرشادات المكتشف الصغير السقراطي:
                            </div>
                            <div className="response-text" style={{ whiteSpace: 'pre-line' }}>
                              {hubAiGuidance[1]}
                            </div>
                            <button
                              type="button"
                              className="apply-ai-hint-btn"
                              onClick={() => {
                                setHubStationData(prev => ({
                                  ...prev,
                                  whyItIsAProblem: prev.whyItIsAProblem + '\n• نصيحة المكتشف الصغير: ' + hubAiGuidance[1].slice(0, 140) + '...'
                                }));
                              }}
                            >
                              <i className="fas fa-copy"></i> تضمين نصيحة المكتشف في خانة "لماذا هي مشكلة"
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Station Actions */}
                      <div className="station-bottom-actions">
                        <span className="hint-text">💡 تأكد من إجابتك ثم انتقل لمصفوفة STEAM</span>
                        <button
                          type="button"
                          className="next-station-btn"
                          onClick={() => setHubActiveStation(2)}
                        >
                          <span>الانتقال للمحطة 2 (مصفوفة STEAM)</span>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Station 2: STEAM Matrix */}
                  {hubActiveStation === 2 && (
                    <div className="station-workspace-card station-2-card">
                      <div className="station-card-banner">
                        <div className="banner-icon cyan">
                          <i className="fas fa-puzzle-piece"></i>
                        </div>
                        <div className="banner-content">
                          <span className="station-tag">المحطة 2 من 6</span>
                          <h4>مصفوفة تكامل التخصصات (STEAM Matrix)</h4>
                          <p>
                            في هذه المحطة، نفكك التحدي إلى الأركان الخمسة: <strong>العلوم، التكنولوجيا، الهندسة، الفنون واللغات، والرياضيات</strong>. كل حل متكامل لا بد أن تتآزر فيه هذه التخصصات معاً!
                          </p>
                        </div>
                      </div>

                      <div className="steam-matrix-inputs-grid">
                        <div className="matrix-input-card s">
                          <div className="card-top">
                            <span className="letter-badge">S</span>
                            <strong>العلوم (Science)</strong>
                          </div>
                          <span className="sub-prompt">ما القانون أو الظاهرة أو المبدأ العلمي الذي سنعتمد عليه؟</span>
                          <textarea
                            rows={3}
                            value={hubStationData.scienceAspect}
                            onChange={(e) => setHubStationData({ ...hubStationData, scienceAspect: e.target.value })}
                            placeholder="مثال: تأثير قوى الاحتكاك والجاذبية وتوزيع عزم الدوران..."
                            className="matrix-textarea"
                          />
                        </div>

                        <div className="matrix-input-card t">
                          <div className="card-top">
                            <span className="letter-badge">T</span>
                            <strong>التكنولوجيا (Technology)</strong>
                          </div>
                          <span className="sub-prompt">ما الأداة الرقمية أو الحساسات (Sensors) أو البرمجة المقترحة؟</span>
                          <textarea
                            rows={3}
                            value={hubStationData.techAspect}
                            onChange={(e) => setHubStationData({ ...hubStationData, techAspect: e.target.value })}
                            placeholder="مثال: حساس وزن رقمي، حساس حركة بالأشعة، أو تطبيق ذكي..."
                            className="matrix-textarea"
                          />
                        </div>

                        <div className="matrix-input-card e">
                          <div className="card-top">
                            <span className="letter-badge">E</span>
                            <strong>الهندسة (Engineering)</strong>
                          </div>
                          <span className="sub-prompt">كيف سنبني ونركب النموذج وما الخامات الهندسية المناسبة؟</span>
                          <textarea
                            rows={3}
                            value={hubStationData.engineeringAspect}
                            onChange={(e) => setHubStationData({ ...hubStationData, engineeringAspect: e.target.value })}
                            placeholder="مثال: هيكل كرتوني مقوّى، مفاصل متحركة، عجلات خفيفة..."
                            className="matrix-textarea"
                          />
                        </div>

                        <div className="matrix-input-card a">
                          <div className="card-top">
                            <span className="letter-badge">A</span>
                            <strong>الفنون واللغات (Arts & Languages)</strong>
                          </div>
                          <span className="sub-prompt">ما هو شعار المشروع واسمه الجذاب ولغة العرض الإقناعي؟</span>
                          <textarea
                            rows={3}
                            value={hubStationData.artsAspect}
                            onChange={(e) => setHubStationData({ ...hubStationData, artsAspect: e.target.value })}
                            placeholder="مثال: شعار المشروع، بوستر ملون، وسيناريو إلقاء في دقيقة واحدة..."
                            className="matrix-textarea"
                          />
                        </div>

                        <div className="matrix-input-card m">
                          <div className="card-top">
                            <span className="letter-badge">M</span>
                            <strong>الرياضيات (Mathematics)</strong>
                          </div>
                          <span className="sub-prompt">ما القياسات الدقيقة، التكاليف المتوقعة، أو النسب المحسوبة؟</span>
                          <textarea
                            rows={3}
                            value={hubStationData.mathAspect}
                            onChange={(e) => setHubStationData({ ...hubStationData, mathAspect: e.target.value })}
                            placeholder="مثال: حساب وزن الحقيبة 15% من وزن الطالب، أو كمية التوفير باللترات..."
                            className="matrix-textarea"
                          />
                        </div>
                      </div>

                      {/* AI Helper for STEAM Matrix */}
                      <div className="hub-ai-helper-box">
                        <button
                          type="button"
                          className="hub-ai-btn"
                          disabled={hubIsAiLoading[2]}
                          onClick={() => handleRequestHubAi(2)}
                        >
                          <i className={`fas ${hubIsAiLoading[2] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                          <span>{hubIsAiLoading[2] ? 'المكتشف الصغير يبحث في العلوم...' : 'اقترح أفكاراً ذكية لربط التحدي بأركان STEAM الخمسة ✨'}</span>
                        </button>

                        {hubAiGuidance[2] && (
                          <div className="hub-ai-response-card">
                            <div className="response-header">
                              <i className="fas fa-lightbulb"></i> اقتراحات STEAM الذكية:
                            </div>
                            <div className="response-text" style={{ whiteSpace: 'pre-line' }}>
                              {hubAiGuidance[2]}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="station-bottom-actions between">
                        <button
                          type="button"
                          className="prev-station-btn"
                          onClick={() => setHubActiveStation(1)}
                        >
                          <i className="fas fa-arrow-right"></i>
                          <span>المحطة السابقة (اكتشاف المشكلة)</span>
                        </button>
                        <button
                          type="button"
                          className="next-station-btn"
                          onClick={() => setHubActiveStation(3)}
                        >
                          <span>الانتقال للمحطة 3 (النموذج والإلقاء)</span>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Station 3: Prototyping & Pitching */}
                  {hubActiveStation === 3 && (
                    <div className="station-workspace-card station-3-card">
                      <div className="station-card-banner">
                        <div className="banner-icon purple">
                          <i className="fas fa-drafting-compass"></i>
                        </div>
                        <div className="banner-content">
                          <span className="station-tag">المحطة 3 من 6</span>
                          <h4>هندسة النموذج الأولي والعرض (Prototyping & Pitching)</h4>
                          <p>
                            حان وقت تحويل الفكرة إلى مجسم حقيقي ومخطط هندسي! ارسم فكرتك، واكتب سيناريو الإلقاء السريع (Elevator Pitch) لتشرح اختراعك في دقيقة واحدة بإقناع وشغف.
                          </p>
                        </div>
                      </div>

                      <div className="station-form-grid">
                        <div className="stem-input-group full">
                          <label>
                            <i className="fas fa-tag"></i> 1. اسم النموذج الأولي أو الاختراع:
                          </label>
                          <input
                            type="text"
                            value={hubStationData.prototypeTitle}
                            onChange={(e) => setHubStationData({ ...hubStationData, prototypeTitle: e.target.value })}
                            placeholder="مثال: الحقيبة الذكية الموزعة للضغط V1"
                            className="stem-text-input"
                          />
                        </div>

                        <div className="stem-input-group full">
                          <label>
                            <i className="fas fa-pencil"></i> 2. وصف المخطط الهندسي وأجزاء النموذج:
                          </label>
                          <textarea
                            rows={3}
                            value={hubStationData.prototypeSketchDesc}
                            onChange={(e) => setHubStationData({ ...hubStationData, prototypeSketchDesc: e.target.value })}
                            placeholder="اشرح أجزاء النموذج: مما يتكون؟ وكيف تتصل القطع ببعضها؟"
                            className="stem-textarea"
                          />
                        </div>

                        {/* Photo Upload Box */}
                        <div className="stem-input-group full photo-upload-group">
                          <label>
                            <i className="fas fa-camera"></i> 3. رفع صورة المخطط أو المجسم الأولي:
                          </label>
                          <input
                            type="file"
                            ref={hubPhotoInputRef}
                            accept="image/*"
                            onChange={handleHubPhotoUpload}
                            style={{ display: 'none' }}
                          />
                          <div className="upload-controls">
                            <button
                              type="button"
                              className="upload-trigger-btn"
                              onClick={() => hubPhotoInputRef.current?.click()}
                            >
                              <i className="fas fa-cloud-arrow-up"></i>
                              <span>{hubStationData.prototypeImage ? 'تغيير صورة المجسم' : 'ارفع صورة رسمتك أو المجسم من جهازك'}</span>
                            </button>
                            {hubStationData.prototypeImage && (
                              <button
                                type="button"
                                className="remove-photo-btn"
                                onClick={() => setHubStationData({ ...hubStationData, prototypeImage: '' })}
                              >
                                <i className="fas fa-trash-can"></i> حذف الصورة
                              </button>
                            )}
                          </div>
                          {hubStationData.prototypeImage && (
                            <div className="hub-photo-preview">
                              <img src={hubStationData.prototypeImage} alt="Prototype preview" />
                            </div>
                          )}
                        </div>

                        {/* Pitching Script */}
                        <div className="stem-input-group full pitch-script-box">
                          <label>
                            <i className="fas fa-microphone-lines"></i> 4. سيناريو الإلقاء السريع (Elevator Pitch) في دقيقة واحدة:
                          </label>
                          <span className="sub-prompt">
                            نموذج الإلقاء الفعال: (1. المشكلة التي لاحظناها - 2. حلنا المبتكر - 3. كيف يعمل - 4. الأثر والفائدة لمدرسة مشيرفة)
                          </span>
                          <textarea
                            rows={4}
                            value={hubStationData.pitchElevatorScript}
                            onChange={(e) => setHubStationData({ ...hubStationData, pitchElevatorScript: e.target.value })}
                            placeholder="اكتب هنا ما ستقوله أمام المعلمين ولجنة التحكيم..."
                            className="stem-textarea"
                          />
                        </div>

                        <div className="stem-input-group full">
                          <label>
                            <i className="fas fa-video"></i> 5. رابط فيديو العرض الإقناعي (اختياري - YouTube أو Drive):
                          </label>
                          <input
                            type="url"
                            value={hubStationData.pitchVideoUrl}
                            onChange={(e) => setHubStationData({ ...hubStationData, pitchVideoUrl: e.target.value })}
                            placeholder="https://..."
                            className="stem-text-input"
                          />
                        </div>
                      </div>

                      {/* AI Helper for Pitching */}
                      <div className="hub-ai-helper-box">
                        <button
                          type="button"
                          className="hub-ai-btn"
                          disabled={hubIsAiLoading[3]}
                          onClick={() => handleRequestHubAi(3)}
                        >
                          <i className={`fas ${hubIsAiLoading[3] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                          <span>{hubIsAiLoading[3] ? 'المكتشف يصيغ سيناريو الإلقاء...' : 'ساعدني في صياغة سيناريو إلقاء سريع ومبهر 🎙️'}</span>
                        </button>

                        {hubAiGuidance[3] && (
                          <div className="hub-ai-response-card">
                            <div className="response-header">
                              <i className="fas fa-lightbulb"></i> مقترح الإلقاء السريع:
                            </div>
                            <div className="response-text" style={{ whiteSpace: 'pre-line' }}>
                              {hubAiGuidance[3]}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="station-bottom-actions between">
                        <button
                          type="button"
                          className="prev-station-btn"
                          onClick={() => setHubActiveStation(2)}
                        >
                          <i className="fas fa-arrow-right"></i>
                          <span>المحطة السابقة (مصفوفة STEAM)</span>
                        </button>
                        <button
                          type="button"
                          className="next-station-btn"
                          onClick={() => setHubActiveStation(4)}
                        >
                          <span>الانتقال للمحطة 4 (الاختبار الميداني)</span>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Station 4: Testing & Peer Review */}
                  {hubActiveStation === 4 && (
                    <div className="station-workspace-card station-4-card">
                      <div className="station-card-banner">
                        <div className="banner-icon amber">
                          <i className="fas fa-vial-circle-check"></i>
                        </div>
                        <div className="banner-content">
                          <span className="station-tag">المحطة 4 من 6</span>
                          <h4>الاختبار والتقييم التبادلي (Testing & Peer Review)</h4>
                          <p>
                            المهندس الحقيقي يختبر اختراعه في الميدان ويسجل الأرقام الحقيقية، ثم يستمع لملاحظات وتقييم زملائه الطلاب لتحسين العمل.
                          </p>
                        </div>
                      </div>

                      <div className="station-form-grid">
                        <div className="stem-input-group full">
                          <label>
                            <i className="fas fa-map-pin"></i> 1. أين وكيف اختبرتم النموذج في المدرسة؟
                          </label>
                          <input
                            type="text"
                            value={hubStationData.testLocation}
                            onChange={(e) => setHubStationData({ ...hubStationData, testLocation: e.target.value })}
                            placeholder="مثال: جربناه في ممر الصف الثالث وعلى أدراج المدرسة أثناء الصباح..."
                            className="stem-text-input"
                          />
                        </div>

                        <div className="stem-input-group full">
                          <label>
                            <i className="fas fa-chart-column"></i> 2. ما هي النتائج والقياسات التي سجلتموها؟
                          </label>
                          <textarea
                            rows={3}
                            value={hubStationData.testResults}
                            onChange={(e) => setHubStationData({ ...hubStationData, testResults: e.target.value })}
                            placeholder="اكتب الأرقام والنتائج: كم كيلوغرام تم توفيره؟ كم دقيقة استغرق العمل؟ وماذا قال من جربوه؟"
                            className="stem-textarea"
                          />
                        </div>

                        {/* Peer Review Canvas */}
                        <div className="stem-input-group full peer-review-card">
                          <div className="peer-review-title">
                            <i className="fas fa-user-check"></i>
                            <strong>3. بطاقة تقييم الأقران (تقييم زميلك أو فريقك للحل):</strong>
                          </div>

                          <div className="peer-scores-row">
                            <div className="peer-metric">
                              <span>الجدوى وقابلية التطبيق:</span>
                              <div className="stars-picker">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    type="button"
                                    className={`star-btn ${hubStationData.peerReviewFeasibility >= star ? 'filled' : ''}`}
                                    onClick={() => setHubStationData({ ...hubStationData, peerReviewFeasibility: star })}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="peer-metric">
                              <span>الأصالة والإبداع:</span>
                              <div className="stars-picker">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    type="button"
                                    className={`star-btn ${hubStationData.peerReviewOriginality >= star ? 'filled' : ''}`}
                                    onClick={() => setHubStationData({ ...hubStationData, peerReviewOriginality: star })}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="peer-metric">
                              <span>الأثر الإيجابي على المدرسة:</span>
                              <div className="stars-picker">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    type="button"
                                    className={`star-btn ${hubStationData.peerReviewImpact >= star ? 'filled' : ''}`}
                                    onClick={() => setHubStationData({ ...hubStationData, peerReviewImpact: star })}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <label style={{ marginTop: '12px' }}>نصيحة أو ملاحظة الزميل المقيم:</label>
                          <input
                            type="text"
                            value={hubStationData.peerReviewNotes}
                            onChange={(e) => setHubStationData({ ...hubStationData, peerReviewNotes: e.target.value })}
                            placeholder="مثال: فكرة ممتازة جداً وننصح بإضافة لون عاكس للإضاءة ليلاً..."
                            className="stem-text-input"
                          />
                        </div>
                      </div>

                      {/* AI Helper for Testing */}
                      <div className="hub-ai-helper-box">
                        <button
                          type="button"
                          className="hub-ai-btn"
                          disabled={hubIsAiLoading[4]}
                          onClick={() => handleRequestHubAi(4)}
                        >
                          <i className={`fas ${hubIsAiLoading[4] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                          <span>{hubIsAiLoading[4] ? 'المكتشف يضع خطة فحص...' : 'كيف أختبر نموذجي بأمان في ساحة المدرسة؟ 🧪'}</span>
                        </button>

                        {hubAiGuidance[4] && (
                          <div className="hub-ai-response-card">
                            <div className="response-header">
                              <i className="fas fa-lightbulb"></i> إرشادات الفحص الميداني:
                            </div>
                            <div className="response-text" style={{ whiteSpace: 'pre-line' }}>
                              {hubAiGuidance[4]}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="station-bottom-actions between">
                        <button
                          type="button"
                          className="prev-station-btn"
                          onClick={() => setHubActiveStation(3)}
                        >
                          <i className="fas fa-arrow-right"></i>
                          <span>المحطة السابقة (النموذج والإلقاء)</span>
                        </button>
                        <button
                          type="button"
                          className="next-station-btn"
                          onClick={() => setHubActiveStation(5)}
                        >
                          <span>الانتقال للمحطة 5 (التحسين V2)</span>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Station 5: Iteration & Redesign */}
                  {hubActiveStation === 5 && (
                    <div className="station-workspace-card station-5-card">
                      <div className="station-card-banner">
                        <div className="banner-icon pink">
                          <i className="fas fa-arrows-rotate"></i>
                        </div>
                        <div className="banner-content">
                          <span className="station-tag">المحطة 5 من 6</span>
                          <h4>التحسين وإعادة التصميم (Iteration & Redesign)</h4>
                          <p>
                            لا يوجد اختراع ينجح تماماً من المرة الأولى! الأخطاء ونقاط الضعف المكتشفة في الاختبار هي البوصلة التي تقودنا لصناعة النسخة المحسّنة (V2).
                          </p>
                        </div>
                      </div>

                      <div className="station-form-grid">
                        <div className="stem-input-group full">
                          <label>
                            <i className="fas fa-circle-exclamation"></i> 1. ما التحديات أو نقاط الضعف التي ظهرت أثناء الاختبار الميداني؟
                          </label>
                          <textarea
                            rows={3}
                            value={hubStationData.iterationChallenges}
                            onChange={(e) => setHubStationData({ ...hubStationData, iterationChallenges: e.target.value })}
                            placeholder="مثال: كان الهيكل يهتز قليلاً، أو أن البطارية نفدت بسرعة..."
                            className="stem-textarea"
                          />
                        </div>

                        <div className="stem-input-group full">
                          <label>
                            <i className="fas fa-wrench"></i> 2. ما هي التعديلات التي قمت بها في النسخة المحسّنة (V2)؟
                          </label>
                          <textarea
                            rows={3}
                            value={hubStationData.iterationModifications}
                            onChange={(e) => setHubStationData({ ...hubStationData, iterationModifications: e.target.value })}
                            placeholder="ما الذي غيرته أو استبدلته أو أضفته في التصميم الجديد للتغلب على المشكلة؟"
                            className="stem-textarea"
                          />
                        </div>

                        <div className="stem-input-group full">
                          <label>
                            <i className="fas fa-chalkboard-user"></i> 3. توجيهات ونصائح المعلمين التي طبقتها في النسخة الجديدة:
                          </label>
                          <input
                            type="text"
                            value={hubStationData.teacherTipsApplied}
                            onChange={(e) => setHubStationData({ ...hubStationData, teacherTipsApplied: e.target.value })}
                            placeholder="مثال: نصحنا معلم العلوم بتخفيف الوزن واستخدام مادة عازلة..."
                            className="stem-text-input"
                          />
                        </div>
                      </div>

                      {/* AI Helper for Iteration */}
                      <div className="hub-ai-helper-box">
                        <button
                          type="button"
                          className="hub-ai-btn"
                          disabled={hubIsAiLoading[5]}
                          onClick={() => handleRequestHubAi(5)}
                        >
                          <i className={`fas ${hubIsAiLoading[5] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                          <span>{hubIsAiLoading[5] ? 'المكتشف يقترح حلولاً هندسية...' : 'اقترح عليّ حلولاً لتطوير النسخة V2 للتغلب على التحديات 🛠️'}</span>
                        </button>

                        {hubAiGuidance[5] && (
                          <div className="hub-ai-response-card">
                            <div className="response-header">
                              <i className="fas fa-lightbulb"></i> نصائح إعادة التصميم والتحسين:
                            </div>
                            <div className="response-text" style={{ whiteSpace: 'pre-line' }}>
                              {hubAiGuidance[5]}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="station-bottom-actions between">
                        <button
                          type="button"
                          className="prev-station-btn"
                          onClick={() => setHubActiveStation(4)}
                        >
                          <i className="fas fa-arrow-right"></i>
                          <span>المحطة السابقة (الاختبار والتقييم)</span>
                        </button>
                        <button
                          type="button"
                          className="next-station-btn"
                          onClick={() => setHubActiveStation(6)}
                        >
                          <span>الانتقال للمحطة 6 (قياس الأثر والتكريم)</span>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Station 6: Impact & Recognition */}
                  {hubActiveStation === 6 && (
                    <div className="station-workspace-card station-6-card">
                      <div className="station-card-banner">
                        <div className="banner-icon emerald">
                          <i className="fas fa-trophy"></i>
                        </div>
                        <div className="banner-content">
                          <span className="station-tag">المحطة 6 من 6</span>
                          <h4>قياس الأثر والتكريم (Impact & Recognition)</h4>
                          <p>
                            مبارك وصولك للمحطة الختامية يا بطل الابتكار! 🏆 دعنا نقيس الأثر الإيجابي الذي حققه مشروعك لمدرسة مشيرفة الابتدائية ونعتمد عملك رسمياً في المنظومة.
                          </p>
                        </div>
                      </div>

                      <div className="station-form-grid">
                        <div className="stem-input-group full">
                          <label>
                            <i className="fas fa-bullseye"></i> 1. ملخص الأثر الإيجابي النهائي على مدرسة مشيرفة:
                          </label>
                          <textarea
                            rows={3}
                            value={hubStationData.finalImpactSummary}
                            onChange={(e) => setHubStationData({ ...hubStationData, finalImpactSummary: e.target.value })}
                            placeholder="كيف ساهم هذا الاختراع في تحسين مدرستنا؟ (مثال: حماية صحة 300 طالب، توفير 500 لتر ماء أسبوعياً...)"
                            className="stem-textarea"
                          />
                        </div>

                        <div className="stem-input-group half">
                          <label>
                            <i className="fas fa-user-graduate"></i> 2. اسم الطالب أو قائد الفريق:
                          </label>
                          <input
                            type="text"
                            value={hubStationData.studentLeadName}
                            onChange={(e) => setHubStationData({ ...hubStationData, studentLeadName: e.target.value })}
                            placeholder="اسمك الكامل"
                            className="stem-text-input"
                          />
                        </div>

                        <div className="stem-input-group half">
                          <label>
                            <i className="fas fa-school"></i> 3. الصف والشعبة:
                          </label>
                          <input
                            type="text"
                            value={hubStationData.studentClassRoom}
                            onChange={(e) => setHubStationData({ ...hubStationData, studentClassRoom: e.target.value })}
                            placeholder="مثال: الصف الثالث (أ)"
                            className="stem-text-input"
                          />
                        </div>

                        <div className="stem-input-group full">
                          <label>
                            <i className="fas fa-people-group"></i> 4. أسماء أعضاء الفريق (إن وجد عمل جماعي):
                          </label>
                          <input
                            type="text"
                            value={hubStationData.teamMembers}
                            onChange={(e) => setHubStationData({ ...hubStationData, teamMembers: e.target.value })}
                            placeholder="أحمد، رامي، مريم، يوسف..."
                            className="stem-text-input"
                          />
                        </div>
                      </div>

                      {/* AI Helper for Impact */}
                      <div className="hub-ai-helper-box">
                        <button
                          type="button"
                          className="hub-ai-btn"
                          disabled={hubIsAiLoading[6]}
                          onClick={() => handleRequestHubAi(6)}
                        >
                          <i className={`fas ${hubIsAiLoading[6] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                          <span>{hubIsAiLoading[6] ? 'المكتشف يصيغ بيان الأثر...' : 'صِغ بياناً ختامياً فخوراً للمشروع وشعار وسام التميز 🌟'}</span>
                        </button>

                        {hubAiGuidance[6] && (
                          <div className="hub-ai-response-card">
                            <div className="response-header">
                              <i className="fas fa-award"></i> بيان الأثر والتكريم:
                            </div>
                            <div className="response-text" style={{ whiteSpace: 'pre-line' }}>
                              {hubAiGuidance[6]}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Final Submit & Celebrate Actions */}
                      <div className="final-celebrate-box">
                        <div className="celebrate-text">
                          <h5>🚀 جاهز لنيل وسام التميز واعتماد المشروع؟</h5>
                          <p>
                            عند التسليم، سيتم إدراج مشروعك في حاضنة ستيم المدرسية، واحتسابه ضمن نسبة التقييم البديل (15% - 20%)، وإرساله إلى طاقم المعلمين للمتابعة والتكريم.
                          </p>
                        </div>
                        <div className="celebrate-btns">
                          <button
                            type="button"
                            className="hub-submit-project-btn"
                            onClick={handleSaveSteamHubProject}
                          >
                            <i className="fas fa-award"></i>
                            <span>اعتماد وتسليم المشروع في حاضنة ستيم (+100 نقطة ⭐)</span>
                          </button>
                          <button
                            type="button"
                            className="hub-print-portfolio-btn"
                            onClick={() => window.print()}
                          >
                            <i className="fas fa-print"></i>
                            <span>طباعة ملف إنجاز ستيم (STEAM Hub Portfolio PDF)</span>
                          </button>
                        </div>
                      </div>

                      <div className="station-bottom-actions">
                        <button
                          type="button"
                          className="prev-station-btn"
                          onClick={() => setHubActiveStation(5)}
                        >
                          <i className="fas fa-arrow-right"></i>
                          <span>المحطة السابقة (التحسين V2)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUMMARY VIEW (Theoretical Roadmap) */}
              {hubViewMode === 'summary' && (
                <div className="workflow-timeline">
                  <div className="timeline-item">
                    <div className="timeline-badge" style={{ background: '#3b82f6' }}>1</div>
                    <div className="timeline-card">
                      <div className="stage-top">
                        <span className="stage-code">المحطة 1</span>
                        <h4 className="stage-title">اكتشاف المشكلة وفهمها (Problem Discovery)</h4>
                      </div>
                      <ul className="stage-bullets">
                        <li>قراءة التحدي المدرسي المطروح، مشاهدة فيديو أو صور توضيحية من بيئة المدرسة.</li>
                        <li>تعبئة <strong>"نموذج التعاطف وفهم المشكلة"</strong> (من يتأثر بها؟ متى تحدث؟ ولماذا هي مهمة للمجتمع المدرسي؟).</li>
                      </ul>
                      <div className="stage-deliverable">
                        <i className="fas fa-clipboard-check"></i> <strong>المخرج المطلوب:</strong> بطاقة تعريف المشكلة والجمهور المتأثر.
                      </div>
                      <button
                        type="button"
                        className="jump-to-studio-btn"
                        onClick={() => { setHubViewMode('interactive'); setHubActiveStation(1); }}
                      >
                        افتح محطة المشكلة في الاستوديو التفاعلي ⬅️
                      </button>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-badge" style={{ background: '#06b6d4' }}>2</div>
                    <div className="timeline-card">
                      <div className="stage-top">
                        <span className="stage-code">المحطة 2</span>
                        <h4 className="stage-title">مصفوفة تكامل التخصصات (STEAM Matrix)</h4>
                      </div>
                      <ul className="stage-bullets">
                        <li>تفكيك المشكلة إلى الأسئلة الفرعية الخمسة: ماذا نحتاج من علوم، رياضيات، تكنولوجيا، هندسة، وفنون لحلها؟</li>
                        <li>تسجيل الفرضيات الأولية للحل بمساعدة مرشد الذكاء الاصطناعي السقراطي في المنصة.</li>
                      </ul>
                      <div className="stage-deliverable">
                        <i className="fas fa-table-cells-large"></i> <strong>المخرج المطلوب:</strong> مصفوفة الأسئلة المنهجية الخمسة وفرضيات الحل.
                      </div>
                      <button
                        type="button"
                        className="jump-to-studio-btn"
                        onClick={() => { setHubViewMode('interactive'); setHubActiveStation(2); }}
                      >
                        افتح مصفوفة STEAM في الاستوديو التفاعلي ⬅️
                      </button>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-badge" style={{ background: '#8b5cf6' }}>3</div>
                    <div className="timeline-card">
                      <div className="stage-top">
                        <span className="stage-code">المحطة 3</span>
                        <h4 className="stage-title">هندسة النموذج الأولي والعرض (Prototyping & Pitching)</h4>
                      </div>
                      <ul className="stage-bullets">
                        <li>رسم مخطط هندسي يدوي أو رقمي (Sketch / 3D Model).</li>
                        <li>رفع فيديو قصير (دقيقة إلى دقيقتين) يعرض فيه الطلاب فكرتهم ونموذجهم بأسلوب إقناعي (Elevator Pitch).</li>
                      </ul>
                      <div className="stage-deliverable">
                        <i className="fas fa-drafting-compass"></i> <strong>المخرج المطلوب:</strong> رسم النموذج الأولي + رابط أو فيديو العرض الإقناعي.
                      </div>
                      <button
                        type="button"
                        className="jump-to-studio-btn"
                        onClick={() => { setHubViewMode('interactive'); setHubActiveStation(3); }}
                      >
                        افتح محطة النموذج والإلقاء في الاستوديو التفاعلي ⬅️
                      </button>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-badge" style={{ background: '#f59e0b' }}>4</div>
                    <div className="timeline-card">
                      <div className="stage-top">
                        <span className="stage-code">المحطة 4</span>
                        <h4 className="stage-title">الاختبار والتقييم التبادلي (Testing & Peer Review)</h4>
                      </div>
                      <ul className="stage-bullets">
                        <li>تجربة الحل في ساحة المدرسة أو الصف ورصد النتائج الأولية والقياسات الميدانية.</li>
                        <li>تقييم أقران متبادل عبر معايير محددة (الجدوى، الأصالة، الأثر على المدرسة).</li>
                      </ul>
                      <div className="stage-deliverable">
                        <i className="fas fa-users-viewfinder"></i> <strong>المخرج المطلوب:</strong> تقرير الاختبار الميداني وتقييم الزملاء.
                      </div>
                      <button
                        type="button"
                        className="jump-to-studio-btn"
                        onClick={() => { setHubViewMode('interactive'); setHubActiveStation(4); }}
                      >
                        افتح محطة الاختبار والتقييم في الاستوديو التفاعلي ⬅️
                      </button>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-badge" style={{ background: '#ec4899' }}>5</div>
                    <div className="timeline-card">
                      <div className="stage-top">
                        <span className="stage-code">المحطة 5</span>
                        <h4 className="stage-title">التحسين وإعادة التصميم (Iteration & Redesign)</h4>
                      </div>
                      <ul className="stage-bullets">
                        <li>تلقي ملاحظات وتوجيهات المعلمين والذكاء الاصطناعي السقراطي في البوابة.</li>
                        <li>تعديل النموذج وتحديث مصفوفة النتائج لمعالجة التحديات المكتشفة.</li>
                      </ul>
                      <div className="stage-deliverable">
                        <i className="fas fa-rotate-right"></i> <strong>المخرج المطلوب:</strong> النسخة المطورة (V2) من الحل والنموذج.
                      </div>
                      <button
                        type="button"
                        className="jump-to-studio-btn"
                        onClick={() => { setHubViewMode('interactive'); setHubActiveStation(5); }}
                      >
                        افتح محطة التحسين V2 في الاستوديو التفاعلي ⬅️
                      </button>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-badge" style={{ background: '#10b981' }}>6</div>
                    <div className="timeline-card">
                      <div className="stage-top">
                        <span className="stage-code">المحطة 6</span>
                        <h4 className="stage-title">قياس الأثر والتكريم (Impact & Recognition)</h4>
                      </div>
                      <ul className="stage-bullets">
                        <li>نشر الحل النهائي في "معرض مشاريع الطلاب" الرقمي بالموقع.</li>
                        <li>نيل أوسمة رقمية، شهادات تميز، ونقاط تضاف للتقييم الصفي والمدرسي.</li>
                      </ul>
                      <div className="stage-deliverable">
                        <i className="fas fa-trophy"></i> <strong>المخرج النهائي:</strong> نشر الابتكار في المعرض المدرسي ونيل وسام التميز.
                      </div>
                      <button
                        type="button"
                        className="jump-to-studio-btn"
                        onClick={() => { setHubViewMode('interactive'); setHubActiveStation(6); }}
                      >
                        افتح محطة قياس الأثر والتكريم في الاستوديو التفاعلي ⬅️
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Teacher Engagement Matrix */}
          <div className="steam-doc-block">
            <div className="doc-block-header">
              <div className="block-number">3</div>
              <div className="block-title-group">
                <h3>مصفوفة أدوار ومتابعة طاقم المعلمين (Teacher Engagement Matrix)</h3>
                <span className="block-subtitle">توزيع مهام استشاري غير متزامن يضمن التوجيه عالي الجودة دون إرهاق كاهل المعلمين بنصاب حصص جديد</span>
              </div>
            </div>

            <div className="doc-content-body">
              {/* Workflow Steps for Teachers */}
              <div className="teacher-steps-bar">
                <div className="t-step">
                  <div className="step-num">1</div>
                  <div className="step-txt">
                    <strong>طرح التحدي / اعتماده:</strong>
                    <span>يحدد طاقم المعلمين بالتشاور مع الإدارة تحدياً حقيقياً فصلياً أو شهرياً.</span>
                  </div>
                </div>
                <div className="t-step">
                  <div className="step-num">2</div>
                  <div className="step-txt">
                    <strong>التوجيه التخصصي غير المتزامن:</strong>
                    <span>يدخل كل معلم بحسابه على بوابة المتابعة ليطّلع على إجابات الطلاب المتعلقة بتخصصه حصراً.</span>
                  </div>
                </div>
                <div className="t-step">
                  <div className="step-num">3</div>
                  <div className="step-txt">
                    <strong>منح التغذية الراجعة والنجوم:</strong>
                    <span>يضع المعلم ملاحظة توجيهية محفزة ويمنح نقاطاً معيارية تؤثر إيجاباً في علامة التقييم البديل للطالب في مادته.</span>
                  </div>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="table-responsive-wrapper">
                <table className="steam-matrix-table">
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>التخصص الأكاديمي</th>
                      <th style={{ width: '40%' }}>المهمة الإشرافية المباشرة عبر المنصة</th>
                      <th style={{ width: '38%' }}>معيار التقييم المضاف للطالب</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="subject-cell math">
                        <i className="fas fa-calculator"></i> معلم الرياضيات
                      </td>
                      <td>يراجع دقة الحسابات، النسب، وتكلفة المشروع والجدوى الحسابية.</td>
                      <td>دقة الحسابات والتقدير الرياضي والتحليل الرقمي السليم.</td>
                    </tr>
                    <tr>
                      <td className="subject-cell science">
                        <i className="fas fa-flask"></i> معلم العلوم
                      </td>
                      <td>يراجع صحة القوانين العلمية، المتغيرات، وفرضيات التجربة والفحص الميداني.</td>
                      <td>سلامة التفسير العلمي ومنهجية الملاحظة والتجريب.</td>
                    </tr>
                    <tr>
                      <td className="subject-cell lang">
                        <i className="fas fa-book-open"></i> معلم اللغات
                      </td>
                      <td>يراجع لغة الإلقاء، وضوح التعبير في الفيديو، ودقة التقرير المكتوب والعرض الإقناعي.</td>
                      <td>الفصاحة، سلامة التعبير، وقوة الإلقاء وبناء الحجة.</td>
                    </tr>
                    <tr>
                      <td className="subject-cell tech">
                        <i className="fas fa-laptop-code"></i> معلم التكنولوجيا / الحاسوب
                      </td>
                      <td>يوجه في اختيار الأدوات الرقمية والمحاكاة والبرمجة واستخدام المستشعرات.</td>
                      <td>حسن توظيف التقنيات الذكية والأمان الرقمي.</td>
                    </tr>
                    <tr>
                      <td className="subject-cell art">
                        <i className="fas fa-palette"></i> معلم الفنون
                      </td>
                      <td>يوجه في الجانب الجمالي للنموذج، الهوية البصرية، وتصميم العرض والبوستر.</td>
                      <td>الابتكار الجمالي، تنسيق الألوان والخامات، وحسن الإخراج.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 4: Administrative Governance */}
          <div className="steam-doc-block">
            <div className="doc-block-header">
              <div className="block-number">4</div>
              <div className="block-title-group">
                <h3>دور الإدارة والحوكمة المدرسية (Administrative Governance)</h3>
                <span className="block-subtitle">ضمان الاستدامة، ربط المبادرة بالتقييم المدرسي، ومتابعة الأثر الميداني</span>
              </div>
            </div>

            <div className="doc-content-body">
              <div className="governance-grid">
                <div className="gov-card">
                  <div className="gov-header-icon gold">
                    <i className="fas fa-percentage"></i>
                  </div>
                  <h4>الربط بالتقييم المدرسي (15% - 20%)</h4>
                  <p>
                    تخصيص نسبة معتمدة (مثل 15% - 20%) من علامة التقييم المستمر / البديل في المواد المشاركة لكل طالب ينجز التحديات بجدارة.
                  </p>
                </div>

                <div className="gov-card">
                  <div className="gov-header-icon blue">
                    <i className="fas fa-user-gear"></i>
                  </div>
                  <h4>المنسق العام للمنظومة</h4>
                  <p>
                    تعيين مركز/ة لـ STEAM يتولى التنسيق بين التخصصات ومتابعة تقدم المجموعات وتحديث بنك التحديات بالمستجدات الواقعية.
                  </p>
                </div>

                <div className="gov-card">
                  <div className="gov-header-icon emerald">
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <h4>لوحة تحكم الإدارة</h4>
                  <p>
                    تقارير دورية تبيّن: نسب مشاركة الصفوف، التخصصات الأكثر تفاعلاً، والحلول القابلة للتطبيق العملي داخل المدرسة لتحسين البيئة المدرسية.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default StemCorner;
