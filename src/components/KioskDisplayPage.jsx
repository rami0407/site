import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { generateDailyWisdomAndFact } from '../utils/aiService';
import './KioskDisplayPage.css';

const DEFAULT_CONFIGS = {
  main: {
    mode: 'split_video',
    title: 'أهلاً وسهلاً بكم في مدرسة مشيرفة الابتدائية',
    subtitle: 'بوابة التميز، الإبداع، والقيادة التربوية 🌟',
    youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
    images: [
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop'
    ],
    sideType: 'greeting',
    sideTitle: '🌟 باقة تهنئة وتكريم',
    sideText: 'تبارك إدارة مدرسة مشيرفة لفرسان التميز والابتكار في فعاليات اليوم الدراسي.',
    sideImageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop',
    sideTheme: 'gold',
    celebrationBadge: '🏆 وسام التميز والتفوق',
    celebrationTitle: 'مبارك لطلابنا المبدعين!',
    celebrationText: 'نفتخر بإنجازات طلابنا وطالباتنا في المسابقات العلمية والأنشطة اللامنهجية.',
    celebrationImageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
    tickerText: 'مرحباً بكم في البوابة الرقمية لمدرسة مشيرفة الابتدائية • نتمنى لطلابنا وأهالينا الكرام يوماً دراسياً ملؤه التميز والعطاء!',
    showTicker: true,
    showClock: true,
    showQr: true,
    showLogo: true,
    theme: 'dark',
    slideInterval: 5
  },
  students: {
    mode: 'split_video',
    title: '🚀 شاشة إبداع الطلاب والفعاليات المدرسية',
    subtitle: 'ركن المبتكرين، التحديات الأسبوعية، والأنشطة اللامنهجية ✨',
    youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
    images: [
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop'
    ],
    sideType: 'greeting',
    sideTitle: '⭐ نجم الأسبوع في STEM',
    sideText: 'نهنئ فرسان التحدي الأسبوعي والمخترعين الصغار في زاوية العلوم والابتكار!',
    sideImageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop',
    sideTheme: 'gold',
    celebrationBadge: '🌟 نجم الأسبوع',
    celebrationTitle: 'تحية إكبار للمتفوقين',
    celebrationText: 'المثابرة والاجتهاد هما طريقكم نحو القمة والنجاح الباهر.',
    celebrationImageUrl: '',
    tickerText: 'طلابنا الأعزاء • شاركوا أفكاركم في زاوية "شارك أفكارك للعالم" وحلوا التحدي الأسبوعي للفوز بجوائز التميز!',
    showTicker: true,
    showClock: true,
    showQr: true,
    showLogo: true,
    theme: 'gold',
    slideInterval: 5
  },
  teachers: {
    mode: 'split_video',
    title: '👨‍🏫 شاشة غرفة المعلمين والإدارة التربوية',
    subtitle: 'التعاميم الرسمية، جدول الفعاليات، ورسائل الإدارة 📚',
    youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
    images: [
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop'
    ],
    sideType: 'reminder',
    sideTitle: '📌 تذكير إداري أسبوعي',
    sideText: 'يرجى استكمال تقارير المتابعة التربوية وتحديث بنك أوراق العمل على المنصة.',
    sideImageUrl: '',
    sideTheme: 'blue',
    celebrationBadge: '💐 شكر وتقدير',
    celebrationTitle: 'شكراً لصناع الأجيال',
    celebrationText: 'تثمن إدارة المدرسة جهود الهيئة التدريسية المخلصة في بناء جيل واعد.',
    celebrationImageUrl: '',
    tickerText: 'زملاءنا المعلمين والمعلمات • يرجى متابعة بوابة STEM وحزم أوراق العمل وتحديث السجلات العلمية دورياً.',
    showTicker: true,
    showClock: true,
    showQr: false,
    showLogo: true,
    theme: 'blue',
    slideInterval: 5
  },
  parents: {
    mode: 'split_slideshow',
    title: '👨‍👩‍👧 شاشة الأهالي والزوار الكرام',
    subtitle: 'أهلاً وسهلاً بكم في مدرسة مشيرفة الابتدائية 🌟',
    youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
    images: [
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop'
    ],
    sideType: 'greeting',
    sideTitle: '👨‍👩‍👧 شركاء النجاح',
    sideText: 'أهلاً وسهلاً بأولياء الأمور الكرام. مشاركتكم واستطلاعاتكم تصنع الفارق.',
    sideImageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop',
    sideTheme: 'emerald',
    celebrationBadge: '🌟 ترحيب كريم',
    celebrationTitle: 'مرحباً بضيوف مشيرفة',
    celebrationText: 'أهلاً بكم في صرح التميز والإبداع والقيادة التربوية.',
    celebrationImageUrl: '',
    tickerText: 'أولياء الأمور الكرام • يسعدنا استقبالكم والرد على استفساراتكم عبر حجز المواعيد وبوابة التواصل الرسمية.',
    showTicker: true,
    showClock: true,
    showQr: true,
    showLogo: true,
    theme: 'dark',
    slideInterval: 5
  }
};

const CHANNEL_BADGES = {
  main: '🏫 الشاشة العامة',
  students: '🎓 شاشة الطلاب',
  teachers: '👨‍🏫 شاشة المعلمين',
  parents: '👨‍👩‍👧 شاشة الأهالي'
};

const KioskDisplayPage = () => {
  const [isLauncherMode, setIsLauncherMode] = useState(false);
  const [channel, setChannel] = useState('main');
  const [config, setConfig] = useState(DEFAULT_CONFIGS.main);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiWisdom, setAiWisdom] = useState(null);

  // Kiosk Control & Design Studio State
  const [isStudioOpen, setIsStudioOpen] = useState(() => {
    const hash = (window.location.hash || '').toLowerCase();
    return hash.includes('admin') || hash.includes('studio') || hash.includes('control') || hash.includes('edit');
  });
  const [studioChannel, setStudioChannel] = useState('main');
  const [studioConfigs, setStudioConfigs] = useState(DEFAULT_CONFIGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const channelBadges = CHANNEL_BADGES;

  useEffect(() => {
    let isMounted = true;
    generateDailyWisdomAndFact().then(res => {
      if (isMounted && res) setAiWisdom(res);
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Load and subscribe to configs for all channels in the Studio
  useEffect(() => {
    const unsubs = [];
    ['main', 'students', 'teachers', 'parents'].forEach((ch) => {
      try {
        const localConf = localStorage.getItem(`db_kiosk_${ch}`);
        if (localConf) {
          const parsed = JSON.parse(localConf);
          setStudioConfigs(prev => ({
            ...prev,
            [ch]: { ...DEFAULT_CONFIGS[ch], ...parsed, imagesText: (parsed.images || []).join('\n') }
          }));
        }
      } catch (e) {}

      try {
        const configRef = doc(db, 'displayBoard', ch);
        const unsub = onSnapshot(configRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setStudioConfigs(prev => ({
              ...prev,
              [ch]: { ...DEFAULT_CONFIGS[ch], ...data, imagesText: (data.images || []).join('\n') }
            }));
          }
        }, () => {});
        unsubs.push(unsub);
      } catch (e) {}
    });

    return () => {
      unsubs.forEach(u => typeof u === 'function' && u());
    };
  }, []);

  // Detect channel and mode from route hash or URL
  useEffect(() => {
    const detectChannel = () => {
      const hash = (window.location.hash || '').toLowerCase();

      if (hash.includes('admin') || hash.includes('studio') || hash.includes('control') || hash.includes('edit')) {
        setIsStudioOpen(true);
      }
      
      // If user typed #tv or #/tv or #tv-launcher without specific channel
      if (hash === '#tv' || hash === '#/tv' || hash === '#tv/' || hash === '#/kiosk/launcher' || hash === '#launcher') {
        setIsLauncherMode(true);
        return;
      }

      setIsLauncherMode(false);
      let ch = 'main';
      if (hash.includes('student')) ch = 'students';
      else if (hash.includes('teacher')) ch = 'teachers';
      else if (hash.includes('parent')) ch = 'parents';
      
      setChannel(ch);
      setStudioChannel(ch);
      const defaultForChannel = DEFAULT_CONFIGS[ch] || DEFAULT_CONFIGS.main;
      
      // Check local cache first
      try {
        const localConf = localStorage.getItem(`db_kiosk_${ch}`);
        if (localConf) {
          setConfig({ ...defaultForChannel, ...JSON.parse(localConf) });
          return;
        }
      } catch(e){}
      
      setConfig(defaultForChannel);
    };

    detectChannel();
    window.addEventListener('hashchange', detectChannel);
    return () => window.removeEventListener('hashchange', detectChannel);
  }, []);

  // Real-time Firestore listener for target channel
  useEffect(() => {
    if (isLauncherMode) return;

    let unsubscribe = () => {};
    try {
      const configRef = doc(db, 'displayBoard', channel);
      unsubscribe = onSnapshot(configRef, (docSnap) => {
        const defaultForChannel = DEFAULT_CONFIGS[channel] || DEFAULT_CONFIGS.main;
        if (docSnap.exists()) {
          const merged = { ...defaultForChannel, ...docSnap.data() };
          setConfig(merged);
          try { localStorage.setItem(`db_kiosk_${channel}`, JSON.stringify(merged)); } catch(e){}
        } else {
          try {
            const localConf = localStorage.getItem(`db_kiosk_${channel}`);
            if (localConf) setConfig({ ...defaultForChannel, ...JSON.parse(localConf) });
            else setConfig(defaultForChannel);
          } catch(e){
            setConfig(defaultForChannel);
          }
        }
      }, (err) => {
        console.warn(`Kiosk listener warning for channel ${channel}:`, err);
        const defaultForChannel = DEFAULT_CONFIGS[channel] || DEFAULT_CONFIGS.main;
        try {
          const localConf = localStorage.getItem(`db_kiosk_${channel}`);
          if (localConf) setConfig({ ...defaultForChannel, ...JSON.parse(localConf) });
        } catch(e){}
      });
    } catch (e) {
      const defaultForChannel = DEFAULT_CONFIGS[channel] || DEFAULT_CONFIGS.main;
      try {
        const localConf = localStorage.getItem(`db_kiosk_${channel}`);
        if (localConf) setConfig({ ...defaultForChannel, ...JSON.parse(localConf) });
      } catch(e){}
    }

    return () => unsubscribe();
  }, [channel, isLauncherMode]);

  // Real-time clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Slideshow auto-rotation timer
  useEffect(() => {
    if (isLauncherMode) return;
    const isSlideMode = config.mode === 'slideshow' || config.mode === 'split_slideshow';
    if (isSlideMode && config.images && config.images.length > 0) {
      const slideTimer = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % config.images.length);
      }, (config.slideInterval || 5) * 1000);
      return () => clearInterval(slideTimer);
    }
  }, [config.mode, config.images, config.slideInterval, isLauncherMode]);

  // Extract YouTube ID helper & force autoplay with mute to ensure autoplay works in modern browsers
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = 'EF4g6yBUbmk';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&rel=0&modestbranding=1&enablejsapi=1`;
  };

  const toggleFullscreen = () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const selectChannelFromLauncher = (targetCh) => {
    setChannel(targetCh);
    setIsLauncherMode(false);
    window.location.hash = targetCh === 'main' ? '#/kiosk' : `#/kiosk/${targetCh}`;
  };

  const formattedDate = currentTime.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const handleUploadImage = (file, targetField) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('حجم الصورة كبير، يرجى اختيار صورة أقل من 8 ميغابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        setStudioConfigs(prev => ({
          ...prev,
          [studioChannel]: {
            ...prev[studioChannel],
            [targetField]: compressedBase64
          }
        }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleUploadMultipleImages = (files) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          setStudioConfigs(prev => {
            const currentText = prev[studioChannel]?.imagesText || '';
            const newText = currentText ? `${currentText}\n${compressed}` : compressed;
            return {
              ...prev,
              [studioChannel]: {
                ...prev[studioChannel],
                imagesText: newText
              }
            };
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveStudioConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');
    const ch = studioChannel;
    const currentConf = studioConfigs[ch] || DEFAULT_CONFIGS[ch];
    try {
      const imagesArray = currentConf.imagesText
        ? currentConf.imagesText.split('\n').map(s => s.trim()).filter(Boolean)
        : (currentConf.images || []);

      const payload = {
        ...currentConf,
        images: imagesArray,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'displayBoard', ch), payload);
      if (ch === 'main') {
        await setDoc(doc(db, 'displayBoard', 'config'), payload);
      }
      localStorage.setItem(`db_kiosk_${ch}`, JSON.stringify(payload));

      if (channel === ch) {
        setConfig(payload);
      }

      setSaveSuccessMsg(`🎉 تم بنجاح حفظ وتحديث شاشة (${channelBadges[ch] || ch})! تم نشر التغييرات فوراً على الشاشات.`);
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ إعدادات الشاشة: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper renderer for Side Widget Card
  const renderSideWidget = () => (
    <div className={`kiosk-side-card theme-${config.sideTheme || 'gold'}`}>
      <div>
        <div className="side-badge">
          {config.sideType === 'image' && <><i className="fas fa-image"></i> صورة جانبية</>}
          {config.sideType === 'greeting' && <><i className="fas fa-award"></i> تهنئة وتكريم</>}
          {config.sideType === 'reminder' && <><i className="fas fa-bell"></i> تذكير بمناسبة</>}
          {!config.sideType && <><i className="fas fa-star"></i> ركن التميز</>}
        </div>

        <h2 className="side-title">{config.sideTitle || 'باقة تهنئة وتكريم'}</h2>
        <p className="side-text">{config.sideText || 'نتمنى لجميع طلابنا ومعلمينا يوماً دراسياً موفقاً ومليئاً بالإبداع.'}</p>
      </div>

      {config.sideImageUrl && (
        <div className="side-image-container">
          <img src={config.sideImageUrl} alt="صورة الإعلان" className="side-image" />
        </div>
      )}
    </div>
  );

  // ==================== TV LAUNCHER SCREEN ====================
  if (isLauncherMode) {
    return (
      <div className="kiosk-tv-launcher">
        <div className="tv-launcher-header">
          <img 
            src={`${import.meta.env.BASE_URL}school_logo.png`} 
            alt="شعار مدرسة مشيرفة" 
            className="tv-launcher-logo" 
            onError={(e) => { e.currentTarget.src = `${import.meta.env.BASE_URL}icon-512.png`; }}
          />
          <h1 className="tv-launcher-title">📺 بوابة شاشات العرض الذكية</h1>
          <p className="tv-launcher-subtitle">مدرسة مشيرفة الابتدائية • اختر الشاشة المراد بثها على هذا التلفاز:</p>
        </div>

        <div className="tv-launcher-grid">
          {[
            { key: 'students', icon: '🎓', title: 'شاشة إبداع الطلاب', desc: 'الأنشطة، التحدي الأسبوعي، نجوم STEM، والمبتكرين الصغار', badge: 'مخصصة للردهات والممرات', color: '#f59e0b' },
            { key: 'main', icon: '🏫', title: 'الشاشة العامة للمدرسة', desc: 'البث العام، إعلانات المدخل، الأنشطة والترحيب', badge: 'مخصصة للمدخل الرئيسي', color: '#0ea5e9' },
            { key: 'teachers', icon: '👨‍🏫', title: 'شاشة غرفة المعلمين', desc: 'التعاميم الإدارية، جدول الحصص، ورسائل الإدارة', badge: 'مخصصة لغرفة المعلمين', color: '#8b5cf6' },
            { key: 'parents', icon: '👨‍👩‍👧', title: 'شاشة الأهالي والزوار', desc: 'الاستقبال، حجز المواعيد، وبوابة التواصل المباشر', badge: 'مخصصة للاستقبال والإدارة', color: '#10b981' }
          ].map(item => (
            <button
              key={item.key}
              type="button"
              className="tv-launcher-card"
              onClick={() => selectChannelFromLauncher(item.key)}
              style={{ borderTop: `5px solid ${item.color}` }}
            >
              <div className="tv-launcher-card-icon">{item.icon}</div>
              <h2 className="tv-launcher-card-title">{item.title}</h2>
              <p className="tv-launcher-card-desc">{item.desc}</p>
              <div className="tv-launcher-card-badge">{item.badge}</div>
            </button>
          ))}
        </div>

        {/* Direct Link to Studio for Content Managers / Teachers / Admins */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setIsStudioOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: '1px solid #38bdf8',
              padding: '12px 28px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <i className="fas fa-sliders-h"></i> ⚙️ استوديو التحكم بتصميم ومحتوى الشاشات
          </button>
        </div>
      </div>
    );
  }

  // ==================== KIOSK STUDIO / DESIGN & CONTROL MODE ====================
  if (isStudioOpen) {
    const currentStudioConf = studioConfigs[studioChannel] || DEFAULT_CONFIGS[studioChannel] || DEFAULT_CONFIGS.main;

    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#0b1120', color: '#f8fafc', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* Studio Top Navigation Bar */}
        <header style={{
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '1.25rem 2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img 
              src={`${import.meta.env.BASE_URL}school_logo.png`} 
              alt="شعار المدرسة" 
              style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #38bdf8' }}
              onError={(e) => { e.currentTarget.src = `${import.meta.env.BASE_URL}icon-512.png`; }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ background: '#0284c7', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
                  STUDIO CONTROL
                </span>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                  📺 استوديو تصميم والتحكم بشاشات العرض المدرسية
                </h1>
              </div>
              <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>
                تحكم بكافة ما يُعرض على شاشات المدرسة التلفزيونية في الوقت الفعلي
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const baseUrl = window.location.origin + window.location.pathname;
                const link = studioChannel === 'main' ? `${baseUrl}#/kiosk` : `${baseUrl}#/kiosk/${studioChannel}`;
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(link).then(() => alert(`📋 تم نسخ رابط بث شاشة (${channelBadges[studioChannel] || studioChannel}):\n${link}`));
                } else {
                  prompt('رابط هذه الشاشة:', link);
                }
              }}
              style={{
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #38bdf8',
                padding: '0.65rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fas fa-link"></i> نسخ رابط الشاشة للتلفاز
            </button>

            <button
              type="button"
              onClick={() => {
                setChannel(studioChannel);
                setIsStudioOpen(false);
              }}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.4rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(5,150,105,0.4)'
              }}
            >
              <i className="fas fa-tv"></i> 🖥️ معاينة البث بملء الشاشة
            </button>
          </div>
        </header>

        {/* Channels Selector Chips */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span style={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.92rem' }}>
            اختر الشاشة المراد تصميمها والتحكم بها:
          </span>
          {[
            { key: 'students', label: '🎓 شاشة إبداع الطلاب', desc: 'في الردهات والممرات', color: '#f59e0b' },
            { key: 'main', label: '🏫 الشاشة الرئيسية العامة', desc: 'في المدخل والاستقبال', color: '#0ea5e9' },
            { key: 'teachers', label: '👨‍🏫 شاشة غرفة المعلمين', desc: 'التعاميم والجدول', color: '#8b5cf6' },
            { key: 'parents', label: '👨‍👩‍👧 شاشة الأهالي والزوار', desc: 'الاستقبال والتواصل', color: '#10b981' }
          ].map(ch => {
            const isSelected = studioChannel === ch.key;
            return (
              <button
                key={ch.key}
                type="button"
                onClick={() => setStudioChannel(ch.key)}
                style={{
                  background: isSelected ? ch.color : 'rgba(255,255,255,0.06)',
                  color: isSelected ? (ch.key === 'students' ? '#000' : '#fff') : '#cbd5e1',
                  border: isSelected ? `2px solid ${ch.color}` : '1px solid rgba(255,255,255,0.12)',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.15rem',
                  boxShadow: isSelected ? `0 8px 20px ${ch.color}40` : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{ch.label}</span>
                <small style={{ fontSize: '0.72rem', opacity: 0.85 }}>({ch.desc})</small>
              </button>
            );
          })}
        </div>

        {/* Success Alert */}
        {saveSuccessMsg && (
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#fff',
            padding: '1rem 1.5rem',
            borderRadius: '16px',
            marginBottom: '2rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 25px rgba(16,185,129,0.3)'
          }}>
            <i className="fas fa-check-circle" style={{ fontSize: '1.4rem' }}></i>
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Main Studio Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* Config Edit Form */}
          <form onSubmit={handleSaveStudioConfig} style={{
            background: '#1e293b',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '2rem',
            boxShadow: '0 15px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <div>
                <span style={{ background: '#0284c7', color: '#fff', padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                  ⚙️ تخصيص المحتوى والتقسيم
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', margin: '0.4rem 0 0 0' }}>
                  إعدادات وتخطيط شاشة ({channelBadges[studioChannel] || studioChannel}):
                </h2>
              </div>
            </div>

            {/* Presets: 6 Layout Modes */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc', marginBottom: '0.75rem', display: 'block' }}>
                🎬 1. اختر نمط وتخطيط الشاشة (Screen Layout Preset):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {[
                  { id: 'split_video', icon: '🌓', title: 'شاشة منقسمة (فيديو + لوحة جانبية)', desc: 'فيديو يوتيوب يعمل بالجانب + صورة أو بطاقة تهنئة أو تذكير بالجانب الآخر' },
                  { id: 'youtube', icon: '🔴', title: 'فيديو يوتيوب كامل (Full Video)', desc: 'عرض فيديو يوتيوب بملء الشاشة مع الشريط الإخباري والساعة' },
                  { id: 'split_slideshow', icon: '🖼️', title: 'شاشة منقسمة (سلايدر صور + لوحة جانبية)', desc: 'سلايدر صور الأنشطة + لوحة جانبية مخصصة' },
                  { id: 'slideshow', icon: '📸', title: 'معرض صور كامل (Full Slideshow)', desc: 'معرض صور متبدلة تلقائياً بملء الشاشة' },
                  { id: 'celebration', icon: '🎉', title: 'لوحة التهاني والتكريم والمناسبات', desc: 'تصميم احتفالي مخصص مع وسام التميز وشهادات الشكر' },
                  { id: 'announcement', icon: '📢', title: 'كرت إعلاني رسمي عريض', desc: 'إعلان نصي رسمي مميز من الإدارة المدرسية' }
                ].map(m => {
                  const isSelected = (currentStudioConf.mode || 'split_video') === m.id;
                  return (
                    <label
                      key={m.id}
                      style={{
                        background: isSelected ? 'rgba(2, 132, 199, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                        border: isSelected ? '2.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                        padding: '1.25rem',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.85rem',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 6px 20px rgba(56, 189, 248, 0.25)' : 'none'
                      }}
                    >
                      <input 
                        type="radio" 
                        name="studioKioskMode" 
                        value={m.id} 
                        checked={isSelected} 
                        onChange={() => setStudioConfigs({
                          ...studioConfigs,
                          [studioChannel]: { ...currentStudioConf, mode: m.id }
                        })}
                        style={{ marginTop: '0.25rem', width: '18px', height: '18px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 900, color: isSelected ? '#38bdf8' : '#f8fafc', fontSize: '0.98rem', marginBottom: '0.25rem' }}>
                          {m.icon} {m.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
                          {m.desc}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Main Titles */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.8rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900, color: '#38bdf8', fontSize: '1rem' }}>
                🏷️ 2. العناوين العلوية للشاشة (تظهر أعلى البث):
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>العنوان الرئيسي أعلى الشاشة *</label>
                  <input 
                    type="text" 
                    value={currentStudioConf.title || ''} 
                    onChange={(e) => setStudioConfigs({
                      ...studioConfigs,
                      [studioChannel]: { ...currentStudioConf, title: e.target.value }
                    })} 
                    required 
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>العنوان الفرعي / رسالة الترحيب *</label>
                  <input 
                    type="text" 
                    value={currentStudioConf.subtitle || ''} 
                    onChange={(e) => setStudioConfigs({
                      ...studioConfigs,
                      [studioChannel]: { ...currentStudioConf, subtitle: e.target.value }
                    })} 
                    required 
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Video Settings */}
            {(currentStudioConf.mode === 'split_video' || currentStudioConf.mode === 'youtube') && (
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.8rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900, color: '#ef4444', fontSize: '1rem' }}>
                  🎥 3. رابط فيديو يوتيوب (YouTube Video):
                </h3>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  رابط يوتيوب المراد تشغيله تلقائياً وتكراره:
                </label>
                <input 
                  type="url" 
                  value={currentStudioConf.youtubeUrl || ''} 
                  onChange={(e) => setStudioConfigs({
                    ...studioConfigs,
                    [studioChannel]: { ...currentStudioConf, youtubeUrl: e.target.value }
                  })} 
                  placeholder="https://www.youtube.com/watch?v=... أو https://youtu.be/..." 
                  style={{ width: '100%', direction: 'ltr', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>
            )}

            {/* Side Widget Settings (for split modes) */}
            {(currentStudioConf.mode === 'split_video' || currentStudioConf.mode === 'split_slideshow') && (
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.8rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900, color: '#10b981', fontSize: '1rem' }}>
                  🧩 4. محتوى اللوحة الجانبية (Side Widget):
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>نوع اللوحة الجانبية</label>
                    <select
                      value={currentStudioConf.sideType || 'greeting'}
                      onChange={(e) => setStudioConfigs({
                        ...studioConfigs,
                        [studioChannel]: { ...currentStudioConf, sideType: e.target.value }
                      })}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                    >
                      <option value="greeting">🌟 باقة تهنئة وتكريم</option>
                      <option value="reminder">📌 تذكير إداري أو توجيه</option>
                      <option value="event">📅 فعالية اليوم</option>
                      <option value="photo">🖼️ صورة فوتوغرافية بارزة</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>ثيم ولون اللوحة الجانبية</label>
                    <select
                      value={currentStudioConf.sideTheme || 'gold'}
                      onChange={(e) => setStudioConfigs({
                        ...studioConfigs,
                        [studioChannel]: { ...currentStudioConf, sideTheme: e.target.value }
                      })}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                    >
                      <option value="gold">🥇 ذهبي / تكريم</option>
                      <option value="blue">🔷 أزرق ملكي</option>
                      <option value="emerald">🌿 زمردي أخضر</option>
                      <option value="purple">🟣 بنفسجي إبداعي</option>
                      <option value="rose">🌹 وردي بهيج</option>
                      <option value="dark">⬛ داكن فخم</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>عنوان اللوحة الجانبية</label>
                    <input 
                      type="text" 
                      value={currentStudioConf.sideTitle || ''} 
                      onChange={(e) => setStudioConfigs({
                        ...studioConfigs,
                        [studioChannel]: { ...currentStudioConf, sideTitle: e.target.value }
                      })} 
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>نص اللوحة الجانبية</label>
                    <textarea 
                      rows="2" 
                      value={currentStudioConf.sideText || ''} 
                      onChange={(e) => setStudioConfigs({
                        ...studioConfigs,
                        [studioChannel]: { ...currentStudioConf, sideText: e.target.value }
                      })} 
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>صورة اللوحة الجانبية (رفع من الجهاز أو رابط)</label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleUploadImage(e.target.files[0], 'sideImageUrl')} 
                      style={{ color: '#94a3b8', fontSize: '0.85rem' }}
                    />
                    {currentStudioConf.sideImageUrl && (
                      <button 
                        type="button" 
                        onClick={() => setStudioConfigs({
                          ...studioConfigs,
                          [studioChannel]: { ...currentStudioConf, sideImageUrl: '' }
                        })}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        إزالة الصورة
                      </button>
                    )}
                  </div>
                  {currentStudioConf.sideImageUrl && (
                    <img 
                      src={currentStudioConf.sideImageUrl} 
                      alt="معاينة" 
                      style={{ height: '70px', borderRadius: '8px', marginTop: '0.5rem', border: '1px solid #334155' }} 
                    />
                  )}
                </div>
              </div>
            )}

            {/* Slideshow Settings */}
            {(currentStudioConf.mode === 'slideshow' || currentStudioConf.mode === 'split_slideshow') && (
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.8rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900, color: '#f59e0b', fontSize: '1rem' }}>
                  🖼️ 5. صور المعرض (Slideshow Images):
                </h3>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    رفع صور متعددة مباشرة من الجهاز:
                  </label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={(e) => handleUploadMultipleImages(e.target.files)} 
                    style={{ color: '#94a3b8', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    روابط الصور (رابط واحد لكل سطر):
                  </label>
                  <textarea 
                    rows="4" 
                    dir="ltr"
                    value={currentStudioConf.imagesText || ''} 
                    onChange={(e) => setStudioConfigs({
                      ...studioConfigs,
                      [studioChannel]: { ...currentStudioConf, imagesText: e.target.value }
                    })} 
                    placeholder="https://image1.jpg&#10;https://image2.jpg"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
            )}

            {/* Celebration Mode Settings */}
            {currentStudioConf.mode === 'celebration' && (
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.8rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900, color: '#f59e0b', fontSize: '1rem' }}>
                  🎉 إعدادات بطاقة الاحتفال والتكريم:
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>شارة الوسام / الشرف</label>
                    <input 
                      type="text" 
                      value={currentStudioConf.celebrationBadge || ''} 
                      onChange={(e) => setStudioConfigs({
                        ...studioConfigs,
                        [studioChannel]: { ...currentStudioConf, celebrationBadge: e.target.value }
                      })} 
                      placeholder="🏆 وسام التفوق والتميز"
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>عنوان التكريم</label>
                    <input 
                      type="text" 
                      value={currentStudioConf.celebrationTitle || ''} 
                      onChange={(e) => setStudioConfigs({
                        ...studioConfigs,
                        [studioChannel]: { ...currentStudioConf, celebrationTitle: e.target.value }
                      })} 
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>نص رسالة التكريم</label>
                  <textarea 
                    rows="3" 
                    value={currentStudioConf.celebrationText || ''} 
                    onChange={(e) => setStudioConfigs({
                      ...studioConfigs,
                      [studioChannel]: { ...currentStudioConf, celebrationText: e.target.value }
                    })} 
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>صورة المكرمين / الشهادة</label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleUploadImage(e.target.files[0], 'celebrationImageUrl')} 
                      style={{ color: '#94a3b8', fontSize: '0.85rem' }}
                    />
                    {currentStudioConf.celebrationImageUrl && (
                      <button 
                        type="button" 
                        onClick={() => setStudioConfigs({
                          ...studioConfigs,
                          [studioChannel]: { ...currentStudioConf, celebrationImageUrl: '' }
                        })}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        إزالة الصورة
                      </button>
                    )}
                  </div>
                  {currentStudioConf.celebrationImageUrl && (
                    <img 
                      src={currentStudioConf.celebrationImageUrl} 
                      alt="معاينة التكريم" 
                      style={{ height: '70px', borderRadius: '8px', marginTop: '0.5rem', border: '1px solid #334155' }} 
                    />
                  )}
                </div>
              </div>
            )}

            {/* Ticker Settings */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.8rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900, color: '#38bdf8', fontSize: '1rem' }}>
                📢 6. الشريط الإخباري المتحرك وعناصر الشاشة:
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>نص الشريط الإخباري المتحرك أسفل الشاشة:</label>
                <textarea 
                  rows="2" 
                  value={currentStudioConf.tickerText || ''} 
                  onChange={(e) => setStudioConfigs({
                    ...studioConfigs,
                    [studioChannel]: { ...currentStudioConf, tickerText: e.target.value }
                  })} 
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, color: '#e2e8f0' }}>
                  <input 
                    type="checkbox" 
                    checked={currentStudioConf.showTicker ?? true} 
                    onChange={(e) => setStudioConfigs({
                      ...studioConfigs,
                      [studioChannel]: { ...currentStudioConf, showTicker: e.target.checked }
                    })} 
                  />
                  إظهار الشريط الإخباري
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, color: '#e2e8f0' }}>
                  <input 
                    type="checkbox" 
                    checked={currentStudioConf.showClock ?? true} 
                    onChange={(e) => setStudioConfigs({
                      ...studioConfigs,
                      [studioChannel]: { ...currentStudioConf, showClock: e.target.checked }
                    })} 
                  />
                  إظهار الساعة والتاريخ
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, color: '#e2e8f0' }}>
                  <input 
                    type="checkbox" 
                    checked={currentStudioConf.showQr ?? true} 
                    onChange={(e) => setStudioConfigs({
                      ...studioConfigs,
                      [studioChannel]: { ...currentStudioConf, showQr: e.target.checked }
                    })} 
                  />
                  إظهار رمز QR لزيارة الموقع
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, color: '#e2e8f0' }}>
                  <input 
                    type="checkbox" 
                    checked={currentStudioConf.showLogo ?? true} 
                    onChange={(e) => setStudioConfigs({
                      ...studioConfigs,
                      [studioChannel]: { ...currentStudioConf, showLogo: e.target.checked }
                    })} 
                  />
                  إظهار شعار المدرسة
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '1rem 2.5rem',
                  borderRadius: '16px',
                  fontWeight: 900,
                  fontSize: '1.15rem',
                  cursor: isSaving ? 'wait' : 'pointer',
                  boxShadow: '0 8px 25px rgba(2, 132, 199, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <i className={isSaving ? "fas fa-spinner fa-spin" : "fas fa-save"}></i>
                {isSaving ? 'جارٍ الحفظ والنشر...' : `💾 حفظ ونشر التغييرات على شاشة (${channelBadges[studioChannel] || studioChannel}) فوراً`}
              </button>

              <button
                type="button"
                onClick={() => {
                  setChannel(studioChannel);
                  setIsStudioOpen(false);
                }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '1rem 1.8rem',
                  borderRadius: '16px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-eye"></i> معاينة مباشرة بملء الشاشة
              </button>
            </div>

          </form>

        </div>

      </div>
    );
  }

  // ==================== KIOSK ACTIVE DISPLAY ====================
  return (
    <div className={`kiosk-container theme-${config.theme || 'dark'}`}>
      
      {/* Top Header Bar */}
      <header className="kiosk-header">
        <div className="kiosk-header-right">
          {config.showLogo && (
            <img 
              src={`${import.meta.env.BASE_URL}school_logo.png`} 
              alt="شعار مدرسة مشيرفة" 
              className="kiosk-logo" 
              onError={(e) => { e.currentTarget.src = `${import.meta.env.BASE_URL}icon-512.png`; }}
            />
          )}
          <div className="kiosk-titles">
            <div className="kiosk-channel-tag">{channelBadges[channel] || '📺 شاشة العرض'}</div>
            <h1 className="kiosk-main-title">{config.title}</h1>
            <p className="kiosk-subtitle">{config.subtitle}</p>
          </div>
        </div>

        <div className="kiosk-header-left">
          {/* Direct jump to Kiosk Studio */}
          <button 
            type="button" 
            className="kiosk-btn-admin-studio" 
            onClick={() => setIsStudioOpen(true)}
            title="فتح استوديو التحكم بتصميم ومحتوى الشاشة"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: 'white',
              border: '1px solid #38bdf8',
              padding: '6px 14px',
              borderRadius: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.88rem'
            }}
          >
            <i className="fas fa-sliders-h"></i> ⚙️ استوديو التحكم والتصميم
          </button>

          {/* Switch Channel Quick Button for TV remotes */}
          <button 
            type="button" 
            className="kiosk-btn-switch-channel" 
            onClick={() => setIsLauncherMode(true)}
            title="اختيار شاشة أخرى"
          >
            <i className="fas fa-th-large"></i> اختيار شاشة أخرى
          </button>

          {config.showClock && (
            <div className="kiosk-clock-box">
              <div className="kiosk-time">{formattedTime}</div>
              <div className="kiosk-date">{formattedDate}</div>
            </div>
          )}

          <button className="kiosk-btn-fullscreen" onClick={toggleFullscreen} title="ملء الشاشة">
            <i className={isFullscreen ? "fas fa-compress" : "fas fa-expand"}></i>
          </button>
        </div>
      </header>

      {/* Main Display Stage */}
      <main className="kiosk-stage">
        
        {/* MODE 1: FULL SCREEN YOUTUBE VIDEO */}
        {config.mode === 'youtube' && (
          <div className="kiosk-video-wrapper">
            <iframe
              src={getYoutubeEmbedUrl(config.youtubeUrl)}
              title="عرض يوتيوب لمدرسة مشيرفة"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="kiosk-iframe"
            ></iframe>
          </div>
        )}

        {/* MODE 2: SPLIT SCREEN (YOUTUBE VIDEO + SIDE WIDGET / GREETING / IMAGE) */}
        {config.mode === 'split_video' && (
          <div className="kiosk-split-wrapper">
            <div className="kiosk-split-main">
              <div className="kiosk-video-wrapper">
                <iframe
                  src={getYoutubeEmbedUrl(config.youtubeUrl)}
                  title="عرض يوتيوب لمدرسة مشيرفة"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="kiosk-iframe"
                ></iframe>
              </div>
            </div>
            <div className="kiosk-split-side">
              {renderSideWidget()}
            </div>
          </div>
        )}

        {/* MODE 3: SPLIT SCREEN (IMAGE SLIDESHOW + SIDE WIDGET) */}
        {config.mode === 'split_slideshow' && (
          <div className="kiosk-split-wrapper">
            <div className="kiosk-split-main">
              <div className="kiosk-slideshow-wrapper">
                {(config.images || []).map((imgUrl, index) => (
                  <div 
                    key={index}
                    className={`kiosk-slide ${index === currentSlideIndex ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${imgUrl})` }}
                  >
                    <div className="slide-overlay"></div>
                  </div>
                ))}
                
                <div className="kiosk-slide-dots">
                  {(config.images || []).map((_, idx) => (
                    <span 
                      key={idx} 
                      className={`dot ${idx === currentSlideIndex ? 'active' : ''}`}
                      onClick={() => setCurrentSlideIndex(idx)}
                    ></span>
                  ))}
                </div>
              </div>
            </div>
            <div className="kiosk-split-side">
              {renderSideWidget()}
            </div>
          </div>
        )}

        {/* MODE 4: FULL SCREEN IMAGE SLIDESHOW */}
        {config.mode === 'slideshow' && config.images && config.images.length > 0 && (
          <div className="kiosk-slideshow-wrapper">
            {config.images.map((imgUrl, index) => (
              <div 
                key={index}
                className={`kiosk-slide ${index === currentSlideIndex ? 'active' : ''}`}
                style={{ backgroundImage: `url(${imgUrl})` }}
              >
                <div className="slide-overlay"></div>
              </div>
            ))}
            
            {/* Slide Dots Indicator */}
            <div className="kiosk-slide-dots">
              {config.images.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`dot ${idx === currentSlideIndex ? 'active' : ''}`}
                  onClick={() => setCurrentSlideIndex(idx)}
                ></span>
              ))}
            </div>
          </div>
        )}

        {/* MODE 5: CELEBRATION & OCCASIONS CARD */}
        {config.mode === 'celebration' && (
          <div className="kiosk-celebration-card">
            <div className="celebration-sparkles">✨</div>
            
            <div className="celebration-badge">
              <i className="fas fa-trophy"></i> {config.celebrationBadge || 'وسام التميز والتقدير'}
            </div>

            {config.celebrationImageUrl && (
              <div className="celebration-image-box">
                <img src={config.celebrationImageUrl} alt="المحتفى به" className="celebration-image" />
              </div>
            )}

            <h2 className="celebration-title">{config.celebrationTitle || config.title}</h2>
            <p className="celebration-text">{config.celebrationText || config.subtitle}</p>
          </div>
        )}

        {/* MODE 6: FULL ANNOUNCEMENT CARD */}
        {config.mode === 'announcement' && (
          <div className="kiosk-announcement-card">
            <div className="announcement-badge">
              <i className="fas fa-bullhorn"></i> إعلان مدرسي رسمي
            </div>
            <h2 className="announcement-title">{config.title}</h2>
            <p className="announcement-text">{config.subtitle}</p>
          </div>
        )}

      </main>

      {/* Bottom Floating Badges & Running News Ticker */}
      <footer className="kiosk-footer">
        
        {/* QR Code Overlay Badge */}
        {config.showQr && (
          <div className="kiosk-qr-badge" title="امسح الباركود لزيارة موقع المدرسة">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + window.location.pathname)}`} 
              alt="QR Code" 
              className="qr-img" 
            />
            <div className="qr-text">
              <span>امسح بالهاتف 📱</span>
              <strong>زيارة الموقع</strong>
            </div>
          </div>
        )}

        {/* Running News Ticker Bar */}
        {config.showTicker && config.tickerText && (
          <div className="kiosk-ticker-bar">
            <div className="ticker-label">
              <i className="fas fa-rss"></i> أخبار حية
            </div>
            <div className="ticker-track">
              <div className="ticker-content">
                {config.tickerText}
                {aiWisdom && ` • 💡 حكمة اليوم: ${aiWisdom.wisdom} • 🔬 معلومة اليوم العلمية: ${aiWisdom.fact}`}
                &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;
                {config.tickerText}
                {aiWisdom && ` • 💡 حكمة اليوم: ${aiWisdom.wisdom} • 🔬 معلومة اليوم العلمية: ${aiWisdom.fact}`}
              </div>
            </div>
          </div>
        )}

      </footer>

      {/* Floating Gear Button for Quick Studio Access */}
      <button
        type="button"
        onClick={() => setIsStudioOpen(true)}
        className="kiosk-floating-studio-btn"
        title="فتح استوديو التحكم بتصميم ومحتوى الشاشة"
        style={{
          position: 'fixed',
          bottom: '18px',
          left: '18px',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(10px)',
          border: '1.5px solid #38bdf8',
          color: '#38bdf8',
          padding: '8px 16px',
          borderRadius: '30px',
          fontWeight: 800,
          fontSize: '0.85rem',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease'
        }}
      >
        <i className="fas fa-sliders-h"></i> ⚙️ استوديو التحكم والتصميم
      </button>

    </div>
  );
};

export default KioskDisplayPage;
