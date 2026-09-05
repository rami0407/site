import React, { useState, useEffect, useRef } from 'react';
import './SchoolTasbihPortal.css';
import tasbihEmeraldImg from '../assets/tasbih_emerald.jpg';
import tasbihMarbleImg from '../assets/tasbih_marble.jpg';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, increment } from 'firebase/firestore';

const INITIAL_ADHKAR = [
  {
    id: 'salawat',
    title: 'اللهم صلّ وسلم على سيدنا محمد',
    shortTitle: 'الصلاة على النبي ﷺ',
    badge: 'ﷺ',
    kioskActive: true,
    multiplier: 10,
    meritText: 'رحمات وصلوات تنزلت على طلابنا',
  },
  {
    id: 'subhanallah',
    title: 'سبحان الله وبحمده',
    shortTitle: 'سبحان الله وبحمده',
    badge: '🌴',
    kioskActive: true,
    multiplier: 1,
    meritText: 'غراس ونخيل أثمرت في الجنة',
  },
  {
    id: 'alhamdulillah',
    title: 'الحمد لله',
    shortTitle: 'الحمد لله',
    badge: '⚖️',
    kioskActive: true,
    multiplier: 1,
    meritText: 'ملء الميزان بالحسنات والخيرات',
  },
  {
    id: 'lailahaillallah',
    title: 'لا إله إلا الله',
    shortTitle: 'لا إله إلا الله',
    badge: '🌟',
    kioskActive: true,
    multiplier: 1,
    meritText: 'كلمة التوحيد والإخلاص',
  },
  {
    id: 'allahuakbar',
    title: 'الله أكبر',
    shortTitle: 'الله أكبر',
    badge: '👑',
    kioskActive: true,
    multiplier: 1,
    meritText: 'تعظيم الله وتكبيره',
  },
  {
    id: 'astaghfirullah',
    title: 'أستغفر الله وأتوب إليه',
    shortTitle: 'أستغفر الله',
    badge: '🌧️',
    kioskActive: false,
    multiplier: 1,
    meritText: 'مغفرة للذنوب وتفريج للكروب',
  }
];

const INITIAL_CAMPAIGN = {
  title: 'حملة النور: ١٠٠ ألف صلاة على النبي ﷺ',
  target: 100000,
  targetDhikr: 'salawat',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
};

const ALL_18_CLASSES = [
  'الصف الأول (أ)',
  'الصف الأول (ب)',
  'الصف الأول (ج)',
  'الصف الثاني (أ)',
  'الصف الثاني (ب)',
  'الصف الثاني (ج)',
  'الصف الثالث (أ)',
  'الصف الثالث (ب)',
  'الصف الثالث (ج)',
  'الصف الرابع (أ)',
  'الصف الرابع (ب)',
  'الصف الرابع (ج)',
  'الصف الخامس (أ)',
  'الصف الخامس (ب)',
  'الصف الخامس (ج)',
  'الصف السادس (أ)',
  'الصف السادس (ب)',
  'الصف السادس (ج)',
];

const INITIAL_CLASSES = {
  'الصف السادس (أ)': { total: 5820, totalStudents: 32, dailyActive: 28 },
  'الصف السادس (ب)': { total: 5410, totalStudents: 31, dailyActive: 27 },
  'الصف السادس (ج)': { total: 5120, totalStudents: 30, dailyActive: 25 },
  'الصف الخامس (أ)': { total: 4950, totalStudents: 32, dailyActive: 26 },
  'الصف الخامس (ب)': { total: 4720, totalStudents: 31, dailyActive: 23 },
  'الصف الخامس (ج)': { total: 4510, totalStudents: 30, dailyActive: 22 },
  'الصف الرابع (أ)': { total: 4320, totalStudents: 33, dailyActive: 25 },
  'الصف الرابع (ب)': { total: 4180, totalStudents: 32, dailyActive: 24 },
  'الصف الرابع (ج)': { total: 3990, totalStudents: 31, dailyActive: 21 },
  'الصف الثالث (أ)': { total: 3820, totalStudents: 32, dailyActive: 22 },
  'الصف الثالث (ب)': { total: 3650, totalStudents: 31, dailyActive: 21 },
  'الصف الثالث (ج)': { total: 3490, totalStudents: 30, dailyActive: 20 },
  'الصف الثاني (أ)': { total: 3320, totalStudents: 31, dailyActive: 23 },
  'الصف الثاني (ب)': { total: 3180, totalStudents: 30, dailyActive: 21 },
  'الصف الثاني (ج)': { total: 3020, totalStudents: 29, dailyActive: 20 },
  'الصف الأول (أ)':  { total: 2890, totalStudents: 30, dailyActive: 25 },
  'الصف الأول (ب)':  { total: 2740, totalStudents: 29, dailyActive: 24 },
  'الصف الأول (ج)':  { total: 2580, totalStudents: 28, dailyActive: 22 },
};

const playClickTone = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);

    // Haptic vibration feedback for mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(22);
    }
  } catch (e) {}
};

const playResetTone = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
};

const playChimeTone = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.07);
      osc.stop(ctx.currentTime + idx * 0.07 + 0.6);
    });
  } catch (e) {}
};

const SchoolTasbihPortal = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    const h = window.location.hash || '';
    if (h.includes('counter') || h.includes('student')) return 'student-view';
    if (h.includes('classes') || h.includes('leaderboard')) return 'classes-view';
    if (h.includes('settings')) return 'admin-control';
    return 'kiosk-view'; // Default so the electronic counter is immediately visible!
  });
  const [isPublished, setIsPublished] = useState(() => {
    return localStorage.getItem('tasbih_is_published') === 'true';
  });

  const [globalTotal, setGlobalTotal] = useState(() => {
    const saved = localStorage.getItem('tasbih_global_total');
    return saved ? Number(saved) : 67842;
  });

  const [dhikrCounts, setDhikrCounts] = useState(() => {
    const saved = localStorage.getItem('tasbih_dhikr_counts');
    return saved ? JSON.parse(saved) : {
      salawat: 42350,
      subhanallah: 11200,
      alhamdulillah: 6840,
      lailahaillallah: 4120,
      allahuakbar: 3332,
      astaghfirullah: 0,
    };
  });

  const [campaign, setCampaign] = useState(() => {
    const saved = localStorage.getItem('tasbih_campaign');
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGN;
  });

  const [adhkarList, setAdhkarList] = useState(() => {
    const saved = localStorage.getItem('tasbih_adhkar_list');
    return saved ? JSON.parse(saved) : INITIAL_ADHKAR;
  });

  const [classStats, setClassStats] = useState(() => {
    const saved = localStorage.getItem('tasbih_class_stats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = { ...INITIAL_CLASSES };
        Object.keys(parsed).forEach(k => {
          if (merged[k]) {
            merged[k] = { ...merged[k], ...parsed[k] };
          } else {
            merged[k] = parsed[k];
          }
        });
        return merged;
      } catch (e) {}
    }
    return INITIAL_CLASSES;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('tasbih_settings');
    return saved ? JSON.parse(saved) : {
      kioskCooldown: 1.5,
      studentCooldown: 0.8,
    };
  });

  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const [studentSessionCount, setStudentSessionCount] = useState(0);
  const [studentTargetRound, setStudentTargetRound] = useState(33);
  const [studentActiveDhikr, setStudentActiveDhikr] = useState('salawat');
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('school_unified_student_name') || 'يوسف أحمد';
  });
  const [studentClass, setStudentClass] = useState(() => {
    const saved = localStorage.getItem('school_unified_student_grade');
    return (saved && ALL_18_CLASSES.includes(saved)) ? saved : 'الصف السادس (أ)';
  });
  const [leaderboardFilter, setLeaderboardFilter] = useState('all'); // all, 1-2, 3-4, 5-6
  const [counterSkin, setCounterSkin] = useState(() => {
    const saved = localStorage.getItem('tasbih_counter_skin');
    return saved === 'marble' ? 'marble' : 'emerald';
  });
  const [isBtnPressed, setIsBtnPressed] = useState(false);
  const [antiSpamWarning, setAntiSpamWarning] = useState('');
  const lastStudentTapRef = useRef(0);
  const [kioskCooldownActive, setKioskCooldownActive] = useState({});
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveConfirmWord, setArchiveConfirmWord] = useState('');
  const [archiveBackupDownloaded, setArchiveBackupDownloaded] = useState(false);

  const currentTasbihSkin = counterSkin === 'marble'
    ? {
        id: 'marble',
        name: 'الرخامي الإيطالي المذهّب',
        img: tasbihMarbleImg,
        screenClass: 'tasbih-screen-marble',
        btnClass: 'tasbih-btn-marble-style',
        resetClass: 'tasbih-reset-marble-style',
      }
    : {
        id: 'emerald',
        name: 'الزمردي الملكي بالذهب (مدرسة مشيرفة)',
        img: tasbihEmeraldImg,
        screenClass: 'tasbih-screen-emerald',
        btnClass: 'tasbih-btn-emerald-style',
        resetClass: 'tasbih-reset-emerald-style',
      };

  const [isCloudConnected, setIsCloudConnected] = useState(true);

  // Real-time Cloud Synchronization across all devices (Firebase Firestore)
  useEffect(() => {
    try {
      const liveDocRef = doc(db, 'school_tasbih', 'live_portal');
      const unsubscribe = onSnapshot(liveDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.globalTotal === 'number') {
            setGlobalTotal(data.globalTotal);
          }
          if (data.dhikrCounts) {
            setDhikrCounts(data.dhikrCounts);
          }
          if (data.classStats) {
            const merged = { ...INITIAL_CLASSES };
            Object.keys(data.classStats).forEach(k => {
              if (merged[k]) {
                merged[k] = { ...merged[k], ...data.classStats[k] };
              } else {
                merged[k] = data.classStats[k];
              }
            });
            setClassStats(merged);
          }
          if (data.campaign) {
            setCampaign(data.campaign);
          }
          if (data.adhkarList && Array.isArray(data.adhkarList)) {
            setAdhkarList(data.adhkarList);
          }
          setIsCloudConnected(true);
        } else {
          // Initialize first time in cloud
          setDoc(liveDocRef, {
            globalTotal: 67843,
            dhikrCounts: {
              salawat: 42351,
              subhanallah: 11200,
              alhamdulillah: 6840,
              lailahaillallah: 4120,
              allahuakbar: 3332,
              astaghfirullah: 0,
            },
            campaign: INITIAL_CAMPAIGN,
            adhkarList: INITIAL_ADHKAR,
            classStats: INITIAL_CLASSES,
            initializedAt: new Date().toISOString()
          }, { merge: true }).catch(() => {});
        }
      }, (err) => {
        console.warn('Firestore live sync fallback to local cache:', err);
        setIsCloudConnected(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase sync error:', e);
      setIsCloudConnected(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tasbih_is_published', String(isPublished));
  }, [isPublished]);

  useEffect(() => {
    localStorage.setItem('tasbih_global_total', String(globalTotal));
    localStorage.setItem('tasbih_dhikr_counts', JSON.stringify(dhikrCounts));
    localStorage.setItem('tasbih_campaign', JSON.stringify(campaign));
    localStorage.setItem('tasbih_adhkar_list', JSON.stringify(adhkarList));
    localStorage.setItem('tasbih_class_stats', JSON.stringify(classStats));
    localStorage.setItem('tasbih_settings', JSON.stringify(settings));
  }, [globalTotal, dhikrCounts, campaign, adhkarList, classStats, settings]);

  const campaignTarget = campaign.target || 100000;
  const campaignCurrent = dhikrCounts[campaign.targetDhikr || 'salawat'] || 0;
  const campaignPercent = Math.min(100, Math.round((campaignCurrent / campaignTarget) * 100));

  const handleTapDhikr = (dhikrId, source = 'kiosk') => {
    const now = Date.now();
    const isKiosk = source === 'kiosk';
    const cooldownDuration = isKiosk ? settings.kioskCooldown : settings.studentCooldown;

    if (!isKiosk) {
      if (now - lastStudentTapRef.current < cooldownDuration * 1000) {
        setAntiSpamWarning('تمهل، رطب لسانك بالذكر بخشوع وقار ✨');
        setTimeout(() => setAntiSpamWarning(''), 2200);
        return;
      }
      lastStudentTapRef.current = now;
    } else {
      if (kioskCooldownActive[dhikrId]) return;
      setKioskCooldownActive(prev => ({ ...prev, [dhikrId]: true }));
      setTimeout(() => {
        setKioskCooldownActive(prev => {
          const next = { ...prev };
          delete next[dhikrId];
          return next;
        });
      }, cooldownDuration * 1000);
    }

    playClickTone();
    // 1. Instant local update for 0ms tactile response
    setGlobalTotal(prev => prev + 1);
    setDhikrCounts(prev => ({
      ...prev,
      [dhikrId]: (prev[dhikrId] || 0) + 1
    }));

    // 2. Real-time Cloud Broadcast to Firebase so all devices update together
    try {
      const liveDocRef = doc(db, 'school_tasbih', 'live_portal');
      const updatePayload = {
        globalTotal: increment(1),
        [`dhikrCounts.${dhikrId}`]: increment(1),
        lastUpdated: new Date().toISOString()
      };
      if (!isKiosk && studentClass) {
        updatePayload[`classStats.${studentClass}.total`] = increment(1);
      }
      updateDoc(liveDocRef, updatePayload).catch(() => {
        setDoc(liveDocRef, updatePayload, { merge: true }).catch(() => {});
      });
    } catch (e) {
      console.warn('Cloud tap broadcast error:', e);
    }

    if (!isKiosk) {
      setStudentSessionCount(prev => {
        const next = prev + 1;
        if (next === studentTargetRound || next % studentTargetRound === 0) {
          playChimeTone();
        }
        return next;
      });

      if (studentClass) {
        setClassStats(prev => {
          const cur = prev[studentClass] || { total: 0, totalStudents: 30, dailyActive: 1 };
          return {
            ...prev,
            [studentClass]: {
              ...cur,
              total: cur.total + 1
            }
          };
        });
      }
    }
  };

  const toggleDhikrKiosk = (id) => {
    setAdhkarList(prev => prev.map(d => d.id === id ? { ...d, kioskActive: !d.kioskActive } : d));
    showToast('تم تحديث ظهور الذكر في شاشة المدخل بنجاح 🔄');
  };

  const [newDhikrTitle, setNewDhikrTitle] = useState('');
  const [newDhikrBadge, setNewDhikrBadge] = useState('✨');
  const [newDhikrMultiplier, setNewDhikrMultiplier] = useState(1);
  const [newDhikrMerit, setNewDhikrMerit] = useState('');

  const handleAddCustomDhikr = (e) => {
    e.preventDefault();
    if (!newDhikrTitle.trim()) return;
    const newId = 'custom_' + Date.now();
    const newObj = {
      id: newId,
      title: newDhikrTitle.trim(),
      shortTitle: newDhikrTitle.trim(),
      badge: newDhikrBadge || '✨',
      kioskActive: true,
      multiplier: Number(newDhikrMultiplier) || 1,
      meritText: newDhikrMerit || 'أجر ومثوبة مضاعفة',
    };
    setAdhkarList(prev => [...prev, newObj]);
    setNewDhikrTitle('');
    showToast('تمت إضافة الذكر الجديد للمنظومة 🚀');
  };

  const handleDeleteDhikr = (id) => {
    if (window.confirm('هل تريد حذف هذا الذكر من المنظومة؟')) {
      setAdhkarList(prev => prev.filter(d => d.id !== id));
      showToast('تم حذف الذكر بنجاح');
    }
  };

  const handleOpenArchiveModal = () => {
    setArchiveConfirmWord('');
    setArchiveBackupDownloaded(false);
    setIsArchiveModalOpen(true);
  };

  const handleExecuteArchive = () => {
    if (archiveConfirmWord.trim() !== 'تأكيد') {
      showToast('⚠️ يرجى كتابة كلمة "تأكيد" للمتابعة');
      return;
    }

    // Save archive history
    const archiveRecord = {
      id: 'arch_' + Date.now(),
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
      total: globalTotal,
      dhikrCounts: { ...dhikrCounts },
      classStats: { ...classStats },
    };
    const savedArchives = JSON.parse(localStorage.getItem('tasbih_weekly_archives') || '[]');
    savedArchives.unshift(archiveRecord);
    localStorage.setItem('tasbih_weekly_archives', JSON.stringify(savedArchives));

    // Reset current active week
    setGlobalTotal(0);
    setDhikrCounts({
      salawat: 0,
      subhanallah: 0,
      alhamdulillah: 0,
      lailahaillallah: 0,
      allahuakbar: 0,
      astaghfirullah: 0,
    });
    setClassStats(prev => {
      const reset = {};
      Object.keys(prev).forEach(k => {
        reset[k] = { ...prev[k], total: 0, dailyActive: 0 };
      });
      return reset;
    });

    setIsArchiveModalOpen(false);
    setArchiveConfirmWord('');
    setArchiveBackupDownloaded(false);
    showToast('✨ تمت أرشفة الأسبوع بنجاح وتصفير العدادات للأسبوع الجديد!');
  };

  const handleExportCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,الصف,مجموع التسبيحات,الطلاب النشطون,إجمالي الطلاب,نسبة التفاعل\n';
    Object.entries(classStats).forEach(([className, data]) => {
      const rate = Math.round((data.dailyActive / data.totalStudents) * 100);
      csv += '"' + className + '",' + data.total + ',' + data.dailyActive + ',' + data.totalStudents + ',' + rate + '%\n';
    });
    const encoded = encodeURI(csv);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = 'tasbih_report_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
  };

  return (
    <div className="tasbih-portal-root">
      {/* NAVIGATION TABS */}
      <div className="tasbih-nav-tabs">
        <button
          className={'tasbih-tab-btn ' + (activeTab === 'kiosk-view' ? 'active' : '')}
          onClick={() => setActiveTab('kiosk-view')}
        >
          <i className="fas fa-tv"></i> 🏛️ شاشة المدخل الكبرى (Kiosk)
        </button>
        <button
          className={'tasbih-tab-btn ' + (activeTab === 'student-view' ? 'active' : '')}
          onClick={() => setActiveTab('student-view')}
        >
          <i className="fas fa-mobile-alt"></i> 📱 مسبحة الطالب الذكية
        </button>
        <button
          className={'tasbih-tab-btn ' + (activeTab === 'classes-view' ? 'active' : '')}
          onClick={() => setActiveTab('classes-view')}
        >
          <i className="fas fa-trophy"></i> 🏆 لوحة تنافس الصفوف
        </button>
        <button
          className={'tasbih-tab-btn ' + (activeTab === 'admin-control' ? 'active' : '')}
          onClick={() => setActiveTab('admin-control')}
        >
          <i className="fas fa-sliders-h"></i> ⚙️ لوحة التحكم والإعدادات
        </button>
        <a
          href="#/"
          className="tasbih-tab-btn"
          style={{ marginRight: 'auto', background: 'rgba(255, 255, 255, 0.08)', color: '#fef08a', textDecoration: 'none', border: '1px solid rgba(251, 191, 36, 0.3)' }}
          title="العودة إلى الصفحة الرئيسية للموقع"
        >
          <i className="fas fa-home"></i> 🏠 العودة للرئيسية
        </a>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div style={{ background: '#ecfdf5', border: '1.5px solid #10b981', color: '#065f46', padding: '10px 20px', textAlign: 'center', fontWeight: 800, fontSize: '0.92rem' }}>
          {toastMsg}
        </div>
      )}

      {/* 3. CONTENT AREA */}
      <div className="tasbih-content-area">

        {/* TAB 1: ADMIN CONTROL & SETTINGS */}
        {activeTab === 'admin-control' && (
          <div>
            {/* Page Publishing & Site Visibility Card */}
            <div className="tasbih-card" style={{ border: '2px solid #059669', background: '#f0fdf4', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{isPublished ? '🌐' : '🔒'}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#065f46' }}>
                      حالة نشر زاوية التسبيح في الموقع العام: {isPublished ? <span style={{ color: '#059669' }}>(منشورة للجمهور ✅)</span> : <span style={{ color: '#dc2626' }}>(مخفية كمسودة سرية 🔒)</span>}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#047857' }}>
                      {isPublished 
                        ? 'الزاوية ظاهرة حالياً في واجهة الموقع الرئيسية لجميع الطلاب والزوار.'
                        : 'الزاوية غير منشورة ومخفية عن الطلاب، ومتاحة للمدير فقط للمعاينة والتجهيز.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newState = !isPublished;
                    setIsPublished(newState);
                    localStorage.setItem('tasbih_is_published', String(newState));
                    window.dispatchEvent(new Event('tasbihPublishChanged'));
                    showToast(newState ? 'تم نشر المنظومة وظهورها في واجهة الموقع للجمهور 🚀' : 'تم إلغاء النشر وإخفاؤها لتكون مسودة خاصة بك 🔒');
                  }}
                  className="tasbih-btn"
                  style={{
                    background: isPublished ? '#dc2626' : '#059669',
                    color: 'white',
                    fontWeight: 800,
                    padding: '8px 18px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  <i className={isPublished ? 'fas fa-eye-slash' : 'fas fa-bullhorn'}></i>
                  {isPublished ? 'إلغاء النشر وإخفاء الزاوية عن الموقع' : '🚀 نشر الزاوية وإظهارها للجمهور'}
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '1.5rem' }}>
              <div className="tasbih-card" style={{ textAlign: 'center', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#059669' }}>
                  {globalTotal.toLocaleString('ar-EG')}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 700 }}>
                  إجمالي التسبيحات الكلي
                </div>
              </div>
              <div className="tasbih-card" style={{ textAlign: 'center', background: '#fffbeb', borderColor: '#fef08a' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#d97706' }}>
                  {(dhikrCounts['salawat'] || 0).toLocaleString('ar-EG')}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 700 }}>
                  الصلوات على النبي ﷺ
                </div>
              </div>
              <div className="tasbih-card" style={{ textAlign: 'center', background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2563eb' }}>
                  {campaignPercent}%
                </div>
                <div style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 700 }}>
                  إنجاز الحملة الأسبوعية
                </div>
              </div>
              <div className="tasbih-card" style={{ textAlign: 'center', background: '#faf5ff', borderColor: '#e9d5ff' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#7e22ce' }}>
                  {Object.keys(classStats).length} شعبة
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b21a8', fontWeight: 700 }}>
                  الصفوف والشعب النشطة
                </div>
              </div>
            </div>

            {/* Campaign Setting Card */}
            <div className="tasbih-card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-bullseye" style={{ color: '#059669' }}></i> إعدادات الحملة المدرسية الأسبوعية
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>عنوان الحملة:</label>
                  <input
                    className="tasbih-input"
                    value={campaign.title}
                    onChange={e => setCampaign({ ...campaign, title: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>الهدف العددي (التارجت):</label>
                  <input
                    type="number"
                    className="tasbih-input"
                    step="1000"
                    value={campaign.target}
                    onChange={e => setCampaign({ ...campaign, target: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>الذكر المستهدف للحملة:</label>
                  <select
                    className="tasbih-input"
                    value={campaign.targetDhikr}
                    onChange={e => setCampaign({ ...campaign, targetDhikr: e.target.value })}
                  >
                    {adhkarList.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="tasbih-btn tasbih-btn-emerald" onClick={() => showToast('تم حفظ إعدادات الحملة بنجاح ✅')}>
                <i className="fas fa-save"></i> حفظ إعدادات الحملة
              </button>
            </div>

            {/* Anti-Spam Safety Controls */}
            <div className="tasbih-card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-shield-alt" style={{ color: '#059669' }}></i> ضوابط الأمان ومعدل النقر (Anti-Spam Cooldown)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                تحديد الفاصل الزمني الإجباري بين النقرات لضمان التلاوة الخاشعة المتأنية ومنع الضغط السريع العشوائي.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                    <span>زمن الانتظار لشاشة المدخل (Kiosk):</span>
                    <span style={{ color: '#059669' }}>{settings.kioskCooldown} ثانية</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    style={{ width: '100%', accentColor: '#059669' }}
                    value={settings.kioskCooldown}
                    onChange={e => setSettings({ ...settings, kioskCooldown: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                    <span>زمن الانتظار لمسبحة الطالب (Mobile):</span>
                    <span style={{ color: '#059669' }}>{settings.studentCooldown} ثانية</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="2.0"
                    step="0.1"
                    style={{ width: '100%', accentColor: '#059669' }}
                    value={settings.studentCooldown}
                    onChange={e => setSettings({ ...settings, studentCooldown: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button className="tasbih-btn tasbih-btn-emerald" style={{ marginTop: '1rem' }} onClick={() => showToast('تم تحديث ضوابط الأمان ومعدل النقر 🛡️')}>
                <i className="fas fa-save"></i> حفظ ضوابط الأمان
              </button>
            </div>

            {/* Dhikr Management */}
            <div className="tasbih-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-kaaba" style={{ color: '#059669' }}></i> قائمة الأذكار وشاشة المدخل (Kiosk)
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
                {adhkarList.map(d => (
                  <div
                    key={d.id}
                    style={{
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: d.kioskActive ? '#f0fdf4' : '#f8fafc',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                        {d.badge} {d.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        المضاعف: {d.multiplier}x • {d.meritText}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => toggleDhikrKiosk(d.id)}
                        className="tasbih-btn"
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          background: d.kioskActive ? '#059669' : '#94a3b8',
                          color: 'white',
                        }}
                      >
                        {d.kioskActive ? 'ظاهر بالمدخل' : 'مخفي'}
                      </button>
                      {d.id.startsWith('custom_') && (
                        <button
                          onClick={() => handleDeleteDhikr(d.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Dhikr Form */}
              <form onSubmit={handleAddCustomDhikr} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>+ إضافة صيغة ذكر جديدة:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr auto', gap: '8px', alignItems: 'flex-end' }}>
                  <input className="tasbih-input" placeholder="نص الذكر المبارك" value={newDhikrTitle} onChange={e => setNewDhikrTitle(e.target.value)} required />
                  <input className="tasbih-input" placeholder="الأيقونة" value={newDhikrBadge} onChange={e => setNewDhikrBadge(e.target.value)} />
                  <input className="tasbih-input" type="number" min={1} max={100} placeholder="المضاعف" value={newDhikrMultiplier} onChange={e => setNewDhikrMultiplier(e.target.value)} />
                  <input className="tasbih-input" placeholder="وصف الثواب" value={newDhikrMerit} onChange={e => setNewDhikrMerit(e.target.value)} />
                  <button type="submit" className="tasbih-btn tasbih-btn-emerald">إضافة</button>
                </div>
              </form>
            </div>

            {/* Reports & Weekly Archive */}
            <div className="tasbih-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>تصدير التقارير والأرشفة الأسبوعية</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  قم بتحميل ملفات الإحصائيات لتوثيق تفاعل الصفوف أو تصفير العدادات للأسبوع الجديد.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleExportCSV} className="tasbih-btn tasbih-btn-dark">
                  <i className="fas fa-file-csv"></i> تصدير إحصائيات الصفوف (CSV)
                </button>
                <button onClick={handleOpenArchiveModal} className="tasbih-btn tasbih-btn-danger">
                  <i className="fas fa-redo"></i> تصفير وأرشفة الأسبوع
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KIOSK VIEW PREVIEW */}
        {activeTab === 'kiosk-view' && (
          <div className="tasbih-card-dark">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(16,185,129,0.3)', paddingBottom: '1rem' }}>
              <div>
                <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', fontSize: '0.8rem', fontWeight: 800, padding: '4px 12px', borderRadius: '15px' }}>
                  🏛️ محاكاة شاشة المدخل التفاعلية الكبرى (Kiosk Mode)
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: '6px 0 0 0' }}>
                  بوابة الذكر المدرسية الكبرى • مدرسة مشيرفة
                </h2>
              </div>
              <div style={{ textAlign: 'left', fontSize: '0.85rem', color: '#a7f3d0', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.25)', color: '#6ee7b7', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, border: '1px solid rgba(52,211,153,0.3)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #34d399' }}></span>
                  {isCloudConnected ? '🟢 متزامن ومحتلن لحظياً' : '🔄 متصل محلياً'}
                </span>
                <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>معدل الأمان: {settings.kioskCooldown} ثانية</span>
              </div>
            </div>

            {/* Giant Odometer Card */}
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '20px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div style={{ fontSize: '0.9rem', color: '#6ee7b7', fontWeight: 700, marginBottom: '6px' }}>
                مجموع الأذكار والتسبيحات المسجلة في المدرسة
              </div>
              <div style={{ fontSize: '4.5rem', fontWeight: 900, color: '#fef08a', textShadow: '0 0 30px rgba(245,158,11,0.5)', lineHeight: 1.1 }}>
                {globalTotal.toLocaleString('ar-EG')}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '6px' }}>
                تسبيحة وذكرة عطرت مدرستنا وبيوت طلابنا
              </div>
            </div>

            {/* Campaign Progress */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                <span>🎯 {campaign.title}</span>
                <span style={{ color: '#f59e0b' }}>{campaignPercent}% (تم إنجاز {campaignCurrent.toLocaleString('ar-EG')} من {campaignTarget.toLocaleString('ar-EG')})</span>
              </div>
              <div style={{ height: '14px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: campaignPercent + '%', background: 'linear-gradient(90deg, #10b981, #f59e0b)', borderRadius: '10px', transition: 'width 0.5s' }}></div>
              </div>
            </div>

            {/* Kiosk Dhikr Selector & Interactive Electronic Counter */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
              
              <div style={{ fontSize: '0.95rem', color: '#a7f3d0', fontWeight: 800, marginBottom: '0.8rem' }}>
                👇 اختر الذكر المبارك ثم اضغط على زر المسبحة الإلكترونية للتسجيل:
              </div>

              {/* Dhikr Selector Pills */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {adhkarList.filter(d => d.kioskActive).map(d => (
                  <button
                    key={d.id}
                    onClick={() => setStudentActiveDhikr(d.id)}
                    style={{
                      background: studentActiveDhikr === d.id ? 'linear-gradient(135deg, #059669, #047857)' : 'rgba(255,255,255,0.08)',
                      border: studentActiveDhikr === d.id ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.15)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '16px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: studentActiveDhikr === d.id ? '0 4px 15px rgba(5,150,105,0.4)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{d.badge}</span>
                    <span>{d.title}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8, background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '8px' }}>
                      ({(dhikrCounts[d.id] || 0).toLocaleString('ar-EG')})
                    </span>
                  </button>
                ))}
              </div>

              {/* REAL ELECTRONIC DIGITAL TALLY COUNTER IN KIOSK */}
              <div className="tasbih-real-counter-section">
                <div className={`tasbih-device-wrapper skin-${currentTasbihSkin.id}`}>
                  <img
                    src={currentTasbihSkin.img}
                    alt={currentTasbihSkin.name}
                    className="tasbih-device-casing"
                  />

                  {/* Digital OLED Screen */}
                  <div className={`${currentTasbihSkin.screenClass} ${kioskCooldownActive[studentActiveDhikr] ? 'celebrate' : ''}`}>
                    <div className="tasbih-lcd-meta">
                      <span className="tasbih-lcd-round-badge">
                        {isCloudConnected ? '🟢 سحابي محتلن' : 'شاشة المدخل'}
                      </span>
                      <span className="tasbih-lcd-icon">
                        {adhkarList.find(d => d.id === studentActiveDhikr)?.badge || 'ﷺ'}
                      </span>
                    </div>

                    {/* OLED Digits - Full Un-truncated Accurate Count */}
                    <div
                      className="tasbih-lcd-digits"
                      style={{
                        fontSize: (dhikrCounts[studentActiveDhikr] || 0) >= 100000
                          ? '1.35rem'
                          : (dhikrCounts[studentActiveDhikr] || 0) >= 10000
                          ? '1.65rem'
                          : '2.1rem'
                      }}
                    >
                      {(dhikrCounts[studentActiveDhikr] || 0).toLocaleString('en-US')}
                    </div>
                  </div>

                  {/* Big Main Push Button */}
                  <button
                    type="button"
                    disabled={!!kioskCooldownActive[studentActiveDhikr]}
                    aria-label="تسبيح"
                    className={`${currentTasbihSkin.btnClass} ${isBtnPressed ? 'pressed' : ''}`}
                    onMouseDown={() => setIsBtnPressed(true)}
                    onMouseUp={() => setIsBtnPressed(false)}
                    onTouchStart={() => setIsBtnPressed(true)}
                    onTouchEnd={() => setIsBtnPressed(false)}
                    onClick={() => handleTapDhikr(studentActiveDhikr, 'kiosk')}
                    title="المس الزر الذهبي لتسجيل التسبيحة"
                  >
                    <span className="btn-touch-hint">اضغط 👆</span>
                  </button>

                  {/* Small Reset Button - Protected / Locked in Shared Kiosk */}
                  <button
                    type="button"
                    aria-label="تصفير العداد"
                    className={currentTasbihSkin.resetClass}
                    onClick={(e) => {
                      e.stopPropagation();
                      playResetTone();
                      showToast('🔒 هذا العداد المبارك يجمع جهود جميع طلاب مدرسة مشيرفة، ولا يمكن مسحه إلا من قِبل إدارة المدرسة ✨');
                    }}
                    title="العداد العام محمي ولا يمكن مسحه من الشاشة المشتركة"
                  />
                </div>

                {/* Skins Selector */}
                <div className="tasbih-skins-row">
                  <button
                    type="button"
                    onClick={() => {
                      setCounterSkin('emerald');
                      localStorage.setItem('tasbih_counter_skin', 'emerald');
                    }}
                    className={`tasbih-skin-choice ${counterSkin === 'emerald' ? 'active' : ''}`}
                    title="المسبحة الزمردية الملكية"
                  >
                    <span className="tasbih-skin-gem emerald"></span>
                    <span>الزمردي الملكي بالذهب 👑</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCounterSkin('marble');
                      localStorage.setItem('tasbih_counter_skin', 'marble');
                    }}
                    className={`tasbih-skin-choice ${counterSkin === 'marble' ? 'active' : ''}`}
                    title="المسبحة الرخامية بالخط العربي"
                  >
                    <span className="tasbih-skin-gem marble"></span>
                    <span>الرخام الإيطالي المذهّب 🏛️</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: STUDENT VIEW PREVIEW */}
        {activeTab === 'student-view' && (
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            {/* Student & Class Configuration Card */}
            <div style={{
              background: 'linear-gradient(135deg, #064e3b, #022c22)',
              borderRadius: '20px',
              padding: '1.25rem',
              marginBottom: '1rem',
              border: '1.5px solid #10b981',
              boxShadow: '0 8px 24px rgba(2, 44, 34, 0.4)',
              color: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, background: 'rgba(16,185,129,0.25)', color: '#6ee7b7', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(52,211,153,0.3)' }}>
                  📱 مسبحة الطالب من البيت
                </span>
                <span style={{ fontSize: '0.78rem', color: '#a7f3d0' }}>
                  {isCloudConnected ? '🟢 متصل بالمسابقة المباشرة' : '🔄 متصل محلياً'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a7f3d0', fontWeight: 700, marginBottom: '3px' }}>
                    اسم الطالب (اختياري):
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      localStorage.setItem('school_unified_student_name', e.target.value);
                    }}
                    placeholder="اكتب اسمك..."
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '10px',
                      border: '1px solid rgba(16,185,129,0.4)',
                      background: 'rgba(0,0,0,0.35)',
                      color: 'white',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#fef08a', fontWeight: 800, marginBottom: '3px' }}>
                    اختر صفك من الـ 18 صفاً:
                  </label>
                  <select
                    value={studentClass}
                    onChange={(e) => {
                      const newCls = e.target.value;
                      setStudentClass(newCls);
                      localStorage.setItem('school_unified_student_grade', newCls);
                      showToast(`تم تعيين صفك: ${newCls} 🎯`);
                    }}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '10px',
                      border: '1.5px solid #fbbf24',
                      background: '#064e3b',
                      color: '#fef08a',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    {ALL_18_CLASSES.map(cls => (
                      <option key={cls} value={cls} style={{ background: '#022c22', color: 'white' }}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Class Live Points Banner */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid rgba(251,191,36,0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🏆</span>
                  <span style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                    رصيد <strong>{studentClass}</strong> في المسابقة:
                  </span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fef08a', textShadow: '0 0 10px rgba(245,158,11,0.5)' }}>
                  {(classStats[studentClass]?.total || 0).toLocaleString('ar-EG')} تسبيحة
                </div>
              </div>
            </div>

            {/* Electronic Counter Box */}
            <div style={{ background: '#022c22', color: 'white', borderRadius: '24px', padding: '1.5rem', border: '2px solid #059669', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(16,185,129,0.2)', paddingBottom: '12px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>📿</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>هدف الدورة الحالية:</div>
                    <div style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>يتنبه العداد بنغمة خفيفة عند بلوغه</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setStudentTargetRound(33)}
                    style={{ background: studentTargetRound === 33 ? '#059669' : '#0f172a', border: studentTargetRound === 33 ? '1px solid #34d399' : '1px solid #334155', color: 'white', padding: '5px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    ٣٣
                  </button>
                  <button
                    onClick={() => setStudentTargetRound(100)}
                    style={{ background: studentTargetRound === 100 ? '#059669' : '#0f172a', border: studentTargetRound === 100 ? '1px solid #34d399' : '1px solid #334155', color: 'white', padding: '5px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    ١٠٠
                  </button>
                </div>
              </div>

              {/* Dhikr Switcher */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px' }}>
                {adhkarList.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setStudentActiveDhikr(d.id)}
                    style={{
                      background: studentActiveDhikr === d.id ? 'linear-gradient(135deg, #059669, #047857)' : 'rgba(255,255,255,0.06)',
                      border: studentActiveDhikr === d.id ? '1.5px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {d.badge} {d.shortTitle}
                  </button>
                ))}
              </div>

              {/* Anti-Spam Warning */}
              {antiSpamWarning && (
                <div style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid #f59e0b', color: '#fef08a', padding: '6px 12px', borderRadius: '10px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, marginBottom: '10px' }}>
                  {antiSpamWarning}
                </div>
              )}

              {/* Active Dhikr Label */}
              <div style={{ textAlign: 'center', margin: '0.75rem 0 0.5rem 0' }}>
                <div style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 700 }}>الذكر النشط:</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '4px 0', color: 'white' }}>
                  {adhkarList.find(d => d.id === studentActiveDhikr)?.title}
                </h3>
              </div>

              {/* REAL ELECTRONIC DIGITAL TALLY COUNTER */}
              <div className="tasbih-real-counter-section">
                <div className={`tasbih-device-wrapper skin-${currentTasbihSkin.id}`}>
                  <img
                    src={currentTasbihSkin.img}
                    alt={currentTasbihSkin.name}
                    className="tasbih-device-casing"
                  />

                  {/* Digital OLED Screen */}
                  <div
                    className={`${currentTasbihSkin.screenClass} ${studentSessionCount > 0 && studentSessionCount % studentTargetRound === 0 ? 'celebrate' : ''}`}
                  >
                    <div className="tasbih-lcd-meta">
                      <span className="tasbih-lcd-round-badge">
                        الهدف: {studentTargetRound}
                      </span>
                      <span className="tasbih-lcd-icon">
                        {adhkarList.find(d => d.id === studentActiveDhikr)?.badge || '✨'}
                      </span>
                    </div>

                    {/* OLED Digits */}
                    <div className="tasbih-lcd-digits">
                      {String(studentSessionCount % studentTargetRound).padStart(4, '0')}
                    </div>
                  </div>

                  {/* Big Main Push Button */}
                  <button
                    type="button"
                    aria-label="تسبيح"
                    className={`${currentTasbihSkin.btnClass} ${isBtnPressed ? 'pressed' : ''}`}
                    onMouseDown={() => setIsBtnPressed(true)}
                    onMouseUp={() => setIsBtnPressed(false)}
                    onTouchStart={() => setIsBtnPressed(true)}
                    onTouchEnd={() => setIsBtnPressed(false)}
                    onClick={() => handleTapDhikr(studentActiveDhikr, 'mobile')}
                    title="المس الزر الذهبي للتسبيح واحتساب نقطة لصفك"
                  >
                    <span className="btn-touch-hint">اضغط 👆</span>
                  </button>

                  {/* Small Reset Button - Local Student Session Reset Only */}
                  <button
                    type="button"
                    aria-label="تصفير الجلسة الحالية"
                    className={currentTasbihSkin.resetClass}
                    onClick={(e) => {
                      e.stopPropagation();
                      playResetTone();
                      setStudentSessionCount(0);
                      showToast('تم تصفير جولتك الشخصية (0..33) للبدء من جديد 🔄 رصيدك ورصيد صفك في المسابقة المدرسية محفوظ وآمن سحابياً 🛡️');
                    }}
                    title="تصفير دورتك الفردية الحالية (0..33) للبدء من جديد"
                  />
                </div>

                {/* Anti-Wipe Security Notice */}
                <div style={{
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  marginTop: '10px',
                  fontSize: '0.78rem',
                  color: '#a7f3d0',
                  textAlign: 'center',
                  lineHeight: 1.4
                }}>
                  🛡️ <strong>حماية المسابقة ونزاهة النتائج:</strong> زر التصفير الدائري الصغير يعيد دورتك الفردية الحالية فقط (0..33)، بينما نقاطك ونقاط صفك في المسابقة المدرسية العامة مسجلة في السحابة ومحمية دائماً ولا يمكن لأحد مسحها.
                </div>

                {/* Color Skins Selector */}
                <div className="tasbih-skins-row">
                  <button
                    type="button"
                    onClick={() => {
                      setCounterSkin('emerald');
                      localStorage.setItem('tasbih_counter_skin', 'emerald');
                    }}
                    className={`tasbih-skin-choice ${counterSkin === 'emerald' ? 'active' : ''}`}
                    title="المسبحة الزمردية الملكية"
                  >
                    <span className="tasbih-skin-gem emerald"></span>
                    <span>الزمردي الملكي بالذهب 👑</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCounterSkin('marble');
                      localStorage.setItem('tasbih_counter_skin', 'marble');
                    }}
                    className={`tasbih-skin-choice ${counterSkin === 'marble' ? 'active' : ''}`}
                    title="المسبحة الرخامية بالخط العربي"
                  >
                    <span className="tasbih-skin-gem marble"></span>
                    <span>الرخام الإيطالي المذهّب 🏛️</span>
                  </button>
                </div>
              </div>

              {/* Spiritual Merit Card */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '12px', textAlign: 'right', border: '1px solid rgba(255,255,255,0.1)', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fef08a', marginBottom: '4px' }}>
                  ✨ الثواب والأجر في ميزان حسناتك:
                </div>
                <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
                  {studentActiveDhikr === 'salawat'
                    ? 'صليت على النبي ﷺ ' + studentSessionCount + ' مرات في هذه الجلسة، فصلى الله عليك بها ' + (studentSessionCount * 10) + ' صلوات، وساهمت بـ ' + studentSessionCount + ' نقطة لصفك المبارك.'
                    : 'غرست لنفسك ' + studentSessionCount + ' نخلة وشجرة مباركة في الجنة، ورفعت رصيد صفك في المسابقة.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CLASSES LEADERBOARD PREVIEW - 18 CLASSES COMPETITION */}
        {activeTab === 'classes-view' && (
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#fef08a', fontSize: '0.85rem', fontWeight: 900, padding: '5px 16px', borderRadius: '20px', border: '1.5px solid #fbbf24', boxShadow: '0 4px 12px rgba(5,150,105,0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>🏆</span> المسابقة المدرسية الكبرى لتسبيح الصفوف والشعب (١٨ صفاً)
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '10px 0 4px 0' }}>
                لوحة الشرف وتنافس الشعب المدرسية
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
                تنافس إيماني شريف بين طلاب مدرسة مشيرفة الابتدائية • كل تسبيحة من بيت الطالب ترتقي بصفه في لوحة الشرف
              </p>
            </div>

            {/* Competition Security & Anti-Cheat Guarantee Banner */}
            <div style={{
              background: '#f0fdf4',
              border: '1.5px solid #10b981',
              borderRadius: '16px',
              padding: '12px 18px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(16,185,129,0.1)'
            }}>
              <div style={{ fontSize: '2rem', color: '#059669' }}>🛡️</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#065f46' }}>
                  نظام النزاهة التنافسية وضمان عدم المسح:
                </div>
                <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '2px' }}>
                  رصيد الشعب والصفوف تراكمي وموثق في السحابة لحظة بلحظة. <strong>تم إلغاء أي إمكانية لمسح النتائج أو تصفيرها من أجهزة الطلاب والشاشات العامة</strong> لضمان تتويج الصف الأكثر اجتهاداً بكل نزاهة وأمان.
                </div>
              </div>
            </div>

            {/* PODIUM DISPLAY (Top 3 Classes) */}
            {(() => {
              const sorted = Object.entries(classStats).sort(([, a], [, b]) => b.total - a.total);
              const top1 = sorted[0];
              const top2 = sorted[1];
              const top3 = sorted[2];

              if (!top1) return null;

              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                  marginBottom: '1.75rem'
                }}>
                  {/* 2nd Place */}
                  {top2 && (
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                      border: '2px solid #cbd5e1',
                      borderRadius: '18px',
                      padding: '1.25rem',
                      textAlign: 'center',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ fontSize: '2.2rem', marginBottom: '4px' }}>🥈</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>المركز الثاني (الوصيف)</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', margin: '4px 0' }}>{top2[0]}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2563eb' }}>
                        {top2[1].total.toLocaleString('ar-EG')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>تسبيحة مباركة</div>
                    </div>
                  )}

                  {/* 1st Place */}
                  <div style={{
                    background: 'linear-gradient(135deg, #fefce8, #fef08a)',
                    border: '2.5px solid #eab308',
                    borderRadius: '20px',
                    padding: '1.5rem 1.25rem',
                    textAlign: 'center',
                    boxShadow: '0 8px 25px rgba(234,179,8,0.25)',
                    transform: 'scale(1.03)',
                    position: 'relative'
                  }}>
                    <div style={{ position: 'absolute', top: '-12px', right: '50%', transform: 'translateX(50%)', background: '#eab308', color: '#713f12', fontWeight: 900, fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px' }}>
                      متصدر المدرسة 👑
                    </div>
                    <div style={{ fontSize: '2.6rem', marginBottom: '4px' }}>🥇</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#854d0e' }}>المركز الأول (بطل التسبيح)</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#713f12', margin: '4px 0' }}>{top1[0]}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', textShadow: '0 0 10px rgba(5,150,105,0.2)' }}>
                      {top1[1].total.toLocaleString('ar-EG')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#854d0e', fontWeight: 700 }}>تسبيحة مباركة</div>
                  </div>

                  {/* 3rd Place */}
                  {top3 && (
                    <div style={{
                      background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                      border: '2px solid #fdba74',
                      borderRadius: '18px',
                      padding: '1.25rem',
                      textAlign: 'center',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ fontSize: '2.2rem', marginBottom: '4px' }}>🥉</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#9a3412' }}>المركز الثالث</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#7c2d12', margin: '4px 0' }}>{top3[0]}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#d97706' }}>
                        {top3[1].total.toLocaleString('ar-EG')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9a3412' }}>تسبيحة مباركة</div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setLeaderboardFilter('all')}
                style={{
                  background: leaderboardFilter === 'all' ? '#0f172a' : '#f1f5f9',
                  color: leaderboardFilter === 'all' ? 'white' : '#475569',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                جميع الصفوف (١٨ شعبة)
              </button>
              <button
                onClick={() => setLeaderboardFilter('1-2')}
                style={{
                  background: leaderboardFilter === '1-2' ? '#0f172a' : '#f1f5f9',
                  color: leaderboardFilter === '1-2' ? 'white' : '#475569',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                صفوف الأول والثاني (٦ شعب)
              </button>
              <button
                onClick={() => setLeaderboardFilter('3-4')}
                style={{
                  background: leaderboardFilter === '3-4' ? '#0f172a' : '#f1f5f9',
                  color: leaderboardFilter === '3-4' ? 'white' : '#475569',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                صفوف الثالث والرابع (٦ شعب)
              </button>
              <button
                onClick={() => setLeaderboardFilter('5-6')}
                style={{
                  background: leaderboardFilter === '5-6' ? '#0f172a' : '#f1f5f9',
                  color: leaderboardFilter === '5-6' ? 'white' : '#475569',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                صفوف الخامس والسادس (٦ شعب)
              </button>
            </div>

            {/* Classes Table */}
            <div className="tasbih-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: 'white', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px 16px' }}>الترتيب</th>
                    <th style={{ padding: '12px 16px' }}>الصف والشعبة</th>
                    <th style={{ padding: '12px 16px' }}>مجموع التسبيحات</th>
                    <th style={{ padding: '12px 16px' }}>الطلاب النشطون</th>
                    <th style={{ padding: '12px 16px' }}>نسبة المشاركة</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(classStats)
                    .filter(([cName]) => {
                      if (leaderboardFilter === '1-2') return cName.includes('الأول') || cName.includes('الثاني');
                      if (leaderboardFilter === '3-4') return cName.includes('الثالث') || cName.includes('الرابع');
                      if (leaderboardFilter === '5-6') return cName.includes('الخامس') || cName.includes('السادس');
                      return true;
                    })
                    .sort(([, a], [, b]) => b.total - a.total)
                    .map(([cName, data], idx) => {
                      const rate = Math.round((data.dailyActive / data.totalStudents) * 100);
                      const isMyClass = cName === studentClass;
                      return (
                        <tr
                          key={cName}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: isMyClass ? '#ecfdf5' : idx === 0 ? '#fefce8' : idx === 1 ? '#f8fafc' : idx % 2 === 0 ? 'white' : '#fcfcfc'
                          }}
                        >
                          <td style={{ padding: '12px 16px', fontWeight: 800 }}>
                            {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : '#' + (idx + 1)}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{cName}</span>
                              {isMyClass && (
                                <span style={{ background: '#059669', color: 'white', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                                  صفك 👈
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 900, color: '#059669', fontSize: '1rem' }}>
                            {data.total.toLocaleString('ar-EG')}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#64748b' }}>
                            {data.dailyActive} من {data.totalStudents} طالب
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '80px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: rate + '%', height: '100%', background: '#059669', borderRadius: '4px' }}></div>
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{rate}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {idx === 0 ? (
                              <span style={{ background: '#fef08a', color: '#854d0e', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '8px' }}>متصدر 👑</span>
                            ) : idx < 3 ? (
                              <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '8px' }}>منصة التتويج ⚡</span>
                            ) : (
                              <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '8px' }}>نشط 🌟</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Bottom Call to Action for Students */}
            <div style={{
              background: 'linear-gradient(135deg, #022c22, #064e3b)',
              borderRadius: '18px',
              padding: '1.25rem',
              textAlign: 'center',
              color: 'white',
              border: '1.5px solid #10b981',
              marginTop: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fef08a' }}>
                ⚡ تريد رفع نقاط صفك للمركز الأول في المسابقة؟
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#a7f3d0' }}>
                افتح مسبحة الطالب من هاتفك أو حاسوبك من بيتك الآن وابدأ بالتسبيح وذكر الله!
              </p>
              <button
                onClick={() => setActiveTab('student-view')}
                className="tasbih-btn"
                style={{
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  padding: '8px 24px',
                  borderRadius: '14px',
                  boxShadow: '0 4px 15px rgba(16,185,129,0.4)',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                📱 الانتقال لمسبحة الطالب والبدء فوراً 👈
              </button>
            </div>
          </div>
        )}

      {/* Safety Confirmation Modal for Admin Archive / Reset */}
      {isArchiveModalOpen && (
        <div className="tasbih-modal-backdrop" onClick={() => setIsArchiveModalOpen(false)}>
          <div className="tasbih-modal-card" onClick={e => e.stopPropagation()}>
            <div className="tasbih-modal-header danger">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="tasbih-modal-icon-wrap danger">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#991b1b' }}>
                    إجراء أمني: تأكيد أرشفة وتصفير الأسبوع
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#b91c1c' }}>
                    حماية بيانات وجهود طلاب مدرسة مشيرفة
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="tasbih-modal-close-btn"
                onClick={() => setIsArchiveModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="tasbih-modal-body">
              <div className="tasbih-warning-banner">
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '1.6rem', color: '#d97706', marginTop: '2px' }}></i>
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>تنبيه إداري فائق الأهمية:</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    أنت على وشك تصفير العداد العام المشترك لجميع طلاب المدرسة لبدء أسبوع جديد. تم حظر هذا الإجراء في شاشة الطلاب حفاظاً على جهودهم ولا يمكن تنفيذه إلا من هذه النافذة الإدارية.
                  </p>
                </div>
              </div>

              <div className="tasbih-archive-stats-box">
                <div className="tasbih-archive-stat-item">
                  <span className="stat-label">إجمالي تسبيحات المدرسة:</span>
                  <span className="stat-value">{globalTotal.toLocaleString('ar-EG')}</span>
                </div>
                <div className="tasbih-archive-stat-item">
                  <span className="stat-label">عدد الصفوف الموثقة:</span>
                  <span className="stat-value">{Object.keys(classStats).length} صفوف</span>
                </div>
              </div>

              {/* Step 1: Download backup */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: '6px', color: '#1e293b' }}>
                  ١. الخطوة الأولى (موصى بها بشدة): حفظ نسخة احتياطية
                </div>
                <button
                  type="button"
                  className="tasbih-btn tasbih-btn-emerald"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    handleExportCSV();
                    setArchiveBackupDownloaded(true);
                  }}
                >
                  <i className="fas fa-file-excel"></i>
                  {archiveBackupDownloaded ? '✅ تم تحميل التقرير وحفظه (يمكنك المتابعة)' : 'تحميل وتوثيق تقرير الأسبوع الحالي (Excel / CSV)'}
                </button>
              </div>

              {/* Step 2: Confirm by typing */}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: '6px', color: '#1e293b' }}>
                  ٢. الخطوة الثانية: تأكيد العملية كتابياً
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 8px 0' }}>
                  لتفادي المسح غير المقصود، يرجى كتابة كلمة <strong style={{ color: '#dc2626' }}>تأكيد</strong> في الحقل التالي:
                </p>
                <input
                  type="text"
                  className="tasbih-input"
                  placeholder="اكتب كلمة: تأكيد"
                  value={archiveConfirmWord}
                  onChange={e => setArchiveConfirmWord(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '1.05rem', fontWeight: 800, letterSpacing: '1px' }}
                />
              </div>
            </div>

            <div className="tasbih-modal-footer">
              <button
                type="button"
                className="tasbih-btn"
                style={{ background: '#e2e8f0', color: '#475569' }}
                onClick={() => {
                  setIsArchiveModalOpen(false);
                  setArchiveConfirmWord('');
                }}
              >
                إلغاء وتراجع
              </button>
              <button
                type="button"
                className="tasbih-btn tasbih-btn-danger"
                disabled={archiveConfirmWord.trim() !== 'تأكيد'}
                style={{
                  opacity: archiveConfirmWord.trim() === 'تأكيد' ? 1 : 0.45,
                  cursor: archiveConfirmWord.trim() === 'تأكيد' ? 'pointer' : 'not-allowed',
                  fontWeight: 800
                }}
                onClick={handleExecuteArchive}
              >
                <i className="fas fa-check-circle"></i>
                أرشفة وتصفير للأسبوع الجديد
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default SchoolTasbihPortal;
