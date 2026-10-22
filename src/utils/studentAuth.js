// Utility module for Global Unified User Session (Single Sign-On)
// Supports Students, Teachers, and Visitors across all site features

const SESSION_KEY = 'musheirifa_student_session';

export const getStudentSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.isLoggedIn && data.fullName) {
        return data;
      }
    }
    // Fallback: Check individual keys if JSON was not set
    const fallbackName = localStorage.getItem('school_unified_student_name');
    if (fallbackName && fallbackName.trim()) {
      const fallbackClass = localStorage.getItem('school_unified_student_class') || 'الصف الثالث (أ)';
      const fallbackPin = localStorage.getItem('school_unified_student_pin') || '0000';
      const isTeacher = fallbackClass.includes('معلم');
      const isVisitor = fallbackClass.includes('زائر');
      return {
        fullName: fallbackName.trim(),
        idNumber: fallbackPin,
        studentClass: fallbackClass,
        role: isTeacher ? 'teacher' : isVisitor ? 'visitor' : 'student',
        roleIcon: isTeacher ? '👨‍🏫' : isVisitor ? '👤' : '👨‍🎓',
        roleLabel: isTeacher ? 'معلم' : isVisitor ? 'زائر' : 'طالب',
        isLoggedIn: true,
        loginTime: new Date().toISOString()
      };
    }
  } catch (e) {
    console.warn("Failed to parse user session:", e);
  }
  return null;
};

export const saveStudentSession = (sessionData) => {
  const role = sessionData.role || 'student';
  let displayClass = sessionData.studentClass || 'الصف الثالث (أ)';
  let roleIcon = '👨‍🎓';
  let roleLabel = 'طالب';

  if (role === 'teacher') {
    displayClass = 'معلم في المدرسة 👨‍🏫';
    roleIcon = '👨‍🏫';
    roleLabel = 'معلم';
  } else if (role === 'visitor') {
    displayClass = 'زائر محترم 👤';
    roleIcon = '👤';
    roleLabel = 'زائر';
  }

  const payload = {
    fullName: sessionData.fullName.trim(),
    idNumber: sessionData.idNumber ? sessionData.idNumber.trim() : '000000000',
    studentClass: displayClass,
    role,
    roleIcon,
    roleLabel,
    isLoggedIn: true,
    loginTime: new Date().toISOString()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  // Keep individual localStorage keys in sync across all components and games
  if (payload.fullName) {
    localStorage.setItem('school_unified_student_name', payload.fullName);
  }
  if (payload.studentClass) {
    localStorage.setItem('school_unified_student_class', payload.studentClass);
  }
  if (payload.idNumber) {
    localStorage.setItem('school_unified_student_pin', payload.idNumber);
  }
  window.dispatchEvent(new Event('studentAuthChanged'));
  return payload;
};

export const logoutStudent = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('school_unified_student_name');
  localStorage.removeItem('school_unified_student_class');
  localStorage.removeItem('school_unified_student_pin');
  window.dispatchEvent(new Event('studentAuthChanged'));
};
