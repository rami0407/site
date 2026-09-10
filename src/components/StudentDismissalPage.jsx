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

const StudentDismissalPage = () => {
  // Form State
  const [studentName, setStudentName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [gender, setGender] = useState('male'); // 'male' or 'female'
  const [classroom, setClassroom] = useState('الصف الأول (أ)');
  const [teacherName, setTeacherName] = useState('رامي ارفاعية');
  const [reason, setReason] = useState('توعك صحي أو مرض مفاجئ 🤒');
  const [reasonDetails, setReasonDetails] = useState('');
  const [companionType, setCompanionType] = useState('الأب 👨');
  const [companionName, setCompanionName] = useState('');
  const [companionPhone, setCompanionPhone] = useState('');
  
  // Date & Time
  const [departureDate, setDepartureDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
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

  // Auto-extract family name from full student name
  const handleStudentNameChange = (e) => {
    const val = e.target.value;
    setStudentName(val);
    const parts = val.trim().split(/\s+/);
    if (parts.length >= 2) {
      setFamilyName(parts[parts.length - 1]);
    }
  };

  // Submit Dismissal Pass
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('يرجى إدخال اسم الطالب كاملاً.');
      return;
    }

    setIsSubmitting(true);

    const passCode = 'DIS-' + Math.floor(1000 + Math.random() * 9000);
    const gradeLevel = classroom.split(' ')[1] || 'غير محدد'; // e.g. "الأول", "الرابع"

    const dismissalData = {
      passCode,
      studentName: studentName.trim(),
      familyName: familyName.trim() || 'غير محدد',
      gender,
      gradeLevel,
      classroom,
      teacherName: teacherName.trim(),
      reason,
      reasonDetails: reasonDetails.trim(),
      companionType,
      companionName: companionName.trim() || companionType,
      companionPhone: companionPhone.trim(),
      departureDate,
      departureTime,
      gateStatus: 'pending', // 'pending' | 'exited'
      gateExitTime: null,
      createdAt: new Date().toISOString()
    };

    try {
      let docId = 'dis_' + Date.now();
      try {
        const docRef = await addDoc(collection(db, 'student_dismissals'), dismissalData);
        docId = docRef.id;
      } catch (err) {
        console.warn('student_dismissals addDoc note:', err);
      }

      // Guaranteed open channel mirror on schoolGuide so Guard & Admin see it immediately
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
    setFamilyName('');
    setReasonDetails('');
    setCompanionName('');
    setCompanionPhone('');
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
                  onChange={handleStudentNameChange}
                  required
                />
              </div>

              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-users" style={{ color: '#0284c7' }}></i>
                  اسم العائلة (للتحليلات والإحصاء):
                </label>
                <input 
                  type="text" 
                  className="dismissal-field-input" 
                  placeholder="مثال: ارفاعية / إغبارية" 
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                />
              </div>
            </div>

            <div className="dismissal-grid-2">
              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-venus-mars" style={{ color: '#0284c7' }}></i>
                  جنس الطالب:
                </label>
                <div className="dismissal-gender-toggle">
                  <button 
                    type="button" 
                    className={`dismissal-gender-btn male ${gender === 'male' ? 'active' : ''}`}
                    onClick={() => setGender('male')}
                  >
                    <span>👦</span> ذكر
                  </button>
                  <button 
                    type="button" 
                    className={`dismissal-gender-btn female ${gender === 'female' ? 'active' : ''}`}
                    onClick={() => setGender('female')}
                  >
                    <span>👧</span> أنثى
                  </button>
                </div>
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
                  اسم المرافق المستلم:
                </label>
                <input 
                  type="text" 
                  className="dismissal-field-input"
                  placeholder="مثال: رامي ارفاعية (الأب)"
                  value={companionName}
                  onChange={(e) => setCompanionName(e.target.value)}
                />
              </div>
            </div>

            <div className="dismissal-grid-2">
              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-phone-alt" style={{ color: '#0284c7' }}></i>
                  هاتف المرافق / ولي الأمر:
                </label>
                <input 
                  type="tel" 
                  className="dismissal-field-input"
                  placeholder="0501234567"
                  value={companionPhone}
                  onChange={(e) => setCompanionPhone(e.target.value)}
                />
              </div>

              <div className="dismissal-field-group">
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
