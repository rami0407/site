import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { getStudentSession } from '../utils/studentAuth';
import './StemCorner.css';

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

  // Follow-Up Update Modal State
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

          {/* Gamification Score Badge */}
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
        </div>
      </header>

      {/* 🎯 Navigation Tabs */}
      <nav className="stem-nav-tabs">
        <button 
          className={`stem-tab-btn ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          <i className="fas fa-lightbulb"></i> 1. صناع الحلول (تحدي المشكلات)
        </button>

        <button 
          className={`stem-tab-btn ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          <i className="fas fa-bars-progress"></i> 5. متابعة ابتكراتي وتحدياتي 🔍
        </button>

        <button 
          className={`stem-tab-btn ${activeTab === 'experiments' ? 'active' : ''}`}
          onClick={() => setActiveTab('experiments')}
        >
          <i className="fas fa-flask"></i> 2. تجارب علمية منزلية
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
    </div>
  );
};

export default StemCorner;
