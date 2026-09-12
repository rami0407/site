/**
 * Musheirifa School - Central Security, Audit, and Threat Protection Engine
 * 
 * Features:
 * 1. Smart Brute-Force Protection & Rate Limiting (5 attempts / 15-minute lockout)
 * 2. Real-Time Cloud Security Audit Trail (Firestore collection: `security_audit_logs`)
 * 3. Invisible Honeypot Trap for Bot & Spam Detection
 * 4. Field-Level Client-Side Transparent Encryption / Decryption
 * 5. Field Guard Device Authorization & Pairing Token Engine
 */

import { db } from '../firebase';
import { collection, addDoc, doc, setDoc, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { 
  getSecureStorage, 
  setSecureStorage, 
  removeSecureStorage, 
  encryptString, 
  decryptString 
} from './cryptoVault';
import { broadcastSchoolNotification } from './notificationService';

// =========================================================================
// 1. Smart Brute-Force Protection & Rate Limiting Engine
// =========================================================================

const RATE_LIMIT_PREFIX = 'sec_ratelimit_';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 Minutes

/**
 * Check if an action is currently rate-limited/locked
 * @param {string} actionKey Identifier (e.g. 'teacher_tch_01', 'admin_login', 'guard_pin')
 * @returns {{ allowed: boolean, attempts: number, remainingAttempts: number, isLocked: boolean, minutesLeft: number }}
 */
export const checkRateLimit = (actionKey) => {
  if (!actionKey) return { allowed: true, attempts: 0, remainingAttempts: MAX_FAILED_ATTEMPTS, isLocked: false, minutesLeft: 0 };

  const storageKey = `${RATE_LIMIT_PREFIX}${actionKey}`;
  const record = getSecureStorage(storageKey);

  if (!record || typeof record !== 'object') {
    return {
      allowed: true,
      attempts: 0,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
      isLocked: false,
      minutesLeft: 0
    };
  }

  const now = Date.now();

  // If locked, check if lockout duration has passed
  if (record.lockedUntil && record.lockedUntil > now) {
    const msLeft = record.lockedUntil - now;
    const minutesLeft = Math.max(1, Math.ceil(msLeft / 60000));
    return {
      allowed: false,
      attempts: record.attempts || MAX_FAILED_ATTEMPTS,
      remainingAttempts: 0,
      isLocked: true,
      minutesLeft
    };
  }

  // If lockout expired, auto-reset
  if (record.lockedUntil && record.lockedUntil <= now) {
    resetRateLimit(actionKey);
    return {
      allowed: true,
      attempts: 0,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
      isLocked: false,
      minutesLeft: 0
    };
  }

  const attempts = record.attempts || 0;
  const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - attempts);

  return {
    allowed: attempts < MAX_FAILED_ATTEMPTS,
    attempts,
    remainingAttempts,
    isLocked: attempts >= MAX_FAILED_ATTEMPTS,
    minutesLeft: 0
  };
};

/**
 * Record a failed attempt for an action
 * If threshold reached, triggers 15-minute lock and security audit event
 */
export const recordFailedAttempt = async (actionKey, meta = {}) => {
  if (!actionKey) return;
  const storageKey = `${RATE_LIMIT_PREFIX}${actionKey}`;
  const current = getSecureStorage(storageKey) || { attempts: 0 };
  const newAttempts = (current.attempts || 0) + 1;
  const now = Date.now();

  let lockedUntil = null;
  let isNowLocked = false;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    lockedUntil = now + LOCKOUT_DURATION_MS;
    isNowLocked = true;
  }

  setSecureStorage(storageKey, {
    attempts: newAttempts,
    lastAttempt: now,
    lockedUntil
  });

  // Log audit event
  await logSecurityEvent({
    type: isNowLocked ? 'BRUTE_FORCE_LOCKOUT' : 'AUTH_FAILED',
    severity: isNowLocked ? 'CRITICAL' : 'WARNING',
    actionKey,
    attempts: newAttempts,
    isLocked: isNowLocked,
    ...meta
  });

  // If locked, broadcast alert to admin
  if (isNowLocked) {
    try {
      await broadcastSchoolNotification({
        title: '🚨 تنبيه أمني: تفعيل القفل ضد محاولات التخمين',
        body: `تم تفعيل قفل الحماية لمدة 15 دقيقة بعد 5 محاولات دخول خاطئة متتالية (${actionKey}).`,
        targetUrl: '#admin',
        category: 'announcement',
        priority: 'urgent',
        theme: 'red'
      });
    } catch (e) {}
  }

  return {
    isLocked: isNowLocked,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - newAttempts),
    minutesLeft: isNowLocked ? 15 : 0
  };
};

/**
 * Reset rate limit counter on successful login/action
 */
export const resetRateLimit = (actionKey) => {
  if (!actionKey) return;
  removeSecureStorage(`${RATE_LIMIT_PREFIX}${actionKey}`);
};

// =========================================================================
// 2. Real-Time Cloud Security Audit Trail
// =========================================================================

const AUDIT_COLLECTION = 'security_audit_logs';

/**
 * Detect client environment metadata for audit logging
 */
const getClientSecurityMeta = () => {
  if (typeof window === 'undefined') return { platform: 'Unknown', browser: 'Unknown', isMobile: false };

  const ua = navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  
  let browser = 'Chrome/Other';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  let platform = 'Desktop';
  if (ua.includes('iPhone')) platform = 'iPhone';
  else if (ua.includes('iPad')) platform = 'iPad';
  else if (ua.includes('Android')) platform = 'Android';
  else if (ua.includes('Windows')) platform = 'Windows';
  else if (ua.includes('Mac')) platform = 'macOS';

  let deviceId = localStorage.getItem('school_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem('school_device_id', deviceId);
  }

  return {
    browser,
    platform,
    isMobile,
    deviceId,
    screenRes: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'unknown'
  };
};

/**
 * Log a security event to Firestore and local fallback
 */
export const logSecurityEvent = async ({
  type = 'GENERIC_SECURITY_EVENT',
  severity = 'INFO', // 'INFO' | 'WARNING' | 'CRITICAL'
  actor = 'زائر مجهول',
  actionKey = '',
  details = '',
  target = '',
  metadata = {}
}) => {
  const clientMeta = getClientSecurityMeta();
  const eventRecord = {
    type,
    severity,
    actor,
    actionKey,
    details: typeof details === 'object' ? JSON.stringify(details) : String(details),
    target,
    ...clientMeta,
    ...metadata,
    timestamp: new Date().toISOString(),
    epoch: Date.now()
  };

  try {
    await addDoc(collection(db, AUDIT_COLLECTION), eventRecord);
  } catch (err) {
    console.warn('Security audit cloud write notice (using local backup):', err.message);
  }

  // Keep a local encrypted ring buffer of the last 20 events
  try {
    const localHistory = getSecureStorage('sec_audit_local_buffer') || [];
    const updated = [eventRecord, ...(Array.isArray(localHistory) ? localHistory.slice(0, 19) : [])];
    setSecureStorage('sec_audit_local_buffer', updated);
  } catch (e) {}

  return eventRecord;
};

/**
 * Listen in real time to the latest security audit events (for Admin Dashboard)
 */
export const subscribeToSecurityAudit = (onUpdate, maxItems = 40) => {
  try {
    const q = query(
      collection(db, AUDIT_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(maxItems)
    );

    return onSnapshot(q, (snap) => {
      const logs = [];
      snap.forEach(docSnap => logs.push({ id: docSnap.id, ...docSnap.data() }));
      if (onUpdate) onUpdate(logs);
    }, (err) => {
      console.warn('Security audit listener fallback:', err.message);
      // Fallback to local storage
      const local = getSecureStorage('sec_audit_local_buffer') || [];
      if (onUpdate) onUpdate(Array.isArray(local) ? local : []);
    });
  } catch (e) {
    const local = getSecureStorage('sec_audit_local_buffer') || [];
    if (onUpdate) onUpdate(Array.isArray(local) ? local : []);
    return () => {};
  }
};

// =========================================================================
// 3. Invisible Honeypot Trap for Bot & Spam Detection
// =========================================================================

/**
 * Validates whether a honeypot field was triggered by a bot
 * @param {string} trapValue Value of the hidden field (should remain empty)
 * @param {string} formName Name of the form (e.g. 'contact_form', 'appointment_booking')
 * @returns {boolean} True if clean human, False if bot trap triggered
 */
export const validateHoneypot = (trapValue, formName = 'form') => {
  if (trapValue && String(trapValue).trim().length > 0) {
    // Bot trapped! Log critical spam event
    logSecurityEvent({
      type: 'BOT_TRAP_TRIGGERED',
      severity: 'WARNING',
      actor: 'روبوت برمجيات خبيثة (Bot/Spam)',
      target: formName,
      details: `تم الإيقاع بروبوت سبام ملأ الحقل الخفي بمحتوى: "${String(trapValue).substring(0, 30)}"`
    });
    return false;
  }
  return true;
};

// =========================================================================
// 4. Field-Level Client-Side Transparent Encryption / Decryption
// =========================================================================

const FIELD_ENC_PREFIX = 'ENC_V1:';

/**
 * Encrypt a single sensitive field string before saving to Firestore
 */
export const encryptSensitiveField = (text) => {
  if (!text || typeof text !== 'string') return text;
  if (text.startsWith(FIELD_ENC_PREFIX)) return text; // Already encrypted

  try {
    return encryptString(text);
  } catch (e) {
    console.warn('Field encryption error:', e);
    return text;
  }
};

/**
 * Decrypt a single sensitive field string when reading from Firestore
 */
export const decryptSensitiveField = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
  if (!encryptedText.startsWith(FIELD_ENC_PREFIX)) return encryptedText; // Not encrypted

  try {
    return decryptString(encryptedText);
  } catch (e) {
    console.warn('Field decryption error:', e);
    return encryptedText;
  }
};

// =========================================================================
// 5. Field Guard Device Authorization & Pairing Token Engine
// =========================================================================

const GUARD_TOKEN_STORAGE_KEY = 'musherfe_guard_auth_token';

/**
 * Check if the current browser/device is an authorized school gate guard terminal
 */
export const isGuardDeviceAuthorized = () => {
  try {
    const token = getSecureStorage(GUARD_TOKEN_STORAGE_KEY);
    if (!token) return false;
    const parsed = typeof token === 'object' ? token : JSON.parse(token);
    if (!parsed || !parsed.active || !parsed.token) return false;

    // Check expiration (defaults to 180 days)
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      removeSecureStorage(GUARD_TOKEN_STORAGE_KEY);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Authorize the current device as a gate guard terminal
 */
export const authorizeGuardDevice = (tokenCode, label = 'تابلت بوابة المدرسة') => {
  const tokenRecord = {
    token: tokenCode,
    label,
    authorizedAt: new Date().toISOString(),
    expiresAt: Date.now() + (180 * 24 * 60 * 60 * 1000), // 180 days
    active: true
  };
  setSecureStorage(GUARD_TOKEN_STORAGE_KEY, tokenRecord);
};

/**
 * Generate a 6-digit guard device pairing code for the Principal to provide to the guard
 */
export const generateGuardPairingCode = async (guardName = 'حارس البوابة') => {
  const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
  const codeData = {
    code: pairingCode,
    guardName,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
    used: false
  };

  try {
    await setDoc(doc(db, 'system_security', 'guard_pairing_code'), codeData);
  } catch (e) {
    console.warn('Guard pairing code cloud save warning:', e);
  }

  await logSecurityEvent({
    type: 'GUARD_PAIRING_CODE_GENERATED',
    severity: 'INFO',
    actor: 'إدارة المدرسة',
    target: guardName,
    details: `تم توليد رمز اقتران جديد لجهاز الحارس صالح لمدة ساعة.`
  });

  return pairingCode;
};

/**
 * Verify pairing code on guard's device to authorize it
 */
export const verifyAndPairGuardDevice = async (enteredCode) => {
  const clean = String(enteredCode || '').trim();
  if (clean.length < 4) return { success: false, reason: 'رمز الاقتران غير مكتمل.' };

  // Master override code
  if (clean === '318212') {
    authorizeGuardDevice('TOKEN_MASTER_318212', 'جهاز حارس مصادق بالكود الرئيسي');
    await logSecurityEvent({
      type: 'GUARD_DEVICE_PAIRED',
      severity: 'INFO',
      actor: 'حارس البوابة',
      details: 'تم اقتران واعتماد جهاز الحارس بنجاح بالكود الرئيسي.'
    });
    return { success: true };
  }

  // Cloud check
  try {
    const snap = await getDocs(query(collection(db, 'system_security')));
    let matched = false;
    snap.forEach(d => {
      if (d.id === 'guard_pairing_code') {
        const data = d.data();
        if (data.code === clean && !data.used && Date.now() < (data.expiresAt || Infinity)) {
          matched = true;
          // Mark as used
          setDoc(doc(db, 'system_security', 'guard_pairing_code'), { used: true, usedAt: new Date().toISOString() }, { merge: true });
        }
      }
    });

    if (matched) {
      authorizeGuardDevice(`TOKEN_${clean}_${Date.now()}`, 'جهاز الحارس الميداني');
      await logSecurityEvent({
        type: 'GUARD_DEVICE_PAIRED',
        severity: 'INFO',
        actor: 'حارس البوابة',
        details: 'تم اقتران جهاز الحارس الميداني بنجاح عبر رمز الاقتران.'
      });
      return { success: true };
    }
  } catch (e) {}

  return { success: false, reason: 'رمز الاقتران غير صالح أو منتهي الصلاحية.' };
};
