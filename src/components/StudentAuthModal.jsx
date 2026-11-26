import { findStudentByRosterId, normalizeRosterId, SCHOOL_CLASSES_LIST, normalizeClassToDropdownValue } from '../data/schoolStudentsRoster';
import React, { useState, useEffect } from 'react';
import { getStudentSession, saveStudentSession } from '../utils/studentAuth';
import { authenticateTeacherUnified, findTeacherByPin } from '../utils/teacherAuth';
import { sanitizeText } from '../utils/security';
import './StudentAuthModal.css';

const StudentAuthModal = ({ isOpen, onClose, onSuccess }) => {
  const currentSession = getStudentSession();
  const [fullName, setFullName] = useState(currentSession?.fullName || '');
  const [idNumber, setIdNumber] = useState(currentSession?.idNumber !== '000000000' ? (currentSession?.idNumber || '') : '');
  const [studentClass, setStudentClass] = useState(normalizeClassToDropdownValue(currentSession?.studentClass || 'الصف الثالث (أ)'));
  const [errorMsg, setErrorMsg] = useState('');
  const [matchedRosterStudent, setMatchedRosterStudent] = useState(null);
  const [matchedTeacher, setMatchedTeacher] = useState(null);

  const handleIdChange = (val) => {
    const raw = val.replace(/\D/g, '');
    setIdNumber(raw);
    setErrorMsg('');

    if (raw.length >= 8) {
      const match = findStudentByRosterId(raw);
      if (match) {
        setMatchedRosterStudent(match);
        if (!fullName || fullName === currentSession?.fullName) {
          setFullName(match.studentName);
        }
        const cls = normalizeClassToDropdownValue(match.classKey || match.classArabic || match.gradeArabic);
        setStudentClass(cls);
      } else {
        setMatchedRosterStudent(null);
      }
    } else {
      setMatchedRosterStudent(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const sess = getStudentSession();
      if (sess) {
        setFullName(sess.fullName || '');
        setIdNumber(sess.idNumber !== '000000000' ? (sess.idNumber || '') : '');
        setStudentClass(normalizeClassToDropdownValue(sess.studentClass || 'الصف الثالث (أ)'));
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isVisitor = studentClass.includes('زائر');
  const isTeacher = studentClass.includes('معلم');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = sanitizeText(fullName.trim());
    const cleanId = sanitizeText(idNumber.trim());

    // Check if ID matches official school roster
    const matchFromRoster = findStudentByRosterId(cleanId);
    let finalStudentName = cleanName;
    if (matchFromRoster && (!finalStudentName || finalStudentName.length < 2)) {
      finalStudentName = matchFromRoster.studentName;
    }

    // Unified Teacher Login
    const isTeacherRole = isTeacher || cleanId === '318212' || !!findTeacherByPin(cleanId) || !!matchedTeacher;
    if (isTeacherRole) {
      const authRes = await authenticateTeacherUnified({
        name: cleanName,
        pin: cleanId
      });
      if (authRes.success) {
        if (onSuccess) onSuccess(authRes.session);
        if (onClose) onClose();
        if (authRes.systemRole === 'coordinator' || authRes.teacher?.id === 'tch_17') {
          window.location.hash = '#/appointments';
        } else {
          window.location.hash = '#/stem-teacher';
        }
        return;
      } else if (isTeacher) {
        setErrorMsg(authRes.error || '⚠️ رمز الدخول غير معتمد في سجل المعلمين.');
        return;
      }
    }

    // Validate name (at least 2 words unless matched in official school roster)
    const nameParts = finalStudentName.split(/\s+/).filter(Boolean);
    if (!matchFromRoster && !isVisitor && nameParts.length < 2) {
      setErrorMsg('⚠️ يرجى إدخال اسم الطالب كاملاً أو إدخال رقم الهوية للتعرف التلقائي من السجل الرسمي.');
      return;
    }

    // Validate 4 to 9 digit code for Students and Teachers
    if (!isVisitor && !/^\d{4,9}$/.test(cleanId)) {
      setErrorMsg('⚠️ رمز الدخول يجب أن يتكون من 4 إلى 9 أرقام (مثال: رقم الهوية أو الرمز السري الخاص بك).');
      return;
    }

    const isCoordinator = cleanName.includes('عتاب') || cleanName.includes('עתאב') || cleanId === '031693872';

    let role = 'student';
    let roleIcon = isTeacher ? '👨‍🏫' : isVisitor ? '👤' : '👨‍🎓';
    let finalClass = studentClass;

    if (isCoordinator || cleanId === '031693872') {
      role = 'coordinator';
      roleIcon = '👩‍🏫';
      finalClass = 'المركزة التربوية 👩‍🏫';
      try {
        const coordSession = {
          id: 'tch_17',
          nameAr: cleanName.includes('عتاب') ? cleanName : 'عتاب بيدوسي',
          nameHe: 'עתאב בידוסי',
          role: 'المركزة التربوية',
          isCoordinator: true,
          pin: '031693872',
          loggedInAt: new Date().toISOString()
        };
        localStorage.setItem('musherfe_coordinator_session', JSON.stringify(coordSession));
        localStorage.setItem('musherfe_gantt_teacher', JSON.stringify({
          id: 't2',
          nameHe: 'עתאב בידוסי',
          nameAr: 'عتاب بيدوسي',
          role: 'gantt_editor',
          loggedInAt: new Date().toISOString()
        }));
      } catch (e) {}
    } else if (isTeacher) {
      role = 'teacher';
    } else if (isVisitor) {
      role = 'visitor';
    }

    // Save session
    const session = saveStudentSession({
      fullName: finalStudentName || cleanName,
      idNumber: cleanId || '0000',
      studentClass: finalClass,
      role,
      roleIcon
    });

    if (isCoordinator) {
      window.location.hash = '#/appointments';
    } else if (isTeacher) {
      window.location.hash = '#/stem-teacher';
    }

    if (onSuccess) onSuccess(session);
    if (onClose) onClose();
  };

  const handleVisitorQuickLogin = () => {
    const session = saveStudentSession({
      fullName: 'زائر البوابة المدرسية',
      idNumber: '0000',
      studentClass: 'زائر للموقع 👤',
      role: 'visitor',
      roleIcon: '👤'
    });
    if (onSuccess) onSuccess(session);
    if (onClose) onClose();
  };

  return (
    <div className="student-auth-overlay" onClick={onClose}>
      <div className="student-auth-card animate-pop" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose} title="إغلاق">
          <i className="fas fa-times"></i>
        </button>

        <div className="auth-header">
          <div className="auth-icon-badge">
            {isTeacher ? '👨‍🏫' : isVisitor ? '👤' : '👨‍🎓'}
          </div>
          <h2>تسجيل دخول البوابة الموحدة 🚀</h2>
          <p>أدخل بياناتك لمرة واحدة فقط لتظهر باسمك تلقائياً في جميع ألعاب وصفحات وفروع المدرسة!</p>
        </div>

        {errorMsg && (
          <div className="auth-error-banner">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="student-auth-form">
          <div className="auth-form-group" style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '12px', borderRadius: '12px', border: '1.5px solid rgba(56, 189, 248, 0.3)' }}>
            <label style={{ color: '#38bdf8', fontWeight: 800 }}>
              <i className="fas fa-id-card"></i> رقم الهوية المدرسية (نفس رقم منصة مفتاح):
            </label>
            <input 
              type="text" 
              inputMode="numeric"
              maxLength={9}
              placeholder="اكتب رقم الهوية هنا (مثال: 340041722)" 
              value={idNumber}
              onChange={(e) => handleIdChange(e.target.value)}
              autoFocus
              style={{ fontSize: '1.1rem', letterSpacing: '1px', fontWeight: 800 }}
            />
            {matchedTeacher && (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', borderRadius: '8px', color: '#60a5fa', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-chalkboard-teacher" style={{ color: '#3b82f6' }}></i>
                <span>تم التعرف عليك: <strong>{matchedTeacher.nameAr || matchedTeacher.nameHe}</strong> 👨‍🏫 (معلم/ة معتمد/ة في مدرسة مشيرفة)</span>
              </div>
            )}
            {matchedRosterStudent && (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#34d399', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                <span>تم التعرف عليك: <strong>{matchedRosterStudent.studentName}</strong> — {matchedRosterStudent.gradeArabic} ({matchedRosterStudent.classArabic})</span>
              </div>
            )}
            <small className="field-hint" style={{ marginTop: '6px' }}>يكفي إدخال رقم الهوية المسجل في منصة مفتاح وسيتم جلب اسمك وصفك فوراً.</small>
          </div>

          <div className="auth-form-group">
            <label><i className="fas fa-user"></i> اسم الطالب / المستخدم (اختياري عند كتابة رقم الهوية):</label>
            <input 
              type="text" 
              placeholder={isTeacher ? 'مثال: الأستاذ محمود ارفاعية' : isVisitor ? 'مثال: رامي ارفاعية (ولي أمر)' : 'اسم الطالب'} 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="auth-form-group">
            <label><i className="fas fa-school"></i> اختر الصف / الفئة:</label>
            <select value={studentClass} onChange={(e) => setStudentClass(e.target.value)}>
              {SCHOOL_CLASSES_LIST.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
              <option value="معلم في المدرسة 👨‍🏫">👨‍🏫 معلم في المدرسة</option>
              <option value="زائر للموقع 👤">👤 زائر / ولي أمر</option>
            </select>
          </div>

          <div className="auth-form-group">
            <label>
              <i className="fas fa-id-card"></i> 
              {isVisitor ? ' رمز الدخول (اختياري للزوار):' : ' رمز الدخول (4 إلى 9 أرقام أو رقم الهوية):'}
            </label>
            <input 
              type="text" 
              inputMode="numeric"
              maxLength={9}
              placeholder={isVisitor ? 'اختياري للزائر' : 'مثال: 1234 أو رقم الهوية'} 
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
              required={!isVisitor}
            />
            {!isVisitor && <small className="field-hint">رمز الدخول: أي رمز سري مكوّن من 4 إلى 9 أرقام أو رقم هويتك لحفظ هويتك.</small>}
          </div>

          <button type="submit" className="auth-submit-btn">
            <i className="fas fa-sign-in-alt"></i> دخول وحفظ الهوية الموحدة 🚀
          </button>

          <button 
            type="button" 
            onClick={handleVisitorQuickLogin}
            style={{
              marginTop: '10px',
              width: '100%',
              padding: '10px',
              background: 'transparent',
              border: '1.5px dashed rgba(255,255,255,0.3)',
              color: '#94a3b8',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '13px'
            }}
          >
            تخطي ومتابعة كزائر سريع 👤
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentAuthModal;
