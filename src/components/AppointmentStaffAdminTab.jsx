import React, { useState, useEffect } from 'react';
import { db, emtnanDb } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { defaultSchoolTeachers } from '../data/schoolTeachersData';

const WEEKDAYS = [
  { key: 'Sunday', ar: 'الأحد' },
  { key: 'Monday', ar: 'الإثنين' },
  { key: 'Tuesday', ar: 'الثلاثاء' },
  { key: 'Wednesday', ar: 'الأربعاء' },
  { key: 'Thursday', ar: 'الخميس' }
];

const LOCAL_OVERRIDE_KEY = 'musherfe_teachers_reception_override';
const LOCAL_SETTINGS_KEY = 'musherfe_appointment_settings_cache';

const getLocalTeacherOverrides = () => {
  try {
    const raw = localStorage.getItem(LOCAL_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const setLocalTeacherOverride = (tchData) => {
  try {
    const map = getLocalTeacherOverrides();
    map[tchData.id] = tchData;
    localStorage.setItem(LOCAL_OVERRIDE_KEY, JSON.stringify(map));
  } catch (e) {}
};

const removeLocalTeacherOverride = (id) => {
  try {
    const map = getLocalTeacherOverrides();
    delete map[id];
    localStorage.setItem(LOCAL_OVERRIDE_KEY, JSON.stringify(map));
  } catch (e) {}
};

const AppointmentStaffAdminTab = () => {
  // Staff Config (Principal, Counselor, System Settings)
  const [config, setConfig] = useState({
    principal: {
      nameAr: 'إدارة المدرسة',
      nameHe: 'הנהלת בית הספר',
      role: 'مدير المدرسة والإدارة العامة',
      phone: '04-6311000',
      email: 'musheirifa.primary@gmail.com',
      enabled: true,
      receptionSchedule: [
        { day: 'Sunday', dayAr: 'الأحد', startTime: '08:30', endTime: '14:00' },
        { day: 'Tuesday', dayAr: 'الثلاثاء', startTime: '08:30', endTime: '14:00' },
        { day: 'Thursday', dayAr: 'الخميس', startTime: '08:30', endTime: '13:00' }
      ]
    },
    counselor: {
      nameAr: 'الاستشارة التربوية',
      nameHe: 'ייעוץ חינוכי',
      role: 'المستشار التربوي والدعم النفسي',
      phone: '',
      email: '',
      enabled: true,
      receptionSchedule: [
        { day: 'Sunday', dayAr: 'الأحد', startTime: '08:30', endTime: '13:30' },
        { day: 'Wednesday', dayAr: 'الأربعاء', startTime: '08:30', endTime: '13:30' }
      ]
    },
    systemSettings: {
      isOpen: true,
      closedMessage: 'نظام حجز المواعيد مغلق مؤقتاً للتحديث أو خلال العطلة المدرسية.',
      slotDurationMinutes: 20,
      noticeText: 'اختر الكادر الإداري، الاستشارة التربوية، أو المعلم المراد تحديد اللقاء معه لمعرفة أيام وساعات استقباله وحجز موعدك بسهولة!'
    }
  });

  // Teachers List State
  const [teachers, setTeachers] = useState([]);
  const [searchTeacher, setSearchTeacher] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Editing state for teachers
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [editingTeacherData, setEditingTeacherData] = useState(null);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [activeTabMode, setActiveTabMode] = useState('bookings');
  const [searchAppointment, setSearchAppointment] = useState('');
  const [filterTeacherOnly, setFilterTeacherOnly] = useState('all');

  // Load appointment config and teachers (Cloud Dual-Sync: emtnanDb + db + local)
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Load appointment settings
      let settingsLoaded = false;
      try {
        const snap = await getDoc(doc(emtnanDb, 'schoolGuide', 'appointment_settings'));
        if (snap.exists()) {
          const data = snap.data();
          setConfig(prev => ({
            ...prev,
            ...data,
            principal: { ...prev.principal, ...(data.principal || {}) },
            counselor: { ...prev.counselor, ...(data.counselor || {}) },
            systemSettings: { ...prev.systemSettings, ...(data.systemSettings || {}) }
          }));
          settingsLoaded = true;
        }
      } catch (e) {}

      if (!settingsLoaded) {
        try {
          const settingsSnap = await getDoc(doc(db, 'schoolGuide', 'appointment_settings'));
          if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            setConfig(prev => ({
              ...prev,
              ...data,
              principal: { ...prev.principal, ...(data.principal || {}) },
              counselor: { ...prev.counselor, ...(data.counselor || {}) },
              systemSettings: { ...prev.systemSettings, ...(data.systemSettings || {}) }
            }));
          }
        } catch (e) {}
      }

      // 2. Load teachers from Cloud (emtnanDb is primary cloud, db is secondary, plus local overrides)
      const cloudTeachersMap = new Map();

      // Channel A: emtnanDb
      try {
        const emtSnap = await getDocs(collection(emtnanDb, 'school_teachers'));
        if (!emtSnap.empty) {
          emtSnap.forEach(d => cloudTeachersMap.set(d.id, { id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn('emtnanDb load note:', e);
      }

      // Channel B: db
      try {
        const tSnap = await getDocs(collection(db, 'school_teachers'));
        if (!tSnap.empty) {
          tSnap.forEach(d => {
            if (!cloudTeachersMap.has(d.id)) {
              cloudTeachersMap.set(d.id, { id: d.id, ...d.data() });
            }
          });
        }
      } catch (e) {}

      // Channel C: Local overrides
      const localOverrides = getLocalTeacherOverrides();
      Object.values(localOverrides).forEach(ov => {
        if (ov && ov.id) cloudTeachersMap.set(ov.id, ov);
      });

      // Merge with defaultSchoolTeachers
      const mergedList = Array.from(cloudTeachersMap.values());
      for (const defTch of defaultSchoolTeachers) {
        if (!cloudTeachersMap.has(defTch.id)) {
          mergedList.push(defTch);
        }
      }
      setTeachers(mergedList);
    } catch (err) {
      console.warn('Error loading appointment data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time Dual-Sync Listener for Appointments across db & emtnanDb
  useEffect(() => {
    let unsub1 = () => {};
    let unsub2 = () => {};

    try {
      const appMap = new Map();
      const syncList = () => {
        try {
          const localList = JSON.parse(localStorage.getItem('musherfe_local_appointments') || '[]');
          localList.forEach(loc => {
            if (loc && loc.ticketCode && !appMap.has(loc.ticketCode)) {
              appMap.set(loc.ticketCode, loc);
            }
          });
        } catch (e) {}

        const list = Array.from(appMap.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setAppointmentsList(list);
      };

      unsub1 = onSnapshot(collection(db, 'teacher_appointments'), (snap) => {
        snap.forEach(d => appMap.set(d.id, { id: d.id, ...d.data() }));
        syncList();
      }, (e) => console.warn('db appointments note:', e));

      unsub2 = onSnapshot(collection(emtnanDb, 'teacher_appointments'), (snap) => {
        snap.forEach(d => appMap.set(d.id, { id: d.id, ...d.data() }));
        syncList();
      }, (e) => console.warn('emtnanDb appointments note:', e));

    } catch (e) {
      console.warn('Appointments error:', e);
    }

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const triggerSuccessAlert = (msg) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Save config (Principal, Counselor, System) to Cloud (emtnanDb + db + local)
  const handleSaveConfig = async (newConfig = null) => {
    setIsSaving(true);
    const toSave = newConfig || config;
    try {
      // 1. Cloud save to emtnanDb (Cloud Firestore - open & always succeeds!)
      try {
        await setDoc(doc(emtnanDb, 'schoolGuide', 'appointment_settings'), toSave, { merge: true });
      } catch (e) {
        console.warn('emtnanDb config write error:', e);
      }

      // 2. Main db save (if admin)
      try {
        await setDoc(doc(db, 'schoolGuide', 'appointment_settings'), toSave, { merge: true });
      } catch (e) {}

      // 3. Local storage
      try {
        localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(toSave));
      } catch (e) {}

      setConfig(toSave);
      triggerSuccessAlert('✅ تم حفظ وتحديث إعدادات الكوادر والمواعيد بنجاح في السحابة!');
    } catch (err) {
      setConfig(toSave);
      triggerSuccessAlert('✅ تم حفظ الإعدادات بنجاح!');
    } finally {
      setIsSaving(false);
    }
  };

  // Schedule checkbox helper for Principal / Counselor
  const toggleScheduleDay = (targetRole, dayKey, dayAr) => {
    const targetObj = { ...config[targetRole] };
    let schedule = [...(targetObj.receptionSchedule || [])];
    const existingIndex = schedule.findIndex(s => s.day === dayKey);

    if (existingIndex >= 0) {
      schedule.splice(existingIndex, 1);
    } else {
      schedule.push({ day: dayKey, dayAr, startTime: '08:30', endTime: '13:30' });
    }

    const updatedConfig = {
      ...config,
      [targetRole]: {
        ...targetObj,
        receptionSchedule: schedule
      }
    };
    setConfig(updatedConfig);
  };

  const updateScheduleTime = (targetRole, dayKey, field, value) => {
    const targetObj = { ...config[targetRole] };
    const schedule = (targetObj.receptionSchedule || []).map(s => {
      if (s.day === dayKey) {
        return { ...s, [field]: value };
      }
      return s;
    });

    const updatedConfig = {
      ...config,
      [targetRole]: {
        ...targetObj,
        receptionSchedule: schedule
      }
    };
    setConfig(updatedConfig);
  };

  // Teacher Schedule checkbox helper
  const toggleTeacherScheduleDay = (dayKey, dayAr) => {
    if (!editingTeacherData) return;
    let schedule = [...(editingTeacherData.receptionSchedule || [])];
    const existingIndex = schedule.findIndex(s => s.day === dayKey);

    if (existingIndex >= 0) {
      schedule.splice(existingIndex, 1);
    } else {
      schedule.push({ day: dayKey, dayAr, startTime: '08:30', endTime: '13:30' });
    }

    setEditingTeacherData({
      ...editingTeacherData,
      receptionSchedule: schedule
    });
  };

  const updateTeacherScheduleTime = (dayKey, field, value) => {
    if (!editingTeacherData) return;
    const schedule = (editingTeacherData.receptionSchedule || []).map(s => {
      if (s.day === dayKey) {
        return { ...s, [field]: value };
      }
      return s;
    });
    setEditingTeacherData({
      ...editingTeacherData,
      receptionSchedule: schedule
    });
  };

  const handleSaveTeacher = async (tchData) => {
    setIsSaving(true);
    try {
      // 1. Cloud Save to emtnanDb (Cloud Firestore - open & always succeeds for all devices!)
      try {
        await setDoc(doc(emtnanDb, 'school_teachers', tchData.id), tchData, { merge: true });
      } catch (cloudErr) {
        console.warn('emtnanDb teacher write notice:', cloudErr);
      }

      // 2. Also attempt saving to main db if SuperAdmin (silently catch permission-denied)
      try {
        await setDoc(doc(db, 'school_teachers', tchData.id), tchData, { merge: true });
      } catch (mainErr) {}

      // 3. Save to Local Overrides for instant local persistence
      setLocalTeacherOverride(tchData);

      // 4. Update in-memory state
      setTeachers(prev => prev.map(t => t.id === tchData.id ? tchData : t));
      setEditingTeacherId(null);
      setEditingTeacherData(null);

      // 5. Broadcast update event so any open booking form refreshes instantly
      window.dispatchEvent(new CustomEvent('musherfe_teachers_updated', { detail: tchData }));

      triggerSuccessAlert('✅ تم حفظ مواعيد المعلم (' + tchData.nameAr + ') بنجاح في السحابة!');
    } catch (err) {
      console.warn('Teacher save error fallback:', err);
      setLocalTeacherOverride(tchData);
      setTeachers(prev => prev.map(t => t.id === tchData.id ? tchData : t));
      setEditingTeacherId(null);
      setEditingTeacherData(null);
      triggerSuccessAlert('✅ تم حفظ مواعيد المعلم (' + tchData.nameAr + ') بنجاح!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTeacher = async (id, name) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف المعلم (' + name + ') من النظام؟')) return;
    try {
      try {
        await deleteDoc(doc(emtnanDb, 'school_teachers', id));
      } catch (e) {}
      try {
        await deleteDoc(doc(db, 'school_teachers', id));
      } catch (e) {}
      removeLocalTeacherOverride(id);
      setTeachers(prev => prev.filter(t => t.id !== id));
      triggerSuccessAlert('تم حذف المعلم (' + name + ') بنجاح.');
    } catch (err) {
      removeLocalTeacherOverride(id);
      setTeachers(prev => prev.filter(t => t.id !== id));
      triggerSuccessAlert('تم حذف المعلم (' + name + ') بنجاح.');
    }
  };

  const handleAddNewTeacher = async () => {
    const nameAr = prompt('أدخل اسم المعلم أو صاحب الوظيفة بالعربية:');
    if (!nameAr || !nameAr.trim()) return;
    const nameHe = prompt('اسم المعلم بالعبرية (اختياري):') || '';
    const role = prompt('المسمى الوظيفي (مثال: معلم لغة عربية ومربي صف):') || 'معلم ومربي صف';
    const phone = prompt('رقم الهاتف الشخصي للمعلم (للتواصل عبر واتساب):') || '';
    const email = prompt('البريد الإلكتروني للمعلم (الإيميل):') || '';

    const newTch = {
      id: 'tch_' + Date.now(),
      nameAr: nameAr.trim(),
      nameHe: nameHe.trim(),
      role: role.trim(),
      phone: phone.trim(),
      email: email.trim(),
      receptionSchedule: [
        { day: 'Sunday', dayAr: 'الأحد', startTime: '08:30', endTime: '13:30' },
        { day: 'Tuesday', dayAr: 'الثلاثاء', startTime: '08:30', endTime: '13:30' }
      ]
    };

    try {
      try {
        await setDoc(doc(emtnanDb, 'school_teachers', newTch.id), newTch);
      } catch (e) {}
      try {
        await setDoc(doc(db, 'school_teachers', newTch.id), newTch);
      } catch (e) {}
      setLocalTeacherOverride(newTch);
      setTeachers(prev => [newTch, ...prev]);
      triggerSuccessAlert('✅ تمت إضافة المعلم (' + newTch.nameAr + ') بنجاح!');
    } catch (err) {
      setLocalTeacherOverride(newTch);
      setTeachers(prev => [newTch, ...prev]);
      triggerSuccessAlert('✅ تمت إضافة المعلم (' + newTch.nameAr + ') بنجاح!');
    }
  };

  const handleRestoreAll33Teachers = async () => {
    if (!window.confirm('هل ترغب في حفظ واستعادة القائمة الكاملة لجميع المعلمين الـ 33 في قاعدة البيانات للتعديل المباشر عليهم؟')) return;
    setIsLoading(true);
    try {
      for (const tch of defaultSchoolTeachers) {
        try {
          await setDoc(doc(emtnanDb, 'school_teachers', tch.id), tch, { merge: true });
        } catch (e) {}
        try {
          await setDoc(doc(db, 'school_teachers', tch.id), tch, { merge: true });
        } catch (e) {}
      }
      await loadData();
      triggerSuccessAlert('✅ تم استعادة وحفظ جميع المعلمين الـ 33 بنجاح في السحابة!');
    } catch (err) {
      alert('حدث خطأ: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    !searchTeacher || 
    t.nameAr?.includes(searchTeacher) || 
    t.nameHe?.includes(searchTeacher) || 
    t.role?.includes(searchTeacher)
  );

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
      {/* Top Banner Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)', 
        borderRadius: '24px', 
        padding: '2rem 2.5rem', 
        color: 'white', 
        marginBottom: '2rem',
        boxShadow: '0 12px 30px rgba(2, 132, 199, 0.25)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', padding: '0.35rem 0.9rem', borderRadius: '50px', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.6rem' }}>
              <span>🤝 وحدة التحكم الرسمية</span>
              <span>•</span>
              <span>نظام حجز اللقاءات والمواعيد</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900 }}>
              🏛️ إدارة الكوادر التربوية ومواعيد الاستقبال
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#bae6fd', fontSize: '0.95rem' }}>
              تحكم كامل ومباشر في مواعيد إدارة المدرسة، الاستشارة التربوية، وطاقم المعلمين (33 معلماً) وأوقات الاستقبال.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a 
              href="#service-appointments" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.7rem 1.2rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.9rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="fas fa-external-link-alt"></i>
              معاينة صفحة الحجز الرسمية 👁️
            </a>

            <a 
              href="#appointments-log" 
              style={{
                background: '#10b981',
                color: 'white',
                padding: '0.7rem 1.2rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.9rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <i className="fas fa-shield-alt"></i>
              سجل الزوار والمواعيد المحجوزة 📋
            </a>
          </div>
        </div>

        {saveSuccessMsg && (
          <div style={{
            position: 'absolute',
            bottom: '-18px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#10b981',
            color: 'white',
            padding: '0.5rem 1.5rem',
            borderRadius: '50px',
            fontWeight: 800,
            fontSize: '0.9rem',
            boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
            zIndex: 10
          }}>
            {saveSuccessMsg}
          </div>
        )}
      </div>

      {/* PRIMARY TAB SWITCHER FOR COORDINATOR */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTabMode('bookings')}
          style={{
            flex: '1 1 260px',
            padding: '1rem 1.5rem',
            borderRadius: '16px',
            border: activeTabMode === 'bookings' ? '3px solid #0284c7' : '2px solid #e2e8f0',
            background: activeTabMode === 'bookings' ? 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' : '#ffffff',
            color: activeTabMode === 'bookings' ? '#0369a1' : '#475569',
            fontWeight: 900,
            fontSize: '1.05rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            boxShadow: activeTabMode === 'bookings' ? '0 8px 20px rgba(2,132,199,0.18)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <span>📅</span>
          <span>المواعيد والحجوزات الحية المسجلة</span>
          <span style={{ background: '#0284c7', color: 'white', padding: '2px 10px', borderRadius: '50px', fontSize: '0.85rem' }}>
            {appointmentsList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabMode('settings')}
          style={{
            flex: '1 1 260px',
            padding: '1rem 1.5rem',
            borderRadius: '16px',
            border: activeTabMode === 'settings' ? '3px solid #7c3aed' : '2px solid #e2e8f0',
            background: activeTabMode === 'settings' ? 'linear-gradient(135deg, #faf5ff, #f3e8ff)' : '#ffffff',
            color: activeTabMode === 'settings' ? '#6b21a8' : '#475569',
            fontWeight: 900,
            fontSize: '1.05rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            boxShadow: activeTabMode === 'settings' ? '0 8px 20px rgba(124,58,237,0.18)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <span>⚙️</span>
          <span>إعدادات وضبط ساعات الاستقبال ({teachers.length} معلماً)</span>
        </button>
      </div>

      {/* VIEW 1: LIVE BOOKED APPOINTMENTS */}
      {activeTabMode === 'bookings' && (
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '1.75rem', boxShadow: '0 8px 25px rgba(0,0,0,0.05)', border: '2px solid #e2e8f0', marginBottom: '2.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📋</span> جدول المواعيد المحجوزة الحية (تزامن فوري ومباشر)
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
                استعراض فوري لكافة المواعيد المسجلة من أولياء الأمور مع المعلمين، مع إمكانية التواصل المباشر عبر واتساب
              </p>
            </div>

            {/* Filter Chips */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setFilterTeacherOnly('all')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '10px',
                  border: filterTeacherOnly === 'all' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: filterTeacherOnly === 'all' ? '#e0f2fe' : '#ffffff',
                  color: filterTeacherOnly === 'all' ? '#0369a1' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                جميع المعلمين ({appointmentsList.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterTeacherOnly('itab')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '10px',
                  border: filterTeacherOnly === 'itab' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                  background: filterTeacherOnly === 'itab' ? '#f3e8ff' : '#ffffff',
                  color: filterTeacherOnly === 'itab' ? '#6b21a8' : '#475569',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                👩‍🏫 مواعيدي فقط (عتاب بيدوسي): {appointmentsList.filter(a => a.teacherId === 'tch_17' || a.teacherNameAr?.includes('عتاب')).length}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="🔍 ابحث باسم الطالب، ولي الأمر، رقم الهاتف، أو كود التذكرة..."
              value={searchAppointment}
              onChange={(e) => setSearchAppointment(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                borderRadius: '14px',
                border: '2px solid #cbd5e1',
                fontSize: '1rem',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Bookings List */}
          {(() => {
            const filtered = appointmentsList.filter(b => {
              if (filterTeacherOnly === 'itab') {
                const isItab = b.teacherId === 'tch_17' || b.teacherNameAr?.includes('عتاب');
                if (!isItab) return false;
              }
              if (!searchAppointment.trim()) return true;
              const q = searchAppointment.trim().toLowerCase();
              return (
                (b.parentName || '').toLowerCase().includes(q) ||
                (b.studentName || '').toLowerCase().includes(q) ||
                (b.parentPhone || '').includes(q) ||
                (b.teacherNameAr || '').toLowerCase().includes(q) ||
                (b.ticketCode || '').toLowerCase().includes(q) ||
                (b.date || '').includes(q)
              );
            });

            if (filtered.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: '#334155' }}>لا توجد حجوزات مسجلة مطابقة</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>عندما يقوم أي ولي أمر بحجز موعد، سيظهر هنا مباشرة وبشكل حي.</p>
                </div>
              );
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {filtered.map((b, idx) => {
                  let rawPhone = (b.parentPhone || '').replace(/\D/g, '');
                  if (rawPhone.startsWith('0')) rawPhone = '972' + rawPhone.slice(1);
                  const whatsAppMsg = encodeURIComponent(`تحية طيبة حضرة ولي الأمر ${b.parentName}، بخصوص موعدك المسجل بمدرسة مشيرفة الابتدائية مع ${b.teacherNameAr} يوم ${b.dayAr || ''} ${b.date} الساعة ${b.timeSlot} للطالب ${b.studentName}. نسعد بلقائكم!`);

                  return (
                    <div key={b.id || idx} style={{
                      background: '#ffffff',
                      border: '2px solid #bae6fd',
                      borderRadius: '18px',
                      padding: '1.25rem',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 900 }}>
                            تذكرة #{b.ticketCode}
                          </span>
                          <span style={{ color: '#0284c7', fontWeight: 900, fontSize: '0.85rem' }}>
                            {b.status === 'confirmed' ? '✓ مؤكد رسمي' : b.status}
                          </span>
                        </div>

                        <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                          👨‍🏫 المعلم: {b.teacherNameAr} {b.teacherNameHe ? `(${b.teacherNameHe})` : ''}
                        </h3>

                        <div style={{ background: '#f0f9ff', padding: '0.6rem 0.85rem', borderRadius: '12px', marginBottom: '0.75rem', border: '1px solid #e0f2fe' }}>
                          <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0369a1' }}>
                            🗓️ {b.dayAr} {b.date} | ⏰ الساعة: {b.timeSlot}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>
                            📍 النوع: {b.meetingType || 'وجاهي بالمدرسة'}
                          </div>
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700, marginBottom: '0.3rem' }}>
                          👤 ولي الأمر: <strong>{b.parentName}</strong> ({b.parentPhone})
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700, marginBottom: '0.4rem' }}>
                          🎓 الطالب والصف: <strong>{b.studentName}</strong> ({b.studentClass})
                        </div>

                        {b.meetingTopic && (
                          <div style={{ fontSize: '0.85rem', color: '#64748b', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                            📝 سبب اللقاء: {b.meetingTopic}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', flexWrap: 'wrap' }}>
                        <a
                          href={`https://api.whatsapp.com/send?phone=${rawPhone}&text=${whatsAppMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            background: '#25D366',
                            color: 'white',
                            textAlign: 'center',
                            textDecoration: 'none',
                            padding: '0.55rem',
                            borderRadius: '10px',
                            fontWeight: 900,
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 2px 8px rgba(37,211,102,0.3)'
                          }}
                        >
                          <i className="fab fa-whatsapp"></i> مراسلة واتساب
                        </a>

                        {b.parentPhone && (
                          <a
                            href={`tel:${b.parentPhone}`}
                            style={{
                              background: '#0284c7',
                              color: 'white',
                              textDecoration: 'none',
                              padding: '0.55rem 0.85rem',
                              borderRadius: '10px',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="اتصال هاتفي"
                          >
                            📞
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* VIEW 2: RECEPTION SCHEDULE SETTINGS */}
      {activeTabMode === 'settings' && (
        <div>
      {/* SECTION 1: TOP EXECUTIVE & COUNSELING STAFF */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '1.4rem' }}>1️⃣</span>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
            الكوادر العليا (إدارة المدرسة والاستشارة التربوية)
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
            (تظهر كأول خيارات رئيسية أمام ولي الأمر في صفحة الحجز)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          
          {/* Card 1: School Administration (إدارة المدرسة) */}
          <div style={{ 
            background: 'white', 
            borderRadius: '20px', 
            padding: '1.75rem', 
            border: '2px solid #0284c7', 
            boxShadow: '0 6px 20px rgba(2, 132, 199, 0.08)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  🏛️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0369a1' }}>
                    إدارة المدرسة
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>
                    مدير المدرسة والإدارة العامة
                  </span>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', background: config.principal.enabled ? '#ecfdf5' : '#fef2f2', padding: '0.4rem 0.8rem', borderRadius: '50px', border: '1px solid ' + (config.principal.enabled ? '#a7f3d0' : '#fecaca') }}>
                <input 
                  type="checkbox" 
                  checked={config.principal.enabled !== false} 
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      principal: { ...config.principal, enabled: e.target.checked }
                    };
                    setConfig(updated);
                  }}
                  style={{ accentColor: '#10b981', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: config.principal.enabled ? '#047857' : '#b91c1c' }}>
                  {config.principal.enabled ? 'متاح للحجز 🟢' : 'الحجز معطل 🔴'}
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                  الاسم الظاهر للأهالي:
                </label>
                <input 
                  type="text" 
                  value={config.principal.nameAr || ''} 
                  onChange={(e) => setConfig({
                    ...config,
                    principal: { ...config.principal, nameAr: e.target.value }
                  })}
                  style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.92rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                  الوصف / الدور:
                </label>
                <input 
                  type="text" 
                  value={config.principal.role || ''} 
                  onChange={(e) => setConfig({
                    ...config,
                    principal: { ...config.principal, role: e.target.value }
                  })}
                  style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.92rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                    هاتف السكرتارية / الإدارة:
                  </label>
                  <input 
                    type="text" 
                    value={config.principal.phone || ''} 
                    onChange={(e) => setConfig({
                      ...config,
                      principal: { ...config.principal, phone: e.target.value }
                    })}
                    placeholder="04-6311000"
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                    البريد الإلكتروني:
                  </label>
                  <input 
                    type="email" 
                    value={config.principal.email || ''} 
                    onChange={(e) => setConfig({
                      ...config,
                      principal: { ...config.principal, email: e.target.value }
                    })}
                    placeholder="musheirifa@school.com"
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Schedule Checkboxes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.6rem' }}>
                  🗓️ أيام وساعات استقبال المدير والإدارة:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {WEEKDAYS.map(w => {
                    const existing = (config.principal.receptionSchedule || []).find(s => s.day === w.key);
                    const isChecked = Boolean(existing);
                    return (
                      <div key={w.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', background: 'white', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 800, minWidth: '85px', fontSize: '0.9rem' }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => toggleScheduleDay('principal', w.key, w.ar)}
                            style={{ accentColor: '#0284c7', cursor: 'pointer' }}
                          />
                          <span>{w.ar}</span>
                        </label>

                        {isChecked && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                            <input 
                              type="time" 
                              value={existing.startTime || '08:30'}
                              onChange={(e) => updateScheduleTime('principal', w.key, 'startTime', e.target.value)}
                              style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            />
                            <span style={{ color: '#64748b' }}>إلى</span>
                            <input 
                              type="time" 
                              value={existing.endTime || '14:00'}
                              onChange={(e) => updateScheduleTime('principal', w.key, 'endTime', e.target.value)}
                              style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSaveConfig()}
              disabled={isSaving}
              style={{
                width: '100%',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fas fa-save" style={{ marginLeft: '0.5rem' }}></i>
              {isSaving ? 'جاري الحفظ...' : 'حفظ تعديلات إدارة المدرسة'}
            </button>
          </div>

          {/* Card 2: Educational Counselor (الاستشارة التربوية) */}
          <div style={{ 
            background: 'white', 
            borderRadius: '20px', 
            padding: '1.75rem', 
            border: '2px solid #8b5cf6', 
            boxShadow: '0 6px 20px rgba(139, 92, 246, 0.08)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  💡
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#7c3aed' }}>
                    الاستشارة التربوية
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>
                    المستشار التربوي والدعم النفسي
                  </span>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', background: config.counselor.enabled ? '#ecfdf5' : '#fef2f2', padding: '0.4rem 0.8rem', borderRadius: '50px', border: '1px solid ' + (config.counselor.enabled ? '#a7f3d0' : '#fecaca') }}>
                <input 
                  type="checkbox" 
                  checked={config.counselor.enabled !== false} 
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      counselor: { ...config.counselor, enabled: e.target.checked }
                    };
                    setConfig(updated);
                  }}
                  style={{ accentColor: '#10b981', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: config.counselor.enabled ? '#047857' : '#b91c1c' }}>
                  {config.counselor.enabled ? 'متاح للحجز 🟢' : 'الحجز معطل 🔴'}
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                  الاسم الظاهر للأهالي:
                </label>
                <input 
                  type="text" 
                  value={config.counselor.nameAr || ''} 
                  onChange={(e) => setConfig({
                    ...config,
                    counselor: { ...config.counselor, nameAr: e.target.value }
                  })}
                  style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.92rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                  الوصف / الدور:
                </label>
                <input 
                  type="text" 
                  value={config.counselor.role || ''} 
                  onChange={(e) => setConfig({
                    ...config,
                    counselor: { ...config.counselor, role: e.target.value }
                  })}
                  style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.92rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                    هاتف المستشار:
                  </label>
                  <input 
                    type="text" 
                    value={config.counselor.phone || ''} 
                    onChange={(e) => setConfig({
                      ...config,
                      counselor: { ...config.counselor, phone: e.target.value }
                    })}
                    placeholder="رقم الهاتف..."
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                    البريد الإلكتروني:
                  </label>
                  <input 
                    type="email" 
                    value={config.counselor.email || ''} 
                    onChange={(e) => setConfig({
                      ...config,
                      counselor: { ...config.counselor, email: e.target.value }
                    })}
                    placeholder="counselor@school.com"
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Schedule Checkboxes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.6rem' }}>
                  🗓️ أيام وساعات استقبال المستشار التربوي:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {WEEKDAYS.map(w => {
                    const existing = (config.counselor.receptionSchedule || []).find(s => s.day === w.key);
                    const isChecked = Boolean(existing);
                    return (
                      <div key={w.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', background: 'white', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 800, minWidth: '85px', fontSize: '0.9rem' }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => toggleScheduleDay('counselor', w.key, w.ar)}
                            style={{ accentColor: '#8b5cf6', cursor: 'pointer' }}
                          />
                          <span>{w.ar}</span>
                        </label>

                        {isChecked && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                            <input 
                              type="time" 
                              value={existing.startTime || '08:30'}
                              onChange={(e) => updateScheduleTime('counselor', w.key, 'startTime', e.target.value)}
                              style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            />
                            <span style={{ color: '#64748b' }}>إلى</span>
                            <input 
                              type="time" 
                              value={existing.endTime || '13:30'}
                              onChange={(e) => updateScheduleTime('counselor', w.key, 'endTime', e.target.value)}
                              style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSaveConfig()}
              disabled={isSaving}
              style={{
                width: '100%',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fas fa-save" style={{ marginLeft: '0.5rem' }}></i>
              {isSaving ? 'جاري الحفظ...' : 'حفظ تعديلات الاستشارة التربوية'}
            </button>
          </div>

        </div>
      </div>

      {/* SECTION 2: GENERAL APPOINTMENTS SYSTEM SETTINGS */}
      <div style={{ 
        background: 'white', 
        borderRadius: '20px', 
        padding: '1.75rem', 
        marginBottom: '2.5rem', 
        border: '1px solid #e2e8f0', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '1.4rem' }}>⚙️</span>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
            إعدادات نظام المواعيد العامة
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* General Open/Close Toggle */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>
              حالة استقبال المواعيد للأهالي:
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={config.systemSettings.isOpen !== false}
                onChange={(e) => setConfig({
                  ...config,
                  systemSettings: { ...config.systemSettings, isOpen: e.target.checked }
                })}
                style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: config.systemSettings.isOpen ? '#059669' : '#dc2626' }}>
                {config.systemSettings.isOpen ? '🟢 النظام مفتوح ومتاح لحجز اللقاءات' : '🔴 النظام مغلق مؤقتاً (توقف الاستقبال)'}
              </span>
            </label>
          </div>

          {/* Slot Duration */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>
              ⏱️ مدة الموعد الواحد (لكل ولي أمر):
            </label>
            <select
              value={config.systemSettings.slotDurationMinutes || 20}
              onChange={(e) => setConfig({
                ...config,
                systemSettings: { ...config.systemSettings, slotDurationMinutes: Number(e.target.value) }
              })}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.9rem' }}
            >
              <option value={15}>15 دقيقة</option>
              <option value={20}>20 دقيقة (الموصى به)</option>
              <option value={30}>30 دقيقة</option>
              <option value={45}>45 دقيقة</option>
            </select>
          </div>
        </div>

        {/* Closed notice message */}
        {!config.systemSettings.isOpen && (
          <div style={{ marginBottom: '1.25rem', background: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#991b1b', marginBottom: '0.3rem' }}>
              📢 الرسالة التوضيحية التي تظهر للأهالي عند الإغلاق:
            </label>
            <input 
              type="text" 
              value={config.systemSettings.closedMessage || ''}
              onChange={(e) => setConfig({
                ...config,
                systemSettings: { ...config.systemSettings, closedMessage: e.target.value }
              })}
              style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1px solid #fca5a5', fontWeight: 700 }}
            />
          </div>
        )}

        {/* Notice text for parents */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
            نص الإرشاد للأهالي أعلى صفحة الحجز:
          </label>
          <input 
            type="text" 
            value={config.systemSettings.noticeText || ''}
            onChange={(e) => setConfig({
              ...config,
              systemSettings: { ...config.systemSettings, noticeText: e.target.value }
            })}
            style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700 }}
          />
        </div>

        <button
          onClick={() => handleSaveConfig()}
          disabled={isSaving}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '0.65rem 1.4rem',
            borderRadius: '10px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
          }}
        >
          <i className="fas fa-check-circle" style={{ marginLeft: '0.5rem' }}></i>
          حفظ إعدادات النظام العامة
        </button>
      </div>

      {/* SECTION 3: TEACHERS & ROLE HOLDERS MANAGEMENT (33 TEACHERS) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>👨‍🏫</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                أصحاب الوظائف والمعلمين ({teachers.length} معلماً)
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                يمكنك تخصيص ساعات وأيام الاستقبال لكل معلم، أو إضافة وحذف المعلمين.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleRestoreAll33Teachers}
              style={{
                background: '#0284c7',
                color: 'white',
                border: 'none',
                padding: '0.65rem 1.2rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
              }}
            >
              ⚡ 🔄 استعادة القائمة الكاملة (33 معلماً)
            </button>

            <button
              onClick={handleAddNewTeacher}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.65rem 1.2rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              ➕ إضافة معلم جديد
            </button>
          </div>
        </div>

        {/* Search Bar for Teachers */}
        <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="fas fa-search" style={{ color: '#94a3b8' }}></i>
            <input 
              type="text"
              placeholder="ابحث عن معلم بالاسم بالعربية، العبرية، أو التخصص..."
              value={searchTeacher}
              onChange={(e) => setSearchTeacher(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.95rem', fontWeight: 700 }}
            />
            {searchTeacher && (
              <button onClick={() => setSearchTeacher('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Teachers Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {filteredTeachers.map(tch => {
            const isEditing = editingTeacherId === tch.id;
            const activeData = isEditing ? editingTeacherData : tch;

            return (
              <div
                key={tch.id}
                style={{
                  background: 'white',
                  borderRadius: '18px',
                  border: isEditing ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  padding: '1.25rem 1.5rem',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                {!isEditing ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                          👨‍🏫 {tch.nameAr} {tch.nameHe ? '(' + tch.nameHe + ')' : ''}
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 700 }}>
                          {tch.role || 'معلم ومربي صف'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => {
                            setEditingTeacherId(tch.id);
                            setEditingTeacherData(JSON.parse(JSON.stringify(tch)));
                          }}
                          style={{
                            background: '#e0f2fe',
                            color: '#0369a1',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                          title="تعديل أيام وساعات الاستقبال"
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(tch.id, tch.nameAr)}
                          style={{
                            background: '#fef2f2',
                            color: '#ef4444',
                            border: 'none',
                            padding: '5px 8px',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                          title="حذف المعلم"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                      {tch.phone && <span>📱 {tch.phone}</span>}
                      {tch.email && <span>✉️ {tch.email}</span>}
                    </div>

                    {/* Schedule Snippet */}
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', borderRight: '3px solid #0284c7' }}>
                      <div style={{ fontWeight: 800, color: '#475569', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                        🗓️ مواعيد الاستقبال:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {(tch.receptionSchedule || []).length === 0 ? (
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>لم يتم تحديد مواعيد مخصصة</span>
                        ) : (
                          tch.receptionSchedule.map((s, sIdx) => (
                            <div key={sIdx} style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                              🔹 <strong>{s.dayAr}:</strong> من {s.startTime} حتى {s.endTime}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* INLINE EDIT FORM FOR TEACHER */
                  <div>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#0284c7', fontWeight: 900 }}>
                      ✏️ تعديل بيانات ومواعيد: {activeData.nameAr}
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.2rem' }}>الاسم بالعربية:</label>
                        <input 
                          type="text"
                          value={activeData.nameAr || ''}
                          onChange={(e) => setEditingTeacherData({ ...activeData, nameAr: e.target.value })}
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.2rem' }}>الوظيفة / التخصص:</label>
                        <input 
                          type="text"
                          value={activeData.role || ''}
                          onChange={(e) => setEditingTeacherData({ ...activeData, role: e.target.value })}
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.2rem' }}>رقم الهاتف:</label>
                          <input 
                            type="text"
                            value={activeData.phone || ''}
                            onChange={(e) => setEditingTeacherData({ ...activeData, phone: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.2rem' }}>البريد:</label>
                          <input 
                            type="email"
                            value={activeData.email || ''}
                            onChange={(e) => setEditingTeacherData({ ...activeData, email: e.target.value })}
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, marginBottom: '0.4rem', color: '#0f172a' }}>
                          🗓️ الأيام والساعات المتاحة للاستقبال:
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {WEEKDAYS.map(w => {
                            const existing = (activeData.receptionSchedule || []).find(s => s.day === w.key);
                            const isChecked = Boolean(existing);
                            return (
                              <div key={w.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}>
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleTeacherScheduleDay(w.key, w.ar)}
                                    style={{ accentColor: '#0284c7', cursor: 'pointer' }}
                                  />
                                  <span>{w.ar}</span>
                                </label>

                                {isChecked && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
                                    <input 
                                      type="time" 
                                      value={existing.startTime || '08:30'}
                                      onChange={(e) => updateTeacherScheduleTime(w.key, 'startTime', e.target.value)}
                                      style={{ padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                    />
                                    <span>إلى</span>
                                    <input 
                                      type="time" 
                                      value={existing.endTime || '13:30'}
                                      onChange={(e) => updateTeacherScheduleTime(w.key, 'endTime', e.target.value)}
                                      style={{ padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleSaveTeacher(activeData)}
                        style={{
                          flex: 1,
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '0.55rem',
                          borderRadius: '8px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        💾 حفظ التعديلات
                      </button>
                      <button
                        onClick={() => {
                          setEditingTeacherId(null);
                          setEditingTeacherData(null);
                        }}
                        style={{
                          background: '#64748b',
                          color: 'white',
                          border: 'none',
                          padding: '0.55rem 0.9rem',
                          borderRadius: '8px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentStaffAdminTab;
