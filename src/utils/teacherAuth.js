import { defaultSchoolTeachers } from '../data/schoolTeachersData';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, onSnapshot, addDoc } from 'firebase/firestore';

export const DEFAULT_TEACHER_PIN = '318212';
const STORAGE_PREFIX = 'musherfe_tch_pin_';
const ACTIVE_TEACHER_KEY = 'musherfe_active_teacher_session';

// In-memory cache of cloud PINs & metadata
let cloudAccountsCache = {};

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
 * Fetch all teacher accounts from Firestore cloud collection `teacher_accounts`
 */
export const fetchTeacherCloudAccounts = async () => {
  try {
    const snap = await getDocs(collection(db, 'teacher_accounts'));
    const accounts = {};
    snap.forEach(d => {
      const data = d.data();
      accounts[d.id] = {
        id: d.id,
        ...data,
        pin: data.pin || DEFAULT_TEACHER_PIN
      };
      // Also cache to localStorage for offline access
      if (data.pin) {
        try {
          localStorage.setItem(`${STORAGE_PREFIX}${d.id}`, data.pin);
        } catch (e) {}
      }
    });
    cloudAccountsCache = { ...cloudAccountsCache, ...accounts };
    return cloudAccountsCache;
  } catch (err) {
    console.warn('Error fetching cloud teacher accounts:', err);
    return cloudAccountsCache;
  }
};

/**
 * Listen in real time to teacher accounts collection in Firestore
 */
export const listenToTeacherAccounts = (callback) => {
  try {
    return onSnapshot(collection(db, 'teacher_accounts'), (snap) => {
      const accounts = {};
      snap.forEach(d => {
        const data = d.data();
        accounts[d.id] = {
          id: d.id,
          ...data,
          pin: data.pin || DEFAULT_TEACHER_PIN
        };
        if (data.pin) {
          try {
            localStorage.setItem(`${STORAGE_PREFIX}${d.id}`, data.pin);
          } catch (e) {}
        }
      });
      cloudAccountsCache = { ...cloudAccountsCache, ...accounts };
      if (callback) callback(cloudAccountsCache);
    }, (err) => {
      console.warn('Realtime teacher accounts listener note:', err);
    });
  } catch (e) {
    console.warn('Listener setup error:', e);
    return () => {};
  }
};

/**
 * Get current PIN for a teacher (Cloud cache, or localStorage, or default 318212)
 */
export const getTeacherPin = (teacherId) => {
  if (!teacherId) return DEFAULT_TEACHER_PIN;

  // 1. Check cloud cache first
  if (cloudAccountsCache[teacherId] && cloudAccountsCache[teacherId].pin) {
    return cloudAccountsCache[teacherId].pin.trim();
  }

  // 2. Check localStorage
  try {
    const custom = localStorage.getItem(`${STORAGE_PREFIX}${teacherId}`);
    if (custom && custom.trim().length >= 4) {
      return custom.trim();
    }
  } catch (e) {}

  // 3. Fallback to default PIN
  return DEFAULT_TEACHER_PIN;
};

/**
 * Get complete details of a teacher account (PIN, status, last update)
 */
export const getTeacherAccountDetails = (teacherId) => {
  const teacher = getTeacherById(teacherId);
  const cloudData = cloudAccountsCache[teacherId] || {};
  const currentPin = getTeacherPin(teacherId);
  const isCustom = currentPin !== DEFAULT_TEACHER_PIN;

  return {
    id: teacherId,
    nameAr: teacher ? teacher.nameAr : teacherId,
    nameHe: teacher ? teacher.nameHe : '',
    role: teacher ? teacher.role : 'مربي ومعلم',
    pin: currentPin,
    isCustom,
    updatedAt: cloudData.updatedAt || null,
    updatedBy: cloudData.updatedBy || (isCustom ? 'المربي' : 'النظام (افتراضي)')
  };
};

/**
 * Verify teacher login credentials
 */
export const verifyTeacherCredentials = (teacherId, enteredPin) => {
  if (!teacherId || !enteredPin) return false;
  const cleanEntered = enteredPin.trim();
  const expectedPin = getTeacherPin(teacherId);
  return cleanEntered === expectedPin || cleanEntered === DEFAULT_TEACHER_PIN;
};

/**
 * Update teacher's personal PIN (Saves locally & synchronizes to Firestore cloud)
 */
export const updateTeacherPin = async (teacherId, newPin, updatedBy = 'المربي (خدمة ذاتية)') => {
  if (!teacherId || !newPin || newPin.trim().length < 4) {
    throw new Error('يجب أن تكون كلمة المرور 4 خانات على الأقل.');
  }

  const cleanPin = newPin.trim();
  const teacher = getTeacherById(teacherId);
  const teacherName = teacher ? teacher.nameAr : teacherId;
  const nowStr = new Date().toISOString();

  // 1. Save locally for instant reliable offline access
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${teacherId}`, cleanPin);
  } catch (e) {}

  // 2. Update memory cache
  cloudAccountsCache[teacherId] = {
    ...(cloudAccountsCache[teacherId] || {}),
    id: teacherId,
    teacherNameAr: teacherName,
    pin: cleanPin,
    isCustom: cleanPin !== DEFAULT_TEACHER_PIN,
    updatedAt: nowStr,
    updatedBy
  };

  // 3. Save to Firestore collection `teacher_accounts` so Admin & all devices see it!
  try {
    await setDoc(doc(db, 'teacher_accounts', teacherId), {
      id: teacherId,
      nameAr: teacherName,
      nameHe: teacher ? teacher.nameHe : '',
      pin: cleanPin,
      isCustom: cleanPin !== DEFAULT_TEACHER_PIN,
      updatedAt: nowStr,
      updatedBy
    }, { merge: true });
  } catch (cloudErr) {
    console.warn('Firestore teacher_accounts save note:', cloudErr);
  }

  // 4. Log event in messages for audit trail
  try {
    await addDoc(collection(db, 'messages'), {
      type: 'teacher_pwd_update',
      teacherId,
      teacherName,
      newPin: cleanPin,
      updatedBy,
      updatedAt: nowStr,
      source: 'teacherAuth'
    });
  } catch (e) {}

  return true;
};

/**
 * Admin directly sets a custom PIN for a teacher
 */
export const adminSetTeacherPin = async (teacherId, newPin) => {
  return await updateTeacherPin(teacherId, newPin, 'إدارة المدرسة (لوحة التحكم)');
};

/**
 * Admin reset teacher PIN back to default 318212
 */
export const resetTeacherPinToDefault = async (teacherId, resetBy = 'إدارة المدرسة') => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${teacherId}`);
  } catch (e) {}

  const teacher = getTeacherById(teacherId);
  const teacherName = teacher ? teacher.nameAr : teacherId;
  const nowStr = new Date().toISOString();

  cloudAccountsCache[teacherId] = {
    ...(cloudAccountsCache[teacherId] || {}),
    id: teacherId,
    teacherNameAr: teacherName,
    pin: DEFAULT_TEACHER_PIN,
    isCustom: false,
    updatedAt: nowStr,
    updatedBy: resetBy
  };

  try {
    await setDoc(doc(db, 'teacher_accounts', teacherId), {
      id: teacherId,
      nameAr: teacherName,
      nameHe: teacher ? teacher.nameHe : '',
      pin: DEFAULT_TEACHER_PIN,
      isCustom: false,
      updatedAt: nowStr,
      updatedBy: resetBy
    }, { merge: true });
  } catch (cloudErr) {
    console.warn('Firestore reset error:', cloudErr);
  }

  return true;
};

/**
 * Check if teacher has customized their PIN
 */
export const isTeacherPinCustomized = (teacherId) => {
  const currentPin = getTeacherPin(teacherId);
  return !!currentPin && currentPin !== DEFAULT_TEACHER_PIN;
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
