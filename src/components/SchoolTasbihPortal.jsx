import React, { useState, useEffect, useRef } from 'react';
import './SchoolTasbihPortal.css';
import tasbihEmeraldImg from '../assets/tasbih_emerald.jpg';
import tasbihMarbleImg from '../assets/tasbih_marble.jpg';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, increment } from 'firebase/firestore';
import { getStudentSession, saveStudentSession } from '../utils/studentAuth';

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

// All 19 Classes: Grade 1 (1-3), Grade 2 (1-3), Grade 3 (1-3), Grade 4 (1-3), Grade 5 (1-3), Grade 6 (1-4)
const ALL_19_CLASSES = [
  'الأول 1',
  'الأول 2',
  'الأول 3',
  'الثاني 1',
  'الثاني 2',
  'الثاني 3',
  'الثالث 1',
  'الثالث 2',
  'الثالث 3',
  'الرابع 1',
  'الرابع 2',
  'الرابع 3',
  'الخامس 1',
  'الخامس 2',
  'الخامس 3',
  'السادس 1',
  'السادس 2',
  'السادس 3',
  'السادس 4',
];

const mapUnifiedClassTo19 = (rawClass) => {
  if (!rawClass) return null;
  const str = String(rawClass).trim();
  if (ALL_19_CLASSES.includes(str)) return str;

  const grades = [
    { name: 'الأول', key: 'الأول' },
    { name: 'الثاني', key: 'الثاني' },
    { name: 'الثالث', key: 'الثالث' },
    { name: 'الرابع', key: 'الرابع' },
    { name: 'الخامس', key: 'الخامس' },
    { name: 'السادس', key: 'السادس' },
  ];

  for (const g of grades) {
    if (str.includes(g.name)) {
      if (str.includes('4') || str.includes('(د)') || str.includes('د')) {
        if (g.key === 'السادس') return 'السادس 4';
      }
      if (str.includes('3') || str.includes('(ج)') || str.includes('ج')) {
        return `${g.key} 3`;
      }
      if (str.includes('2') || str.includes('(ب)') || str.includes('ب')) {
        return `${g.key} 2`;
      }
      if (str.includes('1') || str.includes('(أ)') || str.includes('أ')) {
        return `${g.key} 1`;
      }
      return `${g.key} 1`;
    }
  }
  return null;
};

const INITIAL_CLASSES = {
  'السادس 1': { total: 5820, totalStudents: 32, dailyActive: 28 },
  'السادس 2': { total: 5410, totalStudents: 31, dailyActive: 27 },
  'السادس 3': { total: 5120, totalStudents: 30, dailyActive: 25 },
  'السادس 4': { total: 4890, totalStudents: 29, dailyActive: 24 },
  'الخامس 1': { total: 4720, totalStudents: 32, dailyActive: 26 },
  'الخامس 2': { total: 4510, totalStudents: 31, dailyActive: 23 },
  'الخامس 3': { total: 4320, totalStudents: 30, dailyActive: 22 },
  'الرابع 1': { total: 4180, totalStudents: 33, dailyActive: 25 },
  'الرابع 2': { total: 3990, totalStudents: 32, dailyActive: 24 },
  'الرابع 3': { total: 3820, totalStudents: 31, dailyActive: 21 },
  'الثالث 1': { total: 3650, totalStudents: 32, dailyActive: 22 },
  'الثالث 2': { total: 3490, totalStudents: 31, dailyActive: 21 },
  'الثالث 3': { total: 3320, totalStudents: 30, dailyActive: 20 },
  'الثاني 1': { total: 3180, totalStudents: 31, dailyActive: 23 },
  'الثاني 2': { total: 3020, totalStudents: 30, dailyActive: 21 },
  'الثاني 3': { total: 2890, totalStudents: 29, dailyActive: 20 },
  'الأول 1':  { total: 2740, totalStudents: 30, dailyActive: 25 },
  'الأول 2':  { total: 2580, totalStudents: 29, dailyActive: 24 },
  'الأول 3':  { total: 2420, totalStudents: 28, dailyActive: 22 },
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

const MILESTONE_MESSAGES = {
  100: {
    badge: '🌟',
    title: 'مبارك يا بطل! أتممت 100 تسبيحة مباركة',
    msg: 'هنيئاً لك غراس الجنة ونوراً في صحيفتك، ورفعت رصيد صفك 100 نقطة في المسابقة المدرسية!',
    level: 'وسام الـ 100 تسبيحة 🏅'
  },
  200: {
    badge: '🏆',
    title: 'إنجاز بطولي رائع! 200 تسبيحة',
    msg: 'بورك لسانك الذاكر وقلبك الطيب! أنت من نخبة طلاب مدرسة مشيرفة المتألقين، واصل الهمة!',
    level: 'فارس الذاكرين 🥈'
  },
  300: {
    badge: '👑',
    title: 'تاج الذاكرين وفخر المدرسة! 300 تسبيحة',
    msg: 'ما أعظم همتك ونقاء سريرتك! حطت عنك الخطايا ورُفعت درجاتك في عليين، وصفك يقترب من الصدارة!',
    level: 'أمير التسبيح 🥇'
  },
  400: {
    badge: '🌿',
    title: 'همة إيمانية تعانق السحاب! 400 تسبيحة',
    msg: 'ثواب عظيم ومنازل رفيعة لك ولوالديك في الجنة بإذن الله تعالى. استمر في نشر الخير والبركة!',
    level: 'سفير النور 💎'
  },
  500: {
    badge: '⭐',
    title: 'إنجاز تاريخي مبهر! 500 تسبيحة مباركة',
    msg: 'نصف ألف تسبيحة عطرت بها بيتك ومدرستك! مدرسة مشيرفة الابتدائية تفتخر بك وبهمتك العالية!',
    level: 'بطل مشيرفة الذهبي 👑'
  }
};

const getMilestoneData = (count) => {
  if (MILESTONE_MESSAGES[count]) {
    return { ...MILESTONE_MESSAGES[count], count };
  }
  return {
    badge: '👑',
    title: `ما شاء الله تبارك الله! ${count} تسبيحة مباركة`,
    msg: `همة أسطورية مباركة في ذكر الله تعالى! بارك الله فيك ونفع بك ورزقك الفردوس الأعلى برفقة النبي ﷺ.`,
    level: `أسطورة الذكر (${count} تسبيحة) ✨`,
    count
  };
};

const SchoolTasbihPortal = ({ initialTab, isAdminMode = false }) => {
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    const h = window.location.hash || '';
    if (h.includes('solo')) return 'solo-view';
    if (h.includes('competition') || h.includes('classes') || h.includes('leaderboard')) return 'competition-view';
    if (h.includes('counter') || h.includes('student')) return 'solo-view';
    if (isAdminMode && h.includes('settings')) return 'admin-control';
    return 'kiosk-view'; // Default: Main School Display
  });
  const [isPublished, setIsPublished] = useState(() => {
    return localStorage.getItem('tasbih_is_published') !== 'false';
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

  // Section 2: Solo Tasbih States
  const [soloUserName, setSoloUserName] = useState(() => {
    return localStorage.getItem('tasbih_solo_user_name') || '';
  });
  const [soloSessionCount, setSoloSessionCount] = useState(0);
  const [soloSavedTotal, setSoloSavedTotal] = useState(() => {
    return Number(localStorage.getItem('tasbih_solo_cumulative_total')) || 0;
  });
  const [soloTargetRound, setSoloTargetRound] = useState(33);
  const [soloActiveDhikr, setSoloActiveDhikr] = useState('salawat');

  // Section 3: 19-Class Competition & Unified Login States
  const [unifiedSession, setUnifiedSession] = useState(() => getStudentSession());
  const [competitionStudentName, setCompetitionStudentName] = useState(() => {
    const sess = getStudentSession();
    if (sess && sess.fullName) return sess.fullName;
    return localStorage.getItem('school_unified_student_name') || 'يوسف أحمد';
  });
  const [studentClass, setStudentClass] = useState(() => {
    const sess = getStudentSession();
    if (sess && sess.studentClass) {
      const mapped = mapUnifiedClassTo19(sess.studentClass);
      if (mapped) return mapped;
    }
    const saved = localStorage.getItem('school_unified_student_grade');
    return (saved && ALL_19_CLASSES.includes(saved)) ? saved : 'السادس 1';
  });
  const [competitionSessionCount, setCompetitionSessionCount] = useState(0);
  const [competitionTargetRound, setCompetitionTargetRound] = useState(33);
  const [competitionActiveDhikr, setCompetitionActiveDhikr] = useState('salawat');
  const [leaderboardFilter, setLeaderboardFilter] = useState('all'); // all, 1, 2, 3, 4, 5, 6

  // Listen to Global Unified Auth changes
  useEffect(() => {
    const handleAuth = () => {
      const sess = getStudentSession();
      setUnifiedSession(sess);
      if (sess && sess.fullName) {
        setCompetitionStudentName(sess.fullName);
        const mapped = mapUnifiedClassTo19(sess.studentClass);
        if (mapped) setStudentClass(mapped);
      }
    };
    window.addEventListener('studentAuthChanged', handleAuth);
    return () => window.removeEventListener('studentAuthChanged', handleAuth);
  }, []);

  const [counterSkin, setCounterSkin] = useState(() => {
    const saved = localStorage.getItem('tasbih_counter_skin');
    return saved === 'marble' ? 'marble' : 'emerald';
  });
  const [pressedBtnId, setPressedBtnId] = useState(null);
  const [antiSpamWarning, setAntiSpamWarning] = useState('');
  const lastStudentTapRef = useRef(0);
  const [kioskCooldownActive, setKioskCooldownActive] = useState({});
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveConfirmWord, setArchiveConfirmWord] = useState('');
  const [archiveBackupDownloaded, setArchiveBackupDownloaded] = useState(false);
  const [milestoneCelebration, setMilestoneCelebration] = useState(null);
  const [highestMilestone, setHighestMilestone] = useState(0);

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

  const getOledFontSize = (num) => {
    if (num >= 100000) return '0.90rem';
    if (num >= 10000) return '1.02rem';
    if (num >= 1000) return '1.14rem';
    return '1.25rem';
  };

  const [isCloudConnected, setIsCloudConnected] = useState(true);

  // Real-time Cloud Synchronization across all devices (Firebase Firestore)
  useEffect(() => {
    try {
      const liveDocRef = doc(db, 'students', 'tasbih_live_portal');
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
          if (typeof data.isPublished === 'boolean') {
            setIsPublished(data.isPublished);
            localStorage.setItem('tasbih_is_published', String(data.isPublished));
          }
          setIsCloudConnected(true);
        } else {
          // Initialize first time in cloud
          setDoc(liveDocRef, {
            globalTotal: 67852,
            isPublished: true,
            dhikrCounts: {
              salawat: 42352,
              subhanallah: 11200,
              alhamdulillah: 6840,
              lailahaillallah: 4120,
              allahuakbar: 3340,
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
    const isSolo = source === 'solo';
    const isCompetition = source === 'competition';
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
      const liveDocRef = doc(db, 'students', 'tasbih_live_portal');
      const updatePayload = {
        globalTotal: increment(1),
        [`dhikrCounts.${dhikrId}`]: increment(1),
        lastUpdated: new Date().toISOString()
      };
      if (isCompetition && studentClass) {
        updatePayload[`classStats.${studentClass}.total`] = increment(1);
      }
      updateDoc(liveDocRef, updatePayload).catch(() => {
        setDoc(liveDocRef, updatePayload, { merge: true }).catch(() => {});
      });
    } catch (e) {
      console.warn('Cloud tap broadcast error:', e);
    }

    // 3a. Solo Tasbih Updates
    if (isSolo) {
      setSoloSavedTotal(prev => {
        const next = prev + 1;
        localStorage.setItem('tasbih_solo_cumulative_total', String(next));
        return next;
      });

      setSoloSessionCount(prev => {
        const next = prev + 1;
        if (next > 0 && next % 100 === 0) {
          playChimeTone();
          setMilestoneCelebration(getMilestoneData(next));
          setHighestMilestone(h => Math.max(h, next));
        } else if (next === soloTargetRound || next % soloTargetRound === 0) {
          playChimeTone();
        }
        return next;
      });
    }

    // 3b. Competition Updates (19 Classes)
    if (isCompetition) {
      setCompetitionSessionCount(prev => {
        const next = prev + 1;
        if (next > 0 && next % 100 === 0) {
          playChimeTone();
          const baseData = getMilestoneData(next);
          setMilestoneCelebration({
            ...baseData,
            msg: `ما شاء الله يا ${competitionStudentName || 'بطل'}! أهديت صفك (${studentClass}) مئة تسبيحة نورانية ورفعت ترتيب صفك في المسابقة 🚀`
          });
          setHighestMilestone(h => Math.max(h, next));
        } else if (next === competitionTargetRound || next % competitionTargetRound === 0) {
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

    // Sync cloud reset
    try {
      const resetClasses = {};
      Object.keys(classStats).forEach(k => {
        resetClasses[k] = { ...classStats[k], total: 0, dailyActive: 0 };
      });
      updateDoc(doc(db, 'students', 'tasbih_live_portal'), {
        globalTotal: 0,
        dhikrCounts: {
          salawat: 0,
          subhanallah: 0,
          alhamdulillah: 0,
          lailahaillallah: 0,
          allahuakbar: 0,
          astaghfirullah: 0,
        },
        classStats: resetClasses,
        lastUpdated: new Date().toISOString()
      }).catch(() => {});
    } catch (e) {}

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
          <i className="fas fa-school"></i> 🏛️ الشاشة الرئيسية للمدرسة
        </button>
        <button
          className={'tasbih-tab-btn ' + (activeTab === 'solo-view' ? 'active' : '')}
          onClick={() => setActiveTab('solo-view')}
        >
          <i className="fas fa-user"></i> 📿 التسبيح المنفرد
        </button>
        <button
          className={'tasbih-tab-btn ' + (activeTab === 'competition-view' ? 'active' : '')}
          onClick={() => setActiveTab('competition-view')}
        >
          <i className="fas fa-trophy"></i> 🏆 مسابقة الـ 19 صفاً
        </button>
        {isAdminMode && (
          <button
            className={'tasbih-tab-btn ' + (activeTab === 'admin-control' ? 'active' : '')}
            onClick={() => setActiveTab('admin-control')}
          >
            <i className="fas fa-sliders-h"></i> ⚙️ لوحة التحكم والإعدادات
          </button>
        )}
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
        {isAdminMode && activeTab === 'admin-control' && (
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
                    try {
                      updateDoc(doc(db, 'students', 'tasbih_live_portal'), {
                        isPublished: newState,
                        lastUpdated: new Date().toISOString()
                      }).catch(() => {
                        setDoc(doc(db, 'students', 'tasbih_live_portal'), { isPublished: newState }, { merge: true }).catch(() => {});
                      });
                    } catch (e) {}
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
                  {globalTotal.toLocaleString('en-US')}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 700 }}>
                  إجمالي التسبيحات الكلي
                </div>
              </div>
              <div className="tasbih-card" style={{ textAlign: 'center', background: '#fffbeb', borderColor: '#fef08a' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#d97706' }}>
                  {(dhikrCounts['salawat'] || 0).toLocaleString('en-US')}
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
            <div className="tasbih-header-box" style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '20px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div style={{ fontSize: '0.9rem', color: '#6ee7b7', fontWeight: 700, marginBottom: '6px' }}>
                مجموع الأذكار والتسبيحات المسجلة في المدرسة
              </div>
              <div className="tasbih-global-total-num" style={{ fontSize: '4.5rem', fontWeight: 900, color: '#fef08a', textShadow: '0 0 30px rgba(245,158,11,0.5)', lineHeight: 1.1 }}>
                {globalTotal.toLocaleString('en-US')}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '6px' }}>
                تسبيحة وذكرة عطرت مدرستنا وبيوت طلابنا
              </div>
            </div>

            {/* Campaign Progress */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                <span>🎯 {campaign.title}</span>
                <span style={{ color: '#f59e0b' }}>{campaignPercent}% (تم إنجاز {campaignCurrent.toLocaleString('en-US')} من {campaignTarget.toLocaleString('en-US')})</span>
              </div>
              <div style={{ height: '14px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: campaignPercent + '%', background: 'linear-gradient(90deg, #10b981, #f59e0b)', borderRadius: '10px', transition: 'width 0.5s' }}></div>
              </div>
            </div>

            {/* Kiosk Multi-Tasbih Grid (مسبحة مخصصة تحت كل عبارة) */}
            <div className="kiosk-grid-container" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(16,185,129,0.2)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '1.25rem', borderBottom: '1px solid rgba(16,185,129,0.2)', paddingBottom: '12px' }}>
                <div style={{ fontSize: '1.05rem', color: '#fef08a', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>📿</span>
                  <span>بستان الأذكار ومسابح النور • مسبحة إلكترونية تحت كل عبارة (اضغط الزر الذهبي لأي ذكر للتسجيل فورياً):</span>
                </div>

                {/* Skins Selector */}
                <div className="tasbih-skins-row" style={{ marginTop: 0 }}>
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
                    <span>الزمردي الملكي 👑</span>
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
                    <span>الرخام الإيطالي 🏛️</span>
                  </button>
                </div>
              </div>

              {/* MULTI-TASBIH GRID */}
              <div className="tasbih-multi-grid">
                {adhkarList.filter(d => d.kioskActive).map(d => {
                  const isTarget = campaign.targetDhikr === d.id;
                  const count = dhikrCounts[d.id] || 0;
                  const isCooldown = !!kioskCooldownActive[d.id];
                  const isPressed = pressedBtnId === d.id;

                  return (
                    <div
                      key={d.id}
                      className={`tasbih-dhikr-card ${isTarget ? 'active-target' : ''}`}
                    >
                      {/* Header with Phrase & Merit */}
                      <div className="tasbih-card-header">
                        <span className="tasbih-card-badge">{d.badge}</span>
                        <h3 className="tasbih-card-title">{d.title}</h3>
                        <span className="tasbih-card-merit">
                          {isTarget ? '🎯 هدف حملة الأسبوع' : d.meritText || 'أجر عظيم وثواب مضاعف'}
                        </span>
                      </div>

                      {/* Dedicated Electronic 3D Digital Tasbih */}
                      <div className="tasbih-card-device-wrap">
                        <div className={`tasbih-device-wrapper skin-${currentTasbihSkin.id}`}>
                          <img
                            src={currentTasbihSkin.img}
                            alt={currentTasbihSkin.name}
                            className="tasbih-device-casing"
                          />

                          {/* Digital OLED Screen */}
                          <div className={`${currentTasbihSkin.screenClass} ${isCooldown ? 'celebrate' : ''}`}>
                            <div className="tasbih-lcd-meta">
                              <span className="tasbih-lcd-round-badge">
                                {isCloudConnected ? '🟢 سحابي' : 'محلي'}
                              </span>
                              <span className="tasbih-lcd-icon">
                                {d.badge}
                              </span>
                            </div>

                            {/* OLED Digits */}
                            <div
                              className="tasbih-lcd-digits"
                              style={{
                                fontSize: getOledFontSize(count)
                              }}
                            >
                              {count.toLocaleString('en-US')}
                            </div>
                          </div>

                          {/* Tactile Golden Push Button */}
                          <button
                            type="button"
                            disabled={isCooldown}
                            aria-label={`تسبيح ${d.shortTitle}`}
                            className={`${currentTasbihSkin.btnClass} ${isPressed ? 'pressed' : ''}`}
                            onMouseDown={() => setPressedBtnId(d.id)}
                            onMouseUp={() => setPressedBtnId(null)}
                            onTouchStart={() => setPressedBtnId(d.id)}
                            onTouchEnd={() => setPressedBtnId(null)}
                            onClick={() => handleTapDhikr(d.id, 'kiosk')}
                            title={`المس الزر الذهبي لتسجيل: ${d.shortTitle}`}
                          >
                            <span className="btn-touch-hint">اضغط 👆</span>
                          </button>

                          {/* Small Protected Reset Button */}
                          <button
                            type="button"
                            aria-label="تصفير محمي"
                            className={currentTasbihSkin.resetClass}
                            onClick={(e) => {
                              e.stopPropagation();
                              playResetTone();
                              showToast('🔒 هذا العداد المبارك يجمع جهود جميع طلاب مدرسة مشيرفة، ولا يمكن مسحه إلا من قِبل إدارة المدرسة ✨');
                            }}
                            title="العداد العام محمي"
                          />
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="tasbih-card-footer-stats">
                        <span className="dhikr-multiplier">
                          {isTarget ? '⭐ حملة المدرسة' : `مضاعف: ${d.multiplier}x`}
                        </span>
                        <span className="dhikr-total">
                          {count.toLocaleString('en-US')} تسبيحة
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Navigation Cards to Solo and Competition Views */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '14px',
                marginTop: '1.75rem'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #022c22, #064e3b)',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  border: '1.5px solid #10b981',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📿</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fef08a', margin: '0 0 6px 0' }}>
                    التسبيح المنفرد
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#a7f3d0', margin: '0 0 12px 0' }}>
                    مسبحة خاصة لكل شخص يريد الذكر بمفرده مع حفظ إجماليك التراكمي الدائم
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('solo-view')}
                    className="tasbih-btn tasbih-btn-emerald"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    فتح التسبيح المنفرد 👈
                  </button>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #0f172a, #022c22)',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  border: '1.5px solid #fbbf24',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>🏆</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fef08a', margin: '0 0 6px 0' }}>
                    مسابقة الـ 19 صفاً
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#fef08a', margin: '0 0 12px 0' }}>
                    سباق إيماني بين جميع الشعب من الأول حتى السادس مع ربط الدخول الموحد
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('competition-view')}
                    className="tasbih-btn tasbih-btn-gold"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    دخول مسابقة الصفوف 🚀
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: SOLO TASBIH VIEW (التسبيح المنفرد) */}
        {activeTab === 'solo-view' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header & Description */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span style={{
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#fef08a',
                fontSize: '0.85rem',
                fontWeight: 900,
                padding: '5px 16px',
                borderRadius: '20px',
                border: '1.5px solid #fbbf24',
                boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>📿</span> التسبيح المنفرد • مسبحتك الشخصية لكل الأوقات
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '10px 0 4px 0' }}>
                المسبحة الإلكترونية الفردية
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
                مسبحة مخصصة لكل شخص (طالب، معلم، زائر) يريد ذكر الله في خلوته، مع حفظ إجماليك التراكمي الدائم تلقائياً
              </p>
            </div>

            {/* Optional Name Box */}
            <div style={{
              background: 'linear-gradient(135deg, #064e3b, #022c22)',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              border: '1.5px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              color: 'white',
              boxShadow: '0 4px 15px rgba(2, 44, 34, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>👤</span>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fef08a' }}>
                    الاسم الكريم (اختياري):
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#a7f3d0', marginTop: '2px' }}>
                    يمكنك التسبيح باسمك أو التسبيح بدون كتابة اسمك لوجه الله تعالى
                  </div>
                </div>
              </div>
              <input
                type="text"
                value={soloUserName}
                onChange={(e) => {
                  setSoloUserName(e.target.value);
                  localStorage.setItem('tasbih_solo_user_name', e.target.value);
                }}
                placeholder="اكتب اسمك هنا (اختياري)..."
                style={{
                  minWidth: '220px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(16,185,129,0.5)',
                  background: 'rgba(0,0,0,0.35)',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Controls Bar: Target & Skins */}
            <div className="student-controls-bar" style={{
              background: '#022c22',
              borderRadius: '20px',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              border: '1.5px solid #059669',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              color: 'white'
            }}>
              <div>
                <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#fef08a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📿</span>
                  <span>اختر أي مقولة مباركة للترديد:</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#a7f3d0', marginTop: '2px' }}>
                  دورتك الحالية: <strong style={{ color: '#fef08a' }}>{soloSessionCount % soloTargetRound}</strong> من <strong>{soloTargetRound}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>هدف الجولة:</span>
                  <button
                    onClick={() => setSoloTargetRound(33)}
                    style={{ background: soloTargetRound === 33 ? '#059669' : '#0f172a', border: soloTargetRound === 33 ? '1px solid #34d399' : '1px solid #334155', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    33
                  </button>
                  <button
                    onClick={() => setSoloTargetRound(100)}
                    style={{ background: soloTargetRound === 100 ? '#059669' : '#0f172a', border: soloTargetRound === 100 ? '1px solid #34d399' : '1px solid #334155', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    100
                  </button>
                </div>

                <div className="tasbih-skins-row" style={{ marginTop: 0 }}>
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
                    <span>الزمردي الملكي 👑</span>
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
                    <span>الرخام الإيطالي 🏛️</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Anti-Spam Warning */}
            {antiSpamWarning && (
              <div style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid #f59e0b', color: '#fef08a', padding: '8px 14px', borderRadius: '12px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, marginBottom: '14px' }}>
                {antiSpamWarning}
              </div>
            )}

            {/* Dhikr Selector Grid */}
            <div className="tasbih-selector-grid">
              {adhkarList.map(d => {
                const isSelected = soloActiveDhikr === d.id;
                const count = dhikrCounts[d.id] || 0;
                const isTarget = campaign.targetDhikr === d.id;
                return (
                  <div
                    key={d.id}
                    className={`tasbih-selector-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSoloActiveDhikr(d.id);
                      showToast(`تم اختيار: ${d.shortTitle} 📿`);
                    }}
                  >
                    <span className="pill-badge">{d.badge}</span>
                    <div style={{ flex: 1 }}>
                      <div className="pill-title">
                        {d.title}
                      </div>
                      <div className="pill-count">
                        {isTarget ? '🎯 حملة الأسبوع • ' : ''}{count.toLocaleString('en-US')} تسبيحة
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Solo Spotlight & Single 3D Electronic Tasbih */}
            {(() => {
              const activeObj = adhkarList.find(d => d.id === soloActiveDhikr) || adhkarList[0];
              const nextMilestone = (Math.floor(soloSessionCount / 100) + 1) * 100;
              const currentRoundProgress = soloSessionCount % 100;
              const isPressed = pressedBtnId === activeObj.id;

              return (
                <div className="tasbih-student-single-container">
                  {/* Spotlight Card */}
                  <div className="tasbih-active-spotlight-card">
                    <div className="spotlight-header">
                      <span className="spotlight-badge">{activeObj.badge}</span>
                      <h2 className="spotlight-title">{activeObj.title}</h2>
                    </div>
                    <p className="spotlight-merit">✨ {activeObj.meritText || 'أجر عظيم وثواب مضاعف'}</p>
                    <div className="spotlight-progress-wrap">
                      <div>
                        <span>الهدف القادم للتشجيع: </span>
                        <strong>{nextMilestone} تسبيحة 🎯</strong>
                      </div>
                      <div>
                        <span>إنجاز المئة الحالية: </span>
                        <strong>{currentRoundProgress} / 100</strong>
                      </div>
                    </div>
                  </div>

                  {/* ONE CENTRAL 3D ELECTRONIC TASBIH */}
                  <div className="tasbih-single-device-wrap">
                    <div className={`tasbih-device-wrapper skin-${currentTasbihSkin.id}`}>
                      <img
                        src={currentTasbihSkin.img}
                        alt={currentTasbihSkin.name}
                        className="tasbih-device-casing"
                      />

                      {/* Digital OLED Screen */}
                      <div
                        className={`${currentTasbihSkin.screenClass} ${soloSessionCount > 0 && soloSessionCount % 100 === 0 ? 'celebrate' : ''}`}
                      >
                        <div className="tasbih-lcd-meta">
                          <span className="tasbih-lcd-round-badge">
                            {soloSessionCount > 0 ? `الجولة: ${Math.floor(soloSessionCount / 100) + 1}` : 'ابدأ التسبيح'}
                          </span>
                          <span className="tasbih-lcd-icon">
                            {activeObj.badge}
                          </span>
                        </div>

                        {/* OLED Digits (Solo Session Count) */}
                        <div
                          className="tasbih-lcd-digits"
                          style={{
                            fontSize: getOledFontSize(soloSessionCount)
                          }}
                        >
                          {soloSessionCount.toLocaleString('en-US')}
                        </div>
                      </div>

                      {/* Tactile Golden Push Button */}
                      <button
                        type="button"
                        aria-label={`تسبيح ${activeObj.shortTitle}`}
                        className={`${currentTasbihSkin.btnClass} ${isPressed ? 'pressed' : ''}`}
                        onMouseDown={() => setPressedBtnId(activeObj.id)}
                        onMouseUp={() => setPressedBtnId(null)}
                        onTouchStart={() => setPressedBtnId(activeObj.id)}
                        onTouchEnd={() => setPressedBtnId(null)}
                        onClick={() => handleTapDhikr(activeObj.id, 'solo')}
                        title={`المس الزر الذهبي لتسجيل: ${activeObj.shortTitle}`}
                      >
                        <span className="btn-touch-hint">اضغط 👆</span>
                      </button>

                      {/* Small Reset Button - Resets session only, Cumulative Total is preserved */}
                      <button
                        type="button"
                        aria-label="تصفير الجلسة الحالية"
                        className={currentTasbihSkin.resetClass}
                        onClick={() => {
                          playResetTone();
                          setSoloSessionCount(0);
                          showToast(`تم تصفير جلستك الحالية (0) للبدء من جديد 🔄 وإجماليك التراكمي الدائم (${soloSavedTotal.toLocaleString('en-US')}) محفوظ ولا يمس ✨`);
                        }}
                        title="تصفير عداد جلستك الحالية للبدء من 0"
                      />
                    </div>
                  </div>

                  {/* UNDER THE TASBIH: CUMULATIVE TOTAL SINCE START */}
                  <div className="solo-cumulative-stats-card">
                    <div className="solo-stat-highlight">
                      <span className="stat-label">
                        {soloUserName ? `🌟 رصيد ${soloUserName} الإجمالي التراكمي منذ البداية:` : '🌟 إجمالي تسبيحاتك التراكمي منذ أن بدأت:'}
                      </span>
                      <span className="stat-number">{soloSavedTotal.toLocaleString('en-US')}</span>
                      <span className="stat-sub">تسبيحة مباركة مسجلة في رصيدك الدائم ولا تمحى أبداً ✨</span>
                    </div>

                    <div className="solo-stats-row">
                      <div className="solo-stat-subbox">
                        <span className="sub-label">رصيد جلستك الحالية:</span>
                        <span className="sub-val">{soloSessionCount.toLocaleString('en-US')} تسبيحة</span>
                      </div>
                      <div className="solo-stat-subbox">
                        <span className="sub-label">المحطة القادمة للتشجيع:</span>
                        <span className="sub-val">{nextMilestone.toLocaleString('en-US')} 🎯</span>
                      </div>
                      <div className="solo-stat-subbox">
                        <span className="sub-label">مساهمتك في عداد المدرسة:</span>
                        <span className="sub-val">{(dhikrCounts[activeObj.id] || 0).toLocaleString('en-US')} ✨</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges Earned Strip */}
                  {highestMilestone >= 100 && (
                    <div style={{
                      marginTop: '1.25rem',
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(251,191,36,0.3)',
                      borderRadius: '16px',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <span style={{ fontSize: '0.8rem', color: '#fef08a', fontWeight: 800 }}>
                        🎖️ أوسمة الهمة التي حققتها في هذه الجلسة:
                      </span>
                      {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].filter(m => highestMilestone >= m).map(m => (
                        <span key={m} style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#0f172a',
                          fontWeight: 900,
                          fontSize: '0.75rem',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          boxShadow: '0 2px 6px rgba(245,158,11,0.3)'
                        }}>
                          {m} تسبيحة 🏅
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Spiritual Merit Card */}
                  <div style={{ background: 'linear-gradient(135deg, #064e3b, #022c22)', borderRadius: '18px', padding: '16px', textAlign: 'right', border: '1.5px solid #10b981', marginTop: '1rem', color: 'white', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fef08a', marginBottom: '6px' }}>
                      ✨ الثواب والأجر في ميزان حسناتك:
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: 0, lineHeight: 1.6 }}>
                      {activeObj.id === 'salawat'
                        ? 'صليت على النبي ﷺ ' + soloSessionCount + ' مرات في هذه الجلسة، فصلى الله عليك بها ' + (soloSessionCount * 10) + ' صلوات، وحط عنك خطاياك ورفع درجاتك في الجنة بإذن الله.'
                        : 'غرست لنفسك ' + soloSessionCount + ' نخلة وشجرة مباركة في الجنة بإذن الله تعالى، وأثقلت ميزان حسناتك بالذكر الطيب المبارك.'}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: 19-CLASS COMPETITION VIEW (مسابقة الـ 19 صفاً) */}
        {activeTab === 'competition-view' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#fef08a', fontSize: '0.85rem', fontWeight: 900, padding: '5px 16px', borderRadius: '20px', border: '1.5px solid #fbbf24', boxShadow: '0 4px 12px rgba(5,150,105,0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>🏆</span> المسابقة المدرسية الكبرى لتسبيح الصفوف والشعب (19 صفاً)
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '10px 0 4px 0' }}>
                مسبحة وتنافس الـ 19 صفاً
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
                تنافس إيماني شريف بين شعب مدرسة مشيرفة من الأول حتى السادس • كل تسبيحة من بيتك ترفع ترتيب صفك في القمة
              </p>
            </div>

            {/* Unified Login Connection Box */}
            {unifiedSession && unifiedSession.isLoggedIn ? (
              <div className="unified-student-connected-badge">
                <div className="unified-info">
                  <span className="badge-icon">🎓</span>
                  <div>
                    <div className="unified-name">
                      مرحباً يا بطل: <strong>{competitionStudentName}</strong>
                    </div>
                    <div className="unified-class">
                      صفك في المسابقة: <strong style={{ color: '#fef08a' }}>{studentClass}</strong> • مرتبط بالدخول الموحد للموقع 🟢
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.78rem', color: '#a7f3d0', fontWeight: 700 }}>تغيير الشعبة:</label>
                  <select
                    value={studentClass}
                    onChange={(e) => {
                      const newCls = e.target.value;
                      setStudentClass(newCls);
                      localStorage.setItem('school_unified_student_grade', newCls);
                      if (unifiedSession) {
                        saveStudentSession({ ...unifiedSession, studentClass: newCls });
                      }
                      showToast(`تم تعيين صفك: ${newCls} 🎯`);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #fbbf24',
                      background: '#064e3b',
                      color: '#fef08a',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {ALL_19_CLASSES.map(cls => (
                      <option key={cls} value={cls} style={{ background: '#022c22', color: 'white' }}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="student-session-card" style={{
                background: 'linear-gradient(135deg, #064e3b, #022c22)',
                borderRadius: '20px',
                padding: '1.25rem',
                marginBottom: '1.25rem',
                border: '1.5px solid #10b981',
                boxShadow: '0 8px 24px rgba(2, 44, 34, 0.4)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fef08a', background: 'rgba(16,185,129,0.25)', padding: '3px 10px', borderRadius: '12px' }}>
                    📝 بيانات الطالب لخوض مسابقة الـ 19 صفاً
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#a7f3d0' }}>
                    {isCloudConnected ? '🟢 متصل بالمسابقة المباشرة' : '🔄 متصل محلياً'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#a7f3d0', fontWeight: 700, marginBottom: '3px' }}>
                      اسم الطالب للمسابقة:
                    </label>
                    <input
                      type="text"
                      value={competitionStudentName}
                      onChange={(e) => {
                        setCompetitionStudentName(e.target.value);
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
                      اختر صفك وشعبتك من الـ 19 صفاً:
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
                      {ALL_19_CLASSES.map(cls => (
                        <option key={cls} value={cls} style={{ background: '#022c22', color: 'white' }}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  className="tasbih-btn tasbih-btn-gold"
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  onClick={() => {
                    if (!competitionStudentName.trim()) {
                      showToast('يرجى كتابة اسم الطالب أولاً');
                      return;
                    }
                    saveStudentSession({
                      fullName: competitionStudentName.trim(),
                      studentClass: studentClass,
                      role: 'student'
                    });
                    showToast(`تم حفظ بياناتك وربطها بالدخول الموحد للموقع بنجاح 🚀 مرحباً بك يا ${competitionStudentName}`);
                  }}
                >
                  <i className="fas fa-link"></i> ربط وحفظ في الدخول الموحد للموقع
                </button>
              </div>
            )}

            {/* Class Live Status Banner */}
            {(() => {
              const allSorted = Object.entries(classStats).sort(([, a], [, b]) => b.total - a.total);
              const rankIdx = allSorted.findIndex(([cName]) => cName === studentClass);
              const myRank = rankIdx >= 0 ? rankIdx + 1 : '-';

              return (
                <div style={{
                  background: 'linear-gradient(135deg, #022c22, #064e3b)',
                  borderRadius: '16px',
                  padding: '12px 18px',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  border: '1.5px solid #fbbf24',
                  boxShadow: '0 4px 15px rgba(251,191,36,0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.6rem' }}>🏆</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
                        رصيد <strong>{studentClass}</strong> في المسابقة المدرسية:
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fef08a' }}>
                        {(classStats[studentClass]?.total || 0).toLocaleString('en-US')} تسبيحة
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.3)' }}>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#a7f3d0' }}>ترتيب صفك:</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: myRank <= 3 ? '#fef08a' : '#34d399' }}>
                        {myRank === 1 ? '🥇 #1 المتصدر' : myRank === 2 ? '🥈 #2 الوصيف' : myRank === 3 ? '🥉 #3 الثالث' : `#${myRank} من 19`}
                      </span>
                    </div>

                    <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#a7f3d0' }}>مساهمتك لصفك اليوم:</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#34d399' }}>
                        {competitionSessionCount.toLocaleString('en-US')} ⭐
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Dhikr Selector Bar */}
            <div className="student-controls-bar" style={{
              background: '#022c22',
              borderRadius: '20px',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              border: '1.5px solid #059669',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              color: 'white'
            }}>
              <div>
                <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#fef08a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📿</span>
                  <span>المسبحة المخصصة لمنافسة الصفوف (19 صفاً):</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#a7f3d0', marginTop: '2px' }}>
                  أنت تسبح الآن لصالح: <strong style={{ color: '#fef08a' }}>{studentClass}</strong> • كل تسبيحة تسجل في السحابة فوراً
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>هدف الجولة:</span>
                  <button
                    onClick={() => setCompetitionTargetRound(33)}
                    style={{ background: competitionTargetRound === 33 ? '#059669' : '#0f172a', border: competitionTargetRound === 33 ? '1px solid #34d399' : '1px solid #334155', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    33
                  </button>
                  <button
                    onClick={() => setCompetitionTargetRound(100)}
                    style={{ background: competitionTargetRound === 100 ? '#059669' : '#0f172a', border: competitionTargetRound === 100 ? '1px solid #34d399' : '1px solid #334155', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    100
                  </button>
                </div>

                <div className="tasbih-skins-row" style={{ marginTop: 0 }}>
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
                    <span>الزمردي الملكي 👑</span>
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
                    <span>الرخام الإيطالي 🏛️</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dhikr Selector Grid */}
            <div className="tasbih-selector-grid">
              {adhkarList.map(d => {
                const isSelected = competitionActiveDhikr === d.id;
                const count = dhikrCounts[d.id] || 0;
                const isTarget = campaign.targetDhikr === d.id;
                return (
                  <div
                    key={d.id}
                    className={`tasbih-selector-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setCompetitionActiveDhikr(d.id);
                      showToast(`تم اختيار: ${d.shortTitle} 📿`);
                    }}
                  >
                    <span className="pill-badge">{d.badge}</span>
                    <div style={{ flex: 1 }}>
                      <div className="pill-title">
                        {d.title}
                      </div>
                      <div className="pill-count">
                        {isTarget ? '🎯 حملة الأسبوع • ' : ''}{count.toLocaleString('en-US')} تسبيحة
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3D Tasbih for Competition */}
            {(() => {
              const activeObj = adhkarList.find(d => d.id === competitionActiveDhikr) || adhkarList[0];
              const nextMilestone = (Math.floor(competitionSessionCount / 100) + 1) * 100;
              const currentRoundProgress = competitionSessionCount % 100;
              const isPressed = pressedBtnId === activeObj.id;

              return (
                <div className="tasbih-student-single-container">
                  {/* Spotlight Card */}
                  <div className="tasbih-active-spotlight-card">
                    <div className="spotlight-header">
                      <span className="spotlight-badge">{activeObj.badge}</span>
                      <h2 className="spotlight-title">{activeObj.title}</h2>
                    </div>
                    <p className="spotlight-merit">✨ أنت تسبح الآن لرفع رصيد <strong>{studentClass}</strong> في المسابقة المدرسية</p>
                    <div className="spotlight-progress-wrap">
                      <div>
                        <span>الهدف القادم لصفك: </span>
                        <strong>{nextMilestone} تسبيحة 🎯</strong>
                      </div>
                      <div>
                        <span>مساهمتك في المئة الحالية: </span>
                        <strong>{currentRoundProgress} / 100</strong>
                      </div>
                    </div>
                  </div>

                  {/* ONE CENTRAL 3D ELECTRONIC TASBIH */}
                  <div className="tasbih-single-device-wrap">
                    <div className={`tasbih-device-wrapper skin-${currentTasbihSkin.id}`}>
                      <img
                        src={currentTasbihSkin.img}
                        alt={currentTasbihSkin.name}
                        className="tasbih-device-casing"
                      />

                      {/* Digital OLED Screen */}
                      <div
                        className={`${currentTasbihSkin.screenClass} ${competitionSessionCount > 0 && competitionSessionCount % 100 === 0 ? 'celebrate' : ''}`}
                      >
                        <div className="tasbih-lcd-meta">
                          <span className="tasbih-lcd-round-badge">
                            {studentClass}
                          </span>
                          <span className="tasbih-lcd-icon">
                            {activeObj.badge}
                          </span>
                        </div>

                        {/* OLED Digits (Student Session Count) */}
                        <div
                          className="tasbih-lcd-digits"
                          style={{
                            fontSize: getOledFontSize(competitionSessionCount)
                          }}
                        >
                          {competitionSessionCount.toLocaleString('en-US')}
                        </div>
                      </div>

                      {/* Tactile Golden Push Button */}
                      <button
                        type="button"
                        aria-label={`تسبيح ${activeObj.shortTitle}`}
                        className={`${currentTasbihSkin.btnClass} ${isPressed ? 'pressed' : ''}`}
                        onMouseDown={() => setPressedBtnId(activeObj.id)}
                        onMouseUp={() => setPressedBtnId(null)}
                        onTouchStart={() => setPressedBtnId(activeObj.id)}
                        onTouchEnd={() => setPressedBtnId(null)}
                        onClick={() => handleTapDhikr(activeObj.id, 'competition')}
                        title={`المس الزر لتسجيل تسبيحة لصفك: ${studentClass}`}
                      >
                        <span className="btn-touch-hint">اضغط 👆</span>
                      </button>

                      {/* Small Reset Button - Protected */}
                      <button
                        type="button"
                        aria-label="تصفير الجلسة الشخصية"
                        className={currentTasbihSkin.resetClass}
                        onClick={() => {
                          playResetTone();
                          setCompetitionSessionCount(0);
                          showToast(`تم تصفير جلستك الفردية الحالية (0) 🔄 رصيد صفك (${studentClass}) ورصيد المدرسة محفوظ وسحابي ولا يمس 🛡️`);
                        }}
                        title="تصفير شاشتك الفردية (رصيد صفك محفوظ سحابياً)"
                      />
                    </div>
                  </div>

                  {/* Anti-Wipe Security Notice */}
                  <div style={{
                    background: '#022c22',
                    border: '1.5px solid rgba(16,185,129,0.35)',
                    borderRadius: '16px',
                    padding: '12px 18px',
                    marginTop: '1.25rem',
                    fontSize: '0.82rem',
                    color: '#a7f3d0',
                    textAlign: 'center',
                    lineHeight: 1.5,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    🛡️ <strong>حماية المسابقة ونزاهة النتائج:</strong> رصيد الشعب الـ 19 موثق سحابياً في Firebase. <strong>تم إلغاء أي إمكانية لمسح نقاط الصفوف أو تصفيرها من أجهزة الطلاب</strong> لضمان تتويج الصف الفائز بنزاهة تامة.
                  </div>
                </div>
              );
            })()}

            {/* PODIUM DISPLAY (Top 3 of the 19 Classes) */}
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
                  margin: '2rem 0 1.75rem 0'
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
                        {top2[1].total.toLocaleString('en-US')}
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
                      {top1[1].total.toLocaleString('en-US')}
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
                        {top3[1].total.toLocaleString('en-US')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9a3412' }}>تسبيحة مباركة</div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Filter Pills for the 19 Classes */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {[
                { id: 'all', label: 'جميع الصفوف (19 صفاً)' },
                { id: '1', label: 'الأول (3 شعب)' },
                { id: '2', label: 'الثاني (3 شعب)' },
                { id: '3', label: 'الثالث (3 شعب)' },
                { id: '4', label: 'الرابع (3 شعب)' },
                { id: '5', label: 'الخامس (3 شعب)' },
                { id: '6', label: 'السادس (4 شعب)' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setLeaderboardFilter(f.id)}
                  style={{
                    background: leaderboardFilter === f.id ? '#0f172a' : '#f1f5f9',
                    color: leaderboardFilter === f.id ? 'white' : '#475569',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 19-Classes Leaderboard Table */}
            <div className="tasbih-card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
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
                      if (leaderboardFilter === '1') return cName.startsWith('الأول');
                      if (leaderboardFilter === '2') return cName.startsWith('الثاني');
                      if (leaderboardFilter === '3') return cName.startsWith('الثالث');
                      if (leaderboardFilter === '4') return cName.startsWith('الرابع');
                      if (leaderboardFilter === '5') return cName.startsWith('الخامس');
                      if (leaderboardFilter === '6') return cName.startsWith('السادس');
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
                            background: isMyClass ? '#ecfdf5' : idx === 0 ? '#fefce8' : idx === 1 ? '#f8fafc' : idx % 2 === 0 ? 'white' : '#fcfcfc',
                            fontWeight: isMyClass ? 800 : 'normal'
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
                            {data.total.toLocaleString('en-US')}
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
                  <span className="stat-value">{globalTotal.toLocaleString('en-US')}</span>
                </div>
                <div className="tasbih-archive-stat-item">
                  <span className="stat-label">عدد الصفوف الموثقة:</span>
                  <span className="stat-value">{Object.keys(classStats).length} صفوف</span>
                </div>
              </div>

              {/* Step 1: Download backup */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: '6px', color: '#1e293b' }}>
                  1. الخطوة الأولى (موصى بها بشدة): حفظ نسخة احتياطية
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
                  <i className="fas fa-file-excel"></i> تنزيل ملف الإكسل وحفظ السجل التراكمي
                </button>
                {archiveBackupDownloaded && (
                  <div style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 800, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fas fa-check-circle"></i> تم تحميل ملف الإحصائيات بنجاح!
                  </div>
                )}
              </div>

              {/* Step 2: Confirm by typing */}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: '6px', color: '#1e293b' }}>
                  2. الخطوة الثانية: تأكيد العملية كتابياً
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

      {/* MILESTONE ENCOURAGEMENT CELEBRATION MODAL (100, 200, 300, ...) */}
      {milestoneCelebration && (
        <div className="tasbih-milestone-backdrop" onClick={() => setMilestoneCelebration(null)}>
          <div className="tasbih-milestone-modal" onClick={e => e.stopPropagation()}>
            <div className="milestone-badge-glow">{milestoneCelebration.badge}</div>
            <span className="milestone-level-pill">{milestoneCelebration.level}</span>
            <h2 className="milestone-title">{milestoneCelebration.title}</h2>
            <p className="milestone-msg">{milestoneCelebration.msg}</p>
            <div className="milestone-stats-box">
              <div>
                <span className="stat-label">رصيدك في هذه الجولة:</span>
                <span className="stat-val">{milestoneCelebration.count.toLocaleString('en-US')} تسبيحة ✨</span>
              </div>
              {activeTab === 'competition-view' ? (
                <div>
                  <span className="stat-label">صفك في المنافسة:</span>
                  <span className="stat-val">{studentClass} 🏆</span>
                </div>
              ) : (
                <div>
                  <span className="stat-label">إجماليك التراكمي:</span>
                  <span className="stat-val">{soloSavedTotal.toLocaleString('en-US')} تسبيحة 🌟</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="tasbih-btn tasbih-btn-gold milestone-continue-btn"
              onClick={() => setMilestoneCelebration(null)}
            >
              <span>واصل الهمة والتسبيح 🚀</span>
            </button>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default SchoolTasbihPortal;
