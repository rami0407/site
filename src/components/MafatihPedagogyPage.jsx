import React, { useState, useEffect, useRef } from 'react';
import LottieRobot from './LottieRobot';
import './MafatihPedagogyPage.css';

const STATIONS_DATA = [
  {
    id: 'm',
    letter: 'م',
    title: 'جَذْب وَتَشْوِيق',
    hebrewTitle: 'מְשִׁיכָה / מַשְׁיוּכִיָּה',
    symbol: '🧲',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    bgLight: '#fffbeb',
    badge: 'المحطة الأولى',
    time45: '5 - 7 دقائق',
    time90: '10 - 12 دقيقة',
    goal: 'كسر الجمود، تحفيز الفضول، واستثارة الدافعية للتعلم (Engagement) وربط الموضوع بالمعرفة السابقة للطلاب.',
    practices: [
      'طرح لغز ذهني محير يثير التساؤل والفضول.',
      'عرض صورة غير مألوفة أو مشهد بصري استثنائي.',
      'مقطع فيديو مرئي وجيز (دقيقة واحدة) يلامس فكرة الدرس.',
      'حكاية معبرة أو معضلة أخلاقية/واقعية قصيرة.',
      'ربط مباشر بموقف حياتي واقعي يعيشه الطالب يومياً.'
    ],
    teacherRole: 'مُحَفِّز ومستفز للتفكير — يطرح المشكلة والمفارقة دون تقديم الحلول الجاهزة.',
    studentRole: 'متسائل، مستكشف، يطرح التخمينات الأولية، ويفحص أفكاره ومدركاته المسبقة.',
    transitionSign: 'صدور السؤال المركزي التلقائي من الطلاب: "لماذا يحدث ذلك؟" أو "كيف يمكن تفسير هذا اللغز؟"',
    example: {
      subject: 'علوم — حالات المادة والتكاثف',
      action: 'يُحضر المعلم كأساً مثلجة عليها قطرات ماء من الخارج، ويسأل: "من أين جاء هذا الماء؟ هل الكأس مثقوبة؟!"'
    }
  },
  {
    id: 'f',
    letter: 'ف',
    title: 'فَهْم المَفْهُوم وَاللِّقَاء الأَوَّل',
    hebrewTitle: 'פְּגִישָׁה / הֲבָנַת הַמֻּשָׂג',
    symbol: '💡',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    bgLight: '#ecfeff',
    badge: 'المحطة الثانية',
    time45: '8 - 10 دقائق',
    time90: '15 - 18 دقيقة',
    goal: 'التعرّف على المفهوم المركزي، استيعاب النص أو المعطيات، وتأسيس القاموس اللغوي والعلمي للموضوع (Concept Acquisition).',
    practices: [
      'قراءة موجهة واعية لنص، أو تفكيك مسألة، أو استعراض ظاهرة علمية.',
      'شرح مبسط ومركّز يفكك المصطلحات والمفردات الجديدة.',
      'نمذجة المعلم للمفهوم (I Do) وتوضيح كيفية التفكير فيه.',
      'استخراج الأفكار الرئيسة وبناء القاموس اللغوي الدقيق للدرس.'
    ],
    teacherRole: 'وسيط معرفي — يعرّف المصطلحات بدقة، يوضح القواعد، ويبني جسور الفهم السليم.',
    studentRole: 'متلقٍ نشط — يحدد الكلمات المركزية، ويفسر المفهوم الأساسي بلغته وطريقته الخاصة.',
    transitionSign: 'قدرة الطلاب على إعادة صياغة المفهوم الأساسي بشكل صحيح وسليم بلغتهم الذاتية.',
    example: {
      subject: 'لغة عربية — أسلوب التعجب',
      action: 'قراءة نص قصير، إبراز صياغة "ما أروعَ / ما أجملَ"، وتعريف المفهوم بدقة: شعور نفسي يعبّر عن الدهشة من صفة بارزة.'
    }
  },
  {
    id: 't',
    letter: 'ت',
    title: 'تَبَصُّر وَتَعَمُّق',
    hebrewTitle: 'תְּבוּנָה / הַעֲמָקָה',
    symbol: '🧠',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    bgLight: '#f5f3ff',
    badge: 'المحطة الثالثة',
    time45: '8 - 10 دقائق',
    time90: '18 - 20 دقيقة',
    goal: 'الانتقال من الحفظ السطحي إلى مهارات التفكير العليا (HOTS) كالتحليل، المقارنة، والربط السببي.',
    practices: [
      'حوار صفي سقراطي تفاعلي يستند لأسئلة تفكير عميقة.',
      'طرح أسئلة مفتوحة مثل: "ماذا لو لم يحدث ذلك؟"، "لماذا نفضل هذا الحل على غيره؟"',
      'تفكيك الأسباب والنتائج والمقارنة بين حالات وظواهر متباينة.',
      'مناقشة الأخطاء الشائعة وتحليل دلالاتها الفكرية.'
    ],
    teacherRole: 'ميسر للحوار الفكري — يطرح أسئلة غير مغلقة، يربط الإجابات ببعضها، ويتجنب الإجابة بدلاً عن الطلاب.',
    studentRole: 'يحلل، يقارن، يبرر إجابته بالحجج المقنعة، ويصوغ استنتاجات قائمة على التفكير النقدي.',
    transitionSign: 'توصل الطلاب إلى استنتاجاتهم الذاتية وتبريرها منطقياً وليس مجرد ترديد أقوال المعلم.',
    example: {
      subject: 'تاريخ / مدنيات — اتخاذ القرارات',
      action: 'طرح معضلة: "لو كنت مكان القائد في تلك اللحظة التاريخية، ما القرار البديل الذي كنت ستتخذه ولماذا؟"'
    }
  },
  {
    id: 'y',
    letter: 'ي',
    title: 'يَدَوِيّ وَتَطْبِيق',
    hebrewTitle: 'יִשּׂוּם / עֲבוֹדַת כַּפַּיִם',
    symbol: '🛠️',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    bgLight: '#ecfdf5',
    badge: 'المحطة الرابعة (الورشة)',
    time45: '12 - 15 دقيقة',
    time90: '25 - 35 دقيقة',
    goal: 'تحويل الفهم الفكري إلى ممارسة وسلوك عملي ملموس (Practice & Application)، وهي "ورشة العمل" الأساسية لتطبيق التمايز التعليمي.',
    practices: [
      'حل تمارين وأنشطة متدرجة المستويات تراعي الفروق الفردية.',
      'مهمات كتابية وبحثية قصيرة تُنتج مخرجات محددة.',
      'تجارب علمية مخبرية أو نمذجة مجسمات ومحاكاة عملية.',
      'عمل ثنائي أو مجموعات تعلم تشاركية لإنتاج مخرج محدد ملموس.'
    ],
    teacherRole: 'مدرب وموجه ومراقب — يتنقل بين المجموعات لتقديم تغذية راجعة فورية ودعم المتعثرين.',
    studentRole: 'ممارس ومبادر — يحل، يبني، يكتب، ويساعد زملاءه في الفريق بروح تعاونية.',
    transitionSign: 'إنجاز الطلاب للمهمة المطلوبة وظهور مخرج تطبيقي واضح يبرهن على الفهم العملي.',
    example: {
      subject: 'رياضيات — حساب المساحات والمحيط',
      action: 'تقسيم الطلاب لثنائيات، واستخدام أشرطة القياس لحساب مساحات المقاعد والأبواب وتوثيقها ببطاقة قياس هندسية.'
    }
  },
  {
    id: 'h',
    letter: 'ح',
    title: 'حَصَاد وَزَوَّادَة',
    hebrewTitle: 'חֲתִימָה וְצֵידָה לַדֶּרֶךְ',
    symbol: '🎒',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    bgLight: '#fdf2f8',
    badge: 'المحطة الخامسة (الخاتمة)',
    time45: '4 - 5 دقائق',
    time90: '8 - 10 دقائق',
    goal: 'إنهاء الحصة بوعي ذاتي وإدراك لأثر التعلم (Metacognition)، واستخراج "الزوّادة" لنقل المعرفة إلى الحياة الواقعية (Transfer of Learning).',
    practices: [
      'تعبئة "تذكرة الخروج" (כרטיס יציאה / Exit Ticket).',
      'تدوين خانة "زوّادتي" في الدفتر بإجابة سؤالين جوهريين:',
      '1. ما هو المصطلح أو المهارة التي تزودت بها اليوم؟',
      '2. أين وكيف سأوظف هذا الزاد في حياتي أو في دراستي القادمة؟',
      'مشاركة سريعة ومصادقة إيجابية على زوائد الطلاب المميزة.'
    ],
    teacherRole: 'مستمع ومصادق وموثق لمخرجات الطلاب المعرفية والقيمية.',
    studentRole: 'مقيم ذاتي، يحدد مكاسبه الفكرية بوعي ويدون خطته الحياتية لاستخدامها مستقبلاً.',
    transitionSign: 'امتلاك كل طالب لزوادة فكرية محددة وقابلة للنقل قبل مغادرة الغرفة الصفية.',
    example: {
      subject: 'تربية لغوية / علوم عامة',
      action: 'يكتب الطالب في دفتره: "زوّادتي اليوم: التكاثف؛ وتطبيقي العملي: سأفسر لأمي غداً لماذا يتشكل الضباب على مرآة الحمام بعد الاستحمام!"'
    }
  }
];

const MafatihPedagogyPage = () => {
  const [activeTab, setActiveTab] = useState('stations'); // 'stations', 'ruler', 'pedagogy', 'toolkit', 'planner', 'rubric', 'vision'
  const [selectedStationIndex, setSelectedStationIndex] = useState(0);
  const [lessonDurationMode, setLessonDurationMode] = useState(45); // 45 or 90
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Lesson Planner State
  const [plannerSubject, setPlannerSubject] = useState('لغة عربية');
  const [plannerGrade, setPlannerGrade] = useState('الصف الخامس');
  const [plannerTitle, setPlannerTitle] = useState('أسلوب التعجب ودلالاته الجمالية');
  const [plannerStations, setPlannerStations] = useState({
    m: 'عرض صورة مذهلة لأطول شجرة في العالم ومقارنتها بطفل صغير، ثم سؤال الطلاب: كيف تعبرون عن دهشتكم من هذا المشهد؟',
    f: 'استخراج جملة "ما أعظمَ الشجرةَ!" من النص، وتفكيك أركان جملة التعجب (ما + أفعل + المتعجب منه + !).',
    t: 'مقارنة بين: "هذه الشجرة عظيمة" و "ما أعظمَ الشجرةَ!". ما الفرق في الأثر النفسي بين الجملتين؟',
    y: 'مهمة ثنائية: بطاقات صور لمناظر طبيعية ومشاهد، ويكتب كل ثنائي 3 جمل تعجب مضبوطة بالشكل.',
    h: 'كتابة تذكرة الخروج: "زوّادتي اليوم: صيغة التعجب، وسأستخدمها الليلة لأعبر لوالدتي عن إعجابي بطعام العشاء".'
  });

  // Digital Exit Ticket Simulator State
  const [ticketStudentName, setTicketStudentName] = useState('');
  const [ticketClass, setTicketClass] = useState('الخامس (أ)');
  const [ticketLearnedTerm, setTicketLearnedTerm] = useState('');
  const [ticketApplicationContext, setTicketApplicationContext] = useState('');
  const [ticketGenerated, setTicketGenerated] = useState(false);

  // Observation Rubric State
  const [rubricTeacherName, setRubricTeacherName] = useState('');
  const [rubricSubject, setRubricSubject] = useState('علوم');
  const [rubricClass, setRubricClass] = useState('الرابع (ب)');
  const [rubricScores, setRubricScores] = useState({
    m: 3, // 1 to 4
    f: 3,
    t: 3,
    y: 4,
    h: 3
  });
  const [rubricNotes, setRubricNotes] = useState('');
  const [rubricGenerated, setRubricGenerated] = useState(false);

  // Interactive Lottie Robot Assistant State
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);
  const [robotChatInput, setRobotChatInput] = useState('');
  const [robotReply, setRobotReply] = useState(
    'مرحباً بك في موديل "مَفَاتِيح"! أنا رفيقك الروبوت الذكي 🤖🗝️\nأنا هنا لأساعدك في تخطيط مسار حصتك، إشعال محطة الجذب، وتصميم تذكرة الخروج (الزوّادة). انقر على أي سؤال بالأسفل أو اكتب لي ما يشغل بالك!'
  );
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);

  const speakArabic = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('المتصفح الحالي لا يدعم ميزة قراءة الصوت.');
      return;
    }
    window.speechSynthesis.cancel();
    if (isVoiceSpeaking) {
      setIsVoiceSpeaking(false);
      return;
    }
    const clean = text.replace(/[🤖🗝️✨💡🧠🛠️🎒🏅🌟❓✔️❌]/g, '');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'ar-SA';
    utter.rate = 0.95;
    utter.onend = () => setIsVoiceSpeaking(false);
    utter.onerror = () => setIsVoiceSpeaking(false);
    setIsVoiceSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  const handleAskRobot = (query) => {
    const q = (query || robotChatInput).trim().toLowerCase();
    if (!q) return;

    let ans = '';
    if (q.includes('جذب') || q.includes('تشويق') || q.includes('משו')) {
      ans = '💡 نصيحة لمحطة الجذب [ م ]:\nلا تكشف الإجابة أو الحل! اطرح لغزاً أو صورة محيرة أو مشهداً مألوفاً من حياة الطلاب اليومية. هدفك أن يسأل الطلاب بعفوية: "لماذا يحدث هذا؟" أو "كيف نفسر هذا اللغز؟"';
    } else if (q.includes('فهم') || q.includes('مفهوم') || q.includes('لقاء')) {
      ans = '📖 نصيحة لمحطة الفهم [ ف ]:\nركز على المفهوم المركزي بدقة، وفكك الكلمات الصعبة. قدّم نمذجة واضحة (I Do) واطلب من الطلاب إعادة صياغة المفهوم بلغتهم الخاصة للتأكد من استيعابهم قبل الانتقال.';
    } else if (q.includes('تبصر') || q.includes('تعمق') || q.includes('تفكير')) {
      ans = '🧠 نصيحة لمحطة التبصر [ ت ]:\nاستخدم أسئلة تفكير عليا (HOTS) مثل "ماذا لو لم يحدث هذا؟" أو "لماذا اخترنا هذا الحل دون غيره؟". تجنب الإجابة بدلاً من الطلاب واجعلهم يستنتجون بأنفسهم.';
    } else if (q.includes('يدوي') || q.includes('تطبيق') || q.includes('تمايز') || q.includes('udl')) {
      ans = '🛠️ نصيحة لمحطة التطبيق [ ي ]:\nهنا قلب التمايز! وفر طاولة دعم مع المعلم للتمكين، ومجموعات عمل مستقلة للمتفوقين. نوّع في أشكال المخرجات (كتابي، مجسم، تسجيل، بطاقة تفاعلية).';
    } else if (q.includes('حصاد') || q.includes('زوادة') || q.includes('تذكرة') || q.includes('exit')) {
      ans = '🎒 سر "الزوّادة" [ ح ]:\nالحصة لا تنتهي برنين الجرس! بل بسؤالين سريعين:\n1. ما الذي تزودت به اليوم؟\n2. أين وكيف سأوظفه في حياتي أو دراستي القادمة؟\nاجعلها محددة ومختصرة (سطرين فقط).';
    } else if (q.includes('مسطرة') || q.includes('وقت') || q.includes('זמן')) {
      ans = '⏱️ نصيحة لمسطرة الحصة:\nفي الحصة العادية (45 دقيقة): امنح الجذب 7د، الفهم 10د، التبصر 10د، التطبيق 14د، والزوّادة 4د. أما في الحصة المضاعفة (90د) فوسع وقت الورشة التطبيقية إلى 35 دقيقة!';
    } else {
      ans = `رائع جداً! سؤالك حول "${q}" يرتبط بجوهر موديل مفاتيح. تذكر دائماً أن المفتاح يفتح أبواب التفكير، وأن نجاح الحصة يكمن في امتلاك الطالب لزوّادته الحياتية ونقل أثر التعلم!`;
    }

    setRobotReply(ans);
    setRobotChatInput('');
  };

  const selectedStation = STATIONS_DATA[selectedStationIndex];

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setActiveTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mafatih-page-container" dir="rtl">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <header className="mafatih-hero-banner">
        <div className="mafatih-hero-overlay"></div>
        <div className="container mafatih-hero-content">
          <div className="mafatih-hero-meta">
            <span className="mafatih-school-badge">
              <i className="fas fa-graduation-cap"></i> مدرسة مشيرفة الابتدائية — الإطار التربوي الموحد
            </span>
            <span className="mafatih-framework-tag">
              <i className="fas fa-dna"></i> الشيفرة الوراثية (DNA) للغرفة الصفية
            </span>
          </div>

          <div className="mafatih-hero-main-flex">
            <div className="mafatih-hero-text-col">
              <h1 className="mafatih-hero-title">
                موديل <span>"مَفَاتِيح"</span> التربوي
                <small className="mafatih-hebrew-subtitle">مودل מַפְתֵּ"חַ: الإطار التدريسي الموحد لرسم مسار الحصة</small>
              </h1>

              <p className="mafatih-hero-description">
                نموذج تعليمي قيادي ينقل الحصة المدرسية من مجرد التلقين السطحي إلى بناء <strong>"الزوّادة" (צידת הדרך)</strong> ونقل أثر التعلم للحياة اليومية عبر 5 محطات إجرائية متناغمة تعزز التمايز، الاحتواء، والوعي الذاتي.
              </p>
            </div>

            {/* Live Interactive Animated Robot in Hero */}
            <div 
              className="mafatih-hero-robot-pod" 
              onClick={() => setIsRobotModalOpen(true)}
              title="انقر للتحدث مع رفيق مفاتيح الذكي"
            >
              <div className="robot-speech-bubble">
                <span className="sparkle-icon">✨</span>
                <span>"أنا رفيقكم المتحرك في موديل مفاتيح! انقر عليّ لأساعدك!"</span>
              </div>
              <LottieRobot width="170px" height="170px" className="hero-animated-robot" />
              <div className="robot-name-chip">
                <span>🤖 رفيق مفاتيح الذكي</span>
              </div>
            </div>
          </div>

          {/* Quick Acronym Visual Cards */}
          <div className="mafatih-acronym-bar">
            {STATIONS_DATA.map((st, idx) => (
              <div 
                key={st.id} 
                className={`acronym-key-chip ${selectedStationIndex === idx ? 'active' : ''}`}
                onClick={() => {
                  setSelectedStationIndex(idx);
                  setActiveTab('stations');
                }}
                style={{ '--chip-color': st.color }}
              >
                <div className="chip-letter-circle">
                  <span>{st.letter}</span>
                </div>
                <div className="chip-text">
                  <strong>{st.title}</strong>
                  <small>{st.hebrewTitle.split('/')[0]}</small>
                </div>
                <span className="chip-arrow">⬅</span>
              </div>
            ))}
          </div>

          {/* Top Quick Actions */}
          <div className="mafatih-hero-actions">
            <button 
              className="action-btn primary"
              onClick={() => setActiveTab('stations')}
            >
              <i className="fas fa-route"></i> استكشف المحطات الخمس
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => setActiveTab('ruler')}
            >
              <i className="fas fa-ruler-horizontal"></i> مسطرة الحصة التفاعلية
            </button>
            <button 
              className="action-btn accent"
              onClick={() => setActiveTab('planner')}
            >
              <i className="fas fa-pen-nib"></i> مُخَطِّط الدروس الذكي
            </button>
            <button 
              className="action-btn outline"
              onClick={() => setActiveTab('rubric')}
            >
              <i className="fas fa-clipboard-check"></i> بطاقة المشاهدة الصامتة
            </button>
          </div>
        </div>
      </header>

      {/* 2. NAVIGATION SUB-TABS */}
      <nav className="mafatih-tab-nav">
        <div className="container mafatih-tabs-wrapper">
          <button 
            className={`tab-btn ${activeTab === 'stations' ? 'active' : ''}`}
            onClick={() => setActiveTab('stations')}
          >
            <i className="fas fa-key"></i> المحطات الخمس بالتفصيل
          </button>
          <button 
            className={`tab-btn ${activeTab === 'ruler' ? 'active' : ''}`}
            onClick={() => setActiveTab('ruler')}
          >
            <i className="fas fa-stopwatch"></i> محاكي مسطرة الحصة
          </button>
          <button 
            className={`tab-btn ${activeTab === 'pedagogy' ? 'active' : ''}`}
            onClick={() => setActiveTab('pedagogy')}
          >
            <i className="fas fa-puzzle-piece"></i> التمايز، الدمج وSEL
          </button>
          <button 
            className={`tab-btn ${activeTab === 'toolkit' ? 'active' : ''}`}
            onClick={() => setActiveTab('toolkit')}
          >
            <i className="fas fa-toolbox"></i> حقيبة الأدوات و"زوّادتي"
          </button>
          <button 
            className={`tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
            onClick={() => setActiveTab('planner')}
          >
            <i className="fas fa-drafting-compass"></i> صانع درس مفاتيح
          </button>
          <button 
            className={`tab-btn ${activeTab === 'rubric' ? 'active' : ''}`}
            onClick={() => setActiveTab('rubric')}
          >
            <i className="fas fa-eye"></i> بطاقة المشاهدة (מחוון)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'vision' ? 'active' : ''}`}
            onClick={() => setActiveTab('vision')}
          >
            <i className="fas fa-compass"></i> الرؤية، المزايا والمحاذير
          </button>
        </div>
      </nav>

      {/* 3. MAIN CONTENT BODY */}
      <main className="container mafatih-main-content">
        
        {/* ========================================================================= */}
        {/* TAB 1: THE 5 STATIONS INTERACTIVE EXPLORER */}
        {/* ========================================================================= */}
        {activeTab === 'stations' && (
          <section className="stations-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-stream"></i> متتالية التدريس الإجرائية
              </div>
              <h2>المحطات الخمس لموديل "مَفَاتِيح" (تَحَنُوت هَمُودِل)</h2>
              <p>
                خمس محطات إجرائية تشكل تدفقاً معرفياً ووجدانياً سلساً يعبر بالمتعلم من لحظة إثارة الفضول وحتى امتلاك الزوّادة ونقل أثر التعلم. انقر على أي محطة لاستكشاف تفاصيلها وأدوار المعلم والمتعلم ومؤشرات الانتقال:
              </p>
            </div>

            {/* Stepper Buttons */}
            <div className="stations-stepper">
              {STATIONS_DATA.map((st, idx) => (
                <button
                  key={st.id}
                  className={`station-step-btn ${selectedStationIndex === idx ? 'active' : ''}`}
                  onClick={() => setSelectedStationIndex(idx)}
                  style={{ '--station-color': st.color }}
                >
                  <span className="step-num">{idx + 1}</span>
                  <span className="step-letter">{st.letter}</span>
                  <span className="step-title">{st.title}</span>
                  <span className="step-hebrew">{st.hebrewTitle.split('/')[0]}</span>
                </button>
              ))}
            </div>

            {/* Active Station Detailed Card */}
            <div className="station-dossier-card" style={{ '--current-color': selectedStation.color }}>
              <div className="dossier-header" style={{ background: selectedStation.gradient }}>
                <div className="dossier-letter-badge">
                  <span>{selectedStation.letter}</span>
                </div>
                <div className="dossier-titles">
                  <div className="dossier-tag">{selectedStation.badge}</div>
                  <h3>{selectedStation.title}</h3>
                  <div className="dossier-hebrew-title">{selectedStation.hebrewTitle}</div>
                </div>
                <div className="dossier-timing-chip">
                  <div><i className="fas fa-clock"></i> 45 دقيقة: <strong>{selectedStation.time45}</strong></div>
                  <div><i className="fas fa-hourglass-half"></i> 90 دقيقة: <strong>{selectedStation.time90}</strong></div>
                </div>
              </div>

              <div className="dossier-body">
                {/* Pedagogical Goal */}
                <div className="dossier-block goal-block">
                  <h4><i className="fas fa-bullseye"></i> الهدف التربوي الجوهري:</h4>
                  <p>{selectedStation.goal}</p>
                </div>

                {/* Practical Classroom Activities */}
                <div className="dossier-block practices-block">
                  <h4><i className="fas fa-chalkboard-teacher"></i> الممارسات الصفية والتطبيقية:</h4>
                  <ul className="practices-list">
                    {selectedStation.practices.map((practice, pIdx) => (
                      <li key={pIdx}>
                        <i className="fas fa-check-circle" style={{ color: selectedStation.color }}></i>
                        <span>{practice}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Roles Matrix: Teacher vs Student */}
                <div className="roles-matrix-grid">
                  <div className="role-card teacher-role">
                    <div className="role-header">
                      <i className="fas fa-user-tie"></i> دور المعلم في هذه المحطة
                    </div>
                    <div className="role-text">
                      {selectedStation.teacherRole}
                    </div>
                  </div>

                  <div className="role-card student-role">
                    <div className="role-header">
                      <i className="fas fa-user-graduate"></i> دور الطالب في هذه المحطة
                    </div>
                    <div className="role-text">
                      {selectedStation.studentRole}
                    </div>
                  </div>
                </div>

                {/* Transition Signal (סמן מעבר) */}
                <div className="transition-signal-card">
                  <div className="signal-icon">
                    <i className="fas fa-traffic-light"></i>
                  </div>
                  <div className="signal-content">
                    <h5>مؤشر الانتقال للمحطة التالية (סַמָּן מַעֲבָר):</h5>
                    <p>{selectedStation.transitionSign}</p>
                  </div>
                </div>

                {/* Concrete Applied Example */}
                <div className="applied-example-card">
                  <div className="example-header">
                    <span className="example-tag"><i className="fas fa-lightbulb"></i> نموذج تطبيقي واقعي من الغرفة الصفية:</span>
                    <span className="example-subject">{selectedStation.example.subject}</span>
                  </div>
                  <p className="example-action">{selectedStation.example.action}</p>
                </div>
              </div>

              {/* Station Navigation Footer */}
              <div className="dossier-footer">
                <button 
                  className="nav-step-btn prev"
                  disabled={selectedStationIndex === 0}
                  onClick={() => setSelectedStationIndex(prev => Math.max(0, prev - 1))}
                >
                  <i className="fas fa-arrow-right"></i> المحطة السابقة
                </button>
                <span className="step-counter">
                  المحطة {selectedStationIndex + 1} من 5
                </span>
                <button 
                  className="nav-step-btn next"
                  disabled={selectedStationIndex === STATIONS_DATA.length - 1}
                  onClick={() => setSelectedStationIndex(prev => Math.min(STATIONS_DATA.length - 1, prev + 1))}
                >
                  المحطة التالية <i className="fas fa-arrow-left"></i>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INTERACTIVE LESSON RULER (مسطرة الحصة التفاعلية) */}
        {/* ========================================================================= */}
        {activeTab === 'ruler' && (
          <section className="ruler-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-ruler-combined"></i> مسطرة الحصة البصرية (פס מגנטי על הלוח)
              </div>
              <h2>محاكي مسطرة الحصة وتوزيع الزمن الذكي</h2>
              <p>
                تُعد مسطرة الحصة البصرية أداة تنظيمية حيوية تُثبت على لوح كل صف، وتمنح الطلاب - لا سيما ذوي صعوبات التركيز والانتباه - شعوراً بالأمان والاستقرار النفسي لكون مسار الحصة متوقعاً ومرئياً أمامهم دون مباغتة.
              </p>
            </div>

            {/* Mode Switcher: 45 min vs 90 min */}
            <div className="ruler-control-panel">
              <div className="duration-mode-selector">
                <span className="selector-label">نوع الحصة:</span>
                <button 
                  className={`mode-btn ${lessonDurationMode === 45 ? 'active' : ''}`}
                  onClick={() => {
                    setLessonDurationMode(45);
                    setActiveTimerSeconds(0);
                    setIsTimerRunning(false);
                  }}
                >
                  <i className="fas fa-hourglass-start"></i> حصة قياسية (45 دقيقة)
                </button>
                <button 
                  className={`mode-btn ${lessonDurationMode === 90 ? 'active' : ''}`}
                  onClick={() => {
                    setLessonDurationMode(90);
                    setActiveTimerSeconds(0);
                    setIsTimerRunning(false);
                  }}
                >
                  <i className="fas fa-hourglass"></i> حصة مضاعفة / ورشة (90 دقيقة)
                </button>
              </div>

              {/* Classroom Live Timer Tool */}
              <div className="classroom-timer-widget">
                <div className="timer-display">
                  <i className="fas fa-stopwatch"></i>
                  <span>{formatTimer(activeTimerSeconds)}</span>
                  <small>/ {lessonDurationMode}:00</small>
                </div>
                <div className="timer-controls">
                  <button 
                    className={`timer-ctrl-btn ${isTimerRunning ? 'pause' : 'start'}`}
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                  >
                    <i className={`fas ${isTimerRunning ? 'fa-pause' : 'fa-play'}`}></i>
                    {isTimerRunning ? 'إيقاف مؤقت' : 'بدء الحصة'}
                  </button>
                  <button 
                    className="timer-ctrl-btn reset"
                    onClick={() => {
                      setIsTimerRunning(false);
                      setActiveTimerSeconds(0);
                    }}
                  >
                    <i className="fas fa-undo"></i> إعادة تعيين
                  </button>
                </div>
              </div>
            </div>

            {/* Visual Magnetic Ruler Board Representation */}
            <div className="magnetic-board-preview">
              <div className="board-frame-header">
                <span className="magnet-circle red"></span>
                <span className="board-title">لوح الصف — شريط مسطرة مفاتيح الممغنط</span>
                <span className="magnet-circle blue"></span>
              </div>

              <div className="magnetic-ruler-track">
                {STATIONS_DATA.map((st, idx) => {
                  const targetTimeMin = lessonDurationMode === 45 
                    ? [7, 10, 10, 14, 4][idx] 
                    : [12, 18, 20, 30, 10][idx];
                  const currentMins = activeTimerSeconds / 60;
                  
                  // Calculate cumulative limits
                  const cumLimits = lessonDurationMode === 45 
                    ? [7, 17, 27, 41, 45] 
                    : [12, 30, 50, 80, 90];
                  
                  const isCurrentStation = (idx === 0 && currentMins <= cumLimits[0]) ||
                    (currentMins > cumLimits[idx - 1] && currentMins <= cumLimits[idx]);
                  const isPassedStation = currentMins > cumLimits[idx];

                  return (
                    <div 
                      key={st.id} 
                      className={`ruler-station-segment ${isCurrentStation ? 'active-station' : ''} ${isPassedStation ? 'passed-station' : ''}`}
                      style={{ 
                        '--segment-color': st.color,
                        flex: targetTimeMin
                      }}
                      onClick={() => setSelectedStationIndex(idx)}
                    >
                      <div className="segment-pointer-indicator">
                        {isCurrentStation && (
                          <div className="live-pointer-arrow">
                            <span className="pulse-dot"></span>
                            نحن هنا الآن!
                          </div>
                        )}
                      </div>
                      <div className="segment-badge">
                        <span className="segment-symbol">{st.symbol}</span>
                        <span className="segment-letter">{st.letter}</span>
                      </div>
                      <div className="segment-info">
                        <strong>{st.title}</strong>
                        <span className="segment-time">{targetTimeMin} دقيقة</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="ruler-helper-legend">
                <span><i className="fas fa-info-circle"></i> المسطرة قابلة للعرض على الشاشة التفاعلية أو كشريط مغناطيسي ملون يوجهه المعلم أو طالب مناوب لتعزيز الانضباط الذاتي.</span>
              </div>
            </div>

            {/* Suggested Time Breakdown Table */}
            <div className="time-breakdown-card">
              <h3><i className="fas fa-table"></i> التوزيع الزمني الدقيق وفق أهداف المحطات</h3>
              <div className="table-responsive">
                <table className="mafatih-table">
                  <thead>
                    <tr>
                      <th>المحطة</th>
                      <th>الاسم والمدلول</th>
                      <th>حصة 45 دقيقة</th>
                      <th>حصة مضاعفة 90 دقيقة</th>
                      <th>التركيز التربوي</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="letter-pill yellow">م</span></td>
                      <td><strong>جَذْب وَتَشْوِيق</strong> (מְשִׁיכָה)</td>
                      <td>5 - 7 دقائق</td>
                      <td>10 - 12 دقيقة</td>
                      <td>إشعال الفضول الذهني واستدعاء المعرفة السابقة.</td>
                    </tr>
                    <tr>
                      <td><span className="letter-pill cyan">ف</span></td>
                      <td><strong>فَهْم المَفْهُوم</strong> (פְּגִישָׁה)</td>
                      <td>8 - 10 دقائق</td>
                      <td>15 - 18 دقيقة</td>
                      <td>تفكيك المصطلحات وبناء القاموس اللغوي والمعرفي.</td>
                    </tr>
                    <tr>
                      <td><span className="letter-pill purple">ت</span></td>
                      <td><strong>تَبَصُّر وَتَعَمُّق</strong> (תְּבוּנָה)</td>
                      <td>8 - 10 دقائق</td>
                      <td>18 - 20 دقيقة</td>
                      <td>مهارات التفكير العليا (HOTS) والتحليل السببي.</td>
                    </tr>
                    <tr>
                      <td><span className="letter-pill green">ي</span></td>
                      <td><strong>يَدَوِيّ وَتَطْبِيق</strong> (יִשּׂוּם)</td>
                      <td>12 - 15 دقيقة</td>
                      <td>25 - 35 دقيقة</td>
                      <td>ورشة عمل تمايزية وممارسة وسلوك إجرائي.</td>
                    </tr>
                    <tr>
                      <td><span className="letter-pill pink">ح</span></td>
                      <td><strong>حَصَاد وَزَوَّادَة</strong> (חֲתִימָה וְצֵידָה)</td>
                      <td>4 - 5 دقائق</td>
                      <td>8 - 10 دقائق</td>
                      <td>تأطير الزوّادة ونقل أثر التعلم للحياة اليومية.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MODERN PEDAGOGY: UDL, INCLUSION, SEL & EVALUATION */}
        {/* ========================================================================= */}
        {activeTab === 'pedagogy' && (
          <section className="pedagogy-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-shapes"></i> التكامل مع النظريات التربوية الحديثة
              </div>
              <h2>أعمدة الموديل: التمايز (UDL)، الاحتواء، الوجدان (SEL)، والتقويم المستمر</h2>
              <p>
                لا يعمل موديل "مَفَاتِيح" كقالب شكلي معزول، بل هو بنية حية مدمجة تستوعب أرقى المعايير التربوية العالمية المعاصرة.
              </p>
            </div>

            {/* 4 Pillars Grid */}
            <div className="pedagogy-pillars-grid">
              
              {/* Pillar 1: UDL Differentiation */}
              <div className="pillar-card">
                <div className="pillar-icon-box udel">
                  <i className="fas fa-layer-group"></i>
                </div>
                <h3>1. التمايز وتفريد التعليم (הוראה דיפרנציאלית - UDL)</h3>
                <p className="pillar-intro">
                  تطبيق مبادئ التصميم الشامل للتعلم (Universal Design for Learning) عبر محطات الموديل الخمس:
                </p>
                <ul className="pillar-features">
                  <li>
                    <strong>التمايز في التقديم (محطتي الجذب والفهم):</strong> تقديم المفهوم عبر قنوات حسية متعددة (نص، صورة، فيديو، نماذج ملموسة) لتلبية مختلف أنماط المعالجة الذهنية.
                  </li>
                  <li>
                    <strong>التمايز في العمق المعرفي (محطة التبصر):</strong> صياغة أسئلة متدرجة الصعوبة؛ تبدأ بالمقارنة البسيطة وصولاً إلى التحليل والنقد المركب.
                  </li>
                  <li>
                    <strong>التمايز في الأداء والإنتاج (محطة التطبيق):</strong> تنويع مسارات العمل؛ طاولة مرافقة مع المعلم للتمكين، ومجموعات عمل مستقلة، مع حرية شكل المخرج (كتابي، بياني، تسجيل صوتي، أو مجسم).
                  </li>
                  <li>
                    <strong>التمايز في المخرجات (محطة الزوّادة):</strong> تتكيف "الزوّادة" مع قدرة الطالب؛ من تثبيت مصطلح أساسي لطالب متعثر، إلى بلورة فكرة تحليلية معمقة لطالب متفوق.
                  </li>
                </ul>
              </div>

              {/* Pillar 2: Inclusion & Co-Teaching */}
              <div className="pillar-card">
                <div className="pillar-icon-box inclusion">
                  <i className="fas fa-hands-helping"></i>
                </div>
                <h3>2. الاحتواء والدمج المدرسي (הכלה והשתלבות)</h3>
                <p className="pillar-intro">
                  تحويل الغرفة الصفية لبيئة حاضنة تضمن العدالة والمشاركة الفاعلة لكل متعلم:
                </p>
                <ul className="pillar-features">
                  <li>
                    <strong>الأمان النفسي والوضوح لطلاب صعوبات التعلم وADHD:</strong> وجود مسار بصري مرئي على اللوح يمنح المتعلم راحة واستقراراً لكون الحصة متوقعة دون مفاجآت تشتته.
                  </li>
                  <li>
                    <strong>المشاركة المتساوية في محطة الجذب:</strong> لا تتطلب محطة الجذب إتقاناً لغوياً معقداً؛ فطالب الدمج قد يكون أول من يحل اللغز أو يفسر الصورة، ما يعزز ثقته بنفسه بين أقرانه.
                  </li>
                  <li>
                    <strong>تنظيم التعليم المشترك (הוראה בצמד / Co-Teaching):</strong> يحدد الموديل بدقة دور معلمة الدمج/المساعد؛ تسهيل لغة المفهوم في محطة "الفهم"، وتوجيه طاولة التمكين المباشر في محطة "التطبيق".
                  </li>
                  <li>
                    <strong>الخروج بكرامة واستحقاق:</strong> لا يغادر أي طالب الحصة خالي الوفاض؛ فكل طالب يدوّن زوّادته الخاصة بكرامة وثقة.
                  </li>
                </ul>
              </div>

              {/* Pillar 3: SEL (Social-Emotional Learning) */}
              <div className="pillar-card">
                <div className="pillar-icon-box sel">
                  <i className="fas fa-heart"></i>
                </div>
                <h3>3. التعلم الاجتماعي-العاطفي (SEL - למידה רגשית-חברתית)</h3>
                <p className="pillar-intro">
                  تنمية المهارات الوجدانية والنفسية للطالب بموازاة التحصيل المعرفي:
                </p>
                <ul className="pillar-features">
                  <li>
                    <strong>تنمية الوعي الذاتي (Self-Awareness):</strong> محطة "الحصاد والزوّادة" تدرّب الطالب على محاسبة تفكيره الميتا-معرفي وإدراك مكاسبه الشخصية ومواطن نموه.
                  </li>
                  <li>
                    <strong>الوعي الاجتماعي وتقبل الرأي الآخر:</strong> محطة "التبصر والتعمق" تؤسس لحوار سقراطي مبني على الاحترام المتبادل، الاستماع الإيجابي، وتعدد وجهات النظر.
                  </li>
                  <li>
                    <strong>المهارات العلائقية والعمل التشاركي:</strong> محطة "التطبيق" تصمم لتبادل الأدوار والمسؤوليات، وحل المشكلات المشتركة ضمن عمل الفريق.
                  </li>
                </ul>
              </div>

              {/* Pillar 4: Assessment Triad */}
              <div className="pillar-card">
                <div className="pillar-icon-box assessment">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h3>4. منظومة التقويم والقياس (מערך ההערכה)</h3>
                <p className="pillar-intro">
                  لا يعزل الموديل التقويم في نهاية الحصة أو في ورقة اختبار، بل يوزعه إجرائياً:
                </p>
                <ul className="pillar-features">
                  <li>
                    <strong>تقويم تشخيصي (הערכה דיאגנוסטית):</strong> في محطتي "الجذب والفهم" لفحص الرصيد المعرفي السابق ورصد الفجوات ومفاهيم الطلاب الخاطئة.
                  </li>
                  <li>
                    <strong>تقويم تكويني مستمر (הערכה מעצבת):</strong> في محطة "التطبيق" عبر التغذية الراجعة الفورية من المعلم للطلاب أثناء الأداء والتدريب الحي.
                  </li>
                  <li>
                    <strong>تقويم ذاتي حقيقي (הערכה עצמית אותנטית):</strong> في محطة "الزوّادة" لقياس قدرة المتعلم على نقل المعرفة وتمثيلها وتوظيفها الحياتي.
                  </li>
                </ul>
              </div>

            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PEDAGOGICAL TOOLKIT & EXIT TICKET (زوّادتي) */}
        {/* ========================================================================= */}
        {activeTab === 'toolkit' && (
          <section className="toolkit-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-briefcase"></i> حقيبة الأدوات المدرسية التطبيقية (ארגז הכלים היישומי)
              </div>
              <h2>أدوات الدعم والتطبيق العملي في المدرسة</h2>
              <p>
                لتجسيد الموديل على أرض الواقع المدرسي، تم تصميم حزمة متكاملة من الأدوات التي تسهل عمل المعلمين وتضمن تفاعل الطلاب اليومي:
              </p>
            </div>

            {/* The 4 Implemented Tools */}
            <div className="tools-cards-grid">
              
              <div className="tool-box-card">
                <div className="tool-box-header">
                  <span className="tool-number">01</span>
                  <h4>مسطرة الحصة البصرية الممغنطة</h4>
                  <small>פס מגנטי על הלוח</small>
                </div>
                <p>شريط مغناطيسي ملون مثبت على زاوية لوح كل صف يضم المحطات الخمس مع مؤشر متحرك يوجهه المعلم أو طالب مناوب.</p>
                <div className="tool-benefit">
                  <i className="fas fa-check"></i> العائد: إزالة القلق وتوفير مرجع مرئي مستقر لذوي صعوبات التركيز.
                </div>
              </div>

              <div className="tool-box-card">
                <div className="tool-box-header">
                  <span className="tool-number">02</span>
                  <h4>ختم وخانة "زوّادتي" في الدفتر</h4>
                  <small>חותמת / משבצת "צידת הדרך"</small>
                </div>
                <p>مساحة محددة ومطبوعة في ترويسة أو ذيل صفحة دفتر الطالب يوثق فيها المصطلح الجديد وسياق توظيفه المستقبلي بسطرين فقط.</p>
                <div className="tool-benefit">
                  <i className="fas fa-check"></i> العائد: ترسيخ نقل أثر التعلم وتوفير مرجع ملموس للمراجعة الذاتية والتواصل مع أولياء الأمور.
                </div>
              </div>

              <div className="tool-box-card">
                <div className="tool-box-header">
                  <span className="tool-number">03</span>
                  <h4>بنك الجذب والتشويق المدرسي</h4>
                  <small>בנק משיכה בית-ספרי משותף</small>
                </div>
                <p>مجلد سحابي وبنك إلكتروني تشاركي مقسم حسب التخصصات والمراحل يرفع فيه معلمو مشيرفة ألغازاً وتحديات يومية وفيديوهات ملهمة.</p>
                <div className="tool-benefit">
                  <i className="fas fa-check"></i> العائد: تخفيف العبء التخطيطي عن المعلمين وتبادل أفضل الممارسات الميدانية المتميزة.
                </div>
              </div>

              <div className="tool-box-card">
                <div className="tool-box-header">
                  <span className="tool-number">04</span>
                  <h4>بطاقة المشاهدة الصامتة</h4>
                  <small>מחוון צפייה ממוקד מודל</small>
                </div>
                <p>أداة تقييمية مهنية للمدير والمشرفين ومركزي المواضيع لمتابعة الدروس ترتكز على محطات الموديل الخمس بدلاً من الملاحظات الإنشائية العشوائية.</p>
                <div className="tool-benefit">
                  <i className="fas fa-check"></i> العائد: توحيد لغة التقويم والحوار المهني في جلسات التغذية الراجعة والتطوير المستمر.
                </div>
              </div>

            </div>

            {/* Interactive Digital Exit Ticket Tool (تذكرة الخروج التفاعلية) */}
            <div className="exit-ticket-simulator-card">
              <div className="simulator-header">
                <div className="sim-icon"><i className="fas fa-ticket-alt"></i></div>
                <div>
                  <h3>مُوَلِّد بطاقة "تذكرة الخروج وزوّادتي" الرقمية</h3>
                  <p>جرّب إصدار بطاقة الزوّادة اليومية للطالب لطباعتها أو حفظها في ملف إنجازه:</p>
                </div>
              </div>

              <div className="simulator-body-grid">
                <div className="ticket-form">
                  <div className="form-group-row">
                    <div className="form-field">
                      <label>اسم الطالب:</label>
                      <input 
                        type="text" 
                        placeholder="مثال: يوسف إغبارية"
                        value={ticketStudentName}
                        onChange={(e) => setTicketStudentName(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>الصف والشعبة:</label>
                      <input 
                        type="text" 
                        placeholder="مثال: الخامس (أ)"
                        value={ticketClass}
                        onChange={(e) => setTicketClass(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>1. ما هو المصطلح أو المهارة التي تزودت بها اليوم؟</label>
                    <input 
                      type="text" 
                      placeholder="مثال: مفهوم التمايز وقوانين حساب مساحة المثلث"
                      value={ticketLearnedTerm}
                      onChange={(e) => setTicketLearnedTerm(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label>2. أين وكيف سأوظف هذا الزاد في حياتي أو دراستي القادمة؟</label>
                    <textarea 
                      rows="2"
                      placeholder="مثال: سأساعد أخي الصغير في تقسيم أرضية الحديقة الهندسية وسأستخدم القانون في ورشة الفنون غداً"
                      value={ticketApplicationContext}
                      onChange={(e) => setTicketApplicationContext(e.target.value)}
                    ></textarea>
                  </div>

                  <button 
                    className="generate-ticket-btn"
                    onClick={() => {
                      if (!ticketStudentName.trim() || !ticketLearnedTerm.trim()) {
                        alert('يرجى إدخال اسم الطالب والمصطلح المتعلم على الأقل.');
                        return;
                      }
                      setTicketGenerated(true);
                    }}
                  >
                    <i className="fas fa-stamp"></i> خَتْم وإصدار بطاقة الزوّادة الذهبية
                  </button>
                </div>

                {/* Live Ticket Preview */}
                <div className="ticket-preview-wrapper">
                  <div className={`printed-ticket-badge ${ticketGenerated ? 'stamped' : ''}`}>
                    <div className="ticket-school-header">
                      <span>مدرسة مشيرفة الابتدائية</span>
                      <span className="gold-key-icon">🗝️ زوّادتي (צידת הדרך)</span>
                    </div>

                    <div className="ticket-student-info">
                      <strong>الطالب:</strong> {ticketStudentName || '....................'} | <strong>الصف:</strong> {ticketClass || '.....'}
                    </div>

                    <div className="ticket-q-block">
                      <div className="ticket-q-title"><i className="fas fa-gem"></i> ما تزودتُ به اليوم:</div>
                      <div className="ticket-q-answer">{ticketLearnedTerm || 'المفهوم أو المصطلح المكتسب في الحصة...'}</div>
                    </div>

                    <div className="ticket-q-block">
                      <div className="ticket-q-title"><i className="fas fa-compass"></i> توظيفي الحياتي للزاد:</div>
                      <div className="ticket-q-answer">{ticketApplicationContext || 'كيف وأين سأوظف هذه المعرفة في غدي...'}</div>
                    </div>

                    <div className="ticket-stamp-mark">
                      <span className="seal-text">مُعْتَمَد</span>
                      <small>موديل مفاتيح</small>
                    </div>

                    {ticketGenerated && (
                      <div className="ticket-actions">
                        <button className="print-ticket-btn" onClick={handlePrint}>
                          <i className="fas fa-print"></i> طباعة البطاقة
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: INTERACTIVE LESSON BUILDER / PLANNER */}
        {/* ========================================================================= */}
        {activeTab === 'planner' && (
          <section className="planner-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-laptop-code"></i> أداة المعلم الذكية
              </div>
              <h2>مُخَطِّط ومُوَلِّد دروس "مَفَاتِيح" التفاعلي</h2>
              <p>
                صمم خطة درسك النموذجية وفق المحطات الخمس بضغطة زر، واطبع بطاقة التخطيط الجاهزة للمشاهدة الصفية أو التحضير اليومي:
              </p>
            </div>

            <div className="planner-builder-grid">
              {/* Form Input Column */}
              <div className="planner-form-card">
                <h3><i className="fas fa-sliders-h"></i> معطيات الدرس الأساسية</h3>
                
                <div className="form-group-row">
                  <div className="form-field">
                    <label>المادة الدراسية:</label>
                    <input 
                      type="text" 
                      value={plannerSubject}
                      onChange={(e) => setPlannerSubject(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>الصف والمستوى:</label>
                    <input 
                      type="text" 
                      value={plannerGrade}
                      onChange={(e) => setPlannerGrade(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>عنوان وموضوع الدرس المركزي:</label>
                  <input 
                    type="text" 
                    value={plannerTitle}
                    onChange={(e) => setPlannerTitle(e.target.value)}
                  />
                </div>

                <div className="planner-stations-inputs">
                  <h4><i className="fas fa-key"></i> محطات الدرس الخمس:</h4>
                  
                  <div className="station-input-group yellow">
                    <label><span className="mini-badge">م</span> 1. الجذب والتشويق (اللغز أو الاستثارة):</label>
                    <textarea 
                      rows="2"
                      value={plannerStations.m}
                      onChange={(e) => setPlannerStations({ ...plannerStations, m: e.target.value })}
                    />
                  </div>

                  <div className="station-input-group cyan">
                    <label><span className="mini-badge">ف</span> 2. فهم المفهوم واللقاء الأول (المصطلحات ونمذجة المعلم):</label>
                    <textarea 
                      rows="2"
                      value={plannerStations.f}
                      onChange={(e) => setPlannerStations({ ...plannerStations, f: e.target.value })}
                    />
                  </div>

                  <div className="station-input-group purple">
                    <label><span className="mini-badge">ت</span> 3. التبصر والتعمق (السؤال السقراطي والتفكير الناقد):</label>
                    <textarea 
                      rows="2"
                      value={plannerStations.t}
                      onChange={(e) => setPlannerStations({ ...plannerStations, t: e.target.value })}
                    />
                  </div>

                  <div className="station-input-group green">
                    <label><span className="mini-badge">ي</span> 4. يدوي وتطبيق (المهمة التمايزية والورشة):</label>
                    <textarea 
                      rows="2"
                      value={plannerStations.y}
                      onChange={(e) => setPlannerStations({ ...plannerStations, y: e.target.value })}
                    />
                  </div>

                  <div className="station-input-group pink">
                    <label><span className="mini-badge">ح</span> 5. الحصاد والزوّادة (تذكرة الخروج ونقل الأثر):</label>
                    <textarea 
                      rows="2"
                      value={plannerStations.h}
                      onChange={(e) => setPlannerStations({ ...plannerStations, h: e.target.value })}
                    />
                  </div>
                </div>

                <div className="planner-quick-templates">
                  <span>نماذج سريعة جاهزة:</span>
                  <button 
                    type="button"
                    onClick={() => {
                      setPlannerSubject('رياضيات');
                      setPlannerGrade('الصف الرابع');
                      setPlannerTitle('مساحة المستطيل والمربع');
                      setPlannerStations({
                        m: 'تحدٍ سريع: قطعتان من السجاد إحداهما طويلة والأخرى مربعة؛ أيهما تحتاج بلاطاً أكثر لتغطية الأرضية؟',
                        f: 'تفكيك قانون المساحة (الطول × العرض) عبر شبكة المربعات ونمذجة المعلم لحساب مساحة مستطيل.',
                        t: 'سؤال تعمق: لو ضاعفنا طول المستطيل فقط، فكم مرة ستتضاعف المساحة؟ برر تفكيرك هندسياً.',
                        y: 'ورشة ثنائية: قياس أسطح الطاولات والدفاتر وحساب مساحتها بوحدات سم المربعة مع بطاقة مساعدة للطلاب المتعثرين.',
                        h: 'زوّادتي: حساب المساحة بالضرب؛ وتطبيقي: سأحسب مساحة غرفتي لمساعدة والدي في شراء ورق جدران مناسب.'
                      });
                    }}
                  >
                    نموذج رياضيات
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setPlannerSubject('علوم وتكنولوجيا');
                      setPlannerGrade('الصف السادس');
                      setPlannerTitle('الدارات الكهربائية البسيطة والموصولية');
                      setPlannerStations({
                        m: 'مفاجأة: مصباح يضيء عند لمس مفتاح معدني وينطفئ عند لمس ممحاة مطاطية؛ ما السر الخفي؟',
                        f: 'تعريف الدارة الكهربائية والمواد الموصلة والعازلة، ورسم المخطط العلمي للدارة على اللوح.',
                        t: 'نقاش تفكير عليا: لماذا تُصنع أسلاك الكهرباء في بيوتنا من النحاس ولكنها تُغلف بالبلاستيك دائماً؟',
                        y: 'مجموعات عمل: تركيب دارة كهربائية حقيقية واختبار 5 مواد من حقيبة الصف لتصنيفها موصلة أو عازلة.',
                        h: 'زوّادتي: مفهوم العزل والأمان الكهربائي؛ وتطبيقي: سأفحص شواحن الهواتف في بيتنا للتأكد من سلامة عزلها.'
                      });
                    }}
                  >
                    نموذج علوم
                  </button>
                </div>
              </div>

              {/* Printable Lesson Plan Preview */}
              <div className="planner-preview-card printable-sheet">
                <div className="sheet-header">
                  <div className="school-brand">
                    <h4>مدرسة مشيرفة الابتدائية</h4>
                    <small>خطة درس نموذجية — موديل مَفَاتِيح (מודל מַפְתֵּ"חַ)</small>
                  </div>
                  <button className="print-sheet-btn" onClick={handlePrint}>
                    <i className="fas fa-print"></i> طباعة / تصدير PDF
                  </button>
                </div>

                <div className="sheet-meta-grid">
                  <div><strong>المادة:</strong> {plannerSubject}</div>
                  <div><strong>الصف:</strong> {plannerGrade}</div>
                  <div className="full-width"><strong>موضوع الدرس:</strong> {plannerTitle}</div>
                </div>

                <div className="sheet-stations-timeline">
                  <div className="sheet-station-row">
                    <span className="row-badge yellow">[ م ] جَذْب</span>
                    <div className="row-text">{plannerStations.m}</div>
                  </div>

                  <div className="sheet-station-row">
                    <span className="row-badge cyan">[ ف ] فَهْم</span>
                    <div className="row-text">{plannerStations.f}</div>
                  </div>

                  <div className="sheet-station-row">
                    <span className="row-badge purple">[ ت ] تَبَصُّر</span>
                    <div className="row-text">{plannerStations.t}</div>
                  </div>

                  <div className="sheet-station-row">
                    <span className="row-badge green">[ ي ] يَدَوِيّ</span>
                    <div className="row-text">{plannerStations.y}</div>
                  </div>

                  <div className="sheet-station-row">
                    <span className="row-badge pink">[ ح ] حَصَاد</span>
                    <div className="row-text">{plannerStations.h}</div>
                  </div>
                </div>

                <div className="sheet-footer-sign">
                  <div>توقيع المربي/المعلم: ........................</div>
                  <div>مصادقة الإدارة / المركز: ........................</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: OBSERVATION RUBRIC (بطاقة المشاهدة الصامتة مחוון) */}
        {/* ========================================================================= */}
        {activeTab === 'rubric' && (
          <section className="rubric-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-clipboard-list"></i> أداة الإدارة والتوجيه المهني
              </div>
              <h2>بطاقة المشاهدة الصفية المركزة (מַחְוָון צְפִיָּה)</h2>
              <p>
                أداة قياس موحدة للإدارة والمشرفين ومركزي المواضيع لملاحظة الحصة وتقديم التغذية الراجعة المهنية البناءة ارتكازاً على المحطات الخمس:
              </p>
            </div>

            <div className="rubric-builder-wrapper">
              <div className="rubric-controls-card">
                <div className="form-group-row">
                  <div className="form-field">
                    <label>اسم المعلم الملاحَظ:</label>
                    <input 
                      type="text" 
                      placeholder="اسم المعلم/المربية"
                      value={rubricTeacherName}
                      onChange={(e) => setRubricTeacherName(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>المبحث / الموضوع:</label>
                    <input 
                      type="text" 
                      value={rubricSubject}
                      onChange={(e) => setRubricSubject(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>الصف:</label>
                    <input 
                      type="text" 
                      value={rubricClass}
                      onChange={(e) => setRubricClass(e.target.value)}
                    />
                  </div>
                </div>

                {/* 5 Evaluation Criteria */}
                <div className="rubric-criteria-list">
                  
                  <div className="criteria-item">
                    <div className="criteria-info">
                      <span className="criteria-letter yellow">م</span>
                      <div>
                        <strong>1. محطة الجذب والتشويق (מְשִׁיכָה):</strong>
                        <p>هل أثار المعلم فضول الطلاب دون تقديم حلول؟ هل تم ربط المعرفة السابقة بالحالية بسلاسة؟</p>
                      </div>
                    </div>
                    <div className="rating-selector">
                      {[1, 2, 3, 4].map(score => (
                        <button 
                          key={score} 
                          type="button"
                          className={`score-btn ${rubricScores.m === score ? 'active' : ''}`}
                          onClick={() => setRubricScores({ ...rubricScores, m: score })}
                        >
                          {score === 1 && 'بحاجة لتطوير'}
                          {score === 2 && 'متوسط'}
                          {score === 3 && 'جيد جداً'}
                          {score === 4 && 'متميز'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-info">
                      <span className="criteria-letter cyan">ف</span>
                      <div>
                        <strong>2. محطة فهم المفهوم (פְּגִישָׁה):</strong>
                        <p>هل تم تفكيك المصطلحات بدقة وبناء القاموس اللغوي؟ هل كانت نمذجة المعلم للمفهوم واضحة؟</p>
                      </div>
                    </div>
                    <div className="rating-selector">
                      {[1, 2, 3, 4].map(score => (
                        <button 
                          key={score} 
                          type="button"
                          className={`score-btn ${rubricScores.f === score ? 'active' : ''}`}
                          onClick={() => setRubricScores({ ...rubricScores, f: score })}
                        >
                          {score === 1 && 'بحاجة لتطوير'}
                          {score === 2 && 'متوسط'}
                          {score === 3 && 'جيد جداً'}
                          {score === 4 && 'متميز'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-info">
                      <span className="criteria-letter purple">ت</span>
                      <div>
                        <strong>3. محطة التبصر والتعمق (תְּבוּנָה):</strong>
                        <p>هل طرح المعلم أسئلة تفكير عليا (HOTS)؟ هل أتاح للطلاب مساحة للتحليل وصياغة استنتاجاتهم الذاتية؟</p>
                      </div>
                    </div>
                    <div className="rating-selector">
                      {[1, 2, 3, 4].map(score => (
                        <button 
                          key={score} 
                          type="button"
                          className={`score-btn ${rubricScores.t === score ? 'active' : ''}`}
                          onClick={() => setRubricScores({ ...rubricScores, t: score })}
                        >
                          {score === 1 && 'بحاجة لتطوير'}
                          {score === 2 && 'متوسط'}
                          {score === 3 && 'جيد جداً'}
                          {score === 4 && 'متميز'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-info">
                      <span className="criteria-letter green">ي</span>
                      <div>
                        <strong>4. محطة التطبيق اليدوي والورشة (יִשּׂוּם):</strong>
                        <p>هل تنوعت الأنشطة لمراعاة الفروق الفردية (UDL)؟ هل قدم المعلم تغذية راجعة فورية للطلاب؟</p>
                      </div>
                    </div>
                    <div className="rating-selector">
                      {[1, 2, 3, 4].map(score => (
                        <button 
                          key={score} 
                          type="button"
                          className={`score-btn ${rubricScores.y === score ? 'active' : ''}`}
                          onClick={() => setRubricScores({ ...rubricScores, y: score })}
                        >
                          {score === 1 && 'بحاجة لتطوير'}
                          {score === 2 && 'متوسط'}
                          {score === 3 && 'جيد جداً'}
                          {score === 4 && 'متميز'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-info">
                      <span className="criteria-letter pink">ح</span>
                      <div>
                        <strong>5. محطة الحصاد والزوّادة (חֲתִימָה וְצֵידָה):</strong>
                        <p>هل تم استخراج "الزوّادة" بوعي ميتا-معرفي؟ هل وثق الطلاب خطة لنقل أثر التعلم للحياة اليومية؟</p>
                      </div>
                    </div>
                    <div className="rating-selector">
                      {[1, 2, 3, 4].map(score => (
                        <button 
                          key={score} 
                          type="button"
                          className={`score-btn ${rubricScores.h === score ? 'active' : ''}`}
                          onClick={() => setRubricScores({ ...rubricScores, h: score })}
                        >
                          {score === 1 && 'بحاجة لتطوير'}
                          {score === 2 && 'متوسط'}
                          {score === 3 && 'جيد جداً'}
                          {score === 4 && 'متميز'}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="form-field" style={{ marginTop: '1.5rem' }}>
                  <label>ملاحظات نوعية وتوصيات التطوير المهني المشترك:</label>
                  <textarea 
                    rows="3"
                    placeholder="سجل هنا نقاط القوة البارزة وتوصية مهنية واحدة للارتقاء بالحصة القادمة..."
                    value={rubricNotes}
                    onChange={(e) => setRubricNotes(e.target.value)}
                  />
                </div>

                <button 
                  className="generate-rubric-btn"
                  onClick={() => setRubricGenerated(true)}
                >
                  <i className="fas fa-file-contract"></i> إصدار وثيقة التغذية الراجعة المهنية
                </button>
              </div>

              {/* Rendered Feedback Card */}
              {rubricGenerated && (
                <div className="feedback-output-card printable-sheet">
                  <div className="sheet-header">
                    <div>
                      <h4>وثيقة التغذية الراجعة للمشاهدة الصفية</h4>
                      <small>مدرسة مشيرفة الابتدائية — وحدة التطوير والإرشاد التربوي</small>
                    </div>
                    <button className="print-sheet-btn" onClick={handlePrint}>
                      <i className="fas fa-print"></i> طباعة الوثيقة
                    </button>
                  </div>

                  <div className="feedback-meta-line">
                    <span><strong>المعلم الملاحَظ:</strong> {rubricTeacherName || 'المعلم الفاضل'}</span>
                    <span><strong>المادة:</strong> {rubricSubject}</span>
                    <span><strong>الصف:</strong> {rubricClass}</span>
                    <span><strong>التاريخ:</strong> {new Date().toLocaleDateString('ar-EG')}</span>
                  </div>

                  <div className="rubric-summary-scores">
                    <div className="score-summary-pill yellow">
                      <span>الجذب [ م ]</span>
                      <strong>{rubricScores.m} / 4</strong>
                    </div>
                    <div className="score-summary-pill cyan">
                      <span>الفهم [ ف ]</span>
                      <strong>{rubricScores.f} / 4</strong>
                    </div>
                    <div className="score-summary-pill purple">
                      <span>التبصر [ ت ]</span>
                      <strong>{rubricScores.t} / 4</strong>
                    </div>
                    <div className="score-summary-pill green">
                      <span>التطبيق [ ي ]</span>
                      <strong>{rubricScores.y} / 4</strong>
                    </div>
                    <div className="score-summary-pill pink">
                      <span>الزوّادة [ ح ]</span>
                      <strong>{rubricScores.h} / 4</strong>
                    </div>
                  </div>

                  <div className="feedback-notes-block">
                    <h5><i className="fas fa-comment-dots"></i> التغذية الراجعة النوعية:</h5>
                    <p>{rubricNotes || 'تمت المشاهدة بنجاح مع الالتزام بروح موديل مفاتيح ورسم مسار الحصة المتناغم.'}</p>
                  </div>

                  <div className="sheet-footer-sign">
                    <div>توقيع المشاهد / المشرف: ........................</div>
                    <div>توقيع المعلم: ........................</div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: VISION, ADVANTAGES & CHALLENGES */}
        {/* ========================================================================= */}
        {activeTab === 'vision' && (
          <section className="vision-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-seedling"></i> الفلسفة والرؤية التنظيمية
              </div>
              <h2>منطلق الموديل، مزاياه، وتحديات التطبيق الميداني</h2>
              <p>
                الأساس التربوي والمنظومي لموديل "مَفَاتِيح"، والبوصلة التي تضمن تطبيقه بمرونة دون الوقوع في الجمود:
              </p>
            </div>

            {/* Core Rationale Grid */}
            <div className="vision-cards-grid">
              
              <div className="vision-card">
                <div className="v-card-icon"><i className="fas fa-users-cog"></i></div>
                <h3>أ. سياق الفكرة والحاجة التنظيمية</h3>
                <p>
                  تعاني المدارس من غياب لغة تربوية مشتركة؛ إذ يخطط كل معلم درسه بأسلوب فردي معزول. هذا التشتت يربك المعلمين الجدد، ويولد عبئاً ذهنياً لدى الطلاب لتنقلهم بين بيئات متضاربة يومياً.
                </p>
                <div className="v-points">
                  <div><strong>للمعلم:</strong> خريطة طريق واضحة لإعداد الدروس وتنفيذها دون هدر زمني.</div>
                  <div><strong>للطالب:</strong> بيئة متوقعة ومستقرة يفهم فيها سياق الحصة وما هو مطلوب منه.</div>
                  <div><strong>للإدارة:</strong> أداة قياس موحدة للملاحظة الصفية وتقديم التغذية الراجعة المهنية.</div>
                </div>
              </div>

              <div className="vision-card">
                <div className="v-card-icon"><i className="fas fa-hiking"></i></div>
                <h3>ب. فلسفة الموديل: من التلقين إلى "الزوّادة"</h3>
                <p>
                  المفتاح رمز يفتح به المتعلم أبواب الفهم والتفكير. الركيزة المحورية هي أن الحصة <strong>لا تنتهي برنين الجرس</strong> أو بحل تمرين، بل بامتلاك المتعلم <strong>"الزوّادة" (צידת הדרך)</strong>؛ وهي الحصيلة المعرفية والمفاهيمية التي يحملها الطالب معه ليوظفها في حياته ومستقبله الأكاديمي محققاً مبدأ <strong>نقل أثر التعلم (Transfer of Learning)</strong>.
                </p>
              </div>

            </div>

            {/* Advantages vs Challenges Grid */}
            <div className="pros-cons-grid">
              
              <div className="pros-card">
                <div className="pc-header">
                  <i className="fas fa-star"></i> المزايا الأساسية للموديل
                </div>
                <ul className="pc-list">
                  <li>
                    <strong>سهولة الحفظ والتطبيق:</strong> يشكل اسم "مَفَاتِيح" رابطاً دلالياً بين الاسم وفتح آفاق المعرفة.
                  </li>
                  <li>
                    <strong>الشمولية الأكاديمية:</strong> نموذج ملائم لكافة التخصصات (لغات، علوم، رياضيات، فنون، علوم اجتماعية).
                  </li>
                  <li>
                    <strong>التحفيز على نقل الأثر:</strong> يرسخ قيمة المنفعة الحياتية من المواد المدرسية بدلاً من اعتبارها مجرد مواد للاختبار.
                  </li>
                  <li>
                    <strong>الاستقرار العاطفي:</strong> يوفر مساراً توقعياً واضحاً يريح الطلاب ويقلل التوتر الصفي.
                  </li>
                </ul>
              </div>

              <div className="cons-card">
                <div className="pc-header">
                  <i className="fas fa-exclamation-triangle"></i> التحديات ومحاذير الاستخدام (كيف نتجنبها؟)
                </div>
                <ul className="pc-list">
                  <li>
                    <strong>فخ القالب المتصلب (נוקשות מחשבתית):</strong> الحذر من إجبار المعلمين على إنهاء كل المحطات قسراً في كل حصة 45 دقيقة؛ بل يجب منحهم المرونة لتمديد الموديل على حصة مضاعفة أو وحدة لعدة أيام.
                  </li>
                  <li>
                    <strong>الاستسهال في محطة التبصر:</strong> الميل أحياناً لتخطي الحوار المعمق والتفكير النقدي والانتقال سريعاً لحل التمارين لضيق الوقت؛ يجب صون مساحة التبصر بحزم.
                  </li>
                  <li>
                    <strong>تحول "الزوّادة" إلى عبء روتيني:</strong> إذا طُلب من الطالب كتابة فقرات طويلة ومعقدة عند نهاية كل حصة، سيفقد الأمر معناه؛ لذا يجب أن تكون الزوّادة محددة، مباشرة، ومختصرة (سطرين فقط).
                  </li>
                </ul>
              </div>

            </div>
          </section>
        )}

      </main>

      {/* 4. FOOTER CALLOUT */}
      <footer className="mafatih-page-footer">
        <div className="container footer-box">
          <div className="footer-keys-logo">
            <span className="key-icon">🗝️</span>
            <div>
              <h3>مدرسة مشيرفة الابتدائية — نحو تعليم ذي معنى وأثر مستدام</h3>
              <p>موديل "مَفَاتِيح" (مودل מַפְתֵּ"חַ) هو إطارنا التربوي الموحد لتمكين كل معلم، واحتواء كل طالب، وبناء الزوّادة للحياة.</p>
            </div>
          </div>
          <div className="footer-actions">
            <button className="back-home-btn" onClick={() => window.location.hash = ''}>
              <i className="fas fa-home"></i> العودة للبوابة الرئيسية
            </button>
          </div>
        </div>
      </footer>

      {/* 5. FLOATING INTERACTIVE ROBOT ASSISTANT BUTTON */}
      <div 
        className="floating-robot-trigger"
        onClick={() => setIsRobotModalOpen(true)}
        title="اسأل رفيق مفاتيح الذكي"
      >
        <LottieRobot width="75px" height="75px" className="float-mini-robot" />
        <span className="float-robot-label">
          <span className="float-pulse-dot"></span>
          اسألني عن مفاتيح!
        </span>
      </div>

      {/* 6. ROBOT INTERACTIVE DIALOG MODAL */}
      {isRobotModalOpen && (
        <div className="robot-modal-overlay" onClick={() => setIsRobotModalOpen(false)}>
          <div className="robot-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="robot-modal-header">
              <div className="robot-modal-avatar">
                <LottieRobot width="70px" height="70px" />
              </div>
              <div className="robot-modal-title-wrap">
                <h3>رفيق مفاتيح التربوي الذكي 🗝️🤖</h3>
                <p>مساعدك الميداني لصياغة وتطبيق المحطات الخمس وحصد الزوّادة</p>
              </div>
              <button 
                className="robot-modal-close"
                onClick={() => setIsRobotModalOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="robot-modal-body">
              {/* Robot Speech Display */}
              <div className="robot-speech-display">
                <div className="robot-speech-header">
                  <span className="robot-badge-tag"><i className="fas fa-comment-dots"></i> إرشادات الروبوت:</span>
                  <button 
                    type="button"
                    className={`robot-voice-read-btn ${isVoiceSpeaking ? 'speaking' : ''}`}
                    onClick={() => speakArabic(robotReply)}
                  >
                    <i className={`fas ${isVoiceSpeaking ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
                    {isVoiceSpeaking ? 'إيقاف الصوت' : 'استمع بالصوت العربي'}
                  </button>
                </div>
                <p className="robot-speech-text">{robotReply}</p>
              </div>

              {/* Quick Questions Chips */}
              <div className="robot-quick-topics">
                <span className="topics-label">اسألني بسرعة عن أي محطة أو أداة:</span>
                <div className="topics-chips-grid">
                  <button 
                    type="button" 
                    className="topic-chip yellow"
                    onClick={() => handleAskRobot('جذب وتشويق')}
                  >
                    🧲 سر محطة الجذب
                  </button>
                  <button 
                    type="button" 
                    className="topic-chip cyan"
                    onClick={() => handleAskRobot('فهم وتفكيك المفهوم')}
                  >
                    💡 نمذجة المفهوم
                  </button>
                  <button 
                    type="button" 
                    className="topic-chip purple"
                    onClick={() => handleAskRobot('تبصر وتفكير عليا')}
                  >
                    🧠 أسئلة التفكير العليا
                  </button>
                  <button 
                    type="button" 
                    className="topic-chip green"
                    onClick={() => handleAskRobot('تطبيق وتمايز udl')}
                  >
                    🛠️ ورشة التمايز UDL
                  </button>
                  <button 
                    type="button" 
                    className="topic-chip pink"
                    onClick={() => handleAskRobot('حصاد وزوادة ونقل الأثر')}
                  >
                    🎒 الزوّادة ونقل الأثر
                  </button>
                  <button 
                    type="button" 
                    className="topic-chip slate"
                    onClick={() => handleAskRobot('توزيع مسطرة الحصة')}
                  >
                    ⏱️ مسطرة الحصة والوقت
                  </button>
                </div>
              </div>

              {/* Custom Input Query */}
              <div className="robot-query-input-bar">
                <input 
                  type="text"
                  placeholder="اكتب استفسارك هنا (مثال: كيف أدمج طلاب صعوبات التعلم؟)..."
                  value={robotChatInput}
                  onChange={(e) => setRobotChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAskRobot();
                  }}
                />
                <button 
                  type="button"
                  className="robot-query-send-btn"
                  onClick={() => handleAskRobot()}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MafatihPedagogyPage;
