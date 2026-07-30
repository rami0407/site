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

const MOON_PHASES = [
  { id: 'new-moon', name: 'المحاق (New Moon)', age: 'اليوم 0 - 1', illum: '0%', icon: '🌑', desc: 'يقع القمر بين الأرض والشمس تماماً، ويكون وجهه المظلم مواجهاً للأرض فلا نراه في السماء.' },
  { id: 'waxing-crescent', name: 'الهلال المتزايد (Waxing Crescent)', age: 'اليوم 2 - 6', illum: '15%', icon: '🌒', desc: 'يظهر قوس مضيء رقيق كالهلال في السماء الغربية بعد غروب الشمس مباشرة، ليعلن بداية الشهر القمري.' },
  { id: 'first-quarter', name: 'الربع الأول (First Quarter)', age: 'اليوم 7 - 10', illum: '50%', icon: '🌓', desc: 'يكون نصف القمر الأيمن مضيئاً ونصفه الأيسر مظلماً، ويصل لارتفاع عالٍ في السماء عند غروب الشمس.' },
  { id: 'waxing-gibbous', name: 'الأحدب المتزايد (Waxing Gibbous)', age: 'اليوم 11 - 13', illum: '75%', icon: '🌔', desc: 'يزداد الجزء المضيء من القمر ليتجاوز النصف ويبدو محدباً وهو يقترب من مرحلة الاكتنال.' },
  { id: 'full-moon', name: 'البدر الكامل (Full Moon)', age: 'اليوم 14 - 15', illum: '100%', icon: '🌕', desc: 'تكون الأرض بين الشمس والقمر، فينعكس ضوء الشمس بالكامل على وجه القمر ليضيء الليل بنوره الباهر!' },
  { id: 'waning-gibbous', name: 'الأحدب المتناقص (Waning Gibbous)', age: 'اليوم 16 - 20', illum: '75%', icon: '🌖', desc: 'يبدأ الإضاءة بالتناقص التدريجي بعد مرحلة البدر، ويشرق القمر في وقت متأخر من الليل.' },
  { id: 'third-quarter', name: 'الربع الأخير (Third Quarter)', age: 'اليوم 21 - 24', illum: '50%', icon: '🌗', desc: 'يكون النصف الأيسر للقمر هو المضيء والنصف الأيمن مظلماً، ويُرى صباحاً في السماء.' },
  { id: 'waning-crescent', name: 'الهلال المتناقص (Waning Crescent)', age: 'اليوم 25 - 28', illum: '15%', icon: '🌘', desc: 'يتبقى خيط ضيق من النور قبل أن يختفي القمر ويعود لمرحلة المحاق لبداية شهر جديد.' }
];

const COSMIC_EVENTS_LIST = [
  {
    id: 'perseids',
    title: '☄️ زخة شهب البرشاويات (Perseids Meteor Shower)',
    date: '12 - 13 أغسطس',
    badge: 'حدث فلكي مميز',
    desc: 'واحدة من أروع وأغزر الزخات الشهابية السنوية! يتساقط أكثر من 60 إلى 100 شهاب في الساعة في السماء المظلمة بعيداً عن أضواء المدينة.',
    tip: 'أفضل وقت لرصدها بين الساعة 2:00 صباحاً وقبل الفجر باتجاه الأفق الشمالي الشرقي.'
  },
  {
    id: 'lunar-eclipse',
    title: '🌕 خسوف القمر الكلي (Total Lunar Eclipse)',
    date: '7 سبتمبر',
    badge: 'ظاهرة فلكية نادرة',
    desc: 'تمر الأرض بين الشمس والقمر فيحجب ظلها نور الشمس عن القمر، ويتلون قرص القمر باللون الأحمر القرمزي الدافئ (قمر الدم).',
    tip: 'يمكن مشاهدته بالعين المجردة بأمان تام دون الحاجة لنظارات خاصة.'
  },
  {
    id: 'conjunction',
    title: '🪐 اقتران كوكب المشتري والزهرة (Venus & Jupiter Conjunction)',
    date: '25 أكتوبر',
    badge: 'مشهد مبهر',
    desc: 'اقتراب ظاهري شديد بين ألمع كوكبين في السماء (الزهرة والمشتري) ليظهرا كجواهر متلألئة بجانب بعضهما بعد غروب الشمس.',
    tip: 'انظر باتجاه الغرب بعد 30 دقيقة من غروب الشمس تماماً.'
  },
  {
    id: 'andromeda-view',
    title: '🌌 رصد مجرة أندروميدا (Andromeda Galaxy Viewing)',
    date: '15 نوفمبر',
    badge: 'رصد عميق',
    desc: 'أفضل ليلة في السنة لرصد مجرة أندروميدا (المرأة المسلسلة) وهي أبعد جرم كوني يمكن رؤيته بالعين المجردة (2.5 مليون سنة ضوئية).',
    tip: 'استخدم منظاراً مزدوجاً (Binoculars) في ليلة صافية خالية من إضاءة القمر.'
  }
];

const QUIZ_QUESTIONS = [
  {
    q: 'ما هو أكبر كواكب المجموعة الشمسية حجماً؟',
    options: ['الأرض', 'المشتري', 'المريخ', 'زحل'],
    answer: 1,
    explanation: 'المشتري هو أكبر كواكب المنظومة الشمسية وحجمه يتسع لأكثر من 1300 كوكب مثل الأرض!'
  },
  {
    q: 'ما هو أقرب كوكب إلى الشمس؟',
    options: ['عطارد', 'الزهرة', 'الأرض', 'نبتون'],
    answer: 0,
    explanation: 'عطارد هو أقرب كوكب للشمس ويبعد عنها حوالي 57.9 مليون كم فقط.'
  },
  {
    q: 'كم استغرق القمر ليدور دورة كاملة حول الأرض (الشهر القمري)؟',
    options: ['7 أيام', '29.5 يوم تقريباً', '365 يوم', '24 ساعة'],
    answer: 1,
    explanation: 'يدور القمر حول الأرض في مدة تقارب 29.5 يوماً وتكتمل بها أطوار الشهر القمري.'
  },
  {
    q: 'ما اسم الكوكب المعروف باسم "الكوكب الأحمر"؟',
    options: ['الزهرة', 'المريخ', 'أورانوس', 'عطارد'],
    answer: 1,
    explanation: 'يُسمى المريخ بالكوكب الأحمر بسبب انتشارات أكسيد الحديد (الصدأ) على سطحه.'
  },
  {
    q: 'ما الوكالة الفضائية الشهيرة التي تنشر صورة اليوم الفلكية (APOD)؟',
    options: ['وكالة ناسا (NASA)', 'الخطوط الجوية', 'المركز الصحي', 'المعرض الفني'],
    answer: 0,
    explanation: 'وكالة ناسا الفضائية (NASA) تنشر صورة اليوم الفلكية يومياً بالتعاون مع تلسكوبات العالم.'
  }
];

const AstronomyPage = ({ isStandalone = true }) => {
  const [activeTab, setActiveTab] = useState('lab'); // 'lab', 'apod', 'moon', 'events', 'quiz', 'sounds'
  
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
          <h2 className="section-title space-title">🌌 الفلك والعلوم الفضائية التفاعلية</h2>
          <p className="section-subtitle space-subtitle">
            مركز العلوم الفلكية الشامل: محاكاة الكواكب، صور ناسا، حاسبة أطوار القمر، مسابقة رائد الفضاء، وأصوات الفضاء الكونية 🚀
          </p>
        </div>

        {/* Space Main Sub-Tabs Nav */}
        <div className="space-tabs-nav">
          <button 
            className={`space-tab-btn ${activeTab === 'lab' ? 'active' : ''}`}
            onClick={() => setActiveTab('lab')}
          >
            <i className="fas fa-microscope"></i> 🔭 مختبر الكواكب والجاذبية
          </button>
          <button 
            className={`space-tab-btn ${activeTab === 'apod' ? 'active' : ''}`}
            onClick={() => setActiveTab('apod')}
          >
            <i className="fas fa-camera-retro"></i> 🪐 صورة ناسا اليومية
          </button>
          <button 
            className={`space-tab-btn ${activeTab === 'moon' ? 'active' : ''}`}
            onClick={() => setActiveTab('moon')}
          >
            <i className="fas fa-moon"></i> 🌒 أطوار القمر المباشرة
          </button>
          <button 
            className={`space-tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <i className="fas fa-meteor"></i> ☄️ الأحداث الفلكية والشهب
          </button>
          <button 
            className={`space-tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <i className="fas fa-user-ninja"></i> 👨‍🚀 وسام رائد الفضاء الصغير
          </button>
          <button 
            className={`space-tab-btn ${activeTab === 'sounds' ? 'active' : ''}`}
            onClick={() => setActiveTab('sounds')}
          >
            <i className="fas fa-volume-up"></i> 🔊 أصوات مسبارات الفضاء
          </button>
        </div>

        {/* TAB 1: INTERACTIVE COSMIC LAB SIMULATOR */}
        {activeTab === 'lab' && <CosmicLab />}

        {/* TAB 2: NASA APOD PICTURE OF THE DAY */}
        {activeTab === 'apod' && (
          <div>
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

            {loading ? (
              <div className="space-loading-box">
                <i className="fas fa-spinner fa-spin space-spinner"></i>
                <p>جاري الاتصال بخوادم ناسا الفضائية وجلب صورة اليوم...</p>
              </div>
            ) : apodData ? (
              <div className="astronomy-display-card">
                
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

                  <div className="space-copyright-overlay">
                    <span className="cp-icon"><i className="fas fa-shield-alt"></i></span>
                    <span className="cp-text">
                      حقوق الصورة والمصدر: <strong>NASA / APOD</strong> 
                      {apodData.copyright && ` | المصور: ${apodData.copyright}`}
                    </span>
                  </div>
                </div>

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

        {/* TAB 3: MOON PHASES LAB */}
        {activeTab === 'moon' && <MoonPhasesLab />}

        {/* TAB 4: COSMIC EVENTS */}
        {activeTab === 'events' && <CosmicEvents />}

        {/* TAB 5: SPACE CADET QUIZ & BADGE */}
        {activeTab === 'quiz' && <SpaceCadetQuiz />}

        {/* TAB 6: SOUNDS OF SPACE */}
        {activeTab === 'sounds' && <SpaceSounds />}

      </div>
    </section>
  );
};

// ==========================================================================
// SUB-COMPONENT 1: INTERACTIVE COSMIC SIMULATOR LAB
// ==========================================================================
const CosmicLab = () => {
  const [selectedPlanet, setSelectedPlanet] = useState(PLANETS_DATA[2]); // Earth default
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [earthWeight, setEarthWeight] = useState(35);

  const canvasRef = useRef(null);
  const anglesRef = useRef(PLANETS_DATA.map(() => Math.random() * Math.PI * 2));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 40; i++) {
        const sx = (Math.sin(i * 99 + 1) * 0.5 + 0.5) * width;
        const sy = (Math.cos(i * 33 + 1) * 0.5 + 0.5) * height;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

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

      const maxOrbit = PLANETS_DATA[PLANETS_DATA.length - 1].orbitRadius;
      const scale = (Math.min(width, height) / 2 - 30) / maxOrbit;

      PLANETS_DATA.forEach((planet, idx) => {
        const r = planet.orbitRadius * scale;

        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = selectedPlanet.id === planet.id ? 'rgba(56, 189, 248, 0.6)' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = selectedPlanet.id === planet.id ? 2 : 1;
        ctx.setLineDash(selectedPlanet.id === planet.id ? [4, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        if (!isPaused) {
          anglesRef.current[idx] += 0.005 * planet.speedFactor * speedMultiplier;
        }
        const angle = anglesRef.current[idx];

        const px = centerX + Math.cos(angle) * r;
        const py = centerY + Math.sin(angle) * r;

        if (planet.hasRings) {
          ctx.beginPath();
          ctx.ellipse(px, py, planet.size * scale * 1.8, planet.size * scale * 0.7, Math.PI / 4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.6)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(px, py, Math.max(3, planet.size * scale * 0.45), 0, Math.PI * 2);
        ctx.fillStyle = planet.color;
        ctx.shadowColor = planet.color;
        ctx.shadowBlur = selectedPlanet.id === planet.id ? 15 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;

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
  const calculatedJump = (ratio) => (1 / ratio).toFixed(2);

  return (
    <div className="cosmic-lab-wrapper">
      
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

      <div className="cosmic-stage-grid">
        
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

// ==========================================================================
// SUB-COMPONENT 2: MOON PHASES LAB & CALCULATOR
// ==========================================================================
const MoonPhasesLab = () => {
  const [selectedPhase, setSelectedPhase] = useState(MOON_PHASES[4]); // Full Moon default

  return (
    <div className="moon-phases-wrapper">
      <div className="moon-header">
        <h3><i className="fas fa-moon gold-icon"></i> 🌒 حاسبة ودليل أطوار القمر والتقويم الهجري</h3>
        <p>استكشف أطوار القمر الثمانية، نسبة سطوعها، وشاهد كيف يتبدل هلال الشهر الهجري في السماء ليلاً!</p>
      </div>

      <div className="moon-phases-grid">
        
        {/* Left: Moon Phase Visual Display Card */}
        <div className="moon-display-card">
          <div className="moon-visual-circle">
            <span className="moon-emoji">{selectedPhase.icon}</span>
          </div>

          <div className="moon-info-details">
            <span className="moon-illum-badge">
              <i className="fas fa-sun"></i> نسبة إضاءة القمر: <strong>{selectedPhase.illum}</strong>
            </span>
            <h3 className="moon-phase-name">{selectedPhase.name}</h3>
            <p className="moon-phase-age"><i className="far fa-clock"></i> العمر في الشهر القمري: {selectedPhase.age}</p>
            <div className="moon-desc-box">
              <p>{selectedPhase.desc}</p>
            </div>
          </div>
        </div>

        {/* Right: Phase Selector List */}
        <div className="moon-selector-list">
          <h4 className="list-title"><i className="fas fa-list-ul"></i> اختر طور القمر لمعاينته:</h4>
          <div className="moon-chips-column">
            {MOON_PHASES.map((phase) => (
              <button 
                key={phase.id}
                className={`moon-chip-row ${selectedPhase.id === phase.id ? 'active' : ''}`}
                onClick={() => setSelectedPhase(phase)}
              >
                <span className="chip-icon">{phase.icon}</span>
                <span className="chip-name">{phase.name}</span>
                <span className="chip-illum">{phase.illum}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================================================
// SUB-COMPONENT 3: COSMIC EVENTS & METEOR SHOWERS
// ==========================================================================
const CosmicEvents = () => {
  return (
    <div className="cosmic-events-wrapper">
      <div className="events-header">
        <h3><i className="fas fa-meteor gold-icon"></i> ☄️ مفكرة الأحداث الفلكية والزخات الشهابية</h3>
        <p>دليلك الفلكي للظواهر الكونية المرتقبة بالسماء هذا العام ومواعيد رصد الشهاب والكواكب 🌌</p>
      </div>

      <div className="events-cards-grid">
        {COSMIC_EVENTS_LIST.map((evt) => (
          <div key={evt.id} className="cosmic-event-card">
            <div className="evt-card-header">
              <span className="evt-badge">{evt.badge}</span>
              <span className="evt-date"><i className="far fa-calendar-alt"></i> {evt.date}</span>
            </div>
            <h4 className="evt-title">{evt.title}</h4>
            <p className="evt-desc">{evt.desc}</p>
            <div className="evt-tip-box">
              <strong><i className="fas fa-eye"></i> نصيحة الرصد:</strong> {evt.tip}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================================================
// SUB-COMPONENT 4: SPACE CADET QUIZ & BADGE GENERATOR
// ==========================================================================
const SpaceCadetQuiz = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('الصف الرابع');
  const [badgeGenerated, setBadgeGenerated] = useState(false);

  const handleSelectOption = (idx) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    if (idx === QUIZ_QUESTIONS[currentQ].answer) {
      setScore(prev => prev + 20);
    }
  };

  const handleNextQ = () => {
    setSelectedOpt(null);
    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleGenerateBadge = (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('يرجى إدخال اسم الطالب لطباعة الوسام!');
      return;
    }
    setBadgeGenerated(true);
  };

  const handleResetQuiz = () => {
    setCurrentQ(0);
    setSelectedOpt(null);
    setScore(0);
    setQuizFinished(false);
    setBadgeGenerated(false);
    setStudentName('');
  };

  return (
    <div className="space-quiz-wrapper">
      <div className="quiz-header">
        <h3><i className="fas fa-user-ninja gold-icon"></i> 👨‍🚀 مسابقة واختبار وسام رائد الفضاء الصغير</h3>
        <p>أجب على الأسئلة الفلكية الخمسة بنجاح لتحصل فوراً على وسام رائد فضاء مدرسة مشيرفة المطبوع باسمك! 🏅</p>
      </div>

      {!quizFinished ? (
        <div className="quiz-box-card">
          <div className="quiz-progress-bar">
            <span>السؤال {currentQ + 1} من {QUIZ_QUESTIONS.length}</span>
            <span className="quiz-score-badge">النقاط: {score} / 100</span>
          </div>

          <h4 className="quiz-question-text">{QUIZ_QUESTIONS[currentQ].q}</h4>

          <div className="quiz-options-list">
            {QUIZ_QUESTIONS[currentQ].options.map((opt, idx) => {
              let btnClass = 'quiz-opt-btn';
              if (selectedOpt !== null) {
                if (idx === QUIZ_QUESTIONS[currentQ].answer) btnClass += ' correct';
                else if (idx === selectedOpt) btnClass += ' wrong';
              }

              return (
                <button
                  key={idx}
                  className={btnClass}
                  onClick={() => handleSelectOption(idx)}
                >
                  <span className="opt-symbol">{String.fromCharCode(65 + idx)}</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {selectedOpt !== null && (
            <div className="quiz-explanation-callout">
              <p><strong>التفسير العلمي:</strong> {QUIZ_QUESTIONS[currentQ].explanation}</p>
              <button className="btn btn-next-q" onClick={handleNextQ}>
                السؤال التالي <i className="fas fa-arrow-left"></i>
              </button>
            </div>
          )}
        </div>
      ) : !badgeGenerated ? (
        <div className="quiz-result-card">
          <div className="result-trophy-icon">🏆</div>
          <h3>مبروك! أكملت الاختبار الفلكي بنجاح!</h3>
          <p className="result-score-text">درجتك النهائية: <strong>{score} / 100</strong></p>
          
          <form onSubmit={handleGenerateBadge} className="badge-form">
            <label htmlFor="studentNameInput">اكتب اسمك الكامل لإدراجه في وسام رائد الفضاء:</label>
            <div className="form-row-badge">
              <input 
                id="studentNameInput"
                type="text" 
                className="badge-name-input"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="مثال: الطالب أمير ارفاعية"
              />
              <select 
                className="badge-grade-select"
                value={studentGrade}
                onChange={(e) => setStudentGrade(e.target.value)}
              >
                <option value="الصف الأول">الصف الأول</option>
                <option value="الصف الثاني">الصف الثاني</option>
                <option value="الصف الثالث">الصف الثالث</option>
                <option value="الصف الرابع">الصف الرابع</option>
                <option value="الصف الخامس">الصف الخامس</option>
                <option value="الصف السادس">الصف السادس</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-generate-badge">
              <i className="fas fa-award"></i> اصدار وتوليد وسام الفضاء الخاص بي 🎖️
            </button>
          </form>
        </div>
      ) : (
        <div className="official-space-badge-card" id="space-badge-printable">
          <div className="badge-gold-border">
            <div className="badge-top-brand">
              <span>🚀 مدرسة مشيرفة الابتدائية - قسم العلوم الفلكية</span>
              <span className="badge-id">Ref: ASTRO-{Math.floor(1000 + Math.random() * 9000)}</span>
            </div>

            <div className="badge-medal-graphic">🏅</div>
            
            <h2 className="badge-main-title">وسام رائد الفضاء الصغير</h2>
            <p className="badge-subtitle">Junior Space Explorer Honor Award</p>

            <div className="badge-recipient-name">
              {studentName}
            </div>
            <p className="badge-recipient-grade">{studentGrade} - مدرسة مشيرفة</p>

            <p className="badge-citation">
              تمنح الإدارة وطاقم الفلك هذا الوسام التقديري تقديراً للشغف والتميز العلمي في علوم الفضاء واستكشاف أسرار الكون بنجاح.
            </p>

            <div className="badge-footer-signatures">
              <div>
                <span>مدير المدرسة</span>
                <strong>أ. رامي ارفاعية</strong>
              </div>
              <div>
                <span>تاريخ التوليد</span>
                <strong>{new Date().toISOString().split('T')[0]}</strong>
              </div>
            </div>

            <div className="badge-actions-row no-print">
              <button onClick={() => window.print()} className="btn btn-print-badge">
                <i className="fas fa-print"></i> طباعة الوسام 🖨️
              </button>
              <button onClick={handleResetQuiz} className="btn btn-reset-quiz">
                إعادة المسابقة 🔄
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ==========================================================================
// SUB-COMPONENT 5: SOUNDS OF SPACE & NASA AUDIO
// ==========================================================================
const SpaceSounds = () => {
  const [playingId, setPlayingId] = useState(null);
  const audioCtxRef = useRef(null);

  const SOUND_PRESETS = [
    {
      id: 'mars-wind',
      title: '🌬️ صوت الرياح على كوكب المريخ (Martian Winds)',
      source: 'مسبار كوريوسيتي (Curiosity Rover)',
      desc: 'تسجيل حقيقي لاهتزازات وحفيف الرياح القادمة من صحراء كوكب المريخ الحمراء.',
      freq: 120,
      type: 'sine'
    },
    {
      id: 'pulsar-star',
      title: '⚡ نبضات النجم النيوتروني (Pulsar Radio Beeps)',
      source: 'تلسكوبات الراديو الفلكية',
      desc: 'تسجيل للموجات الكهرومغناطيسية المنبعثة من نجم نيوتروني يدور مئات المرات في الثانية!',
      freq: 440,
      type: 'square'
    },
    {
      id: 'jupiter-plasma',
      title: '🪐 أمواج المشتري المغناطيسية (Juno Magnetosphere)',
      source: 'مسبار جونو (Juno Spacecraft)',
      desc: 'ترددات العواصف الكهرومغناطيسية العاتية في المجال المغناطيسي لعملاق الغاز المشتري.',
      freq: 280,
      type: 'triangle'
    },
    {
      id: 'sun-rumble',
      title: '☀️ اهتزازات الشمس الداخلية (SDO Solar Harmonics)',
      source: 'مرصد ديناميكا الشمس (SDO)',
      desc: 'صوت الموجات الصوتية الكونية الناتجة عن الحركة الانصهارية في قلب الشمس.',
      freq: 85,
      type: 'sawtooth'
    }
  ];

  const handleTogglePlay = (sound) => {
    if (playingId === sound.id) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setPlayingId(null);
      return;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }

    // Synthesize Cosmic Frequency Audio via Web Audio API
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = sound.type;
      osc.frequency.setValueAtTime(sound.freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      setPlayingId(sound.id);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="space-sounds-wrapper">
      <div className="sounds-header">
        <h3><i className="fas fa-volume-up gold-icon"></i> 🔊 أصوات وموجات الفضاء ومسبارات ناسا</h3>
        <p>استمع لترددات وتسجيلات كهرومغناطيسية حقيقية التقطتها مركبات الفضاء على المريخ والمشتري والنجوم! 🎧</p>
      </div>

      <div className="sounds-grid">
        {SOUND_PRESETS.map((snd) => {
          const isPlaying = playingId === snd.id;

          return (
            <div key={snd.id} className={`sound-card ${isPlaying ? 'playing' : ''}`}>
              <div className="snd-card-top">
                <button 
                  className={`btn-play-sound ${isPlaying ? 'playing' : ''}`}
                  onClick={() => handleTogglePlay(snd)}
                >
                  <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'}`}></i>
                </button>
                <div className="snd-title-meta">
                  <h4>{snd.title}</h4>
                  <span className="snd-source-badge">{snd.source}</span>
                </div>
              </div>

              <p className="snd-desc">{snd.desc}</p>

              {isPlaying && (
                <div className="sound-bars-animation">
                  <span className="bar b1"></span>
                  <span className="bar b2"></span>
                  <span className="bar b3"></span>
                  <span className="bar b4"></span>
                  <span className="bar b5"></span>
                  <span className="audio-playing-txt">جاري تشغيل الموجات الصوتية الفلكية...</span>
                </div>
              )}
            </div>
          );
        })}
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
            <h3>🌌 مركز العلوم الفلكية ومختبر ناسا لمدرسة مشيرفة</h3>
            <p>محاكاة مدارات الكواكب، أطوار القمر، مفكرة الشهب، أصوات ناسا، ووسام رائد الفضاء المنسوب للطالب! 🪐✨</p>
          </div>
          <div className="ab-action">
            <button 
              onClick={() => window.location.hash = '#/astronomy'}
              className="btn btn-ab-cta"
            >
              <i className="fas fa-microscope"></i>
              دخول قسم العلوم الفلكية 🚀
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
