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
    <div className="aflam-page-root" dir="rtl">
      {/* Fixed Main Dual Navbar */}
      <Navbar />

      {/* Slim Contextual Integration Bar */}
      <aside className="aflam-sub-bar" aria-label="شريط أفلام المهارات">
        <div className="aflam-sub-bar-inner">
          <div className="aflam-brand-block">
            <span className="aflam-live-indicator" title="منصة متصلة مباشرة">
              <span className="aflam-live-ping"></span>
              <span className="aflam-live-core"></span>
            </span>
            <div className="aflam-brand-titles">
              <span className="aflam-title-text">
                🎬 <strong>أفلام المهارات</strong> — المنصة المرئية لمدرسة مشيرفة
              </span>
              <span className="aflam-badge-tag">
                ✨ مهارات لغوية وتفكير وأوراق عمل
              </span>
            </div>
          </div>

          <div className="aflam-action-buttons">
            <button
              type="button"
              onClick={() => { window.location.hash = '#/'; }}
              className="aflam-action-btn aflam-btn-home"
              title="العودة للصفحة الرئيسية للمدرسة"
            >
              <i className="fas fa-home"></i>
              <span>الرئيسية 🏠</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className={`aflam-action-btn aflam-btn-fs ${isFullscreen ? 'active' : ''}`}
              title="عرض بملء الشاشة"
            >
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
              <span>{isFullscreen ? 'تصغير الشاشة ⛶' : 'ملء الشاشة ⛶'}</span>
            </button>

            <a
              href="https://aflam-almaharat.sites.tab.bot/"
              target="_blank"
              rel="noopener noreferrer"
              className="aflam-action-btn aflam-btn-external"
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
        id="aflam-frame-wrapper"
        className={`aflam-stage-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`}
      >
        {!iframeLoaded && (
          <div className="aflam-loading-skeleton" aria-live="polite">
            <div className="aflam-spinner"></div>
            <p className="aflam-loading-text">
              🎬 جاري تحميل منصة «أفلام المهارات»...
            </p>
          </div>
        )}

        {isFullscreen && (
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="aflam-exit-fs-float"
            title="الخروج من وضع ملء الشاشة (Esc)"
          >
            <i className="fas fa-times"></i> تصغير الشاشة ✕
          </button>
        )}

        <iframe
          src="https://aflam-almaharat.sites.tab.bot/"
          title="أفلام المهارات — المنصة التعليمية المرئية"
          className="aflam-iframe-native"
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
