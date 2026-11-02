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
      container.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {
        setIsFullscreen(!isFullscreen);
      });
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="qanat-page-root" dir="rtl">
      {/* Fixed Main Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="qanat-container">
        {/* Header / Intro Card */}
        <section className="qanat-hero-card">
          <div className="qanat-hero-badges">
            <span className="qanat-pill-tag">
              <span className="sparkle">✨</span> منصة تعليمية تفاعلية
            </span>
            <span className="qanat-pill-badge">
              🎬 أفلام تعليمية واختبارات شيقة
            </span>
          </div>

          <div className="qanat-title-row">
            <div className="qanat-icon-bubble">
              <i className="fas fa-play-circle"></i>
            </div>
            <div>
              <h1 className="qanat-main-title">
                تعلّم وتَمَتَّع — <span className="highlight">القناة الرقمية</span> 📺
              </h1>
              <p className="qanat-sub-title">
                أهلاً بكم في واحة المشاهدة والتعلم الممتع لطلاب مدرسة مشيرفة! أفلام تعليمية هادفة، مسابقات، ومحطات تفاعلية تدمج متعة التعلم بالاكتشاف.
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="qanat-actions-bar">
            <button
              type="button"
              onClick={() => { window.location.hash = '#/'; }}
              className="qanat-btn qanat-btn-home"
              title="العودة للصفحة الرئيسية"
            >
              <i className="fas fa-arrow-right"></i>
              <span>الرئيسية 🏠</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="qanat-btn qanat-btn-fullscreen"
              title="عرض بملء الشاشة"
            >
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
              <span>{isFullscreen ? 'تصغير الشاشة ⛶' : 'ملء الشاشة ⛶'}</span>
            </button>

            <a
              href="https://qanat-raqamiya.sites.tab.bot/"
              target="_blank"
              rel="noopener noreferrer"
              className="qanat-btn qanat-btn-external"
              title="فتح في نافذة مستقلة جديدة"
            >
              <i className="fas fa-external-link-alt"></i>
              <span>فتح بنافذة جديدة 🚀</span>
            </a>
          </div>
        </section>

        {/* Embedded Iframe Player Stage */}
        <div id="qanat-frame-wrapper" className={`qanat-iframe-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`}>
          {!iframeLoaded && (
            <div className="qanat-loading-skeleton">
              <div className="qanat-spinner"></div>
              <p className="qanat-loading-text">
                🎬 جاري تحميل منصة «تعلّم وتمتّع — القناة الرقمية»...
              </p>
            </div>
          )}

          <iframe
            src="https://qanat-raqamiya.sites.tab.bot/"
            title="تعلّم وتمتّع — القناة الرقمية: أفلام تعليمية واختبارات"
            className="qanat-iframe"
            allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      </main>
    </div>
  );
}
