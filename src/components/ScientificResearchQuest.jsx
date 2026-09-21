import React, { useState, useEffect, useRef } from 'react';
import { generateAiResponse } from '../utils/aiService';
import './ScientificResearchQuest.css';

// -------------------------------------------------------------
// Audio Sound Synthesizer via Web Audio API (Zero external assets)
// -------------------------------------------------------------
const playSound = (type = 'click') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (!ctx) return;

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
  // Personalization & Journey State
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('school_unified_student_name') || 'مستكشفنا البطل';
  });
  const [studentClass, setStudentClass] = useState(() => {
    return localStorage.getItem('school_unified_student_class') || 'الصف الخامس';
  });

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
        explorer: false
      };
    } catch {
      return { curiosity: false, question: false, hypothesis: false, explorer: false };
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
  // Station 2: Research Question State
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

  // Sync state changes to LocalStorage
  useEffect(() => {
    localStorage.setItem('school_unified_student_name', studentName);
    localStorage.setItem('quest_active_station', activeStation);
    localStorage.setItem('quest_unlocked_stations', JSON.stringify(unlockedStations));
    localStorage.setItem('quest_badges', JSON.stringify(badges));
  }, [studentName, activeStation, unlockedStations, badges]);

  // Handle Text-To-Speech
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('ميزة القراءة الصوتية غير مدعومة في متصفحك.');
      return;
    }

    if (speakingText === text) {
      window.speechSynthesis.cancel();
      setSpeakingText(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[🔍💡🌍🌱🔄☀️🧊🪂⏱️🏃‍♂️❤️🥚🌊✨🤖🎙️]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;
    utterance.pitch = 1.1;

    // Pick best Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find(v => v.lang.startsWith('ar') || v.name.includes('Arabic'));
    if (arVoice) utterance.voice = arVoice;

    utterance.onend = () => setSpeakingText(null);
    utterance.onerror = () => setSpeakingText(null);

    setSpeakingText(text);
    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking when navigating or unmounting
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
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
  // Station 2 Logic: Socratic Mentor Evaluation
  // -----------------------------------------------------------
  const handleEvaluateQuestion = async () => {
    const q = researchQuestion.trim();
    if (!q) {
      alert('اكتب سؤالك العلمي أولاً في الصندوق يا بطل!');
      return;
    }

    setIsEvaluatingQuestion(true);
    playSound('click');

    // Rule-based heuristic evaluation + Optional AI enhancement
    let feedback = '';
    let isApproved = false;

    // Check for "هل" (closed question)
    if (q.startsWith('هل ') || q.startsWith('هل')) {
      feedback = `سؤال جميل وتفكير لطيف يا ${studentName}! 🌟\n\nولكن لاحظ أن أسئلة "هل" تكون إجابتها عادة بكلمة واحدة مثل (نعم) أو (لا)، وهذا لا يفتح لنا مجالاً لإجراء تجارب متعددة وقياس التغيرات!\n\n💡 نصيحة مُشيرفي السقراطية:\nما رأيك أن نبدأ بـ "كيف يؤثر..." أو "ما العلاقة بين..."؟\nمثال: بدلاً من "هل ينمو النبات في الظلام؟"، جرب: "كيف تؤثر كمية الضوء على سرعة نمو النبات؟". هيا جرب تعديله! 🚀`;
      isApproved = false;
    } else if (q.length < 15) {
      feedback = `سؤالك قصير جداً يا بطل! 🤔\n\nالسؤال العلمي الجيد يحتاج أن يوضح: ما هو الشيء الذي سنغيره؟ وما هو الشيء الذي سنقيسه بالأرقام أو الملاحظة؟\n\n💡 فكر معي: ما الذي تريد قياسه بالضبط في تجربتك؟ أضف مزيداً من التفاصيل.`;
      isApproved = false;
    } else if (
      q.includes('كيف يؤثر') || 
      q.includes('كيف تؤثر') || 
      q.includes('ما أثر') || 
      q.includes('ما العلاقة') || 
      q.includes('ما تأثير') ||
      q.includes('إلى أي مدى')
    ) {
      // Strong scientific formulation
      feedback = `مذهل ورائع جداً يا عالمنا الصغير ${studentName}! 🏆✨\n\nهذا سؤال بحث علمي استقصائي من الطراز الرفيع! لأنه:\n1. يبدأ بأداة استقصائية ممتازة ومفتوحة.\n2. يحدد بوضوح متغيراً سنقوم بتغييره ومتغيراً سنقيسه.\n3. يمكن اختباره بالتجربة العملية والقياس!\n\nأنا فخور بك وسؤالك معتمد رسمياً للانتقال إلى المحطة التالية! 🚀`;
      isApproved = true;
    } else {
      // Try AI or smart general socratic guide
      try {
        const prompt = `أنت الروبوت مُشيرفي، موجه سقراطي ودود للأطفال في المرحلة الابتدائية.
الطالب كتب هذا السؤال لمشروعه العلمي: "${q}"
المطلوب:
1. قدم تشجيعاً لطيفاً جداً.
2. إذا كان السؤال يحتاج تحسيناً، اطرح عليه سؤالين توجيهيين لطيفين لصياغة سؤال استقصائي يبدأ بـ (كيف يؤثر / ما أثر).
3. إذا كان السؤال ممتازاً وقابلاً للبحث، اعتمده وأثنِ عليه.
اكتب الرد في حدود 40-60 كلمة بأسلوب مشوق ومناسب للأطفال.`;
        const aiReply = await generateAiResponse(prompt, 'أنت الروبوت مُشيرفي الموجه السقراطي للبحث العلمي للأطفال.');
        if (aiReply) {
          feedback = aiReply;
          isApproved = q.includes('كيف') || q.includes('أثر') || q.includes('علاقة') || q.length > 25;
        } else {
          throw new Error('AI fallback');
        }
      } catch {
        feedback = `تفكير ذكي وخطوة رائعة يا ${studentName}! 💡\n\nسؤالك يحتوي على فكرة واعدة. لنجعله سؤالاً علمياً خارقاً، تأكد أنه يحدد بوضوح: ما الذي ستغيره في التجربة؟ وكيف ستقيس النتيجة؟\nإذا شعرت أنه جاهز، فلننطلق للمحطة القادمة!`;
        isApproved = true;
      }
    }

    setSocraticFeedback(feedback);
    setIsQuestionApproved(isApproved);
    localStorage.setItem('quest_research_question', q);
    localStorage.setItem('quest_socratic_feedback', feedback);
    localStorage.setItem('quest_question_approved', String(isApproved));
    setIsEvaluatingQuestion(false);

    if (isApproved) {
      playSound('success');
      awardBadge('question');
      unlockStation(3);
    } else {
      playSound('click');
    }
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
    awardBadge('explorer');
    unlockStation(4);
    setActiveStation(4);
  };

  // Calculate overall progress %
  const calculateProgress = () => {
    let p = 0;
    if (quizPassed) p += 33;
    if (isQuestionApproved) p += 33;
    if (isHypoApproved) p += 34;
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
            <div className="quest-user-tag">
              <span>👤 المستكشف:</span>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="اكتب اسمك هنا"
                title="اضغط لتعديل اسمك"
              />
            </div>
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

        {/* Progress & Stations Trail */}
        <nav className="quest-trail-container">
          <div className="quest-trail-header">
            <div className="quest-trail-title">
              <span>🚀 محطات مغامرة البحث العلمي</span>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                (محطة {activeStation === 0 ? 'البداية' : activeStation} من 3)
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

            {/* Step 4: Finale */}
            <div
              className={`quest-step-pill ${unlockedStations.includes(4) ? 'unlocked' : 'locked'} ${activeStation === 4 ? 'active' : ''} ${badges.explorer ? 'completed' : ''}`}
              onClick={() => {
                if (unlockedStations.includes(4)) {
                  playSound('click');
                  setActiveStation(4);
                } else {
                  alert('🔒 أكمل المحطات الثلاث أولاً للحصول على شهادتك الذهبية ووسام التتويج!');
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
              activeStation === 4 || showConfetti
                ? 'celebrating'
                : activeStation === 2
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
                  let textToRead = '';
                  if (activeStation === 0) {
                    textToRead = `أهلاً بك يا بطلنا ${studentName}! أنا صديقك الروبوت مُشيرفي، وهنا لنكتشف معاً كيف يفكر العلماء، من طرح الأسئلة إلى التجربة والاكتشاف. هل أنت مستعد للرحلة؟`;
                  } else if (activeStation === 1) {
                    textToRead = 'في المحطة الأولى، سنقرأ قصة النبتة العجيبة لنعرف ما هو البحث العلمي، ثم تجتاز اختباراً ذكياً من ثلاثة أسئلة لتنال وسام شعلة الفضول!';
                  } else if (activeStation === 2) {
                    textToRead = 'المحطة الثانية هي مختبر التساؤل! اكتب سؤال بحثك في الصندوق وسأقوم بدوري السقراطي لمساعدتك في صياغته بأعلى دقة علمية.';
                  } else if (activeStation === 3) {
                    textToRead = 'في المحطة الثالثة نتعلم كيف نصوغ الفرضية الذكية: إذا قمنا بكذا، نتوقع كذا، لأن كذا! هيا نبني فرضيتك معاً!';
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
                  رائع جداً! وصلنا إلى <strong>ورشة الفرضيات العلمية</strong>. الفرضية هي توقعك الذكي للنتيجة مدعوماً بالسبب. ركّب أركان فرضيتك الذهبية وانتقل معي للتتويج! 🧪
                </>
              )}
              {activeStation === 4 && (
                <>
                  يا لك من فخر لمدرسة مشيرفة! مبارك إتمام الرحلة وحصولك على الأوسمة الثلاثة ولقب <strong>المستكشف العلمي المتوج</strong>. يمكنك الآن طباعة شهادتك الرسمية ومشاركتها مع أهلك ومعلميك! 🏆🎓
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
            </div>

            {/* Badges Cabinet Showcase */}
            <section className="quest-badges-drawer">
              <div className="quest-badges-drawer-title">
                <i className="fas fa-medal"></i>
                <span>خزانة أوسمتك وشاراتك العلمية</span>
              </div>
              <div className="quest-badges-grid">
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

                <div className={`quest-badge-slot ${badges.explorer ? 'earned' : 'locked'}`}>
                  <div className="quest-badge-slot-icon">🏆</div>
                  <div className="quest-badge-info">
                    <h4>وسام المستكشف المتوج</h4>
                    <p>{badges.explorer ? 'تم التتويج بنجاح!' : 'يُمنح عند إتمام المحطات الثلاث وإصدار الشهادة.'}</p>
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
                      onClick={() => speakText('المشهد الأول: لاحظ كنان أن نبتة النعناع في غرفته قد ذبلت واصفرّت، بينما نبتة الشرفة خضراء ومورقة! تساءل بدهشة: يا ترى ما السبب الخفي وراء ذلك؟')}
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
                      onClick={() => speakText('المشهد الثاني: ظهر الروبوت مُشيرفي بابتسامته اللطيفة وقال: لا تقلق يا كنان! هنا يأتي دور البحث العلمي.. العلم ليس مجرد كتب نحفظها، بل هو أسلوب تفكير منظم نستخدمه لفهم العالم وحل المشكلات!')}
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
                      onClick={() => speakText('المشهد الثالث: قام كنان بنقل النبتة بجانب نافذة مشمسة، وبدأ يسقيها بانتظام. بعد أيام، عادت النبتة نضرة ومخضرة! هكذا استطاع بالتجربة والملاحظة حل المشكلة واكتشاف حاجة النبات لضوء الشمس.')}
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

            {/* Socratic Question Workspace */}
            <div className="quest-socratic-workspace">
              {/* Ideas Bank */}
              <div className="quest-ideas-pills-wrap">
                <div className="quest-ideas-title">
                  💡 أفكار ملهمة للتجارب (اضغط على أي فكرة لتجربتها أو استلهم منها سؤالك):
                </div>
                <div className="quest-ideas-pills">
                  {QUESTION_IDEAS.map((idea, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="quest-idea-pill"
                      onClick={() => {
                        playSound('click');
                        setResearchQuestion(idea.replace(/[🌱☀️☕🧊🪂⏱️🏃‍♂️❤️🥚🌊]/g, '').trim());
                      }}
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Input */}
              <div className="quest-input-box-wrap">
                <label htmlFor="researchQ">
                  ✍️ اكتب سؤال بحثك العلمي هنا يا {studentName}:
                </label>
                <textarea
                  id="researchQ"
                  className="quest-question-textarea"
                  value={researchQuestion}
                  onChange={(e) => setResearchQuestion(e.target.value)}
                  placeholder="مثال: كيف يؤثر نوع السائل (ماء نقي، ماء بسكر، ماء بملح) على سرعة إنبات بذور الفاصولياء؟"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="quest-btn-primary"
                  onClick={handleEvaluateQuestion}
                  disabled={isEvaluatingQuestion || !researchQuestion.trim()}
                >
                  {isEvaluatingQuestion ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>مُشيرفي يفكر في سؤالك...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic"></i>
                      <span>اطلب رأي وتوجيه الروبوت مُشيرفي السقراطي</span>
                    </>
                  )}
                </button>

                {isQuestionApproved && (
                  <button
                    type="button"
                    className="quest-btn-secondary"
                    style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981', color: '#6ee7b7' }}
                    onClick={() => {
                      playSound('click');
                      setActiveStation(3);
                    }}
                  >
                    <span>الانتقال للمحطة 3 (الفرضيات)</span>
                    <i className="fas fa-arrow-left"></i>
                  </button>
                )}
              </div>

              {/* Socratic Mentor Feedback Reply Card */}
              {socraticFeedback && (
                <div className="quest-socratic-reply-card">
                  <div className="quest-socratic-reply-header">
                    <div className="quest-socratic-reply-title">
                      <i className="fas fa-robot"></i>
                      <span>تغذية مُشيرفي الراجعة لسؤالك:</span>
                    </div>
                    <button
                      type="button"
                      className="quest-voice-btn"
                      onClick={() => speakText(socraticFeedback)}
                    >
                      <i className="fas fa-volume-up"></i> استمع لرأي مُشيرفي
                    </button>
                  </div>

                  <div className="quest-socratic-text">
                    {socraticFeedback}
                  </div>

                  {isQuestionApproved && (
                    <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <span style={{ color: '#fef08a', fontWeight: 900, fontSize: '0.95rem' }}>
                        🎉 فزت بوسام "مفتاح التساؤل الذكي 🔍" وجاهز للفرضيات!
                      </span>
                      <button
                        type="button"
                        className="quest-btn-primary"
                        style={{ padding: '0.6rem 1.4rem', fontSize: '0.92rem' }}
                        onClick={() => {
                          playSound('click');
                          setActiveStation(3);
                        }}
                      >
                        <span>تابع إلى ورشة الفرضيات</span>
                        <i className="fas fa-arrow-left"></i>
                      </button>
                    </div>
                  )}
                </div>
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
                  <span>اعتماد الفرضية والتوجه لمنصة التكريم والشهادة 🏆</span>
                </button>
              </div>
            </div>
          </main>
        )}

        {/* ========================================================= */}
        {/* STATION 4: Finale & Explorer Certificate                  */}
        {/* ========================================================= */}
        {activeStation === 4 && (
          <main>
            <div className="quest-section-header">
              <span className="quest-section-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', borderColor: '#f59e0b' }}>
                منصة التتويج والإنجاز 🏆
              </span>
              <h2 className="quest-section-title">شهادة المستكشف العلمي الصغير</h2>
              <p className="quest-section-desc">
                ألف مبارك يا بطلنا المتألق! لقد أتقنت خطوات البحث العلمي الثلاث (الملاحظة والأساسيات، صياغة السؤال، وبناء الفرضية).
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
                لقد خاض الطالب رحلة استكشافية متكاملة برفقة <strong>الروبوت مُشيرفي</strong>، وأظهر فضولاً علمياً ناضجاً في فهم المنهج العلمي، وصياغة سؤال بحث استقصائي دقيق، وبناء فرضية علمية مبررة بالدليل والسبب.
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
                <span>طباعة أو حفظ الشهادة (PDF)</span>
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
                    localStorage.removeItem('quest_research_question');
                    localStorage.removeItem('quest_socratic_feedback');
                    localStorage.removeItem('quest_question_approved');
                    localStorage.removeItem('quest_hypo_if');
                    localStorage.removeItem('quest_hypo_then');
                    localStorage.removeItem('quest_hypo_because');
                    localStorage.removeItem('quest_hypo_approved');
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
      </div>
    </div>
  );
};

export default ScientificResearchQuest;
