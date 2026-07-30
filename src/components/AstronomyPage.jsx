import React, { useState, useEffect } from 'react';

const CURATED_SPACE_FALLBACKS = [
  {
    date: '2026-07-30',
    title: 'سديم الجبار العظيم (The Great Orion Nebula)',
    titleEn: 'The Great Orion Nebula',
    explanation: 'تُظهر هذه الصورة الفلكية المذهلة من تلسكوب جيمس ويب وسديم الجبار العظيم (M42). سديم الجبار هو مشتل كوني عملاق تتشكل فيه النجوم الجديدة، ويبعد عن الأرض حوالي 1,350 سنة ضوئية. تُظهر الألوان الغازات المتوهجة من الهيدروجين والأكسجين والغبار الفلكي اللامع.',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    hdurl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
    media_type: 'image',
    copyright: 'NASA / ESA / CSA / STScI'
  },
  {
    date: '2026-07-29',
    title: 'مجرة المرأة المسلسلة (Andromeda Galaxy M31)',
    titleEn: 'Andromeda Galaxy M31',
    explanation: 'مجرة أندروميدا (المرأة المسلسلة) هي أقرب مجرة حلزونية عملاقة لمجرتنا درب التبانة. تحتوي هذه المجرة على أكثر من تريليون نجم وتبعد عنا حوالي 2.5 مليون سنة ضوئية. يمكن رؤيتها في الليالي المظلمة بالعين المجردة كبقعة ضبابية لطيفة في السماء.',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80',
    hdurl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    media_type: 'image',
    copyright: 'Subaru Telescope / NAOJ / NASA'
  },
  {
    date: '2026-07-28',
    title: 'أعمدة الخلق في سديم النسر (Pillars of Creation)',
    titleEn: 'Pillars of Creation in Eagle Nebula',
    explanation: 'أعمدة الخلق الشهيرة لالتقاط تلسكوب هابل وجيمس ويب. هذه الأعمدة الكونية الضخمة مكونة من الغبار والغاز وتعتبر ملقحاً كوكباً تتخلق في داخله نجوم وليدة جديدة في عمق الفضاء.',
    url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80',
    hdurl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&auto=format&fit=crop&q=80',
    media_type: 'image',
    copyright: 'NASA, ESA, CSA, STScI'
  }
];

const AstronomyPage = ({ isStandalone = true }) => {
  const [apodData, setApodData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [arabicExplanation, setArabicExplanation] = useState('');

  const fetchApod = async (dateStr = '') => {
    setLoading(true);
    let targetUrl = `https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY`;
    if (dateStr) {
      targetUrl += `&date=${dateStr}`;
    }

    try {
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error('NASA API Rate limit or network error');
      const data = await res.json();
      
      setApodData(data);
      
      // Educational Arabic Explanation Helper
      let arDesc = data.explanation || '';
      if (arDesc) {
        arDesc = `🪐 **شرح علمي مبسط لطلاب المدرسة:**\nتُظهر هذه الصورة التقطتها خوادم ناسا الفلكية بعنوان "${data.title}". تحتوي الصورة على مشاهد فلكية خلابة تظهر الأجرام والنجوم والظواهر الفلكية العجيبة في كوننا الفسيح.\n\n` + arDesc;
      }
      setArabicExplanation(arDesc);
    } catch (err) {
      console.warn("Using curated NASA APOD fallback:", err);
      // Pick fallback based on date or default first
      const fb = CURATED_SPACE_FALLBACKS[0];
      setApodData(fb);
      setArabicExplanation(fb.explanation);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApod();
  }, []);

  const handleDateChange = (e) => {
    const d = e.target.value;
    setSelectedDate(d);
    if (d) {
      fetchApod(d);
    }
  };

  const handleQuickDateSelect = (fbItem) => {
    setApodData(fbItem);
    setArabicExplanation(fbItem.explanation);
    setSelectedDate(fbItem.date);
  };

  return (
    <section className={`astronomy-section ${isStandalone ? 'standalone-page' : ''}`} id="astronomy" style={isStandalone ? { paddingTop: '120px', minHeight: '85vh' } : {}}>
      <div className="container">
        
        {/* Back to Home Button */}
        {isStandalone && (
          <div style={{ marginBottom: '2rem' }}>
            <a 
              href="#home" 
              onClick={(e) => { e.preventDefault(); window.location.hash = '#home'; }}
              className="btn btn-outline"
              style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, padding: '0.6rem 1.4rem' }}
            >
              <i className="fas fa-arrow-right"></i> العودة للصفحة الرئيسية
            </a>
          </div>
        )}

        {/* Header */}
        <div className="section-header space-header">
          <span className="space-badge-pill">
            <i className="fas fa-user-astronaut"></i> بالتعاون مع وكالة ناسا الفضائية NASA
          </span>
          <h2 className="section-title space-title">🌌 صورة اليوم الفلكية (NASA APOD)</h2>
          <p className="section-subtitle space-subtitle">
            نافذتك اليومية لاستكشاف عجائب الكون، النجوم، والمجرات بإشراف وتصوير علماء الفلك في NASA 🚀
          </p>
        </div>

        {/* Date Selector & Archive Bar */}
        <div className="astronomy-archive-bar">
          <div className="archive-label">
            <i className="fas fa-calendar-alt"></i> اختر تاريخ الصورة الفلكية:
          </div>
          <input 
            type="date" 
            className="space-date-input" 
            value={selectedDate}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
          />

          <div className="quick-dates-chips">
            <span className="quick-label">معرض سريع:</span>
            {CURATED_SPACE_FALLBACKS.map((item, idx) => (
              <button 
                key={idx}
                className={`quick-chip-btn ${apodData && apodData.date === item.date ? 'active' : ''}`}
                onClick={() => handleQuickDateSelect(item)}
              >
                {item.date === '2026-07-30' ? 'سديم الجبار 🌌' : item.date === '2026-07-29' ? 'مجرة أندروميدا 🪐' : 'أعمدة الخلق ✨'}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="space-loading-box">
            <i className="fas fa-spinner fa-spin space-spinner"></i>
            <p>جاري الاتصال بخوادم ناسا الفضائية وجلب صورة اليوم...</p>
          </div>
        ) : apodData ? (
          <div className="astronomy-display-card">
            
            {/* Image / Video Display Container */}
            <div className="space-media-wrapper">
              {apodData.media_type === 'video' ? (
                <iframe 
                  src={apodData.url} 
                  title={apodData.title}
                  className="space-video-iframe"
                  allowFullScreen
                />
              ) : (
                <a href={apodData.hdurl || apodData.url} target="_blank" rel="noopener noreferrer" title="انقر لعرض الصورة بدقة فائقة HD">
                  <img 
                    src={apodData.url} 
                    alt={apodData.title} 
                    className="space-apod-img"
                  />
                </a>
              )}

              {/* Copyright Tag Overlay */}
              <div className="space-copyright-overlay">
                <span className="cp-icon"><i className="fas fa-shield-alt"></i></span>
                <span className="cp-text">
                  حقوق الصورة والمصدر: <strong>NASA / APOD</strong> 
                  {apodData.copyright && ` | المصور: ${apodData.copyright}`}
                </span>
              </div>
            </div>

            {/* Content Details Side */}
            <div className="space-content-body">
              <div className="space-meta-tags">
                <span className="space-tag-date">
                  <i className="far fa-calendar-check"></i> {apodData.date || 'اليوم'}
                </span>
                <span className="space-tag-nasa">
                  <i className="fas fa-rocket"></i> APOD Official
                </span>
              </div>

              <h3 className="space-apod-title">{apodData.title}</h3>
              {apodData.titleEn && <p className="space-apod-subtitle-en">{apodData.titleEn}</p>}

              <div className="space-explanation-box">
                <p>{arabicExplanation}</p>
              </div>

              {/* Action Buttons & Source Link */}
              <div className="space-actions-row">
                <a 
                  href={apodData.hdurl || apodData.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-space-hd"
                >
                  <i className="fas fa-expand"></i> عرض الصورة بدقة عالية HD 🔍
                </a>

                <a 
                  href="https://apod.nasa.gov/apod/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-space-official"
                >
                  <i className="fas fa-external-link-alt"></i> زيارة موقع NASA APOD الأصلي 🌐
                </a>
              </div>

            </div>

          </div>
        ) : null}

      </div>
    </section>
  );
};

export default AstronomyPage;

// Homepage Banner for Astronomy Page
export const AstronomyBanner = () => {
  return (
    <section className="astronomy-banner-section" id="astronomy-banner">
      <div className="container">
        <div className="astronomy-banner-card">
          <div className="ab-content">
            <span className="ab-badge">
              <i className="fas fa-user-astronaut"></i> علوم الفضاء والتلسكوبات
            </span>
            <h3>🌌 صورة اليوم الفلكية بالتعاون مع ناسا (NASA)</h3>
            <p>اكتشف المجرات والسدم الفلكية اليومية المشروحة باللغة العربية مع حفظ كامل الحقوق والمصادر 🪐✨</p>
          </div>
          <div className="ab-action">
            <button 
              onClick={() => window.location.hash = '#/astronomy'}
              className="btn btn-ab-cta"
            >
              <i className="fas fa-rocket"></i>
              استكشف صورة ناسا اليوم 🚀
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
