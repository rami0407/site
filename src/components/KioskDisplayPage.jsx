import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { generateDailyWisdomAndFact } from '../utils/aiService';
import './KioskDisplayPage.css';

// Initial default presentation slides for each school channel
const createInitialSlides = (ch) => {
  if (ch === 'students') {
    return [
      {
        id: 'std_slide_1',
        type: 'split_video',
        title: '🚀 شاشة إبداع الطلاب والفعاليات المدرسية',
        subtitle: 'ركن المبتكرين، التحديات الأسبوعية، والأنشطة اللامنهجية ✨',
        badge: '🌟 ركن الإبداع',
        youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
        sideTitle: '⭐ نجم الأسبوع في STEM',
        sideText: 'نهنئ فرسان التحدي الأسبوعي والمخترعين الصغار في زاوية العلوم والابتكار!',
        sideImageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop',
        sideTheme: 'gold',
        duration: 25,
        enabled: true
      },
      {
        id: 'std_slide_2',
        type: 'celebration',
        title: 'تحية إكبار للمتفوقين والنجوم الصغار',
        subtitle: 'المثابرة والاجتهاد هما طريقكم نحو القمة والنجاح الباهر 🌟',
        badge: '🏆 وسام التميز والاجتهاد',
        imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
        duration: 20,
        enabled: true
      },
      {
        id: 'std_slide_3',
        type: 'slideshow',
        title: 'معرض إبداعات وابتكارات طلاب مشيرفة',
        subtitle: 'لقطات من ورشات الروبوتيكا والعلوم والفنون الإبداعية 🎨',
        badge: '📸 معرض الأنشطة',
        images: [
          'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop'
        ],
        duration: 20,
        enabled: true
      }
    ];
  }
  if (ch === 'teachers') {
    return [
      {
        id: 'tch_slide_1',
        type: 'announcement',
        title: '👨‍🏫 شاشة غرفة المعلمين والإدارة التربوية',
        subtitle: 'التعاميم الرسمية، جدول الفعاليات، ورسائل الإدارة 📚',
        badge: '📌 تعميم إداري',
        duration: 20,
        enabled: true
      },
      {
        id: 'tch_slide_2',
        type: 'split_video',
        title: 'اللقاءات المهنية وبرامج التطوير التربوي',
        subtitle: 'يرجى متابعة بوابة STEM وحزم أوراق العمل وتحديث السجلات دورياً.',
        badge: '📋 تذكير أسبوعي',
        youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
        sideTitle: '📌 تذكير إداري أسبوعي',
        sideText: 'يرجى استكمال تقارير المتابعة التربوية وتحديث بنك أوراق العمل على المنصة.',
        sideTheme: 'blue',
        duration: 25,
        enabled: true
      },
      {
        id: 'tch_slide_3',
        type: 'celebration',
        title: 'شكراً لصناع الأجيال وبناة المستقبل',
        subtitle: 'تثمن إدارة المدرسة جهود الهيئة التدريسية المخلصة في بناء جيل واعد 💐',
        badge: '💐 شكر وتقدير',
        imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop',
        duration: 20,
        enabled: true
      }
    ];
  }
  if (ch === 'parents') {
    return [
      {
        id: 'prn_slide_1',
        type: 'split_slideshow',
        title: '👨‍👩‍👧 شاشة الأهالي والزوار الكرام',
        subtitle: 'أهلاً وسهلاً بكم في مدرسة مشيرفة الابتدائية 🌟',
        badge: '🤝 شركاء النجاح',
        sideTitle: '👨‍👩‍👧 شركاء النجاح',
        sideText: 'أهلاً وسهلاً بأولياء الأمور الكرام. مشاركتكم واستطلاعاتكم تصنع الفارق.',
        sideImageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop',
        sideTheme: 'emerald',
        images: [
          'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop'
        ],
        duration: 25,
        enabled: true
      },
      {
        id: 'prn_slide_2',
        type: 'celebration',
        title: 'مرحباً بضيوف وأهالي مدرسة مشيرفة',
        subtitle: 'أهلاً بكم في صرح التميز والإبداع والقيادة التربوية. خدمات الاستقبال وحجز المواعيد متاحة دائماً.',
        badge: '🌟 ترحيب كريم',
        imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop',
        duration: 20,
        enabled: true
      }
    ];
  }
  // Default 'main'
  return [
    {
      id: 'main_slide_1',
      type: 'split_video',
      title: 'أهلاً وسهلاً بكم في مدرسة مشيرفة الابتدائية',
      subtitle: 'بوابة التميز، الإبداع، والقيادة التربوية 🌟',
      badge: '🏫 ترحيب مدرسي',
      youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
      sideTitle: '🌟 باقة تهنئة وتكريم',
      sideText: 'تبارك إدارة مدرسة مشيرفة لفرسان التميز والابتكار في فعاليات اليوم الدراسي.',
      sideImageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop',
      sideTheme: 'gold',
      duration: 30,
      enabled: true
    },
    {
      id: 'main_slide_2',
      type: 'celebration',
      title: 'مبارك لطلابنا المبدعين فرسان التميز!',
      subtitle: 'نفتخر بإنجازات طلابنا وطالباتنا في المسابقات العلمية والأنشطة اللامنهجية 🏆',
      badge: '🏆 وسام التميز والتفوق',
      imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
      duration: 20,
      enabled: true
    },
    {
      id: 'main_slide_3',
      type: 'slideshow',
      title: 'معرض صور الأنشطة والفعاليات المدرسية',
      subtitle: 'جولة مصورة بين أروقة الإبداع والمشاريع التعليمية الحديثة 📸',
      badge: '📸 معرض الصور',
      images: [
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop'
      ],
      duration: 25,
      enabled: true
    },
    {
      id: 'main_slide_4',
      type: 'announcement',
      title: 'مدرسة مشيرفة الابتدائية • صرح رائد نحو المستقبل',
      subtitle: 'نعمل برؤية تربوية متجددة تغرس الشغف العلمي، القيم الأصيلة، ومهارات القرن الحادي والعشرين.',
      badge: '📢 رسالة المدرسة',
      duration: 15,
      enabled: true
    }
  ];
};

const DEFAULT_CONFIGS = {
  main: {
    mode: 'playlist',
    title: 'أهلاً وسهلاً بكم في مدرسة مشيرفة الابتدائية',
    subtitle: 'بوابة التميز، الإبداع، والقيادة التربوية 🌟',
    slides: createInitialSlides('main'),
    tickerText: 'مرحباً بكم في البوابة الرقمية لمدرسة مشيرفة الابتدائية • نتمنى لطلابنا وأهالينا الكرام يوماً دراسياً ملؤه التميز والعطاء!',
    autoNewsTicker: true,
    showTicker: true,
    showClock: true,
    showQr: true,
    showLogo: true,
    theme: 'dark',
    slideInterval: 20
  },
  students: {
    mode: 'playlist',
    title: '🚀 شاشة إبداع الطلاب والفعاليات المدرسية',
    subtitle: 'ركن المبتكرين، التحديات الأسبوعية، والأنشطة اللامنهجية ✨',
    slides: createInitialSlides('students'),
    tickerText: 'طلابنا الأعزاء • شاركوا أفكاركم في زاوية "شارك أفكارك للعالم" وحلوا التحدي الأسبوعي للفوز بجوائز التميز!',
    autoNewsTicker: true,
    showTicker: true,
    showClock: true,
    showQr: true,
    showLogo: true,
    theme: 'gold',
    slideInterval: 20
  },
  teachers: {
    mode: 'playlist',
    title: '👨‍🏫 شاشة غرفة المعلمين والإدارة التربوية',
    subtitle: 'التعاميم الرسمية، جدول الفعاليات، ورسائل الإدارة 📚',
    slides: createInitialSlides('teachers'),
    tickerText: 'زملاءنا المعلمين والمعلمات • يرجى متابعة بوابة STEM وحزم أوراق العمل وتحديث السجلات العلمية دورياً.',
    autoNewsTicker: false,
    showTicker: true,
    showClock: true,
    showQr: false,
    showLogo: true,
    theme: 'blue',
    slideInterval: 20
  },
  parents: {
    mode: 'playlist',
    title: '👨‍👩‍👧 شاشة الأهالي والزوار الكرام',
    subtitle: 'أهلاً وسهلاً بكم في مدرسة مشيرفة الابتدائية 🌟',
    slides: createInitialSlides('parents'),
    tickerText: 'أولياء الأمور الكرام • يسعدنا استقبالكم والرد على استفساراتكم عبر حجز المواعيد وبوابة التواصل الرسمية.',
    autoNewsTicker: true,
    showTicker: true,
    showClock: true,
    showQr: true,
    showLogo: true,
    theme: 'dark',
    slideInterval: 20
  }
};

const CHANNEL_BADGES = {
  main: '🏫 الشاشة العامة',
  students: '🎓 شاشة الطلاب',
  teachers: '👨‍🏫 شاشة المعلمين',
  parents: '👨‍👩‍👧 شاشة الأهالي'
};

const ensureSlidesForConfig = (cfg, ch) => {
  if (cfg && Array.isArray(cfg.slides) && cfg.slides.length > 0) {
    return cfg.slides;
  }
  return createInitialSlides(ch);
};

const KioskDisplayPage = () => {
  const [isLauncherMode, setIsLauncherMode] = useState(false);
  const [channel, setChannel] = useState('main');
  const [config, setConfig] = useState(DEFAULT_CONFIGS.main);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
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

  // Materials & School Content Database Lists for Import
  const [availableNews, setAvailableNews] = useState([]);
  const [availableGallery, setAvailableGallery] = useState([]);
  const [availableDrawings, setAvailableDrawings] = useState([]);
  
  // Modals for picking / editing materials
  const [activePickerModal, setActivePickerModal] = useState(null); // 'news' | 'gallery' | 'drawings' | 'edit_slide'
  const [editingSlide, setEditingSlide] = useState(null);

  const channelBadges = CHANNEL_BADGES;

  // AI Wisdom and Fact
  useEffect(() => {
    let isMounted = true;
    generateDailyWisdomAndFact().then(res => {
      if (isMounted && res) setAiWisdom(res);
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Fetch school content (News, Gallery, Student Drawings) to allow user selection
  useEffect(() => {
    try {
      const qNews = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(20));
      onSnapshot(qNews, (snap) => {
        setAvailableNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, () => {
        getDocs(collection(db, 'news')).then(snap => {
          setAvailableNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }).catch(() => {});
      });
    } catch (e) {}

    try {
      getDocs(collection(db, 'gallery')).then(snap => {
        setAvailableGallery(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(() => {});
    } catch (e) {}

    try {
      getDocs(collection(db, 'prep_drawings')).then(snap => {
        setAvailableDrawings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(() => {});
    } catch (e) {}
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
            [ch]: { 
              ...DEFAULT_CONFIGS[ch], 
              ...parsed, 
              slides: ensureSlidesForConfig(parsed, ch)
            }
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
              [ch]: { 
                ...DEFAULT_CONFIGS[ch], 
                ...data, 
                slides: ensureSlidesForConfig(data, ch)
              }
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
      
      try {
        const localConf = localStorage.getItem(`db_kiosk_${ch}`);
        if (localConf) {
          const parsed = JSON.parse(localConf);
          setConfig({ ...defaultForChannel, ...parsed, slides: ensureSlidesForConfig(parsed, ch) });
          return;
        }
      } catch(e){}
      
      setConfig({ ...defaultForChannel, slides: ensureSlidesForConfig(defaultForChannel, ch) });
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
          const merged = { 
            ...defaultForChannel, 
            ...docSnap.data(),
            slides: ensureSlidesForConfig(docSnap.data(), channel)
          };
          setConfig(merged);
          try { localStorage.setItem(`db_kiosk_${channel}`, JSON.stringify(merged)); } catch(e){}
        } else {
          try {
            const localConf = localStorage.getItem(`db_kiosk_${channel}`);
            if (localConf) {
              const parsed = JSON.parse(localConf);
              setConfig({ ...defaultForChannel, ...parsed, slides: ensureSlidesForConfig(parsed, channel) });
            } else {
              setConfig({ ...defaultForChannel, slides: ensureSlidesForConfig(defaultForChannel, channel) });
            }
          } catch(e){
            setConfig({ ...defaultForChannel, slides: ensureSlidesForConfig(defaultForChannel, channel) });
          }
        }
      }, (err) => {
        console.warn(`Kiosk listener warning for channel ${channel}:`, err);
      });
    } catch (e) {}

    return () => unsubscribe();
  }, [channel, isLauncherMode]);

  // Real-time clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Automated presentation slide progression
  const activeSlides = (config.slides || []).filter(s => s.enabled !== false);
  
  useEffect(() => {
    if (isStudioOpen || isLauncherMode || isPaused) return;
    if (activeSlides.length <= 1) return;

    const currentSlide = activeSlides[currentSlideIndex % activeSlides.length];
    const durationSec = currentSlide?.duration || config.slideInterval || 20;

    const timer = setTimeout(() => {
      setCurrentSlideIndex(prev => (prev + 1) % activeSlides.length);
    }, durationSec * 1000);

    return () => clearTimeout(timer);
  }, [currentSlideIndex, activeSlides, isStudioOpen, isLauncherMode, isPaused, config.slideInterval]);

  // Gallery Sub-Photo Cycling (Internal photo rotator every 4.2s inside Split Photo Showcase)
  const [galleryPhotoIndex, setGalleryPhotoIndex] = useState(0);

  useEffect(() => {
    if (isStudioOpen || isLauncherMode || isPaused) return;
    const photoCycleTimer = setInterval(() => {
      setGalleryPhotoIndex(prev => prev + 1);
    }, 4200);
    return () => clearInterval(photoCycleTimer);
  }, [isStudioOpen, isLauncherMode, isPaused]);

  useEffect(() => {
    setGalleryPhotoIndex(0);
  }, [currentSlideIndex]);

  // Safe YouTube embed URL generator
  const getSafeYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    try {
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/watch')) {
        const params = new URLSearchParams(url.split('?')[1]);
        videoId = params.get('v') || '';
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1].split('?')[0];
      }
    } catch (e) {
      videoId = '';
    }
    if (!videoId) return '';
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

  // Helpers for Studio Slides Management
  const currentStudioConf = studioConfigs[studioChannel] || DEFAULT_CONFIGS[studioChannel] || DEFAULT_CONFIGS.main;
  const currentStudioSlides = ensureSlidesForConfig(currentStudioConf, studioChannel);

  const updateStudioSlides = (newSlides) => {
    setStudioConfigs(prev => ({
      ...prev,
      [studioChannel]: {
        ...prev[studioChannel],
        slides: newSlides
      }
    }));
  };

  const handleToggleSlide = (slideId) => {
    const updated = currentStudioSlides.map(s => s.id === slideId ? { ...s, enabled: s.enabled === false ? true : false } : s);
    updateStudioSlides(updated);
  };

  const handleDeleteSlide = (slideId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المادة من العرض؟')) return;
    const updated = currentStudioSlides.filter(s => s.id !== slideId);
    updateStudioSlides(updated);
  };

  const handleMoveSlide = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentStudioSlides.length) return;
    const newArr = [...currentStudioSlides];
    const [moved] = newArr.splice(index, 1);
    newArr.splice(targetIndex, 0, moved);
    updateStudioSlides(newArr);
  };

  const handleUpdateSlideDuration = (slideId, duration) => {
    const updated = currentStudioSlides.map(s => s.id === slideId ? { ...s, duration: Number(duration) } : s);
    updateStudioSlides(updated);
  };

  // Import school news as presentation material
  const handleImportNewsSlide = (newsItem) => {
    const newSlide = {
      id: `slide_news_${Date.now()}`,
      type: 'news',
      title: newsItem.title || 'خبر مدرسي مميز',
      subtitle: newsItem.desc || newsItem.content || newsItem.summary || 'فعاليات مدرسة مشيرفة الابتدائية',
      badge: '📰 خبر مدرسي مميز',
      imageUrl: newsItem.imageUrl || newsItem.image || '',
      date: newsItem.date || new Date().toISOString().split('T')[0],
      duration: 20,
      enabled: true
    };
    updateStudioSlides([newSlide, ...currentStudioSlides]);
    setActivePickerModal(null);
  };

  // Import school gallery photo
  const handleImportGallerySlide = (galItem) => {
    const newSlide = {
      id: `slide_gal_${Date.now()}`,
      type: 'custom',
      title: galItem.title || 'لقطة من الفعاليات المدرسية',
      subtitle: 'مدرسة مشيرفة الابتدائية • لحظات الإبداع والعطاء',
      badge: '📸 معرض الصور',
      imageUrl: galItem.imageUrl || (galItem.images && galItem.images[0]) || '',
      duration: 20,
      enabled: true
    };
    updateStudioSlides([newSlide, ...currentStudioSlides]);
    setActivePickerModal(null);
  };

  // Import student drawing / STEM creation
  const handleImportDrawingSlide = (drawItem) => {
    const newSlide = {
      id: `slide_draw_${Date.now()}`,
      type: 'celebration',
      title: `إبداع الطالب/ـة: ${drawItem.studentName || 'مبدع مشيرفة'}`,
      subtitle: `${drawItem.grade || 'مدرسة مشيرفة'} • ${drawItem.caption || 'لوحة فنية متميزة في فعاليات المدرسة'}`,
      badge: '🎨 إبداعات الطلاب الموهوبين',
      imageUrl: drawItem.imageUrl || '',
      duration: 20,
      enabled: true
    };
    updateStudioSlides([newSlide, ...currentStudioSlides]);
    setActivePickerModal(null);
  };

  // Pure Client-side High-Efficiency Image Compressor (~25KB per image, perfectly crisp for TV, zero CORS)
  const compressBase64Image = (dataUrlOrFile, maxDim = 850, quality = 0.55) => {
    return new Promise((resolve) => {
      if (!dataUrlOrFile) return resolve('');
      if (typeof dataUrlOrFile === 'string' && (dataUrlOrFile.startsWith('http://') || dataUrlOrFile.startsWith('https://'))) {
        return resolve(dataUrlOrFile);
      }

      const processSrc = (src) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
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
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(src);
        img.src = src;
      };

      if (typeof dataUrlOrFile === 'string') {
        processSrc(dataUrlOrFile);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => processSrc(e.target.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(dataUrlOrFile);
      }
    });
  };

  // Direct Multi-Image Upload & Instant Slide Generation
  const handleDirectMultiImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      alert('يرجى اختيار ملفات صور صالحة (JPG, PNG, WebP)');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg('⏳ جاري ضغط ومعالجة الصور للشاشة...');

    try {
      const newSlides = [];
      for (let idx = 0; idx < fileList.length; idx++) {
        const file = fileList[idx];
        const compressed = await compressBase64Image(file, 850, 0.55);
        if (!compressed) continue;

        const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        newSlides.push({
          id: `slide_img_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'split_photos',
          title: fileNameClean || 'إبداع',
          subtitle: 'مدرسة مشيرفة الابتدائية • لحظات الإبداع والتميز والأنشطة المدرسية الهادفة',
          badge: '',
          imageUrl: compressed,
          sideTitle: fileNameClean || 'إبداع',
          sideText: 'توثيق حي ومصور لأبرز الأنشطة التعليمية والإبداعية ومشاركات فرسان التميز في مدرستنا.',
          sideTheme: 'emerald',
          duration: 15,
          enabled: true
        });
      }

      if (newSlides.length === 0) {
        alert('لم يتم تحميل أي صورة بنجاح. يرجى المحاولة مرة أخرى.');
        return;
      }

      // Add a Master Album slide at the beginning
      let combinedSlides = [...newSlides];
      if (newSlides.length > 1) {
        const albumSlide = {
          id: `slide_album_split_${Date.now()}`,
          type: 'split_photos',
          title: 'معرض صور الفعاليات المدرسية',
          subtitle: `ألبوم تفاعلي مميز يضم (${newSlides.length}) صور توثق فعاليات وإبداعات طلاب مدرسة مشيرفة الابتدائية.`,
          badge: '',
          sideTitle: 'أجمل اللحظات والإنجازات',
          sideText: 'توثيق حي ومصور لأبرز المحطات والأنشطة الإبداعية ومشاركات فرسان التميز والريادة.',
          imageUrl: newSlides[0].imageUrl,
          duration: Math.max(25, newSlides.length * 5),
          sideTheme: 'emerald',
          enabled: true
        };
        combinedSlides = [albumSlide, ...newSlides];
      }

      updateStudioSlides([...combinedSlides, ...currentStudioSlides]);
      alert(`🎉 تم بنجاح رفع وضغط ${newSlides.length} صورة بحجم خفيف جداً ومثالي للشاشة وقاعدة البيانات!\n\n✨ الميزات المفعلة:\n1. الشاشة مقسمة: الصور على جهة والنصوص والمعلومات على جهة أخرى.\n2. الصور تتبدل تلقائياً كل 4 ثوانٍ مع عداد الصور وأزرار تنقل.\n3. تم حل قيود الحجم لتستوعب الشاشة عشرات الصور بكل سهولة.\n\nاضغط "حفظ ونشر التغييرات" لنشرها فوراً على الشاشة.`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء معالجة الصور: ' + err.message);
    } finally {
      setIsSaving(false);
      setSaveSuccessMsg('');
    }
  };

  // Open Edit Modal for a Slide
  const handleStartEditSlide = (slide) => {
    setEditingSlide({ ...slide });
    setActivePickerModal('edit_slide');
  };

  // Open Create New Slide Modal
  const handleStartCreateSlide = () => {
    setEditingSlide({
      id: `slide_custom_${Date.now()}`,
      type: 'announcement',
      title: 'عنوان المادة الجديدة',
      subtitle: 'تفاصيل ومضمون المادة المعروضة...',
      badge: '📢 إعلان مدرسي',
      imageUrl: '',
      youtubeUrl: '',
      duration: 20,
      enabled: true
    });
    setActivePickerModal('edit_slide');
  };

  // Save the slide being edited
  const handleSaveSlideChanges = (e) => {
    e.preventDefault();
    if (!editingSlide) return;
    const exists = currentStudioSlides.some(s => s.id === editingSlide.id);
    let updated;
    if (exists) {
      updated = currentStudioSlides.map(s => s.id === editingSlide.id ? editingSlide : s);
    } else {
      updated = [editingSlide, ...currentStudioSlides];
    }
    updateStudioSlides(updated);
    setActivePickerModal(null);
    setEditingSlide(null);
  };

  // Upload single image with browser compression
  const handleUploadImage = async (file, callback) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 15 ميغابايت');
      return;
    }
    try {
      const comp = await compressBase64Image(file, 850, 0.55);
      if (comp) callback(comp);
    } catch (e) {
      console.error(e);
    }
  };

  // Save full configuration to Firestore and LocalStorage
  const handleSaveStudioConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('⏳ جاري فحص وضغط المواد ونشرها على الشاشات...');
    const ch = studioChannel;
    const currentConf = studioConfigs[ch] || DEFAULT_CONFIGS[ch];

    try {
      // 1. Sanitize slides & aggressively compress any heavy images
      const sanitizedSlides = [];
      for (const slide of currentStudioSlides) {
        let sCopy = { ...slide };

        // Remove redundant duplicate images array from individual slides
        if (sCopy.type !== 'split_photos' && sCopy.type !== 'slideshow' && sCopy.type !== 'split_slideshow') {
          delete sCopy.images;
        }

        // Compress imageUrl if it's base64
        if (sCopy.imageUrl && sCopy.imageUrl.startsWith('data:image/')) {
          sCopy.imageUrl = await compressBase64Image(sCopy.imageUrl, 850, 0.55);
        }

        // Compress images array items if present
        if (Array.isArray(sCopy.images) && sCopy.images.length > 0) {
          const cleanImages = [];
          for (const imgItem of sCopy.images) {
            if (imgItem && imgItem.startsWith('data:image/')) {
              const comp = await compressBase64Image(imgItem, 750, 0.50);
              cleanImages.push(comp);
            } else if (imgItem) {
              cleanImages.push(imgItem);
            }
          }
          sCopy.images = cleanImages.slice(0, 8); // keep at most 8 images in array
        }

        sanitizedSlides.push(sCopy);
      }

      let payload = {
        ...currentConf,
        slides: sanitizedSlides,
        updatedAt: new Date().toISOString()
      };

      // Measure payload size in bytes
      let payloadBytes = new Blob([JSON.stringify(payload)]).size;

      // If payload is still > 750KB, strip redundant images arrays (kiosk dynamically aggregates photos)
      if (payloadBytes > 750000) {
        console.warn(`Payload size (${payloadBytes} bytes) high, optimizing further...`);
        payload.slides = payload.slides.map(s => {
          const { images, ...rest } = s;
          return rest;
        });
        payloadBytes = new Blob([JSON.stringify(payload)]).size;
      }

      // If still > 750KB, keep the most recent 25 slides
      if (payloadBytes > 750000) {
        payload.slides = payload.slides.slice(0, 25);
      }

      await setDoc(doc(db, 'displayBoard', ch), payload);
      if (ch === 'main') {
        await setDoc(doc(db, 'displayBoard', 'config'), payload);
      }
      localStorage.setItem(`db_kiosk_${ch}`, JSON.stringify(payload));

      // Update studio state with sanitized slides
      updateStudioSlides(payload.slides);

      if (channel === ch) {
        setConfig(payload);
        setCurrentSlideIndex(0);
      }

      setSaveSuccessMsg(`🎉 تم بنجاح حفظ وتحديث مواد شاشة (${channelBadges[ch] || ch})! التغييرات منشورة فوراً على شاشات المدرسة.`);
      setTimeout(() => setSaveSuccessMsg(''), 6000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ المواد: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ==================== KIOSK STUDIO / CONTENT & MATERIALS CONTROL ====================
  if (isStudioOpen) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* Studio Top Navigation Bar */}
        <header style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '24px',
          padding: '1.25rem 2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 12px 35px rgba(0,0,0,0.5)'
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
                <span style={{ background: '#0284c7', color: '#fff', padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
                  KIOSK STUDIO
                </span>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#fff' }}>
                  📺 استوديو اختيار المواد والتحكم بمضمون شاشات العرض
                </h1>
              </div>
              <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>
                اختر بدقة المواد، الفيديوهات، الأخبار، الإعلانات، وتكريمات الطلاب المعروضة على شاشات المدرسة
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
                  navigator.clipboard.writeText(link).then(() => alert(`📋 تم نسخ رابط بث شاشة (${channelBadges[studioChannel]}):\n${link}`));
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
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span style={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.92rem' }}>
            اختر الشاشة المراد تحديد موادها:
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
            padding: '1.1rem 1.5rem',
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

        {/* MATERIALS TOOLBAR: QUICK IMPORT BUTTONS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
          borderRadius: '24px',
          border: '1.5px solid #38bdf8',
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 30px rgba(56, 189, 248, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-folder-plus"></i> إضافة واختيار مواد جديدة للشاشة:
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                انقر على أي مصدر لاختيار مواد جاهزة من موقع المدرسة أو كتابة إعلان مخصص:
              </p>
            </div>
            <span style={{ background: '#0369a1', color: '#fff', padding: '0.35rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800 }}>
              قائمة البث الحالية: {currentStudioSlides.length} مواد ({currentStudioSlides.filter(s => s.enabled !== false).length} مفعّلة للبث)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* DIRECT PHOTO UPLOAD BUTTON */}
            <label style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: '2px solid #34d399',
              padding: '0.75rem 1.6rem',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(16,185,129,0.4)',
              transition: 'all 0.2s ease'
            }}>
              <i className="fas fa-camera"></i> 📸 رفع صور من جهازي وعرضها في الشاشة
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                style={{ display: 'none' }}
                onChange={(e) => handleDirectMultiImageUpload(e.target.files)} 
              />
            </label>

            <button
              type="button"
              onClick={handleStartCreateSlide}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)'
              }}
            >
              <i className="fas fa-plus-circle"></i> ➕ إضافة إعلان مخصص
            </button>

            <button
              type="button"
              onClick={() => setActivePickerModal('news')}
              style={{
                background: '#1e293b',
                color: '#f59e0b',
                border: '1.5px solid #f59e0b',
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-newspaper"></i> 📰 اختيار من أخبار المدرسة ({availableNews.length})
            </button>

            <button
              type="button"
              onClick={() => setActivePickerModal('gallery')}
              style={{
                background: '#1e293b',
                color: '#10b981',
                border: '1.5px solid #10b981',
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-images"></i> 🖼️ اختيار من معرض صور المدرسة ({availableGallery.length})
            </button>

            <button
              type="button"
              onClick={() => setActivePickerModal('drawings')}
              style={{
                background: '#1e293b',
                color: '#ec4899',
                border: '1.5px solid #ec4899',
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-palette"></i> 🎨 إبداعات ورسومات الطلاب ({availableDrawings.length})
            </button>
          </div>
        </div>

        {/* PROMINENT DRAG & DROP PHOTO UPLOAD ZONE */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)',
          border: '2.5px dashed #10b981',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          marginBottom: '2.5rem',
          position: 'relative',
          cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.12)',
          transition: 'all 0.2s ease'
        }}>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: 'pointer',
              width: '100%',
              height: '100%',
              zIndex: 10
            }}
            onChange={(e) => handleDirectMultiImageUpload(e.target.files)} 
          />
          <div style={{ pointerEvents: 'none' }}>
            <div style={{
              width: '75px',
              height: '75px',
              background: 'rgba(16, 185, 129, 0.25)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: '#34d399',
              fontSize: '2.2rem'
            }}>
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
            <h3 style={{ margin: 0, color: '#34d399', fontSize: '1.4rem', fontWeight: 900 }}>
              📸 اضغط هنا أو اسحب صوراً من جهازك لعرضها فوراً على الشاشة
            </h3>
            <p style={{ margin: '0.6rem 0 0 0', color: '#e2e8f0', fontSize: '1rem' }}>
              يمكنك تحديد صورة واحدة أو عشرات الصور معاً من هاتفك أو حاسوبك • ستُدرج تلقائياً في قائمة العرض بملء الشاشة
            </p>
          </div>
        </div>

        {/* ACTIVE PRESENTATION PLAYLIST: EDITABLE CARDS */}
        <section style={{
          background: '#1e293b',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '2rem',
          marginBottom: '2.5rem',
          boxShadow: '0 15px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span style={{ background: '#10b981', color: '#fff', padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                PLAYLIST ITEMS
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', margin: '0.35rem 0 0 0' }}>
                🗂️ المواد المعروضة حالياً على شاشة ({channelBadges[studioChannel]}):
              </h2>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
              تتوالى هذه المواد تلقائياً على الشاشة بحسب الترتيب والمدة المحددة لكل مادة ⏱️
            </p>
          </div>

          {currentStudioSlides.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(15,23,42,0.5)', borderRadius: '16px', border: '1px dashed #475569' }}>
              <i className="fas fa-folder-open" style={{ fontSize: '3rem', color: '#64748b', marginBottom: '1rem' }}></i>
              <h3 style={{ margin: 0, color: '#cbd5e1' }}>لا توجد مواد مضافة في هذه الشاشة بعد</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                استخدم الأزرار بالأعلى لاختيار أخبار، صور، أو إضافة إعلانات مخصصة.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {currentStudioSlides.map((slide, index) => {
                const isEnabled = slide.enabled !== false;
                return (
                  <div 
                    key={slide.id || index}
                    style={{
                      background: isEnabled ? 'rgba(15, 23, 42, 0.75)' : 'rgba(15, 23, 42, 0.35)',
                      border: isEnabled ? '1.5px solid rgba(56, 189, 248, 0.4)' : '1px dashed rgba(255,255,255,0.15)',
                      borderRadius: '18px',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1.25rem',
                      opacity: isEnabled ? 1 : 0.65,
                      transition: 'all 0.2s ease',
                      boxShadow: isEnabled ? '0 6px 20px rgba(0,0,0,0.25)' : 'none'
                    }}
                  >
                    {/* Left: Index & Thumbnail & Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: '1 1 350px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isEnabled ? '#0284c7' : '#475569',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.95rem'
                      }}>
                        {index + 1}
                      </div>

                      {/* Thumbnail */}
                      <div style={{ width: '80px', height: '60px', borderRadius: '10px', overflow: 'hidden', background: '#000', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
                        {slide.imageUrl ? (
                          <img src={slide.imageUrl} alt="صورة" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : slide.sideImageUrl ? (
                          <img src={slide.sideImageUrl} alt="صورة" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : slide.images && slide.images[0] ? (
                          <img src={slide.images[0]} alt="صور" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : slide.youtubeUrl ? (
                          <i className="fas fa-play" style={{ color: '#ef4444', fontSize: '1.5rem' }}></i>
                        ) : (
                          <i className="fas fa-file-alt" style={{ color: '#38bdf8', fontSize: '1.5rem' }}></i>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            background: slide.type === 'split_video' || slide.type === 'video' ? '#ef4444' : slide.type === 'news' ? '#f59e0b' : slide.type === 'celebration' ? '#8b5cf6' : '#10b981',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 800
                          }}>
                            {slide.type === 'split_video' ? '🎬 فيديو + بطاقة' : slide.type === 'video' ? '🔴 فيديو كامل' : slide.type === 'news' ? '📰 خبر مدرسي' : slide.type === 'celebration' ? '🏆 تكريم واحتفال' : slide.type === 'slideshow' ? '📸 معرض صور' : '📢 إعلان مدرسي'}
                          </span>
                          <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700 }}>
                            {slide.badge || ''}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc' }}>
                          {slide.title}
                        </h4>
                        <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.82rem', maxHeight: '36px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {slide.subtitle || slide.sideText || ''}
                        </p>
                      </div>
                    </div>

                    {/* Right: Controls & Duration */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                      {/* Duration selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f172a', padding: '4px 10px', borderRadius: '10px', border: '1px solid #334155' }}>
                        <i className="fas fa-stopwatch" style={{ color: '#f59e0b', fontSize: '0.85rem' }}></i>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>المدة:</span>
                        <select
                          value={slide.duration || 20}
                          onChange={(e) => handleUpdateSlideDuration(slide.id, e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          <option value={10}>10 ثوانٍ</option>
                          <option value={15}>15 ثانية</option>
                          <option value={20}>20 ثانية</option>
                          <option value={25}>25 ثانية</option>
                          <option value={30}>30 ثانية</option>
                          <option value={45}>45 ثانية</option>
                          <option value={60}>دقيقة كاملة</option>
                        </select>
                      </div>

                      {/* Enable / Disable toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleSlide(slide.id)}
                        style={{
                          background: isEnabled ? '#065f46' : '#334155',
                          color: isEnabled ? '#34d399' : '#94a3b8',
                          border: isEnabled ? '1px solid #10b981' : '1px solid #475569',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className={isEnabled ? "fas fa-check" : "fas fa-pause"}></i>
                        {isEnabled ? 'مفعل في البث' : 'معطل مؤقتاً'}
                      </button>

                      {/* Order Up / Down */}
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveSlide(index, 'up')}
                          style={{
                            background: '#0f172a',
                            color: index === 0 ? '#475569' : '#38bdf8',
                            border: '1px solid #334155',
                            padding: '6px 9px',
                            borderRadius: '8px 0 0 8px',
                            cursor: index === 0 ? 'not-allowed' : 'pointer'
                          }}
                          title="تقديم المادة في الترتيب"
                        >
                          <i className="fas fa-arrow-up"></i>
                        </button>
                        <button
                          type="button"
                          disabled={index === currentStudioSlides.length - 1}
                          onClick={() => handleMoveSlide(index, 'down')}
                          style={{
                            background: '#0f172a',
                            color: index === currentStudioSlides.length - 1 ? '#475569' : '#38bdf8',
                            border: '1px solid #334155',
                            padding: '6px 9px',
                            borderRadius: '0 8px 8px 0',
                            cursor: index === currentStudioSlides.length - 1 ? 'not-allowed' : 'pointer'
                          }}
                          title="تأخير المادة في الترتيب"
                        >
                          <i className="fas fa-arrow-down"></i>
                        </button>
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEditSlide(slide)}
                        style={{
                          background: '#1e3a8a',
                          color: '#60a5fa',
                          border: '1px solid #3b82f6',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                        title="تعديل تفاصيل المادة"
                      >
                        <i className="fas fa-edit"></i> تعديل
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        title="حذف المادة من القائمة"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* GENERAL SCREEN OPTIONS: TICKER, CLOCK, QR */}
        <section style={{
          background: '#1e293b',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '2rem',
          marginBottom: '2.5rem',
          boxShadow: '0 15px 40px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8', marginBottom: '1.25rem' }}>
            📢 إعدادات الشريط الإخباري وعناصر الشاشة:
          </h2>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              نص الشريط الإخباري المتحرك أسفل الشاشة:
            </label>
            <textarea 
              rows="2" 
              value={currentStudioConf.tickerText || ''} 
              onChange={(e) => setStudioConfigs({
                ...studioConfigs,
                [studioChannel]: { ...currentStudioConf, tickerText: e.target.value }
              })} 
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '0.85rem', color: '#fff', fontSize: '0.95rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 800, color: '#38bdf8' }}>
              <input 
                type="checkbox" 
                checked={currentStudioConf.autoNewsTicker ?? true} 
                onChange={(e) => setStudioConfigs({
                  ...studioConfigs,
                  [studioChannel]: { ...currentStudioConf, autoNewsTicker: e.target.checked }
                })} 
              />
              تغذية الشريط بأحدث أخبار المدرسة المنشورة تلقائياً 📰
            </label>

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
              إظهار باركود QR لموقع المدرسة
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
        </section>

        {/* SAVE & PUBLISH ACTION BAR */}
        <div style={{
          position: 'sticky',
          bottom: '20px',
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid #38bdf8',
          borderRadius: '24px',
          padding: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 15px 40px rgba(0,0,0,0.7)',
          zIndex: 100
        }}>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1rem', color: '#fff' }}>
              جاهز لنشر التغييرات على شاشة ({channelBadges[studioChannel]})؟
            </strong>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              يتم الحفظ السحابي فوراً ويظهر على تلفزيونات المدرسة في الوقت الفعلي
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveStudioConfig}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.95rem 2.4rem',
                borderRadius: '16px',
                fontWeight: 900,
                fontSize: '1.1rem',
                cursor: isSaving ? 'wait' : 'pointer',
                boxShadow: '0 8px 25px rgba(2, 132, 199, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <i className={isSaving ? "fas fa-spinner fa-spin" : "fas fa-save"}></i>
              {isSaving ? 'جارٍ الحفظ والنشر...' : `💾 حفظ ونشر المواد على الشاشة فوراً`}
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
                padding: '0.95rem 1.8rem',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-eye"></i> معاينة مباشرة
            </button>
          </div>
        </div>

        {/* MODAL 1: PICK FROM SCHOOL NEWS */}
        {activePickerModal === 'news' && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div style={{ background: '#1e293b', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', border: '1.5px solid #f59e0b', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#f59e0b', fontWeight: 900 }}>
                    📰 اختيار خبر من أخبار المدرسة المنشورة لإضافته للشاشة
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    انقر على أي خبر لإدراجه تلقائياً كشريحة عرض متميزة بصورته وعنوانه
                  </p>
                </div>
                <button type="button" onClick={() => setActivePickerModal(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
              </div>

              {availableNews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>لا توجد أخبار منشورة بعد في الموقع.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {availableNews.map((newsItem) => (
                    <div 
                      key={newsItem.id}
                      style={{
                        background: '#0f172a',
                        borderRadius: '16px',
                        border: '1px solid #334155',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ height: '140px', background: '#000', overflow: 'hidden' }}>
                        {newsItem.imageUrl || newsItem.image ? (
                          <img src={newsItem.imageUrl || newsItem.image} alt={newsItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <i className="fas fa-newspaper" style={{ fontSize: '2rem' }}></i>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <small style={{ color: '#f59e0b', fontWeight: 700 }}>{newsItem.date || 'خبر مدرسي'}</small>
                          <h4 style={{ margin: '0.3rem 0', fontSize: '0.95rem', color: '#fff', lineHeight: 1.4 }}>{newsItem.title}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleImportNewsSlide(newsItem)}
                          style={{
                            background: '#f59e0b',
                            color: '#000',
                            border: 'none',
                            padding: '0.55rem',
                            borderRadius: '10px',
                            fontWeight: 900,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            marginTop: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className="fas fa-plus"></i> إضافة هذا الخبر للشاشة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 2: PICK FROM GALLERY */}
        {activePickerModal === 'gallery' && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div style={{ background: '#1e293b', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', border: '1.5px solid #10b981', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#10b981', fontWeight: 900 }}>
                    🖼️ اختيار من معرض صور المدرسة
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    اختر صورة مميزة من أرشيف الفعاليات لإدراجها في شاشة العرض
                  </p>
                </div>
                <button type="button" onClick={() => setActivePickerModal(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
              </div>

              {availableGallery.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>لا توجد صور في المعرض بعد.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {availableGallery.map((galItem) => (
                    <div 
                      key={galItem.id}
                      style={{
                        background: '#0f172a',
                        borderRadius: '16px',
                        border: '1px solid #334155',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ height: '140px', background: '#000', overflow: 'hidden' }}>
                        <img src={galItem.imageUrl || (galItem.images && galItem.images[0])} alt={galItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '0.85rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#fff' }}>{galItem.title}</h4>
                        <button
                          type="button"
                          onClick={() => handleImportGallerySlide(galItem)}
                          style={{
                            width: '100%',
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fas fa-plus"></i> إضافة هذه الصورة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 3: PICK FROM STUDENT DRAWINGS */}
        {activePickerModal === 'drawings' && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div style={{ background: '#1e293b', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', border: '1.5px solid #ec4899', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#ec4899', fontWeight: 900 }}>
                    🎨 اختيار من إبداعات ورسومات الطلاب
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    اعرض مشاركات ورسومات الطلاب على شاشة المدرسة تشجيعاً لمواهبهم
                  </p>
                </div>
                <button type="button" onClick={() => setActivePickerModal(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
              </div>

              {availableDrawings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>لا توجد رسومات مسجلة بعد.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {availableDrawings.map((draw) => (
                    <div 
                      key={draw.id}
                      style={{
                        background: '#0f172a',
                        borderRadius: '16px',
                        border: '1px solid #334155',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ height: '140px', background: '#000', overflow: 'hidden' }}>
                        <img src={draw.imageUrl} alt={draw.studentName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '0.85rem' }}>
                        <strong style={{ color: '#ec4899', display: 'block', fontSize: '0.9rem' }}>{draw.studentName}</strong>
                        <small style={{ color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>{draw.grade || 'مدرسة مشيرفة'}</small>
                        <button
                          type="button"
                          onClick={() => handleImportDrawingSlide(draw)}
                          style={{
                            width: '100%',
                            background: '#ec4899',
                            color: '#fff',
                            border: 'none',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fas fa-plus"></i> عرض لوحة الطالب
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 4: EDIT OR CREATE SLIDE FORM */}
        {activePickerModal === 'edit_slide' && editingSlide && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div style={{ background: '#1e293b', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', border: '1.5px solid #38bdf8', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#38bdf8', fontWeight: 900 }}>
                  ✏️ تخصيص وتعديل المادة المعروضة
                </h3>
                <button type="button" onClick={() => setActivePickerModal(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleSaveSlideChanges}>
                {/* Type */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    نوع وتصميم المادة:
                  </label>
                  <select
                    value={editingSlide.type || 'split_photos'}
                    onChange={(e) => setEditingSlide({ ...editingSlide, type: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                  >
                    <option value="split_photos">📸 شاشة مقسمة تفاعلية (معرض صور متبدلة + نص وتفاصيل على الجانب)</option>
                    <option value="photo">🖼️ صورة مع لوحة نصوص وشارة على الجانب</option>
                    <option value="announcement">📢 إعلان مدرسي رسمي (نص عريض وشارة)</option>
                    <option value="split_video">🎬 شاشة منقسمة (فيديو يوتيوب + لوحة جانبية)</option>
                    <option value="video">🔴 فيديو يوتيوب كامل (Full Video)</option>
                    <option value="news">📰 كرت خبر مدرسي مع صورة وتفاصيل</option>
                    <option value="celebration">🏆 بطاقة تكريم ووسام تفوق واحتفال</option>
                    <option value="slideshow">📸 معرض صور متبدلة (سلايدشو)</option>
                  </select>
                </div>

                {/* Badge */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    شارة المادة (Badge):
                  </label>
                  <input
                    type="text"
                    value={editingSlide.badge || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                    placeholder="مثال: 🏆 وسام التميز / 📢 إعلان عاجل / 🌟 نجم الأسبوع"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                  />
                </div>

                {/* Title */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    العنوان الرئيسي *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSlide.title || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                  />
                </div>

                {/* Subtitle / Text */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    المضمون / النص الكامل:
                  </label>
                  <textarea
                    rows="3"
                    value={editingSlide.subtitle || editingSlide.sideText || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value, sideText: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                  />
                </div>

                {/* Image upload / URL */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    صورة المادة (رفع من جهازك أو رابط):
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImage(e.target.files[0], (dataUrl) => setEditingSlide({ ...editingSlide, imageUrl: dataUrl, sideImageUrl: dataUrl }))}
                      style={{ color: '#94a3b8', fontSize: '0.85rem' }}
                    />
                    {(editingSlide.imageUrl || editingSlide.sideImageUrl) && (
                      <button
                        type="button"
                        onClick={() => setEditingSlide({ ...editingSlide, imageUrl: '', sideImageUrl: '' })}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        إزالة الصورة
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    dir="ltr"
                    value={editingSlide.imageUrl || editingSlide.sideImageUrl || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, imageUrl: e.target.value, sideImageUrl: e.target.value })}
                    placeholder="https://... رابط الصورة المباشر"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.65rem', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>

                {/* Video URL */}
                {(editingSlide.type === 'split_video' || editingSlide.type === 'video') && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', color: '#ef4444', marginBottom: '0.4rem' }}>
                      رابط فيديو يوتيوب:
                    </label>
                    <input
                      type="url"
                      dir="ltr"
                      value={editingSlide.youtubeUrl || ''}
                      onChange={(e) => setEditingSlide({ ...editingSlide, youtubeUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=... أو https://youtu.be/..."
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                    />
                  </div>
                )}

                {/* Duration */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    مدة بقاء هذه المادة على الشاشة:
                  </label>
                  <select
                    value={editingSlide.duration || 20}
                    onChange={(e) => setEditingSlide({ ...editingSlide, duration: Number(e.target.value) })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontSize: '0.95rem' }}
                  >
                    <option value={10}>10 ثوانٍ</option>
                    <option value={15}>15 ثانية</option>
                    <option value={20}>20 ثانية</option>
                    <option value={25}>25 ثانية</option>
                    <option value={30}>30 ثانية</option>
                    <option value={45}>45 ثانية</option>
                    <option value={60}>دقيقة كاملة</option>
                  </select>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setActivePickerModal(null)}
                    style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '0.75rem 1.4rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem 1.8rem', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}
                  >
                    حفظ المادة في القائمة ✓
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

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
            <i className="fas fa-sliders-h"></i> ⚙️ استوديو اختيار وتصميم مواد الشاشة
          </button>
        </div>
      </div>
    );
  }

  // ==================== KIOSK ACTIVE DISPLAY PRESENTATION ====================
  const activeSlideList = activeSlides.length > 0 ? activeSlides : (config.slides || createInitialSlides(channel));
  const currentSlide = activeSlideList[currentSlideIndex % activeSlideList.length] || activeSlideList[0];

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
            title="فتح استوديو التحكم باختيار وتصميم المواد"
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
            <i className="fas fa-sliders-h"></i> ⚙️ استوديو اختيار المواد
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
        
        {/* PRESENTATION PROGRESS & CONTROLLER BAR */}
        {activeSlideList.length > 1 && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '20px',
            left: '20px',
            zIndex: 30,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(10px)',
            padding: '6px 16px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
                {currentSlideIndex + 1} / {activeSlideList.length}
              </span>
              <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 700, maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentSlide.badge ? `[${currentSlide.badge}] ` : ''}{currentSlide.title}
              </span>
            </div>

            {/* Slide Navigation Dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setCurrentSlideIndex(prev => (prev - 1 + activeSlideList.length) % activeSlideList.length)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 6px' }}
                title="المادة السابقة"
              >
                <i className="fas fa-chevron-right"></i>
              </button>

              {activeSlideList.map((s, idx) => (
                <button
                  key={s.id || idx}
                  type="button"
                  onClick={() => setCurrentSlideIndex(idx)}
                  style={{
                    width: idx === (currentSlideIndex % activeSlideList.length) ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: idx === (currentSlideIndex % activeSlideList.length) ? '#38bdf8' : 'rgba(255,255,255,0.3)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: 0
                  }}
                  title={s.title}
                />
              ))}

              <button
                type="button"
                onClick={() => setCurrentSlideIndex(prev => (prev + 1) % activeSlideList.length)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 6px' }}
                title="المادة التالية"
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: isPaused ? '#f59e0b' : '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', marginRight: '6px' }}
                title={isPaused ? 'استئناف التبديل التلقائي' : 'إيقاف مؤقت على هذه المادة'}
              >
                <i className={isPaused ? "fas fa-play" : "fas fa-pause"}></i>
                {isPaused ? ' متابعة' : ' تثبيت'}
              </button>
            </div>
          </div>
        )}

        {/* 1. SPLIT VIDEO & SIDE WIDGET */}
        {currentSlide.type === 'split_video' && (
          <div className="kiosk-split-layout">
            <div className="kiosk-split-main">
              {currentSlide.youtubeUrl ? (
                <iframe
                  src={getSafeYoutubeEmbedUrl(currentSlide.youtubeUrl)}
                  title="YouTube Live Video"
                  className="kiosk-iframe-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="kiosk-video-placeholder">
                  <i className="fas fa-play-circle"></i>
                  <span>بث فيديو مدرسة مشيرفة الابتدائية</span>
                </div>
              )}
            </div>
            <div className="kiosk-split-side">
              <div className={`kiosk-side-card theme-${currentSlide.sideTheme || 'gold'}`}>
                <div>
                  <div className="side-badge">
                    <i className="fas fa-award"></i> {currentSlide.badge || 'تهنئة وتكريم'}
                  </div>
                  <h2 className="side-title">{currentSlide.sideTitle || currentSlide.title}</h2>
                  <p className="side-text">{currentSlide.sideText || currentSlide.subtitle}</p>
                </div>
                {(currentSlide.sideImageUrl || currentSlide.imageUrl) && (
                  <div className="side-image-container">
                    <img src={currentSlide.sideImageUrl || currentSlide.imageUrl} alt="صورة المادة" className="side-image" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. FULL YOUTUBE VIDEO */}
        {(currentSlide.type === 'video' || currentSlide.type === 'youtube') && (
          <div className="kiosk-fullscreen-video-container">
            {currentSlide.youtubeUrl ? (
              <iframe
                src={getSafeYoutubeEmbedUrl(currentSlide.youtubeUrl)}
                title="Fullscreen Video"
                className="kiosk-iframe-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="kiosk-video-placeholder">
                <i className="fas fa-video"></i>
                <span>فيديو يوتيوب مدرسة مشيرفة</span>
              </div>
            )}
          </div>
        )}

        {/* 3. SCHOOL NEWS PRESENTATION SLIDE */}
        {currentSlide.type === 'news' && (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}>
            <div style={{
              maxWidth: '1200px',
              width: '100%',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
              border: '2px solid #f59e0b',
              borderRadius: '28px',
              padding: '2.5rem',
              display: 'grid',
              gridTemplateColumns: currentSlide.imageUrl ? '1.2fr 1fr' : '1fr',
              gap: '2.5rem',
              alignItems: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
            }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f59e0b', color: '#000', padding: '6px 16px', borderRadius: '12px', fontWeight: 900, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                  <i className="fas fa-newspaper"></i> {currentSlide.badge || 'خبر مدرسي رسمي'}
                </div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1.35, marginBottom: '1rem' }}>
                  {currentSlide.title}
                </h2>
                <p style={{ fontSize: '1.25rem', color: '#cbd5e1', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  {currentSlide.subtitle}
                </p>
                {currentSlide.date && (
                  <div style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 700 }}>
                    <i className="fas fa-calendar-alt"></i> {currentSlide.date}
                  </div>
                )}
              </div>

              {currentSlide.imageUrl && (
                <div style={{ height: '380px', borderRadius: '20px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)', boxShadow: '0 15px 35px rgba(0,0,0,0.4)' }}>
                  <img src={currentSlide.imageUrl} alt={currentSlide.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. CELEBRATION & HONORS SLIDE */}
        {currentSlide.type === 'celebration' && (
          <div className="kiosk-celebration-container">
            <div className="celebration-badge-hero">
              <i className="fas fa-medal"></i> {currentSlide.badge || 'وسام التميز والتفوق'}
            </div>
            <h2 className="celebration-hero-title">{currentSlide.title}</h2>
            <p className="celebration-hero-desc">{currentSlide.subtitle}</p>
            {currentSlide.imageUrl && (
              <div className="celebration-image-wrap">
                <img src={currentSlide.imageUrl} alt="صورة التكريم" className="celebration-hero-image" />
              </div>
            )}
          </div>
        )}

        {/* 5. SLIDESHOW / PHOTO ALBUM */}
        {currentSlide.type === 'slideshow' && (
          <div className="kiosk-fullscreen-slideshow">
            {currentSlide.images && currentSlide.images.length > 0 ? (
              <img 
                src={currentSlide.images[currentSlideIndex % currentSlide.images.length] || currentSlide.images[0]} 
                alt="معرض الصور" 
                className="kiosk-slide-img" 
              />
            ) : currentSlide.imageUrl ? (
              <img src={currentSlide.imageUrl} alt="صورة المعرض" className="kiosk-slide-img" />
            ) : (
              <div className="kiosk-slideshow-empty">
                <i className="fas fa-images"></i>
                <p>معرض صور فعاليات مدرسة مشيرفة</p>
              </div>
            )}
            <div className="kiosk-slide-overlay-info">
              <span className="slide-tag">{currentSlide.badge || '📸 معرض الصور'}</span>
              <h3 className="slide-title">{currentSlide.title}</h3>
              <p className="slide-desc">{currentSlide.subtitle}</p>
            </div>
          </div>
        )}

        {/* 6. SPLIT SCREEN PHOTO SHOWCASE & ALBUM (تقسيم الشاشة الذكي للصور مع لوحة النصوص) */}
        {(currentSlide.type === 'split_photos' || currentSlide.type === 'photo' || currentSlide.type === 'split_slideshow') && (() => {
          // Resolve list of photos: current slide images, or collected playlist photos, or current imageUrl
          const currentSlideImages = (currentSlide.images && currentSlide.images.length > 0)
            ? currentSlide.images
            : (activeSlideList.flatMap(s => (s.images && s.images.length > 0 ? s.images : (s.imageUrl ? [s.imageUrl] : []))).filter(Boolean).length > 1)
              ? activeSlideList.flatMap(s => (s.images && s.images.length > 0 ? s.images : (s.imageUrl ? [s.imageUrl] : []))).filter(Boolean)
              : (currentSlide.imageUrl ? [currentSlide.imageUrl] : []);

          const totalPhotos = currentSlideImages.length;
          const activeIdx = totalPhotos > 0 ? (galleryPhotoIndex % totalPhotos) : 0;
          const activeImgSrc = totalPhotos > 0 ? currentSlideImages[activeIdx] : null;

          return (
            <div className="kiosk-split-wrapper">
              {/* MAIN ZONE: DYNAMIC PHOTO GALLERY & CYCLING DISPLAY */}
              <div className="kiosk-split-main">
                <div className="kiosk-split-photo-frame">
                  {activeImgSrc ? (
                    <img 
                      key={activeImgSrc}
                      src={activeImgSrc} 
                      alt={currentSlide.title || 'صورة الفعالية'} 
                      className="kiosk-split-photo-img" 
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <i className="fas fa-images" style={{ fontSize: '4.5rem', marginBottom: '1rem', color: '#f59e0b', display: 'block' }}></i>
                      <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>معرض صور مدرسة مشيرفة</h3>
                      <p style={{ color: '#cbd5e1' }}>يرجى رفع صور من جهازك أو اختيار صور من المعرض</p>
                    </div>
                  )}

                  {/* Photo Counter Pill at Top Right */}
                  {totalPhotos > 1 && (
                    <div className="kiosk-split-photo-badge">
                      <i className="fas fa-camera"></i>
                      <span>صورة {activeIdx + 1} من {totalPhotos}</span>
                    </div>
                  )}

                  {/* Manual Arrow Controls on hover / remote */}
                  {totalPhotos > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setGalleryPhotoIndex(prev => (prev - 1 + totalPhotos) % totalPhotos); }}
                        style={{
                          position: 'absolute',
                          right: '15px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255,255,255,0.25)',
                          color: '#fff',
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          zIndex: 20,
                          boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                        }}
                        title="الصورة السابقة"
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setGalleryPhotoIndex(prev => (prev + 1) % totalPhotos); }}
                        style={{
                          position: 'absolute',
                          left: '15px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255,255,255,0.25)',
                          color: '#fff',
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          zIndex: 20,
                          boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                        }}
                        title="الصورة التالية"
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                    </>
                  )}

                  {/* Dot Indicators at Bottom */}
                  {totalPhotos > 1 && (
                    <div className="kiosk-split-photo-dots">
                      {currentSlideImages.slice(0, 15).map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setGalleryPhotoIndex(dotIdx); }}
                          className={`kiosk-split-photo-dot ${dotIdx === activeIdx ? 'active' : ''}`}
                          title={`صورة رقم ${dotIdx + 1}`}
                        />
                      ))}
                      {totalPhotos > 15 && (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginRight: '4px', fontWeight: 800 }}>+{totalPhotos - 15}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SIDE ZONE: STRUCTURED RICH INFORMATION & SCHOOL TEXT */}
              <div className="kiosk-split-side">
                <div className={`kiosk-side-card theme-${currentSlide.sideTheme || 'emerald'}`}>
                  <div>
                    {/* Optional Custom Badge (Only if explicitly set and not generic photo label) */}
                    {currentSlide.badge && !currentSlide.badge.includes('صورة') && !currentSlide.badge.includes('فعاليات') && (
                      <div className="side-badge">
                        <i className="fas fa-star"></i> {currentSlide.badge}
                      </div>
                    )}

                    {/* Main Title */}
                    <h2 className="side-title" style={{ fontSize: '2.1rem', fontWeight: 900, lineHeight: 1.35, marginBottom: '1rem', color: '#fff' }}>
                      {currentSlide.title || currentSlide.sideTitle || 'معرض الصور والأنشطة'}
                    </h2>

                    {/* Full Text / Description */}
                    <p className="side-text" style={{ fontSize: '1.25rem', color: '#e2e8f0', lineHeight: 1.8, marginBottom: '1.5rem', fontWeight: 600 }}>
                      {currentSlide.subtitle || currentSlide.sideText || 'مدرسة مشيرفة الابتدائية • صرح التميز والإبداع والقيادة التربوية'}
                    </p>

                    {/* Daily Wisdom / School Fact / Quote */}
                    {aiWisdom && (
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        borderRadius: '16px',
                        padding: '1.1rem 1.3rem',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        marginTop: '1.25rem'
                      }}>
                        <div style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 900, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fas fa-lightbulb"></i> حكمة اليوم المدرسية
                        </div>
                        <div style={{ color: '#f1f5f9', fontSize: '1.05rem', lineHeight: 1.6, fontWeight: 700 }}>
                          "{aiWisdom.wisdom}"
                        </div>
                      </div>
                    )}
                  </div>

                  {/* School Footer Branding Inside Side Card */}
                  <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.15)',
                    paddingTop: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.92rem',
                    color: '#94a3b8'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontWeight: 800 }}>
                      <i className="fas fa-school" style={{ color: '#f59e0b' }}></i>
                      <span>مدرسة مشيرفة الابتدائية</span>
                    </div>
                    <div style={{ color: '#38bdf8', fontWeight: 900 }}>
                      {formattedDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 7. FULL ANNOUNCEMENT CARD */}
        {(currentSlide.type === 'announcement' || currentSlide.type === 'custom') && (
          <div className="kiosk-announcement-card">
            <div className="announcement-badge">
              <i className="fas fa-bullhorn"></i> {currentSlide.badge || 'إعلان مدرسي رسمي'}
            </div>
            <h2 className="announcement-title">{currentSlide.title}</h2>
            <p className="announcement-text">{currentSlide.subtitle}</p>
            {currentSlide.imageUrl && (
              <div style={{ marginTop: '1.5rem', maxHeight: '350px', overflow: 'hidden', borderRadius: '16px' }}>
                <img src={currentSlide.imageUrl} alt="صورة الإعلان" style={{ maxHeight: '350px', width: 'auto', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
              </div>
            )}
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
        {(config.showTicker !== false) && (
          <div className="kiosk-ticker-bar">
            <div className="ticker-label">
              <i className="fas fa-bullhorn"></i> شريط الأخبار
            </div>
            <div className="ticker-track">
              <div className="ticker-content">
                {config.tickerText || 'مدرسة مشيرفة الابتدائية • صرح التميز والإبداع والقيادة التربوية • أهلاً وسهلاً بكم'}
                {config.autoNewsTicker !== false && availableNews.length > 0 && availableNews.slice(0, 5).map(n => ` • 📢 ${n.title}`).join('')}
                {aiWisdom && ` • 💡 حكمة اليوم: ${aiWisdom.wisdom} • 🔬 معلومة اليوم: ${aiWisdom.fact}`}
                &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;
                {config.tickerText || 'مدرسة مشيرفة الابتدائية • صرح التميز والإبداع والقيادة التربوية • أهلاً وسهلاً بكم'}
                {config.autoNewsTicker !== false && availableNews.length > 0 && availableNews.slice(0, 5).map(n => ` • 📢 ${n.title}`).join('')}
                {aiWisdom && ` • 💡 حكمة اليوم: ${aiWisdom.wisdom} • 🔬 معلومة اليوم: ${aiWisdom.fact}`}
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
        title="فتح استوديو اختيار وتصميم المواد المعروضة"
        style={{
          position: 'fixed',
          bottom: '18px',
          left: '18px',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.92)',
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
        <i className="fas fa-sliders-h"></i> ⚙️ استوديو اختيار وتصميم المواد
      </button>

    </div>
  );
};

export default KioskDisplayPage;
