import React, { useState, useEffect, useRef } from 'react';
import { generateAiResponse } from '../utils/aiService';
import { arabicTTS } from '../utils/arabicTTS';
import { getStudentSession, logoutStudent, saveStudentSession } from '../utils/studentAuth';
import StudentAuthModal from './StudentAuthModal';
import GenieAssistant from './GenieAssistant';
import './ScientificResearchQuest.css';

// -------------------------------------------------------------
// Audio Sound Synthesizer via Web Audio API (Zero external assets)
// -------------------------------------------------------------
const playSound = (type = 'click') => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'success') {
      // Cheerful chime triad (C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.35);
      });
    } else if (type === 'badge') {
      // Fanfare celebratory chord
      const chords = [523.25, 659.25, 783.99, 987.77, 1046.50];
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.5);
      });
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // AudioContext blocked or not supported
  }
};

// -------------------------------------------------------------
// Robot Musheirifi Animated SVG Avatar Component
// -------------------------------------------------------------
const RobotMusheirifiAvatar = ({ expression = 'happy', isSpeaking = false }) => {
  return (
    <div className="quest-avatar-graphic-wrap">
      <svg className="quest-avatar-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Antenna Pole & Glowing Orb */}
        <line x1="100" y1="42" x2="100" y2="20" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
        <circle cx="100" cy="18" r="10" fill="#f59e0b" filter="url(#glowEffect)">
          <animate attributeName="r" values="9;12;9" dur="1.8s" repeatCount="indefinite" />
        </circle>

        {/* Robot Ears / Bolts */}
        <rect x="28" y="75" width="12" height="26" rx="5" fill="url(#metalGrad)" />
        <rect x="160" y="75" width="12" height="26" rx="5" fill="url(#metalGrad)" />

        {/* Robot Head Body */}
        <rect x="36" y="42" width="128" height="96" rx="28" fill="url(#bodyGrad)" stroke="#bae6fd" strokeWidth="3" />

        {/* Face Screen */}
        <rect x="48" y="55" width="104" height="70" rx="18" fill="url(#screenGrad)" stroke="#0ea5e9" strokeWidth="2" />

        {/* Cheerful Glowing Eyes */}
        {expression === 'thinking' ? (
          <>
            {/* Thinking / Questioning Eyes */}
            <circle cx="78" cy="85" r="9" fill="#38bdf8" filter="url(#glowEffect)" />
            <path d="M 115 80 Q 124 73 133 80" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" fill="none" filter="url(#glowEffect)" />
          </>
        ) : expression === 'celebrating' ? (
          <>
            {/* Happy Crescent Star Eyes */}
            <path d="M 68 88 Q 78 76 88 88" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" fill="none" filter="url(#glowEffect)">
              <animate attributeName="stroke" values="#f59e0b;#38bdf8;#f59e0b" dur="1.5s" repeatCount="indefinite" />
            </path>
            <path d="M 112 88 Q 122 76 132 88" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" fill="none" filter="url(#glowEffect)">
              <animate attributeName="stroke" values="#f59e0b;#38bdf8;#f59e0b" dur="1.5s" repeatCount="indefinite" />
            </path>
          </>
        ) : (
          <>
            {/* Default Big Wonder Eyes */}
            <circle cx="78" cy="84" r="10" fill="#38bdf8" filter="url(#glowEffect)">
              <animate attributeName="r" values="9.5;10.5;9.5" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="75" cy="81" r="3.5" fill="#ffffff" />
            <circle cx="122" cy="84" r="10" fill="#38bdf8" filter="url(#glowEffect)">
              <animate attributeName="r" values="9.5;10.5;9.5" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="119" cy="81" r="3.5" fill="#ffffff" />
          </>
        )}

        {/* Cute Robot Cheeks */}
        <circle cx="62" cy="98" r="5" fill="#f43f5e" opacity="0.6" />
        <circle cx="138" cy="98" r="5" fill="#f43f5e" opacity="0.6" />

        {/* Mouth (Dynamic if speaking) */}
        {isSpeaking ? (
          <ellipse cx="100" cy="106" rx="10" ry="7" fill="#38bdf8" filter="url(#glowEffect)">
            <animate attributeName="ry" values="4;8;4" dur="0.25s" repeatCount="indefinite" />
          </ellipse>
        ) : expression === 'celebrating' ? (
          <path d="M 88 103 Q 100 116 112 103" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" fill="none" filter="url(#glowEffect)" />
        ) : (
          <path d="M 90 105 Q 100 114 110 105" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#glowEffect)" />
        )}

        {/* Robot Neck & Chest Collar */}
        <rect x="88" y="138" width="24" height="12" rx="4" fill="url(#metalGrad)" />
        <path d="M 60 150 L 140 150 L 152 188 L 48 188 Z" fill="url(#bodyGrad)" stroke="#bae6fd" strokeWidth="2.5" />

        {/* Chest Screen Dial / Energy Meter */}
        <circle cx="100" cy="168" r="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="100" cy="168" r="5" fill="#f59e0b" filter="url(#glowEffect)">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
        </circle>

        {/* Friendly Waving Arm */}
        <path d="M 48 156 Q 24 140 28 120" stroke="url(#metalGrad)" strokeWidth="8" strokeLinecap="round" fill="none" />
        <circle cx="28" cy="116" r="8" fill="url(#bodyGrad)" />
        <path d="M 152 156 Q 176 160 178 178" stroke="url(#metalGrad)" strokeWidth="8" strokeLinecap="round" fill="none" />
        <circle cx="178" cy="182" r="8" fill="url(#bodyGrad)" />
      </svg>
    </div>
  );
};

// -------------------------------------------------------------
// Confetti Animation Canvas
// -------------------------------------------------------------
const ConfettiEffect = ({ active }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f59e0b', '#38bdf8', '#10b981', '#ec4899', '#a855f7', '#fbbf24'];
    const pieces = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.4 - 50,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 2 - 1,
      angle: Math.random() * 360,
      spin: Math.random() * 6 - 3
    }));

    let animationId;
    let frames = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      });

      frames++;
      if (frames < 240) {
        animationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="quest-confetti-canvas" />;
};

// -------------------------------------------------------------
// Main Component: ScientificResearchQuest
// -------------------------------------------------------------
const ScientificResearchQuest = () => {
  // Global Unified Session (Single Sign-On across entire school website)
  const [studentSession, setStudentSession] = useState(() => getStudentSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Personalization & Journey State
  const [studentName, setStudentName] = useState(() => {
    const sess = getStudentSession();
    if (sess && sess.fullName) return sess.fullName;
    return localStorage.getItem('school_unified_student_name') || 'مستكشفنا البطل';
  });
  const [studentClass, setStudentClass] = useState(() => {
    const sess = getStudentSession();
    if (sess && sess.studentClass) return sess.studentClass;
    return localStorage.getItem('school_unified_student_class') || 'الصف الخامس';
  });

  // Listen to global auth changes across the site
  useEffect(() => {
    const handleAuth = () => {
      const sess = getStudentSession();
      setStudentSession(sess);
      if (sess && sess.fullName) {
        setStudentName(sess.fullName);
        setStudentClass(sess.studentClass || 'الصف الخامس');
      }
    };
    window.addEventListener('studentAuthChanged', handleAuth);
    return () => window.removeEventListener('studentAuthChanged', handleAuth);
  }, []);

  // Active Station: 0 = Home, 1 = Station 1, 2 = Station 2, 3 = Station 3, 4 = Finale
  const [activeStation, setActiveStation] = useState(() => {
    const saved = localStorage.getItem('quest_active_station');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Unlocked Stations tracking
  const [unlockedStations, setUnlockedStations] = useState(() => {
    try {
      const saved = localStorage.getItem('quest_unlocked_stations');
      return saved ? JSON.parse(saved) : [1];
    } catch {
      return [1];
    }
  });

  // Badges state
  const [badges, setBadges] = useState(() => {
    try {
      const saved = localStorage.getItem('quest_badges');
      return saved ? JSON.parse(saved) : {
        curiosity: false,
        question: false,
        hypothesis: false,
        background: false,
        explorer: false
      };
    } catch {
      return { curiosity: false, question: false, hypothesis: false, background: false, explorer: false };
    }
  });

  // Confetti trigger
  const [showConfetti, setShowConfetti] = useState(false);

  // Text-To-Speech (TTS) State
  const [speakingText, setSpeakingText] = useState(null);

  // -----------------------------------------------------------
  // Station 1: Gatekeeper Quiz State (3 Questions)
  // -----------------------------------------------------------
  const QUIZ_QUESTIONS = [
    {
      id: 'q1',
      question: 'ما هو الهدف الأساسي والأجمل من البحث العلمي؟',
      options: [
        'فهم العالم وحل المشكلات وابتكار أشياء مفيدة لحياتنا 🌍💡',
        'حفظ المعلومات فقط دون تجربة أو تفكير',
        'إنهاء الواجب المدرسي بأسرع وقت ممكن'
      ],
      correct: 0,
      explanation: 'رائع جداً! البحث العلمي وُجد ليفسر ما حولنا ويبتكر حلولاً تجعل كوكبنا وحياتنا أفضل!'
    },
    {
      id: 'q2',
      question: 'من أين تبدأ أي رحلة بحث علمي حقيقية؟',
      options: [
        'من الملاحظة الدقيقة وطرح الأسئلة بفضول وشغف 🔍✨',
        'من كتابة النتيجة النهائية قبل أن نبدأ بالتجربة',
        'من تخمين عشوائي دون أن نشاهد أو نفكر'
      ],
      correct: 0,
      explanation: 'أحسنت الملاحظة! عين الباحث الفضولية التي تتأمل وتسأل "لماذا وكيف؟" هي شرارة كل اكتشاف.'
    },
    {
      id: 'q3',
      question: 'إذا قمت بتجربة ولم تنجح كما توقعت في المرة الأولى، فماذا نفعل؟',
      options: [
        'هذه فرصة ذهبية للتعلم وفهم السبب وإعادة المحاولة بذكاء 🌱🔄',
        'نغضب ونتوقف عن البحث العلمي تماماً',
        'نغير الأرقام سراً حتى تبدو صحيحة دون تجربة'
      ],
      correct: 0,
      explanation: 'عقلية العلماء العظماء! الخطأ في العلم ليس فشلاً، بل هو خطوة جديدة ترشدنا نحو الحقيقة.'
    }
  ];

  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(() => {
    return localStorage.getItem('quest_quiz_passed') === 'true';
  });

  // -----------------------------------------------------------
  // Station 2: Research Question & Socratic Dialogue State
  // -----------------------------------------------------------
  const [researchQuestion, setResearchQuestion] = useState(() => {
    return localStorage.getItem('quest_research_question') || '';
  });
  const [socraticFeedback, setSocraticFeedback] = useState(() => {
    return localStorage.getItem('quest_socratic_feedback') || '';
  });
  const [isQuestionApproved, setIsQuestionApproved] = useState(() => {
    return localStorage.getItem('quest_question_approved') === 'true';
  });
  const [isEvaluatingQuestion, setIsEvaluatingQuestion] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const chatBottomRef = useRef(null);

  const [socraticMessages, setSocraticMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('quest_socratic_messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'msg-0',
        sender: 'bot',
        text: `مرحباً بك يا باحثنا المتألق ${studentName}! 🤖✨\nأنا صديقك مُشيرفي، وهنا في مختبر التساؤل لنتحاور معاً ونحول أي فكرة في ذهنك إلى سؤال بحث علمي استقصائي ممتاز وقابل للقياس والتجربة!\n\nما هي الفكرة أو الظاهرة التي تود استكشافها اليوم؟ اكتبها لي بالأسفل أو اضغط على إحدى الأفكار الملهمة!`,
        suggestions: [
          'لماذا النباتات تحب الشمس؟ 🌱',
          'كيف يذوب السكر في الماء الساخن والبارد؟ ☕',
          'ما الذي يجعل المظلة الورقية تهبط ببطء؟ 🪂',
          'هل الرياضة تزيد من سرعة نبضات القلب؟ 🏃‍♂️'
        ]
      }
    ];
  });

  const QUESTION_IDEAS = [
    'كيف يؤثر مقدار ضوء الشمس على سرعة نمو نبات النعناع؟ 🌱☀️',
    'ما العلاقة بين درجة حرارة الماء وسرعة ذوبان مكعب السكر؟ ☕🧊',
    'كيف يؤثر حجم المظلة الورقية على سرعة هبوطها نحو الأرض؟ 🪂⏱️',
    'ما أثر ممارسة الرياضة لمدة 5 دقائق على عدد نبضات القلب؟ 🏃‍♂️❤️',
    'كيف تؤثر كمية الملح في الماء على قدرة البيضة على الطفو؟ 🥚🌊'
  ];

  // -----------------------------------------------------------
  // Station 3: Hypotheses State
  // -----------------------------------------------------------
  const [hypoIf, setHypoIf] = useState(() => localStorage.getItem('quest_hypo_if') || '');
  const [hypoThen, setHypoThen] = useState(() => localStorage.getItem('quest_hypo_then') || '');
  const [hypoBecause, setHypoBecause] = useState(() => localStorage.getItem('quest_hypo_because') || '');
  const [isHypoApproved, setIsHypoApproved] = useState(() => {
    return localStorage.getItem('quest_hypo_approved') === 'true';
  });
  const [matchSelected, setMatchSelected] = useState({});

  const MATCHING_PAIRS = [
    {
      q: 'كيف يؤثر سقي النبات بالماء المالح على خضار أوراقه؟',
      h: 'إذا سقينا النبات بماء مالح، فإن أوراقه ستصفر وتجف، لأن الملح الزائد يسحب الرطوبة من جذور النبات.'
    },
    {
      q: 'ما أثر استخدام ورق خشن على مسافة انزلاق سيارة اللعبة؟',
      h: 'إذا وضعت سيارة اللعبة على سطح خشن، فإنها ستتوقف أسرع، لأن الاحتكاك يقاوم حركة العجلات.'
    },
    {
      q: 'كيف تؤثر إضافة الخميرة على انتفاخ العجين؟',
      h: 'إذا أضفنا الخميرة الدافئة، فإن العجين سينتفخ ويتضاعف، لأن الخميرة تنتج غاز ثاني أكسيد الكربون.'
    }
  ];

  // -----------------------------------------------------------
  // Station 4: Scientific Background & Sources State (جديد!)
  // -----------------------------------------------------------
  const [bgParagraph1, setBgParagraph1] = useState(() => localStorage.getItem('quest_bg_p1') || '');
  const [bgParagraph2, setBgParagraph2] = useState(() => localStorage.getItem('quest_bg_p2') || '');
  const [bgParagraph3, setBgParagraph3] = useState(() => localStorage.getItem('quest_bg_p3') || '');
  const [bgActiveTab, setBgActiveTab] = useState(1);
  const [bgReviews, setBgReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('quest_bg_reviews');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isReviewingParagraph, setIsReviewingParagraph] = useState(null);
  const [isBgApproved, setIsBgApproved] = useState(() => {
    return localStorage.getItem('quest_bg_approved') === 'true';
  });

  const [bgKeywords, setBgKeywords] = useState(() => {
    try {
      const saved = localStorage.getItem('quest_bg_keywords');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      'تأثير ضوء الشمس على النباتات ☀️🌱',
      'عملية التمثيل الضوئي (البناء الضوئي) 🍃',
      'حاجة النبات للكلوروفيل والغذاء 🧪',
      'سرعة نمو الساق وتفرع الأوراق 📏',
      'مقارنة الظل والضوء في الطبيعة 🌳'
    ];
  });
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);

  const [bgSources, setBgSources] = useState(() => {
    try {
      const saved = localStorage.getItem('quest_bg_sources');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'src-1',
        title: 'كتاب العلوم والتكنولوجيا للمرحلة الابتدائية',
        author: 'وزارة التربية والتعليم',
        type: 'كتاب مدرسي',
        note: 'الفصل الخاص باحتياجات الكائنات الحية والنمو في النبات'
      },
      {
        id: 'src-2',
        title: 'موسوعة العلوم الميسرة للأطفال والمستكشفين',
        author: 'مؤسسة الكويت للتقدم العلمي',
        type: 'موسوعة علمية',
        note: 'مقال عن تحويل الطاقة الضوئية إلى طاقة كيميائية'
      }
    ];
  });
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceAuthor, setNewSourceAuthor] = useState('');
  const [newSourceType, setNewSourceType] = useState('موقع إنترنت موثوق');
  const [newSourceNote, setNewSourceNote] = useState('');
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);

  // Sync state changes to LocalStorage
  useEffect(() => {
    localStorage.setItem('school_unified_student_name', studentName);
    localStorage.setItem('quest_active_station', activeStation);
    localStorage.setItem('quest_unlocked_stations', JSON.stringify(unlockedStations));
    localStorage.setItem('quest_badges', JSON.stringify(badges));
  }, [studentName, activeStation, unlockedStations, badges]);

  // Sync Station 4 state changes
  useEffect(() => {
    localStorage.setItem('quest_bg_p1', bgParagraph1);
    localStorage.setItem('quest_bg_p2', bgParagraph2);
    localStorage.setItem('quest_bg_p3', bgParagraph3);
    localStorage.setItem('quest_bg_sources', JSON.stringify(bgSources));
    localStorage.setItem('quest_bg_reviews', JSON.stringify(bgReviews));
    localStorage.setItem('quest_bg_approved', String(isBgApproved));
    localStorage.setItem('quest_bg_keywords', JSON.stringify(bgKeywords));
  }, [bgParagraph1, bgParagraph2, bgParagraph3, bgSources, bgReviews, isBgApproved, bgKeywords]);

  // Ensure seamless backward compatibility for unlocked stations
  useEffect(() => {
    if (badges.hypothesis && !unlockedStations.includes(4)) {
      setUnlockedStations(prev => [...prev, 4]);
    }
    if (isBgApproved && !unlockedStations.includes(5)) {
      setUnlockedStations(prev => [...prev, 5]);
    }
  }, [badges.hypothesis, isBgApproved]);

  // Handle Text-To-Speech with resilient Arabic engine
  const speakText = (text) => {
    if (!text) return;

    if (speakingText === text) {
      arabicTTS.stop();
      setSpeakingText(null);
      return;
    }

    setSpeakingText(text);
    arabicTTS.speak(text, {
      onStart: () => setSpeakingText(text),
      onEnd: () => setSpeakingText(null),
      onError: () => setSpeakingText(null)
    });
  };

  // Stop speaking when switching stations
  useEffect(() => {
    arabicTTS.stop();
    setSpeakingText(null);
  }, [activeStation]);

  // Stop speaking when unmounting
  useEffect(() => {
    return () => {
      arabicTTS.stop();
    };
  }, []);

  // Station unlock helper
  const unlockStation = (stationNum) => {
    if (!unlockedStations.includes(stationNum)) {
      const updated = [...unlockedStations, stationNum];
      setUnlockedStations(updated);
      localStorage.setItem('quest_unlocked_stations', JSON.stringify(updated));
    }
  };

  // Award badge helper
  const awardBadge = (badgeKey) => {
    if (!badges[badgeKey]) {
      const updated = { ...badges, [badgeKey]: true };
      setBadges(updated);
      localStorage.setItem('quest_badges', JSON.stringify(updated));
      playSound('badge');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  // -----------------------------------------------------------
  // Station 1 Logic: Submit Gatekeeper Quiz
  // -----------------------------------------------------------
  const handleQuizOptionSelect = (qId, optionIdx) => {
    playSound('click');
    setQuizAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmitQuiz = () => {
    // Check all answered
    if (Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length) {
      alert('يرجى الإجابة عن جميع الأسئلة الثلاثة أولاً يا بطل!');
      return;
    }

    setQuizSubmitted(true);
    const allCorrect = QUIZ_QUESTIONS.every((q, idx) => quizAnswers[q.id] === q.correct);

    if (allCorrect) {
      playSound('success');
      setQuizPassed(true);
      localStorage.setItem('quest_quiz_passed', 'true');
      awardBadge('curiosity');
      unlockStation(2);
    } else {
      playSound('error');
      setQuizPassed(false);
    }
  };

  const handleResetQuiz = () => {
    playSound('click');
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizPassed(false);
  };

  // -----------------------------------------------------------
  // Station 2 Logic: Interactive Socratic Dialogue Engine
  // -----------------------------------------------------------
  const handleSendSocraticMessage = async (customText) => {
    const q = (typeof customText === 'string' ? customText : chatInputText).trim();
    if (!q) return;

    playSound('click');
    setChatInputText('');

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: q
    };

    const updatedMessages = [...socraticMessages, userMsg];
    setSocraticMessages(updatedMessages);
    setIsEvaluatingQuestion(true);

    let botReply = '';
    let suggestions = [];
    let isApproved = false;

    // Check if question meets scientific excellence
    const isScientificQuestion = 
      (q.includes('كيف يؤثر') || q.includes('كيف تؤثر') || q.includes('ما أثر') || q.includes('ما العلاقة') || q.includes('ما تأثير') || q.includes('إلى أي مدى')) &&
      !q.includes('تحب') && !q.includes('تكره') && !q.includes('زعلانة') &&
      q.length >= 16;

    if (isScientificQuestion) {
      isApproved = true;
      botReply = `🎉 مذهل ورائع جداً جداً يا عالمنا البطل ${studentName}! 🏆✨\n\nهذا سؤال بحث علمي استقصائي من الطراز الرفيع لأنه:\n1. يبدأ بصيغة استقصائية مفتوحة.\n2. يحدد بوضوح متغيراً سنقوم بتغييره ومتغيراً سنقيسه بالأرقام.\n3. يفتح الباب واسعاً لتجربة عملية ممتعة ومبهرة!\n\nأنا فخور بك وسؤالك معتمد رسمياً! لقد فزت بوسام "مفتاح التساؤل الذكي 🔍" وبوابتك للمحطة القادمة مفتوحة الآن! انطلق معي نحو الفرضيات 🚀!`;
      setResearchQuestion(q);
      setIsQuestionApproved(true);
      localStorage.setItem('quest_research_question', q);
      localStorage.setItem('quest_question_approved', 'true');
      awardBadge('question');
      unlockStation(3);
      playSound('success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } else if (q.includes('تحب') || q.includes('تكره') || q.includes('مشاعر')) {
      botReply = `سؤال جميل وفضول لطيف يا ${studentName}! 🌟\nولكن لاحظ أن كلمة "تحب" تعبر عن مشاعر لا يمكننا في المختبر قياسها بمسطرة أو ميزان 📏!\n\n💡 لنوجه فكرتك علمياً:\nما هو الشيء الملموس الذي يمكننا قياسه في النبتة عند تعرضها لضوء الشمس؟ اختر مما يلي لنبني به سؤالك:`;
      suggestions = [
        'سرعة نمو وطول ساق النبتة بالسنتمتر 📏',
        'عدد الأوراق وخضار لونها 🍃',
        'كيف يؤثر ضوء الشمس على سرعة نمو النبات؟ 🌱'
      ];
    } else if (q.startsWith('هل ') || q.startsWith('هل')) {
      botReply = `تفكير ذكي وخطوة واعدة! 🤔\nولكن أسئلة "هل" تكون إجابتها محصورة بكلمة واحدة مثل (نعم) أو (لا)، وهذا لا يمنحنا تجربة ممتعة لاكتشاف المتغيرات!\n\n💡 جرب أن نبدأ بـ "كيف يؤثر..." أو "ما العلاقة بين...". اختر إحدى الصياغات المقترحة أو اكتب صياغتك:`;
      suggestions = [
        'كيف يؤثر ضوء الشمس على سرعة نمو النبات؟ 🌱',
        'ما أثر درجة حرارة الماء على سرعة ذوبان السكر؟ ☕',
        'ما أثر ممارسة الرياضة على عدد نبضات القلب؟ 🏃‍♂️'
      ];
    } else if (q.includes('طول') || q.includes('نمو') || q.includes('سرعة') || q.includes('حرارة') || q.includes('ذوبان') || q.includes('نبضات')) {
      botReply = `أحسنت التفكير والتركيز! 👏 هذا متغير علمي رائع وقابل للملاحظة والقياس 🔬.\n\nوالآن لنركّب سؤال البحث الاستقصائي الكامل بهذا المتغير:\nاختر الصياغة الذهبية المكتملة لتعتمدها وتبدأ رحلة الفرضيات:`;
      suggestions = [
        `كيف يؤثر مقدار ضوء الشمس على سرعة نمو النبات؟ 🌱`,
        `ما أثر عدد ساعات التعرض للشمس على طول ساق النبتة؟ ☀️`,
        `ما العلاقة بين كمية الضوء وسرعة نمو أوراق النبات؟ 🍃`
      ];
    } else if (q.length < 12) {
      botReply = `بداية فكرة لطيفة، لكن السؤال قصير جداً يا بطلنا! 🧐\nالسؤال العلمي الجيد يوضح ما هو الشيء الذي سنجرّبه؟ وما هو الشيء الذي سنقيسه؟\nجرب إضافة تفاصيل أو اختر من أفكار التجارب المقترحة:`;
      suggestions = [
        'كيف يؤثر ضوء الشمس على سرعة نمو نبات النعناع؟ 🌱',
        'ما العلاقة بين درجة حرارة الماء وسرعة ذوبان مكعب السكر؟ ☕',
        'كيف يؤثر حجم المظلة على سرعة هبوطها نحو الأرض؟ 🪂'
      ];
    } else {
      // AI or fallback Socratic guidance
      try {
        const historySnippet = updatedMessages.slice(-4).map(m => `${m.sender === 'bot' ? 'مُشيرفي' : studentName}: ${m.text}`).join('\n');
        const prompt = `أنت الروبوت "مُشيرفي"، موجه سقراطي علمي ودود للأطفال في المدرسة الابتدائية (العمر 9-12 سنة).
اسم الطالب: ${studentName}.
سياق المحادثة: نساعد الطفل في بناء "سؤال بحث علمي استقصائي قابل للقياس والتجربة".
حوار المحادثة الأخير:
${historySnippet}
الطالب قال الآن: "${q}".
المطلوب:
1. رد تشجيعي لطيف في جملتين بأسلوب سقراطي ذكي.
2. وجهه بلطف لتحويل فكرته إلى سؤال يبدأ بـ (كيف يؤثر / ما العلاقة) ويكون قابلاً للقياس (مثل قياس الطول، السرعة، الوزن).
3. إذا كان سؤاله مكتملاً وممتازاً فعلاً كبحث علمي، اعتمده واكتب في السطر الأخير حصراً: [APPROVED]
كن مشوقاً ومناسباً للأطفال.`;
        const aiReply = await generateAiResponse(prompt, 'أنت الروبوت مُشيرفي الموجه السقراطي للبحث العلمي للأطفال.');
        if (aiReply) {
          if (aiReply.includes('[APPROVED]')) {
            isApproved = true;
            botReply = aiReply.replace('[APPROVED]', '').trim();
            setResearchQuestion(q);
            setIsQuestionApproved(true);
            localStorage.setItem('quest_research_question', q);
            localStorage.setItem('quest_question_approved', 'true');
            awardBadge('question');
            unlockStation(3);
            playSound('success');
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
          } else {
            botReply = aiReply;
            suggestions = [
              'كيف يؤثر ضوء الشمس على سرعة نمو النباتات؟ 🌱',
              'ما العلاقة بين درجة حرارة الماء وسرعة ذوبان السكر؟ ☕',
              'كيف يؤثر وزن الجسم على سرعة هبوطه؟ ⚡'
            ];
          }
        } else {
          throw new Error('AI fallback');
        }
      } catch {
        botReply = `فكرة ملهمة جداً يا ${studentName}! 💡\nلنجعل هذا السؤال سؤال بحث علمي استقصائي لا يُقاوَم، نحتاج أن نربط بين شيئين:\n1. شيء نقوم بتغييره (مثل كمية الضوء أو الماء).\n2. شيء نقيسه بالأرقام (مثل طول النبتة أو عدد الأوراق).\n\nما رأيك أن نختاره بصيغة: "كيف يؤثر..."؟`;
        suggestions = [
          'كيف يؤثر مقدار ضوء الشمس على سرعة نمو النباتات؟ 🌱',
          'ما العلاقة بين كمية السقي ونضارة أوراق النبتة؟ 💧'
        ];
      }
    }

    const botMsg = {
      id: 'msg-' + (Date.now() + 1),
      sender: 'bot',
      text: botReply,
      suggestions: isApproved ? [] : suggestions,
      isApproved
    };

    const finalMessages = [...updatedMessages, botMsg];
    setSocraticMessages(finalMessages);
    localStorage.setItem('quest_socratic_messages', JSON.stringify(finalMessages));
    setSocraticFeedback(botReply);
    localStorage.setItem('quest_socratic_feedback', botReply);
    setIsEvaluatingQuestion(false);
  };

  const handleResetSocraticChat = () => {
    playSound('click');
    localStorage.removeItem('quest_socratic_messages');
    setSocraticMessages([
      {
        id: 'msg-0',
        sender: 'bot',
        text: `أهلاً بك مجدداً يا ${studentName}! 🤖 لنبدأ فكرة وتساؤلاً جديداً. ما الظاهرة التي تود استكشافها؟`,
        suggestions: [
          'لماذا النباتات تحب الشمس؟ 🌱',
          'كيف يذوب السكر في الماء الساخن والبارد؟ ☕',
          'ما الذي يجعل المظلة الورقية تهبط ببطء؟ 🪂'
        ]
      }
    ]);
  };

  // -----------------------------------------------------------
  // Station 3 Logic: Assemble & Approve Hypothesis
  // -----------------------------------------------------------
  const handleApproveHypothesis = () => {
    if (!hypoIf.trim() || !hypoThen.trim() || !hypoBecause.trim()) {
      alert('يرجى إكمال أركان الفرضية الثلاثة (إذا... فإن... لأن...) يا بطل!');
      return;
    }

    playSound('success');
    setIsHypoApproved(true);
    localStorage.setItem('quest_hypo_if', hypoIf.trim());
    localStorage.setItem('quest_hypo_then', hypoThen.trim());
    localStorage.setItem('quest_hypo_because', hypoBecause.trim());
    localStorage.setItem('quest_hypo_approved', 'true');
    awardBadge('hypothesis');
    unlockStation(4);
    setActiveStation(4);
  };

  // -----------------------------------------------------------
  // Station 4 Logic: Scientific Background, Sources & Step-by-Step Writing
  // -----------------------------------------------------------
  const handleGenerateKeywords = async () => {
    setIsGeneratingKeywords(true);
    playSound('click');
    try {
      const topic = researchQuestion || 'تأثير المتغيرات في العلوم';
      const prompt = `أنت الروبوت "مُشيرفي"، مرشد البحث العلمي للأطفال بمدرسة مشيرفة الابتدائية.
سؤال بحث الطالب: "${topic}".
الفرضية: "${hypoIf} -> ${hypoThen}".
المطلوب: اقترح 5 كلمات مفتاحية أو عناوين فرعية ذكية ومختصرة يستطيع الطالب البحث عنها في جوجل أو المكتبة المدرسية لكتابة الخلفية العلمية.
اكتب الكلمات المفتاحية في سطر واحد مفصولة بعلامة الشحطة العمودية | فقط دون أي مقدمات أو ترقيم.
مثال: التمثيل الضوئي | نمو النباتات | الكلوروفيل والطاقة | دور الشمس في الطبيعة | تجارب علمية بسيطة`;
      const res = await generateAiResponse(prompt, 'أنت مُشيرفي المقترح الذكي للكلمات المفتاحية.');
      if (res) {
        const words = res.split('|').map(w => w.trim()).filter(w => w.length > 2);
        if (words.length > 0) {
          setBgKeywords(words);
          localStorage.setItem('quest_bg_keywords', JSON.stringify(words));
          playSound('success');
        }
      }
    } catch {
      const fallback = [
        `مفهوم ${researchQuestion ? researchQuestion.slice(0, 25) : 'الظاهرة العلمية'}... 🔍`,
        'العوامل المؤثرة والتجارب السابقة 🧪',
        'التفسير العلمي للظاهرة في الطبيعة 🌍',
        'تطبيقات في حياتنا وبيئتنا المدرسية 🌱',
        'المصطلحات العلمية المركزية 📖'
      ];
      setBgKeywords(fallback);
    } finally {
      setIsGeneratingKeywords(false);
    }
  };

  const handleAddSource = (e) => {
    e.preventDefault();
    if (!newSourceTitle.trim()) {
      alert('يرجى إدخال اسم المصدر أو عنوان الكتاب/الموقع.');
      return;
    }
    const newSrc = {
      id: 'src-' + Date.now(),
      title: newSourceTitle.trim(),
      author: newSourceAuthor.trim() || 'غير محدد',
      type: newSourceType,
      note: newSourceNote.trim()
    };
    const updated = [...bgSources, newSrc];
    setBgSources(updated);
    localStorage.setItem('quest_bg_sources', JSON.stringify(updated));
    setNewSourceTitle('');
    setNewSourceAuthor('');
    setNewSourceNote('');
    setShowAddSourceModal(false);
    playSound('success');
  };

  const handleDeleteSource = (srcId) => {
    const updated = bgSources.filter(s => s.id !== srcId);
    setBgSources(updated);
    localStorage.setItem('quest_bg_sources', JSON.stringify(updated));
    playSound('click');
  };

  const handleReviewParagraphWithAI = async (pIndex) => {
    const text = pIndex === 1 ? bgParagraph1 : pIndex === 2 ? bgParagraph2 : bgParagraph3;
    if (!text.trim()) {
      alert('يرجى كتابة مسودة فقرتك أولاً يا بطل حتى يستطيع مُشيرفي مراجعتها معك وتصويبها!');
      return;
    }
    setIsReviewingParagraph(pIndex);
    playSound('click');

    const pTypeName = pIndex === 1
      ? 'المفهوم الأساسي والتعريف العلمي'
      : pIndex === 2
      ? 'التفسير العلمي والعلاقة بين المتغيرات'
      : 'أهمية الموضوع وتطبيقاته في حياتنا';

    try {
      const prompt = `أنت الروبوت "مُشيرفي"، مرشد ودود وخبير في البحث العلمي للطلاب في المرحلة الابتدائية بمدرسة مشيرفة الابتدائية.
اسم الطالب: ${studentName}.
سؤال البحث العلمي: "${researchQuestion || 'سؤال البحث'}".
الفقرة رقم ${pIndex} من الخلفية العلمية بعنوان (${pTypeName}):
نص مسودة الطالب:
"${text}"

المطلوب:
1. ملاحظة تشجيعية دافئة تثني على الطالب وتبين ما أعجبك في فكرته، مع تنبيه لطيف لأي خطأ إملائي أو صياغي (سطرين).
2. قدم صياغة محسنة ومصقولة للفقرة تناسب مستوى طالب ابتدائي وتبرز الأسلوب العلمي الرصين، مع الحفاظ التام على فكرة الطالب ومشاركته.
اكتب ردك بالتنسيق التالي حرفياً:
[FEEDBACK]: ملاحظتك المشجعة وتوجيهك
[POLISHED]: النص المصقول للفقرة`;

      const aiReply = await generateAiResponse(prompt, 'أنت مُشيرفي مدقق ومساعد البحث العلمي للطلاب.');
      if (aiReply && aiReply.includes('[POLISHED]')) {
        const parts = aiReply.split('[POLISHED]');
        const feedback = parts[0].replace('[FEEDBACK]:', '').trim();
        const polished = parts[1].trim();

        setBgReviews(prev => ({
          ...prev,
          [pIndex]: { feedback, polished, isApproved: false }
        }));
        playSound('success');
      } else {
        throw new Error('Fallback review');
      }
    } catch {
      let fb = '';
      let pol = '';
      if (pIndex === 1) {
        fb = `أحسنت يا ${studentName}! محاولة رائعة ومثمرة في تعريف المفهوم بكلماتك. قمت بتدقيق الصياغة لتكون أكثر وضوحاً ورصانة علمية كما يكتب الباحثون!`;
        pol = `${text.trim()}، وهو مفهوم علمي أساسي يعبر عن الظاهرة بدقة ويساعدنا على فهم التغيرات التي نلاحظها في بيئتنا الطبيعية.`;
      } else if (pIndex === 2) {
        fb = `تفكير استقصائي متميز يا عالمنا الصغير! لقد بينت العلاقة العلمية بذكاء. قمت بربط الجمل لغوياً لتبدو كفقرة علمية متماسكة.`;
        pol = `بناءً على التفسير العلمي والمصادر الموثوقة، فإن ${text.trim()}؛ حيث تؤدي هذه العوامل إلى حدوث تأثيرات مباشرة يمكن ملاحظتها وقياسها في التجربة.`;
      } else {
        fb = `رائع جداً يا ${studentName}! ربط البحث بالواقع والحياة اليومية يعكس فهماً عميقاً لقيمة العلم. صياغتك أصبحت جاهزة ومتقنة.`;
        pol = `تتجلى أهمية هذا البحث في ${text.trim()}، مما يمنحنا وعياً علمياً يمكن تطبيقه في حياتنا اليومية للحفاظ على كوكبنا وحل المشكلات المحيطة بنا.`;
      }
      setBgReviews(prev => ({
        ...prev,
        [pIndex]: { feedback: fb, polished: pol, isApproved: false }
      }));
      playSound('success');
    } finally {
      setIsReviewingParagraph(null);
    }
  };

  const handleApplyPolishedParagraph = (pIndex) => {
    const rev = bgReviews[pIndex];
    if (!rev || !rev.polished) return;
    if (pIndex === 1) setBgParagraph1(rev.polished);
    if (pIndex === 2) setBgParagraph2(rev.polished);
    if (pIndex === 3) setBgParagraph3(rev.polished);

    setBgReviews(prev => ({
      ...prev,
      [pIndex]: { ...prev[pIndex], isApproved: true }
    }));
    playSound('success');
    if (pIndex < 3) setBgActiveTab(pIndex + 1);
  };

  const handleKeepStudentParagraph = (pIndex) => {
    setBgReviews(prev => ({
      ...prev,
      [pIndex]: { ...prev[pIndex], isApproved: true }
    }));
    playSound('success');
    if (pIndex < 3) setBgActiveTab(pIndex + 1);
  };

  const handleApproveBackground = () => {
    if (!bgParagraph1.trim() || !bgParagraph2.trim() || !bgParagraph3.trim()) {
      alert('يرجى كتابة الفقرات الثلاث كاملة أولاً للتأكد من شمولية الخلفية العلمية ومشاركتك الفعالة!');
      return;
    }

    playSound('success');
    setIsBgApproved(true);
    localStorage.setItem('quest_bg_p1', bgParagraph1.trim());
    localStorage.setItem('quest_bg_p2', bgParagraph2.trim());
    localStorage.setItem('quest_bg_p3', bgParagraph3.trim());
    localStorage.setItem('quest_bg_approved', 'true');
    localStorage.setItem('quest_bg_reviews', JSON.stringify(bgReviews));
    awardBadge('background');
    awardBadge('explorer');
    unlockStation(5);
    setActiveStation(5);
  };

  // Calculate overall progress %
  const calculateProgress = () => {
    let p = 0;
    if (quizPassed) p += 25;
    if (isQuestionApproved) p += 25;
    if (isHypoApproved) p += 25;
    if (isBgApproved) p += 25;
    return p;
  };

  return (
    <div className="quest-container">
      {/* Cosmic background stars */}
      <div className="quest-cosmic-bg" />

      {/* Confetti celebration canvas */}
      <ConfettiEffect active={showConfetti} />

      <div className="quest-wrapper">
        {/* Top Navigation Bar */}
        <header className="quest-top-bar">
          <a href="#/" className="quest-back-btn">
            <i className="fas fa-arrow-right"></i>
            <span>العودة للرئيسية</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
            {studentSession ? (
              <div 
                className="quest-user-tag"
                style={{
                  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
                  border: '1.5px solid #38bdf8'
                }}
              >
                <span>{studentSession.roleIcon || '👤'} المستكشف:</span>
                <strong style={{ color: '#ffffff', fontWeight: 900 }}>
                  {studentName}
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#93c5fd', opacity: 0.9 }}>
                  ({studentClass})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل تريد تسجيل الخروج؟')) {
                      logoutStudent();
                    }
                  }}
                  title="تسجيل الخروج من البوابة الموحدة"
                  style={{
                    background: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#fca5a5',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '4px'
                  }}
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="quest-back-btn"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: '1.5px solid #34d399',
                  fontWeight: 900,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                }}
                title="تسجيل الدخول بنفس اسم المستخدم ورمز الدخول الموحد لجميع صفحات الموقع"
              >
                <i className="fas fa-user-circle"></i>
                <span>تسجيل الدخول الموحد 🔑</span>
              </button>
            )}

            <button
              onClick={() => setActiveStation(0)}
              className="quest-back-btn"
              style={{ background: activeStation === 0 ? 'rgba(56, 189, 248, 0.25)' : undefined }}
            >
              <i className="fas fa-compass"></i>
              <span>خريطة الرحلة</span>
            </button>
          </div>
        </header>

        {/* Global Unified Authentication Modal */}
        <StudentAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={(sess) => {
            if (sess?.fullName) {
              setStudentName(sess.fullName);
              setStudentClass(sess.studentClass || 'الصف الخامس');
              playSound('success');
            }
          }}
        />

        {/* Progress & Stations Trail */}
        <nav className="quest-trail-container">
          <div className="quest-trail-header">
            <div className="quest-trail-title">
              <span>🚀 محطات مغامرة البحث العلمي</span>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                (محطة {activeStation === 0 ? 'البداية' : activeStation} من 4)
              </span>
            </div>
            <div className="quest-progress-meter">
              <div className="quest-progress-bar-outer">
                <div
                  className="quest-progress-bar-inner"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
              <span className="quest-progress-text">{calculateProgress()}%</span>
            </div>
          </div>

          <div className="quest-steps-grid">
            {/* Step 1 */}
            <div
              className={`quest-step-pill ${unlockedStations.includes(1) ? 'unlocked' : 'locked'} ${activeStation === 1 ? 'active' : ''} ${quizPassed ? 'completed' : ''}`}
              onClick={() => {
                if (unlockedStations.includes(1)) {
                  playSound('click');
                  setActiveStation(1);
                }
              }}
            >
              {badges.curiosity && <span className="quest-step-badge-tag">🌟 تم الإنجاز</span>}
              <div className="quest-step-icon">
                {quizPassed ? <i className="fas fa-check"></i> : <i className="fas fa-book-open"></i>}
              </div>
              <span className="quest-step-num">المحطة الأولى</span>
              <span className="quest-step-name">مقدمة البحث العلمي</span>
            </div>

            {/* Step 2 */}
            <div
              className={`quest-step-pill ${unlockedStations.includes(2) ? 'unlocked' : 'locked'} ${activeStation === 2 ? 'active' : ''} ${isQuestionApproved ? 'completed' : ''}`}
              onClick={() => {
                if (unlockedStations.includes(2)) {
                  playSound('click');
                  setActiveStation(2);
                } else {
                  alert('🔒 هذه المحطة مقفلة! اجتز اختبار المحطة الأولى أولاً لتفتح لك الطريق.');
                }
              }}
            >
              {badges.question && <span className="quest-step-badge-tag">🔍 تم الإنجاز</span>}
              <div className="quest-step-icon">
                {isQuestionApproved ? <i className="fas fa-check"></i> : <i className="fas fa-question-circle"></i>}
              </div>
              <span className="quest-step-num">المحطة الثانية</span>
              <span className="quest-step-name">صياغة سؤال البحث</span>
            </div>

            {/* Step 3 */}
            <div
              className={`quest-step-pill ${unlockedStations.includes(3) ? 'unlocked' : 'locked'} ${activeStation === 3 ? 'active' : ''} ${isHypoApproved ? 'completed' : ''}`}
              onClick={() => {
                if (unlockedStations.includes(3)) {
                  playSound('click');
                  setActiveStation(3);
                } else {
                  alert('🔒 هذه المحطة مقفلة! اعتمد سؤال البحث في المحطة الثانية لتفتح لك.');
                }
              }}
            >
              {badges.hypothesis && <span className="quest-step-badge-tag">🧪 تم الإنجاز</span>}
              <div className="quest-step-icon">
                {isHypoApproved ? <i className="fas fa-check"></i> : <i className="fas fa-vial"></i>}
              </div>
              <span className="quest-step-num">المحطة الثالثة</span>
              <span className="quest-step-name">بناء الفرضيات</span>
            </div>

            {/* Step 4: Scientific Background */}
            <div
              className={`quest-step-pill ${unlockedStations.includes(4) ? 'unlocked' : 'locked'} ${activeStation === 4 ? 'active' : ''} ${isBgApproved ? 'completed' : ''}`}
              onClick={() => {
                if (unlockedStations.includes(4)) {
                  playSound('click');
                  setActiveStation(4);
                } else {
                  alert('🔒 هذه المحطة مقفلة! أكمل بناء الفرضية في المحطة الثالثة لتفتح لك ورشة الخلفية العلمية.');
                }
              }}
            >
              {badges.background && <span className="quest-step-badge-tag">📚 تم الإنجاز</span>}
              <div className="quest-step-icon">
                {isBgApproved ? <i className="fas fa-check"></i> : <i className="fas fa-book-reader"></i>}
              </div>
              <span className="quest-step-num">المحطة الرابعة</span>
              <span className="quest-step-name">الخلفية العلمية والمصادر</span>
            </div>

            {/* Step 5: Finale */}
            <div
              className={`quest-step-pill ${unlockedStations.includes(5) || (unlockedStations.includes(4) && badges.explorer) ? 'unlocked' : 'locked'} ${activeStation === 5 ? 'active' : ''} ${badges.explorer ? 'completed' : ''}`}
              onClick={() => {
                if (unlockedStations.includes(5) || (unlockedStations.includes(4) && badges.explorer)) {
                  playSound('click');
                  setActiveStation(5);
                } else {
                  alert('🔒 أكمل المحطات الأربع واعتمد الخلفية العلمية أولاً للحصول على شهادتك الذهبية ووسام التتويج!');
                }
              }}
            >
              {badges.explorer && <span className="quest-step-badge-tag">🏆 متوج</span>}
              <div className="quest-step-icon">
                <i className="fas fa-award"></i>
              </div>
              <span className="quest-step-num">لوحة التكريم</span>
              <span className="quest-step-name">شهادة المستكشف</span>
            </div>
          </div>
        </nav>

        {/* Dynamic Robot Musheirifi Avatar Card (Present on every station) */}
        <section className="quest-avatar-card">
          <RobotMusheirifiAvatar
            expression={
              activeStation === 5 || showConfetti
                ? 'celebrating'
                : activeStation === 2 || activeStation === 4
                ? 'thinking'
                : 'happy'
            }
            isSpeaking={Boolean(speakingText)}
          />

          <div className="quest-avatar-bubble">
            <div className="quest-avatar-header">
              <div className="quest-avatar-name">
                <span>الروبوت مُشيرفي (Musheirifi)</span>
                <span className="quest-avatar-badge-role">مرشدك العلمي الذكي 🤖</span>
              </div>

              {/* Text to Speech trigger */}
              <button
                type="button"
                className={`quest-voice-btn ${speakingText ? 'speaking' : ''}`}
                onClick={() => {
                  playSound('click');
                  let textToRead = '';
                  if (activeStation === 0) {
                    textToRead = `أهلاً بك يا بطلنا ${studentName}! أنا صديقك الروبوت مُشيرفي، وهنا لنكتشف معاً كيف يفكر العلماء، من طرح الأسئلة إلى التجربة والاكتشاف. هل أنت مستعد للرحلة؟`;
                  } else if (activeStation === 1) {
                    textToRead = 'في المحطة الأولى، سنقرأ قصة النبتة العجيبة لنعرف ما هو البحث العلمي، ثم تجتاز اختباراً ذكياً من ثلاثة أسئلة لتنال وسام شعلة الفضول!';
                  } else if (activeStation === 2) {
                    textToRead = 'المحطة الثانية هي مختبر التساؤل! اكتب سؤال بحثك في الصندوق وسأقوم بدوري السقراطي لمساعدتك في صياغته بأعلى دقة علمية.';
                  } else if (activeStation === 3) {
                    textToRead = 'في المحطة الثالثة نتعلم كيف نصوغ الفرضية الذكية: إذا قمنا بكذا، نتوقع كذا، لأن كذا! هيا نبني فرضيتك معاً!';
                  } else if (activeStation === 4) {
                    textToRead = 'في المحطة الرابعة، ورشة كتابة الخلفية العلمية، سنستخرج المراجع الموثوقة، ونسترشد بمفاتيح البحث، ونكتب مسودة فقراتنا خطوة بخطوة وسأقوم بتدقيقها وصقلها معك!';
                  } else {
                    textToRead = `مبارك من أعماق القلب يا بطلنا المتألق ${studentName}! لقد أكملت خطوات البحث العلمي واستحققت شهادة المستكشف العلمي بجدارة!`;
                  }
                  speakText(textToRead);
                }}
              >
                <i className={`fas ${speakingText ? 'fa-stop-circle' : 'fa-volume-up'}`}></i>
                <span>{speakingText ? 'إيقاف صوت مُشيرفي' : 'استمع لتوجيه مُشيرفي'}</span>
              </button>
            </div>

            <p className="quest-avatar-text">
              {activeStation === 0 && (
                <>
                  مرحباً بك يا عالمنا المستقبلي <strong>{studentName}</strong> في مغامرة البحث العلمي! أنا صديقك <strong>مُشيرفي</strong>، وسأرافقك خطوة بخطوة لنتعلم كيف يفكر العلماء، ونحول فضولك إلى اكتشافات مذهلة. انطلق معي الآن! ✨
                </>
              )}
              {activeStation === 1 && (
                <>
                  أهلاً بك في <strong>المحطة الأولى</strong>! اقرأ قصة لغز النبتة المصورة لتكتشف سر المنهج العلمي، ثم أجب عن الأسئلة الثلاثة بنجاح لتفتح لك بوابة المحطة القادمة وتفوز بوسام شعلة الفضول! 🌟
                </>
              )}
              {activeStation === 2 && (
                <>
                  أهلاً بك في <strong>مختبر سؤال البحث</strong>! كل اختراع عظيم بدأ بسؤال ذكي. اكتب سؤالك وسأساعدك بطريقة سقراطية ممتعة لنحوله إلى سؤال علمي قابل للاختبار والقياس! 🔍
                </>
              )}
              {activeStation === 3 && (
                <>
                  رائع جداً! وصلنا إلى <strong>ورشة الفرضيات العلمية</strong>. الفرضية هي توقعك الذكي للنتيجة مدعوماً بالسبب. ركّب أركان فرضيتك الذهبية وانتقل معي لكتابة الخلفية العلمية! 🧪
                </>
              )}
              {activeStation === 4 && (
                <>
                  أهلاً بك في <strong>المحطة الرابعة: ورشة كتابة الخلفية العلمية والمصادر</strong>! 📚🔍 لا باحث يبدأ من فراغ؛ سنستخرج المراجع، ونحدد عناوين البحث، وسأرافقك في صياغة وتصليح فقراتك فقرة بفقرة لنتأكد من فهمك وتميز صياغتك! ✨
                </>
              )}
              {activeStation === 5 && (
                <>
                  يا لك من فخر لمدرسة مشيرفة! مبارك إتمام الرحلة وحصولك على الأوسمة الأربعة ولقب <strong>المستكشف العلمي المتوج</strong>. يمكنك الآن طباعة شهادتك الرسمية الشاملة مع خلفيتك العلمية ومشاركتها مع أهلك ومعلميك! 🏆🎓
                </>
              )}
            </p>
          </div>
        </section>

        {/* ========================================================= */}
        {/* STATION 0: Home Hub & Adventure Overview                  */}
        {/* ========================================================= */}
        {activeStation === 0 && (
          <main>
            {/* Hero Card */}
            <div className="quest-hero-banner">
              <h1 className="quest-hero-title">
                رحلة المستكشف الصغير: خطوات البحث العلمي 🔬✨
              </h1>
              <p className="quest-hero-subtitle">
                منصة تعليمية تفاعلية مبهجة لطلاب المرحلة الابتدائية بمدرسة مشيرفة، تصحبك في تجربة عملية ممتعة لصياغة الأسئلة، بناء الفرضيات، وفتح أوسمة التميز العلمي!
              </p>

              <div className="quest-hero-actions">
                <button
                  type="button"
                  className="quest-btn-primary"
                  onClick={() => {
                    playSound('click');
                    setActiveStation(1);
                  }}
                >
                  <i className="fas fa-rocket"></i>
                  <span>ابدأ مغامرة الاستكشاف الآن!</span>
                </button>
                {quizPassed && (
                  <button
                    type="button"
                    className="quest-btn-secondary"
                    onClick={() => {
                      playSound('click');
                      setActiveStation(unlockedStations[unlockedStations.length - 1]);
                    }}
                  >
                    <i className="fas fa-play"></i>
                    <span>متابعة من آخر محطة</span>
                  </button>
                )}
              </div>
            </div>

            {/* Stations Overview Cards */}
            <div className="quest-feature-cards">
              <div className="quest-feature-card">
                <div className="quest-feature-card-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  📖
                </div>
                <h3>المحطة 1: قصة البحث العلمي واختبار العبور</h3>
                <p>
                  شرح بالقصص المصورة لأهمية البحث العلمي في حياتنا، يليه اختبار بوابي ذكي لا يمكن العبور بعده إلا بإتقانه كاملاً.
                </p>
                <div className="quest-card-badge-preview">
                  <span>🏅 وسام المحطة:</span>
                  <strong>شعلة الفضول العلمي 🌟</strong>
                </div>
              </div>

              <div className="quest-feature-card">
                <div className="quest-feature-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  ❓
                </div>
                <h3>المحطة 2: صياغة سؤال البحث والموجه السقراطي</h3>
                <p>
                  تعلم الفرق بين السؤال المغلق والسؤال الاستقصائي القابل للاختبار، مع موجه سقراطي ذكي يقدم لك تغذية راجعة فورية لتطوير سؤالك.
                </p>
                <div className="quest-card-badge-preview">
                  <span>🏅 وسام المحطة:</span>
                  <strong>مفتاح التساؤل الذكي 🔍</strong>
                </div>
              </div>

              <div className="quest-feature-card">
                <div className="quest-feature-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  🧪
                </div>
                <h3>المحطة 3: بناء الفرضيات العلمية والتجربة</h3>
                <p>
                  اكتشف معادلة الفرضية الذهبية (إذا... فإن... لأن...) وطبقها عملياً لربط توقعك العلمي بسؤال بحثك بثقة وإتقان.
                </p>
                <div className="quest-card-badge-preview">
                  <span>🏅 وسام المحطة:</span>
                  <strong>صانع الفرضيات العبقري 🧪</strong>
                </div>
              </div>

              <div className="quest-feature-card">
                <div className="quest-feature-card-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                  📚
                </div>
                <h3>المحطة 4: كتابة وتوثيق الخلفية العلمية والمصادر</h3>
                <p>
                  استخراج المراجع الموثوقة، وتوجيه عناوين ومفاتيح البحث، وكتابة مسودة فقرات الخلفية العلمية خطوة بخطوة وتدقيقها بالذكاء الاصطناعي مع مُشيرفي.
                </p>
                <div className="quest-card-badge-preview">
                  <span>🏅 وسام المحطة:</span>
                  <strong>وسام التوثيق والخلفية العلمية 📜✨</strong>
                </div>
              </div>
            </div>

            {/* Badges Cabinet Showcase */}
            <section className="quest-badges-drawer">
              <div className="quest-badges-drawer-title">
                <i className="fas fa-medal"></i>
                <span>خزانة أوسمتك وشاراتك العلمية</span>
              </div>
              <div className="quest-badges-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className={`quest-badge-slot ${badges.curiosity ? 'earned' : 'locked'}`}>
                  <div className="quest-badge-slot-icon">🌟</div>
                  <div className="quest-badge-info">
                    <h4>وسام شعلة الفضول</h4>
                    <p>{badges.curiosity ? 'تم الحصول عليه في المحطة الأولى!' : 'يُفتح عند اجتياز اختبار المحطة الأولى (3/3).'}</p>
                  </div>
                </div>

                <div className={`quest-badge-slot ${badges.question ? 'earned' : 'locked'}`}>
                  <div className="quest-badge-slot-icon">🔍</div>
                  <div className="quest-badge-info">
                    <h4>وسام مفتاح التساؤل</h4>
                    <p>{badges.question ? 'تم الحصول عليه في المحطة الثانية!' : 'يُفتح عند صياغة واعتماد سؤال بحث علمي مميز.'}</p>
                  </div>
                </div>

                <div className={`quest-badge-slot ${badges.hypothesis ? 'earned' : 'locked'}`}>
                  <div className="quest-badge-slot-icon">🧪</div>
                  <div className="quest-badge-info">
                    <h4>وسام صانع الفرضيات</h4>
                    <p>{badges.hypothesis ? 'تم الحصول عليه في المحطة الثالثة!' : 'يُفتح عند صياغة فرضية ذكية مدعومة بالسبب.'}</p>
                  </div>
                </div>

                <div className={`quest-badge-slot ${badges.background ? 'earned' : 'locked'}`}>
                  <div className="quest-badge-slot-icon">📜</div>
                  <div className="quest-badge-info">
                    <h4>وسام التوثيق والخلفية العلمية</h4>
                    <p>{badges.background ? 'تم الحصول عليه في المحطة الرابعة!' : 'يُفتح عند كتابة وتدقيق فقرات الخلفية العلمية وتوثيق المصادر.'}</p>
                  </div>
                </div>

                <div className={`quest-badge-slot ${badges.explorer ? 'earned' : 'locked'}`}>
                  <div className="quest-badge-slot-icon">🏆</div>
                  <div className="quest-badge-info">
                    <h4>وسام المستكشف المتوج</h4>
                    <p>{badges.explorer ? 'تم التتويج بنجاح!' : 'يُمنح عند إتمام المحطات الأربع وإصدار الشهادة.'}</p>
                  </div>
                </div>
              </div>
            </section>
          </main>
        )}

        {/* ========================================================= */}
        {/* STATION 1: Story & Gatekeeper Quiz                        */}
        {/* ========================================================= */}
        {activeStation === 1 && (
          <main>
            <div className="quest-section-header">
              <span className="quest-section-badge">المحطة 1 / 3</span>
              <h2 className="quest-section-title">مقدمة في البحث العلمي: قصة النبتة واختبار العبور</h2>
              <p className="quest-section-desc">
                استمتع بقراءة القصة المصورة لتعرف كيف بدأ كنان والروبوت مُشيرفي رحلة التفكير العلمي، ثم أجب عن الأسئلة بدقة للعبور للمحطة التالية!
              </p>
            </div>

            {/* Comic Story Panels */}
            <div className="quest-comic-deck">
              <div className="quest-comic-strip">
                {/* Panel 1 */}
                <div className="quest-comic-panel">
                  <div className="quest-comic-img-box" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' }}>
                    <span className="quest-comic-number-tag">المشهد 1</span>
                    <div style={{ fontSize: '4rem' }}>🪴❓</div>
                    <button
                      type="button"
                      className="quest-comic-read-btn"
                      onClick={() => {
                        playSound('click');
                        speakText('المشهد الأول: لاحظ كنان أن نبتة النعناع في غرفته قد ذبلت واصفرّت، بينما نبتة الشرفة خضراء ومورقة! تساءل بدهشة: يا ترى ما السبب الخفي وراء ذلك؟');
                      }}
                    >
                      <i className="fas fa-volume-up"></i> استمع
                    </button>
                  </div>
                  <div className="quest-comic-body">
                    <h4 className="quest-comic-panel-title">الملاحظة والدهشة 🔍</h4>
                    <p className="quest-comic-caption">
                      لاحظ <strong>كنان</strong> أن نبتة النعناع في غرفته المظلمة قد ذبلت واصفرّت، بينما نبتة شرفة المطبخ قوية وخضراء! تساءل بفضول: <em>"لماذا ذبلت نبتتي هنا؟"</em>
                    </p>
                    <div className="quest-comic-lesson">
                      💡 الخطوة الأولى في العلم: الملاحظة وطرح السؤال.
                    </div>
                  </div>
                </div>

                {/* Panel 2 */}
                <div className="quest-comic-panel">
                  <div className="quest-comic-img-box" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' }}>
                    <span className="quest-comic-number-tag">المشهد 2</span>
                    <div style={{ fontSize: '4rem' }}>🤖💡</div>
                    <button
                      type="button"
                      className="quest-comic-read-btn"
                      onClick={() => {
                        playSound('click');
                        speakText('المشهد الثاني: ظهر الروبوت مُشيرفي بابتسامته اللطيفة وقال: لا تقلق يا كنان! هنا يأتي دور البحث العلمي.. العلم ليس مجرد كتب نحفظها، بل هو أسلوب تفكير منظم نستخدمه لفهم العالم وحل المشكلات!');
                      }}
                    >
                      <i className="fas fa-volume-up"></i> استمع
                    </button>
                  </div>
                  <div className="quest-comic-body">
                    <h4 className="quest-comic-panel-title">ظهور مُشيرفي وأهمية العلم 🤖</h4>
                    <p className="quest-comic-caption">
                      ظهر <strong>الروبوت مُشيرفي</strong> وقال مبتسماً: <em>"لا تقلق يا كنان! هذا هو البحث العلمي؛ رحلة منظمة للبحث عن إجابات وحل المشكلات التي تواجهنا كل يوم!"</em>
                    </p>
                    <div className="quest-comic-lesson">
                      💡 أهمية البحث العلمي: فهم الظواهر وتطوير حياتنا.
                    </div>
                  </div>
                </div>

                {/* Panel 3 */}
                <div className="quest-comic-panel">
                  <div className="quest-comic-img-box" style={{ background: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)' }}>
                    <span className="quest-comic-number-tag">المشهد 3</span>
                    <div style={{ fontSize: '4rem' }}>☀️🌿</div>
                    <button
                      type="button"
                      className="quest-comic-read-btn"
                      onClick={() => {
                        playSound('click');
                        speakText('المشهد الثالث: قام كنان بنقل النبتة بجانب نافذة مشمسة، وبدأ يسقيها بانتظام. بعد أيام، عادت النبتة نضرة ومخضرة! هكذا استطاع بالتجربة والملاحظة حل المشكلة واكتشاف حاجة النبات لضوء الشمس.');
                      }}
                    >
                      <i className="fas fa-volume-up"></i> استمع
                    </button>
                  </div>
                  <div className="quest-comic-body">
                    <h4 className="quest-comic-panel-title">التجربة والحل المنير 🌱</h4>
                    <p className="quest-comic-caption">
                      نقل كنان نبتته بجوار نافذة يدخلها ضوء الشمس وسقاها بانتظام.. وبعد أيام عادت خضراء مشرقة! لقد حل المشكلة بخطوات علمية صحيحة.
                    </p>
                    <div className="quest-comic-lesson">
                      💡 النتيجة: التجربة العملية تؤكد لنا الأسباب الحقيقية.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gatekeeper Quiz */}
            <section className="quest-quiz-card">
              <div className="quest-quiz-header">
                <div className="quest-quiz-title-wrap">
                  <h3>
                    <i className="fas fa-key"></i>
                    <span>اختبار العبور البوابي للمحطة الثانية</span>
                  </h3>
                  <p>أجب عن الأسئلة الثلاثة بنسبة 100% (3 من 3) لتثبت جدارتك وتنال وسام شعلة الفضول!</p>
                </div>
                <div className="quest-quiz-score-badge">
                  {quizPassed ? '✅ 3 / 3 (اجتياز تام)' : `${Object.keys(quizAnswers).length} من 3 تمت الإجابة`}
                </div>
              </div>

              <div className="quest-quiz-questions">
                {QUIZ_QUESTIONS.map((q, idx) => {
                  const selected = quizAnswers[q.id];
                  const isAnswered = selected !== undefined;
                  const isCorrect = selected === q.correct;

                  return (
                    <div
                      key={q.id}
                      className={`quest-quiz-item ${quizSubmitted ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
                    >
                      <div className="quest-quiz-q-title">
                        <span className="quest-quiz-q-num">{idx + 1}</span>
                        <span>{q.question}</span>
                      </div>

                      <div className="quest-quiz-options">
                        {q.options.map((opt, optIdx) => {
                          let optClass = '';
                          if (selected === optIdx) optClass += ' selected';
                          if (quizSubmitted) {
                            if (optIdx === q.correct) optClass += ' correct-choice';
                            else if (selected === optIdx) optClass += ' wrong-choice';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              className={`quest-quiz-option ${optClass}`}
                              onClick={() => handleQuizOptionSelect(q.id, optIdx)}
                              disabled={quizPassed}
                            >
                              <span style={{ opacity: 0.7 }}>
                                {optIdx === 0 ? 'أ)' : optIdx === 1 ? 'ب)' : 'ج)'}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className={`quest-quiz-feedback ${isCorrect ? 'success' : 'error'}`}>
                          <i className={`fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                          <span>{isCorrect ? q.explanation : 'إجابة غير صحيحة، فكر في الهدف الحقيقي للعلماء وأعد المحاولة!'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              {!quizPassed ? (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="quest-btn-primary"
                    onClick={handleSubmitQuiz}
                  >
                    <i className="fas fa-check-double"></i>
                    <span>فحص الإجابات وتأكيد العبور</span>
                  </button>
                  {quizSubmitted && (
                    <button
                      type="button"
                      className="quest-btn-secondary"
                      onClick={handleResetQuiz}
                    >
                      <i className="fas fa-redo"></i>
                      <span>إعادة المحاولة من جديد</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="quest-pass-banner">
                  <div className="quest-pass-badge-reveal">🌟</div>
                  <h3 style={{ color: '#6ee7b7', margin: '0 0 0.5rem 0', fontSize: '1.4rem', fontWeight: 900 }}>
                    مبارك يا بطلنا {studentName}! لقد حصلت على "وسام شعلة الفضول" 🏅
                  </h3>
                  <p style={{ color: '#e2e8f0', margin: '0 0 1.2rem 0', fontSize: '1rem' }}>
                    لقد أثبتّ فهماً عميقاً لأهمية البحث العلمي وبداياته، وفُتحت لك بوابة المحطة الثانية!
                  </p>
                  <button
                    type="button"
                    className="quest-btn-primary"
                    onClick={() => {
                      playSound('click');
                      setActiveStation(2);
                    }}
                  >
                    <i className="fas fa-arrow-left"></i>
                    <span>انطلق إلى المحطة الثانية (سؤال البحث)</span>
                  </button>
                </div>
              )}
            </section>
          </main>
        )}

        {/* ========================================================= */}
        {/* STATION 2: Research Question & Socratic Mentor             */}
        {/* ========================================================= */}
        {activeStation === 2 && (
          <main>
            <div className="quest-section-header">
              <span className="quest-section-badge">المحطة 2 / 3</span>
              <h2 className="quest-section-title">صياغة سؤال البحث العلمي ومختبر مُشيرفي السقراطي</h2>
              <p className="quest-section-desc">
                السؤال الذكي هو بوصلة كل باحث! قارن بين الأسئلة، واكتب سؤالك الخاص ليقوم الروبوت مُشيرفي بدور الموجه السقراطي لمساعدتك في إتقانه.
              </p>
            </div>

            {/* Comparison Cards: Weak vs Strong Question */}
            <div className="quest-guide-comparison">
              <div className="quest-compare-card bad">
                <div className="quest-compare-header">
                  <i className="fas fa-times-circle"></i>
                  <span>السؤال المغلق أو الضعيف ❌</span>
                </div>
                <div className="quest-compare-quote">
                  "هل تحب النباتات أشعة الشمس؟"
                </div>
                <ul>
                  <li>إجابته مقتصرة على كلمة واحدة: (نعم أو لا).</li>
                  <li>يحتوي على كلمات غير علمية مثل "تحب" أو "تكره".</li>
                  <li>لا يحدد ماذا سنقيس بالأرقام أو التجارب.</li>
                </ul>
              </div>

              <div className="quest-compare-card good">
                <div className="quest-compare-header">
                  <i className="fas fa-check-circle"></i>
                  <span>السؤال العلمي الاستقصائي الذكي ✔️</span>
                </div>
                <div className="quest-compare-quote">
                  "كيف يؤثر عدد ساعات التعرض للشمس على معدل نمو أوراق النعناع؟"
                </div>
                <ul>
                  <li>يبدأ بـ "كيف يؤثر" أو "ما أثر" أو "ما العلاقة بين".</li>
                  <li>محدد بدقة ويحتوي على شيء نغيره (الساعات) وشيء نقيسه (طول الأوراق).</li>
                  <li>يفتح الباب لتجربة وملاحظات ملموسة بالأيام والسنتمترات.</li>
                </ul>
              </div>
            </div>

            {/* Socratic Question Dialogue Chamber */}
            <div className="quest-socratic-workspace">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    🤖
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#38bdf8' }}>
                      غرفة المحاورة السقراطية مع مُشيرفي
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                      اطرح فكرتك وناقش مُشيرفي خطوة بخطوة ليصل معك إلى سؤال علمي دقيق!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="quest-btn-secondary"
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem', borderRadius: '20px' }}
                  onClick={handleResetSocraticChat}
                  title="بدء حوار وتجربة جديدة"
                >
                  <i className="fas fa-redo-alt"></i>
                  <span>بدء حوار جديد</span>
                </button>
              </div>

              {/* Ideas Bank Shortcuts */}
              <div className="quest-ideas-pills-wrap" style={{ marginBottom: '1rem' }}>
                <div className="quest-ideas-title">
                  💡 أفكار ملهمة (اضغط على أي فكرة لمناقشتها مع مُشيرفي فوراً):
                </div>
                <div className="quest-ideas-pills">
                  {QUESTION_IDEAS.map((idea, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="quest-idea-pill"
                      onClick={() => {
                        handleSendSocraticMessage(idea.replace(/[🌱☀️☕🧊🪂⏱️🏃‍♂️❤️🥚🌊]/g, '').trim());
                      }}
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>

              {/* Socratic Chat History Area */}
              <div className="quest-socratic-chat-history">
                {socraticMessages.map((msg, idx) => (
                  <div key={msg.id || idx} className={`quest-chat-row ${msg.sender}`}>
                    <div className={`quest-chat-avatar ${msg.sender}`}>
                      {msg.sender === 'bot' ? '🤖' : '🎓'}
                    </div>

                    <div className="quest-chat-bubble-wrap">
                      <div className="quest-chat-bubble">
                        <div className="quest-chat-header-info">
                          <span>{msg.sender === 'bot' ? 'الروبوت مُشيرفي' : studentName}</span>
                          {msg.sender === 'bot' && (
                            <button
                              type="button"
                              className="quest-voice-btn"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                              onClick={() => {
                                playSound('click');
                                speakText(msg.text);
                              }}
                              title="استمع لصوت مُشيرفي"
                            >
                              <i className="fas fa-volume-up"></i> استمع
                            </button>
                          )}
                        </div>

                        <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                      </div>

                      {/* Interactive Suggestions under Bot replies */}
                      {msg.suggestions && msg.suggestions.length > 0 && !isQuestionApproved && (
                        <div className="quest-chat-suggestions">
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', width: '100%', marginBottom: '0.2rem' }}>
                            👇 ردود مقترحة (اضغط عليها أو اكتب ردك):
                          </span>
                          {msg.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              className="quest-suggestion-chip"
                              onClick={() => handleSendSocraticMessage(sug.replace(/[🌱☀️☕🧊🪂⏱️🏃‍♂️❤️🥚🌊📏🍃🍅⚡💧]/g, '').trim())}
                            >
                              <span>{sug}</span>
                              <i className="fas fa-arrow-left" style={{ fontSize: '0.75rem' }}></i>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isEvaluatingQuestion && (
                  <div className="quest-chat-row bot">
                    <div className="quest-chat-avatar bot">🤖</div>
                    <div className="quest-chat-bubble-wrap">
                      <div className="quest-chat-bubble" style={{ color: '#38bdf8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>مُشيرفي يفكر في إجابتك ويجهز التوجيه العلمي...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Approval Success Banner with Next Station Button */}
              {isQuestionApproved && (
                <div className="quest-chat-approved-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ fontSize: '2.5rem' }}>🔍🏆</div>
                    <div>
                      <h4 style={{ margin: 0, color: '#a7f3d0', fontSize: '1.15rem', fontWeight: 900 }}>
                        ألف مبارك يا {studentName}! تم اعتماد سؤالك العلمي بنجاح!
                      </h4>
                      <p style={{ margin: '0.3rem 0 0 0', color: '#e2e8f0', fontSize: '0.92rem' }}>
                        السؤال المعتمد: <strong>"{researchQuestion}"</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="quest-btn-primary"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)', padding: '0.85rem 1.8rem', fontSize: '1.05rem' }}
                    onClick={() => {
                      playSound('click');
                      setActiveStation(3);
                    }}
                  >
                    <span>الانتقال للمحطة 3 (بناء الفرضيات)</span>
                    <i className="fas fa-arrow-left"></i>
                  </button>
                </div>
              )}

              {/* Interactive Chat Input Bar */}
              {!isQuestionApproved && (
                <form
                  className="quest-chat-input-container"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendSocraticMessage();
                  }}
                  style={{ marginTop: '1rem' }}
                >
                  <input
                    type="text"
                    className="quest-chat-text-input"
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    placeholder="اكتب ردك أو صيغتك لسؤال البحث وناقش مُشيرفي..."
                    disabled={isEvaluatingQuestion}
                  />

                  <button
                    type="submit"
                    className="quest-chat-send-btn"
                    disabled={isEvaluatingQuestion || !chatInputText.trim()}
                  >
                    <span>إرسال</span>
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </form>
              )}
            </div>
          </main>
        )}

        {/* ========================================================= */}
        {/* STATION 3: Hypotheses Workshop                            */}
        {/* ========================================================= */}
        {activeStation === 3 && (
          <main>
            <div className="quest-section-header">
              <span className="quest-section-badge">المحطة 3 / 3</span>
              <h2 className="quest-section-title">ورشة بناء الفرضيات العلمية الذكية</h2>
              <p className="quest-section-desc">
                الفرضية ليست مجرد تخمين عشوائي! إنها توقع ذكي ومبرر علمياً. ركّب فرضيّتك الذهبية المربوطة بسؤال بحثك لتصل لمنصة التتويج!
              </p>
            </div>

            {/* Golden Formula Card */}
            <div className="quest-formula-card">
              <div className="quest-formula-title">
                ✨ معادلة الفرضية الذهبية للمستكشفين الأبطال ✨
              </div>
              <div className="quest-formula-blocks">
                <div className="quest-formula-block if">
                  1. إذا قمنا بـ [التغيير/المتغير المستقل]
                </div>
                <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>➔</span>
                <div className="quest-formula-block then">
                  2. فإننا نتوقع أن [النتيجة المحتملة]
                </div>
                <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>➔</span>
                <div className="quest-formula-block because">
                  3. لأن [السبب أو التفسير العلمي]
                </div>
              </div>
            </div>

            {/* Practice Matching Exercise */}
            <section className="quest-matching-card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#38bdf8', margin: '0 0 0.5rem 0' }}>
                🎮 تمرين تدريبي: طابق بين السؤال والفرضية المناسبة له
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', margin: '0 0 1rem 0' }}>
                تأمل كيف ترتبط كل فرضية بسؤال البحث وتفسر النتيجة بالسبب:
              </p>

              <div className="quest-matching-pairs">
                {MATCHING_PAIRS.map((pair, idx) => (
                  <div key={idx} className="quest-match-row">
                    <div className="quest-match-box quest-match-q">
                      <strong style={{ color: '#7dd3fc', display: 'block', marginBottom: '0.2rem' }}>
                        سؤال {idx + 1}:
                      </strong>
                      {pair.q}
                    </div>
                    <div className="quest-match-box quest-match-h">
                      <strong style={{ color: '#6ee7b7', display: 'block', marginBottom: '0.2rem' }}>
                        الفرضية المقابلة:
                      </strong>
                      {pair.h}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Student's Custom Hypothesis Builder */}
            <div className="quest-socratic-workspace">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fef08a', margin: '0 0 0.5rem 0' }}>
                🛠️ مختبر بناء فرضيتك الخاصة
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 1.5rem 0' }}>
                بناءً على سؤال بحثك:{' '}
                <span style={{ color: '#38bdf8', fontWeight: 800 }}>
                  "{researchQuestion || 'سؤال بحثك العلمي'}"
                </span>
              </p>

              <div className="quest-hypothesis-inputs">
                {/* 1. If */}
                <div className="quest-hypo-field-wrap">
                  <span className="quest-hypo-tag if-tag">
                    <i className="fas fa-sliders-h"></i>
                    <span>1. إذا قمنا بـ (ما الذي سنغيره في التجربة؟):</span>
                  </span>
                  <input
                    type="text"
                    className="quest-hypo-input"
                    value={hypoIf}
                    onChange={(e) => setHypoIf(e.target.value)}
                    placeholder="مثال: زيادة عدد ساعات الضوء للنبتة إلى 8 ساعات يومياً"
                  />
                </div>

                {/* 2. Then */}
                <div className="quest-hypo-field-wrap">
                  <span className="quest-hypo-tag then-tag">
                    <i className="fas fa-chart-line"></i>
                    <span>2. فإننا نتوقع أن (ما هي النتيجة التي تتوقع حدوثها؟):</span>
                  </span>
                  <input
                    type="text"
                    className="quest-hypo-input"
                    value={hypoThen}
                    onChange={(e) => setHypoThen(e.target.value)}
                    placeholder="مثال: تنمو أوراق النعناع بمعدل أسرع ويزداد طول الساق"
                  />
                </div>

                {/* 3. Because */}
                <div className="quest-hypo-field-wrap">
                  <span className="quest-hypo-tag because-tag">
                    <i className="fas fa-brain"></i>
                    <span>3. لأن (ما هو التفسير أو السبب العلمي لتوقعك؟):</span>
                  </span>
                  <input
                    type="text"
                    className="quest-hypo-input"
                    value={hypoBecause}
                    onChange={(e) => setHypoBecause(e.target.value)}
                    placeholder="مثال: الضوء يمكّن النبات من صنع غذائه بكفاءة عبر عملية البناء الضوئي"
                  />
                </div>
              </div>

              {/* Assembled Preview */}
              {(hypoIf || hypoThen || hypoBecause) && (
                <div className="quest-hypo-preview-box">
                  <div className="quest-hypo-preview-title">
                    <i className="fas fa-eye"></i>
                    <span>معاينة الفرضية الكاملة المصاغة:</span>
                  </div>
                  <div className="quest-hypo-assembled-text">
                    "إذا قمنا بـ <span style={{ color: '#38bdf8' }}>{hypoIf || '...'}</span>، فإننا نتوقع أن{' '}
                    <span style={{ color: '#f59e0b' }}>{hypoThen || '...'}</span>، لأن{' '}
                    <span style={{ color: '#10b981' }}>{hypoBecause || '...'}</span>."
                  </div>
                </div>
              )}

              {/* Submit Hypothesis */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="quest-btn-primary"
                  onClick={handleApproveHypothesis}
                  disabled={!hypoIf.trim() || !hypoThen.trim() || !hypoBecause.trim()}
                >
                  <i className="fas fa-check-circle"></i>
                  <span>اعتماد الفرضية والانتقال للمحطة 4 (كتابة وتوثيق الخلفية العلمية) 📚</span>
                </button>
              </div>
            </div>
          </main>
        )}

        {/* ========================================================= */}
        {/* STATION 4: Scientific Background & Literature Review (جديد) */}
        {/* ========================================================= */}
        {activeStation === 4 && (
          <main>
            <div className="quest-section-header">
              <span className="quest-section-badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', borderColor: '#a855f7' }}>
                المحطة 4 / 4 📚
              </span>
              <h2 className="quest-section-title">
                ورشة كتابة وتوثيق الخلفية العلمية والمصادر 📖✍️
              </h2>
              <p className="quest-section-desc">
                العالِم الحقيقي لا يبدأ من الصفر، بل يقرأ ما اكتشفه الآخرون ويبني عليه! هنا سنساعدك على استخراج المصادر، واختيار عناوين ومفاتيح البحث، وصياغة فقراتك وتدقيقها خطوة بخطوة مع الروبوت مُشيرفي.
              </p>
            </div>

            {/* Context Reminder Banner */}
            <div className="quest-bg-context-banner">
              <div className="context-item">
                <span className="label"><i className="fas fa-question-circle"></i> سؤال بحثك المعتمد:</span>
                <strong className="val">"{researchQuestion || 'سؤال بحثك العلمي'}"</strong>
              </div>
              {hypoIf && (
                <div className="context-item">
                  <span className="label"><i className="fas fa-flask"></i> فرضيتك المصاغة:</span>
                  <strong className="val">"إذا قمنا بـ {hypoIf}، فإننا نتوقع أن {hypoThen}، لأن {hypoBecause}."</strong>
                </div>
              )}
            </div>

            {/* PART 1: Search Compass & Keywords (توجيه الطالب لعناوين ومفاتيح البحث) */}
            <section className="quest-card quest-bg-compass-card">
              <div className="quest-card-header">
                <div className="quest-card-header-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  🧭
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#38bdf8' }}>
                    1. بوصلة الاستكشاف: عناوين ومفاتيح البحث الموجهة
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
                    استخدم هذه الكلمات والمحاور المقترحة للبحث في محركات البحث أو المكتبة المدرسية لتجمع معلومات موثوقة:
                  </p>
                </div>
                <button
                  type="button"
                  className="quest-btn-secondary"
                  onClick={handleGenerateKeywords}
                  disabled={isGeneratingKeywords}
                  style={{ marginRight: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.82rem', borderRadius: '20px' }}
                >
                  <i className={`fas ${isGeneratingKeywords ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
                  <span>{isGeneratingKeywords ? 'جاري التوليد...' : 'اقترح مفاتيح جديدة 🤖'}</span>
                </button>
              </div>

              {/* Keywords Pills */}
              <div className="quest-bg-keywords-grid">
                {bgKeywords.map((kw, idx) => (
                  <div key={idx} className="quest-bg-kw-pill">
                    <span className="kw-icon">🔍</span>
                    <span className="kw-text">{kw}</span>
                    <a
                      href={`https://ar.wikipedia.org/w/index.php?search=${encodeURIComponent(kw.replace(/[^\u0600-\u06FF\s]/g, '').trim())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="kw-search-link"
                      title="ابحث في ويكيبيديا العربية الآمنة"
                    >
                      <i className="fas fa-external-link-alt"></i>
                    </a>
                  </div>
                ))}
              </div>

              {/* Quick Trusted Portals for Kids */}
              <div className="quest-trusted-portals-row">
                <span className="portals-title">🌐 بوابات معرفية موثوقة وآمنة للطلاب:</span>
                <div className="portal-links">
                  <a href="https://ar.wikipedia.org" target="_blank" rel="noopener noreferrer" className="portal-chip">
                    📚 ويكيبيديا العربية
                  </a>
                  <a href="https://kids.nationalgeographic.com" target="_blank" rel="noopener noreferrer" className="portal-chip">
                    🌍 ناشيونال جيوغرافيك كيدز
                  </a>
                  <a href="https://ar.brainpop.com" target="_blank" rel="noopener noreferrer" className="portal-chip">
                    💡 براين بوب التعليمي
                  </a>
                </div>
              </div>
            </section>

            {/* PART 2: Sources Radar & Documentation (مساعدة الطالب في استخراج وتوثيق المصادر) */}
            <section className="quest-card quest-bg-sources-card">
              <div className="quest-card-header">
                <div className="quest-card-header-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  📖
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>
                    2. رادار المصادر والمراجع المعتمدة (الأمانة العلمية)
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
                    وثّق الكتب، الموسوعات، أو المواقع التي استعنت بها. الباحث الأمين يذكر دائماً من أين حصل على معلومته!
                  </p>
                </div>
                <button
                  type="button"
                  className="quest-btn-primary"
                  onClick={() => setShowAddSourceModal(true)}
                  style={{ marginRight: 'auto', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  <i className="fas fa-plus"></i>
                  <span>إضافة مرجع جديد</span>
                </button>
              </div>

              {/* Golden Rule Tip */}
              <div className="quest-source-golden-tip">
                <div className="tip-badge">💡 قاعدة ذهبية للمستكشف</div>
                <p>
                  <strong>كيف أعرف أن المصدر موثوق؟</strong> المصدر الموثوق هو كتاب مدرسي، أو موقع تشرف عليه وزارة التربية والتعليم، أو موسوعة علمية معروفة. تجنب المنتديات والمنشورات العشوائية في وسائل التواصل التي لا يُعرف كاتبها!
                </p>
              </div>

              {/* Sources List */}
              <div className="quest-sources-list">
                {bgSources.map((src, idx) => (
                  <div key={src.id || idx} className="quest-source-item">
                    <div className="src-num">[{idx + 1}]</div>
                    <div className="src-details">
                      <div className="src-title-row">
                        <span className="src-type-tag">{src.type}</span>
                        <strong className="src-title">{src.title}</strong>
                      </div>
                      <div className="src-meta">
                        <span>المؤلف / الجهة: <strong>{src.author}</strong></span>
                        {src.note && <span className="src-note">📝 {src.note}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="src-delete-btn"
                      onClick={() => handleDeleteSource(src.id)}
                      title="حذف هذا المرجع"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Source Modal / Inline Form */}
              {showAddSourceModal && (
                <form className="quest-add-source-modal-box" onSubmit={handleAddSource}>
                  <div className="modal-inner-header">
                    <h4>➕ توثيق مرجع جديد في بحثك العلمي</h4>
                    <button type="button" onClick={() => setShowAddSourceModal(false)}>×</button>
                  </div>
                  <div className="modal-inner-grid">
                    <div>
                      <label>عنوان الكتاب أو المقال أو الموقع:</label>
                      <input
                        type="text"
                        value={newSourceTitle}
                        onChange={(e) => setNewSourceTitle(e.target.value)}
                        placeholder="مثال: كتاب العلوم للصف الخامس - الوحدة الثانية"
                        required
                      />
                    </div>
                    <div>
                      <label>اسم المؤلف أو الجهة الناشرة:</label>
                      <input
                        type="text"
                        value={newSourceAuthor}
                        onChange={(e) => setNewSourceAuthor(e.target.value)}
                        placeholder="مثال: وزارة التربية والتعليم أو د. أحمد زويل"
                      />
                    </div>
                    <div>
                      <label>نوع المصدر:</label>
                      <select value={newSourceType} onChange={(e) => setNewSourceType(e.target.value)}>
                        <option value="كتاب مدرسي">كتاب مدرسي 📚</option>
                        <option value="موسوعة علمية">موسوعة علمية 🏛️</option>
                        <option value="موقع إنترنت موثوق">موقع إنترنت موثوق 🌐</option>
                        <option value="مقال في مجلة علمية">مقال في مجلة علمية 📰</option>
                        <option value="معلم أو خبير مختص">معلم أو خبير مختص 👨‍🏫</option>
                      </select>
                    </div>
                    <div>
                      <label>ما الفكرة الرئيسية التي استفدتها من هذا المرجع؟</label>
                      <input
                        type="text"
                        value={newSourceNote}
                        onChange={(e) => setNewSourceNote(e.target.value)}
                        placeholder="مثال: تعريف مفهوم البناء الضوئي وأهمية الضوء"
                      />
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="submit" className="quest-btn-primary">حفظ المرجع ✅</button>
                    <button type="button" className="quest-btn-secondary" onClick={() => setShowAddSourceModal(false)}>إلغاء</button>
                  </div>
                </form>
              )}
            </section>

            {/* PART 3: Step-by-Step Interactive Paragraph Writing (مساعد الطالب وتصليح الفقرات فقرة فقرة) */}
            <section className="quest-card quest-bg-writer-card">
              <div className="quest-card-header">
                <div className="quest-card-header-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                  ✍️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#ec4899' }}>
                    3. ورشة الصياغة الذكية: كتابة الخلفية العلمية فقرة بفقرة
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
                    لا ننسخ نصوصاً جاهزة! اكتب مسودتك بأسلوبك وكلماتك، وسيقوم الروبوت "مُشيرفي" بفحصها وتصحيحها لغوياً وعلمياً معك لضمان تميزك ومشاركتك الفعالة:
                  </p>
                </div>
              </div>

              {/* 3 Paragraphs Nav Tabs */}
              <div className="quest-p-tabs">
                <button
                  type="button"
                  className={`quest-p-tab ${bgActiveTab === 1 ? 'active' : ''} ${bgParagraph1.trim() && bgReviews[1]?.isApproved ? 'done' : ''}`}
                  onClick={() => setBgActiveTab(1)}
                >
                  <span className="p-num">1</span>
                  <span>الفقرة الأولى: المفهوم والتعريف</span>
                  {bgReviews[1]?.isApproved && <i className="fas fa-check-circle done-icon"></i>}
                </button>
                <button
                  type="button"
                  className={`quest-p-tab ${bgActiveTab === 2 ? 'active' : ''} ${bgParagraph2.trim() && bgReviews[2]?.isApproved ? 'done' : ''}`}
                  onClick={() => setBgActiveTab(2)}
                >
                  <span className="p-num">2</span>
                  <span>الفقرة الثانية: التفسير العلمي والعلاقة</span>
                  {bgReviews[2]?.isApproved && <i className="fas fa-check-circle done-icon"></i>}
                </button>
                <button
                  type="button"
                  className={`quest-p-tab ${bgActiveTab === 3 ? 'active' : ''} ${bgParagraph3.trim() && bgReviews[3]?.isApproved ? 'done' : ''}`}
                  onClick={() => setBgActiveTab(3)}
                >
                  <span className="p-num">3</span>
                  <span>الفقرة الثالثة: الأهمية والتطبيق الواقعي</span>
                  {bgReviews[3]?.isApproved && <i className="fas fa-check-circle done-icon"></i>}
                </button>
              </div>

              {/* Paragraph 1 Tab Panel */}
              {bgActiveTab === 1 && (
                <div className="quest-p-panel">
                  <div className="quest-p-instruction">
                    <span className="inst-badge">🎯 مهمتك في الفقرة الأولى:</span>
                    <strong>عرّف المفهوم الأساسي لسؤال بحثك بأسلوبك الخاص.</strong>
                    <p>ما هي الظاهرة التي تدرسها؟ ما هي المصطلحات العلمية المركزية التي يحتاجها القارئ ليفهم موضوعك؟</p>
                  </div>

                  <div className="quest-p-textarea-wrap">
                    <textarea
                      className="quest-p-textarea"
                      rows={4}
                      value={bgParagraph1}
                      onChange={(e) => setBgParagraph1(e.target.value)}
                      placeholder="اكتب مسودتك هنا... مثال: يتناول بحثي ظاهرة نمو النباتات وعلاقتها بضوء الشمس، حيث يعتبر الضوء عاملاً حيوياً أساسياً تحتاجه النباتات..."
                    />
                    <div className="textarea-footer">
                      <span className="char-count">{bgParagraph1.length} حرفاً</span>
                      <button
                        type="button"
                        className="quest-check-btn"
                        onClick={() => handleReviewParagraphWithAI(1)}
                        disabled={isReviewingParagraph === 1 || !bgParagraph1.trim()}
                      >
                        <i className={`fas ${isReviewingParagraph === 1 ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                        <span>{isReviewingParagraph === 1 ? 'مُشيرفي يفحص فقرتك...' : '🤖 صلّح ودقّق فقرّتي مع مُشيرفي'}</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Feedback for Paragraph 1 */}
                  {bgReviews[1] && (
                    <div className="quest-ai-review-box">
                      <div className="review-header">
                        <span className="bot-tag">🤖 ملاحظات وتصحيح مُشيرفي:</span>
                      </div>
                      <p className="review-feedback">{bgReviews[1].feedback}</p>
                      {bgReviews[1].polished && (
                        <div className="review-polished-wrap">
                          <span className="polished-label">✨ الصياغة المحسنة والمصقولة علمياً:</span>
                          <div className="polished-text">"{bgReviews[1].polished}"</div>
                          <div className="polished-actions">
                            <button
                              type="button"
                              className="quest-btn-primary"
                              onClick={() => handleApplyPolishedParagraph(1)}
                            >
                              <i className="fas fa-check"></i>
                              <span>اعتماد الصياغة المصقولة والانتقال للفقرة 2 ➔</span>
                            </button>
                            <button
                              type="button"
                              className="quest-btn-secondary"
                              onClick={() => handleKeepStudentParagraph(1)}
                            >
                              <span>أفضّل الاستمرار بصياغتي الحالية والتقدم ➔</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Paragraph 2 Tab Panel */}
              {bgActiveTab === 2 && (
                <div className="quest-p-panel">
                  <div className="quest-p-instruction">
                    <span className="inst-badge">🎯 مهمتك في الفقرة الثانية:</span>
                    <strong>اشرح التفسير العلمي والعلاقة بين المتغيرات.</strong>
                    <p>بناءً على ما قرأته في المراجع، كيف تؤثر المتغيرات ببعضها؟ ما السبب العلمي الذي يفسر حدوث هذه الظاهرة في الطبيعة؟</p>
                  </div>

                  <div className="quest-p-textarea-wrap">
                    <textarea
                      className="quest-p-textarea"
                      rows={4}
                      value={bgParagraph2}
                      onChange={(e) => setBgParagraph2(e.target.value)}
                      placeholder="اكتب مسودتك هنا... مثال: تفسر المراجع العلمية أن أوراق النبات تحتوي على مادة الكلوروفيل التي تمتص أشعة الشمس لتصنع الغذاء عبر البناء الضوئي..."
                    />
                    <div className="textarea-footer">
                      <span className="char-count">{bgParagraph2.length} حرفاً</span>
                      <button
                        type="button"
                        className="quest-check-btn"
                        onClick={() => handleReviewParagraphWithAI(2)}
                        disabled={isReviewingParagraph === 2 || !bgParagraph2.trim()}
                      >
                        <i className={`fas ${isReviewingParagraph === 2 ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                        <span>{isReviewingParagraph === 2 ? 'مُشيرفي يفحص فقرتك...' : '🤖 صلّح ودقّق فقرّتي مع مُشيرفي'}</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Feedback for Paragraph 2 */}
                  {bgReviews[2] && (
                    <div className="quest-ai-review-box">
                      <div className="review-header">
                        <span className="bot-tag">🤖 ملاحظات وتصحيح مُشيرفي:</span>
                      </div>
                      <p className="review-feedback">{bgReviews[2].feedback}</p>
                      {bgReviews[2].polished && (
                        <div className="review-polished-wrap">
                          <span className="polished-label">✨ الصياغة المحسنة والمصقولة علمياً:</span>
                          <div className="polished-text">"{bgReviews[2].polished}"</div>
                          <div className="polished-actions">
                            <button
                              type="button"
                              className="quest-btn-primary"
                              onClick={() => handleApplyPolishedParagraph(2)}
                            >
                              <i className="fas fa-check"></i>
                              <span>اعتماد الصياغة المصقولة والانتقال للفقرة 3 ➔</span>
                            </button>
                            <button
                              type="button"
                              className="quest-btn-secondary"
                              onClick={() => handleKeepStudentParagraph(2)}
                            >
                              <span>أفضّل الاستمرار بصياغتي الحالية والتقدم ➔</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Paragraph 3 Tab Panel */}
              {bgActiveTab === 3 && (
                <div className="quest-p-panel">
                  <div className="quest-p-instruction">
                    <span className="inst-badge">🎯 مهمتك في الفقرة الثالثة:</span>
                    <strong>وضّح أهمية هذا البحث وتطبيقاته في حياتنا وبيئتنا.</strong>
                    <p>لماذا قمت باختيار هذا الموضوع؟ كيف يساعدنا هذا الفهم في الزراعة، الصحة، البيئة، أو حل مشكلات في مدرستنا ومجتمعنا؟</p>
                  </div>

                  <div className="quest-p-textarea-wrap">
                    <textarea
                      className="quest-p-textarea"
                      rows={4}
                      value={bgParagraph3}
                      onChange={(e) => setBgParagraph3(e.target.value)}
                      placeholder="اكتب مسودتك هنا... مثال: تكمن أهمية هذا البحث في مساعدة المزارعين في قرية مشيرفة على اختيار أفضل الأماكن المشمسة لزراعة المحاصيل وزيادة الإنتاج..."
                    />
                    <div className="textarea-footer">
                      <span className="char-count">{bgParagraph3.length} حرفاً</span>
                      <button
                        type="button"
                        className="quest-check-btn"
                        onClick={() => handleReviewParagraphWithAI(3)}
                        disabled={isReviewingParagraph === 3 || !bgParagraph3.trim()}
                      >
                        <i className={`fas ${isReviewingParagraph === 3 ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                        <span>{isReviewingParagraph === 3 ? 'مُشيرفي يفحص فقرتك...' : '🤖 صلّح ودقّق فقرّتي مع مُشيرفي'}</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Feedback for Paragraph 3 */}
                  {bgReviews[3] && (
                    <div className="quest-ai-review-box">
                      <div className="review-header">
                        <span className="bot-tag">🤖 ملاحظات وتصحيح مُشيرفي:</span>
                      </div>
                      <p className="review-feedback">{bgReviews[3].feedback}</p>
                      {bgReviews[3].polished && (
                        <div className="review-polished-wrap">
                          <span className="polished-label">✨ الصياغة المحسنة والمصقولة علمياً:</span>
                          <div className="polished-text">"{bgReviews[3].polished}"</div>
                          <div className="polished-actions">
                            <button
                              type="button"
                              className="quest-btn-primary"
                              onClick={() => handleApplyPolishedParagraph(3)}
                            >
                              <i className="fas fa-check"></i>
                              <span>اعتماد الصياغة المصقولة ✅</span>
                            </button>
                            <button
                              type="button"
                              className="quest-btn-secondary"
                              onClick={() => handleKeepStudentParagraph(3)}
                            >
                              <span>أفضّل الاستمرار بصياغتي الحالية ✅</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* PART 4: Consolidated Scientific Background & Approval */}
            <section className="quest-card quest-bg-consolidated-preview">
              <div className="consolidated-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontSize: '2rem' }}>📜</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#fef08a' }}>
                      معاينة ورقة الخلفية العلمية الكاملة لبحثك
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      هكذا ستظهر خلفيتك العلمية الموثقة في تقرير بحثك النهائي وشهادتك المدرسية:
                    </p>
                  </div>
                </div>
                <div className="completion-status-chip">
                  <span>الفقرات المكتملة: </span>
                  <strong>{[bgParagraph1, bgParagraph2, bgParagraph3].filter(p => p.trim()).length} من 3</strong>
                </div>
              </div>

              <div className="consolidated-paper">
                <h4 className="paper-title">الخلفية العلمية: {researchQuestion || 'موضوع البحث العلمي'}</h4>
                <div className="paper-body">
                  <p className="paper-paragraph">
                    <strong>[ 1 ] المفهوم المركزي:</strong> {bgParagraph1.trim() || <span className="empty-hint">(لم تُكتب الفقرة الأولى بعد...)</span>}
                  </p>
                  <p className="paper-paragraph">
                    <strong>[ 2 ] التفسير العلمي والعلاقة:</strong> {bgParagraph2.trim() || <span className="empty-hint">(لم تُكتب الفقرة الثانية بعد...)</span>}
                  </p>
                  <p className="paper-paragraph">
                    <strong>[ 3 ] الأهمية والتطبيق الواقعي:</strong> {bgParagraph3.trim() || <span className="empty-hint">(لم تُكتب الفقرة الثالثة بعد...)</span>}
                  </p>
                </div>

                <div className="paper-sources">
                  <h5>📖 المراجع والمصادر المستفاد منها ({bgSources.length}):</h5>
                  <ol>
                    {bgSources.map((s, idx) => (
                      <li key={s.id || idx}>
                        <strong>{s.title}</strong> — {s.author} ({s.type})
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Approval Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="quest-btn-primary"
                  onClick={handleApproveBackground}
                  disabled={!bgParagraph1.trim() || !bgParagraph2.trim() || !bgParagraph3.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 8px 30px rgba(16, 185, 129, 0.45)',
                    padding: '1rem 2.2rem',
                    fontSize: '1.15rem'
                  }}
                >
                  <i className="fas fa-award"></i>
                  <span>🌟 اعتماد الخلفية العلمية والتتويج بالشهادة الذهبية 🏆</span>
                </button>
              </div>
            </section>
          </main>
        )}

        {/* ========================================================= */}
        {/* STATION 5: Finale & Explorer Certificate                  */}
        {/* ========================================================= */}
        {activeStation === 5 && (
          <main>
            <div className="quest-section-header">
              <span className="quest-section-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', borderColor: '#f59e0b' }}>
                منصة التتويج والإنجاز 🏆
              </span>
              <h2 className="quest-section-title">شهادة المستكشف العلمي الصغير</h2>
              <p className="quest-section-desc">
                ألف مبارك يا بطلنا المتألق! لقد أتقنت خطوات البحث العلمي الأربع (الملاحظة والأساسيات، صياغة السؤال، بناء الفرضية، وتوثيق الخلفية العلمية والمصادر).
              </p>
            </div>

            {/* Official Elementary School Certificate */}
            <div className="quest-certificate-outer" id="printable-certificate">
              <div className="quest-cert-watermark">🔬</div>

              <div className="quest-cert-header">
                <div className="quest-cert-school-name">
                  🏫 مدرسة مشيرفة الابتدائية - واحة التميز والإبداع
                </div>
                <h2 className="quest-cert-main-title">
                  شهادة وسام المستكشف العلمي الصغير 🎓✨
                </h2>
                <div className="quest-cert-subtitle">
                  تُمنح هذه الشهادة تقديراً للتفوق والتميز في إتقان خطوات البحث العلمي والتفكير الاستقصائي
                </div>
              </div>

              <div className="quest-cert-student-name-box">
                <div className="quest-cert-present-to">تُمنح بكل فخر واعتزاز للعالم الصغير:</div>
                <div className="quest-cert-name">{studentName}</div>
                <div style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 800 }}>
                  {studentClass}
                </div>
              </div>

              <p className="quest-cert-praise">
                لقد خاض الطالب رحلة استكشافية متكاملة برفقة <strong>الروبوت مُشيرفي</strong>، وأظهر فضولاً علمياً ناضجاً في فهم المنهج العلمي، وصياغة سؤال بحث استقصائي دقيق، وبناء فرضية مبررة، وتوثيق خلفية علمية رصينة مستندة إلى مصادر ومراجع موثوقة.
              </p>

              {/* Research Project Summary */}
              <div className="quest-cert-project-summary">
                <div className="quest-cert-summary-row">
                  <strong>🔍 سؤال البحث العلمي المعتمد:</strong>{' '}
                  <span>"{researchQuestion || 'كيف يؤثر ضوء الشمس على سرعة نمو النبات؟'}"</span>
                </div>
                <div className="quest-cert-summary-row">
                  <strong>🧪 الفرضية العلمية المصاغة:</strong>{' '}
                  <span>
                    "إذا قمنا بـ {hypoIf || 'زيادة الضوء'}، فإننا نتوقع أن {hypoThen || 'تنمو الأوراق أسرع'}، لأن{' '}
                    {hypoBecause || 'الضوء ضروري لعملية البناء الضوئي'}."
                  </span>
                </div>

                {/* Scientific Background in Certificate */}
                {(bgParagraph1 || bgParagraph2 || bgParagraph3) && (
                  <div className="quest-cert-summary-row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginTop: '0.8rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.8rem' }}>
                    <strong style={{ color: '#0369a1', marginBottom: '0.4rem' }}>📚 ملخص الخلفية العلمية للبحث:</strong>
                    <div style={{ fontSize: '0.92rem', lineHeight: '1.75', color: '#1e293b', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' }}>
                      {bgParagraph1 && <p style={{ margin: '0 0 6px 0' }}>• {bgParagraph1}</p>}
                      {bgParagraph2 && <p style={{ margin: '0 0 6px 0' }}>• {bgParagraph2}</p>}
                      {bgParagraph3 && <p style={{ margin: 0 }}>• {bgParagraph3}</p>}
                    </div>
                  </div>
                )}

                {/* Sources in Certificate */}
                {bgSources && bgSources.length > 0 && (
                  <div className="quest-cert-summary-row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginTop: '0.6rem' }}>
                    <strong style={{ color: '#059669', marginBottom: '0.3rem', fontSize: '0.85rem' }}>📖 المراجع والمصادر الموثقة:</strong>
                    <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      {bgSources.map((s, idx) => (
                        <span key={s.id || idx} style={{ background: '#ecfdf5', padding: '3px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                          [{idx + 1}] {s.title} ({s.author})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Badges Earned */}
              <div className="quest-cert-badges-row">
                <div className="quest-cert-badge-item">
                  <div className="quest-cert-badge-circle">🌟</div>
                  <span>شعلة الفضول</span>
                </div>
                <div className="quest-cert-badge-item">
                  <div className="quest-cert-badge-circle">🔍</div>
                  <span>مفتاح التساؤل</span>
                </div>
                <div className="quest-cert-badge-item">
                  <div className="quest-cert-badge-circle">🧪</div>
                  <span>صانع الفرضيات</span>
                </div>
                <div className="quest-cert-badge-item">
                  <div className="quest-cert-badge-circle">📜</div>
                  <span>الخلفية والمصادر</span>
                </div>
                <div className="quest-cert-badge-item">
                  <div className="quest-cert-badge-circle">🏆</div>
                  <span>المستكشف الذهبي</span>
                </div>
              </div>

              {/* Certificate Footer & Signatures */}
              <div className="quest-cert-footer">
                <div className="quest-cert-sig-box">
                  <span>التاريخ:</span>
                  <strong>{new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </div>

                <div className="quest-cert-sig-box">
                  <span>مرشد البحث العلمي:</span>
                  <strong>الروبوت مُشيرفي (Musheirifi 🤖)</strong>
                </div>

                <div className="quest-cert-sig-box">
                  <span>إدارة المدرسة:</span>
                  <strong>مدرسة مشيرفة الابتدائية</strong>
                </div>
              </div>
            </div>

            {/* Actions: Print, New Quest */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="quest-btn-primary"
                onClick={() => {
                  playSound('click');
                  window.print();
                }}
              >
                <i className="fas fa-print"></i>
                <span>طباعة أو حفظ الشهادة والتقرير (PDF)</span>
              </button>

              <button
                type="button"
                className="quest-btn-secondary"
                onClick={() => {
                  playSound('click');
                  setActiveStation(0);
                }}
              >
                <i className="fas fa-home"></i>
                <span>العودة لخريطة الرحلة</span>
              </button>

              <button
                type="button"
                className="quest-btn-secondary"
                onClick={() => {
                  if (window.confirm('هل تود بدء رحلة جديدة بسؤال بحث وتجربة مختلفة؟')) {
                    setResearchQuestion('');
                    setSocraticFeedback('');
                    setIsQuestionApproved(false);
                    setHypoIf('');
                    setHypoThen('');
                    setHypoBecause('');
                    setIsHypoApproved(false);
                    setBgParagraph1('');
                    setBgParagraph2('');
                    setBgParagraph3('');
                    setIsBgApproved(false);
                    setBgReviews({});
                    localStorage.removeItem('quest_research_question');
                    localStorage.removeItem('quest_socratic_feedback');
                    localStorage.removeItem('quest_question_approved');
                    localStorage.removeItem('quest_hypo_if');
                    localStorage.removeItem('quest_hypo_then');
                    localStorage.removeItem('quest_hypo_because');
                    localStorage.removeItem('quest_hypo_approved');
                    localStorage.removeItem('quest_bg_p1');
                    localStorage.removeItem('quest_bg_p2');
                    localStorage.removeItem('quest_bg_p3');
                    localStorage.removeItem('quest_bg_approved');
                    localStorage.removeItem('quest_bg_reviews');
                    setActiveStation(2);
                  }
                }}
              >
                <i className="fas fa-sync-alt"></i>
                <span>خوض تجربة بحثية جديدة</span>
              </button>
            </div>
          </main>
        )}

        {/* 🧞‍♂️ Magical AI Research Genie Assistant */}
        <GenieAssistant studentName={studentName} />
      </div>
    </div>
  );
};

export default ScientificResearchQuest;
