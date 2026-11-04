import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import './AflamMaharatPage.css';

export default function AflamMaharatPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'أفلام المهارات — منصة المهارات التعليمية المرئية | مدرسة مشيرفة الابتدائية';
  }, []);

  const handleToggleFullscreen = () => {
    const container = document.getElementById('aflam-frame-wrapper');
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
    <div className="aflam-page-root" dir="rtl">
      {/* Fixed Main Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="aflam-container">
        {/* Header / Intro Card */}
        <section className="aflam-hero-card">
          <div className="aflam-hero-badges">
            <span className="aflam-pill-tag">
              <span className="sparkle">✨</span> منصة تعليمية مرئية
            </span>
            <span className="aflam-pill-badge">
              🎬 أفلام المهارات والقيم الحياتية
            </span>
          </div>

          <div className="aflam-title-row">
            <div className="aflam-icon-bubble">
              <i className="fas fa-film"></i>
            </div>
            <div>
              <h1 className="aflam-main-title">
                أفلام المهارات — <span className="highlight">المنصة التعليمية المرئية</span> 🎬
              </h1>
              <p className="aflam-sub-title">
                مرحباً بكم في منصة «أفلام المهارات» لطلاب مدرسة مشيرفة الابتدائية! باقة مختارة بعناية من الأفلام المرئية الهادفة لتعزيز المهارات الحياتية، القيادة، التفكير الإبداعي وبناء القيم التربوية النبيلة.
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="aflam-actions-bar">
            <button
              type="button"
              onClick={() => { window.location.hash = '#/'; }}
              className="aflam-btn aflam-btn-home"
              title="العودة للصفحة الرئيسية"
            >
              <i className="fas fa-arrow-right"></i>
              <span>الرئيسية 🏠</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="aflam-btn aflam-btn-fullscreen"
              title="عرض بملء الشاشة"
            >
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
              <span>{isFullscreen ? 'تصغير الشاشة ⛶' : 'ملء الشاشة ⛶'}</span>
            </button>

            <a
              href="https://aflam-almaharat.sites.tab.bot/"
              target="_blank"
              rel="noopener noreferrer"
              className="aflam-btn aflam-btn-external"
              title="فتح في نافذة مستقلة جديدة"
            >
              <i className="fas fa-external-link-alt"></i>
              <span>فتح بنافذة جديدة 🚀</span>
            </a>
          </div>
        </section>

        {/* Embedded Iframe Player Stage */}
        <div id="aflam-frame-wrapper" className={`aflam-iframe-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`}>
          {!iframeLoaded && (
            <div className="aflam-loading-skeleton">
              <div className="aflam-spinner"></div>
              <p className="aflam-loading-text">
                🎬 جاري تحميل منصة «أفلام المهارات»...
              </p>
            </div>
          )}

          <iframe
            src="https://aflam-almaharat.sites.tab.bot/"
            title="أفلام المهارات — المنصة التعليمية المرئية"
            className="aflam-iframe"
            width="100%"
            height="900"
            style={{ border: 0 }}
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
