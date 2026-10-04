import React, { useState, useEffect, useRef } from 'react';
import './MafatihTeacherCompanion.css';

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
// 2. ENERGIZER BREAK SPECIFICATION (سيناريو مفتاح التجديد المعتمد)
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
// 3. STUDENT KEYS (مفاتيح الطلاب الخمسة في وضع شاشة الصف)
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

  // Lessons store
  const [lessons, setLessons] = useState(INITIAL_LESSONS_STORE);
  const [activeLessonId, setActiveLessonId] = useState('lesson_states_of_matter');

  // Active Lesson Object
  const currentLesson = lessons.find(l => l.id === activeLessonId) || lessons[0];

  // Active Station Key in Backstage: 'm' | 'f' | 't' | 'a' | 'h'
  const [activeStationKey, setActiveStationKey] = useState('m');

  // Elapsed Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Screen 4 & 6: Content Currently Displayed on Student Projector Screen
  // Rule: Moving in backstage does NOT change student screen until teacher clicks "اعرض للطلاب"
  const [publicDisplayState, setPublicDisplayState] = useState({
    lessonTitle: currentLesson.title,
    objective: currentLesson.objective,
    stationKey: 'm',
    stationLetter: 'م',
    stationName: 'مشوّق ومحفّز',
    studentPhrase: 'أتساءل وأستعد',
    headline: currentLesson.stations.m.studentDisplayPrompt,
    isDisplayHidden: false,
    activeEnergizer: null,
    activeHint: null,
    timerSeconds: 5 * 60,
    allowedStudentKeys: ['need_clarify', 'need_hint', 'need_example', 'ready_challenge', 'need_energizer']
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

  // Explicit Teacher Action: "اعرض للطلاب"
  const handleTeacherApproveDisplay = () => {
    const activeSt = currentLesson.stations[activeStationKey];
    if (!activeSt) return;
    const newState = {
      ...publicDisplayState,
      stationKey: activeStationKey,
      stationLetter: activeSt.letter,
      stationName: activeSt.name,
      studentPhrase: activeSt.studentPhrase,
      headline: activeSt.studentDisplayPrompt,
      isDisplayHidden: false,
      activeEnergizer: null,
      activeHint: null
    };
    broadcastToStudentScreen(newState);
    showToast(`تم تحديث شاشة الطلاب: محطة [${activeSt.name}] معروضة الآن 📤`);
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
              onClick={() => setCurrentScreen('screen2_prep_context')}
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
                </div>

                <h4 className="lesson-card-title">{lsn.title}</h4>
                <div className="lesson-card-info-row">
                  <span><i className="fas fa-graduation-cap"></i> {lsn.grade}</span>
                  <span><i className="fas fa-clock"></i> {lsn.duration} دقيقة</span>
                  <span><i className="fas fa-users"></i> {lsn.studentCount} طالباً</span>
                </div>

                <div className="lesson-card-objective-snippet">
                  <strong>الهدف:</strong> {lsn.objective}
                </div>

                <div className="lesson-card-actions-footer">
                  <button 
                    type="button" 
                    className="btn-action-start-lesson"
                    onClick={() => {
                      setActiveLessonId(lsn.id);
                      setCurrentScreen('screen4_backstage');
                      setIsTimerRunning(true);
                      showToast(`انطلقت حصة "${lsn.title}" في الكواليس! 🚀`);
                    }}
                  >
                    <i className="fas fa-play"></i> أبدأ الحصة 🚀
                  </button>
                  <button 
                    type="button" 
                    className="btn-action-edit-prep"
                    onClick={() => {
                      setActiveLessonId(lsn.id);
                      setCurrentScreen('screen2_prep_context');
                    }}
                  >
                    <i className="fas fa-edit"></i> أكمل التحضير
                  </button>
                  <button 
                    type="button" 
                    className="btn-action-review-bag"
                    onClick={() => {
                      setActiveLessonId(lsn.id);
                      setCurrentScreen('screen3_materials_bag');
                    }}
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
              <h3><i className="fas fa-clipboard-check"></i> أجهّز حصتي: سياق التعلم وظروف التنفيذ</h3>
              <p>خطوات التحضير المحكمة وفق معايير نموذج مِفتاح للحصة الفاعلة.</p>
            </div>
            <div className="header-actions-group">
              <button 
                type="button" 
                className="btn-secondary-action"
                onClick={() => setCurrentScreen('screen3_materials_bag')}
              >
                <i className="fas fa-arrow-left"></i> الانتقال لحقيبة المفاتيح
              </button>
              <button 
                type="button" 
                className="btn-primary-action"
                onClick={() => {
                  setCurrentScreen('screen4_backstage');
                  setIsTimerRunning(true);
                  showToast('تم اعتماد التحضير وبدء الحصة! 🚀');
                }}
              >
                <i className="fas fa-play"></i> اعتماد وبدء الحصة الآن
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
                  <div className="form-item">
                    <label>المادة الدراسية:</label>
                    <input type="text" defaultValue={currentLesson.subject} />
                  </div>
                  <div className="form-item">
                    <label>الصف والمستوى:</label>
                    <input type="text" defaultValue={currentLesson.grade} />
                  </div>
                  <div className="form-item">
                    <label>المدة بالدقائق:</label>
                    <input type="number" defaultValue={currentLesson.duration} />
                  </div>
                </div>

                <div className="form-item">
                  <label>موضوع وعنوان الحصة:</label>
                  <input type="text" defaultValue={currentLesson.title} />
                </div>

                <div className="form-item">
                  <label>هدف التعلّم المركزي:</label>
                  <textarea rows={2} defaultValue={currentLesson.objective} />
                </div>

                <div className="form-item">
                  <label>معيار النجاح (أداء صريح يكشف تحقق الهدف):</label>
                  <textarea rows={2} defaultValue={currentLesson.successCriteria} />
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
                  <textarea rows={2} defaultValue={currentLesson.prerequisites} />
                </div>

                <div className="fields-row-2">
                  <div className="form-item">
                    <label>عدد الطلاب:</label>
                    <input type="number" defaultValue={currentLesson.studentCount} />
                  </div>
                  <div className="form-item">
                    <label>تجهيز شاشات العرض:</label>
                    <select defaultValue={currentLesson.displayMode}>
                      <option value="single_screen">شاشة صف واحدة (الوضع الأساسي)</option>
                      <option value="student_devices">أجهزة فردية للطلاب + شاشة صف</option>
                    </select>
                  </div>
                </div>

                <div className="form-item">
                  <label>الموارد والمساحة المتاحة:</label>
                  <input type="text" defaultValue={currentLesson.resources} />
                </div>

                <div className="form-item">
                  <label>حواجز المشاركة الملحوظة (دون بيانات تعريفية):</label>
                  <textarea rows={2} defaultValue={currentLesson.participationBarriers} />
                </div>
              </div>
            </div>

            {/* Step 3: Five Stations Plan Overview */}
            <div className="prep-step-card">
              <div className="step-card-head">
                <span className="step-number-circle">٣</span>
                <h4>خطة المحطات الخمس المترابطة</h4>
              </div>
              <div className="stations-accordion-list">
                {Object.keys(currentLesson.stations).map((k) => {
                  const st = currentLesson.stations[k];
                  return (
                    <div key={k} className="station-prep-row">
                      <div className="st-prep-header">
                        <span className={`st-prep-badge letter-${k}`}>{st.letter}</span>
                        <div>
                          <strong>{st.name} ({st.durationMinutes} د)</strong>
                          <small>«{st.studentPhrase}» — {st.studentQuestion}</small>
                        </div>
                      </div>
                      <div className="st-prep-content-box">
                        <div className="content-line"><strong>المهمة المعروضة:</strong> {st.studentDisplayPrompt}</div>
                        <div className="content-line"><strong>إجراء المعلم:</strong> {st.teacherNotes}</div>
                        <div className="content-line scaffold"><strong>سقالة الدعم:</strong> {st.scaffolds}</div>
                      </div>
                    </div>
                  );
                })}
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
              <h3><i className="fas fa-briefcase"></i> حقيبة المفاتيح والمواد المعتمدة</h3>
              <p>معاينة مواد الدعم والتدخل وتأكيد جاهزية الحصة قبل دخول الصف.</p>
            </div>
            <div className="header-actions-group">
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
                onClick={() => {
                  setCurrentScreen('screen4_backstage');
                  setIsTimerRunning(true);
                  showToast('تم تأكيد الحقيبة وبدء الحصة! 🚀');
                }}
              >
                <i className="fas fa-play"></i> جاهز — أبدأ الحصة
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

              {/* Exact Live Preview of What Students See */}
              <div className="workspace-live-preview-box">
                <div className="preview-box-header">
                  <span className="preview-label">
                    <i className="fas fa-tv"></i> محاكاة شاشة الطلاب المعروضة حالياً:
                  </span>
                  {publicDisplayState.isDisplayHidden && (
                    <span className="hidden-warning-badge">⚠️ العرض مخفي مؤقتاً عن الطلاب</span>
                  )}
                </div>
                <div className="preview-box-screen">
                  <div className="preview-station-pin">
                    محطة {publicDisplayState.stationLetter} ({publicDisplayState.stationName}) • «{publicDisplayState.studentPhrase}»
                  </div>
                  <h4 className="preview-headline">{publicDisplayState.headline}</h4>
                  
                  {publicDisplayState.activeEnergizer && (
                    <div className="preview-energizer-banner">
                      <strong>⚡ {publicDisplayState.activeEnergizer.title}</strong>
                      <p>{publicDisplayState.activeEnergizer.studentDisplayPrompt}</p>
                    </div>
                  )}
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
            <div className="proj-timer-readout">
              <i className="fas fa-stopwatch"></i> {formatSeconds(publicDisplayState.timerSeconds)}
            </div>
          </div>

          {/* Student Screen Content Card */}
          <div className="student-view-main-card">
            {/* Goal & Criteria Banner (Always Visible on Student Screen) */}
            <div className="student-goal-header-bar">
              <div className="goal-row">
                <span className="goal-label">🎯 هدف التعلم:</span>
                <span className="goal-text">{publicDisplayState.objective}</span>
              </div>
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
                <div className="task-badge-tag">سؤال ومهمة المحطة:</div>
                <div className="student-main-prompt-text">
                  {publicDisplayState.headline.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>

                {/* Scaffold Hint Banner (if pushed) */}
                {publicDisplayState.activeHint && (
                  <div className="student-active-hint-card animate-pop">
                    <div className="hint-card-head">💡 تلميح ومساندة:</div>
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
    </div>
  );
};

export default MafatihTeacherCompanion;
