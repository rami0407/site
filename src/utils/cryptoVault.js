/**
 * Musheirifa School - Advanced Data Protection & Encryption Engine
 * Implements:
 * 1. AES-256-GCM with PBKDF2 for military-grade file and backup encryption/decryption.
 * 2. Transparent encrypted storage for LocalStorage & SessionStorage.
 * 3. HMAC-SHA256 digital tamper-proof signatures for documents and student permits.
 */

// Application entropy seed for transparent client storage encryption
const APP_STORAGE_ENTROPY = 'MusherfeSchool_SecKey_2026_@v9!xQ7';
const STORAGE_ENC_PREFIX = 'ENC_V1:';

/* =========================================================================
   1. Military-Grade AES-256-GCM Password Encryption (For Exports & Backups)
   ========================================================================= */

const getSubtleCrypto = () => {
  const cryptoObj = typeof window !== 'undefined' ? (window.crypto || window.msCrypto) : null;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API (crypto.subtle) is required for encryption operations.');
  }
  return cryptoObj;
};

/**
 * Derives an AES-256-GCM key from a user password and salt using PBKDF2 (100,000 iterations).
 */
const deriveKeyFromPassword = async (password, salt, subtle) => {
  const enc = new TextEncoder();
  const passwordKey = await subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypt arbitrary data (object or string) with a password using AES-256-GCM.
 * Returns a JSON-serializable encrypted package with salt, IV, and ciphertext in Base64.
 */
export const encryptDataWithPassword = async (data, password) => {
  if (!data) throw new Error('لا توجد بيانات للتشفير');
  if (!password || password.length < 4) {
    throw new Error('يجب أن تتكون كلمة مرور التشفير من 4 أحرف أو أرقام على الأقل');
  }

  const subtle = getSubtleCrypto().subtle;
  const rawString = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const enc = new TextEncoder();
  const plaintextBytes = enc.encode(rawString);

  // Generate cryptographic salt (16 bytes) and IV (12 bytes for AES-GCM)
  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(salt);
  window.crypto.getRandomValues(iv);

  const aesKey = await deriveKeyFromPassword(password, salt, subtle);
  const ciphertextBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    aesKey,
    plaintextBytes
  );

  // Helper: buffer to Base64
  const bytesToBase64 = (bytes) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const payload = {
    header: 'MUSHERFE_SECURE_ENCRYPTED_V1',
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: 100000,
    timestamp: new Date().toISOString(),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer))
  };

  return payload;
};

/**
 * Decrypt an encrypted package created by encryptDataWithPassword.
 * Returns the parsed JSON or plain string.
 */
export const decryptDataWithPassword = async (encryptedPayload, password) => {
  if (!encryptedPayload) throw new Error('ملف التشفير غير صالح أو فارغ');
  if (!password) throw new Error('يرجى إدخال كلمة المرور لفك التشفير');

  let pkg = encryptedPayload;
  if (typeof encryptedPayload === 'string') {
    try {
      pkg = JSON.parse(encryptedPayload);
    } catch {
      throw new Error('صيغة ملف التشفير غير صالحة.');
    }
  }

  if (pkg.header !== 'MUSHERFE_SECURE_ENCRYPTED_V1') {
    throw new Error('هذا الملف غير متوافق مع نظام تشفير المدرسة المعتمد.');
  }

  const subtle = getSubtleCrypto().subtle;

  // Helper: Base64 to Uint8Array
  const base64ToBytes = (base64) => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const salt = base64ToBytes(pkg.salt);
  const iv = base64ToBytes(pkg.iv);
  const ciphertext = base64ToBytes(pkg.ciphertext);

  try {
    const aesKey = await deriveKeyFromPassword(password, salt, subtle);
    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      aesKey,
      ciphertext
    );

    const dec = new TextDecoder();
    const decryptedStr = dec.decode(decryptedBuffer);

    try {
      return JSON.parse(decryptedStr);
    } catch {
      return decryptedStr;
    }
  } catch {
    throw new Error('كلمة المرور غير صحيحة! لم نتمكن من فك تشفير البيانات.');
  }
};

/* =========================================================================
   2. Client-Side Transparent Encrypted LocalStorage
   ========================================================================= */

/**
 * Obfuscate/encrypt string value synchronously using keyed stream entropy
 */
const transformString = (text, key) => {
  let output = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    // Bitwise XOR shift
    output += String.fromCharCode(charCode ^ keyChar);
  }
  return output;
};

/**
 * Encrypt arbitrary string with transparent prefix
 */
export const encryptString = (text, key = APP_STORAGE_ENTROPY) => {
  if (!text) return text;
  try {
    const encoded = encodeURIComponent(String(text));
    const cipher = transformString(encoded, key);
    return `${STORAGE_ENC_PREFIX}${window.btoa(cipher)}`;
  } catch (e) {
    return text;
  }
};

/**
 * Decrypt string encrypted with transparent prefix
 */
export const decryptString = (encryptedText, key = APP_STORAGE_ENTROPY) => {
  if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.startsWith(STORAGE_ENC_PREFIX)) {
    return encryptedText;
  }
  try {
    const b64 = encryptedText.substring(STORAGE_ENC_PREFIX.length);
    const cipher = window.atob(b64);
    const decoded = transformString(cipher, key);
    return decodeURIComponent(decoded);
  } catch (e) {
    return encryptedText;
  }
};

/**
 * Save an item to LocalStorage encrypted
 */
export const setSecureStorage = (key, value) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key);
      return;
    }
    const raw = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const encoded = encodeURIComponent(raw);
    const cipher = transformString(encoded, APP_STORAGE_ENTROPY + key);
    const b64 = window.btoa(cipher);
    window.localStorage.setItem(key, `${STORAGE_ENC_PREFIX}${b64}`);
  } catch (e) {
    console.warn(`[SecureStorage] Error setting ${key}:`, e);
    // Fallback
    window.localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }
};

/**
 * Retrieve an encrypted item from LocalStorage (with seamless backward compatibility for unencrypted keys)
 */
export const getSecureStorage = (key, defaultValue = null) => {
  if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue;

    // Check if encrypted
    if (raw.startsWith(STORAGE_ENC_PREFIX)) {
      const b64 = raw.substring(STORAGE_ENC_PREFIX.length);
      const cipher = window.atob(b64);
      const decoded = transformString(cipher, APP_STORAGE_ENTROPY + key);
      const finalStr = decodeURIComponent(decoded);
      try {
        return JSON.parse(finalStr);
      } catch {
        return finalStr;
      }
    }

    // Backward compatibility: If legacy unencrypted value exists, upgrade it automatically!
    try {
      const parsed = JSON.parse(raw);
      setSecureStorage(key, parsed);
      return parsed;
    } catch {
      setSecureStorage(key, raw);
      return raw;
    }
  } catch (e) {
    console.warn(`[SecureStorage] Error getting ${key}:`, e);
    return defaultValue;
  }
};

/**
 * Remove an item from LocalStorage
 */
export const removeSecureStorage = (key) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem(key);
};

/* =========================================================================
   3. Digital Integrity Signature (HMAC-SHA256) for Permits & Records
   ========================================================================= */

const SIGN_SECRET = 'Musherfe_Permit_Digital_Signature_Secret_2026';

/**
 * Generate a cryptographically secure digital signature for an object (e.g. dismissal record)
 */
export const generateDataSignature = async (data) => {
  try {
    const subtle = getSubtleCrypto().subtle;
    const enc = new TextEncoder();
    const keyData = enc.encode(SIGN_SECRET);

    // Canonical representation of critical fields
    const payloadStr = typeof data === 'object' 
      ? `${data.studentId || ''}|${data.studentName || ''}|${data.teacherId || ''}|${data.date || ''}|${data.time || ''}|${data.escortName || ''}`
      : String(data);

    const cryptoKey = await subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      false,
      ['sign']
    );

    const signature = await subtle.sign('HMAC', cryptoKey, enc.encode(payloadStr));
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  } catch (err) {
    console.error('Signature generation error:', err);
    return 'SIG_LOCAL_FALLBACK_' + Math.random().toString(36).substring(2, 10);
  }
};

/**
 * Verify if a record's digital signature matches its contents
 */
export const verifyDataSignature = async (data, signature) => {
  if (!signature) return false;
  try {
    const expected = await generateDataSignature(data);
    return expected === signature;
  } catch {
    return false;
  }
};
