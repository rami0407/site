import React, { useState, useEffect } from 'react';
import { 
  isNotificationSupported, 
  isNotificationsEnabledLocally, 
  requestNotificationPermission 
} from '../utils/notificationService';

const NotificationPromptBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    // Only show if supported, not yet enabled, and not dismissed recently
    const isDismissed = sessionStorage.getItem('notif_banner_dismissed') === 'true';
    if (isNotificationSupported() && !isNotificationsEnabledLocally() && !isDismissed) {
      // Delay prompt slightly so user first sees the site content
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsActivating(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setIsVisible(false);
      }
    } catch (e) {
      console.warn('Notification prompt error:', e);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('notif_banner_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      maxWidth: '480px',
      margin: '0 auto',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)',
      color: 'white',
      padding: '1.15rem 1.4rem',
      borderRadius: '20px',
      boxShadow: '0 15px 40px rgba(30, 27, 75, 0.4)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      zIndex: 99999,
      direction: 'rtl',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      animation: 'slideUpBanner 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <span style={{
          fontSize: '1.6rem',
          background: 'rgba(255,255,255,0.15)',
          width: '46px',
          height: '46px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          🔔
        </span>
        <div>
          <h4 style={{ margin: '0 0 2px 0', fontSize: '0.96rem', fontWeight: 900, color: '#ffffff' }}>
            تفعيل إشعارات الهاتف 📲
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#c7d2fe', lineHeight: 1.4 }}>
            ليصلك كل جديد (أخبار، فعاليات، ومناظرات) فور صدوره مباشرة!
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleEnable}
          disabled={isActivating}
          style={{
            background: '#fbbf24',
            color: '#1e1b4b',
            border: 'none',
            padding: '0.6rem 1rem',
            borderRadius: '12px',
            fontSize: '0.86rem',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
            whiteSpace: 'nowrap'
          }}
        >
          {isActivating ? 'جاري...' : 'تفعيل الآن ⚡'}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '1.1rem',
            padding: '0.3rem 0.5rem'
          }}
          title="إغلاق"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default NotificationPromptBanner;
