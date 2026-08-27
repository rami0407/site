import React, { useEffect, useState } from 'react';

const ExcellenceYearPage = ({ isStandalone = true }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const videoId = 'EF4g6yBUbmk';
  const videoEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=1&rel=0&modestbranding=1&enablejsapi=1`;

  const toggleFullscreen = () => {
    const elem = document.getElementById('excellence-video-box');
    if (!elem) return;

    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="excellence-page-wrapper" style={{
      background: 'linear-gradient(180deg, #090d16 0%, #0f172a 50%, #0b0f19 100%)',
      color: '#f8fafc',
      minHeight: '100vh',
      paddingBottom: '5rem',
      fontFamily: "'Tajawal', 'Cairo', sans-serif",
      direction: 'rtl'
    }}>

      {/* Hero Header Section */}
      <header style={{
        position: 'relative',
        padding: '4.5rem 1.5rem 3rem 1.5rem',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.95) 75%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>
        {/* Floating Glowing Aura */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '700px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }}></div>

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          {/* Golden Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fbbf24',
            padding: '0.5rem 1.5rem',
            borderRadius: '50px',
            fontSize: '1rem',
            fontWeight: 800,
            marginBottom: '1.5rem',
            boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)'
          }}>
            <span>✨ العام الدراسي الجديد</span>
            <span>•</span>
            <span>مدرسة مشيرفة الابتدائية</span>
          </div>

          {/* MAIN PAGE TITLE REQUESTED BY USER */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: 900,
            lineHeight: 1.25,
            marginBottom: '1.2rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #fef08a 40%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 10px 40px rgba(245, 158, 11, 0.3)'
          }}>
            أهلاً وسهلاً بكم في عام التميز 2026-2027
          </h1>

          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            color: '#cbd5e1',
            maxWidth: '850px',
            margin: '0 auto 2.5rem auto',
            fontWeight: 600,
            lineHeight: 1.7
          }}>
            نرحب بكم في العام الدراسي الجديد، حيث نُطلق العنان لطاقات إبداع طلابنا ونحلق معاً من سفينة النجاة إلى سفينة الفضاء 🚀✨
          </p>

        </div>
      </header>

      {/* FULL-SCREEN / FULL-WIDTH CINEMATIC VIDEO PLAYER SECTION */}
      <section style={{ maxWidth: '1200px', margin: '-1.5rem auto 4rem auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        
        <div 
          id="excellence-video-box"
          style={{
            background: '#000000',
            borderRadius: '24px',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(245, 158, 11, 0.2)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Top Video Action Bar */}
          <div style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            padding: '0.8rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fbbf24',
            fontSize: '0.95rem',
            fontWeight: 800
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <i className="fas fa-film" style={{ fontSize: '1.2rem', color: '#f59e0b' }}></i>
              <span>فيلم عام التميز 2026-2027 • عرض متواصل لا ينتهي 🔄</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={toggleFullscreen}
                style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  padding: '0.4rem 1rem',
                  borderRadius: '50px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fas fa-expand"></i> {isFullscreen ? 'الخروج من الشاشة الكاملة' : '🔍 عرض بملء الشاشة'}
              </button>

              <a 
                href="https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  padding: '0.4rem 1rem',
                  borderRadius: '50px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className="fab fa-youtube"></i> فتح في يوتيوب ➔
              </a>
            </div>
          </div>

          {/* Responsive 16:9 Full-Width Video Frame */}
          <div style={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%', /* 16:9 Aspect Ratio */
            background: '#000000'
          }}>
            <iframe
              src={videoEmbedUrl}
              title="فيلم عام التميز 2026-2027"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
            ></iframe>
          </div>

          {/* Footer Continuous Loop Notice */}
          <div style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#94a3b8',
            fontWeight: 700
          }}>
            <span>🔄 هذا الفيلم مبرمج للعرض التلقائي والإعادة المستمرة (Infinite Auto-Loop) طوال تواجدكم في الصفحة.</span>
          </div>

        </div>

      </section>

      {/* Main Content Container: Excellence Philosophy & Pillars */}
      <main style={{ maxWidth: '1050px', margin: '0 auto', padding: '1rem 1.5rem' }}>

        {/* Section 1: Concept of Excellence */}
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
              }}>
                🌟
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                مفهوم التميز بالنسبة لنا في مدرسة مشيرفة
              </h2>
            </div>

            <p style={{ fontSize: '1.15rem', lineHeight: '1.9', color: '#cbd5e1', marginBottom: '1.5rem' }}>
              التميز بالنسبة لنا لا يعني الوصول إلى الكمال، ولا يعني جمع المزيد من الجوائز، ولا يعني أن نثبت أننا أفضل من الآخرين. التميز ليس الكمال المطلق، بل هو <strong style={{ color: '#fbbf24' }}>القدرة على رؤية التفاصيل العادية بطريقة غير معتادة، والجرأة على كسر النسق المألوف</strong>.
            </p>
            
            <p style={{ fontSize: '1.15rem', lineHeight: '1.9', color: '#cbd5e1', marginBottom: '2rem' }}>
              لقد كانت لنا رحلة طويلة، حتى أصبحنا اليوم أمام تحدٍّ جديد من نوع مختلف. فالجوائز تخبرنا بما استطعنا تحقيقه بالأمس، لكنها لا تستطيع أن تكون هدفنا للغد. لم يعد السؤال: كيف نتقدم؟ أو كيف نستمر في التقدم عندما نشعر أننا قطعنا مسافة كبيرة؟
            </p>

            {/* Quote Golden Box */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
              borderRight: '4px solid #f59e0b',
              padding: '1.5rem 2rem',
              borderRadius: '0 16px 16px 0',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: '#fef08a',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
              "فنحن نؤمن أن: القمة ليست مكانًا للإقامة، بل منصة انطلاق." 🚀
            </div>
          </div>
        </section>

        {/* Section 2: Core Questions */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: 900,
            color: '#f8fafc',
            marginBottom: '1.8rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem'
          }}>
            <span style={{ color: '#38bdf8' }}>❓</span> أسئلتنا الجوهرية في عام التميز
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>

            {/* Question 1 */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '20px',
              padding: '1.8rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '0.8rem' }}>➕</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.6rem' }}>
                ماذا سنضيف؟
              </h3>
              <p style={{ fontSize: '1.05rem', color: '#cbd5e1', lineHeight: '1.7', margin: 0 }}>
                ما الذي نستطيع أن نفعله اليوم بصورة أفضل من الأمس؟
              </p>
            </div>

            {/* Question 2 */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: '20px',
              padding: '1.8rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '0.8rem' }}>🔄</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#c084fc', marginBottom: '0.6rem' }}>
                ماذا سنغيّر؟
              </h3>
              <p style={{ fontSize: '1.05rem', color: '#cbd5e1', lineHeight: '1.7', margin: 0 }}>
                ما الشيء المألوف الذي يمكن أن نراه بطريقة مختلفة؟
              </p>
            </div>

            {/* Question 3 */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: '20px',
              padding: '1.8rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '0.8rem' }}>💫</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fb7185', marginBottom: '0.6rem' }}>
                ما الأثر الذي سنتركه؟
              </h3>
              <p style={{ fontSize: '1.05rem', color: '#cbd5e1', lineHeight: '1.7', margin: 0 }}>
                ومن أصبح أفضل بسبب عملنا وعطائنا المستمر؟
              </p>
            </div>

          </div>

          {/* Shift Badges Container */}
          <div style={{
            marginTop: '2rem',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '18px',
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>
              من النجاح ➔ إلى التأثير ✨
            </span>
            <span style={{ color: '#64748b' }}>|</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c084fc' }}>
              من الإنجاز ➔ إلى الأثر 🌱
            </span>
            <span style={{ color: '#64748b' }}>|</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>
              من المحافظة على الموجود ➔ إلى صناعة الجديد 🚀
            </span>
          </div>
        </section>

        {/* Section 3: Spaceship Vision Feature */}
        <section id="spaceship-section" style={{ marginBottom: '3.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '28px',
            padding: '2.8rem 2rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>

            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                padding: '0.4rem 1.4rem',
                borderRadius: '50px',
                fontWeight: 800,
                fontSize: '1rem',
                marginBottom: '1rem'
              }}>
                🚀 الفلسفة الكبرى لعام التميز
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                من سفينة النجاة إلى سفينة الفضاء 🌌
              </h2>
            </div>

            {/* Side-by-Side Comparison */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              marginBottom: '2.5rem'
            }}>

              {/* Lifeboat */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '20px',
                padding: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2.5rem' }}>⛵</span>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#94a3b8', margin: 0 }}>
                      مرحلة سفينة النجاة
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>مرحلة الأمان والتأسيس</span>
                  </div>
                </div>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#cbd5e1', margin: 0 }}>
                  على مدار سنوات كانت مدرستنا أشبه بـ <strong>سفينة نجاة</strong>؛ مهمتها أن تحمل أبناءها، تحميهم، تمنحهم الأمان، وتوصلهم إلى برّ يستطيعون الوقوف عليه بثقة.
                </p>
              </div>

              {/* Spaceship */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.6) 0%, rgba(88, 28, 135, 0.5) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '20px',
                padding: '2rem',
                boxShadow: '0 15px 35px rgba(245, 158, 11, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2.5rem' }}>🚀</span>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24', margin: 0 }}>
                      مرحلة سفينة الفضاء
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: '#fef08a' }}>مرحلة التحليق والاكتشاف</span>
                  </div>
                </div>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#f1f5f9', margin: 0 }}>
                  لكننا اليوم أمام مرحلة مختلفة. لم نعد سفينة نجاة هدفها فقط نقل الطلاب لبرّ الأمان، بل أصبحنا <strong>سفينة فضاء هدفها أن تحملهم إلى أبعد مما اعتادوا أن يحلموا به</strong>.
                </p>
              </div>

            </div>

            <p style={{ fontSize: '1.15rem', lineHeight: '1.9', color: '#cbd5e1', marginBottom: '1.8rem', textAlign: 'center' }}>
              الفضاء واسع، ولا توجد فيه طريق واحدة يجب على الجميع أن يسلكوها... ولكذلك طلابنا. كل طالب عالم مختلف، ولكل طالب مداره ومساره وحلمه الخاص.
            </p>

            {/* Home Navigation Button */}
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button 
                onClick={() => window.location.hash = '#/'}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.9rem 2.2rem',
                  borderRadius: '50px',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(37, 99, 235, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}
              >
                <i className="fas fa-home"></i> العودة للبوابة الرئيسية للمدرسة ➔
              </button>
            </div>

          </div>
        </section>

      </main>

    </div>
  );
};

export default ExcellenceYearPage;
