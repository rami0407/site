import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import RealisticSpacecraft from './RealisticSpacecraft';

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
  const [isTasbihPublished, setIsTasbihPublished] = useState(() => {
    return localStorage.getItem('tasbih_is_published') !== 'false';
  });

  // Cloud & Local Sync for Tasbih portal visibility
  useEffect(() => {
    try {
      const dRef = doc(db, 'students', 'tasbih_live_portal');
      const unsubscribe = onSnapshot(dRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.isPublished === 'boolean') {
            setIsTasbihPublished(data.isPublished);
            localStorage.setItem('tasbih_is_published', String(data.isPublished));
          }
        }
      }, () => {});
      return () => unsubscribe();
    } catch (e) {}
  }, []);

  useEffect(() => {
    const handlePublishSync = () => {
      setIsTasbihPublished(localStorage.getItem('tasbih_is_published') !== 'false');
    };
    window.addEventListener('tasbihPublishChanged', handlePublishSync);
    window.addEventListener('storage', handlePublishSync);
    return () => {
      window.removeEventListener('tasbihPublishChanged', handlePublishSync);
      window.removeEventListener('storage', handlePublishSync);
    };
  }, []);

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

            <button 
              onClick={() => window.location.hash = '#/gratitude-sky'} 
              className="btn" 
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#0f172a',
                border: '1px solid #fde68a',
                fontWeight: 900,
                padding: '0.85rem 1.4rem',
                borderRadius: '16px',
                boxShadow: '0 8px 25px rgba(245, 158, 11, 0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <i className="fas fa-star" style={{ fontSize: '1.2rem', color: '#0f172a' }}></i>
              🌌 سماء الامتنان والنجوم ✨
            </button>

            <button 
              onClick={() => window.location.hash = '#/readers-club'} 
              className="btn" 
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'white',
                border: '1px solid #6ee7b7',
                fontWeight: 900,
                padding: '0.85rem 1.4rem',
                borderRadius: '16px',
                boxShadow: '0 8px 25px rgba(5, 150, 105, 0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <i className="fas fa-book-reader" style={{ fontSize: '1.2rem', color: '#a7f3d0' }}></i>
              📚 رحلة الـ 10 كتب وشجرة التميز 🌿
            </button>

            {isTasbihPublished && (
              <button 
                onClick={() => window.location.hash = '#/tasbih'} 
                className="btn" 
                style={{
                  background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
                  color: '#fef08a',
                  border: '1.5px solid #fbbf24',
                  fontWeight: 900,
                  padding: '0.85rem 1.4rem',
                  borderRadius: '16px',
                  boxShadow: '0 8px 25px rgba(5, 150, 105, 0.45), 0 0 15px rgba(251, 191, 36, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>📿</span>
                <span>بوابة الذكر ومسبحة مشيرفة 👑</span>
              </button>
            )}

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
          <RealisticSpacecraft 
            isLaunching={isLaunching} 
            onLaunch={handleRocketLaunch} 
          />

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
