import React, { useState, useEffect } from 'react';

const MOTIVATIONAL_QUOTES = [
  // Arabic Quotes
  {
    lang: 'ar',
    flag: '✨',
    title: 'العربية',
    text: 'العلمُ يَبني مَنازِلاً لا عِمادَ لَها.. بالتَّألُّقِ والإصْرارِ نُعانِقُ السَّحابَ ورُؤْيَةَ المَسْتَقْبَلِ! 🌟'
  },
  {
    lang: 'ar',
    flag: '🏆',
    title: 'العربية',
    text: 'مدرسة مشيرفة منبع التميز والإبداع، بطموح طلابنا نصل إلى القمة ونضيء المستقبل! 🚀'
  },
  {
    lang: 'ar',
    flag: '💡',
    title: 'العربية',
    text: 'لا حدّ لإبداعكم، بالقراءة والمعرفة تبتكرون الفكرة وتصنعون التغيير المشرق! 🎓'
  },

  // Hebrew Quotes
  {
    lang: 'he',
    flag: '🌟',
    title: 'עברית',
    text: 'הדרך למצוינות מתחילה בסקרנות, שאיפה והתמדה. השמיים הם לא הגבול! 🚀'
  },
  {
    lang: 'he',
    flag: '✨',
    title: 'עברית',
    text: 'חינוך הוא המפתח לשינוי העולם, יחד נגיע לפסגות חדשות! 🌟'
  },
  {
    lang: 'he',
    flag: '💡',
    title: 'עברית',
    text: 'כל למידה היא הרפתקה חדשה, תאמינו בעצמכם ותמיד תשאפו למעלה! 🎓'
  },

  // English Quotes
  {
    lang: 'en',
    flag: '🌟',
    title: 'English',
    text: 'Shoot for the stars! Excellence is not an act, but a habit of continuous learning. 🚀'
  },
  {
    lang: 'en',
    flag: '✨',
    title: 'English',
    text: 'Education is the passport to the future! Curiosity and hard work lead to greatness. 💡'
  },
  {
    lang: 'en',
    flag: '🎓',
    title: 'English',
    text: 'Dream big, work hard, and never stop exploring the infinite universe of knowledge! 🌌'
  }
];

const Hero = () => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [stars, setStars] = useState([]);

  // Generate randomized stars for cosmic background
  useEffect(() => {
    const starList = Array.from({ length: 45 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`,
      delay: `${Math.random() * 3}s`,
      opacity: Math.random() * 0.8 + 0.2
    }));
    setStars(starList);
  }, []);

  const handleRocketLaunch = () => {
    if (isLaunching) return;
    setIsLaunching(true);
    setShowCelebration(false);

    // Randomize trilingual quote
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setCurrentQuote(randomQuote);

    // Launch duration timeline
    setTimeout(() => {
      setIsLaunching(false);
      setShowCelebration(true);
    }, 4200);
  };

  const scrollToSection = (id) => {
    const targetElement = document.getElementById(id);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 75,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className={`hero cosmic-hero ${isLaunching ? 'space-launching' : ''}`} id="home">
      {/* Background Cosmic Starfield */}
      <div className="starfield-container">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star-dot"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDuration: star.duration,
              animationDelay: star.delay,
              opacity: star.opacity
            }}
          />
        ))}
      </div>

      {/* Nebula Glow Gradients */}
      <div className="nebula-glow glow-1"></div>
      <div className="nebula-glow glow-2"></div>
      <div className="nebula-glow glow-3"></div>

      <div className="container hero-layout-grid">

        {/* Hero Left/Main Text Info */}
        <div className="hero-text-side">
          {/* Glowing Clickable Badge for Year of Excellence */}
          <div 
            className="excellence-badge-glow"
            onClick={() => window.location.hash = '#/excellence'}
            style={{ cursor: 'pointer' }}
            title="انقر لاكتشاف وثيقة ورؤية عام التميز 2026-2027"
          >
            <span className="badge-sparkle">✨</span>
            <span className="badge-text">عام التميز 2026 / 2027</span>
            <span className="badge-rocket-mini">🚀</span>
          </div>

          <div className="hero-logo-wrapper">
            <div className="orbital-ring"></div>
            <img 
              src="https://lh3.googleusercontent.com/pw/AP1GczOmuSnGS9OmfsVRo3-FedvNpsjYbgAZCMWlFYtMsFf4wX3F9upApscvMLiVa6MS2DQe7mNGNQO6zUyfSSMD4pmPpTOG5TFEZiZcE2jXzNrJjv7-4D9xh-H9HBsHtVYIU6nEesjXL_QvHFgZSVcvkU7jzA=w500-h500-s-no-gm?authuser=0" 
              alt="شعار المدرسة" 
              className="hero-logo"
            />
          </div>

          <h1 className="hero-title-main">
            مدرسة مشيرفة الابتدائية
          </h1>

          <h2 className="hero-subtitle-excellence">
            <span className="gold-gradient-text">عام التميز والابتكار</span> 🌟
          </h2>

          <p className="hero-description">
            نحلق بطموحات طلابنا نحو الفضاء والتميز، لنبني جيلاً واعداً، مبدعاً، ومجهزاً بمهارات المستقبل ✨
          </p>

          {/* Interactive Action Buttons */}
          <div className="hero-buttons">
            <button 
              onClick={handleRocketLaunch} 
              className={`btn btn-launch-rocket ${isLaunching ? 'launching' : ''}`}
              disabled={isLaunching}
            >
              <i className="fas fa-rocket rocket-btn-icon"></i>
              {isLaunching ? 'جاري الإطلاق إلى الفضاء... 🌌' : 'إطلاق مركبة التميز 🚀'}
            </button>

            <button onClick={() => window.location.hash = '#/monawaat'} className="btn" style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
              color: 'white',
              border: 'none',
              fontWeight: 900,
              padding: '0.85rem 1.4rem',
              borderRadius: '16px',
              boxShadow: '0 8px 20px rgba(236, 72, 153, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}>
              <i className="fas fa-palette" style={{ fontSize: '1.2rem' }}></i>
              🎨 منوعات
            </button>

            <button onClick={() => window.location.hash = '#/stem'} className="btn" style={{
              background: 'linear-gradient(135deg, #7209b7 0%, #4361ee 100%)',
              color: 'white',
              border: 'none',
              fontWeight: 900,
              padding: '0.85rem 1.4rem',
              borderRadius: '16px',
              boxShadow: '0 8px 20px rgba(114, 9, 183, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}>
              <i className="fas fa-atom" style={{ fontSize: '1.2rem' }}></i>
              🚀 زاوية STEM (صناع الحلول)
            </button>

            <button onClick={() => window.location.hash = '#/world-ideas'} className="btn btn-space-primary">
              <i className="fas fa-rocket"></i>
              🚀 شارِك أفكارك للعالم
            </button>

            <button onClick={() => window.location.hash = '#/learning-corner'} className="btn btn-space-outline">
              <i className="fas fa-gamepad"></i>
              ركن التعلم
            </button>

            <button onClick={() => scrollToSection('contact')} className="btn btn-space-outline">
              <i className="fas fa-paper-plane"></i>
              تواصل معنا
            </button>

            <button 
              onClick={() => window.location.hash = '#/appointments'} 
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 900,
                padding: '0.85rem 1.4rem',
                borderRadius: '16px',
                boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <i className="fas fa-calendar-check" style={{ fontSize: '1.1rem' }}></i>
              📅 حجز لقاء مع المعلم
            </button>
          </div>

        </div>

        {/* Hero Right/Rocket Visual Stage */}
        <div className="hero-rocket-stage">
          <div 
            className={`rocket-assembly ${isLaunching ? 'rocket-takeoff' : 'rocket-hover'}`}
            onClick={handleRocketLaunch}
            title="انقر لإطلاق الصاروخ نحو الفضاء!"
          >
            {/* Target Ring Glow */}
            <div className="rocket-target-glow"></div>

            {/* Custom SVG Rocket */}
            <svg 
              className="rocket-svg-graphic" 
              viewBox="0 0 200 400" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Rocket Nosecone */}
              <path d="M100 20C100 20 135 70 135 120H65C65 70 100 20 100 20Z" fill="url(#noseGradient)" />
              <path d="M100 25C100 25 125 70 125 120H100V25Z" fill="white" opacity="0.3" />

              {/* Rocket Body */}
              <rect x="65" y="120" width="70" height="150" rx="10" fill="url(#bodyGradient)" />
              {/* Body Highlights */}
              <rect x="65" y="120" width="35" height="150" rx="5" fill="white" opacity="0.15" />
              <rect x="75" y="140" width="50" height="8" rx="4" fill="#3b82f6" />
              
              {/* Excellence Emblem Text on Rocket Body */}
              <circle cx="100" cy="180" r="20" fill="#1e3a8a" stroke="#fbbf24" strokeWidth="3" />
              <text x="100" y="184" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">تميز</text>

              {/* Rocket Windows */}
              <circle cx="100" cy="225" r="11" fill="#0284c7" stroke="#e0f2fe" strokeWidth="2.5" />
              <circle cx="100" cy="225" r="7" fill="#38bdf8" />

              {/* Left Fin */}
              <path d="M65 200L30 270V280H65V200Z" fill="url(#finGradient)" />
              {/* Right Fin */}
              <path d="M135 200L170 270V280H135V200Z" fill="url(#finGradient)" />

              {/* Thruster Nozzle */}
              <rect x="80" y="270" width="40" height="18" rx="4" fill="#334155" />
              <rect x="85" y="288" width="30" height="6" rx="2" fill="#1e293b" />

              {/* Thruster Flames */}
              <g className="rocket-flames-group">
                <path d="M85 294C85 294 75 350 100 390C125 350 115 294 115 294H85Z" fill="url(#outerFlameGradient)" />
                <path d="M90 294C90 294 83 335 100 365C117 335 110 294 110 294H90Z" fill="url(#innerFlameGradient)" />
                <path d="M94 294C94 294 90 320 100 340C110 320 106 294 106 294H94Z" fill="#ffffff" />
              </g>

              {/* SVG Gradients Definitions */}
              <defs>
                <linearGradient id="noseGradient" x1="65" y1="20" x2="135" y2="120" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
                <linearGradient id="bodyGradient" x1="65" y1="120" x2="135" y2="270" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="50%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="finGradient" x1="30" y1="200" x2="170" y2="280" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="outerFlameGradient" x1="100" y1="294" x2="100" y2="390" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                </linearGradient>
                <linearGradient id="innerFlameGradient" x1="100" y1="294" x2="100" y2="365" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
            </svg>

            {/* Dynamic Smoke & Spark Particles */}
            <div className="thruster-particles">
              <span className="p-particle particle-1"></span>
              <span className="p-particle particle-2"></span>
              <span className="p-particle particle-3"></span>
              <span className="p-particle particle-4"></span>
              <span className="p-particle particle-5"></span>
            </div>

            {/* Launch Instructions Floating Tooltip */}
            {!isLaunching && (
              <div className="rocket-hint-badge">
                <i className="fas fa-hand-pointer"></i> اضغط لإطلاق المركبة!
              </div>
            )}
          </div>

          {/* Trilingual Celebration Motivational Quote Card right under the rocket stage */}
          {showCelebration && currentQuote && (
            <div 
              className={`rocket-quote-stage-card lang-${currentQuote.lang}`}
              dir={currentQuote.lang === 'en' ? 'ltr' : 'rtl'}
            >
              <div className="quote-header-badge">
                <span className="quote-flag">{currentQuote.flag}</span>
                <span className="quote-lang-name">{currentQuote.title}</span>
                <span className="quote-badge-tag">رسالة الإلهام والتميز 🚀</span>
              </div>
              <p className="quote-text-body">{currentQuote.text}</p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default Hero;
