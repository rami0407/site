import React, { useState, useEffect } from 'react';
import './PwaInstallPrompt.css';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone (PWA) mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (within 5 days)
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_until');
    const isDismissed = dismissedAt && Date.now() < Number(dismissedAt);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIos(isIosDevice);

    // Listen for the beforeinstallprompt event (Android / Chromium / Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed) {
        // Show after 3 seconds so the user can see the page first
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    // If on iOS and not dismissed, show prompt after 4 seconds
    if (isIosDevice && !isDismissed && !isStandalone) {
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => clearTimeout(timer);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Track successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('Musheirifa PWA was installed successfully!');
    });

    // Custom trigger listener to open from external button
    const handleManualTrigger = () => {
      if (isIosDevice) {
        setShowIosGuide(true);
        setShowPrompt(true);
      } else if (deferredPrompt) {
        setShowPrompt(true);
      } else {
        alert('لتثبيت التطبيق على جهازك: افتح قائمة المتصفح (⋮ أو ⋯) واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
      }
    };

    window.addEventListener('trigger-pwa-install', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-pwa-install', handleManualTrigger);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) {
      alert('لتثبيت التطبيق: افتح قائمة المتصفح (⋮) بالأعلى واختر "تثبيت التطبيق" (Install App).');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Snooze for 4 days
    localStorage.setItem('pwa_prompt_dismissed_until', String(Date.now() + 4 * 24 * 60 * 60 * 1000));
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="pwa-install-banner-wrapper">
      <div className="pwa-install-card">
        <button 
          className="pwa-close-btn" 
          onClick={handleDismiss} 
          aria-label="إغلاق التنبيه"
        >
          <i className="fas fa-times"></i>
        </button>

        <div className="pwa-content-row">
          <img 
            src="/icon-192.png" 
            alt="شعار مدرسة مشيرفة" 
            className="pwa-app-icon"
          />
          <div className="pwa-text-info">
            <h4 className="pwa-app-title">تطبيق مدرسة مشيرفة الابتدائية 📱</h4>
            <p className="pwa-app-desc">
              ثبّت التطبيق مجاناً على هاتفك لفتحه كبرنامج مستقل وسريع بدون شريط المتصفح!
            </p>
          </div>
        </div>

        {isIos && showIosGuide ? (
          <div className="pwa-ios-instructions">
            <p>
              <strong>طريقة التثبيت على آيفون (Safari):</strong>
            </p>
            <ol>
              <li>اضغط على زر المشاركة <i className="fas fa-share-square" style={{ color: '#007aff' }}></i> أسفل شاشة المتصفح.</li>
              <li>انزل في القائمة واضغط على <strong>"إضافة إلى الشاشة الرئيسية" ➕</strong> (Add to Home Screen).</li>
              <li>اضغط على <strong>"إضافة" (Add)</strong> في الزاوية العليا، وسيظهر التطبيق فوراً على شاشة هاتفك!</li>
            </ol>
            <button className="pwa-btn-done" onClick={handleDismiss}>فهمت ذلك، تم 👍</button>
          </div>
        ) : (
          <div className="pwa-actions-row">
            <button className="pwa-btn-install" onClick={handleInstallClick}>
              <i className="fas fa-download"></i> تثبيت التطبيق الآن
            </button>
            <button className="pwa-btn-later" onClick={handleDismiss}>
              لاحقاً
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
