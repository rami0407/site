import { defaultSchoolTeachers } from '../data/schoolTeachersData';
import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, onSnapshot, addDoc, updateDoc, deleteField } from 'firebase/firestore';
import { generateBase32Secret, verifyTOTPCode } from './totp';
import { setSecureStorage, getSecureStorage, removeSecureStorage, hashPin, verifyPinHash } from './cryptoVault';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, logSecurityEvent } from './securityAudit';

export const DEFAULT_TEACHER_PIN = '318212';
export const COORDINATOR_TEACHER_PIN = '031693872';
export const PRINCIPAL_MASTER_PIN = 'rami318212';
export const DEFAULT_CUSTOM_TEACHER_PINS = {
  tch_1: '482917305',
  tch_2: '061285227',
  tch_3: '739104628',
  tch_4: '516283940',
  tch_5: '847392165',
  tch_6: '295841703',
  tch_7: '614729583',
  tch_8: '938261475',
  tch_9: '174958236',
  tch_10: '562049187',
  tch_11: '803617492',
  tch_12: '349182650',
  tch_13: '725409813',
  tch_14: '491836275',
  tch_15: '658274910',
  tch_16: '217593846',
  tch_17: '031693872',
  tch_18: '904728351',
  tch_19: '386154927',
  tch_20: '547920618',
  tch_21: '819365472',
  tch_22: '263847195',
  tch_23: '741608529',
  tch_24: '458291736',
  tch_25: '692473815',
  tch_26: '135829467',
  tch_27: '874196230',
  tch_28: '329651847',
  tch_29: '583914726',
  tch_30: '916482375',
  tch_31: '407265891',
  tch_32: '671538249',
  tch_33: '248917635',
  tch_34: '795340182',
  tch_35: '362789415',
  tch_36: 'rami318212'
};
const STORAGE_PREFIX = 'musherfe_tch_pin_';
const ACTIVE_TEACHER_KEY = 'musherfe_active_teacher_session';
const TRUSTED_DEVICE_PREFIX = 'musherfe_2fa_trusted_';

// 30 Days in milliseconds
const TRUSTED_DEVICE_DURATION = 30 * 24 * 60 * 60 * 1000;

// In-memory cache of cloud PINs & metadata
let cloudAccountsCache = {};

// Dynamic custom teachers storage key
const CUSTOM_TEACHERS_KEY = 'musherfe_custom_teachers_v1';
let customTeachersCache = [];

try {
  const savedCustom = getSecureStorage(CUSTOM_TEACHERS_KEY, []);
  if (Array.isArray(savedCustom)) customTeachersCache = savedCustom;
} catch {
  customTeachersCache = [];
}

// ==================== GLOBAL LIVE TEACHER PROFILES CACHE ====================
const TEACHER_PROFILES_STORAGE_KEY = 'musherfe_teacher_profiles_v1';
const TAB_TEACHER_SESSION_KEY = 'musherfe_tab_teacher_session_v1';
let teacherProfilesCache = {};
let profilesListenerStarted = false;

try {
  const savedProfiles = getSecureStorage(TEACHER_PROFILES_STORAGE_KEY, {});
  if (savedProfiles && typeof savedProfiles === 'object') {
    teacherProfilesCache = savedProfiles;
  }
} catch {
  teacherProfilesCache = {};
}

const mergeTeacherWithProfile = (t) => {
  if (!t || !t.id) return t;
  const prof = teacherProfilesCache[t.id];
  if (!prof) return t;
  const merged = {
    ...t,
    email: prof.email !== undefined && prof.email !== '' ? prof.email : t.email,
    phone: prof.phone !== undefined && prof.phone !== '' ? prof.phone : t.phone,
    role: prof.role !== undefined && prof.role !== '' ? prof.role : t.role,
    photoUrl: prof.photoUrl || t.photoUrl || '',
    subjects: prof.subjects || t.subjects || '',
    bio: prof.bio || t.bio || '',
    receptionHours: prof.receptionHours || t.receptionHours || '',
    profileUpdatedAt: prof.updatedAt || null
  };
  merged.displayName = `${merged.nameAr || merged.nameHe} (${merged.nameHe || merged.nameAr})`;
  return merged;
};

// In-memory cache of mapped teachers with stable reference
const CACHED_TEACHERS = defaultSchoolTeachers.map(t => ({
  ...t,
  displayName: `${t.nameAr} (${t.nameHe})`
}));

/**
 * Get all available school teachers (merged with live profile updates across the entire site)
 */
export const getAllTeachers = () => {
  const baseList = CACHED_TEACHERS.map(mergeTeacherWithProfile);
  if (!customTeachersCache || customTeachersCache.length === 0) return baseList;
  const existingIds = new Set(baseList.map(t => t.id));
  const extras = customTeachersCache
    .filter(t => t && t.id && !existingIds.has(t.id))
    .map(t => mergeTeacherWithProfile({
      ...t,
      displayName: `${t.nameAr || t.nameHe} (${t.nameHe || t.nameAr})`
    }));
  return [...baseList, ...extras];
};

/**
 * Start real-time Firestore listener for all teacher profiles so updates appear live across the whole site
 */
export const initTeacherProfilesSync = () => {
  if (profilesListenerStarted) return;
  profilesListenerStarted = true;
  try {
    const sharedRef = doc(db, 'students', 'teacher_profiles_v1');
    onSnapshot(sharedRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const profilesMap = data?.profiles || {};
        if (profilesMap && typeof profilesMap === 'object') {
          teacherProfilesCache = { ...teacherProfilesCache, ...profilesMap };
          try {
            setSecureStorage(TEACHER_PROFILES_STORAGE_KEY, teacherProfilesCache);
          } catch {}
          // Keep current tab session synced with latest profile data
          try {
            const tabSess = getTabTeacherSession();
            if (tabSess && tabSess.id && profilesMap[tabSess.id]) {
              const refreshed = mergeTeacherWithProfile(tabSess);
              sessionStorage.setItem(TAB_TEACHER_SESSION_KEY, JSON.stringify(refreshed));
              setActiveTeacherSession(refreshed);
            }
          } catch {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('teacherProfileUpdated'));
          }
        }
      }
    }, () => {});
  } catch (e) {
    console.warn('Teacher profiles listener note:', e);
  }
};

/**
 * Get a teacher's live profile object
 */
export const getTeacherProfile = (teacherId) => {
  if (!teacherId) return null;
  const base = getTeacherById(teacherId);
  return base ? mergeTeacherWithProfile(base) : (teacherProfilesCache[teacherId] || null);
};

/**
 * Save and broadcast a teacher's profile updates (photo, email, phone, role, subjects, bio, receptionHours)
 * immediately across the entire school website!
 */
export const saveTeacherProfile = async (teacherId, profileFields = {}) => {
  if (!teacherId) return { success: false, error: 'Missing teacher ID' };
  const nowIso = new Date().toISOString();
  const nextProfile = {
    ...(teacherProfilesCache[teacherId] || {}),
    ...profileFields,
    updatedAt: nowIso
  };
  teacherProfilesCache = {
    ...teacherProfilesCache,
    [teacherId]: nextProfile
  };

  try {
    setSecureStorage(TEACHER_PROFILES_STORAGE_KEY, teacherProfilesCache);
  } catch {}

  // Update current active sessions so UI updates immediately
  const updatedFull = getTeacherById(teacherId);
  if (updatedFull) {
    try {
      const tabSess = getTabTeacherSession();
      if (tabSess && tabSess.id === teacherId) {
        const mergedSess = { ...tabSess, ...updatedFull };
        sessionStorage.setItem(TAB_TEACHER_SESSION_KEY, JSON.stringify(mergedSess));
        setActiveTeacherSession(mergedSess);
      }
    } catch {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('teacherProfileUpdated'));
    window.dispatchEvent(new Event('teacherAuthChanged'));
  }

  try {
    // Primary shared channel readable & writable across the whole site
    await setDoc(
      doc(db, 'students', 'teacher_profiles_v1'),
      { profiles: { [teacherId]: nextProfile }, updatedAt: nowIso },
      { merge: true }
    );
    // Mirror to dedicated teacher_profiles collection if permitted
    setDoc(doc(db, 'teacher_profiles', teacherId), nextProfile, { merge: true }).catch(() => {});
    return { success: true, profile: updatedFull || nextProfile };
  } catch (err) {
    console.warn('Teacher profile cloud save note:', err);
    return { success: true, localOnly: true, profile: updatedFull || nextProfile };
  }
};

/**
 * Tab-scoped active teacher session (persists while navigating between Profile, Holistic Mapping & site tools,
 * but requires fresh login in a new tab or after logout)
 */
export const getTabTeacherSession = () => {
  try {
    const raw = sessionStorage.getItem(TAB_TEACHER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.id ? mergeTeacherWithProfile(parsed) : null;
  } catch {
    return null;
  }
};

export const setTabTeacherSession = (teacher) => {
  try {
    if (!teacher) {
      sessionStorage.removeItem(TAB_TEACHER_SESSION_KEY);
      removeSecureStorage(ACTIVE_TEACHER_KEY);
    } else {
      const merged = mergeTeacherWithProfile(teacher);
      sessionStorage.setItem(TAB_TEACHER_SESSION_KEY, JSON.stringify(merged));
      setActiveTeacherSession(merged);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('teacherAuthChanged'));
    }
  } catch (err) {
    console.warn('Tab session save note:', err);
  }
};

export const clearTabTeacherSession = () => {
  try {
    sessionStorage.removeItem(TAB_TEACHER_SESSION_KEY);
    removeSecureStorage(ACTIVE_TEACHER_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('teacherAuthChanged'));
    }
  } catch {}
};

/**
 * Sync custom teachers list from cloud config or admin panel
 */
export const syncCustomTeachersList = (customList = []) => {
  if (!Array.isArray(customList)) return getAllTeachers();
  customTeachersCache = customList;
  try {
    setSecureStorage(CUSTOM_TEACHERS_KEY, customList);
  } catch {
    // Storage fallback
  }
  customList.forEach(t => {
    if (t && t.id && t.pin) {
      DEFAULT_CUSTOM_TEACHER_PINS[t.id] = String(t.pin).trim();
    }
  });
  return getAllTeachers();
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
 * Find a teacher by Email (supports official email, aliases, or principal email)
 */
export const findTeacherByEmail = (email) => {
  if (!email) return null;
  const clean = email.trim().toLowerCase();
  const teachers = getAllTeachers();
  
  // 1. Direct email match
  let found = teachers.find(t => t.email && t.email.trim().toLowerCase() === clean);
  if (found) return found;

  // 2. Principal / admin email aliases
  if (clean === 'admin@musherfe.com' || clean === 'rami@musherfe.com' || clean === 'principal@musherfe.com' || clean === 'rami@musheirifa.edu.hl' || clean === 'rami0407@gmail.com') {
    const principal = teachers.find(t => t.id === 'tch_36' || (t.nameAr && t.nameAr.includes('رامي')));
    if (principal) return principal;
  }

  // 3. Match username prefix (e.g. "teacher1" or "teacher36")
  const prefix = clean.split('@')[0];
  if (prefix) {
    found = teachers.find(t => t.email && t.email.split('@')[0].toLowerCase() === prefix);
    if (found) return found;
  }

  // 4. Fallback search by name if user typed their name into email field
  return findTeacherByName(clean);
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
      if (data.pin) {
        try {
          setSecureStorage(`${STORAGE_PREFIX}${d.id}`, data.pin);
        } catch {
          // Storage fallback
        }
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
            setSecureStorage(`${STORAGE_PREFIX}${d.id}`, data.pin);
          } catch {
            // Storage fallback
          }
        }
      });
      cloudAccountsCache = { ...cloudAccountsCache, ...accounts };
      if (callback) callback(cloudAccountsCache);
    }, (err) => {
      if (err?.code !== 'permission-denied') console.warn('Realtime teacher accounts listener note:', err);
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
  if (teacherId === 'tch_17') return COORDINATOR_TEACHER_PIN;

  if (cloudAccountsCache[teacherId] && cloudAccountsCache[teacherId].pin) {
    return cloudAccountsCache[teacherId].pin.trim();
  }

  try {
    const custom = getSecureStorage(`${STORAGE_PREFIX}${teacherId}`);
    if (custom && String(custom).trim().length >= 4) {
      return String(custom).trim();
    }
  } catch {
    // Storage fallback
  }

  return DEFAULT_CUSTOM_TEACHER_PINS[teacherId] || DEFAULT_TEACHER_PIN;
};

/**
 * Get complete details of a teacher account (PIN, status, 2FA, last update)
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
    twoFactorEnabled: !!cloudData.twoFactorEnabled,
    twoFactorSecret: cloudData.twoFactorSecret || null,
    emergencyCode: cloudData.emergencyCode || null,
    pendingOtp: cloudData.pendingOtp || null,
    updatedAt: cloudData.updatedAt || null,
    updatedBy: cloudData.updatedBy || (isCustom ? 'المربي' : 'النظام (افتراضي)')
  };
};

/**
 * Check rate limit status for a teacher login
 */
export const checkTeacherLoginRateLimit = (teacherId) => {
  return checkRateLimit(`teacher_login_${teacherId}`);
};

/**
 * Verify teacher login credentials (Stage 1: PIN) with Brute-Force Rate Limiting
 */
export const verifyTeacherCredentials = async (teacherId, enteredPin) => {
  if (!teacherId || !enteredPin) return false;

  const rateStatus = checkRateLimit(`teacher_login_${teacherId}`);
  if (!rateStatus.allowed) {
    return false; // Locked out!
  }

  const cleanEntered = enteredPin.trim();
  // Principal Rami unified master code verification
  if (teacherId === 'tch_36' && cleanEntered === PRINCIPAL_MASTER_PIN) {
    resetRateLimit(`teacher_login_${teacherId}`);
    return true;
  }
  // Coordinator Itab Bayadsi verification
  if (teacherId === 'tch_17' || teacherId === 't2') {
    if (cleanEntered === COORDINATOR_TEACHER_PIN || cleanEntered === DEFAULT_TEACHER_PIN) {
      resetRateLimit(`teacher_login_${teacherId}`);
      return true;
    }
  }
  let account = cloudAccountsCache[teacherId];

  // If account is not yet loaded in cache, fetch directly from Firestore (never blindly fallback to default PIN)
  if (!account) {
    try {
      const docSnap = await getDoc(doc(db, 'teacher_accounts', teacherId));
      if (docSnap.exists()) {
        account = docSnap.data();
        cloudAccountsCache[teacherId] = account;
      }
    } catch (e) {
      if (e?.code !== 'permission-denied') console.warn('Teacher cloud account direct fetch notice:', e);
    }
  }

  let isValid = false;

  // 1. If teacher customized their PIN and has a custom pinHash or pin, verify against it
  if (account && account.isCustom) {
    if (account.pinHash) {
      isValid = await verifyPinHash(cleanEntered, account.pinHash, teacherId);
    } else if (account.pin) {
      isValid = (cleanEntered === account.pin.toString().trim());
    }
  }

  // 2. Default unified password for all school teachers (318212)
  if (!isValid) {
    const expectedDefaultPin = DEFAULT_CUSTOM_TEACHER_PINS[teacherId] || DEFAULT_TEACHER_PIN;
    if (cleanEntered === expectedDefaultPin) {
      isValid = true;
    } else {
      const defaultHash = await hashPin(DEFAULT_TEACHER_PIN, teacherId);
      const enteredHash = await hashPin(cleanEntered, teacherId);
      isValid = (enteredHash === defaultHash) || 
                (account && account.pin && cleanEntered === account.pin.toString().trim()) ||
                (account && account.pinHash && await verifyPinHash(cleanEntered, account.pinHash, teacherId));
    }
  }

  if (isValid) {
    resetRateLimit(`teacher_login_${teacherId}`);
    logSecurityEvent({
      type: 'TEACHER_PIN_SUCCESS',
      severity: 'INFO',
      actor: `المربي (${teacherId})`,
      actionKey: `teacher_login_${teacherId}`,
      details: 'تم التحقق من رمز المربي بنجاح عبر البصمة المشفرة أو الرمز الموحد للمدرسة.'
    });
  } else {
    recordFailedAttempt(`teacher_login_${teacherId}`, {
      actor: `المربي (${teacherId})`,
      details: 'محاولة إدخال رمز غير صحيح لمعلم.'
    });
  }

  return isValid;
};

/**
 * =========================================================================
 * TWO-FACTOR AUTHENTICATION (2FA) LOGIC
 * =========================================================================
 */

/**
 * Check if 2FA is active/required for this teacher
 */
export const isTeacher2FAEnabled = (teacherId) => {
  const details = getTeacherAccountDetails(teacherId);
  return details.twoFactorEnabled === true;
};

/**
 * Check if the current browser/device is recognized as trusted (within 30 days)
 */
export const isDeviceTrusted = (teacherId) => {
  if (!teacherId) return false;
  try {
    const stored = getSecureStorage(`${TRUSTED_DEVICE_PREFIX}${teacherId}`);
    if (!stored) return false;
    const parsed = typeof stored === 'object' ? stored : JSON.parse(stored);
    if (parsed && parsed.timestamp) {
      const elapsed = Date.now() - parsed.timestamp;
      return elapsed < TRUSTED_DEVICE_DURATION;
    }
  } catch {
    return false;
  }
  return false;
};

/**
 * Set the current device as trusted for 30 days
 */
export const setDeviceTrusted = (teacherId, isTrusted = true) => {
  if (!teacherId) return;
  try {
    if (isTrusted) {
      setSecureStorage(
        `${TRUSTED_DEVICE_PREFIX}${teacherId}`,
        { timestamp: Date.now() }
      );
    } else {
      removeSecureStorage(`${TRUSTED_DEVICE_PREFIX}${teacherId}`);
    }
  } catch {
    // Storage fallback
  }
};

/**
 * Get or initialize 2FA secret for teacher setup
 */
export const getOrCreateTeacher2FASecret = (teacherId) => {
  const details = getTeacherAccountDetails(teacherId);
  if (details.twoFactorSecret) {
    return details.twoFactorSecret;
  }
  return generateBase32Secret(16);
};

/**
 * Enable 2FA for a teacher
 */
export const enableTeacher2FA = async (teacherId, secret) => {
  if (!teacherId || !secret) return false;
  const nowStr = new Date().toISOString();

  cloudAccountsCache[teacherId] = {
    ...(cloudAccountsCache[teacherId] || {}),
    twoFactorEnabled: true,
    twoFactorSecret: secret,
    twoFactorEnabledAt: nowStr
  };

  try {
    await setDoc(
      doc(db, 'teacher_accounts', teacherId),
      {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorEnabledAt: nowStr
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Firestore 2FA enable error:', e);
  }
  return true;
};

/**
 * Disable 2FA for a teacher (by teacher or admin)
 */
export const disableTeacher2FA = async (teacherId, by = 'المربي') => {
  if (!teacherId) return false;
  cloudAccountsCache[teacherId] = {
    ...(cloudAccountsCache[teacherId] || {}),
    twoFactorEnabled: false
  };

  try {
    await setDoc(
      doc(db, 'teacher_accounts', teacherId),
      {
        twoFactorEnabled: false
      },
      { merge: true }
    );

    logSecurityEvent({
      type: 'TEACHER_2FA_DISABLED',
      severity: 'WARNING',
      actor: by,
      target: teacherId,
      details: `تم تعطيل التحقق الثنائي للمعلم (${teacherId}) بواسطة ${by}.`
    });
  } catch (err) {
    console.warn('Firestore 2FA disable error:', err);
  }
  return true;
};

/**
 * Generate a 6-digit WhatsApp OTP for a teacher (valid 5 minutes)
 */
export const generateWhatsAppOTP = async (teacherId) => {
  if (!teacherId) return null;
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

  const otpData = {
    code: otpCode,
    expiresAt,
    createdAt: new Date().toISOString()
  };

  cloudAccountsCache[teacherId] = {
    ...(cloudAccountsCache[teacherId] || {}),
    pendingOtp: otpData
  };

  try {
    await setDoc(
      doc(db, 'teacher_accounts', teacherId),
      { pendingOtp: otpData },
      { merge: true }
    );
  } catch (e) {
    console.warn('Firestore OTP save note:', e);
  }

  return {
    code: otpCode,
    expiresAt
  };
};

/**
 * Generate an Emergency Bypass Code for a teacher (Created by Principal in Admin Panel)
 */
export const generateAdminEmergencyCode = async (teacherId) => {
  if (!teacherId) return null;
  const emergencyCode = Math.floor(100000 + Math.random() * 900000).toString();
  const nowStr = new Date().toISOString();

  const emergencyData = {
    code: emergencyCode,
    createdAt: nowStr,
    used: false
  };

  cloudAccountsCache[teacherId] = {
    ...(cloudAccountsCache[teacherId] || {}),
    emergencyCode: emergencyData
  };

  try {
    await setDoc(
      doc(db, 'teacher_accounts', teacherId),
      { emergencyCode: emergencyData },
      { merge: true }
    );
  } catch (e) {
    console.warn('Emergency code save error:', e);
  }

  return emergencyCode;
};

/**
 * Verify Stage 2: 2FA Code (Supports Google Authenticator TOTP, WhatsApp OTP, and Admin Emergency Code)
 */
/**
 * Verify Stage 2: 2FA Code (Supports Google Authenticator TOTP, WhatsApp OTP, and Admin Emergency Code)
 */
export const verifyTeacher2FACode = async (teacherId, enteredCode) => {
  if (!teacherId || !enteredCode) return { success: false, reason: 'الرمز مطلوب' };

  const rateStatus = checkRateLimit(`teacher_2fa_${teacherId}`);
  if (!rateStatus.allowed) {
    return { 
      success: false, 
      reason: `تم قفل الحساب لمدة ${rateStatus.minutesLeft} دقيقة بعد 5 محاولات خاطئة متتالية. يرجى الانتظار أو مراجعة المدير.`,
      isLocked: true,
      minutesLeft: rateStatus.minutesLeft
    };
  }

  const clean = enteredCode.toString().trim();
  const details = getTeacherAccountDetails(teacherId);

  // 1. Verify via Google Authenticator TOTP if secret is set
  if (details.twoFactorSecret) {
    const isTotpValid = await verifyTOTPCode(details.twoFactorSecret, clean);
    if (isTotpValid) {
      resetRateLimit(`teacher_2fa_${teacherId}`);
      logSecurityEvent({
        type: 'TEACHER_2FA_SUCCESS',
        severity: 'INFO',
        actor: `المربي (${teacherId})`,
        actionKey: `teacher_2fa_${teacherId}`,
        details: 'تم التحقق الثنائي عبر Google Authenticator بنجاح.'
      });
      return { success: true, method: 'totp' };
    }
  }

  // 2. Verify via Pending WhatsApp OTP (Valid 5 mins)
  if (details.pendingOtp && details.pendingOtp.code === clean) {
    if (Date.now() <= details.pendingOtp.expiresAt) {
      // Consume OTP
      try {
        await updateDoc(doc(db, 'teacher_accounts', teacherId), { pendingOtp: null });
      } catch {
        // Non-fatal update error
      }
      resetRateLimit(`teacher_2fa_${teacherId}`);
      logSecurityEvent({
        type: 'TEACHER_2FA_SUCCESS',
        severity: 'INFO',
        actor: `المربي (${teacherId})`,
        actionKey: `teacher_2fa_${teacherId}`,
        details: 'تم التحقق الثنائي عبر WhatsApp OTP بنجاح.'
      });
      return { success: true, method: 'whatsapp_otp' };
    } else {
      return { success: false, reason: 'انتهت صلاحية رمز التحقق المؤقت، يرجى طلب رمز جديد.' };
    }
  }

  // 3. Verify via Admin Emergency Code
  if (details.emergencyCode && details.emergencyCode.code === clean && !details.emergencyCode.used) {
    // Mark as used
    try {
      await updateDoc(doc(db, 'teacher_accounts', teacherId), {
        'emergencyCode.used': true,
        'emergencyCode.usedAt': new Date().toISOString()
      });
    } catch {
      // Non-fatal update error
    }
    resetRateLimit(`teacher_2fa_${teacherId}`);
    logSecurityEvent({
      type: 'TEACHER_2FA_EMERGENCY_USED',
      severity: 'WARNING',
      actor: `المربي (${teacherId})`,
      actionKey: `teacher_2fa_${teacherId}`,
      details: 'تم التحقق والدخول بواسطة رمز الطوارئ الإداري.'
    });
    return { success: true, method: 'admin_emergency' };
  }

  // Record failed attempt
  const failRes = await recordFailedAttempt(`teacher_2fa_${teacherId}`, {
    actor: `المربي (${teacherId})`,
    details: 'محاولة إدخال كود 2FA غير صحيح للمعلم.'
  });

  if (failRes && failRes.isLocked) {
    return {
      success: false,
      reason: 'تم قفل الحساب لمدة 15 دقيقة بعد 5 محاولات خاطئة متتالية. يرجى الانتظار أو مراجعة المدير.',
      isLocked: true,
      minutesLeft: 15
    };
  }

  return { 
    success: false, 
    reason: `رمز التحقق الثنائي غير صحيح. (المحاولات المتبقية: ${failRes.remainingAttempts})`,
    remainingAttempts: failRes.remainingAttempts
  };
};

/**
 * Update teacher's personal PIN
 */
export const updateTeacherPin = async (teacherId, newPin, updatedBy = 'المربي (خدمة ذاتية)') => {
  if (!teacherId || !newPin || newPin.trim().length < 4) {
    throw new Error('يجب أن تكون كلمة المرور 4 خانات على الأقل.');
  }

  const cleanPin = newPin.trim();
  const teacher = getTeacherById(teacherId);
  const teacherName = teacher ? teacher.nameAr : teacherId;
  const nowStr = new Date().toISOString();

  try {
    setSecureStorage(`${STORAGE_PREFIX}${teacherId}`, cleanPin);
  } catch {
    // Storage fallback
  }

  const pinHash = await hashPin(cleanPin, teacherId);

  cloudAccountsCache[teacherId] = {
    ...(cloudAccountsCache[teacherId] || {}),
    id: teacherId,
    teacherNameAr: teacherName,
    pinHash,
    isCustom: cleanPin !== DEFAULT_TEACHER_PIN,
    updatedAt: nowStr,
    updatedBy
  };

  try {
    await setDoc(doc(db, 'teacher_accounts', teacherId), {
      id: teacherId,
      nameAr: teacherName,
      nameHe: teacher ? teacher.nameHe : '',
      pin: deleteField(), // Physically delete legacy plaintext pin from Firestore
      pinHash,
      isCustom: cleanPin !== DEFAULT_TEACHER_PIN,
      updatedAt: nowStr,
      updatedBy
    }, { merge: true });
  } catch (err) {
    console.warn('Teacher PIN cloud sync warning:', err);
  }

  logSecurityEvent({
    type: 'TEACHER_PIN_CHANGED',
    severity: 'INFO',
    actor: updatedBy,
    target: teacherName,
    details: `تم تحديث رمز الدخول للمعلم/ة ${teacherName}.`
  });

  try {
    await addDoc(collection(db, 'messages'), {
      type: 'teacher_pwd_update',
      teacherId,
      teacherName,
      status: 'updated',
      updatedBy,
      updatedAt: nowStr,
      source: 'teacherAuth'
    });
  } catch {
    // Non-fatal message log
  }

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
    removeSecureStorage(`${STORAGE_PREFIX}${teacherId}`);
  } catch {
    // Storage fallback
  }

  const teacher = getTeacherById(teacherId);
  const teacherName = teacher ? teacher.nameAr : teacherId;
  const nowStr = new Date().toISOString();

  const defaultHash = await hashPin(DEFAULT_TEACHER_PIN, teacherId);

  cloudAccountsCache[teacherId] = {
    ...(cloudAccountsCache[teacherId] || {}),
    id: teacherId,
    teacherNameAr: teacherName,
    pinHash: defaultHash,
    isCustom: false,
    updatedAt: nowStr,
    updatedBy: resetBy
  };

  try {
    await setDoc(doc(db, 'teacher_accounts', teacherId), {
      id: teacherId,
      nameAr: teacherName,
      nameHe: teacher ? teacher.nameHe : '',
      pin: deleteField(), // Physically delete legacy plaintext pin from Firestore
      pinHash: defaultHash,
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
    const raw = getSecureStorage(ACTIVE_TEACHER_KEY);
    if (!raw) return null;
    return typeof raw === 'object' ? raw : JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Save active logged-in teacher session
 */
export const setActiveTeacherSession = (teacher) => {
  try {
    if (!teacher) {
      removeSecureStorage(ACTIVE_TEACHER_KEY);
    } else {
      setSecureStorage(ACTIVE_TEACHER_KEY, teacher);
    }
  } catch (err) {
    console.warn('Session save error:', err);
  }
};

/**
 * Logout active teacher
 */
export const logoutTeacherSession = () => {
  try {
    removeSecureStorage(ACTIVE_TEACHER_KEY);
  } catch {
    // Logout fallback
  }
};


export const isCoordinatorTeacher = (teacher) => {
  if (!teacher) return false;
  const id = typeof teacher === 'string' ? teacher : (teacher.id || '');
  const name = typeof teacher === 'object' ? (teacher.nameAr || teacher.nameHe || '') : teacher;
  return (
    id === 'tch_17' || 
    id === 't2' || 
    name.includes('عتاب') || 
    name.includes('עתאב') || 
    name.includes('بيادسة') || 
    name.includes('بيدوسي')
  );
};

export const verifyCoordinatorPin = (enteredPin) => {
  const clean = (enteredPin || '').trim();
  return clean === COORDINATOR_TEACHER_PIN || clean === DEFAULT_TEACHER_PIN;
};
