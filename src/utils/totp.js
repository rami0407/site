/**
 * Standard RFC 6238 Time-Based One-Time Password (TOTP) Implementation
 * Uses Web Crypto API (SubtleCrypto) natively available in modern browsers.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generate a random Base32 secret key (16 characters = 80 bits)
 */
export const generateBase32Secret = (length = 16) => {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % BASE32_ALPHABET.length];
  }
  return secret;
};

/**
 * Decode Base32 string to Uint8Array
 */
export const base32Decode = (str) => {
  if (!str) return new Uint8Array(0);
  const cleaned = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (val !== -1) {
      bits += val.toString(2).padStart(5, '0');
    }
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return new Uint8Array(bytes);
};

/**
 * Generate an 8-byte big-endian Uint8Array counter from an integer
 */
const counterToBytes = (counter) => {
  const bytes = new Uint8Array(8);
  let temp = BigInt(counter);
  for (let i = 7; i >= 0; i--) {
    bytes[i] = Number(temp & BigInt(0xff));
    temp = temp >> BigInt(8);
  }
  return bytes;
};

/**
 * Compute HMAC-SHA1 using Web Crypto API
 */
const computeHmacSha1 = async (keyBytes, messageBytes) => {
  const cryptoObj = typeof window !== 'undefined' ? (window.crypto || window.msCrypto) : null;
  if (cryptoObj && cryptoObj.subtle) {
    const cryptoKey = await cryptoObj.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );
    const signature = await cryptoObj.subtle.sign('HMAC', cryptoKey, messageBytes);
    return new Uint8Array(signature);
  }
  throw new Error('Web Crypto API (crypto.subtle) is required for TOTP.');
};

/**
 * Generate 6-digit TOTP code for a secret at a specific time step
 */
export const generateTOTPCode = async (secret, stepOffset = 0, timeStep = 30) => {
  try {
    const counter = Math.floor(Date.now() / 1000 / timeStep) + stepOffset;
    const keyBytes = base32Decode(secret);
    const messageBytes = counterToBytes(counter);
    const hmac = await computeHmacSha1(keyBytes, messageBytes);

    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const code = (binary % 1000000).toString().padStart(6, '0');
    return code;
  } catch (err) {
    console.error('Error generating TOTP:', err);
    return null;
  }
};

/**
 * Verify a 6-digit code with window tolerance (±1 step = ±30 seconds)
 */
export const verifyTOTPCode = async (secret, inputCode, windowSteps = 1, timeStep = 30) => {
  if (!secret || !inputCode) return false;
  const cleanCode = inputCode.toString().trim();
  if (cleanCode.length !== 6) return false;

  for (let offset = -windowSteps; offset <= windowSteps; offset++) {
    const validCode = await generateTOTPCode(secret, offset, timeStep);
    if (validCode === cleanCode) {
      return true;
    }
  }
  return false;
};

/**
 * Generate standard otpauth:// URL for Google Authenticator / Microsoft Authenticator
 */
export const getOtpAuthUrl = (secret, teacherName, issuer = 'مدرسة مشيرفة الابتدائية') => {
  const cleanName = encodeURIComponent(teacherName || 'مربي');
  const cleanIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${cleanIssuer}:${cleanName}?secret=${secret}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`;
};

/**
 * Generate QR Code Image URL (Using high-availability public QR generator)
 */
export const getQrCodeUrl = (otpauthUrl, size = 200) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(otpauthUrl)}&margin=10`;
};
