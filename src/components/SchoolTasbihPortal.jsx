import React, { useState, useEffect, useRef } from 'react';
import './SchoolTasbihPortal.css';
import tasbihCounterImg from '../assets/tasbih_counter_clean.jpg';

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

const INITIAL_CLASSES = {
  'الصف الرابع - شعبة (أ)': { total: 8450, totalStudents: 34, dailyActive: 29 },
  'الصف السادس - شعبة (ب)': { total: 7920, totalStudents: 32, dailyActive: 27 },
  'الصف الخامس - شعبة (أ)': { total: 6810, totalStudents: 30, dailyActive: 24 },
  'الصف الثالث - شعبة (ج)': { total: 5490, totalStudents: 33, dailyActive: 22 },
  'الصف الخامس - شعبة (ب)': { total: 5120, totalStudents: 31, dailyActive: 20 },
  'الصف الرابع - شعبة (ب)': { total: 4780, totalStudents: 32, dailyActive: 21 },
  'الصف الثاني - شعبة (أ)': { total: 4320, totalStudents: 29, dailyActive: 19 },
  'الصف الأول - شعبة (أ)':  { total: 3950, totalStudents: 30, dailyActive: 25 },
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
    if (h.includes('kiosk') || h.includes('entrance')) return 'kiosk-view';
    if (h.includes('classes') || h.includes('leaderboard')) return 'classes-view';
    if (h.includes('admin')) return 'admin-control';
    return 'student-view'; // Default for direct mobile visits
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
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
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
    return localStorage.getItem('school_unified_student_grade') || 'الصف الرابع - شعبة (أ)';
  });
  const [counterSkin, setCounterSkin] = useState(() => {
    return localStorage.getItem('tasbih_counter_skin') || 'pink';
  });
  const [isBtnPressed, setIsBtnPressed] = useState(false);
  const [antiSpamWarning, setAntiSpamWarning] = useState('');
  const lastStudentTapRef = useRef(0);
  const [kioskCooldownActive, setKioskCooldownActive] = useState({});

  const getSkinFilter = (skin) => {
    switch (skin) {
      case 'emerald': return 'hue-rotate(240deg) saturate(1.25) brightness(0.95)';
      case 'gold': return 'hue-rotate(185deg) saturate(1.4) brightness(1.05)';
      case 'blue': return 'hue-rotate(330deg) saturate(1.3) brightness(0.95)';
      case 'purple': return 'hue-rotate(75deg) saturate(1.2)';
      default: return 'none';
    }
  };

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
    setGlobalTotal(prev => prev + 1);
    setDhikrCounts(prev => ({
      ...prev,
      [dhikrId]: (prev[dhikrId] || 0) + 1
    }));

    if (!isKiosk) {
      setStudentSessionCount(prev => {
        const next = prev + 1;
        if (next === studentTargetRound || next % studentTargetRound === 0) {
          playChimeTone();
        }
        return next;
      });

      if (studentClass && classStats[studentClass]) {
        setClassStats(prev => ({
          ...prev,
          [studentClass]: {
            ...prev[studentClass],
            total: prev[studentClass].total + 1
          }
        }));
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

  const handleArchiveWeekly = () => {
    if (window.confirm('⚠️ هل أنت متأكد من تصفير العدادات للأسبوع الجديد وأرشفة النتائج الحالية؟')) {
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
      showToast('تمت أرشفة الأسبوع وتصفير العدادات بنجاح 🗄️');
    }
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
      {/* 1. TOP SECRET ADMIN BAR */}
      <div className="tasbih-secret-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isPublished ? (
            <span className="tasbih-badge-published">
              <i className="fas fa-globe"></i> منشورة للجمهور على الموقع
            </span>
          ) : (
            <span className="tasbih-badge-secret">
              <i className="fas fa-lock"></i> مسودة سرية خاصة بالمدير (غير منشورة)
            </span>
          )}
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
            🕌 منظومة التسبيح والأذكار المدرسية التفاعلية
          </span>
        </div>

        {/* Publishing Toggle & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              const newState = !isPublished;
              setIsPublished(newState);
              localStorage.setItem('tasbih_is_published', String(newState));
              window.dispatchEvent(new Event('tasbihPublishChanged'));
              showToast(newState ? 'تم نشر المنظومة وظهورها في قائمة الموقع للجمهور 🚀' : 'تم إلغاء النشر وإخفاؤها لتكون مسودة سرية خاصة بك 🔒');
            }}
            className="tasbih-btn"
            style={{
              background: isPublished ? '#dc2626' : '#10b981',
              color: 'white',
              fontSize: '0.85rem',
              padding: '0.5rem 1.1rem',
            }}
          >
            <i className={isPublished ? 'fas fa-eye-slash' : 'fas fa-bullhorn'}></i>
            {isPublished ? 'إلغاء النشر وجعلها سرية' : '🚀 نشر المنظومة للجمهور في الموقع'}
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="tasbih-nav-tabs">
        <button
          className={'tasbih-tab-btn ' + (activeTab === 'admin-control' ? 'active' : '')}
          onClick={() => setActiveTab('admin-control')}
        >
          <i className="fas fa-sliders-h"></i> ⚙️ لوحة التحكم والإعدادات الشاملة
        </button>
        <button
          className={'tasbih-tab-btn ' + (activeTab === 'kiosk-view' ? 'active' : '')}
          onClick={() => setActiveTab('kiosk-view')}
        >
          <i className="fas fa-tv"></i> 🏛️ معاينة شاشة المدخل الكبرى (Kiosk)
        </button>
        <button
          className={'tasbih-tab-btn ' + (activeTab === 'student-view' ? 'active' : '')}
          onClick={() => setActiveTab('student-view')}
        >
          <i className="fas fa-mobile-alt"></i> 📱 معاينة مسبحة الطالب الذكية
        </button>
        <button
          className={'tasbih-tab-btn ' + (activeTab === 'classes-view' ? 'active' : '')}
          onClick={() => setActiveTab('classes-view')}
        >
          <i className="fas fa-trophy"></i> 🏆 معاينة لوحة تنافس الصفوف
        </button>
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
                <button onClick={handleArchiveWeekly} className="tasbih-btn tasbih-btn-danger">
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
              <div style={{ textAlign: 'left', fontSize: '0.85rem', color: '#a7f3d0' }}>
                معدل الأمان: {settings.kioskCooldown} ثانية
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

            {/* Interactive 5 Touch Buttons */}
            <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '0.85rem', color: '#6ee7b7', fontWeight: 700 }}>
              👆 المس الأزرار أدناه لتسجيل تسبيحة فورية في شاشة المدخل:
            </div>

            <div className="kiosk-btn-grid">
              {adhkarList.filter(d => d.kioskActive).slice(0, 5).map(d => {
                const isCooling = !!kioskCooldownActive[d.id];
                return (
                  <button
                    key={d.id}
                    disabled={isCooling}
                    onClick={() => handleTapDhikr(d.id, 'kiosk')}
                    className="kiosk-dhikr-btn"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.7rem' }}>{d.badge}</span>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '10px', color: '#6ee7b7' }}>+١</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', margin: '8px 0' }}>
                      {d.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isCooling ? '#f59e0b' : '#94a3b8' }}>
                      {isCooling ? 'جاري التسجيل...' : 'اضغط للتسجيل'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: STUDENT VIEW PREVIEW */}
        {activeTab === 'student-view' && (
          <div style={{ maxWidth: '480px', margin: '0 auto', background: '#022c22', color: 'white', borderRadius: '24px', padding: '1.5rem', border: '2px solid #059669', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(16,185,129,0.2)', paddingBottom: '12px', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{studentName}</div>
                <div style={{ fontSize: '0.75rem', color: '#34d399' }}>{studentClass}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setStudentTargetRound(33)}
                  style={{ background: studentTargetRound === 33 ? '#059669' : '#0f172a', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  ٣٣
                </button>
                <button
                  onClick={() => setStudentTargetRound(100)}
                  style={{ background: studentTargetRound === 100 ? '#059669' : '#0f172a', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
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
                    background: studentActiveDhikr === d.id ? '#059669' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
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
            <div style={{ textAlign: 'center', margin: '1rem 0 0.5rem 0' }}>
              <div style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 700 }}>الذكر النشط:</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '4px 0', color: 'white' }}>
                {adhkarList.find(d => d.id === studentActiveDhikr)?.title}
              </h3>
            </div>

            {/* REAL ELECTRONIC DIGITAL TALLY COUNTER */}
            <div className="tasbih-real-counter-section">
              <div className="tasbih-device-wrapper">
                <img
                  src={tasbihCounterImg}
                  alt="المسبحة الإلكترونية"
                  className="tasbih-device-casing"
                  style={{ filter: getSkinFilter(counterSkin) }}
                />

                {/* Digital LCD Screen */}
                <div
                  className={`tasbih-lcd-screen ${studentSessionCount > 0 && studentSessionCount % studentTargetRound === 0 ? 'celebrate' : ''}`}
                >
                  <div className="tasbih-lcd-meta">
                    <span className="tasbih-lcd-round-badge">
                      {studentTargetRound}
                    </span>
                    <span className="tasbih-lcd-icon">
                      {adhkarList.find(d => d.id === studentActiveDhikr)?.badge || '✨'}
                    </span>
                  </div>

                  {/* LCD Digits */}
                  <div className="tasbih-lcd-digits">
                    {String(studentSessionCount % studentTargetRound).padStart(4, '0')}
                  </div>
                </div>

                {/* Big Main Push Button */}
                <button
                  type="button"
                  aria-label="تسبيح"
                  className={`tasbih-main-push-btn ${isBtnPressed ? 'pressed' : ''}`}
                  onMouseDown={() => setIsBtnPressed(true)}
                  onMouseUp={() => setIsBtnPressed(false)}
                  onTouchStart={() => setIsBtnPressed(true)}
                  onTouchEnd={() => setIsBtnPressed(false)}
                  onClick={() => handleTapDhikr(studentActiveDhikr, 'mobile')}
                  title="المس الزر للتسبيح"
                >
                  <span className="btn-touch-hint">اضغط 👆</span>
                </button>

                {/* Small Reset Button */}
                <button
                  type="button"
                  aria-label="تصفير العداد"
                  className="tasbih-reset-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    playResetTone();
                    setStudentSessionCount(0);
                    showToast('تم تصفير عداد المسبحة 🔄');
                  }}
                  title="تصفير العداد"
                />
              </div>

              {/* Color Skins Selector */}
              <div className="tasbih-skins-row">
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginLeft: '4px' }}>
                  شكل المسبحة:
                </span>
                {[
                  { id: 'pink', color: '#f472b6', name: 'الزهري الطبيعي (الافتراضي)' },
                  { id: 'emerald', color: '#10b981', name: 'زمردي مدرسة مشيرفة' },
                  { id: 'gold', color: '#f59e0b', name: 'الملكي الذهبي' },
                  { id: 'blue', color: '#3b82f6', name: 'الأزرق الفلكي' },
                  { id: 'purple', color: '#a855f7', name: 'البنفسجي الإبداعي' }
                ].map(skin => (
                  <button
                    key={skin.id}
                    title={skin.name}
                    onClick={() => {
                      setCounterSkin(skin.id);
                      localStorage.setItem('tasbih_counter_skin', skin.id);
                    }}
                    className={`tasbih-skin-pill ${counterSkin === skin.id ? 'active' : ''}`}
                    style={{ background: skin.color }}
                  />
                ))}
              </div>
            </div>

            {/* Spiritual Merit Card */}
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '12px', textAlign: 'right', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fef08a', marginBottom: '4px' }}>
                ✨ الثواب والأجر في ميزان حسناتك:
              </div>
              <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
                {studentActiveDhikr === 'salawat'
                  ? 'صليت على النبي ﷺ ' + studentSessionCount + ' مرات، فصلى الله عليك بها ' + (studentSessionCount * 10) + ' صلوات، وحط عنك خطاياك ورفع درجاتك.'
                  : 'غرست لنفسك ' + studentSessionCount + ' نخلة وشجرة مباركة في الجنة بإذن الله تعالى.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: CLASSES LEADERBOARD PREVIEW */}
        {activeTab === 'classes-view' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ background: '#ecfdf5', color: '#065f46', fontSize: '0.85rem', fontWeight: 800, padding: '4px 14px', borderRadius: '20px' }}>
                🏆 تنافس الشعب المدرسية الإيماني
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px 0' }}>
                لوحة الشرف وتنافس الصفوف
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                يتم احتساب المراكز بناء على التفاعل الجماعي ونسبة مشاركة طلاب كل صف.
              </p>
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
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(classStats)
                    .sort(([, a], [, b]) => b.total - a.total)
                    .map(([cName, data], idx) => {
                      const rate = Math.round((data.dailyActive / data.totalStudents) * 100);
                      return (
                        <tr key={cName} style={{ borderBottom: '1px solid #e2e8f0', background: idx === 0 ? '#fefce8' : idx === 1 ? '#f8fafc' : 'white' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 800 }}>
                            {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : '#' + (idx + 1)}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{cName}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: '#059669' }}>{data.total.toLocaleString('ar-EG')}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#64748b' }}>{data.dailyActive} من {data.totalStudents}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '80px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: rate + '%', height: '100%', background: '#059669', borderRadius: '4px' }}></div>
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SchoolTasbihPortal;
