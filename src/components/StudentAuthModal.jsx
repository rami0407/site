import React, { useState } from 'react';
import { saveStudentSession } from '../utils/studentAuth';
import './StudentAuthModal.css';

const StudentAuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [studentClass, setStudentClass] = useState('الصف الثالث (أ)');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isVisitor = studentClass.includes('زائر');
  const isTeacher = studentClass.includes('معلم');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = fullName.trim();
    const cleanId = idNumber.trim();

    // Validate name (at least 2 words)
    const nameParts = cleanName.split(/\s+/);
    if (nameParts.length < 2) {
      setErrorMsg('⚠️ يرجى إدخال الاسم كاملاً (الاسم الأول واسم العائلة على الأقل).');
      return;
    }

    // Validate 9-digit ID number for Students and Teachers
    if (!isVisitor && !/^\d{9}$/.test(cleanId)) {
      setErrorMsg('⚠️ رمز الدخول يجب أن يكون رقم الهوية المكون من 9 أرقام بالضبط (مثال: 123456789).');
      return;
    }

    let role = 'student';
    if (isTeacher) role = 'teacher';
    if (isVisitor) role = 'visitor';

    // Save session
    const session = saveStudentSession({
      fullName: cleanName,
      idNumber: cleanId || '000000000',
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

  return (
    <div className="student-auth-overlay" onClick={onClose}>
      <div className="student-auth-card animate-pop" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        <div className="auth-header">
          <div className="auth-icon-badge">
            {isTeacher ? '👨‍🏫' : isVisitor ? '👤' : '👨‍🎓'}
          </div>
          <h2>تسجيل دخول البوابة الموحدة 🚀</h2>
          <p>أدخل بياناتك وسجل دخولك للوصول التلقائي لكافة الألعاب والتحديات والمبادرات!</p>
        </div>

        {errorMsg && (
          <div className="auth-error-banner">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="student-auth-form">
          <div className="auth-form-group">
            <label><i className="fas fa-user"></i> اسم المستخدم (الاسم الثلاثي):</label>
            <input 
              type="text" 
              placeholder={isTeacher ? 'مثال: الأستاذ محمود ارفاعية' : isVisitor ? 'مثال: رامي ارفاعية (ولي أمر)' : 'مثال: رامي أحمد ارفاعية'} 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label><i className="fas fa-school"></i> اختر الصف / الفئة (طالب، معلم، زائر):</label>
            <select value={studentClass} onChange={(e) => setStudentClass(e.target.value)}>
              <option value="الصف الأول (أ)">الصف الأول (أ)</option>
              <option value="الصف الأول (ب)">الصف الأول (ب)</option>
              <option value="الصف الثاني (أ)">الصف الثاني (أ)</option>
              <option value="الصف الثاني (ب)">الصف الثاني (ب)</option>
              <option value="الصف الثالث (أ)">الصف الثالث (أ)</option>
              <option value="الصف الثالث (ب)">الصف الثالث (ب)</option>
              <option value="الصف الرابع (أ)">الصف الرابع (أ)</option>
              <option value="الصف الخامس (أ)">الصف الخامس (أ)</option>
              <option value="الصف السادس (أ)">الصف السادس (أ)</option>
              <option value="معلم في المدرسة 👨‍🏫">👨‍🏫 معلم في المدرسة</option>
              <option value="زائر للموقع 👤">👤 زائر / ولي أمر</option>
            </select>
          </div>

          <div className="auth-form-group">
            <label>
              <i className="fas fa-id-card"></i> 
              {isVisitor ? ' رمز الدخول / رقم الهوية (اختياري للزوار):' : ' رمز الدخول (رقم الهوية - 9 أرقام):'}
            </label>
            <input 
              type="text" 
              maxLength={9}
              placeholder={isVisitor ? 'اختياري للزائر' : 'مثال: 123456789'} 
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
              required={!isVisitor}
            />
            {!isVisitor && <small className="field-hint">رمز الدخول هو رقم الهوية المكون من 9 أرقام كي لا تنساه أبداً.</small>}
          </div>

          <button type="submit" className="auth-submit-btn">
            <i className="fas fa-sign-in-alt"></i> دخول وحفظ الهوية 🚀
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentAuthModal;
