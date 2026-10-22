import React, { useState, useEffect } from 'react';
import { getStudentSession, saveStudentSession } from '../utils/studentAuth';
import { sanitizeText } from '../utils/security';
import './StudentAuthModal.css';

const StudentAuthModal = ({ isOpen, onClose, onSuccess }) => {
  const currentSession = getStudentSession();
  const [fullName, setFullName] = useState(currentSession?.fullName || '');
  const [idNumber, setIdNumber] = useState(currentSession?.idNumber !== '000000000' ? (currentSession?.idNumber || '') : '');
  const [studentClass, setStudentClass] = useState(currentSession?.studentClass || 'الصف الثالث (أ)');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const sess = getStudentSession();
      if (sess) {
        setFullName(sess.fullName || '');
        setIdNumber(sess.idNumber !== '000000000' ? (sess.idNumber || '') : '');
        setStudentClass(sess.studentClass || 'الصف الثالث (أ)');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isVisitor = studentClass.includes('زائر');
  const isTeacher = studentClass.includes('معلم');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = sanitizeText(fullName.trim());
    const cleanId = sanitizeText(idNumber.trim());

    // Validate name (at least 2 words)
    const nameParts = cleanName.split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      setErrorMsg('⚠️ يرجى إدخال اسم الطالب كاملاً (الاسم الثنائي أو الثلاثي على الأقل).');
      return;
    }

    // Validate 4 to 9 digit code for Students and Teachers
    if (!isVisitor && !/^\d{4,9}$/.test(cleanId)) {
      setErrorMsg('⚠️ رمز الدخول يجب أن يتكون من 4 إلى 9 أرقام (مثال: رقم الهوية أو الرمز السري الخاص بك).');
      return;
    }

    let role = 'student';
    if (isTeacher) role = 'teacher';
    if (isVisitor) role = 'visitor';

    // Save session
    const session = saveStudentSession({
      fullName: cleanName,
      idNumber: cleanId || '0000',
      studentClass,
      role,
      roleIcon: isTeacher ? '👨‍🏫' : isVisitor ? '👤' : '👨‍🎓'
    });

    if (isTeacher) {
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
          <div className="auth-form-group">
            <label><i className="fas fa-user"></i> اسم المستخدم / الطالب (الاسم الثنائي أو الثلاثي):</label>
            <input 
              type="text" 
              placeholder={isTeacher ? 'مثال: الأستاذ محمود ارفاعية' : isVisitor ? 'مثال: رامي ارفاعية (ولي أمر)' : 'مثال: رامي أحمد ارفاعية'} 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="auth-form-group">
            <label><i className="fas fa-school"></i> اختر الصف / الفئة:</label>
            <select value={studentClass} onChange={(e) => setStudentClass(e.target.value)}>
              <option value="الصف الأول (أ)">الصف الأول (أ)</option>
              <option value="الصف الأول (ب)">الصف الأول (ب)</option>
              <option value="الصف الثاني (أ)">الصف الثاني (أ)</option>
              <option value="الصف الثاني (ب)">الصف الثاني (ب)</option>
              <option value="الصف الثالث (أ)">الصف الثالث (أ)</option>
              <option value="الصف الثالث (ب)">الصف الثالث (ب)</option>
              <option value="الصف الرابع (أ)">الصف الرابع (أ)</option>
              <option value="الصف الرابع (ب)">الصف الرابع (ب)</option>
              <option value="الصف الخامس (أ)">الصف الخامس (أ)</option>
              <option value="الصف الخامس (ب)">الصف الخامس (ب)</option>
              <option value="الصف السادس (أ)">الصف السادس (أ)</option>
              <option value="الصف السادس (ب)">الصف السادس (ب)</option>
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
