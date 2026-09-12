import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { 
  getAllTeachers, 
  resetTeacherPinToDefault, 
  adminSetTeacherPin,
  getTeacherPin,
  getTeacherAccountDetails,
  fetchTeacherCloudAccounts,
  listenToTeacherAccounts,
  isTeacherPinCustomized, 
  isTeacher2FAEnabled,
  generateAdminEmergencyCode,
  disableTeacher2FA,
  DEFAULT_TEACHER_PIN 
} from '../utils/teacherAuth';

const StudentDismissalAdminTab = () => {
  const [dismissals, setDismissals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation & Sub-Tabs in Admin Monitoring Center
  const [adminViewMode, setAdminViewMode] = useState('all'); // 'all' | 'accounts' | 'gate' | 'stats'
  const [revealedPins, setRevealedPins] = useState({}); // { [teacherId]: true/false }
  const [editingTeacher, setEditingTeacher] = useState(null); // teacher object to edit PIN
  const [customPinInput, setCustomPinInput] = useState('');
  const [savePinError, setSavePinError] = useState('');
  const [savePinSuccess, setSavePinSuccess] = useState('');
  
  // Emergency 2FA Code Modal State
  const [emergencyModal, setEmergencyModal] = useState(null); // { teacher, code }

  // Guard PIN State (configurable from admin)
  const [guardPin, setGuardPin] = useState(DEFAULT_TEACHER_PIN);
  const [isEditingGuardPin, setIsEditingGuardPin] = useState(false);
  const [guardPinInput, setGuardPinInput] = useState(DEFAULT_TEACHER_PIN);
  const [showGuardPin, setShowGuardPin] = useState(false);

  // Sound Chime Notification
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousCountRef = useRef(null);

  // Search & Filters
  const [teacherSearch, setTeacherSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('all');

  const [teacherListVer, setTeacherListVer] = useState(0);
  const allTeachers = useMemo(() => getAllTeachers(), [teacherListVer]);

  // Audio Beep for Live Dismissals
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  };

  // Sync to Important Links on Homepage
  const handleSyncDismissalToImportantLinks = async () => {
    try {
      const snap = await getDocs(collection(db, 'links'));
      let exists = false;
      snap.forEach(d => {
        const data = d.data();
        if (data.url?.includes('student-dismissal') || data.url?.includes('tasreeh') || data.title?.includes('تسريح')) {
          exists = true;
        }
      });
      if (exists) {
        alert('ℹ️ رابط تسريح الطلاب مضاف ومثبت بالفعل ضمن قائمة الروابط الخارجية بالموقع!');
        return;
      }
      await addDoc(collection(db, 'links'), {
        title: 'منظومة تسريح الطلاب (إذن الخروج المدرسي)',
        icon: 'fa-walking',
        url: '#/student-dismissal',
        desc: 'بوابة إلكترونية رسمية للمربين وأولياء الأمور لتسجيل وتوثيق خروج الطلاب ومتابعتها مع حارس البوابة.',
        badge: 'إذن وخروج 🏃‍♂️',
        createdAt: new Date().toISOString()
      });
      alert('🎉 تم بنجاح تثبيت وإضافة "منظومة تسريح الطلاب" إلى الروابط الخارجية في الصفحة الرئيسية!');
    } catch (err) {
      alert('حدث خطأ أثناء إضافة الرابط: ' + err.message);
    }
  };

  // Load Dismissals Realtime & Initial Sync
  useEffect(() => {
    fetchTeacherCloudAccounts();
    const unsubTeachers = listenToTeacherAccounts(() => {
      setTeacherListVer(v => v + 1);
    });

    const unsubApp = onSnapshot(collection(db, 'teacher_appointments'), (snap) => {
      const list = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.isDismissal === true || data.type === 'student_dismissal') {
          const isExited = data.entryStatus === 'exited' || data.status === 'dismissed' || data.gateStatus === 'exited';
          list.push({
            id: d.id,
            ...data,
            status: isExited ? 'dismissed' : (data.status || 'waiting'),
            gateStatus: isExited ? 'exited' : (data.gateStatus || 'pending'),
            actualExitTime: data.enteredAt || data.actualExitTime || data.gateExitTime || null,
            gateExitTime: data.enteredAt || data.gateExitTime || data.actualExitTime || null
          });
        }
      });

      if (previousCountRef.current !== null && list.length > previousCountRef.current) {
        playAlertSound();
      }
      previousCountRef.current = list.length;

      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setDismissals(list);
      setIsLoading(false);
    }, (err) => {
      console.warn('Dismissals listener error:', err);
      setIsLoading(false);
    });

    const fetchGuardPin = async () => {
      try {
        const snap = await getDocs(collection(db, 'system_settings'));
        snap.forEach(d => {
          if (d.id === 'guard_config' && d.data().pin) {
            setGuardPin(d.data().pin);
            setGuardPinInput(d.data().pin);
          }
        });
      } catch (e) {}
    };
    fetchGuardPin();

    return () => {
      if (typeof unsubTeachers === 'function') unsubTeachers();
      if (typeof unsubApp === 'function') unsubApp();
    };
  }, [soundEnabled]);

  // Toggle Reveal PIN
  const handleToggleRevealPin = (teacherId) => {
    setRevealedPins(prev => ({
      ...prev,
      [teacherId]: !prev[teacherId]
    }));
  };

  // Copy PIN to clipboard
  const handleCopyPin = (teacherName, pin) => {
    navigator.clipboard.writeText(pin);
    alert(`📋 تم نسخ رمز الدخول للمربي/ة (${teacherName}): ${pin}`);
  };

  // Send PIN via WhatsApp
  const handleSendWhatsAppPin = (teacher) => {
    const pin = getTeacherPin(teacher.id);
    const msg = `السلام عليكم ورحمة الله وبركاته، زميلنا المربي/ة الفاضل/ة *${teacher.nameAr}* 🌸\n\n` +
      `نحيطك علماً ببيانات دخولك المعتمدة لمنظومة تسريح الطلاب والأدوات المدرسية في موقع مدرسة مشيرفة الابتدائية:\n\n` +
      `👤 *اسم المستخدم:* ${teacher.nameAr}\n` +
      `🔑 *رمز الدخول السري (السيسما):* ${pin}\n\n` +
      `🔗 *رابط الدخول للبوابة:* https://rami0407.github.io/site/#/student-dismissal\n\n` +
      `مع تحيات إدارة مدرسة مشيرفة الابتدائية.`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // Admin Save Custom PIN
  const handleAdminSavePin = async (e) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setSavePinError('');
    setSavePinSuccess('');

    if (customPinInput.trim().length < 4) {
      setSavePinError('يجب أن يتكون الرمز من 4 خانات على الأقل.');
      return;
    }

    try {
      await adminSetTeacherPin(editingTeacher.id, customPinInput.trim());
      setSavePinSuccess(`✅ تم بنجاح حفظ وتعيين الرمز الجديد (${customPinInput.trim()}) للمربي/ة ${editingTeacher.nameAr}`);
      setTeacherListVer(v => v + 1);
      setTimeout(() => {
        setEditingTeacher(null);
        setCustomPinInput('');
        setSavePinSuccess('');
      }, 1600);
    } catch (err) {
      setSavePinError('حدث خطأ أثناء حفظ الرمز: ' + err.message);
    }
  };

  // Admin Reset PIN to Default 318212
  const handleResetTeacherPin = async (teacher) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في إعادة ضبط رمز المربي/ة (${teacher.nameAr}) إلى الرمز الافتراضي 318212؟`)) {
      await resetTeacherPinToDefault(teacher.id);
      setTeacherListVer(v => v + 1);
      alert(`✅ تم بنجاح إعادة ضبط رمز ${teacher.nameAr} إلى ${DEFAULT_TEACHER_PIN}.`);
    }
  };

  // Admin Generate Emergency 2FA Code
  const handleGenerateEmergencyCode = async (teacher) => {
    try {
      const code = await generateAdminEmergencyCode(teacher.id);
      setEmergencyModal({ teacher, code });
      setTeacherListVer(v => v + 1);
    } catch (e) {
      alert('خطأ أثناء توليد رمز الطوارئ: ' + e.message);
    }
  };

  // Admin Reset / Disable 2FA for teacher
  const handleReset2FA = async (teacher) => {
    if (window.confirm(`هل تريد تعطيل وإعادة ضبط الأمان ذو المرحلتين (2FA) للمربي/ة (${teacher.nameAr})؟ سيتمكن المعلم بعدها من تسجيل الدخول بكلمة المرور فقط أو إعادة تهيئة التطبيق.`)) {
      await disableTeacher2FA(teacher.id, 'مدير المدرسة');
      setTeacherListVer(v => v + 1);
      alert(`✅ تم بنجاح تعطيل الأمان الثنائي لحساب ${teacher.nameAr}.`);
    }
  };

  // Save Guard PIN
  const handleSaveGuardPin = async () => {
    if (guardPinInput.trim().length < 4) {
      alert('رمز الحارس يجب أن يتكون من 4 خانات على الأقل.');
      return;
    }
    try {
      await setDoc(doc(db, 'system_settings', 'guard_config'), {
        pin: guardPinInput.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'الإدارة'
      }, { merge: true });
      setGuardPin(guardPinInput.trim());
      setIsEditingGuardPin(false);
      alert('✅ تم بنجاح تحديث رمز حارس المدرسة وسريانه على بوابة الحارس.');
    } catch (err) {
      alert('خطأ أثناء حفظ رمز الحارس: ' + err.message);
    }
  };

  // Delete Dismissal Record
  const handleDeleteRecord = async (id, studentName) => {
    if (!window.confirm(`هل أنت متأكد من حذف توثيق خروج الطالب (${studentName})؟`)) return;
    try {
      try { await deleteDoc(doc(db, 'teacher_appointments', id)); } catch (e) {}
      try { await deleteDoc(doc(db, 'student_dismissals', id)); } catch (e) {}
      setDismissals(prev => prev.filter(item => item.id !== id));
      alert('تم حذف التوثيق بنجاح.');
    } catch (err) {
      alert('خطأ أثناء الحذف: ' + err.message);
    }
  };

  // Toggle Gate Exit Status
  const handleToggleGateExit = async (id, currentStatus) => {
    const newStatus = currentStatus === 'exited' ? 'pending' : 'exited';
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setDismissals(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: newStatus === 'exited' ? 'dismissed' : 'waiting',
          gateStatus: newStatus,
          gateExitTime: newStatus === 'exited' ? timeStr : null,
          actualExitTime: newStatus === 'exited' ? timeStr : null,
          enteredAt: newStatus === 'exited' ? timeStr : null,
          entryStatus: newStatus === 'exited' ? 'exited' : 'waiting'
        };
      }
      return item;
    }));

    try {
      try {
        await updateDoc(doc(db, 'teacher_appointments', id), {
          entryStatus: newStatus === 'exited' ? 'exited' : 'waiting',
          enteredAt: newStatus === 'exited' ? timeStr : null
        });
      } catch (e) {}

      try {
        await updateDoc(doc(db, 'student_dismissals', id), {
          status: newStatus === 'exited' ? 'dismissed' : 'waiting',
          gateStatus: newStatus,
          gateExitTime: newStatus === 'exited' ? timeStr : null,
          actualExitTime: newStatus === 'exited' ? timeStr : null
        });
      } catch (e) {}
    } catch (err) {
      console.warn('Error updating dismissal status:', err);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (dismissals.length === 0) {
      alert('لا توجد سجلات للتصدير.');
      return;
    }

    const headers = ['رمز الإذن', 'اسم الطالب', 'الصف', 'المربي المصرح', 'المرافق المستلم', 'صلة القرابة', 'سبب الخروج', 'التاريخ', 'وقت التسريح', 'حالة الخروج من البوابة', 'وقت الخروج الفعلي'];
    const rows = dismissals.map(d => [
      d.passCode || 'DIS',
      `"${d.studentName || ''}"`,
      `"${d.classroom || ''}"`,
      `"${d.teacherName || ''}"`,
      `"${d.companionName || ''}"`,
      `"${d.companionType || ''}"`,
      `"${d.reason || ''}"`,
      d.departureDate || '',
      d.departureTime || '',
      d.gateStatus === 'exited' ? 'خرج وتأكد الحارس' : 'قيد الانتظار',
      d.gateExitTime || d.actualExitTime || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `كشف_تسريح_الطلاب_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analytics Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDismissals = useMemo(() => dismissals.filter(d => d.departureDate === todayStr), [dismissals, todayStr]);
  const todayExitedCount = useMemo(() => todayDismissals.filter(d => d.gateStatus === 'exited').length, [todayDismissals]);
  const todayPendingCount = useMemo(() => todayDismissals.filter(d => d.gateStatus !== 'exited').length, [todayDismissals]);

  // Teachers Ranking by Dismissals Count
  const teacherStats = useMemo(() => {
    const map = {};
    dismissals.forEach(d => {
      const t = d.teacherName || 'غير محدد';
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        percent: dismissals.length ? Math.round((count / dismissals.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [dismissals]);

  // Class Breakdown
  const classStats = useMemo(() => {
    const map = {};
    dismissals.forEach(d => {
      const cls = d.classroom || 'غير محدد';
      map[cls] = (map[cls] || 0) + 1;
    });
    return Object.entries(map)
      .map(([className, count]) => ({
        className,
        count,
        percent: dismissals.length ? Math.round((count / dismissals.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [dismissals]);

  // Filtered Dismissals List
  const filteredDismissals = useMemo(() => {
    return dismissals.filter(d => {
      const matchQuery = !searchQuery || 
        d.studentName?.includes(searchQuery) || 
        d.familyName?.includes(searchQuery) || 
        d.teacherName?.includes(searchQuery) ||
        d.companionName?.includes(searchQuery) ||
        d.passCode?.includes(searchQuery);

      const matchClass = filterClass === 'all' || d.classroom === filterClass;
      const matchDate = !filterDate || d.departureDate === filterDate;
      const matchGender = filterGender === 'all' || d.gender === filterGender;
      const matchTeacher = filterTeacher === 'all' || d.teacherName?.includes(filterTeacher);

      return matchQuery && matchClass && matchDate && matchGender && matchTeacher;
    });
  }, [dismissals, searchQuery, filterClass, filterDate, filterGender, filterTeacher]);

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
      
      {/* HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)',
        borderRadius: '24px',
        padding: '2rem 2.5rem',
        color: 'white',
        marginBottom: '1.75rem',
        boxShadow: '0 12px 30px rgba(2, 132, 199, 0.25)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', padding: '0.35rem 0.9rem', borderRadius: '50px', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.6rem' }}>
              <span>🛡️ مركز المراقبة والتحكم المتقدم</span>
              <span>•</span>
              <span>الأمان الثنائي 2FA وتوثيق البوابة</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900 }}>
              لوحة مراقبة وتحكم تسريح الطلاب وحسابات المعلمين
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#bae6fd', fontSize: '0.95rem' }}>
              رصد حي لحركة البوابة، استرجاع وكشف وتعديل رموز المعلمين، إدارة الأمان الثنائي (2FA)، ومتابعة فورية لسلامة الطلاب.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                background: soundEnabled ? '#10b981' : 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                padding: '0.65rem 1.1rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title={soundEnabled ? 'تنبيهات الصوت مفعلة' : 'تنبيهات الصوت معطلة'}
            >
              <i className={`fas ${soundEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
              {soundEnabled ? 'صوت التنبيهات 🔔' : 'كتم الصوت 🔕'}
            </button>

            <button 
              onClick={handleExportCSV}
              style={{
                background: '#059669',
                color: 'white',
                border: 'none',
                padding: '0.65rem 1.1rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
              }}
            >
              <i className="fas fa-file-excel"></i>
              تصدير Excel 📊
            </button>

            <button 
              onClick={() => window.print()}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.65rem 1.1rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <i className="fas fa-print"></i>
              طباعة التقرير 🖨️
            </button>

            <button 
              onClick={handleSyncDismissalToImportantLinks}
              style={{
                background: '#f59e0b',
                border: 'none',
                color: '#000',
                padding: '0.65rem 1.1rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="تثبيت الرابط في الروابط الخارجية بالموقع"
            >
              <i className="fas fa-link"></i>
              🔗 تثبيت بالموقع
            </button>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setAdminViewMode('all')}
            style={{
              background: adminViewMode === 'all' ? 'white' : 'rgba(255,255,255,0.15)',
              color: adminViewMode === 'all' ? '#0f172a' : 'white',
              border: 'none',
              padding: '0.55rem 1.2rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <i className="fas fa-th-large"></i>
            عرض شامل (الكل)
          </button>

          <button
            onClick={() => setAdminViewMode('accounts')}
            style={{
              background: adminViewMode === 'accounts' ? '#38bdf8' : 'rgba(255,255,255,0.15)',
              color: adminViewMode === 'accounts' ? '#0f172a' : 'white',
              border: 'none',
              padding: '0.55rem 1.2rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <i className="fas fa-shield-alt"></i>
            🔑 رموز المعلمين والأمان الثنائي 2FA ({allTeachers.length})
          </button>

          <button
            onClick={() => setAdminViewMode('gate')}
            style={{
              background: adminViewMode === 'gate' ? '#38bdf8' : 'rgba(255,255,255,0.15)',
              color: adminViewMode === 'gate' ? '#0f172a' : 'white',
              border: 'none',
              padding: '0.55rem 1.2rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <i className="fas fa-door-open"></i>
            🚪 مراقبة البوابة المباشرة ({todayPendingCount} بالانتظار)
          </button>

          <button
            onClick={() => setAdminViewMode('stats')}
            style={{
              background: adminViewMode === 'stats' ? '#38bdf8' : 'rgba(255,255,255,0.15)',
              color: adminViewMode === 'stats' ? '#0f172a' : 'white',
              border: 'none',
              padding: '0.55rem 1.2rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <i className="fas fa-chart-pie"></i>
            📊 تحليلات الصفوف والمعلمين
          </button>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 800, marginBottom: '0.3rem' }}>📅 تسريح اليوم:</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0284c7' }}>{todayDismissals.length} <span style={{ fontSize: '1rem' }}>طالباً</span></div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 800, marginBottom: '0.3rem' }}>✅ غادروا البوابة اليوم:</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>{todayExitedCount} <span style={{ fontSize: '1rem' }}>طالباً</span></div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '18px', border: todayPendingCount > 0 ? '2px solid #f59e0b' : '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 800, marginBottom: '0.3rem' }}>⏳ قيد انتظار الخروج الآن:</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {todayPendingCount} <span style={{ fontSize: '1rem' }}>طالباً</span>
            {todayPendingCount > 0 && <span style={{ fontSize: '0.8rem', background: '#fef3c7', padding: '2px 8px', borderRadius: '20px', color: '#b45309' }}>عند البوابة</span>}
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 800, marginBottom: '0.3rem' }}>👥 حسابات المعلمين:</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>{allTeachers.length} <span style={{ fontSize: '1rem' }}>معلماً</span></div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: TEACHER PASSWORDS & 2FA MANAGEMENT             */}
      {/* ========================================================= */}
      {(adminViewMode === 'all' || adminViewMode === 'accounts') && (
        <div style={{
          background: 'white',
          borderRadius: '22px',
          padding: '1.75rem',
          border: '2px solid #38bdf8',
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.08)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.6rem' }}>🛡️</span>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                  مركز استرجاع رموز المعلمين وإدارة الأمان الثنائي (2FA)
                </h2>
              </div>
              <p style={{ margin: '0.35rem 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                يمكنك كشف الرمز السري، تعديله، توليد رمز طوارئ فوري لتخطي الـ 2FA في الحالات الاضطرارية، أو إعادة ضبط الحساب.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 بحث باسم المعلم بالعربية أو العبرية..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  minWidth: '240px',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  fetchTeacherCloudAccounts();
                  setTeacherListVer(v => v + 1);
                  alert('🔄 تم تحديث وقراءة جميع رموز المعلمين من السحابة بنجاح.');
                }}
                style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  color: '#0284c7',
                  padding: '0.6rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                تحديث السحابة 🔄
              </button>
            </div>
          </div>

          {/* TEACHERS TABLE WITH 2FA & RECOVERY */}
          <div style={{ maxHeight: '480px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#334155' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>المربي / المعلم</th>
                  <th style={{ padding: '0.85rem 1rem' }}>الاسم بالعبرية</th>
                  <th style={{ padding: '0.85rem 1rem' }}>رمز الدخول (السيسما) 🔑</th>
                  <th style={{ padding: '0.85rem 1rem' }}>الأمان الثنائي (2FA) 🛡️</th>
                  <th style={{ padding: '0.85rem 1rem' }}>حالة الرمز</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>إجراءات الإدارة ورموز الطوارئ</th>
                </tr>
              </thead>
              <tbody>
                {allTeachers
                  .filter(t => !teacherSearch || t.nameAr.includes(teacherSearch) || t.nameHe.includes(teacherSearch))
                  .map(t => {
                    const details = getTeacherAccountDetails(t.id);
                    const isRevealed = !!revealedPins[t.id];
                    const pin = details.pin || DEFAULT_TEACHER_PIN;

                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                          👨‍🏫 {t.nameAr}
                          {t.id === 'rami_irfaeya' && (
                            <span style={{ marginRight: '6px', background: '#fef3c7', color: '#b45309', padding: '2px 7px', borderRadius: '6px', fontSize: '0.75rem' }}>
                              مدير المدرسة
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 600 }}>
                          {t.nameHe}
                        </td>

                        {/* PIN DISPLAY & REVEAL TOGGLE */}
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.05rem', color: isRevealed ? '#0284c7' : '#94a3b8', letterSpacing: isRevealed ? '2px' : '4px' }}>
                              {isRevealed ? pin : '••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleRevealPin(t.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isRevealed ? '#0284c7' : '#64748b', padding: '2px', fontSize: '0.95rem' }}
                              title={isRevealed ? 'إخفاء الرمز' : 'كشف واسترجاع الرمز السري'}
                            >
                              <i className={`fas ${isRevealed ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyPin(t.nameAr, pin)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px', fontSize: '0.9rem' }}
                              title="نسخ الرمز للحافظة"
                            >
                              <i className="fas fa-copy"></i>
                            </button>
                          </div>
                        </td>

                        {/* 2FA STATUS & EMERGENCY BADGE */}
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {details.twoFactorEnabled ? (
                              <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span>🟢</span> مفعل (2FA)
                              </span>
                            ) : (
                              <span style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700 }}>
                                ⚪ غير مفعل
                              </span>
                            )}
                            {details.emergencyCode && !details.emergencyCode.used && (
                              <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                                كود طوارئ فعال: {details.emergencyCode.code}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* STATUS & AUDIT */}
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div>
                            {details.isCustom ? (
                              <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800 }}>
                                🔑 مخصص ({details.updatedBy || 'المربي'})
                              </span>
                            ) : (
                              <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800 }}>
                                افتراضي (318212)
                              </span>
                            )}
                          </div>
                          {details.updatedAt && (
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                              آخر تحديث: {new Date(details.updatedAt).toLocaleDateString('ar-EG')}
                            </div>
                          )}
                        </td>

                        {/* ACTIONS: EMERGENCY CODE, EDIT, WHATSAPP, RESET */}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {/* Emergency 2FA Code Button */}
                            <button
                              type="button"
                              onClick={() => handleGenerateEmergencyCode(t)}
                              style={{
                                background: '#fef3c7',
                                border: '1px solid #fde68a',
                                color: '#b45309',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="توليد رمز طوارئ فوري لمرة واحدة لتخطي الـ 2FA في حال فقدان الهاتف"
                            >
                              <i className="fas fa-life-ring"></i> كود طوارئ 🚨
                            </button>

                            {/* Disable 2FA button if enabled */}
                            {details.twoFactorEnabled && (
                              <button
                                type="button"
                                onClick={() => handleReset2FA(t)}
                                style={{
                                  background: '#fff1f2',
                                  border: '1px solid #fecdd3',
                                  color: '#e11d48',
                                  padding: '4px 8px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                                title="تعطيل الأمان الثنائي وإعادة ضبطه"
                              >
                                تعطيل 2FA 🔄
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setEditingTeacher(t);
                                setCustomPinInput(getTeacherPin(t.id));
                                setSavePinError('');
                                setSavePinSuccess('');
                              }}
                              style={{
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                color: '#0284c7',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                              title="تعديل الرمز يدوياً"
                            >
                              <i className="fas fa-edit"></i> تعديل
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppPin(t)}
                              style={{
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                color: '#059669',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                              title="إرسال بيانات الدخول للمعلم عبر واتساب"
                            >
                              <i className="fab fa-whatsapp"></i> واتساب
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResetTeacherPin(t)}
                              style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                              title="إعادة ضبط كلمة المرور إلى 318212"
                            >
                              إعادة ضبط 🔄
                            </button>
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

      {/* EMERGENCY CODE MODAL */}
      {emergencyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          direction: 'rtl'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>🚨</div>
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
              رمز الطوارئ الإداري لتخطي الـ 2FA
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 1.25rem 0', lineHeight: '1.5' }}>
              تم توليد رمز طوارئ مؤقت لمرة واحدة للمربي/ة: <strong>{emergencyModal.teacher.nameAr}</strong>. يمكن للمعلم استخدامه لتخطي خطوة المصادقة الثنائية في حال فقدان الهاتف.
            </p>

            <div style={{
              background: '#fef3c7',
              border: '2px dashed #f59e0b',
              padding: '1.25rem',
              borderRadius: '16px',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 800, marginBottom: '0.4rem' }}>رمز الطوارئ المؤقت (للاستخدام مرة واحدة):</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#b45309', fontFamily: 'monospace', letterSpacing: '6px' }}>
                {emergencyModal.code}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(emergencyModal.code);
                  alert(`📋 تم نسخ كود الطوارئ: ${emergencyModal.code}`);
                }}
                style={{
                  flex: 1,
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-copy"></i> نسخ الكود
              </button>

              <button
                type="button"
                onClick={() => {
                  const msg = `السلام عليكم زميلنا المربي/ة *${emergencyModal.teacher.nameAr}*،\n\nإليك رمز الطوارئ الإداري لتسجيل الدخول إلى منظومة التسريح: *${emergencyModal.code}* (يُستخدم لمرة واحدة فقط).`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                style={{
                  flex: 1,
                  background: '#25d366',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <i className="fab fa-whatsapp"></i> إرسال عبر واتساب
              </button>
            </div>

            <button
              type="button"
              onClick={() => setEmergencyModal(null)}
              style={{
                marginTop: '1rem',
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      )}

      {/* EDIT TEACHER PIN MODAL */}
      {editingTeacher && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          direction: 'rtl'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>✏️</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                  تعديل رمز الدخول للمعلم
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 1.25rem 0', lineHeight: '1.5' }}>
              أنت الآن تقوم بتعيين رمز جديد للمربي/ة: <strong>{editingTeacher.nameAr}</strong> ({editingTeacher.nameHe}).
            </p>

            <form onSubmit={handleAdminSavePin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  الرمز السري الجديد (4 أرقام أو حروف على الأقل): *
                </label>
                <input
                  type="text"
                  required
                  value={customPinInput}
                  onChange={(e) => setCustomPinInput(e.target.value)}
                  placeholder="أدخل الرمز الجديد..."
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    letterSpacing: '3px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              {savePinError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.65rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                  {savePinError}
                </div>
              )}

              {savePinSuccess && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '0.65rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                  {savePinSuccess}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: '#0284c7',
                    color: 'white',
                    border: 'none',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  حفظ الرمز وتحديثه في السحابة 💾
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: GUARD ACCESS CODE & SECURITY                   */}
      {/* ========================================================= */}
      <div style={{
        background: 'white',
        borderRadius: '18px',
        padding: '1.25rem 1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            🛡️
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>أمان شاشة حارس المدرسة عند البوابة:</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>رمز قفل الحارس الحالي:</span>
              <span style={{ fontFamily: 'monospace', color: '#0284c7', background: '#f8fafc', padding: '2px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                {showGuardPin ? guardPin : '••••••'}
              </span>
              <button
                onClick={() => setShowGuardPin(!showGuardPin)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.95rem' }}
                title={showGuardPin ? 'إخفاء' : 'كشف'}
              >
                <i className={`fas ${showGuardPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {isEditingGuardPin ? (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input
                type="text"
                value={guardPinInput}
                onChange={(e) => setGuardPinInput(e.target.value)}
                placeholder="رمز جديد..."
                style={{ width: '110px', padding: '0.45rem 0.6rem', border: '1.5px solid #0284c7', borderRadius: '8px', textAlign: 'center', fontWeight: 800 }}
              />
              <button onClick={handleSaveGuardPin} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>حفظ</button>
              <button onClick={() => setIsEditingGuardPin(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.45rem 0.7rem', borderRadius: '8px', cursor: 'pointer' }}>إلغاء</button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingGuardPin(true)}
              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              تغيير رمز الحارس ✏️
            </button>
          )}
          <a
            href="#/guard"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: '#0284c7', color: 'white', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            فتح شاشة الحارس 🚪
          </a>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: DISMISSALS LOG & LIVE GATE MONITOR             */}
      {/* ========================================================= */}
      <div style={{
        background: 'white',
        borderRadius: '22px',
        padding: '1.75rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
              سجل وإحصائيات تسريح الطلاب التفصيلي
            </h2>
            <p style={{ margin: '0.35rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              إجمالي السجلات: <strong>{dismissals.length}</strong> حالة • المطابق للبحث الحالي: <strong>{filteredDismissals.length}</strong> حالة
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <a
              href="#student-dismissal"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#10b981',
                color: 'white',
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.85rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              تسجيل إذن جديد ➕
            </a>
          </div>
        </div>

        {/* FILTERS TOOLBAR */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', background: '#f8fafc', padding: '1rem', borderRadius: '14px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>🔍 بحث بالاسم أو الرمز:</label>
            <input 
              type="text" 
              placeholder="اسم الطالب، المرافق، الرمز..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>🏫 الصف والشعبة:</label>
            <select 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem', boxSizing: 'border-box' }}
            >
              <option value="all">جميع الصفوف</option>
              {classStats.map(c => (
                <option key={c.className} value={c.className}>{c.className}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>👨‍🏫 المربي المصرح:</label>
            <select 
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem', boxSizing: 'border-box' }}
            >
              <option value="all">جميع المربين</option>
              {teacherStats.map(t => (
                <option key={t.name} value={t.name}>{t.name} ({t.count})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>📅 تصفية بالتاريخ:</label>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* DISMISSALS TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', color: '#334155' }}>
                <th style={{ padding: '0.85rem' }}>رمز الإذن</th>
                <th style={{ padding: '0.85rem' }}>اسم الطالب</th>
                <th style={{ padding: '0.85rem' }}>الصف</th>
                <th style={{ padding: '0.85rem' }}>وقت وتاريخ الخروج</th>
                <th style={{ padding: '0.85rem' }}>المربي المصرح</th>
                <th style={{ padding: '0.85rem' }}>المرافق المستلم</th>
                <th style={{ padding: '0.85rem' }}>السبب</th>
                <th style={{ padding: '0.85rem' }}>حالة البوابة</th>
                <th style={{ padding: '0.85rem' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredDismissals.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    {isLoading ? 'جاري تحميل السجلات من السحابة...' : 'لا توجد سجلات تسريح تطابق الفلتر المحدد.'}
                  </td>
                </tr>
              ) : (
                filteredDismissals.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 900, color: '#0284c7', fontFamily: 'monospace' }}>
                      {d.passCode || 'DIS'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <strong>{d.studentName}</strong>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 800, color: '#475569' }}>
                      {d.classroom}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                      <div>⏰ {d.departureTime}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{d.departureDate}</div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#0f172a', fontWeight: 700 }}>
                      👨‍🏫 {d.teacherName}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                      <div>{d.companionName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>({d.companionType})</div>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                      {d.reason}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button 
                        onClick={() => handleToggleGateExit(d.id, d.gateStatus)}
                        style={{
                          background: d.gateStatus === 'exited' ? '#ecfdf5' : '#fffbeb',
                          color: d.gateStatus === 'exited' ? '#047857' : '#b45309',
                          border: `1px solid ${d.gateStatus === 'exited' ? '#a7f3d0' : '#fde68a'}`,
                          padding: '4px 10px',
                          borderRadius: '50px',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                        title="انقر لتبديل حالة الخروج"
                      >
                        {d.gateStatus === 'exited' ? `خرج ✅ (${d.gateExitTime || ''})` : 'قيد الانتظار ⏳'}
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button 
                        onClick={() => handleDeleteRecord(d.id, d.studentName)}
                        style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800 }}
                        title="حذف هذا السجل"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 4: ANALYTICS BREAKDOWN                            */}
      {/* ========================================================= */}
      {(adminViewMode === 'all' || adminViewMode === 'stats') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* TEACHERS RANKING */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
              👨‍🏫 المربون الأكثر إصداراً لأذونات التسريح:
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {teacherStats.slice(0, 7).map((t, idx) => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: idx === 0 ? '#f0f9ff' : '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 800, color: idx === 0 ? '#0284c7' : '#334155' }}>
                    {idx + 1}. {t.name}
                  </div>
                  <div style={{ fontWeight: 900, color: '#0f172a' }}>
                    {t.count} إذن <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({t.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CLASSROOM RANKING */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
              🏫 أكثر الصفوف تسريحاً للطلاب:
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {classStats.slice(0, 7).map((c, idx) => (
                <div key={c.className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 800, color: '#334155' }}>
                    {idx + 1}. {c.className}
                  </div>
                  <div style={{ fontWeight: 900, color: '#0f172a' }}>
                    {c.count} حالة <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({c.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDismissalAdminTab;
