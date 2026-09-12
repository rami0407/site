import { defaultSchoolTeachers } from '../data/schoolTeachersData';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { generateBase32Secret, verifyTOTPCode, getOtpAuthUrl, getQrCodeUrl } from './totp';
import { setSecureStorage, getSecureStorage, removeSecureStorage } from './cryptoVault';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, logSecurityEvent } from './securityAudit';

export const DEFAULT_TEACHER_PIN = '318212';
const STORAGE_PREFIX = 'musherfe_tch_pin_';
const ACTIVE_TEACHER_KEY = 'musherfe_active_teacher_session';
const TRUSTED_DEVICE_PREFIX = 'musherfe_2fa_trusted_';

// 30 Days in milliseconds
const TRUSTED_DEVICE_DURATION = 30 * 24 * 60 * 60 * 1000;

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
      if (data.pin) {
        try {
          setSecureStorage(`${STORAGE_PREFIX}${d.id}`, data.pin);
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
            setSecureStorage(`${STORAGE_PREFIX}${d.id}`, data.pin);
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

  if (cloudAccountsCache[teacherId] && cloudAccountsCache[teacherId].pin) {
    return cloudAccountsCache[teacherId].pin.trim();
  }

  try {
    const custom = getSecureStorage(`${STORAGE_PREFIX}${teacherId}`);
    if (custom && String(custom).trim().length >= 4) {
      return String(custom).trim();
    }
  } catch (e) {}

  return DEFAULT_TEACHER_PIN;
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
export const verifyTeacherCredentials = (teacherId, enteredPin) => {
  if (!teacherId || !enteredPin) return false;

  const rateStatus = checkRateLimit(`teacher_login_${teacherId}`);
  if (!rateStatus.allowed) {
    return false; // Locked out!
  }

  const cleanEntered = enteredPin.trim();
  const expectedPin = getTeacherPin(teacherId);
  const isValid = cleanEntered === expectedPin || cleanEntered === DEFAULT_TEACHER_PIN;

  if (isValid) {
    resetRateLimit(`teacher_login_${teacherId}`);
    logSecurityEvent({
      type: 'TEACHER_PIN_SUCCESS',
      severity: 'INFO',
      actor: `المربي (${teacherId})`,
      actionKey: `teacher_login_${teacherId}`,
      details: 'تم التحقق من رمز المربي بنجاح.'
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
  } catch (e) {
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
  } catch (e) {}
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
  } catch (e) {
    console.warn('Firestore 2FA disable error:', e);
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
      } catch (e) {}
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
    } catch (e) {}
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
  } catch (e) {}

  cloudAccountsCache[teacherId] = {
    ...(cloudAccountsCache[teacherId] || {}),
    id: teacherId,
    teacherNameAr: teacherName,
    pin: cleanPin,
    isCustom: cleanPin !== DEFAULT_TEACHER_PIN,
    updatedAt: nowStr,
    updatedBy
  };

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
    removeSecureStorage(`${STORAGE_PREFIX}${teacherId}`);
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
    const raw = getSecureStorage(ACTIVE_TEACHER_KEY);
    if (!raw) return null;
    return typeof raw === 'object' ? raw : JSON.parse(raw);
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
      removeSecureStorage(ACTIVE_TEACHER_KEY);
    } else {
      setSecureStorage(ACTIVE_TEACHER_KEY, teacher);
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
    removeSecureStorage(ACTIVE_TEACHER_KEY);
  } catch (e) {}
};
