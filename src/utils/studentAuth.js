// Utility module for Global Unified User Session (Single Sign-On)
// Supports Students, Teachers, and Visitors across all site features

const SESSION_KEY = 'musheirifa_student_session';

export const getStudentSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.isLoggedIn && data.fullName) {
      return data;
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
  window.dispatchEvent(new Event('studentAuthChanged'));
  return payload;
};

export const logoutStudent = () => {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('studentAuthChanged'));
};
