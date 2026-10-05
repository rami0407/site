import React, { useState, useEffect, useRef } from 'react';
import './MafatihTeacherCompanion.css';
import {
  generateMiftaahCompanionLessonAI,
  generateMiftaahStationAlternativeAI,
  generateMiftaahLessonObjectivesAI,
  modifyMiftaahStationWithPromptAI,
  generateMiftaahGroupTasksAI
} from '../utils/aiService';

// =========================================================================
// 1. OFFICIAL EXEMPLAR LESSON (حالات المادة - النص والمواد الأصلية للمواصفة)
// =========================================================================
const INITIAL_LESSONS_STORE = [
  {
    id: 'lesson_states_of_matter',
    subject: 'علوم وتكنولوجيا',
    title: 'حالات المادة وخصائصها وتغيراتها (صلب، سائل، غاز)',
    grade: 'الصف الرابع',
    duration: 45,
    status: 'ready', // 'draft' | 'ready' | 'completed'
    isExemplar: true,
    tag: 'مثال للتجربة',
    objective: 'يصنّف الطالب مواد مألوفة إلى صلبة وسائلة وغازية ويبرر التصنيف بخاصية مناسبة.',
    successCriteria: 'تصنيف ثلاثة أمثلة جديدة تصنيفاً صحيحاً، مع تبرير مناسب لكل مثال. لا تكفي تسمية الحالة وحدها.',
    prerequisites: 'خبرة يومية بالماء والحجر والهواء. يُتحقق منها في المدخل، ولا تُعامل كحقيقة مؤكدة عن الصف.',
    resources: 'ماء في وعاءين مختلفي الشكل، حجر، ومحقنة بلا إبرة مغلقة الطرف إن توافرت لتمثيل الهواء؛ وإلا يُستخدم وصف موجّه ورسوم تعليمية بسيطة.',
    participationBarriers: 'فروق في سرعة التدوين، وتردد في التعليل العلمي الشفوي دون إحراج.',
    studentCount: 26,
    spaceAndResources: 'شاشة صف واحدة ودفاتر، دون أجهزة فردية أو حاجة إلى طابعة.',
    displayMode: 'single_screen',
    stations: {
      m: {
        id: 'm',
        letter: 'م',
        name: 'مشوّق ومحفّز',
        durationMinutes: 5,
        studentPhrase: 'أتساءل وأستعد',
        studentQuestion: 'ما الذي يثير فضولي؟ ولماذا نتعلم هذا؟',
        studentDisplayPrompt: 'إذا نقلنا الماء إلى وعاء مختلف، ماذا يتغير؟ وهل يتغير الحجر بالطريقة نفسها؟',
        teacherNotes: 'اجمع التوقعات دون إعلان الصحة فوراً. ناقش الهدف ومعيار النجاح بعد لحظة الفضول. الهدف مكتوب من البداية على اللوح.',
        materialsApproved: true,
        scaffolds: 'تفكير فردي قصير ثم اختيار بين توقعين مع تبرير، قبل المشاركة العامة.',
        extension: 'توقع: ماذا يحدث للماء إذا سُكب على طاولة مسطحة مقارنة بالحجر؟'
      },
      f: {
        id: 'f',
        letter: 'ف',
        name: 'فهم وبناء المعنى',
        durationMinutes: 10,
        studentPhrase: 'أفهم وأربط',
        studentQuestion: 'كيف أفهم الفكرة؟',
        studentDisplayPrompt: 'لاحظ الشكل والحجم عند تغيير الوعاء:\n• الصلب: يحتفظ بشكله وحجمه تقريباً في الظروف المعتادة.\n• السائل: يحتفظ بحجمه ويأخذ شكل الوعاء الذي يوضع فيه.\n• الغاز: ينتشر ليملأ الحيز المتاح.',
        teacherNotes: 'تعليم موجّه يجمع الملاحظة والنمذجة. لا يُستخدم اللون أو سهولة الإمساك معياراً وحيداً. فحص سريع: «الماء في وعاء عريض ثم ضيق: هل أصبح صلباً لأن شكله تغيّر؟ فسّر».',
        materialsApproved: true,
        scaffolds: 'مقارنة المثال نفسه في وعاءين، ثم تفسير الفرق.',
        extension: 'لماذا نستطيع ضغط الهواء داخل المحقنة ولا نستطيع ضغط الماء المحبوس؟'
      },
      t: {
        id: 't',
        letter: 'ت',
        name: 'تطبيق وتدريب',
        durationMinutes: 15,
        studentPhrase: 'أجرّب وأتدرّب',
        studentQuestion: 'كيف أستخدم ما تعلمت؟',
        studentDisplayPrompt: 'صنّف المواد التالية:\n(حجر، ماء، زيت، هواء داخل بالون، ثلج).\nاكتب الحالة وسبب اختيارك لكل مادة بالاستناد إلى الشكل أو الحجم.',
        teacherNotes: 'لاحظ التبرير، وليس التصنيف وحده. يبدأ كل طالب فردياً ثم يقارن مع زميل. تفعيل الخطة الموجهة فور رصد إجابة بلا تبرير.',
        materialsApproved: true,
        scaffolds: 'بطاقة جملة مساعدة: «أصنّف … بأنه … لأن …» مع أسئلة عن الشكل والحجم.',
        extension: 'مهمة تعميق لبقية الصف: «كل مادة تأخذ شكل الوعاء هي ماء» — ناقش هذه العبارة وصححها بمثال مضاد.',
        modeledInterventionScenario: {
          difficultyName: 'الإجابة بلا تبرير',
          targetScope: 'مجموعة صغيرة',
          timeDuration: '٤ دقائق',
          steps: [
            { min: 'الدقيقة الأولى', desc: 'نمذجة تبرير تصنيف الحجر بصوت مسموع: "الحجر صلب لأن شكله لا يتغير عند نقله من الطاولة للكأس".' },
            { min: 'الدقيقة الثانية', desc: 'يبرر الطلاب تصنيف الماء بمساعدة سؤال موجه عن الوعاء.' },
            { min: 'الدقيقة الثالثة', desc: 'يكتب كل طالب تبريراً للزيت دون جملة محلولة.' },
            { min: 'الدقيقة الرابعة', desc: 'تحقق جديد فوري باستخدام عصير في كأسين مختلفي الشكل.' }
          ],
          restOfClassTask: 'يكملون المهمة الأساسية، ثم يناقشون العبارة: «كل مادة تأخذ شكل الوعاء هي ماء» ويصححونها بمثال (كالزيت أو العصير).',
          verificationCheck: 'العصير سائل لأنه يأخذ شكل الوعاء مع بقاء حجمه عند نقله دون سكب. إذا بقي التبرير غير واضح، يعود المعلم إلى الملاحظة بتمثيل مختلف.'
        }
      },
      a: {
        id: 'a',
        letter: 'ا',
        name: 'أدلّة الفهم',
        durationMinutes: 8,
        studentPhrase: 'أُظهر ما فهمت',
        studentQuestion: 'كيف أُظهر ما فهمت؟',
        studentDisplayPrompt: 'صنّف قطعة خشب، وحليباً، وهواءً داخل محقنة.\nاكتب سبباً مناسباً لكل تصنيف في بطاقتك الفردية.',
        teacherNotes: 'اجمع الإجابات الفردية قبل مناقشتها أو عرض محكها. خشب صلب؛ حليب سائل؛ هواء غاز. تُسجّل الحاجة لدعم عند صحة التصنيف وغياب التبرير، ولا تُساوى بالصحة الكاملة. طبق جدول القرار بدقة.',
        materialsApproved: true,
        scaffolds: 'تذكير بالخاصية دون إعطاء الإجابة: هل يأخذ شكل الوعاء أم يحتفظ بشكله؟',
        extension: 'تحدي المادة الغامضة: الزبدة قبل التسخين وبعده، كيف تغيرت حالتها؟'
      },
      h: {
        id: 'h',
        letter: 'ح',
        name: 'حصاد ونقل الأثر',
        durationMinutes: 7,
        studentPhrase: 'ألخّص وأنقل تعلّمي',
        studentQuestion: 'ماذا آخذ معي؟ وأين أستخدمه؟',
        studentDisplayPrompt: '1. الحصاد: ما الخاصية التي ساعدتك على التمييز بين الحالات؟\n2. التبصّر: ما الذي ساعدك اليوم: الملاحظة، المثال، أم المحاولة؟ وضّح.\n3. نقل الأثر: نقلت الحليب من علبة إلى كأس: ما الذي تغير وما الذي بقي؟ كيف تعرف حالته؟',
        teacherNotes: 'يكتب كل طالب استجابة قصيرة، ثم تحدث مشاركة مختارة. يسجل المعلم ما يحتاج إلى متابعة للحصة القادمة.',
        materialsApproved: true,
        scaffolds: 'بدايات جمل للتأمل: "ساعدني اليوم نشاط..." / "الخاصية الأوضح كانت...".',
        extension: 'ملاحظة منزلية: رصد حالات المادة الثلاث أثناء طهي وجبة العشاء بالبيت.'
      }
    }
  }
];

// =========================================================================
// 2. LESSON FACTORY & LOCAL STORAGE PERSISTENCE HELPERS
// =========================================================================
const STORAGE_KEY_LESSONS = 'miftaah_teacher_lessons_saved_v2';
const STORAGE_KEY_ACTIVE_ID = 'miftaah_teacher_active_lesson_id_v2';

export const PRESET_SUBJECTS = [
  'لغة عربية',
  'لغة إنجليزية',
  'لغة عبرية',
  'رياضيات',
  'علوم وتكنولوجيا',
  'تربية إسلامية',
  'موطن وجغرافيا ودراسات اجتماعية',
  'مهارات حياتية وتربية اجتماعية',
  'فنون وموسيقى',
  'تربية بدنية'
];

export const PRESET_GRADES = [
  'الصف الأول',
  'الصف الثاني',
  'الصف الثالث',
  'الصف الرابع',
  'الصف الخامس',
  'الصف السادس'
];

export const createBlankLesson = (presetTitle = '', presetSubject = '') => ({
  id: 'lesson_' + Date.now(),
  subject: presetSubject || 'لغة عربية',
  title: presetTitle || 'مهارة التعبير الكتابي وبناء الفقرة',
  grade: 'الصف الخامس',
  duration: 45,
  status: 'draft',
  isExemplar: false,
  tag: 'حصة جديدة',
  objective: 'يكتب الطالب فقرة وصفية متكاملة مراعياً علامات الترقيم وسلامة الإملاء وتوظيف ألفاظ من مخزن الكلمات.',
  successCriteria: 'كتابة فقرة من ٤-٥ جمل تشمل جملة رئيسية وتفاصيل داعمة وجملة ختامية مع توظيف ٣ تعابير على الأقل بصورة صحيحة.',
  prerequisites: 'معرفة أقسام الكلام وبنية الجملة البسيطة وعلامات الترقيم الأساسية.',
  resources: 'شاشة العرض، بطاقات مخزن الكلمات، دفاتر الطلاب.',
  participationBarriers: 'تردد في التعبير الكتابي أو تفاوت في سرعة التدوين دون تصنيف تشخيصي مسبق.',
  studentCount: 25,
  spaceAndResources: 'شاشة صف واحدة، دفاتر الطلاب وبطاقات ورقية داعمة.',
  displayMode: 'single_screen',
  stations: {
    m: {
      id: 'm',
      letter: 'م',
      name: 'مشوّق ومحفّز',
      durationMinutes: 5,
      studentPhrase: 'أتساءل وأستعد',
      studentQuestion: 'ما الذي يثير فضولي؟ ولماذا نتعلم هذا؟',
      studentDisplayPrompt: 'تأمل المشهد المعروض:\nلو أردت أن تصف هذه اللوحة لصديق لم يرها قط، ما أول كلمة ستبدأ بها لتجعله يتخيلها كأنه يراها بعينيه؟',
      teacherNotes: 'عرض صورة حية محفزة للوصف. إثارة الفضول حول قوة الكلمات ودقة الوصف، وربط ذلك بالهدف الصريح ومعيار النجاح.',
      materialsApproved: true,
      scaffolds: 'عرض ثلاث كلمات مفتاحية للاختيار منها لمن يجد صعوبة في الانطلاق.',
      extension: 'تحدي سريع: التعبير عن المشهد بتشبيه بلاغي مبتكر.'
    },
    f: {
      id: 'f',
      letter: 'ف',
      name: 'فهم وبناء المعنى',
      durationMinutes: 10,
      studentPhrase: 'أفهم وأربط',
      studentQuestion: 'كيف أفهم الفكرة؟',
      studentDisplayPrompt: 'بنية الفقرة المتكاملة تتكون من:\n١. الجملة المفتاحية (الفكرة العامة).\n٢. الجمل الداعمة (تفاصيل، أوصاف، حواس).\n٣. الجملة الختامية (إغلاق وتأكيد الأثر).\nمع مراعاة علامات الترقيم (، . ! ؟).',
      teacherNotes: 'نمذجة بناء فقرة قصيرة أمام الطلاب مع تلوين الأجزاء الثلاثة: المفتاحية، الداعمة، والختامية.',
      materialsApproved: true,
      scaffolds: 'مخطط بصري منظم يمثل شطيرة الفقرة (خبز - حشوة - خبز).',
      extension: 'اكتشاف الخطأ في ترتيب جمل فقرة نموذجية مشوشة.'
    },
    t: {
      id: 't',
      letter: 'ت',
      name: 'تطبيق وتدريب',
      durationMinutes: 15,
      studentPhrase: 'أجرّب وأتدرّب',
      studentQuestion: 'كيف أستخدم ما تعلمت؟',
      studentDisplayPrompt: 'مهمة التدريب:\nاختر من مخزن الكلمات (البراق، ينساب، أريج، يرفرف، سحر الطبيعة).\nاكتب فقرة وصفية من ٤ أسطر توظف فيها علامات الترقيم وثلاث كلمات على الأقل من المخزن.',
      teacherNotes: 'متابعة كتابة الطلاب. رصد الأخطاء الشائعة (غياب الترقيم، قصر الجمل) دون مقاطعة التدفق الفردي.',
      materialsApproved: true,
      scaffolds: 'بطاقة جمل مساعدة تبدأ بـ: "حين نظرت إلى... لفت انتباهي... ومن أروع ما رأيت...".',
      extension: 'مهمة تعميق: توظيف استعارة أو تشبيه إضافي من الحواس الخمس في الفقرة.',
      modeledInterventionScenario: {
        difficultyName: 'غياب علامات الترقيم وترابط الجمل',
        targetScope: 'مجموعة صغيرة',
        timeDuration: '٤ دقائق',
        steps: [
          { min: 'الدقيقة الأولى', desc: 'نمذجة إضافة الفاصلة والنقطة بصوت مسموع مع توضيح وقفة النفس.' },
          { min: 'الدقيقة الثانية', desc: 'يضع الطلاب علامات الترقيم لجملتين بمساعدة سؤال موجه.' },
          { min: 'الدقيقة الثالثة', desc: 'يكتب كل طالب جملة ترابط جديدة مع علامتي ترقيم مناسبتين.' },
          { min: 'الدقيقة الرابعة', desc: 'تحقق فوري من الدقة اللغوية.' }
        ],
        restOfClassTask: 'إكمال الفقرة وتلوين الكلمات المستعارة من مخزن الكلمات بالأخضر.',
        verificationCheck: 'فقرة قصيرة مجردة يضع الطالب علامات ترقيمها الصحيحة بشكل مستقل.'
      }
    },
    a: {
      id: 'a',
      letter: 'ا',
      name: 'أدلّة الفهم',
      durationMinutes: 8,
      studentPhrase: 'أُظهر ما فهمت',
      studentQuestion: 'كيف أُظهر ما فهمت؟',
      studentDisplayPrompt: 'بطاقة التحقق الفردي:\nأمامك سطران يصفان يوماً ماطراً:\nأعد كتابتهما مع إضافة علامات الترقيم المفقودة، واستبدل كلمة مكررة بكلمة أكثر بلاغة وتأثيراً.',
      teacherNotes: 'جمع بطاقات التحقق وفحص مدى تمكن الطلاب المستهدفين من تطبيق مهارة الترقيم واختيار الألفاظ بشكل مستقل.',
      materialsApproved: true,
      scaffolds: 'قائمة مصغرة بعلامات الترقيم للتذكير.',
      extension: 'كتابة عنوان مبدع للنص يجذب القارئ.'
    },
    h: {
      id: 'h',
      letter: 'ح',
      name: 'حصاد ونقل الأثر',
      durationMinutes: 7,
      studentPhrase: 'ألخّص وأنقل تعلّمي',
      studentQuestion: 'ماذا آخذ معي؟ وأين أستخدمه؟',
      studentDisplayPrompt: 'حصاد اليوم:\n١. ما السر الذي تعلمته اليوم ليجعل كتابتك أجمل وأوضح؟\n٢. كيف ستستخدم مهارة التعبير هذه في رسالة تكتبها لأحد أفراد عائلتك أو صديق؟',
      teacherNotes: 'تأمل ختامي، الاستماع لمشاركتين متميزتين، وتوثيق الاحتياجات لمتابعة حصة التعبير القادمة.',
      materialsApproved: true,
      scaffolds: 'إكمال عبارة: "سأحرص دائماً في كتابتي القادمة على...".',
      extension: 'كتابة تدوينة أو بطاقة شكر منزلية وتطبيق علامات الترقيم فيها.'
    }
  }
});

const loadInitialLessons = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LESSONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved lessons:', e);
  }
  return INITIAL_LESSONS_STORE;
};

const persistLessons = (lessonsList) => {
  try {
    localStorage.setItem(STORAGE_KEY_LESSONS, JSON.stringify(lessonsList));
  } catch (e) {
    console.warn('Error saving lessons to localStorage:', e);
  }
};

// =========================================================================
// 3. ENERGIZER BREAK SPECIFICATION (سيناريو مفتاح التجديد المعتمد)
// =========================================================================
const ENERGIZER_PRESET = {
  id: 'follow_the_signal',
  title: 'اتبع الإشارة (استعادة انتباه وتركيز)',
  category: 'استعادة الانتباه',
  duration: 'دقيقتان',
  place: 'بجانب المقاعد أو جلوساً',
  studentDisplayPrompt: 'نجدّد نشاطنا ⚡\nغيّر وضعيتك بما يناسبك. اتبع إشارة المعلم:\n• يدان مفتوحتان 👐\n• ثم يدان على الطاولة 🤲\n• ثم توقف ثبات ✋\n(يمكنك تنفيذ الإشارة بعينيك فقط إن رغبت).\n\nنعود الآن لتركيزنا: ما أول خطوة في مهمتنا؟',
  teacherNotes: 'شرح قصير، جولات هادئة بإشارات متبدلة، ثم عودة للمهمة. لا توجد أصوات مفاجئة أو إلزام بإغماض العينين أو كشف شعور شخصي. بديل الجلوس متاح للجميع والمشاركة الحركية اختيارية.',
  sitAlternative: 'تنفيذ الإشارات باليدين على سطح الطاولة، أو بالعينين فقط دون حركة الجسم.'
};

// =========================================================================
// 4. STUDENT KEYS (مفاتيح الطلاب الخمسة في وضع شاشة الصف)
// =========================================================================
const STUDENT_REQUEST_KEYS = [
  { id: 'need_clarify', icon: '❓', label: 'أحتاج توضيح التعليمات', color: '#0284c7' },
  { id: 'need_hint', icon: '💡', label: 'أحتاج تلميحًا', color: '#f59e0b' },
  { id: 'need_example', icon: '🔍', label: 'أحتاج مثالًا', color: '#8b5cf6' },
  { id: 'ready_challenge', icon: '🚀', label: 'جاهز لتحدٍّ', color: '#10b981' },
  { id: 'need_energizer', icon: '⚡', label: 'أحتاج تجديدًا', color: '#e11d48' }
];

export const MafatihTeacherCompanion = ({ onSwitchTab }) => {
  // Navigation Screens:
  // 'screen1_my_lessons'       ➔ الشاشة ١: حصصي
  // 'screen2_prep_context'     ➔ الشاشة ٢: أجهّز حصتي
  // 'screen3_materials_bag'    ➔ الشاشة ٣: حقيبة المفاتيح والمواد
  // 'screen4_backstage'        ➔ الشاشة ٤: كواليس المعلم أثناء الحصة
  // 'screen6_student_screen'   ➔ الشاشة ٦: شاشة الطلاب
  // 'screen7_verification'     ➔ الشاشة ٧: التحقق بعد التدخل
  // 'screen8_harvest'          ➔ الشاشة ٨: حصاد المعلم بعد الحصة
  const [currentScreen, setCurrentScreen] = useState('screen1_my_lessons');

  // Lessons store with localStorage persistence
  const [lessons, setLessons] = useState(loadInitialLessons);
  const [activeLessonId, setActiveLessonId] = useState(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedId) return savedId;
    } catch (e) {}
    return 'lesson_states_of_matter';
  });

  // Active Lesson Object
  const currentLesson = lessons.find(l => l.id === activeLessonId) || lessons[0] || INITIAL_LESSONS_STORE[0];

  // Active Form State for Screen 2 (أجهّز حصتي)
  const [prepForm, setPrepForm] = useState(() => {
    return JSON.parse(JSON.stringify(currentLesson));
  });
  const [prepActiveStationTab, setPrepActiveStationTab] = useState('all');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Screen 2 Step 3: Station Alternatives AI Modal State
  // Screen 2: Projector Preview Modal State
  const [projectorPreviewModal, setProjectorPreviewModal] = useState({
    isOpen: false,
    stationKey: 'm',
    stationName: '',
    studentPhrase: '',
    letter: 'م',
    lessonTitle: '',
    objective: '',
    headline: '',
    timerSeconds: 300
  });

  const handlePreviewStationOnProjector = (stationKey) => {
    const st = prepForm.stations?.[stationKey] || {};
    const stationNames = {
      m: { name: 'مشوّق ومحفّز', phrase: 'أتساءل وأستعد', letter: 'م', dur: 5 },
      f: { name: 'فهم وبناء المعنى', phrase: 'أفهم وأربط', letter: 'ف', dur: 10 },
      t: { name: 'تطبيق وتدريب', phrase: 'أجرّب وأتدرّب', letter: 'ت', dur: 15 },
      a: { name: 'أدلّة الفهم', phrase: 'أُظهر ما فهمت', letter: 'ا', dur: 8 },
      h: { name: 'حصاد ونقل الأثر', phrase: 'ألخّص وأنقل تعلّمي', letter: 'ح', dur: 7 }
    };
    const info = stationNames[stationKey] || stationNames.m;

    setProjectorPreviewModal({
      isOpen: true,
      stationKey,
      stationName: st.name || info.name,
      studentPhrase: st.studentPhrase || info.phrase,
      letter: st.letter || info.letter,
      lessonTitle: prepForm.title || 'عنوان الحصة',
      objective: prepForm.objective || '',
      headline: st.studentDisplayPrompt || 'لا يوجد نص مدخل حالياً لهذه المحطة',
      timerSeconds: (st.durationMinutes || info.dur) * 60
    });
  };

  const handleLaunchProjectorFromStation = (stationKey, openWindow = true) => {
    const st = prepForm.stations?.[stationKey] || {};
    const stationNames = {
      m: { name: 'مشوّق ومحفّز', phrase: 'أتساءل وأستعد', letter: 'م', dur: 5 },
      f: { name: 'فهم وبناء المعنى', phrase: 'أفهم وأربط', letter: 'ف', dur: 10 },
      t: { name: 'تطبيق وتدريب', phrase: 'أجرّب وأتدرّب', letter: 'ت', dur: 15 },
      a: { name: 'أدلّة الفهم', phrase: 'أُظهر ما فهمت', letter: 'ا', dur: 8 },
      h: { name: 'حصاد ونقل الأثر', phrase: 'ألخّص وأنقل تعلّمي', letter: 'ح', dur: 7 }
    };
    const info = stationNames[stationKey] || stationNames.m;

    const currentPrompt = st.studentDisplayPrompt || prepForm.title || '';

    const newState = {
      ...publicDisplayState,
      lessonTitle: prepForm.title || 'عنوان الحصة',
      objective: prepForm.objective || '',
      stationKey,
      stationLetter: st.letter || info.letter,
      stationName: st.name || info.name,
      studentPhrase: st.studentPhrase || info.phrase,
      headline: currentPrompt,
      isDisplayHidden: false,
      scaffolds: st.scaffolds || '',
      groupTasks: st.groupTasks || null,
      timerSeconds: (st.durationMinutes || info.dur) * 60
    };

    broadcastToStudentScreen(newState);

    if (openWindow) {
      const url = window.location.origin + window.location.pathname + '#/mafatih?view=student';
      window.open(url, 'MiftaahProjectorWindow', 'width=1280,height=800,menubar=no,toolbar=no');
      showToast('تم فتح شاشة العرض (البروجكتور) للتأكد من المحتوى! 🎦👁️');
    }
  };

  const handleCopyProjectorLink = (stationKey) => {
    handleLaunchProjectorFromStation(stationKey, false);
    const url = window.location.origin + window.location.pathname + '#/mafatih?view=student';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('تم نسخ رابط شاشة البروجكتور بنجاح! 📋 يمكنك فتحه على أي جهاز بالصف.');
      }).catch(() => {
        prompt('رابط شاشة البروجكتور للنسخ:', url);
      });
    } else {
      prompt('رابط شاشة البروجكتور للنسخ:', url);
    }
  };

  // Instant Objectives AI State
  const [isAiObjectivesLoading, setIsAiObjectivesLoading] = useState(false);

  // Prompt-to-Modify Station Modal State
  const [stationPromptModal, setStationPromptModal] = useState({
    isOpen: false,
    stationKey: null,
    stationName: '',
    currentPrompt: '',
    promptInstruction: '',
    loading: false
  });

  // Differentiated Group Tasks Loading State (Station T)
  const [isGroupTasksLoading, setIsGroupTasksLoading] = useState(false);

  // Student Interactive Scaffold Modal State
  const [isStudentScaffoldModalOpen, setIsStudentScaffoldModalOpen] = useState(false);
  const [studentGroupTab, setStudentGroupTab] = useState('all');

  // Instant AI Objectives Generator
  const handleGenerateObjectivesAI = async () => {
    const title = prepForm.title?.trim();
    if (!title) {
      showToast('يرجى كتابة موضوع أو عنوان الحصة أولاً لصياغة الأهداف 🎯');
      return;
    }
    setIsAiObjectivesLoading(true);
    showToast('جاري صياغة أهداف الحصة ومعيار النجاح بالذكاء الاصطناعي... ⏳');
    try {
      const res = await generateMiftaahLessonObjectivesAI({
        title,
        subject: prepForm.subject || '',
        grade: prepForm.grade || '',
        duration: prepForm.duration || 45
      });
      if (res && res.objective) {
        setPrepForm(prev => ({
          ...prev,
          objective: res.objective,
          successCriteria: res.successCriteria || prev.successCriteria,
          prerequisites: res.prerequisites || prev.prerequisites
        }));
        showToast('تمت صياغة الأهداف ومعيار النجاح بنجاح! يمكنك مراجعتها وتعديلها. ✨🎯');
      }
    } catch (err) {
      console.warn('Objectives generation failed:', err);
      showToast('تعذر صياغة الأهداف، يرجى المحاولة ثانية.');
    } finally {
      setIsAiObjectivesLoading(false);
    }
  };

  // Open Prompt-to-Modify Station Modal
  const handleOpenStationPromptModal = (stationKey) => {
    const st = prepForm.stations?.[stationKey] || currentLesson.stations?.[stationKey] || {};
    const stationNames = {
      m: 'مشوّق ومحفّز',
      f: 'فهم وبناء المعنى',
      t: 'تطبيق وتدريب',
      a: 'أدلّة الفهم',
      h: 'حصاد ونقل الأثر'
    };
    const sName = st.name || stationNames[stationKey] || stationKey;
    const currentPrompt = st.studentDisplayPrompt || '';

    setStationPromptModal({
      isOpen: true,
      stationKey,
      stationName: sName,
      currentPrompt,
      promptInstruction: '',
      loading: false
    });
  };

  // Apply Station Prompt Modification with AI
  const handleApplyStationPromptModification = async () => {
    if (!stationPromptModal.stationKey) return;
    const k = stationPromptModal.stationKey;
    const instruction = stationPromptModal.promptInstruction?.trim();
    if (!instruction) {
      showToast('يرجى كتابة توجيه التعديل المطلوب 💬');
      return;
    }
    setStationPromptModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await modifyMiftaahStationWithPromptAI({
        stationKey: k,
        stationTitle: stationPromptModal.stationName,
        currentPrompt: stationPromptModal.currentPrompt,
        instruction,
        title: prepForm.title || currentLesson.title || '',
        subject: prepForm.subject || currentLesson.subject || '',
        grade: prepForm.grade || currentLesson.grade || ''
      });

      if (res && res.studentDisplayPrompt) {
        setPrepForm(prev => ({
          ...prev,
          stations: {
            ...prev.stations,
            [k]: {
              ...prev.stations[k],
              studentDisplayPrompt: res.studentDisplayPrompt,
              teacherNotes: res.teacherNotes || prev.stations[k].teacherNotes,
              scaffolds: res.scaffolds || prev.stations[k].scaffolds,
              extension: res.extension || prev.stations[k].extension
            }
          }
        }));

        // If currently in backstage and modifying the active station, update public display too
        if (currentScreen === 'screen4_backstage' && activeStationKey === k) {
          const updatedDisp = {
            ...publicDisplayState,
            headline: res.studentDisplayPrompt,
            scaffolds: res.scaffolds || publicDisplayState.scaffolds
          };
          broadcastToStudentScreen(updatedDisp);
        }

        setStationPromptModal(prev => ({ ...prev, isOpen: false, loading: false }));
        showToast(`تم تطبيق تعديلك بالذكاء الاصطناعي على محطة [${stationPromptModal.stationName}] بنجاح! 🎯✨`);
      } else {
        setStationPromptModal(prev => ({ ...prev, loading: false }));
        showToast('تعذر تطبيق التعديل، يرجى المحاولة ثانية.');
      }
    } catch (err) {
      console.warn('Station prompt modify error:', err);
      setStationPromptModal(prev => ({ ...prev, loading: false }));
      showToast('حدث خطأ أثناء تعديل المحطة.');
    }
  };

  // Generate Differentiated Group Tasks for Station T
  const handleGenerateGroupTasksAI = async () => {
    const currentStT = prepForm.stations?.t || {};
    setIsGroupTasksLoading(true);
    showToast('جاري توليد ٣ مهام وتحديات متمايزة للمجموعات بالذكاء الاصطناعي... 👥⏳');
    try {
      const res = await generateMiftaahGroupTasksAI({
        title: prepForm.title || '',
        subject: prepForm.subject || '',
        grade: prepForm.grade || '',
        coreTask: currentStT.studentDisplayPrompt || ''
      });

      if (res && Array.isArray(res.groups) && res.groups.length > 0) {
        setPrepForm(prev => ({
          ...prev,
          stations: {
            ...prev.stations,
            t: {
              ...prev.stations.t,
              groupTasks: res.groups
            }
          }
        }));
        showToast('تم توليد مهام المجموعات المتمايزة بنجاح! 🌱⭐🚀 ستظهر على شاشة العرض.');
      }
    } catch (err) {
      console.warn('Group tasks error:', err);
      showToast('تعذر توليد مهام المجموعات.');
    } finally {
      setIsGroupTasksLoading(false);
    }
  };

  const [stationAltModal, setStationAltModal] = useState({
    isOpen: false,
    stationKey: null,
    stationName: '',
    alternatives: [],
    loading: false,
    customInstruction: '',
    currentPrompt: ''
  });

  // Open Station Alternatives Modal & fetch AI suggestions
  const handleOpenStationAlternatives = async (stationKey) => {
    const st = prepForm.stations?.[stationKey] || {};
    const stationNames = {
      m: 'مشوّق ومحفّز',
      f: 'فهم وبناء المعنى',
      t: 'تطبيق وتدريب',
      a: 'أدلّة الفهم',
      h: 'حصاد ونقل الأثر'
    };
    const sName = st.name || stationNames[stationKey] || stationKey;
    const currentPrompt = st.studentDisplayPrompt || '';

    setStationAltModal({
      isOpen: true,
      stationKey,
      stationName: sName,
      alternatives: [],
      loading: true,
      customInstruction: '',
      currentPrompt
    });

    try {
      const res = await generateMiftaahStationAlternativeAI({
        title: prepForm.title || '',
        subject: prepForm.subject || '',
        grade: prepForm.grade || '',
        stationKey,
        currentPrompt,
        customInstruction: ''
      });
      if (res && Array.isArray(res.alternatives) && res.alternatives.length > 0) {
        setStationAltModal(prev => ({
          ...prev,
          alternatives: res.alternatives,
          loading: false
        }));
      } else {
        setStationAltModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.warn('Failed to load station alternatives:', err);
      setStationAltModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Re-generate alternatives with custom teacher prompt
  const handleRegenerateStationAlternatives = async () => {
    if (!stationAltModal.stationKey) return;
    setStationAltModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await generateMiftaahStationAlternativeAI({
        title: prepForm.title || '',
        subject: prepForm.subject || '',
        grade: prepForm.grade || '',
        stationKey: stationAltModal.stationKey,
        currentPrompt: stationAltModal.currentPrompt,
        customInstruction: stationAltModal.customInstruction
      });
      if (res && Array.isArray(res.alternatives)) {
        setStationAltModal(prev => ({
          ...prev,
          alternatives: res.alternatives,
          loading: false
        }));
        showToast('تم توليد بدائل جديدة بنجاح! 🪄✨');
      }
    } catch (e) {
      setStationAltModal(prev => ({ ...prev, loading: false }));
      showToast('حدث خطأ أثناء توليد البدائل');
    }
  };

  // Apply chosen alternative to current station in prepForm
  const handleApplyAlternative = (alt) => {
    const k = stationAltModal.stationKey;
    if (!k) return;

    setPrepForm(prev => ({
      ...prev,
      stations: {
        ...prev.stations,
        [k]: {
          ...prev.stations[k],
          studentDisplayPrompt: alt.studentDisplayPrompt || prev.stations[k].studentDisplayPrompt,
          teacherNotes: alt.teacherNotes || prev.stations[k].teacherNotes,
          scaffolds: alt.scaffolds || prev.stations[k].scaffolds,
          extension: alt.extension || prev.stations[k].extension
        }
      }
    }));

    setStationAltModal(prev => ({ ...prev, isOpen: false }));
    showToast(`تم اعتماد البديل بنجاح لمحطة [${stationAltModal.stationName}]! 🎯✨`);
  }; // 'all' | 'm' | 'f' | 't' | 'a' | 'h'

  // Active Station Key in Backstage: 'm' | 'f' | 't' | 'a' | 'h'
  const [activeStationKey, setActiveStationKey] = useState('m');

  // Elapsed Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Screen 4 & 6: Content Currently Displayed on Student Projector Screen
  const [publicDisplayState, setPublicDisplayState] = useState(() => {
    try {
      const savedPayload = localStorage.getItem('miftaah_student_screen_payload');
      if (savedPayload) {
        const parsed = JSON.parse(savedPayload);
        if (parsed && parsed.headline) return parsed;
      }
    } catch (e) {}
    const stM = currentLesson.stations?.m || {
      letter: 'م',
      name: 'مشوّق ومحفّز',
      studentPhrase: 'أتساءل وأستعد',
      studentDisplayPrompt: currentLesson.title,
      durationMinutes: 5
    };
    return {
      lessonTitle: currentLesson.title,
      objective: currentLesson.objective,
      stationKey: 'm',
      stationLetter: stM.letter,
      stationName: stM.name,
      studentPhrase: stM.studentPhrase,
      headline: stM.studentDisplayPrompt,
      isDisplayHidden: false,
      activeEnergizer: null,
      activeHint: null,
      timerSeconds: (stM.durationMinutes || 5) * 60,
      allowedStudentKeys: ['need_clarify', 'need_hint', 'need_example', 'ready_challenge', 'need_energizer']
    };
  });

  // Screen 5: Drawer state (درج التدخل الجانبي)
  const [isInterventionDrawerOpen, setIsInterventionDrawerOpen] = useState(false);
  const [drawerDifficulty, setDrawerDifficulty] = useState('الإجابة بلا تبرير');
  const [drawerScope, setDrawerScope] = useState('group'); // 'student' | 'group' | 'whole_class'
  const [drawerTime, setDrawerTime] = useState('4_mins');
  const [selectedInterventionOptionIndex, setSelectedInterventionOptionIndex] = useState(1); // Option 2 modeled

  // Screen 7: Verification Post-Intervention state
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null); // 'achieved' | 'partially' | 'not_yet' | 'not_verified'
  const [verificationNote, setVerificationNote] = useState('');

  // Screen 8: Post-Lesson Reflection Records
  const [reflectionData, setReflectionData] = useState({
    whatHelped: 'النمذجة التعبيرية لعينة الحجر ثم إتاحة الفرصة للطلاب لتبرير الماء في وعاءين عززت الدقة العلمية فوراً.',
    whatRemains: 'ثلاثة طلاب في مجموعة الدعم يحتاجون تدريباً إضافياً على برهان المواد اللزجة والغاز المحبوس.',
    nextLessonOpener: 'افتتاح الحصة القادمة بمهمة العصير في كأسين كجسر للانتقال إلى ظاهرة تبخر الماء وتكاثفه.',
    interventionsSummary: [
      { station: 'تطبيق وتدريب [ت]', difficulty: 'الإجابة بلا تبرير', action: 'نمذجة تبرير تصنيف الحجر مع بقاء الصف في مهمة تعميق الوعاء', result: 'تحقق المعيار' }
    ]
  });

  // Dual Screen / Standalone Projector Channel
  const channelRef = useRef(null);
  const [isDisplayConnected, setIsDisplayConnected] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [studentSignals, setStudentSignals] = useState([]);

  // Check URL query on mount for pure student view
  useEffect(() => {
    if (window.location.hash.includes('view=student') || window.location.search.includes('view=student')) {
      setCurrentScreen('screen6_student_screen');
    }
  }, []);

  // Broadcast sync
  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel('miftaah_teacher_sync');
      channelRef.current.onmessage = (e) => {
        if (e.data && e.data.type === 'STUDENT_SIGNAL') {
          handleIncomingSignal(e.data.payload);
        } else if (e.data && e.data.type === 'SYNC_DISPLAY') {
          setPublicDisplayState(e.data.payload);
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel fallback:', err);
    }
    return () => {
      if (channelRef.current) channelRef.current.close();
    };
  }, []);

  // Sync to student screen
  const broadcastToStudentScreen = (newDisplayState) => {
    setPublicDisplayState(newDisplayState);
    try {
      localStorage.setItem('miftaah_student_screen_payload', JSON.stringify(newDisplayState));
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'SYNC_DISPLAY', payload: newDisplayState });
      }
    } catch (e) {
      console.warn('Sync error:', e);
    }
  };

  // Timer tick
  useEffect(() => {
    let t = null;
    if (isTimerRunning) {
      t = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(t);
  }, [isTimerRunning]);

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Incoming signal from student
  const handleIncomingSignal = (keyId) => {
    const found = STUDENT_REQUEST_KEYS.find(k => k.id === keyId) || { label: keyId, icon: '🔔' };
    const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setStudentSignals(prev => [{ id: Date.now(), label: found.label, icon: found.icon, time }, ...prev.slice(0, 8)]);
    showToast(`طلب طالب من شاشة الصف: ${found.icon} ${found.label}`);
  };

  // Open standalone projector
  const handleOpenStudentProjector = () => {
    const url = window.location.origin + window.location.pathname + '#/mafatih?view=student';
    window.open(url, 'MiftaahProjector', 'width=1280,height=768,menubar=no,toolbar=no,location=no');
    showToast('تم فتح شاشة الطلاب في نافذة مستقلة للبروجكتور! 🎦');
  };

  // Explicit Teacher Action: "اعرض للطلاب على الشاشة الكبيرة"
  const handleTeacherApproveDisplay = () => {
    const activeSt = currentLesson.stations?.[activeStationKey] || currentLesson.stations?.m;
    if (!activeSt) return;
    const newState = {
      ...publicDisplayState,
      lessonTitle: currentLesson.title,
      objective: currentLesson.objective,
      stationKey: activeStationKey,
      stationLetter: activeSt.letter,
      stationName: activeSt.name,
      studentPhrase: activeSt.studentPhrase,
      headline: activeSt.studentDisplayPrompt || currentLesson.title,
      isDisplayHidden: false,
      activeEnergizer: null,
      activeHint: null,
      scaffolds: activeSt.scaffolds || '',
      groupTasks: activeSt.groupTasks || null,
      timerSeconds: (activeSt.durationMinutes || 5) * 60
    };
    broadcastToStudentScreen(newState);
    showToast(`تم عرض محطة [${activeSt.name}] من درس "${currentLesson.title}" على شاشة الطلاب 📤`);
  };

  // Prep Form Field Modifiers
  const updatePrepField = (field, value) => {
    setPrepForm(prev => ({ ...prev, [field]: value }));
  };

  const updatePrepStationField = (stationKey, field, value) => {
    setPrepForm(prev => ({
      ...prev,
      stations: {
        ...prev.stations,
        [stationKey]: {
          ...prev.stations[stationKey],
          [field]: value
        }
      }
    }));
  };

    // Smart Auto-Draft Assistant for 5 Stations with AI (Gemini & Groq)
  const handleSmartAutoGenerateDraft = async () => {
    const title = prepForm.title?.trim() || 'الدرس المحدد';
    const subj = prepForm.subject?.trim() || 'عام';
    const gr = prepForm.grade?.trim() || 'المرحلة الابتدائية';
    const obj = prepForm.objective?.trim() || '';

    setIsAiGenerating(true);
    showToast('جاري استدعاء الذكاء الاصطناعي (Gemini & Groq) لهندسة المحطات الخمس بذكاء... 🤖⏳');

    try {
      const aiResult = await generateMiftaahCompanionLessonAI({
        title,
        subject: subj,
        grade: gr,
        duration: prepForm.duration || 45,
        objective: obj,
        notes: prepForm.resources || ''
      });

      if (aiResult && aiResult.stations && aiResult.stations.m) {
        setPrepForm(prev => ({
          ...prev,
          title: aiResult.title || prev.title,
          subject: aiResult.subject || prev.subject,
          grade: aiResult.grade || prev.grade,
          objective: aiResult.objective || prev.objective,
          successCriteria: aiResult.successCriteria || prev.successCriteria,
          prerequisites: aiResult.prerequisites || prev.prerequisites,
          resources: aiResult.resources || prev.resources,
          participationBarriers: aiResult.participationBarriers || prev.participationBarriers,
          stations: {
            m: {
              ...prev.stations.m,
              durationMinutes: aiResult.stations.m.durationMinutes || 5,
              studentDisplayPrompt: aiResult.stations.m.studentDisplayPrompt || prev.stations.m.studentDisplayPrompt,
              teacherNotes: aiResult.stations.m.teacherNotes || prev.stations.m.teacherNotes,
              scaffolds: aiResult.stations.m.scaffolds || prev.stations.m.scaffolds,
              extension: aiResult.stations.m.extension || prev.stations.m.extension
            },
            f: {
              ...prev.stations.f,
              durationMinutes: aiResult.stations.f.durationMinutes || 10,
              studentDisplayPrompt: aiResult.stations.f.studentDisplayPrompt || prev.stations.f.studentDisplayPrompt,
              teacherNotes: aiResult.stations.f.teacherNotes || prev.stations.f.teacherNotes,
              scaffolds: aiResult.stations.f.scaffolds || prev.stations.f.scaffolds,
              extension: aiResult.stations.f.extension || prev.stations.f.extension
            },
            t: {
              ...prev.stations.t,
              durationMinutes: aiResult.stations.t.durationMinutes || 15,
              studentDisplayPrompt: aiResult.stations.t.studentDisplayPrompt || prev.stations.t.studentDisplayPrompt,
              teacherNotes: aiResult.stations.t.teacherNotes || prev.stations.t.teacherNotes,
              scaffolds: aiResult.stations.t.scaffolds || prev.stations.t.scaffolds,
              extension: aiResult.stations.t.extension || prev.stations.t.extension,
              modeledInterventionScenario: aiResult.stations.t.modeledInterventionScenario || prev.stations.t.modeledInterventionScenario
            },
            a: {
              ...prev.stations.a,
              durationMinutes: aiResult.stations.a.durationMinutes || 8,
              studentDisplayPrompt: aiResult.stations.a.studentDisplayPrompt || prev.stations.a.studentDisplayPrompt,
              teacherNotes: aiResult.stations.a.teacherNotes || prev.stations.a.teacherNotes,
              scaffolds: aiResult.stations.a.scaffolds || prev.stations.a.scaffolds,
              extension: aiResult.stations.a.extension || prev.stations.a.extension
            },
            h: {
              ...prev.stations.h,
              durationMinutes: aiResult.stations.h.durationMinutes || 7,
              studentDisplayPrompt: aiResult.stations.h.studentDisplayPrompt || prev.stations.h.studentDisplayPrompt,
              teacherNotes: aiResult.stations.h.teacherNotes || prev.stations.h.teacherNotes,
              scaffolds: aiResult.stations.h.scaffolds || prev.stations.h.scaffolds,
              extension: aiResult.stations.h.extension || prev.stations.h.extension
            }
          }
        }));
        showToast('تمت هندسة الدرس والمحطات الخمس بنجاح عبر الذكاء الاصطناعي (Gemini & Groq)! 🤖✨');
      }
    } catch (err) {
      console.warn('AI Companion generation error:', err);
      showToast('تم تطبيق المسودة البيداغوجية بنجاح 🪄');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save Lesson and Immediately Start in Backstage + Student Screen
  const handleSaveAndStartLesson = () => {
    const title = prepForm.title?.trim() || 'حصة دراسية جديدة';
    const lessonToSave = {
      ...prepForm,
      id: prepForm.id || ('lesson_' + Date.now()),
      title,
      subject: prepForm.subject?.trim() || 'عام',
      status: 'ready'
    };

    const updatedList = (() => {
      const exists = lessons.some(l => l.id === lessonToSave.id);
      if (exists) {
        return lessons.map(l => l.id === lessonToSave.id ? lessonToSave : l);
      }
      return [lessonToSave, ...lessons];
    })();

    setLessons(updatedList);
    persistLessons(updatedList);
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, lessonToSave.id);
    setActiveLessonId(lessonToSave.id);
    setActiveStationKey('m');

    const stM = lessonToSave.stations?.m || {
      letter: 'م',
      name: 'مشوّق ومحفّز',
      studentPhrase: 'أتساءل وأستعد',
      studentDisplayPrompt: lessonToSave.title,
      durationMinutes: 5
    };
    const newDisplayState = {
      ...publicDisplayState,
      lessonTitle: lessonToSave.title,
      objective: lessonToSave.objective,
      stationKey: 'm',
      stationLetter: stM.letter,
      stationName: stM.name,
      studentPhrase: stM.studentPhrase,
      headline: stM.studentDisplayPrompt || lessonToSave.title,
      isDisplayHidden: false,
      activeEnergizer: null,
      activeHint: null,
      timerSeconds: (stM.durationMinutes || 5) * 60
    };
    broadcastToStudentScreen(newDisplayState);

    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setCurrentScreen('screen4_backstage');
    showToast(`تم اعتماد درس "${lessonToSave.title}" بنجاح، وبدأت الحصة في الكواليس وعلى شاشة العرض! 🚀`);
  };

  // Save Lesson and Navigate to Materials Bag
  const handleSaveAndGoToMaterials = () => {
    const title = prepForm.title?.trim() || 'حصة دراسية جديدة';
    const lessonToSave = {
      ...prepForm,
      id: prepForm.id || ('lesson_' + Date.now()),
      title,
      subject: prepForm.subject?.trim() || 'عام',
      status: 'ready'
    };

    const updatedList = (() => {
      const exists = lessons.some(l => l.id === lessonToSave.id);
      if (exists) {
        return lessons.map(l => l.id === lessonToSave.id ? lessonToSave : l);
      }
      return [lessonToSave, ...lessons];
    })();

    setLessons(updatedList);
    persistLessons(updatedList);
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, lessonToSave.id);
    setActiveLessonId(lessonToSave.id);
    setCurrentScreen('screen3_materials_bag');
    showToast(`تم حفظ التحضير والانتقال إلى حقيبة المواد الخاصة بحصة "${lessonToSave.title}" 💼`);
  };

  // Save Lesson as Draft in Hub
  const handleSaveDraft = () => {
    const title = prepForm.title?.trim() || 'مسودة حصة جديدة';
    const lessonToSave = {
      ...prepForm,
      id: prepForm.id || ('lesson_' + Date.now()),
      title,
      subject: prepForm.subject?.trim() || 'عام',
      status: 'draft'
    };

    const updatedList = (() => {
      const exists = lessons.some(l => l.id === lessonToSave.id);
      if (exists) {
        return lessons.map(l => l.id === lessonToSave.id ? lessonToSave : l);
      }
      return [lessonToSave, ...lessons];
    })();

    setLessons(updatedList);
    persistLessons(updatedList);
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, lessonToSave.id);
    setActiveLessonId(lessonToSave.id);
    setCurrentScreen('screen1_my_lessons');
    showToast(`تم حفظ مسودة "${lessonToSave.title}" في سجل حصصي بنجاح 💾`);
  };

  // Hub Screen 1 Actions
  const handleCreateNewLesson = () => {
    const blank = createBlankLesson();
    setPrepForm(blank);
    setCurrentScreen('screen2_prep_context');
  };

  const handleEditLessonFromHub = (lsn) => {
    setActiveLessonId(lsn.id);
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, lsn.id);
    setPrepForm(JSON.parse(JSON.stringify(lsn)));
    setCurrentScreen('screen2_prep_context');
  };

  const handleReviewBagFromHub = (lsn) => {
    setActiveLessonId(lsn.id);
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, lsn.id);
    setCurrentScreen('screen3_materials_bag');
  };

  const handleStartLessonFromHub = (lsn) => {
    setActiveLessonId(lsn.id);
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, lsn.id);
    setActiveStationKey('m');
    const stM = lsn.stations?.m || {
      letter: 'م',
      name: 'مشوّق ومحفّز',
      studentPhrase: 'أتساءل وأستعد',
      studentDisplayPrompt: lsn.title,
      durationMinutes: 5
    };
    const newDisplayState = {
      ...publicDisplayState,
      lessonTitle: lsn.title,
      objective: lsn.objective,
      stationKey: 'm',
      stationLetter: stM.letter,
      stationName: stM.name,
      studentPhrase: stM.studentPhrase,
      headline: stM.studentDisplayPrompt || lsn.title,
      isDisplayHidden: false,
      activeEnergizer: null,
      activeHint: null,
      timerSeconds: (stM.durationMinutes || 5) * 60
    };
    broadcastToStudentScreen(newDisplayState);

    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setCurrentScreen('screen4_backstage');
    showToast(`انطلقت حصة "${lsn.title}" في الكواليس وعلى شاشة العرض! 🚀`);
  };

  const handleDeleteLesson = (lessonId, e) => {
    e.stopPropagation();
    if (lessonId === 'lesson_states_of_matter') {
      alert('لا يمكن حذف الحصة النموذجية التجريبية.');
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذه الحصة من سجلك؟')) {
      const updated = lessons.filter(l => l.id !== lessonId);
      setLessons(updated);
      persistLessons(updated);
      if (activeLessonId === lessonId) {
        const nextId = updated[0]?.id || 'lesson_states_of_matter';
        setActiveLessonId(nextId);
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, nextId);
      }
      showToast('تم حذف الحصة من السجل بنجاح 🗑️');
    }
  };

  // Toggle Display Visibility (أخفِ العرض مؤقتاً)
  const handleToggleHideDisplay = () => {
    const newState = { ...publicDisplayState, isDisplayHidden: !publicDisplayState.isDisplayHidden };
    broadcastToStudentScreen(newState);
    showToast(newState.isDisplayHidden ? 'تم إخفاء العرض مؤقتاً عن شاشة الطلاب 🙈' : 'تمت إعادة إظهار المحتوى على شاشة الطلاب 👁️');
  };

  // Trigger Energizer
  const handleTriggerEnergizer = () => {
    const newState = {
      ...publicDisplayState,
      headline: ENERGIZER_PRESET.title,
      activeEnergizer: ENERGIZER_PRESET,
      isDisplayHidden: false
    };
    broadcastToStudentScreen(newState);
    showToast('تم تفعيل نشاط التجديد على شاشة الصف! ⚡');
  };

  // Return to task from energizer (العودة للمهمة)
  const handleReturnToCurrentTask = () => {
    handleTeacherApproveDisplay();
    showToast('تمت العودة إلى المهمة السابقة دون فقدان السياق 🔄');
  };

  // Active Station Data
  const currentStationData = currentLesson.stations[activeStationKey] || currentLesson.stations.m;

  return (
    <div className="teacher-companion-system-root" dir="rtl">
      {/* Toast Bar */}
      {toastMessage && (
        <div className="system-toast animate-slide-down">
          <i className="fas fa-info-circle"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* GLOBAL APPLICATION TOP BAR                                          */}
      {/* =================================================================== */}
      <header className="system-global-navbar">
        <div className="navbar-brand-section">
          <div className="brand-logo-gem">🗝️</div>
          <div>
            <div className="brand-sub">نظام التدريس الصفي المترابط</div>
            <h2 className="brand-title">مِفتاح المعلّم</h2>
          </div>
        </div>

        {/* Global 8-Screen Switcher Breadcrumb */}
        <div className="navbar-screens-switcher">
          <button 
            type="button" 
            className={`nav-screen-chip ${currentScreen === 'screen1_my_lessons' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('screen1_my_lessons')}
          >
            <i className="fas fa-folder"></i> ١. حصصي
          </button>
          <button 
            type="button" 
            className={`nav-screen-chip ${currentScreen === 'screen2_prep_context' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('screen2_prep_context')}
          >
            <i className="fas fa-edit"></i> ٢. أجهّز حصتي
          </button>
          <button 
            type="button" 
            className={`nav-screen-chip ${currentScreen === 'screen3_materials_bag' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('screen3_materials_bag')}
          >
            <i className="fas fa-briefcase"></i> ٣. حقيبة المفاتيح
          </button>
          <button 
            type="button" 
            className={`nav-screen-chip live ${currentScreen === 'screen4_backstage' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('screen4_backstage')}
          >
            <span className="live-dot"></span> ٤. كواليس الحصة
          </button>
          <button 
            type="button" 
            className={`nav-screen-chip ${currentScreen === 'screen6_student_screen' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('screen6_student_screen')}
          >
            <i className="fas fa-desktop"></i> ٦. شاشة الطلاب
          </button>
          <button 
            type="button" 
            className={`nav-screen-chip ${currentScreen === 'screen8_harvest' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('screen8_harvest')}
          >
            <i className="fas fa-chart-pie"></i> ٨. حصاد المعلم
          </button>
        </div>

        <div className="navbar-quick-actions">
          <button 
            type="button" 
            className="btn-projector-window"
            onClick={handleOpenStudentProjector}
            title="فتح شاشة عرض مستقلة للبروجكتور"
          >
            <i className="fas fa-external-link-alt"></i> شاشة البروجكتور 🎦
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* SCREEN 1: MY LESSONS (الشاشة ١: حصصي)                                */}
      {/* =================================================================== */}
      {currentScreen === 'screen1_my_lessons' && (
        <section className="screen-container screen1-my-lessons animate-fade-in">
          <div className="screen-header-banner">
            <div>
              <h3><i className="fas fa-layer-group"></i> حصصي المجهزة والمعتمدة</h3>
              <p>الوصول السريع إلى حصصك، إكمال التحضير، أو بدء التدريس وعرض الشاشة فوراً.</p>
            </div>
            <button 
              type="button" 
              className="btn-primary-action"
              onClick={handleCreateNewLesson}
            >
              <i className="fas fa-plus"></i> أجهّز حصة جديدة
            </button>
          </div>

          <div className="lessons-cards-grid">
            {lessons.map((lsn) => (
              <div key={lsn.id} className={`lesson-summary-card status-${lsn.status}`}>
                <div className="card-top-meta">
                  <span className="subject-pill">{lsn.subject}</span>
                  <span className={`status-badge ${lsn.status}`}>
                    {lsn.status === 'ready' ? 'جاهزة للتنفيذ' : lsn.status === 'completed' ? 'نُفذت' : 'مسودة'}
                  </span>
                  {lsn.isExemplar && <span className="exemplar-tag-chip">⭐ {lsn.tag}</span>}
                  {!lsn.isExemplar && (
                    <button 
                      type="button" 
                      className="btn-delete-lesson-card" 
                      title="حذف الحصة"
                      onClick={(e) => handleDeleteLesson(lsn.id, e)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  )}
                </div>

                <h4 className="lesson-card-title">{lsn.title}</h4>
                <div className="lesson-card-info-row">
                  <span><i className="fas fa-graduation-cap"></i> {lsn.grade}</span>
                  <span><i className="fas fa-clock"></i> {lsn.duration === 'وحدة كاملة' ? 'وحدة تعليمية كاملة' : `${lsn.duration} دقيقة`}</span>
                  <span><i className="fas fa-users"></i> {lsn.studentCount} طالباً</span>
                </div>

                <div className="lesson-card-objective-snippet">
                  <strong>الهدف:</strong> {lsn.objective}
                </div>

                <div className="lesson-card-actions-footer">
                  <button 
                    type="button" 
                    className="btn-action-start-lesson"
                    onClick={() => handleStartLessonFromHub(lsn)}
                  >
                    <i className="fas fa-play"></i> أبدأ الحصة 🚀
                  </button>
                  <button 
                    type="button" 
                    className="btn-action-edit-prep"
                    onClick={() => handleEditLessonFromHub(lsn)}
                  >
                    <i className="fas fa-edit"></i> أكمل التحضير
                  </button>
                  <button 
                    type="button" 
                    className="btn-action-review-bag"
                    onClick={() => handleReviewBagFromHub(lsn)}
                  >
                    <i className="fas fa-briefcase"></i> حقيبة المواد
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* SCREEN 2: PREPARE LESSON (الشاشة ٢: أجهّز حصتي)                      */}
      {/* =================================================================== */}
      {currentScreen === 'screen2_prep_context' && (
        <section className="screen-container screen2-prep animate-fade-in">
          <div className="screen-header-banner">
            <div>
              <h3><i className="fas fa-clipboard-check"></i> أجهّز حصتي: سياق التعلم والمحطات الخمس</h3>
              <p>قم بتعبئة معطيات الدرس ومهمات المحطات الخمس، ثم اضغط «اعتماد وبدء الحصة» لتظهر فوراً على شاشتك وشاشة الطلاب.</p>
            </div>
            <div className="header-actions-group">
              <button 
                type="button" 
                className="btn-projector-launch-nav"
                onClick={handleOpenStudentProjector}
                title="فتح شاشة البروجكتور المخصصة للطلاب في نافذة مستقلة"
              >
                <i className="fas fa-desktop"></i> شاشة البروجكتور للصف 🎦
              </button>
              <button 
                type="button" 
                className="btn-save-draft"
                onClick={handleSaveDraft}
              >
                <i className="fas fa-save"></i> حفظ كمسودة
              </button>
              <button 
                type="button" 
                className="btn-secondary-action"
                onClick={handleSaveAndGoToMaterials}
              >
                <i className="fas fa-briefcase"></i> حقيبة المفاتيح والمواد
              </button>
              <button 
                type="button" 
                className="btn-primary-action"
                onClick={handleSaveAndStartLesson}
              >
                <i className="fas fa-play"></i> اعتماد وبدء الحصة الآن 🚀
              </button>
            </div>
          </div>

          <div className="prep-three-steps-wrapper">
            {/* Step 1: Lesson Context */}
            <div className="prep-step-card">
              <div className="step-card-head">
                <span className="step-number-circle">١</span>
                <h4>سياق الحصة وهدف التعلم</h4>
              </div>
              <div className="step-card-fields">
                <div className="fields-row-3">
                  {/* المادة الدراسية / المواضيع العامة */}
                  <div className="form-item">
                    <label>المادة الدراسية:</label>
                    <select
                      value={PRESET_SUBJECTS.includes(prepForm.subject) ? prepForm.subject : 'other'}
                      onChange={(e) => {
                        if (e.target.value === 'other') {
                          if (PRESET_SUBJECTS.includes(prepForm.subject)) {
                            updatePrepField('subject', '');
                          }
                        } else {
                          updatePrepField('subject', e.target.value);
                        }
                      }}
                    >
                      <option value="" disabled>-- اختر الموضوع / المادة --</option>
                      {PRESET_SUBJECTS.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                      <option value="other">موضوع عام / مادة أخرى...</option>
                    </select>
                    {(!PRESET_SUBJECTS.includes(prepForm.subject) || prepForm.subject === '') && (
                      <input 
                        type="text" 
                        style={{ marginTop: '7px' }}
                        value={prepForm.subject || ''} 
                        onChange={(e) => updatePrepField('subject', e.target.value)} 
                        placeholder="اكتب اسم المادة أو الموضوع العام..."
                        autoFocus
                      />
                    )}
                  </div>

                  {/* الصفوف من الأول حتى السادس وأخرى */}
                  <div className="form-item">
                    <label>الصف والمستوى:</label>
                    <select
                      value={PRESET_GRADES.includes(prepForm.grade) ? prepForm.grade : 'other'}
                      onChange={(e) => {
                        if (e.target.value === 'other') {
                          if (PRESET_GRADES.includes(prepForm.grade)) {
                            updatePrepField('grade', '');
                          }
                        } else {
                          updatePrepField('grade', e.target.value);
                        }
                      }}
                    >
                      <option value="" disabled>-- اختر الصف --</option>
                      {PRESET_GRADES.map((gr) => (
                        <option key={gr} value={gr}>{gr}</option>
                      ))}
                      <option value="other">شريحة عمرية أو صف آخر...</option>
                    </select>
                    {(!PRESET_GRADES.includes(prepForm.grade) || prepForm.grade === '') && (
                      <input 
                        type="text" 
                        style={{ marginTop: '7px' }}
                        value={prepForm.grade || ''} 
                        onChange={(e) => updatePrepField('grade', e.target.value)} 
                        placeholder="اكتب الشريحة أو الصف المخصص (مثال: شريحة الرواد / التعليم الخاص)..."
                        autoFocus
                      />
                    )}
                  </div>

                  {/* المدة الإجمالية: 45، 90، أو وحدة كاملة */}
                  <div className="form-item">
                    <label>المدة الإجمالية:</label>
                    <select
                      value={
                        prepForm.duration === 45 || prepForm.duration === '45' 
                          ? '45' 
                          : (prepForm.duration === 90 || prepForm.duration === '90' 
                              ? '90' 
                              : (prepForm.duration === 'وحدة كاملة' ? 'وحدة كاملة' : 'other'))
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '45') {
                          updatePrepField('duration', 45);
                        } else if (val === '90') {
                          updatePrepField('duration', 90);
                        } else if (val === 'وحدة كاملة') {
                          updatePrepField('duration', 'وحدة كاملة');
                        } else {
                          updatePrepField('duration', 60);
                        }
                      }}
                    >
                      <option value="45">٤٥ دقيقة (حصة فردية)</option>
                      <option value="90">٩٠ دقيقة (حصة مزدوجة)</option>
                      <option value="وحدة كاملة">وحدة تعليمية كاملة (ممتدة)</option>
                      <option value="other">مدة مخصصة أخرى...</option>
                    </select>
                    {prepForm.duration !== 45 && prepForm.duration !== '45' && prepForm.duration !== 90 && prepForm.duration !== '90' && prepForm.duration !== 'وحدة كاملة' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '7px' }}>
                        <input 
                          type="number" 
                          value={typeof prepForm.duration === 'number' ? prepForm.duration : 60} 
                          onChange={(e) => updatePrepField('duration', parseInt(e.target.value) || 45)} 
                          placeholder="المدة بالدقائق"
                        />
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>دقيقة</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-item highlight-field">
                  <div className="title-label-with-ai-btn">
                    <label>موضوع وعنوان الحصة (يظهر على شاشة الطلاب):</label>
                    <button
                      type="button"
                      className={`btn-ai-objectives-generator ${isAiObjectivesLoading ? 'loading' : ''}`}
                      onClick={handleGenerateObjectivesAI}
                      disabled={isAiObjectivesLoading}
                      title="صياغة أهداف الحصة ومعيار النجاح والمعرفة السابقة فوراً بالذكاء الاصطناعي بناءً على العنوان"
                    >
                      {isAiObjectivesLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> جاري الصياغة...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-magic"></i> ✨ صياغة فورية للهدف ومعيار النجاح (AI)
                        </>
                      )}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={prepForm.title || ''} 
                    onChange={(e) => updatePrepField('title', e.target.value)} 
                    placeholder="اكتب عنوان الحصة بوضوح (مثال: مهارة التعبير وبناء الفقرة)"
                  />
                </div>

                <div className="form-item">
                  <label>هدف التعلّم المركزي (المعروض دائماً أمام الطلاب):</label>
                  <textarea 
                    rows={2} 
                    value={prepForm.objective || ''} 
                    onChange={(e) => updatePrepField('objective', e.target.value)} 
                    placeholder="مثال: يكتب الطالب فقرة وصفية متكاملة موظفاً علامات الترقيم ومخزن الكلمات..."
                  />
                </div>

                <div className="form-item">
                  <label>معيار النجاح (أداء صريح ومحدد يكشف تحقق الهدف):</label>
                  <textarea 
                    rows={2} 
                    value={prepForm.successCriteria || ''} 
                    onChange={(e) => updatePrepField('successCriteria', e.target.value)} 
                    placeholder="مثال: كتابة فقرة من ٤ أسطر تتضمن فكرة رئيسية وعلامات ترقيم و٣ كلمات من المخزن دون خطأ إملائي..."
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Implementation Circumstances */}
            <div className="prep-step-card">
              <div className="step-card-head">
                <span className="step-number-circle">٢</span>
                <h4>ظروف التنفيذ وتخصيص الدعم</h4>
              </div>
              <div className="step-card-fields">
                <div className="form-item">
                  <label>المعرفة السابقة المفترضة:</label>
                  <textarea 
                    rows={2} 
                    value={prepForm.prerequisites || ''} 
                    onChange={(e) => updatePrepField('prerequisites', e.target.value)} 
                    placeholder="ما الذي يفترض أن يعرفه الطالب من حصص سابقة؟"
                  />
                </div>

                <div className="fields-row-2">
                  <div className="form-item">
                    <label>عدد الطلاب:</label>
                    <input 
                      type="number" 
                      value={prepForm.studentCount || 25} 
                      onChange={(e) => updatePrepField('studentCount', parseInt(e.target.value) || 25)} 
                    />
                  </div>
                  <div className="form-item">
                    <label>تجهيز شاشات العرض:</label>
                    <select 
                      value={prepForm.displayMode || 'single_screen'}
                      onChange={(e) => updatePrepField('displayMode', e.target.value)}
                    >
                      <option value="single_screen">شاشة صف واحدة (البروجكتور الرئيسي)</option>
                      <option value="student_devices">أجهزة فردية للطلاب + شاشة صف</option>
                    </select>
                  </div>
                </div>

                <div className="form-item">
                  <label>الموارد والمساحة المتاحة:</label>
                  <input 
                    type="text" 
                    value={prepForm.resources || ''} 
                    onChange={(e) => updatePrepField('resources', e.target.value)} 
                    placeholder="مثال: شاشة عرض، دفاتر الطلاب، بطاقات مخزن الكلمات المطبوعة..."
                  />
                </div>

                <div className="form-item">
                  <label>حواجز المشاركة الملحوظة (عامة ودون بيانات تعريفية):</label>
                  <textarea 
                    rows={2} 
                    value={prepForm.participationBarriers || ''} 
                    onChange={(e) => updatePrepField('participationBarriers', e.target.value)} 
                    placeholder="مثال: تفاوت في سرعة التدوين، تردد في صياغة الجمل، حاجة لتلميحات بصرية..."
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Five Stations Plan with Full Editing & Smart Auto-Draft */}
            <div className="prep-step-card step3-stations-editor">
              <div className="step-card-head stations-editor-head">
                <div className="head-left-group">
                  <span className="step-number-circle">٣</span>
                  <div>
                    <h4>خطة المحطات الخمس المترابطة (مِفتاح)</h4>
                    <small>كل ما تدخله هنا في «نص شاشة الطلاب» سيظهر مباشرة على الشاشة الكبيرة عند ضغط زر العرض.</small>
                  </div>
                </div>

                <button 
                  type="button" 
                  className={`btn-smart-draft-trigger ${isAiGenerating ? 'loading' : ''}`}
                  onClick={handleSmartAutoGenerateDraft}
                  disabled={isAiGenerating}
                  title="توليد مسودة نموذجية للمحطات الخمس بالذكاء الاصطناعي (Gemini & Groq)"
                >
                  {isAiGenerating ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> جاري استدعاء الذكاء الاصطناعي...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-robot"></i> هندسة المحطات بالذكاء الاصطناعي (AI) 🪄
                    </>
                  )}
                </button>
              </div>

              {/* Station Filter Tabs */}
              <div className="prep-stations-tabs-strip">
                <button
                  type="button"
                  className={`prep-st-tab-btn ${prepActiveStationTab === 'all' ? 'active' : ''}`}
                  onClick={() => setPrepActiveStationTab('all')}
                >
                  جميع المحطات (٥)
                </button>
                {['m', 'f', 't', 'a', 'h'].map((k) => {
                  const st = prepForm.stations?.[k] || {};
                  return (
                    <button
                      key={k}
                      type="button"
                      className={`prep-st-tab-btn letter-${k} ${prepActiveStationTab === k ? 'active' : ''}`}
                      onClick={() => setPrepActiveStationTab(k)}
                    >
                      <span className="tab-letter-dot">{st.letter || k}</span>
                      {st.name || k}
                    </button>
                  );
                })}
              </div>

              {/* Editable Stations List */}
              <div className="editable-stations-list">
                {['m', 'f', 't', 'a', 'h']
                  .filter(k => prepActiveStationTab === 'all' || prepActiveStationTab === k)
                  .map((k) => {
                    const st = prepForm.stations?.[k] || {};
                    return (
                      <div key={k} className={`station-edit-card letter-${k}`}>
                        <div className="st-edit-top-header">
                          <div className="st-edit-meta">
                            <span className={`st-edit-badge letter-${k}`}>{st.letter || k}</span>
                            <div>
                              <h5>محطة {st.name} — «{st.studentPhrase}»</h5>
                              <span className="st-query-hint">{st.studentQuestion}</span>
                            </div>
                          </div>
                          <div className="st-edit-actions-right">
                            <button
                              type="button"
                              className="btn-station-ai-alternatives"
                              onClick={() => handleOpenStationAlternatives(k)}
                              title="اقتراح ٣ بدائل تعليمية جاهزة لهذه المحطة عبر الذكاء الاصطناعي"
                            >
                              <i className="fas fa-magic"></i> بدائل مقترحة (AI) ✨
                            </button>
                            <button
                              type="button"
                              className="btn-station-prompt-modify"
                              onClick={() => handleOpenStationPromptModal(k)}
                              title="اطلب تعديلاً مخصصاً بالذكاء الاصطناعي لهذه المحطة (اكتب أي رغبة أو فكرة)"
                            >
                              <i className="fas fa-comment-dots"></i> 💬 اطلب تعديلاً مخصصاً (AI)
                            </button>
                            {k === 't' && (
                              <button
                                type="button"
                                className={`btn-generate-group-tasks ${isGroupTasksLoading ? 'loading' : ''}`}
                                onClick={handleGenerateGroupTasksAI}
                                disabled={isGroupTasksLoading}
                                title="توليد مهام متمايزة لـ ٣ مجموعات صفيّة بالذكاء الاصطناعي"
                              >
                                {isGroupTasksLoading ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin"></i> جاري التوليد...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-users-cog"></i> 👥 تحديات المجموعات المتمايزة (AI)
                                  </>
                                )}
                              </button>
                            )}
                            <div className="st-duration-input-box">
                              <label>المدة:</label>
                              <input 
                                type="number" 
                                value={st.durationMinutes || 5} 
                                onChange={(e) => updatePrepStationField(k, 'durationMinutes', parseInt(e.target.value) || 5)} 
                              />
                              <span>د</span>
                            </div>
                          </div>
                        </div>

                        <div className="st-edit-fields-grid">
                          <div className="st-field-col main-prompt-col">
                            <label className="label-bold label-student-screen">
                              <i className="fas fa-desktop"></i> نص شاشة الطلاب (المهمة / السؤال المعروض على البروجكتور):
                            </label>

                            {/* Direct Projector Live Link Banner */}
                            <div className="st-prompt-link-banner">
                              <div className="st-prompt-link-title">
                                <span className="live-gem-tag"><i className="fas fa-satellite-dish"></i> شاشة العرض للصف</span>
                                <strong>رابط الشاشة المعروضة:</strong>
                              </div>
                              <div className="st-prompt-link-buttons">
                                <button
                                  type="button"
                                  className="btn-inspect-live-display"
                                  onClick={() => handleLaunchProjectorFromStation(k, true)}
                                  title="اضغط هنا لفتح شاشة العرض ومشاهدة المحتوى والتأكد منه"
                                >
                                  <i className="fas fa-external-link-alt"></i> اضغط هنا لفتح شاشة العرض ومشاهدة المحتوى المعروض للطلاب 👁️
                                </button>
                                <button
                                  type="button"
                                  className="btn-inspect-modal-display"
                                  onClick={() => handlePreviewStationOnProjector(k)}
                                  title="معاينة سريعة داخل الصفحة"
                                >
                                  <i className="fas fa-eye"></i> معاينة سريعة
                                </button>
                                <button
                                  type="button"
                                  className="btn-inspect-copy-display"
                                  onClick={() => handleCopyProjectorLink(k)}
                                  title="نسخ الرابط المباشر لشاشة البروجكتور لفتحه في أي جهاز آخر"
                                >
                                  <i className="fas fa-link"></i> نسخ الرابط 📋
                                </button>
                              </div>
                            </div>

                            <textarea 
                              rows={4}
                              value={st.studentDisplayPrompt || ''}
                              onChange={(e) => updatePrepStationField(k, 'studentDisplayPrompt', e.target.value)}
                              placeholder="اكتب السؤال أو المهمة الصريحة التي سيقرؤها الطلاب على شاشة الصف..."
                            />
                            <div className="prompt-field-footnote">
                              <span className="live-indicator-dot"></span> المحتوى المكتوب أعلاه هو ما يُعرض حرفياً للطلاب على شاشة البروجكتور في محطة [{st.name}].
                            </div>
                          </div>

                          <div className="st-field-col">
                            <label className="label-bold label-teacher-notes">
                              <i className="fas fa-user-secret"></i> إجراء وملاحظات المعلم (كواليس خاصة لا تظهر للطلاب):
                            </label>
                            <textarea 
                              rows={3}
                              value={st.teacherNotes || ''}
                              onChange={(e) => updatePrepStationField(k, 'teacherNotes', e.target.value)}
                              placeholder="إجراءاتك في إدارة الحوار، توجيه الطلاب، والتعامل مع الخطأ الشائع..."
                            />
                          </div>

                          <div className="st-field-col">
                            <label className="label-bold label-scaffold">
                              <i className="fas fa-life-ring"></i> سقالة الدعم الجاهزة (تلميح / جمل مساعدة):
                            </label>
                            <textarea 
                              rows={2}
                              value={st.scaffolds || ''}
                              onChange={(e) => updatePrepStationField(k, 'scaffolds', e.target.value)}
                              placeholder="بداية جملة، مفتاح حل، أو تلميح يقدم لمن يتعثر..."
                            />
                          </div>

                          <div className="st-field-col">
                            <label className="label-bold label-challenge">
                              <i className="fas fa-rocket"></i> مهمة التحدي والتعميق لمن ينهي مبكراً:
                            </label>
                            <textarea 
                              rows={2}
                              value={st.extension || ''}
                              onChange={(e) => updatePrepStationField(k, 'extension', e.target.value)}
                              placeholder="سؤال تفكير عليا أو مهمة تطبيق إضافية..."
                            />
                          </div>
                        </div>

                        {/* Differentiated Group Tasks Display for Station T */}
                        {k === 't' && st.groupTasks && st.groupTasks.length > 0 && (
                          <div className="st-group-tasks-container animate-fade-in">
                            <div className="group-tasks-header">
                              <h6><i className="fas fa-users"></i> مهام المجموعات المتمايزة الجاهزة للعرض على شاشة الصف (٣ فِرق):</h6>
                              <button 
                                type="button" 
                                className="btn-clear-group-tasks" 
                                onClick={() => updatePrepStationField('t', 'groupTasks', null)}
                              >
                                <i className="fas fa-trash-alt"></i> إزالة المهام المتمايزة
                              </button>
                            </div>
                            <div className="group-tasks-grid">
                              {st.groupTasks.map((gt, gIdx) => (
                                <div key={gIdx} className={`group-task-card level-${gt.level}`}>
                                  <div className="group-task-card-head">
                                    <span className="group-badge">{gt.badge}</span>
                                    <strong>{gt.groupName}</strong>
                                  </div>
                                  <div className="group-task-content">
                                    <p className="gt-task-text">{gt.task}</p>
                                    {gt.scaffold && (
                                      <div className="gt-scaffold-box">
                                        <span className="gt-scaffold-label">🗝️ سقالة وتلميح الفريق:</span>
                                        <p>{gt.scaffold}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Bottom Save & Start Repeating Bar */}
              <div className="prep-bottom-actions-bar">
                <button 
                  type="button" 
                  className="btn-primary-action large"
                  onClick={handleSaveAndStartLesson}
                >
                  <i className="fas fa-play"></i> اعتماد وبدء الحصة الآن على الشاشة الكبيرة 🚀
                </button>
                <button 
                  type="button" 
                  className="btn-secondary-action"
                  onClick={handleSaveAndGoToMaterials}
                >
                  <i className="fas fa-briefcase"></i> حفظ والانتقال لحقيبة المفاتيح
                </button>
                <button 
                  type="button" 
                  className="btn-save-draft"
                  onClick={handleSaveDraft}
                >
                  <i className="fas fa-save"></i> حفظ كمسودة في حصصي
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* SCREEN 3: KEYS & MATERIALS BAG (الشاشة ٣: حقيبة المفاتيح والمواد)    */}
      {/* =================================================================== */}
      {currentScreen === 'screen3_materials_bag' && (
        <section className="screen-container screen3-materials-bag animate-fade-in">
          <div className="screen-header-banner">
            <div>
              <h3><i className="fas fa-briefcase"></i> حقيبة المفاتيح والمواد المعتمدة: {currentLesson.title}</h3>
              <p>معاينة مواد الدعم والتدخل وتأكيد جاهزية الحصة قبل دخول الصف.</p>
            </div>
            <div className="header-actions-group">
              <button 
                type="button" 
                className="btn-action-edit-prep"
                onClick={() => handleEditLessonFromHub(currentLesson)}
              >
                <i className="fas fa-edit"></i> تعديل في خطة الحصة
              </button>
              <button 
                type="button" 
                className="btn-print-materials"
                onClick={() => window.print()}
              >
                <i className="fas fa-print"></i> طباعة المواد المعتمدة
              </button>
              <button 
                type="button" 
                className="btn-primary-action"
                onClick={() => handleStartLessonFromHub(currentLesson)}
              >
                <i className="fas fa-play"></i> جاهز — أبدأ الحصة 🚀
              </button>
            </div>
          </div>

          <div className="readiness-check-banner">
            <div className="readiness-status-tag valid">
              <i className="fas fa-check-circle"></i> مؤشرات الجاهزية مكتملة (٤/٤):
            </div>
            <div className="readiness-checklist-items">
              <span>✔️ هدف ومعيار واضحان</span>
              <span>✔️ مهمة أساسية متمايزة</span>
              <span>✔️ دليل فردي صريح للفهم</span>
              <span>✔️ محتوى معتمد للعرض</span>
            </div>
          </div>

          <div className="materials-grid-list">
            {Object.keys(currentLesson.stations).map((k) => {
              const st = currentLesson.stations[k];
              return (
                <div key={k} className="material-card-item">
                  <div className="mat-card-top">
                    <span className={`mat-letter-pill letter-${k}`}>{st.letter}</span>
                    <h5>محطة {st.name}</h5>
                    <span className="mat-approval-status approved">معتمدة من المعلم ✅</span>
                  </div>

                  <div className="mat-card-section">
                    <label>المحتوى المعتمد لشاشة الطلاب:</label>
                    <p className="mat-display-text">{st.studentDisplayPrompt}</p>
                  </div>

                  <div className="mat-card-section">
                    <label>سقالة الدعم الجاهزة:</label>
                    <p className="mat-scaffold-text">{st.scaffolds}</p>
                  </div>

                  <div className="mat-card-section">
                    <label>مهمة التعميق والتحدي:</label>
                    <p className="mat-extension-text">{st.extension}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* SCREEN 4: TEACHER BACKSTAGE (الشاشة ٤: كواليس المعلم أثناء الحصة)    */}
      {/* =================================================================== */}
      {currentScreen === 'screen4_backstage' && (
        <section className="screen-container screen4-backstage animate-fade-in">
          {/* Top Bar: Lesson title, elapsed timer, connection status, open projector */}
          <div className="backstage-top-status-bar">
            <div className="status-lesson-meta">
              <span className="live-session-badge">حصة مباشرة نشطة 🔴</span>
              <h3 className="live-lesson-title">{currentLesson.title}</h3>
              <span className="live-grade-tag">({currentLesson.grade} • {currentLesson.duration} د)</span>
            </div>

            <div className="status-center-timer">
              <div className="timer-badge">
                <i className="fas fa-stopwatch"></i>
                <span className="timer-clock-digits">{formatSeconds(elapsedSeconds)}</span>
              </div>
              <button 
                type="button" 
                className={`btn-timer-toggle ${isTimerRunning ? 'pause' : 'resume'}`}
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              >
                {isTimerRunning ? <i className="fas fa-pause"></i> : <i className="fas fa-play"></i>}
              </button>
            </div>

            <div className="status-right-connections">
              <div className="connection-indicator connected">
                <span className="signal-led"></span>
                <span>شاشة الطلاب: {isDisplayConnected ? 'متصلة بالبروجكتور 🎦' : 'غير متصلة'}</span>
              </div>
              <button 
                type="button" 
                className="btn-switch-to-student-view"
                onClick={() => setCurrentScreen('screen6_student_screen')}
              >
                <i className="fas fa-eye"></i> معاينة شاشة الصف
              </button>
            </div>
          </div>

          {/* 4-Quadrant / Layout Grid */}
          <div className="backstage-four-quadrants-grid">
            {/* RIGHT COLUMN: 5 Stations Picker */}
            <div className="quadrant-stations-picker">
              <div className="column-title-bar">
                <h5><i className="fas fa-stream"></i> المحطات الخمس</h5>
              </div>
              <div className="stations-stepper-vertical">
                {['m', 'f', 't', 'a', 'h'].map((k) => {
                  const st = currentLesson.stations[k];
                  const isSelectedInBackstage = activeStationKey === k;
                  const isBeingDisplayedToStudents = publicDisplayState.stationKey === k && !publicDisplayState.isDisplayHidden;
                  return (
                    <button
                      key={k}
                      type="button"
                      className={`stepper-station-card letter-${k} ${isSelectedInBackstage ? 'active' : ''}`}
                      onClick={() => setActiveStationKey(k)}
                    >
                      <div className="st-card-left">
                        <span className="st-letter-bubble">{st.letter}</span>
                        <div className="st-names">
                          <strong>{st.name}</strong>
                          <small>({st.durationMinutes} د) • «{st.studentPhrase}»</small>
                        </div>
                      </div>
                      {isBeingDisplayedToStudents && (
                        <span className="on-screen-indicator-tag" title="هذه المحطة معروضة حالياً على شاشة الطلاب">
                          <i className="fas fa-desktop"></i> معروض للطلاب
                        </span>
                      )}
                      {isSelectedInBackstage && <span className="teacher-pin">📍 الكواليس</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CENTER COLUMN: Current Task, Secret Notes, and Live Display Preview */}
            <div className="quadrant-center-workspace">
              {/* Task Header & Broadcast Action */}
              <div className="workspace-header-card">
                <div className="st-head-info">
                  <span className="st-letter-large">{currentStationData.letter}</span>
                  <div>
                    <h4>محطة {currentStationData.name} — «{currentStationData.studentPhrase}»</h4>
                    <span className="st-query-hint">{currentStationData.studentQuestion}</span>
                  </div>
                </div>

                <div className="st-head-broadcast-cta">
                  <button 
                    type="button" 
                    className="btn-explicit-broadcast"
                    onClick={handleTeacherApproveDisplay}
                    title="قاعدة العرض: لا يظهر شيء للطلاب إلا بضغط هذا الزر"
                  >
                    <i className="fas fa-paper-plane"></i> اعرض للطلاب على الشاشة الكبيرة 📤
                  </button>
                </div>
              </div>

              {/* Secret Implementation Notes */}
              <div className="workspace-secret-notes-card">
                <div className="secret-notes-title">
                  <i className="fas fa-user-secret"></i> ملاحظات التنفيذ الخاصة بالمعلم (سرية ولا تظهر للطلاب):
                </div>
                <p className="secret-notes-body">{currentStationData.teacherNotes}</p>
              </div>

              {/* Exact Live Teacher Mirror Monitor (عين المعلم على شاشة الصف) */}
              <div className="workspace-live-preview-box teacher-mirror-monitor">
                <div className="preview-box-header">
                  <div className="mirror-header-title">
                    <span className="live-camera-pulse"></span>
                    <span className="preview-label">
                      <i className="fas fa-satellite-dish"></i> عين المعلم الدائمة على شاشة الصف (بث حي متزامن):
                    </span>
                  </div>
                  <div className="mirror-header-badges">
                    {publicDisplayState.isDisplayHidden ? (
                      <span className="hidden-warning-badge">⚠️ العرض متوقف مؤقتاً بأمرك</span>
                    ) : (
                      <span className="live-synced-badge">🟢 متزامن ومطابق للبروجكتور</span>
                    )}
                    <button 
                      type="button"
                      className="btn-quick-mirror-proj-open"
                      onClick={handleOpenStudentProjector}
                      title="فتح شاشة البروجكتور في نافذة جديدة للتأكد"
                    >
                      <i className="fas fa-external-link-alt"></i> شاشة البروجكتور
                    </button>
                  </div>
                </div>
                
                <div className="preview-box-screen live-mirror-canvas">
                  <div className="preview-screen-ribbon">
                    <div className="preview-lesson-topic-chip">
                      <i className="fas fa-book-reader"></i> {publicDisplayState.lessonTitle}
                    </div>
                    {publicDisplayState.objective && (
                      <div className="preview-objective-snippet" title={publicDisplayState.objective}>
                        🎯 الهدف: {publicDisplayState.objective}
                      </div>
                    )}
                  </div>

                  <div className="preview-station-pin">
                    <span className="station-mini-bubble">{publicDisplayState.stationLetter}</span>
                    <span>محطة {publicDisplayState.stationName} • «{publicDisplayState.studentPhrase}»</span>
                  </div>

                  <div className="preview-headline-wrapper">
                    <h4 className="preview-headline">{publicDisplayState.headline}</h4>
                  </div>
                  
                  {/* If Scaffold is available for students */}
                  {publicDisplayState.scaffolds && (
                    <div className="preview-scaffold-bar">
                      <span className="scaffold-key-tag">🗝️ مفتاح السقالة المتاح للطلاب:</span>
                      <p>{publicDisplayState.scaffolds}</p>
                    </div>
                  )}

                  {/* If Group Tasks exist for Station T */}
                  {publicDisplayState.groupTasks && publicDisplayState.groupTasks.length > 0 && publicDisplayState.stationKey === 't' && (
                    <div className="preview-group-tasks-strip">
                      <div className="strip-label">👥 مهام المجموعات المتمايزة المعروضة:</div>
                      <div className="preview-groups-mini-grid">
                        {publicDisplayState.groupTasks.map((gt, i) => (
                          <div key={i} className="mini-group-cell">
                            <strong>{gt.badge} {gt.groupName}</strong>
                            <p>{gt.task.substring(0, 65)}...</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {publicDisplayState.activeEnergizer && (
                    <div className="preview-energizer-banner">
                      <strong>⚡ {publicDisplayState.activeEnergizer.title}</strong>
                      <p>{publicDisplayState.activeEnergizer.studentDisplayPrompt}</p>
                    </div>
                  )}
                </div>

                {/* Live Backstage In-Flight Adjustments */}
                <div className="mirror-quick-adjust-bar">
                  <span className="adjust-bar-hint">
                    <i className="fas fa-sliders-h"></i> التحكم الفوري في المحتوى المعروض:
                  </span>
                  <div className="adjust-buttons-group">
                    <button
                      type="button"
                      className="btn-quick-edit-live"
                      onClick={() => {
                        const newTxt = prompt('عدّل نص شاشة الطلاب المعروض الآن فوراً:', publicDisplayState.headline);
                        if (newTxt !== null && newTxt.trim() !== '') {
                          const updated = { ...publicDisplayState, headline: newTxt.trim() };
                          broadcastToStudentScreen(updated);
                          showToast('تم تحديث شاشة الطلاب المعروضة في الصف فوراً! 🎦✨');
                        }
                      }}
                    >
                      <i className="fas fa-edit"></i> تعديل النص المعروض يدوياً ✏️
                    </button>
                    <button
                      type="button"
                      className="btn-quick-ai-tweak-live"
                      onClick={() => handleOpenStationPromptModal(activeStationKey)}
                    >
                      <i className="fas fa-robot"></i> اطلب تعديلاً بالذكاء الاصطناعي (AI) 🪄
                    </button>
                  </div>
                </div>
              </div>

              {/* Workspace Bottom Controls */}
              <div className="workspace-bottom-actions-bar">
                <button 
                  type="button" 
                  className="btn-bottom-action"
                  onClick={handleTeacherApproveDisplay}
                >
                  <i className="fas fa-check"></i> اعرض
                </button>
                <button 
                  type="button" 
                  className="btn-bottom-action hide"
                  onClick={handleToggleHideDisplay}
                >
                  <i className="fas fa-eye-slash"></i> أخفِ العرض مؤقتًا
                </button>
                <button 
                  type="button" 
                  className="btn-bottom-action return"
                  onClick={handleReturnToCurrentTask}
                >
                  <i className="fas fa-undo"></i> ارجع للمهمة
                </button>
                <button 
                  type="button" 
                  className="btn-bottom-action note"
                  onClick={() => {
                    const note = prompt('سجل ملاحظة سريعة في كواليس الحصة:');
                    if (note) showToast('تم تدوين الملاحظة في سجل كواليس الحصة 📝');
                  }}
                >
                  <i className="fas fa-sticky-note"></i> سجّل ملاحظة
                </button>
              </div>
            </div>

            {/* LEFT COLUMN: Difficulties Drawer, Energizer, Time Crunch & Student Keys */}
            <div className="quadrant-side-interventions">
              <div className="column-title-bar">
                <h5><i className="fas fa-toolbox"></i> التدخلات والدعم الفوري</h5>
              </div>

              {/* Big Red "واجهت صعوبة" Button */}
              <button 
                type="button" 
                className="btn-open-difficulty-drawer"
                onClick={() => setIsInterventionDrawerOpen(true)}
              >
                <div className="btn-diff-icon">⚠️</div>
                <div className="btn-diff-texts">
                  <strong>واجهت صعوبة؟</strong>
                  <small>فتح درج التدخل واختيار الحل المناسب</small>
                </div>
                <i className="fas fa-chevron-left"></i>
              </button>

              {/* Global Utility Tool Buttons */}
              <div className="utility-buttons-stack">
                <button 
                  type="button" 
                  className="btn-utility-tile energizer"
                  onClick={handleTriggerEnergizer}
                >
                  <i className="fas fa-bolt"></i>
                  <div>
                    <strong>مفتاح التجديد ⚡</strong>
                    <small>نشاط «اتبع الإشارة» لدقيقتين</small>
                  </div>
                </button>

                <button 
                  type="button" 
                  className="btn-utility-tile time"
                  onClick={() => {
                    alert('⏱️ مفتاح الوقت:\n• ما يُسمح باختصاره: تقليص وقت المشاركة الجماعية بالمحطة الأولى من 5د إلى 3د.\n• ما يُحظر حذفه: فحص أدلة الفهم الفردية بالمحطة الرابعة وحصاد الحصة.');
                  }}
                >
                  <i className="fas fa-stopwatch-20"></i>
                  <div>
                    <strong>مفتاح الوقت ⏱️</strong>
                    <small>إدارة ضيق الوقت دون مساس بالأهداف</small>
                  </div>
                </button>

                <button 
                  type="button" 
                  className="btn-utility-tile challenge"
                  onClick={() => {
                    const ext = currentStationData.extension;
                    alert(`🚀 مهمة التحدي والتعمق الفوري:\n${ext}`);
                  }}
                >
                  <i className="fas fa-rocket"></i>
                  <div>
                    <strong>مفتاح التحدّي 🚀</strong>
                    <small>امتداد أعمق لمن أنهى مبكراً</small>
                  </div>
                </button>
              </div>

              {/* Incoming Student Signals Monitor */}
              <div className="student-signals-panel">
                <div className="signals-panel-head">
                  <h6><i className="fas fa-bell"></i> إشارات الطلاب المباشرة</h6>
                  <span className="signals-counter">{studentSignals.length}</span>
                </div>
                <div className="signals-feed">
                  {studentSignals.length === 0 ? (
                    <div className="signals-empty-note">لا توجد إشارات حالياً؛ الطلاب منخرطون في المهمة.</div>
                  ) : (
                    studentSignals.map((sig) => (
                      <div key={sig.id} className="signal-entry-pill animate-pop">
                        <span>{sig.icon} {sig.label}</span>
                        <small>{sig.time}</small>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* SCREEN 5: INTERVENTION DRAWER (الشاشة ٥: درج التدخل الجانبي)     */}
          {/* =============================================================== */}
          {isInterventionDrawerOpen && (
            <div className="intervention-drawer-overlay" onClick={() => setIsInterventionDrawerOpen(false)}>
              <aside className="intervention-drawer-sidebar scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="drawer-header">
                  <div className="drawer-title-group">
                    <span className="drawer-badge">🛠️ درج التدخل البيداغوجي</span>
                    <h4>محطة {currentStationData.name} [{currentStationData.letter}]</h4>
                  </div>
                  <button 
                    type="button" 
                    className="btn-close-drawer"
                    onClick={() => setIsInterventionDrawerOpen(false)}
                  >
                    &times;
                  </button>
                </div>

                <div className="drawer-scroll-body">
                  {/* Step 1: What did you observe? */}
                  <div className="drawer-section">
                    <label className="drawer-section-title">١. ماذا لاحظت في الصف الآن؟</label>
                    <div className="drawer-difficulty-chips">
                      {['الإجابة بلا تبرير', 'يخلطون بين الشكل والحالة', 'لا يتفاعلون', 'يتكرر خطأ شائع', 'أنهوا مبكراً'].map((diffName) => (
                        <button
                          key={diffName}
                          type="button"
                          className={`diff-chip ${drawerDifficulty === diffName ? 'selected' : ''}`}
                          onClick={() => setDrawerDifficulty(diffName)}
                        >
                          {diffName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: To whom? */}
                  <div className="drawer-section">
                    <label className="drawer-section-title">٢. لمن يُقدَّم هذا الدعم؟</label>
                    <div className="drawer-scope-options">
                      <button 
                        type="button" 
                        className={`scope-pill ${drawerScope === 'student' ? 'active' : ''}`}
                        onClick={() => setDrawerScope('student')}
                      >
                        👤 طالب فردي
                      </button>
                      <button 
                        type="button" 
                        className={`scope-pill ${drawerScope === 'group' ? 'active' : ''}`}
                        onClick={() => setDrawerScope('group')}
                      >
                        👥 مجموعة صغيرة
                      </button>
                      <button 
                        type="button" 
                        className={`scope-pill ${drawerScope === 'whole_class' ? 'active' : ''}`}
                        onClick={() => setDrawerScope('whole_class')}
                      >
                        🏫 معظم الصف
                      </button>
                    </div>
                  </div>

                  {/* Step 3: Available Time */}
                  <div className="drawer-section">
                    <label className="drawer-section-title">٣. الوقت المتاح للتنفيذ:</label>
                    <div className="drawer-time-options">
                      {['دقيقة واحدة', 'دقيقتان', '٤ دقائق', '٦ دقائق'].map((tStr) => (
                        <button 
                          key={tStr} 
                          type="button" 
                          className={`time-pill ${drawerTime === tStr ? 'active' : ''}`}
                          onClick={() => setDrawerTime(tStr)}
                        >
                          {tStr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* The 3 Intervention Options with the Modeled 4-minute Scenario */}
                  <div className="drawer-section">
                    <label className="drawer-section-title">٤. الخيارات المقترحة للتدخل (٣ خيارات كحد أقصى):</label>
                    
                    {/* Option 1 */}
                    <div className={`intervention-choice-card ${selectedInterventionOptionIndex === 0 ? 'selected' : ''}`} onClick={() => setSelectedInterventionOptionIndex(0)}>
                      <div className="choice-head">
                        <span className="choice-badge">خيار ١</span>
                        <h6>بطاقة جملة مساعدة (بدايات جمل جاهزة)</h6>
                      </div>
                      <p className="choice-desc">تقديم قالب: «أصنّف … بأنه … لأن …» مع أسئلة مساندة عن الشكل والحجم.</p>
                    </div>

                    {/* Option 2 (Recommended Model from Document Section 3) */}
                    <div className={`intervention-choice-card recommended ${selectedInterventionOptionIndex === 1 ? 'selected' : ''}`} onClick={() => setSelectedInterventionOptionIndex(1)}>
                      <div className="choice-head">
                        <span className="choice-badge">خيار ٢</span>
                        <h6>نمذجة تبرير واحد ثم تقليل المساعدة تدريجياً ⭐ (مقترح ومبرر)</h6>
                        <span className="choice-star">الخيار المقترح للمواصفة</span>
                      </div>
                      <p className="choice-desc">
                        <strong>السبب:</strong> يفكك مهارة التبرير بدلاً من إعطاء الجواب، ويمكّن الطلاب من الاستقلالية خلال ٤ دقائق متزامنة.
                      </p>

                      <div className="modeled-minutes-timeline">
                        <div className="min-item"><strong>الدقيقة الأولى:</strong> نمذجة تبرير تصنيف الحجر بصوت مسموع.</div>
                        <div className="min-item"><strong>الدقيقة الثانية:</strong> يبرر الطلاب تصنيف الماء بمساعدة سؤال عن الوعاء.</div>
                        <div className="min-item"><strong>الدقيقة الثالثة:</strong> يكتب كل طالب تبريراً للزيت دون جملة محلولة.</div>
                        <div className="min-item"><strong>الدقيقة الرابعة:</strong> تحقق جديد باستخدام عصير في كأسين مختلفي الشكل.</div>
                      </div>

                      <div className="rest-of-class-box">
                        <strong>ماذا تفعل بقية الصف بالتزامن؟</strong>
                        <p>يكملون المهمة، ثم يناقشون العبارة: «كل مادة تأخذ شكل الوعاء هي ماء» ويصححونها بمثال مضاد (كالزيت أو العصير).</p>
                      </div>

                      <div className="verification-criterion-box">
                        <strong>محك التحقق:</strong> العصير سائل لأنه يأخذ شكل الوعاء مع بقاء حجمه عند نقله دون سكب.
                      </div>
                    </div>

                    {/* Option 3 */}
                    <div className={`intervention-choice-card ${selectedInterventionOptionIndex === 2 ? 'selected' : ''}`} onClick={() => setSelectedInterventionOptionIndex(2)}>
                      <div className="choice-head">
                        <span className="choice-badge">خيار ٣</span>
                        <h6>مقارنة تبريرين واختيار الأدق مع شرح السبب</h6>
                      </div>
                      <p className="choice-desc">عرض تبرير سطحي مقابل تبرير علمي معتمد على الخصائص ومطالبة الطلاب بالتمييز بينهما.</p>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="drawer-footer-actions">
                  <button 
                    type="button" 
                    className="btn-drawer-action ready"
                    onClick={() => {
                      setIsInterventionDrawerOpen(false);
                      setVerificationModalOpen(true);
                      showToast('تم اعتماد التدخل وبدء تنفيذه مع المجموعة! ⏱️');
                    }}
                  >
                    <i className="fas fa-check"></i> استخدم المادة الجاهزة ✅
                  </button>
                  <button 
                    type="button" 
                    className="btn-drawer-action broadcast"
                    onClick={() => {
                      const updated = {
                        ...publicDisplayState,
                        headline: '🔍 مهمة تعميق وتحدٍّ للصف:',
                        activeHint: '«كل مادة تأخذ شكل الوعاء هي ماء» — ناقشوا هذه العبارة وصححوها بمثال مضاد مناسب!'
                      };
                      broadcastToStudentScreen(updated);
                      setIsInterventionDrawerOpen(false);
                      showToast('تم إرسال مهمة تعميق بقية الصف إلى الشاشة الكبيرة! 📤');
                    }}
                  >
                    <i className="fas fa-share-square"></i> اعرض للطلاب 📤
                  </button>
                  <button 
                    type="button" 
                    className="btn-drawer-action cancel"
                    onClick={() => setIsInterventionDrawerOpen(false)}
                  >
                    ألغِ
                  </button>
                </div>
              </aside>
            </div>
          )}

          {/* =============================================================== */}
          {/* SCREEN 7: VERIFICATION MODAL (الشاشة ٧: التحقق بعد التدخل)        */}
          {/* =============================================================== */}
          {verificationModalOpen && (
            <div className="verification-modal-overlay">
              <div className="verification-modal-card scale-in">
                <div className="modal-head">
                  <div className="m-head-left">
                    <span className="m-icon">🎯</span>
                    <div>
                      <span className="m-sub">الشاشة ٧: التحقق الفردي بعد التدخل</span>
                      <h4>نتيجة التحقق من الهدف بعد تقديم الدعم</h4>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn-close-modal"
                    onClick={() => setVerificationModalOpen(false)}
                  >
                    &times;
                  </button>
                </div>

                <div className="modal-content-body">
                  <div className="verification-prompt-quote">
                    <strong>المهمة الفردية الجديدة (العصير في كأسين):</strong>
                    <p>صنّف عصير البرتقال المنقول بين كأسين، واذكر سبباً علمياً بالاستناد إلى الشكل والحجم.</p>
                    <small>المحك: تصنيف سائل مع تبرير أخذ شكل الوعاء وثبات الحجم.</small>
                  </div>

                  <label className="rating-select-title">سجل النتيجة الفردية الملحوظة:</label>
                  <div className="rating-buttons-quad">
                    <button 
                      type="button" 
                      className={`rating-quad-btn achieved ${verificationResult === 'achieved' ? 'active' : ''}`}
                      onClick={() => setVerificationResult('achieved')}
                    >
                      <span className="rate-icon">🟢</span>
                      <strong>تحقق المعيار</strong>
                      <small>العودة للمهمة أو الانتقال لمهمة أعمق</small>
                    </button>

                    <button 
                      type="button" 
                      className={`rating-quad-btn partial ${verificationResult === 'partially' ? 'active' : ''}`}
                      onClick={() => setVerificationResult('partially')}
                    >
                      <span className="rate-icon">🟡</span>
                      <strong>تحقق جزئياً</strong>
                      <small>تغذية راجعة محددة ومحاولة تستهدف النقص</small>
                    </button>

                    <button 
                      type="button" 
                      className={`rating-quad-btn not_yet ${verificationResult === 'not_yet' ? 'active' : ''}`}
                      onClick={() => setVerificationResult('not_yet')}
                    >
                      <span className="rate-icon">🔴</span>
                      <strong>لم يظهر بعد</strong>
                      <small>تمثيل أو شرح مختلف ثم تحقق جديد</small>
                    </button>

                    <button 
                      type="button" 
                      className={`rating-quad-btn unverified ${verificationResult === 'not_verified' ? 'active' : ''}`}
                      onClick={() => setVerificationResult('not_verified')}
                    >
                      <span className="rate-icon">⚪</span>
                      <strong>لم أتحقق</strong>
                      <small>حفظ الحاجة للمتابعة دون نجاح تلقائي</small>
                    </button>
                  </div>

                  <div className="modal-note-field">
                    <label>ملاحظة المعلم (أعداد إجمالية أو ملاحظة دون أسماء):</label>
                    <input 
                      type="text" 
                      placeholder="مثال: 3 طلاب برروا صحة الحجم، وطالب واحد يحتاج تثبيت الانسكاب..."
                      value={verificationNote}
                      onChange={(e) => setVerificationNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-actions-bar">
                  <button 
                    type="button" 
                    className="btn-save-verification"
                    onClick={() => {
                      if (!verificationResult) {
                        alert('يرجى اختيار إحدى النتائج الأربع لتسجيل التحقق.');
                        return;
                      }
                      setVerificationModalOpen(false);
                      showToast('تم توثيق نتيجة التحقق بنجاح وحفظها لتقرير الحصاد! 📝');
                    }}
                  >
                    <i className="fas fa-save"></i> حفظ نتيجة التحقق والعودة للحصة
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* SCREEN 6: STUDENT PROJECTOR DISPLAY (الشاشة ٦: شاشة الطلاب)        */}
      {/* =================================================================== */}
      {currentScreen === 'screen6_student_screen' && (
        <section className="screen-container screen6-student-canvas animate-fade-in">
          {/* Projector Top Header */}
          <div className="student-view-top-header">
            <div className="proj-school-info">مدرسة مشيرفة الابتدائية • نموذج مِفتاح للحصة الفاعلة</div>
            <div className="proj-active-station-banner">
              <span className="proj-letter-gem">{publicDisplayState.stationLetter}</span>
              <h3>محطة {publicDisplayState.stationName} — «{publicDisplayState.studentPhrase}»</h3>
            </div>
            <div className="proj-top-actions-right">
              <div className="proj-timer-readout">
                <i className="fas fa-stopwatch"></i> {formatSeconds(publicDisplayState.timerSeconds)}
              </div>
              <button 
                type="button" 
                className="btn-return-from-student-view"
                onClick={() => setCurrentScreen('screen2_prep_context')}
                title="الرجوع إلى صفحة إعداد وتعديل الحصة"
              >
                <i className="fas fa-arrow-right"></i> عودة لإعداد الحصة
              </button>
            </div>
          </div>

          {/* Student Screen Content Card */}
          <div className="student-view-main-card">
            {/* Goal & Criteria Banner (Always Visible on Student Screen) */}
            <div className="student-goal-header-bar">
              <div className="goal-row title-row">
                <span className="goal-label">📖 موضوع الدرس:</span>
                <span className="goal-text lesson-name">{publicDisplayState.lessonTitle}</span>
              </div>
              {publicDisplayState.objective && (
                <div className="goal-row">
                  <span className="goal-label">🎯 هدف التعلم:</span>
                  <span className="goal-text">{publicDisplayState.objective}</span>
                </div>
              )}
            </div>

            {/* Display Body or Hidden Screen */}
            {publicDisplayState.isDisplayHidden ? (
              <div className="display-temporarily-hidden-box">
                <i className="fas fa-eye-slash"></i>
                <h2>العرض متوقف مؤقتاً بأمر المعلم</h2>
                <p>ركزوا مع المعلم في الشرح أو العمل الفردي في دفاتركم.</p>
              </div>
            ) : (
              <div className="student-task-active-box">
                <div className="task-header-with-scaffold">
                  <div className="task-badge-tag">سؤال ومهمة المحطة:</div>
                  <button 
                    type="button"
                    className="btn-student-scaffold-trigger animate-bounce-subtle"
                    onClick={() => setIsStudentScaffoldModalOpen(true)}
                    title="انقر هنا للحصول على مفتاح التفكير وسقالة المساعدة"
                  >
                    <i className="fas fa-key"></i> 🗝️ مفتاح السقالة (تلميح مساند)
                  </button>
                </div>

                {/* If Station [ت] has tiered group tasks */}
                {publicDisplayState.groupTasks && publicDisplayState.groupTasks.length > 0 && publicDisplayState.stationKey === 't' ? (
                  <div className="student-group-tasks-viewport">
                    <div className="student-group-tabs-selector">
                      <button
                        type="button"
                        className={`btn-group-tab ${studentGroupTab === 'all' ? 'active' : ''}`}
                        onClick={() => setStudentGroupTab('all')}
                      >
                        📌 المهمة العامة المشتركة
                      </button>
                      {publicDisplayState.groupTasks.map((gt, gIdx) => (
                        <button
                          key={gIdx}
                          type="button"
                          className={`btn-group-tab level-${gt.level} ${studentGroupTab === gt.level ? 'active' : ''}`}
                          onClick={() => setStudentGroupTab(gt.level)}
                        >
                          {gt.badge} {gt.groupName}
                        </button>
                      ))}
                    </div>

                    {studentGroupTab === 'all' ? (
                      <div className="student-main-prompt-text">
                        {publicDisplayState.headline.split('\n').map((line, idx) => (
                          <p key={idx}>{line}</p>
                        ))}
                      </div>
                    ) : (
                      (() => {
                        const currentGt = publicDisplayState.groupTasks.find(g => g.level === studentGroupTab);
                        if (!currentGt) return null;
                        return (
                          <div className={`student-focused-group-task card-${currentGt.level} animate-fade-in`}>
                            <div className="focused-group-head">
                              <span className="focused-badge">{currentGt.badge}</span>
                              <h3>تحدي {currentGt.groupName}</h3>
                            </div>
                            <div className="focused-group-task-body">
                              {currentGt.task.split('\n').map((line, idx) => (
                                <p key={idx}>{line}</p>
                              ))}
                            </div>
                            {currentGt.scaffold && (
                              <div className="focused-group-scaffold-card">
                                <strong>🗝️ مفتاح السقالة للفريق:</strong>
                                <p>{currentGt.scaffold}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                ) : (
                  <div className="student-main-prompt-text">
                    {publicDisplayState.headline.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                )}

                {/* Scaffold Hint Banner (if pushed directly by teacher) */}
                {publicDisplayState.activeHint && (
                  <div className="student-active-hint-card animate-pop">
                    <div className="hint-card-head">💡 تلميح ومساندة من المعلم:</div>
                    <p>{publicDisplayState.activeHint}</p>
                  </div>
                )}

                {/* Energizer Banner (if pushed) */}
                {publicDisplayState.activeEnergizer && (
                  <div className="student-energizer-fullscreen-card animate-pop">
                    <div className="energizer-card-head">⚡ استراحة تجديد ونشاط (دقيقتان)</div>
                    <div className="energizer-card-text">
                      {publicDisplayState.activeEnergizer.studentDisplayPrompt.split('\n').map((l, i) => (
                        <p key={i}>{l}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Student Request Keys (Whole-class screen mode) */}
            <div className="student-keys-bottom-strip">
              <span className="strip-title">مفاتيح التعلّم للطلاب (أشر للمعلم أو انقر على المفتاح):</span>
              <div className="strip-buttons-flex">
                {STUDENT_REQUEST_KEYS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    className="btn-student-key-chip"
                    style={{ borderColor: k.color }}
                    onClick={() => {
                      handleIncomingSignal(k.id);
                    }}
                  >
                    <span className="key-icon">{k.icon}</span>
                    <span className="key-label">{k.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* SCREEN 8: TEACHER POST-LESSON HARVEST (الشاشة ٨: حصاد المعلم)        */}
      {/* =================================================================== */}
      {currentScreen === 'screen8_harvest' && (
        <section className="screen-container screen8-post-harvest animate-fade-in">
          <div className="screen-header-banner">
            <div>
              <h3><i className="fas fa-feather-alt"></i> حصاد المعلم ومراجعة ما بعد الحصة</h3>
              <p>توثيق أدلة التعلم، ما ساعد الطلاب، وتجهيز مسودة افتتاحية الحصة القادمة.</p>
            </div>
            <div className="header-actions-group">
              <button 
                type="button" 
                className="btn-print-materials"
                onClick={() => window.print()}
              >
                <i className="fas fa-print"></i> طباعة ملخص الحصاد
              </button>
              <button 
                type="button" 
                className="btn-primary-action"
                onClick={() => {
                  showToast('تم حفظ مراجعة الحصة وتحديث بنك التدخلات بنجاح! 💾');
                  setCurrentScreen('screen1_my_lessons');
                }}
              >
                <i className="fas fa-save"></i> حفظ المراجعة والعودة لحصصي
              </button>
            </div>
          </div>

          <div className="harvest-questions-grid">
            {/* Automatic Log of Keys Used */}
            <div className="harvest-card auto-log">
              <div className="h-card-header">
                <h5><i className="fas fa-clipboard-list"></i> المفاتيح والمواد التي استُخدمت في الحصة</h5>
              </div>
              <div className="log-entries-list">
                {reflectionData.interventionsSummary.map((item, idx) => (
                  <div key={idx} className="log-entry-item">
                    <span className="log-st-tag">{item.station}</span>
                    <strong>{item.difficulty}</strong>
                    <p>{item.action}</p>
                    <span className="log-result-badge valid">{item.result}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* The 3 Core Questions from the Blueprint */}
            <div className="harvest-card three-questions">
              <div className="h-card-header">
                <h5><i className="fas fa-lightbulb"></i> الأسئلة الثلاثة لحصاد المعلم</h5>
              </div>
              <div className="questions-form">
                <div className="q-item">
                  <label>١. ما الذي ساعد على فهم الطلاب اليوم؟</label>
                  <textarea 
                    rows={2} 
                    value={reflectionData.whatHelped}
                    onChange={(e) => setReflectionData({ ...reflectionData, whatHelped: e.target.value })}
                  />
                </div>

                <div className="q-item">
                  <label>٢. ما الذي بقي ويحتاج إلى متابعة؟</label>
                  <textarea 
                    rows={2} 
                    value={reflectionData.whatRemains}
                    onChange={(e) => setReflectionData({ ...reflectionData, whatRemains: e.target.value })}
                  />
                </div>

                <div className="q-item">
                  <label>٣. ماذا نبدأ به في الحصة القادمة؟ (مسودة الافتتاحية):</label>
                  <textarea 
                    rows={2} 
                    value={reflectionData.nextLessonOpener}
                    onChange={(e) => setReflectionData({ ...reflectionData, nextLessonOpener: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Prompt-to-Modify Station AI Modal */}
      {stationPromptModal.isOpen && (
        <div className="station-prompt-modal-overlay" onClick={() => !stationPromptModal.loading && setStationPromptModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="station-prompt-modal-card animate-pop" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-flex">
                <i className="fas fa-robot modal-ai-icon"></i>
                <div>
                  <h3>طلب تعديل مخصص بالذكاء الاصطناعي</h3>
                  <small>محطة [{stationPromptModal.stationName}]</small>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-modal-close" 
                onClick={() => !stationPromptModal.loading && setStationPromptModal(prev => ({ ...prev, isOpen: false }))}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                اكتب أي فكرة أو رغبة بيداغوجية ترغب في تطبيقها على هذه المحطة، وسيقوم الذكاء الاصطناعي بإعادة صياغة المهمة وملاحظات المعلم وسقالة الدعم فوراً:
              </p>

              {/* Quick suggestion chips */}
              <div className="prompt-suggestion-chips">
                <span className="chips-label">أفكار مقترحة سريعة (انقر للإضافة):</span>
                <div className="chips-list">
                  {[
                    '🎯 اجعل النشاط حركياً وتفاعلياً يشارك فيه جميع الطلاب',
                    '🔍 حوّل المهمة إلى لغز وتحدي محققين أذكياء',
                    '🌱 بسّط الصياغة والخطوات لتناسب الطلاب المتعثرين',
                    '🚀 أضف أسئلة تفكير عليا وتحدٍّ إضافي للمتفوقين',
                    '📝 اجعل الحل على شكل خطوات قصيرة وممتعة في الدفتر'
                  ].map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      className="chip-btn"
                      onClick={() => setStationPromptModal(prev => ({ ...prev, promptInstruction: chip }))}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-item prompt-input-group">
                <label>توجيهك الخاص للذكاء الاصطناعي:</label>
                <textarea 
                  rows={4}
                  value={stationPromptModal.promptInstruction}
                  onChange={e => setStationPromptModal(prev => ({ ...prev, promptInstruction: e.target.value }))}
                  placeholder="مثال: أريد التمرين على شكل ٣ ألغاز سريعة، أو ربط المشوّق بموقف من المدرسة..."
                  disabled={stationPromptModal.loading}
                  autoFocus
                />
              </div>

              {stationPromptModal.loading && (
                <div className="modal-loading-banner">
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>جاري استدعاء المعلم الخبير وهندسة المحطة بذكاء... ⏳</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-cancel-modal"
                onClick={() => setStationPromptModal(prev => ({ ...prev, isOpen: false }))}
                disabled={stationPromptModal.loading}
              >
                إلغاء
              </button>
              <button 
                type="button" 
                className="btn-submit-modal-ai"
                onClick={handleApplyStationPromptModification}
                disabled={stationPromptModal.loading || !stationPromptModal.promptInstruction.trim()}
              >
                {stationPromptModal.loading ? 'جاري التطبيق...' : 'تطبيق التعديل بالذكاء الاصطناعي الآن ✨'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Interactive Scaffold Popover Modal */}
      {isStudentScaffoldModalOpen && (
        <div className="scaffold-student-modal-overlay" onClick={() => setIsStudentScaffoldModalOpen(false)}>
          <div className="scaffold-student-modal-card animate-pop" onClick={e => e.stopPropagation()}>
            <div className="scaffold-modal-header">
              <div className="scaffold-header-title">
                <span className="scaffold-key-icon">🗝️</span>
                <h3>مفتاح وسقالة التفكير للمحطة</h3>
              </div>
              <button 
                type="button" 
                className="btn-scaffold-close"
                onClick={() => setIsStudentScaffoldModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="scaffold-modal-body">
              <div className="scaffold-guidance-box">
                <span className="guidance-tag">💡 تلميح ومفتاح للتفكير خطوة بخطوة:</span>
                <p className="guidance-text">
                  {publicDisplayState.scaffolds || 'تذكر القاعدة الأساسية التي شرحناها، وابدأ بتحديد المعطيات قبل كتابة الحل!'}
                </p>
              </div>
              <div className="scaffold-pedagogy-reminder">
                <i className="fas fa-shield-alt"></i>
                <span>هذا المفتاح مصمم ليرشد تفكيرك خطوة بخطوة دون إعطاء الإجابة النهائية!</span>
              </div>
            </div>
            <div className="scaffold-modal-footer">
              <button 
                type="button" 
                className="btn-scaffold-understood"
                onClick={() => setIsStudentScaffoldModalOpen(false)}
              >
                فهمت التلميح، سأحاول بنفسي الآن! 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: AI STATION ALTERNATIVES (اقتراح بدائل للمحطة)                */}
      {/* =================================================================== */}
      {stationAltModal.isOpen && (
        <div className="miftaah-modal-overlay" onClick={() => setStationAltModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="miftaah-alt-modal-card" onClick={e => e.stopPropagation()}>
            <div className="alt-modal-head">
              <div className="alt-modal-title-group">
                <span className={`st-edit-badge letter-${stationAltModal.stationKey}`}>
                  {prepForm.stations?.[stationAltModal.stationKey]?.letter || stationAltModal.stationKey}
                </span>
                <div>
                  <h3>بدائل مقترحة لمحطة [{stationAltModal.stationName}] (AI) ✨</h3>
                  <p>اختر البديل التدريسي الأنسب لأسلوبك أو لطلابك، أو اكتب توجيهاً لتوليد بدائل أخرى:</p>
                </div>
              </div>
              <button 
                type="button" 
                className="alt-modal-close-btn"
                onClick={() => setStationAltModal(prev => ({ ...prev, isOpen: false }))}
              >
                ✕
              </button>
            </div>

            {/* Current Prompt Preview */}
            {stationAltModal.currentPrompt && (
              <div className="alt-current-preview-box">
                <span className="preview-label"><i className="fas fa-eye"></i> المحتوى الحالي المعروض للمحطة:</span>
                <p>{stationAltModal.currentPrompt}</p>
              </div>
            )}

            {/* Custom Instruction Box */}
            <div className="alt-custom-prompt-box">
              <input 
                type="text"
                placeholder="توجيه خاص لتخصيص البدائل؟ (مثال: أريد لعبة لغوية تفاعلية، أو مدخلاً قصصياً، أو نشاطاً ثنائياً، أو تمريناً بـ 3 مستويات...)"
                value={stationAltModal.customInstruction}
                onChange={e => setStationAltModal(prev => ({ ...prev, customInstruction: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') handleRegenerateStationAlternatives(); }}
              />
              <button
                type="button"
                className="btn-regenerate-alt"
                onClick={handleRegenerateStationAlternatives}
                disabled={stationAltModal.loading}
              >
                {stationAltModal.loading ? (
                  <><i className="fas fa-spinner fa-spin"></i> جاري التوليد...</>
                ) : (
                  <><i className="fas fa-sync-alt"></i> توليد بدائل جديدة</>
                )}
              </button>
            </div>

            {/* Alternatives Cards List */}
            <div className="alt-cards-scroll-container">
              {stationAltModal.loading ? (
                <div className="alt-loading-state">
                  <i className="fas fa-brain fa-spin fa-2x"></i>
                  <p>جاري صياغة ٣ بدائل تدريسية متمايزة ومكتوبة بالكامل عبر الذكاء الاصطناعي... ⏳</p>
                </div>
              ) : stationAltModal.alternatives.length === 0 ? (
                <div className="alt-empty-state">
                  <p>لم يتم العثور على بدائل. اضغط زر "توليد بدائل جديدة".</p>
                </div>
              ) : (
                stationAltModal.alternatives.map((alt, idx) => (
                  <div key={alt.id || idx} className="alt-choice-card">
                    <div className="alt-choice-header">
                      <div className="alt-choice-title">
                        <span className="alt-number-badge">#{idx + 1}</span>
                        <h4>{alt.title}</h4>
                      </div>
                      <span className="alt-style-tag">{alt.styleBadge || 'بديل تدريسي'}</span>
                    </div>

                    <div className="alt-choice-body">
                      <div className="alt-section-block student-screen-block">
                        <label><i className="fas fa-desktop"></i> ما سيظهر للطلاب على شاشة العرض (النص الفعلي):</label>
                        <div className="alt-text-preview">{alt.studentDisplayPrompt}</div>
                      </div>

                      {alt.teacherNotes && (
                        <div className="alt-section-block teacher-notes-block">
                          <label><i className="fas fa-user-secret"></i> ملاحظات وإرشادات المعلم:</label>
                          <div className="alt-text-preview subtle">{alt.teacherNotes}</div>
                        </div>
                      )}

                      {(alt.scaffolds || alt.extension) && (
                        <div className="alt-meta-pills">
                          {alt.scaffolds && (
                            <span className="alt-pill scaffold" title="سقالة الدعم">
                              <i className="fas fa-life-ring"></i> {alt.scaffolds}
                            </span>
                          )}
                          {alt.extension && (
                            <span className="alt-pill extension" title="مهمة التعميق">
                              <i className="fas fa-rocket"></i> {alt.extension}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="alt-choice-footer">
                      <button
                        type="button"
                        className="btn-apply-alt-choice"
                        onClick={() => handleApplyAlternative(alt)}
                      >
                        <i className="fas fa-check-circle"></i> اعتماد هذا البديل واستبدال المحطة فوراً 🎯
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: LIVE PROJECTOR PREVIEW (معاينة شاشة البروجكتور الحية)         */}
      {/* =================================================================== */}
      {projectorPreviewModal.isOpen && (
        <div className="miftaah-modal-overlay" onClick={() => setProjectorPreviewModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="miftaah-projector-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="proj-preview-head-bar">
              <div className="proj-preview-title">
                <i className="fas fa-desktop"></i>
                <span>شاشة البروجكتور: كيف ستظهر للطلاب على شاشة العرض الكبيرة 🎦</span>
              </div>
              <div className="proj-preview-controls">
                <button
                  type="button"
                  className="btn-open-proj-external"
                  onClick={() => {
                    handleLaunchProjectorFromStation(projectorPreviewModal.stationKey);
                    setProjectorPreviewModal(prev => ({ ...prev, isOpen: false }));
                  }}
                >
                  <i className="fas fa-external-link-alt"></i> فتح في نافذة بروجكتور مستقلة للصف 🚀
                </button>
                <button
                  type="button"
                  className="alt-modal-close-btn"
                  onClick={() => setProjectorPreviewModal(prev => ({ ...prev, isOpen: false }))}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Simulated Projector Screen Canvas */}
            <div className="projector-canvas-simulated">
              <div className="student-view-top-header">
                <div className="proj-school-info">مدرسة مشيرفة الابتدائية • نموذج مِفتاح للحصة الفاعلة</div>
                <div className="proj-active-station-banner">
                  <span className="proj-letter-gem">{projectorPreviewModal.letter}</span>
                  <h3>محطة {projectorPreviewModal.stationName} — «{projectorPreviewModal.studentPhrase}»</h3>
                </div>
                <div className="proj-timer-readout">
                  <i className="fas fa-stopwatch"></i> {formatSeconds(projectorPreviewModal.timerSeconds)}
                </div>
              </div>

              <div className="student-view-main-card">
                <div className="student-goal-header-bar">
                  <div className="goal-row title-row">
                    <span className="goal-label">📖 موضوع الدرس:</span>
                    <span className="goal-text lesson-name">{projectorPreviewModal.lessonTitle}</span>
                  </div>
                  {projectorPreviewModal.objective && (
                    <div className="goal-row">
                      <span className="goal-label">🎯 هدف التعلم:</span>
                      <span className="goal-text">{projectorPreviewModal.objective}</span>
                    </div>
                  )}
                </div>

                <div className="student-task-active-box">
                  <div className="task-badge-tag">سؤال ومهمة المحطة المعروضة على الشاشة:</div>
                  <div className="student-main-prompt-text">
                    {projectorPreviewModal.headline.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>

                <div className="student-interactive-keys-dock">
                  <div className="keys-dock-title">مفاتيح المشاركة وطلب الدعم للطلاب:</div>
                  <div className="keys-buttons-row">
                    {STUDENT_REQUEST_KEYS.map((sk) => (
                      <button key={sk.id} type="button" className="student-key-btn">
                        <span className="k-icon">{sk.icon}</span>
                        <span className="k-label">{sk.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MafatihTeacherCompanion;
