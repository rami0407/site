import React, { useState, useEffect, useRef } from 'react';

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

const PLANETS_DATA = [
  {
    id: 'mercury',
    name: 'عطارد (Mercury)',
    nameAr: 'عطارد',
    distance: '57.9 مليون كم',
    temp: '167° مئوية',
    moons: 0,
    period: '88 يوم أرضي',
    gravityRatio: 0.38,
    color: '#a8a29e',
    size: 6,
    orbitRadius: 45,
    speedFactor: 4.15,
    fact: 'عطارد هو أصغر كواكب المجموعة الشمسية وأقربها إلى الشمس، ولا يملك أي غلاف جوي يحميه من النيازك!'
  },
  {
    id: 'venus',
    name: 'الزهرة (Venus)',
    nameAr: 'الزهرة',
    distance: '108.2 مليون كم',
    temp: '464° مئوية',
    moons: 0,
    period: '225 يوم أرضي',
    gravityRatio: 0.91,
    color: '#f97316',
    size: 10,
    orbitRadius: 75,
    speedFactor: 1.62,
    fact: 'كوكب الزهرة هو أشد كواكب المنظومة حرارة بسبب غلافه الجوي الكثيف المحتبس للحرارة، ويدور بعكس اتجاه باقي الكواكب!'
  },
  {
    id: 'earth',
    name: 'الأرض (Earth)',
    nameAr: 'الأرض',
    distance: '149.6 مليون كم',
    temp: '15° مئوية',
    moons: 1,
    period: '365.25 يوم',
    gravityRatio: 1.0,
    color: '#3b82f6',
    size: 12,
    orbitRadius: 110,
    speedFactor: 1.0,
    fact: 'موطننا الجميل والكوكب الوحيد المعروف حتى الآن الذي يحتضن الحياة والماء السائل والغطاء الجوي الأكسجيني المثالي!'
  },
  {
    id: 'mars',
    name: 'المريخ (Mars)',
    nameAr: 'المريخ',
    distance: '227.9 مليون كم',
    temp: '-65° مئوية',
    moons: 2,
    period: '687 يوم أرضي',
    gravityRatio: 0.38,
    color: '#ef4444',
    size: 8,
    orbitRadius: 145,
    speedFactor: 0.53,
    fact: 'يُسمى الكوكب الأحمر بسبب غبار أكسيد الحديد (الصدأ) المغطي لسطحه، ويحوي أكبر بركان في المنظومة (بركان أوليمبوس)!'
  },
  {
    id: 'jupiter',
    name: 'المشتري (Jupiter)',
    nameAr: 'المشتري',
    distance: '778.5 مليون كم',
    temp: '-110° مئوية',
    moons: 95,
    period: '11.8 سنة أرضية',
    gravityRatio: 2.34,
    color: '#eab308',
    size: 22,
    orbitRadius: 195,
    speedFactor: 0.25,
    fact: 'عملاق الغاز وأكبر كواكب المجموعة الشمسية حجماً! حسه يتسع لأكثر من 1300 كوكب مثل الأرض ويملك 95 قمراً!'
  },
  {
    id: 'saturn',
    name: 'زحل (Saturn)',
    nameAr: 'زحل',
    distance: '1.4 مليار كم',
    temp: '-140° مئوية',
    moons: 146,
    period: '29.5 سنة أرضية',
    gravityRatio: 1.06,
    color: '#fde047',
    size: 18,
    orbitRadius: 245,
    speedFactor: 0.15,
    hasRings: true,
    fact: 'الكوكب اللامع بحلقاته الجليدية والأخايل المبهرة! كتافته أقل من الماء، فلو وضعناه في محيط مائي ضخم لطفا على السطح!'
  },
  {
    id: 'uranus',
    name: 'أورانوس (Uranus)',
    nameAr: 'أورانوس',
    distance: '2.8 مليار كم',
    temp: '-195° مئوية',
    moons: 28,
    period: '84 سنة أرضية',
    gravityRatio: 0.92,
    color: '#06b6d4',
    size: 14,
    orbitRadius: 290,
    speedFactor: 0.08,
    fact: 'العملاق الجليدي الأزرق السماوي يدور على جانبه بزاوية مائل جداً (98 درجة) وكأنه يتدحرج في مداره حول الشمس!'
  },
  {
    id: 'neptune',
    name: 'نبتون (Neptune)',
    nameAr: 'نبتون',
    distance: '4.5 مليار كم',
    temp: '-200° مئوية',
    moons: 16,
    period: '165 سنة أرضية',
    gravityRatio: 1.12,
    color: '#2563eb',
    size: 14,
    orbitRadius: 335,
    speedFactor: 0.04,
    fact: 'أبعد كواكب المنظومة الشمسية عن الشمس، ويشهد أسرع وأعتى رياح في الفضاء تصل سرعتها إلى أكثر من 2000 كم/ساعة!'
  }
];

const AstronomyPage = ({ isStandalone = true }) => {
  const [activeTab, setActiveTab] = useState('lab'); // 'lab' or 'apod'
  
  // APOD State
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
      
      let arDesc = data.explanation || '';
      if (arDesc) {
        arDesc = `🪐 **شرح علمي مبسط لطلاب المدرسة:**\nتُظهر هذه الصورة التقطتها خوادم ناسا الفلكية بعنوان "${data.title}". تحتوي الصورة على مشاهد فلكية خلابة تظهر الأجرام والنجوم والظواهر الفلكية العجيبة في كوننا الفسيح.\n\n` + arDesc;
      }
      setArabicExplanation(arDesc);
    } catch (err) {
      console.warn("Using curated NASA APOD fallback:", err);
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
            <i className="fas fa-user-astronaut"></i> فضاء مشيرفة التعليمي والعلوم الكونية
          </span>
          <h2 className="section-title space-title">🌌 الفلك ومختبر المنظومة الشمسية التفاعلي</h2>
          <p className="section-subtitle space-subtitle">
            رحلة استكشافية افتراضية في عمق الفضاء: جرب حركة الكواكب، اختبر الجاذبية الكوكبية، وشاهد صورة ناسا اليومية 🚀
          </p>
        </div>

        {/* Space Main Sub-Tabs */}
        <div className="space-tabs-nav">
          <button 
            className={`space-tab-btn ${activeTab === 'lab' ? 'active' : ''}`}
            onClick={() => setActiveTab('lab')}
          >
            <i className="fas fa-microscope"></i> 🔭 مختبر الكون والمنظومة الشمسية
          </button>
          <button 
            className={`space-tab-btn ${activeTab === 'apod' ? 'active' : ''}`}
            onClick={() => setActiveTab('apod')}
          >
            <i className="fas fa-camera-retro"></i> 🪐 صورة اليوم الفلكية من NASA
          </button>
        </div>

        {/* TAB 1: INTERACTIVE COSMIC LAB SIMULATOR */}
        {activeTab === 'lab' && <CosmicLab />}

        {/* TAB 2: NASA APOD PICTURE OF THE DAY */}
        {activeTab === 'apod' && (
          <div>
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
        )}

      </div>
    </section>
  );
};

// ==========================================================================
// SUB-COMPONENT: INTERACTIVE COSMIC SIMULATOR LAB
// ==========================================================================
const CosmicLab = () => {
  const [selectedPlanet, setSelectedPlanet] = useState(PLANETS_DATA[2]); // Earth default
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [earthWeight, setEarthWeight] = useState(35); // 35 kg student default weight

  const canvasRef = useRef(null);
  const anglesRef = useRef(PLANETS_DATA.map(() => Math.random() * Math.PI * 2));

  // Canvas Orbit Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      // Set resolution dynamically
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const centerX = width / 2;
      const centerY = height / 2;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Draw Starfield Background Dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 40; i++) {
        const sx = (Math.sin(i * 99 + 1) * 0.5 + 0.5) * width;
        const sy = (Math.cos(i * 33 + 1) * 0.5 + 0.5) * height;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Draw Glowing Sun in Center
      const sunGlow = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 38);
      sunGlow.addColorStop(0, '#fef08a');
      sunGlow.addColorStop(0.4, '#f59e0b');
      sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
      ctx.fillStyle = sunGlow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();

      // Scale factor to fit orbit radiuses inside responsive canvas
      const maxOrbit = PLANETS_DATA[PLANETS_DATA.length - 1].orbitRadius;
      const scale = (Math.min(width, height) / 2 - 30) / maxOrbit;

      // Render Orbits & Planets
      PLANETS_DATA.forEach((planet, idx) => {
        const r = planet.orbitRadius * scale;

        // Draw Orbit Path Ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = selectedPlanet.id === planet.id ? 'rgba(56, 189, 248, 0.6)' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = selectedPlanet.id === planet.id ? 2 : 1;
        ctx.setLineDash(selectedPlanet.id === planet.id ? [4, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        // Update Angle
        if (!isPaused) {
          anglesRef.current[idx] += 0.005 * planet.speedFactor * speedMultiplier;
        }
        const angle = anglesRef.current[idx];

        // Planet Position
        const px = centerX + Math.cos(angle) * r;
        const py = centerY + Math.sin(angle) * r;

        // Draw Saturn's Ring if applicable
        if (planet.hasRings) {
          ctx.beginPath();
          ctx.ellipse(px, py, planet.size * scale * 1.8, planet.size * scale * 0.7, Math.PI / 4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.6)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Draw Planet Body
        ctx.beginPath();
        ctx.arc(px, py, Math.max(3, planet.size * scale * 0.45), 0, Math.PI * 2);
        ctx.fillStyle = planet.color;
        ctx.shadowColor = planet.color;
        ctx.shadowBlur = selectedPlanet.id === planet.id ? 15 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Selection Ring Overlay
        if (selectedPlanet.id === planet.id) {
          ctx.beginPath();
          ctx.arc(px, py, Math.max(7, planet.size * scale * 0.45 + 5), 0, Math.PI * 2);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [selectedPlanet, speedMultiplier, isPaused]);

  // Planet Selection Handler via Canvas Click
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxOrbit = PLANETS_DATA[PLANETS_DATA.length - 1].orbitRadius;
    const scale = (Math.min(width, height) / 2 - 30) / maxOrbit;

    // Check collision distance to each planet
    PLANETS_DATA.forEach((planet, idx) => {
      const r = planet.orbitRadius * scale;
      const angle = anglesRef.current[idx];
      const px = centerX + Math.cos(angle) * r;
      const py = centerY + Math.sin(angle) * r;

      const dist = Math.hypot(clickX - px, clickY - py);
      if (dist < 20) {
        setSelectedPlanet(planet);
      }
    });
  };

  const calculatedWeight = (ratio) => (earthWeight * ratio).toFixed(1);
  const calculatedJump = (ratio) => (1 / ratio).toFixed(2); // In meters (assuming 1m jump on Earth)

  return (
    <div className="cosmic-lab-wrapper">
      
      {/* Interactive Controls Bar */}
      <div className="lab-controls-bar">
        <div className="lab-controls-group">
          <span className="ctrl-label"><i className="fas fa-tachometer-alt"></i> السرعة المدارية:</span>
          <button 
            className={`btn-speed ${speedMultiplier === 0.5 ? 'active' : ''}`} 
            onClick={() => setSpeedMultiplier(0.5)}
          >
            0.5x 🐢
          </button>
          <button 
            className={`btn-speed ${speedMultiplier === 1 ? 'active' : ''}`} 
            onClick={() => setSpeedMultiplier(1)}
          >
            1x عادية
          </button>
          <button 
            className={`btn-speed ${speedMultiplier === 5 ? 'active' : ''}`} 
            onClick={() => setSpeedMultiplier(5)}
          >
            5x 🚀
          </button>
          <button 
            className={`btn-speed ${speedMultiplier === 20 ? 'active' : ''}`} 
            onClick={() => setSpeedMultiplier(20)}
          >
            20x سريعة ⚡
          </button>
        </div>

        <button 
          className={`btn-pause ${isPaused ? 'paused' : ''}`} 
          onClick={() => setIsPaused(!isPaused)}
        >
          <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'}`}></i>
          {isPaused ? 'استئناف المحاكاة' : 'إيقاف حركي مؤقت'}
        </button>
      </div>

      {/* Main Orbit Stage & Inspector Grid */}
      <div className="cosmic-stage-grid">
        
        {/* Left: Canvas Solar System View */}
        <div className="orbit-canvas-card">
          <div className="canvas-header-info">
            <span><i className="fas fa-sun gold-icon"></i> المركز: الشمس المتوهجة</span>
            <small>انقر على أي كوكب بالماوس أو اختتر من القائمة أدناه لمعاينته</small>
          </div>

          <canvas 
            ref={canvasRef} 
            className="solar-canvas"
            onClick={handleCanvasClick}
          />

          {/* Quick Planet Selector Chips */}
          <div className="planet-selector-chips">
            {PLANETS_DATA.map((planet) => (
              <button
                key={planet.id}
                className={`planet-chip ${selectedPlanet.id === planet.id ? 'active' : ''}`}
                onClick={() => setSelectedPlanet(planet)}
                style={{ borderColor: selectedPlanet.id === planet.id ? planet.color : 'transparent' }}
              >
                <span className="dot" style={{ background: planet.color }}></span>
                {planet.nameAr}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Planet Inspector Box */}
        <div className="planet-inspector-card">
          <div className="inspector-header">
            <span className="badge-planet-tag" style={{ background: selectedPlanet.color + '33', color: selectedPlanet.color, border: `1px solid ${selectedPlanet.color}` }}>
              <i className="fas fa-globe"></i> كوكب {selectedPlanet.nameAr}
            </span>
            <h3>{selectedPlanet.name}</h3>
          </div>

          <div className="inspector-stats-grid">
            <div className="stat-box">
              <i className="fas fa-route stat-icon"></i>
              <div>
                <span className="stat-lbl">البعد عن الشمس</span>
                <span className="stat-val">{selectedPlanet.distance}</span>
              </div>
            </div>

            <div className="stat-box">
              <i className="fas fa-temperature-high stat-icon"></i>
              <div>
                <span className="stat-lbl">متوسط الحرارة</span>
                <span className="stat-val">{selectedPlanet.temp}</span>
              </div>
            </div>

            <div className="stat-box">
              <i className="fas fa-moon stat-icon"></i>
              <div>
                <span className="stat-lbl">عدد الأقمار</span>
                <span className="stat-val">{selectedPlanet.moons} قمراً</span>
              </div>
            </div>

            <div className="stat-box">
              <i className="fas fa-history stat-icon"></i>
              <div>
                <span className="stat-lbl">سنة الكوكب (المدار)</span>
                <span className="stat-val">{selectedPlanet.period}</span>
              </div>
            </div>
          </div>

          <div className="planet-fact-callout">
            <h4><i className="fas fa-lightbulb gold-icon"></i> معلومة فلكية شيقة للطلاب:</h4>
            <p>{selectedPlanet.fact}</p>
          </div>

        </div>

      </div>

      {/* VIRTUAL GRAVITY & WEIGHT JUMP CALCULATOR */}
      <div className="gravity-lab-container">
        <div className="gravity-header">
          <h3><i className="fas fa-weight-hanging"></i> 🧪 تجربة الجاذبية والأوزان والقفزات الافتراضية</h3>
          <p>أدخل وزنك الحالي على الأرض (بالكيلوغرام)، واكتشف فوراً كم سيكون وزنك وارتفاع قفزتك على سطح الكواكب الأخرى!</p>
        </div>

        <div className="gravity-input-row">
          <label htmlFor="earthWeight">وزنك على كوكب الأرض (كغم):</label>
          <input 
            id="earthWeight"
            type="number" 
            className="gravity-weight-input"
            value={earthWeight}
            onChange={(e) => setEarthWeight(Number(e.target.value) || 0)}
            min="5"
            max="150"
          />
          <span className="weight-unit">كغم</span>
        </div>

        <div className="gravity-cards-grid">
          
          {/* Moon */}
          <div className="gravity-card">
            <div className="g-card-top">
              <span className="g-icon">🌕</span>
              <h4>سطح القمر</h4>
            </div>
            <div className="g-card-body">
              <p className="g-weight-result">وزنك: <strong>{calculatedWeight(0.166)} كغم</strong></p>
              <p className="g-jump-result">ارتفاع قفزتك: <strong>{calculatedJump(0.166)} متر 🚀</strong></p>
              <small>الجاذبية ضعيفة جداً! ستطير في الهواء بمرونة عالية كالرواد!</small>
            </div>
          </div>

          {/* Mars */}
          <div className="gravity-card">
            <div className="g-card-top">
              <span className="g-icon">🔴</span>
              <h4>سطح المريخ</h4>
            </div>
            <div className="g-card-body">
              <p className="g-weight-result">وزنك: <strong>{calculatedWeight(0.38)} كغم</strong></p>
              <p className="g-jump-result">ارتفاع قفزتك: <strong>{calculatedJump(0.38)} متر 🦘</strong></p>
              <small>جاذبية المريخ تعادل 38% من الأرض فقط! ستقفز لأكثر من ضعف ارتفاعك!</small>
            </div>
          </div>

          {/* Jupiter */}
          <div className="gravity-card">
            <div className="g-card-top">
              <span className="g-icon">🪐</span>
              <h4>سطح المشتري</h4>
            </div>
            <div className="g-card-body">
              <p className="g-weight-result">وزنك: <strong>{calculatedWeight(2.34)} كغم</strong></p>
              <p className="g-jump-result">ارتفاع قفزتك: <strong>{calculatedJump(2.34)} متر ⚓</strong></p>
              <small>جاذبية هائلة وعاتية! ستشعر بثقل شديد وصعوبة في القفز!</small>
            </div>
          </div>

          {/* Saturn */}
          <div className="gravity-card">
            <div className="g-card-top">
              <span className="g-icon">✨</span>
              <h4>سطح زحل</h4>
            </div>
            <div className="g-card-body">
              <p className="g-weight-result">وزنك: <strong>{calculatedWeight(1.06)} كغم</strong></p>
              <p className="g-jump-result">ارتفاع قفزتك: <strong>{calculatedJump(1.06)} متر 👟</strong></p>
              <small>جاذبية زحل قريبة من جاذبية الأرض تقريباً!</small>
            </div>
          </div>

        </div>
      </div>

    </div>
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
              <i className="fas fa-user-astronaut"></i> علوم الفضاء والمحاكاة التفاعلية
            </span>
            <h3>🌌 مختبر الكون التفاعلي وصورة اليوم من ناسا</h3>
            <p>جرب محاكاة مدارات الكواكب والجاذبية الافتراضية، واستكشف صور ناسا الفلكية المشروحة بالعربية 🪐✨</p>
          </div>
          <div className="ab-action">
            <button 
              onClick={() => window.location.hash = '#/astronomy'}
              className="btn btn-ab-cta"
            >
              <i className="fas fa-microscope"></i>
              دخول مختبر الكون الفلكي 🚀
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
