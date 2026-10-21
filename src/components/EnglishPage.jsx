import React, { useState, useEffect } from 'react';
import { ENGLISH_VOCABULARY_BY_GRADE, ENGLISH_GRADE_INFOS } from '../data/englishCurriculumData';

export default function EnglishPage() {
  const [selectedGrade, setSelectedGrade] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('space'); // 'space' | 'basketball' | 'subway' | 'vocab'
  const [isPlayingAudio, setIsPlayingAudio] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'بوابة اللغة الإنجليزية | حرب الفضاء وسلة صب واي وبنك الكلمات 🚀🏀🏃🇬🇧';
  }, []);

  const currentGradeWords = ENGLISH_VOCABULARY_BY_GRADE[selectedGrade] || [];
  const categories = ['all', ...Array.from(new Set(currentGradeWords.map(w => w.category).filter(Boolean)))];

  const filteredWords = currentGradeWords.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const qLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      item.eng.toLowerCase().includes(qLower) || 
      item.ar.includes(searchQuery) || 
      (item.hint && item.hint.toLowerCase().includes(qLower));
    return matchesCat && matchesSearch;
  });

  const speakEnglish = (text, idx) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.88;
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
      background: 'linear-gradient(180deg, #0c4a6e 0%, #0369a1 35%, #0f172a 100%)',
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
        background: 'rgba(12, 74, 110, 0.94)',
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
                🏃 بَوَّابَةُ الثَّرْوَةِ اللُّغَوِيَّةِ الإِنْجِلِيزِيَّة 🇬🇧
              </h1>
              <span style={{ fontSize: '0.82rem', color: '#bae6fd', fontWeight: '700' }}>
                English Vocabulary & Subway Surfers 3D — بنك المفردات للمرحلة الابتدائية (صفوف 1 - 6)
              </span>
            </div>
          </div>

          {/* Quick Action Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('space')}
              style={{
                background: activeTab === 'space' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(15, 23, 42, 0.65)',
                color: '#ffffff',
                border: activeTab === 'space' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: '99px',
                fontWeight: '900',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'space' ? '0 4px 15px rgba(56, 189, 248, 0.5)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🚀 حرب الفضاء (Galaxy Defender)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('basketball')}
              style={{
                background: activeTab === 'basketball' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(15, 23, 42, 0.65)',
                color: activeTab === 'basketball' ? '#0f172a' : '#fff',
                border: activeTab === 'basketball' ? '2px solid #fde047' : '1px solid rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: '99px',
                fontWeight: '900',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'basketball' ? '0 4px 14px rgba(245, 158, 11, 0.5)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🏀 رميات السلة (Slam Dunk)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('subway')}
              style={{
                background: activeTab === 'subway' ? 'linear-gradient(135deg, #059669, #047857)' : 'rgba(15, 23, 42, 0.65)',
                color: '#fff',
                border: activeTab === 'subway' ? '2px solid #4ade80' : '1px solid rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: '99px',
                fontWeight: '900',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'subway' ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🏃 سباق صب واي 3D
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
              📖 معجم وبنك المفردات والصوتيات
            </button>
            <a
              href={activeTab === 'space' ? '/english-space.html?v=1' : activeTab === 'basketball' ? '/english-basketball.html?v=1' : '/english-subway.html?v=1'}
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
          background: 'linear-gradient(135deg, rgba(3, 105, 161, 0.75), rgba(12, 74, 110, 0.9))',
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
              ⭐ English for Elementary Schools (Grades 1 – 6) | Core Band I
            </div>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3.2vw, 2.1rem)', margin: '0 0 10px', color: '#ffffff', fontWeight: '900' }}>
              تعلَّم الإنجليزية بحرب الفضاء والسلة والمغامرات! 🚀🏀🏃
            </h2>
            <p style={{ margin: 0, fontSize: '1rem', color: '#e0f2fe', lineHeight: '1.7', fontWeight: '600' }}>
              بوابة إلكترونية تفاعلية متكاملة تجمع بين <b>حرب الفضاء ومعركة المجرة (Galaxy Defender 🚀)</b>، <b>دوري رميات السلة (Slam Dunk 🏀)</b>، وسباق قطارات الأنفاق <b>Subway Surfers 3D 🏃</b>، مع بنك المفردات والصوتيات لطلاب مدرسة مشيرفة الابتدائية وفق منهاج <b>Band I</b> لوزارة التربية والتعليم.
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
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#38bdf8' }}>Band I</div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>معجم الوزارة</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.2)' }} />
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#4ade80' }}>100+</div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>سؤال ومفردة</div>
            </div>
          </div>
        </div>

        {/* TAB 0: GALAXY DEFENDER SPACE GAME */}
        {activeTab === 'space' && (
          <section className="fade-in">
            <div style={{
              background: '#030712',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 0 3px rgba(56, 189, 248, 0.45)',
              border: '2px solid rgba(56, 189, 248, 0.5)'
            }}>
              {/* Game Frame Header */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a, #0369a1)',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                borderBottom: '2px solid rgba(56, 189, 248, 0.4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.6rem' }}>🚀</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#facc15', fontWeight: '900' }}>
                      English Galaxy Defender — حرب الفضاء ومعركة مجرة الكلمات (Band I)
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#bae6fd' }}>
                      وجّه سفينتك وأطلق ليزر البلازما على سفن الفضائيين التي تحمل المعنى الصحيح لكلمات Band I!
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <a
                    href="/english-space.html?v=1"
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
                  src="/english-space.html?v=1"
                  title="English Galaxy Defender"
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
                background: 'rgba(15, 23, 42, 0.75)',
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
                    1. قيادة السفينة وليزر البلازما
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    حرّك الفأرة أو اسحب باللمس لتوجيه سفينتك الحربية، واضغط بالفأرة أو زر المسافة لإطلاق قذائف الليزر.
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
                <span style={{ fontSize: '1.8rem' }}>🎯</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#facc15', fontSize: '1.05rem', fontWeight: '800' }}>
                    2. استهداف السفينة المطابقة
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    استمع للكلمة الإنجليزية بالضغط على مكبر الصوت، وصوّب الليزر مباشرة نحو السفينة التي تحمل المعنى المطلوب لتدميرها.
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1.5px solid rgba(236, 72, 153, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>🛡️</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#f472b6', fontSize: '1.05rem', fontWeight: '800' }}>
                    3. درع الطاقة وسلسلة الـ Combo
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    احذر من إصابة السفن الخاطئة حتى لا ينفد درعك؛ وحافظ على الرميات المتتالية لمضاعفة النقاط x2 و x3 وإشعال ساحة الفضاء!
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 1: BASKETBALL SLAM DUNK GAME */}
        {activeTab === 'basketball' && (
          <section className="fade-in">
            <div style={{
              background: '#030712',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 3px rgba(245, 158, 11, 0.45)',
              border: '2px solid rgba(250, 204, 21, 0.45)'
            }}>
              {/* Game Frame Header */}
              <div style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                borderBottom: '2px solid rgba(245, 158, 11, 0.4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🏀</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#facc15', fontWeight: '900' }}>
                      English Slam Dunk 3D — دوري رميات السلة لمعجم Band I
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                      استمع للنطق الإنجليزي السليم وسدد الكرة داخل السلة التي تحمل المعنى الصحيح!
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <a
                    href="/english-basketball.html?v=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#0f172a',
                      border: '1px solid #fde047',
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: '900',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fas fa-expand"></i> شاشة كاملة ⛶
                  </a>
                </div>
              </div>

              {/* Game iFrame */}
              <div style={{ position: 'relative', width: '100%', height: '720px', maxHeight: '88vh' }}>
                <iframe
                  src="/english-basketball.html?v=1"
                  title="English Slam Dunk 3D"
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
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>🎯</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#facc15', fontSize: '1.05rem', fontWeight: '800' }}>
                    1. تسديد ذكي واختيار السلة
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    اقرأ الكلمة أو اضغط على مكبر الصوت للاستماع لنطقها، ثم اضغط على السلة التي تطابق الإجابة الصحيحة أو استخدم المفاتيح 1، 2، 3.
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
                <span style={{ fontSize: '1.8rem' }}>📚</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#38bdf8', fontSize: '1.05rem', fontWeight: '800' }}>
                    2. معجم Band I الرسمي
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    تشمل الأسئلة معاني الكلمات، الأضداد (Opposites)، تصنيف الفئات (Animals, Food, Jobs, Places)، وجمل السياق اليومي.
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1.5px solid rgba(34, 197, 94, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>🔥</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#4ade80', fontSize: '1.05rem', fontWeight: '800' }}>
                    3. متتالية النقاط ومضاعف On Fire!
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    كل رمية صحيحة تمنحك +100 نقطة؛ واستمرار الرميات دون خطأ يرفع المتتالية إلى x2 و x3 ليشتعل الملعب بالنيران والتشجيع!
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: 3D SUBWAY SURFERS GAME */}
        {activeTab === 'subway' && (
          <section className="fade-in">
            <div style={{
              background: '#030712',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 3px rgba(2, 132, 199, 0.45)',
              border: '2px solid rgba(250, 204, 21, 0.35)'
            }}>
              {/* Game Frame Header */}
              <div style={{
                background: 'linear-gradient(135deg, #0c4a6e, #0369a1)',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                borderBottom: '2px solid rgba(56, 189, 248, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🏃</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#facc15', fontWeight: '900' }}>
                      English Subway Surfers 3D — مضمار قطارات اللغة الإنجليزية
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#bae6fd' }}>
                      التقط العملات وصناديق الأسئلة (برونزي +100، فضي +250، ذهبي +500) وتزلج فوق القطارات!
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <a
                    href="/english-subway.html?v=1"
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
                    <i className="fas fa-expand"></i> شاشة كاملة
                  </a>
                </div>
              </div>

              {/* Game iFrame */}
              <div style={{ position: 'relative', width: '100%', height: '700px', maxHeight: '88vh' }}>
                <iframe
                  src="/english-subway.html?v=1"
                  title="English Subway Surfers 3D"
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
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>🎮</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#38bdf8', fontSize: '1.05rem', fontWeight: '800' }}>
                    1. تحكم سهل ومريح
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    استخدم الأسهم أو أزرار A/D/W/S أو السحب باللمس للهواتف للتحرك بين المسارات الثلاثة والقفز والتزحلق.
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
                <span style={{ fontSize: '1.8rem' }}>📦</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#facc15', fontSize: '1.05rem', fontWeight: '800' }}>
                    2. صناديق أسئلة الإنجليزية
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    التقط صناديق ABC للحصول على أسئلة مفردات وقواعد وتهجئة؛ كل إجابة صحيحة تمنحك نقاطاً مضاعفة وعملات ذهبية.
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1.5px solid rgba(34, 197, 94, 0.35)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.8rem' }}>🛹</span>
                <div>
                  <h4 style={{ margin: '0 0 6px', color: '#4ade80', fontSize: '1.05rem', fontWeight: '800' }}>
                    3. درع اللوح الطائر (Hoverboard)
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    اضغط زر المسافة لتفعيل اللوح الطائر الذي يحميك عند الاصطدام بالقطارات ويمنحك فرصة ثانية ومكافآت كبرى!
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: FLASHCARDS & PHONICS BANK */}
        {activeTab === 'vocab' && (
          <section className="fade-in">
            {/* Grade Selector Chips */}
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
                  Grade {g} (الصف {g === 1 ? 'الأول' : g === 2 ? 'الثاني' : g === 3 ? 'الثالث' : g === 4 ? 'الرابع' : g === 5 ? 'الخامس' : 'السادس'})
                </button>
              ))}
            </div>

            {/* Curriculum Info Box */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '2px dashed rgba(56, 189, 248, 0.5)',
              borderRadius: '18px',
              padding: '16px 20px',
              marginBottom: '24px',
              color: '#bae6fd',
              fontSize: '0.98rem',
              fontWeight: '700',
              lineHeight: '1.7',
              direction: 'ltr',
              textAlign: 'left'
            }}>
              {ENGLISH_GRADE_INFOS[selectedGrade]}
            </div>

            {/* Search & Categories Bar */}
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
              <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                <i className="fas fa-search" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input
                  type="text"
                  placeholder="Search in English or Arabic (ابحث عن كلمة)..."
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

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: selectedCategory === cat ? '#0284c7' : 'rgba(255,255,255,0.1)',
                      color: selectedCategory === cat ? '#fff' : '#cbd5e1',
                      border: 'none',
                      borderRadius: '99px',
                      padding: '6px 14px',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    {cat === 'all' ? 'All (الكل)' : cat}
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
                    border: '2px solid rgba(56, 189, 248, 0.35)',
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
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
                  }}
                >
                  <div>
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
                        {item.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakEnglish(item.eng, idx)}
                        title="Listen to native English pronunciation (استمع للنطق الإنجليزي)"
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

                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '900',
                      color: '#fde047',
                      textAlign: 'center',
                      letterSpacing: '0.5px',
                      marginBottom: '6px',
                      direction: 'ltr'
                    }}>
                      {item.eng}
                    </div>

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

                  <div style={{
                    background: 'rgba(2, 6, 23, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    direction: 'ltr'
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
                🔍 No words found. Try another word or grade! (لم يتم العثور على كلمات مطابقة).
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
