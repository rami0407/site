import React, { useEffect } from 'react';

const ExcellenceYearPage = ({ isStandalone = true }) => {

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="excellence-page-wrapper" style={{
      background: 'linear-gradient(180deg, #0b0f19 0%, #111827 50%, #0f172a 100%)',
      color: '#f8fafc',
      minHeight: '100vh',
      paddingBottom: '5rem',
      fontFamily: "'Tajawal', 'Cairo', sans-serif",
      direction: 'rtl'
    }}>

      {/* Header Banner */}
      <header style={{
        position: 'relative',
        padding: '5rem 1.5rem 4rem 1.5rem',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.18) 0%, rgba(15, 23, 42, 0.8) 70%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Floating Background Stars & Glow */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }}></div>

        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          {/* Date Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fbbf24',
            padding: '0.4rem 1.2rem',
            borderRadius: '50px',
            fontSize: '0.95rem',
            fontWeight: 800,
            marginBottom: '1.5rem',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)'
          }}>
            <span>📅 30.8.2026</span>
            <span>•</span>
            <span>رؤية وتوجيهات الإدارة</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            fontWeight: 900,
            lineHeight: 1.25,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            عام التميز في مدرسة مشيرفة الابتدائية
          </h1>

          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            color: '#94a3b8',
            maxWidth: '750px',
            margin: '0 auto 2rem auto',
            fontWeight: 600
          }}>
            من سفينة النجاة إلى سفينة الفضاء 🚀✨ رحلتنا نحو التأثير والإلخام واكتشاف الكون داخل كل طالب
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => window.location.hash = '#/'}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                padding: '0.8rem 1.8rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="fas fa-arrow-right"></i> العودة للرئيسية
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('spaceship-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f1f5f9',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.8rem 1.8rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🚀 فلسفة سفينة الفضاء
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>

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
                width: '50px',
                height: '50px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
              }}>
                🌟
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                مفهوم التميز بالنسبة لنا
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
            fontSize: '1.75rem',
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
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              transition: 'transform 0.3s ease'
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
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              transition: 'transform 0.3s ease'
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
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              transition: 'transform 0.3s ease'
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

        {/* Section 3: Daily Habit & Goal */}
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#67e8f9', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>⚙️</span> التميز: عادة يومية في التفكير والعمل
            </h2>

            <p style={{ fontSize: '1.15rem', lineHeight: '1.9', color: '#cbd5e1', marginBottom: '1.5rem' }}>
              فالتميز ليس حدثًا استثنائيًا يحدث مرة واحدة، بل عادة يومية في التفكير والعمل. التميز هو أن نلاحظ ما لا يلاحظه الآخرون، وأن نعطي قيمة للتفاصيل الصغيرة، وأن نمتلك الجرأة على التجربة، والقدرة على التعلم من الخطأ، والاستعداد لتغيير ما اعتدنا عليه عندما نرى إمكانية أفضل. فالتميز لا يبدأ دائمًا بفكرة عظيمة؛ أحيانًا يبدأ من تفصيل صغير رآه أحدهم بطريقة مختلفة.
            </p>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderLeft: '4px solid #38bdf8',
              padding: '1.2rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1.15rem',
              color: '#e2e8f0',
              fontWeight: 700,
              marginBottom: '2rem'
            }}>
              💡 "وهو أن ندرك دائمًا أن: ما أوصلنا إلى هنا قد لا يكون كافيًا ليأخذنا إلى هناك."
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.5) 0%, rgba(17, 24, 39, 0.8) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '16px',
              padding: '1.8rem',
              color: '#f8fafc'
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.8rem' }}>
                🎯 غايتنا السامية في عام التميز:
              </h3>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.8', margin: 0, color: '#e2e8f0' }}>
                ليست فقط أن نحافظ على مدرسة ناجحة، وإنما أن ننتقل إلى مرحلة أعمق: <strong>من مدرسة ناجحة ➔ إلى مدرسة متميزة ➔ إلى مدرسة مؤثرة وملهمة.</strong><br/>
                مدرسة لا تقيس نفسها فقط بما أنجزته، وإنما بما تضيفه كل يوم إلى طلابها ومعلميها ومجتمعها، وبما تتركه من أثر بعد كل فكرة ومبادرة وتجربة.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: From Lifeboat to Spaceship (The Vision Feature) */}
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

            {/* Glowing Accent */}
            <div style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(0,0,0,0) 70%)',
              pointerEvents: 'none'
            }}></div>

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
                  على مدار سنوات كانت مدرستنا أشبه بـ <strong>سفينة نجاة</strong>؛ مهمتها أن تحمل أبناءها، تحميهم، تمنحهم الأمان، وتوصلهم إلى برّ يستطيعون الوقوف عليه بثقة. كان ذلك ضروريًا في مرحلة من رحلتنا.
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

            <p style={{ fontSize: '1.15rem', lineHeight: '1.9', color: '#cbd5e1', marginBottom: '1.8rem' }}>
              وهنا يأتي الفضاء ليعبّر عن فلسفة عام التميز. فالفضاء واسع، ولا توجد فيه طريق واحدة يجب على الجميع أن يسلكوها، ولا كوكب واحد يجب على الجميع الوصول إليه. وكذلك طلابنا. كل طالب عالم مختلف، وكل طالب يحمل إمكانات مختلفة، ولكل طالب مداره ومساره وحلمه الخاص.
            </p>

            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              borderRight: '4px solid #f59e0b',
              padding: '1.4rem 1.8rem',
              borderRadius: '0 12px 12px 0',
              fontSize: '1.1rem',
              lineHeight: '1.8',
              color: '#fef08a',
              fontWeight: 700
            }}>
              🌟 "ولذلك فإن مهمتنا ليست أن نصنع نسخًا متشابهة من الطلاب. فالعالم لم يعد بحاجة إلى المزيد من النسخ؛ بل بحاجة إلى أشخاص يستطيعون أن يفكروا بطريقة مختلفة، وأن يبدعوا، وأن يبادروا، وأن يكتشفوا ما لم يكتشفه غيرهم، لذلك علينا أن نساعد كل طالب على الوصول إلى أبعد نقطة يستطيع هو أن يصل إليها."
            </div>

          </div>
        </section>

        {/* Section 5: The 5 Shifts Covenant */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            color: '#f8fafc',
            marginBottom: '1.8rem',
            textAlign: 'center'
          }}>
            📜 ميثاق الانطلاق لمرحلة التميز الجديدة
          </h2>

          <div style={{
            display: 'grid',
            gap: '1rem',
            maxWidth: '800px',
            margin: '0 auto'
          }}>

            {[
              { icon: '🛡️ ➔ 🚀', from: 'من الأمان', to: 'إلى الانطلاق', color: '#38bdf8' },
              { icon: '📚 ➔ 🔬', from: 'من التعلم', to: 'إلى الاكتشاف', color: '#c084fc' },
              { icon: '👥 ➔ 🌟', from: 'من التشابه', to: 'إلى التفرد', color: '#f43f5e' },
              { icon: '🏆 ➔ 💖', from: 'من النجاح', to: 'إلى التأثير', color: '#10b981' },
              { icon: '⛵ ➔ 🛸', from: 'من سفينة النجاة', to: 'إلى سفينة الفضاء', color: '#f59e0b' },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '1.2rem 1.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#94a3b8' }}>
                  {item.from}
                </div>
                <div style={{ fontSize: '1.5rem' }}>➔</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: item.color }}>
                  {item.to}
                </div>
              </div>
            ))}

          </div>
        </section>

        {/* Section 6: Golden Conclusion Card */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)',
            borderRadius: '28px',
            padding: '3rem 2rem',
            textAlign: 'center',
            color: '#ffffff',
            boxShadow: '0 20px 50px rgba(217, 119, 6, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌠</div>
            <h2 style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)',
              fontWeight: 900,
              lineHeight: 1.4,
              maxWidth: '850px',
              margin: '0 auto 1.5rem auto',
              textShadow: '0 4px 15px rgba(0,0,0,0.4)'
            }}>
              "لأننا نؤمن أن: كل طفل يحمل بداخله كونًا يستحق أن يُكتشف."
            </h2>
            <p style={{ fontSize: '1.15rem', color: '#fef3c7', fontWeight: 700, margin: 0 }}>
              مدرسة مشيرفة الابتدائية • بوابة التميز والإبداع 🌟
            </p>
          </div>
        </section>

        {/* Footer Actions */}
        <div style={{ textAlign: 'center', marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.location.hash = '#/'}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '0.8rem 1.8rem',
              borderRadius: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            🏠 الصفحة الرئيسية
          </button>
          <button 
            onClick={() => window.location.hash = '#/astronomy'}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.8rem 1.8rem',
              borderRadius: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
            }}
          >
            🌌 تجربة مختبر الفلك
          </button>
        </div>

      </main>

    </div>
  );
};

export default ExcellenceYearPage;
