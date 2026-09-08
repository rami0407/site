import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  increment, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { sanitizeText } from '../utils/security';

// Default starter stars representing Musheirifa's spirit of gratitude
const DEFAULT_STARS = [
  {
    id: 'star-1',
    recipientName: 'أ. رامي ارفاعية (مدير المدرسة)',
    recipientRole: 'management',
    senderName: 'مجلس الطلاب المدرسي',
    senderRole: 'student',
    senderClass: 'الصف السادس (أ)',
    color: 'gold', // gold, teal, pink, purple, emerald
    message: 'شكراً لمديرنا الفاضل على قيادته الحكيمة، ودعمه الدائم لكل فكرة جديدة ومبادرة تصنع من مدرستنا بيتاً ثانياً دافئاً ومنبعاً للتميز! ✨',
    likesCount: 68,
    x: 20, // percentage position
    y: 25,
    size: 32,
    createdAt: new Date().toISOString()
  },
  {
    id: 'star-2',
    recipientName: 'المعلمة مريم محاجنة',
    recipientRole: 'teacher',
    senderName: 'الطالبة آية إغبارية',
    senderRole: 'student',
    senderClass: 'الصف الرابع (ب)',
    color: 'teal',
    message: 'معلمتي الغالية مريم، شكراً على صبرك وابتسامتك الدائمة التي تجعل حصة اللغة العربية رحلة ممتعة، وتزرع في قلوبنا حب القراءة والتعلم 💖',
    likesCount: 45,
    x: 45,
    y: 35,
    size: 28,
    createdAt: new Date().toISOString()
  },
  {
    id: 'star-3',
    recipientName: 'المعلم أحمد جبارين',
    recipientRole: 'teacher',
    senderName: 'ولي الأمر أبو يوسف',
    senderRole: 'parent',
    senderClass: 'الصف الخامس (أ)',
    color: 'emerald',
    message: 'بارك الله في جهودك وأمانتك في تعليم مادة الرياضيات وتفانيك في مساعدة أبنائنا وتجاوز كل الصعوبات. جزاك الله خيراً يا أستاذنا القدير.',
    likesCount: 39,
    x: 75,
    y: 20,
    size: 26,
    createdAt: new Date().toISOString()
  },
  {
    id: 'star-4',
    recipientName: 'صديقي وزميلي محمد إغبارية',
    recipientRole: 'peer',
    senderName: 'أمير محاميد',
    senderRole: 'student',
    senderClass: 'الصف الثالث (أ)',
    color: 'pink',
    message: 'شكراً لأنك ساعدتني وشجعتني في تدريبات مسرح الدمى، وكنت دائماً صديقاً مخلصاً ومتعاوناً 🤝🌟',
    likesCount: 31,
    x: 30,
    y: 65,
    size: 24,
    createdAt: new Date().toISOString()
  },
  {
    id: 'star-5',
    recipientName: 'المستشارة التربوية',
    recipientRole: 'management',
    senderName: 'أم كنان',
    senderRole: 'parent',
    senderClass: 'الصف الثاني (ب)',
    color: 'purple',
    message: 'شكراً للمستشارة على استماعها الطيب ونصائحها التربوية القيمة ودعمها النفسي المستمر لأبنائنا في كل موقف.',
    likesCount: 52,
    x: 82,
    y: 55,
    size: 28,
    createdAt: new Date().toISOString()
  },
  {
    id: 'star-6',
    recipientName: 'حارس المدرسة العم أبو خالد',
    recipientRole: 'staff',
    senderName: 'طلاب الصف الخامس',
    senderRole: 'student',
    senderClass: 'الصف الخامس',
    color: 'emerald',
    message: 'شكراً لعمنا الحارس على ابتسامتك وترحيبك بنا كل صباح عند البوابة وحرصك على أمننا وسلامتنا في كل الأيام 🛡️❤️',
    likesCount: 61,
    x: 60,
    y: 75,
    size: 26,
    createdAt: new Date().toISOString()
  }
];

const STAR_COLORS = {
  gold: {
    name: 'ذهبية (إلهام وإتقان)',
    hex: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.8)',
    badgeBg: '#78350f',
    badgeText: '#fde68a',
    icon: '🌟'
  },
  teal: {
    name: 'تركوازية (صداقة ومحبة)',
    hex: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.8)',
    badgeBg: '#164e63',
    badgeText: '#a5f3fc',
    icon: '💎'
  },
  pink: {
    name: 'وردية (امتنان وعرفان)',
    hex: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.8)',
    badgeBg: '#831843',
    badgeText: '#fbcfe8',
    icon: '💖'
  },
  purple: {
    name: 'بنفسجية (ريادة وإبداع)',
    hex: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.8)',
    badgeBg: '#581c87',
    badgeText: '#e9d5ff',
    icon: '🔮'
  },
  emerald: {
    name: 'زمردية (عطاء ووفاء)',
    hex: '#10b981',
    glow: 'rgba(16, 185, 129, 0.8)',
    badgeBg: '#064e3b',
    badgeText: '#a7f3d0',
    icon: '🌿'
  }
};

// Distribute stars evenly and organically across the sky so they never overlap
const distributeStarCoordinates = (items) => {
  const total = items.length;
  if (total === 0) return [];

  const cols = Math.max(3, Math.min(8, Math.ceil(Math.sqrt(total * 1.5))));
  const rows = Math.max(2, Math.ceil(total / cols));

  const xSpacing = 72 / Math.max(1, cols - 1);
  const ySpacing = 56 / Math.max(1, rows - 1);

  return items.map((item, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;

    // Organic offset using deterministic pseudo-random seeded by idx
    const offsetX = ((idx * 19) % 13) - 6;
    const offsetY = ((idx * 29) % 11) - 5;

    const computedX = Math.round(Math.min(88, Math.max(12, 14 + (col * xSpacing) + offsetX)));
    const computedY = Math.round(Math.min(78, Math.max(18, 20 + (row * ySpacing) + offsetY)));

    return {
      ...item,
      x: computedX,
      y: computedY,
      size: item.size || (Math.floor((idx * 5) % 8) + 26)
    };
  });
};

const GratitudeSkyPage = () => {
  const [stars, setStars] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_gratitude_stars_v2');
      return cached ? JSON.parse(cached) : DEFAULT_STARS;
    } catch {
      return DEFAULT_STARS;
    }
  });
  const [activeCategory, setActiveCategory] = useState('all'); // all, teacher, peer, management, staff, messages_only
  const [selectedStar, setSelectedStar] = useState(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('sky'); // 'sky' or 'cards'
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [likedStarIds, setLikedStarIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('liked_gratitude_stars') || '[]');
    } catch {
      return [];
    }
  });

  // Sound chime toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Form State
  const [recipientName, setRecipientName] = useState('');
  const [recipientRole, setRecipientRole] = useState('teacher');
  const [senderName, setSenderName] = useState('');
  const [senderRole, setSenderRole] = useState('student');
  const [senderClass, setSenderClass] = useState('الصف الرابع (أ)');
  const [message, setMessage] = useState('');
  const [starColor, setStarColor] = useState('gold');
  const [isLaunching, setIsLaunching] = useState(false);

  // Canvas Starfield Ref
  const canvasRef = useRef(null);

  // Web Audio Chime Generator
  const playChimeSound = (freq = 880) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  // Live Multi-Collection Real-time Firestore Listener
  useEffect(() => {
    let listStars = [];
    let listMessages = [];

    const mergeAndSetStars = () => {
      // 1. Convert messages to star items
      const convertedMessages = listMessages.map((m, idx) => {
        let createdIso = new Date().toISOString();
        if (m.timestamp) {
          if (typeof m.timestamp.toDate === 'function') {
            createdIso = m.timestamp.toDate().toISOString();
          } else if (m.timestamp.seconds) {
            createdIso = new Date(m.timestamp.seconds * 1000).toISOString();
          }
        }
        return {
          id: `msg_${m.id}`,
          originalMessageId: m.id,
          recipientName: m.receiver || 'طاقم ومعلمي المدرسة',
          recipientRole: 'teacher',
          senderName: m.sender || 'طالب/ولي أمر',
          senderRole: 'student',
          senderClass: 'مبادرة امتنان 💐',
          color: idx % 2 === 0 ? 'pink' : 'teal',
          message: m.text || (m.audioData ? '🎤 رسالة صوتية مسجلة' : 'رسالة شكر وامتنان'),
          audioData: m.audioData || null,
          likesCount: m.likes || (m.reactionCounts ? Object.values(m.reactionCounts).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) : 1) || 1,
          createdAt: createdIso,
          isFromMessagesApp: true
        };
      });

      // 2. Combine all cloud items
      const combined = [...listStars, ...convertedMessages];

      // 3. Keep baseline starter stars that aren't duplicated
      const baseStarsToAdd = DEFAULT_STARS.filter(def => 
        !combined.some(c => c.recipientName === def.recipientName && c.senderName === def.senderName)
      );

      const allMerged = [...combined, ...baseStarsToAdd];

      // 4. Sort newest first
      allMerged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      // 5. Assign organic distributed celestial coordinates so no stars overlap
      const positioned = distributeStarCoordinates(allMerged);
      setStars(positioned);
      setLastSyncTime(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));

      // Cache locally
      try {
        localStorage.setItem('cached_gratitude_stars_v2', JSON.stringify(positioned));
      } catch (e) {}
    };

    // Listener 1: gratitude_stars collection
    let unsubStars = () => {};
    try {
      unsubStars = onSnapshot(collection(db, 'gratitude_stars'), (snapshot) => {
        listStars = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        mergeAndSetStars();
      }, (err) => {
        console.warn("gratitude_stars listener fallback:", err);
        mergeAndSetStars();
      });
    } catch (e) {
      console.warn("gratitude_stars setup error:", e);
    }

    // Listener 2: messages collection (from Emtnan app)
    let unsubMessages = () => {};
    try {
      unsubMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
        listMessages = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        mergeAndSetStars();
      }, (err) => {
        console.warn("messages listener fallback:", err);
        mergeAndSetStars();
      });
    } catch (e) {
      console.warn("messages setup error:", e);
    }

    return () => {
      unsubStars();
      unsubMessages();
    };
  }, []);

  // Manual Re-sync Handler
  const handleManualSync = async () => {
    setIsSyncing(true);
    playChimeSound(1000);
    try {
      const snapStars = await getDocs(collection(db, 'gratitude_stars'));
      const snapMsgs = await getDocs(collection(db, 'messages'));

      const cloudStars = snapStars.docs.map(d => ({ id: d.id, ...d.data() }));
      const cloudMsgs = snapMsgs.docs.map((m, idx) => ({
        id: `msg_${m.id}`,
        originalMessageId: m.id,
        recipientName: m.data().receiver || 'طاقم المدرسة',
        recipientRole: 'teacher',
        senderName: m.data().sender || 'فاعل خير',
        senderRole: 'student',
        senderClass: 'مبادرة امتنان 💐',
        color: idx % 2 === 0 ? 'pink' : 'teal',
        message: m.data().text || (m.data().audioData ? '🎤 رسالة صوتية مسجلة' : 'رسالة شكر وامتنان'),
        audioData: m.data().audioData || null,
        likesCount: m.data().likes || 1,
        createdAt: new Date().toISOString(),
        isFromMessagesApp: true
      }));

      const combined = [...cloudStars, ...cloudMsgs];
      const baseStarsToAdd = DEFAULT_STARS.filter(def => 
        !combined.some(c => c.recipientName === def.recipientName && c.senderName === def.senderName)
      );
      const allMerged = [...combined, ...baseStarsToAdd];
      allMerged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const positioned = distributeStarCoordinates(allMerged);
      setStars(positioned);
      setLastSyncTime(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
      localStorage.setItem('cached_gratitude_stars_v2', JSON.stringify(positioned));
      alert(`✨ تم تحديث وحتلنة سماء الامتنان بنجاح! تم تحميل ${positioned.length} نجمة ورسالة شكر.`);
    } catch (err) {
      console.warn("Manual sync error:", err);
      alert('تم تحديث البيانات من الذاكرة المؤقتة!');
    } finally {
      setIsSyncing(false);
    }
  };

  // Canvas Ambient Stars Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create 150 background twinkling particles
    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
      increasing: Math.random() > 0.5
    }));

    // Shooting stars
    const shootingStars = [];
    const createShootingStar = () => {
      if (Math.random() < 0.03 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * width * 0.8,
          y: Math.random() * height * 0.4,
          len: Math.random() * 80 + 40,
          speed: Math.random() * 8 + 6,
          angle: (Math.PI / 4) + (Math.random() * 0.2 - 0.1),
          alpha: 1
        });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep Cosmic Gradient
      const gradient = ctx.createRadialGradient(
        width / 2, height, 50,
        width / 2, height / 2, Math.max(width, height)
      );
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(0.5, '#060913');
      gradient.addColorStop(1, '#020617');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw Twinkling Background Particles
      particles.forEach((p) => {
        if (p.increasing) {
          p.alpha += p.speed;
          if (p.alpha >= 1) p.increasing = false;
        } else {
          p.alpha -= p.speed;
          if (p.alpha <= 0.2) p.increasing = true;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.85})`;
        ctx.fill();
      });

      // Draw Shooting Stars
      createShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(
          s.x + Math.cos(s.angle) * s.len,
          s.y + Math.sin(s.angle) * s.len
        );
        ctx.strokeStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();

        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.alpha -= 0.02;

        if (s.alpha <= 0) {
          shootingStars.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Filter Stars & Messages
  const filteredStars = stars.filter((s) => {
    if (activeCategory === 'messages_only' && !s.isFromMessagesApp) {
      return false;
    }
    if (activeCategory !== 'all' && activeCategory !== 'messages_only' && s.recipientRole !== activeCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const rName = (s.recipientName || '').toLowerCase();
      const sName = (s.senderName || '').toLowerCase();
      const msg = (s.message || '').toLowerCase();
      if (!rName.includes(q) && !sName.includes(q) && !msg.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Handle Like/Boost Star or Message
  const handleBoostStar = async (e, star) => {
    e.stopPropagation();
    if (likedStarIds.includes(star.id)) return;

    playChimeSound(1200);

    const updatedLikes = [...likedStarIds, star.id];
    setLikedStarIds(updatedLikes);
    localStorage.setItem('liked_gratitude_stars', JSON.stringify(updatedLikes));

    // Update state locally immediately
    setStars(prev => prev.map(s => s.id === star.id ? { ...s, likesCount: (s.likesCount || 0) + 1 } : s));
    if (selectedStar && selectedStar.id === star.id) {
      setSelectedStar(prev => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
    }

    try {
      if (star.isFromMessagesApp && star.originalMessageId) {
        const msgRef = doc(db, 'messages', star.originalMessageId);
        await updateDoc(msgRef, { likes: increment(1) });
      } else if (!star.id.startsWith('star-')) {
        const starRef = doc(db, 'gratitude_stars', star.id);
        await updateDoc(starRef, { likesCount: increment(1) });
      }
    } catch (err) {
      console.warn("Could not sync like to cloud:", err);
    }
  };

  // Launch New Star
  const handleLaunchStar = async (e) => {
    e.preventDefault();
    if (!recipientName.trim() || !message.trim() || !senderName.trim()) {
      alert('يرجى تعبئة جميع الحقول لإطلاق نجمتك!');
      return;
    }

    setIsLaunching(true);

    // Random sky placement avoiding edges
    const randX = Math.floor(Math.random() * 75) + 12;
    const randY = Math.floor(Math.random() * 60) + 20;

    const newStarObj = {
      recipientName: sanitizeText(recipientName.trim()),
      recipientRole,
      senderName: sanitizeText(senderName.trim()),
      senderRole,
      senderClass: sanitizeText(senderClass),
      color: starColor,
      message: sanitizeText(message.trim()),
      likesCount: 1,
      x: randX,
      y: randY,
      size: Math.floor(Math.random() * 6) + 26,
      createdAt: new Date().toISOString()
    };

    try {
      playChimeSound(1050);
      await addDoc(collection(db, 'gratitude_stars'), newStarObj);
      setShowLaunchModal(false);
      setRecipientName('');
      setMessage('');
      setSenderName('');
      alert('🌟 تم إطلاق نجمتك اللامعة في سماء مشيرفة بنجاح! شكراً لنشر المحبة والامتنان.');
    } catch (err) {
      console.error('Error launching star:', err);
      setStars(prev => [newStarObj, ...prev]);
      setShowLaunchModal(false);
      alert('🌟 تم إطلاق نجمتك وحفظها محلياً بنجاح!');
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', color: 'white', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
      
      {/* Background Animated Starfield Canvas */}
      <canvas 
        ref={canvasRef} 
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
      />

      {/* Top Floating Header & Nav */}
      <header style={{
        position: 'relative',
        zIndex: 20,
        padding: '1.5rem 1.5rem 0.5rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '24px',
          padding: '1.25rem 2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5)'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '0.25rem 0.85rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, color: '#fcd34d', marginBottom: '0.4rem' }}>
              <span>مشروع امتنان • عام التميز 2026/2027</span>
              <span>✨</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>سماء الامتنان والنجوم المضيئة</span>
              <span style={{ fontSize: '1.5rem' }}>🌌🌟</span>
            </h1>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
              كل نجمة في هذه السماء هي رسالة شكر وإطراء مهداة لمعلم، زميل، أو إدارة مدرسة مشيرفة
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                playChimeSound(950);
                setShowLaunchModal(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                color: '#0f172a',
                border: 'none',
                padding: '0.75rem 1.3rem',
                borderRadius: '16px',
                fontWeight: 900,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 0 25px rgba(245, 158, 11, 0.4)',
                transition: 'transform 0.2s ease'
              }}
            >
              <span>أطلق نجمتك في السماء 🌟</span>
            </button>

            {/* View Mode Toggle: Sky vs Cards */}
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '4px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <button
                type="button"
                onClick={() => setViewMode('sky')}
                style={{
                  background: viewMode === 'sky' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                  color: viewMode === 'sky' ? 'white' : '#cbd5e1',
                  border: 'none',
                  padding: '0.55rem 0.9rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🌌 سماء النجوم</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  background: viewMode === 'cards' ? 'linear-gradient(135deg, #ec4899, #be185d)' : 'transparent',
                  color: viewMode === 'cards' ? 'white' : '#cbd5e1',
                  border: 'none',
                  padding: '0.55rem 0.9rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>💌 بطاقات ورسائل ({stars.length})</span>
              </button>
            </div>

            {/* Manual Live Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '0.65rem 0.95rem',
                borderRadius: '14px',
                cursor: isSyncing ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="تحديث وحتلنة جميع النجوم ورسائل الشكر فورياً"
            >
              <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin' : ''}`} style={{ color: '#38bdf8' }}></i>
              <span>{isSyncing ? 'جاري الحتلنة...' : 'حتلنة وتحديث 🔄'}</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '0.65rem',
                borderRadius: '14px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
              title={soundEnabled ? 'كتم الرنين الصوتي' : 'تشغيل الرنين الصوتي'}
            >
              <i className={`fas ${soundEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
            </button>

            <a
              href="#home"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                textDecoration: 'none',
                padding: '0.65rem 1rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.85rem'
              }}
            >
              الرئيسية 🏠
            </a>
          </div>
        </div>

        {/* Filter Category Tabs & Search */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.85rem',
          marginTop: '1rem',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(10px)',
          padding: '0.65rem 1rem',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {/* Categories */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'كل النجوم والرسائل 🌌', count: stars.length },
              { id: 'teacher', label: 'المعلمون 👨‍🏫', count: stars.filter(s => s.recipientRole === 'teacher').length },
              { id: 'peer', label: 'الزملاء والأصدقاء 🤝', count: stars.filter(s => s.recipientRole === 'peer').length },
              { id: 'management', label: 'الإدارة 🏛️', count: stars.filter(s => s.recipientRole === 'management').length },
              { id: 'staff', label: 'طاقم المدرسة 🌿', count: stars.filter(s => s.recipientRole === 'staff').length },
              { id: 'messages_only', label: 'رسائل امتنان صوتية ومكتوبة 💌', count: stars.filter(s => s.isFromMessagesApp).length }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  background: activeCategory === cat.id ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(255, 255, 255, 0.06)',
                  color: activeCategory === cat.id ? 'white' : '#cbd5e1',
                  border: activeCategory === cat.id ? '1px solid #38bdf8' : '1px solid transparent',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <i className="fas fa-search" style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.8rem' }}></i>
            <input
              type="text"
              placeholder="ابحث عن نجمة أو رسالة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'white',
                padding: '0.45rem 2.2rem 0.45rem 0.85rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                outline: 'none'
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content: Cards Grid Mode OR Celestial Interactive Sky Mode */}
      {viewMode === 'cards' ? (
        <main style={{ position: 'relative', zIndex: 10, width: '100%', minHeight: '75vh', padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span>💌 جدار رسائل الشكر وبطاقات الامتنان</span>
                <span style={{ fontSize: '0.85rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '0.2rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  {filteredStars.length} بطاقة معتمدة
                </span>
              </h3>
              <p style={{ margin: '0.35rem 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>
                تصفح جميع كلمات التقدير والإطراء المهداة لمعلمي وطلاب وإدارة مدرسة مشيرفة
              </p>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#38bdf8', background: 'rgba(15, 23, 42, 0.7)', padding: '0.4rem 0.85rem', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              ⚡ متزامن لحظياً • {lastSyncTime ? `آخر تحديث: ${lastSyncTime}` : 'محدث الآن'}
            </div>
          </div>

          {filteredStars.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.2)' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>✨</span>
              <h4 style={{ margin: '0 0 0.5rem', color: 'white' }}>لا توجد رسائل مطابقة لبحثك</h4>
              <p style={{ color: '#94a3b8', margin: 0 }}>جرب تغيير تصنيف البحث أو كن أول من يطلق نجمة جديدة!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.4rem' }}>
              {filteredStars.map((star) => {
                const colorMeta = STAR_COLORS[star.color] || STAR_COLORS.gold;
                const isLiked = likedStarIds.includes(star.id);
                return (
                  <div 
                    key={star.id}
                    style={{
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%)',
                      border: `1.5px solid ${colorMeta.hex}55`,
                      borderRadius: '22px',
                      padding: '1.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: `0 8px 25px rgba(0,0,0,0.4), 0 0 15px ${colorMeta.glow}22`,
                      backdropFilter: 'blur(10px)',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Card Top */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: `${colorMeta.hex}22`,
                            border: `1px solid ${colorMeta.hex}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.3rem',
                            filter: `drop-shadow(0 0 8px ${colorMeta.hex})`
                          }}>
                            {colorMeta.icon}
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, display: 'block' }}>مهداة إلى:</span>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'white' }}>{star.recipientName}</h4>
                          </div>
                        </div>

                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.65rem',
                          borderRadius: '20px',
                          background: colorMeta.badgeBg,
                          color: colorMeta.badgeText,
                          border: `1px solid ${colorMeta.hex}44`
                        }}>
                          {colorMeta.name.split(' ')[0]}
                        </span>
                      </div>

                      {/* Message Text */}
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '1rem 1.1rem',
                        fontSize: '0.95rem',
                        lineHeight: '1.7',
                        color: '#e2e8f0',
                        fontWeight: 600,
                        marginBottom: '1rem'
                      }}>
                        "{star.message}"
                      </div>

                      {/* Voice Note Player if available */}
                      {star.audioData && (
                        <div style={{ marginBottom: '1rem', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid #06b6d4', borderRadius: '12px', padding: '0.6rem' }}>
                          <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800, marginBottom: '0.35rem' }}>
                            🎙️ رسالة صوتية مرفقة:
                          </div>
                          <audio controls src={star.audioData} style={{ width: '100%', height: '36px' }} />
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>من:</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>
                          {star.senderName} {star.senderClass ? `(${star.senderClass})` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => handleBoostStar(e, star)}
                          style={{
                            background: isLiked ? 'linear-gradient(135deg, #f43f5e, #be123c)' : 'rgba(244, 63, 94, 0.15)',
                            color: isLiked ? 'white' : '#fda4af',
                            border: '1px solid #f43f5e',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '10px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <i className="fas fa-heart"></i>
                          <span>{star.likesCount || 1}</span>
                        </button>

                        <button
                          onClick={() => {
                            playChimeSound(1100);
                            setSelectedStar(star);
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '10px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="عرض تفاصيل النجمة بالكامل"
                        >
                          <i className="fas fa-expand-alt"></i>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </main>
      ) : (
        /* Main Celestial Sky Field */
        <main style={{ position: 'relative', zIndex: 10, width: '100%', minHeight: '75vh', padding: '1rem' }}>
          
          {/* Constellation Decorative Lines (Connecting stars softly) */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            <defs>
              <linearGradient id="constellationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {filteredStars.slice(0, Math.min(filteredStars.length, 12)).map((s, idx, arr) => {
              if (idx === arr.length - 1) return null;
              const next = arr[idx + 1];
              return (
                <line
                  key={`line-${s.id}`}
                  x1={`${s.x}%`}
                  y1={`${s.y}%`}
                  x2={`${next.x}%`}
                  y2={`${next.y}%`}
                  stroke="url(#constellationGrad)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>

          {/* Render Interactive Glowing Stars */}
          {filteredStars.map((star) => {
            const colorMeta = STAR_COLORS[star.color] || STAR_COLORS.gold;
            const isLiked = likedStarIds.includes(star.id);

            return (
              <div
                key={star.id}
                onClick={() => {
                  playChimeSound(1100);
                  setSelectedStar(star);
                }}
                style={{
                  position: 'absolute',
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: 5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                className="gratitude-star-item"
              >
                {/* Pulsing Star Core */}
                <div style={{
                  position: 'relative',
                  width: `${star.size || 28}px`,
                  height: `${star.size || 28}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${(star.size || 28) * 0.85}px`,
                  filter: `drop-shadow(0 0 16px ${colorMeta.hex}) drop-shadow(0 0 30px ${colorMeta.glow})`,
                  animation: 'pulseTwinkle 3s infinite ease-in-out'
                }}>
                  {colorMeta.icon}

                  {/* Ambient Aura Ring */}
                  <span style={{
                    position: 'absolute',
                    inset: '-6px',
                    borderRadius: '50%',
                    border: `1px solid ${colorMeta.hex}`,
                    opacity: 0.4,
                    animation: 'pingRing 3s infinite cubic-bezier(0, 0, 0.2, 1)'
                  }}></span>
                </div>

                {/* Hovering Recipient Label */}
                <div style={{
                  marginTop: '0.4rem',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${colorMeta.hex}`,
                  borderRadius: '20px',
                  padding: '0.2rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  boxShadow: `0 4px 12px rgba(0,0,0,0.5)`,
                  pointerEvents: 'none'
                }}>
                  {star.recipientName}
                </div>

                {/* Likes Badge */}
                <div style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: isLiked ? '#f43f5e' : '#94a3b8',
                  marginTop: '0.15rem'
                }}>
                  <i className="fas fa-heart" style={{ fontSize: '0.6rem', marginLeft: '0.2rem' }}></i>
                  {star.likesCount || 1}
                </div>
              </div>
            );
          })}

        </main>
      )}

      {/* STAR DETAIL MODAL (بطاقة تفاصيل النجمة) */}
      {selectedStar && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: `2px solid ${(STAR_COLORS[selectedStar.color] || STAR_COLORS.gold).hex}`,
            borderRadius: '28px',
            maxWidth: '540px',
            width: '100%',
            padding: '2rem',
            boxShadow: `0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 40px ${(STAR_COLORS[selectedStar.color] || STAR_COLORS.gold).glow}`,
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedStar(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                left: '1.25rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 900
              }}
            >
              ✕
            </button>

            {/* Star Icon Badge */}
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{
                fontSize: '3.5rem',
                filter: `drop-shadow(0 0 25px ${(STAR_COLORS[selectedStar.color] || STAR_COLORS.gold).hex})`
              }}>
                {(STAR_COLORS[selectedStar.color] || STAR_COLORS.gold).icon}
              </div>
              <span style={{
                background: (STAR_COLORS[selectedStar.color] || STAR_COLORS.gold).badgeBg,
                color: (STAR_COLORS[selectedStar.color] || STAR_COLORS.gold).badgeText,
                padding: '0.25rem 0.85rem',
                borderRadius: '50px',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'inline-block',
                marginTop: '0.5rem'
              }}>
                {(STAR_COLORS[selectedStar.color] || STAR_COLORS.gold).name}
              </span>
            </div>

            {/* To Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>مهداة بمحبة وتقدير إلى:</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', margin: '0.2rem 0' }}>
                {selectedStar.recipientName}
              </h2>
            </div>

            {/* Message Body */}
            <div style={{
              background: 'rgba(2, 6, 23, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '1.4rem',
              fontSize: '1.05rem',
              lineHeight: 1.8,
              color: '#f1f5f9',
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: '1.5rem',
              position: 'relative'
            }}>
              <span style={{ fontSize: '1.5rem', opacity: 0.3, display: 'block', marginBottom: '-0.5rem' }}>❝</span>
              {selectedStar.message}
              <span style={{ fontSize: '1.5rem', opacity: 0.3, display: 'block', marginTop: '-0.5rem' }}>❞</span>
            </div>

            {/* Audio Voice Player if available */}
            {selectedStar.audioData && (
              <div style={{
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid #06b6d4',
                borderRadius: '16px',
                padding: '0.85rem',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 800, marginBottom: '0.5rem' }}>
                  🎙️ استمع إلى الرسالة الصوتية المسجلة:
                </div>
                <audio controls src={selectedStar.audioData} style={{ width: '100%', height: '40px' }} />
              </div>
            )}

            {/* From Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>مرسلة من:</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#38bdf8' }}>
                  {selectedStar.senderName} {selectedStar.senderClass ? `(${selectedStar.senderClass})` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={(e) => handleBoostStar(e, selectedStar)}
                  style={{
                    background: likedStarIds.includes(selectedStar.id) 
                      ? 'linear-gradient(135deg, #f43f5e, #be123c)' 
                      : 'rgba(244, 63, 94, 0.15)',
                    color: 'white',
                    border: '1px solid #f43f5e',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '14px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: likedStarIds.includes(selectedStar.id) ? '0 4px 14px rgba(244, 63, 94, 0.4)' : 'none'
                  }}
                >
                  <i className="fas fa-heart"></i>
                  <span>{likedStarIds.includes(selectedStar.id) ? 'زدت بريقها ✨' : 'زد بريق النجمة (+1)'}</span>
                  <strong>({selectedStar.likesCount || 1})</strong>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* LAUNCH A STAR MODAL (إطلاق نجمة جديدة) */}
      {showLaunchModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '2px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '28px',
            maxWidth: '560px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 158, 11, 0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🌟 أطلق نجمة امتنان في سماء المدرسة</span>
              </h3>
              <button
                onClick={() => setShowLaunchModal(false)}
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: 'white', cursor: 'pointer', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLaunchStar}>
              {/* Recipient */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: '#fcd34d', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  1. لمن تهدي هذه النجمة؟ (اسم المعلم، الزميل، أو الإدارة) *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: المعلمة مريم، الأستاذ رامي، زميلي محمد..."
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)', color: 'white', fontWeight: 700, outline: 'none' }}
                />
              </div>

              {/* Recipient Category */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  تصنيف النجمة:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
                  {[
                    { id: 'teacher', label: 'معلم ملهم 👨‍🏫' },
                    { id: 'peer', label: 'زميل رائع 🤝' },
                    { id: 'management', label: 'إدارة المدرسة 🏛️' },
                    { id: 'staff', label: 'طاقم وعاملين 🌿' }
                  ].map(c => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setRecipientRole(c.id)}
                      style={{
                        background: recipientRole === c.id ? '#0284c7' : 'rgba(255,255,255,0.06)',
                        color: recipientRole === c.id ? 'white' : '#cbd5e1',
                        border: recipientRole === c.id ? '1px solid #38bdf8' : '1px solid transparent',
                        padding: '0.5rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Color Theme */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  اختر لون وطاقة النجمة:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  {Object.entries(STAR_COLORS).map(([k, v]) => (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setStarColor(k)}
                      style={{
                        background: starColor === k ? v.hex : 'rgba(255,255,255,0.05)',
                        color: starColor === k ? '#0f172a' : 'white',
                        border: `2px solid ${v.hex}`,
                        padding: '0.5rem 0.2rem',
                        borderRadius: '12px',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      <span>{v.icon}</span>
                      <span style={{ fontSize: '0.65rem' }}>{k === 'gold' ? 'ذهبي' : k === 'teal' ? 'تركواز' : k === 'pink' ? 'وردي' : k === 'purple' ? 'بنفسج' : 'زمرد'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    اسمك (المرسل) *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد إغبارية"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)', color: 'white', fontWeight: 700, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    الصف أو الصفة:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: الرابع أ / ولي أمر"
                    value={senderClass}
                    onChange={(e) => setSenderClass(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)', color: 'white', fontWeight: 700, outline: 'none' }}
                  />
                </div>
              </div>

              {/* Gratitude Message */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: '#fcd34d', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  رسالة الشكر والإطراء من القلب *:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="اكتب كلماتك الطيبة والصادقة التي ستنير هذه النجمة في سماء المدرسة..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)', color: 'white', fontWeight: 600, fontSize: '0.9rem', outline: 'none', lineHeight: 1.6 }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLaunching}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                  color: '#0f172a',
                  border: 'none',
                  padding: '0.95rem',
                  borderRadius: '16px',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  cursor: isLaunching ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 0 30px rgba(245, 158, 11, 0.4)'
                }}
              >
                <span>{isLaunching ? 'جاري إطلاق النجمة...' : '🚀 أطلق النجمة لتتألق في سماء مشيرفة الآن'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Styles for Cosmic Animations */}
      <style>{`
        @keyframes pulseTwinkle {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 10px currentColor);
          }
          50% {
            transform: scale(1.15);
            filter: drop-shadow(0 0 24px currentColor) drop-shadow(0 0 40px currentColor);
          }
        }
        @keyframes pingRing {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        .gratitude-star-item:hover {
          transform: translate(-50%, -50%) scale(1.25) !important;
          z-index: 50 !important;
        }
      `}</style>

    </div>
  );
};

export default GratitudeSkyPage;
