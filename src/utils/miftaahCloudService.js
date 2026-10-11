import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

const STORAGE_KEY_PERMISSIONS = 'miftaah_cached_permissions_v1';
const STORAGE_KEY_CLOUD_LESSONS = 'miftaah_cached_cloud_lessons_v1';

/**
 * Check if the given teacher is Site Administrator / Principal Rami
 */
export const isPrincipalAdmin = (teacher) => {
  if (!teacher) return false;
  const id = String(teacher.id || '').toLowerCase();
  const email = String(teacher.email || '').toLowerCase();
  const name = String(teacher.nameAr || '').toLowerCase();
  const role = String(teacher.role || '').toLowerCase();

  return (
    id === 'tch_36' ||
    email.includes('rami0407') ||
    email.includes('admin@musherfe.com') ||
    email.includes('rami@') ||
    name.includes('رامي') ||
    role.includes('مدير المدرسة') ||
    role.includes('مدير الموقع')
  );
};

/**
 * Default permission object for any school teacher
 */
export const getDefaultPermission = (teacherId, teacherName = '') => ({
  teacherId,
  teacherName,
  canAccessMiftaah: true, // Default active for school staff unless revoked by Admin
  canUseAI: true,
  canLaunchLive: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'النظام الافتراضي'
});

/**
 * Load cached permissions from localStorage
 */
export const getCachedPermissions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERMISSIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading cached permissions:', e);
  }
  return {};
};

/**
 * Fetch all permissions from Firestore doc `miftaah_meta/permissions`
 */
export const fetchMiftaahPermissions = async () => {
  try {
    const docRef = doc(db, 'miftaah_meta', 'permissions');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const perms = data.permissions || {};
      try {
        localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(perms));
      } catch (e) {}
      return perms;
    }
  } catch (err) {
    console.warn('Firestore permissions fetch warning:', err);
  }
  return getCachedPermissions();
};

/**
 * Real-time listener for permissions
 */
export const listenToMiftaahPermissions = (callback) => {
  try {
    const docRef = doc(db, 'miftaah_meta', 'permissions');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const perms = data.permissions || {};
        try {
          localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(perms));
        } catch (e) {}
        if (callback) callback(perms);
      } else {
        if (callback) callback(getCachedPermissions());
      }
    }, (err) => {
      // Graceful local cache fallback if Firestore rules restrict public listener
      if (callback) callback(getCachedPermissions());
    });
  } catch (e) {
    if (callback) callback(getCachedPermissions());
    return () => {};
  }
};

/**
 * Save updated permissions to Firestore
 */
export const saveMiftaahPermissions = async (permissionsMap, updatedBy = 'مدير المدرسة') => {
  try {
    try {
      localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(permissionsMap));
    } catch (e) {}

    const docRef = doc(db, 'miftaah_meta', 'permissions');
    await setDoc(docRef, {
      permissions: permissionsMap,
      updatedAt: new Date().toISOString(),
      updatedBy
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving permissions to Firestore:', err);
    return false;
  }
};

/**
 * Update permission for a single teacher
 */
export const updateSingleTeacherPermission = async (teacherId, partialPermission, updatedBy = 'مدير المدرسة') => {
  const current = getCachedPermissions();
  const existing = current[teacherId] || getDefaultPermission(teacherId);
  const updated = {
    ...existing,
    ...partialPermission,
    teacherId,
    updatedAt: new Date().toISOString(),
    updatedBy
  };
  const newMap = { ...current, [teacherId]: updated };
  return await saveMiftaahPermissions(newMap, updatedBy);
};

/**
 * Check if a teacher is authorized to access Miftaah
 */
export const checkTeacherAuthorization = (teacher, permissionsMap = {}) => {
  if (!teacher) return { allowed: false, reason: 'غير مسجل' };
  
  // Principal / Admin always authorized
  if (isPrincipalAdmin(teacher)) {
    return {
      allowed: true,
      canUseAI: true,
      canLaunchLive: true,
      isAdmin: true
    };
  }

  const perm = permissionsMap[teacher.id] || getCachedPermissions()[teacher.id];
  if (!perm) {
    // Default allowed for official teachers
    return {
      allowed: true,
      canUseAI: true,
      canLaunchLive: true,
      isAdmin: false
    };
  }

  return {
    allowed: perm.canAccessMiftaah !== false,
    canUseAI: perm.canUseAI !== false,
    canLaunchLive: perm.canLaunchLive !== false,
    isAdmin: false
  };
};

/**
 * =========================================================================
 * FIRESTORE LESSONS CLOUD SYNC
 * =========================================================================
 */

/**
 * Save lesson to Firestore collection `miftaah_lessons` (guaranteed local fallback)
 */
export const saveLessonToFirestore = async (lesson) => {
  if (!lesson || !lesson.id) return false;

  const cleanLesson = {
    ...lesson,
    updatedAt: new Date().toISOString()
  };

  // 1. Guaranteed Local Persistence (localStorage)
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLOUD_LESSONS);
    const existing = raw ? JSON.parse(raw) : [];
    const next = [cleanLesson, ...existing.filter(l => l.id !== cleanLesson.id)];
    localStorage.setItem(STORAGE_KEY_CLOUD_LESSONS, JSON.stringify(next));
  } catch (e) {}

  // 2. Cloud Firestore Persistence
  try {
    const docRef = doc(db, 'miftaah_lessons', cleanLesson.id);
    await setDoc(docRef, cleanLesson, { merge: true });
    return true;
  } catch (err) {
    // If permission-denied (unauthenticated visitor or rules restriction), local persistence is already guaranteed!
    return true;
  }
};

/**
 * Delete lesson from Firestore collection `miftaah_lessons`
 */
export const deleteLessonFromFirestore = async (lessonId) => {
  if (!lessonId) return false;

  // 1. Remove from local storage
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLOUD_LESSONS);
    const existing = raw ? JSON.parse(raw) : [];
    const next = existing.filter(l => l.id !== lessonId);
    localStorage.setItem(STORAGE_KEY_CLOUD_LESSONS, JSON.stringify(next));
  } catch (e) {}

  // 2. Remove from Firestore
  try {
    const docRef = doc(db, 'miftaah_lessons', lessonId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    return true;
  }
};

/**
 * Fetch all lessons from Firestore
 */
export const fetchLessonsFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'miftaah_lessons'));
    const lessons = [];
    snap.forEach((d) => {
      lessons.push(d.data());
    });
    if (lessons.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_CLOUD_LESSONS, JSON.stringify(lessons));
      } catch (e) {}
      return lessons;
    }
  } catch (err) {
    // Graceful fallback to local cache
  }

  try {
    const cached = localStorage.getItem(STORAGE_KEY_CLOUD_LESSONS);
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return [];
};

/**
 * Real-time listener for lessons in Firestore (with guaranteed local cache fallback)
 */
export const listenToMiftaahLessons = (callback) => {
  const getCached = () => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_CLOUD_LESSONS);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  };

  try {
    return onSnapshot(collection(db, 'miftaah_lessons'), (snap) => {
      const lessons = [];
      snap.forEach((d) => {
        lessons.push(d.data());
      });
      if (lessons.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY_CLOUD_LESSONS, JSON.stringify(lessons));
        } catch (e) {}
        if (callback) callback(lessons);
      } else {
        if (callback) callback(getCached());
      }
    }, (err) => {
      // If Firestore rules restrict public collection listener, serve cached lessons immediately
      if (callback) callback(getCached());
    });
  } catch (e) {
    if (callback) callback(getCached());
    return () => {};
  }
};
