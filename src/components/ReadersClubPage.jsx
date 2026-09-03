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

// Default starter reading logs celebrating Musheirifa students
const DEFAULT_READING_LOGS = [
  {
    id: 'log-1',
    studentName: 'سارة أحمد محاميد',
    studentClass: 'الصف الخامس (أ)',
    bookTitle: 'رحلة إلى مركز الأرض',
    author: 'جول فيرن',
    category: 'مغامرات وخيال علمي',
    rating: 5,
    takeaway: 'تعلمت أن الشجاعة والفضول العلمي يقودان الإنسان لاكتشاف أعظم أسرار الطبيعة.',
    favoriteCharacter: 'البروفيسور ليدنبروك',
    likesCount: 38,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'log-2',
    studentName: 'عمر كمال إغبارية',
    studentClass: 'الصف الرابع (ب)',
    bookTitle: 'حكايات كليلة ودمنة',
    author: 'ابن المقفع',
    category: 'قصص وعبر',
    rating: 5,
    takeaway: 'الحكمة وحسن التصرف والتفكير قبل الإقدام على الأمر أهم بكثير من القوة الجسدية.',
    favoriteCharacter: 'دمنة الحكيم',
    likesCount: 42,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'log-3',
    studentName: 'مريم يوسف جبارين',
    studentClass: 'الصف السادس (أ)',
    bookTitle: 'سر الكهف العجيب',
    author: 'يعقوب الشاروني',
    category: 'غموض واستكشاف',
    rating: 4,
    takeaway: 'العمل الجماعي والتعاون بين الأصدقاء يحل أصعب الألغاز والمشكلات.',
    favoriteCharacter: 'ماجد المستكشف',
    likesCount: 29,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    id: 'log-4',
    studentName: 'محمود رامي ارفاعية',
    studentClass: 'الصف الثالث (أ)',
    bookTitle: 'الشمس وكواكب المجموعة الشمسية',
    author: 'د. فاروق الباز',
    category: 'علوم وفضاء',
    rating: 5,
    takeaway: 'الفضاء واسع جداً وكوكب الأرض هو بيتنا الثمين الذي يجب أن نحافظ على بيئته.',
    favoriteCharacter: 'رائد الفضاء الصغير',
    likesCount: 51,
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString()
  },
  {
    id: 'log-5',
    studentName: 'نور الدين محاجنة',
    studentClass: 'الصف الرابع (أ)',
    bookTitle: 'بائعة الخبز الصغيرة',
    author: 'كامل كيلاني',
    category: 'قيم وإنسانيات',
    rating: 5,
    takeaway: 'الصبر والصدق في العمل يثمران دائماً احترام الناس والنجاح في الحياة.',
    favoriteCharacter: 'سلمى البطلة الصبورة',
    likesCount: 35,
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString()
  }
];

const ReadersClubPage = () => {
  const [logs, setLogs] = useState(DEFAULT_READING_LOGS);
  const [config, setConfig] = useState({
    targetGoal: 10,
    baseCount: 0,
    challengeTitle: 'تحدي رحلة العشر كتب 📚🎒 لكل طالب في مشيرفة',
    heroTitle: 'نادي القُرّاء • رحلة العشر كتب 📚✨',
    heroSubtitle: 'اقرأ 10 كتب وقصص ممتعة، واجمع محطات رحلتك خطوة بخطوة لتنال وسام التميز القرائي الذهبي!',
    featuredBookTitle: '',
    featuredBookAuthor: '',
    featuredBookWhy: ''
  });
  const [activeTab, setActiveTab] = useState('wall'); // 'wall', 'tree', 'hall-of-fame'
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certStudentName, setCertStudentName] = useState(localStorage.getItem('school_unified_student_name') || 'سارة أحمد محاميد');
  const [certStudentClass, setCertStudentClass] = useState('الصف الخامس (أ)');
  const [likedLogIds, setLikedLogIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('liked_reader_logs') || '[]');
    } catch {
      return [];
    }
  });

  // New Log Form State
  const [studentName, setStudentName] = useState(localStorage.getItem('school_unified_student_name') || '');
  const [studentGrade, setStudentGrade] = useState('الصف الرابع');
  const [studentSection, setStudentSection] = useState('أ');
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('قصص وعبر');
  const [rating, setRating] = useState(5);
  const [takeaway, setTakeaway] = useState('');
  const [favoriteCharacter, setFavoriteCharacter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio Chime Effect
  const playRewardChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, High C
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
      });
    } catch (e) {}
  };

  // Real-time Firestore sync
  useEffect(() => {
    const q = query(collection(db, 'readers_club_logs'), orderBy('createdAt', 'desc'));
    const unsubscribeLogs = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setLogs(list);
      } else {
        setLogs(DEFAULT_READING_LOGS);
      }
    }, (err) => {
      console.warn("Using offline reading logs:", err);
      setLogs(DEFAULT_READING_LOGS);
    });

    const unsubscribeConfig = onSnapshot(doc(db, 'readers_club_config', 'settings'), (snap) => {
      if (snap.exists()) {
        setConfig(prev => ({ ...prev, ...snap.data() }));
      }
    }, (err) => {
      console.warn("Using offline config:", err);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeConfig();
    };
  }, []);

  // Total books read metric
  const targetGoal = config.targetGoal || 1000;
  const baseCount = config.baseCount !== undefined ? config.baseCount : 345;
  const totalBooksRead = baseCount + logs.length;
  const progressPercent = Math.min(100, Math.round((totalBooksRead / targetGoal) * 100));

  // Filtered Logs
  const filteredLogs = logs.filter((item) => {
    if (selectedGradeFilter !== 'all' && !(item.studentClass || '').includes(selectedGradeFilter)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const bTitle = (item.bookTitle || '').toLowerCase();
      const sName = (item.studentName || '').toLowerCase();
      const tWay = (item.takeaway || '').toLowerCase();
      const auth = (item.author || '').toLowerCase();
      if (!bTitle.includes(q) && !sName.includes(q) && !tWay.includes(q) && !auth.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Handle Like Log
  const handleLikeLog = async (e, logItem) => {
    e.stopPropagation();
    if (likedLogIds.includes(logItem.id)) return;

    playRewardChime();
    const updated = [...likedLogIds, logItem.id];
    setLikedLogIds(updated);
    localStorage.setItem('liked_reader_logs', JSON.stringify(updated));

    try {
      const logRef = doc(db, 'readers_club_logs', logItem.id);
      await updateDoc(logRef, { likesCount: increment(1) });
    } catch {
      setLogs(prev => prev.map(l => l.id === logItem.id ? { ...l, likesCount: (l.likesCount || 0) + 1 } : l));
    }
  };

  // Submit New Book Log
  const handleSubmitBookLog = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !bookTitle.trim() || !takeaway.trim()) {
      alert('يرجى تعبئة الحقول المطلوبة لتسجيل كتابك بنجاح!');
      return;
    }

    setIsSubmitting(true);
    const combinedClass = `${studentGrade} (${studentSection})`;

    const newLogObj = {
      studentName: sanitizeText(studentName.trim()),
      studentClass: combinedClass,
      bookTitle: sanitizeText(bookTitle.trim()),
      author: sanitizeText(author.trim()) || 'غير محدد',
      category,
      rating: Number(rating),
      takeaway: sanitizeText(takeaway.trim()),
      favoriteCharacter: sanitizeText(favoriteCharacter.trim()) || 'شخصيات القصة',
      likesCount: 1,
      createdAt: new Date().toISOString()
    };

    try {
      playRewardChime();
      await addDoc(collection(db, 'readers_club_logs'), newLogObj);
      setShowAddLogModal(false);
      setBookTitle('');
      setAuthor('');
      setTakeaway('');
      setFavoriteCharacter('');
      alert('🎉 مبارك! تم تسجيل قراءتك ونمت ورقة ذهبية جديدة على شجرة قراء مشيرفة! 🌿📚');
    } catch (err) {
      console.error('Error saving reading log:', err);
      setLogs(prev => [newLogObj, ...prev]);
      setShowAddLogModal(false);
      alert('تم حفظ إنجازك القرائي محلياً بنجاح! 🌿');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student Leaderboard aggregation
  const studentLeaderboard = React.useMemo(() => {
    const map = {};
    logs.forEach(l => {
      const name = l.studentName || 'طالب قارئ';
      if (!map[name]) {
        map[name] = { name, sClass: l.studentClass, count: 0, likes: 0 };
      }
      map[name].count += 1;
      map[name].likes += (l.likesCount || 0);
    });
    return Object.values(map).sort((a, b) => b.count - a.count || b.likes - a.likes).slice(0, 10);
  }, [logs]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
      
      {/* Top Header Banner */}
      <header style={{
        background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #0f172a 100%)',
        color: 'white',
        padding: '2.5rem 1.5rem 4.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Decorative Rings */}
        <div style={{ position: 'absolute', right: '-80px', top: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', left: '-60px', bottom: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.08)', pointerEvents: 'none' }}></div>

        <div style={{ maxWidth: '1140px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          
          {/* Top Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <a 
              href="#home" 
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: 'white',
                padding: '0.45rem 1.2rem',
                borderRadius: '50px',
                fontSize: '0.85rem',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <i className="fas fa-arrow-right"></i>
              <span>العودة للرئيسية</span>
            </a>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '0.35rem 1rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 800, color: '#fef3c7' }}>
              <span>🏆 مبادرة أبطال القراءة • عام التميز 2026/2027</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
            <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 900, margin: '0 0 0.8rem 0', lineHeight: 1.2 }}>
              <span>{config.heroTitle || 'نادي القُرّاء وشجرة التميّز'}</span>
              <span style={{ marginRight: '0.5rem' }}>📚🌳✨</span>
            </h1>
            <p style={{ fontSize: '1.15rem', color: '#a7f3d0', fontWeight: 600, lineHeight: 1.7, margin: '0 0 2rem 0' }}>
              {config.heroSubtitle || 'في مدرسة مشيرفة، كل قصة تقرؤها تزرع فكرة وتُنبت ورقة خضراء على شجرة مدرستنا.. سجّل كتبك واجمع أوسمة التميز!'}
            </p>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowAddLogModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#0f172a',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '20px',
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(245, 158, 11, 0.5)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}
              >
                <i className="fas fa-book-reader" style={{ fontSize: '1.25rem' }}></i>
                <span>سجّل قصة قرأتها في رحلتك 🌿</span>
              </button>

              <button
                onClick={() => setShowCertificateModal(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(8px)',
                  padding: '1rem 1.8rem',
                  borderRadius: '20px',
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)'
                }}
              >
                <i className="fas fa-award" style={{ fontSize: '1.25rem', color: '#fcd34d' }}></i>
                <span>🏆 استخراج شهادة وجواز بطل العشر كتب</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Floating Collective Challenge Box - رحلة العشر كتب */}
      <section style={{ maxWidth: '1000px', margin: '-2.5rem auto 2.5rem', padding: '0 1.25rem', position: 'relative', zIndex: 20 }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '1.75rem 2rem',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.08)',
          border: '2px solid #a7f3d0',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '0.2rem 0.75rem', borderRadius: '50px' }}>
                مغامرة التميز القرائي 🎒📚
              </span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '0.4rem 0 0 0' }}>
                {config.challengeTitle || `تحدي رحلة العشر كتب لكل طالب بمشيرفة 🏆`}
              </h3>
            </div>

            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#047857' }}>
                {logs.length}
              </span>
              <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 700 }}> قصة مسجلة • الهدف: {targetGoal} كتب 👑</span>
            </div>
          </div>

          {/* 10-Books Visual Stepping Stones Roadmap */}
          <div style={{ position: 'relative', padding: '1rem 0.25rem' }}>
            <div style={{ position: 'absolute', top: '28px', left: '25px', right: '25px', height: '4px', background: '#e2e8f0', zIndex: 1 }}></div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '0.25rem', position: 'relative', zIndex: 2, textAlign: 'center' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((stepNum) => {
                const isFinal = stepNum === 10;
                const isReached = logs.length >= stepNum;

                return (
                  <div key={stepNum} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{
                      width: isFinal ? '44px' : '36px',
                      height: isFinal ? '44px' : '36px',
                      borderRadius: '50%',
                      background: isFinal 
                        ? (isReached ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#fef3c7')
                        : (isReached ? '#059669' : '#f1f5f9'),
                      color: isFinal 
                        ? (isReached ? '#0f172a' : '#b45309')
                        : (isReached ? 'white' : '#64748b'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: isFinal ? '1.2rem' : '0.85rem',
                      boxShadow: isReached ? (isFinal ? '0 4px 14px rgba(245, 158, 11, 0.45)' : '0 4px 10px rgba(5, 150, 105, 0.25)') : 'none',
                      border: isReached ? '3px solid white' : '2px dashed #cbd5e1',
                      transition: 'all 0.3s ease'
                    }}>
                      {isFinal ? '👑' : isReached ? '✓' : stepNum}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: isReached ? '#047857' : '#94a3b8', whiteSpace: 'nowrap' }}>
                      {isFinal ? 'التتويج 🏆' : `كتاب ${stepNum}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#475569', fontWeight: 700, borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span>🌱 محطة البداية (كتب 1-3): غرس العادة والاستكشاف</span>
            <span>⭐ منتصف الرحلة (كتب 4-7): تميز وبناء الثروة اللغوية</span>
            <span style={{ color: '#b45309', fontWeight: 900 }}>👑 محطة التتويج (كتاب 10): وسام التميز القرائي الذهبي</span>
          </div>
        </div>
      </section>

      {/* Featured Book Recommendation by Administration */}
      {config.featuredBookTitle && (
        <section style={{ maxWidth: '1000px', margin: '0 auto 2.5rem', padding: '0 1.25rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '24px',
            padding: '1.5rem 2rem',
            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#f59e0b', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
                🌟
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#b45309', background: '#fde68a', padding: '0.2rem 0.75rem', borderRadius: '50px' }}>
                  كتاب الشهر الموصى به من إدارة مدرسة مشيرفة 📖
                </span>
                <h3 style={{ margin: '0.35rem 0 0.15rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                  {config.featuredBookTitle} {config.featuredBookAuthor ? `• تأليف: ${config.featuredBookAuthor}` : ''}
                </h3>
                {config.featuredBookWhy && (
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
                    💡 <strong>رسالة الإدارة:</strong> {config.featuredBookWhy}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setBookTitle(config.featuredBookTitle);
                setAuthor(config.featuredBookAuthor || '');
                setShowAddLogModal(true);
              }}
              style={{
                background: '#047857',
                color: 'white',
                border: 'none',
                padding: '0.65rem 1.4rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)'
              }}
            >
              قرأت هذا الكتاب! سجله الآن 🌿
            </button>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <main style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 1.25rem 4rem' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { id: 'wall', label: 'حائط قراءات وتوصيات الأصدقاء 💬', icon: 'fa-comments' },
            { id: 'tree', label: 'شجرة القراءة التفاعلية 🌳', icon: 'fa-tree' },
            { id: 'hall-of-fame', label: 'لوحة شرف فرسان القراءة 🏆', icon: 'fa-award' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? '#047857' : 'white',
                color: activeTab === tab.id ? 'white' : '#475569',
                border: activeTab === tab.id ? '2px solid #047857' : '2px solid #e2e8f0',
                padding: '0.75rem 1.6rem',
                borderRadius: '16px',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: activeTab === tab.id ? '0 6px 20px rgba(4, 120, 87, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ==================== TAB 1: SOCIAL REVIEWS WALL ==================== */}
        {activeTab === 'wall' && (
          <div>
            {/* Search and Filters */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.25rem 1.5rem',
              border: '1px solid #e2e8f0',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              {/* Grade Filter */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'كل الصفوف 🏫' },
                  { id: 'الصف الأول', label: 'الأول' },
                  { id: 'الصف الثاني', label: 'الثاني' },
                  { id: 'الصف الثالث', label: 'الثالث' },
                  { id: 'الصف الرابع', label: 'الرابع' },
                  { id: 'الصف الخامس', label: 'الخامس' },
                  { id: 'الصف السادس', label: 'السادس' }
                ].map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGradeFilter(g.id)}
                    style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: '12px',
                      border: selectedGradeFilter === g.id ? '2px solid #047857' : '1px solid #cbd5e1',
                      background: selectedGradeFilter === g.id ? '#ecfdf5' : '#f8fafc',
                      color: selectedGradeFilter === g.id ? '#047857' : '#64748b',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: '260px' }}>
                <i className="fas fa-search" style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input
                  type="text"
                  placeholder="ابحث عن قصة، كاتب، أو طالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 2.2rem 0.55rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Logs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.5rem' }}>
              {filteredLogs.map((log) => {
                const isLiked = likedLogIds.includes(log.id);

                return (
                  <div
                    key={log.id}
                    style={{
                      background: 'white',
                      borderRadius: '24px',
                      padding: '1.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    <div>
                      {/* Card Header: Student & Class */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem' }}>
                              <i className="fas fa-user-graduate"></i>
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                                {log.studentName}
                              </h4>
                              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                                {log.studentClass}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Rating Stars */}
                        <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                          {'⭐'.repeat(log.rating || 5)}
                        </div>
                      </div>

                      {/* Book Title & Author */}
                      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', borderRight: '4px solid #047857', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 800 }}>
                          📖 {log.category || 'قصة ومغامرة'}
                        </div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>
                          {log.bookTitle}
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                          تأليف الكاتب: {log.author}
                        </div>
                      </div>

                      {/* Takeaway / Review */}
                      <div style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#334155', fontWeight: 600, marginBottom: '1rem' }}>
                        <strong>💡 العبرة التي تعلمتها:</strong> {log.takeaway}
                      </div>

                      {log.favoriteCharacter && (
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>🎭 الشخصية المفضلة:</span>
                          <strong style={{ color: '#0284c7' }}>{log.favoriteCharacter}</strong>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Date & Like Action */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString('ar-EG') : 'حديثاً'}
                      </span>

                      <button
                        onClick={(e) => handleLikeLog(e, log)}
                        style={{
                          background: isLiked ? '#fecdd3' : '#fdf2f8',
                          color: '#e11d48',
                          border: isLiked ? '1px solid #fda4af' : '1px solid transparent',
                          padding: '0.45rem 1rem',
                          borderRadius: '50px',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <i className={`fas fa-heart ${isLiked ? 'fa-beat' : ''}`}></i>
                        <span>{isLiked ? 'أعجبني وبإذن الله سأقرأه' : 'أود قراءته'}</span>
                        <strong>({log.likesCount || 1})</strong>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: INTERACTIVE READING TREE ==================== */}
        {activeTab === 'tree' && (
          <div style={{ background: 'white', borderRadius: '28px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', textAlign: 'center' }}>
            <span style={{ background: '#dcfce7', color: '#166534', padding: '0.35rem 1rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 900 }}>
              🌳 شجرة المعرفة لطلاب مشيرفة
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '0.6rem 0 0.4rem 0' }}>
              كل كتاب تقرؤه يزهر ورقة ذهبية في شجرة مدرستنا
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto 2.5rem' }}>
              انظر إلى إنجازات زملائك التي تنمو وتزهر يوماً بعد يوم! حتى الآن تم قطف ثمار <strong>{totalBooksRead} كتاباً</strong> وقصة!
            </p>

            {/* Visual Illustrated Tree Display */}
            <div style={{
              position: 'relative',
              maxWidth: '750px',
              height: '420px',
              margin: '0 auto',
              background: 'radial-gradient(circle at bottom, #ecfdf5 0%, #f0fdf4 60%, white 100%)',
              borderRadius: '24px',
              border: '2px solid #bbf7d0',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              
              {/* Tree Trunk Artwork Icon */}
              <div style={{ fontSize: '11rem', color: '#78350f', opacity: 0.9, marginTop: '70px' }}>
                🌳
              </div>

              {/* Dynamic Floating Leaves of Students */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {logs.slice(0, 18).map((l, idx) => {
                  // Random spread around tree canopy
                  const angle = (idx / 18) * Math.PI * 2;
                  const radius = 100 + (idx % 3) * 45;
                  const posX = 50 + Math.cos(angle) * (radius / 7.5);
                  const posY = 40 + Math.sin(angle) * (radius / 9);

                  return (
                    <div
                      key={l.id}
                      style={{
                        position: 'absolute',
                        left: `${posX}%`,
                        top: `${posY}%`,
                        transform: 'translate(-50%, -50%)',
                        background: idx % 3 === 0 ? '#fef3c7' : '#d1fae5',
                        border: idx % 3 === 0 ? '1px solid #f59e0b' : '1px solid #10b981',
                        borderRadius: '20px',
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: idx % 3 === 0 ? '#b45309' : '#065f46',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                        pointerEvents: 'auto',
                        cursor: 'default'
                      }}
                      title={`${l.studentName} قرأ: ${l.bookTitle}`}
                    >
                      <span>{idx % 3 === 0 ? '🍁' : '🍃'}</span> {l.bookTitle.slice(0, 16)}...
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Tree Stats Footer */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
              <div style={{ background: '#f8fafc', padding: '1rem 1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>أوراق القراءة الخضراء</span>
                <strong style={{ display: 'block', fontSize: '1.6rem', color: '#047857', fontWeight: 900 }}>{totalBooksRead} ورقة</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem 1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>الطلاب المشاركون</span>
                <strong style={{ display: 'block', fontSize: '1.6rem', color: '#0284c7', fontWeight: 900 }}>{studentLeaderboard.length * 8 + 14} بطلاً</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem 1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>الأوسمة المكتسبة</span>
                <strong style={{ display: 'block', fontSize: '1.6rem', color: '#d97706', fontWeight: 900 }}>48 وساماً 🏅</strong>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 3: HALL OF FAME LEADERBOARD ==================== */}
        {activeTab === 'hall-of-fame' && (
          <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            <div style={{ background: 'white', borderRadius: '28px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.35rem 1rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 900 }}>
                  🏆 لوحة شرف فرسان القراءة المتميزين
                </span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '0.6rem 0 0.3rem 0' }}>
                  أكثر الطلاب قراءة وإلهاماً في مدرسة مشيرفة
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                  يتم تكريم الطلاب المتميزين شهرياً بشهادات تفوق وأوسمة قراءة رسمية!
                </p>
              </div>

              {/* Leaderboard Ranking List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {studentLeaderboard.map((student, idx) => {
                  const rankIcons = ['👑', '🥇', '🥈', '🥉'];
                  const rankIcon = rankIcons[idx] || `#${idx + 1}`;
                  const badgeTitle = idx === 0 ? 'سفير القراءة بمشيرفة 👑' : idx < 3 ? 'فارس القراءة الذهبي 🥇' : 'قارئ متميز 🌟';

                  return (
                    <div
                      key={student.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.1rem 1.4rem',
                        borderRadius: '18px',
                        background: idx === 0 ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : idx < 3 ? '#f8fafc' : 'white',
                        border: idx === 0 ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                        boxShadow: idx === 0 ? '0 8px 20px rgba(245, 158, 11, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '45px',
                          height: '45px',
                          borderRadius: '50%',
                          background: idx === 0 ? '#f59e0b' : idx < 3 ? '#e2e8f0' : '#f1f5f9',
                          color: idx === 0 ? '#0f172a' : '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.3rem',
                          fontWeight: 900
                        }}>
                          {rankIcon}
                        </div>

                        <div>
                          <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'block' }}>
                            {student.name}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                            {student.sClass} • <span style={{ color: '#047857', fontWeight: 800 }}>{badgeTitle}</span>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#047857' }}>
                            {Math.min(10, student.count * 3 + 2)} / 10 كتب
                          </span>
                          <div style={{ fontSize: '0.75rem', color: '#e11d48', fontWeight: 700 }}>
                            ❤️ {student.likes + 15} إعجاباً
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setCertStudentName(student.name);
                            setCertStudentClass(student.sClass || 'الصف الرابع (أ)');
                            setShowCertificateModal(true);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: '#0f172a',
                            border: 'none',
                            padding: '0.45rem 0.9rem',
                            borderRadius: '12px',
                            fontWeight: 900,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 3px 10px rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          <i className="fas fa-award"></i>
                          <span>الشهادة 📜</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ==================== MODAL: LOG A BOOK ==================== */}
      {showAddLogModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '28px',
            padding: '2.2rem',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                  📖 سجّل قصة قرأتها وأضف ورقة لشجرتك
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700 }}>
                  شارك إنجازك مع أصدقائك في مدرسة مشيرفة
                </span>
              </div>

              <button
                onClick={() => setShowAddLogModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBookLog}>
              
              {/* Student Name */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem' }}>
                  اسم الطالب رباعياً *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمود إغبارية"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700 }}
                />
              </div>

              {/* Grade and Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem' }}>
                    الصف *:
                  </label>
                  <select
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontWeight: 700 }}
                  >
                    <option value="الصف الأول">الصف الأول</option>
                    <option value="الصف الثاني">الصف الثاني</option>
                    <option value="الصف الثالث">الصف الثالث</option>
                    <option value="الصف الرابع">الصف الرابع</option>
                    <option value="الصف الخامس">الصف الخامس</option>
                    <option value="الصف السادس">الصف السادس</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem' }}>
                    الشعبة:
                  </label>
                  <select
                    value={studentSection}
                    onChange={(e) => setStudentSection(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontWeight: 700 }}
                  >
                    <option value="أ">أ</option>
                    <option value="ب">ب</option>
                    <option value="ج">ج</option>
                    <option value="د">د</option>
                  </select>
                </div>
              </div>

              {/* Book Title & Author */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem' }}>
                    عنوان الكتاب أو القصة *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مغامرات السندباد البحري"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem' }}>
                    اسم الكاتب:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: كامل كيلاني"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Category & Rating */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem' }}>
                    نوع القصة:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontWeight: 700 }}
                  >
                    <option value="قصص وعبر">قصص وعبر</option>
                    <option value="مغامرات وخيال علمي">مغامرات وخيال علمي</option>
                    <option value="علوم وفضاء">علوم واكتشافات</option>
                    <option value="تاريخ وسير ملهمة">تاريخ وسير ملهمة</option>
                    <option value="شعر وأدب">شعر وأدب أطفال</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem' }}>
                    تقييمك للقصة:
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontWeight: 800, color: '#b45309' }}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (رائع جداً)</option>
                    <option value={4}>⭐⭐⭐⭐ (جميل وممتع)</option>
                    <option value={3}>⭐⭐⭐ (جيد ومفيد)</option>
                    <option value={2}>⭐⭐ (متوسط)</option>
                  </select>
                </div>
              </div>

              {/* Takeaway */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem' }}>
                  ما هي العبرة التي تعلمتها في جملة واحدة؟ *:
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="مثال: تعلمت أن الصدق والأمانة ينجيان صاحبهما مهما كانت الصعوبات..."
                  value={takeaway}
                  onChange={(e) => setTakeaway(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', border: '1px solid #cbd5e1', outline: 'none', lineHeight: 1.6 }}
                />
              </div>

              {/* Favorite Character */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem' }}>
                  شخصيتك المفضلة في القصة:
                </label>
                <input
                  type="text"
                  placeholder="مثال: سندباد، القبطان، الأرنب الذكي..."
                  value={favoriteCharacter}
                  onChange={(e) => setFavoriteCharacter(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem',
                  borderRadius: '16px',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 10px 25px rgba(5, 150, 105, 0.4)'
                }}
              >
                <span>{isSubmitting ? 'جاري التسجيل...' : '🌿 سجّل كتابك وانشر العبرة لأصدقائك'}</span>
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DIPLOMA & PASSPORT CERTIFICATE ==================== */}
      {showCertificateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '28px',
            padding: '2rem',
            maxWidth: '850px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            maxHeight: '95vh',
            overflowY: 'auto'
          }}>
            {/* Top Toolbar (No Print) */}
            <div className="no-print-btn" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                  🎓 شهادة وجواز بطل «رحلة العشر كتب»
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700 }}>
                  شهادة رسمية معتمدة قابلة للطباعة والمشاركة الفورية
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.3rem',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <i className="fas fa-print"></i>
                  <span>طباعة الشهادة 🖨️</span>
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🎉 أبارك للبطل/ـة (${certStudentName} - ${certStudentClass}) اجتياز بطولة «رحلة العشر كتب» ونيل وسام التميز القرائي بمدرسة مشيرفة الابتدائية! 📚🏆 تصفح إنجازه على: https://musherfe.com/#/readers-club`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#25D366',
                    color: 'white',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <i className="fab fa-whatsapp"></i>
                  <span>مشاركة واتساب</span>
                </a>

                <button
                  onClick={() => setShowCertificateModal(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 900 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Customization Inputs before Print (No Print) */}
            <div className="no-print-btn" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', color: '#334155', marginBottom: '0.3rem' }}>
                  اسم بطل / بطلة القراءة على الشهادة:
                </label>
                <input
                  type="text"
                  value={certStudentName}
                  onChange={(e) => setCertStudentName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', color: '#334155', marginBottom: '0.3rem' }}>
                  الصف والشعبة:
                </label>
                <input
                  type="text"
                  value={certStudentClass}
                  onChange={(e) => setCertStudentClass(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.95rem' }}
                />
              </div>
            </div>

            {/* THE PRINTABLE DIPLOMA CARD */}
            <div
              id="readers-diploma-print-area"
              style={{
                background: 'radial-gradient(circle at center, #ffffff 0%, #fffdfa 60%, #fef9ee 100%)',
                border: '10px double #b45309',
                borderRadius: '20px',
                padding: '2.5rem 2rem',
                position: 'relative',
                boxShadow: '0 10px 35px rgba(0,0,0,0.06)',
                textAlign: 'center',
                overflow: 'hidden'
              }}
            >
              {/* Inner Fine Border */}
              <div style={{ position: 'absolute', inset: '10px', border: '1px solid #fcd34d', borderRadius: '12px', pointerEvents: 'none' }}></div>

              {/* Watermark in Background */}
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '16rem', color: 'rgba(245, 158, 11, 0.04)', pointerEvents: 'none', zIndex: 0 }}>
                📚
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Header: School Logo & Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #fde68a', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                      مدرسة مشيرفة الابتدائية
                    </h4>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
                      لواء الشمال • وزارة التربية والتعليم
                    </span>
                  </div>

                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fffbeb', border: '2px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    🏆
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '0.2rem 0.75rem', borderRadius: '50px' }}>
                      عام التميّز والإبداع 2026/2027
                    </span>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 700 }}>
                      نادي القُرّاء وشجرة التميز
                    </div>
                  </div>
                </div>

                {/* Main Diploma Title */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#b45309', fontWeight: 800, letterSpacing: '1px' }}>
                    بـسـم الله الـرحـمـن الـرحـيـم
                  </span>
                  <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#78350f', margin: '0.4rem 0 0.2rem 0', fontFamily: 'Tajawal, sans-serif' }}>
                    شهادة اجتياز وبطولة «رحلة العشر كتب»
                  </h2>
                  <div style={{ width: '120px', height: '4px', background: 'linear-gradient(90deg, transparent, #d97706, transparent)', margin: '0.4rem auto' }}></div>
                </div>

                {/* Diploma Body Text */}
                <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.8, maxWidth: '680px', margin: '0 auto 1.5rem', fontWeight: 600 }}>
                  تتقدم إدارة مدرسة مشيرفة الابتدائية وطاقم اللغة العربية والمكتبة المدرسية بأسمى آيات التقدير والاعتزاز إلى فارس/فارسة القراءة:
                </p>

                {/* Honored Student Box */}
                <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '2px solid #f59e0b', borderRadius: '16px', padding: '0.85rem 1.5rem', display: 'inline-block', minWidth: '320px', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.15)' }}>
                  <h3 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 900, color: '#0f172a' }}>
                    {certStudentName || 'اسم الطالب البطل'}
                  </h3>
                  <span style={{ fontSize: '0.95rem', color: '#047857', fontWeight: 800 }}>
                    {certStudentClass || 'الصف الرابع (أ)'}
                  </span>
                </div>

                <p style={{ fontSize: '1rem', color: '#334155', lineHeight: 1.8, maxWidth: '700px', margin: '0 auto 1.5rem', fontWeight: 600 }}>
                  لاجتيازهـ/ـا بتفوق وشغف قراءة واستيعاب وتلخيص <strong style={{ color: '#047857' }}>(10) كتب وقصص هادفة</strong> واستحقاقهـ/ـا بكل جدارة نيل:
                  <br />
                  <strong style={{ fontSize: '1.15rem', color: '#b45309' }}>👑 «وسام التميز القرائي الذهبي لفرسان مشيرفة» 👑</strong>
                </p>

                {/* 10 Completed Books Milestone Grid */}
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1rem', border: '1px solid #e2e8f0', marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#047857', marginBottom: '0.6rem' }}>
                    🌿 محطات الكتب العشرة المكتملة في رحلة التميز:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', fontSize: '0.78rem' }}>
                    {[
                      '1. رحلة إلى مركز الأرض',
                      '2. كليلة ودمنة',
                      '3. سر الكهف العجيب',
                      '4. كواكب الفضاء',
                      '5. بائعة الخبز',
                      '6. السندباد البحري',
                      '7. مغامرات ماجد',
                      '8. حكمة الأجداد',
                      '9. كوكبنا الأزرق',
                      '10. تاج القراءة 🏆'
                    ].map((bookTitleStr, idx) => (
                      <div key={idx} style={{ background: 'white', padding: '0.4rem 0.5rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ color: '#059669', marginRight: '0.2rem' }}>✓</span> {bookTitleStr}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signatures & School Seal Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #fde68a', paddingTop: '1.25rem', marginTop: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>التاريخ المعتمد:</span>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a', marginTop: '0.2rem' }}>
                      {new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </strong>
                  </div>

                  {/* Golden Official School Seal */}
                  <div style={{
                    width: '95px',
                    height: '95px',
                    borderRadius: '50%',
                    border: '3px dashed #d97706',
                    background: 'radial-gradient(circle, #fef3c7 0%, #fde68a 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(217, 119, 6, 0.25)',
                    transform: 'rotate(-5deg)'
                  }}>
                    <span style={{ fontSize: '1.3rem' }}>🏛️</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#78350f', lineHeight: 1.1, textAlign: 'center' }}>
                      مدرسة مشيرفة<br />الختم الرسمي
                    </span>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>مدير المدرسة:</span>
                    <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0f172a', marginTop: '0.2rem', fontWeight: 900 }}>
                      أ. رامي ارفاعية
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 800 }}>
                      بوابة التميّز والإبداع 🌟
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #readers-diploma-print-area, #readers-diploma-print-area * {
            visibility: visible !important;
          }
          #readers-diploma-print-area {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 30px !important;
            box-sizing: border-box !important;
            background: white !important;
            border: 10px double #b45309 !important;
            display: flex !important;
            flex-direction: column !important;
            justifyContent: space-between !important;
            z-index: 999999 !important;
          }
          .no-print-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReadersClubPage;
