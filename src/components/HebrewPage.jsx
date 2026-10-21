import React, { useState, useEffect } from 'react';
import { VOCABULARY_BY_GRADE, GRADE_INFOS } from '../data/hebrewCurriculumData';

export default function HebrewPage() {
  const [selectedGrade, setSelectedGrade] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('space'); // 'space' | 'ninja' | 'penalty' | 'vocab'
  const [isPlayingAudio, setIsPlayingAudio] = useState(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'بوابة اللغة العبرية | حرب الفضاء ونينجا الكلمات وركلات الترجيح 🚀⚔️⚽🇮🇱';
  }, []);

  const currentGradeWords = VOCABULARY_BY_GRADE[selectedGrade] || [];

  // Extract unique categories for current grade
  const categories = ['all', ...Array.from(new Set(currentGradeWords.map(w => w.category).filter(Boolean)))];

  // Filtered words
  const filteredWords = currentGradeWords.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.heb.includes(searchQuery) || 
      item.ar.includes(searchQuery) || 
      (item.hint && item.hint.includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  // Audio pronunciation using Web Speech API (Hebrew voice)
  const speakHebrew = (text, idx) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Remove niqqud for smoother TTS speech engine
      const cleanText = text.replace(/[\u0591-\u05C7]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'he-IL';
      utterance.rate = 0.85; // Natural clear pace for learners
      setIsPlayingAudio(idx);
      utterance.onend = () => setIsPlayingAudio(null);
      utterance.onerror = () => setIsPlayingAudio(null);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setIsPlayingAudio(null);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #022c22 0%, #064e3b 35%, #0f172a 100%)',
      color: '#f8fafc',
      fontFamily: 'Cairo, Tajawal, system-ui, sans-serif',
      direction: 'rtl',
      paddingBottom: '80px'
    }}>
      {/* Top Header / Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(2, 44, 34, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '2px solid rgba(250, 204, 21, 0.35)',
        padding: '12px 20px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => { window.location.hash = '#home'; }}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
            >
              <i className="fas fa-arrow-right"></i> الرئيسية 🏠
            </button>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                fontWeight: '900',
                color: '#facc15',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚽ بَوَّابَةُ اللُّغَةِ العِبْرِيَّة 🇮🇱
              </h1>
              <span style={{ fontSize: '0.82rem', color: '#86efac', fontWeight: '700' }}>
                שער השפה העברית — ركلات الترجيح وبنك الكلمات (صفوف 1 - 6)
              </span>
            </div>
          </div>

          {/* Quick Action Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('space')}
              style={{
                background: activeTab === 'space' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(15, 23, 42, 0.65)',
                color: '#fff',
                border: activeTab === 'space' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: '99px',
                fontWeight: '900',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'space' ? '0 4px 14px rgba(56, 189, 248, 0.5)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🚀 حرب الفضاء (Galaxy Defender)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ninja')}
              style={{
                background: activeTab === 'ninja' ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'rgba(15, 23, 42, 0.65)',
                color: '#fff',
                border: activeTab === 'ninja' ? '2px solid #facc15' : '1px solid rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: '99px',
                fontWeight: '900',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'ninja' ? '0 4px 14px rgba(34, 197, 94, 0.5)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              ⚔️ نينجا الكلمات (Word Ninja)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('penalty')}
              style={{
                background: activeTab === 'penalty' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(15, 23, 42, 0.65)',
                color: '#fff',
                border: activeTab === 'penalty' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: '99px',
                fontWeight: '900',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'penalty' ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              ⚽ ركلات الترجيح التفاعلية
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vocab')}
              style={{
                background: activeTab === 'vocab' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(15, 23, 42, 0.65)',
                color: '#fff',
                border: activeTab === 'vocab' ? '2px solid #c084fc' : '1px solid rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: '99px',
                fontWeight: '900',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'vocab' ? '0 4px 14px rgba(124, 58, 237, 0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              📖 بنك الكلمات والمعاني
            </button>
            <a
              href={activeTab === 'space' ? '/hebrew-space.html?v=1' : activeTab === 'ninja' ? '/hebrew-ninja.html?v=1' : '/hebrew-penalty.html?v=2'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '99px',
                fontWeight: '900',
                fontSize: '0.88rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                transition: 'transform 0.15s'
              }}
            >
              ⛶ شاشة كاملة
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '24px auto', padding: '0 16px' }}>

        {/* HERO / WELCOME BANNER */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(22, 101, 52, 0.75), rgba(6, 78, 59, 0.9))',
          border: '2px solid rgba(250, 204, 21, 0.45)',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '28px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ maxWidth: '750px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(250, 204, 21, 0.2)',
              border: '1px solid #facc15',
              color: '#fef08a',
              padding: '4px 14px',
              borderRadius: '99px',
              fontSize: '0.85rem',
              fontWeight: '900',
              marginBottom: '10px'
            }}>
              🏆 المنهاج المعتمد للوسط العربي في إسرائيل (الصفوف 1 - 6)
            </div>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3.2vw, 2.1rem)', margin: '0 0 10px', color: '#ffffff', fontWeight: '900' }}>
              تعلَّم العبريَّة باللعبِ وحرب الفضاء ونينجا الكلمات! 🚀⚔️⚽
            </h2>
            <p style={{ margin: 0, fontSize: '1rem', color: '#dcfce7', lineHeight: '1.7', fontWeight: '600' }}>
              منصة تفاعلية متخصصة لطلاب المرحلة الابتدائية تضم لعبة <b>حرب الفضاء ومجرة الكلمات (Galaxy Defender 🚀)</b> و<b>نينجا تقطيع الكلمات (Word Ninja ⚔️)</b> و<b>ركلات الترجيح (Penalty Shootout ⚽)</b> وبنك الكلمات والمعاني بالتشكيل الكامل (הַנִּקּוּד) والنطق الصوتي السليم.
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.65)',
            padding: '16px 20px',
            borderRadius: '20px',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#facc15' }}>3</div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>ألعاب تفاعلية</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.2)' }} />
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#4ade80' }}>80+</div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>كلمة مشكولة</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.2)' }} />
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#38bdf8' }}>6</div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>صفوف دراسية</div>
            </div>
          </div>
        </div>

        {/* TAB -1: HEBREW SPACE GALAXY DEFENDER GAME */}
        {activeTab === 'space' && (
          <section className="fade-in">
            <div style={{
              background: '#030712',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 0 3px rgba(56, 189, 248, 0.45)',
              border: '2px solid rgba(56, 189, 248, 0.5)'
            }}>
              {/* Game Frame Header */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a, #030712)',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                borderBottom: '2px solid rgba(56, 189, 248, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.6rem' }}>🚀</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#38bdf8', fontWeight: '900' }}>
                      Hebrew Galaxy Defender — حرب الفضاء ومجرة الكلمات العبرية
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#93c5fd' }}>
                      سفينة الفضاء بمدافع البلازما: اسمع نطق الكلمة واقصف المركبة المعادية الصحيحة قبل نفاد الدرع!
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <a
                    href="/hebrew-space.html?v=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                      color: '#ffffff',
                      border: '1px solid #38bdf8',
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: '900',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.5)'
                    }}
                  >
                    <i className="fas fa-expand"></i> شاشة كاملة ⛶
                  </a>
                </div>
              </div>

              {/* Game iFrame */}
              <div style={{ position: 'relative', width: '100%', height: '720px', maxHeight: '88vh' }}>
                <iframe
                  src="/hebrew-space.html?v=1"
                  title="Hebrew Galaxy Defender"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block'
                  }}
                  allow="autoplay; fullscreen"
                />
              </div>
            </div>

            {/* How to Play Quick Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              marginTop: '24px'
            }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>🚀</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#38bdf8', fontSize: '1.05rem', fontWeight: '800' }}>
                    1. قيادة المقاتلة الفضائية
                  </h4>
                  <p style={{ margin: 0, color: '#e0f2fe', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    حرّك المقاتلة يميناً ويساراً بواسطة شاشة اللمس، أو مفاتيح الأسهم (أو A/D) على لوحة المفاتيح.
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid rgba(74, 222, 128, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>⚡</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#4ade80', fontSize: '1.05rem', fontWeight: '800' }}>
                    2. مدافع البلازما والمطابقة
                  </h4>
                  <p style={{ margin: 0, color: '#e0f2fe', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    اضغط زر الإطلاق (أو المسافة) لإطلاق الليزر على المركبة الفضائية التي تحمل الكلمة العبرية المناسبة للمطلوب.
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid rgba(250, 204, 21, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>🛡️</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#facc15', fontSize: '1.05rem', fontWeight: '800' }}>
                    3. الدرع ومضاعف النقاط
                  </h4>
                  <p style={{ margin: 0, color: '#e0f2fe', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    تجنّب استهداف المركبات الخاطئة أو الاصطدام بالشهب، وحقق إصابات متتالية لتفعيل درع الطاقة ومضاعف النقاط x5!
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 0: HEBREW WORD NINJA GAME */}
        {activeTab === 'ninja' && (
          <section className="fade-in">
            <div style={{
              background: '#011812',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 0 3px rgba(34, 197, 94, 0.45)',
              border: '2px solid rgba(250, 204, 21, 0.5)'
            }}>
              {/* Game Frame Header */}
              <div style={{
                background: 'linear-gradient(135deg, #064e3b, #022c22)',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                borderBottom: '2px solid rgba(34, 197, 94, 0.4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.6rem' }}>⚔️</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#facc15', fontWeight: '900' }}>
                      Hebrew Word Ninja — نينجا تقطيع الكلمات العبرية بالتشكيل
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#86efac' }}>
                      استمع للنطق العبري السليم، قطّع الفاكهة التي تطابق المعنى المطلوب وتفادَ القنابل!
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <a
                    href="/hebrew-ninja.html?v=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: '#ffffff',
                      border: '1px solid #facc15',
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: '900',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.5)'
                    }}
                  >
                    <i className="fas fa-expand"></i> شاشة كاملة ⛶
                  </a>
                </div>
              </div>

              {/* Game iFrame */}
              <div style={{ position: 'relative', width: '100%', height: '720px', maxHeight: '88vh' }}>
                <iframe
                  src="/hebrew-ninja.html?v=1"
                  title="Hebrew Word Ninja"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block'
                  }}
                  allow="autoplay; fullscreen"
                />
              </div>
            </div>

            {/* How to Play Quick Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              marginTop: '24px'
            }}>
              <div style={{
                background: 'rgba(2, 44, 34, 0.8)',
                border: '1.5px solid rgba(250, 204, 21, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>⚔️</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#facc15', fontSize: '1.05rem', fontWeight: '800' }}>
                    1. سيف النينجا الخاطف
                  </h4>
                  <p style={{ margin: 0, color: '#dcfce7', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    اسحب إصبعك على شاشة اللمس أو حرّك الفأرة بسرعة لتقطيع الفاكهة الطائرة في الهواء لنصفين.
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(2, 44, 34, 0.8)',
                border: '1.5px solid rgba(74, 222, 128, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>🍉</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#4ade80', fontSize: '1.05rem', fontWeight: '800' }}>
                    2. الكلمات العبرية بالتشكيل (הַנִּקּוּד)
                  </h4>
                  <p style={{ margin: 0, color: '#dcfce7', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    اقرأ الكلمة أو استمع لنطقها، ثم قطّع فقط الفاكهة التي تحمل الكلمة العبرية المطابقة للمعنى المطلوب.
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(2, 44, 34, 0.8)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>💣</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#f87171', fontSize: '1.05rem', fontWeight: '800' }}>
                    3. تفادي القنابل وسلسلة الـ Combo
                  </h4>
                  <p style={{ margin: 0, color: '#dcfce7', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    احذر من لمس القنابل 💣 حتى لا تفقد قلوبك، واستمر في تقطيع الأهداف المتتالية لرفع مضاعف النقاط x2 و x3!
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 1: INTERACTIVE PENALTY GAME ARENA */}
        {activeTab === 'penalty' && (
          <section className="fade-in">
            <div style={{
              background: '#030712',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 3px rgba(34, 197, 94, 0.45)',
              border: '2px solid rgba(250, 204, 21, 0.35)'
            }}>
              {/* Game Frame Header */}
              <div style={{
                background: 'linear-gradient(135deg, #064e3b, #022c22)',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                borderBottom: '2px solid rgba(34, 197, 94, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🥅</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#facc15', fontWeight: '900' }}>
                      ملعب ركلات الترجيح — الدوري المدرسي للغة العبرية
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#86efac' }}>
                      اختر الصف من داخل اللعبة، اقرأ الكلمة، وسدد الكرة في الزاوية الصحيحة!
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <a
                    href="/hebrew-penalty.html?v=2"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fas fa-expand"></i> تكبير في صفحة مستقلة
                  </a>
                </div>
              </div>

              {/* Game iFrame */}
              <div style={{ position: 'relative', width: '100%', height: '680px', maxHeight: '85vh' }}>
                <iframe
                  src="/hebrew-penalty.html?v=2"
                  title="لعبة ركلات الترجيح للغة العبرية"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block'
                  }}
                  allow="autoplay; fullscreen"
                />
              </div>
            </div>

            {/* How to Play Quick Tips */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              marginTop: '24px'
            }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1.5px solid rgba(34, 197, 94, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>🎯</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#facc15', fontSize: '1.05rem', fontWeight: '800' }}>
                    1. دقّة التسديد والتركيز
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    اقرأ الكلمة المشكولة بأعلى الشاشة واختر الزاوية التي تترجمها بشكل صحيح لتسجيل هدف صاروخي.
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>🧤</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#38bdf8', fontSize: '1.05rem', fontWeight: '800' }}>
                    2. التفوّق على الحارس
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    عند الإجابة الصحيحة سيفشل الحارس بالتصدي للكرة، أما الخطأ فيمنحه فرصة إنقاذ شباكه!
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1.5px solid rgba(250, 204, 21, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>🔊</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#fde047', fontSize: '1.05rem', fontWeight: '800' }}>
                    3. زر كتم الصوت الدائم
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    يمكنك تشغيل أو كتم صافرة الحكم وهتاف الجماهير بنقرة واحدة من الزر العائم في أعلى اللعبة.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: INTERACTIVE VOCABULARY FLASHCARDS */}
        {activeTab === 'vocab' && (
          <section className="fade-in">
            {/* Grade Selector Tabs */}
            <div style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '12px',
              marginBottom: '20px'
            }}>
              {[1, 2, 3, 4, 5, 6].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setSelectedGrade(g); setSelectedCategory('all'); }}
                  style={{
                    background: selectedGrade === g ? 'linear-gradient(135deg, #facc15, #ca8a04)' : 'rgba(15, 23, 42, 0.7)',
                    color: selectedGrade === g ? '#0f172a' : '#e2e8f0',
                    border: selectedGrade === g ? '2px solid #ffffff' : '1.5px solid rgba(255,255,255,0.15)',
                    borderRadius: '16px',
                    padding: '10px 22px',
                    fontWeight: '900',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: selectedGrade === g ? '0 6px 20px rgba(250, 204, 21, 0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  كِتَاه {g === 1 ? "א' (الأول)" : g === 2 ? "ב' (الثاني)" : g === 3 ? "ג' (الثالث)" : g === 4 ? "ד' (الرابع)" : g === 5 ? "ה' (الخامس)" : "ו' (السادس)"}
                </button>
              ))}
            </div>

            {/* Curriculum Info for Selected Grade */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '2px dashed rgba(250, 204, 21, 0.5)',
              borderRadius: '18px',
              padding: '16px 20px',
              marginBottom: '24px',
              color: '#fef08a',
              fontSize: '0.98rem',
              fontWeight: '700',
              lineHeight: '1.7'
            }}>
              {GRADE_INFOS[selectedGrade]}
            </div>

            {/* Search & Category Filter Toolbar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              marginBottom: '24px',
              background: 'rgba(15, 23, 42, 0.5)',
              padding: '12px 18px',
              borderRadius: '18px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {/* Search input */}
              <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                <i className="fas fa-search" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input
                  type="text"
                  placeholder="ابحث عن كلمة بالعبرية أو معناها بالعربية..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(2, 6, 23, 0.8)',
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    padding: '10px 42px 10px 14px',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              {/* Categories */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: selectedCategory === cat ? '#22c55e' : 'rgba(255,255,255,0.1)',
                      color: selectedCategory === cat ? '#fff' : '#cbd5e1',
                      border: 'none',
                      borderRadius: '99px',
                      padding: '6px 14px',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    {cat === 'all' ? 'الكل' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Flashcards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '18px'
            }}>
              {filteredWords.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.9))',
                    border: '2px solid rgba(34, 197, 94, 0.35)',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#facc15';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.35)';
                  }}
                >
                  <div>
                    {/* Category tag & Listen Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid #38bdf8',
                        color: '#7dd3fc',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        padding: '3px 10px',
                        borderRadius: '99px'
                      }}>
                        {item.category || 'مفردات'}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakHebrew(item.heb, idx)}
                        title="استمع للنطق السليم باللغة العبرية"
                        style={{
                          background: isPlayingAudio === idx ? '#facc15' : 'rgba(255, 255, 255, 0.15)',
                          color: isPlayingAudio === idx ? '#0f172a' : '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          transition: 'all 0.15s'
                        }}
                      >
                        <i className={`fas ${isPlayingAudio === idx ? 'fa-volume-up' : 'fa-volume-low'}`}></i>
                      </button>
                    </div>

                    {/* Hebrew Word with Niqqud */}
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '900',
                      color: '#fde047',
                      textAlign: 'center',
                      letterSpacing: '1px',
                      marginBottom: '8px',
                      direction: 'rtl'
                    }}>
                      {item.heb}
                    </div>

                    {/* Arabic Meaning */}
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: '800',
                      color: '#ffffff',
                      textAlign: 'center',
                      marginBottom: '10px'
                    }}>
                      {item.ar}
                    </div>
                  </div>

                  {/* Hint / Context */}
                  <div style={{
                    background: 'rgba(2, 6, 23, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>💡</span>
                    <span>{item.hint}</span>
                  </div>
                </div>
              ))}
            </div>

            {filteredWords.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '20px',
                color: '#94a3b8',
                fontSize: '1.1rem'
              }}>
                🔍 لم يتم العثور على كلمات مطابقة لبحثك. جرّب كلمة أخرى!
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
