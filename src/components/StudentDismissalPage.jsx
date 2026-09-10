import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, setDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { defaultSchoolTeachers } from '../data/schoolTeachersData';
import './StudentDismissalPage.css';

const CLASSROOM_OPTIONS = [
  'الصف الأول (أ)', 'الصف الأول (ب)', 'الصف الأول (ج)',
  'الصف الثاني (أ)', 'الصف الثاني (ب)', 'الصف الثاني (ج)',
  'الصف الثالث (أ)', 'الصف الثالث (ب)', 'الصف الثالث (ج)',
  'الصف الرابع (أ)', 'الصف الرابع (ب)', 'الصف الرابع (ج)',
  'الصف الخامس (أ)', 'الصف الخامس (ب)', 'الصف الخامس (ج)',
  'الصف السادس (أ)', 'الصف السادس (ب)', 'الصف السادس (ج)'
];

const REASONS_LIST = [
  { id: 'illness', label: 'توعك صحي أو مرض مفاجئ 🤒' },
  { id: 'medical_appt', label: 'موعد طبي بعيادة / مستشفى 🩺' },
  { id: 'family', label: 'ظرف عائلي طارئ 👨‍👩‍👧' },
  { id: 'external_activity', label: 'نشاط أو تمثيل مدرسي خارجي 🏆' },
  { id: 'other', label: 'أسباب ومراجعات أخرى 📋' }
];

const COMPANION_TYPES = [
  'الأب 👨',
  'الأم 👩',
  'الأخ / الأخت 🧑',
  'العم / الخال 🧔',
  'سائق خاص / سفريات 🚐',
  'بمفرده (بموافقة هاتفية موثقة) 🚶'
];

const TEACHER_DISMISSAL_PIN = '318212';

const StudentDismissalPage = () => {
  // Security Authentication (Teacher PIN Code: 318212)
  const [isAuthorized, setIsAuthorized] = useState(() => {
    try {
      return localStorage.getItem('musherfe_teacher_auth_pin') === TEACHER_DISMISSAL_PIN;
    } catch (e) {
      return false;
    }
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput.trim() === TEACHER_DISMISSAL_PIN) {
      setPinError('');
      setIsAuthorized(true);
      if (rememberDevice) {
        try {
          localStorage.setItem('musherfe_teacher_auth_pin', TEACHER_DISMISSAL_PIN);
        } catch (err) {}
      }
    } else {
      setPinError('❌ الرمز السري غير صحيح! هذه البوابة مخصصة للمربين المعتمدين فقط.');
      setPinInput('');
    }
  };

  const handleLogoutTeacher = () => {
    if (window.confirm('هل تريد قفل الشاشة وتسجيل خروج المربي؟')) {
      try {
        localStorage.removeItem('musherfe_teacher_auth_pin');
      } catch (err) {}
      setIsAuthorized(false);
      setPinInput('');
    }
  };

  // Form State
  const [studentName, setStudentName] = useState('');
  const [classroom, setClassroom] = useState('الصف الأول (أ)');
  const [teacherName, setTeacherName] = useState('رامي ارفاعية');
  const [reason, setReason] = useState('توعك صحي أو مرض مفاجئ 🤒');
  const [reasonDetails, setReasonDetails] = useState('');
  const [companionType, setCompanionType] = useState('الأب 👨');
  const [companionName, setCompanionName] = useState('');
  
  // Date & Time
  const getTodayLocalString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [departureDate, setDepartureDate] = useState(getTodayLocalString);
  const [departureTime, setDepartureTime] = useState(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });

  // Teachers List for selection
  const [teachersList, setTeachersList] = useState(defaultSchoolTeachers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedPass, setCompletedPass] = useState(null);

  // Load teachers from Firestore
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const snap = await getDocs(collection(db, 'school_teachers'));
        if (!snap.empty) {
          const list = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() }));
          setTeachersList(list);
        }
      } catch (err) {
        console.warn('Teachers fetch fallback:', err);
      }
    };
    fetchTeachers();
  }, []);

  // Submit Dismissal Pass
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) {
      alert('يرجى إدخال الرمز السري للمربي أولاً.');
      return;
    }
    if (!studentName.trim()) {
      alert('يرجى إدخال اسم الطالب كاملاً.');
      return;
    }

    setIsSubmitting(true);

    const passCode = 'DIS-' + Math.floor(1000 + Math.random() * 9000);
    const gradeLevel = classroom.split(' ')[1] || 'غير محدد'; // e.g. "الأول", "الرابع"
    const nameParts = studentName.trim().split(/\s+/);
    const autoFamilyName = nameParts.length >= 2 ? nameParts[nameParts.length - 1] : 'غير محدد';
    const finalDate = departureDate || getTodayLocalString();
    const finalTime = departureTime || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    const dismissalData = {
      passCode,
      studentName: studentName.trim(),
      familyName: autoFamilyName,
      gender: 'unspecified',
      gradeLevel,
      classroom,
      studentClass: classroom,
      teacherName: teacherName.trim(),
      teacherNameAr: teacherName.trim(),
      reason,
      reasonDetails: reasonDetails.trim(),
      companionType,
      companionName: companionName.trim() || companionType,
      companionPhone: '',
      departureDate: finalDate,
      date: finalDate,
      departureTime: finalTime,
      dismissalTime: finalTime,
      timeSlot: finalTime,
      status: 'waiting',
      gateStatus: 'pending',
      entryStatus: 'waiting',
      actualExitTime: null,
      gateExitTime: null,
      isDismissal: true,
      type: 'student_dismissal',
      meetingType: 'تسريح طالب',
      parentName: (companionName.trim() || companionType || studentName.trim()).slice(0, 100),
      createdAt: new Date().toISOString()
    };

    try {
      let docId = 'dis_' + Date.now();
      
      // 1. Primary storage: teacher_appointments (guaranteed active Firestore permissions)
      try {
        const docRef = await addDoc(collection(db, 'teacher_appointments'), dismissalData);
        docId = docRef.id;
      } catch (appErr) {
        console.warn('teacher_appointments write note:', appErr);
      }

      // 2. Also save to student_dismissals collection
      try {
        await setDoc(doc(db, 'student_dismissals', docId), dismissalData);
      } catch (err) {
        console.warn('student_dismissals addDoc note:', err);
      }

      // 3. Guaranteed open channel mirror on schoolGuide so Guard & Admin see it immediately
      try {
        await setDoc(doc(db, 'schoolGuide', 'latest_dismissal'), {
          ...dismissalData,
          id: docId
        });
      } catch (mirrorErr) {
        console.warn('schoolGuide mirror note:', mirrorErr);
      }

      setCompletedPass({ ...dismissalData, id: docId });
    } catch (error) {
      alert('حدث خطأ أثناء حفظ إذن التسريح: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCompletedPass(null);
    setStudentName('');
    setReasonDetails('');
    setCompanionName('');
    const now = new Date();
    setDepartureTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  };

  const handleShareWhatsApp = () => {
    if (!completedPass) return;
    const msg = `🏫 *مدرسة مشيرفة الابتدائية - إذن تسريح وخروج رسمي*\n\n` +
      `👤 *اسم الطالب:* ${completedPass.studentName}\n` +
      `🎒 *الصف:* ${completedPass.classroom}\n` +
      `⏰ *ساعة الخروج:* ${completedPass.departureTime}\n` +
      `🚗 *المرافق المستلم:* ${completedPass.companionName} (${completedPass.companionType})\n` +
      `👨‍🏫 *المربي المصرح:* ${completedPass.teacherName}\n` +
      `🔢 *رمز التصريح للبوابة:* ${completedPass.passCode}\n\n` +
      `يرجى إبراز هذا الرمز لحارس المدرسة عند البوابة للتأكيد والمغادرة بسلامة الله.`;

    const encoded = encodeURIComponent(msg);
    const phone = completedPass.companionPhone?.replace(/\D/g, '');
    const url = phone ? `https://wa.me/972${phone.startsWith('0') ? phone.slice(1) : phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Security Lock Screen (Rendered if not authorized with Teacher PIN: 318212)
  if (!isAuthorized) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6.5rem 1rem 3rem',
        fontFamily: 'Tajawal, sans-serif',
        direction: 'rtl'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '28px',
          padding: '2.5rem 2rem',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
          color: 'white'
        }}>
          {/* Educator Emblem */}
          <div style={{
            width: '74px',
            height: '74px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            margin: '0 auto 1.25rem',
            boxShadow: '0 8px 25px rgba(2, 132, 199, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            👨‍🏫
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.4rem', color: '#f8fafc' }}>
            منظومة تسريح الطلاب (خاص بالمربين)
          </h2>
          <div style={{ fontSize: '0.88rem', color: '#38bdf8', fontWeight: 800, marginBottom: '1.5rem', display: 'inline-block', background: 'rgba(56, 189, 248, 0.12)', padding: '0.3rem 0.9rem', borderRadius: '50px' }}>
            🔒 اعتماد وتوثيق الخروج المدرسي
          </div>

          <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 1.75rem 0', fontWeight: 500 }}>
            هذه البوابة مخصصة للمربين والمعلمين المعتمدين في المدرسة لإصدار أذونات الخروج الرسمية. يرجى إدخال الرمز السري للمربي للمتابعة.
          </p>

          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="أدخل رمز المربي (PIN)..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '1rem 3rem 1rem 1rem',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: pinError ? '2px solid #ef4444' : '2px solid #334155',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: '1.3rem',
                  textAlign: 'center',
                  letterSpacing: '5px',
                  fontWeight: 800,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title={showPin ? 'إخفاء الرمز' : 'إظهار الرمز'}
              >
                <i className={`fas ${showPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>

            {pinError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                padding: '0.75rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                textAlign: 'center'
              }}>
                {pinError}
              </div>
            )}

            {/* Remember Device Checkbox */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              justifyContent: 'center',
              fontSize: '0.86rem',
              color: '#cbd5e1',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '0.25rem 0'
            }}>
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#0284c7' }}
              />
              <span>تذكر هذا الجهاز دائماً (هاتف المربي الخاص)</span>
            </label>

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '1rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                marginTop: '0.4rem'
              }}
            >
              <span>دخول صفحة التسريح</span>
              <i className="fas fa-arrow-left"></i>
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <a
              href="#/"
              style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <i className="fas fa-home"></i> العودة للصفحة الرئيسية للمدرسة
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dismissal-page-container">
      <div className="dismissal-content-wrapper">
        {/* Hero Card */}
        <div className="dismissal-hero-card">
          <div className="dismissal-hero-badge">
            <span>🏫 الأمان والسلامة المدرسية</span>
            <span>•</span>
            <span>إذن الخروج المعتمد</span>
          </div>
          <h1 className="dismissal-hero-title">
            🏃‍♂️ نظام تسريح الطلاب وإذن الخروج
          </h1>
          <p className="dismissal-hero-desc">
            خدمة إلكترونية فورية مخصصة للمربين لتوثيق تسريح الطالب، وإشعار حارس المدرسة لحظياً عند البوابة ببيانات الطالب والمرافق لضمان خروج آمن وموثق.
          </p>

          <div className="dismissal-hero-actions">
            <a href="#/guard" className="dismissal-hero-btn">
              <i className="fas fa-shield-alt"></i>
              شاشة الحارس وبوابة المدرسة 🚪
            </a>
            <a href="#admin" className="dismissal-hero-btn">
              <i className="fas fa-chart-pie"></i>
              لوحة التحكم وإحصائيات التسريح 📊
            </a>
            <button
              type="button"
              onClick={handleLogoutTeacher}
              className="dismissal-hero-btn"
              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.35)', cursor: 'pointer' }}
              title="قفل الشاشة وتسجيل خروج المربي"
            >
              <i className="fas fa-lock"></i>
              قفل الشاشة 🔒
            </button>
          </div>
        </div>

        {!completedPass ? (
          /* Educator Dismissal Form */
          <form className="dismissal-form-card" onSubmit={handleSubmit}>
            {/* Step 1: Student Details */}
            <div className="dismissal-section-header">
              <div className="dismissal-section-num">1</div>
              <h2 className="dismissal-section-title">بيانات الطالب المراد تسريحه</h2>
            </div>

            <div className="dismissal-grid-2">
              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-user-graduate" style={{ color: '#0284c7' }}></i>
                  اسم الطالب الكامل: *
                </label>
                <input 
                  type="text" 
                  className="dismissal-field-input" 
                  placeholder="مثال: يوسف رامي ارفاعية" 
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
              </div>

              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-chalkboard" style={{ color: '#0284c7' }}></i>
                  الصف والشعبة: *
                </label>
                <select 
                  className="dismissal-field-input"
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  required
                >
                  {CLASSROOM_OPTIONS.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Educator & Reason */}
            <div className="dismissal-section-header" style={{ marginTop: '2rem' }}>
              <div className="dismissal-section-num">2</div>
              <h2 className="dismissal-section-title">المربي المصرح بالخروج والسبب</h2>
            </div>

            <div className="dismissal-grid-2">
              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-chalkboard-teacher" style={{ color: '#0284c7' }}></i>
                  المربي / المعلم المصرح بالخروج: *
                </label>
                <select 
                  className="dismissal-field-input"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  required
                >
                  {teachersList.map(tch => (
                    <option key={tch.id} value={tch.nameAr}>
                      {tch.nameAr} ({tch.role || 'معلم ومربي'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-stethoscope" style={{ color: '#0284c7' }}></i>
                  سبب الخروج: *
                </label>
                <select 
                  className="dismissal-field-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                >
                  {REASONS_LIST.map(r => (
                    <option key={r.id} value={r.label}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="dismissal-field-group" style={{ marginBottom: '1.25rem' }}>
              <label className="dismissal-field-label">
                <i className="fas fa-notes-medical" style={{ color: '#0284c7' }}></i>
                تفاصيل إضافية عن سبب التسريح (اختياري):
              </label>
              <input 
                type="text" 
                className="dismissal-field-input"
                placeholder="مثال: يعاني من ارتفاع حرارة، تم الاتصال بوالدته للحضور فوراً..."
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
              />
            </div>

            {/* Step 3: Companion & Time */}
            <div className="dismissal-section-header" style={{ marginTop: '2rem' }}>
              <div className="dismissal-section-num">3</div>
              <h2 className="dismissal-section-title">المرافق المستلم ووقت الخروج</h2>
            </div>

            <div className="dismissal-grid-2">
              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-user-friends" style={{ color: '#0284c7' }}></i>
                  صفة المرافق المستلم: *
                </label>
                <select 
                  className="dismissal-field-input" 
                  value={companionType}
                  onChange={(e) => setCompanionType(e.target.value)}
                  required
                >
                  {COMPANION_TYPES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-id-card" style={{ color: '#0284c7' }}></i>
                  اسم المرافق المستلم (اختياري):
                </label>
                <input 
                  type="text" 
                  className="dismissal-field-input"
                  placeholder="مثال: رامي ارفاعية"
                  value={companionName}
                  onChange={(e) => setCompanionName(e.target.value)}
                />
              </div>
            </div>

            <div className="dismissal-field-group" style={{ marginBottom: '1.5rem' }}>
              <label className="dismissal-field-label">
                <i className="fas fa-clock" style={{ color: '#0284c7' }}></i>
                ساعة الخروج والتسريح: *
              </label>
              <input 
                type="time" 
                className="dismissal-field-input"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="dismissal-submit-btn" disabled={isSubmitting}>
              <i className="fas fa-check-circle"></i>
              {isSubmitting ? 'جاري توثيق وإصدار التصريح...' : 'إصدار إذن التسريح وإشعار الحارس فوراً 🚀'}
            </button>
          </form>
        ) : (
          /* Digital Gate Pass Card */
          <div className="gate-pass-ticket-card">
            <div className="gate-pass-header-badge">
              <i className="fas fa-shield-alt"></i>
              <span>تصريح خروج رسمي معتمد - مدرسة مشيرفة الابتدائية</span>
            </div>

            <h2 style={{ margin: '0 0 0.4rem 0', fontWeight: 900, color: '#0f172a', fontSize: '1.6rem' }}>
              تم توثيق إذن التسريح بنجاح 🎉
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 1rem 0' }}>
              تم إرسال الإشعار لحظياً لشاشة حارس المدرسة عند البوابة الرئيسية.
            </p>

            <div className="gate-pass-code">
              {completedPass.passCode}
            </div>

            <table className="gate-pass-details-table">
              <tbody>
                <tr>
                  <td>اسم الطالب:</td>
                  <td><strong>{completedPass.studentName}</strong></td>
                </tr>
                <tr>
                  <td>الصف والشعبة:</td>
                  <td>{completedPass.classroom}</td>
                </tr>
                <tr>
                  <td>المربي المصرح:</td>
                  <td>{completedPass.teacherName}</td>
                </tr>
                <tr>
                  <td>المرافق المستلم:</td>
                  <td>{completedPass.companionName} ({completedPass.companionType})</td>
                </tr>
                <tr>
                  <td>سبب الخروج:</td>
                  <td>{completedPass.reason} {completedPass.reasonDetails ? ` - ${completedPass.reasonDetails}` : ''}</td>
                </tr>
                <tr>
                  <td>ساعة وتاريخ الإذن:</td>
                  <td>اليوم الساعة {completedPass.departureTime}</td>
                </tr>
                <tr>
                  <td>حالة البوابة:</td>
                  <td>
                    <span className="gate-pass-status-pill pending">
                      ⏳ قيد انتظار خروج الطالب من البوابة
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="gate-pass-actions">
              <button className="gate-pass-action-btn gate-pass-btn-print" onClick={() => window.print()}>
                <i className="fas fa-print"></i>
                طباعة بطاقة الإذن
              </button>

              <button className="gate-pass-action-btn" style={{ background: '#25d366', color: 'white' }} onClick={handleShareWhatsApp}>
                <i className="fab fa-whatsapp"></i>
                إرسال تصريح الخروج للأهل عبر واتساب
              </button>

              <button className="gate-pass-action-btn gate-pass-btn-new" onClick={handleResetForm}>
                <i className="fas fa-plus"></i>
                تسجيل تسريح طالب آخر
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDismissalPage;
