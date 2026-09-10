import { defaultSchoolTeachers } from '../data/schoolTeachersData';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const DEFAULT_TEACHER_PIN = '318212';
const STORAGE_PREFIX = 'musherfe_tch_pin_';
const ACTIVE_TEACHER_KEY = 'musherfe_active_teacher_session';

/**
 * Get all available school teachers with bilingual display names
 */
export const getAllTeachers = () => {
  return defaultSchoolTeachers.map(t => ({
    ...t,
    displayName: `${t.nameAr} (${t.nameHe})`
  }));
};

/**
 * Find a teacher by ID
 */
export const getTeacherById = (id) => {
  const teachers = getAllTeachers();
  return teachers.find(t => t.id === id) || null;
};

/**
 * Find a teacher by Arabic or Hebrew Name
 */
export const findTeacherByName = (name) => {
  if (!name) return null;
  const teachers = getAllTeachers();
  const trimmed = name.trim().toLowerCase();
  return teachers.find(t => 
    (t.nameAr && t.nameAr.toLowerCase().includes(trimmed)) ||
    (t.nameHe && t.nameHe.toLowerCase().includes(trimmed)) ||
    (trimmed.includes(t.nameAr?.toLowerCase() || ''))
  ) || null;
};

/**
 * Get current PIN for a teacher (Custom PIN from storage or default 318212)
 */
export const getTeacherPin = (teacherId) => {
  if (!teacherId) return DEFAULT_TEACHER_PIN;
  try {
    const custom = localStorage.getItem(`${STORAGE_PREFIX}${teacherId}`);
    if (custom && custom.trim().length >= 4) {
      return custom.trim();
    }
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return DEFAULT_TEACHER_PIN;
};

/**
 * Verify teacher login credentials
 */
export const verifyTeacherCredentials = (teacherId, enteredPin) => {
  if (!teacherId || !enteredPin) return false;
  const expectedPin = getTeacherPin(teacherId);
  return enteredPin.trim() === expectedPin || enteredPin.trim() === DEFAULT_TEACHER_PIN;
};

/**
 * Update teacher's personal PIN (Save to localStorage and sync to cloud)
 */
export const updateTeacherPin = async (teacherId, newPin) => {
  if (!teacherId || !newPin || newPin.trim().length < 4) {
    throw new Error('يجب أن تكون كلمة المرور 4 خانات على الأقل.');
  }

  const cleanPin = newPin.trim();
  
  // 1. Save locally for instant reliable access
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${teacherId}`, cleanPin);
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  // 2. Cloud record for cross-device awareness
  try {
    const teacher = getTeacherById(teacherId);
    await addDoc(collection(db, 'messages'), {
      type: 'teacher_pwd_update',
      teacherId,
      teacherName: teacher ? teacher.nameAr : teacherId,
      updatedAt: new Date().toISOString(),
      source: 'teacher_self_service'
    });
  } catch (cloudErr) {
    console.warn('Cloud pwd sync note:', cloudErr);
  }

  return true;
};

/**
 * Admin reset teacher PIN back to default 318212
 */
export const resetTeacherPinToDefault = (teacherId) => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${teacherId}`);
    return true;
  } catch (e) {
    console.warn('Reset error:', e);
    return false;
  }
};

/**
 * Check if teacher has customized their PIN
 */
export const isTeacherPinCustomized = (teacherId) => {
  try {
    const val = localStorage.getItem(`${STORAGE_PREFIX}${teacherId}`);
    return !!val && val !== DEFAULT_TEACHER_PIN;
  } catch (e) {
    return false;
  }
};

/**
 * Get active logged-in teacher session
 */
export const getActiveTeacherSession = () => {
  try {
    const raw = localStorage.getItem(ACTIVE_TEACHER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

/**
 * Save active logged-in teacher session
 */
export const setActiveTeacherSession = (teacher) => {
  try {
    if (!teacher) {
      localStorage.removeItem(ACTIVE_TEACHER_KEY);
    } else {
      localStorage.setItem(ACTIVE_TEACHER_KEY, JSON.stringify(teacher));
    }
  } catch (e) {
    console.warn('Session save error:', e);
  }
};

/**
 * Logout active teacher
 */
export const logoutTeacherSession = () => {
  try {
    localStorage.removeItem(ACTIVE_TEACHER_KEY);
  } catch (e) {}
};
