import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MafatihWhiteboardPage.css';

const C = ['#1d2a44', '#e8590c', '#1c7ed6', '#2b9348', '#e0a100', '#1b4fa8'];
const CV = ['--ink', '--c1', '--c2', '--c3', '--c4', '--c5'];

const ST = [
  null,
  ['משיכה וסקרנות', 'مشوِّق ومحفِّز'],
  ['פיתוח הבנה ובניית משמעות', 'فهم وبناء المعنى'],
  ['תרגול והתנסות', 'تطبيق وتدريب'],
  ['יישום עצמאי', 'أدلة الفهم'],
  ['חתימה והעברת הלמידה', 'حصاد ونقل الأثر']
];

const P = {
  key: (
    <>
      <circle cx="100" cy="70" r="46" pathLength="1" />
      <circle cx="100" cy="70" r="16" pathLength="1" />
      <path pathLength="1" d="M100 116V190M100 150h26M100 175h20" />
      <path pathLength="1" d="M82 52q18-14 36 0" />
    </>
  ),
  bulb: (
    <>
      <path pathLength="1" d="M100 24a46 46 0 0 0-26 84c6 6 8 12 8 22h36c0-10 2-16 8-22a46 46 0 0 0-26-84z" />
      <path pathLength="1" d="M82 146h36M88 162h24" />
      <path pathLength="1" d="M100 4v8M30 40l6 6M170 40l-6 6M14 90h8M178 90h8" />
    </>
  ),
  book: (
    <>
      <path pathLength="1" d="M100 50C80 36 50 36 22 44v118c28-8 58-8 78 6 20-14 50-14 78-6V44c-28-8-58-8-78 6zM100 50v118" />
      <path pathLength="1" d="M44 70q22-4 40 4M44 92q22-4 40 4M116 74q18-8 40-4M116 96q18-8 40-4" />
    </>
  ),
  tools: (
    <>
      <path pathLength="1" d="M30 30l140 140" />
      <path pathLength="1" d="M170 30L96 104" />
      <path pathLength="1" d="M60 120l-14 14a16 16 0 0 0 22 22l14-14" />
      <path pathLength="1" d="M150 40l16-16" />
    </>
  ),
  lens: (
    <>
      <circle cx="86" cy="86" r="52" pathLength="1" />
      <path pathLength="1" d="M124 124l50 50" />
      <path pathLength="1" d="M62 88l18 18 34-38" />
    </>
  ),
  road: (
    <>
      <path pathLength="1" d="M20 170c30-60 90 10 110-50s30-70 50-90" />
      <circle cx="20" cy="170" r="8" pathLength="1" />
      <path pathLength="1" d="M168 28l16 4-10 12z" />
    </>
  ),
  seat: (
    <>
      <circle cx="60" cy="70" r="20" pathLength="1" />
      <circle cx="140" cy="70" r="20" pathLength="1" />
      <path pathLength="1" d="M24 150q36-50 72 0M104 150q36-50 72 0" />
    </>
  ),
  timer: (
    <>
      <circle cx="100" cy="106" r="64" pathLength="1" />
      <path pathLength="1" d="M100 106V68M100 106l28 14M84 30h32" />
    </>
  ),
  phone: (
    <>
      <rect x="56" y="14" width="88" height="170" rx="16" pathLength="1" />
      <path pathLength="1" d="M76 56h48M76 84h48M76 112h30" />
      <circle cx="100" cy="162" r="6" pathLength="1" />
    </>
  ),
  heart: (
    <path pathLength="1" d="M100 170C20 112 40 36 100 78c60-42 80 34 0 92z" />
  )
};

const S = [
  { s: 0, a: 'key', t: 'שלום, תלמידות ותלמידים! אני מפתחח — המפתח שמלווה אתכם במסע הלמידה.', u: 'مرحباً، طالباتي وطلابي الأعزاء! أنا «مِفتاح» — المفتاح الذي يرافقكم في رحلة التعلّم.' },
  { s: 0, a: 'road', t: 'אני כאן כדי לעזור לכם לדעת מה אנחנו לומדים, איפה אנחנו נמצאים, ומה תוכלו לעשות כדי להראות שהבנתם.', u: 'أنا هنا لمساعدتكم لتعرفوا ماذا نتعلّم، أين نحن الآن، وماذا يمكنكم فعله لإثبات فهمكم.' },
  { s: 0, a: 'key', t: 'במסע שלנו יש חמש תחנות. מוכנים לצאת לדרך?', u: 'في رحلتنا خمس محطات رئيسية وممتعة. هل أنتم مستعدون للانطلاق في المسار؟' },
  { s: 1, a: 'bulb', t: 'בתחנה הראשונה אפתח בשאלה מסקרנת, בסיפור, בחידה או בניסוי קצר. אתן לכם רגע לחשוב ולשער.', u: 'المحطة الأولى (مشوّق ومحفّز): سأبدأ بسؤال مثير، قصة، لغز، أو تجربة قصيرة تمنحكم وقتاً للتأمل والتوقع.' },
  { s: 1, a: 'bulb', t: 'ואז נברר יחד: מה נלמד היום, ואיך נדע שהצלחנו?', u: 'ثم نتبين معاً: ماذا سنتعلّم اليوم، وكيف سنعرف أننا نجحنا وحققنا معيار النجاح؟' },
  { s: 2, a: 'book', t: 'בתחנה השנייה נבנה את הרעיון החדש ונחבר אותו למה שאתם כבר יודעים. אסביר, אדגים ואכוון אתכם לגלות.', u: 'المحطة الثانية (فهم وبناء المعنى): سنبني المفهوم الجديد ونربطه بما تعرفونه مسبقاً. سأشرح، أنمذج، وأوجهكم للاكتشاف.' },
  { s: 2, a: 'book', t: 'ואתם תשאלו, תשוו ותסבירו: איך הגעתם למסקנה?', u: 'وأنتم ستطرحون الأسئلة، تقارنون، وتعللون: كيف توصلتم إلى هذا الاستنتاج؟' },
  { s: 3, a: 'tools', t: 'בתחנה השלישית תשתמשו במה שלמדתם. לפעמים לבד, לפעמים בזוגות ולפעמים בקבוצה — לפי המשימה.', u: 'المحطة الثالثة (تطبيق وتدريب): ستطبقون ما تعلمتموه؛ أحياناً بشكل فردي، ثنائي، أو داخل مجموعات متمايزة.' },
  { s: 3, a: 'seat', t: 'מי שצריך עזרה יקבל תמיכה, ומי שמוכן יוכל להתקדם לאתגר נוסף.', u: 'من يحتاج مساعدة سيجد دعماً وسقالات مساندة، ومن أتقن يمكنه الانطلاق نحو تحدٍ معرفي أعلى.' },
  { s: 4, a: 'lens', t: 'בתחנה הרביעית כל אחד ואחת מכם יראו מה הבינו במשימה קצרה. כך אדע מה הצעד הבא: להתקדם, לתרגל עוד או להסביר בדרך אחרת.', u: 'المحطة الرابعة (أدلة الفهم): سيقدم كل طالب منكم دليلاً فردياً مستقلاً، لنحدد الخطوة التالية: التقدم، التدريب، أم التوضيح.' },
  { s: 4, a: 'lens', t: 'אפשר לטעות, ללמוד מהטעות ולנסות שוב.', u: 'الخطأ فرصة للتعلّم؛ نكتشفه، نتعلم منه، ونحاول مجدداً بثقة وإصرار!' },
  { s: 5, a: 'book', t: 'בתחנה החמישית נעצור ונחשוב: מה למדתי? מה עזר לי להבין? ואיפה אוכל להשתמש בזה בחיים?', u: 'المحطة الخامسة (حصاد ونقل الأثر): نتأمل ثمار رحلتنا: ماذا تعلمت؟ ما الذي ساعدني على الفهم؟ وأين أستخدمه في حياتي؟' },
  { s: 5, a: 'heart', t: 'ומה מיוחד בי?', u: 'وما الذي يميّزني ويجعلني فخوراً بما حققته وتعلّمته اليوم؟' },
  { s: 0, a: 'road', t: 'התחנות שלי מוצגות מולכם, והסימון «אנחנו כאן» מראה לאן הגענו. לכל אחד יש מקום להשתתף, והעזרה והאתגר משתנים לפי הצורך שלכם. אם צריך, נחזור לתחנה קודמת.', u: 'محطاتي معروضة أمامكم بوضوح مع إشارة «نحن هنا». لكل طالب مساحة للمشاركة، والدعم والتحدي يتكيفان وفق وتيرتكم.' },
  { s: 0, a: 'timer', t: 'ואם הריכוז נחלש? אגיד: «זמן להתרענן!» נקדיש דקה או שתיים לתנועה או למשחק קשב קצר, ואז נחזור למסע.', u: 'وإذا قلّ التركيز؟ نقول: «حان وقت الانتعاش!» نخصص دقيقة للحركة أو تمرين انتباه خفيف، ثم نواصل الرحلة بنشاط.' },
  { s: 0, a: 'phone', t: 'מאחורי הקלעים, יישומון מסייע למורה לתכנן את המסע ולהתאים אותו לכיתה שלנו.', u: 'خلف الكواليس، يساعد هذا التطبيق الذكي المعلم في تخطيط مسار الحصة وهندسة محطاتها لتلائم صفنا تماماً.' },
  { s: 0, a: 'key', t: 'אני מפתחח. בואו נסתקרן, נבין, ננסה — וניקח את הלמידה איתנו אל החיים!', u: 'أنا مِفتاح. هيا بنا نتساءل، نفهم، نجرّب — وننقل أثر تعلّمنا إلى حياتنا اليومية!' }
];

const MafatihWhiteboardPage = ({ isEmbedded = false, onBack }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [voiceLang, setVoiceLang] = useState('he');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme_mafatih_whiteboard') || 'light';
  });

  const timerRef = useRef(null);
  const slideRef = useRef(slideIndex);
  slideRef.current = slideIndex;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const isVoiceRef = useRef(isVoiceOn);
  isVoiceRef.current = isVoiceOn;

  const currentSlide = S[slideIndex];
  const stationInfo = ST[currentSlide.s];
  const colorVar = `var(${CV[currentSlide.s]})`;

  // Toggle Dark/Light Theme
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme_mafatih_whiteboard', next);
  };

  // Stop playback & speech
  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Show a specific slide
  const goToSlide = useCallback((n) => {
    const target = Math.max(0, Math.min(S.length - 1, n));
    setSlideIndex(target);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Schedule auto advance
  useEffect(() => {
    if (!isPlaying) return;

    const sc = S[slideIndex];
    const textToSpeak = (voiceLang === 'ar' && sc.u) ? sc.u : sc.t;
    const langCode = voiceLang === 'ar' ? 'ar-SA' : 'he-IL';
    const ms = Math.max(4600, textToSpeak.length * 105 + 1600);
    let done = false;

    const goNext = () => {
      if (done) return;
      done = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (slideRef.current < S.length - 1) {
        setSlideIndex((prev) => prev + 1);
      } else {
        stopPlayback();
      }
    };

    if (isVoiceOn && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(textToSpeak.replace(/[«»]/g, ''));
      u.lang = langCode;
      u.rate = 0.92;
      u.onend = () => {
        timerRef.current = setTimeout(goNext, 1000);
      };
      window.speechSynthesis.speak(u);
      timerRef.current = setTimeout(goNext, ms + 9000);
    } else {
      timerRef.current = setTimeout(goNext, ms);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [slideIndex, isPlaying, isVoiceOn, voiceLang, stopPlayback]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        goToSlide(slideRef.current + 1);
      } else if (e.key === 'ArrowRight') {
        goToSlide(slideRef.current - 1);
      } else if (e.key === ' ' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToSlide]);

  const handlePlayToggle = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      if (slideIndex >= S.length - 1) {
        setSlideIndex(0);
      }
      setIsPlaying(true);
    }
  };

  const progressPercent = ((slideIndex + 1) / S.length) * 100;

  return (
    <div
      className={`mafatih-whiteboard-root ${isEmbedded ? 'embedded' : 'standalone'}`}
      data-theme={theme}
      dir="rtl"
    >
      {/* Top Bar Navigation */}
      <header className="wb-top-bar">
        <div className="wb-top-left">
          {isEmbedded ? (
            <button
              type="button"
              className="wb-action-pill"
              onClick={onBack}
              title="חזרה למסך הראשי של המודל"
            >
              <i className="fa-solid fa-arrow-right"></i>
              <span>חזרה למודל مفاتيح</span>
            </button>
          ) : (
            <a href="/#/mafatih" className="wb-action-pill" title="חזרה למודל مفاتيح">
              <i className="fa-solid fa-arrow-right"></i>
              <span>חזרה למודל مفاتيح | العودة للموديل</span>
            </a>
          )}

          <a
            href="/mafatih-whiteboard.html"
            target="_blank"
            rel="noopener noreferrer"
            className="wb-action-pill wb-external-pill"
            title="פתיחה בחלון עצמאי מלא"
          >
            <i className="fa-solid fa-expand"></i>
            <span>מסך מלא עצמאי</span>
          </a>
        </div>

        <div className="wb-top-right">
          <span className="wb-slide-counter">
            תמונה {slideIndex + 1} מתוך {S.length}
          </span>
          <button
            type="button"
            className="wb-theme-toggle"
            onClick={toggleTheme}
            title="החלף מצב כהה/בהיר"
          >
            {theme === 'dark' ? '☀️ מצב בהיר' : '🌙 מצב כהה'}
          </button>
        </div>
      </header>

      {/* Main Board View */}
      <main className="wb-board" aria-live="polite">
        <div key={`art-${slideIndex}`} className="wb-art" style={{ '--col': colorVar }}>
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <g className="f">
              <circle cx="100" cy="100" r="86" />
            </g>
            {P[currentSlide.a]}
          </svg>
        </div>

        <div key={`txt-${slideIndex}`} className="wb-txt" style={{ '--col': colorVar }}>
          {stationInfo && (
            <h2 className="wb-tag">
              {stationInfo[0]}
              <span className="wb-ar">{stationInfo[1]}</span>
            </h2>
          )}

          <p className="wb-say">
            {currentSlide.t.split(' ').map((word, j) => (
              <span
                key={j}
                style={{ animationDelay: `${j * 0.28 + 0.3}s` }}
              >
                {word}{' '}
              </span>
            ))}
          </p>

          {currentSlide.u && (
            <p className="wb-sub" lang="ar" dir="rtl">
              {currentSlide.u}
            </p>
          )}

          {currentSlide.s > 0 && <span className="wb-here">אנחנו כאן</span>}
        </div>
      </main>

      {/* 5 Stations Route Route Tracker */}
      <nav className="wb-route" aria-label="תחנות המודל">
        {[1, 2, 3, 4, 5].map((k) => (
          <React.Fragment key={k}>
            {k > 1 && <div className="wb-seg" />}
            <div
              className={`wb-stn ${k === currentSlide.s ? 'on' : ''}`}
              style={{ '--col': `var(${CV[k]})` }}
              onClick={() => {
                const targetIdx = S.findIndex((item) => item.s === k);
                if (targetIdx !== -1) goToSlide(targetIdx);
              }}
              role="button"
              tabIndex={0}
              title={`תחנה ${k}: ${ST[k][0]}`}
            >
              <div className="wb-dot">{k}</div>
              <span className="wb-stn-label">{ST[k][0]}</span>
            </div>
          </React.Fragment>
        ))}
      </nav>

      {/* Dynamic Progress Bar */}
      <div className="wb-bar">
        <i style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Playback Controls */}
      <footer className="wb-ctl">
        <button
          type="button"
          onClick={() => goToSlide(slideIndex - 1)}
          disabled={slideIndex === 0}
          aria-label="הקודם"
          title="שקופית קודמת (חץ ימינה במקלדת)"
        >
          ▶ הקודם
        </button>

        <button
          type="button"
          className="wb-btn-p"
          onClick={handlePlayToggle}
          title="התחל / השהה (מקש רווח)"
        >
          {isPlaying ? '❚❚ השהיה' : slideIndex >= S.length - 1 ? '↺ הפעל מחדש' : '▶ התחלה / המשך'}
        </button>

        <button
          type="button"
          onClick={() => goToSlide(slideIndex + 1)}
          disabled={slideIndex === S.length - 1}
          aria-label="הבא"
          title="שקופית הבאה (חץ שמאלה במקלדת)"
        >
          הבא ◀
        </button>

        <button
          type="button"
          onClick={() => setIsVoiceOn((prev) => !prev)}
          className={isVoiceOn ? 'wb-voice-active' : ''}
          aria-pressed={isVoiceOn}
          title={isVoiceOn ? 'כיבוי הקראה קולית / إيقاف الصوت' : 'הפעלת קריינות קולית / تشغيل الصوت'}
        >
          {isVoiceOn ? '🔊 קריינות פעילה' : '🔇 קריינות'}
        </button>

        <button
          type="button"
          onClick={() => setVoiceLang((prev) => (prev === 'he' ? 'ar' : 'he'))}
          className="wb-action-pill"
          style={{ cursor: 'pointer', padding: '0.45em 0.9em', fontSize: '0.88rem' }}
          title="החלפת שפת קריינות בין עברית לערבית"
        >
          {voiceLang === 'ar' ? '🗣️ שפה: العربية (عربي)' : '🗣️ שפה: עברית (Hebrew)'}
        </button>
      </footer>
    </div>
  );
};

export default MafatihWhiteboardPage;
