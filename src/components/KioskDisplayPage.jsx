import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import './KioskDisplayPage.css';

const DEFAULT_CONFIGS = {
  main: {
    mode: 'youtube',
    title: 'أهلاً وسهلاً بكم في مدرسة مشيرفة الابتدائية',
    subtitle: 'بوابة التميز، الإبداع، والقيادة التربوية 🌟',
    youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
    images: [
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop'
    ],
    tickerText: 'مرحباً بكم في البوابة الرقمية لمدرسة مشيرفة الابتدائية • نتمنى لطلابنا وأهالينا الكرام يوماً دراسياً ملؤه التميز والعطاء!',
    showTicker: true,
    showClock: true,
    showQr: true,
    showLogo: true,
    theme: 'dark',
    slideInterval: 5
  },
  students: {
    mode: 'youtube',
    title: '🚀 شاشة إبداع الطلاب والفعاليات المدرسية',
    subtitle: 'ركن المبتكرين، التحديات الأسبوعية، والأنشطة اللامنهجية ✨',
    youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
    images: [
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop'
    ],
    tickerText: 'طلابنا الأعزاء • شاركوا أفكاركم في زاوية "شارك أفكارك للعالم" وحلوا التحدي الأسبوعي للفوز بجوائز التميز!',
    showTicker: true,
    showClock: true,
    showQr: true,
    showLogo: true,
    theme: 'gold',
    slideInterval: 5
  },
  teachers: {
    mode: 'announcement',
    title: '👨‍🏫 شاشة غرفة المعلمين والإدارة التربوية',
    subtitle: 'التعاميم الرسمية، جدول الفعاليات، ورسائل الإدارة 📚',
    youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
    images: [
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop'
    ],
    tickerText: 'زملاءنا المعلمين والمعلمات • يرجى متابعة بوابة STEM وحزم أوراق العمل وتحديث السجلات العلمية دورياً.',
    showTicker: true,
    showClock: true,
    showQr: false,
    showLogo: true,
    theme: 'blue',
    slideInterval: 5
  },
  parents: {
    mode: 'slideshow',
    title: '👨‍👩‍👧 شاشة الأهالي والزوار الكرام',
    subtitle: 'أهلاً وسهلاً بكم في مدرسة مشيرفة الابتدائية 🌟',
    youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
    images: [
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop'
    ],
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
      setConfig(DEFAULT_CONFIGS[ch] || DEFAULT_CONFIGS.main);
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
        if (docSnap.exists()) {
          const defaultForChannel = DEFAULT_CONFIGS[channel] || DEFAULT_CONFIGS.main;
          setConfig({ ...defaultForChannel, ...docSnap.data() });
        } else {
          const localConf = localStorage.getItem(`db_kiosk_${channel}`);
          if (localConf) setConfig(JSON.parse(localConf));
          else setConfig(DEFAULT_CONFIGS[channel] || DEFAULT_CONFIGS.main);
        }
      }, (err) => {
        console.warn(`Kiosk listener warning for channel ${channel}:`, err);
        const localConf = localStorage.getItem(`db_kiosk_${channel}`);
        if (localConf) setConfig(JSON.parse(localConf));
      });
    } catch (e) {
      const localConf = localStorage.getItem(`db_kiosk_${channel}`);
      if (localConf) setConfig(JSON.parse(localConf));
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
    if (config.mode === 'slideshow' && config.images && config.images.length > 0) {
      const slideTimer = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % config.images.length);
      }, (config.slideInterval || 5) * 1000);
      return () => clearInterval(slideTimer);
    }
  }, [config.mode, config.images, config.slideInterval]);

  // Extract YouTube ID helper
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = 'EF4g6yBUbmk';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=1&rel=0&modestbranding=1&enablejsapi=1`;
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
        
        {/* MODE 1: YOUTUBE VIDEO */}
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

        {/* MODE 2: IMAGE SLIDESHOW */}
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

        {/* MODE 3: ANNOUNCEMENT CARD */}
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
