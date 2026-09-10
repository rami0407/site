import React, { useState, useEffect, useRef } from 'react';
import './CentralNotificationModal.css';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { logNotificationView, getYouTubeEmbedUrl } from '../utils/notificationService';

// Audio format helper (e.g. 65s -> 1:05)
const formatAudioTime = (secs) => {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// Pleasant subtle chime using Web Audio API
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

    // Gentle two-tone bell chime
    osc.frequency.setValueAtTime(1046.5, now);
    osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  } catch (e) {
    // Audio autoplay restrictions handled
  }
};

const CentralNotificationModal = () => {
  const [activeNotification, setActiveNotification] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const hasTriggeredRef = useRef(false);

  // Custom Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef(null);

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
        if (!candidate && data.popupInCenter !== false && data.active !== false) {
          candidate = data;
        }
      });

      if (candidate) {
        const ackKey = `ack_central_${candidate.id}_${candidate.forceReshowKey || 'v1'}`;
        const alreadyAcked = localStorage.getItem(ackKey) === 'true';

        if (!alreadyAcked) {
          setActiveNotification(candidate);
          setIsPreviewMode(false);
          setIsOpen(true);

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

  // Handle audio playback toggle
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => console.warn('Audio play prevented:', err));
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
        setAudioDuration(audioRef.current.duration);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioCurrentTime(0);
  };

  const handleAudioSeek = (e) => {
    const targetTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setAudioCurrentTime(targetTime);
    }
  };

  const handleDismiss = (navigateUrl = null) => {
    // Pause any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(false);

    if (activeNotification) {
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

  const theme = activeNotification.theme || (activeNotification.priority === 'urgent' ? 'red' : 'blue');
  
  let iconEmoji = '📢';
  if (activeNotification.audioUrl) iconEmoji = '🎙️';
  else if (activeNotification.videoUrl) iconEmoji = '🎬';
  else if (activeNotification.fileUrl) iconEmoji = '📎';
  else if (activeNotification.category === 'debate') iconEmoji = '⚖️';
  else if (activeNotification.category === 'event') iconEmoji = '📅';
  else if (activeNotification.category === 'news') iconEmoji = '📰';
  else if (theme === 'red') iconEmoji = '🚨';
  else if (theme === 'amber') iconEmoji = '🏆';
  else if (theme === 'emerald') iconEmoji = '🌿';

  let badgeText = 'تنبيه إداري هام';
  if (activeNotification.audioUrl) badgeText = '🎙️ رسالة صوتية مسجلة';
  else if (activeNotification.videoUrl) badgeText = '🎬 مقطع فيديو مرفق';
  else if (activeNotification.fileUrl) badgeText = '📎 ملف ومستند مرفق';
  else if (activeNotification.priority === 'urgent' || theme === 'red') badgeText = '🚨 تنبيه عاجل';
  else if (activeNotification.category === 'debate') badgeText = '⚖️ مناظرة الأسبوع الفكرية';
  else if (activeNotification.category === 'event') badgeText = '📅 فعالية مدرسية';
  else if (activeNotification.category === 'news') badgeText = '📰 خبر وإعلان مدرسي';

  const ytEmbedUrl = activeNotification.videoUrl ? getYouTubeEmbedUrl(activeNotification.videoUrl) : null;

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

          {/* 1. ATTACHED AUDIO VOICE NOTE */}
          {activeNotification.audioUrl && (
            <div className="central-audio-player-card">
              <audio 
                ref={audioRef} 
                src={activeNotification.audioUrl} 
                onTimeUpdate={handleAudioTimeUpdate} 
                onLoadedMetadata={handleAudioTimeUpdate}
                onEnded={handleAudioEnded} 
              />
              <div className="central-audio-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🎙️ رسالة صوتية من إدارة المدرسة</span>
                </div>
                <div className={`audio-waves-container ${isPlayingAudio ? 'playing' : ''}`}>
                  <div className="audio-wave-bar"></div>
                  <div className="audio-wave-bar"></div>
                  <div className="audio-wave-bar"></div>
                  <div className="audio-wave-bar"></div>
                </div>
              </div>

              <div className="central-audio-controls">
                <button
                  type="button"
                  className="central-audio-play-btn"
                  onClick={togglePlayAudio}
                  title={isPlayingAudio ? 'إيقاف مؤقت' : 'تشغيل الرسالة الصوتية'}
                >
                  <i className={`fas ${isPlayingAudio ? 'fa-pause' : 'fa-play'}`}></i>
                </button>

                <div className="central-audio-track-wrap">
                  <input 
                    type="range" 
                    min="0" 
                    max={audioDuration || 100} 
                    value={audioCurrentTime} 
                    onChange={handleAudioSeek} 
                    className="central-audio-slider" 
                  />
                  <div className="central-audio-time-row">
                    <span>{formatAudioTime(audioCurrentTime)}</span>
                    <span>{formatAudioTime(audioDuration || activeNotification.audioDuration || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ATTACHED VIDEO PLAYER (YOUTUBE OR NATIVE MP4) */}
          {activeNotification.videoUrl && (
            <div className="central-video-container">
              {ytEmbedUrl ? (
                <div className="central-video-iframe-wrap">
                  <iframe 
                    src={ytEmbedUrl} 
                    title="فيديو الإشعار" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                  />
                </div>
              ) : (
                <video 
                  controls 
                  playsInline 
                  preload="metadata" 
                  src={activeNotification.videoUrl} 
                  className="central-native-video" 
                />
              )}
            </div>
          )}

          {/* 3. ATTACHED FILE DOWNLOAD CARD */}
          {activeNotification.fileUrl && (
            <a 
              href={activeNotification.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              download 
              className="central-file-attachment-card"
            >
              <div className="central-file-info">
                <div className="central-file-icon">
                  <i className="fas fa-file-pdf"></i>
                </div>
                <div style={{ minWidth: 0 }}>
                  <span className="central-file-name">
                    {activeNotification.fileName || 'ملف ومستند مرفق'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                    انقر للفتح والتحميل المباشر
                  </span>
                </div>
              </div>

              <div className="central-file-action-badge">
                <i className="fas fa-download"></i>
                <span>تحميل الملف</span>
              </div>
            </a>
          )}

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
