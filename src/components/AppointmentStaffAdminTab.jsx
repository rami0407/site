import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
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

  // Load appointment config and teachers
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Load appointment settings
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

      // 2. Load teachers
      const tSnap = await getDocs(collection(db, 'school_teachers'));
      const dbList = [];
      if (!tSnap.empty) {
        tSnap.forEach(d => dbList.push({ id: d.id, ...d.data() }));
      }
      const dbMap = new Map(dbList.map(t => [t.id, t]));
      const mergedList = [...dbList];
      for (const defTch of defaultSchoolTeachers) {
        if (!dbMap.has(defTch.id)) {
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

  const triggerSuccessAlert = (msg) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Save config (Principal, Counselor, System) to Firestore
  const handleSaveConfig = async (newConfig = null) => {
    setIsSaving(true);
    const toSave = newConfig || config;
    try {
      await setDoc(doc(db, 'schoolGuide', 'appointment_settings'), toSave, { merge: true });
      setConfig(toSave);
      triggerSuccessAlert('✅ تم حفظ وتحديث إعدادات الكوادر والمواعيد بنجاح!');
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ: ' + err.message);
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
    try {
      await setDoc(doc(db, 'school_teachers', tchData.id), tchData, { merge: true });
      setTeachers(prev => prev.map(t => t.id === tchData.id ? tchData : t));
      setEditingTeacherId(null);
      setEditingTeacherData(null);
      triggerSuccessAlert('✅ تم حفظ مواعيد المعلم (' + tchData.nameAr + ') بنجاح!');
    } catch (err) {
      alert('خطأ أثناء حفظ المعلم: ' + err.message);
    }
  };

  const handleDeleteTeacher = async (id, name) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف المعلم (' + name + ') من النظام؟')) return;
    try {
      await deleteDoc(doc(db, 'school_teachers', id));
      setTeachers(prev => prev.filter(t => t.id !== id));
      triggerSuccessAlert('تم حذف المعلم (' + name + ') بنجاح.');
    } catch (err) {
      alert('خطأ أثناء الحذف: ' + err.message);
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
      await setDoc(doc(db, 'school_teachers', newTch.id), newTch);
      setTeachers(prev => [newTch, ...prev]);
      triggerSuccessAlert('✅ تمت إضافة المعلم (' + newTch.nameAr + ') بنجاح!');
    } catch (err) {
      alert('خطأ أثناء إضافة المعلم: ' + err.message);
    }
  };

  const handleRestoreAll33Teachers = async () => {
    if (!window.confirm('هل ترغب في حفظ واستعادة القائمة الكاملة لجميع المعلمين الـ 33 في قاعدة البيانات للتعديل المباشر عليهم؟')) return;
    setIsLoading(true);
    try {
      for (const tch of defaultSchoolTeachers) {
        await setDoc(doc(db, 'school_teachers', tch.id), tch, { merge: true });
      }
      await loadData();
      triggerSuccessAlert('✅ تم استعادة وحفظ جميع المعلمين الـ 33 بنجاح!');
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
  );
};

export default AppointmentStaffAdminTab;
