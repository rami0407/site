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

  // 2. Cloud Firestore Persistence (miftaah_lessons)
  try {
    const docRef = doc(db, 'miftaah_lessons', cleanLesson.id);
    await setDoc(docRef, cleanLesson, { merge: true });
  } catch (err) {}

  // 3. Mirror in public school_padlet_cards collection so unauthenticated students can access by pin/id
  try {
    const publicDocRef = doc(db, 'school_padlet_cards', `miftaah_lesson_${cleanLesson.id}`);
    await setDoc(publicDocRef, cleanLesson, { merge: true });

    const pin = (cleanLesson.code || cleanLesson.pin || '').trim();
    if (pin) {
      const pinKey = pin.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (pinKey) {
        const pinDocRef = doc(db, 'school_padlet_cards', `miftaah_session_${pinKey}`);
        await setDoc(pinDocRef, {
          pin,
          lesson: cleanLesson,
          lessonId: cleanLesson.id,
          lessonTitle: cleanLesson.title,
          isActive: true,
          activeStationIndex: 1,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    }
  } catch (err) {}

  return true;
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


/**
 * =========================================================================
 * REALTIME CLASSROOM LIVE SESSION SYNC (Firestore School Padlet Mirror)
 * =========================================================================
 */
export const STORAGE_KEY_LIVE_SESSION = 'miftaah_journey_active_session_v3';

export const saveMiftaahLiveSession = async (sessionData) => {
  if (!sessionData) return false;

  const cleanSession = {
    ...sessionData,
    updatedAt: new Date().toISOString()
  };

  // 1. Local Persistence
  try {
    localStorage.setItem(STORAGE_KEY_LIVE_SESSION, JSON.stringify(cleanSession));
  } catch (e) {}

  // 2. Cloud Firestore Mirror (Accessible to all students without auth)
  try {
    const liveDocRef = doc(db, 'school_padlet_cards', 'miftaah_live_session');
    await setDoc(liveDocRef, cleanSession, { merge: true });

    if (cleanSession.pin) {
      const pinKey = String(cleanSession.pin).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (pinKey) {
        const pinDocRef = doc(db, 'school_padlet_cards', `miftaah_session_${pinKey}`);
        await setDoc(pinDocRef, cleanSession, { merge: true });
      }
    }
    return true;
  } catch (err) {
    if (err?.code !== 'permission-denied') {
      console.warn('Live session cloud sync notice:', err);
    }
    return true;
  }
};

export const fetchMiftaahLiveSession = async () => {
  try {
    const liveDocRef = doc(db, 'school_padlet_cards', 'miftaah_live_session');
    const snap = await getDoc(liveDocRef);
    if (snap.exists()) {
      const data = snap.data();
      try {
        localStorage.setItem(STORAGE_KEY_LIVE_SESSION, JSON.stringify(data));
      } catch (e) {}
      return data;
    }
  } catch (err) {
    // Local fallback
  }

  try {
    const cached = localStorage.getItem(STORAGE_KEY_LIVE_SESSION);
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return null;
};

export const fetchMiftaahSessionByPin = async (rawPin) => {
  if (!rawPin) return await fetchMiftaahLiveSession();
  const clean = String(rawPin).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const cleanNumOnly = clean.replace(/[^0-9]/g, '');

  try {
    // 1. Try direct pin doc
    const pinDocRef = doc(db, 'school_padlet_cards', `miftaah_session_${clean}`);
    const snap = await getDoc(pinDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && (data.lesson || data.isActive)) return data;
    }
  } catch (e) {}

  // 1b. Try numeric-only pin doc
  if (cleanNumOnly && cleanNumOnly !== clean) {
    try {
      const numDocRef = doc(db, 'school_padlet_cards', `miftaah_session_${cleanNumOnly}`);
      const snap = await getDoc(numDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data && (data.lesson || data.isActive)) return data;
      }
    } catch (e) {}
  }

  // 2. Try live session doc ONLY if the pin matches or master pin
  const liveSession = await fetchMiftaahLiveSession();
  if (liveSession && liveSession.lesson) {
    const livePin = String(liveSession.pin || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const livePinNum = livePin.replace(/[^0-9]/g, '');
    if (livePin === clean || (cleanNumOnly && livePinNum === cleanNumOnly) || clean === '318212') {
      return liveSession;
    }
  }

  return null;
};

export const listenToMiftaahLiveSession = (callback, rawPin = null) => {
  const getCached = () => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_LIVE_SESSION);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  };

  const clean = rawPin ? String(rawPin).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') : null;
  const targetDocName = clean ? `miftaah_session_${clean}` : 'miftaah_live_session';

  try {
    const sessionDocRef = doc(db, 'school_padlet_cards', targetDocName);
    const unsubTarget = onSnapshot(sessionDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        try {
          localStorage.setItem(STORAGE_KEY_LIVE_SESSION, JSON.stringify(data));
        } catch (e) {}
        if (callback) callback(data);
      } else {
        if (callback) callback(getCached());
      }
    }, () => {
      if (callback) callback(getCached());
    });

    let unsubLive = null;
    if (clean && targetDocName !== 'miftaah_live_session') {
      try {
        const liveDocRef = doc(db, 'school_padlet_cards', 'miftaah_live_session');
        unsubLive = onSnapshot(liveDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const livePin = String(data?.pin || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
            if (livePin === clean) {
              if (callback) callback(data);
            }
          }
        }, () => {});
      } catch (e) {}
    }

    return () => {
      if (unsubTarget) unsubTarget();
      if (unsubLive) unsubLive();
    };
  } catch (e) {
    if (callback) callback(getCached());
    return () => {};
  }
};

/**
 * =========================================================================
 * AUTOMATIC UNIQUE LESSON PIN GENERATOR & DEDUPLICATION
 * =========================================================================
 */

/**
 * Generate a unique 4-digit numeric PIN for a lesson that does not collide with existing lessons.
 */
export const generateUniqueLessonPin = (existingLessons = []) => {
  const usedCodes = new Set();
  if (Array.isArray(existingLessons)) {
    existingLessons.forEach(l => {
      if (l?.pin) usedCodes.add(String(l.pin).trim().toLowerCase());
      if (l?.code) usedCodes.add(String(l.code).trim().toLowerCase());
    });
  }
  try {
    const cached = localStorage.getItem('miftaah_saved_lessons_v3');
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list)) {
        list.forEach(l => {
          if (l?.pin) usedCodes.add(String(l.pin).trim().toLowerCase());
          if (l?.code) usedCodes.add(String(l.code).trim().toLowerCase());
        });
      }
    }
  } catch (e) {}

  // Generate 4-digit code (1000 - 9999) avoiding repetitive or reserved patterns (e.g. 1111, 5555, 1234, 318212)
  for (let i = 0; i < 500; i++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const candidate = String(num);
    const isRepetitive = /^(\d)\1{3}$/.test(candidate);
    if (!usedCodes.has(candidate) && !isRepetitive && candidate !== '1234') {
      return candidate;
    }
  }

  // Fallback to 5-digit number
  return String(Math.floor(10000 + Math.random() * 90000));
};

/**
 * Automatically ensure every lesson in the list has a unique code/pin.
 * If two lessons share the exact same code, a new unique code is assigned to the duplicate.
 */
export const deduplicateLessonCodes = (lessons = []) => {
  if (!Array.isArray(lessons)) return { deduplicated: lessons, hasChanges: false };
  const seenCodes = new Set();
  let hasChanges = false;

  const deduplicated = lessons.map((lesson) => {
    if (!lesson) return lesson;
    const currentCode = String(lesson.code || lesson.pin || '').trim();
    const codeKey = currentCode.toLowerCase();

    // Check if code is missing or duplicate (exempt the exemplar template if only 1 instance)
    const isDuplicate = !currentCode || seenCodes.has(codeKey);
    if (isDuplicate && lesson.id !== 'exemplar_matter_states') {
      const newPin = generateUniqueLessonPin(lessons);
      seenCodes.add(newPin.toLowerCase());
      hasChanges = true;
      return {
        ...lesson,
        code: newPin,
        pin: newPin
      };
    }

    if (currentCode) {
      seenCodes.add(codeKey);
    }
    return lesson;
  });

  return { deduplicated, hasChanges };
};

