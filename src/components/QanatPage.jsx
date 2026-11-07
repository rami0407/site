import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import './QanatPage.css';

export default function QanatPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'تعلّم وتمتّع — القناة الرقمية والأفلام التعليمية | مدرسة مشيرفة الابتدائية';
  }, []);

  const handleToggleFullscreen = () => {
    const container = document.getElementById('qanat-frame-wrapper');
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
          setIsFullscreen(prev => !prev);
        });
      } else {
        setIsFullscreen(prev => !prev);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  return (
    <div className="qanat-page-root" dir="rtl">
      {/* Fixed Main Dual Navbar */}
      <Navbar />

      {/* Slim Contextual Integration Bar (Directly below Navbar) */}
      <aside className="qanat-sub-bar" aria-label="شريط منصة تعلّم وتمتّع">
        <div className="qanat-sub-bar-inner">
          <div className="qanat-brand-block">
            <span className="qanat-live-indicator" title="منصة متصلة مباشرة">
              <span className="qanat-live-ping"></span>
              <span className="qanat-live-core"></span>
            </span>
            <div className="qanat-brand-titles">
              <span className="qanat-title-text">
                🎬 <strong>تعلّم وتَمَتَّع</strong> — القناة الرقمية
              </span>
              <span className="qanat-badge-tag">
                ✨ أفلام تعليمية واختبارات تفاعلية فورية
              </span>
            </div>
          </div>

          <div className="qanat-action-buttons">
            <button
              type="button"
              onClick={() => { window.location.hash = '#/'; }}
              className="qanat-action-btn qanat-btn-home"
              title="العودة للصفحة الرئيسية للمدرسة"
            >
              <i className="fas fa-home"></i>
              <span>الرئيسية 🏠</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className={`qanat-action-btn qanat-btn-fs ${isFullscreen ? 'active' : ''}`}
              title="عرض المنصة بملء الشاشة للتفاعل الكامل"
            >
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
              <span>{isFullscreen ? 'تصغير الشاشة ⛶' : 'ملء الشاشة ⛶'}</span>
            </button>

            <a
              href="https://qanat-raqamiya.sites.tab.bot/"
              target="_blank"
              rel="noopener noreferrer"
              className="qanat-action-btn qanat-btn-external"
              title="فتح المنصة في تبويب مستقل"
            >
              <i className="fas fa-external-link-alt"></i>
              <span>نافذة مستقلة 🚀</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Full-Bleed 100% Width Edge-to-Edge Embedded Stage */}
      <main
        id="qanat-frame-wrapper"
        className={`qanat-stage-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`}
      >
        {!iframeLoaded && (
          <div className="qanat-loading-skeleton" aria-live="polite">
            <div className="qanat-spinner"></div>
            <p className="qanat-loading-text">
              🎬 جاري تحميل منصة «تعلّم وتمتّع — القناة الرقمية»...
            </p>
          </div>
        )}

        {isFullscreen && (
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="qanat-exit-fs-float"
            title="الخروج من وضع ملء الشاشة (Esc)"
          >
            <i className="fas fa-times"></i> تصغير الشاشة ✕
          </button>
        )}

        <iframe
          src="https://qanat-raqamiya.sites.tab.bot/"
          title="تعلّم وتمتّع — القناة الرقمية: أفلام تعليمية واختبارات"
          className="qanat-iframe-native"
          allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="eager"
          referrerPolicy="no-referrer"
          onLoad={() => setIframeLoaded(true)}
        />
      </main>
    </div>
  );
}
