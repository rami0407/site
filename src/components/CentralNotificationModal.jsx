import React, { useState, useEffect, useRef } from 'react';
import './CentralNotificationModal.css';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { logNotificationView } from '../utils/notificationService';

// Pleasant subtle chime using Web Audio API without external file requirements
const playGentleNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    // Gentle two-tone bell chime (C6 to E6)
    osc.frequency.setValueAtTime(1046.5, now);
    osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  } catch (e) {
    // AudioContext autoplay restrictions are handled gracefully
  }
};

const CentralNotificationModal = () => {
  const [activeNotification, setActiveNotification] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // 1. Listen for real-time central notifications from Firestore
    const q = query(
      collection(db, 'school_notifications'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let candidate = null;

      snapshot.forEach(docSnap => {
        const data = { id: docSnap.id, ...docSnap.data() };
        // Check if marked for central popup and is active
        if (!candidate && data.popupInCenter !== false && data.active !== false) {
          candidate = data;
        }
      });

      if (candidate) {
        // Check acknowledgement in localStorage
        const ackKey = `ack_central_${candidate.id}_${candidate.forceReshowKey || 'v1'}`;
        const alreadyAcked = localStorage.getItem(ackKey) === 'true';

        if (!alreadyAcked) {
          setActiveNotification(candidate);
          setIsPreviewMode(false);
          setIsOpen(true);

          // Trigger audio chime & haptic feedback
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            setTimeout(() => {
              playGentleNotificationChime();
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate([80, 40, 80]); } catch (e) {}
              }
            }, 400);
          }
        }
      }
    }, (err) => {
      console.warn('Central notifications listener error:', err);
    });

    // 2. Listen for Admin Preview custom event
    const handlePreviewEvent = (e) => {
      if (e.detail) {
        setActiveNotification(e.detail);
        setIsPreviewMode(true);
        setIsOpen(true);
        playGentleNotificationChime();
      }
    };
    window.addEventListener('preview-central-notif', handlePreviewEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('preview-central-notif', handlePreviewEvent);
    };
  }, []);

  const handleDismiss = (navigateUrl = null) => {
    if (activeNotification) {
      // In non-preview mode, record acknowledgment and log viewer statistics
      if (!isPreviewMode && activeNotification.id) {
        const ackKey = `ack_central_${activeNotification.id}_${activeNotification.forceReshowKey || 'v1'}`;
        localStorage.setItem(ackKey, 'true');
        logNotificationView(activeNotification.id);
      }
    }

    setIsOpen(false);

    if (navigateUrl) {
      const target = navigateUrl.startsWith('#') ? navigateUrl : ('#' + navigateUrl);
      window.location.hash = target;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isOpen || !activeNotification) return null;

  // Derive theme styling
  const theme = activeNotification.theme || (activeNotification.priority === 'urgent' ? 'red' : 'blue');
  
  // Icon based on category or theme
  let iconEmoji = '📢';
  if (activeNotification.category === 'debate') iconEmoji = '⚖️';
  else if (activeNotification.category === 'event') iconEmoji = '📅';
  else if (activeNotification.category === 'news') iconEmoji = '📰';
  else if (theme === 'red') iconEmoji = '🚨';
  else if (theme === 'amber') iconEmoji = '🏆';
  else if (theme === 'emerald') iconEmoji = '🌿';

  let badgeText = 'تنبيه إداري هام';
  if (activeNotification.priority === 'urgent' || theme === 'red') badgeText = '🚨 تنبيه عاجل';
  else if (activeNotification.category === 'debate') badgeText = '⚖️ مناظرة الأسبوع الفكرية';
  else if (activeNotification.category === 'event') badgeText = '📅 فعالية مدرسية';
  else if (activeNotification.category === 'news') badgeText = '📰 خبر وإعلان مدرسي';

  return (
    <div className="central-notif-backdrop" onClick={() => handleDismiss()}>
      <div 
        className="central-notif-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className={`central-notif-header theme-${theme}`}>
          <button 
            type="button" 
            className="central-notif-close-corner"
            onClick={() => handleDismiss()}
            title="إغلاق التنبيه"
          >
            ✕
          </button>
          <div className="central-notif-icon-bubble">
            <span>{iconEmoji}</span>
          </div>
          <span className="central-notif-badge">{badgeText}</span>
          <p className="central-notif-school-label">مدرسة مشيرفة الابتدائية</p>
        </div>

        {/* Body */}
        <div className="central-notif-body">
          <h3 className="central-notif-title">
            {activeNotification.title}
          </h3>
          <p className="central-notif-text">
            {activeNotification.body}
          </p>

          <div className="central-notif-meta-row">
            <span>
              <i className="far fa-clock" style={{ marginLeft: '4px' }}></i>
              {activeNotification.createdAt 
                ? new Date(activeNotification.createdAt).toLocaleDateString('ar-EG', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'الآن'}
            </span>
            {isPreviewMode && (
              <span style={{ color: '#d97706', fontWeight: 800 }}>
                (وضع المعاينة الإدارية)
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="central-notif-actions">
          {activeNotification.url && activeNotification.url !== '/' && (
            <button
              type="button"
              className="central-notif-btn-link"
              onClick={() => handleDismiss(activeNotification.url)}
            >
              <i className="fas fa-external-link-alt"></i>
              <span>الانتقال إلى التفاصيل / الرابط 🔗</span>
            </button>
          )}

          <button
            type="button"
            className={`central-notif-btn-confirm theme-${theme}`}
            onClick={() => handleDismiss()}
          >
            <i className="fas fa-check-circle"></i>
            <span>تمت المشاهدة وفهم التنبيه ✓</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CentralNotificationModal;
