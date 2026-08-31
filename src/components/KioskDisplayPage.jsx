import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
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
    // Side Widget Settings
    sideType: 'greeting', // 'image' | 'greeting' | 'reminder'
    sideTitle: '🌟 باقة تهنئة وتكريم',
    sideText: 'تبارك إدارة مدرسة مشيرفة لفرسان التميز والابتكار في فعاليات اليوم الدراسي.',
    sideImageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop',
    sideTheme: 'gold', // 'gold' | 'blue' | 'emerald' | 'purple'
    // Celebration Mode Settings
    celebrationBadge: '🏆 وسام التميز والتفوق',
    celebrationTitle: 'مبارك لطلابنا المبدعين!',
    celebrationText: 'نفتخر بإنجازات طلابنا وطالباتنا في المسابقات العلمية والأنشطة اللامنهجية.',
    celebrationImageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
    // Ticker & Header
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

const KioskDisplayPage = () => {
  const [channel, setChannel] = useState('main');
  const [config, setConfig] = useState(DEFAULT_CONFIGS.main);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detect channel from route hash or URL
  useEffect(() => {
    const detectChannel = () => {
      const hash = window.location.hash.toLowerCase();
      let ch = 'main';
      if (hash.includes('student')) ch = 'students';
      else if (hash.includes('teacher')) ch = 'teachers';
      else if (hash.includes('parent')) ch = 'parents';
      
      setChannel(ch);
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
  }, [channel]);

  // Real-time clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Slideshow auto-rotation timer
  useEffect(() => {
    const isSlideMode = config.mode === 'slideshow' || config.mode === 'split_slideshow';
    if (isSlideMode && config.images && config.images.length > 0) {
      const slideTimer = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % config.images.length);
      }, (config.slideInterval || 5) * 1000);
      return () => clearInterval(slideTimer);
    }
  }, [config.mode, config.images, config.slideInterval]);

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

  const channelBadges = {
    main: '🏫 الشاشة العامة',
    students: '🎓 شاشة الطلاب',
    teachers: '👨‍🏫 شاشة المعلمين',
    parents: '👨‍👩‍👧 شاشة الأهالي'
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

  return (
    <div className={`kiosk-container theme-${config.theme || 'dark'}`}>
      
      {/* Top Header Bar */}
      <header className="kiosk-header">
        <div className="kiosk-header-right">
          {config.showLogo && (
            <img 
              src="https://lh3.googleusercontent.com/pw/AP1GczOmuSnGS9OmfsVRo3-FedvNpsjYbgAZCMWlFYtMsFf4wX3F9upApscvMLiVa6MS2DQe7mNGNQO6zUyfSSMD4pmPpTOG5TFEZiZcE2jXzNrJjv7-4D9xh-H9HBsHtVYIU6nEesjXL_QvHFgZSVcvkU7jzA=w500-h500-s-no-gm?authuser=0" 
              alt="شعار المدرسة" 
              className="kiosk-logo" 
            />
          )}
          <div className="kiosk-titles">
            <div className="kiosk-channel-tag">{channelBadges[channel] || '📺 شاشة العرض'}</div>
            <h1 className="kiosk-main-title">{config.title}</h1>
            <p className="kiosk-subtitle">{config.subtitle}</p>
          </div>
        </div>

        <div className="kiosk-header-left">
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
                {config.tickerText} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; {config.tickerText}
              </div>
            </div>
          </div>
        )}

      </footer>

    </div>
  );
};

export default KioskDisplayPage;
