import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { sanitizeText } from '../utils/security';

const WEEKDAYS_AR = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت'
};

const AppointmentsLogPage = () => {
  // Get Today's Date String YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Main portal mode: 'dismissals' (تسريح الطلاب) or 'visitors' (المواعيد والزوار)
  const [activePortalTab, setActivePortalTab] = useState('dismissals');

  // Shared Date Filter
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [viewAllDates, setViewAllDates] = useState(false);

  // Visitors State
  const [appointments, setAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, entered, waiting

  // Quick Walk-in Modal for Visitors
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('الصف الأول (أ)');
  const [newTeacherName, setNewTeacherName] = useState('إدارة المدرسة');
  const [newMeetingTopic, setNewMeetingTopic] = useState('زيارة طارئة / مراجعة');
  const [newTimeSlot, setNewTimeSlot] = useState(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });

  // Student Dismissals State
  const [dismissals, setDismissals] = useState([]);
  const [isLoadingDismissals, setIsLoadingDismissals] = useState(true);
  const [dismissalSearch, setDismissalSearch] = useState('');
  const [dismissalStatusFilter, setDismissalStatusFilter] = useState('all'); // all, waiting, dismissed
  const [soundEnabled, setSoundEnabled] = useState(true);
  const isFirstDismissalLoad = useRef(true);

  // Sound chime synthesizer
  const playAlertChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch (e) {
      console.log('Audio chime error or blocked by browser policy:', e);
    }
  };

  // Real-time Firestore Listener for Student Dismissals
  useEffect(() => {
    setIsLoadingDismissals(true);
    const dismissalsRef = collection(db, 'student_dismissals');

    let unsubscribe = () => {};

    const processSnapshot = (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setDismissals(list);
      setIsLoadingDismissals(false);

      if (!isFirstDismissalLoad.current) {
        let hasNewWaiting = false;
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          const isDone = data.status === 'dismissed' || data.gateStatus === 'exited' || data.entryStatus === 'exited';
          if (change.type === 'added' && !isDone) {
            hasNewWaiting = true;
          }
        });
        if (hasNewWaiting) {
          playAlertChime();
        }
      }
      isFirstDismissalLoad.current = false;
    };

    try {
      const q = query(dismissalsRef, orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, processSnapshot, (err) => {
        console.warn('Dismissals orderBy listener error, falling back to base listener:', err);
        unsubscribe = onSnapshot(dismissalsRef, processSnapshot, (err2) => {
          console.warn('Dismissals base listener error:', err2);
          getDocs(dismissalsRef).then((snap) => {
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            setDismissals(list);
          }).catch(e => {
            console.warn('Fallback getDocs note:', e);
          }).finally(() => {
            setIsLoadingDismissals(false);
          });
        });
      });
    } catch (e) {
      console.warn('Listener query setup error:', e);
      setIsLoadingDismissals(false);
    }

    return () => unsubscribe();
  }, [soundEnabled]);

  // Track dismissals inside appointments for real-time chime alerts
  const prevDismissalIdsRef = useRef(new Set());

  // Real-time Firestore Listener for Appointments
  useEffect(() => {
    setIsLoadingAppointments(true);
    const appRef = collection(db, 'teacher_appointments');
    const q = query(appRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAppointments(list);
      setIsLoadingAppointments(false);
      setIsLoadingDismissals(false);

      // Check for incoming new student dismissals via teacher_appointments
      const waitingDismissals = list.filter(a => (a.isDismissal || a.type === 'student_dismissal') && a.entryStatus !== 'exited');
      if (!isFirstDismissalLoad.current && waitingDismissals.length > 0) {
        let hasNew = false;
        waitingDismissals.forEach(w => {
          if (!prevDismissalIdsRef.current.has(w.id)) {
            hasNew = true;
          }
        });
        if (hasNew) {
          playAlertChime();
        }
      }
      prevDismissalIdsRef.current = new Set(waitingDismissals.map(w => w.id));
    }, (err) => {
      console.error('Error listening to appointments:', err);
      getDocs(appRef).then((snap) => {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setAppointments(list);
        setIsLoadingAppointments(false);
        setIsLoadingDismissals(false);
      }).catch(e => {
        console.error('Fallback fetch error:', e);
        setIsLoadingAppointments(false);
        setIsLoadingDismissals(false);
      });
    });

    return () => unsubscribe();
  }, []);

  // Format Date to friendly Arabic text
  const formatDateArabic = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayName = WEEKDAYS_AR[dt.getDay()] || '';
      return `${dayName} ${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  // Change Date Helpers
  const shiftDate = (offsetDays) => {
    setViewAllDates(false);
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + offsetDays);
    const newY = dt.getFullYear();
    const newM = String(dt.getMonth() + 1).padStart(2, '0');
    const newD = String(dt.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const goToToday = () => {
    setViewAllDates(false);
    setSelectedDate(getTodayString());
  };

  // Dismissal Confirm Handler (Guard confirms student has exited through gate)
  const handleConfirmStudentExit = async (dismissal) => {
    const confirmMsg = `تأكيد خروج الطالب: ${dismissal.studentName}\nبرفقة: ${dismissal.companionName}\n\nهل غادر الطالب بوابة المدرسة الآن؟`;
    if (!window.confirm(confirmMsg)) return;

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Update local states immediately for 0ms lag
    setAppointments(prev => prev.map(a => (a.id === dismissal.id || (a.passCode && a.passCode === dismissal.passCode)) ? {
      ...a,
      entryStatus: 'exited',
      enteredAt: timeFormatted,
      status: 'dismissed',
      gateStatus: 'exited',
      actualExitTime: timeFormatted,
      gateExitTime: timeFormatted
    } : a));

    setDismissals(prev => prev.map(d => (d.id === dismissal.id || (d.passCode && d.passCode === dismissal.passCode)) ? {
      ...d,
      status: 'dismissed',
      gateStatus: 'exited',
      entryStatus: 'exited',
      actualExitTime: timeFormatted,
      gateExitTime: timeFormatted,
      confirmedAt: new Date().toISOString(),
      confirmedBy: 'حارس البوابة'
    } : d));

    // 1. Persist to teacher_appointments (permitted in Firestore security rules for entryStatus & enteredAt)
    try {
      const appRef = doc(db, 'teacher_appointments', dismissal.id);
      await updateDoc(appRef, {
        entryStatus: 'exited',
        enteredAt: timeFormatted
      });
    } catch (e) {
      console.warn('teacher_appointments exit update note:', e);
    }

    // 2. Also attempt update in student_dismissals collection
    try {
      const ref = doc(db, 'student_dismissals', dismissal.id);
      await updateDoc(ref, {
        status: 'dismissed',
        gateStatus: 'exited',
        actualExitTime: timeFormatted,
        gateExitTime: timeFormatted,
        confirmedAt: new Date().toISOString(),
        confirmedBy: 'حارس البوابة'
      });
    } catch (err) {
      console.warn('student_dismissals exit update note:', err);
    }
  };

  // Revert Student Dismissal
  const handleRevertStudentExit = async (dismissalId) => {
    if (!window.confirm('هل تريد التراجع عن تأكيد خروج الطالب وإعادته لحالة الانتظار؟')) return;

    // Update local state immediately
    setAppointments(prev => prev.map(a => (a.id === dismissalId) ? {
      ...a,
      entryStatus: 'waiting',
      enteredAt: null,
      status: 'waiting',
      gateStatus: 'pending',
      actualExitTime: null,
      gateExitTime: null
    } : a));

    setDismissals(prev => prev.map(d => (d.id === dismissalId) ? {
      ...d,
      status: 'waiting',
      gateStatus: 'pending',
      entryStatus: 'waiting',
      actualExitTime: null,
      gateExitTime: null,
      confirmedAt: null
    } : d));

    // Persist to teacher_appointments
    try {
      const appRef = doc(db, 'teacher_appointments', dismissalId);
      await updateDoc(appRef, {
        entryStatus: 'waiting',
        enteredAt: null
      });
    } catch (e) {
      console.warn('teacher_appointments revert note:', e);
    }

    // Persist to student_dismissals
    try {
      const ref = doc(db, 'student_dismissals', dismissalId);
      await updateDoc(ref, {
        status: 'waiting',
        gateStatus: 'pending',
        actualExitTime: null,
        gateExitTime: null,
        confirmedAt: null
      });
    } catch (err) {
      console.warn('student_dismissals revert note:', err);
    }
  };

  // Toggle Entry Status for Visitor Appointments
  const handleToggleEntry = async (appointment) => {
    try {
      const appDocRef = doc(db, 'teacher_appointments', appointment.id);
      const isCurrentlyEntered = appointment.entryStatus === 'entered';

      if (isCurrentlyEntered) {
        await updateDoc(appDocRef, {
          entryStatus: 'waiting',
          enteredAt: null
        });
      } else {
        const now = new Date();
        const timeFormatted = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
        await updateDoc(appDocRef, {
          entryStatus: 'entered',
          enteredAt: timeFormatted
        });
      }
    } catch (err) {
      console.error('Error toggling entry status:', err);
      alert('حدث خطأ أثناء تحديث حالة الدخول.');
    }
  };

  // Quick Add Walk-in Visitor
  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    if (!newParentName.trim()) {
      alert('يرجى كتابة اسم الزائر!');
      return;
    }

    try {
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
      const ticketCode = `GATE-${Math.floor(1000 + Math.random() * 9000)}`;

      const newRecord = {
        ticketCode,
        parentName: sanitizeText(newParentName.trim()),
        parentPhone: sanitizeText(newParentPhone.trim()) || 'غير مسجل',
        studentName: sanitizeText(newStudentName.trim()) || 'زيارة عامة',
        studentClass: sanitizeText(newStudentClass),
        teacherNameAr: sanitizeText(newTeacherName),
        teacherRole: 'استقبال مدرسي',
        date: selectedDate,
        dayAr: WEEKDAYS_AR[new Date(selectedDate).getDay()] || '',
        timeSlot: sanitizeText(newTimeSlot),
        meetingTopic: sanitizeText(newMeetingTopic),
        meetingType: 'زيارة فورية',
        status: 'confirmed',
        entryStatus: 'entered',
        enteredAt: timeFormatted,
        isWalkIn: true,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'teacher_appointments'), newRecord);
      setShowAddModal(false);
      setNewParentName('');
      setNewParentPhone('');
      setNewStudentName('');
    } catch (err) {
      console.error('Error adding walk-in:', err);
      alert('حدث خطأ أثناء إضافة الزائر.');
    }
  };

  // Combined dismissals from appointments (teacher_appointments) and student_dismissals
  const combinedDismissals = useMemo(() => {
    const map = new Map();
    // 1. From teacher_appointments collection (which has active Firestore permissions)
    appointments.forEach((a) => {
      if (a.isDismissal === true || a.type === 'student_dismissal') {
        const key = a.id || a.passCode;
        const isExited = a.entryStatus === 'exited' || a.status === 'dismissed' || a.gateStatus === 'exited';
        map.set(key, {
          ...a,
          id: a.id,
          passCode: a.passCode || 'DIS-' + (a.id || '').slice(-4),
          studentName: a.studentName || '',
          classroom: a.classroom || a.studentClass || '',
          teacherName: a.teacherName || a.teacherNameAr || '',
          companionName: a.companionName || a.parentName || '',
          companionType: a.companionType || 'ولي أمر',
          departureDate: a.departureDate || a.date,
          departureTime: a.departureTime || a.dismissalTime || a.timeSlot,
          status: isExited ? 'dismissed' : (a.status || 'waiting'),
          gateStatus: isExited ? 'exited' : (a.gateStatus || 'pending'),
          entryStatus: isExited ? 'exited' : 'waiting',
          actualExitTime: a.enteredAt || a.actualExitTime || a.gateExitTime || null,
          gateExitTime: a.enteredAt || a.gateExitTime || a.actualExitTime || null
        });
      }
    });

    // 2. From student_dismissals collection
    dismissals.forEach((d) => {
      const key = d.id || d.passCode;
      const existing = map.get(key) || {};
      const isExited = d.status === 'dismissed' || d.gateStatus === 'exited' || existing.status === 'dismissed';
      map.set(key, {
        ...existing,
        ...d,
        id: d.id || existing.id,
        status: isExited ? 'dismissed' : 'waiting',
        gateStatus: isExited ? 'exited' : 'pending',
        actualExitTime: d.actualExitTime || existing.actualExitTime || null,
        gateExitTime: d.gateExitTime || existing.gateExitTime || null
      });
    });

    return Array.from(map.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [appointments, dismissals]);

  // Filtered Dismissals List
  const filteredDismissals = combinedDismissals.filter((item) => {
    const itemDate = item.date || item.departureDate || (item.createdAt ? item.createdAt.split('T')[0] : '');
    if (!viewAllDates && itemDate && itemDate !== selectedDate) {
      return false;
    }
    const isExited = item.status === 'dismissed' || item.gateStatus === 'exited' || item.entryStatus === 'exited';
    if (dismissalStatusFilter === 'waiting' && isExited) return false;
    if (dismissalStatusFilter === 'dismissed' && !isExited) return false;

    if (dismissalSearch.trim()) {
      const q = dismissalSearch.toLowerCase();
      const sName = (item.studentName || '').toLowerCase();
      const cName = (item.companionName || '').toLowerCase();
      const sClass = (item.classroom || item.studentClass || '').toLowerCase();
      const teacher = (item.teacherName || item.teacherNameAr || '').toLowerCase();
      const pass = (item.passCode || '').toLowerCase();
      const reason = (item.reason || '').toLowerCase();
      if (!sName.includes(q) && !cName.includes(q) && !sClass.includes(q) && !teacher.includes(q) && !pass.includes(q) && !reason.includes(q)) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  // Calculate day dismissal stats
  const dayDismissals = combinedDismissals.filter(d => {
    const dDate = d.date || d.departureDate || (d.createdAt ? d.createdAt.split('T')[0] : '');
    return !dDate || dDate === selectedDate;
  });
  const totalDismissalsCount = dayDismissals.length;
  const waitingDismissalsCount = dayDismissals.filter(d => d.status !== 'dismissed' && d.gateStatus !== 'exited' && d.entryStatus !== 'exited').length;
  const completedDismissalsCount = dayDismissals.filter(d => d.status === 'dismissed' || d.gateStatus === 'exited' || d.entryStatus === 'exited').length;

  // Filtered Appointments List (excluding student dismissals so visitors tab is cleanly separated)
  const visitorAppointments = useMemo(() => {
    return appointments.filter(app => !app.isDismissal && app.type !== 'student_dismissal');
  }, [appointments]);

  const filteredAppointments = visitorAppointments.filter((app) => {
    if (!viewAllDates && app.date !== selectedDate) {
      return false;
    }
    if (filterStatus === 'entered' && app.entryStatus !== 'entered') return false;
    if (filterStatus === 'waiting' && app.entryStatus === 'entered') return false;
    if (filterTeacher !== 'all' && app.teacherNameAr !== filterTeacher) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const pName = (app.parentName || '').toLowerCase();
      const sName = (app.studentName || '').toLowerCase();
      const phone = (app.parentPhone || '').toLowerCase();
      const tName = (app.teacherNameAr || '').toLowerCase();
      const tCode = (app.ticketCode || '').toLowerCase();
      if (!pName.includes(q) && !sName.includes(q) && !phone.includes(q) && !tName.includes(q) && !tCode.includes(q)) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

  // Calculate day appointment stats
  const dayAppointments = visitorAppointments.filter(a => a.date === selectedDate);
  const totalDayAppointments = dayAppointments.length;
  const enteredDayAppointments = dayAppointments.filter(a => a.entryStatus === 'entered').length;
  const waitingDayAppointments = totalDayAppointments - enteredDayAppointments;

  const isToday = selectedDate === getTodayString();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '6.5rem 1rem 4rem', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
      
      {/* Top Container */}
      <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
        
        {/* Header Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: 'white',
          borderRadius: '24px',
          padding: '1.5rem 2rem',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem'
        }}>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.35rem 0.85rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.5rem' }}>
              <i className="fas fa-shield-alt"></i>
              <span>بوابة الدخول والاستقبال ومراقبة الخروج</span>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>لوحة حارس المدرسة والأمن 🛡️</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8', fontWeight: 600 }}>
              متابعة فورية لأذونات تسريح الطلاب وحجوزات المواعيد والزوار اليومية
            </p>
          </div>

          {/* Header Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            
            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playAlertChime();
              }}
              style={{
                background: soundEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: soundEnabled ? '#4ade80' : '#f87171',
                border: `1px solid ${soundEnabled ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                padding: '0.75rem 1rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              title={soundEnabled ? 'صوت التنبيه مفعل' : 'صوت التنبيه معطل'}
            >
              <i className={`fas ${soundEnabled ? 'fa-bell' : 'fa-bell-slash'}`}></i>
              <span>{soundEnabled ? 'التنبيه الصوتي شغال 🔔' : 'الصوت مكتوم 🔕'}</span>
            </button>

            {/* Link to Dismissal Form (for teachers) */}
            <a
              href="#/student-dismissal"
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: 'white',
                textDecoration: 'none',
                padding: '0.75rem 1.15rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
              }}
            >
              <i className="fas fa-file-signature"></i>
              <span>تسجيل إذن تسريح 🏃‍♂️</span>
            </a>

            {/* Quick Walkin */}
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.15rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              <i className="fas fa-user-plus"></i>
              <span>تسجيل زائر ➕</span>
            </button>

            <button
              onClick={() => window.print()}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.75rem 1.1rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              title="طباعة الكشف الرسمي"
            >
              <i className="fas fa-print"></i>
              <span>طباعة 🖨️</span>
            </button>
          </div>
        </div>

        {/* PRIMARY MODE SWITCHER: DISMISSALS VS VISITORS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* TAB 1: STUDENT DISMISSALS */}
          <button
            onClick={() => setActivePortalTab('dismissals')}
            style={{
              padding: '1.1rem 1.5rem',
              borderRadius: '20px',
              border: activePortalTab === 'dismissals' ? '3px solid #0284c7' : '2px solid #e2e8f0',
              background: activePortalTab === 'dismissals' ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: activePortalTab === 'dismissals' ? '0 8px 20px rgba(2, 132, 199, 0.18)' : '0 2px 8px rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease',
              textAlign: 'right'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: activePortalTab === 'dismissals' ? '#0284c7' : '#f1f5f9',
                color: activePortalTab === 'dismissals' ? 'white' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem'
              }}>
                <i className="fas fa-walking"></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: activePortalTab === 'dismissals' ? '#0369a1' : '#1e293b' }}>
                  أذونات تسريح وخروج الطلاب 🏃‍♂️
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  تأكيد خروج الطلاب المسرحين مع الأولياء
                </p>
              </div>
            </div>

            {waitingDismissalsCount > 0 && (
              <span style={{
                background: '#ea580c',
                color: 'white',
                padding: '0.35rem 0.85rem',
                borderRadius: '50px',
                fontWeight: 900,
                fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)',
                animation: 'pulse 1.8s infinite'
              }}>
                {waitingDismissalsCount} بانتظار الخروج ⏳
              </span>
            )}
          </button>

          {/* TAB 2: VISITORS & APPOINTMENTS */}
          <button
            onClick={() => setActivePortalTab('visitors')}
            style={{
              padding: '1.1rem 1.5rem',
              borderRadius: '20px',
              border: activePortalTab === 'visitors' ? '3px solid #10b981' : '2px solid #e2e8f0',
              background: activePortalTab === 'visitors' ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: activePortalTab === 'visitors' ? '0 8px 20px rgba(16, 185, 129, 0.18)' : '0 2px 8px rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease',
              textAlign: 'right'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: activePortalTab === 'visitors' ? '#10b981' : '#f1f5f9',
                color: activePortalTab === 'visitors' ? 'white' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem'
              }}>
                <i className="fas fa-address-book"></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: activePortalTab === 'visitors' ? '#047857' : '#1e293b' }}>
                  سجل الزوار والمواعيد 🏫
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  حجوزات لقاء المعلمين والزيارات الطارئة
                </p>
              </div>
            </div>

            {waitingDayAppointments > 0 && (
              <span style={{
                background: '#047857',
                color: 'white',
                padding: '0.35rem 0.85rem',
                borderRadius: '50px',
                fontWeight: 900,
                fontSize: '0.85rem'
              }}>
                {waitingDayAppointments} في الانتظار
              </span>
            )}
          </button>
        </div>

        {/* Date Selector Navigation Bar */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '1.25rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            
            {/* Day Nav Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => shiftDate(-1)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.55rem 0.95rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <i className="fas fa-chevron-right"></i>
                <span>اليوم السابق</span>
              </button>

              <button
                onClick={goToToday}
                style={{
                  background: isToday && !viewAllDates ? '#0284c7' : '#e0f2fe',
                  color: isToday && !viewAllDates ? 'white' : '#0369a1',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.55rem 1.1rem',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.88rem'
                }}
              >
                اليوم الحاضر 🎯
              </button>

              <button
                onClick={() => shiftDate(1)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.55rem 0.95rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <span>اليوم التالي</span>
                <i className="fas fa-chevron-left"></i>
              </button>

              <button
                onClick={() => setViewAllDates(!viewAllDates)}
                style={{
                  background: viewAllDates ? '#475569' : '#f8fafc',
                  color: viewAllDates ? 'white' : '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.55rem 1rem',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}
              >
                {viewAllDates ? 'عرض اليوم فقط 📅' : 'عرض كافة الأيام 🌐'}
              </button>
            </div>

            {/* Date Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>التاريخ المختار:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setViewAllDates(false);
                }}
                style={{
                  border: '2px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '0.5rem 0.9rem',
                  fontFamily: 'inherit',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  background: '#f8fafc',
                  cursor: 'pointer'
                }}
              />
              <span style={{
                background: '#eff6ff',
                color: '#1d4ed8',
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.9rem'
              }}>
                {viewAllDates ? 'كافة السجلات' : formatDateArabic(selectedDate)}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1: STUDENT DISMISSALS INTERFACE */}
        {/* ========================================================= */}
        {activePortalTab === 'dismissals' && (
          <div>
            {/* Quick Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>إجمالي الطلاب المسرحين</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '0.25rem' }}>
                  {totalDismissalsCount} طالب
                </div>
              </div>

              <div style={{ background: '#fff7ed', padding: '1.25rem', borderRadius: '18px', border: '2px solid #fed7aa', boxShadow: '0 2px 8px rgba(234, 88, 12, 0.08)' }}>
                <span style={{ fontSize: '0.85rem', color: '#c2410c', fontWeight: 800 }}>⏳ بانتظار الخروج عند البوابة</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ea580c', marginTop: '0.25rem' }}>
                  {waitingDismissalsCount} طالب
                </div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '1.25rem', borderRadius: '18px', border: '2px solid #bbf7d0', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)' }}>
                <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 800 }}>✅ خرجوا من المدرسة</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16a34a', marginTop: '0.25rem' }}>
                  {completedDismissalsCount} طالب
                </div>
              </div>
            </div>

            {/* Dismissal Controls Bar */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.25rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              {/* Search Bar */}
              <div style={{ flex: '1 1 260px', position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input
                  type="text"
                  value={dismissalSearch}
                  onChange={(e) => setDismissalSearch(e.target.value)}
                  placeholder="ابحث باسم الطالب، الصف، المرافق، رمز التأكيد..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.6rem 0.65rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    background: '#f8fafc'
                  }}
                />
              </div>

              {/* Status Filter Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setDismissalStatusFilter('all')}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: dismissalStatusFilter === 'all' ? '#0f172a' : '#f1f5f9',
                    color: dismissalStatusFilter === 'all' ? 'white' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  الكل ({filteredDismissals.length})
                </button>

                <button
                  onClick={() => setDismissalStatusFilter('waiting')}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: dismissalStatusFilter === 'waiting' ? '#ea580c' : '#f1f5f9',
                    color: dismissalStatusFilter === 'waiting' ? 'white' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  ⏳ بانتظار الخروج
                </button>

                <button
                  onClick={() => setDismissalStatusFilter('dismissed')}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: dismissalStatusFilter === 'dismissed' ? '#16a34a' : '#f1f5f9',
                    color: dismissalStatusFilter === 'dismissed' ? 'white' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  ✅ خرجوا بالفعل
                </button>
              </div>
            </div>

            {/* Dismissals Cards List */}
            {isLoadingDismissals ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: '#0284c7', marginBottom: '1rem' }}></i>
                <h3 style={{ fontWeight: 800, color: '#334155', margin: 0 }}>جاري تحميل أذونات تسريح الطلاب...</h3>
              </div>
            ) : filteredDismissals.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '4rem 2rem',
                textAlign: 'center',
                border: '2px dashed #cbd5e1'
              }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eff6ff', color: '#0284c7', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                  <i className="fas fa-user-graduate"></i>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
                  لا توجد أذونات تسريح مسجلة
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 1.5rem auto', fontWeight: 600 }}>
                  {viewAllDates ? 'لا توجد نتائج مطابقة لبحثك.' : `لم يسجل أي مربي إذن تسريح لهذا اليوم (${formatDateArabic(selectedDate)}).`}
                </p>
                <a
                  href="#/student-dismissal"
                  style={{
                    display: 'inline-block',
                    background: '#0284c7',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.95rem'
                  }}
                >
                  تسجيل إذن تسريح جديد 🏃‍♂️
                </a>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                {filteredDismissals.map((item) => {
                  const isDismissed = item.status === 'dismissed' || item.gateStatus === 'exited';

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: 'white',
                        borderRadius: '20px',
                        border: isDismissed ? '2px solid #bbf7d0' : '2px solid #fed7aa',
                        boxShadow: isDismissed ? '0 4px 14px rgba(34, 197, 94, 0.08)' : '0 8px 24px rgba(234, 88, 12, 0.12)',
                        padding: '1.5rem',
                        position: 'relative',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        
                        {/* Student Details */}
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: item.gender === 'female' ? '#fce7f3' : '#e0f2fe',
                            color: item.gender === 'female' ? '#be185d' : '#0369a1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.8rem',
                            flexShrink: 0
                          }}>
                            {item.gender === 'female' ? '👧' : (item.gender === 'male' ? '👦' : '🎓')}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                                {item.studentName}
                              </h2>
                              {item.familyName && item.familyName !== 'غير محدد' && (
                                <span style={{
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '8px',
                                  fontWeight: 800,
                                  fontSize: '0.8rem'
                                }}>
                                  عائلة: {item.familyName}
                                </span>
                              )}
                              <span style={{
                                background: '#e0e7ff',
                                color: '#3730a3',
                                padding: '0.2rem 0.65rem',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.85rem'
                              }}>
                                🏫 {item.classroom || item.studentClass}
                              </span>
                            </div>

                            {/* Companion & Teacher Info */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.9rem', color: '#334155' }}>
                              <div>
                                <strong style={{ color: '#0f172a' }}>المرافق المستلم: </strong>
                                <span>{item.companionName}</span>
                                {item.companionRelation && <span style={{ color: '#64748b' }}> ({item.companionRelation})</span>}
                              </div>

                              {item.companionPhone && item.companionPhone !== 'غير مسجل' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <strong>الهاتف: </strong>
                                  <a href={`tel:${item.companionPhone}`} style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 800 }}>
                                    📞 {item.companionPhone}
                                  </a>
                                  <a
                                    href={`https://wa.me/${item.companionPhone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: '#16a34a', textDecoration: 'none', marginLeft: '0.3rem', fontSize: '1.05rem' }}
                                    title="مراسلة واتساب"
                                  >
                                    💬
                                  </a>
                                </div>
                              )}

                              <div>
                                <strong style={{ color: '#0f172a' }}>المربي المصرح: </strong>
                                <span style={{ color: '#0369a1', fontWeight: 700 }}>👨‍🏫 {item.teacherName || item.teacherNameAr}</span>
                              </div>
                            </div>

                            {/* Reason & Times */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.6rem', fontSize: '0.85rem' }}>
                              <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: 700 }}>
                                السبب: {item.reason}
                              </span>
                              <span style={{ color: '#64748b', fontWeight: 700 }}>
                                ⏰ وقت الإذن: <strong>{item.departureTime || item.dismissalTime || item.timeSlot}</strong>
                              </span>
                              {(item.actualExitTime || item.gateExitTime) && (
                                <span style={{ color: '#16a34a', fontWeight: 800 }}>
                                  🚪 وقت الخروج الفعلي من البوابة: <strong>{item.actualExitTime || item.gateExitTime}</strong>
                                </span>
                              )}
                              {item.passCode && (
                                <span style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800, color: '#475569' }}>
                                  رمز التأكيد: #{item.passCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Guard Action Button */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: '180px' }}>
                          {!isDismissed ? (
                            <button
                              onClick={() => handleConfirmStudentExit(item)}
                              style={{
                                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '0.85rem 1.4rem',
                                borderRadius: '14px',
                                fontWeight: 900,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                boxShadow: '0 6px 18px rgba(22, 163, 74, 0.35)',
                                transition: 'all 0.2s ease',
                                width: '100%',
                                justifyContent: 'center'
                              }}
                            >
                              <i className="fas fa-door-open"></i>
                              <span>تأكيد خروج الطالب وفتح البوابة ✅</span>
                            </button>
                          ) : (
                            <div style={{ textAlign: 'center', width: '100%' }}>
                              <div style={{
                                background: '#dcfce7',
                                color: '#15803d',
                                padding: '0.65rem 1rem',
                                borderRadius: '12px',
                                fontWeight: 900,
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                border: '1px solid #86efac'
                              }}>
                                <i className="fas fa-check-circle"></i>
                                <span>خرج من المدرسة ({item.actualExitTime || item.gateExitTime || item.departureTime || item.dismissalTime})</span>
                              </div>
                              <button
                                onClick={() => handleRevertStudentExit(item.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  marginTop: '0.35rem',
                                  textDecoration: 'underline'
                                }}
                              >
                                تراجع لحالة الانتظار
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: VISITORS & APPOINTMENTS INTERFACE */}
        {/* ========================================================= */}
        {activePortalTab === 'visitors' && (
          <div>
            {/* Appointment Day Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>إجمالي مواعيد اليوم</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '0.25rem' }}>
                  {totalDayAppointments} زائر
                </div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '1.25rem', borderRadius: '18px', border: '2px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 800 }}>✅ دخلوا المدرسة</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16a34a', marginTop: '0.25rem' }}>
                  {enteredDayAppointments} زائر
                </div>
              </div>

              <div style={{ background: '#fff7ed', padding: '1.25rem', borderRadius: '18px', border: '2px solid #fed7aa' }}>
                <span style={{ fontSize: '0.85rem', color: '#c2410c', fontWeight: 800 }}>⏳ في الانتظار</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ea580c', marginTop: '0.25rem' }}>
                  {waitingDayAppointments} زائر
                </div>
              </div>
            </div>

            {/* Filter and Search Bar for Visitors */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.25rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              {/* Search Bar */}
              <div style={{ flex: '1 1 240px', position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم الزائر، الطالب، المعلم، الرمز..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.6rem 0.65rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    background: '#f8fafc'
                  }}
                />
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFilterStatus('all')}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: filterStatus === 'all' ? '#0f172a' : '#f1f5f9',
                    color: filterStatus === 'all' ? 'white' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  الكل ({filteredAppointments.length})
                </button>
                <button
                  onClick={() => setFilterStatus('waiting')}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: filterStatus === 'waiting' ? '#d97706' : '#f1f5f9',
                    color: filterStatus === 'waiting' ? 'white' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  ⏳ قيد الانتظار
                </button>
                <button
                  onClick={() => setFilterStatus('entered')}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: filterStatus === 'entered' ? '#16a34a' : '#f1f5f9',
                    color: filterStatus === 'entered' ? 'white' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  ✅ دخلوا المدرسة
                </button>
              </div>
            </div>

            {/* Appointments Cards List */}
            {isLoadingAppointments ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: '#0284c7', marginBottom: '1rem' }}></i>
                <h3 style={{ fontWeight: 800, color: '#334155', margin: 0 }}>جاري تحميل جدول المواعيد والزوار...</h3>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '4rem 2rem',
                textAlign: 'center',
                border: '2px dashed #cbd5e1'
              }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0f9ff', color: '#0284c7', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                  <i className="fas fa-calendar-check"></i>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
                  لا توجد مواعيد مسجلة في هذا اليوم
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 1.5rem auto', fontWeight: 600 }}>
                  {viewAllDates ? 'لا توجد أي حجوزات مطابقة للبحث' : `لم يتم حجز أي موعد بعد لتاريخ (${formatDateArabic(selectedDate)}).`}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{
                    background: '#0284c7',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  تسجيل زائر جديد الآن ➕
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredAppointments.map((app) => {
                  const isEntered = app.entryStatus === 'entered';

                  return (
                    <div
                      key={app.id}
                      style={{
                        background: 'white',
                        borderRadius: '20px',
                        border: isEntered ? '2px solid #bbf7d0' : '2px solid #e2e8f0',
                        boxShadow: isEntered ? '0 4px 14px rgba(34, 197, 94, 0.06)' : '0 4px 16px rgba(0,0,0,0.03)',
                        padding: '1.35rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: '1 1 320px' }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '14px',
                          background: isEntered ? '#dcfce7' : '#f1f5f9',
                          color: isEntered ? '#15803d' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.3rem',
                          flexShrink: 0
                        }}>
                          <i className={`fas ${isEntered ? 'fa-user-check' : 'fa-user-clock'}`}></i>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                              {app.parentName}
                            </h3>
                            {app.isWalkIn && (
                              <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                                زيارة طارئة
                              </span>
                            )}
                            <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                              {app.ticketCode}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', fontSize: '0.88rem', color: '#475569' }}>
                            <div><strong>الطالب: </strong>{app.studentName} ({app.studentClass})</div>
                            <div><strong>المعلم/الجهة: </strong>{app.teacherNameAr}</div>
                            {app.parentPhone && app.parentPhone !== 'غير مسجل' && (
                              <div><strong>الهاتف: </strong><a href={`tel:${app.parentPhone}`} style={{ color: '#0284c7', textDecoration: 'none' }}>📞 {app.parentPhone}</a></div>
                            )}
                            <div><strong>الموضوع: </strong>{app.meetingTopic}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0284c7' }}>
                            ⏰ {app.timeSlot}
                          </span>
                          {app.enteredAt && (
                            <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
                              دخول: {app.enteredAt}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleToggleEntry(app)}
                          style={{
                            background: isEntered ? '#15803d' : '#f1f5f9',
                            color: isEntered ? 'white' : '#0f172a',
                            border: isEntered ? 'none' : '1.5px solid #cbd5e1',
                            padding: '0.7rem 1.25rem',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <i className={`fas ${isEntered ? 'fa-check-double' : 'fa-walking'}`}></i>
                          <span>{isEntered ? 'تم الدخول ✅' : 'تسجيل دخول 🚪'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal: Add Walk-in Visitor */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '2rem',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                  تسجيل زائر فوري للبوابة 🚪
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.1rem', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddWalkIn} style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    اسم الزائر / ولي الأمر *
                  </label>
                  <input
                    type="text"
                    required
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    placeholder="مثال: أحمد عبد الله محاميد"
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                      رقم هاتف الزائر
                    </label>
                    <input
                      type="tel"
                      value={newParentPhone}
                      onChange={(e) => setNewParentPhone(e.target.value)}
                      placeholder="050-0000000"
                      style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                      وقت الدخول
                    </label>
                    <input
                      type="time"
                      value={newTimeSlot}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                      اسم الطالب (إن وجد)
                    </label>
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="اسم الطالب"
                      style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                      الجهة / المعلم المستهدف
                    </label>
                    <input
                      type="text"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      placeholder="مثال: الإدارة / السكرتاريا"
                      style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    سبب أو موضوع الزيارة
                  </label>
                  <input
                    type="text"
                    value={newMeetingTopic}
                    onChange={(e) => setNewMeetingTopic(e.target.value)}
                    placeholder="سبب الزيارة"
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 800, cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    style={{ flex: 2, padding: '0.75rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 900, cursor: 'pointer' }}
                  >
                    حفظ وتأكيد الدخول 🚪
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AppointmentsLogPage;
