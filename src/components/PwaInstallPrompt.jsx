import React, { useState, useEffect } from 'react';
import { 
  isNotificationSupported, 
  isNotificationsEnabledLocally, 
  requestNotificationPermission 
} from '../utils/notificationService';
import './PwaInstallPrompt.css';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showFallbackGuide, setShowFallbackGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone (PWA) mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (within 3 days)
    const dismissedAt = localStorage.getItem('pwa_unified_dismissed_until');
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
        // Show after 2.5 seconds so visitor can see page content smoothly first
        setTimeout(() => setShowPrompt(true), 2500);
      }
    };

    // If on iOS and not dismissed, show prompt after 3 seconds
    if (isIosDevice && !isDismissed && !isStandalone) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Track successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa_app_installed', 'true');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Custom trigger listener to open from floating button or menu
    const handleManualTrigger = () => {
      if (isIosDevice) {
        setShowIosGuide(true);
      }
      setShowPrompt(true);
    };

    window.addEventListener('trigger-pwa-install', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('trigger-pwa-install', handleManualTrigger);
    };
  }, []);

  const handleInstallAndNotify = async () => {
    setIsProcessing(true);

    // 1. Handle iOS device flow
    if (isIos) {
      setShowIosGuide(true);
      if (isNotificationSupported() && !isNotificationsEnabledLocally()) {
        try {
          await requestNotificationPermission();
        } catch (e) {}
      }
      setIsProcessing(false);
      return;
    }

    // 2. Android / Chromium: Trigger native install prompt FIRST while user gesture is active
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setShowPrompt(false);
          setDeferredPrompt(null);
          localStorage.setItem('pwa_app_installed', 'true');
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      // Show smooth in-banner guide if native prompt is not available
      setShowFallbackGuide(true);
    }

    // 3. Enable notifications smoothly
    if (isNotificationSupported() && !isNotificationsEnabledLocally()) {
      try {
        await requestNotificationPermission();
      } catch (err) {
        console.warn('Notification permission notice:', err);
      }
    }

    setIsProcessing(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    setShowFallbackGuide(false);
    // Snooze for 3 days so user is not annoyed
    localStorage.setItem('pwa_unified_dismissed_until', String(Date.now() + 3 * 24 * 60 * 60 * 1000));
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="pwa-install-banner-wrapper" role="dialog" aria-label="تنزيل التطبيق وتفعيل الإشعارات">
      <div className="pwa-install-card">
        <button 
          className="pwa-close-btn" 
          onClick={handleDismiss} 
          aria-label="إغلاق التنبيه"
          title="إغلاق"
        >
          <i className="fas fa-times"></i>
        </button>

        <div className="pwa-content-row">
          <div className="pwa-icon-container">
            <img 
              src="/icon-192.png" 
              alt="شعار مدرسة مشيرفة" 
              className="pwa-app-icon"
            />
            <span className="pwa-badge-bell">🔔</span>
          </div>

          <div className="pwa-text-info">
            <div className="pwa-tag-pill">
              <span>تطبيق مدرسة مشيرفة 📱</span>
            </div>
            <h4 className="pwa-app-title">
              يمكنك تنزيل التطبيق على هاتفك وتلقي الإشعارات
            </h4>
            <p className="pwa-app-desc">
              تصفح سريع بدون شريط المتصفح وتنبيهات مباشرة بالفعاليات والرسائل فور نشرها!
            </p>
          </div>
        </div>

        {isIos && showIosGuide ? (
          <div className="pwa-ios-instructions">
            <p className="pwa-ios-title">
              <strong>📲 خطوات التثبيت السريع على آيفون (Safari):</strong>
            </p>
            <ol>
              <li>
                اضغط على زر المشاركة <i className="fas fa-share-square" style={{ color: '#38bdf8' }}></i> أسفل شاشة المتصفح.
              </li>
              <li>
                مرر للأسفل واختر <strong>"إضافة إلى الشاشة الرئيسية" ➕</strong> (Add to Home Screen).
              </li>
              <li>
                اضغط على <strong>"إضافة" (Add)</strong> بالأعلى لتجد التطبيق فوراً بين برامج هاتفك!
              </li>
            </ol>
            <button className="pwa-btn-done" onClick={handleDismiss}>
              فهمت ذلك، تم بنجاح 👍
            </button>
          </div>
        ) : showFallbackGuide ? (
          <div className="pwa-ios-instructions">
            <p className="pwa-ios-title">
              <strong>📲 خطوات تثبيت التطبيق على جهازك:</strong>
            </p>
            <ol>
              <li>
                اضغط على قائمة خيارات المتصفح <i className="fas fa-ellipsis-v" style={{ color: '#38bdf8' }}></i> بالأعلى أو الأسفل.
              </li>
              <li>
                اختر <strong>"تثبيت التطبيق"</strong> أو <strong>"إضافة إلى الشاشة الرئيسية" ➕</strong>.
              </li>
              <li>
                اضغط <strong>"تثبيت"</strong> لتجده فوراً مع تطبيقات هاتفك!
              </li>
            </ol>
            <button className="pwa-btn-done" onClick={handleDismiss}>
              فهمت ذلك 👍
            </button>
          </div>
        ) : (
          <div className="pwa-actions-row">
            <button 
              className="pwa-btn-install" 
              onClick={handleInstallAndNotify}
              disabled={isProcessing}
            >
              <i className={`fas ${isProcessing ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
              {isProcessing ? 'جاري التجهيز...' : 'تنزيل التطبيق وتفعيل الإشعارات ⚡'}
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
